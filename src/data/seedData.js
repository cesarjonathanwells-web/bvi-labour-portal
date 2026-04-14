/**
 * Seed data for testing all portals and roles.
 * Run seedAll() from browser console or import in dev mode.
 */

const USERS_KEY = 'bvi_labour_users';
const PERMITS_KEY = 'bvi_permits';
const DISPUTES_KEY = 'bvi_disputes';
const JOBS_KEY = 'bvi_jobs';
const APPLICATIONS_KEY = 'bvi_applications';
const DOCUMENTS_KEY = 'bvi_documents';
const NOTIFICATIONS_KEY = 'bvi_notifications';
const CARDS_KEY = 'bvi_cards';

function get(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } }
function set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

// ── MOCK BUSINESS USERS ──────────────────────────────────────────────
const businessUsers = [
  { id: 'biz-001', email: 'john@tropicresorts.vg', password: 'test123', portal: 'business', role: 'employer', firstName: 'John', lastName: 'Richards', organization: 'Tropic Resorts Ltd', tradeLicense: 'TL-2024-0451', industry: 'Hospitality & Tourism', island: 'Tortola', phone: '284-555-0101', createdAt: '2024-06-15T10:00:00Z' },
  { id: 'biz-002', email: 'maria@bvibuilders.vg', password: 'test123', portal: 'business', role: 'employer', firstName: 'Maria', lastName: 'Santiago', organization: 'BVI Builders Corp', tradeLicense: 'TL-2024-0287', industry: 'Construction & Engineering', island: 'Tortola', phone: '284-555-0102', createdAt: '2024-08-20T10:00:00Z' },
  { id: 'biz-003', email: 'peter@islandtech.vg', password: 'test123', portal: 'business', role: 'employer', firstName: 'Peter', lastName: 'Thompson', organization: 'Island Tech Solutions', tradeLicense: 'TL-2025-0033', industry: 'Information Technology', island: 'Virgin Gorda', phone: '284-555-0103', createdAt: '2026-01-10T10:00:00Z' },
];

// ── MOCK WORKER USERS ────────────────────────────────────────────────
const workerUsers = [
  { id: 'wrk-001', email: 'carlos.garcia@email.com', password: 'test123', portal: 'worker', role: 'employee', firstName: 'Carlos', lastName: 'Garcia', nationality: 'Dominican Republic', currentEmployer: 'Tropic Resorts Ltd', permitNumber: 'WP-2024-1001', phone: '284-555-0201', createdAt: '2024-07-01T10:00:00Z' },
  { id: 'wrk-002', email: 'anika.james@email.com', password: 'test123', portal: 'worker', role: 'employee', firstName: 'Anika', lastName: 'James', nationality: 'Jamaica', currentEmployer: 'BVI Builders Corp', permitNumber: 'WP-2024-1002', phone: '284-555-0202', createdAt: '2024-09-15T10:00:00Z' },
  { id: 'wrk-003', email: 'raj.patel@email.com', password: 'test123', portal: 'worker', role: 'employee', firstName: 'Raj', lastName: 'Patel', nationality: 'India', currentEmployer: 'Island Tech Solutions', permitNumber: 'WP-2025-1003', phone: '284-555-0203', createdAt: '2026-02-01T10:00:00Z' },
];

// ── MOCK JOB SEEKER USERS ────────────────────────────────────────────
const jobSeekerUsers = [
  { id: 'js-001', email: 'tamara.penn@email.vg', password: 'test123', portal: 'jobseeker', role: 'jobseeker', firstName: 'Tamara', lastName: 'Penn', belongerStatus: 'Virgin Islander', skills: 'Customer service, Microsoft Office, Event planning', educationLevel: 'Associate Degree', phone: '284-555-0301', createdAt: '2026-01-20T10:00:00Z' },
  { id: 'js-002', email: 'david.frett@email.vg', password: 'test123', portal: 'jobseeker', role: 'jobseeker', firstName: 'David', lastName: 'Frett', belongerStatus: 'Belonger', skills: 'Carpentry, Electrical, Plumbing', educationLevel: 'High School Diploma', phone: '284-555-0302', createdAt: '2026-02-05T10:00:00Z' },
];

