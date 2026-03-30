import { useState, useMemo, useCallback } from 'react';
import {
  BarChart3, PieChart, Download, Calendar, FileText, AlertTriangle,
  Briefcase, DollarSign, TrendingUp, Filter, ShieldAlert, ClipboardCheck,
  Users, Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatDateShort, getStatusLabel, getStorage } from '../../utils/helpers';
import { PERMIT_STATUSES, DEPT_ROLES } from '../../data/constants';

const ALLOWED_ROLES = ['commissioner', 'deputy_commissioner', 'inspector'];

/* ---- status color map for chart ---- */
const STATUS_COLORS = {
  draft: '#9ca3af', submitted: '#3b82f6', under_review: '#8b5cf6',
  pending_payment: '#eab308', approved: '#22c55e', rejected: '#ef4444',
  expired: '#f97316', cancelled: '#6b7280',
};

/* ---- Report sections ---- */
const REPORT_SECTIONS = [
  { id: 'permits', label: 'Permits', icon: FileText },
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
  { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
  { id: 'employment', label: 'Employment', icon: Briefcase },
  { id: 'inspections', label: 'Inspections', icon: ClipboardCheck },
];

/* ---- chart helper components ---- */

function PieChartVisual({ slices }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) {
    return (
      <div className="w-40 h-40 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
        No data
      </div>
    );
  }
  let cum = 0;
  const stops = slices.map(sl => {
    const start = cum;
    const pct = (sl.value / total) * 100;
    cum += pct;
    return `${sl.color} ${start}% ${cum}%`;
  }).join(', ');

  return (
    <div
      className="w-40 h-40 mx-auto rounded-full shadow-inner"
      style={{ background: `conic-gradient(${stops})` }}
    />
  );
}

function HorizontalBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 font-medium truncate pr-2">{label}</span>
        <span className="text-gray-500 font-semibold flex-shrink-0">{value}</span>
      </div>
      <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color || '#7c3aed' }}
        />
      </div>
    </div>
  );
}

