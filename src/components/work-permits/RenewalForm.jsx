import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  User,
  Briefcase,
  FileUp,
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
  Clock,
  Camera,
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

const DRAFT_KEY = 'bvi_permit_draft_renewal';

const RENEWAL_DOCS = [
  { id: 'current_permit', label: 'Copy of Current Work Permit', required: true },
  { id: 'passport', label: 'Valid Passport (Bio Page)', required: true },
  { id: 'photo', label: 'Updated Passport-Size Photograph', required: true },
  { id: 'police_clearance', label: 'Updated Police Clearance Certificate', required: true },
  { id: 'medical', label: 'Updated Medical Certificate', required: true },
  { id: 'trade_license', label: 'Current Trade License (Employer)', required: true },
  { id: 'contract', label: 'Updated Employment Contract', required: true },
  { id: 'performance_eval', label: 'Performance Evaluation Report', required: true },
  { id: 'ssb_clearance', label: 'SSB Certificate of Good Standing', required: true },
  { id: 'ird_clearance', label: 'IRD Certificate of Good Standing', required: true },
  { id: 'nhi_clearance', label: 'NHI Certificate of Good Standing', required: true },
  { id: 'justification', label: 'Renewal Justification Letter', required: false },
];

const STEPS = [
  { id: 1, label: 'Current Permit', icon: FileText },
  { id: 2, label: 'Employee Info', icon: User },
  { id: 3, label: 'Position Details', icon: Briefcase },
  { id: 4, label: 'Documents', icon: FileUp },
  { id: 5, label: 'Review & Submit', icon: ClipboardCheck },
];

const INITIAL_STATE = {
  currentPermit: {
    permitNumber: '',
    companyName: '',
    tradeLicense: '',
    address: '',
    phone: '',
    email: '',
    industry: '',
    authorizedSignatory: '',
  },
  employee: {
    fullName: '',
    nationality: '',
    dateOfBirth: '',
    passportNumber: '',
    passportExpiry: '',
    gender: '',
    maritalStatus: '',
    currentAddress: '',
    phone: '',
    email: '',
    photo: null,
  },
  position: {
    positionChanged: false,
    jobTitle: '',
    jobDescription: '',
    department: '',
    workLocation: '',
    startDate: '',
    annualSalary: '',
    workingHours: '',
    qualificationsRequired: '',
  },
  documents: {},
  termsAccepted: false,
};