// ── MOCK PERMITS ─────────────────────────────────────────────────────
const permits = [
  { id: 'pmt-001', permitNumber: 'WP-2024-1001', type: 'new', status: 'approved', userId: 'wrk-001', employerId: 'biz-001', employeeName: 'Carlos Garcia', employeeNationality: 'Dominican Republic', employerName: 'Tropic Resorts Ltd', position: 'Head Chef', salary: 45000, island: 'Tortola', submittedAt: '2024-06-20T10:00:00Z', updatedAt: '2024-07-10T10:00:00Z', issuedDate: '2024-07-10', expiryDate: '2027-07-10', notes: 'Approved by Deputy Commissioner' },
  { id: 'pmt-002', permitNumber: 'WP-2024-1002', type: 'new', status: 'approved', userId: 'wrk-002', employerId: 'biz-002', employeeName: 'Anika James', employeeNationality: 'Jamaica', employerName: 'BVI Builders Corp', position: 'Site Supervisor', salary: 52000, island: 'Tortola', submittedAt: '2024-09-01T10:00:00Z', updatedAt: '2024-09-25T10:00:00Z', issuedDate: '2024-09-25', expiryDate: '2026-05-15', notes: '' },
  { id: 'pmt-003', permitNumber: 'WP-2025-1003', type: 'new', status: 'under_review', userId: 'wrk-003', employerId: 'biz-003', employeeName: 'Raj Patel', employeeNationality: 'India', employerName: 'Island Tech Solutions', position: 'Software Developer', salary: 68000, island: 'Virgin Gorda', submittedAt: '2026-03-15T10:00:00Z', updatedAt: '2026-03-20T10:00:00Z', assignedTo: 'dept-permits-001', notes: 'Documents under verification' },
  { id: 'pmt-004', permitNumber: 'WR-2025-2001', type: 'renewal', status: 'submitted', userId: 'wrk-001', employerId: 'biz-001', employeeName: 'Carlos Garcia', employeeNationality: 'Dominican Republic', employerName: 'Tropic Resorts Ltd', position: 'Head Chef', salary: 48000, island: 'Tortola', submittedAt: '2026-03-25T10:00:00Z', updatedAt: '2026-03-25T10:00:00Z', notes: '' },
  { id: 'pmt-005', permitNumber: 'WT-2025-3001', type: 'temporary', status: 'pending_payment', userId: 'biz-002', employerId: 'biz-002', employeeName: 'Marco Rossi', employeeNationality: 'Italy', employerName: 'BVI Builders Corp', position: 'Structural Engineer', salary: 75000, island: 'Tortola', submittedAt: '2026-03-10T10:00:00Z', updatedAt: '2026-03-22T10:00:00Z', notes: 'Pending fee payment' },
  { id: 'pmt-006', permitNumber: 'WP-2024-1050', type: 'new', status: 'rejected', userId: 'biz-001', employerId: 'biz-001', employeeName: 'Test Rejected', employeeNationality: 'Unknown', employerName: 'Tropic Resorts Ltd', position: 'Porter', salary: 20000, island: 'Tortola', submittedAt: '2024-11-01T10:00:00Z', updatedAt: '2024-11-20T10:00:00Z', notes: 'Insufficient documentation - missing police clearance and medical certificate' },
];

