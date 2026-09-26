import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { AttendanceLog } from '../types';
import { RefreshButton } from './RefreshButton';
import { EditModal } from './EditModal';
import {
  GraduationCap,
  Calendar,
  Building,
  School,
  Search,
  Edit2,
  Lock,
  CheckCircle2,
  Clock,
  LogOut,
  Filter,
  RefreshCw,
  UserCheck,
} from 'lucide-react';

export const StudentAttendanceTable: React.FC = () => {
  const {
    logs,
    students,
    campuses,
    learningCenters,
    selectedCampus,
    setSelectedCampus,
    forceSyncLogs,
    isRefreshingLogs,
    lastSyncTime,
  } = useAttendance();
  const { currentUser, canDirectlyEditLogs } = useAuth();

  // Filter state
  const [dateFilter, setDateFilter] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [learningCenterFilter, setLearningCenterFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked_in' | 'checked_out'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Log for Edit Modal
  const [editingLog, setEditingLog] = useState<AttendanceLog | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filter student logs
  const studentLogs = useMemo(() => {
    return logs.filter((log) => log.target_type === 'Student' && log.status !== 'Deleted');
  }, [logs]);

  // Apply instant filters
  const filteredStudentLogs = useMemo(() => {
    const queryStr = searchQuery.trim().toLowerCase();

    return studentLogs.filter((log) => {
      // Date filter
      if (dateFilter && log.date !== dateFilter) return false;

      // Campus filter
      if (selectedCampus !== 'All Campuses') {
        if (log.campus && log.campus !== selectedCampus) return false;
      }

      // Learning center filter
      if (learningCenterFilter !== 'all') {
        if (
          log.classroom !== learningCenterFilter &&
          log.grade_or_role !== learningCenterFilter
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === 'checked_in') {
        if (log.check_out_time) return false;
      } else if (statusFilter === 'checked_out') {
        if (!log.check_out_time) return false;
      }

      // Search query filter (Student Name, PIN, ID No)
      if (queryStr) {
        // Find matching student pin from roster if log target_id maps to student
        const matchedStudent = students.find((s) => s.student_id === log.target_id);
        const pinCode = matchedStudent?.pin_code || '';

        const match =
          (log.target_name || '').toLowerCase().includes(queryStr) ||
          (log.target_id || '').toLowerCase().includes(queryStr) ||
          pinCode.includes(queryStr) ||
          (log.classroom || '').toLowerCase().includes(queryStr);

        if (!match) return false;
      }

      return true;
    });
  }, [
    studentLogs,
    dateFilter,
    selectedCampus,
    learningCenterFilter,
    statusFilter,
    searchQuery,
    students,
  ]);

  // Metrics summary
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayStudentLogs = studentLogs.filter((l) => l.date === todayStr);

    const checkedIn = todayStudentLogs.filter((l) => !l.check_out_time).length;
    const checkedOut = todayStudentLogs.filter((l) => l.check_out_time !== null).length;

    return {
      totalCaptured: todayStudentLogs.length,
      checkedIn,
      checkedOut,
    };
  }, [studentLogs]);

  const handleOpenEdit = (log: AttendanceLog) => {
    setEditingLog(log);
    setIsEditModalOpen(true);
  };

  const isAuthorizedToEdit = canDirectlyEditLogs || ['Administrator', 'ICCE Coordinator', 'Coordinator', 'Principal', 'Director'].includes(currentUser?.role || '');

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner & Command Controls */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <GraduationCap className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-white tracking-tight">
                Student Attendance Datasheet
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                Firestore Real-Time
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Live tracking datasheet for all Spirit &amp; Word students across campuses and learning centers.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end md:self-auto shrink-0">
          <RefreshButton
            onRefresh={forceSyncLogs}
            isRefreshing={isRefreshingLogs}
            lastSyncTime={lastSyncTime}
            label="Re-sync Datasheet"
            variant="dark"
            size="md"
          />
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Total Captured Today</span>
            <span className="text-2xl font-black text-slate-900">{metrics.totalCaptured}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700 block uppercase tracking-wider">Checked In / Active</span>
            <span className="text-2xl font-black text-emerald-900">{metrics.checkedIn}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-blue-200 bg-blue-50/20 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-700 block uppercase tracking-wider">Checked Out</span>
            <span className="text-2xl font-black text-blue-900">{metrics.checkedOut}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
            <LogOut className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Control Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Search &amp; Filter Controls</span>
          </div>
          <span className="text-slate-400 font-medium">
            Showing {filteredStudentLogs.length} of {studentLogs.length} student records
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Date Picker Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-indigo-600" />
              <span>Date Captured</span>
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Campus Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center space-x-1">
              <School className="w-3 h-3 text-indigo-600" />
              <span>Campus</span>
            </label>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="All Campuses">All Campuses</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Learning Center Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center space-x-1">
              <Building className="w-3 h-3 text-indigo-600" />
              <span>Learning Center</span>
            </label>
            <select
              value={learningCenterFilter}
              onChange={(e) => setLearningCenterFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Learning Centers</option>
              {learningCenters.map((lc) => (
                <option key={lc.id} value={lc.name}>
                  {lc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center space-x-1">
              <UserCheck className="w-3 h-3 text-indigo-600" />
              <span>Status</span>
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="checked_in">Checked In / Active</option>
              <option value="checked_out">Checked Out</option>
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center space-x-1">
              <Search className="w-3 h-3 text-indigo-600" />
              <span>Search Name / ID / PIN</span>
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student..."
              className="w-full bg-white border border-slate-300 text-black font-semibold placeholder:text-slate-500 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Datasheet Table View */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-3">PIN</th>
                <th className="py-3.5 px-3">ID No</th>
                <th className="py-3.5 px-3">Campus</th>
                <th className="py-3.5 px-3">Learning Center</th>
                <th className="py-3.5 px-3">Date Captured</th>
                <th className="py-3.5 px-3">Time Signed In</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Time Checked Out</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-xs font-medium">
              {filteredStudentLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600 text-sm">No student attendance records match your current filter criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing or adjusting the date picker or search bar.</p>
                  </td>
                </tr>
              ) : (
                filteredStudentLogs.map((log) => {
                  const student = students.find((s) => s.student_id === log.target_id);
                  const pinCode = student?.pin_code || '---';

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      {/* Student Name */}
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center shrink-0 text-xs shadow-xs">
                          {log.target_name.charAt(0)}
                        </div>
                        <div>
                          <span className="block font-extrabold text-slate-900 leading-tight">
                            {log.target_name}
                          </span>
                          {log.audit_note && (
                            <span className="text-[10px] text-amber-600 font-mono block italic mt-0.5">
                              Note: {log.audit_note}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* PIN */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {pinCode}
                      </td>

                      {/* ID No */}
                      <td className="py-3 px-3 font-mono font-semibold text-indigo-600">
                        {log.target_id}
                      </td>

                      {/* Campus */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {log.campus || 'Spring Campus'}
                        </span>
                      </td>

                      {/* Learning Center */}
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {log.classroom || log.grade_or_role || 'Main Center'}
                      </td>

                      {/* Date Captured */}
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {log.date}
                      </td>

                      {/* Time Signed In */}
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                        {log.check_in_time}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {log.check_out_time ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
                            Checked Out
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                            Checked In
                          </span>
                        )}
                      </td>

                      {/* Time Checked Out */}
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {log.check_out_time ? (
                          <span className="font-bold text-blue-700">{log.check_out_time}</span>
                        ) : (
                          <span className="text-slate-400 italic">-- : --</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {isAuthorizedToEdit ? (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(log)}
                            title="Manual Override / Edit Record"
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer border border-indigo-200"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(log)}
                            title="Teacher Read-Only View"
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-400 cursor-pointer hover:bg-slate-200 transition"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Override Edit Modal */}
      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingLog(null);
        }}
        log={editingLog}
      />
    </div>
  );
};
