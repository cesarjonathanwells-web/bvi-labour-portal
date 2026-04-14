import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell, Menu, X, ChevronDown, ChevronRight, LogOut, User, Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import SkipToContent from '../common/SkipToContent';

/**
 * PortalLayout - Shared layout for all BVI Labour Department portals.
 *
 * Props:
 * @param {string}   portalId          - Route prefix & portal guard value (e.g. 'business', 'worker', 'dept')
 * @param {string}   portalLabel       - Display name shown in header & footer (e.g. 'BVI Business Portal')
 * @param {string}   headerColor       - Header background CSS color
 * @param {string}   pageBg            - Page background CSS color (e.g. '#f0f4f8')
 * @param {boolean}  [darkHeaderText]  - If true, header icons/text use dark color instead of white
 * @param {string}   [headerTextColor] - Explicit header text color (used when darkHeaderText is true)
 * @param {object}   logo              - { bg, textColor, content } for the round logo in header
 * @param {object}   headerTitle       - { main, mainColor, sub, subColor } for the text next to logo
 * @param {object}   badge             - { icon: Component, label, bgClass } for sidebar portal badge
 * @param {object}   roleBadge         - { label, colorClass } for user menu role pill
 * @param {string}   activeNavClass    - Tailwind classes for active nav item
 * @param {string}   inactiveNavClass  - Tailwind classes for inactive nav item
 * @param {string}   unreadHighlight   - Tailwind class for unread notification row (e.g. 'bg-blue-50/50')
 * @param {Array}    navItems          - Static array of { label, to, icon, children? }
 * @param {Function} [getNavItems]     - Dynamic nav builder receiving (user) - overrides navItems
 * @param {Function} [getUserDisplay]  - (user) => string for header username display
 * @param {Function} [getInitials]     - (user) => string for avatar initials
 * @param {Function} [isActiveFn]      - Custom (path, location) => bool for active detection
 * @param {Function} [renderSidebarTop]- (user, initials) => JSX for custom sidebar top (DeptLayout staff card)
 * @param {Array}    [userMenuLinks]   - Array of { to, icon, label } for extra user menu links
 * @param {object}   [footerExtra]     - { lines: [string] } extra footer lines
 * @param {string}   userPortalValue   - Value to match against user.portal for redirect guard
 * @param {string}   [basePath]        - Base route path (defaults to '/' + portalId)
 * @param {object}   [avatarStyle]     - { bg, textColor } for user avatar circle
 */
