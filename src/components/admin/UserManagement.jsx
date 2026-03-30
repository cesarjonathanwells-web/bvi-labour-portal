import { useState, useMemo, useCallback } from 'react';
import {
  Users, Search, Filter, X, Eye, Shield, UserCheck, UserX, ChevronDown,
  Building, Briefcase, GraduationCap, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../data/constants';
import { formatDateShort } from '../../utils/helpers';
import { getStorage, setStorage } from '../../utils/helpers';

const USERS_KEY = 'bvi_labour_users';

const ROLE_META = {
  [ROLES.ADMIN]: { label: 'Administrator', icon: ShieldCheck, color: 'bg-purple-100 text-purple-700', ring: 'ring-purple-200' },
  [ROLES.EMPLOYER]: { label: 'Employer', icon: Building, color: 'bg-blue-100 text-blue-700', ring: 'ring-blue-200' },
  [ROLES.EMPLOYEE]: { label: 'Employee', icon: Briefcase, color: 'bg-green-100 text-green-700', ring: 'ring-green-200' },
  [ROLES.JOBSEEKER]: { label: 'Job Seeker', icon: GraduationCap, color: 'bg-orange-100 text-orange-700', ring: 'ring-orange-200' },
};

export default function UserManagement() {
  const { getAllUsers, user: currentUser } = useAuth();

  const [allUsers, setAllUsers] = useState(() => getAllUsers());
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  /* refresh helper */
  const refreshUsers = useCallback(() => setAllUsers(getStorage(USERS_KEY) || []), []);

  /* role counts */
  const roleCounts = useMemo(() => {
    const counts = { total: allUsers.length };
    Object.values(ROLES).forEach(r => { counts[r] = allUsers.filter(u => u.role === r).length; });
    counts.active = allUsers.filter(u => u.status !== 'inactive').length;
    counts.inactive = allUsers.filter(u => u.status === 'inactive').length;
    return counts;
  }, [allUsers]);

  /* filtering */
  const filtered = useMemo(() => {
    let list = allUsers;
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    if (statusFilter === 'active') list = list.filter(u => u.status !== 'inactive');
    if (statusFilter === 'inactive') list = list.filter(u => u.status === 'inactive');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.organization || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allUsers, roleFilter, statusFilter, search]);

  /* actions */
  const persistChange = (updater) => {
    const users = getStorage(USERS_KEY) || [];
    const next = updater(users);
    setStorage(USERS_KEY, next);
    setAllUsers(next);
  };

  const changeRole = (userId, newRole) => {
    persistChange(users => users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    if (selectedUser?.id === userId) setSelectedUser(prev => ({ ...prev, role: newRole }));
  };

  const toggleStatus = (userId) => {
    persistChange(users =>
      users.map(u =>
        u.id === userId
          ? { ...u, status: u.status === 'inactive' ? 'active' : 'inactive' }
          : u,
      ),
    );
    if (selectedUser?.id === userId) {
      setSelectedUser(prev => ({ ...prev, status: prev.status === 'inactive' ? 'active' : 'inactive' }));
    }
  };

  /* stat cards */
  const statCards = [
    { label: 'Total Users', value: roleCounts.total, icon: Users, color: 'bg-[#003366]', light: 'bg-blue-50', text: 'text-[#003366]' },
    { label: 'Employers', value: roleCounts[ROLES.EMPLOYER] || 0, icon: Building, color: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Employees', value: roleCounts[ROLES.EMPLOYEE] || 0, icon: Briefcase, color: 'bg-green-600', light: 'bg-green-50', text: 'text-green-600' },
    { label: 'Job Seekers', value: roleCounts[ROLES.JOBSEEKER] || 0, icon: GraduationCap, color: 'bg-orange-600', light: 'bg-orange-50', text: 'text-orange-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">User Management</h1>
        <p className="text-gray-500 -mt-4 mb-6">Manage registered users, roles, and account status.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className={`${s.light} p-2.5 rounded-lg`}>
                <s.icon className={`w-5 h-5 ${s.text}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or organization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`btn-outline text-sm ${showFilters ? 'bg-[#003366] text-white' : ''}`}
          >
            <Filter size={16} /> Filters
            {(roleFilter !== 'all' || statusFilter !== 'all') && (
              <span className="ml-1 bg-[#c5a55a] text-white text-[10px] px-1.5 py-0.5 rounded-full">!</span>
            )}
          </button>
        </div>

        {/* Expandable filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 items-end">
            <div>
              <label className="label-field text-xs">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input-field text-sm py-2"
              >
                <option value="all">All Roles</option>
                {Object.entries(ROLE_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field text-xs">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field text-sm py-2"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button
              onClick={() => { setRoleFilter('all'); setStatusFilter('all'); setSearch(''); }}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Organization</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Registered</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>No users match your criteria</p>
                  </td>
                </tr>
              ) : (
                filtered.map(u => {
                  const meta = ROLE_META[u.role] || ROLE_META[ROLES.JOBSEEKER];
                  const isInactive = u.status === 'inactive';
                  const isSelf = u.id === currentUser?.id;
                  const initials = `${(u.firstName || '')[0] || ''}${(u.lastName || '')[0] || ''}`.toUpperCase();

                  return (
                    <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${isInactive ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#003366] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {u.firstName} {u.lastName}
                              {isSelf && <span className="text-[10px] text-[#c5a55a] ml-1">(You)</span>}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
                          <meta.icon size={12} /> {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 hidden md:table-cell">
                        <span className="text-sm text-gray-600 truncate block max-w-[200px]">{u.organization || '-'}</span>
                      </td>
                      <td className="px-6 py-3 hidden lg:table-cell">
                        <span className="text-sm text-gray-500">{formatDateShort(u.createdAt)}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          isInactive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {isInactive ? 'Inactive' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-[#003366]"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
          Showing {filtered.length} of {allUsers.length} users
        </div>
      </div>

      {/* ============= User Detail Modal ============= */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#003366]">User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            {/* Avatar & name */}
            <div className="px-6 py-5 text-center border-b border-gray-100 bg-gray-50">
              <div className="w-16 h-16 rounded-full bg-[#003366] text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">
                {`${(selectedUser.firstName || '')[0] || ''}${(selectedUser.lastName || '')[0] || ''}`.toUpperCase()}
              </div>
              <h4 className="text-lg font-bold text-gray-900">
                {selectedUser.firstName} {selectedUser.lastName}
              </h4>
              <p className="text-sm text-gray-500">{selectedUser.email}</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                {(() => {
                  const meta = ROLE_META[selectedUser.role] || ROLE_META[ROLES.JOBSEEKER];
                  return (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${meta.color}`}>
                      <meta.icon size={12} /> {meta.label}
                    </span>
                  );
                })()}
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  selectedUser.status === 'inactive' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {selectedUser.status === 'inactive' ? 'Inactive' : 'Active'}
                </span>
              </div>
            </div>

            {/* Details grid */}
            <div className="px-6 py-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Organization</p>
                  <p className="font-medium text-gray-800">{selectedUser.organization || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Phone</p>
                  <p className="font-medium text-gray-800">{selectedUser.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Registered</p>
                  <p className="font-medium text-gray-800">{formatDateShort(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">User ID</p>
                  <p className="font-medium text-gray-800 text-xs break-all">{selectedUser.id}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-gray-100 space-y-3">
              {/* Change role */}
              <div>
                <label className="label-field text-xs">Change Role</label>
                <div className="flex gap-2">
                  <select
                    value={selectedUser.role}
                    onChange={(e) => changeRole(selectedUser.id, e.target.value)}
                    className="input-field text-sm py-2 flex-1"
                    disabled={selectedUser.id === currentUser?.id}
                  >
                    {Object.entries(ROLE_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                {selectedUser.id === currentUser?.id && (
                  <p className="text-[10px] text-gray-400 mt-1">You cannot change your own role.</p>
                )}
              </div>

              {/* Toggle status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Account Status</p>
                  <p className="text-xs text-gray-400">
                    {selectedUser.status === 'inactive' ? 'This account is deactivated.' : 'This account is active.'}
                  </p>
                </div>
                <button
                  onClick={() => toggleStatus(selectedUser.id)}
                  disabled={selectedUser.id === currentUser?.id}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedUser.status === 'inactive'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {selectedUser.status === 'inactive' ? (
                    <span className="flex items-center gap-1"><UserCheck size={14} /> Activate</span>
                  ) : (
                    <span className="flex items-center gap-1"><UserX size={14} /> Deactivate</span>
                  )}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button onClick={() => setSelectedUser(null)} className="btn-outline text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
