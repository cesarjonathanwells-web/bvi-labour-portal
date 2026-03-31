import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, Check, AlertCircle, Eye, EyeOff,
  UserPlus, ArrowLeft, Building2, UserCheck, Briefcase,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePhone } from '../../utils/helpers';
import { ISLANDS, JOB_CATEGORIES, DEPARTMENT_INFO } from '../../data/constants';

const EDUCATION_LEVELS = [
  'High School / Secondary',
  'Associate Degree',
  "Bachelor's Degree",
  "Master's Degree",
  'Doctorate / PhD',
  'Trade / Vocational Certificate',
  'Other',
];

const NATIONALITIES = [
  'British Virgin Islander', 'Belonger', 'Dominican', 'Jamaican', 'Guyanese',
  'St. Vincentian', 'Filipino', 'American', 'British', 'Canadian', 'Other',
];

const portalConfig = {
  business: {
    color: '#003366',
    label: 'Business Portal',
    title: 'Business Registration',
    subtitle: 'Create your employer account',
    icon: Building2,
    loginPath: '/business/login',
    dashboardPath: '/business/dashboard',
    logoBg: 'bg-[#c5a55a]',
    logoFg: 'text-[#003366]',
    logoText: 'text-[#c5a55a]',
    stepperActive: 'bg-[#003366] text-white',
    stepperComplete: 'bg-[#006633] text-white',
    steps: ['Company Info', 'Contact Details', 'Create Password'],
  },
  worker: {
    color: '#006633',
    label: 'Worker Portal',
    title: 'Worker Registration',
    subtitle: 'Create your worker account',
    icon: UserCheck,
    loginPath: '/worker/login',
    dashboardPath: '/worker/dashboard',
    logoBg: 'bg-white/20',
    logoFg: 'text-white',
    logoText: 'text-white',
    stepperActive: 'bg-[#006633] text-white',
    stepperComplete: 'bg-[#003366] text-white',
    steps: ['Personal Info', 'Employment Details', 'Create Password'],
  },
  jobseeker: {
    color: '#c5a55a',
    label: 'Job Centre',
    title: 'Job Seeker Registration',
    subtitle: 'Create your job seeker profile',
    icon: Briefcase,
    loginPath: '/jobs/login',
    dashboardPath: '/jobs/dashboard',
    logoBg: 'bg-[#003366]',
    logoFg: 'text-[#c5a55a]',
    logoText: 'text-[#003366]',
    darkText: true,
    stepperActive: 'bg-[#c5a55a] text-[#003366]',
    stepperComplete: 'bg-[#006633] text-white',
    steps: ['Personal Info', 'Skills & Education', 'Create Password'],
  },
};

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

