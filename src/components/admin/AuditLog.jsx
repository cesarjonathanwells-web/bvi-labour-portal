import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAuditLog } from '../../utils/auditLog';
import { ShieldAlert, Filter, Clock, User, Download, Info } from 'lucide-react';
import MockBadge from '../common/MockBadge';

const CATEGORIES = [
  { key: 'all', label: 'All categories' },
  { key: 'permit', label: 'Permits' },
  { key: 'dispute', label: 'Disputes' },
  { key: 'job', label: 'Jobs' },
  { key: 'user', label: 'Users' },
  { key: 'system', label: 'System' },
];

function fmt(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch { return ts; }
}

function AccessDenied() {
  return (
    <div className="max-w-lg mx-auto mt-20 text-center">
      <div className="w-20 h-20 mx-auto mb-6 bg-purple-50 rounded-full flex items-center justify-center">
        <ShieldAlert className="w-10 h-10 text-[#7c3aed]" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-500">Audit log is restricted to the Commissioner and Deputy Commissioner.</p>
    </div>
  );
}

export default function AuditLog() {
  const { user } = useAuth();
  const [category, setCategory] = useState('all');
  const [actorFilter, setActorFilter] = useState('');
  const [search, setSearch] = useState('');

  const entries = useMemo(() => getAuditLog({ limit: 500 }), []);

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (category !== 'all' && e.category !== category) return false;
      if (actorFilter && !(e.actorName || '').toLowerCase().includes(actorFilter.toLowerCase())) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${e.action} ${e.targetLabel || ''} ${e.actorName || ''} ${e.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, category, actorFilter, search]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bvi-audit-log-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (!user || !['commissioner', 'deputy_commissioner'].includes(user.deptRole)) {
    return <AccessDenied />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-[#7c3aed]">Audit Log</h1>
          <p className="text-gray-500">
            Every permit, dispute, and job action performed in this session.
            <MockBadge variant="phase2" label="Phase 2: server-side log" className="ml-2" title="Prototype logs events to browser localStorage. Phase 2 persists an immutable server-side log exportable for the Auditor General." />
          </p>
        </div>
        <button
          type="button"
          onClick={exportJson}
          className="inline-flex items-center gap-2 px-3 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-semibold hover:bg-[#6d28d9] transition-colors"
        >
          <Download size={14} /> Export JSON
        </button>
      </div>

      <div className="mt-6 mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-2 text-sm text-[#003366]">
        <Info size={16} className="flex-shrink-0 mt-0.5" />
        <p>
          This log is stored in your browser&apos;s localStorage and resets when the Commissioner clicks &quot;Reset demo data&quot;.
          Phase 2 replaces it with a server-side append-only log with retention, export, and integrity checks.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search action, target, actor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field text-sm"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input-field text-sm sm:w-48"
          aria-label="Filter by category"
        >
          {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <input
          type="text"
          placeholder="Actor name..."
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value)}
          className="input-field text-sm sm:w-48"
        />
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of {entries.length} entries
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Filter className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {entries.length === 0
              ? 'No actions recorded yet. Perform a permit action to generate an entry.'
              : 'No entries match the current filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">When</th>
                  <th className="px-4 py-3 text-left font-semibold">Actor</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                  <th className="px-4 py-3 text-left font-semibold">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} className="text-gray-400" />
                        {fmt(e.timestamp)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-gray-700">
                        <User size={12} className="text-gray-400" />
                        {e.actorName}
                      </span>
                      {e.actorRole && (
                        <span className="block text-[10px] text-gray-400 mt-0.5">{e.actorRole}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-purple-50 text-[#7c3aed]">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{e.action}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {e.targetLabel || <span className="text-gray-300">—</span>}
                      {e.targetType && (
                        <span className="block text-[10px] text-gray-400 mt-0.5">{e.targetType}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