// ── MOCK DISPUTES ────────────────────────────────────────────────────
const disputes = [
  { id: 'dsp-001', caseNumber: 'DC-2025-4001', userId: 'wrk-002', status: 'investigating', type: 'unpaid_wages', complainantName: 'Anika James', respondentName: 'BVI Builders Corp', respondentAddress: 'Wickham Cay, Road Town', respondentPhone: '284-555-0102', description: 'Employer has not paid overtime wages for the months of January and February 2025. Total owed approximately $3,200 for 80 hours of overtime at 1.5x rate.', incidentDate: '2026-02-28', desiredResolution: 'Full payment of overtime owed plus interest', filedAt: '2026-03-05T10:00:00Z', updatedAt: '2026-03-18T10:00:00Z', assignedTo: 'dept-disputes-001', priority: 'high', timeline: [{ status: 'filed', date: '2026-03-05T10:00:00Z', note: 'Dispute filed' }, { status: 'investigating', date: '2026-03-10T10:00:00Z', note: 'Assigned to Dispute Officer. Employer contacted for response.' }] },
  { id: 'dsp-002', caseNumber: 'DC-2025-4002', userId: 'wrk-001', status: 'mediation', type: 'unfair_dismissal', complainantName: 'Carlos Garcia', respondentName: 'Previous Employer Ltd', respondentAddress: 'Main Street, Road Town', respondentPhone: '284-555-9999', description: 'Was terminated without proper notice or written reason as required under Section 81 of the Labour Code.', incidentDate: '2026-01-15', desiredResolution: 'Compensation for unfair dismissal and notice period', filedAt: '2026-01-20T10:00:00Z', updatedAt: '2026-03-01T10:00:00Z', assignedTo: 'dept-disputes-001', priority: 'medium', timeline: [{ status: 'filed', date: '2026-01-20T10:00:00Z', note: 'Dispute filed' }, { status: 'investigating', date: '2026-01-28T10:00:00Z', note: 'Investigation commenced' }, { status: 'mediation', date: '2026-02-15T10:00:00Z', note: 'Parties agreed to mediation. Session scheduled.' }] },
  { id: 'dsp-003', caseNumber: 'DC-2024-3050', userId: 'wrk-002', status: 'resolved', type: 'unsafe_conditions', complainantName: 'Anika James', respondentName: 'Old Construction Co', respondentAddress: 'East End, Tortola', respondentPhone: '284-555-8888', description: 'Workplace lacked proper safety equipment and fire extinguishers as required under Part IX of the Labour Code.', incidentDate: '2024-08-10', desiredResolution: 'Workplace brought into compliance', filedAt: '2024-08-15T10:00:00Z', updatedAt: '2024-10-20T10:00:00Z', priority: 'high', timeline: [{ status: 'filed', date: '2024-08-15T10:00:00Z', note: 'Dispute filed' }, { status: 'investigating', date: '2024-08-22T10:00:00Z', note: 'Inspector dispatched' }, { status: 'resolved', date: '2024-10-20T10:00:00Z', note: 'Employer complied with all safety requirements after inspection.' }] },
];

// ── MOCK JOBS ────────────────────────────────────────────────────────
const jobs = [
  { id: 'job-001', jobNumber: 'JV-2025-5001', employerId: 'biz-001', employerName: 'Tropic Resorts Ltd', title: 'Restaurant Manager', category: 'Hospitality & Tourism', description: 'Manage daily restaurant operations, supervise staff, ensure guest satisfaction, coordinate with kitchen team.', requirements: 'Minimum 3 years management experience, food safety certification, strong leadership skills.', salaryMin: 35000, salaryMax: 45000, workingHours: '40 hours/week', island: 'Tortola', employmentType: 'full-time', deadline: '2026-05-30', belongerPreferred: true, contactPerson: 'John Richards', contactEmail: 'john@tropicresorts.vg', contactPhone: '284-555-0101', status: 'open', applicants: 3, postedAt: '2026-03-01T10:00:00Z' },
  { id: 'job-002', jobNumber: 'JV-2025-5002', employerId: 'biz-002', employerName: 'BVI Builders Corp', title: 'Electrician', category: 'Construction & Engineering', description: 'Install and maintain electrical systems in residential and commercial buildings across the Territory.', requirements: 'Licensed electrician, 2+ years experience, own tools preferred.', salaryMin: 28000, salaryMax: 38000, workingHours: '45 hours/week', island: 'Tortola', employmentType: 'full-time', deadline: '2026-06-15', belongerPreferred: true, contactPerson: 'Maria Santiago', contactEmail: 'maria@bvibuilders.vg', contactPhone: '284-555-0102', status: 'open', applicants: 1, postedAt: '2026-03-10T10:00:00Z' },
  { id: 'job-003', jobNumber: 'JV-2025-5003', employerId: 'biz-003', employerName: 'Island Tech Solutions', title: 'IT Support Technician', category: 'Information Technology', description: 'Provide technical support to clients, troubleshoot hardware/software issues, manage network infrastructure.', requirements: 'CompTIA A+ or equivalent, networking knowledge, customer service oriented.', salaryMin: 25000, salaryMax: 35000, workingHours: '40 hours/week', island: 'Virgin Gorda', employmentType: 'full-time', deadline: '2026-05-15', belongerPreferred: false, contactPerson: 'Peter Thompson', contactEmail: 'peter@islandtech.vg', contactPhone: '284-555-0103', status: 'open', applicants: 0, postedAt: '2026-03-20T10:00:00Z' },
  { id: 'job-004', jobNumber: 'JV-2025-5004', employerId: 'biz-001', employerName: 'Tropic Resorts Ltd', title: 'Front Desk Receptionist', category: 'Hospitality & Tourism', description: 'Greet and check in guests, handle reservations, answer phone inquiries, provide concierge services.', requirements: 'High school diploma, customer service experience, computer literate, bilingual a plus.', salaryMin: 20000, salaryMax: 26000, workingHours: '40 hours/week, shifts', island: 'Tortola', employmentType: 'full-time', deadline: '2026-05-20', belongerPreferred: true, contactPerson: 'John Richards', contactEmail: 'john@tropicresorts.vg', contactPhone: '284-555-0101', status: 'open', applicants: 5, postedAt: '2026-03-05T10:00:00Z' },
];

