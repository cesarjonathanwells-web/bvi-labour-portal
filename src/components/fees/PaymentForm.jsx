import { useState, useRef } from 'react';
import {
  CreditCard, Building2, Banknote, Upload, CheckCircle, AlertCircle,
  ChevronDown, FileText, User, Receipt as ReceiptIcon,
} from 'lucide-react';
import { formatCurrency } from '../../utils/feeCalculator';
import { fileToBase64, generateId } from '../../utils/helpers';
import { DEPARTMENT_INFO } from '../../data/constants';
import Receipt from './Receipt';

const PAYMENT_METHODS = [
  {
    id: 'cash',
    label: 'Cash at Cashier',
    icon: Banknote,
    description: `Visit the cashier at ${DEPARTMENT_INFO.address} during cashier hours (${DEPARTMENT_INFO.cashierHours}).`,
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer',
    icon: Building2,
    description: 'Transfer to the department bank account and upload proof of payment.',
  },
  {
    id: 'online',
    label: 'Online Payment',
    icon: CreditCard,
    description: 'Pay securely online via credit or debit card.',
  },
];

const BANK_DETAILS = {
  bank: 'Banco Popular de Puerto Rico',
  accountName: 'BVI Government - Department of Labour',
  accountNumber: '042-001-XXXXXX',
  routingNumber: 'XXXXXXX',
  swift: 'BPPRPRSX',
  reference: 'Include your permit application number as reference.',
};

export default function PaymentForm({
  permitType = 'New Work Permit',
  employeeName = '',
  feeAmount = 0,
  applicationFee = 50,
  onPaymentSubmit,
}) {
  const receiptInputRef = useRef(null);

  const [method, setMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [errors, setErrors] = useState([]);

  const totalAmount = feeAmount + applicationFee;

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors(['Receipt file must be under 5 MB.']);
      return;
    }
    setReceiptFile(file);
    const base64 = await fileToBase64(file);
    setReceiptPreview(base64);
    setErrors([]);
  };

  const validate = () => {
    const errs = [];
    if (!method) errs.push('Please select a payment method.');
    if (method === 'bank_transfer' && !referenceNumber.trim())
      errs.push('Please enter the bank transfer reference number.');
    if (method === 'bank_transfer' && !receiptFile)
      errs.push('Please upload proof of payment.');
    if (!confirmed)
      errs.push('Please confirm the payment details are correct.');
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (errs.length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setErrors([]);

    // Simulate processing
    await new Promise((r) => setTimeout(r, 1500));

    const payment = {
      id: generateId(),
      receiptNumber: `RCT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toISOString(),
      method,
      referenceNumber: referenceNumber || null,
      permitType,
      employeeName,
      permitFee: feeAmount,
      applicationFee,
      totalAmount,
      status: method === 'cash' ? 'pending_verification' : 'processing',
    };

    setPaymentData(payment);
    setSubmitted(true);
    setSubmitting(false);
    onPaymentSubmit?.(payment);
  };

  // Show receipt confirmation after submission
  if (submitted && paymentData) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-green-800 mb-1">
            Payment {method === 'cash' ? 'Registered' : 'Submitted'}
          </h3>
          <p className="text-sm text-green-700">
            {method === 'cash'
              ? 'Please proceed to the cashier to complete your payment.'
              : 'Your payment is being processed. You will receive confirmation shortly.'}
          </p>
          <p className="text-xs text-green-600 mt-2">
            Receipt Number: <span className="font-bold">{paymentData.receiptNumber}</span>
          </p>
        </div>

        <Receipt data={paymentData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <ReceiptIcon className="w-4 h-4" />
          Order Summary
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Permit Type</span>
            <span className="font-medium text-gray-800">{permitType}</span>
          </div>
          {employeeName && (
            <div className="flex justify-between">
              <span className="text-gray-500">Employee</span>
              <span className="font-medium text-gray-800 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {employeeName}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Permit Fee</span>
            <span className="font-medium">{formatCurrency(feeAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Application Fee</span>
            <span className="font-medium">{formatCurrency(applicationFee)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-300 text-base">
            <span className="font-bold text-gray-800">Total Amount</span>
            <span className="font-bold text-[#003366]">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <label className="label-field">Payment Method</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PAYMENT_METHODS.map((pm) => {
            const Icon = pm.icon;
            const selected = method === pm.id;
            return (
              <button
                key={pm.id}
                type="button"
                onClick={() => {
                  setMethod(pm.id);
                  setErrors([]);
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                  selected
                    ? 'border-[#003366] bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-[#c5a55a] hover:bg-gray-50'
                }`}
              >
                <Icon
                  className={`w-8 h-8 ${
                    selected ? 'text-[#003366]' : 'text-gray-400'
                  }`}
                />
                <span
                  className={`text-sm font-semibold ${
                    selected ? 'text-[#003366]' : 'text-gray-700'
                  }`}
                >
                  {pm.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Method-specific content */}
      {method && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-sm text-gray-700">
            {PAYMENT_METHODS.find((m) => m.id === method)?.description}
          </p>
        </div>
      )}

      {/* Bank Transfer Details */}
      {method === 'bank_transfer' && (
        <div className="card border-[#003366]/20 space-y-4">
          <h4 className="text-sm font-bold text-[#003366] flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Department Bank Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {Object.entries(BANK_DETAILS).map(([key, val]) => (
              <div key={key}>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="font-medium text-gray-800">{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reference Number */}
      {(method === 'bank_transfer' || method === 'online') && (
        <div>
          <label className="label-field">
            Payment Reference / Receipt Number
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Enter reference number..."
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
          />
        </div>
      )}

      {/* Upload Receipt */}
      {method === 'bank_transfer' && (
        <div>
          <label className="label-field">Upload Payment Receipt</label>
          {receiptPreview ? (
            <div className="flex items-center gap-3 bg-green-50 rounded-lg p-3 border border-green-200">
              {receiptFile?.type.startsWith('image/') ? (
                <img
                  src={receiptPreview}
                  alt=""
                  className="w-12 h-12 rounded object-cover border"
                />
              ) : (
                <FileText className="w-8 h-8 text-green-600" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {receiptFile?.name}
                </p>
                <p className="text-xs text-green-600">Uploaded successfully</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReceiptFile(null);
                  setReceiptPreview(null);
                }}
                className="text-sm text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => receiptInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#c5a55a] hover:bg-gray-50 transition-all"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Click to upload payment receipt
              </p>
              <p className="text-xs text-gray-400">PDF, JPG, PNG (max 5 MB)</p>
            </button>
          )}
          <input
            ref={receiptInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleReceiptUpload}
          />
        </div>
      )}

      {/* Confirmation Checkbox */}
      {method && (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300 text-[#003366] focus:ring-[#003366]"
          />
          <span className="text-sm text-gray-700">
            I confirm that the payment details above are correct and I authorize
            a payment of{' '}
            <span className="font-bold text-[#003366]">
              {formatCurrency(totalAmount)}
            </span>{' '}
            for the work permit application.
          </span>
        </label>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-1">
          {errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {err}
            </div>
          ))}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !method}
        className="btn-primary w-full justify-center text-base py-3"
      >
        {submitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Submit Payment
          </>
        )}
      </button>
    </div>
  );
}
