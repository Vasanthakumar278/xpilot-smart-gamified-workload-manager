/**
 * pages/Analytics.jsx — Full analytics dashboard wired to backend
 */
import { useState, useEffect } from 'react';
import { BarChart, Timer, Ruler, Calendar, Flame, Target, Sparkles } from 'lucide-react';
import AnalyticsCard from '../components/AnalyticsCard';
import Card from '../components/Card';
import client from '../api/client';

export default function Analytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        client.get('/analytics/me')
            .then((res) => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const dist = data?.session_distribution;

    return (
        <div className="analytics-page">
            <div className="page-header">
                <div>
                    <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BarChart size={24} color="var(--accent)" /> Your Analytics
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
                        Rule-based insights from your real session data. No AI magic.
                    </p>
                </div>
            </div>

            {/* Top stats */}
            <div className="dashboard-grid mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <AnalyticsCard
                    icon={<Timer size={20} />} title="Focus Today"
                    value={data?.total_focus_time_today ?? 0} unit="min"
                    loading={loading} color="var(--accent)"
                />
                <AnalyticsCard
                    icon={<Ruler size={20} />} title="Avg Session"
                    value={data?.avg_session_length ?? 0} unit="min"
                    loading={loading} color="var(--sky)"
                />
                <AnalyticsCard
                    icon={<Calendar size={20} />} title="Total Sessions"
                    value={data?.total_sessions ?? 0}
                    loading={loading} color="var(--amber)"
                />
                <AnalyticsCard
                    icon={<Flame size={20} />} title="Active Days"
                    value={data?.active_days_last_7 ?? 0} unit="/ 7"
                    loading={loading} color="var(--pink)"
                    progress={(data?.active_days_last_7 ?? 0) / 7 * 100}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Consistency */}
                <Card>
                    <div className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Target size={16} /> Consistency Score</div>
                    <div className="flex items-end gap-2 mb-4">
                        <span className="stat-number" style={{ color: 'var(--green)' }}>
                            {data?.consistency_score ?? 0}
                        </span>
                        <span style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>%</span>
                    </div>
                    <div className="progress-bar-track">
                        <div
                            className="progress-bar-fill"
                            style={{
                                width: `${data?.consistency_score ?? 0}%`,
                                background: 'linear-gradient(90deg, var(--green), #34d399)',
                            }}
                        />
                    </div>
                    <p className="stat-label mt-4">
                        {data?.active_days_last_7 ?? 0} active days out of last 7.{' '}
                        {(data?.consistency_score ?? 0) >= 70
                            ? '🔥 Excellent consistency!'
                            : (data?.consistency_score ?? 0) >= 40
                                ? '📈 Keep building the habit.'
                                : '💪 Start with just one session/day.'}
                    </p>
                </Card>

                {/* Session distribution */}
                <Card>
                    <div className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ruler size={16} /> Session Length Distribution</div>
                    {loading ? (
                        <>
                            <div className="skeleton" style={{ height: 14, marginBottom: 12 }} />
                            <div className="skeleton" style={{ height: 14, marginBottom: 12 }} />
                            <div className="skeleton" style={{ height: 14 }} />
                        </>
                    ) : (
                        <div className="flex-col gap-4">
                            {[
                                { label: 'Short (< 25 min)', value: dist?.short_under_25m ?? 0, color: 'var(--amber)' },
                                { label: 'Medium (25–60 min)', value: dist?.medium_25_60m ?? 0, color: 'var(--accent)' },
                                { label: 'Long (> 60 min)', value: dist?.long_over_60m ?? 0, color: 'var(--green)' },
                            ].map((item) => {
                                const total = (dist?.short_under_25m ?? 0) + (dist?.medium_25_60m ?? 0) + (dist?.long_over_60m ?? 0);
                                const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                                return (
                                    <div key={item.label}>
                                        <div className="flex justify-between mb-2">
                                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value} ({pct}%)</span>
                                        </div>
                                        <div className="progress-bar-track">
                                            <div
                                                className="progress-bar-fill"
                                                style={{ width: `${pct}%`, background: item.color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>

                {/* XP earned today */}
                <Card>
                    <div className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={16} /> XP Earned Today</div>
                    <div className="stat-number" style={{ color: 'var(--accent)' }}>
                        {data?.xp_today ?? 0}
                    </div>
                    <div className="stat-label mt-2">From {data?.sessions_today ?? 0} session(s) today</div>
                </Card>

                {/* This week */}
                <Card>
                    <div className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={16} /> Sessions This Week</div>
                    <div className="stat-number" style={{ color: 'var(--sky)' }}>
                        {data?.sessions_this_week ?? 0}
                    </div>
                    <div className="stat-label mt-2">
                        Avg length: {data?.avg_session_length ?? 0} min per session
                    </div>
                </Card>
            </div>
        </div>
    );
}
