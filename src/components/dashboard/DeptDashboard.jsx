import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatDateShort, getStatusColor, getStatusLabel, daysUntilExpiry, getStorage } from '../../utils/helpers';
import { DEPT_ROLES } from '../../data/constants';
import {
  FileText, AlertTriangle, Briefcase, Users, ClipboardCheck,
  BarChart3, ArrowRight, Clock, CheckCircle2, XCircle, Eye,
  TrendingUp, Shield, Bell, DollarSign, Search, Calendar,
  UserCheck, Scale, Clipboard, Receipt, Building2, Activity, RefreshCw,
  Camera, Printer, PackageCheck, IdCard, AlertCircle,
} from 'lucide-react';

/**
 * Wipe every localStorage key the app seeds so the next AppProvider mount
 * reseeds with fresh demo data. Used by the Commissioner-only "Reset demo
 * data" button for the government presentation.
 */
function resetDemoData() {
  const keys = [
    'bvi_permits', 'bvi_disputes', 'bvi_jobs', 'bvi_applications',
    'bvi_documents', 'bvi_notifications', 'bvi_appeals', 'bvi_transfers',
    'bvi_variations', 'bvi_cards', 'bvi_inspections',
    'bvi_data_seeded_v2026', 'bvi_data_seeded_v2026_cards',
    'bvi_data_seeded_v2026_inspections', 'bvi_audit_log',
    'bvi_demo_banner_dismissed',
    'bvi_permit_draft_new', 'bvi_permit_draft_renewal', 'bvi_permit_draft_temp',
  ];
  keys.forEach(k => localStorage.removeItem(k));
  window.location.reload();
}

const ACCENT = '#7c3aed';

