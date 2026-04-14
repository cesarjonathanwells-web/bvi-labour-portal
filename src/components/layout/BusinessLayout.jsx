import {
  LayoutDashboard, FileText, Briefcase, FolderOpen, Calculator, CreditCard, User, Settings, Scale,
} from 'lucide-react';
import PortalLayout from './PortalLayout';

const navItems = [
  { label: 'Dashboard', to: '/business/dashboard', icon: LayoutDashboard },
  {
    label: 'Work Permits',
    icon: FileText,
    children: [
      { label: 'New Application', to: '/business/permits/apply/new' },
      { label: 'Renewals', to: '/business/permits/apply/renewal' },
      { label: 'Status', to: '/business/permits/status' },
    ],
  },
  { label: 'Job Postings', to: '/business/jobs', icon: Briefcase },
  { label: 'Documents', to: '/business/documents', icon: FolderOpen },
  { label: 'Fee Calculator', to: '/business/fees', icon: Calculator },
  { label: 'Payments', to: '/business/payments', icon: CreditCard },
  { label: 'Appeals', to: '/business/appeals', icon: Scale },
  { label: 'Profile', to: '/business/profile', icon: User },
];

export default function BusinessLayout() {
  return (
    <PortalLayout
      portalId="business"
      portalLabel="BVI Business Portal"
      headerColor="#003366"
      pageBg="#f0f4f8"
      logo={{ bg: '#c5a55a', textColor: '#003366', content: 'BVI' }}
      headerTitle={{
        main: 'BVI Business Portal',
        mainColor: '#c5a55a',
        sub: 'Work Permits & Employment Services',
        subColor: '#d1d5db',
      }}
      badge={{ icon: LayoutDashboard, label: 'Business Portal', bgClass: 'bg-blue-100 text-[#003366]' }}
      roleBadge={{ label: 'Business', colorClass: 'text-white bg-[#003366]' }}
      activeNavClass="bg-[#003366] text-white"
      inactiveNavClass="text-gray-600 hover:bg-gray-100"
      unreadHighlight="bg-blue-50/50"
      navItems={navItems}
      getUserDisplay={(u) => u?.companyName || u?.firstName || 'User'}
      avatarStyle={{ bg: '#c5a55a', textColor: '#003366' }}
      userMenuLinks={[
        { to: '/business/profile', icon: User, label: 'Profile' },
        { to: '/business/settings', icon: Settings, label: 'Settings' },
      ]}
    />
  );
}
