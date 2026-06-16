import { useState, useRef } from 'react';
import { ArrowRight, Zap, Shield, Users, Cpu, Star, Globe, CheckCircle2, Sparkles, Briefcase, MapPin, Clock, Building2, Home, Handshake, Rocket } from 'lucide-react';

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
            { icon: CheckCircle2, text: 'Free to join — no hidden fees'  },
            { icon: Briefcase,    text: 'Providers earn more, stress less' },
            { icon: Shield,       text: 'Your data is always private'     },
        ],
        isCta: true,
    },
];

export default function IntroFlow({ onComplete }) {
    const [current, setCurrent] = useState(0);
    const [animating, setAnimating] = useState(false);
    const [exitDir, setExitDir] = useState(1);
    const touchStartX = useRef(null);

    const slide = SLIDES[current];
    const isLast = current === SLIDES.length - 1;

    const goTo = (idx) => {
        if (idx === current || idx < 0 || idx >= SLIDES.length || animating) return;
        setExitDir(idx > current ? 1 : -1);
        setAnimating(true);
        setTimeout(() => { setCurrent(idx); setAnimating(false); }, 300);
    };

    const next = () => isLast ? finish() : goTo(current + 1);

    const finish = () => {
        localStorage.setItem('truvornex-intro-seen', '1');
        onComplete();
    };

    const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const onTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (delta < -50) next();
        else if (delta > 50 && current > 0) goTo(current - 1);
    };

    const VisualIcon = slide.Visual;

    return (
        <div
            className="fixed inset-0 z-[9998] flex flex-col overflow-hidden"
            style={{ backgroundColor: '#080808' }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* Atmospheric background */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Fine grid */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }} />
                {/* Top center radial glow */}
                <div style={{
                    position: 'absolute',
                    top: -100, left: '50%', transform: 'translateX(-50%)',
                    width: 600, height: 500,
                    background: 'radial-gradient(ellipse, rgba(255,255,255,0.05) 0%, transparent 65%)',
                    pointerEvents: 'none',
                }} />
                {/* Bottom glow */}
                <div style={{
                    position: 'absolute',
                    bottom: -60, left: '50%', transform: 'translateX(-50%)',
                    width: 500, height: 300,
                    background: 'radial-gradient(ellipse, rgba(255,255,255,0.025) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />
            </div>

            {/* Skip */}
            <div className="absolute top-5 right-5 z-20">
                <button onClick={finish} style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.3)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px 4px',
                    touchAction: 'manipulation',
                    transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                    Skip
                </button>
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

            {/* Main content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
                <div style={{
                    width: '100%',
                    maxWidth: 420,
                    opacity: animating ? 0 : 1,
                    transform: animating ? `translateX(${exitDir > 0 ? '-40px' : '40px'})` : 'translateX(0)',
                    transition: 'opacity 0.28s ease, transform 0.28s cubic-bezier(0.19,1,0.22,1)',
                }}>
                    {/* Visual icon — large prominent display */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
                        <div style={{ position: 'relative' }}>
                            {/* Outer ring */}
                            <div style={{
                                position: 'absolute',
                                inset: -16,
                                borderRadius: 32,
                                border: '1px solid rgba(255,255,255,0.06)',
                                animation: 'introRingSpin 18s linear infinite',
                            }} />
                            {/* Icon box */}
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
                                position: 'relative',
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

                    {/* Title — display size */}
                    <h1 style={{
                        fontSize: 'clamp(1.65rem,6vw,2.2rem)',
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
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        marginBottom: 8,
                    }}>
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
                                animation: `introFeatureIn 0.4s cubic-bezier(0.19,1,0.22,1) ${0.05 + i * 0.06}s both`,
                            }}>
                                <div style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 11,
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
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

            {/* Bottom navigation */}
            <div style={{ padding: '0 24px', paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))', position: 'relative', zIndex: 20 }}>
                {/* Progress line + dots */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 7, marginBottom: 20 }}>
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
                            touchAction: 'manipulation',
                            boxShadow: i === current ? '0 0 16px rgba(255,255,255,0.3)' : 'none',
                        }} />
                    ))}
                </div>

                {/* Primary CTA */}
                <button onClick={next} style={{
                    width: '100%',
                    height: 54,
                    borderRadius: 16,
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                    letterSpacing: '-0.025em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    background: '#ffffff',
                    color: '#080808',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.15), 0 8px 32px rgba(255,255,255,0.12)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.2), 0 12px 40px rgba(255,255,255,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.15), 0 8px 32px rgba(255,255,255,0.12)'; }}
                onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}>
                    {/* Shimmer */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(105deg, transparent 25%, rgba(0,0,0,0.06) 50%, transparent 75%)',
                        animation: 'introShimmer 3s ease-in-out infinite',
                    }} />
                    <span style={{ position: 'relative', zIndex: 1 }}>
                        {isLast ? 'Get Started' : 'Continue'}
                    </span>
                    <ArrowRight style={{ width: 17, height: 17, position: 'relative', zIndex: 1 }} />
                </button>

                <p style={{
                    textAlign: 'center',
                    fontSize: 10.5,
                    marginTop: 14,
                    color: 'rgba(255,255,255,0.2)',
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                }}>
                    {current + 1} / {SLIDES.length}
                </p>
            </div>

            <style>{`
                @keyframes introRingSpin {
                    to { transform: rotate(360deg); }
                }
                @keyframes introFeatureIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes introShimmer {
                    0%, 100% { transform: translateX(-100%); }
                    50% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
