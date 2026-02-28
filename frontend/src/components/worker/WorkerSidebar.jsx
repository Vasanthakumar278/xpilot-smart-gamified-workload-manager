/**
 * components/worker/WorkerSidebar.jsx — Fixed left navigation for Worker Mode
 */
import { useNavigate, useLocation } from 'react-router-dom';
import { Terminal, FolderOpen, Activity, LogOut, Zap, Swords } from 'lucide-react';

const NAV_ITEMS = [
    { icon: <Terminal size={17} />, label: 'Console', path: '/worker/dashboard', section: 'OPERATIONS' },
    { icon: <FolderOpen size={17} />, label: 'Projects', path: '/worker/projects', section: 'OPERATIONS' },
    { icon: <Activity size={17} />, label: 'Analytics', path: '/worker/analytics', section: 'OPERATIONS' },
    { icon: <Swords size={17} />, label: 'Arena', path: '/worker/arena', section: 'COMPETITIVE' },
];

export default function WorkerSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('xpilot_user') || '{}');
    const initials = user.name ? user.name.slice(0, 2).toUpperCase() : 'WK';

    function handleLogout() {
        localStorage.removeItem('xpilot_token');
        localStorage.removeItem('xpilot_user');
        navigate('/');
    }

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-text" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    XPilot Pro&nbsp;<Zap size={18} color="var(--accent)" fill="var(--accent)" />
                </div>
                <div className="sidebar-logo-sub">Worker Console</div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="sidebar-section-label">Operations</div>
                {NAV_ITEMS.filter(n => n.section === 'OPERATIONS').map((item) => (
                    <button
                        key={item.path}
                        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <span className="nav-item-icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}

                <div className="sidebar-section-label" style={{ marginTop: 12 }}>Competitive</div>
                {NAV_ITEMS.filter(n => n.section === 'COMPETITIVE').map((item) => (
                    <button
                        key={item.path}
                        className={`nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <span className="nav-item-icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}

                <div className="sidebar-section-label" style={{ marginTop: 12 }}>System</div>
                <button className="nav-item" onClick={handleLogout}>
                    <span className="nav-item-icon"><LogOut size={17} /></span>
                    Log Out
                </button>
            </nav>

            {/* User footer */}
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initials}</div>
                    <div>
                        <div className="sidebar-user-name">{user.name || 'Worker'}</div>
                        <div className="sidebar-user-role">Operational Mode</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
