import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const CUTS = [
    { word: 'SERVICES',     sub: 'Book in 60 seconds' },
    { word: 'TRANSPORT',    sub: 'Rides on demand' },
    { word: 'COMMITTEE',    sub: 'Community fund' },
    { word: 'MARKETPLACE',  sub: 'Local commerce' },
    { word: 'BLOOD NETWORK',sub: 'Life, shared' },
    { word: 'TOOL LIBRARY', sub: 'Borrow anything' },
    { word: 'NEIGHBORHOOD', sub: 'One OS for all' },
    { word: 'SIMON AI',     sub: 'Your intelligent city' },
];

function useFilmGrain(ref) {
    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let alive = true, raf;
        function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
        resize();
        window.addEventListener('resize', resize);
        function tick() {
            if (!alive) return;
            const { width: w, height: h } = canvas;
            const img = ctx.createImageData(w, h);
            const d = img.data;
            for (let i = 0; i < d.length; i += 4) {
                const v = (Math.random() * 255) | 0;
                d[i] = d[i + 1] = d[i + 2] = v;
                d[i + 3] = (Math.random() * 20) | 0;
            }
            ctx.putImageData(img, 0, 0);
            raf = requestAnimationFrame(tick);
        }
        tick();
        return () => { alive = false; window.removeEventListener('resize', resize); cancelAnimationFrame(raf); };
    }, []);
}

function Sweep({ active }) {
    const [go, setGo] = useState(false);
    useEffect(() => { if (active) { const t = setTimeout(() => setGo(true), 50); return () => clearTimeout(t); } }, [active]);
    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 6 }}>
            <div style={{
                position: 'absolute', top: '-20%', bottom: '-20%', width: '32%',
                left: go ? '115%' : '-32%',
                transition: go ? 'left 1s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none',
                background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.05) 40%,rgba(255,255,255,0.12) 50%,rgba(255,255,255,0.05) 60%,transparent 100%)',
                transform: 'skewX(-10deg)',
            }} />
        </div>
    );
}

