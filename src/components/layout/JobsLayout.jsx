import {
  LayoutDashboard, Search, User,
} from 'lucide-react';
import PortalLayout from './PortalLayout';

const navItems = [
  { label: 'Dashboard', to: '/jobs/dashboard', icon: LayoutDashboard },
  { label: 'Search Jobs', to: '/jobs/search', icon: Search },
  { label: 'Profile', to: '/jobs/profile', icon: User },
];

export default function JobsLayout() {
  return (
    <PortalLayout
      portalId="jobs"
      portalLabel="BVI Job Centre"
      userPortalValue="jobseeker"
      headerColor="#c5a55a"
      pageBg="#fefcf6"
      darkHeaderText
      headerTextColor="#003366"
      logo={{ bg: '#003366', textColor: '#c5a55a', content: 'BVI' }}
      headerTitle={{
        main: 'BVI Job Centre',
        mainColor: '#003366',
        sub: 'Workforce Development & Job Placement',
        subColor: 'rgba(0,51,102,0.6)',
      }}
      badge={{ icon: Search, label: 'Job Centre', bgClass: 'bg-amber-100 text-amber-800' }}
      roleBadge={{ label: 'Job Seeker', colorClass: 'text-[#003366] bg-amber-100' }}
      activeNavClass="bg-[#c5a55a] text-[#003366]"
      inactiveNavClass="text-gray-600 hover:bg-amber-50"
      unreadHighlight="bg-amber-50/50"
      navItems={navItems}
      getUserDisplay={(u) => u?.firstName || 'User'}
      getInitials={(u) => u ? `${(u.firstName || '')[0] || ''}${(u.lastName || '')[0] || ''}`.toUpperCase() : ''}
      avatarStyle={{ bg: '#003366', textColor: '#c5a55a' }}
      userMenuLinks={[
        { to: '/jobs/profile', icon: User, label: 'Profile' },
      ]}
    />
  );
}
