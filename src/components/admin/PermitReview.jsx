import { useState, useMemo } from 'react';
import {
  FileText, Search, Filter, X, Check, XCircle, MessageSquare, UserPlus,
  Clock, ChevronRight, Eye, ArrowLeft, Send, History, AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatDateShort, getStatusColor, getStatusLabel } from '../../utils/helpers';
import { PERMIT_STATUSES } from '../../data/constants';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'pending_payment', label: 'Pending Payment' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function PermitReview() {
  const { permits, updatePermitStatus } = useApp();
  const { user, getAllUsers } = useAuth();

  const [statusTab, setStatusTab] = useState('submitted');
  const [search, setSearch] = useState('');
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const allUsers = getAllUsers();
  const officers = allUsers.filter(u => u.role === 'admin');

  /* filtered permits */
  const filtered = useMemo(() => {
    let list = permits;
    if (statusTab !== 'all') list = list.filter(p => p.status === statusTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.permitNumber || '').toLowerCase().includes(q) ||
        (p.employeeName || '').toLowerCase().includes(q) ||
        (p.employeeFirstName || '').toLowerCase().includes(q) ||
        (p.employeeLastName || '').toLowerCase().includes(q) ||
        (p.employerName || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [permits, statusTab, search]);

  /* counts per status */
  const counts = useMemo(() => {
    const c = { all: permits.length };
    Object.values(PERMIT_STATUSES).forEach(s => { c[s] = permits.filter(p => p.status === s).length; });
    return c;
  }, [permits]);

  /* actions */
  const handleAction = (newStatus) => {
    if (!selectedPermit) return;
    const notes = actionNotes.trim()
      ? `${actionNotes.trim()} (by ${user?.firstName || 'Admin'} on ${new Date().toLocaleString()})`
      : `Status changed to ${getStatusLabel(newStatus)} by ${user?.firstName || 'Admin'} on ${new Date().toLocaleString()}`;
    updatePermitStatus(selectedPermit.id, newStatus, notes);
    // refresh local view
    setSelectedPermit(prev => ({ ...prev, status: newStatus, notes }));
    setActionNotes('');
  };

  /* ============= Detail View ============= */
  if (selectedPermit) {
    const p = selectedPermit;
    // re-fetch latest from store
    const latest = permits.find(px => px.id === p.id) || p;

    return (
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => { setSelectedPermit(null); setShowHistory(false); }}
          className="mb-4 text-sm text-[#003366] hover:text-[#c5a55a] font-medium flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Back to Queue
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Application details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#003366]">{latest.permitNumber}</h2>
                  <p className="text-sm text-gray-500">
                    {latest.type?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Work Permit'}
                  </p>
                </div>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(latest.status)}`}>
                  {getStatusLabel(latest.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-0.5">Employee</p>
                  <p className="font-medium">{latest.employeeFirstName || latest.firstName} {latest.employeeLastName || latest.lastName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-0.5">Nationality</p>
                  <p className="font-medium">{latest.nationality || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-0.5">Date of Birth</p>
                  <p className="font-medium">{latest.dateOfBirth ? formatDateShort(latest.dateOfBirth) : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-0.5">Employer</p>
                  <p className="font-medium">{latest.employerName || latest.employer || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-0.5">Position</p>
                  <p className="font-medium">{latest.position || latest.jobTitle || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-0.5">Salary</p>
                  <p className="font-medium">{latest.salary ? `$${Number(latest.salary).toLocaleString()}` : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-0.5">Submitted</p>
                  <p className="font-medium">{formatDateShort(latest.submittedAt)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-0.5">Last Updated</p>
                  <p className="font-medium">{formatDateShort(latest.updatedAt)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-0.5">Duration</p>
                  <p className="font-medium">{latest.duration || '-'}</p>
                </div>
              </div>
            </div>

            {/* Documents section */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3">Submitted Documents</h3>
              {latest.documents && latest.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {latest.documents.map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <FileText className="w-5 h-5 text-[#003366] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{doc.name || doc.label || `Document ${i + 1}`}</p>
                        <p className="text-xs text-gray-400">{doc.type || 'Document'}</p>
                      </div>
                      <button className="text-xs text-[#003366] hover:text-[#c5a55a] font-medium">View</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No documents attached to this permit application.</p>
              )}
            </div>

            {/* Notes/History */}
            {latest.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-amber-700 mb-1 flex items-center gap-2">
                  <MessageSquare size={14} /> Latest Notes
                </h3>
                <p className="text-sm text-amber-800">{latest.notes}</p>
              </div>
            )}
          </div>

          {/* Right: Action panel */}
          <div className="space-y-6">
            {/* Status change history */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <button
                onClick={() => setShowHistory(h => !h)}
                className="w-full flex items-center justify-between text-sm font-bold text-[#003366] mb-3"
              >
                <span className="flex items-center gap-2"><History size={14} /> Status History</span>
                <ChevronRight size={14} className={`transition-transform ${showHistory ? 'rotate-90' : ''}`} />
              </button>
              {showHistory && (
                <div className="space-y-2 text-xs">
                  {latest.statusHistory && latest.statusHistory.length > 0 ? (
                    latest.statusHistory.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 mt-1 rounded-full bg-[#003366] flex-shrink-0" />
                        <div>
                          <p className="font-medium">{getStatusLabel(h.status)}</p>
                          <p className="text-gray-400">{h.note || '-'}</p>
                          <p className="text-gray-400">{formatDateShort(h.date)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 mt-1 rounded-full bg-[#003366] flex-shrink-0" />
                      <div>
                        <p className="font-medium">{getStatusLabel(latest.status)}</p>
                        <p className="text-gray-400">{formatDateShort(latest.submittedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notes field */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-[#003366] mb-3 flex items-center gap-2">
                <MessageSquare size={14} /> Add Notes
              </h3>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Add notes or comments about this application..."
                rows={4}
                className="input-field text-sm resize-none"
              />
            </div>

            {/* Assign to officer */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-[#003366] mb-3 flex items-center gap-2">
                <UserPlus size={14} /> Assign to Officer
              </h3>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Select Officer</option>
                {officers.map(o => (
                  <option key={o.id} value={o.id}>{o.firstName} {o.lastName}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (assignTo) {
                    const officer = officers.find(o => o.id === assignTo);
                    const note = `Assigned to ${officer?.firstName || 'Officer'} ${officer?.lastName || ''} by ${user?.firstName || 'Admin'}`;
                    updatePermitStatus(selectedPermit.id, 'under_review', note);
                    setSelectedPermit(prev => ({ ...prev, status: 'under_review', notes: note }));
                    setAssignTo('');
                  }
                }}
                disabled={!assignTo}
                className="btn-outline text-sm w-full mt-2 justify-center"
              >
                <Send size={14} /> Assign
              </button>
            </div>

            {/* Action buttons */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#003366] mb-1">Actions</h3>

              {latest.status !== 'approved' && (
                <button
                  onClick={() => handleAction('approved')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
                >
                  <Check size={16} /> Approve Permit
                </button>
              )}

              {latest.status !== 'rejected' && (
                <button
                  onClick={() => handleAction('rejected')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
                >
                  <XCircle size={16} /> Reject Permit
                </button>
              )}

              {latest.status === 'submitted' && (
                <button
                  onClick={() => handleAction('under_review')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm"
                >
                  <Eye size={16} /> Mark Under Review
                </button>
              )}

              <button
                onClick={() => handleAction('pending_payment')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-yellow-500 text-yellow-700 rounded-lg font-medium hover:bg-yellow-50 transition-colors text-sm"
              >
                <Clock size={16} /> Request Payment
              </button>

              {latest.status === 'approved' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-1">
                    <Check size={14} /> Permit Approved
                  </div>
                  <p className="text-xs text-green-600">
                    ID card is now available for generation in the ID Cards section.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ============= Queue List View ============= */
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">Permit Review Queue</h1>
        <p className="text-gray-500 -mt-4 mb-6">Review, approve, or reject submitted work permit applications.</p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusTab === tab.key
                ? 'bg-[#003366] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#003366] hover:text-[#003366]'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-75">({counts[tab.key] || 0})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by permit number, name, or employer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10 text-sm"
        />
      </div>

      {/* Permits list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <FileText className="w-14 h-14 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Permits Found</h3>
          <p className="text-gray-400">
            {statusTab === 'all' ? 'No permits have been submitted yet.' : `No permits with status "${getStatusLabel(statusTab)}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(permit => (
            <button
              key={permit.id}
              onClick={() => setSelectedPermit(permit)}
              className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-[#c5a55a] hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  permit.status === 'submitted' ? 'bg-blue-50' :
                  permit.status === 'under_review' ? 'bg-purple-50' :
                  permit.status === 'approved' ? 'bg-green-50' :
                  permit.status === 'rejected' ? 'bg-red-50' : 'bg-gray-50'
                }`}>
                  <FileText className={`w-5 h-5 ${
                    permit.status === 'submitted' ? 'text-blue-600' :
                    permit.status === 'under_review' ? 'text-purple-600' :
                    permit.status === 'approved' ? 'text-green-600' :
                    permit.status === 'rejected' ? 'text-red-600' : 'text-gray-600'
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-[#003366]">{permit.permitNumber}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(permit.status)}`}>
                      {getStatusLabel(permit.status)}
                    </span>
                    <span className="text-[10px] text-gray-400 capitalize">{permit.type?.replace(/-/g, ' ')}</span>
                  </div>
                  <p className="text-sm text-gray-700 truncate">
                    {permit.employeeFirstName || permit.firstName}{' '}
                    {permit.employeeLastName || permit.lastName}
                    {permit.employerName ? ` — ${permit.employerName}` : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Submitted: {formatDateShort(permit.submittedAt)}
                    {permit.position ? ` | Position: ${permit.position}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-gray-400 group-hover:text-[#003366]">
                  <span className="text-xs font-medium hidden sm:block">Review</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
