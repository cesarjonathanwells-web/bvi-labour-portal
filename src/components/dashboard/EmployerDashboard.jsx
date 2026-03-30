import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatDateShort, getStatusColor, getStatusLabel, daysUntilExpiry } from '../../utils/helpers';
import {
  FileText, Briefcase, Users, Clock, Plus, RefreshCw,
  Calculator, ArrowRight, AlertCircle, Upload,
  TrendingUp, Calendar, Activity
} from 'lucide-react';

const ACCENT = '#003366';
const ACCENT_HOVER = '#002244';

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    getPermitsByUser, getJobsByEmployer, applications, jobs,
    getNotificationsByUser
  } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const myPermits = getPermitsByUser(user.id);
  const myJobs = getJobsByEmployer(user.id);
  const myNotifications = getNotificationsByUser(user.id);

  const activePermits = myPermits.filter(p => p.status === 'approved');
  const expiringSoon = myPermits.filter(p => {
    if (p.status !== 'approved') return false;
    const days = daysUntilExpiry(p.expiryDate);
    return days !== null && days <= 30 && days > 0;
  });
  const openVacancies = myJobs.filter(j => j.status === 'open');
  const myJobIds = myJobs.map(j => j.id);
  const pendingApplications = applications.filter(
    a => myJobIds.includes(a.jobId) && (a.status === 'submitted' || a.status === 'under_review')
  );
  const recentApplicants = applications
    .filter(a => myJobIds.includes(a.jobId))
    .slice(0, 5);

  const statCards = [
    {
      title: 'Active Permits',
      value: activePermits.length,
      subtitle: `${myPermits.length} total permits on file`,
      icon: FileText,
      lightColor: 'bg-blue-50',
      textColor: 'text-[#003366]',
    },
    {
      title: 'Expiring Soon',
      value: expiringSoon.length,
      subtitle: expiringSoon.length > 0 ? 'Within 30 days - action needed' : 'No permits expiring soon',
      icon: Clock,
      lightColor: expiringSoon.length > 0 ? 'bg-red-50' : 'bg-green-50',
      textColor: expiringSoon.length > 0 ? 'text-red-600' : 'text-green-600',
    },
    {
      title: 'Open Vacancies',
      value: openVacancies.length,
      subtitle: `${myJobs.length} total postings`,
      icon: Briefcase,
      lightColor: 'bg-blue-50',
      textColor: 'text-[#003366]',
    },
    {
      title: 'Pending Applications',
      value: pendingApplications.length,
      subtitle: `Across ${openVacancies.length} open positions`,
      icon: Users,
      lightColor: 'bg-amber-50',
      textColor: 'text-[#c5a55a]',
    },
  ];

  const quickActions = [
    { label: 'New Permit Application', icon: Plus, onClick: () => navigate('/permits/apply'), primary: true },
    { label: 'Renew Permit', icon: RefreshCw, onClick: () => navigate('/permits/apply?type=renewal'), primary: false },
    { label: 'Post Job Vacancy', icon: Briefcase, onClick: () => navigate('/jobs/post'), primary: false },
    { label: 'Calculate Fees', icon: Calculator, onClick: () => navigate('/fees'), primary: false },
    { label: 'Upload Documents', icon: Upload, onClick: () => navigate('/documents'), primary: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome Banner */}
        <div className="mb-8 bg-gradient-to-r from-[#003366] to-[#004d99] rounded-xl p-6 text-white">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Welcome back, {user?.organization || user?.firstName || 'Employer'}
          </h1>
          <p className="text-blue-200 mt-2">
            Manage your work permits, workforce, and job vacancies from your Business Portal.
          </p>
        </div>

        {/* URGENT - Expiring Permits */}
        {expiringSoon.length > 0 && (
          <div className="mb-6 bg-red-600 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-7 h-7 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-lg">URGENT: Permits Expiring Soon</h3>
                <p className="text-red-100 text-sm mt-1">
                  {expiringSoon.length} work permit{expiringSoon.length > 1 ? 's' : ''} will expire within the next 30 days.
                  Renew immediately to avoid disruption to your workforce.
                </p>
                <div className="mt-4 space-y-2">
                  {expiringSoon.map(p => {
                    const days = daysUntilExpiry(p.expiryDate);
                    return (
                      <div key={p.id} className="flex items-center justify-between bg-white/10 backdrop-blur rounded-lg px-4 py-2.5">
                        <div>
                          <span className="text-sm font-semibold">{p.permitNumber}</span>
                          <span className="text-red-200 text-sm ml-3">{p.employeeName || 'Employee'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold">
                            {days <= 0 ? 'EXPIRED' : `${days} days left`}
                          </span>
                          <button
                            onClick={() => navigate('/permits/apply?type=renewal')}
                            className="text-sm bg-white text-red-600 px-4 py-1.5 rounded-full font-semibold hover:bg-red-50 transition-colors"
                          >
                            Renew Now
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map(card => (
            <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.lightColor} p-3 rounded-lg`}>
                  <card.icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">{card.value}</h3>
              <p className="text-sm font-medium text-gray-600 mt-1">{card.title}</p>
              <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

          {/* Active Permits Table */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#003366]">Active Permits</h2>
              <button
                onClick={() => navigate('/permits')}
                className="text-sm text-[#003366] hover:text-[#c5a55a] flex items-center gap-1 font-medium"
              >
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {activePermits.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Permit #</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Left</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {activePermits.slice(0, 8).map(permit => {
                      const days = daysUntilExpiry(permit.expiryDate);
                      const isExpiring = days !== null && days <= 30;
                      return (
                        <tr key={permit.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 text-sm font-medium text-gray-900">
                            {permit.employeeName || 'N/A'}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600 capitalize">
                            {permit.position || permit.type?.replace(/-/g, ' ') || 'N/A'}
                          </td>
                          <td className="px-6 py-3 text-sm font-medium text-[#003366]">
                            {permit.permitNumber}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-500">
                            {formatDateShort(permit.expiryDate)}
                          </td>
                          <td className="px-6 py-3">
                            {days !== null ? (
                              <span className={`text-sm font-semibold ${
                                days <= 7 ? 'text-red-600' : days <= 30 ? 'text-orange-500' : 'text-green-600'
                              }`}>
                                {days <= 0 ? 'Expired' : `${days} days`}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isExpiring ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {isExpiring ? 'Expiring' : 'Active'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No active permits</p>
                <button
                  onClick={() => navigate('/permits/apply')}
                  className="mt-3 text-sm text-[#003366] hover:text-[#c5a55a] font-medium"
                >
                  Apply for a Work Permit
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions Grid */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#003366]">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              {quickActions.map((action, idx) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                    action.primary
                      ? 'bg-[#003366] text-white hover:bg-[#002244]'
                      : idx % 2 === 0
                        ? 'bg-blue-50 text-[#003366] hover:bg-blue-100'
                        : 'border-2 border-[#003366] text-[#003366] hover:bg-[#003366] hover:text-white'
                  }`}
                >
                  <action.icon className="w-5 h-5" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#003366] flex items-center gap-2">
              <Activity className="w-5 h-5" /> Recent Activity
            </h2>
            <button
              onClick={() => navigate('/jobs')}
              className="text-sm text-[#003366] hover:text-[#c5a55a] flex items-center gap-1 font-medium"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {/* Recent applicants */}
            {recentApplicants.length > 0 ? (
              recentApplicants.map(app => {
                const job = jobs.find(j => j.id === app.jobId);
                return (
                  <div key={app.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#003366] flex items-center justify-center text-white text-sm font-semibold">
                        {(app.applicantName || 'A')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{app.applicantName || 'Applicant'}</p>
                        <p className="text-xs text-gray-500">
                          Applied for: {job?.title || 'Position'} - {formatDateShort(app.appliedAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                      {getStatusLabel(app.status)}
                    </span>
                  </div>
                );
              })
            ) : (
              <>
                {/* Show recent notifications as activity if no applicants */}
                {myNotifications.length > 0 ? (
                  myNotifications.slice(0, 5).map(n => (
                    <div key={n.id} className={`px-6 py-4 flex items-center gap-3 ${n.read ? 'opacity-60' : ''}`}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${n.read ? 'bg-gray-300' : 'bg-[#003366]'}`} />
                      <p className="text-sm text-gray-700 flex-1">{n.message}</p>
                      <span className="text-xs text-gray-400">{formatDateShort(n.createdAt)}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-12 text-center text-gray-400">
                    <Activity className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>No recent activity</p>
                    <p className="text-xs mt-1">Post a job or apply for a permit to get started</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
