/**
 * pages/student/StudyGroups.jsx
 */
import { Users, Search, PlusCircle } from 'lucide-react';

export default function StudyGroups() {
    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', fontFamily: '"Outfit", sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Users size={32} color="#6366f1" /> Study Groups
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '16px', margin: '8px 0 0 0' }}>
                        Collaborate with peers, share resources, and learn together.
                    </p>
                </div>
                <button style={{
                    background: '#6366f1', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px',
                    fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                }}>
                    <PlusCircle size={18} /> Create Group
                </button>
            </div>

            <div style={{
                background: '#fff', borderRadius: '24px', border: '1px solid #f3f4f6',
                padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
                <div style={{ width: '80px', height: '80px', background: '#e0e7ff', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                    <Search size={40} color="#6366f1" />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#1f2937', margin: '0 0 12px 0' }}>Discover Groups</h3>
                <p style={{ fontSize: '16px', color: '#6b7280', maxWidth: '400px', margin: '0 0 32px 0', lineHeight: 1.6 }}>
                    The Study Groups feature is currently in active development. Check back soon for live matchmaking and collaborative study sessions!
                </p>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ background: '#f9fafb', padding: '16px 24px', borderRadius: '16px', border: '1px solid #f3f4f6' }}>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>142</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Active Groups</div>
                    </div>
                    <div style={{ background: '#f9fafb', padding: '16px 24px', borderRadius: '16px', border: '1px solid #f3f4f6' }}>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>890+</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Students Online</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
