import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Zap, ArrowRight, Loader2, CheckCircle, Building2, Home, Handshake, Rocket, Shield, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const SLIDES = [
    {
        id: 0,
        badge: 'Welcome',
        title: 'Your Neighborhood\nOS Has Arrived',
        subtitle: 'Connecting you with trusted local service providers, powered by Simon AI.',
        Visual: Building2,
        accentChar: '01',
        stats: [
            { value: '2,400+', label: 'Providers' },
            { value: '4.9★',   label: 'Avg Rating' },
            { value: '15K+',   label: 'Jobs Done'  },
        ],
    },
    {
        id: 1,
        badge: 'What It Is',
        title: 'One App for\nEvery Home Need',
        subtitle: 'From emergency plumbing at 2am to weekly cleaning — book any local service in 60 seconds.',
        Visual: Home,
        accentChar: '02',
        stats: [
            { value: '60s',  label: 'Avg Booking' },
            { value: '24/7', label: 'Available'   },
            { value: '98%',  label: 'On-Time'     },
        ],
    },
    {
        id: 2,
        badge: 'Why It Exists',
        title: 'Community-First\nService Platform',
        subtitle: "Finding trustworthy help shouldn't take hours of Googling. We built the solution.",
        Visual: Handshake,
        accentChar: '03',
        stats: [
            { value: '35%',   label: 'Avg Savings'    },
            { value: '1,200+',label: 'Neighborhoods'  },
            { value: '100%',  label: 'Insured'        },
        ],
    },
    {
        id: 3,
        badge: 'Get Started',
        title: 'Ready to Transform\nYour Neighborhood?',
        subtitle: 'Join 2,400+ households already using Truvornex. Takes only 30 seconds.',
        Visual: Rocket,
        accentChar: '04',
        stats: [
            { value: 'Free', label: 'To Join'    },
            { value: '30s',  label: 'Setup Time' },
            { value: '₦0',   label: 'Hidden Fees'},
        ],
    },
];

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/';
    const { user, checkUserAuth } = useAuth();

    const [tab, setTab] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('customer');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [current, setCurrent] = useState(0);
    const [animating, setAnimating] = useState(false);
    const [exitDir, setExitDir] = useState(1);
    const timerRef = useRef(null);

    const goTo = (idx) => {
        if (idx === current || idx < 0 || idx >= SLIDES.length || animating) return;
        setExitDir(idx > current ? 1 : -1);
        setAnimating(true);
        setTimeout(() => { setCurrent(idx); setAnimating(false); }, 320);
    };

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setExitDir(1);
            setAnimating(true);
            setTimeout(() => {
                setCurrent(prev => (prev + 1) % SLIDES.length);
                setAnimating(false);
            }, 320);
        }, 4000);
        return () => clearInterval(timerRef.current);
    }, []);

    useEffect(() => {
        if (user) navigate(from, { replace: true });
    }, [user, navigate, from]);

    useEffect(() => { setError(''); setSuccess(''); }, [tab]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (tab === 'login') {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email, password }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Login failed');
                await checkUserAuth();
                navigate(from, { replace: true });
            } else {
                if (!fullName.trim()) { setError('Please enter your full name.'); setLoading(false); return; }
                const res = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email, password, fullName: fullName.trim(), role }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Signup failed');
                setSuccess('Account created! You can now sign in.');
                setTab('login');
            }
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        }
        setLoading(false);
    };

    const slide = SLIDES[current];
    const VisualIcon = slide.Visual;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--color-bg)' }}>

            {/* ── Left Panel — Premium Editorial Carousel ── */}
            <div className="hidden lg:flex lg:w-[52%]" style={{
                position: 'relative',
                overflow: 'hidden',
                flexDirection: 'column',
            }}>
                {/* Atmospheric background layers */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #07070d 0%, #050508 45%, #080706 100%)' }} />

                {/* Fine grid */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)',
                    backgroundSize: '56px 56px',
                    pointerEvents: 'none',
                }} />

                {/* Warm top glow — gold/champagne undertone */}
                <div style={{
                    position: 'absolute',
                    top: -200, left: '40%', transform: 'translateX(-50%)',
                    width: 750, height: 600,
                    background: 'radial-gradient(ellipse, rgba(255,240,200,0.045) 0%, transparent 62%)',
                    pointerEvents: 'none',
                }} />

                {/* Subtle bottom right glow */}
                <div style={{
                    position: 'absolute',
                    bottom: -120, right: -80,
                    width: 500, height: 450,
                    background: 'radial-gradient(ellipse, rgba(180,160,255,0.025) 0%, transparent 65%)',
                    pointerEvents: 'none',
                }} />

                {/* Left edge accent line */}
                <div style={{
                    position: 'absolute',
                    left: 0, top: '12%', bottom: '12%', width: 1,
                    background: 'linear-gradient(to bottom, transparent, rgba(255,220,160,0.15) 35%, rgba(255,220,160,0.15) 65%, transparent)',
                    pointerEvents: 'none',
                }} />

                {/* Giant watermark number */}
                <div style={{
                    position: 'absolute',
                    bottom: 60, right: -14,
                    fontSize: 180,
                    fontWeight: 900,
                    color: 'rgba(255,255,255,0.018)',
                    letterSpacing: '-0.06em',
                    lineHeight: 1,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    pointerEvents: 'none',
                    userSelect: 'none',
                    transition: 'all 0.5s ease',
                }}>
                    {slide.accentChar}
                </div>

                {/* Logo */}
                <div style={{ position: 'relative', zIndex: 10, padding: '36px 44px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            height: 34, width: 34, borderRadius: 10, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,220,160,0.15)',
                        }}>
                            <Zap style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.8)' }} />
                        </div>
                        <div>
                            <div style={{
                                fontWeight: 700, fontSize: 12,
                                letterSpacing: '0.14em', color: 'rgba(255,255,255,0.88)',
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                textTransform: 'uppercase',
                            }}>Truvornex</div>
                            <div style={{
                                fontSize: 8.5, letterSpacing: '0.22em',
                                color: 'rgba(255,220,160,0.35)', textTransform: 'uppercase',
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                            }}>Service Platform</div>
                        </div>
                    </div>
                </div>

                {/* Slide content */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    padding: '0 52px', position: 'relative', zIndex: 10,
                }}>
                    <div style={{
                        width: '100%', maxWidth: 360,
                        opacity: animating ? 0 : 1,
                        transform: animating
                            ? `translateX(${exitDir > 0 ? '-44px' : '44px'})`
                            : 'translateX(0)',
                        transition: 'opacity 0.32s cubic-bezier(0.4,0,0.2,1), transform 0.32s cubic-bezier(0.19,1,0.22,1)',
                    }}>

                        {/* Icon — large, dramatic, with two spinning rings */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    position: 'absolute', inset: -22,
                                    borderRadius: '50%',
                                    border: '1px dashed rgba(255,220,160,0.08)',
                                    animation: 'lrSpin1 28s linear infinite',
                                }} />
                                <div style={{
                                    position: 'absolute', inset: -10,
                                    borderRadius: 36,
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    animation: 'lrSpin1 18s linear infinite reverse',
                                }} />
                                <div style={{
                                    width: 92, height: 92, borderRadius: 30,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'linear-gradient(148deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                                    border: '1px solid rgba(255,220,160,0.14)',
                                    boxShadow: '0 0 48px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.1)',
                                }}>
                                    <VisualIcon style={{ width: 38, height: 38, color: 'rgba(255,255,255,0.88)', strokeWidth: 1.25 }} />
                                </div>
                            </div>
                        </div>

                        {/* Editorial rule + badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
                            <div style={{
                                flex: 1, height: 1,
                                background: 'linear-gradient(to right, transparent, rgba(255,220,160,0.18))',
                            }} />
                            <span style={{
                                fontSize: 8.5, fontWeight: 700, letterSpacing: '0.24em',
                                textTransform: 'uppercase', color: 'rgba(255,220,160,0.45)',
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                whiteSpace: 'nowrap',
                            }}>
                                {slide.badge}
                            </span>
                            <div style={{
                                flex: 1, height: 1,
                                background: 'linear-gradient(to left, transparent, rgba(255,220,160,0.18))',
                            }} />
                        </div>

                        {/* Headline */}
                        <h1 style={{
                            fontSize: 'clamp(1.9rem, 3.6vw, 2.65rem)',
                            fontWeight: 800,
                            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                            letterSpacing: '-0.045em',
                            lineHeight: 1.04,
                            color: '#ffffff',
                            textAlign: 'center',
                            marginBottom: 16,
                            whiteSpace: 'pre-line',
                        }}>
                            {slide.title}
                        </h1>

                        {/* Subtitle */}
                        <p style={{
                            fontSize: 12,
                            lineHeight: 1.78,
                            color: 'rgba(255,255,255,0.36)',
                            textAlign: 'center',
                            margin: '0 auto 32px',
                            maxWidth: 280,
                            letterSpacing: '-0.003em',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}>
                            {slide.subtitle}
                        </p>

                        {/* Stats row — editorial stats instead of bullet rows */}
                        <div style={{
                            display: 'flex',
                            border: '1px solid rgba(255,220,160,0.08)',
                            borderRadius: 18,
                            overflow: 'hidden',
                            background: 'rgba(255,255,255,0.018)',
                            backdropFilter: 'blur(8px)',
                        }}>
                            {slide.stats.map(({ value, label }, i) => (
                                <div key={i} style={{
                                    flex: 1,
                                    padding: '15px 6px',
                                    textAlign: 'center',
                                    borderRight: i < slide.stats.length - 1
                                        ? '1px solid rgba(255,220,160,0.08)'
                                        : 'none',
                                }}>
                                    <div style={{
                                        fontSize: 17, fontWeight: 800,
                                        color: '#ffffff',
                                        letterSpacing: '-0.04em',
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                        lineHeight: 1.1,
                                    }}>
                                        {value}
                                    </div>
                                    <div style={{
                                        fontSize: 8.5, color: 'rgba(255,220,160,0.35)',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase', marginTop: 5,
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    }}>
                                        {label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom — dots + Simon status */}
                <div style={{ position: 'relative', zIndex: 10, padding: '0 44px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {SLIDES.map((_, i) => (
                            <button key={i} onClick={() => goTo(i)} style={{
                                height: 3,
                                width: i === current ? 26 : 3,
                                borderRadius: 999, border: 'none', cursor: 'pointer', padding: 0,
                                background: i === current
                                    ? 'rgba(255,220,160,0.8)'
                                    : i < current
                                        ? 'rgba(255,220,160,0.22)'
                                        : 'rgba(255,255,255,0.08)',
                                transition: 'all 0.45s cubic-bezier(0.19,1,0.22,1)',
                                boxShadow: i === current ? '0 0 10px rgba(255,200,100,0.3)' : 'none',
                            }} />
                        ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 5, height: 5, borderRadius: '50%',
                            background: '#22c55e',
                            boxShadow: '0 0 8px rgba(34,197,94,0.55)',
                            animation: 'pulse 2s ease-in-out infinite',
                        }} />
                        <span style={{
                            fontSize: 8.5, letterSpacing: '0.2em',
                            textTransform: 'uppercase', color: 'rgba(255,255,255,0.24)',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}>
                            Simon AI · Online
                        </span>
                    </div>
                </div>

                <style>{`
                    @keyframes lrSpin1 { to { transform: rotate(360deg); } }
                `}</style>
            </div>

            {/* ── Right Panel — Sign In / Sign Up Form ── */}
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px 20px',
                backgroundColor: 'var(--color-bg)',
            }} className="lg:p-12">
                <div style={{ width: '100%', maxWidth: 400 }}>

                    {/* Mobile logo */}
                    <div className="flex items-center gap-3 mb-7 lg:hidden">
                        <div style={{
                            height: 34, width: 34, borderRadius: 10,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--color-border-strong)',
                        }}>
                            <Zap style={{ width: 15, height: 15, color: 'var(--color-primary)' }} />
                        </div>
                        <span style={{ fontWeight: 700, letterSpacing: '0.1em', fontSize: 13, color: 'var(--color-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif", textTransform: 'uppercase' }}>Truvornex</span>
                    </div>

                    {/* Title */}
                    <div style={{ marginBottom: 28 }}>
                        <h2 style={{
                            fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em',
                            color: 'var(--color-primary)', marginBottom: 6,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}>
                            {tab === 'login' ? 'Welcome back' : 'Create account'}
                        </h2>
                        <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', letterSpacing: '-0.005em' }}>
                            {tab === 'login'
                                ? 'Sign in to access your services and Simon AI'
                                : 'Join 2,400+ users on Truvornex today'}
                        </p>
                    </div>

                    {/* Tab toggle */}
                    <div style={{
                        display: 'flex', borderRadius: 12, padding: 4, marginBottom: 24,
                        background: 'var(--color-surface-high)', gap: 4,
                    }}>
                        {['login', 'signup'].map(t => (
                            <button key={t} onClick={() => setTab(t)} style={{
                                flex: 1, padding: '9px 0', fontSize: 12.5,
                                fontWeight: 600, borderRadius: 9, border: 'none',
                                cursor: 'pointer', transition: 'all 0.2s ease',
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                ...(tab === t
                                    ? { background: 'var(--color-surface)', color: 'var(--color-primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }
                                    : { background: 'transparent', color: 'var(--color-text-subtle)' }),
                            }}>
                                {t === 'login' ? 'Sign In' : 'Sign Up'}
                            </button>
                        ))}
                    </div>

                    {/* Success */}
                    {success && (
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            padding: '12px 14px', borderRadius: 12, marginBottom: 18,
                            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)',
                        }}>
                            <CheckCircle style={{ width: 14, height: 14, marginTop: 1, flexShrink: 0, color: 'var(--color-success)' }} />
                            <p style={{ fontSize: 12, color: 'var(--color-success)' }}>{success}</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div style={{
                            padding: '12px 14px', borderRadius: 12, marginBottom: 18,
                            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)',
                            fontSize: 12, color: 'var(--color-error)',
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {tab === 'signup' && (
                            <div>
                                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Full Name</label>
                                <input
                                    type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                                    placeholder="Alex Johnson" required={tab === 'signup'}
                                    style={{
                                        width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 13,
                                        outline: 'none', transition: 'border-color 0.2s',
                                        background: 'var(--color-surface)',
                                        border: '1px solid var(--color-border-strong)',
                                        color: 'var(--color-primary)',
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--color-border-strong)'}
                                />
                            </div>
                        )}
                        {tab === 'signup' && (
                            <div>
                                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>I am a</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {['customer', 'provider'].map(r => (
                                        <button key={r} type="button" onClick={() => setRole(r)} style={{
                                            flex: 1, padding: '10px 0', fontSize: 12.5, fontWeight: 600,
                                            borderRadius: 12, border: 'none', cursor: 'pointer',
                                            textTransform: 'capitalize', transition: 'all 0.2s',
                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                            ...(role === r
                                                ? { background: 'var(--color-primary)', color: 'var(--color-on-primary)' }
                                                : { background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', color: 'var(--color-text-muted)' }),
                                        }}>
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Email</label>
                            <input
                                type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com" required
                                style={{
                                    width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 13,
                                    outline: 'none', transition: 'border-color 0.2s',
                                    background: 'var(--color-surface)',
                                    border: '1px solid var(--color-border-strong)',
                                    color: 'var(--color-primary)',
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                                onBlur={e => e.target.style.borderColor = 'var(--color-border-strong)'}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPw ? 'text' : 'password'} value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder={tab === 'signup' ? 'Min. 6 characters' : '••••••••'} required minLength={6}
                                    style={{
                                        width: '100%', padding: '11px 44px 11px 14px', borderRadius: 12, fontSize: 13,
                                        outline: 'none', transition: 'border-color 0.2s',
                                        background: 'var(--color-surface)',
                                        border: '1px solid var(--color-border-strong)',
                                        color: 'var(--color-primary)',
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--color-border-strong)'}
                                />
                                <button type="button" onClick={() => setShowPw(s => !s)} style={{
                                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                                    color: 'var(--color-text-muted)',
                                }}>
                                    {showPw
                                        ? <EyeOff style={{ width: 15, height: 15 }} />
                                        : <Eye style={{ width: 15, height: 15 }} />}
                                </button>
                            </div>
                        </div>

                        {tab === 'login' && (
                            <div style={{ textAlign: 'right', marginTop: -6 }}>
                                <button type="button" style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontSize: 11.5, color: 'var(--color-text-muted)',
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    letterSpacing: '-0.005em',
                                }}>
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        <button type="submit" disabled={loading} style={{
                            width: '100%', padding: '13px 0', marginTop: 4,
                            borderRadius: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            background: 'var(--color-primary)', color: 'var(--color-on-primary)',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 14px rgba(0,0,0,0.3)',
                        }}>
                            {loading
                                ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                                : <>{tab === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight style={{ width: 15, height: 15 }} /></>
                            }
                        </button>
                    </form>

                    {/* Switch tab link */}
                    <p style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {tab === 'login' ? "Don't have an account? " : "Already have an account? "}
                        <button onClick={() => setTab(tab === 'login' ? 'signup' : 'login')} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 12, fontWeight: 700, color: 'var(--color-primary)',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}>
                            {tab === 'login' ? 'Sign up free' : 'Sign in'}
                        </button>
                    </p>

                    {/* Browse as guest */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 0' }}>
                        <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                        <span style={{ fontSize: 10.5, color: 'var(--color-text-subtle)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>or</span>
                        <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                    </div>
                    <button
                        onClick={() => navigate('/services')}
                        style={{
                            width: '100%', marginTop: 12, padding: '11px 0',
                            borderRadius: 14, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            fontSize: 12.5, fontWeight: 600, letterSpacing: '-0.005em',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            background: 'transparent',
                            border: '1px solid var(--color-border-strong)',
                            color: 'var(--color-text-muted)',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-accent)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                    >
                        Browse as guest <ChevronRight style={{ width: 13, height: 13 }} />
                    </button>

                    <p style={{ textAlign: 'center', marginTop: 22, fontSize: 10.5, color: 'var(--color-text-subtle)', lineHeight: 1.6 }}>
                        By continuing you agree to our Terms of Service and Privacy Policy.<br />
                        Powered by Simon AI · Truvornex © 2026
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
}