export default function PortalRegister({ portal = 'business' }) {
  const { register } = useAuth();
  const navigate = useNavigate();
  const config = portalConfig[portal] || portalConfig.business;

  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    // Business fields
    companyName: '', tradeLicense: '', industry: '', contactPerson: '',
    // Worker fields
    firstName: '', lastName: '', nationality: '', currentEmployer: '', permitNumber: '',
    // Job Seeker fields
    fullName: '', belongerStatus: '', skills: '', educationLevel: '',
    // Common fields
    email: '', phone: '', island: '', password: '', confirmPassword: '',
  });

  const update = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const validateStep = () => {
    if (portal === 'business') {
      if (step === 0) {
        if (!form.companyName.trim()) return 'Company name is required.';
        if (!form.tradeLicense.trim()) return 'Trade license number is required.';
        if (!form.industry) return 'Please select an industry.';
        if (!form.contactPerson.trim()) return 'Contact person name is required.';
      }
      if (step === 1) {
        if (!form.email.trim()) return 'Email is required.';
        if (!validateEmail(form.email)) return 'Please enter a valid email.';
        if (!form.phone.trim()) return 'Phone number is required.';
        if (!validatePhone(form.phone)) return 'Please enter a valid phone number.';
        if (!form.island) return 'Please select your island.';
      }
    }
    if (portal === 'worker') {
      if (step === 0) {
        if (!form.firstName.trim()) return 'First name is required.';
        if (!form.lastName.trim()) return 'Last name is required.';
        if (!form.nationality) return 'Please select your nationality.';
        if (!form.email.trim()) return 'Email is required.';
        if (!validateEmail(form.email)) return 'Please enter a valid email.';
        if (!form.phone.trim()) return 'Phone number is required.';
        if (!validatePhone(form.phone)) return 'Please enter a valid phone number.';
      }
      if (step === 1) {
        if (!form.currentEmployer.trim()) return 'Current employer is required.';
      }
    }
    if (portal === 'jobs') {
      if (step === 0) {
        if (!form.firstName.trim()) return 'First name is required.';
        if (!form.lastName.trim()) return 'Last name is required.';
        if (!form.email.trim()) return 'Email is required.';
        if (!validateEmail(form.email)) return 'Please enter a valid email.';
        if (!form.phone.trim()) return 'Phone number is required.';
        if (!validatePhone(form.phone)) return 'Please enter a valid phone number.';
      }
      if (step === 1) {
        if (!form.educationLevel) return 'Please select your education level.';
      }
    }
    // Password step is always last
    if (step === config.steps.length - 1) {
      if (form.password.length < 8) return 'Password must be at least 8 characters.';
      if (form.password !== form.confirmPassword) return 'Passwords do not match.';
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
    const err = validateStep();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');
    setTimeout(() => {
      let userData = {
        portal,
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
      };

      if (portal === 'business') {
        userData = {
          ...userData,
          role: 'employer',
          companyName: form.companyName.trim(),
          tradeLicense: form.tradeLicense.trim(),
          industry: form.industry,
          contactPerson: form.contactPerson.trim(),
          firstName: form.contactPerson.split(' ')[0] || form.contactPerson,
          lastName: form.contactPerson.split(' ').slice(1).join(' ') || '',
          island: form.island,
        };
      } else if (portal === 'worker') {
        userData = {
          ...userData,
          role: 'employee',
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          nationality: form.nationality,
          currentEmployer: form.currentEmployer.trim(),
          permitNumber: form.permitNumber.trim(),
        };
      } else if (portal === 'jobseeker') {
        userData = {
          ...userData,
          role: 'jobseeker',
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          belongerStatus: form.belongerStatus,
          skills: form.skills.trim(),
          educationLevel: form.educationLevel,
        };
      }

      const result = register(userData);
      if (result.success) {
        navigate(config.dashboardPath);
      } else {
        setError(result.error);
        setLoading(false);
      }
    }, 500);
  };

  const strength = getPasswordStrength(form.password);
  const textOnColor = config.darkText ? 'text-[#003366]' : 'text-white';
  const subtextOnColor = config.darkText ? 'text-[#003366]/70' : 'text-white/70';

  // ---- Step renderers by portal ----

  const renderBusinessStep0 = () => (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-1">Company Information</h2>
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
        <div>
          <label className="label-field">Contact Person *</label>
          <input className="input-field" value={form.contactPerson} onChange={update('contactPerson')} placeholder="John Smith" />
        </div>
      </div>
    </div>
  );

  const renderBusinessStep1 = () => (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-1">Contact Details</h2>
      <p className="text-sm text-gray-500 mb-6">How can we reach your business?</p>
      <div className="space-y-4">
        <div>
          <label className="label-field">Email Address *</label>
          <input className="input-field" type="email" value={form.email} onChange={update('email')} placeholder="contact@company.com" />
        </div>
        <div>
          <label className="label-field">Phone Number *</label>
          <input className="input-field" type="tel" value={form.phone} onChange={update('phone')} placeholder="1(284) 000-0000" />
        </div>
        <div>
          <label className="label-field">Island *</label>
          <select className="input-field" value={form.island} onChange={update('island')}>
            <option value="">Select island...</option>
            {ISLANDS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  const renderWorkerStep0 = () => (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-1">Personal Information</h2>
      <p className="text-sm text-gray-500 mb-6">Tell us about yourself.</p>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-field">First Name *</label>
            <input className="input-field" value={form.firstName} onChange={update('firstName')} placeholder="John" />
          </div>
          <div>
            <label className="label-field">Last Name *</label>
            <input className="input-field" value={form.lastName} onChange={update('lastName')} placeholder="Smith" />
          </div>
        </div>
        <div>
          <label className="label-field">Nationality *</label>
          <select className="input-field" value={form.nationality} onChange={update('nationality')}>
            <option value="">Select nationality...</option>
            {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="label-field">Email Address *</label>
          <input className="input-field" type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label-field">Phone Number *</label>
          <input className="input-field" type="tel" value={form.phone} onChange={update('phone')} placeholder="1(284) 000-0000" />
        </div>
      </div>
    </div>
  );

  const renderWorkerStep1 = () => (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-1">Employment Details</h2>
      <p className="text-sm text-gray-500 mb-6">Tell us about your current employment.</p>
      <div className="space-y-4">
        <div>
          <label className="label-field">Current Employer *</label>
          <input className="input-field" value={form.currentEmployer} onChange={update('currentEmployer')} placeholder="Company name" />
        </div>
        <div>
          <label className="label-field">Work Permit Number (if you have one)</label>
          <input className="input-field" value={form.permitNumber} onChange={update('permitNumber')} placeholder="WP-2025-0000" />
        </div>
      </div>
    </div>
  );

  const renderJobsStep0 = () => (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-1">Personal Information</h2>
      <p className="text-sm text-gray-500 mb-6">Tell us about yourself.</p>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-field">First Name *</label>
            <input className="input-field" value={form.firstName} onChange={update('firstName')} placeholder="John" />
          </div>
          <div>
            <label className="label-field">Last Name *</label>
            <input className="input-field" value={form.lastName} onChange={update('lastName')} placeholder="Smith" />
          </div>
        </div>
        <div>
          <label className="label-field">VI/Belonger Status</label>
          <select className="input-field" value={form.belongerStatus} onChange={update('belongerStatus')}>
            <option value="">Select status...</option>
            <option value="virgin_islander">Virgin Islander</option>
            <option value="belonger">Belonger</option>
            <option value="resident">Permanent Resident</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label-field">Email Address *</label>
          <input className="input-field" type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label-field">Phone Number *</label>
          <input className="input-field" type="tel" value={form.phone} onChange={update('phone')} placeholder="1(284) 000-0000" />
        </div>
      </div>
    </div>
  );

  const renderJobsStep1 = () => (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-1">Skills &amp; Education</h2>
      <p className="text-sm text-gray-500 mb-6">Help us match you with the right opportunities.</p>
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

  const renderPasswordStep = () => (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-1">Create Password</h2>
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

  // Build step renderers based on portal
  const getStepRenderers = () => {
    if (portal === 'business') return [renderBusinessStep0, renderBusinessStep1, renderPasswordStep];
    if (portal === 'worker') return [renderWorkerStep0, renderWorkerStep1, renderPasswordStep];
    if (portal === 'jobs') return [renderJobsStep0, renderJobsStep1, renderPasswordStep];
    return [renderPasswordStep];
  };

  const stepRenderers = getStepRenderers();
  const isLastStep = step === config.steps.length - 1;

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col">
      {/* Top bar */}
      <div className="py-3 px-4" style={{ backgroundColor: config.color }}>
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${config.logoBg} ${config.logoFg}`}>
            BVI
          </div>
          <div>
            <p className={`text-sm font-bold tracking-wide ${config.logoText}`}>
              BVI Government
            </p>
            <p className={`text-[11px] ${subtextOnColor}`}>
              {DEPARTMENT_INFO.name}
            </p>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-start justify-center p-4 pt-8">
        <div className="w-full max-w-lg">
          {/* Stepper */}
          <div className="flex items-center justify-center gap-1 mb-8">
            {config.steps.map((label, i) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i < step ? config.stepperComplete :
                    i === step ? config.stepperActive :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {i < step ? <Check size={16} /> : i + 1}
                  </div>
                  <span className={`text-[10px] mt-1 text-center leading-tight max-w-[70px] ${
                    i === step ? 'font-semibold text-gray-700' : 'text-gray-400'
                  }`}>
                    {label}
                  </span>
                </div>
                {i < config.steps.length - 1 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-1 mt-[-14px] ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

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
                <button type="button" onClick={handleBack} className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <ChevronLeft size={16} /> Back
                </button>
              ) : (
                <Link to={config.loginPath} className="text-sm text-gray-500 hover:text-gray-700">
                  Already have an account? <span className="font-semibold">Sign in</span>
                </Link>
              )}

              {!isLastStep ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1 px-5 py-2 rounded-lg text-sm font-bold text-white transition-colors"
                  style={{ backgroundColor: config.color }}
                >
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center gap-1 px-5 py-2 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#006633' }}
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

          {/* Back to portal selection */}
          <div className="mt-4 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Portal Selection
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            &copy; {new Date().getFullYear()} {DEPARTMENT_INFO.name}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
