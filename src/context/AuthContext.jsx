import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStorage, setStorage, generateId } from '../utils/helpers';
import { DEPT_PERMISSIONS } from '../data/constants';

const AuthContext = createContext(null);

const USERS_KEY = 'bvi_labour_users';
const SESSION_KEY = 'bvi_labour_session';
const SEED_VERSION_KEY = 'bvi_labour_seed_version';
// Bump this whenever the default seed users change so returning browsers pick up the update
const SEED_VERSION = 2;

// ---------------------------------------------------------------------------
//  Default department staff accounts
// ---------------------------------------------------------------------------
const defaultDeptUsers = [
  {
    id: 'dept-commissioner-001', email: 'commissioner@labour.gov.vg', password: 'admin123',
    portal: 'dept', deptRole: 'commissioner', role: 'admin',
    firstName: 'Mervin', lastName: 'Hastings',
    organization: 'Department of Labour and Workforce Development',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dept-deputy-001', email: 'deputy@labour.gov.vg', password: 'admin123',
    portal: 'dept', deptRole: 'deputy_commissioner', role: 'admin',
    firstName: 'Janelle', lastName: 'Penn',
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

// ---------------------------------------------------------------------------
//  Default demo accounts for public portals
// ---------------------------------------------------------------------------
const defaultPublicUsers = [
  // Business Portal
  {
    id: 'biz-001', email: 'john@tropicresorts.vg', password: 'test123',
    portal: 'business', role: 'employer',
    firstName: 'John', lastName: 'Richards',
    companyName: 'Tropic Resorts Ltd', organization: 'Tropic Resorts Ltd',
    tradeLicense: 'TL-2024-0451', industry: 'Hospitality & Tourism',
    island: 'Tortola', phone: '284-555-0101',
    createdAt: '2024-06-15T10:00:00Z',
  },
  {
    id: 'biz-002', email: 'maria@bvibuilders.vg', password: 'test123',
    portal: 'business', role: 'employer',
    firstName: 'Maria', lastName: 'Santiago',
    companyName: 'BVI Builders Corp', organization: 'BVI Builders Corp',
    tradeLicense: 'TL-2024-0287', industry: 'Construction & Engineering',
    island: 'Tortola', phone: '284-555-0102',
    createdAt: '2024-08-20T10:00:00Z',
  },
  {
    id: 'biz-003', email: 'peter@islandtech.vg', password: 'test123',
    portal: 'business', role: 'employer',
    firstName: 'Peter', lastName: 'Thompson',
    companyName: 'Island Tech Solutions', organization: 'Island Tech Solutions',
    tradeLicense: 'TL-2025-0033', industry: 'Information Technology',
    island: 'Virgin Gorda', phone: '284-555-0103',
    createdAt: '2025-01-10T10:00:00Z',
  },
  // Worker Portal
  {
    id: 'wrk-001', email: 'carlos.garcia@email.com', password: 'test123',
    portal: 'worker', role: 'employee',
    firstName: 'Carlos', lastName: 'Garcia',
    nationality: 'Dominican Republic', currentEmployer: 'Tropic Resorts Ltd',
    permitNumber: 'WP-2024-1001', phone: '284-555-0201',
    createdAt: '2024-07-01T10:00:00Z',
  },
  {
    id: 'wrk-002', email: 'anika.james@email.com', password: 'test123',
    portal: 'worker', role: 'employee',
    firstName: 'Anika', lastName: 'James',
    nationality: 'Jamaica', currentEmployer: 'BVI Builders Corp',
    permitNumber: 'WP-2024-1002', phone: '284-555-0202',
    createdAt: '2024-09-15T10:00:00Z',
  },
  {
    id: 'wrk-003', email: 'raj.patel@email.com', password: 'test123',
    portal: 'worker', role: 'employee',
    firstName: 'Raj', lastName: 'Patel',
    nationality: 'India', currentEmployer: 'Island Tech Solutions',
    permitNumber: 'WP-2025-1003', phone: '284-555-0203',
    createdAt: '2025-02-01T10:00:00Z',
  },
  // Job Centre
  {
    id: 'js-001', email: 'tamara.penn@email.vg', password: 'test123',
    portal: 'jobseeker', role: 'jobseeker',
    firstName: 'Tamara', lastName: 'Penn',
    belongerStatus: 'Virgin Islander', skills: 'Customer service, Microsoft Office, Event planning',
    educationLevel: 'Associate Degree', phone: '284-555-0301',
    createdAt: '2025-01-20T10:00:00Z',
  },
  {
    id: 'js-002', email: 'david.frett@email.vg', password: 'test123',
    portal: 'jobseeker', role: 'jobseeker',
    firstName: 'David', lastName: 'Frett',
    belongerStatus: 'Belonger', skills: 'Carpentry, Electrical, Plumbing',
    educationLevel: 'High School Diploma', phone: '284-555-0302',
    createdAt: '2025-02-05T10:00:00Z',
  },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Seed all default accounts on first load
  useEffect(() => {
    const allDefaults = [...defaultDeptUsers, ...defaultPublicUsers];
    const users = getStorage(USERS_KEY);
    const storedVersion = Number(localStorage.getItem(SEED_VERSION_KEY) || 0);
    const seedOutdated = storedVersion < SEED_VERSION;

    if (!users || users.length === 0) {
      setStorage(USERS_KEY, allDefaults);
    } else {
      // Ensure all default accounts exist. When the seed version bumps, also refresh
      // any stale default records (preserving non-default user-created accounts).
      let changed = false;
      const defaultIds = new Set(allDefaults.map(d => d.id));
      const existing = users.map(u => {
        if (seedOutdated && defaultIds.has(u.id)) {
          const fresh = allDefaults.find(d => d.id === u.id);
          if (fresh) { changed = true; return { ...u, ...fresh }; }
        }
        return u;
      });
      for (const def of allDefaults) {
        if (!existing.find(u => u.id === def.id)) {
          existing.push(def);
          changed = true;
        }
      }
      if (changed) setStorage(USERS_KEY, existing);
    }
    if (seedOutdated) localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION));

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
