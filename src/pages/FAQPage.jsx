import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle, ArrowLeft, Search, ChevronDown, Phone, Mail, MessageCircle,
} from 'lucide-react';
import { DEPARTMENT_INFO } from '../data/constants';

const faqs = [
  {
    category: 'Getting started',
    q: 'Who is this portal for?',
    a: 'The portal serves four audiences: Employers (Business Portal), work permit holders (Worker Portal), Virgin Islanders and Belongers looking for work (Job Centre), and Department staff (Staff Console). Each portal shows only the services relevant to that audience.',
  },
  {
    category: 'Getting started',
    q: 'Do I need a separate account for each portal?',
    a: 'No. Your account belongs to one portal based on your role. If you are an employer, you register for the Business Portal. If you hold a work permit, the Worker Portal. Trying to access a different portal while signed in will redirect you to your own dashboard.',
  },
  {
    category: 'Work permits',
    q: 'What permit types are supported?',
    a: 'Six: New Work Permit (up to 3 years), Renewal (up to 1 year), Temporary (up to 3 months), Periodic (short engagements within a year), Self-Employed, and Emergency (up to 7 days, expedited).',
  },
  {
    category: 'Work permits',
    q: 'How are fees calculated?',
    a: 'Fees are salary-based with three tiers: 3% up to $25,000, 5% from $25,001 to $50,000, and 7% above $50,001. Domestic workers are assessed at a flat 1%. A $50 application fee applies to all new applications. The cap is $10,000.',
  },
  {
    category: 'Work permits',
    q: 'What documents are required?',
    a: 'Standard new applications require: a valid passport, passport photograph, police clearance, medical certificate, employer trade licence, employment contract, job description, evidence of local recruitment efforts, and SSB / IRD / NHI certificates of good standing. Additional documents may apply to specific permit types.',
  },
  {
    category: 'Work permits',
    q: 'How long does a decision take?',
    a: 'Current manual process: 30 working days for new permits, 2 weeks for renewals, 10–15 working days for temporary permits, expedited for emergencies. Phase 2 of the digital service targets 10 working days for new permits.',
  },
  {
    category: 'Work permits',
    q: 'Can I save a draft and finish later?',
    a: 'Yes. Every permit form autosaves your progress as you type. When you return to the form, your draft is restored.',
  },
  {
    category: 'Work permits',
    q: 'Can I reuse documents from a previous application?',
    a: 'Yes. On the documents step of a new application, any document you uploaded previously appears with a "Reuse previous" button. A "Reuse all" option carries every eligible document forward in one click.',
  },
  {
    category: 'Transfers, variations, appeals',
    q: 'Can a worker move to a new employer mid-permit?',
    a: 'Yes. The new employer submits a transfer request from the Business Portal, citing the existing permit number, the proposed new position / salary / location, and the worker\'s written consent. The Department reviews and decides; approved transfers update the existing permit without a new permit number.',
  },
  {
    category: 'Transfers, variations, appeals',
    q: 'What if my permit application is rejected?',
    a: 'Rejected applications can be appealed from the Business Portal. Appeals are reviewed by the Labour Commissioner or Deputy Commissioner, the appellate authority under the Labour Code. Typical turnaround is ten working days. If upheld, the original permit is returned to review.',
  },
  {
    category: 'Disputes',
    q: 'How do I file a workplace dispute?',
    a: 'Workers file from the Worker Portal → Disputes. The form captures complainant details, respondent (employer) details, complaint type, incident date, detailed description, and desired resolution. Supporting evidence can be uploaded. A Dispute Officer reviews and may progress the case through investigation, mediation, or referral.',
  },
  {
    category: 'Disputes',
    q: 'What types of disputes can I file?',
    a: 'Unpaid wages, unfair dismissal, discrimination, unsafe working conditions, breach of contract, harassment, wrongful deduction of wages, denial of leave entitlements, and other. Each type maps to a section of the Labour Code.',
  },
  {
    category: 'Jobs',
    q: 'How do employers post a vacancy?',
    a: 'From the Business Portal → Job Postings → Post a Job. The form captures title, category, description, requirements, salary range, working hours, location, employment type, deadline, and a Belonger-preference toggle as required by policy.',
  },
  {
    category: 'Jobs',
    q: 'Who can apply through the Job Centre?',
    a: 'Virgin Islanders and Belongers. Applicants register in the Job Centre, complete their profile (including skills and education), and apply to posted vacancies. Employers see applications in their Business Portal.',
  },
  {
    category: 'Identity & ID cards',
    q: 'How do I get my digital work permit ID card?',
    a: 'Once your permit is approved, the Worker Portal shows your digital ID card under the ID Card section. You can export it as a PDF. Phase 2 will add a QR code for on-site verification.',
  },
  {
    category: 'Identity & ID cards',
    q: 'What if I lose my ID card?',
    a: 'Digital ID cards can be re-exported as many times as needed from your Worker Portal. Physical card reissuance will be a Phase 2 feature.',
  },
  {
    category: 'Data & privacy',
    q: 'Where is my data stored?',
    a: 'The prototype stores data only in your browser (localStorage) — nothing leaves your device. Phase 2 uses a hosted database with data-residency decisions pending Ministry review.',
  },
  {
    category: 'Data & privacy',
    q: 'Can I export my data?',
    a: 'Yes. From your Profile page, use "Export my data" to download a JSON file of everything the system has about you — permits, disputes, jobs, applications, documents, appeals, transfers.',
  },
  {
    category: 'Data & privacy',
    q: 'Who can see my audit trail?',
    a: 'Only the Labour Commissioner and Deputy Commissioner can view the internal audit log. Every permit, dispute, and job action performed in the system is recorded with actor, timestamp, and target. Phase 2 makes this log immutable and exportable for the Auditor General.',
  },
  {
    category: 'Accessibility & languages',
    q: 'Does the portal support Spanish or Creole?',
    a: 'Currently English-only. Phase 2 adds Spanish and French-Creole translations for public-facing pages.',
  },
  {
    category: 'Accessibility & languages',
    q: 'Is the portal WCAG compliant?',
    a: 'Self-audited against WCAG 2.1 AA. Phase 2 includes independent certification by a third-party accessibility firm.',
  },
  {
    category: 'Accessibility & languages',
    q: 'Does it work on low-bandwidth connections?',
    a: 'The current build requires an online connection. Phase 2 introduces a Progressive Web App shell optimised for Anegada, Jost Van Dyke, and other low-bandwidth locations.',
  },
  {
    category: 'Department staff',
    q: 'How do Department staff log in?',
    a: 'Department accounts are provisioned by administration — there is no public registration. Staff sign in at /dept/login using their departmental email. Eight roles are supported with a permission matrix governing access.',
  },
  {
    category: 'Department staff',
    q: 'Who approves permits?',
    a: 'Permit Officers review submissions and can request documents or mark them under review. Final approval or rejection authority rests with the Commissioner or Deputy Commissioner. Officers can escalate to the Deputy for a decision.',
  },
  {
    category: 'Technical',
    q: 'Is this the live service?',
    a: 'No. The environment currently visible is a Phase 1 prototype demonstrating the user experience, hosted for review. The Phase 2 backend (database, real authentication, integrations with IRD / SSB / NHI / Immigration) is planned for Q3 2026.',
  },
  {
    category: 'Technical',
    q: 'What browsers are supported?',
    a: 'Chrome, Firefox, Safari, and Edge in their current and previous major versions. Internet Explorer is not supported. The interface adapts to mobile, tablet, and desktop viewports.',
  },
];

