import { useState, useEffect } from 'react';
import { Layers, Plus, ExternalLink, Loader2, FolderX } from 'lucide-react';
import client from '../../api/client';
import { useNavigate } from 'react-router-dom';

const PROJECT_COLORS = [
    { color: '#6366f1', bg: 'rgba(99,102,241,0.10)' },
    { color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
    { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
    { color: '#0ea5e9', bg: 'rgba(14,165,233,0.10)' },
    { color: '#ec4899', bg: 'rgba(236,72,153,0.10)' },
];

export default function ActiveProjectsCard() {
    const [projects, setProjects] = useState([]);
    const [taskCounts, setTaskCounts] = useState({}); // projectId → { total, done }
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            client.get('/projects/'),
            client.get('/tasks/'),
        ]).then(([projRes, taskRes]) => {
            const projs = projRes.data.slice(0, 4);
            setProjects(projs);

            // Build per-project task counts from the flat tasks list
            const counts = {};
            for (const t of taskRes.data) {
                if (!t.project_id) continue;
                if (!counts[t.project_id]) counts[t.project_id] = { total: 0, done: 0 };
                counts[t.project_id].total += 1;
                if (t.status === 'completed') counts[t.project_id].done += 1;
            }
            setTaskCounts(counts);
        }).catch(err => console.error('ActiveProjects error:', err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="card" style={{ padding: '24px 24px 20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(16,185,129,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Layers size={15} color="var(--green)" />
                    </div>
                    <span className="card-title" style={{ fontSize: 12 }}>Active Projects</span>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/worker/projects')}>
                    <Plus size={13} /> New
                </button>
            </div>
            <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: 16 }} />

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0' }}>
                    <Loader2 size={20} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--text-muted)' }}>
                    <FolderX size={30} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>No projects yet</div>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/worker/projects')}>
                        <Plus size={12} /> Create a project
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {projects.map((p, i) => {
                        const c = PROJECT_COLORS[i % PROJECT_COLORS.length];
                        const tc = taskCounts[p.id] || { total: 0, done: 0 };
                        const pct = tc.total > 0 ? Math.round((tc.done / tc.total) * 100) : 0;

                        return (
                            <div
                                key={p.id}
                                style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'background 180ms ease', borderLeft: `3px solid ${c.color}` }}
                                onMouseEnter={e => { e.currentTarget.style.background = c.bg; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                onClick={() => navigate('/worker/projects')}
                            >
                                {/* Top row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Layers size={14} color={c.color} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                                            {tc.total > 0 ? `${tc.done}/${tc.total} tasks done` : 'No tasks yet'}
                                        </div>
                                    </div>
                                    <ExternalLink size={12} color="var(--text-muted)" />
                                </div>

                                {/* Progress bar — only if tasks exist */}
                                {tc.total > 0 && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>Progress</span>
                                            <span style={{ fontSize: 10, fontWeight: 800, color: c.color }}>{pct}%</span>
                                        </div>
                                        <div style={{ height: 5, background: 'var(--bg-subtle)', borderRadius: 99, overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${pct}%`,
                                                background: c.color,
                                                borderRadius: 99,
                                                transition: 'width 600ms ease',
                                            }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
