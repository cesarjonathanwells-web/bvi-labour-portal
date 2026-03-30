import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import EmployerDashboard from './EmployerDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import JobSeekerDashboard from './JobSeekerDashboard';

const dashboards = {
  admin: AdminDashboard,
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

  const Dashboard = dashboards[user.role] || EmployeeDashboard;

  return <Dashboard />;
}
