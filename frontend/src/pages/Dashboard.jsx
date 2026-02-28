/**
 * pages/Dashboard.jsx — Main dashboard: XP, session timer, today's summary
 */
import { useState, useEffect } from 'react';
import { Sparkles, Timer, Flame, Calendar, Target } from 'lucide-react';
import SessionTimer from '../components/SessionTimer';
import AnalyticsCard from '../components/AnalyticsCard';
import Card from '../components/Card';
import ResumePanel from '../components/ResumePanel';
import client from '../api/client';

export default function Dashboard() {
    const [analytics, setAnalytics] = useState(null);
    const [xpLog, setXpLog] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('xpilot_user') || '{}');

    async function loadData() {
        try {
            const [analRes, xpRes] = await Promise.all([
                client.get('/analytics/me'),
                client.get('/xp/log'),
            ]);
            setAnalytics(analRes.data);
            setXpLog(xpRes.data.history.slice(0, 5));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadData(); }, []);

    function handleXPEarned(result) {
        // Re-fetch analytics after XP is awarded
        setTimeout(() => loadData(), 500);
    }

    return (
        <div className="student-dashboard">
            {/* Page header */}
            <div className="page-header">
                <div>
                    <h2 className="page-title">
                        Good {getTimeOfDay()}, {user.name?.split(' ')[0] || 'there'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
                        {user.role === 'worker'
                            ? 'Energy-aware scheduling for peak performance.'
                            : 'Consistent study habits start with one session.'}
                    </p>
                </div>
                <div className="badge badge-accent" style={{ fontSize: 16, padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={18} /> {user.xp ?? analytics?.xp_today ?? 0} Total XP
                </div>
            </div>

            {/* ── Resume banner (auto-shown when user has prior sessions) ── */}
            <ResumePanel onSessionStarted={() => setTimeout(() => loadData(), 800)} />

            {/* Stats row */}
            <div className="dashboard-grid mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <AnalyticsCard
                    icon={<Timer size={20} />}
                    title="Focus Today"
                    value={analytics?.total_focus_time_today ?? 0}
                    unit="min"
                    loading={loading}
                    sub="Total focused minutes"
                    color="var(--accent)"
                />
                <AnalyticsCard
                    icon={<Flame size={20} />}
                    title="Sessions Today"
                    value={analytics?.sessions_today ?? 0}
                    loading={loading}
                    sub="Completed sessions"
                    color="var(--amber)"
                />
                <AnalyticsCard
                    icon={<Calendar size={20} />}
                    title="This Week"
                    value={analytics?.sessions_this_week ?? 0}
                    loading={loading}
                    sub="Sessions this week"
                    color="var(--sky)"
                />
                <AnalyticsCard
                    icon={<Target size={20} />}
                    title="Consistency"
                    value={analytics?.consistency_score ?? 0}
                    unit="%"
                    loading={loading}
                    sub="Last 7 days"
                    progress={analytics?.consistency_score}
                    color="var(--green)"
                />
            </div>

            {/* Main content */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
                {/* Session Timer */}
                <SessionTimer onXPEarned={handleXPEarned} />

                {/* XP Log */}
                <Card>
                    <div className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sparkles size={16} /> Recent XP
                    </div>
                    {xpLog.length === 0 ? (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                            Complete a session + reflection to earn your first XP!
                        </p>
                    ) : (
                        <div className="flex-col gap-3">
                            {xpLog.map((log) => (
                                <div
                                    key={log.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 12px',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--bg-subtle)',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 500 }}>{log.reason}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                            {new Date(log.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>
                                        +{log.xp_awarded}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

function getTimeOfDay() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
}
