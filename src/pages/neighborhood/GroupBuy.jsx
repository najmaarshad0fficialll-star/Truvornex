import { useState, useEffect, useCallback } from 'react';
import { Layers, Users, Clock, Plus, Check, Loader2, ShoppingCart, X, TrendingDown, Zap } from 'lucide-react';
import { toast } from 'sonner';

const SERVICE_CATEGORIES = [
    'Cleaning', 'Gardening', 'Plumbing', 'Electrical', 'Painting',
    'HVAC', 'Security', 'Handyman', 'Pest Control', 'Moving',
    'AC Maintenance', 'Generator Service', 'Water Tank Cleaning', 'Carpentry',
];

const EMPTY_FORM = { service_category: '', description: '', target_participants: 5, discount_percent: 15, expires_days: 7 };

function countdown(expiresAt) {
    const diff = new Date(expiresAt) - Date.now();
    if (diff <= 0) return 'Expired';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (d > 0) return `${d}d ${h}h left`;
    if (h > 0) return `${h}h ${m}m left`;
    return `${m}m left`;
}

export default function GroupBuy() {
    const [user, setUser] = useState(null);
    const [buys, setBuys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joined, setJoined] = useState(new Set());
    const [joining, setJoining] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const fetchBuys = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetch('/api/group-buys');
            const d = await r.json();
            setBuys(d.data || []);
        } catch (_) { setBuys([]); }
        setLoading(false);
    }, []);

    const fetchMyParticipation = useCallback(async () => {
        try {
            const r = await fetch('/api/group-buy-participants/my');
            const d = await r.json();
            if (d.data) setJoined(new Set(d.data.map(p => p.group_buy_id)));
        } catch (_) {}
    }, []);

    useEffect(() => {
        const init = async () => {
            const r = await fetch('/api/auth/user');
            const d = await r.json();
            setUser(d.user);
            await fetchBuys();
            if (d.user) await fetchMyParticipation();
        };
        init();
    }, [fetchBuys, fetchMyParticipation]);

    const joinBuy = async (buy) => {
        if (!user) { toast.error('Please log in to join'); return; }
        if (joined.has(buy.id)) { toast('Already joined'); return; }
        setJoining(buy.id);
        try {
            const r = await fetch(`/api/group-buys/${buy.id}/join`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }
            });
            const d = await r.json();
            if (d.success) {
                setJoined(p => new Set([...p, buy.id]));
                setBuys(prev => prev.map(b => b.id === buy.id
                    ? { ...b, current_participants: (b.current_participants || 0) + 1 }
                    : b));
                toast.success('Joined! You\'ll be notified when the deal locks.');
            } else { toast.error(d.error || 'Failed to join'); }
        } catch (_) { toast.error('Network error'); }
        setJoining(null);
    };

    const create = async () => {
        if (!form.service_category) { toast.error('Select a service category'); return; }
        setSaving(true);
        const expiresAt = new Date(Date.now() + Number(form.expires_days) * 86400000).toISOString();
        try {
            const r = await fetch('/api/group-buys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_category: form.service_category,
                    description: form.description || null,
                    target_participants: parseInt(form.target_participants),
                    discount_percent: parseInt(form.discount_percent),
                    expires_at: expiresAt,
                }),
            });
            const d = await r.json();
            if (d.data) {
                setBuys(prev => [d.data, ...prev]);
                setJoined(p => new Set([...p, d.data.id]));
                toast.success('Group buy created!');
                setCreateOpen(false);
                setForm(EMPTY_FORM);
            } else { toast.error(d.error || 'Failed to create'); }
        } catch (_) { toast.error('Network error'); }
        setSaving(false);
    };

    return (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="font-display font-bold text-2xl tracking-tight flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                        <Layers className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
                        Group Deals
                    </h1>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>
                        Bundle jobs with neighbors · Save up to 35%
                    </p>
                </div>
                {user && (
                    <button onClick={() => setCreateOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                        style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}>
                        <Plus className="h-3.5 w-3.5" /> Create Deal
                    </button>
                )}
            </div>

            {/* How it works */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                    { icon: Users, label: 'Group up', sub: '3–10 neighbors', color: '#93c5fd' },
                    { icon: TrendingDown, label: 'Save big', sub: 'Up to 35% off', color: '#6ee7b7' },
                    { icon: Zap, label: 'One trip', sub: 'Provider visits once', color: '#fcd34d' },
                ].map(item => (
                    <div key={item.label} className="rounded-2xl p-4 text-center"
                        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                        <div className="h-9 w-9 rounded-xl mx-auto mb-2 flex items-center justify-center"
                            style={{ backgroundColor: item.color + '15' }}>
                            <item.icon className="h-4 w-4" style={{ color: item.color }} />
                        </div>
                        <p className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>{item.label}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>{item.sub}</p>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-text-subtle)' }} />
                </div>
            ) : buys.length === 0 ? (
                <div className="text-center py-16" style={{ color: 'var(--color-text-subtle)' }}>
                    <Layers className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No active group deals</p>
                    {user && <button onClick={() => setCreateOpen(true)} className="text-xs mt-2 font-semibold" style={{ color: 'var(--color-primary)' }}>Start the first one →</button>}
                </div>
            ) : (
                <div className="space-y-3">
                    {buys.map(buy => {
                        const pct = Math.min(100, Math.round(((buy.current_participants || 0) / (buy.target_participants || 1)) * 100));
                        const isJoined = joined.has(buy.id);
                        const isLocked = buy.status === 'locked';
                        const cd = buy.expires_at ? countdown(buy.expires_at) : null;

                        return (
                            <div key={buy.id} className="rounded-2xl p-5"
                                style={{ backgroundColor: 'var(--color-surface)', border: `1px solid ${isLocked ? 'rgba(110,231,183,0.2)' : 'var(--color-border)'}` }}>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1">
                                        <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{buy.service_category}</p>
                                        {buy.description && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>{buy.description}</p>}
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <span className="text-2xl font-black" style={{ color: '#6ee7b7' }}>{buy.discount_percent}%</span>
                                        <p className="text-[10px]" style={{ color: 'var(--color-text-subtle)' }}>off</p>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <div className="flex items-center justify-between text-[10px] mb-1.5" style={{ color: 'var(--color-text-subtle)' }}>
                                        <span className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {buy.current_participants || 0}/{buy.target_participants} joined
                                        </span>
                                        {cd && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{cd}</span>}
                                    </div>
                                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surface-high)' }}>
                                        <div className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#6ee7b7' : '#fcd34d' }} />
                                    </div>
                                    <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-subtle)' }}>{pct}% to unlock deal</p>
                                </div>

                                {isLocked && (
                                    <div className="mb-3 p-2.5 rounded-xl"
                                        style={{ backgroundColor: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.2)' }}>
                                        <p className="text-xs font-semibold" style={{ color: '#6ee7b7' }}>✓ Deal locked — provider being assigned</p>
                                    </div>
                                )}

                                <button
                                    onClick={() => joinBuy(buy)}
                                    disabled={isJoined || joining === buy.id || isLocked}
                                    className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-opacity"
                                    style={{
                                        backgroundColor: isJoined || isLocked ? 'var(--color-surface-high)' : 'var(--color-primary)',
                                        color: isJoined || isLocked ? 'var(--color-text-subtle)' : 'var(--color-on-primary)',
                                        border: `1px solid ${isJoined || isLocked ? 'var(--color-border)' : 'transparent'}`,
                                        opacity: joining === buy.id ? 0.6 : 1,
                                    }}>
                                    {joining === buy.id
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        : isJoined ? <Check className="h-3.5 w-3.5" />
                                        : <ShoppingCart className="h-3.5 w-3.5" />}
                                    {isJoined ? 'Joined ✓' : isLocked ? 'Deal Locked' : 'Join Group Deal'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            {createOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                    onClick={e => e.target === e.currentTarget && setCreateOpen(false)}>
                    <div className="rounded-2xl p-5 w-full max-w-sm shadow-2xl"
                        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-base" style={{ color: 'var(--color-text)' }}>Create Group Deal</h2>
                            <button onClick={() => setCreateOpen(false)} style={{ color: 'var(--color-text-subtle)' }}><X className="h-4 w-4" /></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--color-text-subtle)' }}>Service Category</label>
                                <select value={form.service_category} onChange={e => setForm(f => ({ ...f, service_category: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                    style={{ backgroundColor: 'var(--color-surface-high)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                                    <option value="">Select…</option>
                                    {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--color-text-subtle)' }}>Description (optional)</label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Any specific requirements, area, timing…" rows={2}
                                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                                    style={{ backgroundColor: 'var(--color-surface-high)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--color-text-subtle)' }}>Target Neighbors</label>
                                    <select value={form.target_participants} onChange={e => setForm(f => ({ ...f, target_participants: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                        style={{ backgroundColor: 'var(--color-surface-high)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                                        {[3, 4, 5, 6, 8, 10].map(n => <option key={n} value={n}>{n} neighbors</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--color-text-subtle)' }}>Discount %</label>
                                    <select value={form.discount_percent} onChange={e => setForm(f => ({ ...f, discount_percent: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                        style={{ backgroundColor: 'var(--color-surface-high)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                                        {[10, 15, 20, 25, 30, 35].map(n => <option key={n} value={n}>{n}%</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--color-text-subtle)' }}>Expires in</label>
                                <select value={form.expires_days} onChange={e => setForm(f => ({ ...f, expires_days: parseInt(e.target.value) }))}
                                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                    style={{ backgroundColor: 'var(--color-surface-high)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                                    {[3, 5, 7, 10, 14].map(n => <option key={n} value={n}>{n} days</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => setCreateOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                                style={{ backgroundColor: 'var(--color-surface-high)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                                Cancel
                            </button>
                            <button onClick={create} disabled={saving || !form.service_category}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
                                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)', opacity: (saving || !form.service_category) ? 0.5 : 1 }}>
                                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : 'Create Deal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
