export const ROLES = { ADMIN: 'admin', EMPLOYER: 'employer', EMPLOYEE: 'employee', JOBSEEKER: 'jobseeker' };

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
