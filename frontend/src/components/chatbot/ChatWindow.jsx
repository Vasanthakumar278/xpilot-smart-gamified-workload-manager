/**
 * components/chatbot/ChatWindow.jsx
 * XPilot Coach — multi-track aware chat interface.
 *
 * Features:
 *  - Active track shown in header: "XPilot Coach — Computer Networks"
 *  - Chat history loaded per track on open
 *  - Switch Topic card when bot suggests a different subject
 *  - 🗑 Clear Chat button: deletes ChatHistory only — sessions/XP untouched
 *  - Typing indicator while waiting for coach response
 */
import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import client from '../../api/client';

const WELCOME = (topic) => ({
    from: 'bot',
    text: topic
        ? `Continuing on "${topic}". Ask me what to revise, what to do next, or your progress.`
        : "Hi! I'm your XPilot Coach. I have access to your full session history — ask me what you left off, what to do next, or what to revise today.",
    ts: Date.now(),
    suggested_focus: null,
});

const QUICK_PROMPTS = [
    'What did I leave yesterday?',
    'What should I do now?',
    'What should I revise?',
    "Recommend today's plan",
];

export default function ChatWindow({ onClose, role }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTrack, setActiveTrack] = useState(null);  // { id, topic, status }
    const [allTracks, setAllTracks] = useState([]);
    const [initialised, setInitialised] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    // ── Load active track + history on mount ───────────────────────────────
    useEffect(() => {
        setMessages([WELCOME(null)]);
        setInitialised(true);
        setTimeout(() => inputRef.current?.focus(), 150);
    }, []);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // ── Send message ───────────────────────────────────────────────────────
    async function send(text) {
        const msg = text || input.trim();
        if (!msg || loading) return;
        setInput('');
        setMessages(prev => [...prev, { from: 'user', text: msg, ts: Date.now() }]);
        setLoading(true);

        try {
            const res = await client.post('/coach/query', { message: msg }, { timeout: 30000 });
            const data = res.data;

            setMessages(prev => [...prev, {
                from: 'bot',
                text: data.reply,
                ts: Date.now(),
            }]);
        } catch (err) {
            console.error("Coach API Error:", err);
            setMessages(prev => [...prev, {
                from: 'bot',
                text: 'Could not reach the coach brain. Ensure the backend server is running and API keys are valid.',
                ts: Date.now(),
            }]);
        } finally {
            setLoading(false);
        }
    }

    // ── Clear chat ─────────────────────────────────────────────────────────
    function clearChat() {
        setMessages([WELCOME(null)]);
    }

    if (!initialised) return null;

    return (
        <div style={windowStyle}>
            {/* ── Header ── */}
            <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={avatarStyle}>🧠</div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            XPilot Coach
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>
                            History-aware · Local Mistral ML
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={clearChat} style={iconBtnStyle} title="Clear chat">🗑</button>
                    <button onClick={onClose} style={iconBtnStyle} title="Close">✕</button>
                </div>
            </div>

            {/* ── Messages ── */}
            <div style={messagesStyle}>
                {messages.map((m, i) => (
                    <div key={i}>
                        <ChatMessage message={m} />
                    </div>
                ))}

                {loading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <div style={avatarStyle}>🧠</div>
                        <div style={{ padding: '10px 14px', borderRadius: '4px 16px 16px 16px', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}>
                            <TypingDots />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* ── Quick prompts ── */}
            <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {QUICK_PROMPTS.map(p => (
                    <button key={p} onClick={() => send(p)} style={quickStyle} disabled={loading}>{p}</button>
                ))}
            </div>

            {/* ── Input ── */}
            <div style={inputRowStyle}>
                <input
                    ref={inputRef}
                    style={inputStyle}
                    placeholder="Ask about any subject, what to do next, progress…"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    disabled={loading}
                />
                <button onClick={() => send()} disabled={!input.trim() || loading} style={sendBtnStyle(!!input.trim() && !loading)}>↑</button>
            </div>
        </div>
    );
}

function TypingDots() {
    return (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: 16 }}>
            {[0, 1, 2].map(i => (
                <span key={i} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#6366f1', opacity: 0.7,
                    animation: `bounce 1.2s ease ${i * 0.18}s infinite`,
                }} />
            ))}
        </div>
    );
}

/* ── Styles ──────────────────────────────────────────────────────────────── */
const windowStyle = {
    position: 'fixed', bottom: 84, right: 20, zIndex: 9999,
    width: 380, maxHeight: '74vh',
    display: 'flex', flexDirection: 'column',
    background: '#f8fafc', borderRadius: 20,
    boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.1)',
    border: '1px solid rgba(0,0,0,0.08)',
    overflow: 'hidden',
    animation: 'chatSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
};

const headerStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px',
    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
    flexShrink: 0,
};

const avatarStyle = {
    width: 32, height: 32, borderRadius: 9999,
    background: 'rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 15, flexShrink: 0,
};

const iconBtnStyle = {
    background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
    width: 28, height: 28, borderRadius: 9999, cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const messagesStyle = {
    flex: 1, overflowY: 'auto', padding: '16px 12px 4px',
    maxHeight: '44vh', scrollbarWidth: 'thin',
};

const quickStyle = {
    fontSize: 11, padding: '4px 10px', borderRadius: 999, cursor: 'pointer',
    background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
    color: '#4f46e5', fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap',
};

const inputRowStyle = {
    display: 'flex', gap: 8, padding: '10px 12px 12px',
    background: '#fff', borderTop: '1px solid rgba(0,0,0,0.07)', flexShrink: 0,
};

const inputStyle = {
    flex: 1, padding: '9px 12px', borderRadius: 999, fontSize: 13,
    border: '1.5px solid rgba(99,102,241,0.25)', outline: 'none',
    fontFamily: 'inherit', background: '#f8fafc', color: 'var(--text-primary)',
};

const sendBtnStyle = (active) => ({
    width: 36, height: 36, borderRadius: 9999, border: 'none',
    background: active ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#e2e8f0',
    color: active ? '#fff' : '#94a3b8',
    fontWeight: 700, fontSize: 16, cursor: active ? 'pointer' : 'default',
    fontFamily: 'inherit', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: active ? '0 4px 12px rgba(99,102,241,0.35)' : 'none',
});
