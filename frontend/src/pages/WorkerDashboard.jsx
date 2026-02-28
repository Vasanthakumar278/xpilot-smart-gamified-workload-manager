/**
 * pages/WorkerDashboard.jsx — Mission Control
 * Two-column layout: left = command center, right = workspace panel
 */
import { useState, useEffect, useContext } from 'react';
import { Zap, Clock, RotateCcw, BarChart2, CheckCircle2, ListTodo } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import EnergyCheckCard from '../components/worker/EnergyCheckCard';
import ExecutionPlanner from '../components/worker/ExecutionPlanner';
import PriorityTasksCard from '../components/worker/PriorityTasksCard';
import ActiveProjectsCard from '../components/worker/ActiveProjectsCard';
import DailyVitalsCard from '../components/worker/DailyVitalsCard';
import { SessionContext } from '../context/SessionContext';
import client from '../api/client';

function getTimeOfDay() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
}

export default function WorkerDashboard() {
    const [schedule, setSchedule] = useState(null);
    const [tasksListKey] = useState(0);
    const [resumeTask, setResumeTask] = useState(null);
    const [daySummary, setDaySummary] = useState(null);
    const { setActiveSession, energyLevel } = useContext(SessionContext);
    const user = JSON.parse(localStorage.getItem('xpilot_user') || '{}');
    const navigate = useNavigate();
    const timeOfDay = getTimeOfDay();

    useEffect(() => {
        client.get('/sessions/last-active')
            .then(res => { if (res.data?.task) setResumeTask(res.data.task); })
            .catch(() => { });
        client.get('/day-summary/')
            .then(res => setDaySummary(res.data))
            .catch(() => { });
    }, []);

    const handleTaskSelected = async (task) => {
        try {
            let timerMins = 45;
            if (energyLevel <= 3) timerMins = 25;
            else if (energyLevel >= 8) timerMins = 75;

            const res = await client.post('/sessions/start', {
                task_id: task.id,
                energy_level: energyLevel,
            });
            setActiveSession({
                session_id: res.data.session_id,
                task: { ...task, estimated_minutes: timerMins },
                localStartTime: Date.now(),
            });
            navigate('/worker/deep-work');
        } catch (error) {
            if (error.response?.status === 409) {
                alert(error.response.data.detail);
            }
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

            {/* ══ LEFT COLUMN — Command Center ══════════════════════════════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Greeting header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            Good {timeOfDay}, {user.name?.split(' ')[0] || 'there'}
                            <Zap size={22} color="var(--accent)" fill="var(--accent)" />
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px', background: 'rgba(16,185,129,0.10)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 1.8s infinite', display: 'inline-block' }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>Session Active</span>
                            </div>
                            {daySummary && (
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                                    {daySummary.total_planned_minutes}m planned
                                    &nbsp;·&nbsp;
                                    <span style={{ color: 'var(--green)', fontWeight: 700 }}>{daySummary.total_completed_minutes}m done</span>
                                    {daySummary.pending_count > 0 && <>&nbsp;·&nbsp;{daySummary.pending_count} remaining</>}
                                </span>
                            )}
                        </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                        <Clock size={13} /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                {/* Resume banner */}
                {resumeTask && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <RotateCcw size={15} color="var(--accent)" />
                            <div>
                                <span style={{ fontSize: 13, fontWeight: 700 }}>Resume: </span>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{resumeTask.title}</span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>~{resumeTask.estimated_minutes}m</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-primary btn-sm" onClick={() => handleTaskSelected(resumeTask)}>
                                <Zap size={12} fill="currentColor" /> Resume
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setResumeTask(null)}>✕</button>
                        </div>
                    </div>
                )}

                {/* Day load summary row */}
                {daySummary && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        {[
                            { icon: <ListTodo size={15} color="var(--accent)" />, label: 'Planned', value: `${daySummary.total_planned_minutes}m`, bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.15)', color: 'var(--accent)' },
                            { icon: <CheckCircle2 size={15} color="var(--green)" />, label: 'Completed', value: `${daySummary.total_completed_minutes}m`, bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.15)', color: 'var(--green)' },
                            { icon: <Clock size={15} color="var(--amber)" />, label: 'Remaining', value: `${daySummary.pending_count} tasks`, bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)', color: 'var(--amber)' },
                        ].map(s => (
                            <div key={s.label} style={{ padding: '12px 16px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                {s.icon}
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 1 }}>{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Priority Tasks */}
                <PriorityTasksCard key={tasksListKey} onSelectTask={handleTaskSelected} />

                {/* Execution Planner (when energy plan generated) */}
                {schedule && <ExecutionPlanner schedule={schedule} />}

                {/* Analytics shortcut — fills remaining space naturally */}
                <button
                    className="btn btn-secondary btn-full"
                    style={{ fontSize: 12, fontWeight: 600, gap: 8 }}
                    onClick={() => navigate('/worker/analytics')}
                >
                    <BarChart2 size={14} /> View Full Analytics
                </button>
            </div>

            {/* ══ RIGHT COLUMN — Workspace Panel ════════════════════════════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', paddingLeft: 2 }}>
                    Workspace
                </div>
                <EnergyCheckCard onScheduleGenerated={setSchedule} />
                <DailyVitalsCard />
                <ActiveProjectsCard />
            </div>
        </div>
    );
}
