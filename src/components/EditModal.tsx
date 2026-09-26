import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
import { AttendanceLog } from '../types';
import {
  X,
  ShieldAlert,
  Clock,
  Calendar,
  Building,
  UserCheck,
  FileText,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: AttendanceLog | null;
  onSave?: (logId: string, updatedData: Partial<AttendanceLog>, auditNote: string) => Promise<{ success: boolean; message: string }>;
}

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  log,
  onSave,
}) => {
  const { currentUser, canDirectlyEditLogs } = useAuth();
  const { directEditLog } = useAttendance();

  const [date, setDate] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [status, setStatus] = useState<'Active' | 'Checked Out' | 'Edited'>('Active');
  const [campus, setCampus] = useState('Spring Campus');
  const [learningCenter, setLearningCenter] = useState('');
  const [auditNote, setAuditNote] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (log) {
      setDate(log.date || new Date().toISOString().split('T')[0]);
      setCheckInTime(log.check_in_time || '');
      setCheckOutTime(log.check_out_time || '');
      setStatus(log.check_out_time ? 'Checked Out' : 'Active');
      setCampus(log.campus || 'Spring Campus');
      setLearningCenter(log.classroom || log.grade_or_role || '');
      setAuditNote(log.audit_note || '');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [log]);

  if (!isOpen || !log) return null;

  // RBAC Permission Gate check
  const isAuthorizedRole = canDirectlyEditLogs || ['Administrator', 'ICCE Coordinator', 'Coordinator', 'Principal', 'Director'].includes(currentUser?.role || '');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorizedRole) {
      setErrorMsg('Unauthorized: Teachers do not have permission to modify past attendance logs.');
      return;
    }

    if (!auditNote.trim() || auditNote.trim().length < 5) {
      setErrorMsg('A detailed audit trail note is required (minimum 5 characters).');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const updatedPayload: Partial<AttendanceLog> = {
      date: date.trim(),
      check_in_time: checkInTime.trim(),
      check_out_time: checkOutTime.trim() ? checkOutTime.trim() : null,
      status: 'Edited' as const,
      campus: campus,
      classroom: learningCenter.trim(),
      grade_or_role: learningCenter.trim(),
    };

    try {
      let res;
      if (onSave) {
        res = await onSave(log.id, updatedPayload, auditNote.trim());
      } else {
        res = await directEditLog(log.id, updatedPayload, auditNote.trim());
      }

      if (res.success) {
        setSuccessMsg(res.message || 'Attendance record updated successfully in Firestore.');
        setTimeout(() => {
          setIsSaving(false);
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.message || 'Failed to update attendance record.');
        setIsSaving(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'An unexpected error occurred while saving.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <UserCheck className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white flex items-center space-x-2">
                <span>Manual Attendance Override</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {log.target_type || 'Record'}
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Audit-Logged Edit for {log.target_name} ({log.target_id})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleFormSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto font-sans">
          {/* RBAC Notice for Teachers / Unauthorized users */}
          {!isAuthorizedRole ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-xs space-y-2 flex items-start space-x-3">
              <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-900 block">Teacher Read-Only Notice</strong>
                <span>
                  Teachers are permitted to record check-ins and check-outs via scanning. Modifying past attendance records or correcting checkout timestamps requires <strong>Administrator, Coordinator, Principal, or Director</strong> authorization.
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-600 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Operating as <strong>{currentUser?.full_name}</strong> ({currentUser?.role}). All edits write directly to Firestore with audit timestamps.
              </span>
            </div>
          )}

          {/* Feedback messages */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-3 text-xs flex items-center space-x-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-3 text-xs flex items-center space-x-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Read-Only Target Info */}
          <div className="grid grid-cols-2 gap-3 bg-slate-100/70 p-3 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Target Name</span>
              <span className="font-extrabold text-slate-900">{log.target_name}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">ID / PIN</span>
              <span className="font-mono font-bold text-slate-800">{log.target_id}</span>
            </div>
          </div>

          {/* Date & Campus Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Date Captured (YYYY-MM-DD)</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={!isAuthorizedRole || isSaving}
                className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Building className="w-3.5 h-3.5 text-indigo-600" />
                <span>Campus Location</span>
              </label>
              <select
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                disabled={!isAuthorizedRole || isSaving}
                className="w-full bg-white border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100"
              >
                <option value="Spring Campus">Spring Campus</option>
                <option value="Hope Campus">Hope Campus</option>
              </select>
            </div>
          </div>

          {/* Learning Center / Department */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {log.target_type === 'Student' ? 'Learning Center / Grade' : 'Department / Role'}
            </label>
            <input
              type="text"
              value={learningCenter}
              onChange={(e) => setLearningCenter(e.target.value)}
              disabled={!isAuthorizedRole || isSaving}
              placeholder="e.g. Bethany, Doxa, ICCE Teacher"
              className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100"
            />
          </div>

          {/* Time Signed In & Time Checked Out */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Time Signed In (HH:MM:SS)</span>
              </label>
              <input
                type="text"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                disabled={!isAuthorizedRole || isSaving}
                placeholder="08:15:00 AM"
                className="w-full bg-white border border-slate-300 text-slate-900 text-xs font-mono font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Time Checked Out (or blank if active)</span>
              </label>
              <input
                type="text"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                disabled={!isAuthorizedRole || isSaving}
                placeholder="04:30:00 PM"
                className="w-full bg-white border border-slate-300 text-slate-900 text-xs font-mono font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* Audit Note (Required for Admin Override) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>Audit Trail Note (Required for Override)</span>
            </label>
            <textarea
              value={auditNote}
              onChange={(e) => setAuditNote(e.target.value)}
              disabled={!isAuthorizedRole || isSaving}
              rows={2}
              placeholder="Provide reason for manual edit (e.g. Corrected missed checkout time per supervisor confirmation)..."
              className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100"
              required
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            {isAuthorizedRole && (
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Firestore...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Override Changes</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
