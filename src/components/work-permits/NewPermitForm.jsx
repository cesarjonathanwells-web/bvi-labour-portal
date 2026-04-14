import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
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
  Camera,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getPortalBasePath } from '../../utils/helpers';
import { ISLANDS, DOCUMENT_TYPES, JOB_CATEGORIES } from '../../data/constants';
import { calculateWorkPermitFee, formatCurrency } from '../../utils/feeCalculator';
import {
  validateEmail,
  validatePhone,
  fileToBase64,
  getStorage,
  setStorage,
} from '../../utils/helpers';
import { buildEmployerPrefill, mergePrefill, isTradeLicenceVerified, getPreviousDocuments } from '../../utils/prefill';
import MockBadge from '../common/MockBadge';

const INTEGRATION_DOC_IDS = new Set(['ssb_clearance', 'ird_clearance', 'nhi_clearance', 'police_clearance', 'medical']);

const DRAFT_KEY = 'bvi_permit_draft_new';

const STEPS = [
  { id: 1, label: 'Employer Info', icon: Building2 },
  { id: 2, label: 'Employee Info', icon: User },
  { id: 3, label: 'Position Details', icon: Briefcase },
  { id: 4, label: 'Documents', icon: FileUp },
  { id: 5, label: 'Review & Fee', icon: ClipboardCheck },
];

