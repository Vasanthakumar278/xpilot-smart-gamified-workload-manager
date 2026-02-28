import { Play, Coffee, Moon, Sun } from 'lucide-react';

export default function StudySessionCard({ onStart }) {
    return (
        <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            padding: '32px',
            borderRadius: '24px',
            color: '#fff',
            fontFamily: '"Outfit", sans-serif',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0' }}>Ready for deep learning?</h3>
                <p style={{ fontSize: '14px', opacity: 0.9, margin: '0 0 32px 0', maxWidth: '200px', lineHeight: '1.5' }}>
                    Start a focus session now to boost your streak and earn 2x XP.
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={onStart}
                        style={{
                            background: '#fff',
                            border: 'none',
                            color: '#6366f1',
                            padding: '12px 24px',
                            borderRadius: '14px',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Play size={16} fill="currentColor" /> Start Now
                    </button>
                    <button style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        color: '#fff',
                        padding: '12px',
                        borderRadius: '14px',
                        cursor: 'pointer'
                    }}>
                        <Coffee size={18} />
                    </button>
                </div>
            </div>

            {/* Decorative background elements */}
            <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '120px',
                height: '120px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '60px',
                zIndex: 1
            }}></div>
            <div style={{
                position: 'absolute',
                bottom: '20px',
                right: '40px',
                opacity: 0.2,
                zIndex: 1
            }}>
                <Moon size={64} />
            </div>
        </div>
    );
}
