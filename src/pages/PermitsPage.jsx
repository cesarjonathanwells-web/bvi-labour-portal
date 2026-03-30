import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  List,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PermitTypeSelector from '../components/work-permits/PermitTypeSelector';
import NewPermitForm from '../components/work-permits/NewPermitForm';
import RenewalForm from '../components/work-permits/RenewalForm';
import TemporaryPermitForm from '../components/work-permits/TemporaryPermitForm';
import PermitStatus from '../components/work-permits/PermitStatus';
import PermitList from '../components/work-permits/PermitList';

const NAV_ITEMS = [
  { to: '/permits', label: 'Apply', icon: PlusCircle, end: true },
  { to: '/permits/status', label: 'Track Status', icon: Search, end: false },
];

const ADMIN_NAV = [
  { to: '/permits/all', label: 'All Permits', icon: List, end: false },
];

export default function PermitsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div>
      {/* Sub-navigation tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <nav className="flex items-center gap-1 px-2 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-[#003366] text-[#003366]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <Icon size={16} /> {item.label}
              </NavLink>
            );
          })}
          {isAdmin &&
            ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? 'border-[#003366] text-[#003366]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`
                  }
                >
                  <Icon size={16} /> {item.label}
                </NavLink>
              );
            })}
        </nav>
      </div>

      {/* Routed content */}
      <Routes>
        <Route index element={<PermitTypeSelector />} />
        <Route path="apply/new" element={<NewPermitForm />} />
        <Route path="apply/renewal" element={<RenewalForm />} />
        <Route path="apply/temporary" element={<TemporaryPermitForm />} />
        <Route path="status" element={<PermitStatus />} />
        <Route path="all" element={isAdmin ? <PermitList /> : <Navigate to="/permits" replace />} />
        <Route path="*" element={<Navigate to="/permits" replace />} />
      </Routes>
    </div>
  );
}
