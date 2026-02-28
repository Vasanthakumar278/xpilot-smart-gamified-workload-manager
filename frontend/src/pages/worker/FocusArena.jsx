/**
 * pages/worker/FocusArena.jsx — Competitive Focus Arena
 * Professional, chess-inspired 1v1 deep-work ranking system.
 */
import { useState, useEffect } from 'react';
import { Swords, Trophy, Shield, TrendingUp, Users, Clock, CheckCircle, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';

// ── ELO → Tier ───────────────────────────────────────────────────────────────
function getTier(elo) {
    if (elo >= 1800) return { label: 'Grandmaster', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' };
    if (elo >= 1600) return { label: 'Platinum', color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)' };
    if (elo >= 1400) return { label: 'Gold', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' };
    if (elo >= 1200) return { label: 'Silver', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)' };
    return { label: 'Bronze', color: '#b45309', bg: 'rgba(180,83,9,0.08)' };
}

export default function FocusArena() {
    const [board, setBoard] = useState([]);
    const [myChallenges, setMyChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ opponent_id: '', task_description: '', duration_minutes: 45 });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const me = JSON.parse(localStorage.getItem('xpilot_user') || '{}');

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [lb, ch] = await Promise.all([
                client.get('/leaderboard/'),
                client.get('/challenge/my'),
            ]);
            setBoard(lb.data);
            setMyChallenges(ch.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const myStats = board.find(w => w.is_me);
    const tier = myStats ? getTier(myStats.elo_rating) : getTier(1200);

    const handleChallenge = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!form.opponent_id || !form.task_description) {
            setError('Select an opponent and describe the task.');
            return;
        }
        setSubmitting(true);
        try {
            await client.post('/challenge/create', {
                opponent_id: parseInt(form.opponent_id),
                task_description: form.task_description,
                duration_minutes: form.duration_minutes,
            });
            setSuccess('Challenge sent. Waiting for opponent to accept.');
            setForm({ opponent_id: '', task_description: '', duration_minutes: 45 });
            fetchAll();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to send challenge.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAccept = async (challengeId) => {
        try {
            await client.post(`/challenge/accept/${challengeId}`);
            navigate(`/worker/arena/match/${challengeId}`);
        } catch (err) {
            setError(err.response?.data?.detail || 'Could not accept challenge.');
        }
    };

    const incoming = myChallenges.filter(c => c.my_role === 'opponent' && c.status === 'pending');
    const outgoing = myChallenges.filter(c => c.my_role === 'challenger' && c.status === 'pending');
    const active = myChallenges.filter(c => c.status === 'active');
    const opponents = board.filter(w => !w.is_me);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <Loader2 size={26} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div className="page-header">
                <div>
                    <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Swords size={26} color="var(--accent)" />
                        Focus Arena
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>
                        ELO-ranked competitive deep work. Discipline determines rank.
                    </p>
                </div>
                <div style={{ padding: '6px 14px', background: tier.bg, border: `1px solid ${tier.color}33`, borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 800, color: tier.color, letterSpacing: '0.08em' }}>
                    {tier.label.toUpperCase()}
                </div>
            </div>

            {/* ── Active match banner ─────────────────────────────────────── */}
            {active.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 'var(--radius-lg)', animation: 'pulse 2s ease infinite' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 10, height: 10, background: 'var(--green)', borderRadius: '50%', animation: 'pulse 1s ease infinite' }} />
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>Match in progress vs {c.my_role === 'challenger' ? c.opponent.name : c.challenger.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.task_description} · {c.duration_minutes}m</div>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate(`/worker/arena/match/${c.id}`)}>
                        Rejoin Match <ChevronRight size={13} />
                    </button>
                </div>
            ))}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

                {/* LEFT COLUMN ──────────────────────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* My Stats */}
                    {myStats && (
                        <div className="card" style={{ padding: 24 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 18 }}>My Performance</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                                {[
                                    { label: 'ELO Rating', value: myStats.elo_rating, color: tier.color, icon: <Shield size={16} color={tier.color} /> },
                                    { label: 'Wins', value: myStats.wins, color: 'var(--green)', icon: <Trophy size={16} color="var(--green)" /> },
                                    { label: 'Losses', value: myStats.losses, color: '#ef4444', icon: <TrendingUp size={16} color="#ef4444" /> },
                                    { label: 'Matches', value: myStats.total, color: 'var(--accent)', icon: <Swords size={16} color="var(--accent)" /> },
                                ].map(s => (
                                    <div key={s.label} style={{ textAlign: 'center', padding: '14px 8px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{s.icon}</div>
                                        <div style={{ fontSize: 28, fontWeight: 900, color: s.color, letterSpacing: '-0.04em' }}>{s.value}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Issue Challenge */}
                    <div className="card" style={{ padding: 24 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Swords size={13} /> Issue Challenge
                        </div>
                        <form onSubmit={handleChallenge} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <select
                                className="input"
                                value={form.opponent_id}
                                onChange={e => setForm(f => ({ ...f, opponent_id: e.target.value }))}
                                style={{ fontSize: 13, padding: '10px 12px', height: 42 }}
                            >
                                <option value="">Select opponent…</option>
                                {opponents.map(w => (
                                    <option key={w.id} value={w.id}>
                                        {w.name} — ELO {w.elo_rating} ({w.rank_tier})
                                    </option>
                                ))}
                            </select>

                            <input
                                className="input"
                                placeholder="Task objective (e.g. Draft Q2 report)"
                                value={form.task_description}
                                onChange={e => setForm(f => ({ ...f, task_description: e.target.value }))}
                                style={{ fontSize: 13, padding: '10px 12px', height: 42 }}
                            />

                            <div style={{ display: 'flex', gap: 8 }}>
                                {[25, 45, 90].map(d => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, duration_minutes: d }))}
                                        style={{ flex: 1, padding: '9px 0', borderRadius: 'var(--radius-md)', border: `1.5px solid ${form.duration_minutes === d ? 'var(--accent)' : 'var(--border)'}`, background: form.duration_minutes === d ? 'var(--accent-muted)' : 'transparent', color: form.duration_minutes === d ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                                    >
                                        {d}m
                                    </button>
                                ))}
                            </div>

                            {error && <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{error}</div>}
                            {success && <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>{success}</div>}

                            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ fontWeight: 700 }}>
                                {submitting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Swords size={15} />}
                                {submitting ? 'Sending…' : 'Send Challenge'}
                            </button>
                        </form>
                    </div>

                    {/* Incoming Challenges */}
                    {incoming.length > 0 && (
                        <div className="card" style={{ padding: 24 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Incoming Challenges</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {incoming.map(c => (
                                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius-md)' }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700 }}>from {c.challenger.name}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{c.task_description} · {c.duration_minutes}m</div>
                                        </div>
                                        <button className="btn btn-primary btn-sm" onClick={() => handleAccept(c.id)}>Accept</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Outgoing */}
                    {outgoing.length > 0 && (
                        <div className="card" style={{ padding: '18px 24px' }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Pending Sent</div>
                            {outgoing.map(c => (
                                <div key={c.id} style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>vs {c.opponent.name} — {c.task_description}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>{c.duration_minutes}m · waiting</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN — Leaderboard ──────────────────────────────── */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Users size={15} color="var(--accent)" />
                        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Leaderboard</span>
                    </div>

                    {board.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
                            No workers ranked yet.
                        </div>
                    ) : board.map((w, i) => {
                        const t = getTier(w.elo_rating);
                        return (
                            <div
                                key={w.id}
                                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', background: w.is_me ? `${t.color}08` : 'transparent', opacity: w.is_me ? 1 : 0.88 }}
                            >
                                <div style={{ width: 24, fontSize: 12, fontWeight: 900, color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : 'var(--text-muted)', textAlign: 'center' }}>
                                    {i + 1}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: w.is_me ? 800 : 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {w.name}
                                        {w.is_me && <span style={{ fontSize: 9, fontWeight: 800, color: t.color, background: t.bg, padding: '1px 6px', borderRadius: 4 }}>YOU</span>}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{w.wins}W · {w.losses}L</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 15, fontWeight: 900, color: t.color }}>{w.elo_rating}</div>
                                    <div style={{ fontSize: 10, color: t.color, fontWeight: 700, opacity: 0.7 }}>{w.rank_tier}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
