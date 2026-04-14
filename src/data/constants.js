// Legacy ROLES kept for backward compatibility with existing components
export const ROLES = { ADMIN: 'admin', EMPLOYER: 'employer', EMPLOYEE: 'employee', JOBSEEKER: 'jobseeker' };

// ---------------------------------------------------------------------------
//  New portal-based role system
// ---------------------------------------------------------------------------

// Public user roles
export const USER_ROLES = {
  BUSINESS: 'business',      // Employers/Companies
  WORKER: 'worker',          // Employees with work permits
  JOBSEEKER: 'jobseeker',    // Virgin Islanders/Belongers seeking work
};

// Department staff roles with permission levels
export const DEPT_ROLES = {
  COMMISSIONER: { id: 'commissioner', label: 'Labour Commissioner', level: 100, color: '#7c3aed' },
  DEPUTY_COMMISSIONER: { id: 'deputy_commissioner', label: 'Deputy Commissioner', level: 90, color: '#6d28d9' },
  PERMIT_OFFICER: { id: 'permit_officer', label: 'Work Permit Officer', level: 50, color: '#2563eb' },
  DISPUTE_OFFICER: { id: 'dispute_officer', label: 'Dispute Officer', level: 50, color: '#dc2626' },
  PLACEMENT_OFFICER: { id: 'placement_officer', label: 'Job Placement Officer', level: 50, color: '#059669' },
  INSPECTOR: { id: 'inspector', label: 'Labour Inspector', level: 40, color: '#d97706' },
  CASHIER: { id: 'cashier', label: 'Cashier', level: 30, color: '#0891b2' },
  FRONT_DESK: { id: 'front_desk', label: 'Front Desk', level: 20, color: '#64748b' },
};

// Permission matrix - what each dept role can access
export const DEPT_PERMISSIONS = {
  commissioner: ['permits', 'disputes', 'jobs', 'inspections', 'payments', 'users', 'reports', 'settings', 'approvals', 'appointments', 'cards'],
  deputy_commissioner: ['permits', 'disputes', 'jobs', 'inspections', 'payments', 'users', 'reports', 'approvals', 'appointments', 'cards'],
  permit_officer: ['permits', 'payments'],
  dispute_officer: ['disputes'],
  placement_officer: ['jobs'],
  inspector: ['inspections', 'reports'],
  cashier: ['payments'],
  front_desk: ['appointments', 'lookup', 'cards'],
};

// Portal definitions
export const PORTALS = {
  BUSINESS: { id: 'business', label: 'Business Portal', path: '/business', color: '#003366', icon: 'Building2', description: 'For employers and companies - manage work permits, post jobs, handle renewals' },
  WORKER: { id: 'worker', label: 'Worker Portal', path: '/worker', color: '#006633', icon: 'UserCheck', description: 'For work permit holders - track permits, view ID cards, file disputes' },
  JOBS: { id: 'jobseeker', label: 'Job Centre', path: '/jobs', color: '#c5a55a', icon: 'Briefcase', description: 'For Virgin Islanders and Belongers - search jobs, apply, access training' },
  DEPT: { id: 'dept', label: 'Department Console', path: '/dept', color: '#7c3aed', icon: 'Shield', description: 'Department of Labour staff portal - restricted access' },
};

export const PERMIT_TYPES = {
  NEW: { id: 'new', label: 'New Work Permit', duration: 'Up to 3 years', processing: '30 working days', fee: 'Salary-based' },
  RENEWAL: { id: 'renewal', label: 'Work Permit Renewal', duration: 'Up to 1 year', processing: '2 weeks', fee: 'Salary-based' },
  TEMPORARY: { id: 'temporary', label: 'Temporary Work Permit', duration: 'Up to 3 months', processing: '10-15 working days', fee: 'Salary-based' },
  PERIODIC: { id: 'periodic', label: 'Periodic Work Permit', duration: '1 year (short periods)', processing: '30 working days', fee: 'Salary-based' },
  SELF_EMPLOYED: { id: 'self-employed', label: 'Self-Employed Work Permit', duration: 'Up to 3 years', processing: '30 working days', fee: 'Salary-based' },
  EMERGENCY: { id: 'emergency', label: 'Emergency Work Permit', duration: 'Up to 7 days', processing: 'Expedited', fee: 'Flat rate' },
};

