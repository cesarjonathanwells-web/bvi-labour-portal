import { useAuth } from '../../context/AuthContext';
import EmployerDashboard from './EmployerDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import JobSeekerDashboard from './JobSeekerDashboard';
import DeptDashboard from './DeptDashboard';

// Portal-based dashboard routing
const portalDashboards = {
  business: EmployerDashboard,
  worker: EmployeeDashboard,
  jobseeker: JobSeekerDashboard,
  dept: DeptDashboard,
};

// Legacy role-based fallback for backward compatibility
const roleFallbacks = {
  admin: DeptDashboard,
  employer: EmployerDashboard,
  employee: EmployeeDashboard,
  jobseeker: JobSeekerDashboard,
};

export default function DashboardRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  // Determine which dashboard to show:
  // 1. Check user.portal first (new portal system)
  // 2. Fall back to user.role (legacy system)
  const Dashboard =
    portalDashboards[user.portal] ||
    roleFallbacks[user.role] ||
    EmployeeDashboard;

  return <Dashboard />;
}
