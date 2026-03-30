import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatDate, getStatusColor, getStatusLabel } from '../../utils/helpers';
import {
  FileText, Calendar, ChevronDown, ChevronUp, Briefcase, Building2,
  Clock, DollarSign, Inbox,
} from 'lucide-react';

const STATUS_STEPS = ['submitted', 'shortlisted', 'interview', 'offered'];

export default function MyApplications() {
  const { user } = useAuth();
  const { getApplicationsByUser, jobs } = useApp();
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const applications = getApplicationsByUser(user.id);

  const getJob = (jobId) => jobs.find(j => j.id === jobId);

  const filtered = statusFilter === 'all'
    ? applications
    : applications.filter(a => a.status === statusFilter);

  const statusOptions = ['all', 'submitted', 'shortlisted', 'interview', 'offered', 'rejected'];

  const getProgressIndex = (status) => {
    const idx = STATUS_STEPS.indexOf(status);
    return idx >= 0 ? idx : -1;
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Inbox className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Applications Yet</h3>
        <p className="text-gray-500">You have not applied to any jobs. Browse available positions to get started.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-[#003366]">My Applications</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Filter:</span>
          <select className="input-field !w-auto !py-2 !px-3 text-sm" value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}>
            {statusOptions.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All Statuses' : getStatusLabel(s)}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-gray-600 mb-4">
        Showing {filtered.length} of {applications.length} application{applications.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-4">
        {filtered.map(app => {
          const job = getJob(app.jobId);
          const expanded = expandedId === app.id;
          const progressIdx = getProgressIndex(app.status);

          return (
            <div key={app.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3 cursor-pointer"
                onClick={() => setExpandedId(expanded ? null : app.id)}>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg">{app.jobTitle || job?.title || 'Unknown Position'}</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{app.employerName || job?.employerName}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Applied: {formatDate(app.appliedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                    {getStatusLabel(app.status)}
                  </span>
                  {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </div>

              {expanded && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {/* Progress bar */}
                  {app.status !== 'rejected' && (
                    <div className="flex items-center gap-1 mb-4">
                      {STATUS_STEPS.map((step, i) => (
                        <div key={step} className="flex items-center flex-1">
                          <div className={`flex flex-col items-center flex-shrink-0`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              i <= progressIdx ? 'bg-[#006633] text-white' : 'bg-gray-200 text-gray-500'
                            }`}>{i + 1}</div>
                            <span className="text-[10px] mt-1 text-gray-500 text-center">{getStatusLabel(step)}</span>
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`flex-1 h-1 mx-1 rounded ${i < progressIdx ? 'bg-[#006633]' : 'bg-gray-200'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {app.status === 'rejected' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      Unfortunately, your application was not selected for this position.
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        <FileText className="w-4 h-4" />Cover Letter
                      </h4>
                      <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                        {app.coverLetter}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />Suitability
                      </h4>
                      <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                        {app.suitability}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />Available: {formatDate(app.availableDate)}
                    </span>
                    {app.salaryExpectation && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />Expected: ${Number(app.salaryExpectation).toLocaleString()}/yr
                      </span>
                    )}
                    {app.resumeName && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />Resume: {app.resumeName}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
