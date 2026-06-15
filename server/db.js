import pg from 'pg';

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export async function initNewTables() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(`
            ALTER TABLE users
                ADD COLUMN IF NOT EXISTS phone TEXT,
                ADD COLUMN IF NOT EXISTS city TEXT,
                ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'PK',
                ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS zone_id UUID
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS wallets (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
                currency TEXT NOT NULL DEFAULT 'PKR',
                is_frozen BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, currency)
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS wallet_transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                wallet_id UUID NOT NULL REFERENCES wallets(id),
                user_id UUID NOT NULL REFERENCES users(id),
                type TEXT NOT NULL CHECK (type IN ('credit','debit','hold','release','fee','refund','payout')),
                amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
                balance_before NUMERIC(12,2) NOT NULL,
                balance_after NUMERIC(12,2) NOT NULL,
                reference_type TEXT,
                reference_id UUID,
                description TEXT,
                status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','reversed')),
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_wallet_txn_user ON wallet_transactions(user_id, created_at DESC)
        `);

        await client.query(`
            CREATE OR REPLACE FUNCTION wallet_mutate(
                p_user_id UUID,
                p_type TEXT,
                p_amount NUMERIC,
                p_ref_type TEXT DEFAULT NULL,
                p_ref_id UUID DEFAULT NULL,
                p_description TEXT DEFAULT NULL
            ) RETURNS wallet_transactions AS $$
            DECLARE
                v_wallet wallets;
                v_new_balance NUMERIC;
                v_txn wallet_transactions;
            BEGIN
                SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
                END IF;
                IF v_wallet.is_frozen THEN
                    RAISE EXCEPTION 'Wallet is frozen';
                END IF;
                IF p_type IN ('debit','hold','fee') THEN
                    IF v_wallet.balance < p_amount THEN
                        RAISE EXCEPTION 'Insufficient balance';
                    END IF;
                    v_new_balance := v_wallet.balance - p_amount;
                ELSE
                    v_new_balance := v_wallet.balance + p_amount;
                END IF;
                UPDATE wallets SET balance = v_new_balance, updated_at = NOW() WHERE id = v_wallet.id;
                INSERT INTO wallet_transactions(wallet_id, user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description)
                VALUES (v_wallet.id, p_user_id, p_type, p_amount, v_wallet.balance, v_new_balance, p_ref_type, p_ref_id, p_description)
                RETURNING * INTO v_txn;
                RETURN v_txn;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS bnpl_agreements (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id),
                booking_id UUID,
                total_amount NUMERIC(12,2) NOT NULL,
                installments INT NOT NULL DEFAULT 3,
                installment_amount NUMERIC(12,2) NOT NULL,
                paid_installments INT NOT NULL DEFAULT 0,
                next_due_date DATE NOT NULL,
                status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','defaulted','cancelled')),
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS provider_trust_scores (
                provider_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                score NUMERIC(5,2) NOT NULL DEFAULT 0,
                tier TEXT NOT NULL DEFAULT 'new' CHECK (tier IN ('champion','trusted','verified','rising','new')),
                completion_rate NUMERIC(5,2),
                avg_rating NUMERIC(3,2),
                total_completed INT DEFAULT 0,
                dispute_free_streak INT DEFAULT 0,
                response_time_hours NUMERIC(6,2),
                vouches_count INT DEFAULT 0,
                last_computed_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS loyalty_ledger (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id),
                coins BIGINT NOT NULL,
                reason TEXT NOT NULL,
                reference_type TEXT,
                reference_id UUID,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_user ON loyalty_ledger(user_id, created_at DESC)
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS audit_log (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                actor_id UUID REFERENCES users(id),
                action TEXT NOT NULL,
                entity TEXT NOT NULL,
                entity_id UUID,
                payload JSONB,
                ip_address TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id, created_at DESC)
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                data JSONB,
                read BOOLEAN DEFAULT FALSE,
                sent_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC)
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS provider_vouches (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                provider_id UUID NOT NULL REFERENCES users(id),
                voucher_id UUID NOT NULL REFERENCES users(id),
                zone_id UUID,
                message TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(provider_id, voucher_id)
            )
        `);

        await client.query('COMMIT');

        await pool.query(`
            CREATE OR REPLACE FUNCTION recompute_trust_score(p_provider_id UUID) RETURNS VOID AS $$
            DECLARE
                v_completed INT := 0;
                v_total INT := 0;
                v_avg_rating NUMERIC := 0;
                v_vouches INT := 0;
                v_score NUMERIC;
                v_tier TEXT;
                v_completion_rate NUMERIC := 0;
                v_has_avatar BOOLEAN := FALSE;
            BEGIN
                SELECT
                    COUNT(*) FILTER (WHERE status = 'completed'),
                    COUNT(*)
                INTO v_completed, v_total
                FROM bookings WHERE provider_id = p_provider_id::TEXT;

                IF v_total > 0 THEN
                    v_completion_rate := v_completed::NUMERIC / v_total::NUMERIC;
                END IF;

                SELECT COALESCE(AVG(rating), 0) INTO v_avg_rating
                FROM reviews WHERE provider_id = p_provider_id::TEXT;

                SELECT COUNT(*) INTO v_vouches
                FROM provider_vouches WHERE provider_id = p_provider_id;

                SELECT avatar_url IS NOT NULL INTO v_has_avatar
                FROM users WHERE id = p_provider_id;

                v_score := LEAST(100,
                    (v_completion_rate * 40) +
                    ((v_avg_rating / 5.0) * 25) +
                    (LEAST(v_completed, 100) / 100.0 * 15) +
                    (CASE WHEN v_has_avatar THEN 10 ELSE 0 END) +
                    (LEAST(v_vouches, 5) * 2)
                );

                v_tier := CASE
                    WHEN v_score >= 90 THEN 'champion'
                    WHEN v_score >= 78 THEN 'trusted'
                    WHEN v_score >= 62 THEN 'verified'
                    WHEN v_score >= 45 THEN 'rising'
                    ELSE 'new'
                END;

                INSERT INTO provider_trust_scores(provider_id, score, tier, completion_rate, avg_rating, total_completed)
                VALUES (p_provider_id, v_score, v_tier, v_completion_rate, v_avg_rating, v_completed)
                ON CONFLICT (provider_id) DO UPDATE SET
                    score = EXCLUDED.score,
                    tier = EXCLUDED.tier,
                    completion_rate = EXCLUDED.completion_rate,
                    avg_rating = EXCLUDED.avg_rating,
                    total_completed = EXCLUDED.total_completed,
                    last_computed_at = NOW();
            END;
            $$ LANGUAGE plpgsql;
        `);

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

