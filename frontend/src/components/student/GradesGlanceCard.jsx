import { TrendingUp, Award, Clock } from 'lucide-react';

export default function GradesGlanceCard() {
    return (
        <div style={{
            background: '#fff',
            border: '1px solid #f3f4f6',
            padding: '24px',
            borderRadius: '24px',
            fontFamily: '"Outfit", sans-serif'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <div style={{ padding: '8px', background: '#fef3c7', borderRadius: '12px' }}>
                    <TrendingUp size={18} color="#d97706" />
                </div>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>Academic Overview</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>CGPA</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#1f2937' }}>9.2</div>
                </div>
                <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Credits</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#1f2937' }}>18</div>
                </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#ecfdf5', borderRadius: '16px', color: '#059669' }}>
                <Award size={18} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Top 5% in System Architecture</span>
            </div>
        </div>
    );
}
