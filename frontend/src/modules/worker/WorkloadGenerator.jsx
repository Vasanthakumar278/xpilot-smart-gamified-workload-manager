/**
 * modules/worker/WorkloadGenerator.jsx
 * Shows the generated schedule as a cognitive load distribution overview.
 * Language: "output", "load", "blocks", "capacity allocation".
 */

const TYPE_META = {
    deep: { label: 'Deep Work', color: '#4f46e5', textColor: '#c7d2fe' },
    focus: { label: 'Focus Block', color: '#6366f1', textColor: '#e0e7ff' },
    creative: { label: 'Creative', color: '#ec4899', textColor: '#fce7f3' },
    collab: { label: 'Collaboration', color: '#0ea5e9', textColor: '#bae6fd' },
    review: { label: 'Review', color: '#f59e0b', textColor: '#fef3c7' },
    admin: { label: 'Admin', color: '#64748b', textColor: '#e2e8f0' },
    rest: { label: 'Recovery', color: '#10b981', textColor: '#d1fae5' },
};

export default function WorkloadGenerator({ schedule }) {
    if (!schedule) return (
        <div style={card}>
            <div style={label}>📊 Workload Distribution</div>
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>📊</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    No workload plan generated
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Submit your energy level in the console above<br />to generate a workload plan.
                </div>
            </div>
        </div>
    );

    const blocks = schedule.blocks ?? [];
    const total = blocks.reduce((s, b) => s + b.duration, 0);
    const focusMinutes = schedule.total_focus_minutes ?? 0;
    const tier = schedule.tier ?? 'medium';

    // Group by type for load distribution
    const grouped = {};
    blocks.forEach(b => {
        grouped[b.type] = (grouped[b.type] || 0) + b.duration;
    });

    return (
        <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={label}>📊 Workload Distribution</div>
                <div style={{
                    fontSize: 10, fontWeight: 700, color: schedule.accent_color,
                    background: schedule.accent_color + '18', padding: '3px 10px',
                    borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                    {schedule.label}
                </div>
            </div>

            {/* Key metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
                {[
                    { icon: '⏱', value: `${total}m`, sub: 'Total planned' },
                    { icon: '🧠', value: `${focusMinutes}m`, sub: 'Focus output' },
                    { icon: '📈', value: `${Math.round((focusMinutes / total) * 100)}%`, sub: 'Load ratio' },
                ].map(s => (
                    <div key={s.sub} style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: 18, marginBottom: 2 }}>{s.icon}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{s.sub}</div>
                    </div>
                ))}
            </div>

            {/* Load bar */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                    Capacity Allocation
                </div>
                <div style={{ display: 'flex', height: 18, borderRadius: 999, overflow: 'hidden', gap: 2 }}>
                    {Object.entries(grouped).map(([type, mins]) => {
                        const meta = TYPE_META[type] || TYPE_META.admin;
                        return (
                            <div
                                key={type}
                                title={`${meta.label}: ${mins}m`}
                                style={{ background: meta.color, flex: mins, borderRadius: 999, transition: 'flex 0.5s ease', minWidth: 4 }}
                            />
                        );
                    })}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {Object.entries(grouped).map(([type, mins]) => {
                        const meta = TYPE_META[type] || TYPE_META.admin;
                        return (
                            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-secondary)' }}>
                                <div style={{ width: 8, height: 8, borderRadius: 2, background: meta.color, flexShrink: 0 }} />
                                {meta.label} {mins}m
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Description */}
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg-subtle)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {schedule.description}
            </div>
        </div>
    );
}

const card = { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(99,102,241,0.1)' };
const label = { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 0 };
