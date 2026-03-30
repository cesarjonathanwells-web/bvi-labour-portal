import { useRef } from 'react';
import { Printer, FileText } from 'lucide-react';
import { formatCurrency } from '../../utils/feeCalculator';
import { formatDate } from '../../utils/helpers';
import { DEPARTMENT_INFO } from '../../data/constants';

export default function Receipt({ data }) {
  const receiptRef = useRef(null);

  if (!data) return null;

  const {
    receiptNumber,
    date,
    method,
    referenceNumber,
    permitType,
    employeeName,
    permitFee,
    applicationFee,
    totalAmount,
  } = data;

  const methodLabels = {
    cash: 'Cash at Cashier',
    bank_transfer: 'Bank Transfer',
    online: 'Online Payment',
  };

  const handlePrint = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
      <head>
        <title>Receipt ${receiptNumber}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Georgia', serif; padding: 40px; color: #222; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 3px double #003366; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { color: #003366; font-size: 18px; margin-bottom: 2px; }
          .header h2 { color: #003366; font-size: 13px; font-weight: normal; }
          .header .gov { font-size: 14px; color: #666; margin-top: 4px; }
          .receipt-title { text-align: center; font-size: 20px; font-weight: bold; color: #003366; margin: 16px 0; letter-spacing: 2px; text-transform: uppercase; }
          .info-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
          .info-row .label { color: #666; }
          .info-row .value { font-weight: bold; }
          .divider { border-top: 1px solid #ccc; margin: 16px 0; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 16px; font-weight: bold; color: #003366; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; }
          .signature { margin-top: 60px; display: flex; justify-content: space-between; }
          .sig-line { width: 200px; border-top: 1px solid #333; padding-top: 4px; font-size: 11px; color: #666; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        ${receiptRef.current.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4">
      {/* Printable receipt content */}
      <div
        ref={receiptRef}
        className="bg-white rounded-xl border-2 border-gray-200 p-8 max-w-lg mx-auto"
      >
        {/* BVI Government Header */}
        <div className="text-center border-b-4 border-double border-[#003366] pb-5 mb-5">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
            Government of the Virgin Islands
          </p>
          <h2 className="text-lg font-bold text-[#003366]">
            {DEPARTMENT_INFO.name}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {DEPARTMENT_INFO.ministry}
          </p>
          <p className="text-xs text-gray-400 mt-1">{DEPARTMENT_INFO.address}</p>
          <p className="text-xs text-gray-400">
            Tel: {DEPARTMENT_INFO.phone} | Fax: {DEPARTMENT_INFO.fax}
          </p>
        </div>

        {/* Receipt Title */}
        <h3 className="text-center text-xl font-bold text-[#003366] tracking-wider uppercase mb-5">
          Official Receipt
        </h3>

        {/* Receipt Info */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Receipt No.</span>
            <span className="font-bold text-gray-800">{receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span className="font-medium text-gray-800">{formatDate(date)}</span>
          </div>
        </div>

        <hr className="my-4 border-gray-200" />

        {/* Payer Details */}
        <div className="space-y-2 text-sm">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Payer Details
          </h4>
          {employeeName && (
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-gray-800">{employeeName}</span>
            </div>
          )}
        </div>

        <hr className="my-4 border-gray-200" />

        {/* Description */}
        <div className="space-y-2 text-sm">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Description of Service
          </h4>
          <div className="flex justify-between">
            <span className="text-gray-500">Service</span>
            <span className="font-medium text-gray-800">{permitType}</span>
          </div>
        </div>

        <hr className="my-4 border-gray-200" />

        {/* Amount Breakdown */}
        <div className="space-y-2 text-sm">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Amount
          </h4>
          <div className="flex justify-between">
            <span className="text-gray-500">Permit Fee</span>
            <span className="font-medium">{formatCurrency(permitFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Application Fee</span>
            <span className="font-medium">{formatCurrency(applicationFee)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-300 text-base font-bold">
            <span className="text-gray-800">Total Paid</span>
            <span className="text-[#003366]">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <hr className="my-4 border-gray-200" />

        {/* Payment Method */}
        <div className="space-y-2 text-sm">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Payment Method
          </h4>
          <div className="flex justify-between">
            <span className="text-gray-500">Method</span>
            <span className="font-medium text-gray-800">
              {methodLabels[method] || method}
            </span>
          </div>
          {referenceNumber && (
            <div className="flex justify-between">
              <span className="text-gray-500">Reference</span>
              <span className="font-medium text-gray-800">{referenceNumber}</span>
            </div>
          )}
        </div>

        {/* Signature Line */}
        <div className="mt-12 flex justify-between">
          <div className="text-center">
            <div className="w-44 border-t border-gray-400 pt-1">
              <p className="text-xs text-gray-500">Cashier Signature</p>
            </div>
          </div>
          <div className="text-center">
            <div className="w-44 border-t border-gray-400 pt-1">
              <p className="text-xs text-gray-500">Date / Stamp</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            This receipt is issued by the {DEPARTMENT_INFO.name}.
          </p>
          <p className="text-xs text-gray-400">
            Please retain this receipt for your records.
          </p>
        </div>
      </div>

      {/* Print Button */}
      <div className="flex justify-center">
        <button onClick={handlePrint} className="btn-primary">
          <Printer className="w-4 h-4" />
          Print Receipt
        </button>
      </div>
    </div>
  );
}
