import { Calendar, Clock, ChevronRight, Zap } from 'lucide-react';

export default function ExecutionPlanner({ schedule }) {
    if (!schedule || !schedule.blocks) return null;

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--accent-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={16} color="var(--accent)" />
                </div>
                <div>
                    <div className="card-title">Execution Plan</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>AI-optimized for your energy level</div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {schedule.blocks.map((block, i) => (
                    <div key={i} style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: i === 0 ? 'var(--accent-muted)' : 'var(--bg-subtle)',
                        border: `1px solid ${i === 0 ? 'var(--border)' : 'transparent'}`,
                        display: 'flex', alignItems: 'center', gap: 14
                    }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: i === 0 ? 'var(--accent)' : 'var(--surface)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 800, color: i === 0 ? '#fff' : 'var(--text-muted)',
                            flexShrink: 0
                        }}>
                            {i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: i === 0 ? 'var(--accent)' : 'var(--text-primary)' }}>
                                {block.title}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                <Clock size={10} /> {block.duration} min
                            </div>
                        </div>
                        {i === 0 && <span className="badge badge-accent">Up Next</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}
