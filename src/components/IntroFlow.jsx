import { useState, useRef } from 'react';
import { ArrowRight, Zap, Shield, Users, Cpu, Star, Globe, CheckCircle2, Sparkles, Briefcase, MapPin, Clock, Building2, Home, Handshake, Rocket } from 'lucide-react';

const SLIDES = [
    {
        id: 0,
        badge: 'Welcome',
        title: 'Your Neighborhood\nOS Has Arrived',
        subtitle: 'Truvornex connects you with trusted local service providers — powered by Simon AI, built for your community.',
        Visual: Building2,
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
    const [exiting, setExiting] = useState(false);
    const [direction, setDirection] = useState(1);
    const touchStartX = useRef(null);

    const slide = SLIDES[current];
    const isLast = current === SLIDES.length - 1;

    const goTo = (idx) => {
        if (idx === current || idx < 0 || idx >= SLIDES.length) return;
        setDirection(idx > current ? 1 : -1);
        setExiting(true);
        setTimeout(() => { setCurrent(idx); setExiting(false); }, 220);
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
            style={{ backgroundColor: 'var(--color-bg)' }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* Background grid — identical to home page */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
            }} />

            {/* Skip */}
            <div className="absolute top-4 right-4 z-10">
                <button onClick={finish} style={{
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
                    color: 'var(--color-text-subtle)', background: 'none', border: 'none',
                    cursor: 'pointer', padding: '5px 8px', borderRadius: 7,
                    touchAction: 'manipulation',
                }}>
                    Skip
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-5 pb-2 relative z-10">
                <div style={{
                    width: '100%', maxWidth: 380,
                    opacity: exiting ? 0 : 1,
                    transform: exiting ? `translateX(${direction > 0 ? '-28px' : '28px'})` : 'translateX(0)',
                    transition: 'opacity 0.18s ease, transform 0.18s ease',
                }}>
                    {/* Icon */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 14,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: 'var(--color-surface-high)',
                            border: '1px solid var(--color-border-strong)',
                            boxShadow: 'var(--shadow-sm)',
                        }}>
                            <VisualIcon style={{ width: 20, height: 20, color: 'var(--color-primary)' }} />
                        </div>
                    </div>

                    {/* Badge */}
                    <div style={{ textAlign: 'center', marginBottom: 10 }}>
                        <span style={{
                            display: 'inline-block',
                            fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'var(--color-text-subtle)',
                            backgroundColor: 'var(--color-surface-high)',
                            border: '1px solid var(--color-border-strong)',
                            padding: '3px 10px', borderRadius: 999,
                        }}>
                            {slide.badge}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 style={{
                        fontSize: 'clamp(1.15rem, 4.5vw, 1.5rem)',
                        fontWeight: 800,
                        letterSpacing: '-0.04em',
                        lineHeight: 1.1,
                        color: 'var(--color-primary)',
                        textAlign: 'center',
                        marginBottom: 10,
                        whiteSpace: 'pre-line',
                    }}>
                        {slide.title}
                    </h1>

                    {/* Subtitle */}
                    <p style={{
                        fontSize: 12, lineHeight: 1.6,
                        color: 'var(--color-text-muted)',
                        textAlign: 'center',
                        margin: '0 auto 20px',
                        maxWidth: 320,
                        letterSpacing: '-0.01em',
                    }}>
                        {slide.subtitle}
                    </p>

                    {/* Feature list card */}
                    <div style={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border-strong)',
                        borderRadius: 14,
                        padding: '2px 0',
                        boxShadow: 'var(--shadow-sm)',
                        marginBottom: 22,
                    }}>
                        {slide.features.map(({ icon: Icon, text }, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 14px',
                                borderTop: i === 0 ? 'none' : '1px solid var(--color-border)',
                            }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: 'var(--color-surface-high)',
                                    border: '1px solid var(--color-border-strong)',
                                }}>
                                    <Icon style={{ width: 13, height: 13, color: 'var(--color-text-muted)' }} />
                                </div>
                                <span style={{
                                    fontSize: 12, lineHeight: 1.45,
                                    color: 'var(--color-text-muted)',
                                    fontWeight: 500,
                                    letterSpacing: '-0.01em',
                                }}>
                                    {text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom nav */}
            <div style={{ padding: '0 20px 32px', position: 'relative', zIndex: 10 }}>
                {/* Dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 14 }}>
                    {SLIDES.map((_, i) => (
                        <button key={i} onClick={() => goTo(i)} style={{
                            height: 5, width: i === current ? 18 : 5,
                            borderRadius: 99, border: 'none', cursor: 'pointer', padding: 0,
                            backgroundColor: i === current ? 'var(--color-primary)' : 'var(--color-border-strong)',
                            transition: 'all 0.25s var(--ease-spring)',
                            touchAction: 'manipulation',
                        }} />
                    ))}
                </div>

                {/* CTA */}
                <button onClick={next} className="btn-primary" style={{
                    width: '100%', height: 44,
                    borderRadius: 10, fontSize: 13, fontWeight: 700,
                    letterSpacing: '-0.02em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    boxShadow: 'var(--shadow-md)',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>
                    {isLast ? <>Get Started <ArrowRight style={{ width: 14, height: 14 }} /></> : <>Next <ArrowRight style={{ width: 13, height: 13 }} /></>}
                </button>

                <p style={{
                    textAlign: 'center', fontSize: 10, marginTop: 10,
                    color: 'var(--color-text-subtle)', fontWeight: 500,
                    letterSpacing: '0.02em',
                }}>
                    {current + 1} of {SLIDES.length}
                </p>
            </div>
        </div>
    );
}