// ── MOCK APPLICATIONS ────────────────────────────────────────────────
const applications = [
  { id: 'app-001', jobId: 'job-001', userId: 'js-001', applicantName: 'Tamara Penn', status: 'shortlisted', coverLetter: 'I have 5 years of experience in hospitality management and am passionate about delivering excellent service.', salaryExpectation: 40000, availableDate: '2026-06-01', appliedAt: '2026-03-05T10:00:00Z' },
  { id: 'app-002', jobId: 'job-004', userId: 'js-001', applicantName: 'Tamara Penn', status: 'submitted', coverLetter: 'I am interested in the receptionist position and have strong customer service skills.', salaryExpectation: 24000, availableDate: '2026-05-15', appliedAt: '2026-03-12T10:00:00Z' },
  { id: 'app-003', jobId: 'job-002', userId: 'js-002', applicantName: 'David Frett', status: 'interview', coverLetter: 'Licensed electrician with 8 years of residential and commercial experience in the BVI.', salaryExpectation: 35000, availableDate: '2026-05-01', appliedAt: '2026-03-15T10:00:00Z' },
];

// ── MOCK DOCUMENTS ───────────────────────────────────────────────────
const documents = [
  { id: 'doc-001', userId: 'wrk-001', type: 'passport', label: 'Passport - Carlos Garcia', fileName: 'carlos_passport.pdf', fileSize: 245000, uploadedAt: '2024-06-18T10:00:00Z' },
  { id: 'doc-002', userId: 'wrk-001', type: 'medical', label: 'Medical Certificate', fileName: 'carlos_medical.pdf', fileSize: 180000, uploadedAt: '2024-06-18T10:00:00Z' },
  { id: 'doc-003', userId: 'wrk-002', type: 'passport', label: 'Passport - Anika James', fileName: 'anika_passport.pdf', fileSize: 220000, uploadedAt: '2024-08-28T10:00:00Z' },
  { id: 'doc-004', userId: 'biz-001', type: 'trade_license', label: 'Trade License - Tropic Resorts', fileName: 'tropic_trade_license.pdf', fileSize: 310000, uploadedAt: '2024-06-15T10:00:00Z' },
  { id: 'doc-005', userId: 'js-001', type: 'resume', label: 'Resume - Tamara Penn', fileName: 'tamara_penn_resume.pdf', fileSize: 150000, uploadedAt: '2026-01-22T10:00:00Z' },
];

// ── MOCK NOTIFICATIONS ───────────────────────────────────────────────
const notifications = [
  { id: 'ntf-001', userId: 'biz-001', message: 'Work permit WP-2024-1001 for Carlos Garcia has been approved.', type: 'success', read: true, createdAt: '2024-07-10T10:00:00Z' },
  { id: 'ntf-002', userId: 'wrk-001', message: 'Your work permit WP-2024-1001 has been approved. You may now view your digital ID card.', type: 'success', read: false, createdAt: '2024-07-10T10:00:00Z' },
  { id: 'ntf-003', userId: 'biz-001', message: 'Work permit WP-2024-1001 for Carlos Garcia expires in 30 days. Please submit a renewal application.', type: 'warning', read: false, createdAt: '2026-03-10T10:00:00Z' },
  { id: 'ntf-004', userId: 'wrk-002', message: 'Your dispute DC-2025-4001 status has been updated to: Investigating.', type: 'info', read: false, createdAt: '2026-03-10T10:00:00Z' },
  { id: 'ntf-005', userId: 'biz-003', message: 'Work permit WP-2025-1003 for Raj Patel is under review.', type: 'info', read: false, createdAt: '2026-03-20T10:00:00Z' },
  { id: 'ntf-006', userId: 'js-001', message: 'Your application for Restaurant Manager at Tropic Resorts Ltd has been shortlisted!', type: 'success', read: false, createdAt: '2026-03-08T10:00:00Z' },
  { id: 'ntf-007', userId: 'js-002', message: 'Interview scheduled for Electrician position at BVI Builders Corp.', type: 'info', read: false, createdAt: '2026-03-18T10:00:00Z' },
];

