import { useState, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

const SLIDES = [
    {
        id: 0,
        overline: 'Welcome',
        title: 'Your neighborhood,\nconnected',
        body: 'Truvornex connects you with trusted local service providers — powered by Simon AI, built for your community.',
    },
    {
        id: 1,
        overline: 'One App',
        title: 'Every home need,\ncovered',
        body: 'From emergency plumbing at 2 am to weekly cleaning — book any local service 24/7, in seconds.',
    },
    {
        id: 2,
        overline: 'Community First',
        title: 'Trust built by\nneighbors',
        body: "Finding trustworthy help shouldn't take hours. Real people, real reviews, real results.",
    },
    {
        id: 3,
        overline: 'Get Started',
        title: 'Ready to join your\nneighborhood?',
        body: 'Free to join. No hidden fees. It only takes 30 seconds to get started.',
        isCta: true,
    },
];

export default function IntroFlow({ onComplete }) {
    const [current, setCurrent] = useState(0);
    const [visible, setVisible] = useState(true);
    const [leaving, setLeaving] = useState(false);
    const locked = useRef(false);
    const touchStartX = useRef(null);

    const slide = SLIDES[current];
    const isLast = current === SLIDES.length - 1;

    const transition = (nextIdx) => {
        if (locked.current) return;
        locked.current = true;
        setVisible(false);
        setTimeout(() => {
            setCurrent(nextIdx);
            setVisible(true);
            setTimeout(() => { locked.current = false; }, 500);
        }, 380);
    };

    const next = () => isLast ? finish() : transition(current + 1);

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
            style={{
                position: 'fixed', inset: 0, zIndex: 9998,
                background: '#000',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                opacity: leaving ? 0 : 1,
                transition: leaving ? 'opacity 0.8s ease' : 'none',
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* Background gradient — soft white light from top */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 50%, transparent 75%)',
            }} />
            {/* Bottom fade to pure black */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: '40%', pointerEvents: 'none',
                background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.6))',
            }} />

            {/* Skip */}
            <button
                onClick={finish}
                style={{
                    position: 'absolute', top: 22, right: 22, zIndex: 30,
                    fontSize: 10, fontWeight: 600,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.22)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '6px 2px',
                    transition: 'color 0.3s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.22)'}
            >
                Skip
            </button>

            {/* Main content */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 clamp(28px, 8vw, 72px)',
                position: 'relative', zIndex: 10,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(14px)',
                transition: 'opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)',
            }}>
                <div style={{ width: '100%', maxWidth: 380 }}>
                    <p style={{
                        fontSize: 10, fontWeight: 600,
                        letterSpacing: '0.2em', textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.28)',
                        marginBottom: 18,
                        fontFamily: "'Inter', system-ui, sans-serif",
                    }}>
                        {slide.overline}
                    </p>

                    <h1 style={{
                        fontSize: 'clamp(1.9rem, 7vw, 2.6rem)',
                        fontWeight: 700,
                        fontFamily: "'Inter', system-ui, sans-serif",
                        letterSpacing: '-0.04em',
                        lineHeight: 1.08,
                        color: '#fff',
                        marginBottom: 20,
                        whiteSpace: 'pre-line',
                    }}>
                        {slide.title}
                    </h1>

                    <p style={{
                        fontSize: 14,
                        lineHeight: 1.75,
                        color: 'rgba(255,255,255,0.35)',
                        letterSpacing: '-0.01em',
                        fontFamily: "'Inter', system-ui, sans-serif",
                    }}>
                        {slide.body}
                    </p>
                </div>
            </div>

            {/* Bottom nav */}
            <div style={{
                padding: '0 clamp(28px, 8vw, 72px)',
                paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))',
                position: 'relative', zIndex: 20,
            }}>
                {/* Dots */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            style={{
                                height: 3,
                                width: i === current ? 26 : 3,
                                borderRadius: 999,
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                background: i === current
                                    ? 'rgba(255,255,255,0.75)'
                                    : i < current
                                        ? 'rgba(255,255,255,0.2)'
                                        : 'rgba(255,255,255,0.08)',
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
                        borderRadius: 13,
                        fontSize: 14,
                        fontWeight: 600,
                        fontFamily: "'Inter', system-ui, sans-serif",
                        letterSpacing: '-0.02em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        background: '#fff',
                        color: '#000',
                        border: 'none',
                        cursor: 'pointer',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.985)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {isLast ? 'Get Started' : 'Continue'}
                    <ArrowRight style={{ width: 15, height: 15 }} />
                </button>
            </div>
        </div>
    );
}
