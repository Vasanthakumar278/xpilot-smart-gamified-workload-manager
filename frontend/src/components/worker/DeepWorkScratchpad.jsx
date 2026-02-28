import { useState } from 'react';
import { PenLine, X, Send } from 'lucide-react';

export default function DeepWorkScratchpad() {
    const [note, setNote] = useState('');
    const [open, setOpen] = useState(false);

    if (!open) return (
        <button
            onClick={() => setOpen(true)}
            className="btn btn-secondary"
            style={{
                position: 'fixed', bottom: 24, right: 88, zIndex: 100,
                boxShadow: 'var(--shadow-lg)', borderRadius: 'var(--radius-full)',
                padding: '10px 16px', gap: 8
            }}
        >
            <PenLine size={18} /> Quick Note
        </button>
    );

    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 88, width: 300, zIndex: 100,
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '12px 16px',
                background: 'var(--bg-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-subtle)'
            }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Quick Note</span>
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={16} />
                </button>
            </div>
            <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Capture a thought without breaking flow..."
                className="input textarea"
                style={{ width: '100%', border: 'none', borderRadius: 0, minHeight: 120, padding: 16, resize: 'none' }}
            />
            <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)' }}>
                <button className="btn btn-primary btn-sm" disabled={!note.trim()}>
                    <Send size={12} /> Save
                </button>
            </div>
        </div>
    );
}
