import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { formatDateShort, getStatusColor, getStatusLabel, daysUntilExpiry } from '../utils/helpers';
import {
  FileText, ChevronDown, Clock, CheckCircle2, XCircle, AlertCircle,
  CreditCard, FolderOpen, MessageSquare, Calendar, Building2, MapPin,
  DollarSign, Briefcase,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PERMIT_TYPES } from '../data/constants';

function StatusIcon({ status }) {
  if (status === 'approved') return <CheckCircle2 className="w-5 h-5 text-green-600" />;
  if (status === 'rejected') return <XCircle className="w-5 h-5 text-red-600" />;
  if (['submitted', 'under_review', 'pending_payment'].includes(status)) return <Clock className="w-5 h-5 text-amber-600" />;
  return <AlertCircle className="w-5 h-5 text-gray-400" />;
}

function PermitCard({ permit, initiallyExpanded, card }) {
  const [expanded, setExpanded] = useState(Boolean(initiallyExpanded));
  const typeInfo = PERMIT_TYPES[(permit.type || 'new').toUpperCase()] || PERMIT_TYPES.NEW;
  const days = permit.expiryDate ? daysUntilExpiry(permit.expiryDate) : null;
  const expiring = days !== null && days <= 30 && days >= 0;
  const expired = days !== null && days < 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full px-5 py-4 flex items-start justify-between gap-3 hover:bg-gray-50 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5"><StatusIcon status={permit.status} /></div>
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="font-bold text-[#006633]">{permit.permitNumber}</span>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(permit.status)}`}>
                {getStatusLabel(permit.status)}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400">{typeInfo.label}</span>
              {expiring && (
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                  Expires in {days} day{days === 1 ? '' : 's'}
                </span>
              )}
              {expired && (
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800">
                  Expired
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700">{permit.position || '—'} · {permit.employerName || '—'}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Submitted {formatDateShort(permit.submittedAt)}
              {permit.updatedAt && permit.updatedAt !== permit.submittedAt ? ` · updated ${formatDateShort(permit.updatedAt)}` : ''}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-5 bg-gray-50">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-5">
            <div><p className="text-gray-400 text-xs uppercase mb-0.5">Position</p><p className="font-medium">{permit.position || '—'}</p></div>
            <div><p className="text-gray-400 text-xs uppercase mb-0.5">Employer</p><p className="font-medium">{permit.employerName || '—'}</p></div>
            <div><p className="text-gray-400 text-xs uppercase mb-0.5">Island</p><p className="font-medium flex items-center gap-1"><MapPin size={12} className="text-gray-400" />{permit.island || '—'}</p></div>
            <div><p className="text-gray-400 text-xs uppercase mb-0.5">Annual salary</p><p className="font-medium flex items-center gap-1"><DollarSign size={12} className="text-gray-400" />{permit.salary ? Number(permit.salary).toLocaleString() : '—'}</p></div>
            <div><p className="text-gray-400 text-xs uppercase mb-0.5">Issued</p><p className="font-medium">{permit.issuedDate ? formatDateShort(permit.issuedDate) : '—'}</p></div>
            <div><p className="text-gray-400 text-xs uppercase mb-0.5">Expires</p><p className="font-medium">{permit.expiryDate ? formatDateShort(permit.expiryDate) : '—'}</p></div>
          </div>

          {permit.notes && (
            <div className="mb-5 p-3 rounded-lg bg-white border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <MessageSquare size={12} /> Latest Department note
              </p>
              <p className="text-sm text-gray-700">{permit.notes}</p>
            </div>
          )}

          {/* Processing notes */}
          {permit.processingNotes && permit.processingNotes.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <MessageSquare size={12} /> Processing timeline
              </p>
              <ul className="space-y-2">
                {permit.processingNotes.map((n, i) => (
                  <li key={i} className="p-3 rounded-lg bg-white border border-gray-100 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-700">{n.author}</span>
                      <span className="text-[10px] text-gray-400">{n.authorRole} · {formatDateShort(n.date)}</span>
                    </div>
                    <p className="text-gray-600">{n.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related records */}
          <div className="flex flex-wrap gap-2">
            {permit.status === 'approved' && (
              <>
                <Link to="/worker/id-card" className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#006633] text-[#006633] rounded-lg text-xs font-semibold hover:bg-green-50">
                  <CreditCard size={12} /> View digital ID card
                </Link>
                <Link to="/worker/cards" className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50">
                  <CreditCard size={12} /> Physical card lifecycle
                </Link>
              </>
            )}
            <Link to="/worker/documents" className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50">
              <FolderOpen size={12} /> Documents on file
            </Link>
            {card && (
              <Link to="/worker/cards" className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#006633] text-white rounded-lg text-xs font-semibold hover:bg-[#005522]">
                <Calendar size={12} /> Card lifecycle
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyPermitsPage() {
  const { user } = useAuth();
  const { permits, cards } = useApp();

  const myPermits = useMemo(() => {
    return permits
      .filter(p => p.userId === user?.id || p.employerId === user?.id)
      .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
  }, [permits, user]);

  const groups = useMemo(() => ({
    active:   myPermits.filter(p => p.status === 'approved'),
    pending:  myPermits.filter(p => ['submitted', 'under_review', 'pending_payment'].includes(p.status)),
    archived: myPermits.filter(p => ['rejected', 'expired', 'cancelled'].includes(p.status)),
  }), [myPermits]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#006633]">My Permits</h1>
        <p className="text-gray-500 mt-1">
          Every work permit on file for your account: status, Department notes, and quick links to the digital and physical ID cards.
        </p>
      </div>

      {myPermits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">You have no permits on file yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.active.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 size={14} /> Active ({groups.active.length})
              </h2>
              <div className="space-y-3">
                {groups.active.map(p => (
                  <PermitCard
                    key={p.id}
                    permit={p}
                    initiallyExpanded={groups.active.length === 1}
                    card={cards.find(c => c.permitId === p.id)}
                  />
                ))}
              </div>
            </section>
          )}
          {groups.pending.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock size={14} /> Pending ({groups.pending.length})
              </h2>
              <div className="space-y-3">
                {groups.pending.map(p => <PermitCard key={p.id} permit={p} />)}
              </div>
            </section>
          )}
          {groups.archived.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Briefcase size={14} /> Archived ({groups.archived.length})
              </h2>
              <div className="space-y-3">
                {groups.archived.map(p => <PermitCard key={p.id} permit={p} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
