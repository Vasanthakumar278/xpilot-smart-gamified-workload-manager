/**
 * components/Sidebar.jsx — Fixed left navigation
 */
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, BarChart2, Award, LogOut, Zap, Timer } from 'lucide-react';

const NAV_ITEMS = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/student/dashboard' },
    { icon: <Timer size={18} />, label: 'Study Room', path: '/student/study' },
    { icon: <Calendar size={18} />, label: 'Schedule', path: '/student/schedule' },
    { icon: <BarChart2 size={18} />, label: 'Analytics', path: '/student/analytics' },
    { icon: <Award size={18} />, label: 'XP History', path: '/student/xp' },
];

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const user = JSON.parse(localStorage.getItem('xpilot_user') || '{}');
    const initials = user.name ? user.name.slice(0, 2).toUpperCase() : 'XP';

    function handleLogout() {
        localStorage.removeItem('xpilot_token');
        localStorage.removeItem('xpilot_user');
        navigate('/');
    }

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-text" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    XPilot <Zap size={20} color="var(--accent)" fill="var(--accent)" />
                </div>
                <div className="sidebar-logo-sub">Gamified Productivity</div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="sidebar-section-label">Main</div>
                {NAV_ITEMS.map((item) => (
                    <button
                        key={item.path}
                        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <span className="nav-item-icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}

                <div className="sidebar-section-label">Account</div>
                <button className="nav-item" onClick={handleLogout}>
                    <span className="nav-item-icon"><LogOut size={18} /></span>
                    Logout
                </button>
            </nav>

            {/* User footer */}
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initials}</div>
                    <div>
                        <div className="sidebar-user-name">{user.name || 'User'}</div>
                        <div className="sidebar-user-role">{user.role || 'student'} mode</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
