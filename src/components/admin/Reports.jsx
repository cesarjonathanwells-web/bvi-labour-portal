import { useState, useMemo, useCallback } from 'react';
import {
  BarChart3, PieChart, Download, Calendar, FileText, AlertTriangle,
  Briefcase, DollarSign, TrendingUp, Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatDateShort, getStatusLabel } from '../../utils/helpers';
import { PERMIT_STATUSES } from '../../data/constants';

/* ---- status color map for chart ---- */
const STATUS_COLORS = {
  draft: '#9ca3af', submitted: '#3b82f6', under_review: '#8b5cf6',
  pending_payment: '#eab308', approved: '#22c55e', rejected: '#ef4444',
  expired: '#f97316', cancelled: '#6b7280',
};

/* ---- chart helper components ---- */

function PieChartVisual({ slices }) {
  // Simple div-based pie chart using conic-gradient
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
          style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color || '#003366' }}
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
              backgroundColor: typeof barColor === 'function' ? barColor(i, data.length) : (barColor || '#003366'),
            }}
          />
          <span className="text-[10px] text-gray-500 mt-2 truncate max-w-full">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ================================================================ */

export default function Reports() {
  const { permits, disputes, jobs } = useApp();
  const { getAllUsers } = useAuth();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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

  /* ---- Data for charts ---- */

  // 1. Permits by status
  const statusSlices = useMemo(() => {
    return Object.values(PERMIT_STATUSES).map(s => ({
      label: getStatusLabel(s),
      value: filteredPermits.filter(p => p.status === s).length,
      color: STATUS_COLORS[s] || '#9ca3af',
    })).filter(s => s.value > 0);
  }, [filteredPermits]);

  // 2. Permits by type
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

  // 3. Monthly trend (last 12 months)
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

  // 4. Top employers
  const employerData = useMemo(() => {
    const map = {};
    filteredPermits.forEach(p => {
      const e = p.employerName || p.employer || 'Unknown';
      map[e] = (map[e] || 0) + 1;
    });
    return Object.entries(map)
      .map(([k, v]) => ({ label: k, value: v }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredPermits]);
  const maxEmployer = Math.max(...employerData.map(d => d.value), 1);

  // 5. Disputes by category
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

  // 6. Revenue summary
  const revenue = useMemo(() => {
    let total = 0;
    filteredPermits.forEach(p => {
      if (p.status === 'approved' || p.status === 'pending_payment') {
        total += parseFloat(p.totalFee || p.fee || 0);
      }
    });
    return total;
  }, [filteredPermits]);

  /* ---- CSV export ---- */
  const exportCSV = useCallback(() => {
    const headers = ['Permit Number', 'Type', 'Status', 'Employee', 'Employer', 'Submitted', 'Salary', 'Fee'];
    const rows = filteredPermits.map(p => [
      p.permitNumber || '',
      p.type || '',
      p.status || '',
      `${p.employeeFirstName || p.firstName || ''} ${p.employeeLastName || p.lastName || ''}`.trim(),
      p.employerName || p.employer || '',
      p.submittedAt || '',
      p.salary || '',
      p.totalFee || p.fee || '',
    ]);

    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BVI_Permits_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredPermits]);

  /* summary stats */
  const allUsers = getAllUsers();
  const stats = [
    { label: 'Total Permits', value: filteredPermits.length, icon: FileText, color: 'text-[#003366]', bg: 'bg-blue-50' },
    { label: 'Approved', value: filteredPermits.filter(p => p.status === 'approved').length, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active Disputes', value: disputes.filter(d => d.status !== 'resolved' && d.status !== 'closed').length, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Revenue (Est.)', value: `$${revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-[#006633]', bg: 'bg-green-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="page-title mb-0">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm">Comprehensive overview of permit applications, disputes, and revenue.</p>
        </div>
        <button onClick={exportCSV} className="btn-primary text-sm self-start">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Date range filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter size={16} className="text-[#003366]" />
          <span className="font-medium">Date Range:</span>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input-field text-sm py-1.5"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input-field text-sm py-1.5"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
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

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie: permits by status */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-4 flex items-center gap-2">
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
          <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 size={16} /> Permits by Type
          </h3>
          {typeData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data available</p>
          ) : (
            <div className="space-y-3">
              {typeData.map((d, i) => (
                <HorizontalBar
                  key={d.label}
                  label={d.label}
                  value={d.value}
                  max={maxType}
                  color={i === 0 ? '#003366' : '#c5a55a'}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly trend */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
        <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Calendar size={16} /> Monthly Applications Trend (Last 12 Months)
        </h3>
        <VerticalBarChart
          data={monthlyData}
          barColor={(i, len) => i === len - 1 ? '#003366' : '#c5a55a'}
        />
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#c5a55a]" />
            <span>Previous Months</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#003366]" />
            <span>Current Month</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top employers */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Briefcase size={16} /> Top Employers by Permit Count
          </h3>
          {employerData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No employer data available</p>
          ) : (
            <div className="space-y-3">
              {employerData.map((d, i) => (
                <HorizontalBar
                  key={d.label}
                  label={d.label}
                  value={d.value}
                  max={maxEmployer}
                  color={i < 3 ? '#003366' : '#64748b'}
                />
              ))}
            </div>
          )}
        </div>

        {/* Disputes by category */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle size={16} /> Disputes by Category
          </h3>
          {disputeData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No dispute data available</p>
          ) : (
            <div className="space-y-3">
              {disputeData.map((d, i) => (
                <HorizontalBar
                  key={d.label}
                  label={d.label}
                  value={d.value}
                  max={maxDispute}
                  color={i === 0 ? '#ef4444' : '#f97316'}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revenue summary */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-4 flex items-center gap-2">
          <DollarSign size={16} /> Revenue Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <p className="text-3xl font-bold text-green-700">
              ${revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-green-600 mt-1">Total Estimated Fees</p>
            <p className="text-xs text-gray-500 mt-1">From approved &amp; pending payment permits</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <p className="text-3xl font-bold text-[#003366]">
              {filteredPermits.filter(p => p.status === 'approved').length}
            </p>
            <p className="text-sm text-blue-700 mt-1">Approved Permits</p>
            <p className="text-xs text-gray-500 mt-1">Revenue-generating applications</p>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-xl">
            <p className="text-3xl font-bold text-amber-700">
              {filteredPermits.filter(p => p.status === 'pending_payment').length}
            </p>
            <p className="text-sm text-amber-600 mt-1">Pending Payment</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting fee collection</p>
          </div>
        </div>
      </div>
    </div>
  );
}
