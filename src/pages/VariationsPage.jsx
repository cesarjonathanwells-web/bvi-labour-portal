import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Edit3, ChevronRight, ArrowLeft, Send, Check, X, Info, ThumbsUp, ThumbsDown,
  Clock, ShieldAlert, FileText,
} from 'lucide-react';
import MockBadge from '../components/common/MockBadge';
import Modal from '../components/common/Modal';

const VARIATION_TYPES = [
  { id: 'position', label: 'Position / job title' },
  { id: 'salary', label: 'Salary' },
  { id: 'working_location', label: 'Working location (island)' },
  { id: 'working_hours', label: 'Working hours' },
  { id: 'other', label: 'Other' },
];

function typeLabel(id) {
  return VARIATION_TYPES.find(v => v.id === id)?.label || id;
}

function statusStyle(status) {
  switch (status) {
    case 'filed': return { label: 'Filed', cls: 'bg-blue-100 text-blue-800' };
    case 'under_review': return { label: 'Under Review', cls: 'bg-purple-100 text-purple-800' };
    case 'approved': return { label: 'Approved', cls: 'bg-green-100 text-green-800' };
    case 'rejected': return { label: 'Rejected', cls: 'bg-red-100 text-red-800' };
    default: return { label: status, cls: 'bg-gray-100 text-gray-700' };
  }
}

function fmt(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; }
}

/* ============================================================
   Business portal — request and track variations
   ============================================================ */
