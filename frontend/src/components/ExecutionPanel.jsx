/**
 * components/ExecutionPanel.jsx
 * Interactive execution workflow — each block is idle → active → done.
 *
 * Click behaviour:
 *   idle   → active  (only one block can be active at a time)
 *   active → done
 *   done   → idle    (reset if needed)
 *
 * Special cases:
 *   Deep Work  → active: triggers POST /sessions/start
 *   Close Cycle → active: opens Reflection modal
 *
 * Props:
 *   topic      {string?} — active topic from FocusTrack
 *   lastFocus  {string?} — last session context
 *   onExecute  {fn}      — called on "Start Execution" (pre-workflow entry point)
 */
import { useState, useEffect } from 'react';
import client from '../api/client';

/* ── Block definitions ───────────────────────────────────────────────────── */
const BLOCK_DEFS = [
    {
        id: 'deep',
        label: 'Deep Work Block',
        icon: '⚡',
        optional: false,
        desc: (topic) => `Primary focus on ${topic}. Work through the hardest unresolved part first.`,
    },
    {
        id: 'apply',
        label: 'Application Block',
        icon: '🔧',
        optional: false,
        desc: (topic) => `Apply ${topic} — solve a problem, build a component, or draft a concrete output.`,
    },
    {
        id: 'reset',
        label: 'Optional Reset',
        icon: '↻',
        optional: true,
        desc: () => 'Step back briefly if forward progress stalls. Reframe, then re-engage.',
    },
    {
        id: 'close',
        label: 'Close Cycle',
        icon: '✓',
        optional: false,
        desc: (topic) => `Log one concrete insight from this ${topic} block before closing.`,
    },
];

