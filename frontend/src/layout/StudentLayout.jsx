/**
 * layout/StudentLayout.jsx — Authenticated shell for Students
 * Sidebar + Topbar + outlet
 */
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import ChatbotButton from '../components/chatbot/ChatbotButton';

export default function StudentLayout({ children, title }) {
    return (
        <div className="app-shell">
            <Sidebar />
            <div className="main-content">
                <Topbar title={title} />
                <div className="page-content">
                    {children}
                </div>
            </div>
            {/* Floating XPilot Assistant — visible on all authenticated pages */}
            <ChatbotButton />
        </div>
    );
}
