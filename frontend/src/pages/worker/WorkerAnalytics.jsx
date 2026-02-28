/**
 * pages/worker/WorkerAnalytics.jsx — Behavioral Insights (Worker)
 * Uses /worker/analytics endpoint for completion ratio + time per project.
 */
import { useState, useEffect } from 'react';
import { BarChart2, Clock, CheckCircle2, Timer, Loader2, AlertCircle, Target } from 'lucide-react';
import client from '../../api/client';

function StatCard({ icon, label, value, unit, detail, color }) {
    return (
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px', borderTop: `3px solid ${color}` }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                {icon}
            </div>
            <div className="card-title" style={{ marginBottom: 10 }}>{label}</div>
            <div style={{ fontSize: 44, fontWeight: 900, color, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {value}
                <span style={{ fontSize: 15, fontWeight: 600, opacity: 0.55, marginLeft: 3 }}>{unit}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, fontWeight: 500 }}>{detail}</div>
        </div>
    );
}

export default function WorkerAnalytics() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        client.get('/worker/analytics')
            .then(res => setStats(res.data))
            .catch(err => console.error('Analytics error:', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <Loader2 size={28} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    );

    if (!stats) return (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Could not load analytics data</div>
        </div>
    );

    const maxProjectMins = stats.time_per_project?.length
        ? Math.max(...stats.time_per_project.map(p => p.minutes), 1)
        : 1;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Header */}
            <div className="page-header" style={{ marginBottom: 0 }}>
                <div>
                    <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <BarChart2 size={28} color="var(--accent)" /> Behavioral Insights
                    </h2>
                    <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                        Execution metrics and work continuity patterns
                    </p>
                </div>
                <div style={{ padding: '6px 14px', background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.05em' }}>
                    LIVE SESSION DATA
                </div>
            </div>

            {/* KPI Cards */}
            <div className="dashboard-grid grid-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <StatCard icon={<Clock size={20} color="var(--sky)" />} label="Focus Today" value={stats.today_focus_minutes} unit="min" detail={`${stats.week_focus_minutes}m this week`} color="var(--sky)" />
                <StatCard icon={<CheckCircle2 size={20} color="var(--green)" />} label="Completion Ratio" value={stats.completion_ratio} unit="%" detail={`${stats.completed_tasks}/${stats.total_tasks} tasks`} color="var(--green)" />
                <StatCard icon={<Timer size={20} color="var(--amber)" />} label="Avg Session" value={stats.avg_session_length} unit="min" detail="Optimal: 45–75m" color="var(--amber)" />
                <StatCard icon={<Target size={20} color="var(--accent)" />} label="Projects Active" value={stats.time_per_project?.length || 0} unit="" detail="with logged time" color="var(--accent)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
                {/* 7-Day bar chart */}
                <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>7-Day Output Stream</div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-muted)', padding: '3px 8px', borderRadius: 'var(--radius-full)' }}>MINUTES OF FOCUS</span>
                    </div>
                    <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                        {stats.trend?.length > 0 ? stats.trend.map((day, idx) => {
                            const maxM = Math.max(...stats.trend.map(d => d.minutes), 1);
                            const hPct = (day.minutes / maxM) * 100;
                            return (
                                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                    {day.minutes > 0 && <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>{day.minutes}</div>}
                                    <div style={{ width: '100%', height: `${Math.max(4, hPct)}%`, background: day.minutes > 0 ? 'linear-gradient(180deg, var(--accent-light, #818cf8), var(--accent))' : 'var(--bg-subtle)', borderRadius: '4px 4px 2px 2px', border: day.minutes === 0 ? '1px dashed var(--border-subtle)' : 'none' }} />
                                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>{day.date?.substring(5)}</div>
                                </div>
                            );
                        }) : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No sessions yet</div>}
                    </div>
                </div>

                {/* Time per Project */}
                <div className="card" style={{ padding: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Time per Project</div>
                    {stats.time_per_project?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {stats.time_per_project.map((p, i) => {
                                const colors = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899'];
                                const c = colors[i % colors.length];
                                const pct = Math.round((p.minutes / maxProjectMins) * 100);
                                return (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{p.project}</span>
                                            <span style={{ fontSize: 12, fontWeight: 800, color: c }}>{p.minutes}m</span>
                                        </div>
                                        <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 99, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: c, borderRadius: 99, transition: 'width 600ms ease' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                            <BarChart2 size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.25 }} />
                            <div style={{ fontSize: 13, fontWeight: 600 }}>No project time logged yet</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>Complete sessions linked to tasks/projects</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Energy / Efficiency */}
            {stats.energy_vs_output?.length > 0 && (
                <div className="card" style={{ padding: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Energy → Focus Output Correlation</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                        {stats.energy_vs_output.map((e, i) => {
                            const color = e.energy_level <= 3 ? '#ef4444' : e.energy_level <= 7 ? '#f59e0b' : '#10b981';
                            return (
                                <div key={i} style={{ padding: '14px 16px', background: `${color}08`, border: `1px solid ${color}22`, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                                        Level {e.energy_level}
                                    </div>
                                    <div style={{ fontSize: 26, fontWeight: 900, color, letterSpacing: '-0.03em' }}>{e.avg_minutes}m</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{e.session_count} session{e.session_count !== 1 ? 's' : ''}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
