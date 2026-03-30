import { useState, useMemo } from 'react';
import {
  FileText, Search, Filter, X, Check, XCircle, MessageSquare, UserPlus,
  Clock, ChevronRight, Eye, ArrowLeft, Send, History, AlertCircle,
  ArrowUpRight, ShieldAlert, User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatDateShort, getStatusColor, getStatusLabel, getStorage, setStorage } from '../../utils/helpers';
import { PERMIT_STATUSES, DEPT_ROLES } from '../../data/constants';

const USERS_KEY = 'bvi_labour_users';

const ALLOWED_ROLES = ['commissioner', 'deputy_commissioner', 'permit_officer'];
const APPROVER_ROLES = ['commissioner', 'deputy_commissioner'];

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'pending_payment', label: 'Pending Payment' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const QUEUE_FILTERS = [
  { key: 'all', label: 'All Permits' },
  { key: 'mine', label: 'My Queue' },
  { key: 'unassigned', label: 'Unassigned' },
];

/* ------------------------------------------------------------------ */
/*  Access Denied component                                            */
/* ------------------------------------------------------------------ */
function AccessDenied() {
  return (
    <div className="max-w-lg mx-auto mt-20 text-center">
      <div className="w-20 h-20 mx-auto mb-6 bg-purple-50 rounded-full flex items-center justify-center">
        <ShieldAlert className="w-10 h-10 text-[#7c3aed]" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-500">Insufficient Permissions</p>
      <p className="text-sm text-gray-400 mt-2">
        You do not have the required permissions to access the Permit Review queue.
        This section is restricted to Permit Officers, Deputy Commissioners, and the Commissioner.
      </p>
    </div>
  );
}

