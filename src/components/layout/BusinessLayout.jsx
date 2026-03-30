import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Briefcase, FolderOpen, Calculator, CreditCard,
  User, Bell, Menu, X, ChevronDown, LogOut, Settings, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const navItems = [
  { label: 'Dashboard', to: '/business/dashboard', icon: LayoutDashboard },
  {
    label: 'Work Permits',
    icon: FileText,
    children: [
      { label: 'New Application', to: '/business/permits/new' },
      { label: 'Renewals', to: '/business/permits/renewals' },
      { label: 'Status', to: '/business/permits/status' },
    ],
  },
  { label: 'Job Postings', to: '/business/jobs', icon: Briefcase },
  { label: 'Documents', to: '/business/documents', icon: FolderOpen },
  { label: 'Fee Calculator', to: '/business/fees', icon: Calculator },
  { label: 'Payments', to: '/business/payments', icon: CreditCard },
  { label: 'Profile', to: '/business/profile', icon: User },
];

const BRAND_COLOR = '#003366';
const BRAND_HOVER = '#002244';

export default function BusinessLayout() {
  const { user, logout } = useAuth();
  const { getNotificationsByUser, markNotificationRead } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState('');
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  // Redirect if user doesn't belong to this portal
  useEffect(() => {
    if (user && user.portal && user.portal !== 'business') {
      navigate(`/${user.portal}/dashboard`, { replace: true });
    }
  }, [user, navigate]);

  const notifications = user ? getNotificationsByUser(user.id) : [];
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user
    ? `${(user.firstName || user.contactPerson || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase()
    : '';

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* Header */}
      <header className="sticky top-0 z-50 shadow-lg" style={{ backgroundColor: BRAND_COLOR }}>
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(p => !p)}
              className="lg:hidden p-2 rounded-md hover:bg-white/10 transition-colors text-white"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link to="/business/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#c5a55a] flex items-center justify-center font-bold text-[#003366] text-sm flex-shrink-0">
                BVI
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-bold tracking-wide text-[#c5a55a]">BVI Business Portal</p>
                <p className="text-[11px] text-gray-300">Work Permits &amp; Employment Services</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(p => !p)}
                className="p-2 rounded-md hover:bg-white/10 transition-colors relative text-white"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 text-gray-800 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-sm text-gray-700">Notifications</h3>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-sm text-gray-400">No notifications</p>
                    ) : (
                      notifications.slice(0, 10).map(n => (
                        <button
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                        >
                          <p className={`text-sm ${!n.read ? 'font-medium' : 'text-gray-600'}`}>{n.message}</p>
                          <p className="text-[11px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(p => !p)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white"
              >
                <div className="w-8 h-8 rounded-full bg-[#c5a55a] flex items-center justify-center text-[#003366] text-xs font-bold">
                  {initials || <User size={16} />}
                </div>
                <span className="hidden md:block text-sm font-medium max-w-[140px] truncate">
                  {user?.companyName || user?.firstName || 'User'}
                </span>
                <ChevronDown size={14} className="hidden md:block" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 text-gray-800 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-sm">{user?.companyName || `${user?.firstName} ${user?.lastName}`}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-bold text-white bg-[#003366] px-2 py-0.5 rounded-full">
                      Business
                    </span>
                  </div>
                  <div className="py-1">
                    <Link to="/business/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <User size={16} /> Profile
                    </Link>
                    <Link to="/business/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Settings size={16} /> Settings
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:top-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full">
            {/* Portal badge */}
            <div className="px-4 pt-5 pb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-[#003366]">
                <LayoutDashboard size={14} />
                Business Portal
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                if (item.children) {
                  const isExpanded = expandedNav === item.label || item.children.some(c => isActive(c.to));
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => setExpandedNav(isExpanded ? '' : item.label)}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          item.children.some(c => isActive(c.to))
                            ? 'bg-[#003366]/10 text-[#003366]'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={18} />
                          {item.label}
                        </div>
                        <ChevronRight size={16} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                      {isExpanded && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <NavLink
                              key={child.to}
                              to={child.to}
                              onClick={() => setSidebarOpen(false)}
                              className={isActive(child.to)
                                ? 'block px-3 py-2 rounded-lg text-sm font-medium bg-[#003366] text-white'
                                : 'block px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                              }
                            >
                              {child.label}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={isActive(item.to)
                      ? 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-[#003366] text-white'
                      : 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100'
                    }
                  >
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100">
              <div className="text-[10px] text-gray-400 leading-relaxed">
                <p className="font-semibold text-gray-500">BVI Business Portal</p>
                <p>Department of Labour &amp; Workforce Development</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8 w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
