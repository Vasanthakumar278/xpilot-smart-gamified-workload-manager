import { Trophy, CheckCircle, ArrowRight } from 'lucide-react';

export default function SessionCompleteCard({ taskTitle, durationMinutes, onReturn }) {
    return (
        <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
            <div style={{ width: 420, background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 48, boxShadow: 'var(--shadow-lg)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <Trophy size={36} color="var(--green)" />
                </div>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Mission Complete!</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 15 }}>{taskTitle}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
                    <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>{durationMinutes}m</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Focus Time</div>
                    </div>
                    <div style={{ padding: '16px', background: '#ecfdf5', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--green)' }}>+10</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>XP Earned</div>
                    </div>
                </div>

                <button className="btn btn-primary btn-full btn-lg" onClick={onReturn}>
                    Return to Console <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}
