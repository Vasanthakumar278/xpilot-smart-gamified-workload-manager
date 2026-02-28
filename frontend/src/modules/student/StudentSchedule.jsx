/**
 * modules/student/StudentSchedule.jsx
 * XPilot Execution Planner — replaces the old "Recommended Learning Flow" system.
 *
 * Sections:
 *   Header → Resume banner → ExecutionPanel → TopicNavigator → Consistency Insight
 *
 * No learning-flow blocks. No study durations. No "Warm-up Review" etc.
 */
import { useState, useEffect } from 'react';
import { Zap, Sparkles, BarChart2, CalendarDays, Flame, Clock, Trophy } from 'lucide-react';
import client from '../../api/client';
import ResumePanel from '../../components/ResumePanel';
import TopicNavigator from '../../components/TopicNavigator';
import ExecutionPanel from '../../components/ExecutionPanel';

/* ─── Streak caption helper ─────────────────────────────────────────────── */
function streakLabel(n) {
    if (n === 0) return 'No streak yet — start today.';
    if (n === 1) return '1 day — solid start.';
    if (n < 7) return `${n} days — building momentum.`;
    if (n < 14) return <>{n} days — consistent execution. <Flame size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /></>;
    return <>{n} days — exceptional discipline. <Trophy size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /></>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function StudentSchedule() {
    const user = JSON.parse(localStorage.getItem('xpilot_user') || '{}');
    const userId = user.id ?? 1;

    const [consistency, setConsistency] = useState(0);
    const [activeTopic, setActiveTopic] = useState(null);   // from FocusTrack
    const [lastFocus, setLastFocus] = useState(null);   // from last session
    const [starting, setStarting] = useState(false);
    const [started, setStarted] = useState(false);

    const [analytics, setAnalytics] = useState(null);

    /* ── Load active track + consistency ── */
    useEffect(() => {
        // Fetch active track for ExecutionPanel topic
        client.get('/tracks/active')
            .then(r => { if (r.data) setActiveTopic(r.data.topic); })
            .catch(() => { });

        // Fetch student plan for consistency score + last focus
        client.get(`/student-plan/${userId}`)
            .then(r => {
                setConsistency(r.data?.consistency ?? 0);
                setLastFocus(r.data?.last_focus ?? null);
            })
            .catch(() => { });

        // Fetch real analytics
        client.get('/analytics/me')
            .then(r => setAnalytics(r.data))
            .catch(() => { });
    }, [userId]);

    /* ── Start execution session ── */
    function handleExecute() {
        setStarting(true);
        client.post('/sessions/start')
            .then(() => setStarted(true))
            .catch(() => setStarted(true))   // optimistic — don't block UX
            .finally(() => setStarting(false));
    }

    // Use real analytics from backend if available, otherwise fallback
    const sessionsWeek = analytics?.sessions_this_week ?? 0;
    const displayConsistency = analytics?.consistency_score ?? consistency ?? 0;

    // Calculate a real streak based on recent activity, or fallback to 0
    // (If backend doesn't explicitly send streak, we approximate from sessions week for now, 
    // but without the arbitrary consistency division)
    const streak = analytics ? (analytics.sessions_today > 0 ? analytics.sessions_this_week : Math.max(0, analytics.sessions_this_week - 1)) : 0;

    const nextSession = new Date();
    nextSession.setHours(nextSession.getHours() + 3, 0, 0, 0);
    const nextLabel = nextSession.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="student-schedule">

            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <div style={styles.header}>
                <div>
                    <h2 style={{ ...styles.pageTitle, display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={22} color="var(--accent)" /> Execution Planner</h2>
                    <p style={styles.subtext}>
                        {activeTopic
                            ? `Active topic: ${activeTopic}`
                            : 'Declare a topic below to begin structured execution.'}
                    </p>
                </div>
                <div style={{ ...styles.xpBadge, display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={18} /> {user.xp ?? 0} XP</div>
            </div>

            {/* ── Resume banner ───────────────────────────────────────────── */}
            <ResumePanel onSessionStarted={() => setStarted(true)} />

            {/* ══════════════════════════════════════════════════════════════
                EXECUTION PANEL — replaces Recommended Learning Flow
            ═══════════════════════════════════════════════════════════════ */}
            {started ? (
                <div style={{ ...styles.successBanner, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Zap size={16} /> Execution started — stay locked in.
                </div>
            ) : (
                <ExecutionPanel
                    topic={activeTopic}
                    lastFocus={lastFocus}
                    onExecute={starting ? undefined : handleExecute}
                />
            )}

            {/* ══════════════════════════════════════════════════════════════
                TOPIC NAVIGATOR
            ═══════════════════════════════════════════════════════════════ */}
            <TopicNavigator
                initialFocus={activeTopic || ''}
                onSelectArea={(area) => {
                    setActiveTopic(area);
                    setStarted(false);
                }}
            />

            {/* ══════════════════════════════════════════════════════════════
                CONSISTENCY INSIGHT
            ═══════════════════════════════════════════════════════════════ */}
            <section style={styles.section}>
                <div style={{ ...styles.sectionLabel, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BarChart2 size={14} /> Execution Metrics
                </div>

                <div style={styles.insightGrid}>
                    <div style={styles.insightCard}>
                        <div style={styles.insightIcon}><CalendarDays size={26} color="#4f46e5" /></div>
                        <div style={styles.insightValue}>{sessionsWeek}</div>
                        <div style={styles.insightCaption}>Sessions this week</div>
                        <div style={styles.insightNote}>
                            {sessionsWeek === 0 ? 'No sessions yet.' : sessionsWeek < 3 ? 'Building the habit.' : 'Consistent output.'}
                        </div>
                    </div>

                    <div style={styles.insightCard}>
                        <div style={styles.insightIcon}><Flame size={26} color="#f59e0b" /></div>
                        <div style={styles.insightValue}>{streak}</div>
                        <div style={styles.insightCaption}>Day streak</div>
                        <div style={styles.insightNote}>{streakLabel(streak)}</div>
                    </div>

                    <div style={styles.insightCard}>
                        <div style={styles.insightIcon}><Clock size={26} color="#10b981" /></div>
                        <div style={styles.insightValue}>{nextLabel}</div>
                        <div style={styles.insightCaption}>Next session window</div>
                        <div style={styles.insightNote}>Recommended next execution block.</div>
                    </div>
                </div>

                <div style={styles.encourageBar}>
                    <div style={{ marginBottom: 6, fontSize: 13, color: '#4f46e5', fontWeight: 600 }}>
                        Consistency: {displayConsistency}%
                    </div>
                    <div style={styles.progressTrack}>
                        <div style={{ ...styles.progressFill, width: `${Math.min(displayConsistency, 100)}%` }} />
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                        Daily execution — even partial output — compounds over time.
                    </div>
                </div>
            </section>

        </div>
    );
}

/* ─── Styles ────────────────────────────────────────────────────────────── */
const styles = {
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24,
    },
    pageTitle: {
        fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0,
        letterSpacing: '-0.02em',
    },
    subtext: {
        fontSize: 13, color: 'var(--text-secondary)', marginTop: 4,
    },
    xpBadge: {
        padding: '8px 18px', borderRadius: 999,
        background: 'rgba(99,102,241,0.10)', color: '#4f46e5',
        fontWeight: 800, fontSize: 18,
    },
    successBanner: {
        padding: '18px 24px', borderRadius: 14, marginBottom: 20,
        background: 'rgba(16,185,129,0.08)',
        border: '1px solid rgba(16,185,129,0.25)',
        color: '#059669', fontSize: 15, fontWeight: 700,
    },
    section: {
        background: '#fff',
        border: '1px solid rgba(99,102,241,0.10)',
        borderRadius: 18,
        padding: '22px 24px',
        marginBottom: 20,
        boxShadow: '0 4px 20px rgba(99,102,241,0.06)',
    },
    sectionLabel: {
        fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        color: '#94a3b8', textTransform: 'uppercase', marginBottom: 16,
    },
    insightGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14,
        marginBottom: 16,
    },
    insightCard: {
        background: 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%)',
        border: '1px solid rgba(99,102,241,0.10)',
        borderRadius: 14, padding: '18px 16px', textAlign: 'center',
    },
    insightIcon: { fontSize: 26, marginBottom: 6 },
    insightValue: { fontSize: 26, fontWeight: 800, color: '#4f46e5', lineHeight: 1 },
    insightCaption: { fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' },
    insightNote: { fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 1.5 },
    encourageBar: {
        background: '#f8faff', borderRadius: 12,
        padding: '14px 16px', border: '1px solid rgba(99,102,241,0.10)',
    },
    progressTrack: {
        height: 8, borderRadius: 999,
        background: 'rgba(99,102,241,0.12)', overflow: 'hidden',
    },
    progressFill: {
        height: '100%', borderRadius: 999,
        background: 'linear-gradient(90deg, #6366f1, #818cf8)',
        transition: 'width 0.6s ease',
    },
};
