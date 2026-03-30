import { useState, useMemo, useCallback } from 'react';
import {
  DollarSign, Search, Check, XCircle, Receipt, ShieldAlert, Filter,
  CreditCard, Banknote, Clock, FileText, Printer, Eye, ArrowLeft, X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatDateShort, generateId, getStorage, setStorage } from '../../utils/helpers';

const PAYMENTS_KEY = 'bvi_payments';
const RECEIPTS_KEY = 'bvi_receipts';

const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Cheque', 'Credit Card', 'Debit Card'];

/* ------------------------------------------------------------------ */
/*  Access Denied                                                      */
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
        Payment Processing is restricted to staff with payment permissions.
      </p>
    </div>
  );
}

export default function PaymentProcessing() {
  const { permits, updatePermitStatus } = useApp();
  const { user, getAllUsers, hasPermission } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [verifyNotes, setVerifyNotes] = useState('');

  /* ---------- Permission gate ---------- */
  if (!user || !hasPermission('payments')) {
    return <AccessDenied />;
  }

  const allUsers = getAllUsers();
  const payments = getStorage(PAYMENTS_KEY) || [];
  const receipts = getStorage(RECEIPTS_KEY) || [];

  // Permits pending payment form the queue
  const pendingPermits = useMemo(() => {
    return permits.filter(p => p.status === 'pending_payment');
  }, [permits]);

  // Build combined payment items (permits pending payment + explicit payment records)
  const paymentQueue = useMemo(() => {
    // Build items from permits that are pending_payment
    const fromPermits = pendingPermits.map(p => {
      const existingPayment = payments.find(pay => pay.permitId === p.id);
      return {
        id: existingPayment?.id || `permit-${p.id}`,
        permitId: p.id,
        permitNumber: p.permitNumber,
        applicantName: `${p.employeeFirstName || p.firstName || ''} ${p.employeeLastName || p.lastName || ''}`.trim(),
        employer: p.employerName || p.employer || '-',
        feeAmount: parseFloat(p.totalFee || p.fee || 0),
        paymentMethod: existingPayment?.paymentMethod || '',
        receiptUpload: existingPayment?.receiptUpload || null,
        status: existingPayment?.status || 'pending',
        submittedAt: p.submittedAt,
        verifiedAt: existingPayment?.verifiedAt || null,
        verifiedBy: existingPayment?.verifiedBy || null,
        receiptNumber: existingPayment?.receiptNumber || null,
      };
    });
    return fromPermits;
  }, [pendingPermits, payments]);

  // Filter
  const filtered = useMemo(() => {
    let list = paymentQueue;
    if (statusFilter === 'pending') list = list.filter(p => p.status === 'pending');
    if (statusFilter === 'verified') list = list.filter(p => p.status === 'verified');
    if (statusFilter === 'rejected') list = list.filter(p => p.status === 'rejected');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.permitNumber || '').toLowerCase().includes(q) ||
        (p.applicantName || '').toLowerCase().includes(q) ||
        (p.employer || '').toLowerCase().includes(q) ||
        (p.receiptNumber || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [paymentQueue, statusFilter, search]);

  /* Daily summary */
  const dailySummary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayPayments = payments.filter(p => p.status === 'verified' && p.verifiedAt && p.verifiedAt.slice(0, 10) === today);
    const total = todayPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const byMethod = {};
    todayPayments.forEach(p => {
      const m = p.paymentMethod || 'Unknown';
      byMethod[m] = (byMethod[m] || 0) + (parseFloat(p.amount) || 0);
    });
    return { count: todayPayments.length, total, byMethod };
  }, [payments]);

  /* Verify payment */
  const handleVerify = (item) => {
    const receiptNum = `RCP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const allPayments = getStorage(PAYMENTS_KEY) || [];
    const existing = allPayments.findIndex(p => p.permitId === item.permitId);
    const paymentRecord = {
      id: existing >= 0 ? allPayments[existing].id : generateId(),
      permitId: item.permitId,
      permitNumber: item.permitNumber,
      amount: item.feeAmount,
      paymentMethod: item.paymentMethod || 'Cash',
      status: 'verified',
      verifiedAt: new Date().toISOString(),
      verifiedBy: `${user.firstName} ${user.lastName}`,
      receiptNumber: receiptNum,
      notes: verifyNotes.trim(),
    };

    if (existing >= 0) {
      allPayments[existing] = paymentRecord;
    } else {
      allPayments.push(paymentRecord);
    }
    setStorage(PAYMENTS_KEY, allPayments);

    // Also store receipt
    const allReceipts = getStorage(RECEIPTS_KEY) || [];
    allReceipts.push({
      id: generateId(),
      receiptNumber: receiptNum,
      permitNumber: item.permitNumber,
      applicantName: item.applicantName,
      employer: item.employer,
      amount: item.feeAmount,
      method: item.paymentMethod || 'Cash',
      issuedAt: new Date().toISOString(),
      issuedBy: `${user.firstName} ${user.lastName}`,
    });
    setStorage(RECEIPTS_KEY, allReceipts);

    // Update permit status to approved
    updatePermitStatus(item.permitId, 'approved', `Payment verified. Receipt: ${receiptNum}. Verified by ${user.firstName} ${user.lastName}.`);

    setSelectedPayment(null);
    setVerifyNotes('');
  };

  /* Reject payment */
  const handleReject = (item) => {
    const allPayments = getStorage(PAYMENTS_KEY) || [];
    const existing = allPayments.findIndex(p => p.permitId === item.permitId);
    const paymentRecord = {
      id: existing >= 0 ? allPayments[existing].id : generateId(),
      permitId: item.permitId,
      permitNumber: item.permitNumber,
      amount: item.feeAmount,
      paymentMethod: item.paymentMethod || '',
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: `${user.firstName} ${user.lastName}`,
      notes: verifyNotes.trim() || 'Payment rejected',
    };

    if (existing >= 0) {
      allPayments[existing] = paymentRecord;
    } else {
      allPayments.push(paymentRecord);
    }
    setStorage(PAYMENTS_KEY, allPayments);

    setSelectedPayment(null);
    setVerifyNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#7c3aed]">Payment Processing</h1>
        <p className="text-gray-500 mb-6">Verify payments, issue receipts, and manage fee collection.</p>
      </div>

      {/* Daily Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2.5 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${dailySummary.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-gray-500">Collected Today</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 p-2.5 rounded-lg">
              <Receipt className="w-5 h-5 text-[#7c3aed]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{dailySummary.count}</p>
              <p className="text-xs text-gray-500">Receipts Issued Today</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 p-2.5 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{paymentQueue.filter(p => p.status === 'pending').length}</p>
              <p className="text-xs text-gray-500">Pending Verifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily breakdown by method */}
      {Object.keys(dailySummary.byMethod).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
          <h3 className="text-sm font-bold text-[#7c3aed] mb-3">Today by Payment Method</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(dailySummary.byMethod).map(([method, amount]) => (
              <div key={method} className="flex items-center gap-2 text-sm">
                <Banknote size={14} className="text-gray-400" />
                <span className="text-gray-600">{method}:</span>
                <span className="font-semibold text-gray-900">${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by receipt number, permit number, or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 text-sm"
            />
          </div>
          <div className="flex gap-2">
            {['pending', 'verified', 'rejected', 'all'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-[#7c3aed] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Queue */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <DollarSign className="w-14 h-14 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Payment Items</h3>
          <p className="text-gray-400">
            {statusFilter === 'pending' ? 'No payments pending verification.' : 'No items match your search.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Permit #</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Applicant</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Employer</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Method</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <span className="text-sm font-bold text-[#7c3aed]">{item.permitNumber}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-gray-900">{item.applicantName}</span>
                    </td>
                    <td className="px-6 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-600">{item.employer}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm font-semibold text-gray-900">
                        ${item.feeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-3 hidden sm:table-cell">
                      <span className="text-sm text-gray-600">{item.paymentMethod || '-'}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        item.status === 'verified' ? 'bg-green-100 text-green-700' :
                        item.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {item.status === 'verified' ? 'Verified' : item.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => setSelectedPayment(item)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-purple-50 hover:text-[#7c3aed]"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            Showing {filtered.length} payment item(s)
          </div>
        </div>
      )}

      {/* ============= Payment Detail Modal ============= */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPayment(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#7c3aed]">Payment Details</h3>
              <button onClick={() => setSelectedPayment(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs uppercase">Permit Number</p>
                  <p className="font-bold text-[#7c3aed]">{selectedPayment.permitNumber}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase">Fee Amount</p>
                  <p className="font-bold text-gray-900">${selectedPayment.feeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase">Applicant</p>
                  <p className="font-medium text-gray-800">{selectedPayment.applicantName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase">Employer</p>
                  <p className="font-medium text-gray-800">{selectedPayment.employer}</p>
                </div>
              </div>

              {selectedPayment.receiptNumber && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-600">Receipt Number</p>
                  <p className="text-lg font-bold text-green-700">{selectedPayment.receiptNumber}</p>
                </div>
              )}

              {selectedPayment.status === 'pending' && (
                <>
                  <div>
                    <label className="label-field text-xs">Payment Method</label>
                    <select
                      value={selectedPayment.paymentMethod}
                      onChange={(e) => setSelectedPayment(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="input-field text-sm"
                    >
                      <option value="">Select Method</option>
                      {PAYMENT_METHODS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label-field text-xs">Verification Notes</label>
                    <textarea
                      value={verifyNotes}
                      onChange={(e) => setVerifyNotes(e.target.value)}
                      placeholder="Optional notes about the payment..."
                      rows={3}
                      className="input-field text-sm resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVerify(selectedPayment)}
                      disabled={!selectedPayment.paymentMethod}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-40 transition-colors text-sm"
                    >
                      <Check size={16} /> Verify Payment
                    </button>
                    <button
                      onClick={() => handleReject(selectedPayment)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </>
              )}

              {selectedPayment.status === 'verified' && selectedPayment.receiptNumber && (
                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7c3aed] text-white rounded-lg font-medium hover:bg-[#6d28d9] transition-colors text-sm"
                >
                  <Printer size={16} /> Print Receipt
                </button>
              )}
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button onClick={() => setSelectedPayment(null)} className="btn-outline text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
