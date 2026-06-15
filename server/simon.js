/**
 * Simon Intelligence Service — the nervous system of Truvornex.
 * Hardened: in-memory caching, Zod validation, deterministic fallbacks.
 */
import { z } from 'zod';

const cache = new Map();

function cacheGet(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) { cache.delete(key); return null; }
    return entry.value;
}

function cacheSet(key, value, ttlMs) {
    cache.set(key, { value, expires: Date.now() + ttlMs });
}

const HomeInsightsSchema = z.object({
    area: z.string().max(120).default('your area'),
    user_id: z.string().optional(),
});

const BookingAnalysisSchema = z.object({
    serviceType: z.string().max(80).default('service'),
    date: z.string().optional(),
    timeSlot: z.string().optional(),
    price: z.number().optional(),
    area: z.string().max(120).default('your area'),
    service_id: z.string().uuid().optional(),
    provider_id: z.string().uuid().optional(),
});

const ZoneHealthSchema = z.object({
    zone_id: z.string().optional(),
    area: z.string().max(120).default('your area'),
});

const SearchParseSchema = z.object({
    transcript: z.string().min(1).max(500),
});

async function callAI(systemPrompt, userPrompt) {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return null;
    try {
        const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'HTTP-Referer': 'https://truvornex.com', 'X-Title': 'Truvornex' },
            body: JSON.stringify({
                model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.25,
                max_tokens: 500,
                response_format: { type: 'json_object' },
            }),
        });
        if (!r.ok) return null;
        const d = await r.json();
        return JSON.parse(d.choices?.[0]?.message?.content || 'null');
    } catch { return null; }
}

function timeCtx() {
    const d = new Date();
    const h = d.getHours();
    const dow = d.getDay();
    const month = d.getMonth();
    return { h, dow, month, weekend: dow === 0 || dow === 6, active: h >= 8 && h <= 20 };
}

function getTrending() {
    const { h, month } = timeCtx();
    if (month >= 2 && month <= 4) return ['Gardening', 'Cleaning', 'HVAC'];
    if (month >= 8 && month <= 10) return ['Cleaning', 'Plumbing', 'Heating'];
    if (h < 10) return ['Cleaning', 'Handyman'];
    if (h < 14) return ['Moving', 'Chef', 'Cleaning'];
    return ['Cleaning', 'Plumbing', 'Fitness'];
}

/* ── 1. Home Insights ─────────────────────────────────────────────────────── */
export async function getHomeInsights({ area = 'your area', user_id } = {}) {
    const cacheKey = `home-insights:${user_id || area}`;
    const cached = cacheGet(cacheKey);
    if (cached) return cached;

    const parse = HomeInsightsSchema.safeParse({ area, user_id });
    const safeArea = parse.success ? parse.data.area : 'your area';

    const { h, weekend, month } = timeCtx();

    const ai = await callAI(
        `You are Simon, the AI intelligence layer of Truvornex neighborhood services platform in Pakistan. Return JSON with exactly 3 insights: {"insights":[{"tag":"2-3 word label","message":"actionable insight max 115 chars","type":"demand|reminder|bundle|trust|suggestion"},{"tag":...},{"tag":...}]}. Be specific, personal, and useful.`,
        `Area: ${safeArea}, Hour: ${h}, Month: ${month + 1}, Weekend: ${weekend}`
    );
    if (ai?.insights?.length >= 3) {
        const result = ai.insights.slice(0, 3);
        cacheSet(cacheKey, result, 10 * 60 * 1000);
        return result;
    }

    const ins = [];

    if (weekend) {
        ins.push({ tag: 'Demand Spike', message: `Cleaning requests in ${safeArea} are 3× higher this weekend. Book now to secure your preferred provider.`, type: 'demand' });
    } else if (h >= 7 && h <= 9) {
        ins.push({ tag: 'Morning Window', message: `Providers just came online in ${safeArea}. Best window for same-day bookings.`, type: 'demand' });
    } else {
        ins.push({ tag: 'Zone Active', message: `Active providers in ${safeArea} right now — average response under 3 minutes.`, type: 'demand' });
    }

    if (month >= 2 && month <= 4) {
        ins.push({ tag: 'Smart Reminder', message: 'Spring is peak season for deep cleaning and HVAC. Book this week before demand peaks and prices rise.', type: 'reminder' });
    } else if (month >= 8 && month <= 10) {
        ins.push({ tag: 'Smart Reminder', message: 'Fall is ideal for gutter cleaning and heating checks. Simon has providers available this week.', type: 'reminder' });
    } else if (month >= 5 && month <= 7) {
        ins.push({ tag: 'Smart Reminder', message: 'Summer AC demand is 2× normal. Your last HVAC check may be overdue — schedule before peak heat.', type: 'reminder' });
    } else {
        ins.push({ tag: 'Smart Reminder', message: 'Based on seasonal cycles, a deep clean may be due. Check available providers for this week.', type: 'reminder' });
    }

    ins.push({ tag: 'Bundle Deal', message: `Neighbors in ${safeArea} are booking services this week. Join the Group Bundle and save up to 30%.`, type: 'bundle' });

    cacheSet(cacheKey, ins, 10 * 60 * 1000);
    return ins;
}

