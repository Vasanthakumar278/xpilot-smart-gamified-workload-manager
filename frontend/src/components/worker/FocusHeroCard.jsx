/**
 * components/worker/FocusHeroCard.jsx
 * Gradient "Start a session" CTA card — inspired by Student's StudySessionCard.
 * Replaces the plain dashed prompt on the Worker Dashboard.
 */
import { Zap, Coffee, ArrowRight } from 'lucide-react';

export default function FocusHeroCard({ tasksCount = 0 }) {
    return (
        <div style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, #818cf8 60%, #6ee7b7 100%)',
            padding: '32px 32px 28px',
            borderRadius: 'var(--radius-xl)',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: 28,
        }}>
            {/* Decorative blobs */}
            <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: -20, right: 80, width: 80, height: 80, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />

            <div style={{ position: 'relative', zIndex: 2 }}>
                {/* Label */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(255,255,255,0.18)', borderRadius: 'var(--radius-full)', marginBottom: 16 }}>
                    <Zap size={12} fill="#fff" color="#fff" />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                        {tasksCount > 0 ? `${tasksCount} task${tasksCount > 1 ? 's' : ''} pending` : 'No tasks yet'}
                    </span>
                </div>

                <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.2 }}>
                    Ready to focus?
                </h3>
                <p style={{ fontSize: 13, opacity: 0.88, margin: '0 0 24px', maxWidth: 260, lineHeight: 1.55 }}>
                    {tasksCount > 0
                        ? 'Select a task below to lock into Execution Mode and earn XP.'
                        : 'Create a project and add tasks to get started.'}
                </p>

                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: '#fff',
                        color: 'var(--accent)',
                        padding: '10px 22px',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 700, fontSize: 14,
                    }}>
                        <Zap size={15} fill="var(--accent)" />
                        Start Session
                        <ArrowRight size={14} />
                    </div>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center',
                        background: 'rgba(255,255,255,0.18)',
                        color: '#fff',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'default',
                    }}>
                        <Coffee size={16} />
                    </div>
                </div>
            </div>
        </div>
    );
}
