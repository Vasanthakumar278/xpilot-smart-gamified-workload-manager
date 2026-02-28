/**
 * components/worker/DayLoadBar.jsx
 * Planned vs Completed workload bar — replaces plain focus prompt.
 */
import { useState, useEffect } from 'react';
import { BarChart2, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import client from '../../api/client';

export default function DayLoadBar({ refreshKey = 0 }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        client.get('/day-summary/')
            .then(res => setData(res.data))
            .catch(err => console.error('DayLoadBar error:', err))
            .finally(() => setLoading(false));
    }, [refreshKey]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', marginBottom: 20 }}>
            <Loader2 size={18} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    );

    if (!data) return null;

    const { total_planned_minutes, total_completed_minutes, active_tasks_count, pending_count, completed_today } = data;
    const total = total_planned_minutes + total_completed_minutes;
    const pct = total > 0 ? Math.min(Math.round((total_completed_minutes / total) * 100), 100) : 0;

    return (
        <div className="card" style={{ padding: '20px 24px', marginBottom: 24, background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BarChart2 size={16} color="var(--accent)" />
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Today's Workload</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                        <Clock size={12} /> {total_planned_minutes}m planned
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>
                        <CheckCircle2 size={12} /> {total_completed_minutes}m done
                    </span>
                    {active_tasks_count > 0 && (
                        <span style={{ padding: '3px 10px', background: 'rgba(99,102,241,0.10)', color: 'var(--accent)', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 700 }}>
                            {active_tasks_count} active
                        </span>
                    )}
                </div>
            </div>

            {/* Dual progress bar */}
            <div style={{ height: 10, background: 'var(--bg-subtle)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
                {/* Planned bar (light indigo) */}
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${total > 0 ? 100 : 0}%`, background: 'rgba(99,102,241,0.15)', borderRadius: 99 }} />
                {/* Completed bar */}
                <div style={{
                    position: 'absolute', left: 0, top: 0, height: '100%',
                    width: `${pct}%`,
                    background: pct >= 80 ? 'var(--green)' : pct >= 40 ? 'var(--accent)' : 'var(--amber)',
                    borderRadius: 99,
                    transition: 'width 800ms ease',
                }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                <span>{pending_count} task{pending_count !== 1 ? 's' : ''} remaining</span>
                <span style={{ fontWeight: 700, color: pct >= 80 ? 'var(--green)' : 'var(--text-secondary)' }}>{pct}% complete</span>
            </div>
        </div>
    );
}
