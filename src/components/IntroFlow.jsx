import { useState, useRef, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

/* ─── Slide data ─────────────────────────────────────────────── */
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

const SLIDE_DURATION = 5200; // ms per slide before auto-advance

/* ─── Logo particle generator ────────────────────────────────── */
// Derives particle target positions from the favicon SVG shape:
// three horizontal lines + a filled circle (32×32 viewBox)
function generateParticles(W, H) {
    const scale = Math.min(W, H) * 0.38 / 32;
    const ox = W / 2;     // logo center x on screen
    const oy = H * 0.44;  // logo center y on screen (upper-center)
    const pts = [];

    // Sample spacing in logo-space units
    const STEP = 0.55;

    // Line 1: y=10, x 8→24
    for (let x = 8; x <= 24; x += STEP)
        pts.push({ tx: ox + (x - 16) * scale, ty: oy + (10 - 16) * scale });

    // Line 2: y=16, x 8→22
    for (let x = 8; x <= 22; x += STEP)
        pts.push({ tx: ox + (x - 16) * scale, ty: oy + (16 - 16) * scale });

    // Line 3: y=22, x 8→20
    for (let x = 8; x <= 20; x += STEP)
        pts.push({ tx: ox + (x - 16) * scale, ty: oy + (22 - 16) * scale });

    // Circle: cx=24, cy=22, r=4 — 40 evenly spaced points
    const CIRC_PTS = 40;
    for (let i = 0; i < CIRC_PTS; i++) {
        const a = (i / CIRC_PTS) * Math.PI * 2;
        pts.push({
            tx: ox + (24 + Math.cos(a) * 4 - 16) * scale,
            ty: oy + (22 + Math.sin(a) * 4 - 16) * scale,
        });
    }

    // Initialize each particle scattered near its target
    return pts.map(p => ({
        tx: p.tx, ty: p.ty,
        x:  p.tx + (Math.random() - 0.5) * W * 0.6,
        y:  p.ty + (Math.random() - 0.5) * H * 0.6,
        vx: 0, vy: 0,
        size:    1.1 + Math.random() * 1.0,
        opacity: 0.12 + Math.random() * 0.22,
    }));
}

/* ─── Canvas particle system ─────────────────────────────────── */
// Fully self-contained — listens to window events, never triggers
// React re-renders during animation. Zero props change on mousemove.
function LogoParticles() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Mutable state stored in a plain object to avoid React overhead
        const state = {
            particles: [],
            mouseX: -9999,
            mouseY: -9999,
            raf: null,
        };

        // Resize → regenerate particle targets
        const resize = () => {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
            const fresh = generateParticles(canvas.width, canvas.height);
            // Preserve current positions if particles already exist
            if (state.particles.length === fresh.length) {
                fresh.forEach((p, i) => {
                    p.x  = state.particles[i].x;
                    p.y  = state.particles[i].y;
                    p.vx = state.particles[i].vx;
                    p.vy = state.particles[i].vy;
                });
            }
            state.particles = fresh;
        };
        resize();
        window.addEventListener('resize', resize);

        // Track pointer (mouse + touch)
        const onMouseMove  = e => { state.mouseX = e.clientX; state.mouseY = e.clientY; };
        const onMouseLeave = ()  => { state.mouseX = -9999; state.mouseY = -9999; };
        const onTouchMove  = e => {
            if (e.touches.length) {
                state.mouseX = e.touches[0].clientX;
                state.mouseY = e.touches[0].clientY;
            }
        };
        const onTouchEnd = () => { state.mouseX = -9999; state.mouseY = -9999; };
        window.addEventListener('mousemove',  onMouseMove);
        window.addEventListener('mouseleave', onMouseLeave);
        window.addEventListener('touchmove',  onTouchMove,  { passive: true });
        window.addEventListener('touchend',   onTouchEnd);

        // Physics constants
        const STIFFNESS     = 0.038;  // spring return speed
        const DAMPING       = 0.80;   // velocity decay
        const REPEL_RADIUS  = 110;    // px — cursor influence radius
        const REPEL_STRENGTH = 5.5;   // repulsion force

        // 60 FPS animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const p of state.particles) {
                // Spring force back toward target
                p.vx = (p.vx + (p.tx - p.x) * STIFFNESS) * DAMPING;
                p.vy = (p.vy + (p.ty - p.y) * STIFFNESS) * DAMPING;

                // Mouse repulsion
                const dx   = p.x - state.mouseX;
                const dy   = p.y - state.mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < REPEL_RADIUS && dist > 0.5) {
                    const f = Math.pow(1 - dist / REPEL_RADIUS, 2) * REPEL_STRENGTH;
                    p.vx += (dx / dist) * f;
                    p.vy += (dy / dist) * f;
                }

                p.x += p.vx;
                p.y += p.vy;

                // Draw particle
                ctx.globalAlpha = p.opacity;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.fill();
            }

            state.raf = requestAnimationFrame(animate);
        };
        state.raf = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(state.raf);
            window.removeEventListener('resize',      resize);
            window.removeEventListener('mousemove',   onMouseMove);
            window.removeEventListener('mouseleave',  onMouseLeave);
            window.removeEventListener('touchmove',   onTouchMove);
            window.removeEventListener('touchend',    onTouchEnd);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                pointerEvents: 'none', zIndex: 1,
                opacity: 0.85,
            }}
        />
    );
}

