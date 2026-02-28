/**
 * components/AnalyticsCard.jsx
 * Displays a single metric tile with optional progress bar.
 */
import Card from './Card';

export default function AnalyticsCard({
    icon,
    title,
    value,
    unit = '',
    sub,
    progress,
    color = 'var(--accent)',
    loading = false,
}) {
    if (loading) {
        return (
            <Card>
                <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 16 }} />
                <div className="skeleton" style={{ height: 40, width: '40%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 10, width: '80%' }} />
            </Card>
        );
    }

    return (
        <Card>
            <div className="flex items-center gap-3 mb-4">
                <span style={{ fontSize: 22 }}>{icon}</span>
                <span className="card-title">{title}</span>
            </div>

            <div className="flex items-end gap-2">
                <span className="stat-number" style={{ color }}>
                    {value ?? '—'}
                </span>
                {unit && (
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                        {unit}
                    </span>
                )}
            </div>

            {sub && <div className="stat-label mt-2">{sub}</div>}

            {progress != null && (
                <div className="progress-bar-track mt-4">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${Math.min(progress, 100)}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
                    />
                </div>
            )}
        </Card>
    );
}
