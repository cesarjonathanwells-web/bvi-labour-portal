import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  ArrowRightLeft, Search, ChevronRight, ArrowLeft, Send, Check, X, Info,
  ThumbsUp, ThumbsDown, Clock, ShieldAlert, AlertCircle,
} from 'lucide-react';
import MockBadge from '../components/common/MockBadge';
import Modal from '../components/common/Modal';

function statusStyle(status) {
  switch (status) {
    case 'filed': return { label: 'Filed', cls: 'bg-blue-100 text-blue-800' };
    case 'under_review': return { label: 'Under Review', cls: 'bg-purple-100 text-purple-800' };
    case 'approved': return { label: 'Approved', cls: 'bg-green-100 text-green-800' };
    case 'rejected': return { label: 'Rejected', cls: 'bg-red-100 text-red-800' };
    case 'withdrawn': return { label: 'Withdrawn', cls: 'bg-gray-100 text-gray-500' };
    default: return { label: status, cls: 'bg-gray-100 text-gray-700' };
  }
}

function fmt(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; }
}

/* ============================================================
   Business portal — request and track transfers
   ============================================================ */
function BusinessTransfers() {
  const { user } = useAuth();
  const { permits, transfers, submitTransferRequest } = useApp();

  const [formOpen, setFormOpen] = useState(false);
  const [permitLookup, setPermitLookup] = useState('');
  const [foundPermit, setFoundPermit] = useState(null);
  const [newPosition, setNewPosition] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [newWorkLocation, setNewWorkLocation] = useState('');
  const [reason, setReason] = useState('');
  const [workerConsent, setWorkerConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(null);

  const myTransfers = useMemo(
    () => transfers
      .filter(t => t.newEmployerId === user?.id || t.originalEmployerId === user?.id)
      .sort((a, b) => (b.filedAt || '').localeCompare(a.filedAt || '')),
    [transfers, user]
  );

  const resetForm = () => {
    setFormOpen(false);
    setPermitLookup('');
    setFoundPermit(null);
    setNewPosition('');
    setNewSalary('');
    setNewWorkLocation('');
    setReason('');
    setWorkerConsent(false);
    setJustSubmitted(null);
  };

  const lookupPermit = () => {
    const q = permitLookup.trim();
    if (!q) return;
    const match = permits.find(p =>
      (p.permitNumber || '').toLowerCase() === q.toLowerCase()
      && p.status === 'approved'
    );
    if (!match) {
      alert('No approved permit found with that number. Only approved permits can be transferred.');
      setFoundPermit(null);
      return;
    }
    if (match.employerId === user?.id) {
      alert('This permit is already sponsored by your company.');
      setFoundPermit(null);
      return;
    }
    setFoundPermit(match);
    setNewPosition(match.position || '');
    setNewSalary(match.salary ? String(match.salary) : '');
    setNewWorkLocation(match.island || '');
  };

  const handleSubmit = () => {
    if (!foundPermit) {
      alert('Look up a valid permit first.');
      return;
    }
    if (!workerConsent) {
      alert('You must confirm you have the worker\'s written consent before submitting a transfer.');
      return;
    }
    if (!reason.trim() || reason.trim().length < 30) {
      alert('Provide at least 30 characters explaining the reason for the transfer.');
      return;
    }
    if (!newPosition.trim()) {
      alert('New position is required.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const t = submitTransferRequest({
        newEmployerId: user.id,
        newEmployerName: user.companyName || user.organization || `${user.firstName} ${user.lastName}`,
        originalPermitId: foundPermit.id,
        originalPermitNumber: foundPermit.permitNumber,
        originalEmployerId: foundPermit.employerId,
        originalEmployerName: foundPermit.employerName,
        workerUserId: foundPermit.userId,
        workerName: foundPermit.employeeName,
        newPosition: newPosition.trim(),
        newSalary: Number(newSalary) || null,
        newWorkLocation: newWorkLocation.trim() || null,
        reason: reason.trim(),
        workerConsentConfirmed: true,
      });
      setSubmitting(false);
      setJustSubmitted(t);
      setFormOpen(false);
    }, 400);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#003366]">Permit Transfers</h1>
          <p className="text-gray-500 mt-1">
            Request the transfer of an existing approved work permit to your company.
            <MockBadge variant="phase2" label="Phase 2: Immigration verification" className="ml-2" title="Phase 2 verifies the worker's status with Immigration at transfer time." />
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setFormOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-semibold hover:bg-[#002244] transition-colors"
        >
          <ArrowRightLeft size={14} /> New transfer request
        </button>
      </div>

      {justSubmitted && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <Check size={18} className="text-green-700 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-green-900">
            <p className="font-semibold">Transfer {justSubmitted.transferNumber} submitted.</p>
            <p>The Department will review within ten working days. You&apos;ll be notified of the decision.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3">Your transfers</h2>
        {myTransfers.length === 0 ? (
          <p className="text-sm text-gray-500">No transfer requests yet.</p>
        ) : (
          <div className="space-y-3">
            {myTransfers.map(t => {
              const s = statusStyle(t.status);
              const incoming = t.newEmployerId === user?.id;
              return (
                <div key={t.id} className="p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-bold text-[#003366]">{t.transferNumber}</p>
                      <p className="text-xs text-gray-500">
                        Permit {t.originalPermitNumber} · {t.workerName}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${s.cls}`}>
                        {s.label}
                      </span>
                      <span className="text-[10px] text-gray-400">{incoming ? 'Incoming' : 'Outgoing'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                    <span className="font-medium">{t.originalEmployerName}</span>
                    <ArrowRightLeft size={12} className="text-gray-400" />
                    <span className="font-medium">{t.newEmployerName}</span>
                  </div>
                  {t.newPosition && (
                    <p className="text-xs text-gray-500 mt-1">
                      New position: {t.newPosition}{t.newSalary ? ` · $${Number(t.newSalary).toLocaleString()}` : ''}{t.newWorkLocation ? ` · ${t.newWorkLocation}` : ''}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-2">Filed {fmt(t.filedAt)}{t.updatedAt !== t.filedAt ? ` · updated ${fmt(t.updatedAt)}` : ''}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        labelledBy="request-transfer-title"
        size="lg"
      >
        <div className="p-6 border-b border-gray-100">
          <h3 id="request-transfer-title" className="text-lg font-bold text-[#003366]">Request transfer</h3>
        </div>

        <div className="p-6 space-y-5">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-2 text-sm text-[#003366]">
                <Info size={14} className="mt-0.5 flex-shrink-0" />
                <p>
                  A transfer moves an approved permit to a new sponsoring employer without issuing a new permit number. The original employer and the Department are both notified.
                </p>
              </div>

              <div>
                <label className="label-field">Existing permit number <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input
                    className="input-field flex-1"
                    placeholder="e.g. WP-2024-1001"
                    value={permitLookup}
                    onChange={(e) => setPermitLookup(e.target.value)}
                  />
                  <button onClick={lookupPermit} className="inline-flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-semibold hover:bg-[#002244]">
                    <Search size={14} /> Look up
                  </button>
                </div>
                {foundPermit && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                    <p><span className="text-gray-500">Worker:</span> <span className="font-semibold">{foundPermit.employeeName}</span></p>
                    <p><span className="text-gray-500">Current employer:</span> <span className="font-semibold">{foundPermit.employerName}</span></p>
                    <p><span className="text-gray-500">Current position:</span> <span className="font-semibold">{foundPermit.position}</span></p>
                  </div>
                )}
              </div>

              {foundPermit && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label-field">New position <span className="text-red-500">*</span></label>
                      <input className="input-field" value={newPosition} onChange={(e) => setNewPosition(e.target.value)} />
                    </div>
                    <div>
                      <label className="label-field">New annual salary (USD)</label>
                      <input className="input-field" type="number" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} />
                    </div>
                    <div>
                      <label className="label-field">New work location</label>
                      <input className="input-field" placeholder="Tortola / Virgin Gorda / Anegada / Jost Van Dyke" value={newWorkLocation} onChange={(e) => setNewWorkLocation(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="label-field">Reason for transfer <span className="text-red-500">*</span></label>
                    <textarea
                      className="input-field min-h-[100px]"
                      placeholder="Explain the background to this transfer request (e.g., the worker accepted an offer from our company, the original employer ceased trading, etc.)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <p className={`text-xs mt-1 ${reason.length < 30 ? 'text-red-500' : 'text-green-600'}`}>
                      {reason.length} / 30 minimum characters
                    </p>
                  </div>

                  <label className="flex items-start gap-2 p-3 rounded-lg border border-gray-200 bg-amber-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={workerConsent}
                      onChange={(e) => setWorkerConsent(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-gray-800">
                      I confirm I have obtained the worker&apos;s written consent to this transfer, as required under the Labour Code.
                    </span>
                  </label>
                </>
              )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={() => setFormOpen(false)} className="btn-outline">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !foundPermit || !workerConsent || reason.trim().length < 30 || !newPosition.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003366] text-white rounded-lg font-semibold text-sm hover:bg-[#002244] transition-colors disabled:opacity-40"
          >
            <Send size={14} /> {submitting ? 'Submitting…' : 'Submit transfer'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ============================================================
   Department — review permit transfers
   ============================================================ */
function DeptTransfers() {
  const { user } = useAuth();
  const { transfers, updateTransferStatus } = useApp();
  const [statusFilter, setStatusFilter] = useState('filed');
  const [selected, setSelected] = useState(null);
  const [decisionNote, setDecisionNote] = useState('');

  const canReview = user && ['permit_officer', 'deputy_commissioner', 'commissioner'].includes(user.deptRole);
  if (!canReview) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-purple-50 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-[#7c3aed]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500">Transfer review is restricted to Permit Officers, Deputy Commissioner, and Commissioner.</p>
      </div>
    );
  }

  const filtered = transfers
    .filter(t => statusFilter === 'all' || t.status === statusFilter)
    .sort((a, b) => (b.filedAt || '').localeCompare(a.filedAt || ''));

  const decide = (next) => {
    if (!selected) return;
    const note = decisionNote.trim() || `Transfer ${next} by ${user.firstName} ${user.lastName}`;
    updateTransferStatus(selected.id, next, note, next === 'approved' ? 'approved' : 'rejected');
    setSelected(s => s ? { ...s, status: next, timeline: [...(s.timeline || []), { status: next, date: new Date().toISOString(), note }] } : null);
    setDecisionNote('');
  };

  const markUnderReview = () => {
    if (!selected) return;
    updateTransferStatus(selected.id, 'under_review', `Marked under review by ${user.firstName} ${user.lastName}`);
    setSelected(s => s ? { ...s, status: 'under_review' } : null);
  };

  if (selected) {
    const s = statusStyle(selected.status);
    return (
      <div className="max-w-5xl mx-auto">
        <button onClick={() => setSelected(null)} className="mb-4 text-sm text-[#7c3aed] hover:text-[#6d28d9] font-medium flex items-center gap-1">
          <ArrowLeft size={14} /> Back to queue
        </button>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-[#7c3aed]">{selected.transferNumber}</h1>
              <p className="text-sm text-gray-500">Transfer request for permit {selected.originalPermitNumber}</p>
            </div>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-5">
            <div><p className="text-gray-400 text-xs uppercase">Worker</p><p className="font-medium">{selected.workerName}</p></div>
            <div><p className="text-gray-400 text-xs uppercase">From employer</p><p className="font-medium">{selected.originalEmployerName}</p></div>
            <div><p className="text-gray-400 text-xs uppercase">To employer</p><p className="font-medium">{selected.newEmployerName}</p></div>
            <div><p className="text-gray-400 text-xs uppercase">New position</p><p className="font-medium">{selected.newPosition}</p></div>
            <div><p className="text-gray-400 text-xs uppercase">New salary</p><p className="font-medium">{selected.newSalary ? `$${Number(selected.newSalary).toLocaleString()}` : '—'}</p></div>
            <div><p className="text-gray-400 text-xs uppercase">New location</p><p className="font-medium">{selected.newWorkLocation || '—'}</p></div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Reason</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{selected.reason}</p>
            <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
              <Check size={12} /> Worker written consent confirmed by requesting employer
            </p>
          </div>

          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Timeline</p>
            <div className="space-y-2">
              {(selected.timeline || []).map((t, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 mt-2 rounded-full bg-[#7c3aed] flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">{statusStyle(t.status).label}</p>
                    <p className="text-xs text-gray-500">{t.note}</p>
                    <p className="text-[10px] text-gray-400">{fmt(t.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!['approved', 'rejected', 'withdrawn'].includes(selected.status) && (
            <div className="border-t border-gray-100 pt-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">Decision</p>
              <textarea
                className="input-field text-sm mb-3"
                placeholder="Optional decision note (shown to both employers)"
                rows={2}
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
              />
              <div className="flex flex-wrap gap-3">
                {selected.status === 'filed' && (
                  <button onClick={markUnderReview} className="inline-flex items-center gap-2 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-semibold hover:bg-[#6d28d9]">
                    <Clock size={14} /> Mark Under Review
                  </button>
                )}
                <button onClick={() => decide('approved')} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
                  <ThumbsUp size={14} /> Approve transfer
                </button>
                <button onClick={() => decide('rejected')} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">
                  <ThumbsDown size={14} /> Reject transfer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-[#7c3aed]">Permit Transfers</h1>
      <p className="text-gray-500 mb-6">Review and decide employer-to-employer transfer requests for approved permits.</p>

      <div className="flex gap-2 mb-4">
        {['filed', 'under_review', 'approved', 'rejected', 'all'].map(k => (
          <button
            key={k}
            onClick={() => setStatusFilter(k)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === k
                ? 'bg-[#7c3aed] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#7c3aed]'
            }`}
          >
            {k === 'all' ? 'All' : statusStyle(k).label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <ArrowRightLeft className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-sm text-gray-500">No transfer requests match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => {
            const s = statusStyle(t.status);
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-[#7c3aed] hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <ArrowRightLeft className="w-5 h-5 text-[#7c3aed]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-[#7c3aed]">{t.transferNumber}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${s.cls}`}>{s.label}</span>
                    </div>
                    <p className="text-sm text-gray-700 truncate">
                      {t.workerName} · Permit {t.originalPermitNumber}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {t.originalEmployerName} → {t.newEmployerName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Filed {fmt(t.filedAt)}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TransfersPage() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.portal === 'dept') return <DeptTransfers />;
  return <BusinessTransfers />;
}
