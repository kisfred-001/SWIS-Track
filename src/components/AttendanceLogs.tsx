import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  X,
} from 'lucide-react';
import { AttendanceLog } from '../types';
import { EditRequestsTab } from './EditRequestsTab';

interface AttendanceLogsProps {
  initialSubTab?: 'logs' | 'approvals';
}

export const AttendanceLogs: React.FC<AttendanceLogsProps> = ({ initialSubTab = 'logs' }) => {
  const { logs, directEditLog, deleteLog, submitEditRequest, selectedDate, setSelectedDate, pendingRequestsCount } = useAttendance();
  const { canDirectlyEditLogs, isSupportStaff } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'approvals'>(initialSubTab);

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
  const [editPartyType, setEditPartyType] = useState<'Parent' | 'Designate' | 'Self'>('Parent');
  const [editEarlyReason, setEditEarlyReason] = useState('');
  const [editReasonPrompt, setEditReasonPrompt] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteReason, setDeleteReason] = useState('');

  const classrooms = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.classroom))).filter(Boolean);
  }, [logs]);

  const [showAllLogs, setShowAllLogs] = useState(false);

  // Filter logs (memoized)
  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return logs.filter((log) => {
      // If selected date is active, match it (or ignore if 'all')
      const matchesDate = !selectedDate || log.date === selectedDate;
      const matchesType = filterType === 'all' || log.target_type === filterType;
      const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
      const matchesClass = filterClass === 'all' || log.classroom === filterClass;

      const matchesSearch =
        !q ||
        log.target_name.toLowerCase().includes(q) ||
        log.target_id.toLowerCase().includes(q) ||
        log.log_id.toLowerCase().includes(q);

      return matchesDate && matchesType && matchesStatus && matchesClass && matchesSearch && log.status !== 'Deleted';
    });
  }, [logs, selectedDate, filterType, filterStatus, filterClass, searchQuery]);

  const displayLogs = useMemo(() => {
    return showAllLogs ? filteredLogs : filteredLogs.slice(0, 25);
  }, [filteredLogs, showAllLogs]);

  const openEditModal = (log: AttendanceLog) => {
    setSelectedLog(log);
    setEditCheckIn(log.check_in_time || '');
    setEditCheckOut(log.check_out_time || '');
    setEditPartyType(log.pickup_dropoff_party?.type || 'Parent');
    setEditPartyName(log.pickup_dropoff_party?.name || '');
    setEditEarlyReason(log.early_departure_reason || '');
    setEditReasonPrompt('');
    setIsUrgent(false);
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
        editReasonPrompt.trim(),
        isUrgent
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
      {/* Combined Module Sub-tab Switcher Header */}
      <div className="flex flex-wrap items-center gap-2 bg-[#3e3d40] p-1.5 rounded-2xl shadow-sm border border-slate-700">
        <button
          type="button"
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'logs'
              ? 'bg-[#FCCB0D] text-slate-900 font-extrabold shadow-sm ring-2 ring-white/30'
              : 'text-white hover:bg-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Attendance Movement Logs</span>
          <span className="ml-1 text-[10px] bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded-full font-mono">
            {filteredLogs.length}
          </span>
        </button>

        {!isSupportStaff && (
          <button
            type="button"
            onClick={() => setActiveSubTab('approvals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'approvals'
                ? 'bg-[#FCCB0D] text-slate-900 font-extrabold shadow-sm ring-2 ring-white/30'
                : 'text-white hover:bg-slate-700'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Audit &amp; Edit Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-[#A71C21] text-white text-[10px] font-black rounded-full animate-bounce">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        )}
      </div>

      {activeSubTab === 'approvals' ? (
        <EditRequestsTab />
      ) : (
        <>
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
                  <span>Attendance Movement Logs &amp; Audit Trail</span>
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

        {/* Mobile Card List (< 640px) */}
        <div className="block sm:hidden divide-y divide-slate-100 p-2 space-y-2">
          {displayLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No attendance logs found matching these filters.
            </div>
          ) : (
            displayLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900">{log.target_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {log.target_id} · {log.target_type} · {log.classroom}
                    </div>
                  </div>

                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      log.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.status === 'Pending Edit Approval'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    <span>In: <strong>{log.check_in_time}</strong></span>
                    {log.check_out_time && (
                      <>
                        <span className="text-slate-400">·</span>
                        <span>Out: <strong>{log.check_out_time}</strong></span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{log.date}</span>
                </div>

                {log.pickup_dropoff_party && (
                  <div className="text-[10px] text-slate-500">
                    {log.pickup_dropoff_party.type}: <strong className="text-slate-700">{log.pickup_dropoff_party.name}</strong>
                    {log.early_departure_reason && ` (Early: ${log.early_departure_reason})`}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-400 truncate">
                    By: {log.scanned_by_name || log.scanned_by}
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(log)}
                      className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 rounded-lg transition"
                    >
                      {canDirectlyEditLogs ? 'Edit' : 'Request Edit'}
                    </button>
                    {canDirectlyEditLogs && (
                      <button
                        type="button"
                        onClick={() => openDeleteModal(log)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View (>= 640px) */}
        <div className="hidden sm:block divide-y divide-slate-100 overflow-x-auto">
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
              {displayLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No attendance logs found matching these filters.
                  </td>
                </tr>
              ) : (
                displayLogs.map((log) => (
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

        {/* Lightweight Pagination Toggle */}
        {filteredLogs.length > 25 && (
          <div className="p-3 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAllLogs(!showAllLogs)}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              {showAllLogs
                ? 'Show First 25 Records'
                : `Show All (${filteredLogs.length}) Logs`}
            </button>
          </div>
        )}
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
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Sign-Out / Releasing Option:
                    </label>
                    <select
                      value={
                        selectedLog.pickup_dropoff_party?.signOutOption ||
                        (editPartyType === 'Parent' ? 'Picked by parent' : 'Picked by Designate')
                      }
                      onChange={(e) => {
                        const opt = e.target.value as any;
                        if (opt === 'Picked by parent') {
                          setEditPartyType('Parent');
                          if (!editPartyName || editPartyName.includes('Alone')) {
                            setEditPartyName('Parent');
                          }
                        } else if (opt === 'Student went home alone') {
                          setEditPartyType('Designate');
                          setEditPartyName(`${selectedLog.target_name} (Self / Home Alone)`);
                        } else {
                          setEditPartyType('Designate');
                          if (!editPartyName || editPartyName === 'Parent' || editPartyName.includes('Alone')) {
                            setEditPartyName('');
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                    >
                      <option value="Picked by parent">1. Picked by parent</option>
                      <option value="Picked by Designate">2. Picked by Designate</option>
                      <option value="Dropped by designate">3. Dropped by designate</option>
                      <option value="Student went home alone">4. Student went home alone</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Releasing Person Full Name:
                    </label>
                    <input
                      type="text"
                      value={editPartyName}
                      onChange={(e) => setEditPartyName(e.target.value)}
                      placeholder="e.g. Parent or Designate Name"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-semibold text-slate-700">
                      Early Check-Out Reason (if before official time):
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {['Health reasons', 'Parent request', 'Child sent home', 'Enter reason'].map((reasonPreset) => (
                        <button
                          key={reasonPreset}
                          type="button"
                          onClick={() => {
                            if (reasonPreset !== 'Enter reason') {
                              setEditEarlyReason(reasonPreset);
                            } else {
                              if (editEarlyReason === 'Health reasons' || editEarlyReason === 'Parent request' || editEarlyReason === 'Child sent home') {
                                setEditEarlyReason('');
                              }
                            }
                          }}
                          className={`p-2 rounded-lg text-xs font-semibold border transition text-left ${
                            editEarlyReason === reasonPreset || (reasonPreset === 'Enter reason' && editEarlyReason && !['Health reasons', 'Parent request', 'Child sent home'].includes(editEarlyReason))
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {reasonPreset === 'Health reasons' && '1. Health reasons'}
                          {reasonPreset === 'Parent request' && '2. Parent request'}
                          {reasonPreset === 'Child sent home' && '3. Child sent home'}
                          {reasonPreset === 'Enter reason' && '4. Enter reason'}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={editEarlyReason}
                      onChange={(e) => setEditEarlyReason(e.target.value)}
                      placeholder="e.g. Health reasons, Parent request, Child sent home, or custom note..."
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

              {/* Urgent Alert Dispatch Option for Teachers & Assistants */}
              {!canDirectlyEditLogs && (
                <div className="bg-rose-50/90 p-3 rounded-xl border border-rose-200 flex items-start space-x-2.5">
                  <input
                    id="urgent-edit-checkbox"
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 accent-rose-600 cursor-pointer"
                  />
                  <label htmlFor="urgent-edit-checkbox" className="text-xs text-rose-950 cursor-pointer select-none">
                    <span className="font-bold flex items-center space-x-1.5 text-rose-800">
                      <span>Flag as Urgent Edit Request</span>
                      <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase tracking-wider">
                        FCM Push Alert
                      </span>
                    </span>
                    <span className="block text-[11px] text-rose-700/90 mt-0.5">
                      Sends an instant Firebase Cloud Messaging priority alert and sound notification directly to Principals and Directors.
                    </span>
                  </label>
                </div>
              )}
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
        </>
      )}
    </div>
  );
};
