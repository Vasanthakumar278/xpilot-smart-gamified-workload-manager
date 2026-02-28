/**
 * pages/worker/DeepWork.jsx
 * Immersive execution environment.
 * Energy-adjusted timer + AI Coach strip.
 */
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { SessionContext } from '../../context/SessionContext';
import DeepWorkScratchpad from '../../components/worker/DeepWorkScratchpad';
import SessionCompleteCard from '../../components/worker/SessionCompleteCard';

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Energy level → timer minutes (Low ≤3 → 25m, Moderate 4-7 → 45m, High ≥8 → 75m)
function energyToMinutes(level) {
    if (level <= 3) return 25;
    if (level <= 7) return 45;
    return 75;
}

export default function DeepWork() {
    const navigate = useNavigate();
    const { activeSession, setActiveSession, energyLevel } = useContext(SessionContext);

    const [secondsLeft, setSecondsLeft] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [notes, setNotes] = useState('');
    const [isFinishing, setIsFinishing] = useState(false);
    const [isSessionComplete, setIsSessionComplete] = useState(false);
    const [completedDuration, setCompletedDuration] = useState(0);
    const [advice, setAdvice] = useState(null);   // AI Coach strip

    // Calculate timer from energy
    const timerMinutes = activeSession?.task?.estimated_minutes || energyToMinutes(energyLevel);

    useEffect(() => {
        if (!activeSession) {
            navigate('/worker/dashboard');
            return;
        }
        const startTime = new Date(activeSession.localStartTime || Date.now());
        const expectedDurationSecs = timerMinutes * 60;
        const elapsedSecs = Math.floor((Date.now() - startTime.getTime()) / 1000);
        const remaining = Math.max(0, expectedDurationSecs - elapsedSecs);
        setSecondsLeft(remaining > 0 ? remaining : expectedDurationSecs);
        setIsRunning(true);
    }, [activeSession, navigate, timerMinutes]);

    // Countdown
    useEffect(() => {
        if (!isRunning || !activeSession || isSessionComplete) return;
        const interval = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setCompletedDuration(Math.round(timerMinutes));
                    setIsSessionComplete(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isRunning, activeSession, isSessionComplete, timerMinutes]);

    // Fetch AI Coach advice on mount
    useEffect(() => {
        client.post('/coach/advise')
            .then(res => setAdvice(res.data.advice))
            .catch(() => { });
    }, []);

    const handleEndSession = async () => {
        if (!activeSession) return;
        setIsFinishing(true);
        try {
            await client.post(`/sessions/${activeSession.session_id}/end`);
            await client.patch(`/tasks/${activeSession.task.id}/complete`);
            if (notes.trim()) {
                await client.post('/reflections/', {
                    session_id: activeSession.session_id,
                    text: notes,
                });
            }
            setActiveSession(null);
            navigate('/worker/dashboard');
        } catch (error) {
            console.error('Failed to end session:', error);
            alert('Execution termination failed.');
            setIsFinishing(false);
        }
    };

    if (!activeSession) return null;

    const progress = timerMinutes > 0
        ? Math.min(((timerMinutes * 60 - secondsLeft) / (timerMinutes * 60)) * 100, 100)
        : 0;

    return (
        <div style={{
            height: '100vh', width: '100vw',
            background: '#050505', color: '#fff',
            fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden', position: 'relative',
        }}>
            {/* Top status bar */}
            <div style={{ height: 40, borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#555' }}>
                <div>XPILOT.DEEP_WORK // SESSION: {activeSession.session_id}</div>
                <div style={{ color: isSessionComplete ? '#00c853' : isRunning ? '#00ff41' : '#ff3131' }}>
                    {isSessionComplete ? 'STATUS: COMPLETED' : isRunning ? 'STATUS: EXECUTING' : 'STATUS: PAUSED'}
                </div>
            </div>

            {/* AI Coach strip */}
            {advice && !isSessionComplete && (
                <div style={{ padding: '8px 24px', background: 'rgba(99,102,241,0.08)', borderBottom: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#818cf8', letterSpacing: '0.1em' }}>AI COACH</span>
                    <span style={{ fontSize: 12, color: '#a5b4fc', flex: 1 }}>{advice}</span>
                </div>
            )}

            {/* Main content */}
            <main style={{ flex: 1, display: 'flex', padding: '48px', gap: '48px', opacity: isSessionComplete ? 0 : 1, pointerEvents: isSessionComplete ? 'none' : 'auto', transition: 'opacity 0.4s ease' }}>
                {/* Left: task details + notes */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 32 }}>
                    <div style={{ borderLeft: '3px solid #6366f1', paddingLeft: 24 }}>
                        <div style={{ fontSize: 10, color: '#555', marginBottom: 8, letterSpacing: 2 }}>CURRENT_OBJECTIVE</div>
                        <h1 style={{ fontSize: 30, margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>{activeSession.task.title}</h1>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
                            PROJECT: {activeSession.task.project || 'UNDEFINED'}&nbsp;·&nbsp;
                            ENERGY: {energyLevel}/10&nbsp;·&nbsp;
                            TIMER: {timerMinutes}m
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 3, background: '#111', borderRadius: 99 }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: progress >= 90 ? '#00c853' : progress >= 60 ? '#6366f1' : '#00ff41', borderRadius: 99, transition: 'width 1s linear' }} />
                    </div>

                    {/* Notes */}
                    <div style={{ marginTop: 'auto', border: '1px solid #1a1a1a', padding: 24, background: '#0a0a0a', borderRadius: 4 }}>
                        <div style={{ fontSize: 10, color: '#555', marginBottom: 12, letterSpacing: 2 }}>REAL_TIME_LOGS</div>
                        <textarea
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#00ff41', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit' }}
                            rows={7}
                            placeholder="INPUT_REFLECTION_DATA_HERE..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                {/* Right: timer */}
                <div style={{ width: 380, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 48 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#555', marginBottom: 16, letterSpacing: 4 }}>
                            T_REMAINING / {timerMinutes}m
                        </div>
                        <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, color: isRunning ? '#fff' : '#333', fontVariantNumeric: 'tabular-nums', textShadow: isRunning ? '0 0 60px rgba(99,102,241,0.3)' : 'none' }}>
                            {formatTime(secondsLeft)}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                        <button
                            onClick={() => setIsRunning(!isRunning)}
                            style={{ background: isRunning ? 'transparent' : '#fff', border: '1px solid #fff', color: isRunning ? '#fff' : '#000', padding: 16, fontSize: 12, fontWeight: 900, letterSpacing: 2, cursor: 'pointer' }}
                        >
                            {isRunning ? 'PAUSE_EXECUTION' : 'RESUME_EXECUTION'}
                        </button>
                        <button
                            onClick={handleEndSession}
                            disabled={isFinishing}
                            style={{ background: '#6366f1', border: 'none', color: '#fff', padding: 16, fontSize: 12, fontWeight: 900, letterSpacing: 2, cursor: 'pointer', opacity: isFinishing ? 0.5 : 1 }}
                        >
                            {isFinishing ? 'SAVING...' : 'COMPLETE_SESSION'}
                        </button>
                    </div>
                </div>
            </main>

            {!isSessionComplete && <DeepWorkScratchpad />}

            {isSessionComplete && (
                <SessionCompleteCard
                    taskTitle={activeSession.task.title}
                    durationMinutes={completedDuration}
                    onReturn={handleEndSession}
                />
            )}

            {/* Bottom progress line */}
            <div style={{ height: 4, background: `linear-gradient(90deg, #6366f1 ${progress}%, #111 ${progress}%)`, position: 'fixed', bottom: 0, left: 0, right: 0, transition: 'background 1s linear' }} />
        </div>
    );
}
