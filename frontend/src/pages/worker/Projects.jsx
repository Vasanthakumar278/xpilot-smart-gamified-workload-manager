/**
 * pages/worker/Projects.jsx — Projects Hub
 */
import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Trash2, Loader2, FolderX } from 'lucide-react';
import client from '../../api/client';

const PROJECT_COLORS = [
    { color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
    { color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
    { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    { color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)' },
    { color: '#ec4899', bg: 'rgba(236,72,153,0.08)' },
];

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => { fetchProjects(); }, []);

    const fetchProjects = async () => {
        try {
            const res = await client.get('/projects/');
            setProjects(res.data);
        } catch (err) {
            console.error('Failed to fetch projects:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsCreating(true);
        try {
            await client.post('/projects/', { name, description });
            setName(''); setDescription('');
            fetchProjects();
        } catch (err) {
            console.error('Failed to create project:', err);
            alert('Error creating project.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this project and all its tasks?')) return;
        try {
            await client.delete(`/projects/${id}`);
            fetchProjects();
        } catch (err) {
            console.error('Failed to delete project:', err);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* ── Page Header ─────────────────────────── */}
            <div className="page-header" style={{ marginBottom: 0 }}>
                <div>
                    <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FolderOpen size={28} color="var(--accent)" /> Projects Hub
                    </h2>
                    <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                        Manage and organize your operational projects
                    </p>
                </div>
                <div style={{ padding: '8px 16px', background: 'var(--accent-muted)', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                    {projects.length} Project{projects.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* ── Create Form ─────────────────────────── */}
            <div className="card" style={{ padding: '24px 28px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Plus size={15} /> New Project
                </div>
                <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1', minWidth: 180 }}>
                        <label className="label" style={{ display: 'block', marginBottom: 6 }}>Project Name</label>
                        <input
                            type="text" className="input"
                            placeholder="e.g. Q1 Report" value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div style={{ flex: '2', minWidth: 240 }}>
                        <label className="label" style={{ display: 'block', marginBottom: 6 }}>Description</label>
                        <input
                            type="text" className="input"
                            placeholder="Brief purpose or goal..." value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isCreating} style={{ height: 42, paddingLeft: 20, paddingRight: 20 }}>
                        {isCreating
                            ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</>
                            : <><Plus size={15} /> Initialize</>
                        }
                    </button>
                </form>
            </div>

            {/* ── Projects Grid ───────────────────────── */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                    <Loader2 size={24} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : projects.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '64px 24px', border: '2px dashed var(--border)' }}>
                    <FolderX size={40} style={{ margin: '0 auto 14px', display: 'block', opacity: 0.2 }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>No projects yet</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Use the form above to create your first project.</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {projects.map((p, i) => {
                        const c = PROJECT_COLORS[i % PROJECT_COLORS.length];
                        return (
                            <div
                                key={p.id}
                                className="card card-flat"
                                style={{ borderLeft: `4px solid ${c.color}`, padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FolderOpen size={17} color={c.color} />
                                    </div>
                                    <button
                                        onClick={() => handleDelete(p.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, transition: 'color 150ms' }}
                                        onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                        title="Delete project"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{p.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                        {p.description || 'No description provided.'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: c.color, background: c.bg, padding: '3px 8px', borderRadius: 'var(--radius-full)' }}>ACTIVE</span>
                                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', padding: '3px 8px' }}>ID: {String(p.id).padStart(4, '0')}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
