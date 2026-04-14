import { useState, useEffect } from 'react';
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
    'bvi_variations',
    'bvi_data_seeded_v2026', 'bvi_audit_log',
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
            <div className="text-center py-8 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Staff workload data will display here when officers are assigned cases.</p>
            </div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-purple-900">Revenue Summary</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-8 text-gray-400">
              <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Revenue tracking will display here once payments are processed.</p>
            </div>
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
function PermitOfficerDashboard({ permits, navigate }) {
  const pendingReview = permits.filter(p => p.status === 'submitted' || p.status === 'under_review');
  const today = new Date().toDateString();
  const approvedToday = permits.filter(p => p.status === 'approved' && new Date(p.updatedAt).toDateString() === today);
  const rejectedToday = permits.filter(p => p.status === 'rejected' && new Date(p.updatedAt).toDateString() === today);

  const statCards = [
    { title: 'Pending Review', value: pendingReview.length, icon: ClipboardCheck, lightColor: 'bg-blue-50', textColor: 'text-blue-700' },
    { title: 'Approved Today', value: approvedToday.length, icon: CheckCircle2, lightColor: 'bg-green-50', textColor: 'text-green-700' },
    { title: 'Rejected Today', value: rejectedToday.length, icon: XCircle, lightColor: 'bg-red-50', textColor: 'text-red-600' },
    { title: 'Avg Processing Time', value: '--', icon: Clock, lightColor: 'bg-purple-50', textColor: 'text-purple-600', isText: true },
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
function DisputeOfficerDashboard({ disputes, navigate }) {
  const activeCases = disputes.filter(d => d.status !== 'resolved' && d.status !== 'closed');
  const inMediation = disputes.filter(d => d.status === 'mediation');
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const resolvedThisMonth = disputes.filter(d => {
    if (d.status !== 'resolved') return false;
    const dt = new Date(d.updatedAt);
    return dt.getMonth() === thisMonth && dt.getFullYear() === thisYear;
  });

  const statCards = [
    { title: 'Active Cases', value: activeCases.length, icon: AlertTriangle, lightColor: 'bg-red-50', textColor: 'text-red-600' },
    { title: 'In Mediation', value: inMediation.length, icon: Scale, lightColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
    { title: 'Resolved This Month', value: resolvedThisMonth.length, icon: CheckCircle2, lightColor: 'bg-green-50', textColor: 'text-green-700' },
    { title: 'Avg Resolution Time', value: '--', icon: Clock, lightColor: 'bg-purple-50', textColor: 'text-purple-600', isText: true },
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
                    <p className="text-xs text-gray-500">{dispute.type || 'Labour Dispute'} - Filed {formatDateShort(dispute.filedAt)}</p>
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
                    <p className="text-sm font-medium text-gray-900">{d.caseNumber} - {d.type || 'Dispute'}</p>
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
function InspectorDashboard({ navigate }) {
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

  const statCards = [
    { title: 'Inspections This Month', value: inspThisMonth.length, icon: Clipboard, lightColor: 'bg-amber-50', textColor: 'text-amber-700' },
    { title: 'Violations Found', value: totalViolations, icon: AlertTriangle, lightColor: 'bg-red-50', textColor: 'text-red-600' },
    { title: 'Follow-ups Due', value: pendingFollowups, icon: Clock, lightColor: 'bg-blue-50', textColor: 'text-blue-700' },
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
          </div>
        ))}
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
  const today = new Date().toISOString().slice(0, 10);
  const todayPayments = payments.filter(p => p.status === 'verified' && p.verifiedAt && p.verifiedAt.slice(0, 10) === today);
  const todayRevenue = todayPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const pendingCount = permits.filter(p => p.status === 'pending_payment').length;
  const todayReceipts = receipts.filter(r => r.issuedAt && r.issuedAt.slice(0, 10) === today).length;

  const statCards = [
    { title: 'Payments Today', value: todayPayments.length, icon: DollarSign, lightColor: 'bg-green-50', textColor: 'text-green-700' },
    { title: 'Revenue Today', value: `$${todayRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: TrendingUp, lightColor: 'bg-blue-50', textColor: 'text-blue-700', isText: true },
    { title: 'Pending Verifications', value: pendingCount, icon: Clock, lightColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
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

        {/* Daily Revenue Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-purple-900">Daily Revenue Summary</h2>
          </div>
          {todayPayments.length === 0 ? (
            <div className="p-6 text-center py-12 text-gray-400">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No transactions recorded today</p>
              <p className="text-xs mt-1">Revenue data will populate as payments are processed.</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="bg-green-50 rounded-xl p-5 text-center">
                <p className="text-3xl font-bold text-green-700">${todayRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                <p className="text-sm text-green-600 mt-1">{todayPayments.length} payment(s) verified today</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================
// Sub-dashboard for Front Desk
// ============================================================
function FrontDeskDashboard({ permits, navigate }) {
  const appointments = getStorage('bvi_appointments') || [];
  const walkins = getStorage('bvi_walkins') || [];
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAppointments = appointments.filter(a => a.date === todayStr);
  const todayWalkins = walkins.filter(w => w.date === todayStr);
  const totalVisitors = todayAppointments.length + todayWalkins.length;

  const statCards = [
    { title: "Today's Appointments", value: todayAppointments.length, icon: Calendar, lightColor: 'bg-blue-50', textColor: 'text-blue-700' },
    { title: 'Walk-ins', value: todayWalkins.length, icon: Users, lightColor: 'bg-green-50', textColor: 'text-green-700' },
    { title: 'Visitors Today', value: totalVisitors, icon: UserCheck, lightColor: 'bg-purple-50', textColor: 'text-purple-600' },
    { title: 'Available Slots', value: Math.max(0, 16 - todayAppointments.length), icon: Clock, lightColor: 'bg-amber-50', textColor: 'text-amber-700' },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-purple-900">Today's Appointment Schedule</h2>
            <button
              onClick={() => navigate('/dept/appointments')}
              className="text-sm text-purple-700 hover:text-purple-900 flex items-center gap-1 font-medium"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {todayAppointments.length === 0 ? (
            <div className="p-6 text-center py-12 text-gray-400">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No appointments scheduled for today</p>
              <p className="text-xs mt-1">Appointments will appear here once booked.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {todayAppointments.sort((a, b) => a.time.localeCompare(b.time)).slice(0, 6).map(a => (
                <div key={a.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.visitorName}</p>
                    <p className="text-xs text-gray-500">{a.purpose}</p>
                  </div>
                  <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">{a.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visitor Log */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-purple-900">Visitor Log</h2>
          </div>
          {todayWalkins.length === 0 ? (
            <div className="p-6 text-center py-12 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No visitors logged today</p>
              <p className="text-xs mt-1">Log walk-in visitors for tracking.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {todayWalkins.map(w => (
                <div key={w.id} className="px-6 py-3 flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-600 w-16">{w.time}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{w.visitorName}</p>
                    <p className="text-xs text-gray-500">{w.purpose}</p>
                  </div>
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
// Main DeptDashboard - selects sub-dashboard by deptRole
// ============================================================
export default function DeptDashboard() {
  const navigate = useNavigate();
  const { user, getAllUsers } = useAuth();
  const { permits, disputes, jobs, applications, notifications } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
        return <PermitOfficerDashboard permits={permits} navigate={navigate} />;
      case 'dispute_officer':
        return <DisputeOfficerDashboard disputes={disputes} navigate={navigate} />;
      case 'placement_officer':
        return <PlacementOfficerDashboard jobs={jobs} applications={applications} allUsers={allUsers} navigate={navigate} />;
      case 'inspector':
        return <InspectorDashboard navigate={navigate} />;
      case 'cashier':
        return <CashierDashboard permits={permits} navigate={navigate} />;
      case 'front_desk':
        return <FrontDeskDashboard permits={permits} navigate={navigate} />;
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
