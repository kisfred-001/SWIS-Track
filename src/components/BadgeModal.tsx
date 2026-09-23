import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Student, Staff } from '../types';
import { School, Printer, X, Download, ShieldCheck } from 'lucide-react';

interface BadgeModalProps {
  item: Student | Staff | null;
  type: 'Student' | 'Staff';
  onClose: () => void;
}

export const BadgeModal: React.FC<BadgeModalProps> = ({ item, type, onClose }) => {
  const badgeRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 my-auto">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <School className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-sm">Official ID Badge & QR Code</span>
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
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white -mx-5 -mt-5 p-3 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">
                SWIS Academy
              </p>
              <h4 className="font-bold text-xs uppercase tracking-wider">
                {isStudent ? 'Official Student ID' : 'Faculty & Staff Credential'}
              </h4>
            </div>

            {/* Avatar Placeholder */}
            <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 mx-auto flex items-center justify-center font-bold text-xl text-slate-700 shadow-inner mb-2">
              {fullName.charAt(0)}
            </div>

            {/* Name */}
            <h3 className="font-extrabold text-base text-slate-900 leading-tight">
              {fullName}
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-3">{subtitle}</p>

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
                <span className="font-mono font-extrabold text-xs text-blue-700">
                  {pinCode}
                </span>
              </div>
            </div>

            {/* Supervisor note for students */}
            {isStudent && (
              <p className="text-[10px] text-slate-400 mt-2">
                Supervisor: {student!.supervisor_name}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Badge</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
