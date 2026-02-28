/**
 * components/chatbot/ChatMessage.jsx
 * A single message bubble — either from the user or the XPilot assistant.
 */

export default function ChatMessage({ message }) {
    const isBot = message.from === 'bot';

    return (
        <div style={{
            display: 'flex',
            flexDirection: isBot ? 'row' : 'row-reverse',
            alignItems: 'flex-end',
            gap: 8,
            marginBottom: 12,
        }}>
            {/* Avatar */}
            {isBot && (
                <div style={{
                    width: 28, height: 28, borderRadius: 9999, flexShrink: 0,
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                }}>
                    ⚡
                </div>
            )}

            {/* Bubble */}
            <div style={{
                maxWidth: '78%',
                padding: '10px 14px',
                borderRadius: isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                background: isBot
                    ? '#fff'
                    : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: isBot ? 'var(--text-primary)' : '#fff',
                fontSize: 13,
                lineHeight: 1.55,
                boxShadow: isBot
                    ? '0 2px 10px rgba(0,0,0,0.08)'
                    : '0 2px 10px rgba(99,102,241,0.3)',
                border: isBot ? '1px solid rgba(0,0,0,0.06)' : 'none',
            }}>
                {message.text}

                {/* Timestamp */}
                <div style={{
                    fontSize: 10,
                    marginTop: 4,
                    color: isBot ? 'var(--text-muted)' : 'rgba(255,255,255,0.65)',
                    textAlign: 'right',
                }}>
                    {new Date(message.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    );
}
