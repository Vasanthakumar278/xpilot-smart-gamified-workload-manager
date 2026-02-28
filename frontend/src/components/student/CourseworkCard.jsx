import { Book, ChevronRight, Play } from 'lucide-react';

export default function CourseworkCard({ tracks = [] }) {
    // Mock data if none provided
    const displayTracks = tracks.length > 0 ? tracks : [
        { id: 1, name: "Advanced Algorithms", progress: 65, color: "#6366f1" },
        { id: 2, name: "Systems Design", progress: 40, color: "#10b981" },
        { id: 3, name: "Cognitive Psychology", progress: 12, color: "#f59e0b" }
    ];

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(229, 231, 235, 0.5)',
            padding: '24px',
            borderRadius: '24px',
            fontFamily: '"Outfit", sans-serif'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '12px' }}>
                        <Book size={18} color="#6366f1" />
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>Current Tracks</span>
                </div>
                <button style={{ background: 'transparent', border: 'none', color: '#6366f1', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>View All</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {displayTracks.map(track => (
                    <div key={track.id} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{track.name}</span>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af' }}>{track.progress}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${track.progress}%`, height: '100%', background: track.color, borderRadius: '3px' }}></div>
                            </div>
                        </div>
                        <button style={{ padding: '8px', background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '10px', color: '#9ca3af', cursor: 'pointer' }}>
                            <ChevronRight size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
