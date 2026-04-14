import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Scale, FileText, ChevronRight, ArrowLeft, Send, Check, X, Clock, Info, AlertCircle,
  ShieldAlert, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import MockBadge from '../components/common/MockBadge';

const GROUNDS = [
  { id: 'procedural', label: 'Procedural error (the Department did not follow its own process)' },
  { id: 'factual', label: 'Factual error (a document or fact was misread)' },
  { id: 'new_evidence', label: 'New evidence became available after the decision' },
  { id: 'other', label: 'Other (explain in reasoning)' },
];

function statusStyle(status) {
  switch (status) {
    case 'filed': return { label: 'Filed', cls: 'bg-blue-100 text-blue-800' };
    case 'under_review': return { label: 'Under Review', cls: 'bg-purple-100 text-purple-800' };
    case 'decided': return { label: 'Decided', cls: 'bg-gray-100 text-gray-800' };
    case 'withdrawn': return { label: 'Withdrawn', cls: 'bg-gray-100 text-gray-500' };
    default: return { label: status, cls: 'bg-gray-100 text-gray-700' };
  }
}

function decisionStyle(decision) {
  if (decision === 'upheld') return { label: 'Upheld — permit returned to review', cls: 'bg-green-100 text-green-800', Icon: ThumbsUp };
  if (decision === 'dismissed') return { label: 'Dismissed — original decision stands', cls: 'bg-red-100 text-red-800', Icon: ThumbsDown };
  return null;
}

function fmt(date) {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return date; }
}

/* ============================================================
   Business portal — file and track appeals
   ============================================================ */