const INITIAL_STATE = {
  employer: {
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
    <nav aria-label="Application progress" className="mb-8">
      <div className="flex items-center justify-between" role="list">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isComplete = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-0" role="listitem">
              <div className="flex flex-col items-center">
                <div
                  className={
                    isComplete
                      ? 'stepper-complete'
                      : isActive
                        ? 'stepper-active'
                        : 'stepper-inactive'
                  }
                  aria-label={`Step ${step.id}: ${step.label}${isComplete ? ' (completed)' : isActive ? ' (current)' : ''}`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isComplete ? <Check size={18} /> : <Icon size={18} />}
                </div>
                <span
                  className={`text-xs mt-2 text-center hidden sm:block ${
                    isActive
                      ? 'text-[#003366] font-semibold'
                      : isComplete
                        ? 'text-green-700 font-medium'
                        : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                  aria-hidden="true"
                />
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
  return (
    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
      <AlertCircle size={12} /> {error}
    </p>
  );
}

function HelpText({ children }) {
  return (
    <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
      <Info size={11} className="shrink-0" /> {children}
    </p>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-6 pb-4 border-b border-gray-200">
      <h2 className="text-xl font-bold text-[#003366]">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

/* ─── Step 1: Employer Info ─── */
function EmployerStep({ data, onChange, errors, prefilledFromAccount, licenceVerified }) {
  const update = (field, value) =>
    onChange({ ...data, [field]: value });

  return (
    <div>
      <SectionHeader
        title="Employer Information"
        subtitle="Provide details about the sponsoring employer."
      />
      {prefilledFromAccount && (
        <div className="mb-5 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-[#003366]">
          <Info size={16} className="flex-shrink-0 mt-0.5" />
          <p>
            We&apos;ve pre-filled these fields from your registered business profile. Update any details that have changed before submitting.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="label-field">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            className="input-field"
            value={data.companyName}
            onChange={(e) => update('companyName', e.target.value)}
            placeholder="e.g. BVI Holdings Ltd"
          />
          <FieldError error={errors.companyName} />
        </div>
        <div>
          <label className="label-field">
            Trade License Number <span className="text-red-500">*</span>
            {licenceVerified && (
              <MockBadge
                variant="verified"
                label="IRD Verified (Mock)"
                title="Mocked: cross-referenced against your registered Trade Licence. Phase 2 will call the real IRD Trade Licence registry API."
                className="ml-2"
              />
            )}
          </label>
          <input
            className="input-field"
            value={data.tradeLicense}
            onChange={(e) => update('tradeLicense', e.target.value)}
            placeholder="e.g. TL-2024-12345"
          />
          <FieldError error={errors.tradeLicense} />
        </div>
        <div className="md:col-span-2">
          <label className="label-field">
            Business Address <span className="text-red-500">*</span>
          </label>
          <input
            className="input-field"
            value={data.address}
            onChange={(e) => update('address', e.target.value)}
            placeholder="Street address, city, island"
          />
          <FieldError error={errors.address} />
        </div>
        <div>
          <label className="label-field">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            className="input-field"
            value={data.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="1(284) 000-0000"
          />
          <FieldError error={errors.phone} />
        </div>
        <div>
          <label className="label-field">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            className="input-field"
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="contact@company.com"
          />
          <FieldError error={errors.email} />
        </div>
        <div>
          <label className="label-field">
            Industry <span className="text-red-500">*</span>
          </label>
          <select
            className="input-field"
            value={data.industry}
            onChange={(e) => update('industry', e.target.value)}
          >
            <option value="">Select industry</option>
            {JOB_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <FieldError error={errors.industry} />
        </div>
        <div>
          <label className="label-field">
            Authorized Signatory <span className="text-red-500">*</span>
          </label>
          <input
            className="input-field"
            value={data.authorizedSignatory}
            onChange={(e) => update('authorizedSignatory', e.target.value)}
            placeholder="Full name of authorized person"
          />
          <HelpText>
            Person authorized to sign on behalf of the company.
          </HelpText>
          <FieldError error={errors.authorizedSignatory} />
        </div>
      </div>
    </div>
  );
}

/* ─── Step 2: Employee Info ─── */
function EmployeeStep({ data, onChange, errors }) {
  const update = (field, value) =>
    onChange({ ...data, [field]: value });

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be under 2 MB.');
      return;
    }
    const base64 = await fileToBase64(file);
    update('photo', base64);
  };

  return (
    <div>
      <SectionHeader
        title="Employee Information"
        subtitle="Details of the foreign national to be employed."
      />

      {/* Photo upload */}
      <div className="mb-6">
        <label className="label-field">Passport-Size Photograph</label>
        <div className="flex items-center gap-4">
          <div className="w-24 h-28 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
            {data.photo ? (
              <img
                src={data.photo}
                alt="Employee"
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera size={28} className="text-gray-400" />
            )}
          </div>
          <div>
            <label className="btn-outline text-sm cursor-pointer">
              <Upload size={14} />
              {data.photo ? 'Change Photo' : 'Upload Photo'}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handlePhoto}
              />
            </label>
            {data.photo && (
              <button
                onClick={() => update('photo', null)}
                className="block text-xs text-red-500 mt-2 hover:underline"
              >
                Remove photo
              </button>
            )}
            <p className="text-xs text-gray-500 mt-1">
              JPG or PNG, max 2 MB.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="label-field">
            Full Name (as on passport) <span className="text-red-500">*</span>
          </label>
          <input
            className="input-field"
            value={data.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            placeholder="First Middle Last"
          />
          <FieldError error={errors.fullName} />
        </div>
        <div>
          <label className="label-field">
            Nationality <span className="text-red-500">*</span>
          </label>
          <input
            className="input-field"
            value={data.nationality}
            onChange={(e) => update('nationality', e.target.value)}
            placeholder="e.g. Jamaican"
          />
          <FieldError error={errors.nationality} />
        </div>
        <div>
          <label className="label-field">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className="input-field"
            value={data.dateOfBirth}
            onChange={(e) => update('dateOfBirth', e.target.value)}
          />
          <FieldError error={errors.dateOfBirth} />
        </div>
        <div>
          <label className="label-field">
            Passport Number <span className="text-red-500">*</span>
          </label>
          <input
            className="input-field"
            value={data.passportNumber}
            onChange={(e) => update('passportNumber', e.target.value)}
            placeholder="e.g. A12345678"
          />
          <FieldError error={errors.passportNumber} />
        </div>
        <div>
          <label className="label-field">
            Passport Expiry Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className="input-field"
            value={data.passportExpiry}
            onChange={(e) => update('passportExpiry', e.target.value)}
          />
          <HelpText>Must be valid for at least 6 months.</HelpText>
          <FieldError error={errors.passportExpiry} />
        </div>
        <div>
          <label className="label-field">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            className="input-field"
            value={data.gender}
            onChange={(e) => update('gender', e.target.value)}
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <FieldError error={errors.gender} />
        </div>
        <div>
          <label className="label-field">
            Marital Status <span className="text-red-500">*</span>
          </label>
          <select
            className="input-field"
            value={data.maritalStatus}
            onChange={(e) => update('maritalStatus', e.target.value)}
          >
            <option value="">Select status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
          <FieldError error={errors.maritalStatus} />
        </div>
        <div className="md:col-span-2">
          <label className="label-field">
            Current Address <span className="text-red-500">*</span>
          </label>
          <input
            className="input-field"
            value={data.currentAddress}
            onChange={(e) => update('currentAddress', e.target.value)}
            placeholder="Full residential address"
          />
          <FieldError error={errors.currentAddress} />
        </div>
        <div>
          <label className="label-field">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            className="input-field"
            value={data.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="Contact phone number"
          />
          <FieldError error={errors.phone} />
        </div>
        <div>
          <label className="label-field">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            className="input-field"
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="employee@email.com"
          />
          <FieldError error={errors.email} />
        </div>
      </div>
    </div>
  );
}

/* ─── Step 3: Position Details ─── */
function PositionStep({ data, onChange, errors }) {
  const update = (field, value) =>
    onChange({ ...data, [field]: value });

  return (
    <div>
      <SectionHeader
        title="Position Details"
        subtitle="Details about the role the employee will fill."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="label-field">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            className="input-field"
            value={data.jobTitle}
            onChange={(e) => update('jobTitle', e.target.value)}
            placeholder="e.g. Senior Accountant"
          />
          <FieldError error={errors.jobTitle} />
        </div>
        <div>
          <label className="label-field">
            Department <span className="text-red-500">*</span>
          </label>
          <input
            className="input-field"
            value={data.department}
            onChange={(e) => update('department', e.target.value)}
            placeholder="e.g. Finance"
          />
          <FieldError error={errors.department} />
        </div>
        <div className="md:col-span-2">
          <label className="label-field">
            Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            className="input-field min-h-[100px]"
            value={data.jobDescription}
            onChange={(e) => update('jobDescription', e.target.value)}
            placeholder="Describe the duties and responsibilities of this position..."
          />
          <FieldError error={errors.jobDescription} />
        </div>
        <div>
          <label className="label-field">
            Work Location (Island) <span className="text-red-500">*</span>
          </label>
          <select
            className="input-field"
            value={data.workLocation}
            onChange={(e) => update('workLocation', e.target.value)}
          >
            <option value="">Select island</option>
            {ISLANDS.map((island) => (
              <option key={island} value={island}>
                {island}
              </option>
            ))}
          </select>
          <FieldError error={errors.workLocation} />
        </div>
        <div>
          <label className="label-field">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className="input-field"
            value={data.startDate}
            onChange={(e) => update('startDate', e.target.value)}
          />
          <FieldError error={errors.startDate} />
        </div>
        <div>
          <label className="label-field">
            Annual Salary (USD) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            className="input-field"
            value={data.annualSalary}
            onChange={(e) => update('annualSalary', e.target.value)}
            placeholder="e.g. 45000"
            min="0"
          />
          <HelpText>Used to calculate permit fees.</HelpText>
          <FieldError error={errors.annualSalary} />
        </div>
        <div>
          <label className="label-field">
            Working Hours (per week) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            className="input-field"
            value={data.workingHours}
            onChange={(e) => update('workingHours', e.target.value)}
            placeholder="e.g. 40"
            min="1"
            max="60"
          />
          <FieldError error={errors.workingHours} />
        </div>
        <div className="md:col-span-2">
          <label className="label-field">Qualifications Required</label>
          <textarea
            className="input-field min-h-[80px]"
            value={data.qualificationsRequired}
            onChange={(e) => update('qualificationsRequired', e.target.value)}
            placeholder="List required qualifications, certifications, or experience..."
          />
          <HelpText>
            Specify any qualifications necessary for this position.
          </HelpText>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 4: Documents ─── */
function DocumentsStep({ documents, onChange, previousDocs = {} }) {
  const handleUpload = async (docId, file) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File must be under 5 MB.');
      return;
    }
    const base64 = await fileToBase64(file);
    onChange({
      ...documents,
      [docId]: { name: file.name, size: file.size, data: base64, uploadedAt: new Date().toISOString() },
    });
  };

  const handleReuse = (docId) => {
    const prev = previousDocs[docId];
    if (!prev) return;
    onChange({
      ...documents,
      [docId]: {
        name: prev.fileName || prev.name,
        size: prev.fileSize || prev.size || 0,
        uploadedAt: prev.uploadedAt,
        reusedFrom: prev.id,
      },
    });
  };

  const handleReuseAll = () => {
    const next = { ...documents };
    for (const docId of Object.keys(previousDocs)) {
      if (next[docId]) continue;
      const prev = previousDocs[docId];
      next[docId] = {
        name: prev.fileName || prev.name,
        size: prev.fileSize || prev.size || 0,
        uploadedAt: prev.uploadedAt,
        reusedFrom: prev.id,
      };
    }
    onChange(next);
  };

  const handleRemove = (docId) => {
    const next = { ...documents };
    delete next[docId];
    onChange(next);
  };

  const requiredDocs = DOCUMENT_TYPES.filter((d) => d.required);
  const optionalDocs = DOCUMENT_TYPES.filter((d) => !d.required);
  const uploadedCount = Object.keys(documents).length;
  const requiredCount = requiredDocs.filter((d) => documents[d.id]).length;
  const reusableCount = DOCUMENT_TYPES.filter(
    (d) => previousDocs[d.id] && !documents[d.id]
  ).length;

  return (
    <div>
      <SectionHeader
        title="Required Documents"
        subtitle="Upload all required documents. Accepted formats: PDF, JPG, PNG (max 5 MB each)."
      />

      <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-3">
        <div className="text-[#003366]">
          <Info size={20} />
        </div>
        <div className="text-sm text-gray-700">
          <span className="font-semibold text-[#003366]">
            {requiredCount} of {requiredDocs.length}
          </span>{' '}
          required documents uploaded.{' '}
          {uploadedCount > requiredCount &&
            `${uploadedCount - requiredCount} optional document(s) also attached.`}
        </div>
      </div>

      {reusableCount > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-green-900">
            <FileUp size={16} className="flex-shrink-0" />
            <span>
              <span className="font-semibold">{reusableCount}</span> document{reusableCount === 1 ? '' : 's'} on file from a previous application can be reused.
            </span>
          </div>
          <button
            type="button"
            onClick={handleReuseAll}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
          >
            Reuse all
          </button>
        </div>
      )}

      <div className="space-y-3 mb-8">
        {requiredDocs.map((doc) => (
          <DocumentRow
            key={doc.id}
            doc={doc}
            uploaded={documents[doc.id]}
            previous={previousDocs[doc.id]}
            onUpload={(file) => handleUpload(doc.id, file)}
            onReuse={() => handleReuse(doc.id)}
            onRemove={() => handleRemove(doc.id)}
          />
        ))}
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Optional Documents
      </h3>
      <div className="space-y-3">
        {optionalDocs.map((doc) => (
          <DocumentRow
            key={doc.id}
            doc={doc}
            uploaded={documents[doc.id]}
            previous={previousDocs[doc.id]}
            onUpload={(file) => handleUpload(doc.id, file)}
            onReuse={() => handleReuse(doc.id)}
            onRemove={() => handleRemove(doc.id)}
          />
        ))}
      </div>
    </div>
  );
}

function DocumentRow({ doc, uploaded, previous, onUpload, onReuse, onRemove }) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        uploaded
          ? 'bg-green-50 border-green-200'
          : doc.required
            ? 'bg-white border-gray-200'
            : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
          uploaded ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
        }`}
      >
        {uploaded ? <Check size={14} /> : <FileUp size={14} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 flex items-center flex-wrap gap-2">
          <span>{doc.label}{doc.required && <span className="text-red-500 ml-1">*</span>}</span>
          {INTEGRATION_DOC_IDS.has(doc.id) && (
            <MockBadge
              variant="phase2"
              label="Phase 2 auto-verify"
              title="Currently accepts an uploaded PDF. Phase 2 will request this certificate directly from the issuing authority."
            />
          )}
        </p>
        {uploaded && (
          <p className="text-xs text-green-700 truncate">{uploaded.name}</p>
        )}
      </div>

      {uploaded ? (
        <>
          {uploaded.reusedFrom && (
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-semibold uppercase tracking-wide">
              Reused
            </span>
          )}
          <button
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 p-1"
            title="Remove"
            aria-label={`Remove ${doc.label}`}
          >
            <X size={16} />
          </button>
        </>
      ) : (
        <div className="flex items-center gap-2">
          {previous && (
            <button
              type="button"
              onClick={onReuse}
              className="text-xs font-semibold text-green-700 hover:text-green-800 px-2 py-1.5 rounded-md hover:bg-green-50"
              aria-label={`Reuse previously uploaded ${doc.label}`}
              title={`Reuse ${previous.fileName || previous.name}`}
            >
              Reuse previous
            </button>
          )}
          <label className="btn-outline text-xs cursor-pointer py-1.5 px-3" aria-label={`Upload ${doc.label}`}>
            <Upload size={12} /> Upload
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              aria-label={`Choose file for ${doc.label}`}
              onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
            />
          </label>
        </div>
      )}
    </div>
  );
}

/* ─── Step 5: Review & Fee ─── */
function ReviewStep({ formData, fee, termsAccepted, onTermsChange }) {
  const { employer, employee, position, documents } = formData;
  const uploadedDocs = DOCUMENT_TYPES.filter((d) => documents[d.id]);
  const missingRequired = DOCUMENT_TYPES.filter(
    (d) => d.required && !documents[d.id]
  );

  return (
    <div>
      <SectionHeader
        title="Review & Submit"
        subtitle="Review your application details before submitting."
      />

      {/* Employer summary */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3 flex items-center gap-2">
          <Building2 size={16} /> Employer Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <ReviewField label="Company" value={employer.companyName} />
          <ReviewField label="Trade License" value={employer.tradeLicense} />
          <ReviewField label="Industry" value={employer.industry} />
          <ReviewField label="Phone" value={employer.phone} />
          <ReviewField label="Email" value={employer.email} />
          <ReviewField label="Signatory" value={employer.authorizedSignatory} />
        </div>
      </div>

      {/* Employee summary */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3 flex items-center gap-2">
          <User size={16} /> Employee Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <ReviewField label="Full Name" value={employee.fullName} />
          <ReviewField label="Nationality" value={employee.nationality} />
          <ReviewField label="Date of Birth" value={employee.dateOfBirth} />
          <ReviewField label="Passport" value={employee.passportNumber} />
          <ReviewField label="Gender" value={employee.gender} />
          <ReviewField label="Marital Status" value={employee.maritalStatus} />
          <ReviewField label="Phone" value={employee.phone} />
          <ReviewField label="Email" value={employee.email} />
        </div>
      </div>

      {/* Position summary */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3 flex items-center gap-2">
          <Briefcase size={16} /> Position Details
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <ReviewField label="Job Title" value={position.jobTitle} />
          <ReviewField label="Department" value={position.department} />
          <ReviewField label="Location" value={position.workLocation} />
          <ReviewField label="Start Date" value={position.startDate} />
          <ReviewField
            label="Annual Salary"
            value={position.annualSalary ? formatCurrency(position.annualSalary) : ''}
          />
          <ReviewField
            label="Working Hours"
            value={position.workingHours ? `${position.workingHours} hrs/week` : ''}
          />
        </div>
      </div>

      {/* Documents summary */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileUp size={16} /> Documents ({uploadedDocs.length} uploaded)
        </h3>
        {missingRequired.length > 0 && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 mb-3">
            <p className="text-sm text-red-700 font-medium flex items-center gap-2">
              <AlertCircle size={14} /> Missing required documents:
            </p>
            <ul className="text-sm text-red-600 mt-1 space-y-0.5 ml-5">
              {missingRequired.map((d) => (
                <li key={d.id}>{d.label}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {uploadedDocs.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded px-3 py-1.5"
            >
              <Check size={14} /> {d.label}
            </div>
          ))}
        </div>
      </div>

      {/* Fee breakdown */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3">
          Fee Calculation
        </h3>
        <div className="card bg-gray-50 border-gray-200">
          {fee.breakdown.map((tier, i) => (
            <div
              key={i}
              className="flex justify-between text-sm py-1.5 border-b border-gray-200 last:border-0"
            >
              <span className="text-gray-600">
                {tier.tier} {tier.rate && `@ ${tier.rate}`}
              </span>
              <span className="font-medium">{formatCurrency(tier.amount)}</span>
            </div>
          ))}
          {fee.capped && (
            <p className="text-xs text-orange-600 mt-2">
              * Fee capped at {formatCurrency(10000)}
            </p>
          )}
          <div className="flex justify-between text-sm py-1.5 border-t border-gray-300 mt-2">
            <span className="text-gray-600">Permit Fee</span>
            <span className="font-medium">{formatCurrency(fee.permitFee)}</span>
          </div>
          <div className="flex justify-between text-sm py-1.5">
            <span className="text-gray-600">Application Fee</span>
            <span className="font-medium">
              {formatCurrency(fee.applicationFee)}
            </span>
          </div>
          <div className="flex justify-between text-base font-bold py-2 border-t-2 border-[#003366] mt-2 text-[#003366]">
            <span>Total</span>
            <span>{formatCurrency(fee.total)}</span>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="p-4 rounded-lg border border-gray-200 bg-white">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => onTermsChange(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300 text-[#003366] focus:ring-[#003366]"
          />
          <span className="text-sm text-gray-700 leading-relaxed">
            I certify that the information provided in this application is true
            and accurate to the best of my knowledge. I understand that providing
            false information may result in denial or revocation of the work
            permit. I agree to comply with all applicable laws and regulations of
            the British Virgin Islands.
          </span>
        </label>
      </div>
    </div>
  );
}

function ReviewField({ label, value }) {
  return (
    <div className="py-1">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value || '-'}</p>
    </div>
  );
}

/* ─── Validators ─── */
function validateStep1(data) {
  const e = {};
  if (!data.companyName.trim()) e.companyName = 'Company name is required.';
  if (!data.tradeLicense.trim()) e.tradeLicense = 'Trade license is required.';
  if (!data.address.trim()) e.address = 'Address is required.';
  if (!data.phone.trim()) e.phone = 'Phone is required.';
  else if (!validatePhone(data.phone)) e.phone = 'Enter a valid phone number.';
  if (!data.email.trim()) e.email = 'Email is required.';
  else if (!validateEmail(data.email)) e.email = 'Enter a valid email address.';
  if (!data.industry) e.industry = 'Select an industry.';
  if (!data.authorizedSignatory.trim())
    e.authorizedSignatory = 'Authorized signatory is required.';
  return e;
}

function validateStep2(data) {
  const e = {};
  if (!data.fullName.trim()) e.fullName = 'Full name is required.';
  if (!data.nationality.trim()) e.nationality = 'Nationality is required.';
  if (!data.dateOfBirth) e.dateOfBirth = 'Date of birth is required.';
  if (!data.passportNumber.trim())
    e.passportNumber = 'Passport number is required.';
  if (!data.passportExpiry) e.passportExpiry = 'Passport expiry is required.';
  if (!data.gender) e.gender = 'Gender is required.';
  if (!data.maritalStatus) e.maritalStatus = 'Marital status is required.';
  if (!data.currentAddress.trim())
    e.currentAddress = 'Current address is required.';
  if (!data.phone.trim()) e.phone = 'Phone is required.';
  else if (!validatePhone(data.phone)) e.phone = 'Enter a valid phone number.';
  if (!data.email.trim()) e.email = 'Email is required.';
  else if (!validateEmail(data.email)) e.email = 'Enter a valid email address.';
  return e;
}

function validateStep3(data) {
  const e = {};
  if (!data.jobTitle.trim()) e.jobTitle = 'Job title is required.';
  if (!data.jobDescription.trim())
    e.jobDescription = 'Job description is required.';
  if (!data.department.trim()) e.department = 'Department is required.';
  if (!data.workLocation) e.workLocation = 'Select a work location.';
  if (!data.startDate) e.startDate = 'Start date is required.';
  if (!data.annualSalary || parseFloat(data.annualSalary) <= 0)
    e.annualSalary = 'Enter a valid salary.';
  if (!data.workingHours || parseFloat(data.workingHours) <= 0)
    e.workingHours = 'Enter valid working hours.';
  return e;
}

/* ─── Main Component ─── */
export default function NewPermitForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { submitPermit } = useApp();
  const portalBase = getPortalBasePath(user?.portal);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const previousDocs = getPreviousDocuments(user);

  // Load draft on mount and prefill employer info from the logged-in account.
  // Registered companies don't need to retype what the system already knows —
  // fields are pre-populated and remain editable in case anything is out of date.
  useEffect(() => {
    const draft = getStorage(DRAFT_KEY);
    const base = draft || INITIAL_STATE;
    setFormData({
      ...base,
      employer: mergePrefill(base.employer, buildEmployerPrefill(user)),
    });
  }, [user]);

  // Auto-save draft
  const saveDraft = useCallback(() => {
    setStorage(DRAFT_KEY, formData);
  }, [formData]);

  useEffect(() => {
    const timer = setTimeout(saveDraft, 1000);
    return () => clearTimeout(timer);
  }, [saveDraft]);

  const updateSection = (section) => (data) =>
    setFormData((prev) => ({ ...prev, [section]: data }));

  const validateCurrentStep = () => {
    let stepErrors = {};
    if (currentStep === 1) stepErrors = validateStep1(formData.employer);
    else if (currentStep === 2) stepErrors = validateStep2(formData.employee);
    else if (currentStep === 3) stepErrors = validateStep3(formData.position);
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((s) => Math.min(s + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setErrors({});
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveDraft = () => {
    saveDraft();
    alert('Draft saved successfully. You can resume this application later.');
  };

  const fee = calculateWorkPermitFee(formData.position.annualSalary);

  const handleSubmit = () => {
    if (!formData.termsAccepted) {
      alert('Please accept the terms and conditions before submitting.');
      return;
    }
    const missingRequired = DOCUMENT_TYPES.filter(
      (d) => d.required && !formData.documents[d.id]
    );
    if (missingRequired.length > 0) {
      alert(
        `Please upload all required documents:\n${missingRequired.map((d) => d.label).join('\n')}`
      );
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const permit = submitPermit({
        type: 'new',
        userId: user?.id,
        employerId: user?.id,
        employer: formData.employer,
        employee: formData.employee,
        position: formData.position,
        documents: Object.keys(formData.documents).reduce((acc, key) => {
          acc[key] = {
            name: formData.documents[key].name,
            uploadedAt: formData.documents[key].uploadedAt,
          };
          return acc;
        }, {}),
        fee,
      });
      localStorage.removeItem(DRAFT_KEY);
      setSubmitted(permit);
      setSubmitting(false);
    }, 1500);
  };

  // Success screen
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <Check size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Application Submitted
        </h2>
        <p className="text-gray-600 mb-2">
          Your work permit application has been submitted successfully.
        </p>
        <div className="card bg-green-50 border-green-200 my-6 text-left">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Permit Number</span>
              <span className="font-bold text-[#003366]">
                {submitted.permitNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="badge-processing">Submitted</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Fee</span>
              <span className="font-medium">{formatCurrency(fee.total)}</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          You will receive notifications as your application is processed. Save
          your permit number for tracking.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(`${portalBase}/permits/status`)}
            className="btn-primary"
          >
            Track Application
          </button>
          <button
            onClick={() => navigate(`${portalBase}/permits`)}
            className="btn-outline"
          >
            Back to Permits
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">New Work Permit Application</h1>
        <p className="text-gray-600">
          Complete all five steps below. Required fields are marked with{' '}
          <span className="text-red-500">*</span>. Your progress is
          automatically saved.
        </p>
      </div>

      <Stepper currentStep={currentStep} steps={STEPS} />

      <div className="card mb-6">
        {currentStep === 1 && (
          <EmployerStep
            data={formData.employer}
            onChange={updateSection('employer')}
            errors={errors}
            prefilledFromAccount={user?.portal === 'business'}
            licenceVerified={isTradeLicenceVerified(formData.employer.tradeLicense, user)}
          />
        )}
        {currentStep === 2 && (
          <EmployeeStep
            data={formData.employee}
            onChange={updateSection('employee')}
            errors={errors}
          />
        )}
        {currentStep === 3 && (
          <PositionStep
            data={formData.position}
            onChange={updateSection('position')}
            errors={errors}
          />
        )}
        {currentStep === 4 && (
          <DocumentsStep
            documents={formData.documents}
            onChange={updateSection('documents')}
            previousDocs={previousDocs}
          />
        )}
        {currentStep === 5 && (
          <ReviewStep
            formData={formData}
            fee={fee}
            termsAccepted={formData.termsAccepted}
            onTermsChange={(val) =>
              setFormData((prev) => ({ ...prev, termsAccepted: val }))
            }
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {currentStep > 1 && (
            <button onClick={prevStep} className="btn-outline">
              <ChevronLeft size={16} /> Previous
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSaveDraft} className="btn-outline text-sm">
            <Save size={14} /> Save Draft
          </button>
          {currentStep < 5 ? (
            <button onClick={nextStep} className="btn-primary">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !formData.termsAccepted}
              className="btn-success"
            >
              {submitting ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={16} /> Submit Application
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
