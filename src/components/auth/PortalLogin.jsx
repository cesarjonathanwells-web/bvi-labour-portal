import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, AlertCircle, Info, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validateEmail } from '../../utils/helpers';
import { DEPARTMENT_INFO } from '../../data/constants';

const portalConfig = {
  business: {
    color: '#003366',
    hoverColor: '#002244',
    label: 'Business Portal',
    title: 'Business Portal Sign In',
    subtitle: 'Access your employer account',
    accentBg: 'bg-blue-50',
    accentText: 'text-[#003366]',
    registerPath: '/business/register',
    dashboardPath: '/business/dashboard',
    badgeColor: 'bg-[#003366] text-white',
    logoText: 'text-[#c5a55a]',
    logoBg: 'bg-[#c5a55a]',
    logoFg: 'text-[#003366]',
  },
  worker: {
    color: '#006633',
    hoverColor: '#005522',
    label: 'Worker Portal',
    title: 'Worker Portal Sign In',
    subtitle: 'Access your work permit account',
    accentBg: 'bg-green-50',
    accentText: 'text-[#006633]',
    registerPath: '/worker/register',
    dashboardPath: '/worker/dashboard',
    badgeColor: 'bg-[#006633] text-white',
    logoText: 'text-white',
    logoBg: 'bg-white/20',
    logoFg: 'text-white',
  },
  jobseeker: {
    color: '#c5a55a',
    hoverColor: '#b89a4a',
    label: 'Job Centre',
    title: 'Job Centre Sign In',
    subtitle: 'Access your job seeker account',
    accentBg: 'bg-amber-50',
    accentText: 'text-amber-800',
    registerPath: '/jobs/register',
    dashboardPath: '/jobs/dashboard',
    badgeColor: 'bg-[#c5a55a] text-[#003366]',
    darkText: true,
    logoText: 'text-[#003366]',
    logoBg: 'bg-[#003366]',
    logoFg: 'text-[#c5a55a]',
  },
  dept: {
    color: '#7c3aed',
    hoverColor: '#6d28d9',
    label: 'Staff Console',
    title: 'Department Staff Sign In',
    subtitle: 'Authorized personnel only',
    accentBg: 'bg-purple-50',
    accentText: 'text-purple-700',
    dashboardPath: '/dept/dashboard',
    badgeColor: 'bg-[#7c3aed] text-white',
    logoText: 'text-white',
    logoBg: 'bg-white/20',
    logoFg: 'text-white',
  },
};

export default function PortalLogin({ portal = 'business' }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const config = portalConfig[portal] || portalConfig.business;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!validateEmail(email)) { setError('Please enter a valid email address.'); return; }
    if (!password) { setError('Please enter your password.'); return; }

    setLoading(true);
    setTimeout(() => {
      const result = login(email, password);
      if (result.success) {
        navigate(config.dashboardPath);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }, 400);
  };

  const textOnColor = config.darkText ? 'text-[#003366]' : 'text-white';
  const subtextOnColor = config.darkText ? 'text-[#003366]/70' : 'text-white/70';

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

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header banner */}
            <div className="px-6 py-8 text-center" style={{ backgroundColor: config.color }}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${config.logoBg}`}>
                <span className={`font-extrabold text-lg ${config.logoFg}`}>BVI</span>
              </div>
              <h1 className={`text-xl font-bold ${textOnColor}`}>{config.title}</h1>
              <p className={`text-sm mt-1 ${subtextOnColor}`}>{config.subtitle}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="label-field">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="label-field">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 focus:ring-2"
                    style={{ accentColor: config.color }}
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: config.color,
                  color: config.darkText ? '#003366' : '#ffffff',
                }}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <>
                    <LogIn size={18} /> Sign In
                  </>
                )}
              </button>

              {/* Register link (not for dept) */}
              {portal !== 'dept' && config.registerPath && (
                <p className="text-center text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link to={config.registerPath} className="font-semibold hover:underline" style={{ color: config.color }}>
                    Create Account
                  </Link>
                </p>
              )}

              {/* Dept note */}
              {portal === 'dept' && (
                <p className="text-center text-xs text-gray-500 italic">
                  Department staff accounts are provisioned by administration.
                  Contact your supervisor if you need access.
                </p>
              )}
            </form>
          </div>

          {/* Demo credentials for dept portal — only visible in dev */}
          {portal === 'dept' && import.meta.env.DEV && (
            <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Info size={18} className="text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-purple-800">
                  <p className="font-semibold mb-1">Demo Credentials (Commissioner)</p>
                  <p className="font-mono text-xs">
                    Email: <span className="font-bold">commissioner@labour.gov.vg</span>
                  </p>
                  <p className="font-mono text-xs">
                    Password: <span className="font-bold">admin123</span>
                  </p>
                </div>
              </div>
            </div>
          )}

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

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            &copy; {new Date().getFullYear()} {DEPARTMENT_INFO.name}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
