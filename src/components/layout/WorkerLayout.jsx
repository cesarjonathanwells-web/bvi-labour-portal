import {
  LayoutDashboard, FileCheck, CreditCard, AlertTriangle, Scale,
  FolderOpen, Search, User,
} from 'lucide-react';
import PortalLayout from './PortalLayout';

const navItems = [
  { label: 'Dashboard', to: '/worker/dashboard', icon: LayoutDashboard },
  { label: 'My Permit', to: '/worker/permit', icon: FileCheck },
  { label: 'ID Card', to: '/worker/id-card', icon: CreditCard },
  { label: 'Physical Card', to: '/worker/cards', icon: CreditCard },
  { label: 'File Dispute', to: '/worker/disputes/new', icon: AlertTriangle },
  { label: 'My Disputes', to: '/worker/disputes', icon: Scale },
  { label: 'Documents', to: '/worker/documents', icon: FolderOpen },
  { label: 'Browse Jobs', to: '/worker/jobs', icon: Search },
  { label: 'Profile', to: '/worker/profile', icon: User },
];

// Custom active detection: /worker/disputes should NOT match when on /worker/disputes/new
const isActiveFn = (path, location) => {
  if (path === '/worker/disputes' && location.pathname === '/worker/disputes/new') return false;
  return location.pathname === path || location.pathname.startsWith(path + '/');
};

export default function WorkerLayout() {
  return (
    <PortalLayout
      portalId="worker"
      portalLabel="BVI Worker Portal"
      headerColor="#006633"
      pageBg="#f0f8f4"
      logo={{ bg: 'rgba(255,255,255,0.2)', textColor: '#ffffff', content: 'BVI' }}
      headerTitle={{
        main: 'BVI Worker Portal',
        mainColor: '#ffffff',
        sub: 'Work Permit & Employment Services',
        subColor: '#86efac',
      }}
      badge={{ icon: FileCheck, label: 'Worker Portal', bgClass: 'bg-green-100 text-[#006633]' }}
      roleBadge={{ label: 'Worker', colorClass: 'text-white bg-[#006633]' }}
      activeNavClass="bg-[#006633] text-white"
      inactiveNavClass="text-gray-600 hover:bg-gray-100"
      unreadHighlight="bg-green-50/50"
      navItems={navItems}
      isActiveFn={isActiveFn}
      getUserDisplay={(u) => u?.firstName || 'User'}
      getInitials={(u) => u ? `${(u.firstName || '')[0] || ''}${(u.lastName || '')[0] || ''}`.toUpperCase() : ''}
      userMenuLinks={[
        { to: '/worker/profile', icon: User, label: 'Profile' },
      ]}
    />
  );
}
