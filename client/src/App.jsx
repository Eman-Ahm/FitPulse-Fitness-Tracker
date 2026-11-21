import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute, { PublicOnlyRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';

// Public pages
import LoginPage           from './pages/LoginPage';
import RegisterPage        from './pages/RegisterPage';
import ForgotPasswordPage  from './pages/ForgotPasswordPage';
import ResetPasswordPage   from './pages/ResetPasswordPage';
import NotFoundPage        from './pages/NotFoundPage';
import PrivacyPage         from './pages/PrivacyPage';
import TermsPage           from './pages/TermsPage';

// Protected pages
import DashboardPage       from './pages/DashboardPage';
import WorkoutsPage        from './pages/WorkoutsPage';
import WorkoutFormPage     from './pages/WorkoutFormPage';
import GoalsPage           from './pages/GoalsPage';
import AnalyticsPage       from './pages/AnalyticsPage';
import ExercisesPage       from './pages/ExercisesPage';
import DietPage            from './pages/DietPage';
import TimerPage           from './pages/TimerPage';
import AchievementsPage    from './pages/AchievementsPage';
import ProfilePage         from './pages/ProfilePage';
import MeasurementsPage    from './pages/MeasurementsPage';
import WaterPage           from './pages/WaterPage';
import BmiPage             from './pages/BmiPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ── Public ── */}
        <Route path="/login"           element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register"        element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/privacy"         element={<PrivacyPage />} />
        <Route path="/terms"           element={<TermsPage />} />

        {/* ── Protected ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/"                    element={<DashboardPage />} />
            <Route path="/exercises"           element={<ExercisesPage />} />
            <Route path="/workouts"            element={<WorkoutsPage />} />
            <Route path="/workouts/new"        element={<WorkoutFormPage />} />
            <Route path="/workouts/:id/edit"   element={<WorkoutFormPage />} />
            <Route path="/timer"               element={<TimerPage />} />
            <Route path="/diet"                element={<DietPage />} />
            <Route path="/goals"               element={<GoalsPage />} />
            <Route path="/achievements"        element={<AchievementsPage />} />
            <Route path="/analytics"           element={<AnalyticsPage />} />
            <Route path="/profile"             element={<ProfilePage />} />
            <Route path="/measurements"        element={<MeasurementsPage />} />
            <Route path="/water"               element={<WaterPage />} />
            <Route path="/bmi"                 element={<BmiPage />} />
          </Route>
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
