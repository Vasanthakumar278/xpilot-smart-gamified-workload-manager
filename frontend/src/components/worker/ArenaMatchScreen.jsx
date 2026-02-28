/**
 * components/worker/ArenaMatchScreen.jsx
 * Full-screen locked deep-work session for Focus Arena matches.
 * Anti-cheat: blur events increment pause count via /challenge/pause.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Swords, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import client from '../../api/client';

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ArenaMatchScreen() {
    const { challengeId } = useParams();
    const navigate = useNavigate();

    const [challenge, setChallenge] = useState(null);
    const [secondsLeft, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [pauses, setPauses] = useState(0);
    const [finishing, setFinishing] = useState(false);
    const [result, setResult] = useState(null);
    const [blurWarning, setBlurWarning] = useState(false);
    const intervalRef = useRef(null);
    const me = JSON.parse(localStorage.getItem('xpilot_user') || '{}');

    // Load challenge details
    useEffect(() => {
        client.get('/challenge/my').then(res => {
            const c = res.data.find(x => x.id === parseInt(challengeId));
            if (!c || c.status !== 'active') {
                navigate('/worker/arena');
                return;
            }
            setChallenge(c);
            const elapsed = c.start_time ? (Date.now() - new Date(c.start_time).getTime()) / 1000 : 0;
            const remaining = Math.max(0, c.duration_minutes * 60 - elapsed);
            setSeconds(Math.round(remaining));
            setIsRunning(true);
        }).catch(() => navigate('/worker/arena'));
    }, [challengeId, navigate]);

    // Countdown
    useEffect(() => {
        if (!isRunning || !challenge) return;
        intervalRef.current = setInterval(() => {
            setSeconds(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    handleComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(intervalRef.current);
    }, [isRunning, challenge]);

    // Anti-cheat: window blur
    const handleBlur = useCallback(() => {
        if (!challenge || result) return;
        setPauses(p => p + 1);
        setBlurWarning(true);
        setTimeout(() => setBlurWarning(false), 3000);
        client.post(`/challenge/pause/${challengeId}`, { role: challenge.my_role }).catch(() => { });
    }, [challenge, challengeId, result]);

    useEffect(() => {
        window.addEventListener('blur', handleBlur);
        return () => window.removeEventListener('blur', handleBlur);
    }, [handleBlur]);

    const handleComplete = async () => {
        if (finishing || result) return;
        setFinishing(true);
        clearInterval(intervalRef.current);
        try {
            const res = await client.post(`/challenge/complete/${challengeId}`);
            setResult(res.data);
        } catch (e) {
            console.error('Complete failed:', e);
            navigate('/worker/arena');
        } finally {
            setFinishing(false);
        }
    };

    if (!challenge) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#fff', fontFamily: 'monospace' }}>
                LOADING MATCH DATA…
            </div>
        );
    }

    const opponent = challenge.my_role === 'challenger' ? challenge.opponent : challenge.challenger;
    const myPauses = challenge.my_role === 'challenger' ? challenge.challenger_pauses : challenge.opponent_pauses;
    const progress = challenge.duration_minutes > 0
        ? Math.min(((challenge.duration_minutes * 60 - secondsLeft) / (challenge.duration_minutes * 60)) * 100, 100)
        : 0;

    // Result overlay
    if (result) {
        const won = result.verdict === 'win';
        const draw = result.verdict === 'draw';
        const eloChange = result.new_elo !== undefined
            ? (result.elo_change_a !== undefined ? result.elo_change_a : result.elo_change_b)
            : 0;
        return (
            <div style={{ height: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', color: '#fff' }}>
                <div style={{ textAlign: 'center', maxWidth: 480 }}>
                    <div style={{ fontSize: 64, marginBottom: 24 }}>{won ? '🏆' : draw ? '🤝' : '💀'}</div>
                    <div style={{ fontSize: 13, color: '#555', letterSpacing: 3, marginBottom: 12 }}>MATCH RESULT</div>
                    <div style={{ fontSize: 48, fontWeight: 900, color: won ? '#00c853' : draw ? '#f59e0b' : '#ef4444', marginBottom: 8 }}>
                        {won ? 'VICTORY' : draw ? 'DRAW' : 'DEFEAT'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, margin: '32px 0', padding: '24px', border: '1px solid #1a1a1a' }}>
                        <div><div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>FOCUS SCORE</div><div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{result.focus_score_a ?? result.focus_score_b}</div></div>
                        <div><div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>ELO CHANGE</div><div style={{ fontSize: 28, fontWeight: 900, color: result.elo_change_a >= 0 ? '#00c853' : '#ef4444' }}>{result.elo_change_a >= 0 ? '+' : ''}{result.elo_change_a}</div></div>
                        <div><div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>XP EARNED</div><div style={{ fontSize: 28, fontWeight: 900, color: '#818cf8' }}>+{result.xp_awarded}</div></div>
                    </div>
                    <button onClick={() => navigate('/worker/arena')} style={{ background: '#6366f1', border: 'none', color: '#fff', padding: '16px 48px', fontSize: 13, fontWeight: 900, letterSpacing: 3, cursor: 'pointer' }}>
                        RETURN TO ARENA
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', width: '100vw', background: '#050505', color: '#fff', fontFamily: '"JetBrains Mono", monospace', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Top bar */}
            <div style={{ height: 40, borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#555' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Swords size={14} color="#6366f1" />
                    FOCUS ARENA // MATCH #{challengeId}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span>VS {opponent.name.toUpperCase()}</span>
                    <span style={{ color: '#00ff41' }}>STATUS: EXECUTING</span>
                </div>
            </div>

            {/* Blur warning strip */}
            {blurWarning && (
                <div style={{ padding: '8px 24px', background: 'rgba(239,68,68,0.15)', borderBottom: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertTriangle size={14} color="#ef4444" />
                    <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 700 }}>FOCUS BREACH DETECTED — Window left focus. Pause #{pauses} recorded.</span>
                </div>
            )}

            {/* Main content */}
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 80, padding: '40px 48px' }}>
                {/* Left: task */}
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 12 }}>CURRENT OBJECTIVE</div>
                    <h1 style={{ fontSize: 26, fontWeight: 900, textTransform: 'uppercase', margin: 0, borderLeft: '3px solid #6366f1', paddingLeft: 20 }}>{challenge.task_description}</h1>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 12 }}>
                        DURATION: {challenge.duration_minutes}m · OPPONENT: {opponent.name.toUpperCase()}
                    </div>

                    {/* Pause counter */}
                    <div style={{ marginTop: 32, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 16px', border: `1px solid ${pauses >= 3 ? '#ef4444' : '#222'}`, background: pauses >= 3 ? 'rgba(239,68,68,0.08)' : 'transparent' }}>
                        {pauses >= 3 ? <EyeOff size={14} color="#ef4444" /> : <Eye size={14} color={pauses > 0 ? '#f59e0b' : '#555'} />}
                        <span style={{ fontSize: 11, color: pauses >= 3 ? '#ef4444' : pauses > 0 ? '#f59e0b' : '#555', fontWeight: 700, letterSpacing: 1 }}>
                            FOCUS BREACHES: {pauses} {pauses >= 3 ? '⚠ PENALTY ZONE' : ''}
                        </span>
                    </div>
                </div>

                {/* Right: timer */}
                <div style={{ textAlign: 'center', width: 320 }}>
                    <div style={{ fontSize: 10, color: '#555', letterSpacing: 4, marginBottom: 20 }}>T_REMAINING</div>
                    <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 60px rgba(99,102,241,0.4)' }}>
                        {formatTime(secondsLeft)}
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 3, background: '#111', margin: '32px 0', borderRadius: 99 }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: '#6366f1', borderRadius: 99, transition: 'width 1s linear' }} />
                    </div>

                    <button
                        onClick={handleComplete}
                        disabled={finishing}
                        style={{ width: '100%', background: '#6366f1', border: 'none', color: '#fff', padding: '16px', fontSize: 12, fontWeight: 900, letterSpacing: 3, cursor: 'pointer', opacity: finishing ? 0.6 : 1 }}
                    >
                        {finishing ? 'CALCULATING RESULT…' : 'COMPLETE SESSION'}
                    </button>
                </div>
            </main>

            {/* Bottom progress line */}
            <div style={{ height: 3, background: `linear-gradient(90deg, #6366f1 ${progress}%, #111 ${progress}%)`, position: 'fixed', bottom: 0, left: 0, right: 0, transition: 'background 1s linear' }} />
        </div>
    );
}
