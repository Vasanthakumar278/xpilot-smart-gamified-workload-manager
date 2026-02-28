/**
 * components/SessionTimer.jsx
 * Start a focus session, track elapsed time live, end and prompt for reflection.
 */
import { useState, useEffect, useRef } from 'react';
import { Target, Play, Square, Sparkles, Flame, ArrowLeft, Circle } from 'lucide-react';
import client from '../api/client';
import Card from './Card';

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function SessionTimer({ onXPEarned }) {
    const [phase, setPhase] = useState('idle'); // idle | running | reflecting | done
    const [sessionId, setSessionId] = useState(null);
    const [elapsed, setElapsed] = useState(0);
    const [reflection, setReflection] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (phase === 'running') {
            intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [phase]);

    async function handleStart() {
        setError('');
        setLoading(true);
        try {
            const payload = { task_id: null, energy_level: 5 }; // Fallbacks
            const res = await client.post('/sessions/start', payload);
            setSessionId(res.data.session_id);
            setElapsed(0);
            setPhase('running');
        } catch (e) {
            const detail = e.response?.data?.detail;
            const message = e.response?.data?.message;
            setError(typeof detail === 'string' ? detail : (typeof message === 'string' ? message : 'Failed to start session'));
        } finally {
            setLoading(false);
        }
    }

    async function handleEnd() {
        setLoading(true);
        try {
            await client.post(`/sessions/${sessionId}/end`);
            setPhase('reflecting');
        } catch (e) {
            setError(e.response?.data?.detail || 'Failed to end session');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmitReflection() {
        if (reflection.trim().length < 5) {
            setError('Reflection must be at least 5 characters to earn XP');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await client.post('/reflections/', { session_id: sessionId, text: reflection });
            const xpRes = await client.post('/xp/award', { session_id: sessionId });
            setResult(xpRes.data);
            setPhase('done');

            // Update local user XP
            const user = JSON.parse(localStorage.getItem('xpilot_user') || '{}');
            user.xp = xpRes.data.new_total;
            localStorage.setItem('xpilot_user', JSON.stringify(user));

            if (onXPEarned) onXPEarned(xpRes.data);
        } catch (e) {
            setError(e.response?.data?.detail || 'Failed to submit reflection');
        } finally {
            setLoading(false);
        }
    }

    function handleSkipReflection() {
        setPhase('done');
        setResult({ total_xp: 0, reason: 'No reflection — XP not awarded' });
    }

    function handleReset() {
        setPhase('idle');
        setSessionId(null);
        setElapsed(0);
        setReflection('');
        setResult(null);
        setError('');
    }

    return (
        <Card>
            <div className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Target size={16} /> Focus Session</div>

            {/* IDLE */}
            {phase === 'idle' && (
                <div className="flex-col gap-4">
                    <p className="text-secondary" style={{ fontSize: 14 }}>
                        Start a session when you're ready to focus. XP is earned based on time + reflection.
                    </p>
                    <button
                        className="btn btn-primary btn-lg btn-full"
                        onClick={handleStart}
                        disabled={loading}
                    >
                        {loading ? 'Starting…' : <><Play size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Start Session</>}
                    </button>
                </div>
            )}

            {/* RUNNING */}
            {phase === 'running' && (
                <div className="flex-col gap-6 items-center" style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            fontSize: 64,
                            fontWeight: 800,
                            letterSpacing: '-0.04em',
                            color: 'var(--accent)',
                            fontVariantNumeric: 'tabular-nums',
                            lineHeight: 1,
                        }}
                    >
                        {formatTime(elapsed)}
                    </div>
                    <div className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Circle size={10} fill="currentColor" /> Session in progress</div>
                    <button
                        className="btn btn-danger btn-lg btn-full"
                        onClick={handleEnd}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                        {loading ? 'Ending…' : <><Square size={16} fill="currentColor" /> End Session</>}
                    </button>
                </div>
            )}

            {/* REFLECTING */}
            {phase === 'reflecting' && (
                <div className="flex-col gap-4">
                    <div className="alert alert-info">
                        Great work — <strong>{formatTime(elapsed)}</strong> focused! Add a reflection to unlock your XP.
                    </div>
                    <div className="form-group">
                        <label className="label">What did you accomplish or learn?</label>
                        <textarea
                            className="input textarea"
                            placeholder="e.g. Completed 3 calculus problems, understood integration by parts..."
                            value={reflection}
                            onChange={(e) => setReflection(e.target.value)}
                        />
                    </div>
                    {error && <div className="alert alert-error">{error}</div>}
                    <div className="flex gap-3">
                        <button className="btn btn-primary" onClick={handleSubmitReflection} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {loading ? 'Submitting…' : <><Sparkles size={16} /> Submit & Earn XP</>}
                        </button>
                        <button className="btn btn-secondary" onClick={handleSkipReflection}>
                            Skip (no XP)
                        </button>
                    </div>
                </div>
            )}

            {/* DONE */}
            {phase === 'done' && result && (
                <div className="flex-col gap-4">
                    {result.total_xp > 0 ? (
                        <div className="alert alert-success">
                            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                +{result.total_xp} XP <Sparkles size={28} />
                            </div>
                            <div style={{ marginTop: 4, fontSize: 13 }}>{result.reason}</div>
                            {result.consistency_bonus > 0 && (
                                <div className="badge badge-green mt-2" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Flame size={12} /> Consistency bonus!</div>
                            )}
                        </div>
                    ) : (
                        <div className="alert alert-info">{result.reason}</div>
                    )}
                    <button className="btn btn-secondary btn-full" onClick={handleReset} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <ArrowLeft size={16} /> Start New Session
                    </button>
                </div>
            )}

            {error && phase !== 'reflecting' && (
                <div className="alert alert-error mt-4">{error}</div>
            )}
        </Card>
    );
}
