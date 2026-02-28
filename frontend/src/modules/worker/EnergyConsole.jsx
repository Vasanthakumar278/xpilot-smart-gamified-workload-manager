/**
 * modules/worker/EnergyConsole.jsx
 * PRIMARY worker entry point. Rate energy 1–10 → get immediate capacity assessment.
 * Language: "capacity", "load", "output". Never "practice", "streak", "XP celebration".
 */
import { useState } from 'react';
import { BatteryWarning, BatteryMedium, Battery, Leaf, Sprout, Zap, Sun, Rocket, Flame, Gem, Calendar } from 'lucide-react';
import client from '../../api/client';

const LEVELS = [
    null,
    { label: 'Depleted', emoji: <BatteryWarning size={32} />, color: '#94a3b8', tier: 'critical', rec: 'Avoid all cognitive work. Rest and recover.' },
    { label: 'Very Low', emoji: <Battery size={32} />, color: '#64748b', tier: 'critical', rec: 'Admin only. No decisions. Recovery mode.' },
    { label: 'Low', emoji: <Leaf size={32} />, color: '#10b981', tier: 'reduced', rec: 'Light output. Reviews and responses only.' },
    { label: 'Below Avg', emoji: <Sprout size={32} />, color: '#34d399', tier: 'reduced', rec: 'Collaborative tasks. Reduce solo deep work.' },
    { label: 'Average', emoji: <BatteryMedium size={32} />, color: '#f59e0b', tier: 'normal', rec: 'Balanced execution. Standard focus blocks.' },
    { label: 'Good', emoji: <Sun size={32} />, color: '#f59e0b', tier: 'normal', rec: 'Solid capacity. Prioritise meaningful work.' },
    { label: 'Energized', emoji: <Rocket size={32} />, color: '#6366f1', tier: 'high', rec: 'High capacity. Assign complex problems now.' },
    { label: 'Very High', emoji: <Flame size={32} />, color: '#4f46e5', tier: 'high', rec: 'Deep work mode. Block all interruptions.' },
    { label: 'Peak', emoji: <Gem size={32} />, color: '#4338ca', tier: 'peak', rec: 'Execute highest-leverage work. No meetings.' },
    { label: 'Supercharged', emoji: <div style={{ display: 'flex' }}><Zap size={28} /><Flame size={28} /></div>, color: '#3730a3', tier: 'peak', rec: 'Ship major work. This window is rare.' },
];

const TIER_COLORS = { critical: '#ef4444', reduced: '#10b981', normal: '#f59e0b', high: '#6366f1', peak: '#4338ca' };

export default function EnergyConsole({ onScheduleGenerated }) {
    const [level, setLevel] = useState(5);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [dispatched, setDispatched] = useState(false);

    const cfg = LEVELS[level];
    const tierColor = TIER_COLORS[cfg.tier];

    async function dispatch() {
        setError(''); setBusy(true);
        try {
            const res = await client.post('/energy/', { level });
            setDispatched(true);
            if (onScheduleGenerated) onScheduleGenerated(res.data.schedule);
        } catch (e) {
            setError(e.response?.data?.detail || 'Schedule generation failed');
        } finally { setBusy(false); }
    }

    return (
        <div style={{ background: '#0f172a', borderRadius: 16, padding: 28, color: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
            {/* Background glow */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: tierColor + '20', filter: 'blur(40px)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Zap size={14} color="#f59e0b" fill="#f59e0b" /> Energy Console
                    </div>
                    {dispatched && (
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '3px 10px', borderRadius: 999 }}>
                            ✓ Schedule Dispatched
                        </div>
                    )}
                </div>

                {/* Level readout */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 18, padding: '18px 22px',
                    borderRadius: 12, background: tierColor + '15', border: `1px solid ${tierColor}35`,
                    marginBottom: 22,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: tierColor }}>{cfg.emoji}</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                            <div style={{ fontSize: 42, fontWeight: 900, color: tierColor, lineHeight: 1, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
                                {level}
                            </div>
                            <div style={{ fontSize: 20, color: '#64748b', fontWeight: 700 }}>/10</div>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginTop: 2 }}>{cfg.label}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>→ {cfg.rec}</div>
                    </div>
                    {/* Tier badge */}
                    <div style={{ fontSize: 10, fontWeight: 700, color: tierColor, background: tierColor + '20', padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
                        {cfg.tier}
                    </div>
                </div>

                {/* Slider */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Adjust energy level</div>
                    <input
                        type="range" min={1} max={10} value={level}
                        aria-label="Energy Level"
                        onChange={e => { setLevel(+e.target.value); setDispatched(false); }}
                        style={{ width: '100%', accentColor: tierColor, cursor: 'pointer', height: 6 }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#475569', marginTop: 8 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><BatteryWarning size={12} /> Depleted</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Zap size={12} /><Flame size={12} /> Peak</span>
                    </div>
                </div>

                {/* Capacity bar */}
                <div style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Estimated Capacity</div>
                    <div style={{ height: 6, background: '#1e293b', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${level * 10}%`, background: `linear-gradient(90deg, ${tierColor}, ${tierColor}99)`, borderRadius: 999, transition: 'width 400ms ease' }} />
                    </div>
                </div>

                {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: 12, marginBottom: 12 }}>{error}</div>}

                <button
                    onClick={dispatch}
                    disabled={busy}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px 20px', borderRadius: 10, border: 'none', background: tierColor, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', opacity: busy ? 0.7 : 1, transition: 'opacity 0.2s' }}
                >
                    {busy ? 'Generating workload plan…' : <><Calendar size={18} /> Generate Workload Plan</>}
                </button>
            </div>
        </div>
    );
}
