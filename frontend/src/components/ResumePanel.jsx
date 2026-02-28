/**
 * components/ResumePanel.jsx
 * Automatic continuation prompt — no chat, no typing.
 * Shown only when the backend has a resume recommendation.
 *
 * Data: GET /resume/{user_id}  |  POST /sessions/start
 */
import { useState, useEffect } from 'react';
import client from '../api/client';

/* Urgency → accent colour */
const URGENCY_COLORS = {
    high: { bg: 'rgba(99,102,241,0.07)', border: '#6366f1', badge: '#6366f1', badgeBg: 'rgba(99,102,241,0.12)' },
    medium: { bg: 'rgba(16,185,129,0.06)', border: '#10b981', badge: '#059669', badgeBg: 'rgba(16,185,129,0.12)' },
    low: { bg: 'rgba(245,158,11,0.07)', border: '#f59e0b', badge: '#d97706', badgeBg: 'rgba(245,158,11,0.12)' },
};

const URGENCY_LABELS = {
    high: '🔥 Pick up right now',
    medium: '✅ Perfect timing',
    low: '🌱 Reactivation',
};

function GapLabel({ hours }) {
    if (hours < 1) return <span>{Math.round(hours * 60)} min ago</span>;
    if (hours < 24) return <span>{Math.round(hours)}h ago</span>;
    return <span>{Math.round(hours / 24)} day(s) ago</span>;
}

export default function ResumePanel({ onSessionStarted }) {
    const user = JSON.parse(localStorage.getItem('xpilot_user') || '{}');
    const userId = user.id ?? 1;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [resuming, setResuming] = useState(false);
    const [done, setDone] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        client.get(`/resume/${userId}`)
            .then(r => setData(r.data))
            .catch(() => setData(null))   // 204 or network error → nothing to show
            .finally(() => setLoading(false));
    }, [userId]);

    async function handleResume() {
        setResuming(true);
        try {
            await client.post('/sessions/start');
            setDone(true);
            onSessionStarted?.();
        } catch {
            setDone(true);   // optimistic — don't block the student
        } finally {
            setResuming(false);
        }
    }

    /* Nothing to show */
    if (loading || !data || dismissed) return null;

    const urgency = data.urgency ?? 'medium';
    const c = URGENCY_COLORS[urgency] ?? URGENCY_COLORS.medium;

    return (
        <div style={{
            background: c.bg,
            border: `1.5px solid ${c.border}30`,
            borderLeft: `4px solid ${c.border}`,
            borderRadius: 16,
            padding: '18px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            boxShadow: '0 4px 18px rgba(0,0,0,0.05)',
            animation: 'fadein 0.35s ease',
        }}>
            <style>{`@keyframes fadein { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }`}</style>

            {/* Left: icon */}
            <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: c.badgeBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
            }}>
                📖
            </div>

            {/* Centre: text */}
            <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                        Continue: <em style={{ fontStyle: 'normal', color: c.badge }}>{data.focus}</em>
                    </span>
                    <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                        padding: '2px 8px', borderRadius: 999,
                        background: c.badgeBg, color: c.badge, textTransform: 'uppercase',
                    }}>
                        {URGENCY_LABELS[urgency]}
                    </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {data.message}
                </p>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                    Last session: <GapLabel hours={data.gap_hours} /> · Suggested: {data.recommended_duration} min
                </div>
            </div>

            {/* Right: action buttons */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {done ? (
                    <div style={{
                        padding: '9px 18px', borderRadius: 999,
                        background: 'rgba(16,185,129,0.12)', color: '#059669',
                        fontSize: 13, fontWeight: 700,
                        border: '1px solid rgba(16,185,129,0.25)',
                    }}>
                        ✓ Session started
                    </div>
                ) : (
                    <button
                        onClick={handleResume}
                        disabled={resuming}
                        style={{
                            padding: '9px 22px', borderRadius: 999, border: 'none',
                            background: `linear-gradient(135deg, ${c.border}, ${c.badge})`,
                            color: '#fff', fontWeight: 700, fontSize: 13,
                            cursor: resuming ? 'not-allowed' : 'pointer',
                            opacity: resuming ? 0.7 : 1,
                            boxShadow: `0 4px 14px ${c.border}40`,
                            transition: 'all 0.2s ease',
                            fontFamily: 'inherit',
                        }}
                    >
                        {resuming ? 'Starting…' : '▶ Resume'}
                    </button>
                )}
                <button
                    onClick={() => setDismissed(true)}
                    title="Dismiss"
                    style={{
                        width: 34, height: 34, borderRadius: 9999, border: 'none',
                        background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)',
                        cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