function Stepper({ currentStep, steps }) {
  return (
    <nav aria-label="Renewal progress" className="mb-8">
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

/* ─── Step 1: Current Permit & Employer Info ─── */
function CurrentPermitStep({ data, onChange, errors }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  return (
    <div>
      <SectionHeader title="Current Permit & Employer" subtitle="Enter your current permit number and update employer details." />

      {/* Warning banner */}
      <div className="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-300 flex items-start gap-3">
        <Clock size={20} className="text-yellow-600 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-yellow-800">Begin renewal early</p>
          <p className="text-yellow-700">Schedule your renewal appointment at least 4 weeks before your permit expires to avoid gaps in employment authorization.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="label-field">Current Permit Number <span className="text-red-500">*</span></label>
          <input className="input-field" value={data.permitNumber} onChange={(e) => update('permitNumber', e.target.value)} placeholder="e.g. WP-2024-1234" />
          <FieldError error={errors.permitNumber} />
        </div>
        <div>
          <label className="label-field">Company Name <span className="text-red-500">*</span></label>
          <input className="input-field" value={data.companyName} onChange={(e) => update('companyName', e.target.value)} placeholder="e.g. BVI Holdings Ltd" />
          <FieldError error={errors.companyName} />
        </div>
        <div>
          <label className="label-field">Trade License Number <span className="text-red-500">*</span></label>
          <input className="input-field" value={data.tradeLicense} onChange={(e) => update('tradeLicense', e.target.value)} placeholder="e.g. TL-2024-12345" />
          <FieldError error={errors.tradeLicense} />
        </div>
        <div className="md:col-span-2">
          <label className="label-field">Business Address <span className="text-red-500">*</span></label>
          <input className="input-field" value={data.address} onChange={(e) => update('address', e.target.value)} placeholder="Street address, city, island" />
          <FieldError error={errors.address} />
        </div>
        <div>
          <label className="label-field">Phone Number <span className="text-red-500">*</span></label>
          <input className="input-field" value={data.phone} onChange={(e) => update('phone', e.target.value)} placeholder="1(284) 000-0000" />
          <FieldError error={errors.phone} />
        </div>
        <div>
          <label className="label-field">Email Address <span className="text-red-500">*</span></label>
          <input type="email" className="input-field" value={data.email} onChange={(e) => update('email', e.target.value)} placeholder="contact@company.com" />
          <FieldError error={errors.email} />
        </div>
        <div>
          <label className="label-field">Industry <span className="text-red-500">*</span></label>
          <select className="input-field" value={data.industry} onChange={(e) => update('industry', e.target.value)}>
            <option value="">Select industry</option>
            {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <FieldError error={errors.industry} />
        </div>
        <div>
          <label className="label-field">Authorized Signatory <span className="text-red-500">*</span></label>
          <input className="input-field" value={data.authorizedSignatory} onChange={(e) => update('authorizedSignatory', e.target.value)} placeholder="Full name of authorized person" />
          <FieldError error={errors.authorizedSignatory} />
        </div>
      </div>
    </div>
  );
}

/* ─── Step 2: Employee Info ─── */
function EmployeeStep({ data, onChange, errors }) {
  const update = (field, value) => onChange({ ...data, [field]: value });
  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Photo must be under 2 MB.'); return; }
    update('photo', await fileToBase64(file));
  };

  return (
    <div>
      <SectionHeader title="Updated Employee Information" subtitle="Confirm or update the employee's personal details." />
      <div className="mb-6">
        <label className="label-field">Passport-Size Photograph</label>
        <div className="flex items-center gap-4">
          <div className="w-24 h-28 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
            {data.photo ? <img src={data.photo} alt="Employee" className="w-full h-full object-cover" /> : <Camera size={28} className="text-gray-400" />}
          </div>
          <div>
            <label className="btn-outline text-sm cursor-pointer"><Upload size={14} /> {data.photo ? 'Change Photo' : 'Upload Photo'}
              <input type="file" className="hidden" accept="image/*" onChange={handlePhoto} />
            </label>
            {data.photo && <button onClick={() => update('photo', null)} className="block text-xs text-red-500 mt-2 hover:underline">Remove photo</button>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="label-field">Full Name (as on passport) <span className="text-red-500">*</span></label>
          <input className="input-field" value={data.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="First Middle Last" />
          <FieldError error={errors.fullName} />
        </div>
        <div>
          <label className="label-field">Nationality <span className="text-red-500">*</span></label>
          <input className="input-field" value={data.nationality} onChange={(e) => update('nationality', e.target.value)} />
          <FieldError error={errors.nationality} />
        </div>
        <div>
          <label className="label-field">Date of Birth <span className="text-red-500">*</span></label>
          <input type="date" className="input-field" value={data.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} />
          <FieldError error={errors.dateOfBirth} />
        </div>
        <div>
          <label className="label-field">Passport Number <span className="text-red-500">*</span></label>
          <input className="input-field" value={data.passportNumber} onChange={(e) => update('passportNumber', e.target.value)} />
          <FieldError error={errors.passportNumber} />
        </div>
        <div>
          <label className="label-field">Passport Expiry Date <span className="text-red-500">*</span></label>
          <input type="date" className="input-field" value={data.passportExpiry} onChange={(e) => update('passportExpiry', e.target.value)} />
          <FieldError error={errors.passportExpiry} />
        </div>
        <div>
          <label className="label-field">Gender <span className="text-red-500">*</span></label>
          <select className="input-field" value={data.gender} onChange={(e) => update('gender', e.target.value)}>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <FieldError error={errors.gender} />
        </div>
        <div>
          <label className="label-field">Marital Status <span className="text-red-500">*</span></label>
          <select className="input-field" value={data.maritalStatus} onChange={(e) => update('maritalStatus', e.target.value)}>
            <option value="">Select status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
          <FieldError error={errors.maritalStatus} />
        </div>
        <div className="md:col-span-2">
          <label className="label-field">Current Address <span className="text-red-500">*</span></label>
          <input className="input-field" value={data.currentAddress} onChange={(e) => update('currentAddress', e.target.value)} />
          <FieldError error={errors.currentAddress} />
        </div>
        <div>
          <label className="label-field">Phone Number <span className="text-red-500">*</span></label>
          <input className="input-field" value={data.phone} onChange={(e) => update('phone', e.target.value)} />
          <FieldError error={errors.phone} />
        </div>
        <div>
          <label className="label-field">Email Address <span className="text-red-500">*</span></label>
          <input type="email" className="input-field" value={data.email} onChange={(e) => update('email', e.target.value)} />
          <FieldError error={errors.email} />
        </div>
      </div>
    </div>
  );
}

/* ─── Step 3: Position Details ─── */
function PositionStep({ data, onChange, errors }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  return (
    <div>
      <SectionHeader title="Position Details" subtitle="Confirm the position details. Indicate if there have been any changes." />

      <div className="mb-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={data.positionChanged} onChange={(e) => update('positionChanged', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#003366]" />
          <span className="text-sm font-medium text-gray-700">The position, duties, or salary have changed since the original permit</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="label-field">Job Title <span className="text-red-500">*</span></label>
          <input className="input-field" value={data.jobTitle} onChange={(e) => update('jobTitle', e.target.value)} />
          <FieldError error={errors.jobTitle} />
        </div>
        <div>
          <label className="label-field">Department <span className="text-red-500">*</span></label>
          <input className="input-field" value={data.department} onChange={(e) => update('department', e.target.value)} />
          <FieldError error={errors.department} />
        </div>
        <div className="md:col-span-2">
          <label className="label-field">Job Description <span className="text-red-500">*</span></label>
          <textarea className="input-field min-h-[100px]" value={data.jobDescription} onChange={(e) => update('jobDescription', e.target.value)} />
          <FieldError error={errors.jobDescription} />
        </div>
        <div>
          <label className="label-field">Work Location (Island) <span className="text-red-500">*</span></label>
          <select className="input-field" value={data.workLocation} onChange={(e) => update('workLocation', e.target.value)}>
            <option value="">Select island</option>
            {ISLANDS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <FieldError error={errors.workLocation} />
        </div>
        <div>
          <label className="label-field">Renewal Start Date <span className="text-red-500">*</span></label>
          <input type="date" className="input-field" value={data.startDate} onChange={(e) => update('startDate', e.target.value)} />
          <FieldError error={errors.startDate} />
        </div>
        <div>
          <label className="label-field">Annual Salary (USD) <span className="text-red-500">*</span></label>
          <input type="number" className="input-field" value={data.annualSalary} onChange={(e) => update('annualSalary', e.target.value)} min="0" />
          <FieldError error={errors.annualSalary} />
        </div>
        <div>
          <label className="label-field">Working Hours (per week) <span className="text-red-500">*</span></label>
          <input type="number" className="input-field" value={data.workingHours} onChange={(e) => update('workingHours', e.target.value)} min="1" max="60" />
          <FieldError error={errors.workingHours} />
        </div>
      </div>
    </div>
  );
}

/* ─── Step 4: Documents ─── */
function DocumentsStep({ documents, onChange }) {
  const handleUpload = async (docId, file) => {
    if (file.size > 5 * 1024 * 1024) { alert('File must be under 5 MB.'); return; }
    const base64 = await fileToBase64(file);
    onChange({ ...documents, [docId]: { name: file.name, size: file.size, data: base64, uploadedAt: new Date().toISOString() } });
  };
  const handleRemove = (docId) => { const next = { ...documents }; delete next[docId]; onChange(next); };
  const requiredDocs = RENEWAL_DOCS.filter(d => d.required);
  const optionalDocs = RENEWAL_DOCS.filter(d => !d.required);
  const requiredCount = requiredDocs.filter(d => documents[d.id]).length;

  return (
    <div>
      <SectionHeader title="Renewal Documents" subtitle="Upload updated documents for the renewal application." />
      <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-3">
        <Info size={20} className="text-[#003366]" />
        <span className="text-sm text-gray-700"><span className="font-semibold text-[#003366]">{requiredCount} of {requiredDocs.length}</span> required documents uploaded.</span>
      </div>

      <div className="space-y-3 mb-8">
        {requiredDocs.map(doc => (
          <DocRow key={doc.id} doc={doc} uploaded={documents[doc.id]} onUpload={(f) => handleUpload(doc.id, f)} onRemove={() => handleRemove(doc.id)} />
        ))}
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Optional Documents</h3>
      <div className="space-y-3">
        {optionalDocs.map(doc => (
          <DocRow key={doc.id} doc={doc} uploaded={documents[doc.id]} onUpload={(f) => handleUpload(doc.id, f)} onRemove={() => handleRemove(doc.id)} />
        ))}
      </div>
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

/* ─── Step 5: Review ─── */
function ReviewStep({ formData, fee, termsAccepted, onTermsChange }) {
  const { currentPermit, employee, position, documents } = formData;
  const uploadedDocs = RENEWAL_DOCS.filter(d => documents[d.id]);
  const missingRequired = RENEWAL_DOCS.filter(d => d.required && !documents[d.id]);

  return (
    <div>
      <SectionHeader title="Review & Submit" subtitle="Review your renewal application before submitting." />

      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3">Current Permit & Employer</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <RField label="Permit Number" value={currentPermit.permitNumber} />
          <RField label="Company" value={currentPermit.companyName} />
          <RField label="Trade License" value={currentPermit.tradeLicense} />
          <RField label="Industry" value={currentPermit.industry} />
          <RField label="Phone" value={currentPermit.phone} />
          <RField label="Signatory" value={currentPermit.authorizedSignatory} />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3">Employee Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <RField label="Full Name" value={employee.fullName} />
          <RField label="Nationality" value={employee.nationality} />
          <RField label="Passport" value={employee.passportNumber} />
          <RField label="Gender" value={employee.gender} />
          <RField label="Phone" value={employee.phone} />
          <RField label="Email" value={employee.email} />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3">Position Details</h3>
        {position.positionChanged && (
          <div className="p-2 rounded bg-yellow-50 border border-yellow-200 text-sm text-yellow-800 mb-3 flex items-center gap-2"><AlertCircle size={14} /> Position details have been updated from the original permit.</div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <RField label="Job Title" value={position.jobTitle} />
          <RField label="Department" value={position.department} />
          <RField label="Location" value={position.workLocation} />
          <RField label="Salary" value={position.annualSalary ? formatCurrency(position.annualSalary) : ''} />
          <RField label="Hours" value={position.workingHours ? `${position.workingHours} hrs/week` : ''} />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3">Documents ({uploadedDocs.length} uploaded)</h3>
        {missingRequired.length > 0 && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 mb-3">
            <p className="text-sm text-red-700 font-medium flex items-center gap-2"><AlertCircle size={14} /> Missing required documents:</p>
            <ul className="text-sm text-red-600 mt-1 space-y-0.5 ml-5">{missingRequired.map(d => <li key={d.id}>{d.label}</li>)}</ul>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {uploadedDocs.map(d => <div key={d.id} className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded px-3 py-1.5"><Check size={14} /> {d.label}</div>)}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3">Fee Calculation</h3>
        <div className="card bg-gray-50 border-gray-200">
          {fee.breakdown.map((tier, i) => (
            <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-200 last:border-0">
              <span className="text-gray-600">{tier.tier} {tier.rate && `@ ${tier.rate}`}</span>
              <span className="font-medium">{formatCurrency(tier.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm py-1.5 border-t border-gray-300 mt-2">
            <span className="text-gray-600">Permit Fee</span>
            <span className="font-medium">{formatCurrency(fee.permitFee)}</span>
          </div>
          <div className="flex justify-between text-sm py-1.5">
            <span className="text-gray-600">Application Fee</span>
            <span className="font-medium">{formatCurrency(fee.applicationFee)}</span>
          </div>
          <div className="flex justify-between text-base font-bold py-2 border-t-2 border-[#003366] mt-2 text-[#003366]">
            <span>Total</span><span>{formatCurrency(fee.total)}</span>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-gray-200 bg-white">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={termsAccepted} onChange={(e) => onTermsChange(e.target.checked)} className="mt-1 w-4 h-4 rounded border-gray-300 text-[#003366]" />
          <span className="text-sm text-gray-700 leading-relaxed">I certify that the information provided is true and accurate. I understand that providing false information may result in denial or revocation. I agree to comply with all applicable BVI laws and regulations.</span>
        </label>
      </div>
    </div>
  );
}

function RField({ label, value }) {
  return <div className="py-1"><p className="text-xs text-gray-500">{label}</p><p className="font-medium text-gray-800">{value || '-'}</p></div>;
}

/* ─── Validators ─── */
function validateStep1(data) {
  const e = {};
  if (!data.permitNumber.trim()) e.permitNumber = 'Current permit number is required.';
  if (!data.companyName.trim()) e.companyName = 'Company name is required.';
  if (!data.tradeLicense.trim()) e.tradeLicense = 'Trade license is required.';
  if (!data.address.trim()) e.address = 'Address is required.';
  if (!data.phone.trim()) e.phone = 'Phone is required.';
  else if (!validatePhone(data.phone)) e.phone = 'Enter a valid phone number.';
  if (!data.email.trim()) e.email = 'Email is required.';
  else if (!validateEmail(data.email)) e.email = 'Enter a valid email.';
  if (!data.industry) e.industry = 'Select an industry.';
  if (!data.authorizedSignatory.trim()) e.authorizedSignatory = 'Required.';
  return e;
}

function validateStep2(data) {
  const e = {};
  if (!data.fullName.trim()) e.fullName = 'Full name is required.';
  if (!data.nationality.trim()) e.nationality = 'Nationality is required.';
  if (!data.dateOfBirth) e.dateOfBirth = 'Date of birth is required.';
  if (!data.passportNumber.trim()) e.passportNumber = 'Passport number is required.';
  if (!data.passportExpiry) e.passportExpiry = 'Passport expiry is required.';
  if (!data.gender) e.gender = 'Gender is required.';
  if (!data.maritalStatus) e.maritalStatus = 'Marital status is required.';
  if (!data.currentAddress.trim()) e.currentAddress = 'Address is required.';
  if (!data.phone.trim()) e.phone = 'Phone is required.';
  else if (!validatePhone(data.phone)) e.phone = 'Enter a valid phone.';
  if (!data.email.trim()) e.email = 'Email is required.';
  else if (!validateEmail(data.email)) e.email = 'Enter a valid email.';
  return e;
}

function validateStep3(data) {
  const e = {};
  if (!data.jobTitle.trim()) e.jobTitle = 'Job title is required.';
  if (!data.jobDescription.trim()) e.jobDescription = 'Job description is required.';
  if (!data.department.trim()) e.department = 'Department is required.';
  if (!data.workLocation) e.workLocation = 'Select a work location.';
  if (!data.startDate) e.startDate = 'Start date is required.';
  if (!data.annualSalary || parseFloat(data.annualSalary) <= 0) e.annualSalary = 'Enter a valid salary.';
  if (!data.workingHours || parseFloat(data.workingHours) <= 0) e.workingHours = 'Enter valid working hours.';
  return e;
}

/* ─── Main Component ─── */
export default function RenewalForm() {
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
    const draft = getStorage(DRAFT_KEY);
    if (draft) setFormData(draft);
  }, []);

  const saveDraft = useCallback(() => { setStorage(DRAFT_KEY, formData); }, [formData]);
  useEffect(() => { const t = setTimeout(saveDraft, 1000); return () => clearTimeout(t); }, [saveDraft]);

  const updateSection = (section) => (data) => setFormData(prev => ({ ...prev, [section]: data }));

  const validateCurrentStep = () => {
    let stepErrors = {};
    if (currentStep === 1) stepErrors = validateStep1(formData.currentPermit);
    else if (currentStep === 2) stepErrors = validateStep2(formData.employee);
    else if (currentStep === 3) stepErrors = validateStep3(formData.position);
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) { setCurrentStep(s => Math.min(s + 1, 5)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };
  const prevStep = () => { setErrors({}); setCurrentStep(s => Math.max(s - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleSaveDraft = () => { saveDraft(); alert('Draft saved successfully.'); };

  const fee = calculateWorkPermitFee(formData.position.annualSalary);

  const handleSubmit = () => {
    if (!formData.termsAccepted) { alert('Please accept the terms before submitting.'); return; }
    const missing = RENEWAL_DOCS.filter(d => d.required && !formData.documents[d.id]);
    if (missing.length > 0) { alert(`Please upload all required documents:\n${missing.map(d => d.label).join('\n')}`); return; }

    setSubmitting(true);
    setTimeout(() => {
      const permit = submitPermit({
        type: 'renewal',
        userId: user?.id,
        employerId: user?.id,
        previousPermitNumber: formData.currentPermit.permitNumber,
        employer: formData.currentPermit,
        employee: formData.employee,
        position: formData.position,
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Renewal Submitted</h2>
        <p className="text-gray-600 mb-2">Your work permit renewal has been submitted successfully.</p>
        <div className="card bg-green-50 border-green-200 my-6 text-left">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Permit Number</span><span className="font-bold text-[#003366]">{submitted.permitNumber}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Previous Permit</span><span className="font-medium">{formData.currentPermit.permitNumber}</span></div>
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
        <h1 className="page-title">Work Permit Renewal</h1>
        <p className="text-gray-600">Renew an existing work permit. Required fields are marked with <span className="text-red-500">*</span>.</p>
      </div>

      <Stepper currentStep={currentStep} steps={STEPS} />

      <div className="card mb-6">
        {currentStep === 1 && <CurrentPermitStep data={formData.currentPermit} onChange={updateSection('currentPermit')} errors={errors} />}
        {currentStep === 2 && <EmployeeStep data={formData.employee} onChange={updateSection('employee')} errors={errors} />}
        {currentStep === 3 && <PositionStep data={formData.position} onChange={updateSection('position')} errors={errors} />}
        {currentStep === 4 && <DocumentsStep documents={formData.documents} onChange={updateSection('documents')} />}
        {currentStep === 5 && <ReviewStep formData={formData} fee={fee} termsAccepted={formData.termsAccepted} onTermsChange={(v) => setFormData(p => ({ ...p, termsAccepted: v }))} />}
      </div>

      <div className="flex items-center justify-between">
        <div>{currentStep > 1 && <button onClick={prevStep} className="btn-outline"><ChevronLeft size={16} /> Previous</button>}</div>
        <div className="flex items-center gap-3">
          <button onClick={handleSaveDraft} className="btn-outline text-sm"><Save size={14} /> Save Draft</button>
          {currentStep < 5 ? (
            <button onClick={nextStep} className="btn-primary">Next <ChevronRight size={16} /></button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting || !formData.termsAccepted} className="btn-success">
              {submitting ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Submitting...</> : <><Send size={16} /> Submit Renewal</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
