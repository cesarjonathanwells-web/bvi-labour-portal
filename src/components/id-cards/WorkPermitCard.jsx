import { useRef, useState, useCallback, useMemo } from 'react';
import { Download, Printer, RotateCcw } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatDateShort } from '../../utils/helpers';
import { DEPARTMENT_INFO } from '../../data/constants';
import { generateQrSvg } from '../../utils/qrcode';

/* ---------- Real scannable QR (byte-mode, ECC level M) ---------- */
function VerifyQR({ permitNumber, size = 112 }) {
  const svgMarkup = useMemo(() => {
    if (!permitNumber) return null;
    try {
      const origin =
        typeof window !== 'undefined' && window.location?.origin
          ? window.location.origin
          : 'https://labour.gov.vg';
      const url = `${origin}/verify?permit=${encodeURIComponent(permitNumber)}`;
      return generateQrSvg(url, size);
    } catch (e) {
      console.error('QR generation failed', e);
      return null;
    }
  }, [permitNumber, size]);

  if (!svgMarkup) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center border border-dashed border-gray-400 rounded text-center"
      >
        <span className="text-[7px] text-gray-500 px-1 leading-tight">No QR available</span>
      </div>
    );
  }
  // eslint-disable-next-line react/no-danger
  return <div style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svgMarkup }} />;
}

