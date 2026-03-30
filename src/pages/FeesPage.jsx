import { useState } from 'react';
import { Calculator, CreditCard, Receipt } from 'lucide-react';
import FeeCalculator from '../components/fees/FeeCalculator';
import PaymentForm from '../components/fees/PaymentForm';
import ReceiptComponent from '../components/fees/Receipt';

const TABS = [
  { id: 'calculator', label: 'Fee Calculator', icon: Calculator },
  { id: 'payment', label: 'Make Payment', icon: CreditCard },
  { id: 'receipts', label: 'Payment History', icon: Receipt },
];

export default function FeesPage() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [payments, setPayments] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const handlePaymentSubmit = (payment) => {
    setPayments((prev) => [payment, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="page-title flex items-center gap-3">
            <Calculator className="w-8 h-8" />
            Fees & Payments
          </h1>
          <p className="text-gray-500 -mt-4">
            Calculate work permit fees, make payments, and view your payment history.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                setSelectedReceipt(null);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === id
                  ? 'bg-white shadow text-[#003366]'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="card">
          {activeTab === 'calculator' && (
            <div>
              <h2 className="section-title">Work Permit Fee Calculator</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter the employee's annual salary to calculate the applicable work
                permit fee. The calculator uses the tiered fee structure established
                by the BVI Department of Labour.
              </p>
              <FeeCalculator />
            </div>
          )}

          {activeTab === 'payment' && (
            <div>
              <h2 className="section-title">Submit Payment</h2>
              <p className="text-sm text-gray-500 mb-6">
                Complete your work permit fee payment using one of the available
                methods below.
              </p>
              <PaymentForm
                permitType="New Work Permit"
                employeeName="Employee Name"
                feeAmount={750}
                applicationFee={50}
                onPaymentSubmit={handlePaymentSubmit}
              />
            </div>
          )}

          {activeTab === 'receipts' && (
            <div>
              {selectedReceipt ? (
                <div>
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="text-sm text-[#003366] hover:underline mb-4 inline-flex items-center gap-1"
                  >
                    &larr; Back to Payment History
                  </button>
                  <ReceiptComponent data={selectedReceipt} />
                </div>
              ) : (
                <>
                  <h2 className="section-title">Payment History</h2>
                  {payments.length === 0 ? (
                    <div className="text-center py-16">
                      <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-gray-500">
                        No payments yet
                      </p>
                      <p className="text-sm text-gray-400">
                        Your payment receipts will appear here after you make a
                        payment.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payments.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedReceipt(p)}
                          className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md hover:border-[#c5a55a] transition-all text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#003366]/10 flex items-center justify-center shrink-0">
                            <Receipt className="w-5 h-5 text-[#003366]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">
                              {p.receiptNumber}
                            </p>
                            <p className="text-xs text-gray-500">
                              {p.permitType} &middot;{' '}
                              {new Date(p.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-[#003366]">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                            }).format(p.totalAmount)}
                          </span>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              p.status === 'processing'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {p.status?.replace(/_/g, ' ').replace(/\b\w/g, (l) =>
                              l.toUpperCase()
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
