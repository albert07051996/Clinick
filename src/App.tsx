import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProceduresPage from './pages/admin/AdminProceduresPage';
import AdminLeadsPage from './pages/admin/AdminLeadsPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminBeforeAfterPage from './pages/admin/AdminBeforeAfterPage';
import AdminSpecializationsPage from './pages/admin/AdminSpecializationsPage';
import AdminDoctorsPage from './pages/admin/AdminDoctorsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminSchedulesPage from './pages/admin/AdminSchedulesPage';
import AdminPatientsPage from './pages/admin/AdminPatientsPage';
import AdminAppointmentsCalendarPage from './pages/admin/AdminAppointmentsCalendarPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import DoctorRoute from './components/auth/DoctorRoute';
import DoctorSchedulePage from './pages/doctor/DoctorSchedulePage';
import DoctorPatientDetailPage from './pages/doctor/DoctorPatientDetailPage';
import DoctorMySchedulePage from './pages/doctor/DoctorMySchedulePage';
import { LanguageProvider } from './contexts/LanguageContext';
import './styles/globals.css';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor"
            element={
              <DoctorRoute>
                <DoctorSchedulePage />
              </DoctorRoute>
            }
          />
          <Route
            path="/doctor/patients/:id"
            element={
              <DoctorRoute>
                <DoctorPatientDetailPage />
              </DoctorRoute>
            }
          />
          <Route
            path="/doctor/my-schedule"
            element={
              <DoctorRoute>
                <DoctorMySchedulePage />
              </DoctorRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index                   element={<AdminDashboardPage />} />
            <Route path="specializations"  element={<AdminSpecializationsPage />} />
            <Route path="doctors"          element={<AdminDoctorsPage />} />
            <Route path="schedules"        element={<AdminSchedulesPage />} />
            <Route path="patients"         element={<AdminPatientsPage />} />
            <Route path="appointments"     element={<AdminAppointmentsCalendarPage />} />
            <Route path="procedures"       element={<AdminProceduresPage />} />
            <Route path="before-after"     element={<AdminBeforeAfterPage />} />
            <Route path="leads"            element={<AdminLeadsPage />} />
            <Route path="reviews"          element={<AdminReviewsPage />} />
            <Route path="users"            element={<AdminUsersPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
