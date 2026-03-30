import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatDate, getStatusColor, getStatusLabel } from '../../utils/helpers';
import {
  Briefcase, Users, ChevronDown, ChevronUp, Inbox,
  Clock, MapPin, DollarSign, Calendar,
  User, FileText, Mail,
} from 'lucide-react';

export default function ManageJobs({ onEditJob }) {
  const { user } = useAuth();
  const { getJobsByEmployer, applications, jobs } = useApp();
  const [expandedJob, setExpandedJob] = useState(null);
  const [expandedApplicant, setExpandedApplicant] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // We need to update job status in context. We'll use localStorage directly since
  // the context doesn't expose an updateJob yet.
  const myJobs = getJobsByEmployer(user.id);

  const getApplicants = (jobId) => applications.filter(a => a.jobId === jobId);

  const filtered = statusFilter === 'all'
    ? myJobs
    : myJobs.filter(j => j.status === statusFilter);

  const updateJobStatus = (jobId, newStatus) => {
    // Update directly in localStorage and refresh
    const allJobs = JSON.parse(localStorage.getItem('bvi_jobs') || '[]');
    const updated = allJobs.map(j =>
      j.id === jobId ? { ...j, status: newStatus, updatedAt: new Date().toISOString() } : j
    );
    localStorage.setItem('bvi_jobs', JSON.stringify(updated));
    window.location.reload(); // Force refresh to reflect changes
  };

  const updateApplicationStatus = (appId, newStatus) => {
    const allApps = JSON.parse(localStorage.getItem('bvi_applications') || '[]');
    const updated = allApps.map(a =>
      a.id === appId ? { ...a, status: newStatus, updatedAt: new Date().toISOString() } : a
    );
    localStorage.setItem('bvi_applications', JSON.stringify(updated));
    window.location.reload();
  };

  if (myJobs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Jobs Posted</h3>
        <p className="text-gray-500">You have not posted any jobs yet. Create your first job listing to start receiving applications.</p>
      </div>
    );
  }

  const statusColors = {
    open: 'bg-green-100 text-green-800',
    filled: 'bg-blue-100 text-blue-800',
    closed: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#003366]">Manage Job Listings</h2>
          <p className="text-gray-600 text-sm mt-1">{myJobs.length} job{myJobs.length !== 1 ? 's' : ''} posted</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Status:</span>
          <select className="input-field !w-auto !py-2 !px-3 text-sm" value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="filled">Filled</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map(job => {
          const jobApplicants = getApplicants(job.id);
          const isExpanded = expandedJob === job.id;
          const salary = job.salaryMax && job.salaryMax !== job.salaryMin
            ? `$${Number(job.salaryMin).toLocaleString()} - $${Number(job.salaryMax).toLocaleString()}`
            : `$${Number(job.salaryMin).toLocaleString()}`;

          return (
            <div key={job.id} className="card">
              {/* Job header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{job.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[job.status] || 'bg-gray-100 text-gray-800'}`}>
                      {job.status?.charAt(0).toUpperCase() + job.status?.slice(1)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.category}</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{salary}/yr</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Posted: {formatDate(job.postedAt)}</span>
                    <span className="flex items-center gap-1 font-medium text-[#003366]">
                      <Users className="w-3 h-3" />{jobApplicants.length} applicant{jobApplicants.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Job #: {job.jobNumber}</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status controls */}
                  {job.status === 'open' && (
                    <>
                      <button className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        onClick={() => updateJobStatus(job.id, 'filled')}>
                        Mark Filled
                      </button>
                      <button className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        onClick={() => updateJobStatus(job.id, 'closed')}>
                        Close
                      </button>
                    </>
                  )}
                  {(job.status === 'filled' || job.status === 'closed') && (
                    <button className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      onClick={() => updateJobStatus(job.id, 'open')}>
                      Reopen
                    </button>
                  )}
                  <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="View applicants"
                    onClick={() => setExpandedJob(isExpanded ? null : job.id)}>
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expanded: Applicants */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#003366]" />
                    Applicants ({jobApplicants.length})
                  </h4>

                  {jobApplicants.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No applications received yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {jobApplicants.map(app => {
                        const isAppExpanded = expandedApplicant === app.id;
                        return (
                          <div key={app.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 cursor-pointer"
                              onClick={() => setExpandedApplicant(isAppExpanded ? null : app.id)}>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-sm">
                                  {app.applicantName?.charAt(0) || 'A'}
                                </div>
                                <div>
                                  <h5 className="font-medium text-gray-900">{app.applicantName}</h5>
                                  <p className="text-xs text-gray-500">Applied: {formatDate(app.appliedAt)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                  {getStatusLabel(app.status)}
                                </span>
                                {isAppExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                              </div>
                            </div>

                            {isAppExpanded && (
                              <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{app.applicantEmail}</span>
                                  {app.availableDate && (
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Available: {formatDate(app.availableDate)}</span>
                                  )}
                                  {app.salaryExpectation && (
                                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />Expects: ${Number(app.salaryExpectation).toLocaleString()}/yr</span>
                                  )}
                                </div>

                                <div>
                                  <h6 className="text-xs font-semibold text-gray-700 mb-1">Cover Letter</h6>
                                  <p className="text-sm text-gray-600 bg-white p-3 rounded border max-h-32 overflow-y-auto whitespace-pre-wrap">{app.coverLetter}</p>
                                </div>

                                <div>
                                  <h6 className="text-xs font-semibold text-gray-700 mb-1">Why Suitable</h6>
                                  <p className="text-sm text-gray-600 bg-white p-3 rounded border max-h-32 overflow-y-auto whitespace-pre-wrap">{app.suitability}</p>
                                </div>

                                {app.resumeName && (
                                  <p className="text-sm text-gray-600 flex items-center gap-1"><FileText className="w-3 h-3" />Resume: {app.resumeName}</p>
                                )}

                                {/* Status update */}
                                <div className="flex flex-wrap gap-2 pt-2">
                                  <span className="text-xs text-gray-500 mr-2 self-center">Update status:</span>
                                  {['shortlisted', 'interview', 'offered', 'rejected'].map(s => (
                                    <button key={s} disabled={app.status === s}
                                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                        app.status === s ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : s === 'rejected' ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                      }`}
                                      onClick={() => updateApplicationStatus(app.id, s)}>
                                      {getStatusLabel(s)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
