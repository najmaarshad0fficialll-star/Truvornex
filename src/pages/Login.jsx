import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Zap, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';

const SLIDES = [
    'Your neighborhood, connected.',
    'Every neighbor has a skill.',
    'Simon knows your area.',
    'Built for Hyderabad. Built for Helsinki.',
];

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/';
    const { setUser, setIsAuthenticated, user } = useAuth();

    const [tab, setTab] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // Auto-advance carousel every 3.5s
    useEffect(() => {
        const timer = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentSlide(prev => (prev + 1) % SLIDES.length);
                setIsAnimating(false);
            }, 400);
        }, 3500);
        return () => clearInterval(timer);
    }, []);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate(from, { replace: true });
        }
    }, [user, navigate, from]);

    useEffect(() => { setError(''); setSuccess(''); }, [tab]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (tab === 'login') {
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (signInError) throw signInError;
                if (data.user) {
                    setUser({
                        id: data.user.id,
                        email: data.user.email,
                        full_name: data.user.user_metadata?.full_name || email.split('@')[0]
                    });
                    setIsAuthenticated(true);
                    navigate(from, { replace: true });
                }
            } else {
                // Sign up
                if (!fullName.trim()) {
                    setError('Please enter your full name.');
                    setLoading(false);
                    return;
                }
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName.trim()
                        }
                    }
                });
                if (signUpError) throw signUpError;
                if (data.user) {
                    setSuccess('Account created! You can now sign in.');
                    setTab('login');
                }
            }
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-bg)' }}>
            {/* Left panel — branding (desktop only) */}
            <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12"
                style={{ background: 'linear-gradient(135deg, #0f0f18 0%, #12131a 40%, #1a1030 100%)' }}>
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20"
                        style={{ background: 'radial-gradient(circle, #7c6fcd 0%, transparent 70%)', filter: 'blur(60px)' }} />
                    <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full opacity-15"
                        style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)', filter: 'blur(50px)' }} />
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                </div>

                <div className="relative">
                    <div className="flex items-center gap-3 mb-16">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(124,111,205,0.2)', border: '1px solid rgba(124,111,205,0.3)' }}>
                            <Zap className="h-5 w-5" style={{ color: '#7c6fcd' }} />
                        </div>
                        <div>
                            <div className="font-bold text-lg tracking-tight text-white">TRUVORNEX</div>
                            <div className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>Service Platform</div>
                        </div>
                    </div>

                    {/* Animated Carousel */}
                    <div className="relative h-32 overflow-hidden">
                        <h1
                            className={`font-screamer text-5xl text-white transition-all duration-400 ease-out ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
                            style={{ lineHeight: 1.2 }}
                        >
                            {SLIDES[currentSlide]}
                        </h1>
                    </div>

                    {/* Slide indicators */}
                    <div className="flex gap-2 mt-8">
                        {SLIDES.map((_, idx) => (
                            <div
                                key={idx}
                                className="h-1.5 rounded-full transition-all duration-300"
                                style={{
                                    width: idx === currentSlide ? '24px' : '12px',
                                    background: idx === currentSlide ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)',
                                }}
                            />
                        ))}
                    </div>

                    <p className="text-lg leading-relaxed mt-8 max-w-md" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        Connect with trusted, verified service providers in your neighborhood — powered by Simon AI.
                    </p>
                </div>

                <div className="relative flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Simon AI · Online
                    </span>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                <div className="w-full max-w-md">
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(124,111,205,0.15)', border: '1px solid rgba(124,111,205,0.3)' }}>
                            <Zap className="h-4 w-4" style={{ color: '#7c6fcd' }} />
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
                                    placeholder={tab === 'signup' ? 'Min. 8 characters' : '••••••••'} required minLength={6}
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
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50 mt-2 bg-transparent border border-white/30 text-white hover:bg-white/10">
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
