/**
 * pages/Login.jsx — Register / Login with role selection
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, LogIn, UserPlus, GraduationCap, Briefcase } from 'lucide-react';
import client from '../api/client';

export default function Login() {
    const [mode, setMode] = useState('login'); // login | register
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    function set(field) {
        return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (mode === 'register') {
                await client.post('/auth/register', form);
                setMode('login');
                setError('');
                return;
            }
            const res = await client.post('/auth/login', {
                email: form.email,
                password: form.password,
            });
            localStorage.setItem('xpilot_token', res.data.access_token);
            localStorage.setItem('xpilot_user', JSON.stringify({
                id: res.data.user_id,
                name: res.data.name,
                role: res.data.role,
                xp: res.data.xp,
            }));

            if (res.data.role === 'worker') {
                navigate('/worker/dashboard');
            } else {
                navigate('/student/dashboard');
            }
        } catch (e) {
            setError(e.response?.data?.detail || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f0f2f9 0%, #e8eaf6 50%, #d1fae5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
        }}>
            <div style={{ width: '100%', maxWidth: 420 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><Zap size={48} color="#6366f1" /></div>
                    <h1 style={{
                        fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em',
                        color: '#6366f1', marginBottom: 6,
                    }}>XPilot</h1>
                    <p style={{ color: '#64748b', fontSize: 15 }}>Gamified Productivity System</p>
                </div>

                {/* Card */}
                <div className="card">
                    {/* Tabs */}
                    <div className="flex mb-6" style={{ borderRadius: 12, background: '#f0f2f9', padding: 4 }}>
                        {['login', 'register'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setMode(tab); setError(''); }}
                                style={{
                                    flex: 1,
                                    padding: '8px 0',
                                    borderRadius: 10,
                                    border: 'none',
                                    fontWeight: 600,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    transition: 'all 200ms ease',
                                    background: mode === tab ? '#fff' : 'transparent',
                                    color: mode === tab ? '#6366f1' : '#94a3b8',
                                    boxShadow: mode === tab ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    {tab === 'login' ? <><LogIn size={16} /> Sign In</> : <><UserPlus size={16} /> Register</>}
                                </div>
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="flex-col gap-4">
                        {mode === 'register' && (
                            <div className="form-group">
                                <label className="label">Full Name</label>
                                <input className="input" placeholder="Your name" value={form.name} onChange={set('name')} required />
                            </div>
                        )}

                        <div className="form-group">
                            <label className="label">Email</label>
                            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
                        </div>

                        <div className="form-group">
                            <label className="label">Password</label>
                            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
                        </div>

                        {mode === 'register' && (
                            <div className="form-group">
                                <label className="label">I am a…</label>
                                <div className="flex gap-3">
                                    {['student', 'worker'].map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setForm((f) => ({ ...f, role: r }))}
                                            style={{
                                                flex: 1, padding: '12px 0', borderRadius: 12, border: '2px solid',
                                                borderColor: form.role === r ? '#6366f1' : '#e2e8f0',
                                                background: form.role === r ? 'rgba(99,102,241,0.08)' : '#fff',
                                                color: form.role === r ? '#6366f1' : '#64748b',
                                                fontWeight: 600, fontSize: 14, cursor: 'pointer',
                                                transition: 'all 200ms ease',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                {r === 'student' ? <><GraduationCap size={16} /> Student</> : <><Briefcase size={16} /> Worker</>}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {error && <div className="alert alert-error">{error}</div>}

                        <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                {loading ? '…' : mode === 'login' ? <><LogIn size={18} /> Sign In</> : <><UserPlus size={18} /> Create Account</>}
                            </div>
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#94a3b8' }}>
                    XP is earned by effort — not checkbox clicks.
                </p>
            </div>
        </div>
    );
}
