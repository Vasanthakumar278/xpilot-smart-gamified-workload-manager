/**
 * modules/worker/ExecutionTimeline.jsx
 * Operational flow: focus blocks → breaks → collaboration.
 * Language: "execute", "block", "transition", "output window". No student vocabulary.
 */
import { useState } from 'react';

const TYPE_META = {
    deep: { icon: '🧠', label: 'Deep Work', color: '#4f46e5', bg: 'rgba(79,70,229,0.08)' },
    focus: { icon: '🎯', label: 'Focus Block', color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
    rest: { icon: '☕', label: 'Recovery', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
    review: { icon: '📋', label: 'Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    admin: { icon: '⚙️', label: 'Admin', color: '#64748b', bg: 'rgba(100,116,139,0.08)' },
    collab: { icon: '🤝', label: 'Collaboration', color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)' },
    creative: { icon: '💡', label: 'Creative', color: '#ec4899', bg: 'rgba(236,72,153,0.08)' },
};

export default function ExecutionTimeline({ schedule }) {
    const [activeIdx, setActiveIdx] = useState(null);

    if (!schedule?.blocks?.length) return (
        <div style={card}>
            <div style={sectionLabel}>🗓 Execution Timeline</div>
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>🗓</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    No execution plan
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Generate your workload plan to see the operational timeline.
                </div>
            </div>
        </div>
    );

    const blocks = schedule.blocks;

    return (
        <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={sectionLabel}>🗓 Execution Timeline</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {blocks.length} blocks · {schedule.total_focus_minutes}m output capacity
                </div>
            </div>

            {/* Compact timeline */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderRadius: 10, overflow: 'hidden', height: 8 }}>
                {blocks.map((b, i) => {
                    const meta = TYPE_META[b.type] || TYPE_META.admin;
                    return <div key={i} style={{ background: meta.color, flex: b.duration, minWidth: 3 }} title={`${b.title} ${b.duration}m`} />;
                })}
            </div>

            {/* Block list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {blocks.map((b, i) => {
                    const meta = TYPE_META[b.type] || TYPE_META.admin;
                    const isActive = activeIdx === i;
                    return (
                        <div
                            key={i}
                            onClick={() => setActiveIdx(isActive ? null : i)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                                background: isActive ? meta.bg : 'var(--bg-subtle)',
                                border: isActive ? `1px solid ${meta.color}50` : '1px solid var(--border-subtle)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {/* Time */}
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', minWidth: 80, fontVariantNumeric: 'tabular-nums' }}>
                                {b.start} → {b.end}
                            </div>

                            {/* Icon */}
                            <div style={{ fontSize: 16, flexShrink: 0 }}>{meta.icon}</div>

                            {/* Title + type */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {b.title}
                                </div>
                                {isActive && (
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.4 }}>
                                        {b.note}
                                    </div>
                                )}
                            </div>

                            {/* Duration pill */}
                            <div style={{ fontSize: 11, fontWeight: 700, color: meta.color, background: meta.color + '18', padding: '2px 8px', borderRadius: 999, flexShrink: 0, whiteSpace: 'nowrap' }}>
                                {b.duration}m
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                Tap a block to view execution notes
            </div>
        </div>
    );
}

const card = { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(99,102,241,0.1)' };
const sectionLabel = { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 0 };
