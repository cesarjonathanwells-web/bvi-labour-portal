import { useState, useMemo, useCallback } from 'react';
import {
  Users, Search, Filter, X, Eye, Shield, UserCheck, UserX, ChevronDown,
  Building, Briefcase, GraduationCap, ShieldCheck, UserPlus, Plus,
  ShieldAlert, BarChart3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES, DEPT_ROLES, USER_ROLES } from '../../data/constants';
import { formatDateShort, generateId } from '../../utils/helpers';
import { getStorage, setStorage } from '../../utils/helpers';

const USERS_KEY = 'bvi_labour_users';

const ALLOWED_ROLES = ['commissioner', 'deputy_commissioner'];

const ROLE_META = {
  [ROLES.ADMIN]: { label: 'Administrator', icon: ShieldCheck, color: 'bg-purple-100 text-purple-700', ring: 'ring-purple-200' },
  [ROLES.EMPLOYER]: { label: 'Employer', icon: Building, color: 'bg-blue-100 text-blue-700', ring: 'ring-blue-200' },
  [ROLES.EMPLOYEE]: { label: 'Employee', icon: Briefcase, color: 'bg-green-100 text-green-700', ring: 'ring-green-200' },
  [ROLES.JOBSEEKER]: { label: 'Job Seeker', icon: GraduationCap, color: 'bg-orange-100 text-orange-700', ring: 'ring-orange-200' },
};

const DEPT_ROLE_OPTIONS = Object.values(DEPT_ROLES).map(r => ({ id: r.id, label: r.label }));

const TABS = [
  { id: 'dept', label: 'Department Staff', icon: Shield },
  { id: 'business', label: 'Business Accounts', icon: Building },
  { id: 'worker', label: 'Worker Accounts', icon: Briefcase },
  { id: 'jobseeker', label: 'Job Seekers', icon: GraduationCap },
];

/* ------------------------------------------------------------------ */
/*  Access Denied                                                      */
/* ------------------------------------------------------------------ */
function AccessDenied() {
  return (
    <div className="max-w-lg mx-auto mt-20 text-center">
      <div className="w-20 h-20 mx-auto mb-6 bg-purple-50 rounded-full flex items-center justify-center">
        <ShieldAlert className="w-10 h-10 text-[#7c3aed]" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-500">Insufficient Permissions</p>
      <p className="text-sm text-gray-400 mt-2">
        User Management is restricted to the Commissioner and Deputy Commissioner.
      </p>
    </div>
  );
}

