import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3, Clock, ArrowLeft, TrendingDown, TrendingUp, CheckCircle2,
  FileText, Scale, Briefcase, Building2, UserCheck, Info, Phone, Mail,
} from 'lucide-react';
import { DEPARTMENT_INFO } from '../data/constants';
import MockBadge from '../components/common/MockBadge';

/** Read all seeded collections from localStorage so the stats reflect the
 * current demo state. This page is public (no login required). */
function readJson(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function StatCard({ label, value, sub, accent = 'text-[#003366]', Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-extrabold mt-2 ${accent}`}>{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-[#003366]/5 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-[#003366]" />
          </div>
        )}
      </div>
    </div>
  );
}

function BreakdownRow({ label, count, total, color = 'bg-[#003366]' }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-[#003366]">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
      </div>
      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [asOf, setAsOf] = useState(() => new Date().toISOString());

  // Compute all stats client-side from seed + any user-created records
  const data = useMemo(() => {
    const permits = readJson('bvi_permits');
    const disputes = readJson('bvi_disputes');
    const jobs = readJson('bvi_jobs');
    const applications = readJson('bvi_applications');
    const users = readJson('bvi_labour_users');

    const byStatus = (list, key = 'status') => list.reduce((acc, x) => {
      const k = x[key] || 'unknown';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    const byType = (list, key = 'type') => byStatus(list, key);

    const permitStatusCounts = byStatus(permits);
    const permitTypeCounts = byType(permits);
    const disputeStatusCounts = byStatus(disputes);
    const disputeTypeCounts = byType(disputes);
    const jobStatusCounts = byStatus(jobs);

    const approved = permitStatusCounts.approved || 0;
    const rejected = permitStatusCounts.rejected || 0;
    const decided = approved + rejected;
    const rejectionPct = decided > 0 ? Math.round((rejected / decided) * 100) : 0;
    const approvalPct = decided > 0 ? 100 - rejectionPct : 0;

    const avgSalary = (() => {
      const s = permits.filter(p => p.salary).map(p => Number(p.salary));
      if (s.length === 0) return 0;
      return Math.round(s.reduce((a, b) => a + b, 0) / s.length);
    })();

    const employerCount = users.filter(u => u.portal === 'business').length;
    const workerCount = users.filter(u => u.portal === 'worker').length;

    const openDisputes = (disputeStatusCounts.investigating || 0) + (disputeStatusCounts.mediation || 0) + (disputeStatusCounts.filed || 0);
    const resolvedDisputes = disputeStatusCounts.resolved || 0;

    const openJobs = jobStatusCounts.open || 0;
    const totalApplications = applications.length;
    const appsPerJob = openJobs > 0 ? (totalApplications / openJobs).toFixed(1) : '—';

    return {
      permits, disputes, jobs,
      permitStatusCounts, permitTypeCounts, disputeStatusCounts, disputeTypeCounts,
      approved, rejected, decided, rejectionPct, approvalPct,
      avgSalary, employerCount, workerCount,
      openDisputes, resolvedDisputes, openJobs, totalApplications, appsPerJob,
    };
  }, [asOf]);

  useEffect(() => {
    // Refresh stats every 30 seconds in case the demo user adds new records
    const t = setInterval(() => setAsOf(new Date().toISOString()), 30000);
    return () => clearInterval(t);
  }, []);

  const permitTotal = data.permits.length;
  const STATUS_COLOURS = {
    submitted: 'bg-blue-500', under_review: 'bg-purple-500',
    pending_payment: 'bg-amber-500', approved: 'bg-green-500',
    rejected: 'bg-red-500', expired: 'bg-gray-400', cancelled: 'bg-gray-400',
  };

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm mb-5">
            <BarChart3 size={14} className="text-[#c5a55a]" />
            <span className="text-gray-200">Public Transparency</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4 max-w-3xl mx-auto">
            Labour Services Statistics
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">
            Operational metrics from the portal and projected impact targets for Phase 2.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-[#003366]">
          <Info size={16} className="mt-0.5 flex-shrink-0" />
          <p>
            The figures below are computed live from the prototype&apos;s seed data plus any actions taken in your browser.
            Baseline metrics marked &quot;[DLWD to confirm]&quot; require the Department to supply authoritative numbers for the live service.
          </p>
        </div>

        <h2 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-4">Live operational snapshot</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total permits" value={permitTotal} sub="All types, all statuses" Icon={FileText} />
          <StatCard label="Approval rate" value={`${data.approvalPct}%`} sub={`${data.approved} approved / ${data.rejected} rejected`} accent="text-green-700" Icon={CheckCircle2} />
          <StatCard label="Open disputes" value={data.openDisputes} sub={`${data.resolvedDisputes} resolved historically`} accent="text-amber-700" Icon={Scale} />
          <StatCard label="Active job postings" value={data.openJobs} sub={`${data.totalApplications} applications · ${data.appsPerJob} per job`} Icon={Briefcase} />
          <StatCard label="Registered businesses" value={data.employerCount} Icon={Building2} />
          <StatCard label="Registered workers" value={data.workerCount} Icon={UserCheck} />
          <StatCard label="Average permit salary" value={`$${data.avgSalary.toLocaleString()}`} sub="Across all approved permits" />
          <StatCard label="Snapshot taken" value={new Date(asOf).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} sub={new Date(asOf).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} Icon={Clock} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-4">Permits by status</h3>
            <div className="space-y-3">
              {Object.entries(data.permitStatusCounts).map(([k, v]) => (
                <BreakdownRow key={k} label={k.replace(/_/g, ' ')} count={v} total={permitTotal} color={STATUS_COLOURS[k] || 'bg-gray-300'} />
              ))}
              {permitTotal === 0 && <p className="text-sm text-gray-500">No permits yet.</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-4">Permits by type</h3>
            <div className="space-y-3">
              {Object.entries(data.permitTypeCounts).map(([k, v]) => (
                <BreakdownRow key={k} label={k.replace(/-/g, ' ')} count={v} total={permitTotal} color="bg-[#003366]" />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-4">Disputes by type</h3>
            <div className="space-y-3">
              {Object.entries(data.disputeTypeCounts).map(([k, v]) => (
                <BreakdownRow key={k} label={k.replace(/_/g, ' ')} count={v} total={data.disputes.length} color="bg-red-400" />
              ))}
              {data.disputes.length === 0 && <p className="text-sm text-gray-500">No disputes on record.</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-4">Disputes by status</h3>
            <div className="space-y-3">
              {Object.entries(data.disputeStatusCounts).map(([k, v]) => (
                <BreakdownRow key={k} label={k.replace(/_/g, ' ')} count={v} total={data.disputes.length} color="bg-amber-400" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#003366] uppercase tracking-wider">Phase 2 impact projections</h2>
          <MockBadge variant="phase2" label="Projected — Phase 2" title="Targets the digital service aims to meet once Phase 2 is live." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-amber-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-green-600" />
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Processing time</p>
            </div>
            <p className="text-3xl font-extrabold text-[#003366]">30 → 10</p>
            <p className="text-xs text-gray-500 mt-1">Working days from submission to decision (67% reduction)</p>
          </div>
          <div className="bg-white rounded-2xl border border-amber-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-green-600" />
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Office visits</p>
            </div>
            <p className="text-3xl font-extrabold text-[#003366]">−80%</p>
            <p className="text-xs text-gray-500 mt-1">Reduction in physical office visits for routine permits</p>
          </div>
          <div className="bg-white rounded-2xl border border-amber-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">First-submission approval</p>
            </div>
            <p className="text-3xl font-extrabold text-[#003366]">75%</p>
            <p className="text-xs text-gray-500 mt-1">Target rate when pre-validation is enabled</p>
          </div>
          <div className="bg-white rounded-2xl border border-amber-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Availability</p>
            </div>
            <p className="text-3xl font-extrabold text-[#003366]">24 / 7</p>
            <p className="text-xs text-gray-500 mt-1">Submission available outside office hours</p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#003366] uppercase tracking-wider">Baseline indicators</h2>
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">[DLWD to confirm]</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Annual permit volume" value="~3,500" sub="Estimate — awaiting Department confirmation" accent="text-gray-500" />
          <StatCard label="Active permit holders" value="~4,500" sub="Estimate — awaiting Department confirmation" accent="text-gray-500" />
          <StatCard label="Processing staff (FTE)" value="—" sub="[DLWD to confirm]" accent="text-gray-400" />
          <StatCard label="Current backlog" value="—" sub="[DLWD to confirm]" accent="text-gray-400" />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
          <h2 className="text-xl font-bold text-[#003366] mb-2">Questions about these figures?</h2>
          <p className="text-sm text-gray-600 mb-5">
            The <Link to="/roadmap" className="font-semibold text-[#003366] hover:underline">delivery roadmap</Link> explains what is shipping now and what Phase 2 delivers. Known limitations are listed <Link to="/limitations" className="font-semibold text-[#003366] hover:underline">here</Link>.
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
