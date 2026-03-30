import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { DISPUTE_STATUSES } from '../../data/constants';
import { formatDate, getStatusColor, getStatusLabel } from '../../utils/helpers';
import {
  Search, Filter, ChevronDown, ChevronUp, Clock, Building2,
  User, MessageSquare, X, Scale,
  FileText, Inbox, Flag, Paperclip,
} from 'lucide-react';

const PRIORITY_LEVELS = [
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700 border-green-200' },
];

const COMPLAINT_TYPES = [
  'Unpaid Wages', 'Unfair Dismissal', 'Discrimination', 'Unsafe Working Conditions',
  'Breach of Contract', 'Harassment', 'Wrongful Deduction of Wages',
  'Denial of Leave Entitlements', 'Other',
];

export default function DisputeList() {
  const { disputes, updateDisputeStatus } = useApp();
  const { getAllUsers } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ status: '', type: '', dateFrom: '', dateTo: '', priority: '' });
  const [noteInput, setNoteInput] = useState({});
  const [assigneeInput, setAssigneeInput] = useState({});
  const [priorityData, setPriorityData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bvi_dispute_meta') || '{}'); } catch { return {}; }
  });

  const saveMeta = (disputeId, data) => {
    const updated = { ...priorityData, [disputeId]: { ...(priorityData[disputeId] || {}), ...data } };
    setPriorityData(updated);
    localStorage.setItem('bvi_dispute_meta', JSON.stringify(updated));
  };

  // Filter
  let filtered = [...disputes];

  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    filtered = filtered.filter(d =>
      d.caseNumber?.toLowerCase().includes(s) ||
      d.complainantName?.toLowerCase().includes(s) ||
      d.respondentName?.toLowerCase().includes(s) ||
      d.complaintType?.toLowerCase().includes(s)
    );
  }
  if (filters.status) filtered = filtered.filter(d => d.status === filters.status);
  if (filters.type) filtered = filtered.filter(d => d.complaintType === filters.type);
  if (filters.priority) filtered = filtered.filter(d => priorityData[d.id]?.priority === filters.priority);
  if (filters.dateFrom) filtered = filtered.filter(d => new Date(d.filedAt) >= new Date(filters.dateFrom));
  if (filters.dateTo) filtered = filtered.filter(d => new Date(d.filedAt) <= new Date(filters.dateTo + 'T23:59:59'));

  const hasActiveFilters = Object.values(filters).some(v => v) || searchTerm;

  const clearFilters = () => {
    setFilters({ status: '', type: '', dateFrom: '', dateTo: '', priority: '' });
    setSearchTerm('');
  };

  const handleStatusUpdate = (disputeId, newStatus) => {
    const note = noteInput[disputeId] || '';
    updateDisputeStatus(disputeId, newStatus, note);
    setNoteInput(prev => ({ ...prev, [disputeId]: '' }));
  };

  const handleAddNote = (disputeId) => {
    const note = noteInput[disputeId]?.trim();
    if (!note) return;
    // Add note to timeline without changing status
    const dispute = disputes.find(d => d.id === disputeId);
    if (dispute) {
      const allDisputesData = JSON.parse(localStorage.getItem('bvi_disputes') || '[]');
      const updated = allDisputesData.map(d => {
        if (d.id !== disputeId) return d;
        return {
          ...d,
          updatedAt: new Date().toISOString(),
          timeline: [...(d.timeline || []), { status: d.status, date: new Date().toISOString(), note: `Officer note: ${note}` }],
        };
      });
      localStorage.setItem('bvi_disputes', JSON.stringify(updated));
      setNoteInput(prev => ({ ...prev, [disputeId]: '' }));
      window.location.reload();
    }
  };

  const handleAssignee = (disputeId, assignee) => {
    saveMeta(disputeId, { assignee });
    setAssigneeInput(prev => ({ ...prev, [disputeId]: '' }));
  };

  const handlePriority = (disputeId, priority) => {
    saveMeta(disputeId, { priority });
  };

  // Stats
  const stats = {
    total: disputes.length,
    filed: disputes.filter(d => d.status === 'filed').length,
    investigating: disputes.filter(d => d.status === 'investigating').length,
    mediation: disputes.filter(d => d.status === 'mediation').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900' },
          { label: 'Filed', value: stats.filed, color: 'text-blue-600' },
          { label: 'Investigating', value: stats.investigating, color: 'text-purple-600' },
          { label: 'Mediation', value: stats.mediation, color: 'text-yellow-600' },
          { label: 'Resolved', value: stats.resolved, color: 'text-green-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-lg border p-3 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input-field !pl-10" placeholder="Search case number, name, type..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn-outline !py-2 !px-3 text-sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4" />Filters
          </button>
          {hasActiveFilters && (
            <button className="text-sm text-red-600 hover:underline flex items-center gap-1" onClick={clearFilters}>
              <X className="w-3 h-3" />Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t">
            <div>
              <label className="label-field">Status</label>
              <select className="input-field" value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                <option value="">All</option>
                {Object.values(DISPUTE_STATUSES).map(s => (
                  <option key={s} value={s}>{getStatusLabel(s)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Type</label>
              <select className="input-field" value={filters.type}
                onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
                <option value="">All Types</option>
                {COMPLAINT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Priority</label>
              <select className="input-field" value={filters.priority}
                onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
                <option value="">All</option>
                {PRIORITY_LEVELS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">From Date</label>
              <input type="date" className="input-field" value={filters.dateFrom}
                onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
            </div>
            <div>
              <label className="label-field">To Date</label>
              <input type="date" className="input-field" value={filters.dateTo}
                onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
            </div>
          </div>
        )}
      </div>

      <p className="text-gray-600 text-sm mb-3">
        Showing {filtered.length} of {disputes.length} disputes
      </p>

      {/* Dispute list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{hasActiveFilters ? 'No disputes match your filters.' : 'No disputes have been filed.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(dispute => {
            const expanded = expandedId === dispute.id;
            const meta = priorityData[dispute.id] || {};
            const priorityInfo = PRIORITY_LEVELS.find(p => p.value === meta.priority);

            return (
              <div key={dispute.id} className="card !p-0 overflow-hidden">
                {/* Priority bar */}
                {meta.priority && (
                  <div className={`h-1 ${
                    meta.priority === 'high' ? 'bg-red-500' :
                    meta.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                )}

                <div className="p-5">
                  {/* Row header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 cursor-pointer"
                    onClick={() => setExpandedId(expanded ? null : dispute.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{dispute.caseNumber}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}>
                          {getStatusLabel(dispute.status)}
                        </span>
                        {priorityInfo && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${priorityInfo.color}`}>
                            <Flag className="w-3 h-3 inline mr-1" />{priorityInfo.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-700">{dispute.complaintType}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{dispute.complainantName}</span>
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />vs. {dispute.respondentName}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Filed: {formatDate(dispute.filedAt)}</span>
                        {meta.assignee && (
                          <span className="flex items-center gap-1 font-medium text-[#003366]">
                            <User className="w-3 h-3" />Assigned: {meta.assignee}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Quick status buttons */}
                      <div className="hidden sm:flex gap-1" onClick={e => e.stopPropagation()}>
                        {Object.values(DISPUTE_STATUSES).slice(0, 4).map(s => (
                          <button key={s} disabled={dispute.status === s}
                            className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                              dispute.status === s
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : `hover:opacity-80 ${getStatusColor(s)}`
                            }`}
                            onClick={() => handleStatusUpdate(dispute.id, s)}
                            title={`Set to ${getStatusLabel(s)}`}>
                            {getStatusLabel(s)}
                          </button>
                        ))}
                      </div>
                      {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>

                  {/* Expanded view */}
                  {expanded && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {/* Priority & Assignee controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label-field">Priority</label>
                          <div className="flex gap-2">
                            {PRIORITY_LEVELS.map(p => (
                              <button key={p.value}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                  meta.priority === p.value
                                    ? p.color + ' ring-2 ring-offset-1 ring-gray-300'
                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                }`}
                                onClick={() => handlePriority(dispute.id, p.value)}>
                                <Flag className="w-3 h-3 inline mr-1" />{p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="label-field">Assigned Officer</label>
                          <div className="flex gap-2">
                            <input className="input-field !py-1.5 text-sm" placeholder="Officer name"
                              value={assigneeInput[dispute.id] ?? meta.assignee ?? ''}
                              onChange={e => setAssigneeInput(prev => ({ ...prev, [dispute.id]: e.target.value }))} />
                            <button className="btn-primary !py-1.5 !px-3 text-xs"
                              onClick={() => handleAssignee(dispute.id, assigneeInput[dispute.id] || meta.assignee || '')}>
                              Set
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Status update (mobile-friendly) */}
                      <div className="sm:hidden">
                        <label className="label-field">Update Status</label>
                        <div className="flex flex-wrap gap-1">
                          {Object.values(DISPUTE_STATUSES).map(s => (
                            <button key={s} disabled={dispute.status === s}
                              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                dispute.status === s
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : `hover:opacity-80 ${getStatusColor(s)}`
                              }`}
                              onClick={() => handleStatusUpdate(dispute.id, s)}>
                              {getStatusLabel(s)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Case details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 mb-1">Complainant</h4>
                          <div className="text-sm text-gray-700 space-y-0.5 bg-gray-50 p-3 rounded">
                            <p className="font-medium">{dispute.complainantName}</p>
                            <p>{dispute.complainantEmail}</p>
                            <p>{dispute.complainantPhone}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 mb-1">Respondent</h4>
                          <div className="text-sm text-gray-700 space-y-0.5 bg-gray-50 p-3 rounded">
                            <p className="font-medium">{dispute.respondentName}</p>
                            <p>{dispute.respondentAddress}</p>
                            {dispute.respondentPhone && <p>{dispute.respondentPhone}</p>}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 mb-1">Description</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                          {dispute.description}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 mb-1">Desired Resolution</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{dispute.desiredResolution}</p>
                      </div>

                      {dispute.labourCodeRef && (
                        <div className="text-sm text-[#003366] flex items-center gap-2 bg-blue-50 p-3 rounded">
                          <Scale className="w-4 h-4 flex-shrink-0" />{dispute.labourCodeRef}
                        </div>
                      )}

                      {/* Timeline */}
                      {dispute.timeline && dispute.timeline.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#003366]" />Timeline
                          </h4>
                          <div className="space-y-2 ml-2">
                            {dispute.timeline.map((entry, i) => (
                              <div key={i} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${i === dispute.timeline.length - 1 ? 'bg-[#003366]' : 'bg-gray-300'}`} />
                                  {i < dispute.timeline.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                                </div>
                                <div className="pb-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getStatusColor(entry.status)}`}>
                                      {getStatusLabel(entry.status)}
                                    </span>
                                    <span className="text-[10px] text-gray-400">{formatDate(entry.date)}</span>
                                  </div>
                                  {entry.note && <p className="text-xs text-gray-600 mt-0.5">{entry.note}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add officer note */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-[#003366]" />Add Officer Note
                        </h4>
                        <div className="flex gap-2">
                          <input className="input-field flex-1" placeholder="Add a note about this case..."
                            value={noteInput[dispute.id] || ''}
                            onChange={e => setNoteInput(prev => ({ ...prev, [dispute.id]: e.target.value }))} />
                          <button className="btn-primary !px-4" onClick={() => handleAddNote(dispute.id)}
                            disabled={!noteInput[dispute.id]?.trim()}>
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Documents */}
                      {dispute.documents && dispute.documents.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 mb-1">Documents ({dispute.documents.length})</h4>
                          <div className="flex flex-wrap gap-2">
                            {dispute.documents.map((doc, i) => (
                              <span key={i} className="text-xs bg-gray-50 px-2 py-1 rounded border flex items-center gap-1">
                                <Paperclip className="w-3 h-3" />{doc.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
