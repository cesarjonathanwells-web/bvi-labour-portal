import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Briefcase, Users, Settings, Shield,
  Building, Search, Upload, Calculator, AlertTriangle,
  FolderOpen, ClipboardList, GraduationCap, FilePlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../data/constants';

const navConfig = {
  [ROLES.ADMIN]: [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Work Permits', to: '/permits', icon: FileText },
    { label: 'Disputes', to: '/disputes', icon: AlertTriangle },
    { label: 'Jobs', to: '/jobs', icon: Briefcase },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Reports', to: '/admin/reports', icon: ClipboardList },
    { label: 'Settings', to: '/settings', icon: Settings },
  ],
  [ROLES.EMPLOYER]: [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'My Permits', to: '/permits', icon: FileText },
    { label: 'Post Job', to: '/jobs/new', icon: FilePlus },
    { label: 'My Jobs', to: '/jobs', icon: Briefcase },
    { label: 'Documents', to: '/documents', icon: FolderOpen },
    { label: 'Fee Calculator', to: '/fees/calculator', icon: Calculator },
  ],
  [ROLES.EMPLOYEE]: [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'My Permit Status', to: '/permits', icon: FileText },
    { label: 'File Dispute', to: '/disputes/new', icon: AlertTriangle },
    { label: 'My Documents', to: '/documents', icon: FolderOpen },
    { label: 'Job Search', to: '/jobs', icon: Search },
  ],
  [ROLES.JOBSEEKER]: [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Job Search', to: '/jobs', icon: Search },
    { label: 'My Applications', to: '/jobs/applications', icon: ClipboardList },
    { label: 'Upload Resume', to: '/documents', icon: Upload },
    { label: 'Training', to: '/training', icon: GraduationCap },
  ],
};

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const location = useLocation();

  const role = user?.role || ROLES.JOBSEEKER;
  const links = navConfig[role] || navConfig[ROLES.JOBSEEKER];

  const roleLabels = {
    [ROLES.ADMIN]: { label: 'Administrator', icon: Shield, color: 'bg-purple-100 text-purple-700' },
    [ROLES.EMPLOYER]: { label: 'Employer', icon: Building, color: 'bg-blue-100 text-blue-700' },
    [ROLES.EMPLOYEE]: { label: 'Employee', icon: Users, color: 'bg-green-100 text-green-700' },
    [ROLES.JOBSEEKER]: { label: 'Job Seeker', icon: Search, color: 'bg-orange-100 text-orange-700' },
  };

  const roleInfo = roleLabels[role] || roleLabels[ROLES.JOBSEEKER];
  const RoleIcon = roleInfo.icon;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:top-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Role badge */}
          <div className="px-4 pt-5 pb-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${roleInfo.color}`}>
              <RoleIcon size={14} />
              {roleInfo.label}
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {links.map(({ label, to, icon: Icon }) => {
              // Active if exact match, or starts with path for sub-routes (except dashboard)
              const isActive = to === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname === to || location.pathname.startsWith(to + '/');

              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <div className="text-[10px] text-gray-400 leading-relaxed">
              <p className="font-semibold text-gray-500">BVI Department of Labour</p>
              <p>&amp; Workforce Development</p>
              <p className="mt-1">Ashley Ritter Building, Road Town</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
