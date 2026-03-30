import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatDateShort, getStatusColor, getStatusLabel, daysUntilExpiry } from '../../utils/helpers';
import {
  FileText, Briefcase, Users, Clock, Plus, RefreshCw,
  Calculator, ArrowRight, AlertCircle, CheckCircle2,
  TrendingUp, Calendar, MapPin, DollarSign, Bell
} from 'lucide-react';

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
  const pendingRenewals = myPermits.filter(p => {
    if (p.status !== 'approved') return false;
    const days = daysUntilExpiry(p.expiryDate);
    return days !== null && days <= 30 && days > 0;
  });
  const expiringPermits = myPermits.filter(p => {
    if (p.status !== 'approved') return false;
    const days = daysUntilExpiry(p.expiryDate);
    return days !== null && days <= 30;
  });

  const totalApplicants = myJobs.reduce((sum, j) => sum + (j.applicants || 0), 0);

  // Get recent applicants for my jobs
  const myJobIds = myJobs.map(j => j.id);
  const recentApplicants = applications
    .filter(a => myJobIds.includes(a.jobId))
    .slice(0, 5);

  const statCards = [
    {
      title: 'My Active Permits',
      value: activePermits.length,
      subtitle: `${myPermits.length} total permits`,
      icon: FileText,
      color: 'bg-[#003366]',
      lightColor: 'bg-blue-50',
      textColor: 'text-[#003366]',
    },
    {
      title: 'My Job Postings',
      value: myJobs.filter(j => j.status === 'open').length,
      subtitle: `${myJobs.length} total postings`,
      icon: Briefcase,
      color: 'bg-[#006633]',
      lightColor: 'bg-green-50',
      textColor: 'text-[#006633]',
    },
    {
      title: 'Total Applicants',
      value: totalApplicants,
      subtitle: `Across ${myJobs.length} job postings`,
      icon: Users,
      color: 'bg-[#c5a55a]',
      lightColor: 'bg-amber-50',
      textColor: 'text-[#c5a55a]',
    },
    {
      title: 'Pending Renewals',
      value: pendingRenewals.length,
      subtitle: pendingRenewals.length > 0 ? 'Action needed' : 'All up to date',
      icon: RefreshCw,
      color: pendingRenewals.length > 0 ? 'bg-red-500' : 'bg-purple-600',
      lightColor: pendingRenewals.length > 0 ? 'bg-red-50' : 'bg-purple-50',
      textColor: pendingRenewals.length > 0 ? 'text-red-500' : 'text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#003366]">
            Welcome back, {user?.firstName || 'Employer'}
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your work permits, job postings, and workforce from your employer portal.
          </p>
        </div>

        {/* Renewal Alerts */}
        {expiringPermits.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">Permit Renewal Alert</h3>
                <p className="text-sm text-red-700 mt-1">
                  {expiringPermits.length} permit{expiringPermits.length > 1 ? 's' : ''} expiring within 30 days.
                  Renew now to avoid disruption.
                </p>
                <div className="mt-3 space-y-2">
                  {expiringPermits.slice(0, 3).map(p => {
                    const days = daysUntilExpiry(p.expiryDate);
                    return (
                      <div key={p.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-red-100">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{p.permitNumber}</span>
                          <span className="text-xs text-gray-500 ml-2">{p.employeeName || 'Employee'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-medium ${days <= 7 ? 'text-red-600' : 'text-orange-600'}`}>
                            {days <= 0 ? 'Expired' : `${days} days left`}
                          </span>
                          <button
                            onClick={() => navigate('/permits/apply?type=renewal')}
                            className="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600"
                          >
                            Renew
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
          {statCards.map((card) => (
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
          {/* Active Permits List */}
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
            <div className="divide-y divide-gray-50">
              {activePermits.length > 0 ? (
                activePermits.slice(0, 6).map(permit => {
                  const days = daysUntilExpiry(permit.expiryDate);
                  const isExpiring = days !== null && days <= 30;
                  return (
                    <div key={permit.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${isExpiring ? 'bg-orange-100' : 'bg-green-100'}`}>
                          <FileText className={`w-5 h-5 ${isExpiring ? 'text-orange-600' : 'text-green-600'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{permit.permitNumber}</p>
                          <p className="text-xs text-gray-500">
                            {permit.employeeName || permit.type?.replace(/-/g, ' ')} - Expires {formatDateShort(permit.expiryDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {days !== null ? (
                          <span className={`text-sm font-semibold ${days <= 7 ? 'text-red-600' : days <= 30 ? 'text-orange-500' : 'text-green-600'}`}>
                            {days <= 0 ? 'Expired' : `${days} days`}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </div>
                    </div>
                  );
                })
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
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#003366]">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={() => navigate('/permits/apply')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Apply for New Permit</span>
              </button>
              <button
                onClick={() => navigate('/jobs/post')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#006633] text-white rounded-lg hover:bg-[#005522] transition-colors"
              >
                <Briefcase className="w-5 h-5" />
                <span className="font-medium">Post a Job</span>
              </button>
              <button
                onClick={() => navigate('/permits/apply?type=renewal')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#c5a55a] text-white rounded-lg hover:bg-[#b3944a] transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="font-medium">Renew Permit</span>
              </button>
              <button
                onClick={() => navigate('/fees')}
                className="w-full flex items-center gap-3 px-4 py-3 border-2 border-[#003366] text-[#003366] rounded-lg hover:bg-[#003366] hover:text-white transition-colors"
              >
                <Calculator className="w-5 h-5" />
                <span className="font-medium">Fee Calculator</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Applicants */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#003366]">Recent Job Applicants</h2>
            <button
              onClick={() => navigate('/jobs')}
              className="text-sm text-[#003366] hover:text-[#c5a55a] flex items-center gap-1 font-medium"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {recentApplicants.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {recentApplicants.map(app => {
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
              })}
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No applicants yet</p>
              <p className="text-xs mt-1">Post a job to start receiving applications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
