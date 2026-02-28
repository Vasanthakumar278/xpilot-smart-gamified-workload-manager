/**
 * components/chatbot/ChatbotButton.jsx
 * Floating action button at bottom-right that toggles ChatWindow.
 * Self-contained: reads user role from localStorage.
 */
import { useState } from 'react';
import ChatWindow from './ChatWindow';

export default function ChatbotButton() {
    const [open, setOpen] = useState(false);
    const user = JSON.parse(localStorage.getItem('xpilot_user') || '{}');
    const role = user.role || 'student';

    // Only render if authenticated
    if (!user.token && !localStorage.getItem('xpilot_token')) return null;

    return (
        <>
            {/* Inject CSS keyframes */}
            <style>{`
                @keyframes chatSlideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes chatPulse {
                    0%, 100% { box-shadow: 0 8px 24px rgba(99,102,241,0.45); }
                    50%       { box-shadow: 0 8px 32px rgba(99,102,241,0.65); }
                }
                @keyframes dotBounce {
                    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
                    40%           { transform: translateY(-6px); opacity: 1; }
                }
                .xpilot-chat-dot { animation: dotBounce 1.2s infinite; display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background: #94a3b8; }
                .xpilot-chat-dot:nth-child(2) { animation-delay: 0.15s; }
                .xpilot-chat-dot:nth-child(3) { animation-delay: 0.3s; }
            `}</style>

            {/* Chat panel */}
            {open && <ChatWindow onClose={() => setOpen(false)} role={role} />}

            {/* Floating button */}
            <button
                onClick={() => setOpen(o => !o)}
                aria-label={open ? 'Close XPilot Assistant' : 'Open XPilot Assistant'}
                style={{
                    position: 'fixed', bottom: 20, right: 20, zIndex: 10000,
                    width: 56, height: 56, borderRadius: 9999, border: 'none',
                    background: open
                        ? 'linear-gradient(135deg, #374151, #1f2937)'
                        : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#fff',
                    fontSize: open ? 20 : 24,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: open
                        ? '0 8px 24px rgba(0,0,0,0.3)'
                        : '0 8px 24px rgba(99,102,241,0.45)',
                    animation: open ? 'none' : 'chatPulse 3s ease-in-out infinite',
                    transition: 'background 0.25s ease, box-shadow 0.25s ease, font-size 0.15s ease',
                    fontFamily: 'inherit',
                }}
            >
                {open ? '✕' : '💬'}
            </button>

            {/* Notification dot — shows when closed to hint something's there */}
            {!open && (
                <div style={{
                    position: 'fixed', bottom: 68, right: 20, zIndex: 10000,
                    background: '#fff', borderRadius: 12, padding: '5px 10px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.07)',
                    fontSize: 11, fontWeight: 600, color: '#6366f1',
                    animation: 'chatSlideUp 0.3s ease',
                    pointerEvents: 'none',
                }}>
                    Ask XPilot ⚡
                </div>
            )}
        </>
    );
}