function BusinessVariations() {
  const { user } = useAuth();
  const { permits, variations, submitVariation } = useApp();

  const [formOpen, setFormOpen] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [variationType, setVariationType] = useState('position');
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(null);

  const myPermits = useMemo(
    () => permits.filter(p => (p.employerId === user?.id || p.userId === user?.id) && p.status === 'approved'),
    [permits, user]
  );

  const myVariations = useMemo(
    () => variations
      .filter(v => v.userId === user?.id || v.employerId === user?.id)
      .sort((a, b) => (b.filedAt || '').localeCompare(a.filedAt || '')),
    [variations, user]
  );

  const openForm = (permit) => {
    setSelectedPermit(permit);
    setVariationType('position');
    setNewValue('');
    setReason('');
    setJustSubmitted(null);
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedPermit) return;
    if (!newValue.trim()) {
      alert('Please provide the new value for the variation.');
      return;
    }
    if (reason.trim().length < 30) {
      alert('Please provide at least 30 characters explaining the reason for this variation.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const v = submitVariation({
        userId: user.id,
        employerId: selectedPermit.employerId || user.id,
        employerName: selectedPermit.employerName || user.companyName || user.organization,
        permitId: selectedPermit.id,
        permitNumber: selectedPermit.permitNumber,
        workerName: selectedPermit.employeeName,
        variationType,
        previousValue: (
          variationType === 'position' ? selectedPermit.position :
          variationType === 'salary' ? selectedPermit.salary :
          variationType === 'working_location' ? selectedPermit.island :
          variationType === 'working_hours' ? (selectedPermit.workingHours || '') :
          ''
        ),
        newValue: newValue.trim(),
        reason: reason.trim(),
      });
      setSubmitting(false);
      setJustSubmitted(v);
      setFormOpen(false);
    }, 400);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#003366]">Permit Variations</h1>
        <p className="text-gray-500 mt-1">
          Request a mid-permit amendment — a position change, salary adjustment, or working location update — without filing a full renewal.
          <MockBadge variant="phase2" label="Phase 2: Immigration verification" className="ml-2" title="Phase 2 verifies the worker's status with Immigration before variations take effect." />
        </p>
      </div>

      {justSubmitted && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <Check size={18} className="text-green-700 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-green-900">
            <p className="font-semibold">Variation {justSubmitted.variationNumber} submitted.</p>
            <p>The Department will review within ten working days. You&apos;ll be notified of the decision.</p>
          </div>
        </div>
      )}

      {/* Permits available for variation */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3">Approved permits</h2>
        {myPermits.length === 0 ? (
          <p className="text-sm text-gray-500">You have no approved permits. Variations can only be requested against approved permits.</p>
        ) : (
          <div className="space-y-2">
            {myPermits.map(p => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3 min-w-0">
                  <FileText size={18} className="text-[#003366] mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-[#003366]">{p.permitNumber} · {p.employeeName}</p>
                    <p className="text-xs text-gray-500 truncate">{p.position || '—'}{p.salary ? ` · $${Number(p.salary).toLocaleString()}` : ''}{p.island ? ` · ${p.island}` : ''}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openForm(p)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-semibold hover:bg-[#002244] transition-colors flex-shrink-0"
                >
                  <Edit3 size={14} /> Request variation
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Your variations */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3">Your variations</h2>
        {myVariations.length === 0 ? (
          <p className="text-sm text-gray-500">No variation requests yet.</p>
        ) : (
          <div className="space-y-3">
            {myVariations.map(v => {
              const s = statusStyle(v.status);
              return (
                <div key={v.id} className="p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <p className="font-bold text-[#003366]">{v.variationNumber}</p>
                      <p className="text-xs text-gray-500">Permit {v.permitNumber} · {v.workerName}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${s.cls}`}>{s.label}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">
                    <span className="font-medium">{typeLabel(v.variationType)}:</span>{' '}
                    <span className="text-gray-500 line-through">{v.previousValue || '—'}</span>{' '}
                    → <span className="font-semibold">{v.newValue}</span>
                  </p>
                  <p className="text-sm text-gray-700 mt-1 line-clamp-2">{v.reason}</p>
                  <p className="text-[10px] text-gray-400 mt-2">Filed {fmt(v.filedAt)}{v.updatedAt !== v.filedAt ? ` · updated ${fmt(v.updatedAt)}` : ''}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedPermit && (
        <Modal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          labelledBy="request-variation-title"
          size="lg"
        >
          <div className="p-6 border-b border-gray-100">
            <h3 id="request-variation-title" className="text-lg font-bold text-[#003366]">Request variation</h3>
            <p className="text-xs text-gray-500">Permit {selectedPermit.permitNumber} · {selectedPermit.employeeName}</p>
          </div>

          <div className="p-6 space-y-5">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-2 text-sm text-[#003366]">
                <Info size={14} className="mt-0.5 flex-shrink-0" />
                <p>A variation amends an existing approved permit without issuing a new permit number. Only the field you specify will change on approval.</p>
              </div>

              <div>
                <label className="label-field">Variation type</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {VARIATION_TYPES.map(v => (
                    <label key={v.id} className="flex items-start gap-2 p-3 rounded-lg border border-gray-200 hover:border-[#003366] cursor-pointer">
                      <input
                        type="radio"
                        name="variationType"
                        value={v.id}
                        checked={variationType === v.id}
                        onChange={() => setVariationType(v.id)}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-gray-700">{v.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-field">New value <span className="text-red-500">*</span></label>
                <input
                  className="input-field"
                  placeholder={
                    variationType === 'position' ? 'e.g. Senior Accountant' :
                    variationType === 'salary' ? 'e.g. 55000' :
                    variationType === 'working_location' ? 'Tortola / Virgin Gorda / Anegada / Jost Van Dyke' :
                    variationType === 'working_hours' ? 'e.g. 40 hours/week, Mon-Fri' :
                    'Describe the change'
                  }
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  type={variationType === 'salary' ? 'number' : 'text'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: <span className="font-medium">
                    {variationType === 'position' ? (selectedPermit.position || '—') :
                     variationType === 'salary' ? (selectedPermit.salary ? `$${Number(selectedPermit.salary).toLocaleString()}` : '—') :
                     variationType === 'working_location' ? (selectedPermit.island || '—') :
                     variationType === 'working_hours' ? (selectedPermit.workingHours || '—') :
                     '—'}
                  </span>
                </p>
              </div>

              <div>
                <label className="label-field">Reason <span className="text-red-500">*</span></label>
                <textarea
                  className="input-field min-h-[100px]"
                  placeholder="Explain why this variation is required (e.g., promotion following performance review, operational relocation to Virgin Gorda office)."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <p className={`text-xs mt-1 ${reason.length < 30 ? 'text-red-500' : 'text-green-600'}`}>
                  {reason.length} / 30 minimum characters
                </p>
              </div>
          </div>

          <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={() => setFormOpen(false)} className="btn-outline">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !newValue.trim() || reason.trim().length < 30}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003366] text-white rounded-lg font-semibold text-sm hover:bg-[#002244] transition-colors disabled:opacity-40"
            >
              <Send size={14} /> {submitting ? 'Submitting…' : 'Submit variation'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   Department — review variations
   ============================================================ */
function DeptVariations() {
  const { user } = useAuth();
  const { variations, updateVariationStatus } = useApp();
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
        <p className="text-gray-500">Variation review is restricted to Permit Officers, Deputy Commissioner, and Commissioner.</p>
      </div>
    );
  }

  const filtered = variations
    .filter(v => statusFilter === 'all' || v.status === statusFilter)
    .sort((a, b) => (b.filedAt || '').localeCompare(a.filedAt || ''));

  const decide = (next) => {
    if (!selected) return;
    const note = decisionNote.trim() || `Variation ${next} by ${user.firstName} ${user.lastName}`;
    updateVariationStatus(selected.id, next, note, next === 'approved' ? 'approved' : 'rejected');
    setSelected(s => s ? { ...s, status: next, timeline: [...(s.timeline || []), { status: next, date: new Date().toISOString(), note }] } : null);
    setDecisionNote('');
  };

  const markUnderReview = () => {
    if (!selected) return;
    updateVariationStatus(selected.id, 'under_review', `Marked under review by ${user.firstName} ${user.lastName}`);
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
              <h1 className="text-xl font-bold text-[#7c3aed]">{selected.variationNumber}</h1>
              <p className="text-sm text-gray-500">Variation request for permit {selected.permitNumber}</p>
            </div>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-5">
            <div><p className="text-gray-400 text-xs uppercase">Worker</p><p className="font-medium">{selected.workerName}</p></div>
            <div><p className="text-gray-400 text-xs uppercase">Employer</p><p className="font-medium">{selected.employerName}</p></div>
            <div><p className="text-gray-400 text-xs uppercase">Type</p><p className="font-medium">{typeLabel(selected.variationType)}</p></div>
            <div><p className="text-gray-400 text-xs uppercase">Previous value</p><p className="font-medium">{selected.previousValue || '—'}</p></div>
            <div className="col-span-2"><p className="text-gray-400 text-xs uppercase">Proposed new value</p><p className="font-medium">{selected.newValue}</p></div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Reason</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{selected.reason}</p>
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

          {!['approved', 'rejected'].includes(selected.status) && (
            <div className="border-t border-gray-100 pt-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">Decision</p>
              <textarea
                className="input-field text-sm mb-3"
                placeholder="Optional decision note (shown to the employer)"
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
                  <ThumbsUp size={14} /> Approve variation
                </button>
                <button onClick={() => decide('rejected')} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">
                  <ThumbsDown size={14} /> Reject variation
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
      <h1 className="text-2xl font-bold text-[#7c3aed]">Permit Variations</h1>
      <p className="text-gray-500 mb-6">Review mid-permit amendment requests — position, salary, working location, hours.</p>

      <div className="flex gap-2 mb-4 flex-wrap">
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
          <Edit3 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-sm text-gray-500">No variation requests match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => {
            const s = statusStyle(v.status);
            return (
              <button
                key={v.id}
                onClick={() => setSelected(v)}
                className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-[#7c3aed] hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <Edit3 className="w-5 h-5 text-[#7c3aed]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-[#7c3aed]">{v.variationNumber}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${s.cls}`}>{s.label}</span>
                    </div>
                    <p className="text-sm text-gray-700 truncate">
                      {v.workerName} · Permit {v.permitNumber}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {typeLabel(v.variationType)}: {v.previousValue || '—'} → {v.newValue}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Filed {fmt(v.filedAt)} · {v.employerName}</p>
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

export default function VariationsPage() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.portal === 'dept') return <DeptVariations />;
  return <BusinessVariations />;
}
