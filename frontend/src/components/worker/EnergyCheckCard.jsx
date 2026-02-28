import { useState, useContext } from 'react';
import { Zap, BatteryLow, BatteryMedium, BatteryFull } from 'lucide-react';
import client from '../../api/client';
import { SessionContext } from '../../context/SessionContext';

function getEnergyMeta(level) {
    if (level <= 3) return {
        label: 'Low Energy', sublabel: '→ 25 min sessions',
        color: '#ef4444', bg: 'rgba(239,68,68,0.04)',
        icon: <BatteryLow size={22} color="#ef4444" />
    };
    if (level <= 7) return {
        label: 'Moderate', sublabel: '→ 45 min sessions',
        color: '#f59e0b', bg: 'rgba(245,158,11,0.04)',
        icon: <BatteryMedium size={22} color="#f59e0b" />
    };
    return {
        label: 'Peak State', sublabel: '→ 75 min sessions',
        color: '#10b981', bg: 'rgba(16,185,129,0.06)',
        icon: <BatteryFull size={22} color="#10b981" />
    };
}

export default function EnergyCheckCard({ onScheduleGenerated }) {
    const { energyLevel: ctxLevel, setEnergyLevel } = useContext(SessionContext);
    const [level, setLevel] = useState(ctxLevel || 5);
    const [loading, setLoading] = useState(false);
    const meta = getEnergyMeta(level);

    const handleChange = (val) => {
        setLevel(val);
        setEnergyLevel(val); // persist to context + localStorage
    };

    const handleLog = async () => {
        setLoading(true);
        try {
            const res = await client.post('/energy/', { level });
            if (onScheduleGenerated) onScheduleGenerated(res.data.schedule);
        } catch (e) {
            console.error('Failed to log energy:', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="card"
            style={{
                background: `linear-gradient(160deg, var(--surface) 0%, ${meta.bg} 100%)`,
                transition: 'background 500ms ease',
                padding: 24,
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <div className="card-title">Energy Check-in</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: meta.color, marginTop: 6, letterSpacing: '-0.02em', transition: 'color 300ms ease' }}>
                        {meta.label}
                    </div>
                    <div style={{ fontSize: 11, color: meta.color, opacity: 0.7, fontWeight: 600, marginTop: 2 }}>
                        {meta.sublabel}
                    </div>
                </div>
                <div style={{ width: 50, height: 50, borderRadius: 'var(--radius-md)', background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 400ms ease' }}>
                    {meta.icon}
                </div>
            </div>

            {/* Slider */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Energy Level</span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: meta.color, letterSpacing: '-0.03em', transition: 'color 300ms ease' }}>
                        {level}<span style={{ fontSize: 12, fontWeight: 600, opacity: 0.6 }}>/10</span>
                    </span>
                </div>
                <input
                    type="range" min="1" max="10" value={level}
                    onChange={e => handleChange(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: meta.color, cursor: 'pointer', height: 4 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                    <span>Drained</span><span>Peak</span>
                </div>
            </div>

            <button
                className="btn btn-full"
                onClick={handleLog}
                disabled={loading}
                style={{ background: `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}bb 100%)`, color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, padding: '12px', borderRadius: 'var(--radius-md)', gap: 8 }}
            >
                <Zap size={15} />
                {loading ? 'Generating Plan…' : 'Generate Execution Plan'}
            </button>
        </div>
    );
}