/* ─── Auto-advance progress bar ──────────────────────────────── */
// Renders a thin animated fill inside the active slide dot.
// `timerKey` forces a CSS animation restart on each navigation.
function ProgressDot({ active, done, onClick, timerKey }) {
    return (
        <button
            onClick={onClick}
            aria-label="Go to slide"
            style={{
                position: 'relative',
                height: 3,
                width: active ? 40 : 4,
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                background: active ? 'rgba(255,255,255,0.1)' : done
                    ? 'rgba(255,255,255,0.22)'
                    : 'rgba(255,255,255,0.08)',
                transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1)',
                overflow: 'hidden',
                minHeight: 20,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
            }}
        >
            {active && (
                <div
                    key={timerKey}
                    style={{
                        position: 'absolute', inset: 0,
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.82)',
                        transformOrigin: 'left center',
                        animation: `dotFill ${SLIDE_DURATION}ms linear forwards`,
                    }}
                />
            )}
        </button>
    );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function IntroFlow({ onComplete }) {
    const [current,  setCurrent]  = useState(0);
    const [visible,  setVisible]  = useState(true);
    const [leaving,  setLeaving]  = useState(false);
    const [timerKey, setTimerKey] = useState(0); // bumped on each slide change

    const locked       = useRef(false);
    const touchStartX  = useRef(null);
    const autoTimer    = useRef(null);

    const slide  = SLIDES[current];
    const isLast = current === SLIDES.length - 1;

    /* Slide transition — cross-dissolve */
    const transition = (nextIdx, fromUser = false) => {
        if (locked.current) return;
        locked.current = true;

        // Reset auto-advance timer on manual navigation
        if (fromUser) resetAutoTimer(nextIdx);

        setVisible(false);
        setTimeout(() => {
            setCurrent(nextIdx);
            setTimerKey(k => k + 1);
            setVisible(true);
            setTimeout(() => { locked.current = false; }, 480);
        }, 340);
    };

    const next  = (fromUser = false) => isLast ? finish() : transition(current + 1, fromUser);
    const goTo  = idx => {
        if (idx === current || idx < 0 || idx >= SLIDES.length) return;
        transition(idx, true);
    };
    const finish = () => {
        clearTimeout(autoTimer.current);
        setLeaving(true);
        setTimeout(() => {
            localStorage.setItem('truvornex-intro-v2', '1');
            onComplete();
        }, 700);
    };

    /* Auto-advance timer */
    const resetAutoTimer = (nextIdx) => {
        clearTimeout(autoTimer.current);
        if (nextIdx >= SLIDES.length - 1) return; // no timer on last slide
        autoTimer.current = setTimeout(() => {
            if (!locked.current) transition(nextIdx + 1);
        }, SLIDE_DURATION + 360); // +360 accounts for transition duration
    };

    // Initial timer + restart on slide change
    useEffect(() => {
        if (isLast) return;
        clearTimeout(autoTimer.current);
        autoTimer.current = setTimeout(() => {
            next();
        }, SLIDE_DURATION);
        return () => clearTimeout(autoTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current]);

    /* Swipe gestures */
    const onTouchStart = e => { touchStartX.current = e.touches[0].clientX; };
    const onTouchEnd   = e => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (delta < -50) next(true);
        else if (delta > 50 && current > 0) goTo(current - 1);
    };

    /* ── Render ── */
    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9998,
                width: '100%', height: '100dvh',
                background: '#000',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                opacity: leaving ? 0 : 1,
                transition: leaving ? 'opacity 0.7s ease' : 'none',
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* ── Particle logo background ─────────── */}
            <LogoParticles />

            {/* ── Ambient gradient — white top light ── */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
                    background: 'radial-gradient(ellipse 110% 55% at 50% -8%, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.01) 55%, transparent 80%)',
                }}
            />

            {/* ── Vignette + bottom scrim ──────────── */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
                    background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 30%, rgba(0,0,0,0.45) 100%)',
                }}
            />
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: '45%', zIndex: 4, pointerEvents: 'none',
                    background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.75) 80%, #000 100%)',
                }}
            />

            {/* ── Skip button ──────────────────────── */}
            <button
                onClick={finish}
                style={{
                    position: 'absolute', top: 20, right: 20, zIndex: 30,
                    fontSize: 10, fontWeight: 600,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.22)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 0, minHeight: 44, minWidth: 44,
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    transition: 'color 0.25s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.22)'}
            >
                Skip
            </button>

            {/* ── Slide content — cross-dissolve ───── */}
            <div
                style={{
                    position: 'relative', zIndex: 10,
                    flex: 1,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'flex-start',
                    padding: '0 clamp(24px, 6vw, 56px) clamp(20px, 4vh, 36px)',
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(18px)',
                    transition: 'opacity 0.44s cubic-bezier(0.16,1,0.3,1), transform 0.44s cubic-bezier(0.16,1,0.3,1)',
                }}
            >
                <div style={{ width: '100%' }}>
                    {/* Overline */}
                    <p style={{
                        fontSize: 'clamp(9px, 2.2vw, 11px)',
                        fontWeight: 600,
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.28)',
                        marginBottom: 'clamp(12px, 2.5vw, 18px)',
                        fontFamily: "'Inter', system-ui, sans-serif",
                    }}>
                        {slide.overline}
                    </p>

                    {/* Title */}
                    <h1 style={{
                        fontSize: 'clamp(2.2rem, 10vw, 4rem)',
                        fontWeight: 700,
                        fontFamily: "'Inter', system-ui, sans-serif",
                        letterSpacing: '-0.04em',
                        lineHeight: 1.06,
                        color: '#fff',
                        marginBottom: 'clamp(14px, 3.5vw, 22px)',
                        whiteSpace: 'pre-line',
                    }}>
                        {slide.title}
                    </h1>

                    {/* Body */}
                    <p style={{
                        fontSize: 'clamp(13px, 3.2vw, 15px)',
                        lineHeight: 1.75,
                        color: 'rgba(255,255,255,0.33)',
                        letterSpacing: '-0.01em',
                        fontFamily: "'Inter', system-ui, sans-serif",
                        maxWidth: '38ch',
                    }}>
                        {slide.body}
                    </p>
                </div>
            </div>

            {/* ── Bottom nav ───────────────────────── */}
            <div
                style={{
                    position: 'relative', zIndex: 20,
                    padding: '0 clamp(24px, 6vw, 56px)',
                    paddingBottom: 'max(36px, env(safe-area-inset-bottom, 36px))',
                    paddingTop: 20,
                }}
            >
                {/* Progress dots with animated fill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                    {SLIDES.map((_, i) => (
                        <ProgressDot
                            key={i}
                            active={i === current}
                            done={i < current}
                            timerKey={timerKey}
                            onClick={() => goTo(i)}
                        />
                    ))}
                </div>

                {/* CTA button — full width */}
                <button
                    onClick={() => next(true)}
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
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.984)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {isLast ? 'Get Started' : 'Continue'}
                    <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
            </div>

            {/* ── Global keyframes ─────────────────── */}
            <style>{`
                @keyframes dotFill {
                    from { transform: scaleX(0); }
                    to   { transform: scaleX(1); }
                }
            `}</style>
        </div>
    );
}