function VerticalBarChart({ data, barColor }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-48">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
          <span className="text-[10px] font-semibold text-gray-600 mb-1">{d.value}</span>
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${Math.max((d.value / max) * 100, 4)}%`,
              backgroundColor: typeof barColor === 'function' ? barColor(i, data.length) : (barColor || '#7c3aed'),
            }}
          />
          <span className="text-[10px] text-gray-500 mt-2 truncate max-w-full">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ---- Access Denied ---- */
function AccessDenied() {
  return (
    <div className="max-w-lg mx-auto mt-20 text-center">
      <div className="w-20 h-20 mx-auto mb-6 bg-purple-50 rounded-full flex items-center justify-center">
        <ShieldAlert className="w-10 h-10 text-[#7c3aed]" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-500">Insufficient Permissions</p>
      <p className="text-sm text-gray-400 mt-2">
        Reports are accessible to the Commissioner, Deputy Commissioner, and Inspectors only.
      </p>
    </div>
  );
}

/* ---- Export helper ---- */
function exportToCSV(headers, rows, filename) {
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ================================================================ */

export default function Reports() {
  const { permits, disputes, jobs, applications } = useApp();
  const { user, getAllUsers, hasPermission } = useAuth();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeSection, setActiveSection] = useState('permits');

  /* ---------- Permission gate ---------- */
  if (!user || !hasPermission('reports') || !ALLOWED_ROLES.includes(user.deptRole)) {
    return <AccessDenied />;
  }

  const isInspector = user.deptRole === 'inspector';

  // Inspector can only see inspections and compliance stats
  const visibleSections = isInspector
    ? REPORT_SECTIONS.filter(s => s.id === 'inspections')
    : REPORT_SECTIONS;

  /* date-filtered permits */
  const filteredPermits = useMemo(() => {
    let list = permits;
    if (dateFrom) list = list.filter(p => new Date(p.submittedAt || p.createdAt) >= new Date(dateFrom));
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      list = list.filter(p => new Date(p.submittedAt || p.createdAt) <= to);
    }
    return list;
  }, [permits, dateFrom, dateTo]);

  /* ---- Permit stats ---- */
  const statusSlices = useMemo(() => {
    return Object.values(PERMIT_STATUSES).map(s => ({
      label: getStatusLabel(s),
      value: filteredPermits.filter(p => p.status === s).length,
      color: STATUS_COLORS[s] || '#9ca3af',
    })).filter(s => s.value > 0);
  }, [filteredPermits]);

  const typeData = useMemo(() => {
    const map = {};
    filteredPermits.forEach(p => {
      const t = p.type || 'unknown';
      map[t] = (map[t] || 0) + 1;
    });
    return Object.entries(map)
      .map(([k, v]) => ({ label: k.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value: v }))
      .sort((a, b) => b.value - a.value);
  }, [filteredPermits]);
  const maxType = Math.max(...typeData.map(d => d.value), 1);

  const monthlyData = useMemo(() => {
    const data = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const count = filteredPermits.filter(p => {
        const pd = new Date(p.submittedAt || p.createdAt);
        return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
      }).length;
      data.push({ label, value: count });
    }
    return data;
  }, [filteredPermits]);

  // Processing time averages (in days)
  const avgProcessingTime = useMemo(() => {
    const processed = filteredPermits.filter(p => (p.status === 'approved' || p.status === 'rejected') && p.submittedAt && p.updatedAt);
    if (processed.length === 0) return 0;
    const totalDays = processed.reduce((sum, p) => {
      return sum + (new Date(p.updatedAt) - new Date(p.submittedAt)) / (1000 * 60 * 60 * 24);
    }, 0);
    return Math.round(totalDays / processed.length);
  }, [filteredPermits]);

  /* ---- Revenue stats ---- */
  const revenue = useMemo(() => {
    let total = 0;
    let byType = {};
    filteredPermits.forEach(p => {
      if (p.status === 'approved' || p.status === 'pending_payment') {
        const fee = parseFloat(p.totalFee || p.fee || 0);
        total += fee;
        const t = p.type || 'unknown';
        byType[t] = (byType[t] || 0) + fee;
      }
    });
    return { total, byType };
  }, [filteredPermits]);

  const revenueByType = useMemo(() => {
    return Object.entries(revenue.byType)
      .map(([k, v]) => ({ label: k.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value: Math.round(v) }))
      .sort((a, b) => b.value - a.value);
  }, [revenue.byType]);
  const maxRevType = Math.max(...revenueByType.map(d => d.value), 1);

  /* ---- Dispute stats ---- */
  const disputeData = useMemo(() => {
    const map = {};
    disputes.forEach(d => {
      const cat = d.type || d.category || 'General';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map)
      .map(([k, v]) => ({ label: k.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value: v }))
      .sort((a, b) => b.value - a.value);
  }, [disputes]);
  const maxDispute = Math.max(...disputeData.map(d => d.value), 1);

  const disputeResolution = useMemo(() => {
    const resolved = disputes.filter(d => d.status === 'resolved' || d.status === 'closed').length;
    const total = disputes.length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const avgTime = (() => {
      const done = disputes.filter(d => (d.status === 'resolved' || d.status === 'closed') && d.filedAt && d.updatedAt);
      if (done.length === 0) return 0;
      return Math.round(done.reduce((s, d) => s + (new Date(d.updatedAt) - new Date(d.filedAt)) / (1000 * 60 * 60 * 24), 0) / done.length);
    })();
    return { resolved, total, rate, avgTime };
  }, [disputes]);

  /* ---- Employment stats ---- */
  const employmentStats = useMemo(() => {
    const totalJobs = jobs.length;
    const openJobs = jobs.filter(j => j.status === 'open').length;
    const filledJobs = jobs.filter(j => j.status === 'filled').length;
    const fillRate = totalJobs > 0 ? Math.round((filledJobs / totalJobs) * 100) : 0;
    const totalApps = applications.length;
    return { totalJobs, openJobs, filledJobs, fillRate, totalApps };
  }, [jobs, applications]);

  /* ---- Inspection stats (from localStorage) ---- */
  const inspections = useMemo(() => getStorage('bvi_inspections') || [], []);
  const inspectionStats = useMemo(() => {
    const total = inspections.length;
    const compliant = inspections.filter(i => i.overallStatus === 'compliant').length;
    const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;
    const violationMap = {};
    inspections.forEach(i => {
      (i.violations || []).forEach(v => {
        violationMap[v.category || 'Other'] = (violationMap[v.category || 'Other'] || 0) + 1;
      });
    });
    const violations = Object.entries(violationMap)
      .map(([k, v]) => ({ label: k, value: v }))
      .sort((a, b) => b.value - a.value);
    return { total, compliant, complianceRate, violations };
  }, [inspections]);
  const maxViolation = Math.max(...inspectionStats.violations.map(d => d.value), 1);

  /* ---- CSV exports ---- */
  const exportPermitsCSV = useCallback(() => {
    exportToCSV(
      ['Permit Number', 'Type', 'Status', 'Employee', 'Employer', 'Submitted', 'Salary', 'Fee'],
      filteredPermits.map(p => [
        p.permitNumber || '', p.type || '', p.status || '',
        `${p.employeeFirstName || p.firstName || ''} ${p.employeeLastName || p.lastName || ''}`.trim(),
        p.employerName || p.employer || '', p.submittedAt || '', p.salary || '', p.totalFee || p.fee || '',
      ]),
      'BVI_Permits_Report'
    );
  }, [filteredPermits]);

  const exportDisputesCSV = useCallback(() => {
    exportToCSV(
      ['Case Number', 'Category', 'Status', 'Filed', 'Last Updated'],
      disputes.map(d => [
        d.caseNumber || '', d.type || d.category || '', d.status || '', d.filedAt || '', d.updatedAt || '',
      ]),
      'BVI_Disputes_Report'
    );
  }, [disputes]);

  const exportRevenueCSV = useCallback(() => {
    exportToCSV(
      ['Permit Type', 'Revenue'],
      revenueByType.map(r => [r.label, `$${r.value.toLocaleString()}`]),
      'BVI_Revenue_Report'
    );
  }, [revenueByType]);

  const exportEmploymentCSV = useCallback(() => {
    exportToCSV(
      ['Job Number', 'Title', 'Status', 'Applicants', 'Posted'],
      jobs.map(j => [j.jobNumber || '', j.title || '', j.status || '', j.applicants || 0, j.postedAt || '']),
      'BVI_Employment_Report'
    );
  }, [jobs]);

  const exportInspectionsCSV = useCallback(() => {
    exportToCSV(
      ['Workplace', 'Date', 'Type', 'Status', 'Violations'],
      inspections.map(i => [
        i.workplaceName || '', i.date || '', i.type || '', i.overallStatus || '',
        (i.violations || []).length,
      ]),
      'BVI_Inspections_Report'
    );
  }, [inspections]);

  /* summary stats for all sections */
  const allUsers = getAllUsers();
  const summaryStats = [
    { label: 'Total Permits', value: filteredPermits.length, icon: FileText, color: 'text-[#7c3aed]', bg: 'bg-purple-50' },
    { label: 'Approved', value: filteredPermits.filter(p => p.status === 'approved').length, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active Disputes', value: disputes.filter(d => d.status !== 'resolved' && d.status !== 'closed').length, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Revenue (Est.)', value: `$${revenue.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-[#006633]', bg: 'bg-green-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#7c3aed] mb-1">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm">
            {isInspector ? 'Inspection reports and compliance statistics.' : 'Comprehensive overview of permits, disputes, revenue, employment, and inspections.'}
          </p>
        </div>
      </div>

      {/* Date range filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter size={16} className="text-[#7c3aed]" />
          <span className="font-medium">Date Range:</span>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field text-sm py-1.5" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field text-sm py-1.5" />
        </div>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-sm text-red-500 hover:text-red-700 font-medium">Clear</button>
        )}
      </div>

      {/* Summary stats (hidden for inspector) */}
      {!isInspector && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {summaryStats.map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className={`${s.bg} p-2.5 rounded-lg`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report section tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {visibleSections.map(sec => {
          const isActive = activeSection === sec.id;
          const SecIcon = sec.icon;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                isActive ? 'text-[#7c3aed]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SecIcon size={16} />
              {sec.label}
              {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7c3aed] rounded-t" />}
            </button>
          );
        })}
      </div>

      {/* ============= PERMITS SECTION ============= */}
      {activeSection === 'permits' && !isInspector && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={exportPermitsCSV} className="flex items-center gap-2 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] transition-colors">
              <Download size={16} /> Export Permits CSV
            </button>
          </div>

          {/* Processing time */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-2.5 rounded-lg">
                <Clock className="w-5 h-5 text-[#7c3aed]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{avgProcessingTime} days</p>
                <p className="text-xs text-gray-500">Average Processing Time</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie: permits by status */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#7c3aed] uppercase tracking-wider mb-4 flex items-center gap-2">
                <PieChart size={16} /> Permits by Status
              </h3>
              <PieChartVisual slices={statusSlices} />
              <div className="mt-4 grid grid-cols-2 gap-2">
                {statusSlices.map(s => (
                  <div key={s.label} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-gray-600 truncate">{s.label}</span>
                    <span className="ml-auto font-semibold text-gray-800">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar: permits by type */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#7c3aed] uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart3 size={16} /> Permits by Type
              </h3>
              {typeData.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No data available</p>
              ) : (
                <div className="space-y-3">
                  {typeData.map((d, i) => (
                    <HorizontalBar key={d.label} label={d.label} value={d.value} max={maxType} color={i === 0 ? '#7c3aed' : '#a78bfa'} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Monthly trend */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-[#7c3aed] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar size={16} /> Monthly Applications Trend (Last 12 Months)
            </h3>
            <VerticalBarChart data={monthlyData} barColor={(i, len) => i === len - 1 ? '#7c3aed' : '#a78bfa'} />
          </div>
        </div>
      )}

      {/* ============= REVENUE SECTION ============= */}
      {activeSection === 'revenue' && !isInspector && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={exportRevenueCSV} className="flex items-center gap-2 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] transition-colors">
              <Download size={16} /> Export Revenue CSV
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center p-6 bg-green-50">
              <p className="text-3xl font-bold text-green-700">${revenue.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <p className="text-sm text-green-600 mt-1">Total Estimated Revenue</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center p-6 bg-purple-50">
              <p className="text-3xl font-bold text-[#7c3aed]">{filteredPermits.filter(p => p.status === 'approved').length}</p>
              <p className="text-sm text-purple-700 mt-1">Approved Permits</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center p-6 bg-amber-50">
              <p className="text-3xl font-bold text-amber-700">{filteredPermits.filter(p => p.status === 'pending_payment').length}</p>
              <p className="text-sm text-amber-600 mt-1">Pending Payment</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-[#7c3aed] uppercase tracking-wider mb-4 flex items-center gap-2">
              <DollarSign size={16} /> Revenue by Permit Type
            </h3>
            {revenueByType.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No revenue data available</p>
            ) : (
              <div className="space-y-3">
                {revenueByType.map((d, i) => (
                  <HorizontalBar key={d.label} label={d.label} value={`$${d.value.toLocaleString()}`} max={maxRevType} color={i === 0 ? '#7c3aed' : '#a78bfa'} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============= DISPUTES SECTION ============= */}
      {activeSection === 'disputes' && !isInspector && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={exportDisputesCSV} className="flex items-center gap-2 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] transition-colors">
              <Download size={16} /> Export Disputes CSV
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-2xl font-bold text-gray-900">{disputeResolution.total}</p>
              <p className="text-xs text-gray-500">Total Disputes</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-2xl font-bold text-green-600">{disputeResolution.resolved}</p>
              <p className="text-xs text-gray-500">Resolved</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-2xl font-bold text-[#7c3aed]">{disputeResolution.rate}%</p>
              <p className="text-xs text-gray-500">Resolution Rate</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-2xl font-bold text-amber-600">{disputeResolution.avgTime} days</p>
              <p className="text-xs text-gray-500">Avg Resolution Time</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-[#7c3aed] uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle size={16} /> Disputes by Category
            </h3>
            {disputeData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No dispute data available</p>
            ) : (
              <div className="space-y-3">
                {disputeData.map((d, i) => (
                  <HorizontalBar key={d.label} label={d.label} value={d.value} max={maxDispute} color={i === 0 ? '#ef4444' : '#f97316'} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============= EMPLOYMENT SECTION ============= */}
      {activeSection === 'employment' && !isInspector && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={exportEmploymentCSV} className="flex items-center gap-2 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] transition-colors">
              <Download size={16} /> Export Employment CSV
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-2xl font-bold text-gray-900">{employmentStats.totalJobs}</p>
              <p className="text-xs text-gray-500">Total Job Postings</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-2xl font-bold text-green-600">{employmentStats.openJobs}</p>
              <p className="text-xs text-gray-500">Open Vacancies</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-2xl font-bold text-[#7c3aed]">{employmentStats.fillRate}%</p>
              <p className="text-xs text-gray-500">Vacancy Fill Rate</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-2xl font-bold text-blue-600">{employmentStats.totalApps}</p>
              <p className="text-xs text-gray-500">Total Applications</p>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-sm text-[#7c3aed] font-medium">Job Placements</p>
            <p className="text-3xl font-bold text-[#7c3aed] mt-1">{employmentStats.filledJobs}</p>
            <p className="text-xs text-gray-500 mt-1">Positions successfully filled through the Job Centre</p>
          </div>
        </div>
      )}

      {/* ============= INSPECTIONS SECTION ============= */}
      {activeSection === 'inspections' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={exportInspectionsCSV} className="flex items-center gap-2 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] transition-colors">
              <Download size={16} /> Export Inspections CSV
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-2xl font-bold text-gray-900">{inspectionStats.total}</p>
              <p className="text-xs text-gray-500">Total Inspections</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-2xl font-bold text-green-600">{inspectionStats.complianceRate}%</p>
              <p className="text-xs text-gray-500">Compliance Rate</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-2xl font-bold text-red-600">{inspectionStats.violations.reduce((s, v) => s + v.value, 0)}</p>
              <p className="text-xs text-gray-500">Total Violations</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-[#7c3aed] uppercase tracking-wider mb-4 flex items-center gap-2">
              <ClipboardCheck size={16} /> Violations by Category
            </h3>
            {inspectionStats.violations.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No violation data available. Violations will appear here once inspections are recorded.</p>
            ) : (
              <div className="space-y-3">
                {inspectionStats.violations.map((d, i) => (
                  <HorizontalBar key={d.label} label={d.label} value={d.value} max={maxViolation} color={i === 0 ? '#ef4444' : '#f97316'} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
