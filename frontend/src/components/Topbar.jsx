/**
 * components/Topbar.jsx — Fixed top header bar
 */
import { Briefcase, GraduationCap } from 'lucide-react';

export default function Topbar({ title }) {
    const user = JSON.parse(localStorage.getItem('xpilot_user') || '{}');

    return (
        <header className="topbar">
            <h1 className="topbar-title">{title || 'XPilot'}</h1>

            <div className="topbar-right">
                {/* Role badge */}
                <div className={`badge ${user.role === 'worker' ? 'badge-amber' : 'badge-accent'}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {user.role === 'worker' ? <><Briefcase size={14} /> Worker</> : <><GraduationCap size={14} /> Student</>}
                </div>
            </div>
        </header>
    );
}
