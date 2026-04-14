import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

// Shared UI
import ErrorBoundary from './components/common/ErrorBoundary';
import DemoBanner from './components/common/DemoBanner';

// Portal-specific layouts
import BusinessLayout from './components/layout/BusinessLayout';
import WorkerLayout from './components/layout/WorkerLayout';
import JobsLayout from './components/layout/JobsLayout';
import DeptLayout from './components/layout/DeptLayout';

// Portal-specific auth pages
import PortalLogin from './components/auth/PortalLogin';
import PortalRegister from './components/auth/PortalRegister';
import ProfilePage from './components/auth/ProfilePage';

// Dashboards
import DashboardRouter from './components/dashboard/DashboardRouter';

// Public pages — eager
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';

// Public info pages — lazy
const RoadmapPage = lazy(() => import('./pages/RoadmapPage'));
const LimitationsPage = lazy(() => import('./pages/LimitationsPage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));

// Application pages — lazy (heavy: permits/jobs/disputes forms + PDF libs)
const PermitsPage = lazy(() => import('./pages/PermitsPage'));
const JobsPage = lazy(() => import('./pages/JobsPage'));
const DisputesPage = lazy(() => import('./pages/DisputesPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const FeesPage = lazy(() => import('./pages/FeesPage'));
const IDCardPage = lazy(() => import('./pages/IDCardPage'));
const AppealsPage = lazy(() => import('./pages/AppealsPage'));
const TransfersPage = lazy(() => import('./pages/TransfersPage'));
const DisputeRespondentPage = lazy(() => import('./pages/DisputeRespondentPage'));
const VariationsPage = lazy(() => import('./pages/VariationsPage'));
const CardsPage = lazy(() => import('./pages/CardsPage'));

// Admin / Dept — lazy (restricted to dept staff, no need to ship to public users)
const UserManagement = lazy(() => import('./components/admin/UserManagement'));
const PermitReview = lazy(() => import('./components/admin/PermitReview'));
const Reports = lazy(() => import('./components/admin/Reports'));
const Settings = lazy(() => import('./components/admin/Settings'));
const AuditLog = lazy(() => import('./components/admin/AuditLog'));
const PaymentProcessing = lazy(() => import('./components/dept/PaymentProcessing'));
const AppointmentManager = lazy(() => import('./components/dept/AppointmentManager'));
const InspectionManager = lazy(() => import('./components/dept/InspectionManager'));


/* ------------------------------------------------------------------ */
/*  Placeholder for pages not yet built                                */
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
/*  Loading spinner                                                    */
/* ------------------------------------------------------------------ */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#003366] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Portal selector  (public landing page at /)                        */
/* ------------------------------------------------------------------ */
function PortalSelector() {
  const { user } = useAuth();
  // If already logged in, redirect to their portal dashboard
  if (user?.portal) {
    return <Navigate to={`/${user.portal === 'jobseeker' ? 'jobs' : user.portal}/dashboard`} replace />;
  }
  return <LandingPage />;
}

/* ------------------------------------------------------------------ */
/*  Route guards                                                       */
/* ------------------------------------------------------------------ */

/**
 * RequirePortalAuth - ensures the user is authenticated AND belongs to the
 * correct portal.  Wraps children in <Layout> + <Outlet>.
 *
 * @param {string} portal - expected portal value ('business' | 'worker' | 'jobseeker' | 'dept')
 */
const PORTAL_LAYOUTS = {
  business: BusinessLayout,
  worker: WorkerLayout,
  jobseeker: JobsLayout,
  dept: DeptLayout,
};

function RequirePortalAuth({ portal }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  // Not logged in -> redirect to portal-specific login
  if (!user) {
    const portalPath = portal === 'jobseeker' ? '/jobs' : `/${portal}`;
    return <Navigate to={`${portalPath}/login`} state={{ from: location }} replace />;
  }

  // Logged in but wrong portal -> redirect to their own dashboard
  if (user.portal !== portal) {
    const correctPath = user.portal === 'jobseeker' ? '/jobs' : `/${user.portal}`;
    return <Navigate to={`${correctPath}/dashboard`} replace />;
  }

  const PortalLayout = PORTAL_LAYOUTS[portal] || BusinessLayout;
  return <PortalLayout />;
}

/**
 * RequireDeptPermission - additional guard inside the dept portal that checks
 * the user's deptRole has a specific permission.
 */
function RequireDeptPermission({ permission }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) {
    return <Navigate to="/dept/dashboard" replace />;
  }
  return <Outlet />;
}

/**
 * PublicPortalRoute - for login/register pages. If already logged in,
 * redirect to the user's portal dashboard.
 */
function PublicPortalRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user?.portal) {
    const portalPath = user.portal === 'jobseeker' ? '/jobs' : `/${user.portal}`;
    return <Navigate to={`${portalPath}/dashboard`} replace />;
  }
  return <Outlet />;
}

/* ------------------------------------------------------------------ */
/*  App routes                                                         */
/* ------------------------------------------------------------------ */
function AppRoutes() {
  return (
    <Routes>
      {/* ============================================================ */}
      {/*  PUBLIC - Portal selector                                     */}
      {/* ============================================================ */}
      <Route path="/" element={<PortalSelector />} />

      {/* Legacy /welcome route for backward compat */}
      <Route path="/welcome" element={<LandingPage />} />

      {/* Public info pages */}
      <Route path="/roadmap" element={<RoadmapPage />} />
      <Route path="/limitations" element={<LimitationsPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/faq" element={<FAQPage />} />

      {/* ============================================================ */}
      {/*  BUSINESS PORTAL  (/business/*)                               */}
      {/* ============================================================ */}
      <Route element={<PublicPortalRoute />}>
        <Route path="/business/login" element={<PortalLogin portal="business" />} />
        <Route path="/business/register" element={<PortalRegister portal="business" />} />
      </Route>

      <Route element={<RequirePortalAuth portal="business" />}>
        <Route path="/business/dashboard" element={<DashboardRouter />} />
        <Route path="/business/permits/*" element={<PermitsPage />} />
        <Route path="/business/jobs/*" element={<JobsPage />} />
        <Route path="/business/documents" element={<DocumentsPage />} />
        <Route path="/business/fees/*" element={<FeesPage />} />
        <Route path="/business/payments" element={<FeesPage />} />
        <Route path="/business/appeals" element={<AppealsPage />} />
        <Route path="/business/transfers" element={<TransfersPage />} />
        <Route path="/business/disputes" element={<DisputeRespondentPage />} />
        <Route path="/business/variations" element={<VariationsPage />} />
        <Route path="/business/settings" element={<Settings />} />
        <Route path="/business/profile" element={<ProfilePage />} />
      </Route>

      {/* ============================================================ */}
      {/*  WORKER PORTAL  (/worker/*)                                   */}
      {/* ============================================================ */}
      <Route element={<PublicPortalRoute />}>
        <Route path="/worker/login" element={<PortalLogin portal="worker" />} />
        <Route path="/worker/register" element={<PortalRegister portal="worker" />} />
      </Route>

      <Route element={<RequirePortalAuth portal="worker" />}>
        <Route path="/worker/dashboard" element={<DashboardRouter />} />
        <Route path="/worker/permit" element={<IDCardPage />} />
        <Route path="/worker/id-card" element={<IDCardPage />} />
        <Route path="/worker/cards" element={<CardsPage />} />
        <Route path="/worker/disputes/*" element={<DisputesPage />} />
        <Route path="/worker/documents" element={<DocumentsPage />} />
        <Route path="/worker/jobs" element={<JobsPage />} />
        <Route path="/worker/profile" element={<ProfilePage />} />
      </Route>

      {/* ============================================================ */}
      {/*  JOB CENTRE  (/jobs/*)  - portal value is 'jobseeker'         */}
      {/* ============================================================ */}
      <Route element={<PublicPortalRoute />}>
        <Route path="/jobs/login" element={<PortalLogin portal="jobseeker" />} />
        <Route path="/jobs/register" element={<PortalRegister portal="jobseeker" />} />
      </Route>

      <Route element={<RequirePortalAuth portal="jobseeker" />}>
        <Route path="/jobs/dashboard" element={<DashboardRouter />} />
        <Route path="/jobs/search" element={<JobsPage />} />
        <Route path="/jobs/applications" element={<PlaceholderPage title="My Applications" description="Track the status of your job applications." />} />
        <Route path="/jobs/resume" element={<PlaceholderPage title="Resume Upload" description="Upload and manage your resume/CV." />} />
        <Route path="/jobs/training" element={<PlaceholderPage title="Training Programmes" description="Browse workforce readiness training programs, RATED apprenticeship programme, resume writing workshops, and career development resources offered by the Department of Labour and Workforce Development." />} />
        <Route path="/jobs/profile" element={<ProfilePage />} />
      </Route>

      {/* ============================================================ */}
      {/*  DEPARTMENT CONSOLE  (/dept/*)                                */}
      {/* ============================================================ */}
      <Route element={<PublicPortalRoute />}>
        <Route path="/dept/login" element={<PortalLogin portal="dept" />} />
        {/* No public registration for dept - staff accounts are provisioned */}
      </Route>

      <Route element={<RequirePortalAuth portal="dept" />}>
        <Route path="/dept/dashboard" element={<DashboardRouter />} />
        <Route path="/dept/profile" element={<ProfilePage />} />

        {/* Permits - requires permits permission */}
        <Route element={<RequireDeptPermission permission="permits" />}>
          <Route path="/dept/permits" element={<PermitReview />} />
          <Route path="/dept/permits/*" element={<PermitsPage />} />
        </Route>

        {/* Disputes - requires disputes permission */}
        <Route element={<RequireDeptPermission permission="disputes" />}>
          <Route path="/dept/disputes/*" element={<DisputesPage />} />
        </Route>

        {/* Job placement - requires jobs permission */}
        <Route element={<RequireDeptPermission permission="jobs" />}>
          <Route path="/dept/jobs/*" element={<JobsPage />} />
          <Route path="/dept/placements/*" element={<JobsPage />} />
        </Route>

        {/* Permit Lookup - requires lookup permission (front desk) */}
        <Route element={<RequireDeptPermission permission="lookup" />}>
          <Route path="/dept/lookup" element={<PermitsPage />} />
        </Route>

        {/* Inspections - requires inspections permission */}
        <Route element={<RequireDeptPermission permission="inspections" />}>
          <Route path="/dept/inspections" element={<InspectionManager />} />
        </Route>

        {/* Payments - requires payments permission */}
        <Route element={<RequireDeptPermission permission="payments" />}>
          <Route path="/dept/payments" element={<PaymentProcessing />} />
        </Route>

        {/* Appointments - requires appointments permission */}
        <Route element={<RequireDeptPermission permission="appointments" />}>
          <Route path="/dept/appointments" element={<AppointmentManager />} />
        </Route>

        {/* User management - requires users permission (commissioner / deputy) */}
        <Route element={<RequireDeptPermission permission="users" />}>
          <Route path="/dept/users" element={<UserManagement />} />
          <Route path="/dept/audit-log" element={<AuditLog />} />
          <Route path="/dept/appeals" element={<AppealsPage />} />
        </Route>

        {/* Permit transfers — requires permits permission */}
        <Route element={<RequireDeptPermission permission="permits" />}>
          <Route path="/dept/transfers" element={<TransfersPage />} />
          <Route path="/dept/variations" element={<VariationsPage />} />
        </Route>

        {/* ID Card management — Front Desk, Deputy, Commissioner */}
        <Route element={<RequireDeptPermission permission="cards" />}>
          <Route path="/dept/cards" element={<CardsPage />} />
        </Route>

        {/* Reports - requires reports permission */}
        <Route element={<RequireDeptPermission permission="reports" />}>
          <Route path="/dept/reports" element={<Reports />} />
        </Route>

        {/* Settings - requires settings permission (commissioner only) */}
        <Route element={<RequireDeptPermission permission="settings" />}>
          <Route path="/dept/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* ============================================================ */}
      {/*  Legacy redirects - keep old URLs working during transition    */}
      {/* ============================================================ */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/dashboard" element={<RedirectToDashboard />} />
      <Route path="/permits/*" element={<RedirectToDashboard />} />
      <Route path="/disputes/*" element={<RedirectToDashboard />} />
      <Route path="/documents" element={<RedirectToDashboard />} />
      <Route path="/fees/*" element={<RedirectToDashboard />} />
      <Route path="/id-cards" element={<RedirectToDashboard />} />
      <Route path="/training" element={<RedirectToDashboard />} />
      <Route path="/admin/*" element={<RedirectToDashboard />} />
      <Route path="/settings" element={<RedirectToDashboard />} />
      <Route path="/profile" element={<RedirectToDashboard />} />

      {/* Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

/**
 * Helper: redirect logged-in users from legacy routes to their portal dashboard,
 * or send unauthenticated visitors to the portal selector.
 */
function RedirectToDashboard() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  const portalPath = user.portal === 'jobseeker' ? '/jobs' : `/${user.portal || 'business'}`;
  return <Navigate to={`${portalPath}/dashboard`} replace />;
}

/* ------------------------------------------------------------------ */
/*  Root App component                                                 */
/* ------------------------------------------------------------------ */
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <DemoBanner />
            <Suspense fallback={<LoadingScreen />}>
              <AppRoutes />
            </Suspense>
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