export default function PortalLayout({
  portalId,
  portalLabel,
  headerColor,
  pageBg = '#f0f4f8',
  darkHeaderText = false,
  headerTextColor = '#003366',
  logo,
  headerTitle,
  badge,
  roleBadge,
  getRoleBadge: getRoleBadgeFn,
  activeNavClass,
  inactiveNavClass,
  unreadHighlight = 'bg-blue-50/50',
  navItems: staticNavItems = [],
  getNavItems,
  getUserDisplay,
  getInitials: getInitialsFn,
  isActiveFn,
  renderSidebarTop,
  userMenuLinks = [],
  footerExtra,
  userPortalValue,
  basePath,
  avatarStyle,
}) {
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

  const resolvedBasePath = basePath || `/${portalId}`;
  const portalGuard = userPortalValue || portalId;

  // Redirect if user doesn't belong to this portal
  useEffect(() => {
    if (user && user.portal && user.portal !== portalGuard) {
      const target = user.portal === 'jobseeker' ? '/jobs' : `/${user.portal}`;
      navigate(`${target}/dashboard`, { replace: true });
    }
  }, [user, navigate, portalGuard]);

  // Resolve nav items (static or dynamic)
  const navItems = getNavItems ? getNavItems(user) : staticNavItems;

  const notifications = user ? getNotificationsByUser(user.id) : [];
  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns on outside click
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

  const initials = getInitialsFn
    ? getInitialsFn(user)
    : user
      ? `${(user.firstName || user.contactPerson || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase()
      : '';

  // Resolve role badge (static or dynamic per-user)
  const resolvedRoleBadge = getRoleBadgeFn ? getRoleBadgeFn(user) : roleBadge;

  const isActive = isActiveFn
    ? (path) => isActiveFn(path, location)
    : (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const displayName = getUserDisplay
    ? getUserDisplay(user)
    : (user?.companyName || user?.firstName || 'User');

  // Color helpers
  const iconColorClass = darkHeaderText ? '' : 'text-white';
  const iconColorStyle = darkHeaderText ? { color: headerTextColor } : {};
  const hoverClass = darkHeaderText ? 'hover:bg-black/10' : 'hover:bg-white/10';

  return (
    <div className="min-h-screen" style={{ backgroundColor: pageBg }}>
      <SkipToContent />
      {/* Header */}
      <header role="banner" className="sticky top-0 z-50 shadow-lg" style={{ backgroundColor: headerColor }}>
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(p => !p)}
              className={`lg:hidden p-2 rounded-md ${hoverClass} transition-colors ${iconColorClass}`}
              style={iconColorStyle}
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link to={`${resolvedBasePath}/dashboard`} className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: logo.bg, color: logo.textColor }}
              >
                {logo.content}
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-bold tracking-wide" style={{ color: headerTitle.mainColor }}>
                  {headerTitle.main}
                </p>
                <p className="text-[11px]" style={{ color: headerTitle.subColor }}>
                  {headerTitle.sub}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(p => !p)}
                className={`p-2 rounded-md ${hoverClass} transition-colors relative ${iconColorClass}`}
                style={iconColorStyle}
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
                          className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? unreadHighlight : ''}`}
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
                className={`flex items-center gap-2 p-1.5 rounded-lg ${hoverClass} transition-colors ${iconColorClass}`}
                style={iconColorStyle}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: avatarStyle?.bg || (darkHeaderText ? '#003366' : 'rgba(255,255,255,0.2)'),
                    color: avatarStyle?.textColor || (darkHeaderText ? '#c5a55a' : '#ffffff'),
                  }}
                >
                  {initials || <User size={16} />}
                </div>
                <span className="hidden md:block text-sm font-medium max-w-[140px] truncate">
                  {displayName}
                </span>
                <ChevronDown size={14} className="hidden md:block" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 text-gray-800 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-sm">
                      {user?.companyName || `${user?.firstName} ${user?.lastName}`}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    {resolvedRoleBadge && (
                      <span className={`inline-block mt-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${resolvedRoleBadge.colorClass}`}>
                        {resolvedRoleBadge.label}
                      </span>
                    )}
                  </div>
                  <div className="py-1">
                    {userMenuLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {link.icon && <link.icon size={16} />}
                        {link.label}
                      </Link>
                    ))}
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
        <aside aria-label="Portal navigation" className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:top-auto lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full">
            {/* Sidebar top: custom (Dept) or default badge */}
            {renderSidebarTop ? (
              renderSidebarTop(user, initials)
            ) : (
              <div className="px-4 pt-5 pb-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${badge.bgClass}`}>
                  {badge.icon && <badge.icon size={14} />}
                  {badge.label}
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                // Expandable sub-nav (e.g. BusinessLayout work permits)
                if (item.children) {
                  const isExpanded = expandedNav === item.label || item.children.some(c => isActive(c.to));
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => setExpandedNav(isExpanded ? '' : item.label)}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          item.children.some(c => isActive(c.to))
                            ? activeNavClass.replace('flex items-center gap-3 ', '').replace('flex items-center gap-3', '') || `bg-[${headerColor}]/10 text-[${headerColor}]`
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
                                ? `block px-3 py-2 rounded-lg text-sm font-medium ${activeNavClass.includes('flex') ? activeNavClass.replace('flex items-center gap-3 ', '') : activeNavClass}`
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
                      ? `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${activeNavClass}`
                      : `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${inactiveNavClass}`
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
                <p className="font-semibold text-gray-500">{portalLabel}</p>
                {footerExtra?.lines
                  ? footerExtra.lines.map((line, i) => <p key={i}>{line}</p>)
                  : <p>Department of Labour &amp; Workforce Development</p>
                }
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main id="main-content" role="main" className="flex-1 min-h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8 w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