// ============================================================
// Sub-dashboard for Commissioner / Deputy Commissioner
// ============================================================
function CommissionerDashboard({ permits, disputes, jobs, applications, allUsers, notifications, navigate }) {
  const activePermits = permits.filter(p => p.status === 'approved');
  const pendingApps = permits.filter(p => p.status === 'submitted' || p.status === 'under_review');
  const openDisputes = disputes.filter(d => d.status !== 'resolved' && d.status !== 'closed');
  const businesses = allUsers.filter(u => u.role === 'employer' || u.portal === 'business');
  const workers = allUsers.filter(u => u.role === 'employee' || u.portal === 'worker');

  // Pipeline counts
  const pipeline = {
    submitted: permits.filter(p => p.status === 'submitted').length,
    under_review: permits.filter(p => p.status === 'under_review').length,
    pending_payment: permits.filter(p => p.status === 'pending_payment').length,
    approved: permits.filter(p => p.status === 'approved').length,
  };

  // Workload per assigned dept staff (computed from permits + disputes + cards)
  const workloadByOfficer = (() => {
    const counts = new Map();
    const touched = [...permits, ...disputes];
    for (const item of touched) {
      if (!item.assignedTo) continue;
      counts.set(item.assignedTo, (counts.get(item.assignedTo) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([userId, count]) => {
        const u = allUsers.find(x => x.id === userId);
        return {
          id: userId,
          name: u ? `${u.firstName} ${u.lastName}` : userId,
          role: (u?.deptRole || '').replace(/_/g, ' '),
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  })();

  // Revenue — compute using the approved permit salaries + fee schedule
  const revenue = (() => {
    const APPLICATION_FEE = 50;
    let total = 0;
    for (const p of activePermits) {
      const salary = Number(p.salary || 0);
      if (!salary) { total += APPLICATION_FEE; continue; }
      let fee = 0;
      if (salary <= 25000) fee = salary * 0.03;
      else if (salary <= 50000) fee = 25000 * 0.03 + (salary - 25000) * 0.05;
      else fee = 25000 * 0.03 + 25000 * 0.05 + (salary - 50000) * 0.07;
      total += Math.min(fee, 10000) + APPLICATION_FEE;
    }
    const byType = {};
    for (const p of activePermits) {
      byType[p.type || 'new'] = (byType[p.type || 'new'] || 0) + 1;
    }
    return { total: Math.round(total), permitCount: activePermits.length, byType };
  })();

  const statCards = [
    { title: 'Total Active Permits', value: activePermits.length, icon: FileText, lightColor: 'bg-purple-50', textColor: 'text-purple-700' },
    { title: 'Pending Applications', value: pendingApps.length, icon: ClipboardCheck, lightColor: 'bg-blue-50', textColor: 'text-blue-700' },
    { title: 'Open Disputes', value: openDisputes.length, icon: AlertTriangle, lightColor: 'bg-red-50', textColor: 'text-red-600' },
    { title: 'Registered Businesses', value: businesses.length, icon: Building2, lightColor: 'bg-amber-50', textColor: 'text-amber-700' },
    { title: 'Registered Workers', value: workers.length, icon: Users, lightColor: 'bg-green-50', textColor: 'text-green-700' },
  ];

  return (
    <>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className={`${card.lightColor} p-2.5 rounded-lg w-fit mb-3`}>
              <card.icon className={`w-5 h-5 ${card.textColor}`} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
            <p className="text-xs font-medium text-gray-500 mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Permits Pipeline */}
      <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-purple-900 mb-4">Permits Pipeline</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Submitted', count: pipeline.submitted, color: 'bg-blue-500' },
            { label: 'Under Review', count: pipeline.under_review, color: 'bg-purple-500' },
            { label: 'Pending Payment', count: pipeline.pending_payment, color: 'bg-yellow-500' },
            { label: 'Approved', count: pipeline.approved, color: 'bg-green-500' },
          ].map((step, idx) => (
            <div key={step.label} className="relative text-center">
              <div className={`${step.color} rounded-xl p-4 text-white`}>
                <p className="text-3xl font-bold">{step.count}</p>
                <p className="text-xs mt-1 opacity-90">{step.label}</p>
              </div>
              {idx < 3 && (
                <ArrowRight className="hidden sm:block absolute top-1/2 -right-3 w-5 h-5 text-gray-300 -translate-y-1/2 z-10" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Staff Workload */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-purple-900">Staff Workload Overview</h2>
          </div>
          <div className="p-6">
            {workloadByOfficer.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No cases currently assigned to staff.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {workloadByOfficer.map(w => {
                  const max = workloadByOfficer[0].count || 1;
                  const pct = Math.round((w.count / max) * 100);
                  return (
                    <li key={w.id}>
                      <div className="flex items-center justify-between mb-1 text-sm">
                        <span className="font-medium text-gray-800 truncate">{w.name} <span className="text-gray-400 text-xs capitalize">· {w.role}</span></span>
                        <span className="font-semibold text-purple-700">{w.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-purple-100 overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Revenue Summary — computed from approved permits + fee schedule */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-purple-900">Revenue Summary</h2>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Simulated · Phase 2 integrates payments
            </span>
          </div>
          <div className="p-6">
            <div className="flex items-end gap-3 mb-5">
              <div>
                <p className="text-3xl font-extrabold text-[#003366]">
                  ${revenue.total.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Projected total from {revenue.permitCount} approved permit{revenue.permitCount === 1 ? '' : 's'} at current fee schedule
                </p>
              </div>
            </div>
            {Object.keys(revenue.byType).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">By permit type</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  {Object.entries(revenue.byType).map(([type, count]) => (
                    <li key={type} className="flex items-center justify-between">
                      <span className="capitalize">{type.replace(/-/g, ' ')}</span>
                      <span className="font-semibold text-gray-800">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
            <Activity className="w-5 h-5" /> Recent Activity
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {notifications.slice(0, 8).map(n => (
            <div key={n.id} className={`px-6 py-3 flex items-center gap-3 ${n.read ? 'opacity-60' : ''}`}>
              <div className={`w-2 h-2 rounded-full ${n.read ? 'bg-gray-300' : 'bg-purple-500'}`} />
              <p className="text-sm text-gray-700 flex-1">{n.message}</p>
              <span className="text-xs text-gray-400">{formatDateShort(n.createdAt)}</span>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">No recent activity</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Review Permits', icon: ClipboardCheck, path: '/dept/permits', badge: pendingApps.length },
          { label: 'Manage Disputes', icon: AlertTriangle, path: '/dept/disputes', badge: openDisputes.length },
          { label: 'View Reports', icon: BarChart3, path: '/dept/reports' },
          { label: 'Manage Users', icon: Users, path: '/dept/users' },
        ].map(action => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-purple-200 transition-all text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <action.icon className="w-6 h-6 text-purple-700" />
              {action.badge > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{action.badge}</span>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-900">{action.label}</p>
          </button>
        ))}
      </div>
    </>
  );
}

// ============================================================
// Sub-dashboard for Permit Officer
// ============================================================
function PermitOfficerDashboard({ permits, user, navigate }) {
  const myQueue = permits.filter(p =>
    user && p.assignedTo === user.id &&
    (p.status === 'submitted' || p.status === 'under_review')
  );
  const submittedUnassigned = permits.filter(p => p.status === 'submitted' && !p.assignedTo);
  const underReview = permits.filter(p => p.status === 'under_review');
  const pendingPayment = permits.filter(p => p.status === 'pending_payment');

  // Table shows the officer's own queue, or falls back to all pending if none assigned yet
  const pendingReview = myQueue.length > 0
    ? myQueue
    : permits.filter(p => p.status === 'submitted' || p.status === 'under_review');

  const statCards = [
    { title: 'My Queue', value: myQueue.length, icon: ClipboardCheck, lightColor: 'bg-purple-50', textColor: 'text-purple-600' },
    { title: 'Submitted (Unassigned)', value: submittedUnassigned.length, icon: FileText, lightColor: 'bg-blue-50', textColor: 'text-blue-700' },
    { title: 'Under Review', value: underReview.length, icon: Eye, lightColor: 'bg-amber-50', textColor: 'text-amber-700' },
    { title: 'Pending Payment', value: pendingPayment.length, icon: DollarSign, lightColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map(card => (
          <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className={`${card.lightColor} p-3 rounded-lg w-fit mb-3`}>
              <card.icon className={`w-6 h-6 ${card.textColor}`} />
            </div>
            <h3 className={`text-3xl font-bold text-gray-900 ${card.isText ? 'text-xl' : ''}`}>{card.value}</h3>
            <p className="text-sm font-medium text-gray-500 mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Permit Queue */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-purple-900">My Permit Queue</h2>
          <button
            onClick={() => navigate('/dept/permits')}
            className="text-sm text-purple-700 hover:text-purple-900 flex items-center gap-1 font-medium"
          >
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {pendingReview.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Permit #</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Applicant</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Submitted</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendingReview.slice(0, 10).map(permit => (
                  <tr key={permit.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-purple-700">{permit.permitNumber}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{permit.employeeName || 'N/A'}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 capitalize">{permit.type?.replace(/-/g, ' ') || 'N/A'}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{formatDateShort(permit.submittedAt)}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(permit.status)}`}>
                        {getStatusLabel(permit.status)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => navigate(`/dept/permits/${permit.id}`)}
                        className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 font-medium transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-400">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400" />
            <p>All caught up! No permits pending review.</p>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================
// Sub-dashboard for Dispute Officer
// ============================================================
function DisputeOfficerDashboard({ disputes, user, navigate }) {
  const openStatuses = ['filed', 'investigating', 'mediation'];
  const openCases = disputes.filter(d => openStatuses.includes(d.status));
  const myCases = disputes.filter(d => d.assignedTo && user && d.assignedTo === user.id && d.status !== 'resolved' && d.status !== 'closed');

  // Resolved this week (since the start of the current ISO week, Monday)
  const weekStart = (() => {
    const d = new Date();
    const dow = (d.getDay() + 6) % 7; // Mon=0
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - dow);
    return d;
  })();
  const resolvedThisWeek = disputes.filter(d =>
    d.status === 'resolved' && d.updatedAt && new Date(d.updatedAt) >= weekStart
  );

  const activeCases = disputes.filter(d => d.status !== 'resolved' && d.status !== 'closed');
  const inMediation = disputes.filter(d => d.status === 'mediation');

  const statCards = [
    { title: 'Open Disputes', value: openCases.length, icon: AlertTriangle, lightColor: 'bg-red-50', textColor: 'text-red-600' },
    { title: 'My Assigned Cases', value: myCases.length, icon: Scale, lightColor: 'bg-purple-50', textColor: 'text-purple-600' },
    { title: 'Resolved This Week', value: resolvedThisWeek.length, icon: CheckCircle2, lightColor: 'bg-green-50', textColor: 'text-green-700' },
    { title: 'In Mediation', value: inMediation.length, icon: Clock, lightColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map(card => (
          <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className={`${card.lightColor} p-3 rounded-lg w-fit mb-3`}>
              <card.icon className={`w-6 h-6 ${card.textColor}`} />
            </div>
            <h3 className={`text-3xl font-bold text-gray-900 ${card.isText ? 'text-xl' : ''}`}>{card.value}</h3>
            <p className="text-sm font-medium text-gray-500 mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Case List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-purple-900">My Cases</h2>
          <button
            onClick={() => navigate('/dept/disputes')}
            className="text-sm text-purple-700 hover:text-purple-900 flex items-center gap-1 font-medium"
          >
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {activeCases.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {activeCases.slice(0, 8).map(dispute => (
              <div key={dispute.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    dispute.status === 'filed' ? 'bg-red-100' :
                    dispute.status === 'mediation' ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    <AlertTriangle className={`w-5 h-5 ${
                      dispute.status === 'filed' ? 'text-red-600' :
                      dispute.status === 'mediation' ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{dispute.caseNumber}</p>
                    <p className="text-xs text-gray-500">{(dispute.type || 'labour_dispute').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} — Filed {formatDateShort(dispute.filedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}>
                    {getStatusLabel(dispute.status)}
                  </span>
                  <button
                    onClick={() => navigate(`/dept/disputes/${dispute.id}`)}
                    className="p-2 text-purple-700 hover:bg-purple-50 rounded-lg"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-400">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400" />
            <p>No active dispute cases</p>
          </div>
        )}
      </div>

      {/* Upcoming Mediations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-purple-900">Upcoming Mediations</h2>
        </div>
        <div className="p-6">
          {inMediation.length > 0 ? (
            <div className="space-y-3">
              {inMediation.slice(0, 5).map(d => (
                <div key={d.id} className="flex items-center gap-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <Scale className="w-5 h-5 text-yellow-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{d.caseNumber} — {(d.type || 'dispute').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    <p className="text-xs text-gray-500">Currently in mediation</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-gray-400 py-6">No upcoming mediations scheduled</p>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================
// Sub-dashboard for Job Placement Officer
// ============================================================
function PlacementOfficerDashboard({ jobs, applications, allUsers, navigate }) {
  const openVacancies = jobs.filter(j => j.status === 'open');
  const seekers = allUsers.filter(u => u.role === 'jobseeker' || u.portal === 'jobseeker');
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const placementsThisMonth = applications.filter(a => {
    if (a.status !== 'accepted' && a.status !== 'approved') return false;
    const dt = new Date(a.appliedAt);
    return dt.getMonth() === thisMonth && dt.getFullYear() === thisYear;
  });

  const statCards = [
    { title: 'Open Vacancies', value: openVacancies.length, icon: Briefcase, lightColor: 'bg-blue-50', textColor: 'text-blue-700' },
    { title: 'Registered Seekers', value: seekers.length, icon: Users, lightColor: 'bg-green-50', textColor: 'text-green-700' },
    { title: 'Placements This Month', value: placementsThisMonth.length, icon: UserCheck, lightColor: 'bg-purple-50', textColor: 'text-purple-600' },
    { title: 'Pending Matches', value: applications.filter(a => a.status === 'submitted').length, icon: Search, lightColor: 'bg-amber-50', textColor: 'text-amber-700' },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map(card => (
          <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className={`${card.lightColor} p-3 rounded-lg w-fit mb-3`}>
              <card.icon className={`w-6 h-6 ${card.textColor}`} />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{card.value}</h3>
            <p className="text-sm font-medium text-gray-500 mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Vacancies */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-purple-900">Recent Vacancies</h2>
            <button onClick={() => navigate('/dept/placements')} className="text-sm text-purple-700 hover:text-purple-900 flex items-center gap-1 font-medium">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {openVacancies.length > 0 ? (
              openVacancies.slice(0, 6).map(job => (
                <div key={job.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.company || job.employerName || 'Employer'} - {job.applicants || 0} applicants</p>
                  </div>
                  <button onClick={() => navigate(`/dept/placements/${job.id}`)} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 font-medium">
                    View
                  </button>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">No open vacancies</div>
            )}
          </div>
        </div>

        {/* Placement Success Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-purple-900">Placement Metrics</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{placementsThisMonth.length}</p>
                <p className="text-xs text-gray-500 mt-1">Placed this month</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{applications.length}</p>
                <p className="text-xs text-gray-500 mt-1">Total applications</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">{openVacancies.length}</p>
                <p className="text-xs text-gray-500 mt-1">Vacancies to fill</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-700">{seekers.length}</p>
                <p className="text-xs text-gray-500 mt-1">Active seekers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// Sub-dashboard for Inspector
// ============================================================
function InspectorDashboard({ disputes = [], navigate }) {
  const inspections = getStorage('bvi_inspections') || [];
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const inspThisMonth = inspections.filter(i => {
    const d = new Date(i.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const totalViolations = inspections.reduce((s, i) => s + (i.violations || []).length, 0);
  const pendingFollowups = inspections.filter(i =>
    i.violations && i.violations.some(v => !v.resolved)
  ).length;
  const completed = inspections.filter(i => i.overallStatus);
  const compliant = completed.filter(i => i.overallStatus === 'compliant').length;
  const complianceRate = completed.length > 0 ? `${Math.round((compliant / completed.length) * 100)}%` : '--';

  // Workplace safety disputes open to an inspector
  const unsafeConditionsOpen = disputes.filter(d =>
    d.type === 'unsafe_conditions' && d.status !== 'resolved' && d.status !== 'closed'
  ).length;

  const hasInspectionsData = inspections.length > 0;

  const statCards = [
    { title: 'Inspections Scheduled', value: inspThisMonth.length || 0, icon: Clipboard, lightColor: 'bg-amber-50', textColor: 'text-amber-700', note: hasInspectionsData ? null : 'Phase 2' },
    { title: 'Open Safety Disputes', value: unsafeConditionsOpen, icon: AlertTriangle, lightColor: 'bg-red-50', textColor: 'text-red-600' },
    { title: 'Violations Found', value: totalViolations, icon: AlertCircle, lightColor: 'bg-orange-50', textColor: 'text-orange-700' },
    { title: 'Compliance Rate', value: complianceRate, icon: CheckCircle2, lightColor: 'bg-green-50', textColor: 'text-green-700', isText: true },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map(card => (
          <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className={`${card.lightColor} p-3 rounded-lg w-fit mb-3`}>
              <card.icon className={`w-6 h-6 ${card.textColor}`} />
            </div>
            <h3 className={`text-3xl font-bold text-gray-900 ${card.isText ? 'text-xl' : ''}`}>{card.value}</h3>
            <p className="text-sm font-medium text-gray-500 mt-1">{card.title}</p>
            {card.note && (
              <span className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-wide text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {card.note}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => navigate('/dept/inspections')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-purple-200 transition-all text-left flex items-center gap-4"
        >
          <div className="bg-purple-50 p-3 rounded-lg">
            <Clipboard className="w-6 h-6 text-purple-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Inspections</p>
            <p className="text-xs text-gray-500 mt-0.5">Scheduled visits and follow-ups</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300" />
        </button>
        <button
          onClick={() => navigate('/dept/reports')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-purple-200 transition-all text-left flex items-center gap-4"
        >
          <div className="bg-purple-50 p-3 rounded-lg">
            <BarChart3 className="w-6 h-6 text-purple-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Reports</p>
            <p className="text-xs text-gray-500 mt-0.5">Compliance and violation analytics</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Inspections */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-purple-900">Upcoming Inspections</h2>
            <button
              onClick={() => navigate('/dept/inspections')}
              className="text-sm text-purple-700 hover:text-purple-900 flex items-center gap-1 font-medium"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {(() => {
            const scheduled = inspections.filter(i => i.status === 'scheduled').sort((a, b) => new Date(a.date) - new Date(b.date));
            if (scheduled.length === 0) return (
              <div className="p-6 text-center py-12 text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No inspections scheduled</p>
                <p className="text-xs mt-1">Inspections will appear here once assigned.</p>
              </div>
            );
            return (
              <div className="divide-y divide-gray-50">
                {scheduled.slice(0, 5).map(i => (
                  <div key={i.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{i.workplaceName}</p>
                      <p className="text-xs text-gray-500">{i.island} - {formatDateShort(i.date)}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Scheduled</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Violation Follow-ups */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-purple-900">Violation Follow-up Tracker</h2>
          </div>
          {(() => {
            const withViolations = inspections.filter(i => i.violations && i.violations.some(v => !v.resolved));
            if (withViolations.length === 0) return (
              <div className="p-6 text-center py-12 text-gray-400">
                <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No outstanding follow-ups</p>
                <p className="text-xs mt-1">Follow-ups from inspections will appear here.</p>
              </div>
            );
            return (
              <div className="divide-y divide-gray-50">
                {withViolations.slice(0, 5).map(i => (
                  <div key={i.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{i.workplaceName}</p>
                      <p className="text-xs text-gray-500">{i.violations.filter(v => !v.resolved).length} unresolved violation(s)</p>
                    </div>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Pending</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}

// ============================================================
// Sub-dashboard for Cashier
// ============================================================
function CashierDashboard({ permits, navigate }) {
  const payments = getStorage('bvi_payments') || [];
  const receipts = getStorage('bvi_receipts') || [];
  const APPLICATION_FEE = 50;
  const today = new Date().toISOString().slice(0, 10);
  const isTodayIso = (iso) => iso && iso.slice(0, 10) === today;

  const pendingPermits = permits.filter(p => p.status === 'pending_payment');
  const approvedToday = permits.filter(p => p.status === 'approved' && isTodayIso(p.updatedAt));

  const todayPayments = payments.filter(p => p.status === 'verified' && isTodayIso(p.verifiedAt));
  // Prefer real payment totals if they exist, otherwise fall back to fee-count approximation
  const todayRevenue = todayPayments.length > 0
    ? todayPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
    : approvedToday.length * APPLICATION_FEE;

  const todayReceipts = receipts.filter(r => isTodayIso(r.issuedAt)).length;

  // Recent activity: last 5 permits that moved to pending_payment or approved
  const recentActivity = [...permits]
    .filter(p => p.status === 'pending_payment' || p.status === 'approved')
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    .slice(0, 5);

  const statCards = [
    { title: 'Pending Payments', value: pendingPermits.length, icon: Clock, lightColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
    { title: 'Approved Today', value: approvedToday.length, icon: CheckCircle2, lightColor: 'bg-green-50', textColor: 'text-green-700' },
    { title: 'Revenue Today', value: `$${todayRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: DollarSign, lightColor: 'bg-blue-50', textColor: 'text-blue-700', isText: true },
    { title: 'Receipts Issued', value: todayReceipts, icon: Receipt, lightColor: 'bg-purple-50', textColor: 'text-purple-600' },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map(card => (
          <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className={`${card.lightColor} p-3 rounded-lg w-fit mb-3`}>
              <card.icon className={`w-6 h-6 ${card.textColor}`} />
            </div>
            <h3 className={`text-3xl font-bold text-gray-900 ${card.isText ? 'text-xl' : ''}`}>{card.value}</h3>
            <p className="text-sm font-medium text-gray-500 mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Queue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-purple-900">Payment Queue</h2>
            <button
              onClick={() => navigate('/dept/payments')}
              className="text-sm text-purple-700 hover:text-purple-900 flex items-center gap-1 font-medium"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {(() => {
            const pendingPermits = permits.filter(p => p.status === 'pending_payment');
            if (pendingPermits.length === 0) return (
              <div className="p-6 text-center py-12 text-gray-400">
                <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No pending payments</p>
                <p className="text-xs mt-1">Payments awaiting verification will appear here.</p>
              </div>
            );
            return (
              <div className="divide-y divide-gray-50">
                {pendingPermits.slice(0, 5).map(p => (
                  <div key={p.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.permitNumber}</p>
                      <p className="text-xs text-gray-500">{p.employeeFirstName || p.firstName} {p.employeeLastName || p.lastName}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">${parseFloat(p.totalFee || p.fee || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Recent Payment Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-purple-900">Recent Activity</h2>
          </div>
          {recentActivity.length === 0 ? (
            <div className="p-6 text-center py-12 text-gray-400">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No recent payment activity</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentActivity.map(p => (
                <div key={p.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.permitNumber}</p>
                    <p className="text-xs text-gray-500">{p.employeeName || 'N/A'} - {getStatusLabel(p.status)}</p>
                  </div>
                  <span className="text-xs text-gray-400">{formatDateShort(p.updatedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================
// Sub-dashboard for Front Desk
// Centres on the physical ID-card lifecycle: photo → print → pickup.
// ============================================================
function FrontDeskDashboard({ cards = [], permits, navigate }) {
  const isToday = (iso) => {
    if (!iso) return false;
    const d = new Date(iso);
    const n = new Date();
    return d.getFullYear() === n.getFullYear()
      && d.getMonth() === n.getMonth()
      && d.getDate() === n.getDate();
  };

  const appointmentsToday = cards.filter(c =>
    c.appointment?.status === 'scheduled' && isToday(c.appointment?.scheduledAt)
  );
  const awaitingPhoto = cards.filter(c => !c.photo);
  const readyForPickup = cards.filter(c => c.print?.status === 'ready_for_pickup');
  const printQueue = cards.filter(c =>
    ['queued', 'printing', 'printed', 'print_failed'].includes(c.print?.status)
  );
  const failures = cards.filter(c => (c.print?.failureCount || 0) > 0);

  const statCards = [
    { title: "Today's Photo Appointments", value: appointmentsToday.length, icon: Camera, lightColor: 'bg-blue-50', textColor: 'text-blue-700' },
    { title: 'Awaiting Photo', value: awaitingPhoto.length, icon: IdCard, lightColor: 'bg-amber-50', textColor: 'text-amber-700' },
    { title: 'Ready for Pickup', value: readyForPickup.length, icon: PackageCheck, lightColor: 'bg-green-50', textColor: 'text-green-700' },
    { title: 'Print Queue Depth', value: printQueue.length, icon: Printer, lightColor: 'bg-purple-50', textColor: 'text-purple-600' },
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const searchResults = searchTerm.trim().length >= 3
    ? permits.filter(p =>
        p.permitNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <>
      {/* Print failure banner */}
      {failures.length > 0 && (() => {
        const totalFailures = failures.reduce((sum, c) => sum + (c.print?.failureCount || 0), 0);
        return (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              {totalFailures} print failure{totalFailures === 1 ? '' : 's'} across {failures.length} card{failures.length === 1 ? '' : 's'}
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              Review the print queue — failed jobs have been re-queued and workers&apos; digital IDs remain active.
            </p>
          </div>
          <button
            onClick={() => navigate('/dept/cards')}
            className="text-xs font-semibold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700"
          >
            Open Print Queue
          </button>
        </div>
        );
      })()}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className={`${card.lightColor} p-2.5 rounded-lg w-fit mb-3`}>
              <card.icon className={`w-5 h-5 ${card.textColor}`} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
            <p className="text-xs font-medium text-gray-500 mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Photo Queue', icon: Camera, badge: awaitingPhoto.length, path: '/dept/cards' },
          { label: 'Print Queue', icon: Printer, badge: printQueue.length, path: '/dept/cards' },
          { label: 'Pickup Desk', icon: PackageCheck, badge: readyForPickup.length, path: '/dept/cards' },
        ].map(action => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-purple-200 transition-all text-left flex items-center gap-4"
          >
            <div className="bg-purple-50 p-3 rounded-lg">
              <action.icon className="w-6 h-6 text-purple-700" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Go to {action.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{action.badge} item{action.badge === 1 ? '' : 's'} waiting</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300" />
          </button>
        ))}
      </div>

      {/* Quick Permit Lookup */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-purple-900">Quick Permit Lookup</h2>
        </div>
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by permit number or employee name..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-4 border border-gray-100 rounded-lg divide-y divide-gray-50">
              {searchResults.map(p => (
                <div key={p.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.permitNumber}</p>
                    <p className="text-xs text-gray-500">{p.employeeName || 'N/A'} - {getStatusLabel(p.status)}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/dept/permits/${p.id}`)}
                    className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 font-medium"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
          {searchTerm.trim().length >= 3 && searchResults.length === 0 && (
            <p className="mt-4 text-sm text-gray-400 text-center">No permits found matching your search.</p>
          )}
        </div>
      </div>

      {/* Today's Photo Appointments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
            <Camera className="w-5 h-5" /> Today's Photo Appointments
          </h2>
          <button
            onClick={() => navigate('/dept/cards')}
            className="text-sm text-purple-700 hover:text-purple-900 flex items-center gap-1 font-medium"
          >
            Open Photo Queue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {appointmentsToday.length === 0 ? (
          <div className="p-6 text-center py-12 text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No photo appointments scheduled for today</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {appointmentsToday
              .sort((a, b) => new Date(a.appointment.scheduledAt) - new Date(b.appointment.scheduledAt))
              .slice(0, 8)
              .map(c => {
                const t = new Date(c.appointment.scheduledAt);
                const time = t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={c.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.workerName || c.permitNumber || 'Worker'}</p>
                      <p className="text-xs text-gray-500">{c.appointment.location || 'Road Town office'}</p>
                    </div>
                    <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">{time}</span>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================
// Main DeptDashboard - selects sub-dashboard by deptRole
// ============================================================
export default function DeptDashboard() {
  const navigate = useNavigate();
  const { user, getAllUsers } = useAuth();
  const { permits, disputes, jobs, applications, notifications, cards = [] } = useApp();
  // Dashboard data is synchronous from localStorage — no need for a fake
  // 400ms loading spinner that flashed on every navigation. If a real
  // backend is wired in Phase 2, restore a Suspense boundary instead.

  const allUsers = getAllUsers();
  const deptRole = user?.deptRole || 'commissioner';

  // Determine role label
  const roleEntry = Object.values(DEPT_ROLES).find(r => r.id === deptRole);
  const roleLabel = roleEntry?.label || 'Department Staff';

  // Props to pass to sub-dashboards
  const commonProps = { permits, disputes, jobs, applications, allUsers, notifications, navigate };

  // Select sub-dashboard
  const renderSubDashboard = () => {
    switch (deptRole) {
      case 'commissioner':
      case 'deputy_commissioner':
        return <CommissionerDashboard {...commonProps} />;
      case 'permit_officer':
        return <PermitOfficerDashboard permits={permits} user={user} navigate={navigate} />;
      case 'dispute_officer':
        return <DisputeOfficerDashboard disputes={disputes} user={user} navigate={navigate} />;
      case 'placement_officer':
        return <PlacementOfficerDashboard jobs={jobs} applications={applications} allUsers={allUsers} navigate={navigate} />;
      case 'inspector':
        return <InspectorDashboard disputes={disputes} navigate={navigate} />;
      case 'cashier':
        return <CashierDashboard permits={permits} navigate={navigate} />;
      case 'front_desk':
        return <FrontDeskDashboard cards={cards} permits={permits} navigate={navigate} />;
      default:
        // Fallback: show commissioner view for admin-level users
        return <CommissionerDashboard {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome Banner */}
        <div className="mb-8 bg-gradient-to-r from-purple-700 to-purple-900 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                Welcome, {user?.firstName || 'Officer'}
              </h1>
              <p className="text-purple-200 mt-1">
                {roleLabel} - Department of Labour and Workforce Development
              </p>
            </div>
            <div className="flex items-center gap-3">
              {user?.deptRole === 'commissioner' && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all demo data to factory defaults? Any unsaved changes will be lost.')) {
                      resetDemoData();
                    }
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-white border border-white/30 hover:border-white/70 px-3 py-1.5 rounded-md transition-colors"
                  title="Reset all demo data to factory defaults"
                >
                  <RefreshCw className="w-3 h-3" /> Reset demo data
                </button>
              )}
              <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">{roleLabel}</span>
              </div>
            </div>
          </div>
          <p className="text-purple-200 text-sm mt-3">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Role-specific dashboard content */}
        {renderSubDashboard()}
      </div>
    </div>
  );
}
