import { useRef } from 'react';
import { Printer, Download, QrCode, User } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { DEPARTMENT_INFO } from '../../data/constants';

function CardFront({ permit }) {
  const employeeName =
    permit.employee?.fullName ||
    `${permit.employee?.firstName || ''} ${permit.employee?.lastName || ''}`.trim() ||
    'N/A';

  return (
    <div className="w-[400px] h-[250px] rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-white relative">
      {/* Header */}
      <div className="bg-[#003366] text-white px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider opacity-80">
            British Virgin Islands
          </p>
          <p className="text-xs font-bold">{DEPARTMENT_INFO.shortName}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider opacity-80">
            Work Permit
          </p>
          <p className="text-xs font-bold">{permit.permitNumber || 'N/A'}</p>
        </div>
      </div>

      {/* Gold accent line */}
      <div className="h-1 bg-[#c5a55a]" />

      {/* Body */}
      <div className="px-5 py-3 flex gap-4">
        {/* Photo */}
        <div className="shrink-0">
          {permit.employee?.photo ? (
            <img
              src={permit.employee.photo}
              alt="Employee"
              className="w-[80px] h-[100px] object-cover rounded border border-gray-300"
            />
          ) : (
            <div className="w-[80px] h-[100px] bg-gray-100 rounded border border-gray-300 flex items-center justify-center">
              <User size={32} className="text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div>
            <p className="text-[10px] text-gray-500 uppercase">Full Name</p>
            <p className="text-sm font-bold text-gray-900 truncate">
              {employeeName}
            </p>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Nationality</p>
              <p className="text-xs font-medium text-gray-800">
                {permit.employee?.nationality || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Gender</p>
              <p className="text-xs font-medium text-gray-800">
                {permit.employee?.gender || 'N/A'}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase">Employer</p>
            <p className="text-xs font-medium text-gray-800 truncate">
              {permit.employer?.companyName || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase">Position</p>
            <p className="text-xs font-medium text-gray-800 truncate">
              {permit.position?.jobTitle || 'N/A'}
            </p>
          </div>
        </div>

        {/* QR placeholder */}
        <div className="shrink-0 flex flex-col items-center justify-end">
          <div className="w-[60px] h-[60px] bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
            <QrCode size={36} className="text-gray-400" />
          </div>
          <p className="text-[8px] text-gray-400 mt-1">Scan to verify</p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 px-5 py-1.5 flex justify-between text-[10px] text-gray-500">
        <span>Issued: {formatDate(permit.issuedAt || permit.submittedAt)}</span>
        <span>Expires: {formatDate(permit.expiryDate)}</span>
      </div>
    </div>
  );
}

function CardBack({ permit }) {
  return (
    <div className="w-[400px] h-[250px] rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-white relative">
      {/* Header */}
      <div className="bg-[#003366] text-white px-5 py-3">
        <p className="text-xs font-bold text-center">
          {DEPARTMENT_INFO.name}
        </p>
        <p className="text-[10px] text-center opacity-80 mt-0.5">
          {DEPARTMENT_INFO.ministry}
        </p>
      </div>
      <div className="h-1 bg-[#c5a55a]" />

      {/* Body */}
      <div className="px-5 py-3 space-y-2 text-xs text-gray-700">
        <div className="flex gap-4">
          <div className="flex-1">
            <p className="text-[10px] text-gray-500 uppercase">Permit Number</p>
            <p className="font-bold">{permit.permitNumber || 'N/A'}</p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-gray-500 uppercase">Permit Type</p>
            <p className="font-medium capitalize">
              {permit.type?.replace(/-/g, ' ') || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <p className="text-[10px] text-gray-500 uppercase">Passport No.</p>
            <p className="font-medium">
              {permit.employee?.passportNumber || 'N/A'}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-gray-500 uppercase">Work Location</p>
            <p className="font-medium">
              {permit.position?.workLocation || 'N/A'}
            </p>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase">Conditions</p>
          <p className="text-[10px] leading-relaxed text-gray-600 mt-0.5">
            This permit is valid only for the employer and position stated. The
            holder must carry this permit at all times while at the place of
            employment. Any change in employer or position requires a new
            application.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 px-5 py-1.5 text-center">
        <p className="text-[10px] text-gray-500">
          {DEPARTMENT_INFO.address} | {DEPARTMENT_INFO.phone}
        </p>
      </div>
    </div>
  );
}

export default function PermitCard({ permit }) {
  const cardRef = useRef(null);

  const handlePrint = () => {
    const content = cardRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Work Permit - ${permit.permitNumber || 'Card'}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 40px; font-family: system-ui, sans-serif; }
            @media print { body { padding: 10px; } }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  const handleDownload = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      const content = cardRef.current;
      if (!content) return;
      const canvas = await html2canvas(content, { scale: 2, useCORS: true });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [420, 540] });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, 400, 250);
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, 400, 250);
      pdf.save(`work-permit-${permit.permitNumber || 'card'}.pdf`);
    } catch {
      handlePrint();
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handlePrint} className="btn-outline text-sm">
          <Printer size={16} /> Print Card
        </button>
        <button onClick={handleDownload} className="btn-primary text-sm">
          <Download size={16} /> Download PDF
        </button>
      </div>

      <div ref={cardRef} className="inline-flex flex-col gap-6">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">
            Front
          </p>
          <CardFront permit={permit} />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">
            Back
          </p>
          <CardBack permit={permit} />
        </div>
      </div>
    </div>
  );
}
