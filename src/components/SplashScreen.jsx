import { useEffect, useState } from 'react';

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: 8 + Math.floor((i * 79 + 17) % 84),
    y: 8 + Math.floor((i * 53 + 31) % 84),
    size: 1 + (i % 2),
    delay: (i * 0.18) % 1.6,
    dur: 2.8 + (i % 3) * 0.6,
}));

export default function SplashScreen({ onComplete }) {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const t1 = setTimeout(() => setPhase(1), 100);
        const t2 = setTimeout(() => setPhase(2), 500);
        const t3 = setTimeout(() => setPhase(3), 950);
        const t4 = setTimeout(() => setPhase(4), 1500);
        const t5 = setTimeout(() => onComplete(), 1850);
        return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
            style={{
                backgroundColor: '#050505',
                opacity: phase === 4 ? 0 : 1,
                transform: phase === 4 ? 'scale(1.02)' : 'scale(1)',
                transition: 'opacity 0.4s cubic-bezier(0.19,1,0.22,1), transform 0.4s cubic-bezier(0.19,1,0.22,1)',
            }}>

            {/* Grid */}
            <div className="absolute inset-0" style={{
                backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
                `,
                backgroundSize: '56px 56px',
            }} />

            {/* Ambient radial */}
            <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 70%)',
            }} />

            {/* Particles */}
            {PARTICLES.map(p => (
                <div key={p.id} className="absolute rounded-full" style={{
                    width: p.size + 1, height: p.size + 1,
                    left: `${p.x}%`, top: `${p.y}%`,
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    opacity: phase >= 1 ? 0.6 : 0,
                    transition: `opacity 0.8s ${p.delay}s ease`,
                    animation: `float ${p.dur}s ease-in-out ${p.delay}s infinite`,
                }} />
            ))}

            {/* Logo */}
            <div style={{
                opacity: phase >= 1 ? 1 : 0,
                transform: phase >= 1 ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.92)',
                transition: 'all 0.65s cubic-bezier(0.19,1,0.22,1)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                marginBottom: 28,
            }}>
                {/* Icon */}
                <div className="relative mb-6" style={{ width: 68, height: 68 }}>
                    {/* Spinning outer ring */}
                    <div className="absolute inset-0 rounded-2xl"
                        style={{ border: '1px solid rgba(255,255,255,0.08)', animation: 'spin-slow 12s linear infinite' }} />
                    {/* Main box */}
                    <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                        <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
                            <path d="M8 9h16M8 16h11M8 23h13" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"/>
                            <circle cx="27" cy="23" r="4" fill="rgba(255,255,255,0.8)" />
                        </svg>
                    </div>
                </div>

                {/* Name */}
                <div style={{
                    opacity: phase >= 2 ? 1 : 0,
                    transform: phase >= 2 ? 'translateY(0)' : 'translateY(6px)',
                    transition: 'all 0.55s cubic-bezier(0.19,1,0.22,1) 0.15s',
                    textAlign: 'center',
                }}>
                    <h1 style={{
                        fontSize: 28, fontWeight: 900, letterSpacing: '-0.045em',
                        color: '#ffffff', fontFamily: 'Inter, sans-serif', lineHeight: 1,
                        marginBottom: 7,
                    }}>
                        Truvornex
                    </h1>
                    <p style={{
                        color: 'rgba(255,255,255,0.28)',
                        fontSize: 10, letterSpacing: '0.2em',
                        textTransform: 'uppercase', fontWeight: 500,
                        opacity: phase >= 3 ? 1 : 0,
                        transition: 'opacity 0.45s ease 0.25s',
                    }}>
                        Powered by Simon AI
                    </p>
                </div>
            </div>

            {/* Progress bar */}
            <div style={{
                width: 100, height: 1,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: 999, overflow: 'hidden',
                opacity: phase >= 2 ? 1 : 0,
                transition: 'opacity 0.35s ease 0.35s',
            }}>
                <div style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.3))',
                    borderRadius: 999,
                    width: phase >= 3 ? '100%' : '25%',
                    transition: 'width 0.75s cubic-bezier(0.19,1,0.22,1)',
                    boxShadow: '0 0 6px rgba(255,255,255,0.3)',
                }} />
            </div>

            <style>{`
                @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
                @keyframes spin-slow { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
