import React, { useRef, useState } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Student, Staff } from '../types';
import { School, Printer, X, Download, ShieldCheck, Loader2, Bed } from 'lucide-react';
import { generateSingleCardPDF } from '../utils/pdfGenerator';
import { sound } from '../utils/sound';
import { SchoolLogo } from './SchoolLogo';

interface BadgeModalProps {
  item: Student | Staff | null;
  type: 'Student' | 'Staff';
  onClose: () => void;
}

export const BadgeModal: React.FC<BadgeModalProps> = ({ item, type, onClose }) => {
  const badgeRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!item) return null;

  const isStudent = type === 'Student';
  const student = isStudent ? (item as Student) : null;
  const staff = !isStudent ? (item as Staff) : null;

  const idCode = isStudent ? student!.student_id : staff!.staff_id;
  const pinCode = isStudent ? student!.pin_code : staff!.pin_code;
  const fullName = item.full_name;
  const subtitle = isStudent
    ? `${student!.grade} • ${student!.learning_center_id}`
    : `${staff!.role} • ${staff!.learning_center_id || 'School Staff'}`;

  // Print badge
  const handlePrint = () => {
    window.print();
  };

  // Download single card PDF
  const handleDownloadPDF = () => {
    setIsExporting(true);
    try {
      const canvas = document.getElementById('badge-single-qr-canvas') as HTMLCanvasElement;
      const qrDataUrl = canvas ? canvas.toDataURL('image/png') : undefined;
      const doc = generateSingleCardPDF(item, type, qrDataUrl);
      const safeName = fullName.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`SWIS_${type}_ID_${safeName}.pdf`);
      sound.playSuccessChime();
    } catch {
      sound.playError();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 my-auto">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <SchoolLogo variant="emblem" size="sm" className="bg-white p-0.5 rounded shadow-xs" />
            <div>
              <span className="font-bold text-xs sm:text-sm font-serif">Spirit &amp; Word Int. School</span>
              <p className="text-[9px] text-amber-200 italic">The Quick, The Sharp and The Clever</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Badge Card Container */}
        <div className="p-6 flex flex-col items-center bg-slate-50" ref={badgeRef}>
          <div className="w-full max-w-[280px] bg-white rounded-2xl border-2 border-slate-300 shadow-md p-5 text-center relative overflow-hidden">
            {/* Header stripe */}
            <div className="bg-[#8B1E2F] text-white -mx-5 -mt-5 p-3 mb-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-amber-200 font-serif">
                SPIRIT &amp; WORD INT. SCHOOL
              </p>
              <h4 className="font-bold text-xs uppercase tracking-wider">
                {isStudent
                  ? (student?.enrollment_type === 'Boarding' ? 'BOARDING SECTION STUDENT ID' : 'OFFICIAL STUDENT ID')
                  : 'FACULTY & STAFF CREDENTIAL'}
              </h4>
            </div>

            {/* Photo / Avatar */}
            {isStudent && student?.photo_url ? (
              <img
                src={student.photo_url}
                alt={fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-300 mx-auto shadow-sm mb-2"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 mx-auto flex items-center justify-center font-bold text-xl text-slate-700 shadow-inner mb-2">
                {fullName.charAt(0)}
              </div>
            )}

            {/* Name */}
            <h3 className="font-extrabold text-base text-slate-900 leading-tight">
              {fullName}
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-3">{subtitle}</p>

            {/* Boarding Badge */}
            {isStudent && student?.enrollment_type === 'Boarding' && (
              <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 mb-3">
                <Bed className="w-3 h-3 text-purple-600" />
                <span>Boarding Section (Mon–Fri)</span>
              </div>
            )}

            {/* QR Code Container */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs inline-block mb-3">
              <QRCodeSVG
                value={idCode}
                size={140}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Codes Footer */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-2 rounded-xl text-left border border-slate-200">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                  Scan ID
                </span>
                <span className="font-mono font-bold text-xs text-slate-800">
                  {idCode}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                  Manual PIN
                </span>
                <span className="font-mono font-extrabold text-xs text-[#8B1E2F]">
                  {pinCode}
                </span>
              </div>
            </div>

            {/* Supervisor note for students (Bethany only) */}
            {isStudent && (
              <p className="text-[10px] text-slate-500 mt-2">
                {student?.supervisor_name ? (
                  <>Supervisor: <strong>{student.supervisor_name}</strong></>
                ) : (
                  <>Monitor: <strong>{student?.monitor_name || 'Staff'}</strong></>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center text-xs gap-2">
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
              title="Print Badge directly"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownloadPDF}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-2xs"
              title="Download standard CR80 ID Card PDF"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download PDF</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition"
          >
            Done
          </button>
        </div>

        {/* Hidden Canvas for crisp PDF capture */}
        <div className="hidden" aria-hidden="true">
          <QRCodeCanvas
            id="badge-single-qr-canvas"
            value={idCode}
            size={300}
            level="H"
            includeMargin={false}
          />
        </div>
      </div>
    </div>
  );
};
