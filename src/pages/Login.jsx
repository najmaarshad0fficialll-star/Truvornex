import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Zap, ArrowRight, Loader2, CheckCircle, Building2, Home, Handshake, Rocket, Shield, Clock, MapPin, Star, Users, Globe, Sparkles, CheckCircle2, Briefcase, Cpu } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const SLIDES = [
    {
        id: 0,
        badge: 'Welcome',
        title: 'Your Neighborhood\nOS Has Arrived',
        subtitle: 'Truvornex connects you with trusted local service providers — powered by Simon AI, built for your community.',
        Visual: Building2,
        accentChar: '01',
        features: [
            { icon: Zap,    text: '2,400+ verified providers in your area' },
            { icon: Shield, text: 'Every booking is insured & guaranteed'  },
            { icon: Cpu,    text: 'Simon AI personalises your experience'  },
        ],
    },
    {
        id: 1,
        badge: 'What It Is',
        title: 'One App for\nEvery Home Need',
        subtitle: 'From emergency plumbing at 2am to weekly cleaning — book any local service in 60 seconds, 24/7.',
        Visual: Home,
        accentChar: '02',
        features: [
            { icon: Clock,  text: 'Same-day & emergency bookings'      },
            { icon: MapPin, text: 'Hyperlocal providers in your street' },
            { icon: Star,   text: '4.9 avg across 15,000+ reviews'     },
        ],
    },
    {
        id: 2,
        badge: 'Why It Exists',
        title: 'Community-First\nService Platform',
        subtitle: "We built Truvornex because finding trustworthy help shouldn't take hours of Googling, calling, and hoping.",
        Visual: Handshake,
        accentChar: '03',
        features: [
            { icon: Users,    text: 'Neighbors vouching for every provider' },
            { icon: Globe,    text: 'Group buy deals — save up to 35%'       },
            { icon: Sparkles, text: 'Skill swaps & community time credits'  },
        ],
    },
    {
        id: 3,
        badge: 'Get Started',
        title: 'Ready to Transform\nYour Neighborhood?',
        subtitle: 'Join 2,400+ households already using Truvornex. It only takes 30 seconds to get started.',
        Visual: Rocket,
        accentChar: '04',
        features: [
            { icon: CheckCircle2, text: 'Free to join — no hidden fees'   },
            { icon: Briefcase,    text: 'Providers earn more, stress less' },
            { icon: Shield,       text: 'Your data is always private'      },
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
        setTimeout(() => { setCurrent(idx); setAnimating(false); }, 300);
    };

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setExitDir(1);
            setAnimating(true);
            setTimeout(() => {
                setCurrent(prev => (prev + 1) % SLIDES.length);
                setAnimating(false);
            }, 300);
        }, 3500);
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
        <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-bg)' }}>
            {/* Left panel — full-slide carousel (desktop only) */}
            <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col"
                style={{ background: 'linear-gradient(135deg, #080808 0%, #0d0d14 50%, #0a0a10 100%)' }}>

                {/* Atmospheric background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                    }} />
                    <div style={{
                        position: 'absolute',
                        top: -100, left: '50%', transform: 'translateX(-50%)',
                        width: 600, height: 500,
                        background: 'radial-gradient(ellipse, rgba(255,255,255,0.05) 0%, transparent 65%)',
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: -60, left: '50%', transform: 'translateX(-50%)',
                        width: 500, height: 300,
                        background: 'radial-gradient(ellipse, rgba(255,255,255,0.025) 0%, transparent 70%)',
                    }} />
                </div>

                {/* Slide number watermark */}
                <div style={{
                    position: 'absolute',
                    top: '50%', right: 20,
                    transform: 'translateY(-50%)',
                    fontSize: 80,
                    fontWeight: 900,
                    color: 'rgba(255,255,255,0.025)',
                    letterSpacing: '-0.06em',
                    lineHeight: 1,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    pointerEvents: 'none',
                    userSelect: 'none',
                    transition: 'all 0.4s ease',
                }}>
                    {slide.accentChar}
                </div>

                {/* Logo */}
                <div className="relative z-10 p-10 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                            <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div className="font-bold text-lg tracking-tight text-white">TRUVORNEX</div>
                            <div className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>Service Platform</div>
                        </div>
                    </div>
                </div>

                {/* Slide content */}
                <div className="flex-1 flex items-center justify-center px-10 relative z-10">
                    <div style={{
                        width: '100%',
                        maxWidth: 400,
                        opacity: animating ? 0 : 1,
                        transform: animating
                            ? `translateX(${exitDir > 0 ? '-50px' : '50px'})`
                            : 'translateX(0)',
                        transition: 'opacity 0.28s ease, transform 0.28s cubic-bezier(0.19,1,0.22,1)',
                    }}>
                        {/* Icon box with spinning ring */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    position: 'absolute',
                                    inset: -16,
                                    borderRadius: 32,
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    animation: 'loginRingSpin 18s linear infinite',
                                }} />
                                <div style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 24,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                                    border: '1px solid rgba(255,255,255,0.14)',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                                }}>
                                    <VisualIcon style={{ width: 32, height: 32, color: 'rgba(255,255,255,0.9)', strokeWidth: 1.5 }} />
                                </div>
                            </div>
                        </div>

                        {/* Badge */}
                        <div style={{ textAlign: 'center', marginBottom: 14 }}>
                            <span style={{
                                display: 'inline-block',
                                fontSize: 9,
                                fontWeight: 700,
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                                color: 'rgba(255,255,255,0.45)',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '5px 16px',
                                borderRadius: 999,
                            }}>
                                {slide.badge}
                            </span>
                        </div>

                        {/* Title — Plus Jakarta Sans 800 */}
                        <h1 style={{
                            fontSize: 'clamp(1.65rem, 5vw, 2.2rem)',
                            fontWeight: 800,
                            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                            letterSpacing: '-0.05em',
                            lineHeight: 1.06,
                            color: '#ffffff',
                            textAlign: 'center',
                            marginBottom: 16,
                            whiteSpace: 'pre-line',
                        }}>
                            {slide.title}
                        </h1>

                        {/* Subtitle */}
                        <p style={{
                            fontSize: 13,
                            lineHeight: 1.7,
                            color: 'rgba(255,255,255,0.42)',
                            textAlign: 'center',
                            margin: '0 auto 28px',
                            maxWidth: 320,
                            letterSpacing: '-0.005em',
                        }}>
                            {slide.subtitle}
                        </p>

                        {/* Feature rows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {slide.features.map(({ icon: Icon, text }, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 14,
                                    padding: '12px 16px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                    borderRadius: 14,
                                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                                }}>
                                    <div style={{
                                        width: 34, height: 34,
                                        borderRadius: 11, flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                    }}>
                                        <Icon style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.7)', strokeWidth: 1.8 }} />
                                    </div>
                                    <span style={{
                                        fontSize: 13,
                                        color: 'rgba(255,255,255,0.7)',
                                        fontWeight: 500,
                                        letterSpacing: '-0.01em',
                                        lineHeight: 1.4,
                                    }}>
                                        {text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom — dots + Simon status */}
                <div className="relative z-10 p-10 pt-0 flex flex-col items-center gap-4">
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 7 }}>
                        {SLIDES.map((_, i) => (
                            <button key={i} onClick={() => goTo(i)} style={{
                                height: 4,
                                width: i === current ? 32 : 4,
                                borderRadius: 999,
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                background: i === current
                                    ? 'rgba(255,255,255,0.85)'
                                    : i < current
                                        ? 'rgba(255,255,255,0.25)'
                                        : 'rgba(255,255,255,0.1)',
                                transition: 'all 0.4s cubic-bezier(0.19,1,0.22,1)',
                                boxShadow: i === current ? '0 0 16px rgba(255,255,255,0.3)' : 'none',
                            }} />
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            Simon AI · Online
                        </span>
                    </div>
                </div>

                <style>{`
                    @keyframes loginRingSpin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12"
                style={{ backgroundColor: 'var(--color-bg)' }}>
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(124,111,205,0.15)', border: '1px solid rgba(124,111,205,0.3)' }}>
                            <Zap className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                        </div>
                        <span className="font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>TRUVORNEX</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--color-primary)' }}>
                            {tab === 'login' ? 'Welcome back' : 'Create account'}
                        </h2>
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                            {tab === 'login'
                                ? 'Sign in to access your services and Simon AI'
                                : 'Join 2,400+ users on Truvornex today'}
                        </p>
                    </div>

                    <div className="flex rounded-xl p-1 mb-8 gap-1"
                        style={{ background: 'var(--color-surface-high)' }}>
                        {['login', 'signup'].map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all"
                                style={tab === t
                                    ? { background: 'var(--color-surface)', color: 'var(--color-primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }
                                    : { color: 'var(--color-text-subtle)' }}>
                                {t === 'login' ? 'Sign In' : 'Sign Up'}
                            </button>
                        ))}
                    </div>

                    {success && (
                        <div className="flex items-start gap-3 p-4 rounded-xl mb-6"
                            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--color-success)' }} />
                            <p className="text-sm" style={{ color: 'var(--color-success)' }}>{success}</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 rounded-xl mb-6 text-sm"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--color-error)' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {tab === 'signup' && (
                            <div>
                                <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase"
                                    style={{ color: 'var(--color-text-muted)' }}>Full Name</label>
                                <input
                                    type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                                    placeholder="Alex Johnson" required={tab === 'signup'}
                                    className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', color: 'var(--color-primary)' }}
                                    onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--color-border-strong)'}
                                />
                            </div>
                        )}
                        {tab === 'signup' && (
                            <div>
                                <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase"
                                    style={{ color: 'var(--color-text-muted)' }}>I am a</label>
                                <div className="flex gap-2">
                                    {['customer', 'provider'].map(r => (
                                        <button key={r} type="button" onClick={() => setRole(r)}
                                            className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all capitalize"
                                            style={role === r
                                                ? { background: 'var(--color-primary)', color: 'var(--color-on-primary)' }
                                                : { background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', color: 'var(--color-text-muted)' }}>
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase"
                                style={{ color: 'var(--color-text-muted)' }}>Email</label>
                            <input
                                type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com" required
                                className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none"
                                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', color: 'var(--color-primary)' }}
                                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                                onBlur={e => e.target.style.borderColor = 'var(--color-border-strong)'}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase"
                                style={{ color: 'var(--color-text-muted)' }}>Password</label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder={tab === 'signup' ? 'Min. 6 characters' : '••••••••'} required minLength={6}
                                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm transition-all outline-none"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', color: 'var(--color-primary)' }}
                                    onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--color-border-strong)'}
                                />
                                <button type="button" onClick={() => setShowPw(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
                                    style={{ color: 'var(--color-text-subtle)' }}>
                                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {tab === 'login' && (
                            <div className="text-right">
                                <button type="button" className="text-xs font-medium transition-colors"
                                    style={{ color: 'var(--color-accent)' }}>
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50 mt-2"
                            style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)' }}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                <>
                                    {tab === 'login' ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-xs mt-6" style={{ color: 'var(--color-text-subtle)' }}>
                        {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                        <button onClick={() => setTab(tab === 'login' ? 'signup' : 'login')}
                            className="font-semibold transition-colors" style={{ color: 'var(--color-accent)' }}>
                            {tab === 'login' ? 'Sign up free' : 'Sign in'}
                        </button>
                    </p>

                    <p className="text-center text-[10px] mt-8 leading-relaxed" style={{ color: 'var(--color-text-subtle)' }}>
                        By continuing you agree to our Terms of Service and Privacy Policy.
                        <br />Powered by Simon AI · Truvornex © 2026
                    </p>
                </div>
            </div>
        </div>
    );
}
