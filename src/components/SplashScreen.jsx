import { useEffect, useState, useRef } from 'react';

export default function SplashScreen({ onComplete }) {
    const [phase, setPhase] = useState(0);
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    // Film grain on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let running = true;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        function drawGrain() {
            if (!running) return;
            const w = canvas.width, h = canvas.height;
            const imageData = ctx.createImageData(w, h);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const v = (Math.random() * 255) | 0;
                data[i] = v;
                data[i + 1] = v;
                data[i + 2] = v;
                data[i + 3] = Math.random() * 18 | 0;
            }
            ctx.putImageData(imageData, 0, 0);
            rafRef.current = requestAnimationFrame(drawGrain);
        }
        drawGrain();

        return () => {
            running = false;
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(rafRef.current);
        };
    }, []);

    // Cinematic phase sequence
    useEffect(() => {
        const t0 = setTimeout(() => setPhase(1), 100);   // letterbox in
        const t1 = setTimeout(() => setPhase(2), 600);   // bg gradient reveal
        const t2 = setTimeout(() => setPhase(3), 1200);  // light sweep
        const t3 = setTimeout(() => setPhase(4), 1900);  // logo in
        const t4 = setTimeout(() => setPhase(5), 2800);  // tagline in
        const t5 = setTimeout(() => setPhase(6), 3600);  // subtitle + bar
        const t6 = setTimeout(() => setPhase(7), 4800);  // fade out
        const t7 = setTimeout(() => onComplete(), 5400);
        return () => [t0, t1, t2, t3, t4, t5, t6, t7].forEach(clearTimeout);
    }, []);

    const exiting = phase === 7;

    return (
        <div
            className="fixed inset-0 z-[9999] overflow-hidden"
            style={{
                background: '#000',
                opacity: exiting ? 0 : 1,
                transition: exiting ? 'opacity 0.7s cubic-bezier(0.4,0,1,1)' : 'none',
            }}
        >
            {/* ── Film grain canvas ── */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{ mixBlendMode: 'overlay', opacity: 0.55, zIndex: 30 }}
            />

            {/* ── Deep background: animated gradient ── */}
            <div
                className="absolute inset-0"
                style={{
                    background: phase >= 2
                        ? 'radial-gradient(ellipse 120% 80% at 50% 60%, #1a1a1a 0%, #000 55%)'
                        : 'radial-gradient(ellipse 120% 80% at 50% 60%, #050505 0%, #000 55%)',
                    transition: 'background 1.8s ease',
                }}
            />

            {/* ── Horizontal scan lines ── */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)',
                    zIndex: 2,
                }}
            />

            {/* ── Subtle vignette ── */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.85) 100%)',
                    zIndex: 3,
                }}
            />

            {/* ── White gradient light beam (sweeps left→right) ── */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    zIndex: 4,
                    overflow: 'hidden',
                }}
            >
                <div style={{
                    position: 'absolute',
                    top: 0, bottom: 0,
                    width: '35%',
                    left: phase >= 3 ? '110%' : '-35%',
                    transition: phase >= 3 ? 'left 1.1s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0.06) 70%, transparent 100%)',
                    transform: 'skewX(-12deg)',
                }} />
            </div>

            {/* ── Second light sweep (diagonal, delayed) ── */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 4, overflow: 'hidden' }}
            >
                <div style={{
                    position: 'absolute',
                    top: '-20%', bottom: '-20%',
                    width: '18%',
                    left: phase >= 3 ? '115%' : '-20%',
                    transition: phase >= 3 ? 'left 1.4s 0.2s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 60%, transparent 100%)',
                    transform: 'skewX(-8deg)',
                }} />
            </div>

            {/* ── Letterbox bars ── */}
            <div
                className="absolute left-0 right-0 top-0 pointer-events-none"
                style={{
                    height: phase >= 1 ? '10%' : '0%',
                    background: '#000',
                    transition: 'height 0.7s cubic-bezier(0.4,0,0.2,1)',
                    zIndex: 20,
                }}
            />
            <div
                className="absolute left-0 right-0 bottom-0 pointer-events-none"
                style={{
                    height: phase >= 1 ? '10%' : '0%',
                    background: '#000',
                    transition: 'height 0.7s cubic-bezier(0.4,0,0.2,1)',
                    zIndex: 20,
                }}
            />

            {/* ── Central stage ── */}
            <div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ zIndex: 10 }}
            >
                {/* Logo icon */}
                <div style={{
                    opacity: phase >= 4 ? 1 : 0,
                    transform: phase >= 4 ? 'scale(1) translateY(0)' : 'scale(0.7) translateY(30px)',
                    transition: 'opacity 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1)',
                    marginBottom: 40,
                    position: 'relative',
                }}>
                    {/* Outer glow ring */}
                    <div style={{
                        position: 'absolute',
                        inset: -20,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)',
                        opacity: phase >= 5 ? 1 : 0,
                        transition: 'opacity 1.2s ease 0.3s',
                        animation: phase >= 5 ? 'glowPulse 3s ease-in-out infinite' : 'none',
                    }} />

                    {/* Icon box */}
                    <div style={{
                        width: 76, height: 76,
                        borderRadius: 20,
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        backdropFilter: 'blur(20px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.12)',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {/* Inner shimmer */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(255,255,255,0.04) 100%)',
                        }} />
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <path d="M6 8h20" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" strokeLinecap="round"/>
                            <path d="M6 16h13" stroke="rgba(255,255,255,0.65)" strokeWidth="2.5" strokeLinecap="round"/>
                            <path d="M6 24h16" stroke="rgba(255,255,255,0.75)" strokeWidth="2.5" strokeLinecap="round"/>
                            <circle cx="27" cy="24" r="4.5" fill="white" opacity="0.95"/>
                            <circle cx="27" cy="24" r="2" fill="rgba(0,0,0,0.6)"/>
                        </svg>
                    </div>
                </div>

                {/* Brand name — dramatic character reveal */}
                <div style={{
                    position: 'relative',
                    overflow: 'hidden',
                    marginBottom: 18,
                }}>
                    <h1 style={{
                        fontSize: 'clamp(42px, 7vw, 72px)',
                        fontWeight: 900,
                        fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
                        letterSpacing: '-0.04em',
                        lineHeight: 1,
                        background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.75) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        opacity: phase >= 4 ? 1 : 0,
                        transform: phase >= 4 ? 'translateY(0)' : 'translateY(100%)',
                        transition: 'opacity 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s, transform 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s',
                        textRendering: 'geometricPrecision',
                    }}>
                        TRUVORNEX
                    </h1>
                    {/* Horizontal shine line under text */}
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: 1,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                        opacity: phase >= 5 ? 1 : 0,
                        transition: 'opacity 0.8s ease 0.5s',
                    }} />
                </div>

                {/* Tagline */}
                <div style={{
                    opacity: phase >= 5 ? 1 : 0,
                    transform: phase >= 5 ? 'translateY(0)' : 'translateY(12px)',
                    transition: 'opacity 0.9s ease, transform 0.9s cubic-bezier(0.16,1,0.3,1)',
                    textAlign: 'center',
                    marginBottom: 48,
                }}>
                    <p style={{
                        fontSize: 'clamp(13px, 2vw, 16px)',
                        letterSpacing: '0.35em',
                        textTransform: 'uppercase',
                        fontWeight: 300,
                        fontFamily: "'Inter', system-ui, sans-serif",
                        color: 'rgba(255,255,255,0.4)',
                    }}>
                        Your neighborhood, connected
                    </p>
                </div>

                {/* Bottom meta row */}
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                    opacity: phase >= 6 ? 1 : 0,
                    transform: phase >= 6 ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.7s ease, transform 0.7s ease',
                }}>
                    {/* Progress track */}
                    <div style={{
                        width: 160, height: 1,
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: 1,
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%',
                            width: phase >= 6 ? '100%' : '0%',
                            background: 'linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.9), rgba(255,255,255,0.2))',
                            transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                            boxShadow: '0 0 8px rgba(255,255,255,0.6)',
                        }} />
                    </div>

                    <p style={{
                        fontSize: 10,
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.2)',
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontWeight: 500,
                    }}>
                        Powered by Simon AI
                    </p>
                </div>
            </div>

            {/* ── Diagonal gradient overlay for cinematic B&W depth ── */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    zIndex: 5,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 50%, rgba(255,255,255,0.015) 100%)',
                    opacity: phase >= 2 ? 1 : 0,
                    transition: 'opacity 1.5s ease',
                }}
            />

            {/* ── Corner accent lines ── */}
            {[
                { top: 68, left: 24, w: 40, h: 1, rot: 0 },
                { top: 68, left: 24, w: 1, h: 40, rot: 0 },
                { top: 68, right: 24, w: 40, h: 1, rot: 0 },
                { top: 68, right: 24, w: 1, h: 40, rot: 0 },
                { bottom: 68, left: 24, w: 40, h: 1, rot: 0 },
                { bottom: 68, left: 24, w: 1, h: 40, rot: 0 },
                { bottom: 68, right: 24, w: 40, h: 1, rot: 0 },
                { bottom: 68, right: 24, w: 1, h: 40, rot: 0 },
            ].map((s, i) => (
                <div key={i} className="absolute pointer-events-none" style={{
                    ...s,
                    background: 'rgba(255,255,255,0.12)',
                    opacity: phase >= 6 ? 1 : 0,
                    transition: `opacity 0.6s ease ${0.05 * i}s`,
                    zIndex: 22,
                }} />
            ))}

            <style>{`
                @keyframes glowPulse {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.08); }
                }
            `}</style>
        </div>
    );
}
