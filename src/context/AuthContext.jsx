import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStorage, setStorage, generateId } from '../utils/helpers';
import { DEPT_PERMISSIONS } from '../data/constants';

const AuthContext = createContext(null);

const USERS_KEY = 'bvi_labour_users';
const SESSION_KEY = 'bvi_labour_session';

// ---------------------------------------------------------------------------
//  Default department staff accounts
// ---------------------------------------------------------------------------
const defaultDeptUsers = [
  {
    id: 'dept-commissioner-001', email: 'commissioner@labour.gov.vg', password: 'admin123',
    portal: 'dept', deptRole: 'commissioner', role: 'admin',
    firstName: 'Labour', lastName: 'Commissioner',
    organization: 'Department of Labour and Workforce Development',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dept-deputy-001', email: 'deputy@labour.gov.vg', password: 'admin123',
    portal: 'dept', deptRole: 'deputy_commissioner', role: 'admin',
    firstName: 'Deputy', lastName: 'Commissioner',
    organization: 'Department of Labour and Workforce Development',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dept-permits-001', email: 'permits@labour.gov.vg', password: 'admin123',
    portal: 'dept', deptRole: 'permit_officer', role: 'admin',
    firstName: 'Permit', lastName: 'Officer',
    organization: 'Department of Labour and Workforce Development',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dept-disputes-001', email: 'disputes@labour.gov.vg', password: 'admin123',
    portal: 'dept', deptRole: 'dispute_officer', role: 'admin',
    firstName: 'Dispute', lastName: 'Officer',
    organization: 'Department of Labour and Workforce Development',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dept-cashier-001', email: 'cashier@labour.gov.vg', password: 'admin123',
    portal: 'dept', deptRole: 'cashier', role: 'admin',
    firstName: 'Cashier', lastName: 'Staff',
    organization: 'Department of Labour and Workforce Development',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dept-frontdesk-001', email: 'frontdesk@labour.gov.vg', password: 'admin123',
    portal: 'dept', deptRole: 'front_desk', role: 'admin',
    firstName: 'Front Desk', lastName: 'Staff',
    organization: 'Department of Labour and Workforce Development',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dept-inspector-001', email: 'inspector@labour.gov.vg', password: 'admin123',
    portal: 'dept', deptRole: 'inspector', role: 'admin',
    firstName: 'Labour', lastName: 'Inspector',
    organization: 'Department of Labour and Workforce Development',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dept-placement-001', email: 'placement@labour.gov.vg', password: 'admin123',
    portal: 'dept', deptRole: 'placement_officer', role: 'admin',
    firstName: 'Placement', lastName: 'Officer',
    organization: 'Department of Labour and Workforce Development',
    createdAt: new Date().toISOString(),
  },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Seed default department accounts on first load
  useEffect(() => {
    const users = getStorage(USERS_KEY);
    if (!users || users.length === 0) {
      setStorage(USERS_KEY, defaultDeptUsers);
    } else {
      // Ensure all default dept accounts exist (idempotent merge)
      let changed = false;
      const existing = [...users];
      for (const def of defaultDeptUsers) {
        if (!existing.find(u => u.id === def.id)) {
          existing.push(def);
          changed = true;
        }
      }
      if (changed) setStorage(USERS_KEY, existing);
    }

    // Restore session
    const session = getStorage(SESSION_KEY);
    if (session) {
      const allUsers = getStorage(USERS_KEY) || [];
      const found = allUsers.find(u => u.id === session.userId);
      if (found) setUser(found);
    }
    setLoading(false);
  }, []);

  // ------------------------------------------------------------------
  //  Auth actions
  // ------------------------------------------------------------------
  const login = (email, password) => {
    const users = getStorage(USERS_KEY) || [];
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!found) return { success: false, error: 'Invalid email or password' };
    setUser(found);
    setStorage(SESSION_KEY, { userId: found.id });
    return { success: true, user: found };
  };

  const register = (userData) => {
    const users = getStorage(USERS_KEY) || [];
    if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase()))
      return { success: false, error: 'Email already registered' };
    const newUser = { ...userData, id: generateId(), createdAt: new Date().toISOString() };
    users.push(newUser);
    setStorage(USERS_KEY, users);
    setUser(newUser);
    setStorage(SESSION_KEY, { userId: newUser.id });
    return { success: true, user: newUser };
  };

  const logout = () => { setUser(null); localStorage.removeItem(SESSION_KEY); };

  const updateProfile = (updates) => {
    const users = getStorage(USERS_KEY) || [];
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) return false;
    users[idx] = { ...users[idx], ...updates };
    setStorage(USERS_KEY, users);
    setUser(users[idx]);
    return true;
  };

  const getAllUsers = () => getStorage(USERS_KEY) || [];

  // ------------------------------------------------------------------
  //  Portal / permission helpers
  // ------------------------------------------------------------------

  /** Returns which portal the current user belongs to (business | worker | jobseeker | dept) */
  const getPortal = useCallback(() => {
    if (!user) return null;
    return user.portal || null;
  }, [user]);

  /** True if the current user is department staff */
  const isDeptStaff = useCallback(() => {
    if (!user) return false;
    return user.portal === 'dept';
  }, [user]);

  /** Check whether the current dept-staff user has a specific permission */
  const hasPermission = useCallback((permission) => {
    if (!user || user.portal !== 'dept') return false;
    const perms = DEPT_PERMISSIONS[user.deptRole];
    if (!perms) return false;
    return perms.includes(permission);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, register, logout, updateProfile, getAllUsers,
      getPortal, isDeptStaff, hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
