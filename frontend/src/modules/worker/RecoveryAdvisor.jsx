/**
 * modules/worker/RecoveryAdvisor.jsx
 * Anti-burnout and reset recommendations based on energy tier.
 * Language: "recovery", "reset", "sustainability", "burnout prevention". Never "streak" or "XP".
 */

const ADVICE_BY_TIER = {
    critical: {
        level: 'High Risk',
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.07)',
        border: 'rgba(239,68,68,0.2)',
        blocks: [
            { icon: '🛑', title: 'Full Stop Recommended', body: 'Your cognitive capacity is critically low. Attempting deep work will generate poor output and increase error rates. Rest is the highest ROI activity right now.' },
            { icon: '💤', title: 'Recovery Protocol', body: 'Minimum 20-min nap, physical movement, or full disconnection. Do not open email, Slack, or complex tasks for at least 90 minutes.' },
            { icon: '📉', title: 'Burnout Indicator', body: 'Consistent low energy (3 days or more) is an early burnout signal. Flag to manager or adjust sprint load if applicable.' },
        ],
    },
    reduced: {
        level: 'Reduced Capacity',
        color: '#10b981',
        bg: 'rgba(16,185,129,0.06)',
        border: 'rgba(16,185,129,0.2)',
        blocks: [
            { icon: '⬇️', title: 'Reduce Cognitive Load', body: 'Pair low-energy states with low-stakes tasks — responses, admin, light reading. Avoid architectural decisions or creative output.' },
            { icon: '☕', title: 'Micro-Recovery Breaks', body: 'Insert 10-minute breaks every 40 minutes. Brief physical movement (walk, stretch) resets mental state more effectively than passive rest.' },
            { icon: '🗓', title: 'Reschedule Deep Work', body: 'Any high-focus tasks should be moved to a higher-energy window. Forcing deep work in reduced capacity triples error rate.' },
        ],
    },
    normal: {
        level: 'Sustainable Load',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.06)',
        border: 'rgba(245,158,11,0.2)',
        blocks: [
            { icon: '⚖️', title: 'Balanced Execution', body: 'You are operating at sustainable capacity. Mix focus blocks with administrative tasks to maintain output without accumulating fatigue.' },
            { icon: '⏰', title: 'Protect Peak Hours', body: 'Identify your personal peak energy window (usually 2–4 hours after waking). Block it for your highest-leverage work.' },
            { icon: '🌿', title: 'Preemptive Maintenance', body: 'Good sleep and end-of-day shutdown rituals prevent depletion. Avoid extending sessions beyond your planned cutoff.' },
        ],
    },
    high: {
        level: 'High Output Window',
        color: '#6366f1',
        bg: 'rgba(99,102,241,0.06)',
        border: 'rgba(99,102,241,0.2)',
        blocks: [
            { icon: '🎯', title: 'Assign High-Leverage Work', body: 'High energy states are scarce. Use this window for work that requires focus, judgment, and creativity. Delay routine tasks.' },
            { icon: '🔕', title: 'Isolate the Window', body: 'Notify team of deep work mode. Disable notifications for 90-minute blocks. Every interruption adds 23 minutes of refocus time.' },
            { icon: '📏', title: 'Watch the Ceiling', body: 'Even at high energy, schedule a mandatory recovery break after 90–120 minutes. Exceeding this degrades output quality by 30%+.' },
        ],
    },
    peak: {
        level: 'Peak Capacity',
        color: '#4338ca',
        bg: 'rgba(67,56,202,0.06)',
        border: 'rgba(67,56,202,0.2)',
        blocks: [
            { icon: '🚀', title: 'Maximum Output Mode', body: 'This is your highest cognitive performance state. Defer everything non-essential. Use this window for your most important unsolved problem.' },
            { icon: '🔐', title: 'Protect at All Cost', body: 'Reject all meetings, ad-hoc requests, and context-switches. Peak states last 2–4 hours — losing them to admin is an expensive trade.' },
            { icon: '📊', title: 'Track Peak Windows', body: 'Note the time of day and prior-night sleep when peak states occur. Patterns emerge over 2–3 weeks and allow you to schedule proactively.' },
        ],
    },
};

export default function RecoveryAdvisor({ energyLevel }) {
    const tier = !energyLevel ? null
        : energyLevel <= 2 ? 'critical'
            : energyLevel <= 4 ? 'reduced'
                : energyLevel <= 6 ? 'normal'
                    : energyLevel <= 8 ? 'high'
                        : 'peak';

    if (!tier) return (
        <div style={card}>
            <div style={sectionLabel}>🛡 Recovery Advisor</div>
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>🛡</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>No energy input yet</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Submit your energy level to receive personalised recovery and sustainability recommendations.
                </div>
            </div>
        </div>
    );

    const advice = ADVICE_BY_TIER[tier];

    return (
        <div style={{ ...card, borderTop: `3px solid ${advice.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={sectionLabel}>🛡 Recovery Advisor</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: advice.color, background: advice.color + '18', padding: '3px 10px', borderRadius: 999 }}>
                    {advice.level}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {advice.blocks.map((b, i) => (
                    <div key={i} style={{ padding: '14px 16px', borderRadius: 10, background: advice.bg, border: `1px solid ${advice.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 18 }}>{b.icon}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{b.title}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {b.body}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const card = { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(99,102,241,0.1)' };
const sectionLabel = { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 0 };