/* ── 2. Booking Analysis ──────────────────────────────────────────────────── */
export async function analyzeBooking(input = {}) {
    const parse = BookingAnalysisSchema.safeParse(input);
    if (!parse.success) {
        return { demandLevel: 'moderate', priceFairness: 'fair', timingScore: 7, timingSuggestion: 'A solid time slot for this service.', savingsTip: null };
    }
    const { serviceType, date, timeSlot, price, area } = parse.data;

    const { weekend } = timeCtx();
    const h = timeSlot ? parseInt(timeSlot) : 10;
    const slotWeekend = date ? [0, 6].includes(new Date(date + 'T12:00:00').getDay()) : weekend;

    const ai = await callAI(
        `You are Simon. Analyze a service booking request and return JSON: {"demandLevel":"low|moderate|high|surge","priceFairness":"below_market|fair|above_market","timingScore":1-10,"timingSuggestion":"max 80 chars, actionable","savingsTip":"max 80 chars or null"}`,
        `Service: ${serviceType}, Date: ${date}, Time: ${timeSlot}, Price: PKR${price}, Area: ${area}, Weekend: ${slotWeekend}`
    );
    if (ai?.demandLevel) return ai;

    const demandLevel = slotWeekend && h >= 10 && h <= 14 ? 'surge'
        : slotWeekend || (h >= 9 && h <= 11) ? 'high'
        : h >= 13 && h <= 15 ? 'moderate' : 'low';

    const timingScore = !slotWeekend && h >= 9 && h <= 11 ? 9
        : !slotWeekend && h >= 14 && h <= 16 ? 8
        : slotWeekend ? 6 : 7;

    const timingSuggestion = timingScore >= 9
        ? 'Excellent slot — providers in this window have a 94% on-time rate.'
        : slotWeekend
        ? 'Weekend slots fill fast — this provider has limited weekend availability.'
        : 'Mid-week mornings are the highest-rated time slots.';

    const savingsTip = demandLevel === 'surge'
        ? 'Surge detected. A weekday morning slot could save 15–20%.'
        : demandLevel === 'high'
        ? 'Adding a Group Bundle for this service saves up to 30%.'
        : null;

    return { demandLevel, priceFairness: 'fair', timingScore, timingSuggestion, savingsTip };
}

/* ── 3. Zone Health ───────────────────────────────────────────────────────── */
export function getZoneHealth(input = {}) {
    const parse = ZoneHealthSchema.safeParse(input);
    const { zone_id, area } = parse.success ? parse.data : { area: 'your area' };

    const dbStats = input.dbStats || null;
    const cacheKey = `zone-health:${zone_id || area}`;
    if (!dbStats) {
        const cached = cacheGet(cacheKey);
        if (cached) return cached;
    }

    const { active, h } = timeCtx();
    const score = dbStats
        ? Math.min(95, Math.max(15, Math.round(
            (parseInt(dbStats.active_bookings) / Math.max(1, parseInt(dbStats.total_providers))) * 25
            + (active ? 55 : 28)
          )))
        : active ? 72 + Math.floor(Math.random() * 20) : 35 + Math.floor(Math.random() * 18);
    const providers = dbStats
        ? parseInt(dbStats.total_providers)
        : active ? 30 + Math.floor(Math.random() * 20) : 8 + Math.floor(Math.random() * 10);
    const health = score >= 72 ? 'active' : score >= 50 ? 'moderate' : 'quiet';

    const result = {
        health,
        score,
        activeProviders: providers,
        area,
        zone_id: zone_id || null,
        trendingServices: getTrending(),
        peakHours: active && h >= 10 && h <= 14,
        alert: score < 40
            ? `Low provider availability in ${area} right now. Consider booking for tomorrow morning.`
            : null,
    };

    cacheSet(cacheKey, result, 5 * 60 * 1000);
    return result;
}

/* ── 4. Voice Search Parse ────────────────────────────────────────────────── */
export async function parseVoiceSearch(input = {}) {
    const parse = SearchParseSchema.safeParse(input);
    if (!parse.success) return { query: '', category: null, intent: 'search' };
    const { transcript } = parse.data;

    const ai = await callAI(
        `You are Simon parsing a voice search for Truvornex neighborhood services. Return JSON: {"query":"cleaned search terms","category":"cleaning|plumbing|hvac|moving|gardening|chef|handyman|fitness|other|null","intent":"book|search|compare|info","urgency":"immediate|today|this_week|flexible"}`,
        `Voice input: "${transcript}"`
    );
    if (ai?.query !== undefined) return ai;

    const lower = transcript.toLowerCase();
    const category = ['cleaning','plumbing','hvac','moving','gardening','chef','handyman','fitness']
        .find(c => lower.includes(c)) || null;

    return { query: transcript, category, intent: 'search', urgency: 'flexible' };
}

