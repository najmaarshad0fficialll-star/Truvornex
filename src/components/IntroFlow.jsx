import { useState, useRef, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

const SLIDES = [
    {
        id: 0,
        overline: 'Welcome',
        title: 'Your Neighborhood\nOS Has Arrived',
        body: 'Truvornex connects you with trusted local service providers — powered by Simon AI, built for your community.',
        stats: [
            { value: '2,400+', label: 'Verified providers' },
            { value: '15k+',   label: 'Five-star reviews'  },
            { value: '60s',    label: 'Average booking'    },
        ],
    },
    {
        id: 1,
        overline: 'One App',
        title: 'Every Home Need,\nCovered',
        body: 'From emergency plumbing at 2 am to weekly cleaning — book any local service 24/7, in seconds.',
        stats: [
            { value: '24/7',  label: 'Always available'    },
            { value: '4.9★',  label: 'Average rating'      },
            { value: '35%',   label: 'Group buy savings'   },
        ],
    },
    {
        id: 2,
        overline: 'Community First',
        title: 'Trust Built by\nNeighbors',
        body: "We built Truvornex because finding trustworthy help shouldn't take hours. Real people, real reviews, real results.",
        stats: [
            { value: '100%',  label: 'Insured bookings'    },
            { value: '3min',  label: 'Provider response'   },
            { value: '98%',   label: 'Satisfaction rate'   },
        ],
    },
    {
        id: 3,
        overline: 'Get Started',
        title: 'Ready to Transform\nYour Neighborhood?',
        body: 'Join thousands of households already using Truvornex. Free to join — it only takes 30 seconds.',
        stats: [
            { value: 'Free',  label: 'No hidden fees'      },
            { value: 'Instant', label: 'Provider payouts'  },
            { value: 'Safe',  label: 'Data always private' },
        ],
        isCta: true,
    },
];

export default function IntroFlow({ onComplete }) {
    const [current, setCurrent] = useState(0);
    const [visible, setVisible] = useState(true);
    const [leaving, setLeaving] = useState(false);
    const touchStartX = useRef(null);
    const locked = useRef(false);

    const slide = SLIDES[current];
    const isLast = current === SLIDES.length - 1;

    const transition = (nextIdx) => {
        if (locked.current) return;
        locked.current = true;
        setVisible(false);
        setTimeout(() => {
            setCurrent(nextIdx);
            setVisible(true);
            setTimeout(() => { locked.current = false; }, 600);
        }, 420);
    };

    const next = () => {
        if (isLast) { finish(); return; }
        transition(current + 1);
    };

    const goTo = (idx) => {
        if (idx === current || idx < 0 || idx >= SLIDES.length) return;
        transition(idx);
    };

    const finish = () => {
        setLeaving(true);
        setTimeout(() => {
            localStorage.setItem('truvornex-intro-seen', '1');
            onComplete();
        }, 700);
    };

    const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const onTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (delta < -50) next();
        else if (delta > 50 && current > 0) goTo(current - 1);
    };

    return (
        <div
            className="fixed inset-0 z-[9998] flex flex-col overflow-hidden"
            style={{
                backgroundColor: '#060606',
                opacity: leaving ? 0 : 1,
                transition: leaving ? 'opacity 0.8s cubic-bezier(0.4,0,1,1)' : 'none',
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* Ambient background — shifts subtly per slide */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.8s ease',
            }}>
                <div style={{
                    position: 'absolute',
                    top: -120, left: '50%', transform: 'translateX(-50%)',
                    width: 700, height: 500,
                    background: `radial-gradient(ellipse, ${SLIDES[current].id % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(200,210,255,0.03)'} 0%, transparent 65%)`,
                }} />
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
                    backgroundSize: '64px 64px',
                }} />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)',
                }} />
            </div>

            {/* Skip */}
            <button
                onClick={finish}
                style={{
                    position: 'absolute', top: 20, right: 20, zIndex: 30,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.25)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '8px 4px',
                    transition: 'color 0.3s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
            >
                Skip
            </button>

            {/* Slide content — cross-dissolve */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 clamp(24px, 7vw, 64px)',
                position: 'relative', zIndex: 10,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1)',
            }}>
                <div style={{ width: '100%', maxWidth: 400 }}>

                    {/* Overline */}
                    <p style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.3)',
                        marginBottom: 20,
                        fontFamily: "'Inter', system-ui, sans-serif",
                    }}>
                        {slide.overline}
                    </p>

                    {/* Title — editorial */}
                    <h1 style={{
                        fontSize: 'clamp(1.75rem, 6.5vw, 2.5rem)',
                        fontWeight: 700,
                        fontFamily: "'Inter', system-ui, sans-serif",
                        letterSpacing: '-0.04em',
                        lineHeight: 1.08,
                        color: '#ffffff',
                        marginBottom: 20,
                        whiteSpace: 'pre-line',
                    }}>
                        {slide.title}
                    </h1>

                    {/* Body */}
                    <p style={{
                        fontSize: 14,
                        lineHeight: 1.75,
                        color: 'rgba(255,255,255,0.38)',
                        marginBottom: 36,
                        letterSpacing: '-0.005em',
                    }}>
                        {slide.body}
                    </p>

                    {/* Stats — horizontal, minimal */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 1,
                        borderTop: '1px solid rgba(255,255,255,0.07)',
                        paddingTop: 24,
                    }}>
                        {slide.stats.map(({ value, label }, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                                paddingRight: i < 2 ? 16 : 0,
                                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                                paddingLeft: i > 0 ? 16 : 0,
                            }}>
                                <span style={{
                                    fontSize: 'clamp(1rem, 4vw, 1.25rem)',
                                    fontWeight: 700,
                                    fontFamily: "'Inter', system-ui, sans-serif",
                                    letterSpacing: '-0.04em',
                                    color: '#fff',
                                    lineHeight: 1,
                                }}>
                                    {value}
                                </span>
                                <span style={{
                                    fontSize: 10,
                                    color: 'rgba(255,255,255,0.28)',
                                    letterSpacing: '0.04em',
                                    lineHeight: 1.4,
                                    fontWeight: 400,
                                }}>
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div style={{
                padding: '0 clamp(24px, 7vw, 64px)',
                paddingBottom: 'max(28px, env(safe-area-inset-bottom, 28px))',
                position: 'relative', zIndex: 20,
            }}>
                {/* Progress dots */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 16,
                }}>
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            style={{
                                height: 3,
                                width: i === current ? 28 : 3,
                                borderRadius: 999,
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                background: i === current
                                    ? 'rgba(255,255,255,0.8)'
                                    : i < current
                                        ? 'rgba(255,255,255,0.22)'
                                        : 'rgba(255,255,255,0.1)',
                                transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
                                touchAction: 'manipulation',
                            }}
                        />
                    ))}
                </div>

                {/* CTA */}
                <button
                    onClick={next}
                    style={{
                        width: '100%',
                        height: 52,
                        borderRadius: 14,
                        fontSize: 14,
                        fontWeight: 600,
                        fontFamily: "'Inter', system-ui, sans-serif",
                        letterSpacing: '-0.02em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        background: '#ffffff',
                        color: '#080808',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.12), 0 4px 24px rgba(255,255,255,0.08)',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.92'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                    onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.985)'; }}
                    onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                    {isLast ? 'Get Started' : 'Continue'}
                    <ArrowRight style={{ width: 15, height: 15 }} />
                </button>
            </div>
        </div>
    );
}
