import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, ChevronDown, Info, Shield, Phone, Mail,
} from 'lucide-react';
import { DEPARTMENT_INFO } from '../data/constants';

const limitations = [
  {
    title: 'Authentication is front-end only',
    body: 'Passwords are stored in the browser for demonstration purposes. The production system will use server-side authentication with hashed passwords, session management, and optional multi-factor authentication.',
  },
  {
    title: 'No real backend database',
    body: 'All data resets per browser. The production system will use Postgres with daily backups, point-in-time recovery, and regional replication.',
  },
  {
    title: 'IRD, SSB, NHI, and Immigration integrations are mocked',
    body: 'Any "Verified" badge in the prototype is a client-side check against seed data. Real integrations with the Inland Revenue Department, Social Security Board, National Health Insurance, and Immigration are scheduled for Phase 2.',
  },
  {
    title: 'No email or SMS delivery',
    body: 'Notifications appear in the in-app notification centre only. Phase 2 wires a real delivery provider (SendGrid for email, Twilio for SMS) with user-preference controls.',
  },
  {
    title: 'No audit-log persistence',
    body: 'State changes are logged in-browser for demonstration. Phase 2 uses a server-side immutable log, exportable for the Auditor General and Internal Audit.',
  },
  {
    title: 'No file-content validation or virus scanning',
    body: 'Uploaded documents are not scanned. Phase 2 integrates a cloud scanning service and enforces signed-URL upload to protected object storage.',
  },
  {
    title: 'No payment processing',
    body: 'Fee calculations are correct; no money moves. Phase 2 integrates a local payment gateway with reconciliation exports for Treasury.',
  },
  {
    title: 'Not WCAG 2.1 AA certified',
    body: 'The interface has been self-audited against AA standards but has not been formally certified by a third party. Phase 2 includes an independent accessibility audit and remediation.',
  },
  {
    title: 'Not penetration-tested',
    body: 'Security review by an external firm is a Phase 2 prerequisite before any public launch. No known credentials, secrets, or sensitive data should be entered into this prototype.',
  },
  {
    title: 'Data is not sovereign to BVI',
    body: 'Railway hosting is currently US-based for the prototype. Phase 2 hosting decisions — including data-residency, sovereign-cloud options, and disaster recovery — are pending Ministry review.',
  },
  {
    title: 'No appeals flow, permit transfer, or variation workflow yet',
    body: 'The Labour Code provides for appeals of decisions and for permit variations (position change, employer transfer). These workflows are scaffolded for Phase 2.',
  },
  {
    title: 'No Belonger verification against Immigration registry',
    body: 'Belonger status is currently self-declared in user profiles. Phase 2 will verify against the Immigration registry at application time.',
  },
  {
    title: 'No multilingual support yet',
    body: 'The interface is English-only. Phase 2 adds Spanish and French-Creole translations for public-facing pages.',
  },
  {
    title: 'No offline or low-bandwidth optimisation',
    body: 'The site requires an online connection. Phase 2 introduces a Progressive Web App shell for Anegada and other low-bandwidth locations.',
  },
];

function LimitationCard({ title, body, index }) {
  return (
    <details className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-amber-300 transition-colors">
      <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-50 text-amber-800 text-xs font-bold flex items-center justify-center">
            {index + 1}
          </span>
          <span className="font-semibold text-gray-900 text-sm sm:text-base">{title}</span>
        </div>
        <ChevronDown size={18} className="flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-5 pb-5 pt-1 pl-[4.5rem]">
        <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
      </div>
    </details>
  );
}

export default function LimitationsPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <nav className="bg-[#003366] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-full bg-[#c5a55a] flex items-center justify-center font-bold text-[#003366] text-sm">
              BVI
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-bold text-[#c5a55a]">BVI Government</p>
              <p className="text-[10px] text-gray-300">Department of Labour &amp; Workforce Development</p>
            </div>
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </nav>

      <section className="bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm mb-5">
            <AlertTriangle size={14} />
            <span>Honest disclosure</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4 max-w-3xl mx-auto">
            Known Limitations
          </h1>
          <p className="text-base sm:text-lg text-amber-50 max-w-2xl mx-auto">
            This prototype demonstrates the user experience. The following are explicitly <strong>not</strong> yet in scope and are documented here so reviewers can scope Phase 2 with confidence.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <Info size={18} className="text-[#003366] mt-0.5 flex-shrink-0" />
          <div className="text-sm text-[#003366]">
            <p className="font-semibold mb-1">Why this page exists</p>
            <p className="text-gray-700">
              Every digital service carries limitations. Listing them publicly is a practice we plan to carry into the live service, to set correct expectations with applicants, employers, and oversight bodies.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {limitations.map((l, i) => (
            <LimitationCard key={i} title={l.title} body={l.body} index={i} />
          ))}
        </div>

        <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center">
          <Shield className="w-8 h-8 text-[#003366] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#003366] mb-2">Want the full Phase 2 scope?</h2>
          <p className="text-sm text-gray-600 mb-4">
            See the <Link to="/roadmap" className="font-semibold text-[#003366] hover:underline">delivery roadmap</Link> for what Phase 2 adds and when.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm pt-4 border-t border-gray-100">
            <a href={`tel:${DEPARTMENT_INFO.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 text-[#003366] font-semibold hover:underline">
              <Phone size={14} /> {DEPARTMENT_INFO.phone}
            </a>
            <span className="hidden sm:inline text-gray-300">·</span>
            <a href={`mailto:${DEPARTMENT_INFO.email}`} className="inline-flex items-center gap-2 text-[#003366] font-semibold hover:underline">
              <Mail size={14} /> {DEPARTMENT_INFO.email}
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-[#003366] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} Government of the Virgin Islands. All rights reserved.</p>
          <p className="mt-1">{DEPARTMENT_INFO.name}</p>
        </div>
      </footer>
    </div>
  );
}