// ── MOCK PHYSICAL ID CARDS ──────────────────────────────────────────
// Spread across every lifecycle state so all four dept queues show content.
const cards = [
  // Carlos Garcia (wrk-001, pmt-001) — card was issued and collected months ago
  {
    id: 'card-pmt-001',
    permitId: 'pmt-001',
    permitNumber: 'WP-2024-1001',
    workerUserId: 'wrk-001',
    workerName: 'Carlos Garcia',
    employerName: 'Tropic Resorts Ltd',
    digitalIssuedAt: '2024-07-10T10:30:00Z',
    appointment: { scheduledAt: '2024-07-12T10:00:00Z', location: 'road_town', status: 'completed' },
    photo: { capturedAt: '2024-07-12T10:15:00Z', capturedBy: 'dept-frontdesk-001', photoData: 'seed-photo-carlos' },
    print: { status: 'collected', queuedAt: '2024-07-12T10:20:00Z', printedAt: '2024-07-12T14:00:00Z', printedBy: 'dept-frontdesk-001', failureCount: 0, failureNotes: [] },
    notifications: { readyNotifiedAt: '2024-07-12T14:30:00Z', channels: ['in_app', 'email', 'sms'] },
    collection: { collectedAt: '2024-07-15T09:20:00Z', verifiedBy: 'dept-frontdesk-001', idVerificationType: 'passport', idReference: 'DOM123456', location: 'road_town' },
    createdAt: '2024-07-10T10:30:00Z', updatedAt: '2024-07-15T09:20:00Z',
  },

  // Anika James (wrk-002, pmt-002) — printed and waiting for pickup, notification sent
  {
    id: 'card-pmt-002',
    permitId: 'pmt-002',
    permitNumber: 'WP-2024-1002',
    workerUserId: 'wrk-002',
    workerName: 'Anika James',
    employerName: 'BVI Builders Corp',
    digitalIssuedAt: '2024-09-25T11:00:00Z',
    appointment: { scheduledAt: '2026-04-10T14:00:00Z', location: 'road_town', status: 'completed' },
    photo: { capturedAt: '2026-04-10T14:10:00Z', capturedBy: 'dept-frontdesk-001', photoData: 'seed-photo-anika' },
    print: { status: 'ready_for_pickup', queuedAt: '2026-04-10T14:15:00Z', printedAt: '2026-04-11T11:30:00Z', printedBy: 'dept-frontdesk-001', failureCount: 0, failureNotes: [] },
    notifications: { readyNotifiedAt: '2026-04-11T11:35:00Z', channels: ['in_app', 'email', 'sms'] },
    collection: { location: 'road_town' },
    createdAt: '2024-09-25T11:00:00Z', updatedAt: '2026-04-11T11:35:00Z',
  },

  // Synthetic Maria Fernandez — photographed, currently in print queue
  {
    id: 'card-pmt-007',
    permitId: 'pmt-007',
    permitNumber: 'WP-2026-1007',
    workerUserId: 'wrk-007',
    workerName: 'Maria Fernandez',
    employerName: 'Tropic Resorts Ltd',
    digitalIssuedAt: '2026-04-02T09:00:00Z',
    appointment: { scheduledAt: '2026-04-09T11:00:00Z', location: 'road_town', status: 'completed' },
    photo: { capturedAt: '2026-04-09T11:08:00Z', capturedBy: 'dept-frontdesk-001', photoData: 'seed-photo-maria' },
    print: { status: 'printing', queuedAt: '2026-04-09T11:10:00Z', failureCount: 0, failureNotes: [] },
    notifications: { readyNotifiedAt: null, channels: [] },
    collection: null,
    createdAt: '2026-04-02T09:00:00Z', updatedAt: '2026-04-13T09:00:00Z',
  },

  // Synthetic Kwame Ansah — two print failures on this record (shows the
  // machine-fault narrative for the presentation). Queue position preserved.
  {
    id: 'card-pmt-008',
    permitId: 'pmt-008',
    permitNumber: 'WP-2026-1008',
    workerUserId: 'wrk-008',
    workerName: 'Kwame Ansah',
    employerName: 'Island Tech Solutions',
    digitalIssuedAt: '2026-03-28T10:00:00Z',
    appointment: { scheduledAt: '2026-04-05T09:30:00Z', location: 'virgin_gorda', status: 'completed' },
    photo: { capturedAt: '2026-04-05T09:40:00Z', capturedBy: 'dept-frontdesk-001', photoData: 'seed-photo-kwame' },
    print: {
      status: 'print_failed',
      queuedAt: '2026-04-05T09:45:00Z',
      failureCount: 2,
      failureNotes: [
        { at: '2026-04-06T10:15:00Z', by: 'dept-frontdesk-001', note: 'Ribbon jam — machine requires service.' },
        { at: '2026-04-08T11:20:00Z', by: 'dept-frontdesk-001', note: 'Machine offline, vendor dispatched.' },
      ],
    },
    notifications: { readyNotifiedAt: null, channels: [] },
    collection: null,
    createdAt: '2026-03-28T10:00:00Z', updatedAt: '2026-04-08T11:20:00Z',
  },

  // Synthetic Priya Menon — approved recently, photo appointment booked, awaiting capture.
  // Shows up in the Photo Queue tab.
  {
    id: 'card-pmt-009',
    permitId: 'pmt-009',
    permitNumber: 'WP-2026-1009',
    workerUserId: 'wrk-009',
    workerName: 'Priya Menon',
    employerName: 'BVI Builders Corp',
    digitalIssuedAt: '2026-04-11T14:00:00Z',
    appointment: { scheduledAt: '2026-04-16T10:00:00Z', location: 'road_town', status: 'scheduled' },
    photo: null,
    print: { status: 'not_started', failureCount: 0, failureNotes: [] },
    notifications: { readyNotifiedAt: null, channels: [] },
    collection: null,
    createdAt: '2026-04-11T14:00:00Z', updatedAt: '2026-04-11T14:00:00Z',
  },
];