export default function UserManagement() {
  const { getAllUsers, user: currentUser, hasPermission } = useAuth();

  /* ---------- Permission gate ---------- */
  if (!currentUser || !hasPermission('users') || !ALLOWED_ROLES.includes(currentUser.deptRole)) {
    return <AccessDenied />;
  }

  const [allUsers, setAllUsers] = useState(() => getAllUsers());
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('dept');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // New staff form
  const [newStaff, setNewStaff] = useState({ firstName: '', lastName: '', email: '', deptRole: 'permit_officer', tempPassword: '' });

  const refreshUsers = useCallback(() => setAllUsers(getStorage(USERS_KEY) || []), []);

  /* ---- categorize users ---- */
  const categorized = useMemo(() => {
    const dept = allUsers.filter(u => u.portal === 'dept');
    const business = allUsers.filter(u => u.portal === 'business' || u.role === 'employer');
    const worker = allUsers.filter(u => u.portal === 'worker' || u.role === 'employee');
    const jobseeker = allUsers.filter(u => u.portal === 'jobseeker' || u.role === 'jobseeker');
    return { dept, business, worker, jobseeker };
  }, [allUsers]);

  /* registration stats */
  const regStats = useMemo(() => {
    const now = new Date();
    const thisMonth = allUsers.filter(u => {
      const d = new Date(u.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const lastMonth = (() => {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return allUsers.filter(u => {
        const d = new Date(u.createdAt);
        return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
      }).length;
    })();
    return { total: allUsers.length, thisMonth, lastMonth };
  }, [allUsers]);

  /* current tab users with filtering */
  const filteredUsers = useMemo(() => {
    let list = categorized[activeTab] || [];
    if (statusFilter === 'active') list = list.filter(u => u.status !== 'inactive');
    if (statusFilter === 'inactive') list = list.filter(u => u.status === 'inactive');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.organization || '').toLowerCase().includes(q) ||
        (u.deptRole || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [categorized, activeTab, search, statusFilter]);

  /* ---- persist helpers ---- */
  const persistChange = (updater) => {
    const users = getStorage(USERS_KEY) || [];
    const next = updater(users);
    setStorage(USERS_KEY, next);
    setAllUsers(next);
  };

  const changeDeptRole = (userId, newDeptRole) => {
    persistChange(users => users.map(u => u.id === userId ? { ...u, deptRole: newDeptRole } : u));
    if (selectedUser?.id === userId) setSelectedUser(prev => ({ ...prev, deptRole: newDeptRole }));
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

  /* ---- add new dept staff ---- */
  const handleAddStaff = () => {
    const { firstName, lastName, email, deptRole, tempPassword } = newStaff;
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !tempPassword.trim()) return;

    const users = getStorage(USERS_KEY) || [];
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      alert('A user with this email already exists.');
      return;
    }

    const staff = {
      id: generateId(),
      email: email.trim(),
      password: tempPassword.trim(),
      portal: 'dept',
      deptRole,
      role: 'admin',
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      organization: 'Department of Labour and Workforce Development',
      createdAt: new Date().toISOString(),
    };
    users.push(staff);
    setStorage(USERS_KEY, users);
    setAllUsers(users);
    setNewStaff({ firstName: '', lastName: '', email: '', deptRole: 'permit_officer', tempPassword: '' });
    setShowAddStaff(false);
  };

  /* stat cards */
  const statCards = [
    { label: 'Total Users', value: regStats.total, icon: Users, color: 'text-[#7c3aed]', bg: 'bg-purple-50' },
    { label: 'Dept Staff', value: categorized.dept.length, icon: Shield, color: 'text-[#7c3aed]', bg: 'bg-purple-50' },
    { label: 'Registered This Month', value: regStats.thisMonth, icon: BarChart3, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Registered Last Month', value: regStats.lastMonth, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  const getDeptRoleLabel = (roleId) => {
    const r = Object.values(DEPT_ROLES).find(x => x.id === roleId);
    return r ? r.label : roleId || '-';
  };

  const isPublicTab = activeTab !== 'dept';

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#7c3aed]">User Management</h1>
        <p className="text-gray-500 mb-6">Manage department staff, business accounts, workers, and job seekers.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className={`${s.bg} p-2.5 rounded-lg`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                isActive ? 'text-[#7c3aed]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <TabIcon size={16} />
              {tab.label}
              <span className="text-xs opacity-60 ml-1">({categorized[tab.id]?.length || 0})</span>
              {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7c3aed] rounded-t" />}
            </button>
          );
        })}
      </div>

      {/* Search & Filter bar + Add Staff button */}
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field text-sm py-2 w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {activeTab === 'dept' && (
            <button
              onClick={() => setShowAddStaff(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] transition-colors"
            >
              <Plus size={16} /> Add Staff Member
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {activeTab === 'dept' ? 'Dept Role' : 'Account Type'}
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Organization</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Registered</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>No users match your criteria</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const isInactive = u.status === 'inactive';
                  const isSelf = u.id === currentUser?.id;
                  const initials = `${(u.firstName || '')[0] || ''}${(u.lastName || '')[0] || ''}`.toUpperCase();

                  return (
                    <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${isInactive ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#7c3aed] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {u.firstName} {u.lastName}
                              {isSelf && <span className="text-[10px] text-[#7c3aed] ml-1">(You)</span>}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {activeTab === 'dept' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            <Shield size={12} /> {getDeptRoleLabel(u.deptRole)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {u.portal || u.role || '-'}
                          </span>
                        )}
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
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-purple-50 hover:text-[#7c3aed]"
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
          Showing {filteredUsers.length} of {categorized[activeTab]?.length || 0} {TABS.find(t => t.id === activeTab)?.label || 'users'}
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
              <h3 className="text-lg font-bold text-[#7c3aed]">User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            {/* Avatar & name */}
            <div className="px-6 py-5 text-center border-b border-gray-100 bg-purple-50/30">
              <div className="w-16 h-16 rounded-full bg-[#7c3aed] text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">
                {`${(selectedUser.firstName || '')[0] || ''}${(selectedUser.lastName || '')[0] || ''}`.toUpperCase()}
              </div>
              <h4 className="text-lg font-bold text-gray-900">
                {selectedUser.firstName} {selectedUser.lastName}
              </h4>
              <p className="text-sm text-gray-500">{selectedUser.email}</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                {selectedUser.portal === 'dept' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    <Shield size={12} /> {getDeptRoleLabel(selectedUser.deptRole)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {selectedUser.portal || selectedUser.role || '-'}
                  </span>
                )}
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
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Portal</p>
                  <p className="font-medium text-gray-800">{selectedUser.portal || '-'}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-gray-100 space-y-3">
              {/* Change dept role (dept staff only) */}
              {selectedUser.portal === 'dept' && (
                <div>
                  <label className="label-field text-xs">Change Department Role</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedUser.deptRole || ''}
                      onChange={(e) => changeDeptRole(selectedUser.id, e.target.value)}
                      className="input-field text-sm py-2 flex-1"
                      disabled={selectedUser.id === currentUser?.id}
                    >
                      {DEPT_ROLE_OPTIONS.map(r => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  {selectedUser.id === currentUser?.id && (
                    <p className="text-[10px] text-gray-400 mt-1">You cannot change your own role.</p>
                  )}
                </div>
              )}

              {/* For public accounts: view-only notice + suspend/activate */}
              {selectedUser.portal !== 'dept' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700 font-medium">
                    Public accounts are view-only. You can only suspend or activate them.
                  </p>
                </div>
              )}

              {/* Toggle status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Account Status</p>
                  <p className="text-xs text-gray-400">
                    {selectedUser.status === 'inactive' ? 'This account is suspended.' : 'This account is active.'}
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
                    <span className="flex items-center gap-1"><UserX size={14} /> Suspend</span>
                  )}
                </button>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button onClick={() => setSelectedUser(null)} className="btn-outline text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============= Add Staff Modal ============= */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddStaff(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#7c3aed]">Add Staff Member</h3>
              <button onClick={() => setShowAddStaff(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field text-xs">First Name *</label>
                  <input
                    type="text"
                    value={newStaff.firstName}
                    onChange={(e) => setNewStaff(s => ({ ...s, firstName: e.target.value }))}
                    className="input-field text-sm"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="label-field text-xs">Last Name *</label>
                  <input
                    type="text"
                    value={newStaff.lastName}
                    onChange={(e) => setNewStaff(s => ({ ...s, lastName: e.target.value }))}
                    className="input-field text-sm"
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div>
                <label className="label-field text-xs">Email *</label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff(s => ({ ...s, email: e.target.value }))}
                  className="input-field text-sm"
                  placeholder="staff@labour.gov.vg"
                />
              </div>
              <div>
                <label className="label-field text-xs">Department Role *</label>
                <select
                  value={newStaff.deptRole}
                  onChange={(e) => setNewStaff(s => ({ ...s, deptRole: e.target.value }))}
                  className="input-field text-sm"
                >
                  {DEPT_ROLE_OPTIONS.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field text-xs">Temporary Password *</label>
                <input
                  type="text"
                  value={newStaff.tempPassword}
                  onChange={(e) => setNewStaff(s => ({ ...s, tempPassword: e.target.value }))}
                  className="input-field text-sm"
                  placeholder="Temporary password"
                />
                <p className="text-[10px] text-gray-400 mt-1">Staff member should change this on first login.</p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowAddStaff(false)} className="btn-outline text-sm">Cancel</button>
              <button
                onClick={handleAddStaff}
                disabled={!newStaff.firstName.trim() || !newStaff.lastName.trim() || !newStaff.email.trim() || !newStaff.tempPassword.trim()}
                className="px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] disabled:opacity-40 transition-colors flex items-center gap-2"
              >
                <UserPlus size={16} /> Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