export default function PermitReview() {
  const { permits, updatePermitStatus } = useApp();
  const { user, getAllUsers, hasPermission } = useAuth();

  const [statusTab, setStatusTab] = useState('submitted');
  const [queueFilter, setQueueFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [internalNote, setInternalNote] = useState('');

  /* ---------- Permission gate ---------- */
  if (!user || !hasPermission('permits') || !ALLOWED_ROLES.includes(user.deptRole)) {
    return <AccessDenied />;
  }

  const canApproveReject = APPROVER_ROLES.includes(user.deptRole);
  const isOfficer = user.deptRole === 'permit_officer';

  const allUsers = getAllUsers();
  const permitOfficers = allUsers.filter(
    u => u.portal === 'dept' && u.deptRole === 'permit_officer'
  );
  const deptStaff = allUsers.filter(u => u.portal === 'dept');

  /* helper to get user display name from id */
  const getUserName = (userId) => {
    const u = allUsers.find(x => x.id === userId);
    return u ? `${u.firstName} ${u.lastName}` : '';
  };

  /* filtered permits */
  const filtered = useMemo(() => {
    let list = permits;

    // Queue filter
    if (queueFilter === 'mine') {
      list = list.filter(p => p.assignedTo === user.id);
    } else if (queueFilter === 'unassigned') {
      list = list.filter(p => !p.assignedTo);
    }

    // Status filter
    if (statusTab !== 'all') list = list.filter(p => p.status === statusTab);

    // Search
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
  }, [permits, statusTab, queueFilter, search, user.id]);

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
      ? `${actionNotes.trim()} (by ${user?.firstName || 'Staff'} ${user?.lastName || ''} on ${new Date().toLocaleString()})`
      : `Status changed to ${getStatusLabel(newStatus)} by ${user?.firstName || 'Staff'} ${user?.lastName || ''} on ${new Date().toLocaleString()}`;
    updatePermitStatus(selectedPermit.id, newStatus, notes);
    setSelectedPermit(prev => ({ ...prev, status: newStatus, notes }));
    setActionNotes('');
  };

  /* assign permit to an officer (persists assignedTo on the permit in localStorage) */
  const handleAssign = (officerId) => {
    if (!selectedPermit || !officerId) return;
    const officer = allUsers.find(o => o.id === officerId);
    const note = `Assigned to ${officer?.firstName || 'Officer'} ${officer?.lastName || ''} by ${user?.firstName || 'Staff'} ${user?.lastName || ''}`;

    // Update permit with assignedTo field
    const allPermits = getStorage('bvi_permits') || [];
    const updated = allPermits.map(p =>
      p.id === selectedPermit.id ? { ...p, assignedTo: officerId, status: p.status === 'submitted' ? 'under_review' : p.status, notes: note, updatedAt: new Date().toISOString() } : p
    );
    setStorage('bvi_permits', updated);
    updatePermitStatus(selectedPermit.id, selectedPermit.status === 'submitted' ? 'under_review' : selectedPermit.status, note);
    setSelectedPermit(prev => ({ ...prev, assignedTo: officerId, status: prev.status === 'submitted' ? 'under_review' : prev.status, notes: note }));
    setAssignTo('');
  };

  /* escalate to deputy commissioner */
  const handleEscalate = () => {
    if (!selectedPermit) return;
    const deputy = allUsers.find(u => u.portal === 'dept' && u.deptRole === 'deputy_commissioner');
    if (!deputy) return;
    const note = `Escalated to Deputy Commissioner by ${user?.firstName || 'Officer'} ${user?.lastName || ''} on ${new Date().toLocaleString()}`;
    const allPermits = getStorage('bvi_permits') || [];
    const updated = allPermits.map(p =>
      p.id === selectedPermit.id ? { ...p, assignedTo: deputy.id, escalated: true, notes: note, updatedAt: new Date().toISOString() } : p
    );
    setStorage('bvi_permits', updated);
    updatePermitStatus(selectedPermit.id, selectedPermit.status, note);
    setSelectedPermit(prev => ({ ...prev, assignedTo: deputy.id, escalated: true, notes: note }));
  };

  /* add internal processing note */
  const handleAddInternalNote = () => {
    if (!selectedPermit || !internalNote.trim()) return;
    const allPermits = getStorage('bvi_permits') || [];
    const entry = {
      author: `${user.firstName} ${user.lastName}`,
      authorRole: DEPT_ROLES[user.deptRole?.toUpperCase()]?.label || user.deptRole,
      text: internalNote.trim(),
      date: new Date().toISOString(),
    };
    const updated = allPermits.map(p => {
      if (p.id !== selectedPermit.id) return p;
      return { ...p, processingNotes: [...(p.processingNotes || []), entry], updatedAt: new Date().toISOString() };
    });
    setStorage('bvi_permits', updated);
    setSelectedPermit(prev => ({ ...prev, processingNotes: [...(prev.processingNotes || []), entry] }));
    setInternalNote('');
  };

  /* ============= Detail View ============= */
  if (selectedPermit) {
    const p = selectedPermit;
    const latest = permits.find(px => px.id === p.id) || p;
    // Merge local state (like assignedTo, processingNotes) that may not be in context yet
    const merged = { ...latest, ...selectedPermit };

    return (
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => { setSelectedPermit(null); setShowHistory(false); }}
          className="mb-4 text-sm text-[#7c3aed] hover:text-[#6d28d9] font-medium flex items-center gap-1"
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
                  <h2 className="text-xl font-bold text-[#7c3aed]">{merged.permitNumber}</h2>
                  <p className="text-sm text-gray-500">
                    {merged.type?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Work Permit'}
                  </p>
                </div>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(merged.status)}`}>
                  {getStatusLabel(merged.status)}
                </span>
              </div>

              {/* Assigned officer badge */}
              {merged.assignedTo && (
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full text-xs font-medium text-[#7c3aed]">
                  <User size={12} />
                  Assigned to: {getUserName(merged.assignedTo)}
                  {merged.escalated && (
                    <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px]">Escalated</span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-0.5">Employee</p>
                  <p className="font-medium">{merged.employeeFirstName || merged.firstName} {merged.employeeLastName || merged.lastName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-0.5">Nationality</p>
                  <p className="font-medium">{merged.nationality || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-0.5">Date of Birth</p>
                  <p className="font-medium">{merged.dateOfBirth ? formatDateShort(merged.dateOfBirth) : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-0.5">Employer</p>
                  <p className="font-medium">{merged.employerName || merged.employer || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-0.5">Position</p>
                  <p className="font-medium">{merged.position || merged.jobTitle || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-0.5">Salary</p>
                  <p className="font-medium">{merged.salary ? `$${Number(merged.salary).toLocaleString()}` : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-0.5">Submitted</p>
                  <p className="font-medium">{formatDateShort(merged.submittedAt)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-0.5">Last Updated</p>
                  <p className="font-medium">{formatDateShort(merged.updatedAt)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-0.5">Duration</p>
                  <p className="font-medium">{merged.duration || '-'}</p>
                </div>
              </div>
            </div>

            {/* Documents section */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#7c3aed] uppercase tracking-wider mb-3">Submitted Documents</h3>
              {merged.documents && merged.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {merged.documents.map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <FileText className="w-5 h-5 text-[#7c3aed] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{doc.name || doc.label || `Document ${i + 1}`}</p>
                        <p className="text-xs text-gray-400">{doc.type || 'Document'}</p>
                      </div>
                      <button className="text-xs text-[#7c3aed] hover:text-[#6d28d9] font-medium">View</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No documents attached to this permit application.</p>
              )}
            </div>

            {/* Latest Notes */}
            {merged.notes && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-purple-700 mb-1 flex items-center gap-2">
                  <MessageSquare size={14} /> Latest Notes
                </h3>
                <p className="text-sm text-purple-800">{merged.notes}</p>
              </div>
            )}

            {/* Internal Processing Notes (visible to all dept staff) */}
            <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#7c3aed] uppercase tracking-wider mb-3 flex items-center gap-2">
                <ShieldAlert size={14} /> Internal Processing Notes
                <span className="text-[10px] font-normal text-gray-400 ml-auto">Visible to dept staff only</span>
              </h3>

              {(merged.processingNotes && merged.processingNotes.length > 0) ? (
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {merged.processingNotes.map((note, i) => (
                    <div key={i} className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-[#7c3aed]">{note.author}</span>
                        <span className="text-[10px] text-gray-400">{note.authorRole} - {formatDateShort(note.date)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{note.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 mb-4">No internal notes yet.</p>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Add an internal note..."
                  className="input-field text-sm flex-1"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddInternalNote(); }}
                />
                <button
                  onClick={handleAddInternalNote}
                  disabled={!internalNote.trim()}
                  className="px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] disabled:opacity-40 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Right: Action panel */}
          <div className="space-y-6">
            {/* Status change history */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <button
                onClick={() => setShowHistory(h => !h)}
                className="w-full flex items-center justify-between text-sm font-bold text-[#7c3aed] mb-3"
              >
                <span className="flex items-center gap-2"><History size={14} /> Status History</span>
                <ChevronRight size={14} className={`transition-transform ${showHistory ? 'rotate-90' : ''}`} />
              </button>
              {showHistory && (
                <div className="space-y-2 text-xs">
                  {merged.statusHistory && merged.statusHistory.length > 0 ? (
                    merged.statusHistory.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 mt-1 rounded-full bg-[#7c3aed] flex-shrink-0" />
                        <div>
                          <p className="font-medium">{getStatusLabel(h.status)}</p>
                          <p className="text-gray-400">{h.note || '-'}</p>
                          <p className="text-gray-400">{formatDateShort(h.date)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 mt-1 rounded-full bg-[#7c3aed] flex-shrink-0" />
                      <div>
                        <p className="font-medium">{getStatusLabel(merged.status)}</p>
                        <p className="text-gray-400">{formatDateShort(merged.submittedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action notes */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-[#7c3aed] mb-3 flex items-center gap-2">
                <MessageSquare size={14} /> Action Notes
              </h3>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Add notes for status change actions..."
                rows={4}
                className="input-field text-sm resize-none"
              />
            </div>

            {/* Assign to officer (visible to deputy/commissioner) */}
            {canApproveReject && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-[#7c3aed] mb-3 flex items-center gap-2">
                  <UserPlus size={14} /> Assign to Officer
                </h3>
                <select
                  value={assignTo}
                  onChange={(e) => setAssignTo(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">Select Permit Officer</option>
                  {permitOfficers.map(o => (
                    <option key={o.id} value={o.id}>{o.firstName} {o.lastName}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleAssign(assignTo)}
                  disabled={!assignTo}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] disabled:opacity-40 transition-colors"
                >
                  <Send size={14} /> Assign
                </button>
              </div>
            )}

            {/* Escalate button for permit officers */}
            {isOfficer && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-[#7c3aed] mb-3 flex items-center gap-2">
                  <ArrowUpRight size={14} /> Escalate
                </h3>
                <button
                  onClick={handleEscalate}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-[#7c3aed] text-[#7c3aed] rounded-lg font-medium hover:bg-purple-50 transition-colors text-sm"
                >
                  <ArrowUpRight size={16} /> Escalate to Deputy Commissioner
                </button>
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                  Forward this application for senior review and decision.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#7c3aed] mb-1">Actions</h3>

              {/* Officer actions: review, request docs, mark under review, forward */}
              {merged.status === 'submitted' && (
                <button
                  onClick={() => handleAction('under_review')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7c3aed] text-white rounded-lg font-medium hover:bg-[#6d28d9] transition-colors text-sm"
                >
                  <Eye size={16} /> Mark Under Review
                </button>
              )}

              {/* Request additional documents */}
              <button
                onClick={() => {
                  const note = actionNotes.trim()
                    ? `Additional documents requested: ${actionNotes.trim()} (by ${user?.firstName} ${user?.lastName} on ${new Date().toLocaleString()})`
                    : `Additional documents requested by ${user?.firstName} ${user?.lastName} on ${new Date().toLocaleString()}`;
                  updatePermitStatus(selectedPermit.id, 'under_review', note);
                  setSelectedPermit(prev => ({ ...prev, status: 'under_review', notes: note }));
                  setActionNotes('');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-amber-500 text-amber-700 rounded-lg font-medium hover:bg-amber-50 transition-colors text-sm"
              >
                <FileText size={16} /> Request More Documents
              </button>

              {/* Approve / Reject - only for Deputy/Commissioner */}
              {canApproveReject && (
                <>
                  {merged.status !== 'approved' && (
                    <button
                      onClick={() => handleAction('approved')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
                    >
                      <Check size={16} /> Approve Permit
                    </button>
                  )}

                  {merged.status !== 'rejected' && (
                    <button
                      onClick={() => handleAction('rejected')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
                    >
                      <XCircle size={16} /> Reject Permit
                    </button>
                  )}
                </>
              )}

              {/* Cannot approve/reject notice for officers */}
              {!canApproveReject && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-[#7c3aed] text-xs font-medium">
                    <AlertCircle size={14} />
                    Final approval/rejection requires Deputy Commissioner or Commissioner authority.
                    Use "Escalate" to forward for a decision.
                  </div>
                </div>
              )}

              <button
                onClick={() => handleAction('pending_payment')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-yellow-500 text-yellow-700 rounded-lg font-medium hover:bg-yellow-50 transition-colors text-sm"
              >
                <Clock size={16} /> Request Payment
              </button>

              {merged.status === 'approved' && (
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
        <h1 className="text-2xl font-bold text-[#7c3aed]">Permit Review Queue</h1>
        <p className="text-gray-500 mb-6">Review, approve, or reject submitted work permit applications.</p>
      </div>

      {/* Queue filter (My Queue / Unassigned / All) */}
      <div className="flex flex-wrap gap-2 mb-4">
        {QUEUE_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setQueueFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              queueFilter === f.key
                ? 'bg-[#7c3aed] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#7c3aed] hover:text-[#7c3aed]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusTab === tab.key
                ? 'bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#7c3aed] hover:text-[#7c3aed]'
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
            {queueFilter === 'mine' ? 'No permits are assigned to you.' :
             queueFilter === 'unassigned' ? 'No unassigned permits.' :
             statusTab === 'all' ? 'No permits have been submitted yet.' :
             `No permits with status "${getStatusLabel(statusTab)}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(permit => (
            <button
              key={permit.id}
              onClick={() => setSelectedPermit(permit)}
              className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-[#7c3aed] hover:shadow-md transition-all group"
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
                    <span className="font-bold text-[#7c3aed]">{permit.permitNumber}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(permit.status)}`}>
                      {getStatusLabel(permit.status)}
                    </span>
                    <span className="text-[10px] text-gray-400 capitalize">{permit.type?.replace(/-/g, ' ')}</span>
                  </div>
                  <p className="text-sm text-gray-700 truncate">
                    {permit.employeeFirstName || permit.firstName}{' '}
                    {permit.employeeLastName || permit.lastName}
                    {permit.employerName ? ` -- ${permit.employerName}` : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-xs text-gray-400">
                      Submitted: {formatDateShort(permit.submittedAt)}
                      {permit.position ? ` | Position: ${permit.position}` : ''}
                    </p>
                    {permit.assignedTo && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#7c3aed] bg-purple-50 px-2 py-0.5 rounded-full">
                        <User size={10} /> {getUserName(permit.assignedTo)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-gray-400 group-hover:text-[#7c3aed]">
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
