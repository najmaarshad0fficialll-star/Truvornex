import { useState, useRef, useCallback } from 'react';
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

const LINE_COUNT = 9;
const LINES = Array.from({ length: LINE_COUNT }, (_, i) => ({
    top: `${8 + i * 10.5}%`,
    opacity: 0.025 + (i % 3) * 0.012,
    factor: (i - Math.floor(LINE_COUNT / 2)) * 0.055,
}));

export default function IntroFlow({ onComplete }) {
    const [current, setCurrent] = useState(0);
    const [visible, setVisible] = useState(true);
    const [leaving, setLeaving] = useState(false);
    const [lineOffset, setLineOffset] = useState(0);
    const locked = useRef(false);
    const touchStartX = useRef(null);
    const rafId = useRef(null);
    const targetOffset = useRef(0);
    const currentOffset = useRef(0);

    const slide = SLIDES[current];
    const isLast = current === SLIDES.length - 1;

    const handleMouseMove = useCallback((e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        targetOffset.current = ((e.clientX - rect.width / 2) / rect.width);
        if (!rafId.current) {
            const animate = () => {
                currentOffset.current += (targetOffset.current - currentOffset.current) * 0.08;
                setLineOffset(currentOffset.current);
                rafId.current = Math.abs(currentOffset.current - targetOffset.current) > 0.001
                    ? requestAnimationFrame(animate)
                    : null;
            };
            rafId.current = requestAnimationFrame(animate);
        }
    }, []);

    const handleMouseLeave = useCallback(() => {
        targetOffset.current = 0;
        const animate = () => {
            currentOffset.current += (0 - currentOffset.current) * 0.06;
            setLineOffset(currentOffset.current);
            if (Math.abs(currentOffset.current) > 0.001) {
                rafId.current = requestAnimationFrame(animate);
            } else {
                currentOffset.current = 0;
                setLineOffset(0);
                rafId.current = null;
            }
        };
        if (rafId.current) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(animate);
    }, []);

    const transition = (nextIdx) => {
        if (locked.current) return;
        locked.current = true;
        setVisible(false);
        setTimeout(() => {
            setCurrent(nextIdx);
            setVisible(true);
            setTimeout(() => { locked.current = false; }, 500);
        }, 360);
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
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* Gradient — soft white bloom from top */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse 100% 55% at 50% -5%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.015) 55%, transparent 80%)',
            }} />

            {/* Animated lines */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                {LINES.map((line, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: line.top,
                            left: 0, right: 0,
                            height: 1,
                            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,${line.opacity * 3}) 20%, rgba(255,255,255,${line.opacity}) 50%, rgba(255,255,255,${line.opacity * 3}) 80%, transparent 100%)`,
                            transform: `translateX(${lineOffset * line.factor * 100}vw)`,
                            willChange: 'transform',
                        }}
                    />
                ))}
            </div>

            {/* Bottom fade */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: '35%', pointerEvents: 'none',
                background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.65))',
            }} />

            {/* Skip */}
            <button
                onClick={finish}
                style={{
                    position: 'absolute', top: 20, right: 20, zIndex: 30,
                    fontSize: 10, fontWeight: 600,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.22)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '8px 4px',
                    transition: 'color 0.3s',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    minHeight: 44, minWidth: 44,
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.22)'}
            >
                Skip
            </button>

            {/* Main content — full screen, mobile-first */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: 'clamp(80px, 14vh, 120px) clamp(24px, 6vw, 56px) 0',
                position: 'relative', zIndex: 10,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 0.48s cubic-bezier(0.16,1,0.3,1), transform 0.48s cubic-bezier(0.16,1,0.3,1)',
            }}>
                <div style={{ width: '100%' }}>
                    <p style={{
                        fontSize: 'clamp(9px, 2.2vw, 11px)',
                        fontWeight: 600,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.28)',
                        marginBottom: 'clamp(14px, 3vw, 22px)',
                        fontFamily: "'Inter', system-ui, sans-serif",
                    }}>
                        {slide.overline}
                    </p>

                    <h1 style={{
                        fontSize: 'clamp(2.4rem, 11vw, 4.5rem)',
                        fontWeight: 700,
                        fontFamily: "'Inter', system-ui, sans-serif",
                        letterSpacing: '-0.04em',
                        lineHeight: 1.05,
                        color: '#fff',
                        marginBottom: 'clamp(16px, 4vw, 28px)',
                        whiteSpace: 'pre-line',
                    }}>
                        {slide.title}
                    </h1>

                    <p style={{
                        fontSize: 'clamp(13px, 3.5vw, 16px)',
                        lineHeight: 1.7,
                        color: 'rgba(255,255,255,0.34)',
                        letterSpacing: '-0.01em',
                        fontFamily: "'Inter', system-ui, sans-serif",
                        maxWidth: '36ch',
                    }}>
                        {slide.body}
                    </p>
                </div>
            </div>

            {/* Bottom nav — full width */}
            <div style={{
                padding: '0 clamp(24px, 6vw, 56px)',
                paddingBottom: 'max(36px, env(safe-area-inset-bottom, 36px))',
                paddingTop: 24,
                position: 'relative', zIndex: 20,
            }}>
                {/* Progress dots */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
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
                                    ? 'rgba(255,255,255,0.75)'
                                    : i < current
                                        ? 'rgba(255,255,255,0.2)'
                                        : 'rgba(255,255,255,0.08)',
                                transition: 'all 0.45s cubic-bezier(0.4,0,0.2,1)',
                                touchAction: 'manipulation',
                                minHeight: 20,
                            }}
                        />
                    ))}
                </div>

                {/* CTA — full width */}
                <button
                    onClick={next}
                    style={{
                        width: '100%',
                        height: 'clamp(50px, 13vw, 56px)',
                        borderRadius: 14,
                        fontSize: 'clamp(14px, 3.5vw, 16px)',
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
                    <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
            </div>

            <style>{`
                @media (hover: none) {
                    @keyframes lineDrift {
                        0%, 100% { transform: translateX(-2vw); }
                        50%       { transform: translateX(2vw); }
                    }
                }
            `}</style>
        </div>
    );
}
