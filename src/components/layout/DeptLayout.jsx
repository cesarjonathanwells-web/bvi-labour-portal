import {
  LayoutDashboard, FileText, Scale, Briefcase, ClipboardCheck,
  CreditCard, Calendar, Users, BarChart3, Settings, Shield,
  ListChecks, FileSearch, Receipt, DollarSign, Eye, BookOpen,
  Search, User,
} from 'lucide-react';
import PortalLayout from './PortalLayout';

// Navigation configs per department role
const roleNavConfigs = {
  commissioner: [
    { label: 'Dashboard', to: '/dept/dashboard', icon: LayoutDashboard },
    { label: 'Permit Review', to: '/dept/permits', icon: FileText },
    { label: 'Dispute Cases', to: '/dept/disputes', icon: Scale },
    { label: 'Job Placements', to: '/dept/placements', icon: Briefcase },
    { label: 'Inspections', to: '/dept/inspections', icon: ClipboardCheck },
    { label: 'Payments', to: '/dept/payments', icon: CreditCard },
    { label: 'Appointments', to: '/dept/appointments', icon: Calendar },
    { label: 'Users', to: '/dept/users', icon: Users },
    { label: 'Reports', to: '/dept/reports', icon: BarChart3 },
    { label: 'Settings', to: '/dept/settings', icon: Settings },
  ],
  deputy_commissioner: [
    { label: 'Dashboard', to: '/dept/dashboard', icon: LayoutDashboard },
    { label: 'Permit Review', to: '/dept/permits', icon: FileText },
    { label: 'Dispute Cases', to: '/dept/disputes', icon: Scale },
    { label: 'Job Placements', to: '/dept/placements', icon: Briefcase },
    { label: 'Inspections', to: '/dept/inspections', icon: ClipboardCheck },
    { label: 'Payments', to: '/dept/payments', icon: CreditCard },
    { label: 'Appointments', to: '/dept/appointments', icon: Calendar },
    { label: 'Users', to: '/dept/users', icon: Users },
    { label: 'Reports', to: '/dept/reports', icon: BarChart3 },
  ],
  permit_officer: [
    { label: 'Dashboard', to: '/dept/dashboard', icon: LayoutDashboard },
    { label: 'Permit Review', to: '/dept/permits', icon: FileText },
    { label: 'Permit Queue', to: '/dept/permits/queue', icon: ListChecks },
    { label: 'Payment Verification', to: '/dept/payments', icon: DollarSign },
  ],
  dispute_officer: [
    { label: 'Dashboard', to: '/dept/dashboard', icon: LayoutDashboard },
    { label: 'Dispute Cases', to: '/dept/disputes', icon: Scale },
    { label: 'Mediation', to: '/dept/disputes/mediation', icon: BookOpen },
    { label: 'Case Files', to: '/dept/disputes/files', icon: FileSearch },
  ],
  placement_officer: [
    { label: 'Dashboard', to: '/dept/dashboard', icon: LayoutDashboard },
    { label: 'Job Placements', to: '/dept/placements', icon: Briefcase },
    { label: 'Vacancy Management', to: '/dept/placements/vacancies', icon: ListChecks },
    { label: 'Applicant Matching', to: '/dept/placements/matching', icon: Search },
  ],
  inspector: [
    { label: 'Dashboard', to: '/dept/dashboard', icon: LayoutDashboard },
    { label: 'Inspections', to: '/dept/inspections', icon: ClipboardCheck },
    { label: 'Reports', to: '/dept/reports', icon: BarChart3 },
  ],
  cashier: [
    { label: 'Dashboard', to: '/dept/dashboard', icon: LayoutDashboard },
    { label: 'Payments', to: '/dept/payments', icon: CreditCard },
  ],
  front_desk: [
    { label: 'Dashboard', to: '/dept/dashboard', icon: LayoutDashboard },
    { label: 'Appointments', to: '/dept/appointments', icon: Calendar },
    { label: 'Permit Lookup', to: '/dept/lookup', icon: Search },
  ],
};

const roleLabels = {
  commissioner: { label: 'Labour Commissioner', color: 'bg-purple-100 text-purple-700' },
  deputy_commissioner: { label: 'Deputy Commissioner', color: 'bg-purple-100 text-purple-700' },
  permit_officer: { label: 'Work Permit Officer', color: 'bg-blue-100 text-blue-700' },
  dispute_officer: { label: 'Dispute Officer', color: 'bg-red-100 text-red-700' },
  placement_officer: { label: 'Job Placement Officer', color: 'bg-green-100 text-green-700' },
  inspector: { label: 'Labour Inspector', color: 'bg-amber-100 text-amber-700' },
  cashier: { label: 'Cashier', color: 'bg-cyan-100 text-cyan-700' },
  front_desk: { label: 'Front Desk', color: 'bg-slate-100 text-slate-700' },
};

function getNavItems(user) {
  const deptRole = user?.deptRole || 'front_desk';
  return roleNavConfigs[deptRole] || roleNavConfigs.front_desk;
}

function getRoleBadge(user) {
  const deptRole = user?.deptRole || 'front_desk';
  const info = roleLabels[deptRole] || roleLabels.front_desk;
  return { label: info.label, colorClass: info.color };
}

function renderSidebarTop(user, initials) {
  const deptRole = user?.deptRole || 'front_desk';
  const roleInfo = roleLabels[deptRole] || roleLabels.front_desk;

  return (
    <div className="px-4 pt-5 pb-3 border-b border-gray-100">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">
          {initials || '??'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
        </div>
      </div>
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${roleInfo.color}`}>
        <Shield size={14} />
        {roleInfo.label}
      </div>
    </div>
  );
}

export default function DeptLayout() {
  return (
    <PortalLayout
      portalId="dept"
      portalLabel="DLWD Staff Console"
      headerColor="#7c3aed"
      pageBg="#f5f3ff"
      logo={{ bg: 'rgba(255,255,255,0.2)', textColor: '#ffffff', content: <Shield size={20} /> }}
      headerTitle={{
        main: 'DLWD Staff Console',
        mainColor: '#ffffff',
        sub: 'Department of Labour & Workforce Development',
        subColor: '#e9d5ff',
      }}
      getRoleBadge={getRoleBadge}
      activeNavClass="bg-[#7c3aed] text-white"
      inactiveNavClass="text-gray-600 hover:bg-purple-50"
      unreadHighlight="bg-purple-50/50"
      getNavItems={getNavItems}
      renderSidebarTop={renderSidebarTop}
      getUserDisplay={(u) => u?.firstName || 'Staff'}
      getInitials={(u) => u ? `${(u.firstName || '')[0] || ''}${(u.lastName || '')[0] || ''}`.toUpperCase() : ''}
      userMenuLinks={[
        { to: '/dept/profile', icon: User, label: 'Profile' },
      ]}
      footerExtra={{ lines: ['Authorized Personnel Only', 'v1.0 Internal Use'] }}
    />
  );
}
