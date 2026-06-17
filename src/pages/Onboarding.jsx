import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── items for fast-cut scene ─────────────────────────────────── */
const CUTS = [
    { word: 'SERVICES',    sub: 'Book in 60 seconds' },
    { word: 'TRANSPORT',   sub: 'Rides on demand' },
    { word: 'COMMITTEE',   sub: 'Community fund' },
    { word: 'MARKETPLACE', sub: 'Local commerce' },
    { word: 'BLOOD NETWORK', sub: 'Life, shared' },
    { word: 'TOOL LIBRARY', sub: 'Borrow anything' },
    { word: 'NEIGHBORHOOD', sub: 'One OS for all' },
    { word: 'SIMON AI',    sub: 'Your intelligent city' },
];

/* ── Film grain hook ───────────────────────────────────────────── */
function useFilmGrain(canvasRef) {
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let running = true;
        let raf;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        function draw() {
            if (!running) return;
            const { width: w, height: h } = canvas;
            const img = ctx.createImageData(w, h);
            const d = img.data;
            for (let i = 0; i < d.length; i += 4) {
                const v = (Math.random() * 255) | 0;
                d[i] = d[i + 1] = d[i + 2] = v;
                d[i + 3] = (Math.random() * 22) | 0;
            }
            ctx.putImageData(img, 0, 0);
            raf = requestAnimationFrame(draw);
        }
        draw();
        return () => {
            running = false;
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(raf);
        };
    }, []);
}

/* ── Light sweep component ─────────────────────────────────────── */
function LightSweep({ trigger, delay = 0 }) {
    const [go, setGo] = useState(false);
    useEffect(() => {
        if (!trigger) return;
        const t = setTimeout(() => setGo(true), delay);
        return () => clearTimeout(t);
    }, [trigger, delay]);

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 6 }}>
            <div style={{
                position: 'absolute', top: '-20%', bottom: '-20%',
                width: '30%',
                left: go ? '115%' : '-30%',
                transition: go ? 'left 0.9s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.055) 40%, rgba(255,255,255,0.11) 50%, rgba(255,255,255,0.055) 60%, transparent 100%)',
                transform: 'skewX(-10deg)',
            }} />
        </div>
    );
}

