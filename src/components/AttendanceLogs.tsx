import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Filter,
  Search,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  ShieldCheck,
  User,
  Info,
  X,
} from 'lucide-react';
import { AttendanceLog, AttendanceLogStatus } from '../types';

export const AttendanceLogs: React.FC = () => {
  const { logs, directEditLog, deleteLog, submitEditRequest, selectedDate, setSelectedDate } = useAttendance();
  const { currentUser, canDirectlyEditLogs, isTeacherOnly } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Student' | 'Teacher'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');

  // Modal states for editing / requesting edit
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form fields inside edit modal
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [editPartyName, setEditPartyName] = useState('');
  const [editPartyType, setEditPartyType] = useState<'Parent' | 'Designate'>('Parent');
  const [editEarlyReason, setEditEarlyReason] = useState('');
  const [editReasonPrompt, setEditReasonPrompt] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteReason, setDeleteReason] = useState('');

  const classrooms = Array.from(new Set(logs.map((l) => l.classroom))).filter(Boolean);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    // If selected date is active, match it (or ignore if 'all')
    const matchesDate = !selectedDate || log.date === selectedDate;

    const matchesType = filterType === 'all' || log.target_type === filterType;
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesClass = filterClass === 'all' || log.classroom === filterClass;

    const matchesSearch =
      log.target_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.log_id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDate && matchesType && matchesStatus && matchesClass && log.status !== 'Deleted';
  });

  const openEditModal = (log: AttendanceLog) => {
    setSelectedLog(log);
    setEditCheckIn(log.check_in_time || '');
    setEditCheckOut(log.check_out_time || '');
    setEditPartyType(log.pickup_dropoff_party?.type || 'Parent');
    setEditPartyName(log.pickup_dropoff_party?.name || '');
    setEditEarlyReason(log.early_departure_reason || '');
    setEditReasonPrompt('');
    setActionError(null);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (log: AttendanceLog) => {
    setSelectedLog(log);
    setDeleteReason('');
    setActionError(null);
    setIsDeleteModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedLog) return;
    setActionError(null);

    // If teacher or admin assistant: MUST provide a Reason for Edit for approval request
    if (!canDirectlyEditLogs) {
      if (!editReasonPrompt || editReasonPrompt.trim().length < 5) {
        setActionError('A detailed reason for edit is mandatory for administrative approval.');
        return;
      }

      setIsSubmitting(true);
      const res = await submitEditRequest(
        selectedLog.id,
        {
          check_in_time: editCheckIn.trim(),
          check_out_time: editCheckOut.trim() || null,
          pickup_dropoff_party: {
            type: editPartyType,
            name: editPartyName.trim() || 'Parent',
          },
          early_departure_reason: editEarlyReason.trim() || undefined,
        },
        editReasonPrompt.trim()
      );
      setIsSubmitting(false);

      if (res.success) {
        setActionSuccess(res.message);
        setIsEditModalOpen(false);
        setTimeout(() => setActionSuccess(null), 5000);
      } else {
        setActionError(res.message);
      }
    } else {
      // Direct Admin Edit
      setIsSubmitting(true);
      const res = await directEditLog(
        selectedLog.id,
        {
          check_in_time: editCheckIn.trim(),
          check_out_time: editCheckOut.trim() || null,
          pickup_dropoff_party: {
            type: editPartyType,
            name: editPartyName.trim() || 'Parent',
          },
          early_departure_reason: editEarlyReason.trim() || undefined,
        },
        editReasonPrompt.trim() || 'Direct administrative modification'
      );
      setIsSubmitting(false);

      if (res.success) {
        setActionSuccess(res.message);
        setIsEditModalOpen(false);
        setTimeout(() => setActionSuccess(null), 5000);
      } else {
        setActionError(res.message);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLog) return;
    if (!deleteReason || deleteReason.trim().length < 4) {
      setActionError('A reason for audit deletion is required.');
      return;
    }

    setIsSubmitting(true);
    const res = await deleteLog(selectedLog.id, deleteReason.trim());
    setIsSubmitting(false);

    if (res.success) {
      setActionSuccess(res.message);
      setIsDeleteModalOpen(false);
      setTimeout(() => setActionSuccess(null), 5000);
    } else {
      setActionError(res.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Banner / Success alerts */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Header & Filter Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-bold text-base text-slate-900 flex items-center space-x-2">
              <span>Attendance Logs & Audit Trail</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                {filteredLogs.length} Records
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive audit trail of all student arrivals, dismissals, and faculty check-ins.
            </p>
          </div>

          {/* Quick RBAC indicator */}
          <div className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-600">
            <span className="font-semibold text-slate-800">Your Edit Permission: </span>
            {canDirectlyEditLogs ? (
              <span className="text-emerald-700 font-bold">Direct Edit & Delete (Admin)</span>
            ) : (
              <span className="text-amber-700 font-bold">Edit Request via Approval (Teacher/Assistant)</span>
            )}
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
          {/* Date Picker */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Search Query */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search target or ID..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Targets (Students & Faculty)</option>
              <option value="Student">Students Only</option>
              <option value="Teacher">Staff / Faculty Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending Edit Approval">Pending Edit Approval</option>
              <option value="Edited">Edited (Modified)</option>
            </select>
          </div>

          {/* Classroom Filter */}
          <div>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Centers / Classrooms</option>
              {classrooms.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table of Records */}
        <div className="divide-y divide-slate-100 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Date & Log ID</th>
                <th className="py-3 px-3">Target Name</th>
                <th className="py-3 px-3">Type & Center</th>
                <th className="py-3 px-3">Check-In</th>
                <th className="py-3 px-3">Check-Out</th>
                <th className="py-3 px-3">Drop-off / Pick-up Party</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Scanned By</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No attendance logs found matching these filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    {/* Date & Log ID */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{log.date}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.log_id}</div>
                    </td>

                    {/* Target Name */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{log.target_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {log.target_id}
                      </div>
                    </td>

                    {/* Type & Classroom */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          log.target_type === 'Student'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        {log.target_type}
                      </span>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {log.classroom}
                      </div>
                    </td>

                    {/* Check In */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1 text-slate-800 font-medium">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{log.check_in_time}</span>
                      </div>
                    </td>

                    {/* Check Out */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {log.check_out_time ? (
                        <div className="flex items-center space-x-1 text-slate-800 font-medium">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>{log.check_out_time}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">On Premises</span>
                      )}
                    </td>

                    {/* Drop-off / Pick-up Party */}
                    <td className="py-3 px-3 max-w-[200px]">
                      {log.pickup_dropoff_party ? (
                        <div>
                          <span className="font-semibold text-slate-800">
                            {log.pickup_dropoff_party.type}: {log.pickup_dropoff_party.name}
                          </span>
                          {log.early_departure_reason && (
                            <div className="text-[10px] text-amber-800 bg-amber-50 px-1 py-0.5 rounded mt-0.5 border border-amber-200">
                              Early: {log.early_departure_reason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'Pending Edit Approval'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {log.status}
                      </span>
                      {log.last_edited_by && (
                        <div className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[120px]" title={log.last_edited_by}>
                          {log.last_edited_by}
                        </div>
                      )}
                    </td>

                    {/* Scanned By */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                      <div>{log.scanned_by_name || log.scanned_by}</div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(log)}
                          title={
                            canDirectlyEditLogs
                              ? 'Direct Administrative Edit'
                              : 'Request Attendance Edit (Subject to Admin Approval)'
                          }
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {canDirectlyEditLogs ? (
                          <button
                            type="button"
                            onClick={() => openDeleteModal(log)}
                            title="Delete log (Admin only)"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span
                            title="Only Principals, Directors, and ICCE Coordinators can delete logs"
                            className="p-1.5 text-slate-300 cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Request Edit Modal */}
      {isEditModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 my-auto">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">
                  {canDirectlyEditLogs
                    ? 'Direct Administrative Edit'
                    : 'Submit Attendance Edit Request'}
                </h3>
                <p className="text-xs text-slate-400">
                  Target: {selectedLog.target_name} ({selectedLog.target_id})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs flex items-center space-x-2 border-b border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Check-In Time:
                  </label>
                  <input
                    type="text"
                    value={editCheckIn}
                    onChange={(e) => setEditCheckIn(e.target.value)}
                    placeholder="e.g. 08:15 AM"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Check-Out Time (or empty):
                  </label>
                  <input
                    type="text"
                    value={editCheckOut}
                    onChange={(e) => setEditCheckOut(e.target.value)}
                    placeholder="e.g. 03:15 PM"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {selectedLog.target_type === 'Student' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Party Type:
                      </label>
                      <select
                        value={editPartyType}
                        onChange={(e) => setEditPartyType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      >
                        <option value="Parent">Parent / Guardian</option>
                        <option value="Designate">Authorized Designate</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Party Name:
                      </label>
                      <input
                        type="text"
                        value={editPartyName}
                        onChange={(e) => setEditPartyName(e.target.value)}
                        placeholder="e.g. Robert Miller"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Early Departure Reason (if applicable):
                    </label>
                    <input
                      type="text"
                      value={editEarlyReason}
                      onChange={(e) => setEditEarlyReason(e.target.value)}
                      placeholder="e.g. Doctor appointment with clinic pass"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* Reason for Edit */}
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
                <label className="block font-bold text-slate-800 mb-1">
                  {!canDirectlyEditLogs
                    ? 'Mandatory Reason for Edit (for Administrator Approval):'
                    : 'Administrative Change Justification:'}
                </label>
                <textarea
                  rows={2}
                  value={editReasonPrompt}
                  onChange={(e) => setEditReasonPrompt(e.target.value)}
                  placeholder="Explain why this attendance record requires updating..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
                {!canDirectlyEditLogs && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Your request will be placed into the Approval Queue for review by a Principal or Director.
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Processing...'
                  : canDirectlyEditLogs
                  ? 'Apply Direct Edit'
                  : 'Submit For Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Admin only) */}
      {isDeleteModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="bg-rose-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm">Confirm Record Deletion</h3>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs border-b border-red-200">
                {actionError}
              </div>
            )}

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-700 font-medium">
                Are you sure you want to delete this attendance log for{' '}
                <strong>{selectedLog.target_name}</strong> on {selectedLog.date}?
              </p>
              <p className="text-slate-500 text-[11px]">
                Note: In compliance with institutional audit requirements, this record will be archived as "Deleted" with your administrator identity stamped.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Deletion:
                </label>
                <input
                  type="text"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="e.g. Duplicate barcode scan, Erroneous entry"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
