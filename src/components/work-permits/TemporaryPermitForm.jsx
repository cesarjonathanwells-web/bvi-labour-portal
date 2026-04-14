import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  User,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  Save,
  Send,
  Check,
  Upload,
  X,
  AlertCircle,
  Info,
  FileUp,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getPortalBasePath } from '../../utils/helpers';
import { ISLANDS, JOB_CATEGORIES } from '../../data/constants';
import { calculateWorkPermitFee, formatCurrency } from '../../utils/feeCalculator';
import {
  validateEmail,
  validatePhone,
  fileToBase64,
  getStorage,
  setStorage,
} from '../../utils/helpers';
import { buildEmployerPrefill, mergePrefill, isTradeLicenceVerified } from '../../utils/prefill';

const DRAFT_KEY = 'bvi_permit_draft_temp';

const TEMP_DOCS = [
  { id: 'passport', label: 'Valid Passport (Bio Page)', required: true },
  { id: 'photo', label: 'Passport-Size Photograph', required: true },
  { id: 'police_clearance', label: 'Police Clearance Certificate', required: true },
  { id: 'trade_license', label: 'Trade License (Employer)', required: true },
  { id: 'contract', label: 'Employment/Engagement Contract', required: true },
  { id: 'justification', label: 'Justification Letter', required: true },
  { id: 'ssb_clearance', label: 'SSB Certificate of Good Standing', required: false },
  { id: 'ird_clearance', label: 'IRD Certificate of Good Standing', required: false },
];

const STEPS = [
  { id: 1, label: 'Employer & Employee', icon: Building2 },
  { id: 2, label: 'Assignment & Docs', icon: FileUp },
  { id: 3, label: 'Review & Submit', icon: ClipboardCheck },
];

const INITIAL_STATE = {
  employer: {
    companyName: '',
    tradeLicense: '',
    address: '',
    phone: '',
    email: '',
    industry: '',
    contactPerson: '',
  },
  employee: {
    fullName: '',
    nationality: '',
    passportNumber: '',
    passportExpiry: '',
    gender: '',
    phone: '',
    email: '',
  },
  assignment: {
    jobTitle: '',
    purpose: '',
    workLocation: '',
    startDate: '',
    endDate: '',
    annualSalaryEquivalent: '',
    workingHours: '',
  },
  documents: {},
  termsAccepted: false,
};

