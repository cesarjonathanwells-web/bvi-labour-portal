import { createContext, useContext, useState, useEffect } from 'react';
import { getStorage, setStorage, generateId } from '../utils/helpers';

const AuthContext = createContext(null);

const USERS_KEY = 'bvi_labour_users';
const SESSION_KEY = 'bvi_labour_session';

const defaultAdmin = {
  id: 'admin-001', email: 'admin@labour.gov.vg', password: 'admin123',
  role: 'admin', firstName: 'Admin', lastName: 'User',
  organization: 'Department of Labour and Workforce Development', createdAt: new Date().toISOString(),
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const users = getStorage(USERS_KEY);
    if (!users || users.length === 0) setStorage(USERS_KEY, [defaultAdmin]);
    const session = getStorage(SESSION_KEY);
    if (session) {
      const allUsers = getStorage(USERS_KEY) || [];
      const found = allUsers.find(u => u.id === session.userId);
      if (found) setUser(found);
    }
    setLoading(false);
  }, []);

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

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, getAllUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
