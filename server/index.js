import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import * as simon from './simon.js';
import { initNewTables, initExtendedTables, initNeighborhoodTables, writeAuditLog, createNotification } from './db.js';
import financialRouter from './financial.js';
import notificationsRouter, { broadcastNotification } from './notifications-routes.js';
import { buildCredential, verifyCredential, recordSkillActivity, refreshIncomeSnapshots } from './identity.js';
import zoneRouter from './zone-economy.js';
import careBridgeRouter from './care-bridge.js';
import chatRouter from './chat.js';
import committeeRouter from './committee.js';
import marketplaceRouter from './marketplace.js';
import neighborhoodExtRouter from './neighborhood-ext.js';
import walletRouter from './wallet.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set('trust proxy', 1);
const PORT = 5000;
const isProd = process.env.NODE_ENV === 'production';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const PgSession = connectPgSimple(session);

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=(self)');
    next();
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });
const simonLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

app.use('/api/auth', authLimiter);
app.use('/api/simon', simonLimiter);
app.use('/api', apiLimiter);

app.use(session({
    store: new PgSession({ pool, tableName: 'session', createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProd,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },
}));

async function initDb() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT,
                role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'provider', 'admin')),
                avatar_url TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        await initNewTables();
        await initExtendedTables();
        await initNeighborhoodTables();
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS neighborhood_zones (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    area TEXT,
                    city TEXT,
                    country TEXT DEFAULT 'PK',
                    health_score INTEGER DEFAULT 70,
                    demand_index INTEGER DEFAULT 60,
                    active_providers INTEGER DEFAULT 0,
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            const { rows: zc } = await pool.query(`SELECT COUNT(*) FROM neighborhood_zones`);
            if (parseInt(zc[0].count) === 0) {
                await pool.query(`
                    INSERT INTO neighborhood_zones (id, name, area, city, health_score, demand_index, active_providers)
                    VALUES
                        ('hyderabad-main', 'Hyderabad Central', 'Latifabad', 'Hyderabad', 78, 72, 45),
                        ('karachi-gulshan', 'Karachi Gulshan', 'Gulshan-e-Iqbal', 'Karachi', 85, 81, 120),
                        ('lahore-gulberg', 'Lahore Gulberg', 'Gulberg III', 'Lahore', 82, 77, 95)
                    ON CONFLICT (id) DO NOTHING
                `);
                console.log('Seed: 3 neighborhood zones added');
            }
        } catch (e) {
            console.warn('Zone seed skipped:', e.message);
        }
        console.log('Database ready');
    } catch (err) {
        console.error('DB init error:', err.message);
    }
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
    const [salt, hash] = stored.split(':');
    const hashBuf = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(hashBuf, Buffer.from(hash, 'hex'));
}

function requireAuth(req, res, next) {
    if (!req.session?.user) return res.status(401).json({ error: 'Not authenticated' });
    next();
}

app.get('/api/auth/user', (req, res) => {
    if (req.session?.user) return res.json({ user: req.session.user });
    return res.json({ user: null });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        const user = rows[0];
        if (!user || !verifyPassword(password, user.password_hash)) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const sessionUser = { id: user.id, email: user.email, full_name: user.full_name, role: user.role, avatar_url: user.avatar_url };
        req.session.user = sessionUser;
        res.json({ user: sessionUser });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    const { email, password, fullName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    try {
        const hash = hashPassword(password);
        const { rows } = await pool.query(
            'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, role, avatar_url',
            [email.toLowerCase(), hash, fullName || null]
        );
        res.json({ user: rows[0] });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'An account with this email already exists' });
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Signup failed' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
});

app.post('/api/ai/chat', async (req, res) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return res.status(503).json({ error: 'AI service not configured. Please add OPENROUTER_API_KEY to secrets.' });
    }
    const { messages, systemPrompt, temperature = 0.7, maxTokens = 2000 } = req.body;
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'HTTP-Referer': 'https://truvornex.com', 'X-Title': 'Truvornex' },
            body: JSON.stringify({
                model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
                messages: [
                    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                    ...messages,
                ],
                stream: false,
                temperature,
                max_tokens: maxTokens,
            }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return res.status(response.status).json({ error: err.error?.message || `AI API error ${response.status}` });
        }
        const data = await response.json();
        res.json({ content: data.choices?.[0]?.message?.content || '' });
    } catch (err) {
        console.error('AI proxy error:', err);
        res.status(500).json({ error: 'Failed to reach AI service' });
    }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/financial', requireAuth, financialRouter);
