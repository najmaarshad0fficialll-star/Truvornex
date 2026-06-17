import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Zap, ArrowRight, Loader2, CheckCircle, Shield, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

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

    return (
        <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--color-bg)' }}>

            {/* ── Left Panel — Static ── */}
            <div className="hidden lg:flex lg:w-[52%]" style={{
                position: 'relative',
                overflow: 'hidden',
                flexDirection: 'column',
            }}>
                {/* Background */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #07070d 0%, #050508 45%, #080706 100%)' }} />
                {/* Fine grid */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)',
                    backgroundSize: '56px 56px',
                    pointerEvents: 'none',
                }} />
                {/* Glow */}
                <div style={{
                    position: 'absolute', top: -200, left: '40%', transform: 'translateX(-50%)',
                    width: 750, height: 600,
                    background: 'radial-gradient(ellipse, rgba(255,240,200,0.04) 0%, transparent 62%)',
                    pointerEvents: 'none',
                }} />

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
                            }}>Neighborhood OS</div>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', padding: '0 52px',
                    position: 'relative', zIndex: 10,
                }}>
                    <style>{`@import url('https://fonts.googleapis.com/css2?family=Faster+One&display=swap');`}</style>

                    {/* Wordmark */}
                    <p style={{
                        fontFamily: "'Faster One', cursive, system-ui",
                        fontSize: 'clamp(2.8rem, 5.5vw, 4.2rem)',
                        color: '#ffffff',
                        letterSpacing: '-0.01em',
                        lineHeight: 1,
                        marginBottom: 18,
                    }}>
                        TRUVORNEX
                    </p>

                    {/* Tagline */}
                    <p style={{
                        fontSize: 'clamp(1.1rem, 2.2vw, 1.5rem)',
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.72)',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.35,
                        marginBottom: 36,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}>
                        Your neighborhood, connected.
                    </p>

                    {/* Feature lines */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 40 }}>
                        {[
                            'Services · Transport · Committee · Marketplace',
                            'Blood Network · Tool Library · Skill Swap · Events',
                            'Powered by Simon AI · Built by Xylvanthrex Labs',
                        ].map((line, i) => (
                            <p key={i} style={{
                                fontSize: 11,
                                color: i === 2 ? 'rgba(255,220,160,0.38)' : 'rgba(255,255,255,0.28)',
                                letterSpacing: '0.04em',
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                            }}>
                                {line}
                            </p>
                        ))}
                    </div>
                </div>

                {/* Bottom */}
                <div style={{
                    position: 'relative', zIndex: 10,
                    padding: '0 52px 36px',
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <div style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: '#22c55e',
                        boxShadow: '0 0 8px rgba(34,197,94,0.55)',
                        flexShrink: 0,
                    }} />
                    <span style={{
                        fontSize: 9.5, letterSpacing: '0.28em',
                        textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}>
                        Launching in Hyderabad &amp; Helsinki
                    </span>
                </div>
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
                                    ? { background: 'transparent', border: '1px solid var(--color-border-strong)', color: 'var(--color-primary)', boxShadow: 'none' }
                                    : { background: 'transparent', border: 'none', color: 'var(--color-text-subtle)' }),
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
