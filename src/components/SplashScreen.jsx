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
                data[i + 3] = (Math.random() * 10) | 0;
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
        const t0 = setTimeout(() => setPhase(1), 80);
        const t1 = setTimeout(() => setPhase(2), 900);
        const t2 = setTimeout(() => setPhase(3), 2200);
        const t3 = setTimeout(() => setPhase(4), 3800);
        const t4 = setTimeout(() => setPhase(5), 5200);
        const t5 = setTimeout(() => setPhase(6), 6000);
        const t6 = setTimeout(() => onComplete(), 6700);
        return () => [t0, t1, t2, t3, t4, t5, t6].forEach(clearTimeout);
    }, [onComplete]);

    const exiting = phase === 6;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#000',
            overflow: 'hidden',
            opacity: exiting ? 0 : 1,
            transition: exiting ? 'opacity 1s cubic-bezier(0.4,0,1,1)' : 'none',
        }}>
            <canvas ref={canvasRef} style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                mixBlendMode: 'overlay', opacity: 0.35, zIndex: 30,
            }} />

            {/* Ambient light — slow bloom */}
            <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -60%)',
                width: 800, height: 600,
                background: 'radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 65%)',
                opacity: phase >= 2 ? 1 : 0,
                transition: 'opacity 3s ease',
                pointerEvents: 'none',
            }} />

            {/* Vignette */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 35%, rgba(0,0,0,0.9) 100%)',
                zIndex: 3,
            }} />

            {/* Letterbox — top */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: phase >= 1 ? '10%' : '0%',
                background: '#000',
                transition: 'height 1.4s cubic-bezier(0.76,0,0.24,1)',
                zIndex: 20,
            }} />
            {/* Letterbox — bottom */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: phase >= 1 ? '10%' : '0%',
                background: '#000',
                transition: 'height 1.4s cubic-bezier(0.76,0,0.24,1)',
                zIndex: 20,
            }} />

            {/* Center stage */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 10,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 0,
            }}>
                {/* Logo mark */}
                <div style={{
                    opacity: phase >= 2 ? 1 : 0,
                    transform: phase >= 2 ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.96)',
                    transition: 'opacity 2s cubic-bezier(0.16,1,0.3,1), transform 2.2s cubic-bezier(0.16,1,0.3,1)',
                    marginBottom: 32,
                }}>
                    <div style={{
                        width: 64, height: 64,
                        borderRadius: 18,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 60px rgba(255,255,255,0.04)',
                    }}>
                        <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                            <path d="M6 8h20" stroke="rgba(255,255,255,0.9)" strokeWidth="2.2" strokeLinecap="round"/>
                            <path d="M6 16h13" stroke="rgba(255,255,255,0.55)" strokeWidth="2.2" strokeLinecap="round"/>
                            <path d="M6 24h16" stroke="rgba(255,255,255,0.7)" strokeWidth="2.2" strokeLinecap="round"/>
                            <circle cx="27" cy="24" r="4.5" fill="white" opacity="0.9"/>
                            <circle cx="27" cy="24" r="2" fill="rgba(0,0,0,0.5)"/>
                        </svg>
                    </div>
                </div>

                {/* Brand wordmark */}
                <div style={{ overflow: 'hidden', marginBottom: 16 }}>
                    <h1 style={{
                        fontSize: 'clamp(34px, 9vw, 68px)',
                        fontWeight: 800,
                        fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
                        letterSpacing: '-0.05em',
                        lineHeight: 1,
                        color: '#fff',
                        margin: 0,
                        textAlign: 'center',
                        opacity: phase >= 3 ? 1 : 0,
                        transform: phase >= 3 ? 'translateY(0)' : 'translateY(100%)',
                        transition: 'opacity 1.6s cubic-bezier(0.16,1,0.3,1), transform 1.6s cubic-bezier(0.16,1,0.3,1)',
                    }}>
                        TRUVORNEX
                    </h1>
                </div>

                {/* Thin rule */}
                <div style={{
                    width: phase >= 3 ? 48 : 0,
                    height: 1,
                    background: 'rgba(255,255,255,0.15)',
                    marginBottom: 16,
                    transition: 'width 1.4s cubic-bezier(0.4,0,0.2,1) 0.4s',
                }} />

                {/* Tagline */}
                <p style={{
                    fontSize: 'clamp(9px, 1.8vw, 12px)',
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    fontWeight: 400,
                    fontFamily: "'Inter', system-ui, sans-serif",
                    color: 'rgba(255,255,255,0.3)',
                    textAlign: 'center',
                    margin: 0,
                    opacity: phase >= 4 ? 1 : 0,
                    transition: 'opacity 1.8s ease',
                }}>
                    Your neighborhood, connected
                </p>

                {/* Loading line */}
                <div style={{
                    position: 'absolute',
                    bottom: '16%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                    opacity: phase >= 4 ? 1 : 0,
                    transition: 'opacity 1.2s ease',
                }}>
                    <div style={{
                        width: 120, height: 1,
                        background: 'rgba(255,255,255,0.07)',
                        borderRadius: 1, overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%',
                            width: phase >= 4 ? '100%' : '0%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                            transition: 'width 1.8s cubic-bezier(0.4,0,0.2,1)',
                        }} />
                    </div>
                    <p style={{
                        fontSize: 9,
                        letterSpacing: '0.26em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.15)',
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontWeight: 500,
                        margin: 0,
                    }}>
                        Powered by Simon AI
                    </p>
                </div>
            </div>
        </div>
    );
}