/* ── Main component ─────────────────────────────────────────────── */
export default function Onboarding() {
    const navigate = useNavigate();
    const grainRef = useRef(null);
    useFilmGrain(grainRef);

    /* scene state */
    const [scene, setScene] = useState(0);          // 0=black, 1, 2, 3, 4, 5
    const [opacity, setOpacity] = useState(0);       // whole screen fade
    const [sweepA, setSweepA] = useState(false);
    const [sweepB, setSweepB] = useState(false);

    /* scene 1 */
    const [s1show, setS1show] = useState(false);

    /* scene 2 */
    const [s2lines, setS2lines] = useState([false, false, false]);

    /* scene 3 */
    const [s3word, setS3word] = useState(false);
    const [s3exit, setS3exit] = useState(false);
    const [s3tag, setS3tag] = useState(false);

    /* scene 4 */
    const [cutIdx, setCutIdx] = useState(0);
    const [cutVis, setCutVis] = useState(false);

    /* scene 5 */
    const [s5a, setS5a] = useState(false);
    const [s5b, setS5b] = useState(false);
    const [s5c, setS5c] = useState(false);
    const [s5btns, setS5btns] = useState(false);

    const [skipVis, setSkipVis] = useState(false);

    const done = useCallback((dest) => {
        setOpacity(0);
        localStorage.setItem('truvornex_intro_seen', '1');
        setTimeout(() => navigate(dest, { replace: true }), 600);
    }, [navigate]);

    const skipToFinal = useCallback(() => {
        setSkipVis(false);
        setScene(5);
        setOpacity(1);
        setTimeout(() => { setS5a(true); }, 80);
        setTimeout(() => { setS5b(true); setSweepB(true); }, 700);
        setTimeout(() => { setS5c(true); }, 1200);
        setTimeout(() => { setS5btns(true); }, 1800);
    }, []);

    useEffect(() => {
        const T = [];
        const t = (fn, ms) => { const id = setTimeout(fn, ms); T.push(id); return id; };

        /* ── Fade in ── */
        t(() => setOpacity(1), 60);

        /* ── SCENE 1 — Studio card (0–2.8s) ── */
        t(() => { setScene(1); setS1show(true); }, 120);
        t(() => setS1show(false), 2000);
        t(() => { setSweepA(true); }, 2100);
        t(() => setOpacity(0), 2400);

        /* ── SCENE 2 — The problem (3–6s) ── */
        t(() => { setScene(2); setOpacity(1); setSkipVis(true); }, 2800);
        t(() => setS2lines(v => [true, v[1], v[2]]), 3000);
        t(() => setS2lines(v => [v[0], true, v[2]]), 3400);
        t(() => setS2lines(v => [v[0], v[1], true]), 3800);
        t(() => { setS2lines([false, false, false]); }, 5600);
        t(() => setOpacity(0), 5900);

        /* ── SCENE 3 — TRUVORNEX reveal (6.4–9.5s) ── */
        t(() => { setScene(3); setOpacity(1); }, 6400);
        t(() => setS3word(true), 6500);
        t(() => setS3tag(true), 7200);
        t(() => { setS3exit(true); setS3tag(false); }, 8900);
        t(() => setOpacity(0), 9300);

        /* ── SCENE 4 — Fast cuts (9.8–14.2s) ── */
        t(() => { setScene(4); setOpacity(1); setCutVis(true); }, 9800);
        CUTS.forEach((_, i) => {
            t(() => { setCutIdx(i); setCutVis(false); }, 9800 + i * 550);
            t(() => setCutVis(true), 9900 + i * 550);
        });
        t(() => setOpacity(0), 14300);

        /* ── SCENE 5 — Final (14.8s+) ── */
        t(() => { setScene(5); setOpacity(1); setSkipVis(false); }, 14800);
        t(() => { setS5a(true); setSweepB(true); }, 14900);
        t(() => setS5b(true), 15600);
        t(() => setS5c(true), 16200);
        t(() => setS5btns(true), 17000);

        return () => T.forEach(clearTimeout);
    }, []);

    useEffect(() => {
        const esc = (e) => { if (e.key === 'Escape') skipToFinal(); };
        window.addEventListener('keydown', esc);
        return () => window.removeEventListener('keydown', esc);
    }, [skipToFinal]);

    /* ── shared gradient BG ── */
    const gradientBg = scene === 3
        ? 'radial-gradient(ellipse 130% 90% at 50% 50%, #181818 0%, #000 60%)'
        : scene === 5
            ? 'radial-gradient(ellipse 110% 80% at 50% 40%, #141414 0%, #000 55%)'
            : '#000';

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: gradientBg,
            transition: 'background 1.2s ease',
            fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
            overflow: 'hidden',
        }}>
            {/* ── Film grain ── */}
            <canvas ref={grainRef} style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                mixBlendMode: 'overlay', opacity: 0.48, zIndex: 30,
            }} />

            {/* ── Scan lines ── */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4,
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.011) 2px, rgba(255,255,255,0.011) 4px)',
            }} />

            {/* ── Vignette ── */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
                background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 35%, rgba(0,0,0,0.88) 100%)',
            }} />

            {/* ── Cinematic letterbox bars ── */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: '9%', background: '#000', zIndex: 20, pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: '9%', background: '#000', zIndex: 20, pointerEvents: 'none',
            }} />

            {/* ── Light sweeps ── */}
            <LightSweep trigger={sweepA} delay={0} />
            <LightSweep trigger={sweepB} delay={200} />

            {/* ── Master opacity envelope ── */}
            <div style={{
                position: 'absolute', inset: 0,
                opacity,
                transition: 'opacity 0.45s ease',
                zIndex: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>

                {/* ══ SCENE 1 — Studio card ══ */}
                {scene === 1 && (
                    <div style={{
                        textAlign: 'center',
                        opacity: s1show ? 1 : 0,
                        transform: s1show ? 'scale(1)' : 'scale(0.96)',
                        transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1)',
                    }}>
                        {/* White gradient line above */}
                        <div style={{
                            width: 1, height: 48, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.35))',
                            margin: '0 auto 28px',
                        }} />
                        <p style={{
                            fontSize: 'clamp(1.4rem, 4vw, 2.4rem)',
                            fontWeight: 800,
                            letterSpacing: '-0.04em',
                            color: '#fff',
                            marginBottom: 10,
                            lineHeight: 1,
                        }}>
                            XYLVANTHREX LABS
                        </p>
                        <p style={{
                            fontSize: 11,
                            letterSpacing: '0.45em',
                            color: 'rgba(255,255,255,0.3)',
                            textTransform: 'uppercase',
                            fontWeight: 400,
                        }}>
                            PRESENTS
                        </p>
                        {/* White gradient line below */}
                        <div style={{
                            width: 1, height: 48, background: 'linear-gradient(180deg, rgba(255,255,255,0.35), transparent)',
                            margin: '28px auto 0',
                        }} />
                    </div>
                )}

                {/* ══ SCENE 2 — The problem ══ */}
                {scene === 2 && (
                    <div style={{ maxWidth: 620, width: '100%', padding: '0 40px' }}>
                        {[
                            'Your neighborhood has 200 service workers.',
                            'None of them have a digital identity.',
                            'None of their work is recorded anywhere.',
                        ].map((text, i) => (
                            <div key={i} style={{ overflow: 'hidden', marginBottom: 18 }}>
                                <p style={{
                                    fontSize: 'clamp(1rem, 2.5vw, 1.55rem)',
                                    fontWeight: 700,
                                    letterSpacing: '-0.03em',
                                    lineHeight: 1.25,
                                    background: i === 0
                                        ? 'linear-gradient(135deg, #ffffff, rgba(255,255,255,0.8))'
                                        : 'linear-gradient(135deg, rgba(255,255,255,0.75), rgba(255,255,255,0.5))',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    opacity: s2lines[i] ? 1 : 0,
                                    transform: s2lines[i] ? 'translateY(0)' : 'translateY(100%)',
                                    transition: 'opacity 0.55s ease, transform 0.55s cubic-bezier(0.16,1,0.3,1)',
                                }}>
                                    {text}
                                </p>
                            </div>
                        ))}
                        {/* Horizontal accent */}
                        <div style={{
                            height: 1, marginTop: 32,
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                            opacity: s2lines[2] ? 1 : 0,
                            transition: 'opacity 0.6s ease 0.3s',
                        }} />
                    </div>
                )}

                {/* ══ SCENE 3 — TRUVORNEX ══ */}
                {scene === 3 && (
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{
                            fontSize: s3word ? 'clamp(5rem, 14vw, 120px)' : '16px',
                            fontWeight: 900,
                            letterSpacing: s3word ? '-0.04em' : '0.1em',
                            lineHeight: 1,
                            background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            filter: s3word ? (s3exit ? 'blur(12px)' : 'blur(0px)') : 'blur(20px)',
                            opacity: s3exit ? 0 : (s3word ? 1 : 0),
                            transform: s3exit ? 'scale(1.1) translateY(-10px)' : (s3word ? 'scale(1)' : 'scale(0.85)'),
                            transition: s3word
                                ? 'font-size 1.6s cubic-bezier(0.16,1,0.3,1), filter 1.2s ease, opacity 0.7s ease, transform 0.5s ease, letter-spacing 1.6s cubic-bezier(0.16,1,0.3,1)'
                                : 'opacity 0.3s ease',
                            marginBottom: 20,
                            display: 'block',
                        }}>
                            TRUVORNEX
                        </h1>

                        {/* Diagonal white gradient accent under word */}
                        <div style={{
                            width: 'clamp(200px, 40vw, 420px)',
                            height: 1,
                            margin: '0 auto 20px',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                            opacity: s3tag ? 1 : 0,
                            transition: 'opacity 0.5s ease',
                        }} />

                        <p style={{
                            fontSize: 'clamp(11px, 1.5vw, 14px)',
                            letterSpacing: '0.4em',
                            textTransform: 'uppercase',
                            fontWeight: 300,
                            color: 'rgba(255,255,255,0.38)',
                            opacity: s3tag ? 1 : 0,
                            transform: s3tag ? 'translateY(0)' : 'translateY(10px)',
                            transition: 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.16,1,0.3,1)',
                        }}>
                            The neighborhood operating system
                        </p>
                    </div>
                )}

                {/* ══ SCENE 4 — Fast cuts ══ */}
                {scene === 4 && (
                    <div key={cutIdx} style={{ textAlign: 'center', padding: '0 40px' }}>
                        {/* Cut number */}
                        <p style={{
                            fontSize: 11,
                            letterSpacing: '0.35em',
                            color: 'rgba(255,255,255,0.18)',
                            textTransform: 'uppercase',
                            marginBottom: 24,
                            opacity: cutVis ? 1 : 0,
                            transition: 'opacity 0.2s ease',
                            fontWeight: 500,
                        }}>
                            {String(cutIdx + 1).padStart(2, '0')} / {String(CUTS.length).padStart(2, '0')}
                        </p>

                        {/* Big word */}
                        <h2 style={{
                            fontSize: 'clamp(2.8rem, 9vw, 88px)',
                            fontWeight: 900,
                            letterSpacing: '-0.04em',
                            lineHeight: 0.95,
                            background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.65) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            opacity: cutVis ? 1 : 0,
                            transform: cutVis ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.95)',
                            transition: 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.16,1,0.3,1)',
                            marginBottom: 14,
                        }}>
                            {CUTS[cutIdx].word}
                        </h2>

                        {/* Sub text */}
                        <p style={{
                            fontSize: 13,
                            fontWeight: 300,
                            letterSpacing: '0.2em',
                            color: 'rgba(255,255,255,0.3)',
                            textTransform: 'uppercase',
                            opacity: cutVis ? 1 : 0,
                            transition: 'opacity 0.25s ease 0.08s',
                        }}>
                            {CUTS[cutIdx].sub}
                        </p>

                        {/* White gradient bar that grows */}
                        <div style={{
                            width: cutVis ? `${((cutIdx + 1) / CUTS.length) * 100}%` : '0%',
                            maxWidth: 300,
                            height: 1,
                            margin: '28px auto 0',
                            background: 'linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.5), rgba(255,255,255,0.1))',
                            transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                        }} />
                    </div>
                )}

                {/* ══ SCENE 5 — Final CTA ══ */}
                {scene === 5 && (
                    <div style={{ textAlign: 'center', maxWidth: 600, padding: '0 32px' }}>
                        {/* Top gradient accent */}
                        <div style={{
                            width: 1, height: 56,
                            background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.3))',
                            margin: '0 auto 36px',
                            opacity: s5a ? 1 : 0,
                            transition: 'opacity 0.6s ease',
                        }} />

                        <div style={{ overflow: 'hidden', marginBottom: 4 }}>
                            <h1 style={{
                                fontSize: 'clamp(2.2rem, 6vw, 4rem)',
                                fontWeight: 900,
                                letterSpacing: '-0.045em',
                                lineHeight: 1.05,
                                background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.85) 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                opacity: s5a ? 1 : 0,
                                transform: s5a ? 'translateY(0)' : 'translateY(100%)',
                                transition: 'opacity 0.8s ease 0.05s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 0.05s',
                            }}>
                                Built for the neighborhoods
                            </h1>
                        </div>
                        <div style={{ overflow: 'hidden', marginBottom: 36 }}>
                            <h1 style={{
                                fontSize: 'clamp(2.2rem, 6vw, 4rem)',
                                fontWeight: 900,
                                letterSpacing: '-0.045em',
                                lineHeight: 1.05,
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                opacity: s5a ? 1 : 0,
                                transform: s5a ? 'translateY(0)' : 'translateY(100%)',
                                transition: 'opacity 0.8s ease 0.18s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 0.18s',
                            }}>
                                the world forgot.
                            </h1>
                        </div>

                        {/* Horizontal divider */}
                        <div style={{
                            height: 1,
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
                            marginBottom: 24,
                            opacity: s5b ? 1 : 0,
                            transition: 'opacity 0.6s ease',
                        }} />

                        <p style={{
                            fontSize: 11,
                            letterSpacing: '0.35em',
                            color: 'rgba(255,255,255,0.28)',
                            textTransform: 'uppercase',
                            fontWeight: 400,
                            marginBottom: 48,
                            opacity: s5b ? 1 : 0,
                            transition: 'opacity 0.7s ease 0.1s',
                        }}>
                            Hyderabad · Helsinki
                        </p>

                        {/* CTA Buttons */}
                        <div style={{
                            display: 'flex', gap: 12, justifyContent: 'center',
                            opacity: s5btns ? 1 : 0,
                            transform: s5btns ? 'translateY(0)' : 'translateY(14px)',
                            transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)',
                        }}>
                            <button
                                onClick={() => done('/')}
                                style={{
                                    padding: '13px 32px', borderRadius: 12,
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(255,255,255,0.04)',
                                    color: 'rgba(255,255,255,0.75)',
                                    fontSize: 14, fontWeight: 500, cursor: 'pointer',
                                    fontFamily: 'inherit', letterSpacing: '-0.01em',
                                    transition: 'all 0.2s ease',
                                    backdropFilter: 'blur(8px)',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                            >
                                Explore
                            </button>
                            <button
                                onClick={() => done('/login')}
                                style={{
                                    padding: '13px 32px', borderRadius: 12,
                                    border: '1px solid rgba(255,255,255,0.9)',
                                    background: '#ffffff',
                                    color: '#000000',
                                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                    fontFamily: 'inherit', letterSpacing: '-0.02em',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 0 32px rgba(255,255,255,0.15)',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 48px rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 32px rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                Sign Up Free
                            </button>
                        </div>

                        {/* Bottom gradient accent */}
                        <div style={{
                            width: 1, height: 48,
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.2), transparent)',
                            margin: '48px auto 0',
                            opacity: s5c ? 1 : 0,
                            transition: 'opacity 0.6s ease',
                        }} />
                    </div>
                )}
            </div>

            {/* ── Skip button ── */}
            {skipVis && (
                <button
                    onClick={skipToFinal}
                    style={{
                        position: 'absolute', top: 28, right: 32, zIndex: 50,
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.22)', fontSize: 11,
                        letterSpacing: '0.15em', fontFamily: 'inherit',
                        fontWeight: 500, textTransform: 'uppercase',
                        padding: '8px 4px',
                        transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.22)'}
                >
                    Skip →
                </button>
            )}

            {/* ── Scene 4 progress line (visible bottom strip) ── */}
            {scene === 4 && (
                <div style={{
                    position: 'absolute', bottom: '11%', left: 0, right: 0,
                    display: 'flex', justifyContent: 'center', gap: 4, zIndex: 15,
                }}>
                    {CUTS.map((_, i) => (
                        <div key={i} style={{
                            height: 2, width: 20, borderRadius: 1,
                            background: i <= cutIdx ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.1)',
                            transition: 'background 0.3s ease',
                            boxShadow: i === cutIdx ? '0 0 8px rgba(255,255,255,0.5)' : 'none',
                        }} />
                    ))}
                </div>
            )}
        </div>
    );
}