const INITIAL_BLOCKS = BLOCK_DEFS.map(b => ({ ...b, status: 'idle' }));

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function ExecutionPanel({ topic: initialTopic, lastFocus, onExecute }) {
    const [topicInput, setTopicInput] = useState(initialTopic || '');
    const [isTopicSet, setIsTopicSet] = useState(!!initialTopic);
    const displayTopic = isTopicSet ? topicInput : (initialTopic || 'Current Focus');

    const [blocks, setBlocks] = useState(INITIAL_BLOCKS);
    const [reflection, setReflection] = useState(false);   // Reflection modal
    const [sessionOpen, setSessionOpen] = useState(false);   // session API in-flight

    // Update local state if prop changes
    useEffect(() => {
        if (initialTopic) {
            setTopicInput(initialTopic);
            setIsTopicSet(true);
        }
    }, [initialTopic]);

    /* ── Click handler ── */
    async function handleBlockClick(id) {
        setBlocks(prev => {
            const current = prev.find(b => b.id === id);

            return prev.map(b => {
                if (b.id !== id) {
                    // Deactivate any other active block → done
                    return b.status === 'active' ? { ...b, status: 'done' } : b;
                }

                // Cycle own status
                if (b.status === 'idle') return { ...b, status: 'active' };
                if (b.status === 'active') return { ...b, status: 'done' };
                return { ...b, status: 'idle' };  // done → idle (reset)
            });
        });

        // Side effects triggered when a block becomes active
        const current = blocks.find(b => b.id === id);
        const nextStatus = current.status === 'idle' ? 'active' : null;

        if (nextStatus === 'active') {
            if (id === 'deep' && !sessionOpen) {
                setSessionOpen(true);
                try { await client.post('/sessions/start'); } catch { /* optimistic */ }
            }
            if (id === 'close') {
                setReflection(true);
            }
        }
    }

    const allDone = blocks.every(b => b.status === 'done');

    return (
        <>
            <div style={panelStyle}>
                {/* ── Title ── */}
                <div style={titleRowStyle}>
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
                            Today's Execution
                            {isTopicSet && (
                                <>
                                    — <span style={{ color: '#6366f1' }}>{displayTopic}</span>
                                </>
                            )}
                        </div>
                        {lastFocus && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                                Continuing from:{' '}
                                <em style={{ fontStyle: 'normal', color: 'var(--text-secondary)' }}>{lastFocus}</em>
                            </div>
                        )}
                    </div>
                    {isTopicSet && <WorkflowProgress blocks={blocks} />}
                </div>

                {!isTopicSet ? (
                    <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>What is your focus for today?</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g. Build authentication API, Finish essay draft..."
                                value={topicInput}
                                onChange={(e) => setTopicInput(e.target.value)}
                                style={{ width: '100%', fontSize: 15, padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && topicInput.trim().length > 0) {
                                        setIsTopicSet(true);
                                    }
                                }}
                            />
                        </div>
                        <button
                            className="btn btn-primary"
                            disabled={!topicInput.trim()}
                            onClick={() => setIsTopicSet(true)}
                            style={{ alignSelf: 'flex-start' }}
                        >
                            Set Focus & Start
                        </button>
                    </div>
                ) : (
                    <>
                        {/* ── Blocks ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                            {blocks.map((block, i) => (
                                <ExecutionBlock
                                    key={block.id}
                                    block={block}
                                    topic={displayTopic}
                                    index={i}
                                    onClick={() => handleBlockClick(block.id)}
                                />
                            ))}
                        </div>

                        {/* ── CTA ── */}
                        {allDone ? (
                            <div style={allDoneBannerStyle}>
                                ✅ Cycle complete. Log your session to capture progress.
                            </div>
                        ) : (
                            <button onClick={onExecute} style={startBtnStyle}>
                                <span style={{ fontSize: 16 }}>▶</span>
                                Start Execution
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* ── Reflection modal ── */}
            {reflection && (
                <ReflectionModal
                    topic={displayTopic}
                    onClose={() => setReflection(false)}
                    onSubmit={(text) => {
                        setReflection(false);
                        setBlocks(prev => prev.map(b => b.id === 'close' ? { ...b, status: 'done' } : b));
                    }}
                />
            )}
        </>
    );
}

/* ── Workflow progress indicator ─────────────────────────────────────────── */
function WorkflowProgress({ blocks }) {
    const done = blocks.filter(b => b.status === 'done').length;
    const total = blocks.length;
    const pct = Math.round((done / total) * 100);

    return (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                {done} / {total} done
            </div>
            <div style={{ width: 72, height: 5, borderRadius: 999, background: 'rgba(99,102,241,0.12)', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', borderRadius: 999,
                    background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                    width: `${pct}%`, transition: 'width 0.4s ease',
                }} />
            </div>
        </div>
    );
}

/* ── Individual block ────────────────────────────────────────────────────── */
function ExecutionBlock({ block, topic, index, onClick }) {
    const { status, icon, label, optional, desc, id } = block;

    const isActive = status === 'active';
    const isDone = status === 'done';

    const cardStyle = {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '13px 14px',
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        animation: `fadeSlide 0.25s ease ${index * 0.07}s both`,
        userSelect: 'none',

        // State-driven appearance
        background: isActive ? 'rgba(99,102,241,0.06)' : isDone ? '#f8fafc' : '#fafafa',
        border: isActive ? '1.5px solid #6366f1' : isDone ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(0,0,0,0.05)',
        boxShadow: isActive ? '0 0 0 3px rgba(99,102,241,0.12), 0 4px 14px rgba(99,102,241,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
        opacity: isDone ? 0.72 : 1,
    };

    return (
        <div style={cardStyle} onClick={onClick} role="button" tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onClick()}>

            {/* Left accent bar */}
            <div style={{
                width: 3, alignSelf: 'stretch', borderRadius: 3, flexShrink: 0,
                background: isActive
                    ? 'linear-gradient(180deg, #6366f1, #4f46e5)'
                    : isDone
                        ? 'linear-gradient(180deg, #10b981, #059669)'
                        : optional
                            ? 'linear-gradient(180deg, #94a3b8, #cbd5e1)'
                            : 'linear-gradient(180deg, #e2e8f0, #e2e8f0)',
                transition: 'background 0.25s ease',
            }} />

            {/* Icon box */}
            <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isDone ? 16 : 15,
                background: isActive
                    ? 'rgba(99,102,241,0.12)'
                    : isDone
                        ? 'rgba(16,185,129,0.1)'
                        : optional ? 'rgba(148,163,184,0.1)' : 'rgba(99,102,241,0.07)',
                transition: 'all 0.2s ease',
            }}>
                {isDone ? '✓' : icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{
                        fontSize: 13, fontWeight: 700,
                        color: isDone ? '#64748b' : isActive ? '#4f46e5' : 'var(--text-primary)',
                        transition: 'color 0.2s ease',
                        letterSpacing: '-0.01em',
                    }}>
                        {label}
                    </span>
                    {optional && (
                        <span style={{
                            fontSize: 10, fontWeight: 600,
                            padding: '2px 7px', borderRadius: 999,
                            background: 'rgba(148,163,184,0.15)', color: '#64748b',
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                            optional
                        </span>
                    )}
                </div>
                <div style={{ fontSize: 12, color: isDone ? '#94a3b8' : 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <span style={{ color: isActive ? '#6366f1' : '#94a3b8', fontWeight: 700, marginRight: 5 }}>→</span>
                    {desc(topic)}
                </div>
            </div>

            {/* Status badge */}
            <StatusBadge status={status} />
        </div>
    );
}

function StatusBadge({ status }) {
    if (status === 'idle') return (
        <div style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0, paddingTop: 2, fontWeight: 600 }}>START</div>
    );
    if (status === 'active') return (
        <div style={{
            fontSize: 10, fontWeight: 700, color: '#6366f1',
            padding: '3px 8px', borderRadius: 999,
            background: 'rgba(99,102,241,0.1)',
            flexShrink: 0, animation: 'pulse 2s ease infinite',
        }}>
            ACTIVE
        </div>
    );
    return (
        <div style={{
            fontSize: 10, fontWeight: 700, color: '#059669',
            padding: '3px 8px', borderRadius: 999,
            background: 'rgba(16,185,129,0.1)', flexShrink: 0,
        }}>
            DONE
        </div>
    );
}