export const PERMIT_STATUSES = {
  DRAFT: 'draft', SUBMITTED: 'submitted', UNDER_REVIEW: 'under_review',
  PENDING_PAYMENT: 'pending_payment', APPROVED: 'approved', REJECTED: 'rejected',
  EXPIRED: 'expired', CANCELLED: 'cancelled',
};

export const DISPUTE_STATUSES = {
  FILED: 'filed', INVESTIGATING: 'investigating', MEDIATION: 'mediation',
  RESOLVED: 'resolved', REFERRED: 'referred', CLOSED: 'closed',
};

export const JOB_CATEGORIES = [
  'Accounting & Finance', 'Administration', 'Agriculture & Fishing', 'Automotive',
  'Construction & Engineering', 'Customer Service', 'Domestic Work', 'Education',
  'Food & Beverage', 'Healthcare', 'Hospitality & Tourism', 'Information Technology',
  'Legal', 'Marine & Maritime', 'Real Estate', 'Retail & Sales', 'Security',
  'Telecommunications', 'Transportation', 'Utilities', 'Other'
];

export const ISLANDS = ['Tortola', 'Virgin Gorda', 'Jost Van Dyke', 'Anegada'];

export const DEPARTMENT_INFO = {
  name: 'Department of Labour and Workforce Development',
  shortName: 'DLWD',
  ministry: 'Ministry of Financial Services, Economic Development and Digital Transformation',
  address: 'Ashley Ritter Building, Road Town, Tortola, VG1110',
  phone: '1(284) 468-4780',
  fax: '1(284) 494-3027 / 468-2570',
  email: 'labour@gov.vg',
  hours: 'Monday - Friday, 8:30 a.m. to 4:30 p.m.',
  cashierHours: '8:45 a.m. to 3:00 p.m.',
  commissioner: 'Mervin Hastings (Acting)',
  minimumWage: '$8.50/hour',
  minimumWageEffective: 'November 30, 2024',
};

export const FEE_TIERS = [
  { min: 0, max: 25000, rate: 0.03, label: 'Up to $25,000' },
  { min: 25001, max: 50000, rate: 0.05, label: '$25,001 - $50,000' },
  { min: 50001, max: Infinity, rate: 0.07, label: 'Above $50,001' },
];

export const DOMESTIC_RATE = 0.01;
export const APPLICATION_FEE = 50;
export const FEE_CAP = 10000;

export const DOCUMENT_TYPES = [
  { id: 'passport', label: 'Valid Passport (Bio Page)', required: true },
  { id: 'photo', label: 'Passport-Size Photograph', required: true },
  { id: 'police_clearance', label: 'Police Clearance Certificate', required: true },
  { id: 'medical', label: 'Medical Certificate', required: true },
  { id: 'trade_license', label: 'Trade License (Employer)', required: true },
  { id: 'contract', label: 'Employment Contract', required: true },
  { id: 'job_description', label: 'Job Description', required: true },
  { id: 'qualifications', label: 'Qualifications/Certificates', required: false },
  { id: 'reference', label: 'Character Reference', required: false },
  { id: 'ssb_clearance', label: 'SSB Certificate of Good Standing', required: true },
  { id: 'ird_clearance', label: 'IRD Certificate of Good Standing', required: true },
  { id: 'nhi_clearance', label: 'NHI Certificate of Good Standing', required: true },
  { id: 'resume', label: 'Resume/CV', required: false },
  { id: 'cover_letter', label: 'Cover Letter', required: false },
  { id: 'recruitment_evidence', label: 'Evidence of Local Recruitment', required: true },
];