export default function Onboarding() {
    const navigate = useNavigate();
    const grainRef = useRef(null);
    useFilmGrain(grainRef);

    const [scene, setScene]     = useState(0);
    const [env, setEnv]         = useState(0);    // master opacity envelope
    const [sweepA, setSweepA]   = useState(false);
    const [sweepB, setSweepB]   = useState(false);

    // scene 1
    const [s1, setS1] = useState(false);
    // scene 2
    const [s2, setS2] = useState([false, false, false]);
    // scene 3
    const [s3w, setS3w]   = useState(false);
    const [s3x, setS3x]   = useState(false);
    const [s3t, setS3t]   = useState(false);
    // scene 4
    const [cut, setCut]   = useState(0);
    const [cutV, setCutV] = useState(false);
    // scene 5
    const [s5a, setS5a]   = useState(false);
    const [s5b, setS5b]   = useState(false);
    const [s5c, setS5c]   = useState(false);
    const [s5btn, setS5btn] = useState(false);

    const [skipVis, setSkipVis] = useState(false);

    const done = useCallback((dest) => {
        setEnv(0);
        localStorage.setItem('truvornex_intro_seen', '1');
        setTimeout(() => navigate(dest, { replace: true }), 550);
    }, [navigate]);

    const goFinal = useCallback(() => {
        setSkipVis(false); setEnv(0);
        setTimeout(() => {
            setScene(5); setEnv(1); setSweepB(true);
            setTimeout(() => setS5a(true), 80);
            setTimeout(() => setS5b(true), 650);
            setTimeout(() => setS5c(true), 1150);
            setTimeout(() => setS5btn(true), 1750);
        }, 350);
    }, []);

    useEffect(() => {
        const T = [];
        const t = (fn, ms) => { const id = setTimeout(fn, ms); T.push(id); return id; };

        t(() => setEnv(1), 60);

        // scene 1 — 0–2.8s
        t(() => { setScene(1); setS1(true); }, 120);
        t(() => setS1(false), 2000);
        t(() => setSweepA(true), 2100);
        t(() => setEnv(0), 2350);

        // scene 2 — 2.8–6s
        t(() => { setScene(2); setEnv(1); setSkipVis(true); }, 2800);
        t(() => setS2([true, false, false]), 3000);
        t(() => setS2([true, true,  false]), 3420);
        t(() => setS2([true, true,  true ]), 3840);
        t(() => setS2([false, false, false]), 5500);
        t(() => setEnv(0), 5800);

        // scene 3 — 6.3–9.5s
        t(() => { setScene(3); setEnv(1); }, 6300);
        t(() => setS3w(true), 6420);
        t(() => setS3t(true), 7150);
        t(() => { setS3x(true); setS3t(false); }, 8800);
        t(() => setEnv(0), 9250);

        // scene 4 — 9.8–14s
        t(() => { setScene(4); setEnv(1); setCutV(true); }, 9800);
        CUTS.forEach((_, i) => {
            t(() => { setCut(i); setCutV(false); }, 9800 + i * 530);
            t(() => setCutV(true), 9920 + i * 530);
        });
        t(() => setEnv(0), 14100);

        // scene 5 — 14.6s+
        t(() => { setScene(5); setEnv(1); setSweepB(true); setSkipVis(false); }, 14600);
        t(() => setS5a(true), 14720);
        t(() => setS5b(true), 15400);
        t(() => setS5c(true), 15950);
        t(() => setS5btn(true), 16750);

        return () => T.forEach(clearTimeout);
    }, []);

    useEffect(() => {
        const fn = (e) => { if (e.key === 'Escape') goFinal(); };
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, [goFinal]);

    const bg = scene === 3 || scene === 5
        ? 'radial-gradient(ellipse 130% 90% at 50% 50%,#161616 0%,#000 58%)'
        : '#000';

    /* shared text style helpers */
    const gradText = (from = '#fff', to = 'rgba(255,255,255,0.65)') => ({
        background: `linear-gradient(180deg,${from} 0%,${to} 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
    });

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: bg, transition: 'background 1.2s ease',
            fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif",
            overflow: 'hidden',
            /* use dynamic viewport height so browser chrome doesn't overlap */
            height: '100dvh',
        }}>
            {/* grain */}
            <canvas ref={grainRef} style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                mixBlendMode: 'overlay', opacity: 0.45, zIndex: 30,
            }} />

            {/* scan lines */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4,
                backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.01) 2px,rgba(255,255,255,0.01) 4px)',
            }} />

            {/* vignette */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
                background: 'radial-gradient(ellipse 100% 100% at 50% 50%,transparent 30%,rgba(0,0,0,0.88) 100%)',
            }} />

            {/* letterbox — thinner on small phones */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 'clamp(36px,8%,72px)', background: '#000', zIndex: 20, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 'clamp(36px,8%,72px)', background: '#000', zIndex: 20, pointerEvents: 'none' }} />

            {/* sweeps */}
            <Sweep active={sweepA} />
            <Sweep active={sweepB} />

            {/* master fade envelope */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 10,
                opacity: env, transition: 'opacity 0.45s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: `clamp(48px,10%,90px) clamp(20px,6vw,56px)`,
                boxSizing: 'border-box',
            }}>

                {/* ── SCENE 1 ── studio card */}
                {scene === 1 && (
                    <div style={{
                        textAlign: 'center',
                        opacity: s1 ? 1 : 0,
                        transform: s1 ? 'scale(1)' : 'scale(0.95)',
                        transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1)',
                    }}>
                        <div style={{ width: 1, height: 'clamp(32px,6vw,52px)', background: 'linear-gradient(180deg,transparent,rgba(255,255,255,0.32))', margin: '0 auto clamp(20px,4vw,28px)' }} />
                        <p style={{
                            fontSize: 'clamp(1.2rem,5vw,2.4rem)',
                            fontWeight: 800, letterSpacing: '-0.04em',
                            lineHeight: 1, color: '#fff', margin: '0 0 10px',
                        }}>
                            XYLVANTHREX LABS
                        </p>
                        <p style={{ fontSize: 'clamp(9px,2vw,11px)', letterSpacing: '0.45em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: 400, margin: 0 }}>
                            PRESENTS
                        </p>
                        <div style={{ width: 1, height: 'clamp(32px,6vw,52px)', background: 'linear-gradient(180deg,rgba(255,255,255,0.32),transparent)', margin: 'clamp(20px,4vw,28px) auto 0' }} />
                    </div>
                )}

                {/* ── SCENE 2 ── the problem */}
                {scene === 2 && (
                    <div style={{ maxWidth: 'min(600px,90vw)', width: '100%' }}>
                        {[
                            'Your neighborhood has 200 service workers.',
                            'None of them have a digital identity.',
                            'None of their work is recorded anywhere.',
                        ].map((text, i) => (
                            <div key={i} style={{ overflow: 'hidden', marginBottom: 'clamp(12px,3vw,20px)' }}>
                                <p style={{
                                    fontSize: 'clamp(1rem,3.5vw,1.55rem)',
                                    fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.25,
                                    margin: 0,
                                    ...gradText(
                                        i === 0 ? '#fff' : 'rgba(255,255,255,0.78)',
                                        i === 0 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)'
                                    ),
                                    opacity: s2[i] ? 1 : 0,
                                    transform: s2[i] ? 'translateY(0)' : 'translateY(110%)',
                                    transition: 'opacity 0.55s ease, transform 0.55s cubic-bezier(0.16,1,0.3,1)',
                                }}>{text}</p>
                            </div>
                        ))}
                        <div style={{
                            height: 1, marginTop: 'clamp(20px,4vw,32px)',
                            background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)',
                            opacity: s2[2] ? 1 : 0, transition: 'opacity 0.6s ease 0.3s',
                        }} />
                    </div>
                )}

                {/* ── SCENE 3 ── TRUVORNEX */}
                {scene === 3 && (
                    <div style={{ textAlign: 'center', width: '100%' }}>
                        <h1 style={{
                            fontSize: s3w ? 'clamp(3.8rem,14vw,110px)' : '14px',
                            fontWeight: 900,
                            letterSpacing: s3w ? '-0.04em' : '0.08em',
                            lineHeight: 1, margin: '0 0 clamp(14px,3vw,20px)',
                            ...gradText('#fff', 'rgba(255,255,255,0.58)'),
                            filter: s3w ? (s3x ? 'blur(14px)' : 'blur(0)') : 'blur(20px)',
                            opacity: s3x ? 0 : (s3w ? 1 : 0),
                            transform: s3x ? 'scale(1.1) translateY(-12px)' : (s3w ? 'scale(1)' : 'scale(0.85)'),
                            transition: s3w
                                ? 'font-size 1.6s cubic-bezier(0.16,1,0.3,1),filter 1.2s ease,opacity 0.7s ease,transform 0.5s ease,letter-spacing 1.6s cubic-bezier(0.16,1,0.3,1)'
                                : 'opacity 0.3s ease',
                            display: 'block',
                        }}>
                            TRUVORNEX
                        </h1>
                        <div style={{
                            width: 'clamp(140px,40vw,380px)', height: 1,
                            margin: '0 auto clamp(14px,3vw,20px)',
                            background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.38),transparent)',
                            opacity: s3t ? 1 : 0, transition: 'opacity 0.5s ease',
                        }} />
                        <p style={{
                            fontSize: 'clamp(9px,2.2vw,13px)', letterSpacing: '0.38em',
                            textTransform: 'uppercase', fontWeight: 300,
                            color: 'rgba(255,255,255,0.36)', margin: 0,
                            opacity: s3t ? 1 : 0,
                            transform: s3t ? 'translateY(0)' : 'translateY(10px)',
                            transition: 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.16,1,0.3,1)',
                        }}>
                            The neighborhood operating system
                        </p>
                    </div>
                )}

                {/* ── SCENE 4 ── fast cuts */}
                {scene === 4 && (
                    <div key={cut} style={{ textAlign: 'center', width: '100%', padding: '0 clamp(8px,4vw,40px)', boxSizing: 'border-box' }}>
                        <p style={{
                            fontSize: 'clamp(9px,2vw,11px)', letterSpacing: '0.35em',
                            color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase',
                            margin: '0 0 clamp(16px,4vw,24px)', fontWeight: 500,
                            opacity: cutV ? 1 : 0, transition: 'opacity 0.2s ease',
                        }}>
                            {String(cut + 1).padStart(2,'0')} / {String(CUTS.length).padStart(2,'0')}
                        </p>
                        <h2 style={{
                            fontSize: 'clamp(2.2rem,10vw,84px)',
                            fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95,
                            margin: '0 0 clamp(10px,2.5vw,14px)',
                            ...gradText('#fff', 'rgba(255,255,255,0.62)'),
                            opacity: cutV ? 1 : 0,
                            transform: cutV ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.95)',
                            transition: 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.16,1,0.3,1)',
                        }}>
                            {CUTS[cut].word}
                        </h2>
                        <p style={{
                            fontSize: 'clamp(10px,2.5vw,13px)', fontWeight: 300,
                            letterSpacing: '0.2em', color: 'rgba(255,255,255,0.28)',
                            textTransform: 'uppercase', margin: 0,
                            opacity: cutV ? 1 : 0, transition: 'opacity 0.25s ease 0.08s',
                        }}>
                            {CUTS[cut].sub}
                        </p>
                        <div style={{
                            width: cutV ? `${((cut + 1) / CUTS.length) * 100}%` : '0%',
                            maxWidth: 'min(260px,70vw)',
                            height: 1, margin: 'clamp(20px,5vw,28px) auto 0',
                            background: 'linear-gradient(90deg,rgba(255,255,255,0.08),rgba(255,255,255,0.48),rgba(255,255,255,0.08))',
                            transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                        }} />
                    </div>
                )}

                {/* ── SCENE 5 ── final CTA */}
                {scene === 5 && (
                    <div style={{
                        textAlign: 'center',
                        maxWidth: 'min(580px,92vw)', width: '100%',
                    }}>
                        {/* top accent */}
                        <div style={{
                            width: 1, height: 'clamp(36px,7vw,56px)',
                            background: 'linear-gradient(180deg,transparent,rgba(255,255,255,0.28))',
                            margin: '0 auto clamp(24px,5vw,36px)',
                            opacity: s5a ? 1 : 0, transition: 'opacity 0.6s ease',
                        }} />

                        {/* headline line 1 */}
                        <div style={{ overflow: 'hidden', marginBottom: 4 }}>
                            <h1 style={{
                                fontSize: 'clamp(1.85rem,7vw,3.8rem)',
                                fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 1.06,
                                margin: 0,
                                ...gradText('#fff', 'rgba(255,255,255,0.88)'),
                                opacity: s5a ? 1 : 0,
                                transform: s5a ? 'translateY(0)' : 'translateY(100%)',
                                transition: 'opacity 0.8s ease 0.05s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 0.05s',
                            }}>
                                Built for the neighborhoods
                            </h1>
                        </div>

                        {/* headline line 2 */}
                        <div style={{ overflow: 'hidden', marginBottom: 'clamp(24px,5vw,36px)' }}>
                            <h1 style={{
                                fontSize: 'clamp(1.85rem,7vw,3.8rem)',
                                fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 1.06,
                                margin: 0,
                                ...gradText('rgba(255,255,255,0.68)', 'rgba(255,255,255,0.35)'),
                                opacity: s5a ? 1 : 0,
                                transform: s5a ? 'translateY(0)' : 'translateY(100%)',
                                transition: 'opacity 0.8s ease 0.18s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 0.18s',
                            }}>
                                the world forgot.
                            </h1>
                        </div>

                        {/* divider */}
                        <div style={{
                            height: 1, marginBottom: 'clamp(16px,4vw,24px)',
                            background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)',
                            opacity: s5b ? 1 : 0, transition: 'opacity 0.6s ease',
                        }} />

                        {/* sub-tagline */}
                        <p style={{
                            fontSize: 'clamp(9px,2.2vw,11px)', letterSpacing: '0.35em',
                            color: 'rgba(255,255,255,0.26)', textTransform: 'uppercase',
                            fontWeight: 400, margin: '0 0 clamp(32px,7vw,48px)',
                            opacity: s5b ? 1 : 0, transition: 'opacity 0.7s ease 0.1s',
                        }}>
                            Your neighborhood, connected
                        </p>

                        {/* CTA buttons — stack on mobile, row on wider */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'clamp(10px,2.5vw,12px)',
                            width: '100%',
                            opacity: s5btn ? 1 : 0,
                            transform: s5btn ? 'translateY(0)' : 'translateY(16px)',
                            transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)',
                        }}>
                            <button
                                onClick={() => done('/login')}
                                style={{
                                    width: '100%',
                                    padding: 'clamp(14px,3.5vw,16px) 0',
                                    borderRadius: 'clamp(10px,2.5vw,14px)',
                                    border: '1px solid rgba(255,255,255,0.9)',
                                    background: '#ffffff', color: '#000',
                                    fontSize: 'clamp(13px,3vw,15px)', fontWeight: 700,
                                    cursor: 'pointer', fontFamily: 'inherit',
                                    letterSpacing: '-0.02em',
                                    boxShadow: '0 0 32px rgba(255,255,255,0.14)',
                                    touchAction: 'manipulation',
                                    WebkitTapHighlightColor: 'transparent',
                                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                                    minHeight: 52,
                                }}
                                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 48px rgba(255,255,255,0.28)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 32px rgba(255,255,255,0.14)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                Sign Up Free
                            </button>
                            <button
                                onClick={() => done('/')}
                                style={{
                                    width: '100%',
                                    padding: 'clamp(14px,3.5vw,16px) 0',
                                    borderRadius: 'clamp(10px,2.5vw,14px)',
                                    border: '1px solid rgba(255,255,255,0.16)',
                                    background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)',
                                    fontSize: 'clamp(13px,3vw,15px)', fontWeight: 500,
                                    cursor: 'pointer', fontFamily: 'inherit',
                                    letterSpacing: '-0.01em', backdropFilter: 'blur(8px)',
                                    touchAction: 'manipulation',
                                    WebkitTapHighlightColor: 'transparent',
                                    transition: 'background 0.2s ease, color 0.2s ease',
                                    minHeight: 52,
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                            >
                                Explore first
                            </button>
                        </div>

                        {/* bottom accent */}
                        <div style={{
                            width: 1, height: 'clamp(32px,6vw,48px)',
                            background: 'linear-gradient(180deg,rgba(255,255,255,0.18),transparent)',
                            margin: 'clamp(32px,6vw,48px) auto 0',
                            opacity: s5c ? 1 : 0, transition: 'opacity 0.6s ease',
                        }} />
                    </div>
                )}
            </div>

            {/* Scene 4 — bottom progress pips */}
            {scene === 4 && (
                <div style={{
                    position: 'absolute',
                    bottom: 'clamp(44px,10%,80px)',
                    left: 0, right: 0,
                    display: 'flex', justifyContent: 'center',
                    gap: 'clamp(3px,1vw,5px)', zIndex: 15,
                }}>
                    {CUTS.map((_, i) => (
                        <div key={i} style={{
                            height: 2,
                            width: 'clamp(14px,3.5vw,22px)',
                            borderRadius: 1,
                            background: i <= cut ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.1)',
                            transition: 'background 0.3s ease',
                            boxShadow: i === cut ? '0 0 8px rgba(255,255,255,0.5)' : 'none',
                        }} />
                    ))}
                </div>
            )}

            {/* Skip */}
            {skipVis && (
                <button
                    onClick={goFinal}
                    style={{
                        position: 'absolute',
                        top: 'clamp(48px,10%,72px)',
                        right: 'clamp(20px,5vw,36px)',
                        zIndex: 50,
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.22)',
                        fontSize: 'clamp(10px,2vw,11px)',
                        letterSpacing: '0.15em', fontFamily: 'inherit',
                        fontWeight: 500, textTransform: 'uppercase',
                        padding: '10px 4px',
                        minHeight: 44, minWidth: 44,
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.22)'}
                >
                    Skip →
                </button>
            )}
        </div>
    );
}