// Synthetic permits that back the synthetic cards above. Only include the
// fields the CardsPage relies on (permitNumber, status=approved, user refs).
const extraPermits = [
  { id: 'pmt-007', permitNumber: 'WP-2026-1007', type: 'new', status: 'approved', userId: 'wrk-007', employerId: 'biz-001', employeeName: 'Maria Fernandez', employeeNationality: 'Colombia', employerName: 'Tropic Resorts Ltd', position: 'Pastry Chef', salary: 38000, island: 'Tortola', submittedAt: '2026-03-18T10:00:00Z', updatedAt: '2026-04-02T09:00:00Z', issuedDate: '2026-04-02', expiryDate: '2029-04-02', notes: 'Approved' },
  { id: 'pmt-008', permitNumber: 'WP-2026-1008', type: 'new', status: 'approved', userId: 'wrk-008', employerId: 'biz-003', employeeName: 'Kwame Ansah', employeeNationality: 'Ghana', employerName: 'Island Tech Solutions', position: 'Network Engineer', salary: 62000, island: 'Virgin Gorda', submittedAt: '2026-03-10T10:00:00Z', updatedAt: '2026-03-28T10:00:00Z', issuedDate: '2026-03-28', expiryDate: '2029-03-28', notes: 'Approved' },
  { id: 'pmt-009', permitNumber: 'WP-2026-1009', type: 'new', status: 'approved', userId: 'wrk-009', employerId: 'biz-002', employeeName: 'Priya Menon', employeeNationality: 'India', employerName: 'BVI Builders Corp', position: 'Quantity Surveyor', salary: 55000, island: 'Tortola', submittedAt: '2026-03-25T10:00:00Z', updatedAt: '2026-04-11T14:00:00Z', issuedDate: '2026-04-11', expiryDate: '2029-04-11', notes: 'Approved' },
];

