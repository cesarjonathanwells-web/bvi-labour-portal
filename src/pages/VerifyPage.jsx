import { useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import LanguageSwitcher from '../i18n/LanguageSwitcher';
import SkipToContent from '../components/common/SkipToContent';
import {
  ShieldCheck, Search, CheckCircle2, XCircle, Clock, AlertTriangle,
  ArrowLeft, Phone, Mail, Info, Building2, Briefcase, Calendar,
} from 'lucide-react';
import { DEPARTMENT_INFO } from '../data/constants';
import { daysUntilExpiry, formatDateShort } from '../utils/helpers';
import MockBadge from '../components/common/MockBadge';
import { logAudit } from '../utils/auditLog';

/**
 * Public permit-verification page. An employer, bank, landlord, or law-
 * enforcement officer can paste a permit number and immediately see
 * whether it is valid, without signing in. Returns only the minimum
 * information needed for verification — never DOB, nationality, salary,
 * or any other sensitive field.
 *
 * Phase 2 adds a QR-code scan path (the printed card carries a signed
 * QR), rate limiting, and server-side audit of who looked up what.
 */

function resultFromPermit(permit) {
  if (!permit) return { verdict: 'not_found' };
  const days = permit.expiryDate ? daysUntilExpiry(permit.expiryDate) : null;
  if (permit.status === 'rejected') return { verdict: 'rejected', permit, days };
  if (permit.status === 'cancelled') return { verdict: 'cancelled', permit, days };
  if (permit.status === 'expired' || (days !== null && days < 0)) return { verdict: 'expired', permit, days };
  if (permit.status === 'approved') return { verdict: 'active', permit, days };
  return { verdict: 'in_progress', permit, days };
}

const VERDICTS = {
  active: {
    label: 'Active',
    Icon: CheckCircle2,
    tone: 'bg-green-50 border-green-200 text-green-900',
    iconTone: 'text-green-600',
    description: 'This work permit is active and the holder is authorised to work in the British Virgin Islands until the expiry date shown below.',
  },
  expired: {
    label: 'Expired',
    Icon: XCircle,
    tone: 'bg-amber-50 border-amber-200 text-amber-900',
    iconTone: 'text-amber-600',
    description: 'This work permit has expired. The holder is NOT currently authorised to work under this permit. Renewals may be pending — check with the holder before taking further action.',
  },
  rejected: {
    label: 'Rejected',
    Icon: XCircle,
    tone: 'bg-red-50 border-red-200 text-red-900',
    iconTone: 'text-red-600',
    description: 'This permit application was not approved. The holder is NOT authorised to work under this number.',
  },
  cancelled: {
    label: 'Cancelled',
    Icon: XCircle,
    tone: 'bg-red-50 border-red-200 text-red-900',
    iconTone: 'text-red-600',
    description: 'This permit has been cancelled. The holder is NOT authorised to work under this number.',
  },
  in_progress: {
    label: 'Application in progress',
    Icon: Clock,
    tone: 'bg-blue-50 border-blue-200 text-blue-900',
    iconTone: 'text-blue-600',
    description: 'An application under this reference has been submitted but a decision has not yet been issued. The applicant is NOT yet authorised to work under this number.',
  },
  not_found: {
    label: 'Not found',
    Icon: AlertTriangle,
    tone: 'bg-gray-50 border-gray-200 text-gray-900',
    iconTone: 'text-gray-500',
    description: 'No work permit was found with that reference number. Check the number was typed exactly as it appears on the card (e.g. WP-2024-1001) and try again.',
  },
};

function PermitResult({ result }) {
  const def = VERDICTS[result.verdict] || VERDICTS.not_found;
  const { Icon } = def;
  const p = result.permit;
  const daysLine = result.days !== null && result.days !== undefined
    ? (result.days >= 0
        ? `${result.days} day${result.days === 1 ? '' : 's'} remaining`
        : `${Math.abs(result.days)} day${Math.abs(result.days) === 1 ? '' : 's'} past expiry`)
    : null;

  return (
    <div className={`rounded-2xl border-2 p-6 ${def.tone}`}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center ${def.iconTone}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold">{def.label}</h2>
          <p className="text-sm mt-1 opacity-90">{def.description}</p>
        </div>
      </div>

      {p && (
        <div className="mt-5 pt-5 border-t border-current/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-70">Permit number</p>
            <p className="font-bold">{p.permitNumber}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-70">Permit holder</p>
            <p className="font-semibold">{p.employeeName || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-70 flex items-center gap-1">
              <Building2 size={10} /> Sponsoring employer
            </p>
            <p>{p.employerName || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-70 flex items-center gap-1">
              <Briefcase size={10} /> Authorised position
            </p>
            <p>{p.position || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-70 flex items-center gap-1">
              <Calendar size={10} /> Issued
            </p>
            <p>{p.issuedDate ? formatDateShort(p.issuedDate) : (p.submittedAt ? formatDateShort(p.submittedAt) : '—')}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-70 flex items-center gap-1">
              <Calendar size={10} /> Expires
            </p>
            <p className="font-semibold">
              {p.expiryDate ? formatDateShort(p.expiryDate) : '—'}
              {daysLine && <span className="block text-[10px] opacity-80 mt-0.5">{daysLine}</span>}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 text-[10px] opacity-70">
        Verification reference · {new Date().toLocaleString('en-GB')}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  const [params, setParams] = useSearchParams();
  const [input, setInput] = useState(params.get('permit') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [inputError, setInputError] = useState('');

  const run = useCallback((raw) => {
    const q = (raw || input).trim();
    if (!q) {
      setInputError('Please enter a permit number.');
      // Also drop any stale ?permit= from the URL
      if (params.get('permit')) setParams({}, { replace: true });
      return;
    }
    setInputError('');
    setLoading(true);
    setResult(null);
    // Simulate a lookup delay and log the request so the presentation can
    // show that public verifications are audited even when anonymous.
    setTimeout(() => {
      let permits = [];
      try { permits = JSON.parse(localStorage.getItem('bvi_permits') || '[]'); } catch { /* ignore */ }
      const match = permits.find(p => (p.permitNumber || '').toLowerCase() === q.toLowerCase());
      const r = resultFromPermit(match);
      setResult(r);
      setLoading(false);
      setParams({ permit: q }, { replace: true });
      logAudit({
        actorName: 'Anonymous (public verification)',
        actorRole: 'public',
        category: 'system',
        action: `public permit verification — ${r.verdict}`,
        targetType: 'permit',
        targetId: match?.id || null,
        targetLabel: q,
        metadata: { verdict: r.verdict },
      });
    }, 250);
  }, [input, setParams]);

  // Auto-run if ?permit= is in the URL on first load
  if (!loading && !result && params.get('permit')) {
    run(params.get('permit'));
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <SkipToContent />
      {/* Nav */}
      <nav className="bg-[#003366] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-full bg-[#c5a55a] flex items-center justify-center font-bold text-[#003366] text-sm">BVI</div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-bold text-[#c5a55a]">BVI Government</p>
              <p className="text-[10px] text-gray-300">Department of Labour &amp; Workforce Development</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors">
              <ArrowLeft size={16} /> Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#003366] via-[#004d99] to-[#003366] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm mb-5">
            <ShieldCheck size={14} className="text-[#c5a55a]" />
            <span className="text-gray-200">Public Permit Verification</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">
            Verify a work permit
          </h1>
          <p className="text-base sm:text-lg text-gray-200 max-w-2xl mx-auto">
            Employers, banks, landlords, and law-enforcement officers can instantly confirm whether a BVI work permit is active &mdash; no account required.
          </p>
        </div>
      </section>

      {/* Form + result */}
      <main id="main-content" className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <label htmlFor="permit-input" className="label-field">Permit number</label>
          <form onSubmit={(e) => { e.preventDefault(); run(); }} className="flex flex-col sm:flex-row gap-2">
            <input
              id="permit-input"
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); if (inputError) setInputError(''); }}
              placeholder="e.g. WP-2024-1001"
              autoComplete="off"
              maxLength={64}
              aria-invalid={inputError ? 'true' : 'false'}
              aria-describedby={inputError ? 'permit-input-error' : undefined}
              className={`input-field flex-1 ${inputError ? 'border-red-400 focus:ring-red-300' : ''}`}
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#003366] text-white rounded-lg font-semibold text-sm hover:bg-[#002244] disabled:opacity-40"
            >
              <Search size={14} /> {loading ? 'Checking…' : 'Verify permit'}
            </button>
          </form>
          {inputError && (
            <p id="permit-input-error" role="alert" className="mt-2 text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle size={12} /> {inputError}
            </p>
          )}

          <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
            <Info size={14} className="mt-0.5 flex-shrink-0" />
            <p>
              Only the minimum information needed to confirm a permit is shown — holder name, sponsoring employer, position, issue and expiry dates. Nationality, date of birth, salary, contact details, and addresses are never returned by this service.
            </p>
          </div>
          <div className="mt-3 flex">
            <MockBadge
              variant="phase2"
              label="Phase 2: QR + rate limit"
              title="Phase 2 adds QR-code scan from the physical card, anti-abuse rate limiting, and a per-requester audit trail."
            />
          </div>
        </div>

        {/* Result */}
        <div className="mt-6">
          {loading && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-3 text-sm text-gray-500">
              <div className="w-5 h-5 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
              Looking up permit…
            </div>
          )}
          {!loading && result && <PermitResult result={result} />}
          {!loading && !result && (
            <div className="text-center text-sm text-gray-500 py-10">
              Enter a permit number above to check its status.
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#003366] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-300">
            <div className="flex items-center gap-3">
              <Phone size={12} />
              <a href={`tel:${DEPARTMENT_INFO.phone.replace(/\s/g, '')}`} className="hover:underline">{DEPARTMENT_INFO.phone}</a>
              <span className="text-gray-500">·</span>
              <Mail size={12} />
              <a href={`mailto:${DEPARTMENT_INFO.email}`} className="hover:underline">{DEPARTMENT_INFO.email}</a>
            </div>
            <p className="text-gray-400">&copy; {new Date().getFullYear()} Government of the Virgin Islands</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