/* ---------- barcode placeholder ---------- */
function BarcodePlaceholder({ width = 180, height = 30 }) {
  const bars = [];
  let x = 0;
  const seed = [2,1,3,1,2,1,1,3,2,1,1,2,3,1,2,1,1,3,1,2,1,3,1,1,2,3,1,2,1,1,3,2,1,1,2,3,1,2];
  for (let i = 0; i < seed.length && x < width; i++) {
    const w = seed[i];
    if (i % 2 === 0) {
      bars.push(<rect key={i} x={x} y={0} width={w} height={height} fill="#003366" />);
    }
    x += w;
  }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {bars}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Card side constants: 85.6mm x 54mm  ->  scaled to ~428 x 270 px  */
/*  Uses max-width so it scales down on mobile                        */
/* ------------------------------------------------------------------ */
const CARD_W = 428;
const CARD_H = 270;
const CARD_STYLE = { width: '100%', maxWidth: CARD_W, aspectRatio: `${CARD_W}/${CARD_H}` };

export default function WorkPermitCard({ permit, onFlip, showBack = false }) {
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  /* ---------- helpers ---------- */
  const capture = useCallback(async (ref) => {
    if (!ref.current) return null;
    return html2canvas(ref.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
    });
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    setExporting(true);
    try {
      const canvasF = await capture(frontRef);
      const canvasB = await capture(backRef);
      // eslint-disable-next-line new-cap
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] });
      if (canvasF) {
        const imgF = canvasF.toDataURL('image/png');
        pdf.addImage(imgF, 'PNG', 0, 0, 85.6, 54);
      }
      if (canvasB) {
        pdf.addPage([85.6, 54], 'landscape');
        const imgB = canvasB.toDataURL('image/png');
        pdf.addImage(imgB, 'PNG', 0, 0, 85.6, 54);
      }
      pdf.save(`WorkPermit_${permit?.permitNumber || 'card'}.pdf`);
    } catch (e) {
      console.error('PDF generation failed', e);
    } finally {
      setExporting(false);
    }
  }, [permit, capture]);

  const handleDownloadImage = useCallback(async () => {
    setExporting(true);
    try {
      const ref = showBack ? backRef : frontRef;
      const canvas = await capture(ref);
      if (canvas) {
        const link = document.createElement('a');
        link.download = `WorkPermit_${permit?.permitNumber || 'card'}_${showBack ? 'back' : 'front'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (e) {
      console.error('Image export failed', e);
    } finally {
      setExporting(false);
    }
  }, [permit, showBack, capture]);

  const handlePrint = useCallback(async () => {
    setExporting(true);
    try {
      const canvasF = await capture(frontRef);
      const canvasB = await capture(backRef);
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.write(`<!DOCTYPE html><html><head><title>Work Permit</title><style>
        @page{size:85.6mm 54mm;margin:0}
        body{margin:0;display:flex;flex-direction:column;align-items:center;gap:12px;padding:8px}
        img{width:85.6mm;height:54mm;object-fit:contain}
      </style></head><body>`);
      if (canvasF) w.document.write(`<img src="${canvasF.toDataURL('image/png')}" />`);
      if (canvasB) w.document.write(`<img src="${canvasB.toDataURL('image/png')}" />`);
      w.document.write('</body></html>');
      w.document.close();
      setTimeout(() => { w.print(); }, 400);
    } catch (e) {
      console.error('Print failed', e);
    } finally {
      setExporting(false);
    }
  }, [capture]);

  /* ---------- data ---------- */
  const name =
    permit?.employeeName ||
    [permit?.employeeFirstName || permit?.firstName, permit?.employeeLastName || permit?.lastName]
      .filter(Boolean).join(' ') ||
    'Name Unavailable';
  const nationality = permit?.employeeNationality || permit?.nationality || 'N/A';
  const dob = permit?.dateOfBirth ? formatDateShort(permit.dateOfBirth) : 'N/A';
  const gender = permit?.gender || 'N/A';
  const employer = permit?.employerName || permit?.employer || 'N/A';
  const position = permit?.position || permit?.jobTitle || 'N/A';
  const permitNumber = permit?.permitNumber || 'WP-0000-0000';
  const issueDate = permit?.approvedAt || permit?.submittedAt ? formatDateShort(permit.approvedAt || permit.submittedAt) : 'N/A';
  const expiryDate = permit?.expiryDate ? formatDateShort(permit.expiryDate) : 'N/A';
  const permitType = permit?.type?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Standard';
  const photoUrl = permit?.photo || permit?.photoUrl || null;

  /* ============================== FRONT ============================== */
  const Front = (
    <div
      ref={frontRef}
      style={CARD_STYLE}
      className="relative bg-white rounded-xl overflow-hidden select-none flex-shrink-0"
    >
      {/* Decorative border */}
      <div className="absolute inset-0 rounded-xl border-[3px] border-[#c5a55a] pointer-events-none z-20" />
      <div className="absolute inset-[3px] rounded-[9px] border border-[#003366]/20 pointer-events-none z-20" />

      {/* Top navy band */}
      <div className="relative h-[52px] bg-[#003366] flex items-center justify-center gap-2 px-3">
        {/* Coat of arms circle */}
        <div className="w-8 h-8 rounded-full bg-[#c5a55a] flex items-center justify-center flex-shrink-0">
          <span className="text-[8px] font-bold text-[#003366] leading-none text-center">BVI</span>
        </div>
        <div className="text-center leading-tight">
          <p className="text-[9px] tracking-[0.15em] text-gray-300 uppercase">Government of the</p>
          <p className="text-[11px] font-bold tracking-wider text-white uppercase">Virgin Islands</p>
        </div>
      </div>

      {/* Gold title strip */}
      <div className="h-[22px] bg-gradient-to-r from-[#c5a55a] via-[#d4b86a] to-[#c5a55a] flex items-center justify-center">
        <p className="text-[10px] font-extrabold tracking-[0.3em] text-[#003366] uppercase">Work Permit</p>
      </div>

      {/* Body */}
      <div className="px-3 pt-2 pb-1 flex gap-3" style={{ height: CARD_H - 52 - 22 - 38 }}>
        {/* Photo */}
        <div className="w-[90px] h-[108px] bg-gray-100 border border-gray-300 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
          {photoUrl ? (
            <img src={photoUrl} alt="Permit holder" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-1 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0116.5 0" /></svg>
              <p className="text-[7px]">PHOTO</p>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 text-[9px] leading-[1.5] space-y-[2px]">
          <div>
            <span className="text-gray-400 uppercase tracking-wide">Name</span>
            <p className="font-bold text-[#003366] text-[11px] truncate">{name}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-2">
            <div>
              <span className="text-gray-400 uppercase tracking-wide">Nationality</span>
              <p className="font-semibold text-gray-800 truncate">{nationality}</p>
            </div>
            <div>
              <span className="text-gray-400 uppercase tracking-wide">DOB</span>
              <p className="font-semibold text-gray-800">{dob}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-2">
            <div>
              <span className="text-gray-400 uppercase tracking-wide">Gender</span>
              <p className="font-semibold text-gray-800">{gender}</p>
            </div>
            <div>
              <span className="text-gray-400 uppercase tracking-wide">Permit #</span>
              <p className="font-semibold text-[#003366]">{permitNumber}</p>
            </div>
          </div>
          <div>
            <span className="text-gray-400 uppercase tracking-wide">Employer</span>
            <p className="font-semibold text-gray-800 truncate">{employer}</p>
          </div>
          <div>
            <span className="text-gray-400 uppercase tracking-wide">Position</span>
            <p className="font-semibold text-gray-800 truncate">{position}</p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[38px] bg-gradient-to-r from-[#003366] to-[#004d99] flex items-center justify-between px-4">
        <div className="text-[8px] text-white">
          <span className="text-gray-300">Issued: </span>
          <span className="font-semibold">{issueDate}</span>
        </div>
        <div className="text-[8px] text-white">
          <span className="text-gray-300">Expires: </span>
          <span className="font-semibold">{expiryDate}</span>
        </div>
        <div className="text-[8px] text-white">
          <span className="text-gray-300">Type: </span>
          <span className="font-semibold">{permitType}</span>
        </div>
      </div>
    </div>
  );

  /* ============================== BACK ============================== */
  const Back = (
    <div
      ref={backRef}
      style={CARD_STYLE}
      className="relative bg-white rounded-xl overflow-hidden select-none flex-shrink-0"
    >
      {/* Decorative border */}
      <div className="absolute inset-0 rounded-xl border-[3px] border-[#c5a55a] pointer-events-none z-20" />
      <div className="absolute inset-[3px] rounded-[9px] border border-[#003366]/20 pointer-events-none z-20" />

      {/* Thin navy header */}
      <div className="h-[28px] bg-[#003366] flex items-center justify-center">
        <p className="text-[8px] tracking-[0.2em] text-gray-300 uppercase">{DEPARTMENT_INFO.name}</p>
      </div>

      <div className="flex p-3 gap-3" style={{ height: CARD_H - 28 - 48 }}>
        {/* QR code — encodes /verify?permit=<num> on the live site */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="border border-gray-200 p-1 rounded bg-white">
            <VerifyQR permitNumber={permit?.permitNumber} size={104} />
          </div>
          <p className="text-[6px] text-gray-500 text-center whitespace-nowrap">
            Scan to verify at labour.gov.vg
          </p>
        </div>

        {/* Info */}
        <div className="flex-1 text-[7.5px] text-gray-600 leading-[1.6] space-y-1">
          <p className="font-bold text-[#003366] text-[8px]">Terms & Conditions</p>
          <ul className="list-disc pl-3 space-y-[1px]">
            <li>This permit authorizes employment only with the specified employer.</li>
            <li>Holder must carry this card while working.</li>
            <li>Any change of employer requires a new permit application.</li>
            <li>This permit is non-transferable.</li>
            <li>Report lost or stolen cards to the Department immediately.</li>
          </ul>
          <p className="text-[7px] font-semibold text-[#003366] mt-1 italic">
            &quot;This permit is the property of the Government of the Virgin Islands.&quot;
          </p>
        </div>
      </div>

      {/* Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[48px] bg-gradient-to-r from-[#003366] to-[#004d99] flex items-center justify-between px-4">
        <div className="text-[7px] text-gray-300 leading-[1.5]">
          <p className="text-white font-semibold">{DEPARTMENT_INFO.shortName}</p>
          <p>{DEPARTMENT_INFO.address}</p>
          <p>Tel: {DEPARTMENT_INFO.phone}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <BarcodePlaceholder width={120} height={22} />
          <p className="text-[6px] text-gray-400">{permitNumber}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Visible card */}
      <div className="flex justify-center">
        <div className="relative" style={{ perspective: 1000 }}>
          {showBack ? Back : Front}
        </div>
      </div>

      {/* Hidden card for capture (the other side) — render off-screen */}
      <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none" aria-hidden>
        {showBack ? Front : Back}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        {onFlip && (
          <button onClick={onFlip} className="btn-outline text-sm" disabled={exporting}>
            <RotateCcw size={16} /> Flip Card
          </button>
        )}
        <button onClick={handleDownloadPDF} className="btn-primary text-sm" disabled={exporting}>
          <Download size={16} /> {exporting ? 'Generating...' : 'Download PDF'}
        </button>
        <button onClick={handleDownloadImage} className="btn-secondary text-sm" disabled={exporting}>
          <Download size={16} /> Save as Image
        </button>
        <button onClick={handlePrint} className="btn-success text-sm" disabled={exporting}>
          <Printer size={16} /> Print
        </button>
      </div>
    </div>
  );
}
