import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, GripVertical, Plus, Zap, Clock, CheckCheck, Inbox, Trash2 } from 'lucide-react';
import client from '../../api/client';

const PRIORITY_STYLES = {
    high: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'HIGH' },
    medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'MED' },
    low: { color: '#10b981', bg: 'rgba(16,185,129,0.08)', label: 'LOW' },
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function isOverdue(task) {
    if (task.status === 'completed') return false;
    const created = new Date(task.created_at);
    return (Date.now() - created.getTime()) > 24 * 60 * 60 * 1000;
}

export default function PriorityTasksCard({ onSelectTask }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quickTitle, setQuickTitle] = useState('');
    const [adding, setAdding] = useState(false);
    const [hoveredId, setHoveredId] = useState(null);
    const [dragId, setDragId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => { fetchTasks(); }, []);

    const fetchTasks = async () => {
        try {
            const res = await client.get('/tasks/');
            setTasks(res.data.filter(t => t.status !== 'completed'));
        } catch (err) {
            console.error('PriorityTasksCard error:', err);
        } finally {
            setLoading(false);
        }
    };

    // ── Quick Add ───────────────────────────────────────────────────
    const handleQuickAdd = async (e) => {
        e.preventDefault();
        if (!quickTitle.trim()) return;
        setAdding(true);
        try {
            await client.post('/tasks/', { title: quickTitle.trim(), priority: 'medium', estimated_minutes: 30 });
            setQuickTitle('');
            fetchTasks();
        } catch (err) {
            console.error('Quick add failed:', err);
        } finally {
            setAdding(false);
        }
    };

    // ── Delete ──────────────────────────────────────────────────────
    const handleDelete = async (id, e) => {
        e.stopPropagation();
        try {
            await client.delete(`/tasks/${id}`);
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    // ── Drag-to-reorder (HTML5) ─────────────────────────────────────
    const handleDragStart = (e, id) => {
        setDragId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, id) => {
        e.preventDefault();
        if (id !== dragId) setDragOverId(id);
    };

    const handleDrop = async (e, targetId) => {
        e.preventDefault();
        if (!dragId || dragId === targetId) return;

        const ordered = [...tasks];
        const fromIdx = ordered.findIndex(t => t.id === dragId);
        const toIdx = ordered.findIndex(t => t.id === targetId);
        const [moved] = ordered.splice(fromIdx, 1);
        ordered.splice(toIdx, 0, moved);

        // Optimistic update
        setTasks(ordered);
        setDragId(null);
        setDragOverId(null);

        // Persist new order_index
        try {
            await Promise.all(
                ordered.map((t, i) => client.patch(`/tasks/${t.id}/reorder`, { order_index: i }))
            );
        } catch (err) {
            console.error('Reorder failed, refetching:', err);
            fetchTasks();
        }
    };

    const handleDragEnd = () => {
        setDragId(null);
        setDragOverId(null);
    };

    const sortedTasks = [...tasks].sort(
        (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
    );

    return (
        <div className="card" style={{ padding: '22px 22px 16px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertTriangle size={14} color="#ef4444" />
                    </div>
                    <div>
                        <span className="card-title" style={{ fontSize: 12 }}>Priority Tasks</span>
                        {tasks.length > 0 && (
                            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-muted)', padding: '2px 7px', borderRadius: 'var(--radius-full)' }}>
                                {tasks.length}
                            </span>
                        )}
                    </div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Drag to reorder</span>
            </div>

            {/* Quick Add */}
            <form onSubmit={handleQuickAdd} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input
                    ref={inputRef}
                    type="text"
                    className="input"
                    placeholder="+ Quick add a task…"
                    value={quickTitle}
                    onChange={e => setQuickTitle(e.target.value)}
                    style={{ flex: 1, fontSize: 13, padding: '8px 12px', height: 38, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={adding || !quickTitle.trim()} style={{ height: 38, paddingLeft: 14, paddingRight: 14 }}>
                    <Plus size={14} /> Add
                </button>
            </form>

            <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: 14 }} />

            {/* Task list */}
            {loading ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
            ) : sortedTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 16px', color: 'var(--text-muted)' }}>
                    <Inbox size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>No pending tasks</div>
                    <div style={{ fontSize: 12 }}>Type above and click Add.</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {sortedTasks.map(task => {
                        const ps = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
                        const overdue = isOverdue(task);
                        const isDragging = dragId === task.id;
                        const isOver = dragOverId === task.id;
                        const isActive = task.status === 'active';

                        return (
                            <div
                                key={task.id}
                                draggable
                                onDragStart={e => handleDragStart(e, task.id)}
                                onDragOver={e => handleDragOver(e, task.id)}
                                onDrop={e => handleDrop(e, task.id)}
                                onDragEnd={handleDragEnd}
                                onMouseEnter={() => setHoveredId(task.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '9px 10px',
                                    borderRadius: 'var(--radius-md)',
                                    borderLeft: `3px solid ${overdue ? '#f59e0b' : ps.color}`,
                                    background: isOver ? ps.bg : isDragging ? 'var(--bg-subtle)' : 'transparent',
                                    opacity: isDragging ? 0.5 : 1,
                                    transition: 'background 150ms ease, opacity 150ms ease',
                                    cursor: 'grab',
                                }}
                            >
                                {/* Drag handle */}
                                <GripVertical size={14} color="var(--text-muted)" style={{ flexShrink: 0, opacity: hoveredId === task.id ? 1 : 0.3 }} />

                                {/* Task info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                        <span style={{ fontSize: 9, fontWeight: 800, color: ps.color, background: ps.bg, padding: '1px 6px', borderRadius: 4 }}>
                                            {ps.label}
                                        </span>
                                        {overdue && (
                                            <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b' }}>OVERDUE</span>
                                        )}
                                        {isActive && (
                                            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--green)' }}>● ACTIVE</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                                    {task.estimated_minutes && (
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                            <Clock size={10} /> {task.estimated_minutes}m
                                        </div>
                                    )}
                                </div>

                                {/* Actions — revealed on hover */}
                                <div style={{ display: 'flex', gap: 6, opacity: hoveredId === task.id ? 1 : 0, transition: 'opacity 150ms ease', flexShrink: 0 }}>
                                    <button
                                        onClick={e => { e.stopPropagation(); onSelectTask && onSelectTask(task); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, background: 'var(--accent)', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        <Zap size={11} fill="currentColor" /> Focus
                                    </button>
                                    <button
                                        onClick={e => handleDelete(task.id, e)}
                                        style={{ display: 'flex', alignItems: 'center', padding: '5px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.10)', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                                        title="Delete task"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
