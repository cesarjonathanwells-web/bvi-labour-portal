import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';
import {
  MapPin, DollarSign, Clock, Calendar, Briefcase, User, Mail, Phone,
  ArrowLeft, CheckCircle, Building2, FileText,
} from 'lucide-react';

export default function JobDetail({ job, onBack, onApply }) {
  const { user } = useAuth();

  if (!job) return null;

  const salary = job.salaryMax && job.salaryMax !== job.salaryMin
    ? `$${Number(job.salaryMin).toLocaleString()} - $${Number(job.salaryMax).toLocaleString()}`
    : `$${Number(job.salaryMin).toLocaleString()}`;

  const isEmployer = user?.role === 'employer' || user?.role === 'admin';
  const isExpired = job.deadline && new Date(job.deadline) < new Date();
  const isClosed = job.status === 'filled' || job.status === 'closed';

  return (
    <div className="max-w-3xl mx-auto">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-[#003366] hover:underline mb-4 font-medium">
          <ArrowLeft className="w-4 h-4" />Back to Job Listings
        </button>
      )}

      <div className="card">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              {job.belongerPreferred && (
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  VI Belonger Preferred
                </span>
              )}
            </div>
            <p className="text-gray-600 flex items-center gap-1 text-lg">
              <Building2 className="w-4 h-4" />{job.employerName}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              job.status === 'open' ? 'bg-green-100 text-green-800' :
              job.status === 'filled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {job.status?.charAt(0).toUpperCase() + job.status?.slice(1)}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
              {job.employmentType}
            </span>
          </div>
        </div>

        {/* Key info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-[#003366] flex-shrink-0" />
            <div>
              <p className="text-gray-500 text-xs">Location</p>
              <p className="font-medium text-gray-900">{job.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-[#003366] flex-shrink-0" />
            <div>
              <p className="text-gray-500 text-xs">Salary</p>
              <p className="font-medium text-gray-900">{salary}/yr</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-[#003366] flex-shrink-0" />
            <div>
              <p className="text-gray-500 text-xs">Hours</p>
              <p className="font-medium text-gray-900">{job.workingHours}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-[#003366] flex-shrink-0" />
            <div>
              <p className="text-gray-500 text-xs">Deadline</p>
              <p className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                {formatDate(job.deadline)}
              </p>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-6">
          <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.category}</span>
          <span>Posted: {formatDate(job.postedAt)}</span>
          <span>Job #: {job.jobNumber}</span>
          {job.applicants > 0 && <span>{job.applicants} applicant{job.applicants !== 1 ? 's' : ''}</span>}
        </div>

        <hr className="mb-6" />

        {/* Description */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#003366]" />Description
          </h3>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
        </div>

        {/* Requirements */}
        {job.requirements && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#003366]" />Requirements
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
          </div>
        )}

        {/* Contact */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
          <div className="flex flex-wrap gap-6 text-sm text-gray-700">
            <span className="flex items-center gap-2"><User className="w-4 h-4 text-[#003366]" />{job.contactPerson}</span>
            <a href={`mailto:${job.contactEmail}`} className="flex items-center gap-2 text-[#003366] hover:underline">
              <Mail className="w-4 h-4" />{job.contactEmail}
            </a>
            <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#003366]" />{job.contactPhone}</span>
          </div>
        </div>

        {/* Apply button */}
        {onApply && !isEmployer && (
          <div className="flex justify-end">
            {isClosed ? (
              <span className="text-gray-500 font-medium">This position is no longer accepting applications.</span>
            ) : isExpired ? (
              <span className="text-red-600 font-medium">The application deadline has passed.</span>
            ) : (
              <button className="btn-primary text-lg px-8 py-3" onClick={() => onApply(job)}>
                Apply Now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
