/**
 * modules/worker/WorkerSchedule.jsx
 * Worker-only schedule page: energy console, generated work blocks, execution timeline.
 * Directly replaces the old pages/Schedule.jsx for workers.
 *
 * Language: capacity, execution, load, blocks.
 * NEVER mounts: StudySessionPanel, consistency trackers, or any student component.
 */
import { useState, useEffect } from 'react';
import EnergyConsole from './EnergyConsole';
import WorkloadGenerator from './WorkloadGenerator';
import ExecutionTimeline from './ExecutionTimeline';
import RecoveryAdvisor from './RecoveryAdvisor';
import client from '../../api/client';

export default function WorkerSchedule() {
    const [schedule, setSchedule] = useState(null);
    const [energyLevel, setEnergyLevel] = useState(null);
    const user = JSON.parse(localStorage.getItem('xpilot_user') || '{}');

    // Load today's schedule if already generated
    useEffect(() => {
        client.get('/energy/today')
            .then(res => {
                if (res.data.schedule) {
                    setSchedule(res.data.schedule);
                    const tier = res.data.schedule.tier;
                    setEnergyLevel(tier === 'low' ? 2 : tier === 'medium' ? 5 : 8);
                }
            })
            .catch(() => { });
    }, []);

    function handleScheduleGenerated(sched) {
        setSchedule(sched);
        const tier = sched?.tier;
        setEnergyLevel(tier === 'low' ? 2 : tier === 'medium' ? 5 : 8);
    }

    return (
        <div className="worker-schedule">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h2 className="page-title">⚡ Workload Planner</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
                        Log your energy level to generate an optimised execution plan for today.
                    </p>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 18px', borderRadius: 12,
                    background: schedule ? 'rgba(16,185,129,0.08)' : '#0f172a',
                    border: schedule ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
                }}>
                    <div style={{
                        width: 8, height: 8, borderRadius: 9999,
                        background: schedule ? '#10b981' : '#64748b',
                        boxShadow: schedule ? '0 0 8px #10b981' : 'none',
                    }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: schedule ? '#10b981' : '#94a3b8' }}>
                        {schedule ? 'PLAN ACTIVE' : 'AWAITING INPUT'}
                    </span>
                </div>
            </div>

            {/* ── Row 1: Energy Console (full width) ── */}
            <div style={{ marginBottom: 24 }}>
                <EnergyConsole onScheduleGenerated={handleScheduleGenerated} />
            </div>

            {/* ── Row 2: Workload Generator + Execution Timeline side by side ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <WorkloadGenerator schedule={schedule} />
                <ExecutionTimeline schedule={schedule} />
            </div>

            {/* ── Row 3: Recovery Advisor (full width) ── */}
            <RecoveryAdvisor energyLevel={energyLevel} />
        </div>
    );
}
