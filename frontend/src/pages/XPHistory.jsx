/**
 * pages/XPHistory.jsx — Full XP log with history
 */
import { useState, useEffect } from 'react';
import { Trophy, Sparkles, Inbox } from 'lucide-react';
import Card from '../components/Card';
import client from '../api/client';

export default function XPHistory() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        client.get('/xp/log')
            .then((res) => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="xp-history-page">
            <div className="page-header">
                <div>
                    <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Trophy size={24} color="var(--accent)" /> XP History
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
                        Every point earned is a real effort recorded.
                    </p>
                </div>
                <div
                    style={{
                        background: 'var(--accent-muted)', color: 'var(--accent)',
                        borderRadius: 'var(--radius-xl)', padding: '12px 24px',
                        fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em',
                    }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={24} /> {data?.total_xp ?? 0} XP</span>
                </div>
            </div>

            <Card>
                <div className="card-title mb-4">All Earned XP</div>
                {loading ? (
                    <div className="flex-col gap-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton" style={{ height: 56, borderRadius: 12 }} />
                        ))}
                    </div>
                ) : (data?.history?.length === 0 || !data) ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Inbox size={48} /></div>
                        <p>No XP yet. Complete a session + reflection to start earning!</p>
                    </div>
                ) : (
                    <div className="flex-col gap-3">
                        {data.history.map((log) => (
                            <div
                                key={log.id}
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '14px 16px', borderRadius: 'var(--radius-md)',
                                    background: 'var(--bg-subtle)',
                                    borderLeft: '3px solid var(--accent)',
                                    transition: 'background var(--transition)',
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{log.reason}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                        {new Date(log.created_at).toLocaleString()}
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: 22, fontWeight: 800, color: 'var(--accent)',
                                    background: 'var(--accent-muted)', borderRadius: 'var(--radius-md)',
                                    padding: '4px 14px',
                                }}>
                                    +{log.xp_awarded}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