export async function writeAuditLog({ actorId, action, entity, entityId, payload, ipAddress }) {
    try {
        await pool.query(
            `INSERT INTO audit_log(actor_id, action, entity, entity_id, payload, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [actorId || null, action, entity, entityId || null, payload ? JSON.stringify(payload) : null, ipAddress || null]
        );
    } catch (_) {}
}

export async function createNotification({ userId, type, title, body, data }) {
    try {
        const { rows } = await pool.query(
            `INSERT INTO notifications(user_id, type, title, body, data, sent_at)
             VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
            [userId, type, title, body, data ? JSON.stringify(data) : null]
        );
        return rows[0];
    } catch (_) { return null; }
}

export async function ensureWallet(userId) {
    await pool.query(
        `INSERT INTO wallets(user_id) VALUES ($1) ON CONFLICT (user_id, currency) DO NOTHING`,
        [userId]
    );
}

export async function initNeighborhoodTables() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                thread_key TEXT NOT NULL,
                content TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text','image','voice','location')),
                read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_chat_thread ON chat_messages(thread_key, created_at DESC)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_chat_receiver ON chat_messages(receiver_id, read)`);

        await client.query(`
            CREATE TABLE IF NOT EXISTS ride_shares (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                zone_id UUID,
                type TEXT NOT NULL DEFAULT 'carpool' CHECK (type IN ('carpool','delivery','moving','car_rental')),
                from_location TEXT NOT NULL,
                to_location TEXT NOT NULL,
                departure_at TIMESTAMPTZ,
                seats_total INT NOT NULL DEFAULT 1,
                seats_available INT NOT NULL DEFAULT 1,
                price_pkr NUMERIC(10,2) NOT NULL DEFAULT 0,
                vehicle TEXT,
                notes TEXT,
                contact_phone TEXT,
                recurring BOOLEAN DEFAULT FALSE,
                status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','full','completed','cancelled')),
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS ride_passengers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                ride_id UUID NOT NULL REFERENCES ride_shares(id) ON DELETE CASCADE,
                passenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
                joined_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(ride_id, passenger_id)
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS committees (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                description TEXT,
                organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                zone_id UUID,
                monthly_amount_pkr NUMERIC(12,2) NOT NULL,
                member_limit INT NOT NULL DEFAULT 12,
                total_rounds INT NOT NULL DEFAULT 12,
                current_round INT NOT NULL DEFAULT 0,
                payout_day INT NOT NULL DEFAULT 1 CHECK (payout_day BETWEEN 1 AND 28),
                status TEXT NOT NULL DEFAULT 'recruiting' CHECK (status IN ('recruiting','active','completed','cancelled')),
                next_payout_at DATE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS committee_members (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                payout_position INT,
                contributed_rounds INT NOT NULL DEFAULT 0,
                has_received_payout BOOLEAN DEFAULT FALSE,
                joined_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(committee_id, user_id)
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS committee_contributions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                committee_id UUID NOT NULL REFERENCES committees(id),
                member_id UUID NOT NULL REFERENCES users(id),
                round_number INT NOT NULL,
                amount_pkr NUMERIC(12,2) NOT NULL,
                paid_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS marketplace_listings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                zone_id UUID,
                title TEXT NOT NULL,
                description TEXT,
                price_pkr NUMERIC(12,2) NOT NULL,
                category TEXT NOT NULL DEFAULT 'other',
                condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('new','like_new','good','fair','for_parts')),
                images TEXT[] DEFAULT '{}',
                negotiable BOOLEAN DEFAULT TRUE,
                status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold','reserved','removed')),
                views INT DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_marketplace_zone ON marketplace_listings(zone_id, status, created_at DESC)`);
        await client.query(`
            CREATE TABLE IF NOT EXISTS marketplace_orders (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                listing_id UUID NOT NULL REFERENCES marketplace_listings(id),
                buyer_id UUID NOT NULL REFERENCES users(id),
                seller_id UUID NOT NULL REFERENCES users(id),
                amount_pkr NUMERIC(12,2) NOT NULL,
                message TEXT,
                status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS blood_donors (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                zone_id UUID,
                blood_type TEXT NOT NULL CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
                available BOOLEAN DEFAULT TRUE,
                last_donation_at DATE,
                contact_phone TEXT,
                notes TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id)
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS blood_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                zone_id UUID,
                blood_type TEXT NOT NULL,
                urgency TEXT NOT NULL DEFAULT 'urgent' CHECK (urgency IN ('emergency','urgent','planned')),
                hospital TEXT,
                notes TEXT,
                units_needed INT DEFAULT 1,
                fulfilled BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS notice_board (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                zone_id UUID,
                type TEXT NOT NULL CHECK (type IN ('lost','found','sell','free','room','job','announcement','other')),
                title TEXT NOT NULL,
                body TEXT,
                price_pkr NUMERIC(12,2),
                contact_phone TEXT,
                images TEXT[] DEFAULT '{}',
                active BOOLEAN DEFAULT TRUE,
                expires_at DATE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS tool_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                zone_id UUID,
                name TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'general',
                description TEXT,
                deposit_pkr NUMERIC(10,2) DEFAULT 0,
                available BOOLEAN DEFAULT TRUE,
                images TEXT[] DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS tool_loans (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                item_id UUID NOT NULL REFERENCES tool_items(id) ON DELETE CASCADE,
                borrower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                return_by DATE NOT NULL,
                returned_at TIMESTAMPTZ,
                status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','returned','overdue','cancelled')),
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS job_posts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                poster_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                zone_id UUID,
                title TEXT NOT NULL,
                description TEXT,
                category TEXT NOT NULL DEFAULT 'general',
                wage_pkr NUMERIC(10,2),
                duration TEXT,
                job_type TEXT NOT NULL DEFAULT 'gig' CHECK (job_type IN ('gig','part_time','full_time','apprenticeship','volunteer')),
                status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','filled','cancelled')),
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS job_applications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                job_id UUID NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
                applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                message TEXT,
                status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','shortlisted','hired','rejected')),
                applied_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(job_id, applicant_id)
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS food_shares (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                zone_id UUID,
                title TEXT NOT NULL,
                description TEXT,
                quantity TEXT NOT NULL,
                is_free BOOLEAN DEFAULT TRUE,
                price_pkr NUMERIC(10,2) DEFAULT 0,
                available_until TIMESTAMPTZ,
                claimed_by UUID REFERENCES users(id),
                claimed_at TIMESTAMPTZ,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS watch_reports (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
                zone_id UUID,
                type TEXT NOT NULL CHECK (type IN ('theft','suspicious','hazard','infrastructure','noise','other')),
                title TEXT NOT NULL,
                description TEXT,
                location_text TEXT,
                anonymous BOOLEAN DEFAULT FALSE,
                upvotes INT DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','dismissed')),
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS local_businesses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                zone_id UUID,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT,
                address TEXT,
                phone TEXT,
                hours TEXT,
                payment_methods TEXT[] DEFAULT '{"cash"}',
                verified BOOLEAN DEFAULT FALSE,
                rating_avg NUMERIC(3,2) DEFAULT 0,
                rating_count INT DEFAULT 0,
                open_now BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS event_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                zone_id UUID,
                title TEXT NOT NULL,
                description TEXT,
                category TEXT DEFAULT 'community',
                proposed_date DATE,
                venue TEXT,
                expected_attendees INT DEFAULT 50,
                status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
                admin_notes TEXT,
                approved_event_id UUID,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS religious_events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                zone_id UUID,
                type TEXT NOT NULL CHECK (type IN ('prayer','ramzan','eid','funeral','nikah','aqeeqa','other')),
                title TEXT NOT NULL,
                description TEXT,
                event_date TIMESTAMPTZ,
                location TEXT,
                open_to_all BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS load_shedding_reports (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
                zone_id UUID,
                area_name TEXT,
                started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                restored_at TIMESTAMPTZ,
                duration_hours NUMERIC(5,2),
                notes TEXT,
                upvotes INT DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query('COMMIT');
        console.log('Neighborhood tables initialized');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('initNeighborhoodTables error:', err.message);
        throw err;
    } finally {
        client.release();
    }
}

export async function initExtendedTables() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(`
            CREATE TABLE IF NOT EXISTS skill_verifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                category TEXT NOT NULL,
                verified_count INT NOT NULL DEFAULT 0,
                last_active_at TIMESTAMPTZ,
                first_verified_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(provider_id, category)
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS income_snapshots (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                period TEXT NOT NULL CHECK (period IN ('30d','90d','365d')),
                amount_pkr NUMERIC(14,2) NOT NULL DEFAULT 0,
                transaction_count INT NOT NULL DEFAULT 0,
                computed_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, period)
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS demand_forecasts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                zone_id TEXT NOT NULL,
                area TEXT NOT NULL DEFAULT 'your area',
                category TEXT NOT NULL,
                forecast_hour TIMESTAMPTZ NOT NULL,
                demand_index INT NOT NULL DEFAULT 50 CHECK (demand_index BETWEEN 0 AND 100),
                estimated_price_pkr NUMERIC(10,2),
                supply_shortfall BOOLEAN DEFAULT FALSE,
                living_wage_floor_pkr NUMERIC(10,2) DEFAULT 800,
                generated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(zone_id, category, forecast_hour)
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_demand_forecasts_zone_time
            ON demand_forecasts(zone_id, forecast_hour)
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS idle_slots (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                starts_at TIMESTAMPTZ NOT NULL,
                ends_at TIMESTAMPTZ NOT NULL,
                categories TEXT[] NOT NULL DEFAULT '{}',
                zone_id TEXT,
                status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','matched','expired','cancelled')),
                matched_micro_job_id UUID,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS micro_jobs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                zone_id TEXT NOT NULL,
                area TEXT NOT NULL DEFAULT 'your area',
                category TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                estimated_duration_hours NUMERIC(4,1) NOT NULL DEFAULT 1,
                price_pkr NUMERIC(10,2) NOT NULL,
                status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','assigned','completed','cancelled')),
                provider_id UUID REFERENCES users(id),
                customer_id UUID REFERENCES users(id),
                scheduled_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS care_bridge_orders (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                recipient_name TEXT NOT NULL,
                recipient_phone TEXT NOT NULL,
                recipient_city TEXT NOT NULL DEFAULT 'Hyderabad',
                recipient_country TEXT NOT NULL DEFAULT 'PK',
                services JSONB NOT NULL DEFAULT '[]',
                notes TEXT,
                total_pkr NUMERIC(12,2) NOT NULL,
                currency_sent TEXT NOT NULL DEFAULT 'EUR',
                amount_sent NUMERIC(12,4) NOT NULL,
                exchange_rate NUMERIC(10,4) NOT NULL DEFAULT 310,
                status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','scheduled','in_progress','completed','proof_sent','cancelled')),
                proof_photo_url TEXT,
                proof_notes TEXT,
                proof_submitted_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_care_bridge_sender ON care_bridge_orders(sender_id, created_at DESC)
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS service_bundles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                zone_id UUID,
                title TEXT NOT NULL,
                description TEXT,
                category_slug TEXT NOT NULL DEFAULT 'other',
                service_name TEXT,
                zone_name TEXT,
                address_hint TEXT,
                max_participants INT NOT NULL DEFAULT 5,
                current_participants INT NOT NULL DEFAULT 1,
                discount_percentage INT NOT NULL DEFAULT 20,
                base_price NUMERIC(12,2),
                discounted_price NUMERIC(12,2),
                status TEXT NOT NULL DEFAULT 'forming' CHECK (status IN ('forming','confirmed','active','completed','cancelled')),
                scheduled_date DATE,
                deadline_date DATE,
                organizer_email TEXT,
                participant_emails TEXT[] DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS bundle_participants (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                bundle_id UUID NOT NULL REFERENCES service_bundles(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                joined_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(bundle_id, user_id)
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS savings_goals (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                target_pkr NUMERIC(12,2) NOT NULL,
                saved_pkr NUMERIC(12,2) NOT NULL DEFAULT 0,
                deadline DATE,
                category TEXT,
                simon_routing_active BOOLEAN DEFAULT TRUE,
                status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','paused','cancelled')),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}
