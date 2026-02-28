/**
 * components/TopicNavigator.jsx
 * Breaks a user-declared focus into 4-6 practical study areas via Ollama Mistral.
 * Navigation only — no tutoring, no explanations.
 *
 * Props:
 *   initialFocus {string?} — pre-fill the subject input (e.g. from ResumePanel)
 *   onSelectArea {(area: string) => void} — called when user clicks an area chip
 */
import { useState } from 'react';
import client from '../api/client';

export default function TopicNavigator({ initialFocus = '', onSelectArea }) {
    const [focus, setFocus] = useState(initialFocus);
    const [result, setResult] = useState(null);   // { focus, areas, source }
    const [loading, setLoading] = useState(false);
    const [started, setStarted] = useState(null);   // area string that was clicked

    async function generate() {
        const f = focus.trim();
        if (!f || loading) return;
        setLoading(true);
        setResult(null);
        setStarted(null);
        try {
            const res = await client.post('/topic-map/', { focus: f });
            setResult(res.data);
        } catch {
            setResult({ focus: f, areas: [], source: 'error' });
        } finally {
            setLoading(false);
        }
    }

    async function selectArea(area) {
        setStarted(area);
        onSelectArea?.(area);
        try { await client.post('/sessions/start'); } catch { /* optimistic */ }
    }

    function handleKey(e) {
        if (e.key === 'Enter') generate();
    }

    return (
        <div style={cardStyle}>
            {/* ── Header ── */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>🗺️</span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                        Topic Navigator
                    </span>
                    <span style={badgeStyle}>AI-powered</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    Declare your subject — get structured focus areas. No tutoring, just navigation.
                </p>
            </div>

            {/* ── Input row ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                    value={focus}
                    onChange={e => setFocus(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="e.g. Cloud Computing, Control Systems, OS Concepts…"
                    disabled={loading}
                    style={inputStyle}
                />
                <button
                    onClick={generate}
                    disabled={!focus.trim() || loading}
                    style={btnStyle(!focus.trim() || loading)}
                >
                    {loading ? '…' : 'Map →'}
                </button>
            </div>

            {/* ── Loading skeleton ── */}
            {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={skeletonStyle} />
                    ))}
                </div>
            )}

            {/* ── Results ── */}
            {!loading && result && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Suggested Focus Areas for <em style={{ fontStyle: 'normal', color: '#6366f1' }}>{result.focus}</em>
                        </span>
                        {result.source === 'fallback' && (
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                (offline map)
                            </span>
                        )}
                        {result.source === 'error' && (
                            <span style={{ fontSize: 10, color: '#ef4444' }}>Could not generate map</span>
                        )}
                    </div>

                    {result.areas.length === 0 && (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            No areas generated. Try rephrasing your subject.
                        </p>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {result.areas.map((area, i) => (
                            <AreaChip
                                key={i}
                                index={i}
                                area={area}
                                active={started === area}
                                onSelect={() => selectArea(area)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Area chip ───────────────────────────────────────────────────────────── */
function AreaChip({ index, area, active, onSelect }) {
    return (
        <div
            onClick={active ? undefined : onSelect}
            style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 16px', borderRadius: 12, cursor: active ? 'default' : 'pointer',
                background: active ? 'rgba(99,102,241,0.08)' : '#fff',
                border: active ? '1.5px solid #6366f1' : '1px solid rgba(0,0,0,0.07)',
                boxShadow: active ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 2px 6px rgba(0,0,0,0.04)',
                transition: 'all 0.18s ease',
                animation: `fadeSlide 0.25s ease ${index * 0.06}s both`,
            }}
        >
            <span style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                background: active ? '#6366f1' : 'rgba(99,102,241,0.1)',
                color: active ? '#fff' : '#6366f1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
            }}>
                {index + 1}
            </span>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', fontWeight: active ? 600 : 500 }}>
                {area}
            </span>
            {active ? (
                <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 700 }}>▶ Started</span>
            ) : (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Start →</span>
            )}
        </div>
    );
}

/* ── Styles ──────────────────────────────────────────────────────────────── */
const cardStyle = {
    background: '#fff', borderRadius: 16,
    border: '1px solid rgba(0,0,0,0.07)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    padding: '20px 22px',
    marginBottom: 20,
};

const badgeStyle = {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
    padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase',
    background: 'rgba(99,102,241,0.1)', color: '#6366f1',
};

const inputStyle = {
    flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 13,
    border: '1.5px solid rgba(99,102,241,0.2)', outline: 'none',
    fontFamily: 'inherit', background: '#f8fafc', color: 'var(--text-primary)',
    transition: 'border-color 0.2s ease',
};

const btnStyle = (disabled) => ({
    padding: '10px 20px', borderRadius: 10, border: 'none',
    background: disabled ? '#e2e8f0' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: disabled ? '#94a3b8' : '#fff',
    fontWeight: 700, fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', flexShrink: 0,
    boxShadow: disabled ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
});

const skeletonStyle = {
    height: 44, borderRadius: 12,
    background: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
};