/* ── Reflection modal ────────────────────────────────────────────────────── */
function ReflectionModal({ topic, onClose, onSubmit }) {
    const [text, setText] = useState('');
    const [saving, setSaving] = useState(false);

    async function submit() {
        if (!text.trim()) return;
        setSaving(true);
        try {
            await client.post('/reflections/', { text: text.trim() });
        } catch { /* optimistic */ }
        finally { setSaving(false); }
        onSubmit(text);
    }

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                            Close Cycle
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {topic} — capture one concrete insight
                        </div>
                    </div>
                    <button onClick={onClose} style={closeBtnStyle}>✕</button>
                </div>

                {/* Prompts */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    {['What did I produce?', 'What was the blocker?', 'What do I carry forward?'].map(p => (
                        <button key={p} onClick={() => setText(prev => prev ? `${prev} ${p}` : p)}
                            style={promptChipStyle}>
                            {p}
                        </button>
                    ))}
                </div>

                <textarea
                    autoFocus
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Log your insight here…"
                    style={textareaStyle}
                    rows={4}
                />

                <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={cancelBtnStyle}>Skip</button>
                    <button onClick={submit} disabled={!text.trim() || saving} style={submitBtnStyle(!text.trim() || saving)}>
                        {saving ? 'Saving…' : '✓ Log Insight'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Styles ──────────────────────────────────────────────────────────────── */
const panelStyle = {
    background: '#fff', borderRadius: 16,
    border: '1px solid rgba(99,102,241,0.12)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    padding: '22px 24px', marginBottom: 20,
};

const titleRowStyle = {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: 18,
};

const allDoneBannerStyle = {
    padding: '13px 18px', borderRadius: 12,
    background: 'rgba(16,185,129,0.08)',
    border: '1px solid rgba(16,185,129,0.25)',
    color: '#059669', fontWeight: 700, fontSize: 14,
    textAlign: 'center',
};

const startBtnStyle = {
    width: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: '13px 24px', borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
    color: '#fff', fontWeight: 700, fontSize: 15,
    cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
    letterSpacing: '-0.01em',
};

// Modal
const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 9998,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'fadeIn 0.18s ease',
};

const modalStyle = {
    width: 420, borderRadius: 18,
    background: '#fff', padding: '22px 24px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
    animation: 'fadeSlide 0.22s ease',
};

const closeBtnStyle = {
    background: 'rgba(0,0,0,0.05)', border: 'none',
    width: 28, height: 28, borderRadius: 9999,
    cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const promptChipStyle = {
    fontSize: 11, padding: '4px 10px', borderRadius: 999,
    background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)',
    color: '#4f46e5', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
};

const textareaStyle = {
    width: '100%', borderRadius: 10, fontSize: 13,
    border: '1.5px solid rgba(99,102,241,0.2)', outline: 'none',
    padding: '10px 12px', fontFamily: 'inherit',
    color: 'var(--text-primary)', resize: 'vertical',
    background: '#f8fafc', lineHeight: 1.6, boxSizing: 'border-box',
};

const cancelBtnStyle = {
    padding: '9px 18px', borderRadius: 999, border: '1px solid rgba(0,0,0,0.1)',
    background: 'transparent', color: '#64748b', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
};

const submitBtnStyle = (disabled) => ({
    padding: '9px 22px', borderRadius: 999, border: 'none',
    background: disabled ? '#e2e8f0' : 'linear-gradient(135deg, #4f46e5, #6366f1)',
    color: disabled ? '#94a3b8' : '#fff',
    fontWeight: 700, fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', boxShadow: disabled ? 'none' : '0 4px 14px rgba(99,102,241,0.3)',
});