function BusinessAppeals() {
  const { user } = useAuth();
  const { permits, appeals, fileAppeal } = useApp();

  const [formOpen, setFormOpen] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [grounds, setGrounds] = useState('factual');
  const [reasoning, setReasoning] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(null);

  const myAppeals = useMemo(
    () => appeals.filter(a => a.userId === user?.id).sort((a, b) => (b.filedAt || '').localeCompare(a.filedAt || '')),
    [appeals, user]
  );

  // Rejected permits owned by this user with no active appeal
  const appealableRejections = useMemo(() => {
    const appealedPermitIds = new Set(
      appeals.filter(a => a.userId === user?.id && a.status !== 'withdrawn').map(a => a.permitId)
    );
    return permits.filter(p =>
      p.status === 'rejected'
      && (p.employerId === user?.id || p.userId === user?.id)
      && !appealedPermitIds.has(p.id)
    );
  }, [permits, appeals, user]);

  const handleFile = (permit) => {
    setSelectedPermit(permit);
    setGrounds('factual');
    setReasoning('');
    setFormOpen(true);
    setJustSubmitted(null);
  };

  const handleSubmit = () => {
    if (!selectedPermit || !reasoning.trim()) {
      alert('Please provide the reasoning for your appeal.');
      return;
    }
    if (reasoning.trim().length < 50) {
      alert('Please provide at least 50 characters of reasoning so the review panel understands your grounds.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const appeal = fileAppeal({
        userId: user.id,
        permitId: selectedPermit.id,
        permitNumber: selectedPermit.permitNumber,
        applicantName: selectedPermit.employeeName,
        employerName: selectedPermit.employerName,
        grounds,
        reasoning: reasoning.trim(),
      });
      setSubmitting(false);
      setFormOpen(false);
      setJustSubmitted(appeal);
    }, 400);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#003366]">Permit Appeals</h1>
        <p className="text-gray-500 mt-1">
          Appeal a rejected permit decision. Appeals are reviewed by the Labour Commissioner or Deputy Commissioner.
          <MockBadge variant="phase2" label="Phase 2: Tribunal integration" className="ml-2" title="Prototype: appeal review handled internally. Phase 2 integrates the Labour Tribunal case management." />
        </p>
      </div>

      {/* Success banner */}
      {justSubmitted && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <Check size={18} className="text-green-700 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-green-900">
            <p className="font-semibold">Appeal {justSubmitted.appealNumber} filed.</p>
            <p>The review panel will contact you within ten working days.</p>
          </div>
        </div>
      )}

      {/* Appealable rejections */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3">Rejected permits eligible for appeal</h2>
        {appealableRejections.length === 0 ? (
          <p className="text-sm text-gray-500">
            You have no rejected permits currently eligible for appeal.
          </p>
        ) : (
          <div className="space-y-2">
            {appealableRejections.map(p => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border border-red-200 bg-red-50">
                <div className="flex items-start gap-3 min-w-0">
                  <FileText size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-[#003366]">{p.permitNumber} · {p.employeeName}</p>
                    <p className="text-xs text-gray-500 truncate">
                      Rejected {fmt(p.updatedAt)}{p.notes ? ` — ${p.notes}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleFile(p)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-semibold hover:bg-[#002244] transition-colors flex-shrink-0"
                >
                  <Scale size={14} /> File appeal
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Your appeals */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3">Your appeals</h2>
        {myAppeals.length === 0 ? (
          <p className="text-sm text-gray-500">You have not filed any appeals.</p>
        ) : (
          <div className="space-y-3">
            {myAppeals.map(a => {
              const s = statusStyle(a.status);
              const d = decisionStyle(a.decision);
              return (
                <div key={a.id} className="p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <p className="font-bold text-[#003366]">{a.appealNumber}</p>
                      <p className="text-xs text-gray-500">For permit {a.permitNumber} · {a.applicantName}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${s.cls}`}>
                      {s.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">
                    <span className="font-medium">Grounds:</span> {GROUNDS.find(g => g.id === a.grounds)?.label || a.grounds}
                  </p>
                  <p className="text-sm text-gray-700 mt-1 line-clamp-2">{a.reasoning}</p>
                  {d && (
                    <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${d.cls}`}>
                      <d.Icon size={12} /> {d.label}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-2">Filed {fmt(a.filedAt)}{a.updatedAt !== a.filedAt ? ` · updated ${fmt(a.updatedAt)}` : ''}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* File appeal modal */}
      {formOpen && selectedPermit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#003366]">File appeal</h3>
                <p className="text-xs text-gray-500">Permit {selectedPermit.permitNumber} · {selectedPermit.employeeName}</p>
              </div>
              <button onClick={() => setFormOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-2 text-sm text-[#003366]">
                <Info size={14} className="mt-0.5 flex-shrink-0" />
                <p>
                  Appeals are reviewed under the Labour Code by the Commissioner or Deputy Commissioner. A decision is typically issued within ten working days of filing.
                </p>
              </div>

              <div>
                <label className="label-field">Grounds for appeal</label>
                <div className="space-y-2">
                  {GROUNDS.map(g => (
                    <label key={g.id} className="flex items-start gap-2 p-3 rounded-lg border border-gray-200 hover:border-[#003366] cursor-pointer">
                      <input
                        type="radio"
                        name="grounds"
                        value={g.id}
                        checked={grounds === g.id}
                        onChange={() => setGrounds(g.id)}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-gray-700">{g.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-field">Reasoning <span className="text-red-500">*</span></label>
                <textarea
                  className="input-field min-h-[120px]"
                  placeholder="Explain why you are appealing this decision. Reference any documents, dates, or conversations relevant to your case."
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                />
                <p className={`text-xs mt-1 ${reasoning.length < 50 ? 'text-red-500' : 'text-green-600'}`}>
                  {reasoning.length} / 50 minimum characters
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setFormOpen(false)} className="btn-outline">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={submitting || reasoning.trim().length < 50}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003366] text-white rounded-lg font-semibold text-sm hover:bg-[#002244] transition-colors disabled:opacity-40"
              >
                <Send size={14} /> {submitting ? 'Submitting…' : 'Submit appeal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Department console — review appeals (Commissioner / Deputy)
   ============================================================ */
function DeptAppeals() {
  const { user } = useAuth();
  const { appeals, updateAppealStatus } = useApp();

  const [statusFilter, setStatusFilter] = useState('filed');
  const [selected, setSelected] = useState(null);
  const [decisionNote, setDecisionNote] = useState('');

  const canReview = user && ['commissioner', 'deputy_commissioner'].includes(user.deptRole);
  if (!canReview) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-purple-50 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-[#7c3aed]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500">Appeals review is restricted to the Commissioner and Deputy Commissioner.</p>
      </div>
    );
  }

  const filtered = appeals
    .filter(a => statusFilter === 'all' || a.status === statusFilter)
    .sort((a, b) => (b.filedAt || '').localeCompare(a.filedAt || ''));

  const decide = (decision) => {
    if (!selected) return;
    const note = decisionNote.trim() || `Appeal ${decision} by ${user.firstName} ${user.lastName} on ${new Date().toLocaleString()}`;
    updateAppealStatus(selected.id, 'decided', note, decision);
    setSelected(prev => prev ? { ...prev, status: 'decided', decision, timeline: [...(prev.timeline || []), { status: 'decided', date: new Date().toISOString(), note }] } : null);
    setDecisionNote('');
  };

  const markUnderReview = () => {
    if (!selected) return;
    updateAppealStatus(selected.id, 'under_review', `Marked under review by ${user.firstName} ${user.lastName}`);
    setSelected(prev => prev ? { ...prev, status: 'under_review' } : null);
  };

  if (selected) {
    const s = statusStyle(selected.status);
    const d = decisionStyle(selected.decision);
    return (
      <div className="max-w-5xl mx-auto">
        <button onClick={() => setSelected(null)} className="mb-4 text-sm text-[#7c3aed] hover:text-[#6d28d9] font-medium flex items-center gap-1">
          <ArrowLeft size={14} /> Back to queue
        </button>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-[#7c3aed]">{selected.appealNumber}</h1>
              <p className="text-sm text-gray-500">Appeal against permit {selected.permitNumber}</p>
            </div>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-5">
            <div><p className="text-gray-400 text-xs uppercase">Applicant</p><p className="font-medium">{selected.applicantName || '—'}</p></div>
            <div><p className="text-gray-400 text-xs uppercase">Employer</p><p className="font-medium">{selected.employerName || '—'}</p></div>
            <div><p className="text-gray-400 text-xs uppercase">Filed</p><p className="font-medium">{fmt(selected.filedAt)}</p></div>
            <div className="col-span-2 md:col-span-3"><p className="text-gray-400 text-xs uppercase">Grounds</p><p className="font-medium">{GROUNDS.find(g => g.id === selected.grounds)?.label || selected.grounds}</p></div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Reasoning from the appellant</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{selected.reasoning}</p>
          </div>

          {d && (
            <div className={`mb-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${d.cls}`}>
              <d.Icon size={12} /> {d.label}
            </div>
          )}

          {/* Timeline */}
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

          {/* Actions — only if not yet decided */}
          {selected.status !== 'decided' && selected.status !== 'withdrawn' && (
            <div className="border-t border-gray-100 pt-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">Decision</p>
              <textarea
                className="input-field text-sm mb-3"
                placeholder="Optional note to accompany the decision (shown to the appellant)"
                rows={2}
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
              />
              <div className="flex flex-wrap gap-3">
                {selected.status === 'filed' && (
                  <button onClick={markUnderReview} className="inline-flex items-center gap-2 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-semibold hover:bg-[#6d28d9] transition-colors">
                    <Clock size={14} /> Mark Under Review
                  </button>
                )}
                <button onClick={() => decide('upheld')} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">
                  <ThumbsUp size={14} /> Uphold appeal (re-open permit)
                </button>
                <button onClick={() => decide('dismissed')} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
                  <ThumbsDown size={14} /> Dismiss appeal
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
      <h1 className="text-2xl font-bold text-[#7c3aed]">Appeals Review</h1>
      <p className="text-gray-500 mb-6">Review and decide appeals against rejected permit decisions.</p>

      <div className="flex gap-2 mb-4">
        {['filed', 'under_review', 'decided', 'all'].map(k => (
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
          <Scale className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-sm text-gray-500">No appeals match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const s = statusStyle(a.status);
            const d = decisionStyle(a.decision);
            return (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-[#7c3aed] hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <Scale className="w-5 h-5 text-[#7c3aed]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-[#7c3aed]">{a.appealNumber}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${s.cls}`}>{s.label}</span>
                      {d && <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${d.cls}`}>{a.decision}</span>}
                    </div>
                    <p className="text-sm text-gray-700 truncate">
                      Permit {a.permitNumber} · {a.applicantName} · {a.employerName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Filed {fmt(a.filedAt)}</p>
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

/* ============================================================
   Polymorphic outer page
   ============================================================ */
export default function AppealsPage() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.portal === 'dept') return <DeptAppeals />;
  return <BusinessAppeals />;
}