// Synthetic workers referenced by the extra permits/cards. These let the
// dept staff search for them in the queue and let audit entries resolve.
const extraWorkers = [
  { id: 'wrk-007', email: 'maria.fernandez@email.com', password: 'test123', portal: 'worker', role: 'employee', firstName: 'Maria', lastName: 'Fernandez', nationality: 'Colombia', currentEmployer: 'Tropic Resorts Ltd', permitNumber: 'WP-2026-1007', phone: '284-555-0207', createdAt: '2026-03-18T10:00:00Z' },
  { id: 'wrk-008', email: 'kwame.ansah@email.com', password: 'test123', portal: 'worker', role: 'employee', firstName: 'Kwame', lastName: 'Ansah', nationality: 'Ghana', currentEmployer: 'Island Tech Solutions', permitNumber: 'WP-2026-1008', phone: '284-555-0208', createdAt: '2026-03-10T10:00:00Z' },
  { id: 'wrk-009', email: 'priya.menon@email.com', password: 'test123', portal: 'worker', role: 'employee', firstName: 'Priya', lastName: 'Menon', nationality: 'India', currentEmployer: 'BVI Builders Corp', permitNumber: 'WP-2026-1009', phone: '284-555-0209', createdAt: '2026-03-25T10:00:00Z' },
];

/** Merge seed items into an existing array by id without duplicating */
function mergeById(key, seedItems) {
  const existing = get(key);
  if (existing.length === 0) {
    set(key, seedItems);
    return seedItems;
  }
  let changed = false;
  const merged = [...existing];
  for (const item of seedItems) {
    if (!merged.find(e => e.id === item.id)) {
      merged.push(item);
      changed = true;
    }
  }
  if (changed) set(key, merged);
  return merged;
}

export function seedAll() {
  const allMockUsers = [...businessUsers, ...workerUsers, ...jobSeekerUsers, ...extraWorkers];
  mergeById(USERS_KEY, allMockUsers);
  mergeById(PERMITS_KEY, [...permits, ...extraPermits]);
  mergeById(CARDS_KEY, cards);
  mergeById(DISPUTES_KEY, disputes);
  mergeById(JOBS_KEY, jobs);
  mergeById(APPLICATIONS_KEY, applications);
  mergeById(DOCUMENTS_KEY, documents);
  mergeById(NOTIFICATIONS_KEY, notifications);
  return true;
}

export const MOCK_CREDENTIALS = {
  business: [
    { email: 'john@tropicresorts.vg', password: 'test123', name: 'John Richards', company: 'Tropic Resorts Ltd' },
    { email: 'maria@bvibuilders.vg', password: 'test123', name: 'Maria Santiago', company: 'BVI Builders Corp' },
    { email: 'peter@islandtech.vg', password: 'test123', name: 'Peter Thompson', company: 'Island Tech Solutions' },
  ],
  worker: [
    { email: 'carlos.garcia@email.com', password: 'test123', name: 'Carlos Garcia', employer: 'Tropic Resorts Ltd' },
    { email: 'anika.james@email.com', password: 'test123', name: 'Anika James', employer: 'BVI Builders Corp' },
    { email: 'raj.patel@email.com', password: 'test123', name: 'Raj Patel', employer: 'Island Tech Solutions' },
  ],
  jobseeker: [
    { email: 'tamara.penn@email.vg', password: 'test123', name: 'Tamara Penn' },
    { email: 'david.frett@email.vg', password: 'test123', name: 'David Frett' },
  ],
  dept: [
    { email: 'commissioner@labour.gov.vg', password: 'admin123', role: 'Labour Commissioner' },
    { email: 'deputy@labour.gov.vg', password: 'admin123', role: 'Deputy Commissioner' },
    { email: 'permits@labour.gov.vg', password: 'admin123', role: 'Permit Officer' },
    { email: 'disputes@labour.gov.vg', password: 'admin123', role: 'Dispute Officer' },
    { email: 'inspector@labour.gov.vg', password: 'admin123', role: 'Inspector' },
    { email: 'cashier@labour.gov.vg', password: 'admin123', role: 'Cashier' },
    { email: 'frontdesk@labour.gov.vg', password: 'admin123', role: 'Front Desk' },
  ],
};
