export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const generatePermitNumber = (type) => {
  const prefix = { new: 'WP', renewal: 'WR', temporary: 'WT', periodic: 'WPR', 'self-employed': 'WSE', emergency: 'WE' };
  return `${prefix[type] || 'WP'}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const formatDateShort = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const getStatusColor = (status) => {
  const colors = {
    draft: 'bg-gray-100 text-gray-800', submitted: 'bg-blue-100 text-blue-800',
    under_review: 'bg-purple-100 text-purple-800', pending_payment: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800',
    expired: 'bg-orange-100 text-orange-800', cancelled: 'bg-gray-100 text-gray-600',
    filed: 'bg-blue-100 text-blue-800', investigating: 'bg-purple-100 text-purple-800',
    mediation: 'bg-yellow-100 text-yellow-800', resolved: 'bg-green-100 text-green-800',
    referred: 'bg-orange-100 text-orange-800', closed: 'bg-gray-100 text-gray-600',
    active: 'bg-green-100 text-green-800', filled: 'bg-blue-100 text-blue-800',
    open: 'bg-green-100 text-green-800',
    shortlisted: 'bg-indigo-100 text-indigo-800', interview: 'bg-teal-100 text-teal-800',
    offered: 'bg-emerald-100 text-emerald-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getStatusLabel = (status) => status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '';

export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validatePhone = (phone) => /^[\d\s\-+()]{7,}$/.test(phone);

export const getStorage = (key) => { try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; } };
export const setStorage = (key, val) => localStorage.setItem(key, JSON.stringify(val));

export const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
});

export const daysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return null;
  const parsed = new Date(expiryDate);
  if (isNaN(parsed.getTime())) return null;
  const diff = parsed - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Return the URL prefix for a given portal value.
 * Maps: business -> /business, worker -> /worker, jobseeker -> /jobs, dept -> /dept
 */
export const getPortalBasePath = (portal) => {
  if (portal === 'jobseeker') return '/jobs';
  if (portal === 'business' || portal === 'worker' || portal === 'dept') return `/${portal}`;
  return '/business'; // safe fallback
};
