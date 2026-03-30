import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building, Users, Search, ChevronRight, ChevronLeft, Check,
  AlertCircle, Eye, EyeOff, UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePhone } from '../../utils/helpers';
import { ROLES, ISLANDS, JOB_CATEGORIES, DEPARTMENT_INFO } from '../../data/constants';

const STEPS = ['Select Role', 'Personal Info', 'Role Details', 'Create Password', 'Review & Confirm'];

const ROLE_OPTIONS = [
  {
    value: ROLES.EMPLOYER,
    label: 'Employer',
    icon: Building,
    description: 'Hire workers, apply for work permits, and manage your workforce.',
    color: 'border-blue-300 bg-blue-50 hover:border-blue-500',
    activeColor: 'border-[#003366] bg-blue-100 ring-2 ring-[#003366]',
  },
  {
    value: ROLES.EMPLOYEE,
    label: 'Employee',
    icon: Users,
    description: 'Track your work permit status, file disputes, and manage documents.',
    color: 'border-green-300 bg-green-50 hover:border-green-500',
    activeColor: 'border-[#006633] bg-green-100 ring-2 ring-[#006633]',
  },
  {
    value: ROLES.JOBSEEKER,
    label: 'Job Seeker',
    icon: Search,
    description: 'Search for jobs, submit applications, and build your career profile.',
    color: 'border-orange-300 bg-orange-50 hover:border-orange-500',
    activeColor: 'border-orange-500 bg-orange-100 ring-2 ring-orange-500',
  },
];

const EDUCATION_LEVELS = [
  'High School / Secondary',
  'Associate Degree',
  "Bachelor's Degree",
  "Master's Degree",
  'Doctorate / PhD',
  'Trade / Vocational Certificate',
  'Other',
];

