import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Calendar, Download, Brain, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays } from 'date-fns';
import { simonRevenueIntelligence, simonStatus } from '@/lib/ai/simon';
import ReactMarkdown from 'react-markdown';

const PERIOD_OPTIONS = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '12m', label: 'Last 12 months' },
];

const useChartColors = () => ({
    accent:  getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#7c6fcd',
    success: getComputedStyle(document.documentElement).getPropertyValue('--color-success').trim() || '#22c55e',
    error:   getComputedStyle(document.documentElement).getPropertyValue('--color-error').trim() || '#ef4444',
    grid:    getComputedStyle(document.documentElement).getPropertyValue('--chart-grid').trim() || 'rgba(128,128,128,0.1)',
    text:    getComputedStyle(document.documentElement).getPropertyValue('--color-text-subtle').trim() || '#6b6f82',
});

const PIE_COLORS = ['#7c6fcd', '#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

export default function FinancialDashboard() {
    const [bookings, setBookings] = useState([]);
    const [period, setPeriod] = useState('30d');
    const [loading, setLoading] = useState(false);
    const [simonInsight, setSimonInsight] = useState('');
    const [simonLoading, setSimonLoading] = useState(false);
    const colors = useChartColors();

    const tooltipStyle = {
        contentStyle: {
            backgroundColor: 'var(--color-surface-high)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            color: 'var(--color-text)',
            fontSize: 12,
        },
    };

    const metrics = useMemo(() => {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
        const cutoff = format(subDays(new Date(), days), 'yyyy-MM-dd');
        const filtered = bookings.filter(b => b.date >= cutoff);
        const completed = filtered.filter(b => b.status === 'completed');
        const totalRevenue = completed.reduce((s, b) => s + (b.price || 0), 0);
        const avgBookingValue = completed.length ? totalRevenue / completed.length : 0;

        const daily = {};
        for (let i = Math.min(days, 30) - 1; i >= 0; i--) {
            const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
            daily[d] = { date: format(subDays(new Date(), i), 'MMM d'), revenue: 0, bookings: 0 };
        }
        completed.forEach(b => {
            if (daily[b.date]) { daily[b.date].revenue += (b.price || 0); daily[b.date].bookings++; }
        });

        const catMap = {};
        completed.forEach(b => {
            const cat = b.service_name?.split(' ')[0] || 'Other';
            catMap[cat] = (catMap[cat] || 0) + (b.price || 0);
        });
        const catData = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));

        return { totalRevenue, avgBookingValue, totalBookings: filtered.length, completedCount: completed.length, dailyData: Object.values(daily), catData };
    }, [bookings, period]);

    const runSimonRevenue = async () => {
        if (!simonStatus().configured) {
            setSimonInsight('**Simon AI not configured.** Add `DEEPSEEK_API_KEY` to your environment variables to get AI revenue intelligence.');
            return;
        }
        setSimonLoading(true);
        setSimonInsight('');
        try {
            await simonRevenueIntelligence({
                period,
                totalRevenue: metrics.totalRevenue,
                avgBookingValue: metrics.avgBookingValue,
                totalBookings: metrics.totalBookings,
                completedCount: metrics.completedCount,
                completionRate: metrics.totalBookings > 0 ? (metrics.completedCount / metrics.totalBookings * 100).toFixed(1) : 0,
                categoryBreakdown: metrics.catData,
            }, (delta) => setSimonInsight(prev => prev + delta));
        } catch (e) {
            setSimonInsight('Error generating revenue intelligence.');
        }
        setSimonLoading(false);
    };

    const kpis = [
        { label: 'Total Revenue', value: `$${metrics.totalRevenue.toLocaleString()}`, icon: DollarSign, up: true, delta: '+12%' },
        { label: 'Avg Booking Value', value: `$${metrics.avgBookingValue.toFixed(0)}`, icon: CreditCard, up: true, delta: '+3%' },
        { label: 'Total Bookings', value: metrics.totalBookings, icon: Calendar, up: true, delta: '+8%' },
        {
            label: 'Completion Rate',
            value: metrics.totalBookings ? `${Math.round(metrics.completedCount / metrics.totalBookings * 100)}%` : '0%',
            icon: TrendingUp, up: false, delta: '-2%'
        },
    ];

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="font-black text-2xl tracking-tight" style={{ color: 'var(--color-text)' }}>Financial Dashboard</h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-subtle)' }}>Revenue analytics and financial overview</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="rounded-xl w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {PERIOD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="rounded-xl gap-2">
                        <Download className="h-4 w-4" /> Export
                    </Button>
                    <Button className="rounded-xl gap-2" onClick={runSimonRevenue} disabled={simonLoading}
                        style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}>
                        {simonLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                        AI Insights
                    </Button>
                </div>
            </div>

            {/* Simon Intelligence */}
            {simonInsight && (
                <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="flex items-center gap-2 mb-3">
                        <Brain className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
                        <span className="font-bold text-sm" style={{ color: 'var(--color-accent)' }}>Simon's Revenue Intelligence</span>
                    </div>
                    <div className="prose prose-sm max-w-none" style={{ color: 'var(--color-text)' }}>
                        <ReactMarkdown>{simonInsight}</ReactMarkdown>
                    </div>
                </div>
            )}

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(k => (
                    <div key={k.label} className="card-premium p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-subtle)' }}>{k.label}</span>
                            <k.icon className="h-4 w-4" style={{ color: 'var(--color-text-subtle)' }} />
                        </div>
                        <p className="font-black text-3xl" style={{ color: 'var(--color-text)' }}>{k.value}</p>
                        <p className="text-xs mt-1.5 font-semibold flex items-center gap-1"
                            style={{ color: k.up ? 'var(--color-success)' : 'var(--color-error)' }}>
                            {k.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {k.delta} vs prev period
                        </p>
                    </div>
                ))}
            </div>

            {/* Revenue over time */}
            <div className="card-premium p-5">
                <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>Revenue Over Time</h2>
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={metrics.dailyData}>
                        <defs>
                            <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors.accent} stopOpacity={0.25} />
                                <stop offset="95%" stopColor={colors.accent} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.text }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10, fill: colors.text }} />
                        <Tooltip {...tooltipStyle} formatter={(v) => [`$${v}`, 'Revenue']} />
                        <Area type="monotone" dataKey="revenue" stroke={colors.accent} strokeWidth={2} fill="url(#revGrad2)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="card-premium p-5">
                    <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>Daily Bookings</h2>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={metrics.dailyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.text }} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 10, fill: colors.text }} allowDecimals={false} />
                            <Tooltip {...tooltipStyle} />
                            <Bar dataKey="bookings" fill={colors.accent} radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="card-premium p-5">
                    <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>Revenue by Category</h2>
                    {metrics.catData.length === 0 ? (
                        <div className="h-40 flex items-center justify-center text-sm" style={{ color: 'var(--color-text-subtle)' }}>
                            No completed bookings yet
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie data={metrics.catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                                    {metrics.catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip {...tooltipStyle} formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}
