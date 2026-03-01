/**
 * pages/StudentDashboard.jsx — Restored Student Dashboard with Zen aesthetics
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Timer, Flame, Calendar, Target, Plus } from 'lucide-react';
import AnalyticsCard from '../components/AnalyticsCard';
import client from '../api/client';
import CourseworkCard from '../components/student/CourseworkCard';
import StudySessionCard from '../components/student/StudySessionCard';
import GradesGlanceCard from '../components/student/GradesGlanceCard';

export default function StudentDashboard() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('xpilot_user') || '{}');
    const navigate = useNavigate();

    async function loadData() {
        try {
            const analRes = await client.get('/analytics/me');
            setAnalytics(analRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadData(); }, []);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', fontFamily: '"Outfit", sans-serif' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#111827', margin: 0 }}>
                        Welcome back, {user.name?.split(' ')[0] || 'Scholar'}
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '16px', marginTop: '4px' }}>
                        Your learning journey is exactly on track.
                    </p>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: '#fff',
                    padding: '8px 20px',
                    borderRadius: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    border: '1px solid #f3f4f6'
                }}>
                    <div style={{ width: '32px', height: '32px', background: '#e0e7ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={16} color="#6366f1" />
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{analytics?.xp_today || 0} XP</div>
                        <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Daily Goal</div>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <StudySessionCard onStart={() => navigate('/student/study')} />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                        <CourseworkCard />
                        <GradesGlanceCard />
                    </div>

                    <div style={{
                        padding: '32px',
                        background: '#fff',
                        borderRadius: '24px',
                        border: '1px solid #f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div>
                            <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>Join a Study Group</h4>
                            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Collaborate with 5 peers currently online.</p>
                        </div>
                        <button style={{
                            background: '#111827',
                            color: '#fff',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '14px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer'
                        }} onClick={() => navigate('/student/groups')}>
                            <Plus size={18} /> Explore
                        </button>
                    </div>
                </div>

                {/* Right Column: Stats & Activity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div style={{ padding: '24px', background: '#f9fafb', borderRadius: '24px', border: '1px solid #f3f4f6' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Flame size={18} color="#f97316" /> Learning Vitals
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Focus Depth</div>
                                <div style={{ fontSize: '20px', fontWeight: 800 }}>{analytics?.total_focus_time_today || 0}m</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Streak Active</div>
                                <div style={{ fontSize: '20px', fontWeight: 800 }}>12 Days</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Consistency</div>
                                <div style={{ fontSize: '20px', fontWeight: 800 }}>{analytics?.consistency_score || 0}%</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', paddingLeft: '8px' }}>Upcoming Deadlines</div>
                        <div style={{ padding: '16px', background: '#fff', borderRadius: '20px', border: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ padding: '8px', background: '#fee2e2', borderRadius: '12px', color: '#ef4444' }}>
                                <Calendar size={18} />
                            </div>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 700 }}>AI Thesis Draft</div>
                                <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>In 2 days</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
