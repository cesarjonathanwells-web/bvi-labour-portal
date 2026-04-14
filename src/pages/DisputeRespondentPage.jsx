import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Scale, ChevronRight, ArrowLeft, Send, Check, X, AlertCircle, Info,
  Building2, User as UserIcon, FileText,
} from 'lucide-react';
import MockBadge from '../components/common/MockBadge';

function statusStyle(status) {
  switch (status) {
    case 'filed': return { label: 'Filed', cls: 'bg-blue-100 text-blue-800' };
    case 'investigating': return { label: 'Investigating', cls: 'bg-amber-100 text-amber-800' };
    case 'response_received': return { label: 'Response Received', cls: 'bg-purple-100 text-purple-800' };
    case 'mediation': return { label: 'Mediation', cls: 'bg-indigo-100 text-indigo-800' };
    case 'resolved': return { label: 'Resolved', cls: 'bg-green-100 text-green-800' };
    case 'dismissed': return { label: 'Dismissed', cls: 'bg-gray-100 text-gray-800' };
    case 'respondent_response': return { label: 'Respondent Response', cls: 'bg-purple-100 text-purple-800' };
    default: return { label: status || '—', cls: 'bg-gray-100 text-gray-700' };
  }
}

function fmt(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; }
}

export default function DisputeRespondentPage() {
  const { user } = useAuth();
  const { disputes, addDisputeResponse } = useApp();
  const [selected, setSelected] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [supportingNotes, setSupportingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState(null);

  const companyTokens = useMemo(() => {
    if (!user) return [];
    return [user.companyName, user.organization]
      .filter(Boolean)
      .map(s => s.toLowerCase().trim())
      .filter(Boolean);
  }, [user]);

  const myDisputes = useMemo(() => {
    if (!companyTokens.length) return [];
    return disputes
      .filter(d => {
        const name = (d.respondentName || '').toLowerCase();
        return companyTokens.some(tok => name.includes(tok));
      })
      .sort((a, b) => (b.filedAt || '').localeCompare(a.filedAt || ''));
  }, [disputes, companyTokens]);

  if (!user) return null;

  // Re-sync selected when underlying disputes array updates
  const currentSelected = selected ? (disputes.find(d => d.id === selected.id) || selected) : null;

  const openDispute = (d) => {
    setSelected(d);
    setResponseText('');
    setSupportingNotes('');
    setBanner(null);
  };

  const handleSubmit = () => {
    if (!currentSelected) return;
    if (responseText.trim().length < 50) {
      alert('Please provide at least 50 characters in your response.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const updated = addDisputeResponse(currentSelected.id, {
        responseText: responseText.trim(),
        supportingNotes: supportingNotes.trim(),
      });
      setSubmitting(false);
      setBanner({ caseNumber: updated?.caseNumber || currentSelected.caseNumber });
      setResponseText('');
      setSupportingNotes('');
    }, 400);
  };

  // Detail view
  if (currentSelected) {
    const s = statusStyle(currentSelected.status);
    const hasResponse = !!currentSelected.respondentResponse;
    return (
      <div className="max-w-5xl mx-auto">
        <button onClick={() => setSelected(null)} className="mb-4 text-sm text-[#003366] hover:text-[#002244] font-medium flex items-center gap-1">
          <ArrowLeft size={14} /> Back to disputes
        </button>

        {banner && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <Check size={18} className="text-green-700 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-900">
              <p className="font-semibold">Response submitted for {banner.caseNumber}.</p>
              <p>The complainant and the dispute officer have been notified.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-[#003366]">{currentSelected.caseNumber}</h1>
              <p className="text-sm text-gray-500">Dispute filed against {currentSelected.respondentName}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>
              {hasResponse && (
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Response submitted</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-5">
            <div><p className="text-gray-400 text-xs uppercase">Type</p><p className="font-medium">{currentSelected.type || currentSelected.disputeType || '—'}</p></div>
            <div><p className="text-gray-400 text-xs uppercase">Filed</p><p className="font-medium">{fmt(currentSelected.filedAt)}</p></div>
            <div><p className="text-gray-400 text-xs uppercase">Last updated</p><p className="font-medium">{fmt(currentSelected.updatedAt)}</p></div>
            <div><p className="text-gray-400 text-xs uppercase">Complainant</p><p className="font-medium">{currentSelected.complainantName || currentSelected.employeeName || '—'}</p></div>
            <div><p className="text-gray-400 text-xs uppercase">Respondent</p><p className="font-medium">{currentSelected.respondentName}</p></div>
            <div><p className="text-gray-400 text-xs uppercase">Amount claimed</p><p className="font-medium">{currentSelected.amountClaimed ? `$${Number(currentSelected.amountClaimed).toLocaleString()}` : '—'}</p></div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Complainant allegations</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{currentSelected.description || currentSelected.details || '—'}</p>
            {currentSelected.desiredOutcome && (
              <p className="text-sm text-gray-700 mt-3"><span className="font-semibold">Desired outcome:</span> {currentSelected.desiredOutcome}</p>
            )}
          </div>

          {/* Existing respondent response */}
          {hasResponse && (
            <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Check size={14} className="text-purple-700" />
                <p className="text-xs font-semibold text-purple-900 uppercase tracking-wide">Your submitted response</p>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{currentSelected.respondentResponse.text}</p>
              {currentSelected.respondentResponse.supportingNotes && (
                <p className="text-xs text-gray-600 mt-2"><span className="font-semibold">Supporting notes:</span> {currentSelected.respondentResponse.supportingNotes}</p>
              )}
              <p className="text-[10px] text-gray-500 mt-3">Submitted {fmt(currentSelected.respondentResponse.submittedAt)} by {currentSelected.respondentResponse.submittedByName || 'your organisation'}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Timeline</p>
            <div className="space-y-2">
              {(currentSelected.timeline || []).map((t, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 mt-2 rounded-full bg-[#003366] flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">{statusStyle(t.status).label}</p>
                    <p className="text-xs text-gray-500">{t.note}</p>
                    <p className="text-[10px] text-gray-400">{fmt(t.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Response form */}
          {!hasResponse ? (
            <div className="border-t border-gray-100 pt-5">
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-sm text-red-900 mb-4">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <p><span className="font-bold">This is a legal document.</span> Answer carefully. Your response forms part of the official case file and will be reviewed by the Dispute Officer and, if unresolved, by the Labour Tribunal.</p>
              </div>

              <label className="label-field">Your response <span className="text-red-500">*</span></label>
              <textarea
                className="input-field min-h-[140px]"
                placeholder="Provide a point-by-point response to the allegations. Reference contracts, dates, pay slips, or correspondence where relevant."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
              />
              <p className={`text-xs mt-1 ${responseText.trim().length < 50 ? 'text-red-500' : 'text-green-600'}`}>
                {responseText.trim().length} / 50 minimum characters
              </p>

              <div className="mt-4">
                <label className="label-field">Supporting notes (optional)</label>
                <textarea
                  className="input-field min-h-[80px]"
                  placeholder="List documents you will provide separately (e.g., signed contract, payroll records, warning letters)."
                  value={supportingNotes}
                  onChange={(e) => setSupportingNotes(e.target.value)}
                />
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || responseText.trim().length < 50}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003366] text-white rounded-lg font-semibold text-sm hover:bg-[#002244] transition-colors disabled:opacity-40"
                >
                  <Send size={14} /> {submitting ? 'Submitting…' : 'Submit response'}
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-100 pt-5">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-2 text-sm text-[#003366]">
                <Info size={14} className="mt-0.5 flex-shrink-0" />
                <p>Your response has been recorded. You may only submit one response per dispute. Additional evidence can be sent directly to the Dispute Officer.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#003366]">Disputes Against Us</h1>
        <p className="text-gray-500 mt-1">
          Disputes filed against {user.companyName || user.organization || 'your organisation'}. You can review the allegations and submit a formal written response.
          <MockBadge variant="phase2" label="Phase 2: Tribunal integration" className="ml-2" title="Prototype: responses logged internally. Phase 2 integrates Labour Tribunal case management." />
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3">Open cases</h2>
        {myDisputes.length === 0 ? (
          <div className="text-center py-12">
            <Scale className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-sm text-gray-500">No disputes have been filed against your company.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myDisputes.map(d => {
              const s = statusStyle(d.status);
              const hasResponse = !!d.respondentResponse;
              return (
                <button
                  key={d.id}
                  onClick={() => openDispute(d)}
                  className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-[#003366] hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Scale className="w-5 h-5 text-[#003366]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-[#003366]">{d.caseNumber}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${s.cls}`}>{s.label}</span>
                        {hasResponse && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-green-100 text-green-800">Response submitted</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 truncate flex items-center gap-1">
                        <UserIcon className="w-3 h-3 text-gray-400" />
                        {d.complainantName || d.employeeName || 'Complainant'}
                        <span className="mx-1 text-gray-400">vs.</span>
                        <Building2 className="w-3 h-3 text-gray-400" />
                        {d.respondentName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{d.type || d.disputeType || 'Dispute'} · Filed {fmt(d.filedAt)}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