app.use('/api/notifications', requireAuth, notificationsRouter);
app.use('/api/zones', zoneRouter);
app.use('/api/chat', requireAuth, chatRouter);
app.use('/api/wallet', requireAuth, walletRouter);
app.use('/api/committees', requireAuth, committeeRouter);
app.use('/api/marketplace', requireAuth, marketplaceRouter);
app.use('/api/neighborhood', requireAuth, neighborhoodExtRouter);
app.get('/api/care-bridge/meta/rates', (req, res) => {
    res.json({
        base_currency: 'PKR',
        rates: { EUR: 310, USD: 278, GBP: 355, AED: 75, CAD: 205, AUD: 182 },
        note: 'Reference rates. Actual rates locked at order placement.',
        updated_at: new Date().toISOString(),
    });
});
app.use('/api/care-bridge', requireAuth, careBridgeRouter);

/* ── Economic Identity Protocol (TIP-v1) ────────────────────────────────── */

app.get('/api/identity/me', requireAuth, async (req, res) => {
    try {
        const credential = await buildCredential(req.session.user.id);
        if (!credential) return res.status(404).json({ error: 'Identity not found or user is not a provider' });
        res.json({ credential });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/identity/me/verify', requireAuth, async (req, res) => {
    try {
        const credential = await buildCredential(req.session.user.id);
        if (!credential) return res.status(404).json({ error: 'Not found' });
        res.json(verifyCredential(credential));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/identity/:userId', async (req, res) => {
    try {
        const credential = await buildCredential(req.params.userId);
        if (!credential) return res.status(404).json({ error: 'Provider identity not found' });
        const { credential_hash, ...publicFields } = credential;
        res.json({ credential: { ...publicFields, verification_endpoint: `/api/identity/${req.params.userId}/verify` } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/identity/:userId/verify', async (req, res) => {
    try {
        const credential = await buildCredential(req.params.userId);
        if (!credential) return res.status(404).json({ valid: false, reason: 'not_found' });
        res.json(verifyCredential(credential));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/identity/skill-activity', requireAuth, async (req, res) => {
    const { category } = req.body;
    if (!category) return res.status(400).json({ error: 'category required' });
    try {
        await recordSkillActivity(req.session.user.id, category);
        await refreshIncomeSnapshots(req.session.user.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── Neighborhood / Community API routes ─────────────────────── */

app.get('/api/emergency-requests', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM emergency_requests WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 10',
            [req.session.user.id]
        );
        res.json({ data: rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/emergency-requests', requireAuth, async (req, res) => {
    const { category, urgency, description, lat, lng, zone_id } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO emergency_requests (customer_id, zone_id, category, urgency, description, lat, lng) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [req.session.user.id, zone_id || null, category, urgency || 'immediate', description, lat || null, lng || null]
        );
        res.json({ data: rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/emergency-requests/:id', requireAuth, async (req, res) => {
    const { status } = req.body;
    try {
        await pool.query(
            'UPDATE emergency_requests SET status=$1, updated_at=NOW() WHERE id=$2 AND customer_id=$3',
            [status, req.params.id, req.session.user.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/group-buys', async (req, res) => {
    try {
        const { rows } = await pool.query(
            "SELECT * FROM group_buys WHERE status IN ('open','locked') ORDER BY created_at DESC LIMIT 30"
        );
        res.json({ data: rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/group-buy-participants/my', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT group_buy_id FROM group_buy_participants WHERE user_id = $1',
            [req.session.user.id]
        );
        res.json({ data: rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/group-buys', requireAuth, async (req, res) => {
    const { zone_id, service_category, description, target_participants, discount_percent, expires_at } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO group_buys (zone_id, service_category, description, initiator_id, target_participants, discount_percent, expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [zone_id || null, service_category, description || null, req.session.user.id, target_participants || 5, discount_percent || 10, expires_at || null]
        );
        await pool.query('INSERT INTO group_buy_participants (group_buy_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [rows[0].id, req.session.user.id]);
        res.json({ data: rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/group-buys/:id/join', requireAuth, async (req, res) => {
    try {
        await pool.query('INSERT INTO group_buy_participants (group_buy_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, req.session.user.id]);
        const { rows } = await pool.query('SELECT current_participants FROM group_buys WHERE id=$1', [req.params.id]);
        const newCount = (rows[0]?.current_participants || 0) + 1;
        await pool.query('UPDATE group_buys SET current_participants=$1, updated_at=NOW() WHERE id=$2', [newCount, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ═══════════════════════════════════════
   SERVICE BUNDLES
═══════════════════════════════════════ */
app.get('/api/bundles', async (req, res) => {
    const { status } = req.query;
    try {
        const conditions = [];
        const params = [];
        let pi = 1;
        if (status && status !== 'all') { conditions.push(`status = $${pi++}`); params.push(status); }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const { rows } = await pool.query(
            `SELECT sb.*, u.full_name AS organizer_name, u.email AS organizer_email
             FROM service_bundles sb JOIN users u ON u.id = sb.organizer_id
             ${where} ORDER BY sb.created_at DESC LIMIT 50`,
            params
        );
        res.json({ bundles: rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bundles', requireAuth, async (req, res) => {
    const userId = req.session.user.id;
    const { title, description, category_slug, service_name, zone_name, address_hint, max_participants, discount_percentage, base_price, scheduled_date, deadline_date } = req.body;
    if (!title || !category_slug) return res.status(400).json({ error: 'title and category_slug required' });
    try {
        const { rows: userRow } = await pool.query(`SELECT full_name, email FROM users WHERE id = $1`, [userId]);
        const discountedPrice = base_price ? parseFloat(base_price) * (1 - parseInt(discount_percentage) / 100) : null;
        const { rows } = await pool.query(
            `INSERT INTO service_bundles (organizer_id, title, description, category_slug, service_name, zone_name, address_hint, max_participants, discount_percentage, base_price, discounted_price, scheduled_date, deadline_date, organizer_email, participant_emails)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,ARRAY[$14])
             RETURNING *`,
            [userId, title, description || null, category_slug, service_name || category_slug, zone_name || null, address_hint || null, parseInt(max_participants) || 5, parseInt(discount_percentage) || 20, base_price ? parseFloat(base_price) : null, discountedPrice, scheduled_date || null, deadline_date || null, userRow[0]?.email]
        );
        await pool.query(`INSERT INTO bundle_participants (bundle_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [rows[0].id, userId]);
        res.json({ bundle: rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bundles/:id/join', requireAuth, async (req, res) => {
    const userId = req.session.user.id;
    try {
        const { rows: bundle } = await pool.query(`SELECT * FROM service_bundles WHERE id = $1 AND status = 'forming'`, [req.params.id]);
        if (!bundle[0]) return res.status(404).json({ error: 'Bundle not available' });
        if (bundle[0].current_participants >= bundle[0].max_participants) return res.status(400).json({ error: 'Bundle is full' });
        await pool.query(`INSERT INTO bundle_participants (bundle_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [req.params.id, userId]);
        const { rows: userRow } = await pool.query(`SELECT email FROM users WHERE id = $1`, [userId]);
        await pool.query(
            `UPDATE service_bundles SET current_participants = current_participants + 1, participant_emails = array_append(participant_emails, $2), updated_at = NOW() WHERE id = $1`,
            [req.params.id, userRow[0]?.email]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/skill-swaps', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM skill_swaps WHERE status='open' ORDER BY created_at DESC LIMIT 30");
        res.json({ data: rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/skill-swaps/my', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM skill_swaps WHERE offerer_id=$1 ORDER BY created_at DESC LIMIT 20', [req.session.user.id]);
        res.json({ data: rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/time-credits/balance', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT COALESCE(SUM(amount),0) AS balance FROM time_credits_ledger WHERE user_id=$1', [req.session.user.id]);
        res.json({ balance: parseInt(rows[0]?.balance || 0) });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/skill-swaps', requireAuth, async (req, res) => {
    const { zone_id, offering, seeking, time_credits_offered } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO skill_swaps (zone_id, offerer_id, offering, seeking, time_credits_offered) VALUES ($1,$2,$3,$4,$5) RETURNING *',
            [zone_id || null, req.session.user.id, offering, seeking, time_credits_offered || 1]
        );
        res.json({ data: rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/skill-swaps/:id/match', requireAuth, async (req, res) => {
    try {
        await pool.query(
            "UPDATE skill_swaps SET status='matched', matched_with_user_id=$1, updated_at=NOW() WHERE id=$2",
            [req.session.user.id, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/disputes', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            "SELECT * FROM disputes WHERE raised_by=$1 OR against_id=$1 OR status IN ('open','voting') ORDER BY created_at DESC",
            [req.session.user.id]
        );
        res.json({ data: rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/jury-assignments/my', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT dispute_id, vote FROM jury_assignments WHERE juror_user_id=$1', [req.session.user.id]);
        res.json({ data: rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/jury-assignments', requireAuth, async (req, res) => {
    const { dispute_id, vote } = req.body;
    try {
        await pool.query(
            'INSERT INTO jury_assignments (dispute_id, juror_user_id, vote, voted_at) VALUES ($1,$2,$3,NOW()) ON CONFLICT (dispute_id, juror_user_id) DO UPDATE SET vote=$3, voted_at=NOW()',
            [dispute_id, req.session.user.id, vote]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/events', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM events ORDER BY date ASC LIMIT 60");
        res.json({ data: rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/events', requireAuth, async (req, res) => {
    const { title, description, category, venue_name, venue_type, address, date, start_time, end_time, organizer_name, ticket_price, is_free, total_tickets, bundle_services, cover_image_url } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO events (title, description, category, venue_name, venue_type, address, date, start_time, end_time, organizer_name, organizer_id, ticket_price, is_free, total_tickets, bundle_services, cover_image_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *',
            [title, description || null, category || 'other', venue_name || null, venue_type || null, address || null, date || null, start_time || null, end_time || null, organizer_name || null, req.session.user.id, ticket_price || 0, is_free !== false, total_tickets || 100, JSON.stringify(bundle_services || []), cover_image_url || null]
        );
        res.json({ data: rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/event-tickets/my', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM event_tickets WHERE buyer_email=$1 ORDER BY created_at DESC", [req.session.user.email]);
        res.json({ data: rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/event-tickets', requireAuth, async (req, res) => {
    const { event_id, event_title, quantity, unit_price } = req.body;
    const total = (quantity || 1) * (unit_price || 0);
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    try {
        const { rows } = await pool.query(
            'INSERT INTO event_tickets (event_id, event_title, buyer_email, buyer_name, quantity, unit_price, total_amount, ticket_code) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
            [event_id, event_title || null, req.session.user.email, req.session.user.full_name || null, quantity || 1, unit_price || 0, total, code]
        );
        await pool.query('UPDATE events SET tickets_sold = COALESCE(tickets_sold,0) + $1 WHERE id=$2', [quantity || 1, event_id]);
        res.json({ data: rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/community-posts', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM community_posts ORDER BY created_date DESC LIMIT 50");
        res.json({ data: rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/community-posts', requireAuth, async (req, res) => {
    const { type, title, body, image_url } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO community_posts (type, title, body, author_name, author_email, author_id, image_url) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [type || 'post', title || null, body, req.session.user.full_name || req.session.user.email, req.session.user.email, req.session.user.id, image_url || null]
        );
        res.json({ data: rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/community-posts/:id/vote', requireAuth, async (req, res) => {
    const { delta } = req.body;
    try {
        await pool.query('UPDATE community_posts SET upvotes = GREATEST(0, COALESCE(upvotes,0) + $1) WHERE id=$2', [delta || 1, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/post-comments/:postId', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM post_comments WHERE post_id=$1 ORDER BY created_at ASC', [req.params.postId]);
        res.json({ data: rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/post-comments', requireAuth, async (req, res) => {
    const { post_id, body } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO post_comments (post_id, author_email, author_name, body) VALUES ($1,$2,$3,$4) RETURNING *',
            [post_id, req.session.user.email, req.session.user.full_name || req.session.user.email, body]
        );
        await pool.query('UPDATE community_posts SET reply_count = COALESCE(reply_count,0) + 1 WHERE id=$1', [post_id]);
        res.json({ data: rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/neighborhood-polls', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM neighborhood_polls ORDER BY created_at DESC LIMIT 20");
        res.json({ data: rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/neighborhood-polls/:id/vote', requireAuth, async (req, res) => {
    const { options } = req.body;
    try {
        await pool.query('UPDATE neighborhood_polls SET options=$1 WHERE id=$2', [JSON.stringify(options), req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── Trust Passport (public, no auth) ────────────────────────────────────── */

app.get('/api/trust-passport/:providerId', async (req, res) => {
    const { providerId } = req.params;
    try {
        const { rows: users } = await pool.query(
            'SELECT id, full_name, avatar_url, city, country FROM users WHERE id = $1',
            [providerId]
        );
        if (!users[0]) return res.status(404).json({ error: 'Provider not found' });
        const user = users[0];

        const { rows: trust } = await pool.query(
            'SELECT * FROM provider_trust_scores WHERE provider_id = $1',
            [providerId]
        );
        const score = trust[0];

        const { rows: vouches } = await pool.query(
            'SELECT COUNT(*) AS count FROM provider_vouches WHERE provider_id = $1',
            [providerId]
        );

        const badges = [];
        if (score?.tier === 'champion') badges.push('🏆 Champion Provider');
        if (score?.tier === 'trusted' || score?.tier === 'champion') badges.push('✅ Community Trusted');
        if ((score?.total_completed || 0) >= 50) badges.push('⭐ 50+ Jobs');
        if ((score?.total_completed || 0) >= 10) badges.push('🎯 Experienced');
        if ((score?.avg_rating || 0) >= 4.8) badges.push('💎 Top Rated');
        if (parseInt(vouches[0]?.count || 0) >= 3) badges.push('👥 Vouched');

        const credentialData = {
            provider_id: providerId,
            provider_name: user.full_name || 'Provider',
            avatar_url: user.avatar_url,
            city: user.city,
            country: user.country || 'PK',
            score: parseFloat(score?.score || 0),
            tier: score?.tier || 'new',
            completion_rate: parseFloat(score?.completion_rate || 0),
            avg_rating: score?.avg_rating ? parseFloat(score.avg_rating) : null,
            total_completed: score?.total_completed || 0,
            dispute_free_streak: score?.dispute_free_streak || 0,
            vouches_count: parseInt(vouches[0]?.count || 0),
            last_computed_at: score?.last_computed_at || null,
            badges,
        };

        const verificationHash = crypto
            .createHmac('sha256', process.env.TRUST_PASSPORT_SECRET || 'truvornex-trust-v1')
            .update(JSON.stringify(credentialData))
            .digest('hex');

        res.json({ ...credentialData, verification_hash: verificationHash });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ── Admin Lab Data ─────────────────────────────────────────────────────────── */

app.get('/api/admin/lab-data', requireAuth, async (req, res) => {
    if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
        const [statsR, trustR, zonesR, bnplR, loyaltyR] = await Promise.all([
            pool.query(`
                SELECT
                    (SELECT COUNT(*) FROM users) AS total_users,
                    (SELECT COUNT(*) FROM users WHERE role='provider') AS total_providers,
                    (SELECT COUNT(*) FROM bookings) AS total_bookings,
                    (SELECT COUNT(*) FROM bookings WHERE DATE(created_at) = CURRENT_DATE) AS bookings_today
            `),
            pool.query(`SELECT tier, COUNT(*) AS count FROM provider_trust_scores GROUP BY tier ORDER BY count DESC`),
            pool.query(`SELECT id, name, health_score, demand_index, updated_at FROM neighborhood_zones ORDER BY health_score DESC LIMIT 20`).catch(() => ({ rows: [] })),
            pool.query(`
                SELECT
                    COUNT(*) FILTER (WHERE status='active') AS active_count,
                    SUM(total_amount - (paid_installments * installment_amount)) FILTER (WHERE status='active') AS total_exposure,
                    COUNT(*) FILTER (WHERE status='active' AND next_due_date < CURRENT_DATE) AS overdue_count,
                    COUNT(*) FILTER (WHERE status='defaulted') AS defaulted_count
                FROM bnpl_agreements
            `).catch(() => ({ rows: [{}] })),
            pool.query(`
                SELECT
                    SUM(coins) FILTER (WHERE coins > 0) AS total_coins_issued,
                    SUM(coins) FILTER (WHERE coins < 0) AS total_coins_redeemed,
                    SUM(coins) AS outstanding_balance,
                    COUNT(DISTINCT user_id) AS users_with_coins
                FROM loyalty_ledger
            `).catch(() => ({ rows: [{}] })),
        ]);

        res.json({
            platform_stats: statsR.rows[0],
            trust_distribution: trustR.rows,
            zones: zonesR.rows,
            bnpl_risk: bnplR.rows[0] || {},
            loyalty_economy: loyaltyR.rows[0] || {},
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ── Realtime polling endpoints ─────────────────────────────────────────────── */

const REALTIME_ALLOWED_TABLES = new Set(['bookings', 'notifications', 'emergency_requests', 'group_buy_participants', 'chat_messages']);

app.get('/api/realtime/platform-stats', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM bookings) AS bookings,
                (SELECT COUNT(*) FROM users WHERE role='provider') AS providers,
                (SELECT COUNT(*) FROM bookings WHERE status='pending') AS pending_bookings,
                (SELECT COUNT(*) FROM bookings WHERE status IN ('confirmed','in_progress')) AS active_bookings
        `);
        const { rows: activity } = await pool.query(
            `SELECT id, status, created_at FROM bookings ORDER BY created_at DESC LIMIT 5`
        ).catch(() => ({ rows: [] }));
        res.json({ stats: { ...rows[0], recentActivity: activity } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/realtime/list/:table', requireAuth, async (req, res) => {
    const { table } = req.params;
    if (!REALTIME_ALLOWED_TABLES.has(table)) return res.status(400).json({ error: 'Table not allowed' });
    const userId = req.session.user.id;
    try {
        let q, params;
        if (table === 'notifications') {
            q = `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30`;
            params = [userId];
        } else if (table === 'bookings') {
            const col = req.session.user.role === 'provider' ? 'provider_id' : 'customer_id';
            q = `SELECT * FROM bookings WHERE ${col}=$1 ORDER BY created_at DESC LIMIT 30`;
            params = [userId];
        } else if (table === 'chat_messages') {
            q = `SELECT * FROM chat_messages WHERE sender_id=$1 OR receiver_id=$1 ORDER BY created_at DESC LIMIT 50`;
            params = [userId];
        } else {
            q = `SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 30`;
            params = [];
        }
        const { rows } = await pool.query(q, params);
        res.json({ rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/realtime/single/:table/:id', requireAuth, async (req, res) => {
    const { table, id } = req.params;
    if (!REALTIME_ALLOWED_TABLES.has(table)) return res.status(400).json({ error: 'Table not allowed' });
    try {
        const { rows } = await pool.query(`SELECT * FROM ${table} WHERE id=$1 LIMIT 1`, [id]);
        res.json({ row: rows[0] || null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/realtime/poll', requireAuth, async (req, res) => {
    const userId = req.session.user.id;
    const role = req.session.user.role;
    try {
        const bookingCol = role === 'provider' ? 'provider_id' : 'customer_id';
        const [notifs, bookings, messages] = await Promise.all([
            pool.query(
                `SELECT id, type, message, read, created_at FROM notifications WHERE user_id=$1 AND read=false ORDER BY created_at DESC LIMIT 10`,
                [userId]
            ),
            pool.query(
                `SELECT id, status, updated_at FROM bookings WHERE ${bookingCol}=$1 AND updated_at >= NOW() - INTERVAL '5 minutes' ORDER BY updated_at DESC LIMIT 5`,
                [userId]
            ),
            pool.query(
                `SELECT id, content, sender_id, created_at FROM chat_messages WHERE receiver_id=$1 AND created_at >= NOW() - INTERVAL '5 minutes' ORDER BY created_at DESC LIMIT 10`,
                [userId]
            ),
        ]);
        res.json({
            unread_notifications: notifs.rows,
            recent_booking_updates: bookings.rows,
            recent_messages: messages.rows,
            polled_at: new Date().toISOString(),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ── Vouches ────────────────────────────────────────────────────────────────── */

app.get('/api/vouches/:providerId', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT pv.*, u.full_name AS voucher_name, u.avatar_url AS voucher_avatar
             FROM provider_vouches pv
             LEFT JOIN users u ON u.id = pv.voucher_id
             WHERE pv.provider_id = $1 ORDER BY pv.created_at DESC`,
            [req.params.providerId]
        );
        res.json({ vouches: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/vouches', requireAuth, async (req, res) => {
    const { provider_id, message, zone_id } = req.body;
    if (!provider_id) return res.status(400).json({ error: 'provider_id required' });
    if (provider_id === req.session.user.id) return res.status(400).json({ error: 'Cannot vouch for yourself' });
    try {
        const { rows } = await pool.query(
            `INSERT INTO provider_vouches(provider_id, voucher_id, zone_id, message) VALUES ($1,$2,$3,$4)
             ON CONFLICT (provider_id, voucher_id) DO UPDATE SET message=$4
             RETURNING *`,
            [provider_id, req.session.user.id, zone_id || null, message || null]
        );
        await pool.query(`UPDATE provider_trust_scores SET vouches_count = (SELECT COUNT(*) FROM provider_vouches WHERE provider_id=$1) WHERE provider_id=$1`, [provider_id]);
        await writeAuditLog({ actorId: req.session.user.id, action: 'vouch.create', entity: 'provider_vouches', entityId: rows[0].id, ipAddress: req.ip });
        res.json({ vouch: rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ── Full-text Search ───────────────────────────────────────────────────────── */

app.get('/api/search', async (req, res) => {
    const { q, category, lat, lng, limit: lim } = req.query;
    if (!q && !category) return res.status(400).json({ error: 'Query or category required' });
    const limitN = Math.min(parseInt(lim) || 20, 50);
    try {
        let rows = [];
        const searchQuery = q ? q.trim() : null;

        const providersQ = await pool.query(
            `SELECT p.*, u.full_name, u.avatar_url,
                    pts.score AS trust_score, pts.tier,
                    CASE WHEN $1::text IS NOT NULL AND (
                        p.business_name ILIKE '%' || $1 || '%' OR
                        p.description ILIKE '%' || $1 || '%' OR
                        p.category_slug ILIKE '%' || $1 || '%'
                    ) THEN 1 ELSE 0 END AS text_match
             FROM providers p
             LEFT JOIN users u ON u.id::text = p.user_id::text
             LEFT JOIN provider_trust_scores pts ON pts.provider_id::text = p.user_id::text
             WHERE p.status = 'approved'
               AND ($1::text IS NULL OR p.business_name ILIKE '%' || $1 || '%' OR p.description ILIKE '%' || $1 || '%' OR p.category_slug ILIKE '%' || $1 || '%')
               AND ($2::text IS NULL OR p.category_slug = $2)
             ORDER BY pts.score DESC NULLS LAST, text_match DESC
             LIMIT $3`,
            [searchQuery, category || null, limitN]
        ).catch(() => ({ rows: [] }));

        rows = providersQ.rows;

        const servicesQ = await pool.query(
            `SELECT s.*, p.business_name AS provider_name, p.category_slug,
                    pts.score AS trust_score, pts.tier
             FROM services s
             LEFT JOIN providers p ON p.id = s.provider_id
             LEFT JOIN provider_trust_scores pts ON pts.provider_id::text = p.user_id::text
             WHERE s.is_active = true
               AND ($1::text IS NULL OR s.title ILIKE '%' || $1 || '%' OR s.description ILIKE '%' || $1 || '%')
               AND ($2::text IS NULL OR p.category_slug = $2)
             ORDER BY pts.score DESC NULLS LAST
             LIMIT $3`,
            [searchQuery, category || null, limitN]
        ).catch(() => ({ rows: [] }));

        res.json({ providers: rows, services: servicesQ.rows, query: q, category: category || null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ── Audit Log (admin only) ─────────────────────────────────────────────────── */

app.get('/api/audit-log', requireAuth, async (req, res) => {
    if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    try {
        const { rows } = await pool.query(
            `SELECT al.*, u.email AS actor_email FROM audit_log al
             LEFT JOIN users u ON u.id = al.actor_id
             ORDER BY al.created_at DESC LIMIT $1`,
            [limit]
        );
        res.json({ entries: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ── Simon Intelligence API ─────────────────────────────────────────────────── */

app.get('/api/simon/home-insights', async (req, res) => {
    try {
        const userId = req.session?.user?.id;
        const area = req.query.area || 'your area';
        const insights = await simon.getHomeInsights({ area, user_id: userId });
        res.json({ insights });
    } catch (err) {
        res.json({ insights: [] });
    }
});

app.post('/api/simon/booking-analysis', async (req, res) => {
    try {
        const result = await simon.analyzeBooking(req.body || {});
        res.json(result);
    } catch (err) {
        res.json({ demandLevel: 'moderate', priceFairness: 'fair', timingScore: 7, timingSuggestion: 'A solid time slot for this service.', savingsTip: null });
    }
});

app.get('/api/simon/zone-health', async (req, res) => {
    try {
        let dbStats = null;
        try {
            const { rows } = await pool.query(`
                SELECT
                    (SELECT COUNT(*)::int FROM bookings WHERE status IN ('confirmed','in_progress')) AS active_bookings,
                    (SELECT COUNT(*)::int FROM users WHERE role = 'provider') AS total_providers
            `);
            dbStats = rows[0];
        } catch (_) {}
        const result = simon.getZoneHealth({ zone_id: req.query.zone_id, area: req.query.area || 'your area', dbStats });
        res.json(result);
    } catch (err) {
        res.json({ health: 'active', score: 75, activeProviders: 40, area: 'your area', trendingServices: ['Cleaning', 'Plumbing'], peakHours: false, alert: null });
    }
});

app.post('/api/simon/voice-search', async (req, res) => {
    try {
        const result = await simon.parseVoiceSearch(req.body || {});
        res.json(result);
    } catch (err) {
        res.json({ query: '', category: null, intent: 'search', urgency: 'flexible' });
    }
});

app.post('/api/simon/zone-forecast', async (req, res) => {
    try {
        const result = await simon.getZoneForecast(req.body || {});
        res.json(result);
    } catch (err) {
        res.json({ forecast: [], top_opportunity: null, living_wage_floor_pkr: 800 });
    }
});

app.get('/api/simon/recommendations', async (req, res) => {
    try {
        const userId = req.session?.user?.id || 'anonymous';
        const result = await simon.generateRecommendations(userId);
        res.json(result);
    } catch (err) {
        res.json({ services: [], bundle_suggestion: null, optimal_booking_time: null });
    }
});

if (isProd) {
    const distPath = path.join(__dirname, '..', 'dist');
    app.use(express.static(distPath));
    app.get(/{*path}/, (req, res) => res.sendFile(path.join(distPath, 'index.html')));
    initDb().then(() => {
        app.listen(PORT, '0.0.0.0', () => console.log(`Truvornex running on port ${PORT}`));
    });
} else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
    initDb().then(() => {
        app.listen(PORT, '0.0.0.0', () => console.log(`Truvornex dev server running on port ${PORT}`));
    });
}