const categories = [
  'All',
  'Getting started',
  'Work permits',
  'Transfers, variations, appeals',
  'Disputes',
  'Jobs',
  'Identity & ID cards',
  'Data & privacy',
  'Accessibility & languages',
  'Department staff',
  'Technical',
];

function FaqCard({ item, index }) {
  return (
    <details className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#003366] transition-colors">
      <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none">
        <div className="flex items-start gap-3 min-w-0">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#003366]/10 text-[#003366] text-xs font-bold flex items-center justify-center mt-0.5">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-[#003366] uppercase tracking-wide mb-0.5">{item.category}</p>
            <p className="font-semibold text-gray-900 text-sm sm:text-base">{item.q}</p>
          </div>
        </div>
        <ChevronDown size={18} className="flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-5 pb-5 pt-1 pl-[4.5rem]">
        <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
      </div>
    </details>
  );
}

export default function FAQPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    return faqs.filter(f => {
      if (category !== 'All' && f.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!f.q.toLowerCase().includes(q) && !f.a.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [search, category]);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <nav className="bg-[#003366] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-full bg-[#c5a55a] flex items-center justify-center font-bold text-[#003366] text-sm">BVI</div>
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

      <section className="bg-gradient-to-br from-[#003366] via-[#004d99] to-[#003366] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm mb-5">
            <HelpCircle size={14} className="text-[#c5a55a]" />
            <span className="text-gray-200">Help &amp; FAQ</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">
            Questions, answered
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">
            {faqs.length} common questions about permits, disputes, jobs, data, and the digital service.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search the FAQ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 text-sm"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field text-sm sm:w-64"
            aria-label="Filter by category"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of {faqs.length} entries
        </p>

        <div className="space-y-3">
          {filtered.map((item, i) => <FaqCard key={i} item={item} index={i} />)}
          {filtered.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No FAQ entries match your search.</p>
            </div>
          )}
        </div>

        <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center">
          <MessageCircle className="w-8 h-8 text-[#003366] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#003366] mb-2">Still have a question?</h2>
          <p className="text-sm text-gray-600 mb-5">
            The Department is available during office hours: {DEPARTMENT_INFO.hours}.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            <a href={`tel:${DEPARTMENT_INFO.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 text-[#003366] font-semibold hover:underline">
              <Phone size={16} /> {DEPARTMENT_INFO.phone}
            </a>
            <span className="hidden sm:inline text-gray-300">·</span>
            <a href={`mailto:${DEPARTMENT_INFO.email}`} className="inline-flex items-center gap-2 text-[#003366] font-semibold hover:underline">
              <Mail size={16} /> {DEPARTMENT_INFO.email}
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
