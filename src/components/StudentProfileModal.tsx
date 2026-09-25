import React from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  Edit,
  QrCode,
  Bed,
  Sun,
  Trash2,
  Building,
} from 'lucide-react';
import { Student } from '../types';
import { SchoolLogo } from './SchoolLogo';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onEdit: (student: Student) => void;
  onPrintBadge: (student: Student) => void;
  onDelete?: (studentId: string) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  onEdit,
  onPrintBadge,
  onDelete,
}) => {
  if (!isOpen || !student) return null;

  const isBoarding = student.enrollment_type === 'Boarding';
  const pInfo = student.parent_info;
  const designatedPickups = student.designated_pickups || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 my-auto max-h-[92vh] flex flex-col">
        {/* Header with Official School Branding */}
        <div className="bg-[#8B1E2F] text-white p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3">
            <SchoolLogo variant="emblem" size="sm" className="bg-white p-1 rounded-lg" />
            <div>
              <h3 className="font-bold text-base">Student Security Profile</h3>
              <p className="text-[11px] text-amber-200">
                Spirit &amp; Word International School • Authorized Registry
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 space-y-5 text-xs flex-1">
          {/* Top Hero Card */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            {/* Student Photo */}
            <div className="shrink-0">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt={student.full_name}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-300 shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-[#8B1E2F]/10 border-2 border-[#8B1E2F]/20 flex flex-col items-center justify-center text-[#8B1E2F]">
                  <User className="w-10 h-10 text-[#8B1E2F]" />
                  <span className="text-[10px] font-bold mt-1">NO PHOTO</span>
                </div>
              )}
            </div>

            {/* Student Info Details */}
            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-lg font-black text-slate-900">{student.full_name}</h2>
                {isBoarding ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                    <Bed className="w-3 h-3 text-purple-700" />
                    <span>Boarding Section (Mon-Fri)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    <Sun className="w-3 h-3 text-amber-700" />
                    <span>Day Section</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-slate-600 text-xs">
                <div className="flex items-center space-x-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">{student.campus}</span>
                </div>
                <span>•</span>
                <div>
                  Center: <span className="font-bold text-slate-800">{student.learning_center_id}</span>
                </div>
              </div>

              {/* Security Credentials Bar */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 font-mono text-[11px]">
                <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-slate-400 font-sans text-[10px] mr-1">ID:</span>
                  <strong className="text-slate-900">{student.student_id}</strong>
                </div>
                <div className="bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
                  <span className="text-blue-500 font-sans text-[10px] mr-1">SECURITY PIN:</span>
                  <strong className="text-blue-800">{student.pin_code}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Academic & Center Supervision Notice */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-[#8B1E2F]" />
              <span>Learning Center &amp; Supervisory Assignment</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="text-slate-400 text-[10px]">Assigned Supervisor</div>
                <div className="font-bold text-slate-800 mt-0.5">
                  {student.supervisor_name ? (
                    <span className="text-emerald-700 font-bold">{student.supervisor_name} (Center Supervisor)</span>
                  ) : (
                    <span className="text-slate-400 italic font-normal">Assigned Center Supervisor</span>
                  )}
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="text-slate-400 text-[10px]">Assigned Monitor</div>
                <div className="font-bold text-slate-800 mt-0.5">
                  {student.monitor_name ? (
                    <span className="text-indigo-700 font-bold">{student.monitor_name} (Monitor)</span>
                  ) : (
                    <span className="text-slate-400 italic font-normal">None (Bethany Learning Center only)</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Parents & Guardians Contact Card */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Parents &amp; Primary Guardians</span>
              </h4>
              <button
                type="button"
                onClick={() => onEdit(student)}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
              >
                + Update Parent Info
              </button>
            </div>

            {pInfo?.father_name || pInfo?.mother_name || student.parent_names ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Father */}
                {pInfo?.father_name && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-800">
                      {pInfo.father_name}
                    </div>
                    <div className="text-slate-500 text-[11px]">Father / Guardian</div>
                    {pInfo.father_phone && (
                      <div className="flex items-center space-x-1.5 pt-1 text-slate-700">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <a
                          href={`tel:${pInfo.father_phone}`}
                          className="font-mono text-blue-600 hover:underline"
                        >
                          {pInfo.father_phone}
                        </a>
                      </div>
                    )}
                    {pInfo.father_email && (
                      <div className="flex items-center space-x-1.5 text-slate-700">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-600">{pInfo.father_email}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Mother */}
                {pInfo?.mother_name && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-800">
                      {pInfo.mother_name}
                    </div>
                    <div className="text-slate-500 text-[11px]">Mother / Guardian</div>
                    {pInfo.mother_phone && (
                      <div className="flex items-center space-x-1.5 pt-1 text-slate-700">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <a
                          href={`tel:${pInfo.mother_phone}`}
                          className="font-mono text-purple-600 hover:underline"
                        >
                          {pInfo.mother_phone}
                        </a>
                      </div>
                    )}
                    {pInfo.mother_email && (
                      <div className="flex items-center space-x-1.5 text-slate-700">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-600">{pInfo.mother_email}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-500 space-y-1">
                <p className="font-semibold text-xs text-slate-700">No Parent or Guardian Contact Registered Yet</p>
                <p className="text-[11px] text-slate-400">
                  Dummy records have been removed. Click "Edit Student Information" to record official parent names and contact numbers.
                </p>
              </div>
            )}

            {/* Address & Emergency Contact */}
            {(pInfo?.home_address || pInfo?.emergency_phone || student.emergency_contact) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                {pInfo?.home_address && (
                  <div className="flex items-start space-x-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-slate-400">Residential Address</div>
                      <div className="font-medium text-slate-800">
                        {pInfo.home_address}
                      </div>
                    </div>
                  </div>
                )}

                {(pInfo?.emergency_phone || student.emergency_contact) && (
                  <div className="flex items-start space-x-2 text-slate-600">
                    <Phone className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-slate-400">24/7 Emergency Line</div>
                      <div className="font-mono font-bold text-red-700">
                        {pInfo?.emergency_phone || student.emergency_contact}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Designated Authorized Drop-Off / Pick-Up Persons */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Authorized Pick-Up &amp; Drop-Off Persons ({designatedPickups.length})</span>
              </h4>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                Security Verified
              </span>
            </div>

            {designatedPickups.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-lg text-slate-400 text-center">
                No third-party designated pickup persons registered. Only verified parents may check out this student.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {designatedPickups.map((person) => (
                  <div
                    key={person.id}
                    className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{person.name}</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md border border-indigo-200">
                        {person.relationship}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <a href={`tel:${person.phone}`} className="hover:underline text-indigo-600">
                        {person.phone}
                      </a>
                    </div>
                    {person.id_number && (
                      <div className="text-[10px] text-slate-500 font-mono">
                        Credential ID: {person.id_number}
                      </div>
                    )}
                    {person.notes && (
                      <div className="text-[10px] text-slate-600 bg-white p-1.5 rounded mt-1 border border-slate-100">
                        {person.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div>
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to remove ${student.full_name} from the active student roster?`)) {
                    onDelete(student.student_id);
                    onClose();
                  }
                }}
                className="inline-flex items-center space-x-1 text-red-600 hover:text-red-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Student Record</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                onPrintBadge(student);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Print Official ID Card</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onEdit(student);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#8B1E2F] hover:bg-[#6D1422] text-white rounded-xl font-bold text-xs shadow-xs transition"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Student Information</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
