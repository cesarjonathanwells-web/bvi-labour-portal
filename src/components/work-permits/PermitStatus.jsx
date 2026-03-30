import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  FileText,
  Download,
  Eye,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatDate, getStatusColor, getStatusLabel, daysUntilExpiry } from '../../utils/helpers';
import { formatCurrency } from '../../utils/feeCalculator';
import PermitCard from './PermitCard';

const STATUS_FLOW = ['submitted', 'under_review', 'pending_payment', 'approved'];
const FLOW_CONFIG = {
  submitted: { icon: FileText, label: 'Submitted', color: 'blue' },
  under_review: { icon: Eye, label: 'Under Review', color: 'purple' },
  pending_payment: { icon: CreditCard, label: 'Pending Payment', color: 'yellow' },
  approved: { icon: CheckCircle2, label: 'Approved', color: 'green' },
};

function StatusTimeline({ status }) {
  const currentIdx = STATUS_FLOW.indexOf(status);
  const isRejected = status === 'rejected';
  const isCancelled = status === 'cancelled';
  const isTerminal = isRejected || isCancelled;

  return (
    <div className="flex items-center w-full my-4">
      {STATUS_FLOW.map((s, idx) => {
        const config = FLOW_CONFIG[s];
        const Icon = config.icon;
        const isActive = !isTerminal && idx === currentIdx;
        const isComplete = !isTerminal && idx < currentIdx;
        const isFuture = isTerminal || idx > currentIdx;

        let circleClass = 'bg-gray-200 text-gray-400';
        if (isComplete) circleClass = 'bg-green-500 text-white';
        else if (isActive) circleClass = 'bg-[#003366] text-white ring-4 ring-blue-100';

        return (
          <div key={s} className="flex items-center flex-1 last:flex-0">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${circleClass} transition-all`}>
                {isComplete ? <CheckCircle2 size={18} /> : <Icon size={18} />}
              </div>
              <span className={`text-xs mt-2 text-center hidden sm:block ${isActive ? 'text-[#003366] font-bold' : isComplete ? 'text-green-700 font-medium' : 'text-gray-400'}`}>
                {config.label}
              </span>
            </div>
            {idx < STATUS_FLOW.length - 1 && (
              <div className={`flex-1 h-1 mx-1 rounded ${isComplete ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}

      {isTerminal && (
        <div className="flex flex-col items-center ml-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isRejected ? 'bg-red-500' : 'bg-gray-500'} text-white ring-4 ${isRejected ? 'ring-red-100' : 'ring-gray-100'}`}>
            <XCircle size={18} />
          </div>
          <span className={`text-xs mt-2 font-bold ${isRejected ? 'text-red-600' : 'text-gray-600'}`}>
            {isRejected ? 'Rejected' : 'Cancelled'}
          </span>
        </div>
      )}
    </div>
  );
}

function PermitDetail({ permit }) {
  const [showCard, setShowCard] = useState(false);
  const days = daysUntilExpiry(permit.expiryDate);

  return (
    <div className="mt-4 space-y-4">
      <StatusTimeline status={permit.status} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-500 uppercase">Type</p>
          <p className="font-medium capitalize">{permit.type?.replace(/-/g, ' ')}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Submitted</p>
          <p className="font-medium">{formatDate(permit.submittedAt)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Last Updated</p>
          <p className="font-medium">{formatDate(permit.updatedAt)}</p>
        </div>
        {permit.fee && (
          <div>
            <p className="text-xs text-gray-500 uppercase">Fee</p>
            <p className="font-medium">{formatCurrency(permit.fee.total)}</p>
          </div>
        )}
      </div>

      {permit.employee && (
        <div>
          <h4 className="text-sm font-bold text-gray-700 mb-2">Employee</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><p className="text-xs text-gray-500">Name</p><p className="font-medium">{permit.employee.fullName || '-'}</p></div>
            <div><p className="text-xs text-gray-500">Nationality</p><p className="font-medium">{permit.employee.nationality || '-'}</p></div>
            <div><p className="text-xs text-gray-500">Passport</p><p className="font-medium">{permit.employee.passportNumber || '-'}</p></div>
            <div><p className="text-xs text-gray-500">Email</p><p className="font-medium">{permit.employee.email || '-'}</p></div>
          </div>
        </div>
      )}

      {permit.employer && (
        <div>
          <h4 className="text-sm font-bold text-gray-700 mb-2">Employer</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><p className="text-xs text-gray-500">Company</p><p className="font-medium">{permit.employer.companyName || '-'}</p></div>
            <div><p className="text-xs text-gray-500">Industry</p><p className="font-medium">{permit.employer.industry || '-'}</p></div>
            <div><p className="text-xs text-gray-500">Phone</p><p className="font-medium">{permit.employer.phone || '-'}</p></div>
          </div>
        </div>
      )}

      {permit.position && (
        <div>
          <h4 className="text-sm font-bold text-gray-700 mb-2">Position</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><p className="text-xs text-gray-500">Job Title</p><p className="font-medium">{permit.position.jobTitle || '-'}</p></div>
            <div><p className="text-xs text-gray-500">Location</p><p className="font-medium">{permit.position.workLocation || '-'}</p></div>
            <div><p className="text-xs text-gray-500">Salary</p><p className="font-medium">{permit.position.annualSalary ? formatCurrency(permit.position.annualSalary) : '-'}</p></div>
          </div>
        </div>
      )}

      {permit.notes && (
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase mb-1">Notes</p>
          <p className="text-sm text-gray-700">{permit.notes}</p>
        </div>
      )}

      {permit.expiryDate && (
        <div className={`p-3 rounded-lg border ${days !== null && days <= 30 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
          <p className="text-sm">
            {days !== null && days > 0 ? (
              <span className={days <= 30 ? 'text-red-700 font-medium' : 'text-blue-700'}>Expires in {days} day{days !== 1 ? 's' : ''} ({formatDate(permit.expiryDate)})</span>
            ) : days !== null && days <= 0 ? (
              <span className="text-red-700 font-bold">Expired on {formatDate(permit.expiryDate)}</span>
            ) : (
              <span className="text-blue-700">Expiry: {formatDate(permit.expiryDate)}</span>
            )}
          </p>
        </div>
      )}

      {permit.status === 'approved' && (
        <div>
          <button onClick={() => setShowCard(!showCard)} className="btn-primary text-sm">
            <Download size={16} /> {showCard ? 'Hide Permit Card' : 'View Permit Card'}
          </button>
          {showCard && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <PermitCard permit={permit} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PermitStatus() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getPermitsByUser, permits: allPermits } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const userPermits = user ? getPermitsByUser(user.id) : [];
  const isAdmin = user?.role === 'admin';
  const basePermits = isAdmin ? allPermits : userPermits;

  const filtered = searchQuery.trim()
    ? basePermits.filter(
        (p) =>
          p.permitNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.employee?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.employer?.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : basePermits;

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Track Permit Status</h1>
        <p className="text-gray-600">
          Search for a specific permit or view all your applications.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-xl">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-10"
            placeholder="Search by permit number, employee name, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <FileText size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {searchQuery ? 'No permits found' : 'No permit applications yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery
              ? 'Try a different search term.'
              : 'Start a new work permit application to get started.'}
          </p>
          {!searchQuery && (
            <button onClick={() => navigate('/permits')} className="btn-primary">
              Apply for a Permit <ArrowRight size={16} />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((permit) => {
            const isExpanded = expandedId === permit.id;
            return (
              <div key={permit.id} className="card">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : permit.id)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${permit.status === 'approved' ? 'bg-green-100 text-green-600' : permit.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {permit.status === 'approved' ? <CheckCircle2 size={20} /> : permit.status === 'rejected' ? <XCircle size={20} /> : <Clock size={20} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-[#003366]">{permit.permitNumber}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(permit.status)}`}>
                          {getStatusLabel(permit.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {permit.employee?.fullName || 'N/A'} - {permit.employer?.companyName || 'N/A'}
                        <span className="text-gray-400 ml-2 capitalize">({permit.type?.replace(/-/g, ' ')})</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-500 hidden md:block">{formatDate(permit.submittedAt)}</span>
                    {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </button>

                {isExpanded && <PermitDetail permit={permit} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