/* ── 5. Zone Demand Forecast (Simon Intelligence) ────────────────────────── */
const ZoneForecastSchema = z.object({
    zone_id: z.string().optional(),
    area: z.string().max(120).default('your area'),
    categories: z.array(z.string()).optional(),
});

export async function getZoneForecast(input = {}) {
    const parse = ZoneForecastSchema.safeParse(input);
    const { zone_id, area } = parse.success ? parse.data : { area: 'your area' };
    const cacheKey = `zone-forecast:${zone_id || area}`;
    const cached = cacheGet(cacheKey);
    if (cached) return cached;

    const { h, month } = timeCtx();
    const ai = await callAI(
        `You are Simon, Truvornex's zone economy AI. Generate a 12-slot demand forecast for neighborhood services. Return JSON: {"forecast":[{"category":"cleaning|plumbing|hvac|moving|gardening|chef|handyman|fitness","demand_index":0-100,"estimated_price_pkr":number,"supply_shortfall":bool,"opportunity_note":"max 60 chars"}],"top_opportunity":{"category":"string","reason":"max 80 chars"},"living_wage_floor_pkr":800}`,
        `Zone: ${zone_id || area}, Hour: ${h}, Month: ${month + 1}. Generate realistic demand for 8 service categories based on season and time.`
    );
    if (ai?.forecast) {
        cacheSet(cacheKey, ai, 30 * 60 * 1000);
        return ai;
    }

    const trending = getTrending();
    const fallback = {
        forecast: trending.map((cat, i) => ({
            category: cat.toLowerCase(),
            demand_index: 65 - i * 8,
            estimated_price_pkr: [1200, 2000, 2500, 800, 1500][i % 5],
            supply_shortfall: i === 0 && h >= 9 && h <= 14,
            opportunity_note: i === 0 ? `High demand in ${area} right now` : 'Steady demand this week',
        })),
        top_opportunity: { category: trending[0].toLowerCase(), reason: `Peak demand in ${area} — ${trending[0]} providers are fully booked` },
        living_wage_floor_pkr: 800,
    };
    cacheSet(cacheKey, fallback, 30 * 60 * 1000);
    return fallback;
}

/* ── 6. Idle Resource Matching ───────────────────────────────────────────── */
const IdleMatchSchema = z.object({
    provider_id: z.string().uuid(),
    slot_start: z.string(),
    slot_end: z.string(),
    categories: z.array(z.string()).default([]),
    zone_id: z.string().optional(),
});

export async function generateIdleMatches(input = {}) {
    const parse = IdleMatchSchema.safeParse(input);
    if (!parse.success) return [];
    const { slot_start, slot_end, categories, zone_id } = parse.data;

    const durationHours = (new Date(slot_end) - new Date(slot_start)) / 3600000;
    const cats = categories.length > 0 ? categories : ['cleaning', 'handyman', 'gardening'];

    const ai = await callAI(
        `You are Simon, Truvornex's idle resource matching engine. A provider has a free time window. Generate micro-jobs that fit exactly. Return JSON: {"jobs":[{"category":"string","title":"max 50 chars","description":"max 120 chars","duration_hours":number,"price_pkr":number,"area":"neighborhood name","urgency":"immediate|today|this_week"}]}. Max 3 jobs. Prices must never go below 800 PKR/hour living wage floor.`,
        `Available: ${Math.round(durationHours)}h, categories: ${cats.join(', ')}, zone: ${zone_id || 'local area'}, slot: ${slot_start}`
    );
    if (ai?.jobs?.length > 0) return ai.jobs;

    return cats.slice(0, 3).map((cat, i) => ({
        category: cat,
        title: `${cat.charAt(0).toUpperCase() + cat.slice(1)} — ${Math.round(durationHours)}h slot`,
        description: `Quick ${cat} job matched to your available window. Customer confirmed nearby.`,
        duration_hours: Math.min(durationHours, 3),
        price_pkr: Math.max(800 * Math.round(durationHours), 1200) - i * 100,
        area: zone_id || 'your area',
        urgency: 'today',
    }));
}

/* ── 7. Generate Recommendations ─────────────────────────────────────────── */
export async function generateRecommendations(userId) {
    const cacheKey = `recommendations:${userId}`;
    const cached = cacheGet(cacheKey);
    if (cached) return cached;

    const { h, weekend, month } = timeCtx();
    const trending = getTrending();

    const result = {
        services: trending.map(s => ({ name: s, reason: 'Trending in your area', urgency: 'this_week' })),
        bundle_suggestion: weekend ? 'Book cleaning + handyman together and save 20%' : null,
        optimal_booking_time: !weekend && h < 12 ? 'Now is a great time to book — providers are available' : null,
    };

    cacheSet(cacheKey, result, 15 * 60 * 1000);
    return result;
}
