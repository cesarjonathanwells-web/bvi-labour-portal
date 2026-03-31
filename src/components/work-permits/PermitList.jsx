import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  MoreHorizontal,
  Download,
  ArrowUpDown,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getPortalBasePath } from '../../utils/helpers';
import { PERMIT_STATUSES } from '../../data/constants';
import { formatDate, getStatusColor, getStatusLabel } from '../../utils/helpers';
import { formatCurrency } from '../../utils/feeCalculator';

const SORTABLE_FIELDS = [
  { key: 'permitNumber', label: 'Permit #' },
  { key: 'employee.fullName', label: 'Employee' },
  { key: 'employer.companyName', label: 'Employer' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'submittedAt', label: 'Submitted' },
];

function getNestedValue(obj, path) {
  return path.split('.').reduce((curr, key) => curr?.[key], obj) || '';
}

export default function PermitList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { permits, updatePermitStatus } = useApp();
  const portalBase = getPortalBasePath(user?.portal);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState('submittedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);
  const [bulkAction, setBulkAction] = useState('');

  const filtered = useMemo(() => {
    let result = [...permits];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.permitNumber?.toLowerCase().includes(q) ||
          p.employee?.fullName?.toLowerCase().includes(q) ||
          p.employer?.companyName?.toLowerCase().includes(q)
      );
    }
    if (statusFilter) result = result.filter((p) => p.status === statusFilter);
    if (typeFilter) result = result.filter((p) => p.type === typeFilter);
    if (dateFrom) result = result.filter((p) => p.submittedAt >= dateFrom);
    if (dateTo) result = result.filter((p) => p.submittedAt <= dateTo + 'T23:59:59');

    result.sort((a, b) => {
      const aVal = getNestedValue(a, sortField) || '';
      const bVal = getNestedValue(b, sortField) || '';
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [permits, searchQuery, statusFilter, typeFilter, dateFrom, dateTo, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((p) => p.id)));
  };

  const handleBulkAction = () => {
    if (!bulkAction || selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to set ${selectedIds.size} permit(s) to "${getStatusLabel(bulkAction)}"?`)) return;
    selectedIds.forEach((id) => updatePermitStatus(id, bulkAction));
    setSelectedIds(new Set());
    setBulkAction('');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setTypeFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = statusFilter || typeFilter || dateFrom || dateTo;
  const permitTypes = [...new Set(permits.map((p) => p.type).filter(Boolean))];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title mb-0">All Permits</h1>
          <p className="text-gray-600 text-sm mt-1">{filtered.length} permit{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      {/* Search and filter bar */}
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-field pl-9 text-sm"
              placeholder="Search by name, permit #, or employer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`btn-outline text-sm ${showFilters ? 'bg-blue-50' : ''}`}>
            <Filter size={14} /> Filters {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-red-500" />}
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1">
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
              <select className="input-field text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                {Object.values(PERMIT_STATUSES).map((s) => (
                  <option key={s} value={s}>{getStatusLabel(s)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
              <select className="input-field text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                {permitTypes.map((t) => (
                  <option key={t} value={t}>{t.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">From Date</label>
              <input type="date" className="input-field text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">To Date</label>
              <input type="date" className="input-field text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-[#003366]">{selectedIds.size} selected</span>
          <select className="input-field text-sm w-auto py-1.5" value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}>
            <option value="">Bulk action...</option>
            <option value="under_review">Set Under Review</option>
            <option value="pending_payment">Set Pending Payment</option>
            <option value="approved">Approve</option>
            <option value="rejected">Reject</option>
            <option value="cancelled">Cancel</option>
          </select>
          <button onClick={handleBulkAction} disabled={!bulkAction} className="btn-primary text-xs py-1.5 px-3">
            Apply
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-sm text-gray-500 hover:text-gray-700">
            Deselect all
          </button>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Search size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No permits found</h3>
          <p className="text-gray-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  {SORTABLE_FIELDS.map((f) => (
                    <th key={f.key} className="px-4 py-3 text-left">
                      <button onClick={() => toggleSort(f.key)} className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-[#003366]">
                        {f.label}
                        {sortField === f.key ? (
                          sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        ) : (
                          <ArrowUpDown size={12} className="text-gray-300" />
                        )}
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left"><span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Fee</span></th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((permit) => (
                  <tr
                    key={permit.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedIds.has(permit.id) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(permit.id)}
                        onChange={() => toggleSelect(permit.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-[#003366]">{permit.permitNumber || '-'}</td>
                    <td className="px-4 py-3">{permit.employee?.fullName || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{permit.employer?.companyName || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-gray-700">{permit.type?.replace(/-/g, ' ') || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(permit.status)}`}>
                        {getStatusLabel(permit.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(permit.submittedAt)}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {permit.fee ? formatCurrency(permit.fee.total) : '-'}
                    </td>
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() => setActionMenu(actionMenu === permit.id ? null : permit.id)}
                        className="p-1 rounded hover:bg-gray-200"
                      >
                        <MoreHorizontal size={16} className="text-gray-500" />
                      </button>
                      {actionMenu === permit.id && (
                        <div className="absolute right-4 top-10 z-20 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px]">
                          <button
                            onClick={() => { navigate(`${portalBase}/permits/status`); setActionMenu(null); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Eye size={14} /> View Details
                          </button>
                          {permit.status === 'submitted' && (
                            <button
                              onClick={() => { updatePermitStatus(permit.id, 'under_review'); setActionMenu(null); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Clock size={14} /> Mark Under Review
                            </button>
                          )}
                          {permit.status === 'under_review' && (
                            <button
                              onClick={() => { updatePermitStatus(permit.id, 'pending_payment'); setActionMenu(null); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <AlertCircle size={14} /> Pending Payment
                            </button>
                          )}
                          {(permit.status === 'pending_payment' || permit.status === 'under_review') && (
                            <button
                              onClick={() => { updatePermitStatus(permit.id, 'approved', 'Approved by admin.'); setActionMenu(null); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-green-700"
                            >
                              <CheckCircle2 size={14} /> Approve
                            </button>
                          )}
                          {permit.status !== 'rejected' && permit.status !== 'approved' && permit.status !== 'cancelled' && (
                            <button
                              onClick={() => { updatePermitStatus(permit.id, 'rejected', 'Rejected by admin.'); setActionMenu(null); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filtered.length} of {permits.length} permits</span>
          </div>
        </div>
      )}
    </div>
  );
}
