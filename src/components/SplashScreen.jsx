import { useEffect, useState, useRef } from 'react';

export default function SplashScreen({ onComplete }) {
    const [phase, setPhase] = useState(0);
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

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
                data[i] = data[i + 1] = data[i + 2] = v;
                data[i + 3] = (Math.random() * 18) | 0;
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

    useEffect(() => {
        const t0 = setTimeout(() => setPhase(1), 100);
        const t1 = setTimeout(() => setPhase(2), 600);
        const t2 = setTimeout(() => setPhase(3), 1200);
        const t3 = setTimeout(() => setPhase(4), 1900);
        const t4 = setTimeout(() => setPhase(5), 2800);
        const t5 = setTimeout(() => setPhase(6), 3600);
        const t6 = setTimeout(() => setPhase(7), 4800);
        const t7 = setTimeout(() => onComplete(), 5400);
        return () => [t0, t1, t2, t3, t4, t5, t6, t7].forEach(clearTimeout);
    }, [onComplete]);

    const exiting = phase === 7;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#000',
            overflow: 'hidden',
            opacity: exiting ? 0 : 1,
            transition: exiting ? 'opacity 0.7s cubic-bezier(0.4,0,1,1)' : 'none',
        }}>
            {/* Film grain */}
            <canvas ref={canvasRef} style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                mixBlendMode: 'overlay', opacity: 0.5, zIndex: 30,
            }} />

            {/* Animated background */}
            <div style={{
                position: 'absolute', inset: 0,
                background: phase >= 2
                    ? 'radial-gradient(ellipse 120% 80% at 50% 60%, #1a1a1a 0%, #000 55%)'
                    : 'radial-gradient(ellipse 120% 80% at 50% 60%, #050505 0%, #000 55%)',
                transition: 'background 1.8s ease',
            }} />

            {/* Scan lines */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.011) 2px, rgba(255,255,255,0.011) 4px)',
                zIndex: 2,
            }} />

            {/* Vignette */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.85) 100%)',
                zIndex: 3,
            }} />

            {/* Light sweep */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 4 }}>
                <div style={{
                    position: 'absolute', top: 0, bottom: 0,
                    width: '35%',
                    left: phase >= 3 ? '115%' : '-35%',
                    transition: phase >= 3 ? 'left 1.1s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0.06) 70%, transparent 100%)',
                    transform: 'skewX(-12deg)',
                }} />
            </div>

            {/* Letterbox bars */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: phase >= 1 ? '9%' : '0%',
                background: '#000',
                transition: 'height 0.7s cubic-bezier(0.4,0,0.2,1)',
                zIndex: 20,
            }} />
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: phase >= 1 ? '9%' : '0%',
                background: '#000',
                transition: 'height 0.7s cubic-bezier(0.4,0,0.2,1)',
                zIndex: 20,
            }} />

            {/* Content */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 10,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '0 clamp(20px, 6vw, 48px)',
            }}>
                {/* Icon */}
                <div style={{
                    opacity: phase >= 4 ? 1 : 0,
                    transform: phase >= 4 ? 'scale(1) translateY(0)' : 'scale(0.7) translateY(30px)',
                    transition: 'opacity 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1)',
                    marginBottom: 'clamp(24px, 5vw, 40px)',
                    position: 'relative',
                }}>
                    <div style={{
                        position: 'absolute', inset: -20, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)',
                        opacity: phase >= 5 ? 1 : 0,
                        transition: 'opacity 1.2s ease 0.3s',
                        animation: phase >= 5 ? 'splashGlow 3s ease-in-out infinite' : 'none',
                    }} />
                    <div style={{
                        width: 'clamp(60px, 12vw, 76px)',
                        height: 'clamp(60px, 12vw, 76px)',
                        borderRadius: 'clamp(14px, 3vw, 20px)',
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        backdropFilter: 'blur(20px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.12)',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(255,255,255,0.04) 100%)',
                        }} />
                        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                            <path d="M6 8h20" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" strokeLinecap="round"/>
                            <path d="M6 16h13" stroke="rgba(255,255,255,0.65)" strokeWidth="2.5" strokeLinecap="round"/>
                            <path d="M6 24h16" stroke="rgba(255,255,255,0.75)" strokeWidth="2.5" strokeLinecap="round"/>
                            <circle cx="27" cy="24" r="4.5" fill="white" opacity="0.95"/>
                            <circle cx="27" cy="24" r="2" fill="rgba(0,0,0,0.6)"/>
                        </svg>
                    </div>
                </div>

                {/* Brand name */}
                <div style={{ position: 'relative', overflow: 'hidden', marginBottom: 'clamp(12px, 3vw, 18px)' }}>
                    <h1 style={{
                        fontSize: 'clamp(36px, 10vw, 72px)',
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
                        margin: 0, textAlign: 'center',
                    }}>
                        TRUVORNEX
                    </h1>
                </div>

                {/* Tagline */}
                <p style={{
                    fontSize: 'clamp(9px, 2vw, 13px)',
                    letterSpacing: '0.32em',
                    textTransform: 'uppercase',
                    fontWeight: 300,
                    fontFamily: "'Inter', system-ui, sans-serif",
                    color: 'rgba(255,255,255,0.38)',
                    opacity: phase >= 5 ? 1 : 0,
                    transform: phase >= 5 ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'opacity 0.9s ease, transform 0.9s cubic-bezier(0.16,1,0.3,1)',
                    marginBottom: 'clamp(32px, 8vw, 48px)',
                    textAlign: 'center',
                }}>
                    Your neighborhood, connected
                </p>

                {/* Progress + attribution */}
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                    opacity: phase >= 6 ? 1 : 0,
                    transform: phase >= 6 ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.7s ease, transform 0.7s ease',
                }}>
                    <div style={{
                        width: 'clamp(100px, 30vw, 160px)', height: 1,
                        background: 'rgba(255,255,255,0.08)', borderRadius: 1, overflow: 'hidden',
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
                        fontSize: 'clamp(8px, 1.8vw, 10px)',
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.18)',
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontWeight: 500,
                        textAlign: 'center',
                    }}>
                        Powered by Simon AI
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes splashGlow {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.08); }
                }
            `}</style>
        </div>
    );
}
