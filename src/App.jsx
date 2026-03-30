import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

// Layout
import Layout from './components/layout/Layout';

// Auth pages
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ProfilePage from './components/auth/ProfilePage';

// Dashboards
import DashboardRouter from './components/dashboard/DashboardRouter';

// Full pages
import PermitsPage from './pages/PermitsPage';
import JobsPage from './pages/JobsPage';
import DisputesPage from './pages/DisputesPage';
import DocumentsPage from './pages/DocumentsPage';
import FeesPage from './pages/FeesPage';
import IDCardPage from './pages/IDCardPage';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin
import UserManagement from './components/admin/UserManagement';
import Reports from './components/admin/Reports';
import Settings from './components/admin/Settings';

/* ------------------------------------------------------------------ */
/*  Placeholder for training (not yet built)                           */
/* ------------------------------------------------------------------ */
function PlaceholderPage({ title, description }) {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="page-title">{title}</h1>
      <div className="card">
        <p className="text-gray-500">{description || 'This page is under construction.'}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Route guards                                                       */
/* ------------------------------------------------------------------ */
function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#003366] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function RequireAdmin() {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function PublicOnly() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/* ------------------------------------------------------------------ */
/*  App component                                                      */
/* ------------------------------------------------------------------ */
function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/welcome" element={<LandingPage />} />
      </Route>

      {/* Protected routes */}
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<Settings />} />

        {/* Permits - full page with sub-routes */}
        <Route path="/permits/*" element={<PermitsPage />} />

        {/* Disputes */}
        <Route path="/disputes/*" element={<DisputesPage />} />

        {/* Jobs */}
        <Route path="/jobs/*" element={<JobsPage />} />

        {/* Documents */}
        <Route path="/documents" element={<DocumentsPage />} />

        {/* Fees */}
        <Route path="/fees/*" element={<FeesPage />} />

        {/* ID Cards */}
        <Route path="/id-cards" element={<IDCardPage />} />

        {/* Training */}
        <Route path="/training" element={<PlaceholderPage title="Workforce Training" description="Browse workforce readiness training programs, RATED apprenticeship programme, resume writing workshops, and career development resources offered by the Department of Labour and Workforce Development." />} />

        {/* Admin-only */}
        <Route element={<RequireAdmin />}>
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/reports" element={<Reports />} />
        </Route>
      </Route>

      {/* Redirects & catch-all */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
