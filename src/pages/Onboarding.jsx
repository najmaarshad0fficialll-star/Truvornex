import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/lib/ThemeContext';
import {
    User, Briefcase, ArrowRight, Cpu, CheckCircle2,
    Star, Shield, Zap, Globe, Sparkles, ChevronRight,
} from 'lucide-react';

const CUSTOMER_PERKS = [
    { icon: Star,    text: 'AI-powered service recommendations by Simon' },
    { icon: Zap,     text: 'Real-time neighborhood demand intelligence'   },
    { icon: Shield,  text: 'Group bundle deals — save up to 35%'         },
    { icon: Globe,   text: 'Instant booking with verified providers'      },
    { icon: Sparkles,text: 'Predictive maintenance scheduling'            },
];

const PROVIDER_PERKS = [
    { icon: Cpu,     text: 'AI Copilot to manage bookings & revenue'     },
    { icon: Zap,     text: 'Intelligent customer matching & routing'      },
    { icon: Star,    text: 'Automated scheduling & calendar sync'         },
    { icon: Shield,  text: 'Real-time earnings analytics dashboard'       },
    { icon: Globe,   text: 'Priority placement in neighborhood searches'  },
];

export default function Onboarding() {
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t); }, []);
    const anim = (d = 0) => ({
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: `opacity 0.5s cubic-bezier(0.19,1,0.22,1) ${d}s, transform 0.5s cubic-bezier(0.19,1,0.22,1) ${d}s`,
        willChange: 'opacity, transform',
    });

    const confirm = async () => {
        if (!selected) return;
        setLoading(true);
        setTimeout(() => navigate(selected === 'provider' ? '/provider' : '/'), 600);
    };

    const cardBase = {
        borderRadius: 20,
        padding: '20px',
        border: '1.5px solid var(--color-border-strong)',
        backgroundColor: 'var(--color-surface)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.22s cubic-bezier(0.25,1,0.5,1)',
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
    };

    const cardSelected = {
        ...cardBase,
        backgroundColor: 'var(--color-primary)',
        borderColor: 'var(--color-primary)',
        boxShadow: isDark
            ? '0 0 0 1px rgba(255,255,255,0.2), 0 8px 32px rgba(255,255,255,0.12)'
            : '0 0 0 1px rgba(0,0,0,0.15), 0 8px 32px rgba(0,0,0,0.15)',
    };

    const cardUnselected = {
        ...cardBase,
        boxShadow: 'var(--shadow-sm)',
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden"
            style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>

            {/* Background grid */}
            <div className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'} 1px, transparent 1px)`,
                    backgroundSize: '48px 48px',
                }} />

            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
                style={{
                    width: 600, height: 300,
                    background: isDark
                        ? 'radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 70%)'
                        : 'radial-gradient(ellipse, rgba(0,0,0,0.03) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                }} />

            <div className="relative z-10 w-full max-w-xl">

                {/* Header */}
                <div className="text-center mb-8">
                    {/* Simon pill */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-5"
                        style={{
                            ...anim(0),
                            fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                            backgroundColor: 'var(--color-surface-high)',
                            color: 'var(--color-text-subtle)',
                            border: '1px solid var(--color-border-strong)',
                        }}>
                        <Cpu style={{ width: 9, height: 9 }} />
                        Simon AI · Welcome
                    </div>

                    <h1 className="font-black mb-3"
                        style={{ ...anim(0.05), fontSize: 'clamp(1.6rem, 6vw, 2.4rem)', letterSpacing: '-0.04em', lineHeight: 1.1, color: 'var(--color-primary)' }}>
                        How will you use<br />
                        <span className="hero-gradient-text">Truvornex?</span>
                    </h1>
                    <p style={{ ...anim(0.09), fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                        Simon will personalise your entire experience based on your role.
                    </p>
                </div>

                {/* Role cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">

                    {/* Customer card */}
                    <button
                        onClick={() => setSelected('customer')}
                        style={{ ...(selected === 'customer' ? cardSelected : cardUnselected), ...anim(0.14) }}
                        onMouseEnter={e => { if (selected !== 'customer') { e.currentTarget.style.borderColor = 'var(--color-border-accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'; } }}
                        onMouseLeave={e => { if (selected !== 'customer') { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; } }}>

                        {/* Subtle corner glow when selected */}
                        {selected === 'customer' && (
                            <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
                                style={{ background: 'radial-gradient(circle at top right, rgba(0,0,0,0.12) 0%, transparent 70%)' }} />
                        )}

                        {/* Selected check */}
                        {selected === 'customer' && (
                            <div className="absolute top-3 right-3">
                                <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--color-on-primary)' }} />
                            </div>
                        )}

                        {/* Icon */}
                        <div className="flex items-center justify-center rounded-xl mb-3"
                            style={{
                                width: 40, height: 40,
                                backgroundColor: selected === 'customer' ? 'rgba(0,0,0,0.15)' : 'var(--color-surface-high)',
                                border: `1px solid ${selected === 'customer' ? 'rgba(0,0,0,0.1)' : 'var(--color-border)'}`,
                            }}>
                            <User style={{ width: 18, height: 18, color: selected === 'customer' ? 'var(--color-on-primary)' : 'var(--color-text-muted)' }} />
                        </div>

                        <div className="mb-1" style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: selected === 'customer' ? 'var(--color-on-primary)' : 'var(--color-primary)' }}>Customer</div>
                        <div className="mb-3" style={{ fontSize: 11, color: selected === 'customer' ? 'rgba(0,0,0,0.5)' : 'var(--color-text-muted)', ...(isDark && selected === 'customer' ? { color: 'rgba(255,255,255,0.55)' } : {}) }}>
                            Book local services with AI guidance
                        </div>

                        <ul className="space-y-2">
                            {CUSTOMER_PERKS.map(({ icon: Icon, text }, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                    <div style={{
                                        width: 18, height: 18, borderRadius: 6, flexShrink: 0, marginTop: 1,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: selected === 'customer'
                                            ? 'rgba(0,0,0,0.18)'
                                            : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                                    }}>
                                        <Icon style={{ width: 10, height: 10, color: selected === 'customer' ? 'var(--color-on-primary)' : 'var(--color-text)' }} />
                                    </div>
                                    <span style={{
                                        fontSize: 11, lineHeight: 1.5, flex: 1,
                                        color: selected === 'customer'
                                            ? (isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)')
                                            : (isDark ? 'rgba(255,255,255,0.70)' : 'rgba(0,0,0,0.65)'),
                                    }}>{text}</span>
                                </li>
                            ))}
                        </ul>
                    </button>

                    {/* Provider card */}
                    <button
                        onClick={() => setSelected('provider')}
                        style={{ ...(selected === 'provider' ? cardSelected : cardUnselected), ...anim(0.19) }}
                        onMouseEnter={e => { if (selected !== 'provider') { e.currentTarget.style.borderColor = 'var(--color-border-accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'; } }}
                        onMouseLeave={e => { if (selected !== 'provider') { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; } }}>

                        {selected === 'provider' && (
                            <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
                                style={{ background: 'radial-gradient(circle at top right, rgba(0,0,0,0.12) 0%, transparent 70%)' }} />
                        )}

                        {selected === 'provider' && (
                            <div className="absolute top-3 right-3">
                                <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--color-on-primary)' }} />
                            </div>
                        )}

                        <div className="flex items-center justify-center rounded-xl mb-3"
                            style={{
                                width: 40, height: 40,
                                backgroundColor: selected === 'provider' ? 'rgba(0,0,0,0.15)' : 'var(--color-surface-high)',
                                border: `1px solid ${selected === 'provider' ? 'rgba(0,0,0,0.1)' : 'var(--color-border)'}`,
                            }}>
                            <Briefcase style={{ width: 18, height: 18, color: selected === 'provider' ? 'var(--color-on-primary)' : 'var(--color-text-muted)' }} />
                        </div>

                        <div className="mb-1" style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: selected === 'provider' ? 'var(--color-on-primary)' : 'var(--color-primary)' }}>Provider</div>
                        <div className="mb-3" style={{ fontSize: 11, color: selected === 'provider' ? (isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)') : 'var(--color-text-muted)' }}>
                            Offer services, managed by AI
                        </div>

                        <ul className="space-y-2">
                            {PROVIDER_PERKS.map(({ icon: Icon, text }, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                    <div style={{
                                        width: 18, height: 18, borderRadius: 6, flexShrink: 0, marginTop: 1,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: selected === 'provider'
                                            ? 'rgba(0,0,0,0.18)'
                                            : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                                    }}>
                                        <Icon style={{ width: 10, height: 10, color: selected === 'provider' ? 'var(--color-on-primary)' : 'var(--color-text)' }} />
                                    </div>
                                    <span style={{
                                        fontSize: 11, lineHeight: 1.5, flex: 1,
                                        color: selected === 'provider'
                                            ? (isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)')
                                            : (isDark ? 'rgba(255,255,255,0.70)' : 'rgba(0,0,0,0.65)'),
                                    }}>{text}</span>
                                </li>
                            ))}
                        </ul>
                    </button>
                </div>

                {/* CTA */}
                <button
                    onClick={confirm}
                    disabled={!selected || loading}
                    style={{
                        ...anim(0.24),
                        width: '100%', height: 48, borderRadius: 14, fontSize: 13, fontWeight: 600,
                        letterSpacing: '-0.01em', border: 'none', cursor: selected ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'all 0.2s cubic-bezier(0.25,1,0.5,1)',
                        backgroundColor: selected ? 'var(--color-primary)' : 'var(--color-surface-high)',
                        color: selected ? 'var(--color-on-primary)' : 'var(--color-text-subtle)',
                        boxShadow: selected ? (isDark ? '0 4px 20px rgba(255,255,255,0.12)' : '0 4px 20px rgba(0,0,0,0.15)') : 'none',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseEnter={e => { if (selected) { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    {loading ? (
                        <>
                            <Cpu style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                            Simon is setting up your experience…
                        </>
                    ) : (
                        <>
                            Continue to Truvornex
                            <ArrowRight style={{ width: 14, height: 14 }} />
                        </>
                    )}
                </button>

                {/* Footer trust row */}
                <div className="flex items-center justify-center gap-4 mt-5 flex-wrap" style={anim(0.3)}>
                    {[
                        { icon: Shield,  label: 'Secure & private'   },
                        { icon: Globe,   label: 'Switch roles anytime'},
                        { icon: Cpu,     label: 'Powered by Simon AI' },
                    ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-1"
                            style={{ fontSize: 10, color: 'var(--color-text-subtle)' }}>
                            <Icon style={{ width: 10, height: 10 }} />
                            {label}
                        </div>
                    ))}
                </div>

                {/* Back link */}
                <div className="text-center mt-4">
                    <button onClick={() => navigate('/')}
                        style={{ fontSize: 11, color: 'var(--color-text-subtle)', background: 'none', border: 'none', cursor: 'pointer', touchAction: 'manipulation' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-subtle)'}>
                        ← Back to home
                    </button>
                </div>
            </div>
        </div>
    );
}
