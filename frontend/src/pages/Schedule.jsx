/**
 * pages/Schedule.jsx — Role-based dispatcher
 * Students  → StudentSchedule  (learning-focused daily planner)
 * Workers   → WorkerSchedule  (energy-based execution planner)
 *
 * This is the ONLY guard preventing students from seeing Worker UI.
 */
import StudentSchedule from '../modules/student/StudentSchedule';
import WorkerSchedule from '../modules/worker/WorkerSchedule';

export default function Schedule() {
    const user = JSON.parse(localStorage.getItem('xpilot_user') || '{}');
    return user.role === 'worker' ? <WorkerSchedule /> : <StudentSchedule />;
}