function Stepper({ currentStep, steps }) {
  return (
    <nav aria-label="Temporary permit progress" className="mb-8">
      <div className="flex items-center justify-between" role="list">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isComplete = currentStep > step.id;
          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-0" role="listitem">
              <div className="flex flex-col items-center">
                <div className={isComplete ? 'stepper-complete' : isActive ? 'stepper-active' : 'stepper-inactive'}
                  aria-label={`Step ${step.id}: ${step.label}${isComplete ? ' (completed)' : isActive ? ' (current)' : ''}`}
                  aria-current={isActive ? 'step' : undefined}>
                  {isComplete ? <Check size={18} /> : <Icon size={18} />}
                </div>
                <span className={`text-xs mt-2 text-center hidden sm:block ${isActive ? 'text-[#003366] font-semibold' : isComplete ? 'text-green-700 font-medium' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}`} aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

function FieldError({ error }) {
  if (!error) return null;
  return <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {error}</p>;
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-6 pb-4 border-b border-gray-200">
      <h2 className="text-xl font-bold text-[#003366]">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

/* ─── Step 1: Employer & Employee ─── */
function EmployerEmployeeStep({ employer, employee, onEmployerChange, onEmployeeChange, errors, prefilledFromAccount, licenceVerified }) {
  const ue = (field, value) => onEmployerChange({ ...employer, [field]: value });
  const uem = (field, value) => onEmployeeChange({ ...employee, [field]: value });

  return (
    <div>
      <div className="mb-6 p-4 rounded-lg bg-purple-50 border border-purple-200 flex items-start gap-3">
        <Clock size={20} className="text-purple-600 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-purple-800">Temporary Work Permit</p>
          <p className="text-purple-700">For short-term assignments up to 3 months. Not renewable -- apply for a standard permit for longer engagements.</p>
        </div>
      </div>

      <SectionHeader title="Employer Information" subtitle="Sponsoring company details." />
      {prefilledFromAccount && (
        <div className="mb-5 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-[#003366]">
          <Info size={16} className="flex-shrink-0 mt-0.5" />
          <p>Employer fields pre-filled from your registered business profile. Edit any details that are out of date.</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div>
          <label className="label-field">Company Name <span className="text-red-500">*</span></label>
          <input className="input-field" value={employer.companyName} onChange={(e) => ue('companyName', e.target.value)} placeholder="e.g. BVI Holdings Ltd" />
          <FieldError error={errors.companyName} />
        </div>
        <div>
          <label className="label-field">
            Trade License Number <span className="text-red-500">*</span>
            {licenceVerified && (
              <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-semibold uppercase tracking-wide">
                <Check size={10} /> Verified with IRD
              </span>
            )}
          </label>
          <input className="input-field" value={employer.tradeLicense} onChange={(e) => ue('tradeLicense', e.target.value)} />
          <FieldError error={errors.tradeLicense} />
        </div>
        <div className="md:col-span-2">
          <label className="label-field">Business Address <span className="text-red-500">*</span></label>
          <input className="input-field" value={employer.address} onChange={(e) => ue('address', e.target.value)} />
          <FieldError error={errors.address} />
        </div>
        <div>
          <label className="label-field">Phone <span className="text-red-500">*</span></label>
          <input className="input-field" value={employer.phone} onChange={(e) => ue('phone', e.target.value)} placeholder="1(284) 000-0000" />
          <FieldError error={errors.employerPhone} />
        </div>
        <div>
          <label className="label-field">Email <span className="text-red-500">*</span></label>
          <input type="email" className="input-field" value={employer.email} onChange={(e) => ue('email', e.target.value)} />
          <FieldError error={errors.employerEmail} />
        </div>
        <div>
          <label className="label-field">Industry <span className="text-red-500">*</span></label>
          <select className="input-field" value={employer.industry} onChange={(e) => ue('industry', e.target.value)}>
            <option value="">Select industry</option>
            {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <FieldError error={errors.industry} />
        </div>
        <div>
          <label className="label-field">Contact Person <span className="text-red-500">*</span></label>
          <input className="input-field" value={employer.contactPerson} onChange={(e) => ue('contactPerson', e.target.value)} />
          <FieldError error={errors.contactPerson} />
        </div>
      </div>

      <SectionHeader title="Employee Information" subtitle="Person to be temporarily employed." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="label-field">Full Name (as on passport) <span className="text-red-500">*</span></label>
          <input className="input-field" value={employee.fullName} onChange={(e) => uem('fullName', e.target.value)} />
          <FieldError error={errors.fullName} />
        </div>
        <div>
          <label className="label-field">Nationality <span className="text-red-500">*</span></label>
          <input className="input-field" value={employee.nationality} onChange={(e) => uem('nationality', e.target.value)} />
          <FieldError error={errors.nationality} />
        </div>
        <div>
          <label className="label-field">Passport Number <span className="text-red-500">*</span></label>
          <input className="input-field" value={employee.passportNumber} onChange={(e) => uem('passportNumber', e.target.value)} />
          <FieldError error={errors.passportNumber} />
        </div>
        <div>
          <label className="label-field">Passport Expiry <span className="text-red-500">*</span></label>
          <input type="date" className="input-field" value={employee.passportExpiry} onChange={(e) => uem('passportExpiry', e.target.value)} />
          <FieldError error={errors.passportExpiry} />
        </div>
        <div>
          <label className="label-field">Gender <span className="text-red-500">*</span></label>
          <select className="input-field" value={employee.gender} onChange={(e) => uem('gender', e.target.value)}>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <FieldError error={errors.gender} />
        </div>
        <div>
          <label className="label-field">Phone <span className="text-red-500">*</span></label>
          <input className="input-field" value={employee.phone} onChange={(e) => uem('phone', e.target.value)} />
          <FieldError error={errors.employeePhone} />
        </div>
        <div>
          <label className="label-field">Email <span className="text-red-500">*</span></label>
          <input type="email" className="input-field" value={employee.email} onChange={(e) => uem('email', e.target.value)} />
          <FieldError error={errors.employeeEmail} />
        </div>
      </div>
    </div>
  );
}

/* ─── Step 2: Assignment & Documents ─── */
function AssignmentDocsStep({ assignment, documents, onAssignmentChange, onDocsChange, errors }) {
  const ua = (field, value) => onAssignmentChange({ ...assignment, [field]: value });

  const handleUpload = async (docId, file) => {
    if (file.size > 5 * 1024 * 1024) { alert('File must be under 5 MB.'); return; }
    onDocsChange({ ...documents, [docId]: { name: file.name, size: file.size, data: await fileToBase64(file), uploadedAt: new Date().toISOString() } });
  };
  const handleRemove = (docId) => { const n = { ...documents }; delete n[docId]; onDocsChange(n); };

  const requiredDocs = TEMP_DOCS.filter(d => d.required);
  const optionalDocs = TEMP_DOCS.filter(d => !d.required);
  const reqCount = requiredDocs.filter(d => documents[d.id]).length;

  return (
    <div>
      <SectionHeader title="Assignment Details" subtitle="Describe the temporary assignment." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div>
          <label className="label-field">Job Title / Role <span className="text-red-500">*</span></label>
          <input className="input-field" value={assignment.jobTitle} onChange={(e) => ua('jobTitle', e.target.value)} />
          <FieldError error={errors.jobTitle} />
        </div>
        <div>
          <label className="label-field">Work Location (Island) <span className="text-red-500">*</span></label>
          <select className="input-field" value={assignment.workLocation} onChange={(e) => ua('workLocation', e.target.value)}>
            <option value="">Select island</option>
            {ISLANDS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <FieldError error={errors.workLocation} />
        </div>
        <div className="md:col-span-2">
          <label className="label-field">Purpose of Assignment <span className="text-red-500">*</span></label>
          <textarea className="input-field min-h-[100px]" value={assignment.purpose} onChange={(e) => ua('purpose', e.target.value)} placeholder="Describe the nature and purpose of this temporary engagement..." />
          <FieldError error={errors.purpose} />
        </div>
        <div>
          <label className="label-field">Start Date <span className="text-red-500">*</span></label>
          <input type="date" className="input-field" value={assignment.startDate} onChange={(e) => ua('startDate', e.target.value)} />
          <FieldError error={errors.startDate} />
        </div>
        <div>
          <label className="label-field">End Date <span className="text-red-500">*</span></label>
          <input type="date" className="input-field" value={assignment.endDate} onChange={(e) => ua('endDate', e.target.value)} />
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Info size={11} /> Maximum 3 months from start date.</p>
          <FieldError error={errors.endDate} />
        </div>
        <div>
          <label className="label-field">Annual Salary Equivalent (USD) <span className="text-red-500">*</span></label>
          <input type="number" className="input-field" value={assignment.annualSalaryEquivalent} onChange={(e) => ua('annualSalaryEquivalent', e.target.value)} min="0" />
          <FieldError error={errors.annualSalaryEquivalent} />
        </div>
        <div>
          <label className="label-field">Working Hours (per week) <span className="text-red-500">*</span></label>
          <input type="number" className="input-field" value={assignment.workingHours} onChange={(e) => ua('workingHours', e.target.value)} min="1" max="60" />
          <FieldError error={errors.workingHours} />
        </div>
      </div>

      <SectionHeader title="Required Documents" subtitle="Upload supporting documents." />
      <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-3">
        <Info size={20} className="text-[#003366]" />
        <span className="text-sm text-gray-700"><span className="font-semibold text-[#003366]">{reqCount} of {requiredDocs.length}</span> required documents uploaded.</span>
      </div>
      <div className="space-y-3 mb-6">
        {requiredDocs.map(doc => (
          <DocRow key={doc.id} doc={doc} uploaded={documents[doc.id]} onUpload={(f) => handleUpload(doc.id, f)} onRemove={() => handleRemove(doc.id)} />
        ))}
      </div>
      {optionalDocs.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Optional Documents</h3>
          <div className="space-y-3">
            {optionalDocs.map(doc => (
              <DocRow key={doc.id} doc={doc} uploaded={documents[doc.id]} onUpload={(f) => handleUpload(doc.id, f)} onRemove={() => handleRemove(doc.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DocRow({ doc, uploaded, onUpload, onRemove }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${uploaded ? 'bg-green-50 border-green-200' : doc.required ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${uploaded ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
        {uploaded ? <Check size={14} /> : <FileUp size={14} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{doc.label}{doc.required && <span className="text-red-500 ml-1">*</span>}</p>
        {uploaded && <p className="text-xs text-green-700 truncate">{uploaded.name}</p>}
      </div>
      {uploaded ? (
        <button onClick={onRemove} className="text-red-500 hover:text-red-700 p-1" aria-label={`Remove ${doc.label}`}><X size={16} /></button>
      ) : (
        <label className="btn-outline text-xs cursor-pointer py-1.5 px-3" aria-label={`Upload ${doc.label}`}><Upload size={12} /> Upload
          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" aria-label={`Choose file for ${doc.label}`} onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
        </label>
      )}
    </div>
  );
}

/* ─── Step 3: Review ─── */
function ReviewStep({ formData, fee, termsAccepted, onTermsChange }) {
  const { employer, employee, assignment, documents } = formData;
  const uploadedDocs = TEMP_DOCS.filter(d => documents[d.id]);
  const missingReq = TEMP_DOCS.filter(d => d.required && !documents[d.id]);

  return (
    <div>
      <SectionHeader title="Review & Submit" subtitle="Review your temporary permit application." />

      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3">Employer</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <RF label="Company" value={employer.companyName} />
          <RF label="Trade License" value={employer.tradeLicense} />
          <RF label="Industry" value={employer.industry} />
          <RF label="Phone" value={employer.phone} />
          <RF label="Email" value={employer.email} />
          <RF label="Contact" value={employer.contactPerson} />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3">Employee</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <RF label="Full Name" value={employee.fullName} />
          <RF label="Nationality" value={employee.nationality} />
          <RF label="Passport" value={employee.passportNumber} />
          <RF label="Gender" value={employee.gender} />
          <RF label="Phone" value={employee.phone} />
          <RF label="Email" value={employee.email} />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3">Assignment</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <RF label="Role" value={assignment.jobTitle} />
          <RF label="Location" value={assignment.workLocation} />
          <RF label="Start Date" value={assignment.startDate} />
          <RF label="End Date" value={assignment.endDate} />
          <RF label="Salary Equiv." value={assignment.annualSalaryEquivalent ? formatCurrency(assignment.annualSalaryEquivalent) : ''} />
          <RF label="Hours" value={assignment.workingHours ? `${assignment.workingHours} hrs/week` : ''} />
        </div>
        {assignment.purpose && (
          <div className="mt-3 text-sm"><p className="text-xs text-gray-500">Purpose</p><p className="text-gray-800">{assignment.purpose}</p></div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3">Documents ({uploadedDocs.length})</h3>
        {missingReq.length > 0 && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 mb-3">
            <p className="text-sm text-red-700 font-medium flex items-center gap-2"><AlertCircle size={14} /> Missing required documents:</p>
            <ul className="text-sm text-red-600 mt-1 ml-5">{missingReq.map(d => <li key={d.id}>{d.label}</li>)}</ul>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {uploadedDocs.map(d => <div key={d.id} className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded px-3 py-1.5"><Check size={14} /> {d.label}</div>)}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3">Fee Calculation</h3>
        <div className="card bg-gray-50 border-gray-200">
          {fee.breakdown.map((t, i) => (
            <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-200 last:border-0">
              <span className="text-gray-600">{t.tier} {t.rate && `@ ${t.rate}`}</span>
              <span className="font-medium">{formatCurrency(t.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm py-1.5 border-t border-gray-300 mt-2">
            <span className="text-gray-600">Permit Fee</span><span className="font-medium">{formatCurrency(fee.permitFee)}</span>
          </div>
          <div className="flex justify-between text-sm py-1.5">
            <span className="text-gray-600">Application Fee</span><span className="font-medium">{formatCurrency(fee.applicationFee)}</span>
          </div>
          <div className="flex justify-between text-base font-bold py-2 border-t-2 border-[#003366] mt-2 text-[#003366]">
            <span>Total</span><span>{formatCurrency(fee.total)}</span>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-gray-200 bg-white">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={termsAccepted} onChange={(e) => onTermsChange(e.target.checked)} className="mt-1 w-4 h-4 rounded border-gray-300 text-[#003366]" />
          <span className="text-sm text-gray-700 leading-relaxed">I certify that the information provided is true and accurate. I understand this temporary permit is valid for the stated period only and is not renewable. I agree to comply with all applicable BVI laws.</span>
        </label>
      </div>
    </div>
  );
}

function RF({ label, value }) {
  return <div className="py-1"><p className="text-xs text-gray-500">{label}</p><p className="font-medium text-gray-800">{value || '-'}</p></div>;
}

/* ─── Validators ─── */
function validateStep1(employer, employee) {
  const e = {};
  if (!employer.companyName.trim()) e.companyName = 'Required.';
  if (!employer.tradeLicense.trim()) e.tradeLicense = 'Required.';
  if (!employer.address.trim()) e.address = 'Required.';
  if (!employer.phone.trim()) e.employerPhone = 'Required.';
  else if (!validatePhone(employer.phone)) e.employerPhone = 'Invalid phone.';
  if (!employer.email.trim()) e.employerEmail = 'Required.';
  else if (!validateEmail(employer.email)) e.employerEmail = 'Invalid email.';
  if (!employer.industry) e.industry = 'Required.';
  if (!employer.contactPerson.trim()) e.contactPerson = 'Required.';

  if (!employee.fullName.trim()) e.fullName = 'Required.';
  if (!employee.nationality.trim()) e.nationality = 'Required.';
  if (!employee.passportNumber.trim()) e.passportNumber = 'Required.';
  if (!employee.passportExpiry) e.passportExpiry = 'Required.';
  if (!employee.gender) e.gender = 'Required.';
  if (!employee.phone.trim()) e.employeePhone = 'Required.';
  else if (!validatePhone(employee.phone)) e.employeePhone = 'Invalid phone.';
  if (!employee.email.trim()) e.employeeEmail = 'Required.';
  else if (!validateEmail(employee.email)) e.employeeEmail = 'Invalid email.';
  return e;
}

function validateStep2(assignment) {
  const e = {};
  if (!assignment.jobTitle.trim()) e.jobTitle = 'Required.';
  if (!assignment.purpose.trim()) e.purpose = 'Required.';
  if (!assignment.workLocation) e.workLocation = 'Required.';
  if (!assignment.startDate) e.startDate = 'Required.';
  if (!assignment.endDate) e.endDate = 'Required.';
  else if (assignment.startDate && assignment.endDate) {
    const diff = (new Date(assignment.endDate) - new Date(assignment.startDate)) / (1000 * 60 * 60 * 24);
    if (diff > 92) e.endDate = 'Cannot exceed 3 months.';
    if (diff < 1) e.endDate = 'End must be after start.';
  }
  if (!assignment.annualSalaryEquivalent || parseFloat(assignment.annualSalaryEquivalent) <= 0) e.annualSalaryEquivalent = 'Enter valid salary.';
  if (!assignment.workingHours || parseFloat(assignment.workingHours) <= 0) e.workingHours = 'Enter valid hours.';
  return e;
}

/* ─── Main ─── */
export default function TemporaryPermitForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { submitPermit } = useApp();
  const portalBase = getPortalBasePath(user?.portal);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    const d = getStorage(DRAFT_KEY);
    const base = d || INITIAL_STATE;
    setFormData({ ...base, employer: mergePrefill(base.employer, buildEmployerPrefill(user)) });
  }, [user]);
  const saveDraft = useCallback(() => { setStorage(DRAFT_KEY, formData); }, [formData]);
  useEffect(() => { const t = setTimeout(saveDraft, 1000); return () => clearTimeout(t); }, [saveDraft]);

  const updateSection = (section) => (data) => setFormData(prev => ({ ...prev, [section]: data }));

  const validateCurrentStep = () => {
    let stepErrors = {};
    if (currentStep === 1) stepErrors = validateStep1(formData.employer, formData.employee);
    else if (currentStep === 2) stepErrors = validateStep2(formData.assignment);
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const nextStep = () => { if (validateCurrentStep()) { setCurrentStep(s => Math.min(s + 1, 3)); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
  const prevStep = () => { setErrors({}); setCurrentStep(s => Math.max(s - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleSaveDraft = () => { saveDraft(); alert('Draft saved successfully.'); };

  const fee = calculateWorkPermitFee(formData.assignment.annualSalaryEquivalent);

  const handleSubmit = () => {
    if (!formData.termsAccepted) { alert('Please accept the terms.'); return; }
    const missing = TEMP_DOCS.filter(d => d.required && !formData.documents[d.id]);
    if (missing.length > 0) { alert(`Upload required documents:\n${missing.map(d => d.label).join('\n')}`); return; }

    setSubmitting(true);
    setTimeout(() => {
      const permit = submitPermit({
        type: 'temporary',
        userId: user?.id,
        employerId: user?.id,
        employer: formData.employer,
        employee: formData.employee,
        position: { jobTitle: formData.assignment.jobTitle, jobDescription: formData.assignment.purpose, workLocation: formData.assignment.workLocation },
        assignment: formData.assignment,
        documents: Object.keys(formData.documents).reduce((acc, k) => { acc[k] = { name: formData.documents[k].name, uploadedAt: formData.documents[k].uploadedAt }; return acc; }, {}),
        fee,
      });
      localStorage.removeItem(DRAFT_KEY);
      setSubmitted(permit);
      setSubmitting(false);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"><Check size={40} className="text-green-600" /></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted</h2>
        <p className="text-gray-600 mb-2">Your temporary work permit application has been submitted.</p>
        <div className="card bg-green-50 border-green-200 my-6 text-left">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Permit Number</span><span className="font-bold text-[#003366]">{submitted.permitNumber}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Status</span><span className="badge-processing">Submitted</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Estimated Fee</span><span className="font-medium">{formatCurrency(fee.total)}</span></div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(`${portalBase}/permits/status`)} className="btn-primary">Track Application</button>
          <button onClick={() => navigate(`${portalBase}/permits`)} className="btn-outline">Back to Permits</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">Temporary Work Permit Application</h1>
        <p className="text-gray-600">For short-term assignments up to 3 months. Complete all three steps below.</p>
      </div>

      <Stepper currentStep={currentStep} steps={STEPS} />

      <div className="card mb-6">
        {currentStep === 1 && <EmployerEmployeeStep employer={formData.employer} employee={formData.employee} onEmployerChange={updateSection('employer')} onEmployeeChange={updateSection('employee')} errors={errors} prefilledFromAccount={user?.portal === 'business'} licenceVerified={isTradeLicenceVerified(formData.employer.tradeLicense, user)} />}
        {currentStep === 2 && <AssignmentDocsStep assignment={formData.assignment} documents={formData.documents} onAssignmentChange={updateSection('assignment')} onDocsChange={updateSection('documents')} errors={errors} />}
        {currentStep === 3 && <ReviewStep formData={formData} fee={fee} termsAccepted={formData.termsAccepted} onTermsChange={(v) => setFormData(p => ({ ...p, termsAccepted: v }))} />}
      </div>

      <div className="flex items-center justify-between">
        <div>{currentStep > 1 && <button onClick={prevStep} className="btn-outline"><ChevronLeft size={16} /> Previous</button>}</div>
        <div className="flex items-center gap-3">
          <button onClick={handleSaveDraft} className="btn-outline text-sm"><Save size={14} /> Save Draft</button>
          {currentStep < 3 ? (
            <button onClick={nextStep} className="btn-primary">Next <ChevronRight size={16} /></button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting || !formData.termsAccepted} className="btn-success">
              {submitting ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Submitting...</> : <><Send size={16} /> Submit Application</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
