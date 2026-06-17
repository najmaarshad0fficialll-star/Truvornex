import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const ITEMS = [
    { emoji: '⚡', word: 'SERVICES' },
    { emoji: '🏦', word: 'WALLET' },
    { emoji: '🤝', word: 'COMMITTEE' },
    { emoji: '🛒', word: 'MARKETPLACE' },
    { emoji: '🩸', word: 'BLOOD NETWORK' },
    { emoji: '🔧', word: 'TOOL LIBRARY' },
    { emoji: '🏘️', word: 'NEIGHBORHOOD' },
    { emoji: '🤖', word: 'SIMON AI' },
];

export default function Onboarding() {
    const navigate = useNavigate();

    const [scene, setScene] = useState(1);
    const [s1In, setS1In] = useState(false);

    const [line1, setLine1] = useState(false);
    const [line2, setLine2] = useState(false);
    const [line3, setLine3] = useState(false);

    const [wordBig, setWordBig] = useState(false);
    const [wordExit, setWordExit] = useState(false);
    const [taglineIn, setTaglineIn] = useState(false);

    const [cutItem, setCutItem] = useState(0);

    const [finalIn, setFinalIn] = useState(false);
    const [cityIn, setCityIn] = useState(false);
    const [buttonsIn, setButtonsIn] = useState(false);

    const [skipVisible, setSkipVisible] = useState(false);

    const done = useCallback((dest) => {
        localStorage.setItem('truvornex_intro_seen', '1');
        navigate(dest, { replace: true });
    }, [navigate]);

    const skipToFinal = useCallback(() => {
        setScene(5);
        setSkipVisible(false);
        setFinalIn(true);
        setTimeout(() => setCityIn(true), 600);
        setTimeout(() => setButtonsIn(true), 1200);
    }, []);

    useEffect(() => {
        const esc = (e) => { if (e.key === 'Escape') skipToFinal(); };
        window.addEventListener('keydown', esc);
        return () => window.removeEventListener('keydown', esc);
    }, [skipToFinal]);

    useEffect(() => {
        const T = [];
        const t = (fn, ms) => { const id = setTimeout(fn, ms); T.push(id); return id; };

        // Scene 1: 0–2.5s
        t(() => setS1In(true), 80);
        t(() => setS1In(false), 2000);
        t(() => {
            setScene(2);
            setSkipVisible(true);
            t(() => setLine1(true), 80);
            t(() => setLine2(true), 380);
            t(() => setLine3(true), 680);
        }, 2500);

        // Scene 2: 2.5–5.5s, fade out at 5s
        t(() => { setLine1(false); setLine2(false); setLine3(false); }, 5000);
        t(() => {
            setScene(3);
            t(() => setWordBig(true), 60);
            t(() => setTaglineIn(true), 600);
        }, 5500);

        // Scene 3: 5.5–8.5s, exit at 8s
        t(() => { setWordExit(true); setTaglineIn(false); }, 8000);
        t(() => {
            setScene(4);
            setWordBig(false); setWordExit(false);
        }, 8500);

        // Scene 4: 8.5–12s — 8 items × 600ms
        for (let i = 0; i < ITEMS.length; i++) {
            t(() => setCutItem(i), 8500 + i * 600);
        }

        // Cut to black → scene 5
        t(() => setScene('black'), 12000);
        t(() => {
            setScene(5);
            setFinalIn(true);
            t(() => setCityIn(true), 800);
            t(() => setButtonsIn(true), 1600);
        }, 12200);

        return () => T.forEach(clearTimeout);
    }, []);

    const wrap = {
        position: 'fixed', inset: 0, zIndex: 99999,
        backgroundColor: '#050505',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        overflow: 'hidden',
    };

    return (
        <div style={wrap}>
            {/* Scanline */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.013) 2px, rgba(255,255,255,0.013) 4px)',
            }} />

            {/* Skip */}
            {skipVisible && (
                <button onClick={skipToFinal} style={{
                    position: 'absolute', top: 24, right: 28, zIndex: 100,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.26)', fontSize: 12,
                    letterSpacing: '0.12em', fontFamily: 'inherit',
                }}>
                    Skip →
                </button>
            )}

            {/* SCENE 1 — Lab origin */}
            {scene === 1 && (
                <div style={{
                    textAlign: 'center', position: 'relative', zIndex: 2,
                    opacity: s1In ? 1 : 0,
                    transition: 'opacity 0.5s ease',
                }}>
                    <p style={{
                        fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', monospace",
                        fontWeight: 700,
                        fontSize: 'clamp(1.5rem, 4.5vw, 2.8rem)',
                        color: '#ffffff',
                        letterSpacing: '-0.02em',
                        marginBottom: 14,
                    }}>
                        XYLVANTHREX LABS
                    </p>
                    <p style={{
                        fontFamily: 'monospace',
                        fontSize: 11,
                        letterSpacing: '0.48em',
                        color: 'rgba(255,255,255,0.36)',
                        textTransform: 'uppercase',
                    }}>
                        PRESENTS
                    </p>
                </div>
            )}

            {/* SCENE 2 — The problem */}
            {scene === 2 && (
                <div style={{ position: 'relative', zIndex: 2, maxWidth: 640, width: '100%', padding: '0 32px' }}>
                    {[
                        { text: 'Your neighborhood has 200 service workers.', vis: line1 },
                        { text: 'None of them have a digital identity.', vis: line2 },
                        { text: 'None of their work is recorded anywhere.', vis: line3 },
                    ].map(({ text, vis }, i) => (
                        <p key={i} style={{
                            fontSize: 'clamp(1.1rem, 2.8vw, 1.65rem)',
                            fontWeight: 700,
                            color: '#ffffff',
                            lineHeight: 1.3,
                            marginBottom: 20,
                            letterSpacing: '-0.025em',
                            opacity: vis ? 1 : 0,
                            transform: vis ? 'translateX(0)' : 'translateX(-30px)',
                            transition: 'opacity 0.45s ease, transform 0.45s cubic-bezier(0.19,1,0.22,1)',
                        }}>
                            {text}
                        </p>
                    ))}
                </div>
            )}

            {/* SCENE 3 — TRUVORNEX word */}
            {scene === 3 && (
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
                    <style>{`@import url('https://fonts.googleapis.com/css2?family=Faster+One&display=swap');`}</style>
                    <p style={{
                        fontFamily: "'Faster One', cursive, system-ui",
                        fontSize: wordBig ? 'clamp(4rem, 12vw, 96px)' : '12px',
                        color: '#ffffff',
                        letterSpacing: '-0.01em',
                        filter: wordBig ? (wordExit ? 'blur(0px)' : 'blur(0px)') : 'blur(8px)',
                        opacity: wordExit ? 0 : (wordBig ? 1 : 0.3),
                        transform: wordExit ? 'scale(1.06)' : 'scale(1)',
                        transition: wordBig
                            ? 'font-size 1.5s cubic-bezier(0.19,1,0.22,1), filter 1.5s ease, opacity 0.8s ease, transform 0.5s ease'
                            : 'opacity 0.3s ease',
                        marginBottom: 18,
                        display: 'block',
                    }}>
                        TRUVORNEX
                    </p>
                    <p style={{
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.4)',
                        letterSpacing: '0.06em',
                        opacity: taglineIn ? 1 : 0,
                        transform: taglineIn ? 'translateY(0)' : 'translateY(8px)',
                        transition: 'opacity 0.7s ease, transform 0.7s ease',
                    }}>
                        The neighborhood operating system.
                    </p>
                </div>
            )}

            {/* SCENE 4 — Fast cuts */}
            {scene === 4 && (
                <div key={cutItem} style={{ textAlign: 'center', position: 'relative', zIndex: 2, animation: 'tvCut 0.6s ease forwards' }}>
                    <span style={{ fontSize: 'clamp(3.5rem, 10vw, 80px)', display: 'block', marginBottom: 12 }}>
                        {ITEMS[cutItem].emoji}
                    </span>
                    <span style={{
                        fontSize: 'clamp(1.8rem, 5.5vw, 3.4rem)',
                        fontWeight: 900,
                        color: '#ffffff',
                        letterSpacing: '-0.02em',
                        display: 'block',
                    }}>
                        {ITEMS[cutItem].word}
                    </span>
                    <style>{`@keyframes tvCut { from { transform: scale(0.9); opacity: 0.6; } to { transform: scale(1); opacity: 1; } }`}</style>
                </div>
            )}

            {/* Black flash between 4 and 5 */}
            {scene === 'black' && <div style={{ position: 'relative', zIndex: 2 }} />}

            {/* SCENE 5 — Final */}
            {scene === 5 && (
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, maxWidth: 580, padding: '0 28px' }}>
                    <h1 style={{
                        fontSize: 'clamp(2rem, 5.5vw, 3.4rem)',
                        fontWeight: 800,
                        color: '#ffffff',
                        letterSpacing: '-0.045em',
                        lineHeight: 1.08,
                        marginBottom: 6,
                        opacity: finalIn ? 1 : 0,
                        transform: finalIn ? 'translateY(0)' : 'translateY(18px)',
                        transition: 'opacity 0.7s ease 0.08s, transform 0.7s cubic-bezier(0.19,1,0.22,1) 0.08s',
                    }}>
                        Built for the neighborhoods
                    </h1>
                    <h1 style={{
                        fontSize: 'clamp(2rem, 5.5vw, 3.4rem)',
                        fontWeight: 800,
                        color: '#ffffff',
                        letterSpacing: '-0.045em',
                        lineHeight: 1.08,
                        marginBottom: 32,
                        opacity: finalIn ? 1 : 0,
                        transform: finalIn ? 'translateY(0)' : 'translateY(18px)',
                        transition: 'opacity 0.7s ease 0.22s, transform 0.7s cubic-bezier(0.19,1,0.22,1) 0.22s',
                    }}>
                        the world forgot.
                    </h1>
                    <p style={{
                        fontSize: 11,
                        letterSpacing: '0.32em',
                        color: 'rgba(255,255,255,0.32)',
                        textTransform: 'uppercase',
                        marginBottom: 44,
                        opacity: cityIn ? 1 : 0,
                        transition: 'opacity 0.6s ease',
                    }}>
                        Hyderabad · Helsinki
                    </p>
                    <div style={{
                        display: 'flex', gap: 12, justifyContent: 'center',
                        opacity: buttonsIn ? 1 : 0,
                        transform: buttonsIn ? 'translateY(0)' : 'translateY(14px)',
                        transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.19,1,0.22,1)',
                    }}>
                        <button onClick={() => done('/')} style={{
                            padding: '12px 30px', borderRadius: 10,
                            border: '1px solid rgba(255,255,255,0.22)',
                            background: 'transparent', color: '#ffffff',
                            fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            fontFamily: 'inherit', letterSpacing: '-0.01em',
                            transition: 'background 0.18s',
                        }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            Explore
                        </button>
                        <button onClick={() => done('/login')} style={{
                            padding: '12px 30px', borderRadius: 10,
                            border: '1px solid #fff',
                            background: '#ffffff', color: '#050505',
                            fontSize: 14, fontWeight: 700, cursor: 'pointer',
                            fontFamily: 'inherit', letterSpacing: '-0.01em',
                            transition: 'opacity 0.18s',
                        }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                            Sign Up
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
