import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Clock,
  LogOut,
  LogIn,
  AlertCircle,
  Search,
  Filter,
  Scan,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Student, Staff, AttendanceLog } from '../types';

interface DashboardProps {
  onOpenScanner: () => void;
  onNavigateToApprovals: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenScanner,
  onNavigateToApprovals,
}) => {
  const {
    students,
    todayLogs,
    premisesSummary,
    pendingRequestsCount,
    processScan,
  } = useAttendance();
  const { currentUser, allStaff, canScanTeachers } = useAuth();

  const [activeModule, setActiveModule] = useState<'students' | 'teachers'>('students');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'on_premises' | 'checked_out' | 'absent'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique classrooms
  const classrooms = Array.from(new Set(students.map((s) => s.learning_center_id))).filter(Boolean);

  // Student status mapping for today
  const studentStatusList = students.map((student) => {
    const log = todayLogs.find((l) => l.target_id === student.student_id);
    let status: 'on_premises' | 'checked_out' | 'absent' = 'absent';
    if (log) {
      status = log.check_out_time ? 'checked_out' : 'on_premises';
    }
    return {
      student,
      log,
      status,
    };
  });

  // Filter students based on UI controls
  const filteredStudents = studentStatusList.filter((item) => {
    const matchesSearch =
      item.student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.student.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.student.pin_code.includes(searchQuery);

    const matchesClass =
      selectedClassroom === 'all' || item.student.learning_center_id === selectedClassroom;

    const matchesStatus =
      statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesClass && matchesStatus;
  });

  // Staff status mapping for today
  const staffStatusList = allStaff.map((staff) => {
    const log = todayLogs.find((l) => l.target_id === staff.staff_id);
    let status: 'on_premises' | 'checked_out' | 'off_campus' = 'off_campus';
    if (log) {
      status = log.check_out_time ? 'checked_out' : 'on_premises';
    }
    return {
      staff,
      log,
      status,
    };
  });

  const filteredStaff = staffStatusList.filter((item) => {
    const matchesSearch =
      item.staff.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.staff.staff_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.staff.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'on_premises' && item.status === 'on_premises') ||
      (statusFilter === 'checked_out' && item.status === 'checked_out') ||
      (statusFilter === 'absent' && item.status === 'off_campus');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Students On Premises */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Students Present</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-3xl font-extrabold text-emerald-600">
              {premisesSummary.studentsOnPremises}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {premisesSummary.studentsTotal}
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium">
            {premisesSummary.studentsTotal > 0
              ? `${Math.round(
                  (premisesSummary.studentsOnPremises / premisesSummary.studentsTotal) * 100
                )}% on premises`
              : '0%'}
          </p>
        </div>

        {/* Students Checked Out */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Students Departed</span>
            <LogOut className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-3xl font-extrabold text-blue-600">
              {premisesSummary.studentsCheckedOut}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Checked out today</p>
        </div>

        {/* Students Absent */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Students Absent</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-3xl font-extrabold text-amber-600">
              {premisesSummary.studentsAbsent}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Not scanned today</p>
        </div>

        {/* Staff On Premises */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Staff On Campus</span>
            <Briefcase className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-3xl font-extrabold text-indigo-600">
              {premisesSummary.staffOnPremises}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {premisesSummary.staffTotal}
            </span>
          </div>
          <p className="text-[11px] text-indigo-700 mt-1 font-medium">
            Faculty & Admin active
          </p>
        </div>

        {/* Total Registered */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Enrolled</span>
            <GraduationCap className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-3xl font-extrabold text-slate-900">
              {premisesSummary.studentsTotal}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across all centers</p>
        </div>

        {/* Pending Edit Approvals */}
        <div
          onClick={onNavigateToApprovals}
          className={`rounded-2xl p-4 border transition cursor-pointer ${
            pendingRequestsCount > 0
              ? 'bg-rose-50 border-rose-200 hover:bg-rose-100/70'
              : 'bg-white border-slate-200/80 shadow-sm hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Pending Approvals</span>
            <span
              className={`w-2 h-2 rounded-full ${
                pendingRequestsCount > 0 ? 'bg-rose-500 animate-ping' : 'bg-slate-300'
              }`}
            ></span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span
              className={`text-3xl font-extrabold ${
                pendingRequestsCount > 0 ? 'text-rose-600' : 'text-slate-700'
              }`}
            >
              {pendingRequestsCount}
            </span>
          </div>
          <p className="text-[11px] text-rose-700 mt-1 font-medium flex items-center space-x-1">
            <span>Requires Review</span>
            <ChevronRight className="w-3 h-3" />
          </p>
        </div>
      </div>

      {/* Module Switcher & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          {/* Main Module Tabs (Student Module vs Teacher Module) */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveModule('students');
                setStatusFilter('all');
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeModule === 'students'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>Student Module Dashboard</span>
              <span className="ml-1 text-[11px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full">
                {premisesSummary.studentsTotal}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveModule('teachers');
                setStatusFilter('all');
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeModule === 'teachers'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>Teacher Module Dashboard</span>
              <span className="ml-1 text-[11px] px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded-full">
                {premisesSummary.staffTotal}
              </span>
            </button>
          </div>

          {/* Quick Scanner Action */}
          <button
            type="button"
            onClick={onOpenScanner}
            className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <Scan className="w-4 h-4" />
            <span>Open Quick Scanner</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeModule === 'students'
                  ? 'Search student name, ID (STU-1001), PIN...'
                  : 'Search staff name, ID (STF-101), role...'
              }
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Classroom filter for students */}
          {activeModule === 'students' && (
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Learning Centers</option>
              {classrooms.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Status Pills */}
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('on_premises')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                statusFilter === 'on_premises'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              On Premises
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('checked_out')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                statusFilter === 'checked_out'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              Departed
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('absent')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                statusFilter === 'absent'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Not Here
            </button>
          </div>
        </div>

        {/* Student Module List */}
        {activeModule === 'students' && (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Student Name & ID</th>
                  <th className="py-2.5 px-3">Grade & Center</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Check-In</th>
                  <th className="py-2.5 px-3">Check-Out</th>
                  <th className="py-2.5 px-3">Drop-off / Pick-up Party</th>
                  <th className="py-2.5 px-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No students found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(({ student, log, status }) => (
                    <tr key={student.student_id} className="hover:bg-slate-50/80 transition">
                      {/* Name & ID */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{student.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: {student.student_id} • PIN: {student.pin_code}
                        </div>
                      </td>

                      {/* Grade & Center */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800">{student.grade}</span>
                        <div className="text-[11px] text-slate-500">
                          {student.learning_center_id}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {status === 'on_premises' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                            On Premises
                          </span>
                        )}
                        {status === 'checked_out' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>
                            Checked Out
                          </span>
                        )}
                        {status === 'absent' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                            Absent / Not Checked In
                          </span>
                        )}
                      </td>

                      {/* Check-In */}
                      <td className="py-3 px-3">
                        {log?.check_in_time ? (
                          <div className="flex items-center space-x-1 text-slate-800 font-medium">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{log.check_in_time}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Check-Out */}
                      <td className="py-3 px-3">
                        {log?.check_out_time ? (
                          <div className="flex items-center space-x-1 text-slate-800 font-medium">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>{log.check_out_time}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Party Info & Notes */}
                      <td className="py-3 px-3 max-w-[200px]">
                        {log?.pickup_dropoff_party ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-800 truncate">
                              <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded mr-1">
                                {log.pickup_dropoff_party.type}
                              </span>
                              {log.pickup_dropoff_party.name}
                            </div>
                            {log.early_departure_reason && (
                              <div className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 truncate">
                                Early: {log.early_departure_reason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Parent: {student.parent_names}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={onOpenScanner}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-blue-600 font-semibold transition inline-flex items-center space-x-1 text-[11px]"
                        >
                          <Scan className="w-3 h-3" />
                          <span>{status === 'on_premises' ? 'Scan Out' : 'Scan In'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Teacher Module List */}
        {activeModule === 'teachers' && (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Staff Member & ID</th>
                  <th className="py-2.5 px-3">Role & Assignment</th>
                  <th className="py-2.5 px-3">Campus Status</th>
                  <th className="py-2.5 px-3">Arrival Time</th>
                  <th className="py-2.5 px-3">Departure Time</th>
                  <th className="py-2.5 px-3">Logged By</th>
                  <th className="py-2.5 px-3 text-right">Register Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No staff members found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map(({ staff, log, status }) => (
                    <tr key={staff.staff_id} className="hover:bg-slate-50/80 transition">
                      {/* Name & ID */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{staff.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: {staff.staff_id} • PIN: {staff.pin_code}
                        </div>
                      </td>

                      {/* Role & Center */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800">{staff.role}</span>
                        <div className="text-[11px] text-slate-500">
                          {staff.learning_center_id || 'Main Campus'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {status === 'on_premises' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                            On Campus
                          </span>
                        )}
                        {status === 'checked_out' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>
                            Departed Campus
                          </span>
                        )}
                        {status === 'off_campus' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Off Campus Today
                          </span>
                        )}
                      </td>

                      {/* Check-In */}
                      <td className="py-3 px-3">
                        {log?.check_in_time ? (
                          <div className="flex items-center space-x-1 text-slate-800 font-medium">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{log.check_in_time}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Check-Out */}
                      <td className="py-3 px-3">
                        {log?.check_out_time ? (
                          <div className="flex items-center space-x-1 text-slate-800 font-medium">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>{log.check_out_time}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Logged by */}
                      <td className="py-3 px-3 text-slate-500">
                        {log?.scanned_by_name || log?.scanned_by || '—'}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        {canScanTeachers ? (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenScanner();
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-indigo-600 font-semibold transition inline-flex items-center space-x-1 text-[11px]"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>
                              {status === 'on_premises' ? 'Clock Out' : 'Clock In'}
                            </span>
                          </button>
                        ) : (
                          <span
                            title="Teachers cannot scan staff in/out per security policy"
                            className="text-[11px] text-slate-400 italic cursor-not-allowed"
                          >
                            Restricted
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live Recent Scans Activity Ticker */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
        <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Today's Live Activity Stream</span>
        </h3>

        {todayLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">No scans recorded yet today.</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {todayLogs.slice(0, 8).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      log.target_type === 'Student'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {log.target_type === 'Student' ? 'S' : 'T'}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">
                      {log.target_name}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({log.target_type})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {log.check_out_time
                        ? `Departed at ${log.check_out_time}`
                        : `Arrived at ${log.check_in_time}`}
                      {log.pickup_dropoff_party &&
                        ` • ${log.pickup_dropoff_party.type}: ${log.pickup_dropoff_party.name}`}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                      log.status === 'Pending Edit Approval'
                        ? 'bg-amber-100 text-amber-800'
                        : log.status === 'Edited'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {log.status}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    By: {log.scanned_by_name || log.scanned_by}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
