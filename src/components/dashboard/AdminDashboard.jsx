import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatDateShort, getStatusColor, getStatusLabel, daysUntilExpiry } from '../../utils/helpers';
import {
  FileText, AlertTriangle, Briefcase, Users, ClipboardCheck,
  BarChart3, ArrowRight, Clock, CheckCircle2, XCircle, Eye,
  TrendingUp, ShieldCheck, Bell
} from 'lucide-react';

export default function AdminDashboard() {
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
          <div className="w-12 h-12 border-4 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const allUsers = getAllUsers();
  const pendingPermits = permits.filter(p => p.status === 'submitted' || p.status === 'under_review');
  const activeDisputes = disputes.filter(d => d.status !== 'resolved' && d.status !== 'closed');
  const openJobs = jobs.filter(j => j.status === 'open');
  const recentPermits = permits.slice(0, 10);

  // Chart data: applications by month (last 6 months)
  const monthLabels = [];
  const monthCounts = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    monthLabels.push(label);
    const count = permits.filter(p => {
      const pd = new Date(p.submittedAt);
      return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
    }).length;
    monthCounts.push(count);
  }
  const maxCount = Math.max(...monthCounts, 1);

  const statCards = [
    {
      title: 'Total Permits',
      value: permits.length,
      subtitle: `${pendingPermits.length} pending review`,
      icon: FileText,
      color: 'bg-[#003366]',
      lightColor: 'bg-blue-50',
      textColor: 'text-[#003366]',
    },
    {
      title: 'Active Disputes',
      value: activeDisputes.length,
      subtitle: `${disputes.filter(d => d.status === 'filed').length} newly filed`,
      icon: AlertTriangle,
      color: 'bg-[#c5a55a]',
      lightColor: 'bg-amber-50',
      textColor: 'text-[#c5a55a]',
    },
    {
      title: 'Open Jobs',
      value: openJobs.length,
      subtitle: `${applications.length} total applications`,
      icon: Briefcase,
      color: 'bg-[#006633]',
      lightColor: 'bg-green-50',
      textColor: 'text-[#006633]',
    },
    {
      title: 'Registered Users',
      value: allUsers.length,
      subtitle: `${allUsers.filter(u => u.role === 'employer').length} employers`,
      icon: Users,
      color: 'bg-purple-600',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#003366]">
            Welcome back, {user?.firstName || 'Admin'}
          </h1>
          <p className="text-gray-500 mt-1">
            Here is your administrative overview for today, {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.
          </p>
        </div>

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
          {/* Recent Permits Table */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#003366]">Recent Permits</h2>
              <button
                onClick={() => navigate('/permits')}
                className="text-sm text-[#003366] hover:text-[#c5a55a] flex items-center gap-1 font-medium"
              >
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              {recentPermits.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Permit #</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentPermits.map((permit) => (
                      <tr key={permit.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 text-sm font-medium text-[#003366]">{permit.permitNumber}</td>
                        <td className="px-6 py-3 text-sm text-gray-600 capitalize">{permit.type?.replace(/-/g, ' ') || 'N/A'}</td>
                        <td className="px-6 py-3 text-sm text-gray-500">{formatDateShort(permit.submittedAt)}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(permit.status)}`}>
                            {getStatusLabel(permit.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-6 py-12 text-center text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No permits submitted yet</p>
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
                onClick={() => navigate('/permits')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
              >
                <ClipboardCheck className="w-5 h-5" />
                <span className="font-medium">Review Permits</span>
                {pendingPermits.length > 0 && (
                  <span className="ml-auto bg-[#c5a55a] text-white text-xs px-2 py-0.5 rounded-full">{pendingPermits.length}</span>
                )}
              </button>
              <button
                onClick={() => navigate('/users')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#006633] text-white rounded-lg hover:bg-[#005522] transition-colors"
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Manage Users</span>
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#c5a55a] text-white rounded-lg hover:bg-[#b3944a] transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">View Reports</span>
              </button>
              <button
                onClick={() => navigate('/disputes')}
                className="w-full flex items-center gap-3 px-4 py-3 border-2 border-[#003366] text-[#003366] rounded-lg hover:bg-[#003366] hover:text-white transition-colors"
              >
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Manage Disputes</span>
                {activeDisputes.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{activeDisputes.length}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#003366]">Pending Actions</h2>
            </div>
            <div className="p-6 space-y-4">
              {pendingPermits.length > 0 ? (
                pendingPermits.slice(0, 5).map(permit => (
                  <div key={permit.id} className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {permit.permitNumber} - {permit.employeeName || permit.type?.replace(/-/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getStatusLabel(permit.status)} - Submitted {formatDateShort(permit.submittedAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/permits/${permit.id}`)}
                      className="p-2 text-[#003366] hover:bg-blue-50 rounded-lg"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-400" />
                  <p>All caught up! No pending actions.</p>
                </div>
              )}

              {activeDisputes.filter(d => d.status === 'filed').length > 0 && (
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Disputes Needing Attention</p>
                  {activeDisputes.filter(d => d.status === 'filed').slice(0, 3).map(dispute => (
                    <div key={dispute.id} className="flex items-center gap-4 p-3 bg-red-50 rounded-lg border border-red-100 mb-2">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {dispute.caseNumber} - {dispute.type || 'Labour Dispute'}
                        </p>
                        <p className="text-xs text-gray-500">Filed {formatDateShort(dispute.filedAt)}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/disputes/${dispute.id}`)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Applications by Month Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#003366]">Permit Applications by Month</h2>
            </div>
            <div className="p-6">
              <div className="flex items-end gap-3 h-48">
                {monthLabels.map((label, idx) => (
                  <div key={label} className="flex-1 flex flex-col items-center justify-end h-full">
                    <span className="text-xs font-medium text-[#003366] mb-1">{monthCounts[idx]}</span>
                    <div
                      className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${Math.max((monthCounts[idx] / maxCount) * 100, 4)}%`,
                        background: idx === monthLabels.length - 1
                          ? 'linear-gradient(to top, #003366, #004d99)'
                          : 'linear-gradient(to top, #c5a55a, #d4b86a)',
                      }}
                    />
                    <span className="text-xs text-gray-500 mt-2">{label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
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
          </div>
        </div>

        {/* System Notifications */}
        {notifications.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#003366] flex items-center gap-2">
                <Bell className="w-5 h-5" /> Recent Notifications
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {notifications.slice(0, 5).map(n => (
                <div key={n.id} className={`px-6 py-3 flex items-center gap-3 ${n.read ? 'opacity-60' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${n.read ? 'bg-gray-300' : 'bg-[#c5a55a]'}`} />
                  <p className="text-sm text-gray-700 flex-1">{n.message}</p>
                  <span className="text-xs text-gray-400">{formatDateShort(n.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
