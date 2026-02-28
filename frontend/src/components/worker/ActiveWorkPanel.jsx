import { useState, useEffect } from 'react';
import { Play, Square, RotateCcw, CheckCircle2 } from 'lucide-react';

/* SVG ring progress around the timer */
function RingProgress({ percent, size = 200, stroke = 8, color = 'var(--accent)' }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    return (
        <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-subtle)" strokeWidth={stroke} />
            <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 800ms ease' }}
            />
        </svg>
    );
}

export default function ActiveWorkPanel({ task, onStop, onSwitch }) {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (!isActive) return;
        const i = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(i);
    }, [isActive]);

    const formatTime = (s) =>
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const totalSec = (task.estimated_minutes || 30) * 60;
    const progress = Math.min((seconds / totalSec) * 100, 100);
    const ringColor = progress >= 100 ? 'var(--green)' : progress > 75 ? 'var(--amber)' : 'var(--accent)';

    return (
        <div
            className="card"
            style={{
                padding: '48px 40px',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
            }}
        >
            {/* Status badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', background: 'rgba(16,185,129,0.10)', borderRadius: 'var(--radius-full)', marginBottom: 28, border: '1px solid rgba(16,185,129,0.22)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 1.5s infinite', display: 'inline-block' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Execution Mode Active</span>
            </div>

            {/* Task name */}
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>
                {task.title}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 40 }}>
                {task.project || 'No Project'}&nbsp;·&nbsp;Est. {task.estimated_minutes}m
            </p>

            {/* Ring + Timer */}
            <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RingProgress percent={progress} color={ringColor} />
                <div style={{
                    fontSize: 52,
                    fontWeight: 900,
                    letterSpacing: '-0.05em',
                    color: 'var(--text-primary)',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                    zIndex: 1,
                }}>
                    {formatTime(seconds)}
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button
                    className={`btn ${isActive ? 'btn-danger' : 'btn-success'}`}
                    onClick={() => setIsActive(!isActive)}
                >
                    {isActive ? <Square size={15} /> : <Play size={15} />}
                    {isActive ? 'Pause' : 'Resume'}
                </button>

                <button
                    className="btn btn-primary btn-lg"
                    onClick={() => onStop(Math.round(seconds / 60))}
                >
                    <CheckCircle2 size={16} /> Complete & Log
                </button>

                <button
                    className="btn"
                    style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
                    onClick={onSwitch}
                >
                    <RotateCcw size={14} /> Switch Task
                </button>
            </div>
        </div>
    );
}
