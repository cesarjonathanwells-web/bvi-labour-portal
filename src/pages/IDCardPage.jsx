import { useState, useMemo } from 'react';
import { CreditCard, ChevronRight, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { formatDateShort, getStatusColor, getStatusLabel, daysUntilExpiry } from '../utils/helpers';
import CardPreview from '../components/id-cards/CardPreview';

export default function IDCardPage() {
  const { user } = useAuth();
  const { permits, getPermitsByUser } = useApp();

  const [selectedPermit, setSelectedPermit] = useState(null);
  const [search, setSearch] = useState('');

  // Admin sees all approved permits, others see only theirs
  const availablePermits = useMemo(() => {
    const base = user?.role === 'admin' ? permits : getPermitsByUser(user?.id);
    return base.filter(p => p.status === 'approved');
  }, [user, permits, getPermitsByUser]);

  const filtered = useMemo(() => {
    if (!search.trim()) return availablePermits;
    const q = search.toLowerCase();
    return availablePermits.filter(p =>
      (p.permitNumber || '').toLowerCase().includes(q) ||
      (p.employeeName || '').toLowerCase().includes(q) ||
      (p.employeeFirstName || '').toLowerCase().includes(q) ||
      (p.employeeLastName || '').toLowerCase().includes(q) ||
      (p.employerName || '').toLowerCase().includes(q)
    );
  }, [availablePermits, search]);

  // If a permit is selected, show card preview
  if (selectedPermit) {
    return (
      <div>
        <button
          onClick={() => setSelectedPermit(null)}
          className="mb-4 text-sm text-[#003366] hover:text-[#c5a55a] font-medium flex items-center gap-1"
        >
          &larr; Back to Permit List
        </button>
        <CardPreview permit={selectedPermit} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-[#003366] rounded-lg">
            <CreditCard className="w-6 h-6 text-[#c5a55a]" />
          </div>
          <div>
            <h1 className="page-title mb-0">Work Permit ID Cards</h1>
            <p className="text-gray-500 text-sm">Generate and download official work permit cards for approved permits.</p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#003366] flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-700">
          <p className="font-semibold text-[#003366] mb-1">ID Card Generation</p>
          <p>Only <span className="font-medium">approved</span> permits are eligible for ID card generation. Select a permit below to preview and download the card.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by permit number, name, or employer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Permits list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard className="w-14 h-14 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {availablePermits.length === 0 ? 'No Approved Permits' : 'No Matches Found'}
          </h3>
          <p className="text-gray-400">
            {availablePermits.length === 0
              ? 'ID cards can only be generated for approved work permits.'
              : 'Try adjusting your search terms.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(permit => {
            const days = daysUntilExpiry(permit.expiryDate);
            const expiringSoon = days !== null && days <= 30 && days > 0;
            const expired = days !== null && days <= 0;

            return (
              <button
                key={permit.id}
                onClick={() => setSelectedPermit(permit)}
                className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-[#c5a55a] hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[#003366]">{permit.permitNumber}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(permit.status)}`}>
                        {getStatusLabel(permit.status)}
                      </span>
                      {expiringSoon && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700">
                          Expires in {days} days
                        </span>
                      )}
                      {expired && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
                          Expired
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 truncate">
                      {permit.employeeFirstName || permit.firstName}{' '}
                      {permit.employeeLastName || permit.lastName}
                      {permit.employerName ? ` - ${permit.employerName}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {permit.type?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Work Permit'}
                      {permit.expiryDate ? ` | Expires: ${formatDateShort(permit.expiryDate)}` : ''}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center gap-2 text-gray-400 group-hover:text-[#003366]">
                    <span className="text-xs font-medium hidden sm:block">View Card</span>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