function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: '20%' };
  if (score === 2) return { label: 'Fair', color: 'bg-orange-500', width: '40%' };
  if (score === 3) return { label: 'Good', color: 'bg-yellow-500', width: '60%' };
  if (score === 4) return { label: 'Strong', color: 'bg-green-500', width: '80%' };
  return { label: 'Very Strong', color: 'bg-green-600', width: '100%' };
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    role: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    island: '',
    // employer
    companyName: '',
    tradeLicense: '',
    industry: '',
    // employee
    currentEmployer: '',
    permitNumber: '',
    // jobseeker
    skills: '',
    educationLevel: '',
    // password
    password: '',
    confirmPassword: '',
  });

  const update = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const validateStep = () => {
    switch (step) {
      case 0:
        if (!form.role) return 'Please select a role.';
        break;
      case 1:
        if (!form.firstName.trim()) return 'First name is required.';
        if (!form.lastName.trim()) return 'Last name is required.';
        if (!form.email.trim()) return 'Email is required.';
        if (!validateEmail(form.email)) return 'Please enter a valid email.';
        if (!form.phone.trim()) return 'Phone number is required.';
        if (!validatePhone(form.phone)) return 'Please enter a valid phone number.';
        if (!form.island) return 'Please select your island.';
        break;
      case 2:
        if (form.role === ROLES.EMPLOYER) {
          if (!form.companyName.trim()) return 'Company name is required.';
          if (!form.tradeLicense.trim()) return 'Trade license number is required.';
          if (!form.industry) return 'Please select an industry.';
        }
        if (form.role === ROLES.EMPLOYEE) {
          if (!form.currentEmployer.trim()) return 'Current employer is required.';
        }
        if (form.role === ROLES.JOBSEEKER) {
          if (!form.educationLevel) return 'Please select your education level.';
        }
        break;
      case 3:
        if (form.password.length < 8) return 'Password must be at least 8 characters.';
        if (form.password !== form.confirmPassword) return 'Passwords do not match.';
        break;
      default:
        break;
    }
    return '';
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = () => {
    setLoading(true);
    setError('');
    setTimeout(() => {
      const userData = {
        role: form.role,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        island: form.island,
        password: form.password,
        ...(form.role === ROLES.EMPLOYER && {
          companyName: form.companyName.trim(),
          tradeLicense: form.tradeLicense.trim(),
          industry: form.industry,
        }),
        ...(form.role === ROLES.EMPLOYEE && {
          currentEmployer: form.currentEmployer.trim(),
          permitNumber: form.permitNumber.trim(),
        }),
        ...(form.role === ROLES.JOBSEEKER && {
          skills: form.skills.trim(),
          educationLevel: form.educationLevel,
        }),
      };

      const result = register(userData);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
        setLoading(false);
      }
    }, 500);
  };

  const strength = getPasswordStrength(form.password);

  const renderStepper = () => (
    <div className="flex items-center justify-center gap-1 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={
              i < step ? 'stepper-complete' :
              i === step ? 'stepper-active' :
              'stepper-inactive'
            }>
              {i < step ? <Check size={16} /> : i + 1}
            </div>
            <span className={`text-[10px] mt-1 text-center leading-tight max-w-[60px] ${i === step ? 'text-[#003366] font-semibold' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-6 sm:w-10 h-0.5 mx-1 mt-[-14px] ${i < step ? 'bg-[#006633]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep0 = () => (
    <div>
      <h2 className="text-lg font-bold text-[#003366] mb-1">How will you use this portal?</h2>
      <p className="text-sm text-gray-500 mb-6">Select the role that best describes you.</p>
      <div className="grid gap-4">
        {ROLE_OPTIONS.map(opt => {
          const Icon = opt.icon;
          const selected = form.role === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setForm(prev => ({ ...prev, role: opt.value })); setError(''); }}
              className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${selected ? opt.activeColor : opt.color}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? 'bg-[#003366] text-white' : 'bg-white text-gray-600'}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{opt.label}</p>
                <p className="text-sm text-gray-500 mt-0.5">{opt.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div>
      <h2 className="text-lg font-bold text-[#003366] mb-1">Personal Information</h2>
      <p className="text-sm text-gray-500 mb-6">Tell us about yourself.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label-field">First Name *</label>
          <input className="input-field" value={form.firstName} onChange={update('firstName')} placeholder="John" />
        </div>
        <div>
          <label className="label-field">Last Name *</label>
          <input className="input-field" value={form.lastName} onChange={update('lastName')} placeholder="Smith" />
        </div>
      </div>
      <div className="mt-4">
        <label className="label-field">Email Address *</label>
        <input className="input-field" type="email" value={form.email} onChange={update('email')} placeholder="john@example.com" />
      </div>
      <div className="mt-4">
        <label className="label-field">Phone Number *</label>
        <input className="input-field" type="tel" value={form.phone} onChange={update('phone')} placeholder="1(284) 000-0000" />
      </div>
      <div className="mt-4">
        <label className="label-field">Island *</label>
        <select className="input-field" value={form.island} onChange={update('island')}>
          <option value="">Select island...</option>
          {ISLANDS.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>
    </div>
  );

  const renderStep2 = () => {
    if (form.role === ROLES.EMPLOYER) {
      return (
        <div>
          <h2 className="text-lg font-bold text-[#003366] mb-1">Employer Details</h2>
          <p className="text-sm text-gray-500 mb-6">Tell us about your business.</p>
          <div className="space-y-4">
            <div>
              <label className="label-field">Company / Business Name *</label>
              <input className="input-field" value={form.companyName} onChange={update('companyName')} placeholder="Acme Ltd." />
            </div>
            <div>
              <label className="label-field">Trade License Number *</label>
              <input className="input-field" value={form.tradeLicense} onChange={update('tradeLicense')} placeholder="TL-0000-0000" />
            </div>
            <div>
              <label className="label-field">Industry *</label>
              <select className="input-field" value={form.industry} onChange={update('industry')}>
                <option value="">Select industry...</option>
                {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      );
    }
    if (form.role === ROLES.EMPLOYEE) {
      return (
        <div>
          <h2 className="text-lg font-bold text-[#003366] mb-1">Employment Details</h2>
          <p className="text-sm text-gray-500 mb-6">Tell us about your current employment.</p>
          <div className="space-y-4">
            <div>
              <label className="label-field">Current Employer *</label>
              <input className="input-field" value={form.currentEmployer} onChange={update('currentEmployer')} placeholder="Company name" />
            </div>
            <div>
              <label className="label-field">Work Permit Number (if applicable)</label>
              <input className="input-field" value={form.permitNumber} onChange={update('permitNumber')} placeholder="WP-2025-0000" />
            </div>
          </div>
        </div>
      );
    }
    // jobseeker
    return (
      <div>
        <h2 className="text-lg font-bold text-[#003366] mb-1">Career Profile</h2>
        <p className="text-sm text-gray-500 mb-6">Tell us about your skills and education.</p>
        <div className="space-y-4">
          <div>
            <label className="label-field">Key Skills</label>
            <textarea
              className="input-field min-h-[80px]"
              value={form.skills}
              onChange={update('skills')}
              placeholder="e.g. Customer service, accounting, carpentry..."
            />
          </div>
          <div>
            <label className="label-field">Education Level *</label>
            <select className="input-field" value={form.educationLevel} onChange={update('educationLevel')}>
              <option value="">Select education level...</option>
              {EDUCATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div>
      <h2 className="text-lg font-bold text-[#003366] mb-1">Create Password</h2>
      <p className="text-sm text-gray-500 mb-6">Secure your account with a strong password.</p>
      <div className="space-y-4">
        <div>
          <label className="label-field">Password *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field pr-10"
              value={form.password}
              onChange={update('password')}
              placeholder="Minimum 8 characters"
            />
            <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {/* Strength meter */}
          {form.password && (
            <div className="mt-2">
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: strength.width }} />
              </div>
              <p className="text-xs mt-1 text-gray-500">
                Strength: <span className="font-semibold">{strength.label}</span>
              </p>
            </div>
          )}
        </div>
        <div>
          <label className="label-field">Confirm Password *</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              className="input-field pr-10"
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              placeholder="Re-enter your password"
            />
            <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {form.confirmPassword && form.password !== form.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
          )}
        </div>
      </div>
      <div className="mt-4 bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-500 font-semibold mb-1">Password requirements:</p>
        <ul className="text-xs text-gray-500 space-y-0.5">
          <li className={form.password.length >= 8 ? 'text-green-600' : ''}>
            {form.password.length >= 8 ? <Check size={12} className="inline mr-1" /> : '- '}At least 8 characters
          </li>
          <li className={/[A-Z]/.test(form.password) ? 'text-green-600' : ''}>
            {/[A-Z]/.test(form.password) ? <Check size={12} className="inline mr-1" /> : '- '}One uppercase letter
          </li>
          <li className={/[0-9]/.test(form.password) ? 'text-green-600' : ''}>
            {/[0-9]/.test(form.password) ? <Check size={12} className="inline mr-1" /> : '- '}One number
          </li>
          <li className={/[^A-Za-z0-9]/.test(form.password) ? 'text-green-600' : ''}>
            {/[^A-Za-z0-9]/.test(form.password) ? <Check size={12} className="inline mr-1" /> : '- '}One special character
          </li>
        </ul>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const roleLabel = ROLE_OPTIONS.find(o => o.value === form.role)?.label || form.role;
    return (
      <div>
        <h2 className="text-lg font-bold text-[#003366] mb-1">Review Your Information</h2>
        <p className="text-sm text-gray-500 mb-6">Please confirm everything looks correct.</p>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Account Type</h3>
            <p className="text-sm text-gray-800 font-medium">{roleLabel}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Personal Information</h3>
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Name:</span> {form.firstName} {form.lastName}</div>
              <div><span className="text-gray-500">Email:</span> {form.email}</div>
              <div><span className="text-gray-500">Phone:</span> {form.phone}</div>
              <div><span className="text-gray-500">Island:</span> {form.island}</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              {form.role === ROLES.EMPLOYER ? 'Employer' : form.role === ROLES.EMPLOYEE ? 'Employment' : 'Career'} Details
            </h3>
            <div className="text-sm space-y-1">
              {form.role === ROLES.EMPLOYER && (
                <>
                  <div><span className="text-gray-500">Company:</span> {form.companyName}</div>
                  <div><span className="text-gray-500">Trade License:</span> {form.tradeLicense}</div>
                  <div><span className="text-gray-500">Industry:</span> {form.industry}</div>
                </>
              )}
              {form.role === ROLES.EMPLOYEE && (
                <>
                  <div><span className="text-gray-500">Employer:</span> {form.currentEmployer}</div>
                  {form.permitNumber && <div><span className="text-gray-500">Permit #:</span> {form.permitNumber}</div>}
                </>
              )}
              {form.role === ROLES.JOBSEEKER && (
                <>
                  <div><span className="text-gray-500">Education:</span> {form.educationLevel}</div>
                  {form.skills && <div><span className="text-gray-500">Skills:</span> {form.skills}</div>}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col">
      {/* Top bar */}
      <div className="bg-[#003366] text-white py-3 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#c5a55a] flex items-center justify-center font-bold text-[#003366] text-sm flex-shrink-0">
            BVI
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide text-[#c5a55a]">BVI Government</p>
            <p className="text-[11px] text-gray-300">{DEPARTMENT_INFO.name}</p>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-start justify-center p-4 pt-8">
        <div className="w-full max-w-lg">
          {renderStepper()}

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            {error && (
              <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {stepRenderers[step]()}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100">
              {step > 0 ? (
                <button type="button" onClick={handleBack} className="btn-outline text-sm px-4 py-2">
                  <ChevronLeft size={16} /> Back
                </button>
              ) : (
                <Link to="/login" className="text-sm text-gray-500 hover:text-[#003366]">
                  Already have an account? <span className="font-semibold">Sign in</span>
                </Link>
              )}

              {step < STEPS.length - 1 ? (
                <button type="button" onClick={handleNext} className="btn-primary text-sm px-5 py-2">
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-success text-sm px-5 py-2"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    <>
                      <UserPlus size={16} /> Create Account
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            &copy; {new Date().getFullYear()} {DEPARTMENT_INFO.name}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
