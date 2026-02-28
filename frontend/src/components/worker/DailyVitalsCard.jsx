/**
 * components/worker/DailyVitalsCard.jsx
 * Inspired by Student "Learning Vitals" — shows streak, XP today, consistency.
 */
import { useState, useEffect } from 'react';
import { Flame, Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import client from '../../api/client';

function VitalRow({ icon, label, value, color }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {icon}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 900, color, letterSpacing: '-0.03em' }}>{value}</span>
        </div>
    );
}

export default function DailyVitalsCard() {
    const [stats, setStats] = useState(null);
    const [xp, setXp] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            client.get('/sessions/stats'),
            client.get('/xp/log'),
        ]).then(([statsRes, xpRes]) => {
            setStats(statsRes.data);
            // XP earned today: sum log entries from today
            const today = new Date().toISOString().slice(0, 10);
            const todayXp = (xpRes.data.history || [])
                .filter(h => h.created_at?.startsWith(today))
                .reduce((sum, h) => sum + (h.xp_awarded || 0), 0);
            setXp(todayXp);
        }).catch(err => console.error('DailyVitals error:', err))
            .finally(() => setLoading(false));
    }, []);

    // Derive a streak from the 7-day trend: consecutive days with >0 minutes
    const streak = stats?.trend
        ? [...stats.trend].reverse().reduce((acc, day) => {
            if (acc.done) return acc;
            if (day.minutes > 0) return { count: acc.count + 1, done: false };
            return { count: acc.count, done: true };
        }, { count: 0, done: false }).count
        : 0;

    const consistency = stats
        ? Math.round((stats.trend?.filter(d => d.minutes > 0).length / 7) * 100)
        : 0;

    return (
        <div className="card" style={{ padding: '22px 22px 18px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(249,115,22,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Flame size={15} color="#f97316" />
                </div>
                <span className="card-title" style={{ fontSize: 12 }}>Daily Vitals</span>
            </div>
            <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: 14 }} />

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                    <Loader2 size={20} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <VitalRow
                        icon={<Flame size={15} color="#f97316" />}
                        label="Day Streak"
                        value={`${streak}🔥`}
                        color="#f97316"
                    />
                    <VitalRow
                        icon={<Sparkles size={15} color="var(--accent)" />}
                        label="XP Today"
                        value={`+${xp}`}
                        color="var(--accent)"
                    />
                    <VitalRow
                        icon={<TrendingUp size={15} color="var(--green)" />}
                        label="Consistency"
                        value={`${consistency}%`}
                        color="var(--green)"
                    />
                </div>
            )}
        </div>
    );
}
