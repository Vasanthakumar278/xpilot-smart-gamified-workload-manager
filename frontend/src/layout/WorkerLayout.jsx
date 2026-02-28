/**
 * layout/WorkerLayout.jsx — Authenticated shell for Workers
 * WorkerSidebar + Topbar + outlet
 */
import WorkerSidebar from '../components/worker/WorkerSidebar';
import Topbar from '../components/Topbar';
import ChatbotButton from '../components/chatbot/ChatbotButton';

export default function WorkerLayout({ children, title }) {
    return (
        <div className="app-shell">
            <WorkerSidebar />
            <div className="main-content">
                <Topbar title={title} />
                <div className="page-content">
                    {children}
                </div>
            </div>
            <ChatbotButton />
        </div>
    );
}
