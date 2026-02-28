/**
 * App.jsx — Root routing with role-based application separation
 */
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import Schedule from './pages/Schedule';
import Analytics from './pages/Analytics';
import XPHistory from './pages/XPHistory';
import StudentLayout from './layout/StudentLayout';
import WorkerLayout from './layout/WorkerLayout';
import DeepWork from './pages/worker/DeepWork';
import WorkerAnalytics from './pages/worker/WorkerAnalytics';
import Projects from './pages/worker/Projects';
import FocusArena from './pages/worker/FocusArena';
import ArenaMatchScreen from './components/worker/ArenaMatchScreen';
import { SessionProvider, SessionContext } from './context/SessionContext';
import { useContext } from 'react';

// ── Role-Based Route Wrappers ────────────────────────────────────────────────

function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('xpilot_token');
  const user = JSON.parse(localStorage.getItem('xpilot_user') || '{}');

  if (!token) return <Navigate to="/" replace />;
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to correct role home if mismatch
    return <Navigate to={user.role === 'worker' ? '/worker/dashboard' : '/student/dashboard'} replace />;
  }

  return children;
}

// ── Sub-Applications ─────────────────────────────────────────────────────────

function StudentApp() {
  return (
    <StudentLayout title="Dashboard">
      <Routes>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="study" element={<Dashboard />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="xp" element={<XPHistory />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </StudentLayout>
  );
}

function WorkerApp() {
  const { activeSession } = useContext(SessionContext);
  const location = useLocation();
  const isDeepWorkActive = activeSession && location.pathname.includes('deep-work');
  const isArenaMatch = location.pathname.includes('/arena/match/');

  const content = (
    <Routes>
      <Route path="dashboard" element={
        activeSession ? <Navigate to="/worker/deep-work" replace /> : <WorkerDashboard />
      } />
      <Route path="deep-work" element={<DeepWork />} />
      <Route path="projects" element={<Projects />} />
      <Route path="analytics" element={<WorkerAnalytics />} />
      <Route path="arena" element={<FocusArena />} />
      <Route path="arena/match/:challengeId" element={<ArenaMatchScreen />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );

  if (isDeepWorkActive || isArenaMatch) {
    return <div className="immersive-shell">{content}</div>;
  }

  return (
    <WorkerLayout title="Console">
      {content}
    </WorkerLayout>
  );
}

// ── Root Router ──────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Student Application */}
        <Route path="/student/*" element={
          <ProtectedRoute requiredRole="student">
            <StudentApp />
          </ProtectedRoute>
        } />

        {/* Worker Application */}
        <Route path="/worker/*" element={
          <ProtectedRoute requiredRole="worker">
            <SessionProvider>
              <WorkerApp />
            </SessionProvider>
          </ProtectedRoute>
        } />

        {/* Catch-all redirect based on stored role */}
        <Route path="*" element={<LoginRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

function LoginRedirect() {
  const token = localStorage.getItem('xpilot_token');
  const user = JSON.parse(localStorage.getItem('xpilot_user') || '{}');

  if (!token) return <Navigate to="/" replace />;
  return <Navigate to={user.role === 'worker' ? '/worker/dashboard' : '/student/dashboard'} replace />;
}
