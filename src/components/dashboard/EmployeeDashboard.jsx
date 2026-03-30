import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatDateShort, getStatusColor, getStatusLabel, daysUntilExpiry } from '../../utils/helpers';
import { DEPARTMENT_INFO } from '../../data/constants';
import {
  FileText, AlertTriangle, Upload, Search, Clock, Shield,
  ArrowRight, CheckCircle2, Circle, Info, Calendar, Megaphone,
  DollarSign, MapPin, Eye, FileCheck
} from 'lucide-react';

const PERMIT_PROGRESS_STEPS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'pending_payment', label: 'Payment' },
  { key: 'approved', label: 'Approved' },
];

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    getPermitsByUser, getDisputesByUser, getDocsByUser,
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
  const myDisputes = getDisputesByUser(user.id);
  const myDocs = getDocsByUser(user.id);
  const myNotifications = getNotificationsByUser(user.id);

  const currentPermit = myPermits.find(p => p.status === 'approved') || myPermits[0];
  const activeDisputes = myDisputes.filter(d => d.status !== 'resolved' && d.status !== 'closed');
  const days = currentPermit ? daysUntilExpiry(currentPermit.expiryDate) : null;

  // Determine permit status text for the stat card
  const permitStatusText = currentPermit
    ? getStatusLabel(currentPermit.status)
    : 'No Permit';

  const permitStatusColor = currentPermit?.status === 'approved'
    ? 'text-green-600'
    : currentPermit?.status === 'rejected'
      ? 'text-red-600'
      : 'text-[#c5a55a]';

  const statCards = [
    {
      title: 'My Permit Status',
      value: permitStatusText,
      isText: true,
      subtitle: currentPermit ? currentPermit.permitNumber : 'Apply for a work permit',
      icon: Shield,
      lightColor: 'bg-blue-50',
      textColor: 'text-[#003366]',
      valueColor: permitStatusColor,
    },
    {
      title: 'Days Until Expiry',
      value: days !== null ? (days <= 0 ? 'Expired' : days) : '--',
      isText: days !== null && days <= 0,
      subtitle: currentPermit?.expiryDate ? `Expires ${formatDateShort(currentPermit.expiryDate)}` : 'No active permit',
      icon: Calendar,
      lightColor: days !== null && days <= 30 ? 'bg-red-50' : 'bg-green-50',
      textColor: days !== null && days <= 30 ? 'text-red-500' : 'text-[#006633]',
      valueColor: days !== null && days <= 30 ? 'text-red-500' : 'text-[#006633]',
    },
    {
      title: 'Active Disputes',
      value: activeDisputes.length,
      subtitle: `${myDisputes.length} total filed`,
      icon: AlertTriangle,
      lightColor: 'bg-amber-50',
      textColor: 'text-[#c5a55a]',
    },
    {
      title: 'Documents Uploaded',
      value: myDocs.length,
      subtitle: 'Supporting documents',
      icon: Upload,
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
  ];

  // Current permit progress step
  const currentStepIdx = currentPermit
    ? PERMIT_PROGRESS_STEPS.findIndex(s => s.key === currentPermit.status)
    : -1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#003366]">
            Welcome back, {user?.firstName || 'Employee'}
          </h1>
          <p className="text-gray-500 mt-1">
            Track your work permit, disputes, and important updates from the Department of Labour.
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
              </div>
              <h3 className={`text-3xl font-bold ${card.valueColor || 'text-gray-900'} ${card.isText ? 'text-xl' : ''}`}>
                {card.value}
              </h3>
              <p className="text-sm font-medium text-gray-600 mt-1">{card.title}</p>
              <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Current Permit Card */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#003366]">Current Permit</h2>
              {currentPermit && (
                <button
                  onClick={() => navigate(`/permits/${currentPermit.id}`)}
                  className="text-sm text-[#003366] hover:text-[#c5a55a] flex items-center gap-1 font-medium"
                >
                  Full Details <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
            {currentPermit ? (
              <div className="p-6">
                {/* Permit Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Permit Number</p>
                    <p className="text-lg font-semibold text-[#003366] mt-1">{currentPermit.permitNumber}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Type</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">{currentPermit.type?.replace(/-/g, ' ') || 'Work Permit'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Employer</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{currentPermit.employerName || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
                    <span className={`inline-flex mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentPermit.status)}`}>
                      {getStatusLabel(currentPermit.status)}
                    </span>
                  </div>
                </div>

                {/* Progress Tracker */}
                <div className="border-t border-gray-100 pt-6">
                  <p className="text-sm font-semibold text-gray-700 mb-4">Application Progress</p>
                  <div className="flex items-center justify-between">
                    {PERMIT_PROGRESS_STEPS.map((step, idx) => {
                      const isCompleted = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;
                      return (
                        <div key={step.key} className="flex-1 flex flex-col items-center relative">
                          {idx > 0 && (
                            <div
                              className={`absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2 ${
                                idx <= currentStepIdx ? 'bg-[#006633]' : 'bg-gray-200'
                              }`}
                              style={{ zIndex: 0 }}
                            />
                          )}
                          <div
                            className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                              isCompleted
                                ? 'bg-[#006633] border-[#006633] text-white'
                                : 'bg-white border-gray-300 text-gray-400'
                            } ${isCurrent ? 'ring-4 ring-green-100' : ''}`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </div>
                          <p className={`text-xs mt-2 text-center ${isCurrent ? 'font-semibold text-[#006633]' : 'text-gray-500'}`}>
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 mb-3">No work permit on file</p>
                <p className="text-sm text-gray-400">
                  Your employer must apply for a work permit on your behalf.
                </p>
              </div>
            )}
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
                <Eye className="w-5 h-5" />
                <span className="font-medium">View Permit</span>
              </button>
              <button
                onClick={() => navigate('/disputes/file')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#c5a55a] text-white rounded-lg hover:bg-[#b3944a] transition-colors"
              >
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">File Dispute</span>
              </button>
              <button
                onClick={() => navigate('/documents/upload')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#006633] text-white rounded-lg hover:bg-[#005522] transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span className="font-medium">Upload Document</span>
              </button>
              <button
                onClick={() => navigate('/jobs')}
                className="w-full flex items-center gap-3 px-4 py-3 border-2 border-[#003366] text-[#003366] rounded-lg hover:bg-[#003366] hover:text-white transition-colors"
              >
                <Search className="w-5 h-5" />
                <span className="font-medium">Search Jobs</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Dispute Status Tracker */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#003366]">Dispute Status</h2>
              <button
                onClick={() => navigate('/disputes')}
                className="text-sm text-[#003366] hover:text-[#c5a55a] flex items-center gap-1 font-medium"
              >
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              {myDisputes.length > 0 ? (
                <div className="space-y-4">
                  {myDisputes.slice(0, 4).map(dispute => (
                    <div key={dispute.id} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900">{dispute.caseNumber}</span>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}>
                          {getStatusLabel(dispute.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        {dispute.type || 'Labour Dispute'} - Filed {formatDateShort(dispute.filedAt)}
                      </p>
                      {/* Timeline */}
                      {dispute.timeline && dispute.timeline.length > 0 && (
                        <div className="border-t border-gray-50 pt-3">
                          {dispute.timeline.slice(-3).map((event, idx) => (
                            <div key={idx} className="flex items-start gap-2 mb-2 last:mb-0">
                              <div className={`w-2 h-2 rounded-full mt-1.5 ${idx === dispute.timeline.slice(-3).length - 1 ? 'bg-[#006633]' : 'bg-gray-300'}`} />
                              <div>
                                <p className="text-xs font-medium text-gray-700">{getStatusLabel(event.status)}</p>
                                <p className="text-xs text-gray-400">{formatDateShort(event.date)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-400" />
                  <p>No disputes filed</p>
                  <p className="text-xs mt-1">If you have a workplace issue, you can file a dispute.</p>
                </div>
              )}
            </div>
          </div>

          {/* Important Notices */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#003366] flex items-center gap-2">
                <Megaphone className="w-5 h-5" /> Important Notices
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Minimum Wage Notice */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-green-800">Minimum Wage</h4>
                    <p className="text-sm text-green-700 mt-1">
                      The current minimum wage is <strong>{DEPARTMENT_INFO.minimumWage}</strong> per hour,
                      effective {DEPARTMENT_INFO.minimumWageEffective}.
                    </p>
                  </div>
                </div>
              </div>

              {/* Department Hours */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-800">Office Hours</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {DEPARTMENT_INFO.hours}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Cashier: {DEPARTMENT_INFO.cashierHours}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-800">Contact the Department</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      {DEPARTMENT_INFO.phone}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      {DEPARTMENT_INFO.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              {myNotifications.filter(n => !n.read).length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Recent Notifications</p>
                  {myNotifications.filter(n => !n.read).slice(0, 3).map(n => (
                    <div key={n.id} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-[#c5a55a]" />
                      <p className="text-xs text-gray-600 flex-1">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
