import React, { useState, useMemo } from 'react';
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
  School,
  Bed,
} from 'lucide-react';
import { Student, Staff, AttendanceLog } from '../types';
import { getSchoolSchedule } from '../utils/schedule';

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
    filteredPremisesSummary,
    campuses,
    selectedCampus,
    setSelectedCampus,
    pendingRequestsCount,
    processScan,
    operationalPolicies,
  } = useAttendance();
  const { currentUser, allStaff, canScanTeachers } = useAuth();

  const [activeModule, setActiveModule] = useState<'students' | 'teachers'>('students');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'on_premises' | 'checked_out' | 'absent'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAllRecords, setShowAllRecords] = useState<boolean>(false);

  // Fast O(1) log lookup map by target_id
  const todayLogsMap = useMemo(() => {
    const map = new Map<string, AttendanceLog>();
    for (let i = 0; i < todayLogs.length; i++) {
      map.set(todayLogs[i].target_id, todayLogs[i]);
    }
    return map;
  }, [todayLogs]);

  // Extract unique classrooms (memoized)
  const classrooms = useMemo(() => {
    const relevantStudents =
      selectedCampus === 'All Campuses'
        ? students
        : students.filter((s) => s.campus === selectedCampus);
    return Array.from(new Set(relevantStudents.map((s) => s.learning_center_id))).filter(Boolean);
  }, [students, selectedCampus]);

  // Student status mapping for today (memoized O(1) lookup)
  const studentStatusList = useMemo(() => {
    return students.map((student) => {
      const log = todayLogsMap.get(student.student_id);
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
  }, [students, todayLogsMap]);

  // Filter students based on UI controls (memoized)
  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return studentStatusList.filter((item) => {
      const matchesCampus =
        selectedCampus === 'All Campuses' || item.student.campus === selectedCampus;

      const matchesSearch =
        !query ||
        item.student.full_name.toLowerCase().includes(query) ||
        item.student.student_id.toLowerCase().includes(query) ||
        item.student.pin_code.includes(query) ||
        (item.student.supervisor_name || '').toLowerCase().includes(query);

      const matchesClass =
        selectedClassroom === 'all' || item.student.learning_center_id === selectedClassroom;

      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter;

      return matchesCampus && matchesSearch && matchesClass && matchesStatus;
    });
  }, [studentStatusList, searchQuery, selectedCampus, selectedClassroom, statusFilter]);

  // Staff status mapping for today (memoized O(1) lookup)
  const staffStatusList = useMemo(() => {
    return allStaff.map((staff) => {
      const log = todayLogsMap.get(staff.staff_id);
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
  }, [allStaff, todayLogsMap]);

  const filteredStaff = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return staffStatusList.filter((item) => {
      const matchesCampus =
        selectedCampus === 'All Campuses' ||
        !item.staff.campus ||
        item.staff.campus === selectedCampus ||
        item.staff.campus === 'All Campuses';

      const matchesSearch =
        !query ||
        item.staff.full_name.toLowerCase().includes(query) ||
        item.staff.staff_id.toLowerCase().includes(query) ||
        item.staff.role.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'on_premises' && item.status === 'on_premises') ||
        (statusFilter === 'checked_out' && item.status === 'checked_out') ||
        (statusFilter === 'absent' && item.status === 'off_campus');

      return matchesCampus && matchesSearch && matchesStatus;
    });
  }, [staffStatusList, searchQuery, selectedCampus, statusFilter]);

  const displayStudents = useMemo(() => {
    return showAllRecords ? filteredStudents : filteredStudents.slice(0, 25);
  }, [filteredStudents, showAllRecords]);

  const displayStaff = useMemo(() => {
    return showAllRecords ? filteredStaff : filteredStaff.slice(0, 25);
  }, [filteredStaff, showAllRecords]);

  const schoolSchedule = getSchoolSchedule(new Date(), operationalPolicies);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* School Schedule & Operating Hours Bar */}
      <div className="bg-slate-900 text-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-[#8B1E2F] text-white">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-100 flex items-center space-x-2">
              <span>
                {operationalPolicies.schoolHours.enabled
                  ? `School Schedule: Mon–Thu ${operationalPolicies.schoolHours.mondayToThursday.openLabel || '7:00 AM'} – ${operationalPolicies.schoolHours.mondayToThursday.closeLabel || '4:30 PM'} • Fri ${operationalPolicies.schoolHours.friday.openLabel || '7:00 AM'} – ${operationalPolicies.schoolHours.friday.closeLabel || '2:00 PM'}`
                  : 'Official School Schedule Policy: Testing Mode (Schedule Unrestricted)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {operationalPolicies.boardingSchedule.enabled
                ? 'Springs Campus Boarding: Resident drop-off Monday 7:00 AM • Friday dismissal 2:00 PM (Enforced)'
                : 'Springs Campus Boarding: Policy disabled for system testing (Open check-in/out permitted)'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <span className="text-[10px] sm:text-xs font-mono px-2.5 py-1 rounded-full font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
            {schoolSchedule.statusBadgeText}
          </span>
        </div>
      </div>

      {/* Streamlined Core Stat Cards (Lightweight & Responsive 2x2 on Mobile, 4-col on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Students Present */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Students Present</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="mt-1.5 flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {filteredPremisesSummary.studentsOnPremises}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {filteredPremisesSummary.studentsTotal}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-700 mt-1 font-medium">
            {filteredPremisesSummary.studentsTotal > 0
              ? `${Math.round(
                  (filteredPremisesSummary.studentsOnPremises / filteredPremisesSummary.studentsTotal) * 100
                )}% on premises`
              : '0% present'}
          </p>
        </div>

        {/* Students Departed */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Departed</span>
            <LogOut className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="mt-1.5 flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">
              {filteredPremisesSummary.studentsCheckedOut}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">Checked out today</p>
        </div>

        {/* Students Absent */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Absent</span>
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="mt-1.5 flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {filteredPremisesSummary.studentsAbsent}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">Not scanned today</p>
        </div>

        {/* Staff Active */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Staff Active</span>
            <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="mt-1.5 flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
              {filteredPremisesSummary.staffOnPremises}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {filteredPremisesSummary.staffTotal}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-indigo-700 mt-1 font-medium">Faculty on duty</p>
        </div>
      </div>

      {/* Lightweight Status Sub-Bar (Enrolled & Pending Approvals) */}
      <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2 text-slate-600">
          <GraduationCap className="w-4 h-4 text-slate-400" />
          <span>
            Total Enrolled: <strong className="text-slate-900 font-bold">{filteredPremisesSummary.studentsTotal}</strong> students
            <span className="text-slate-400 ml-1">({selectedCampus})</span>
          </span>
        </div>

        {pendingRequestsCount > 0 ? (
          <button
            type="button"
            onClick={onNavigateToApprovals}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition font-medium text-xs"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span><strong>{pendingRequestsCount}</strong> Pending Edit Approvals</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        ) : (
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>All edit requests cleared</span>
          </div>
        )}
      </div>

      {/* Module Switcher & Filter Toolbar */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200/80 shadow-xs space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 sm:pb-4">
          {/* Main Module Tabs (Student Module vs Teacher Module) */}
          <div className="grid grid-cols-2 sm:flex items-center gap-1 sm:space-x-2 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setActiveModule('students');
                setStatusFilter('all');
              }}
              className={`flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeModule === 'students'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Student Module</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full font-mono">
                {premisesSummary.studentsTotal}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveModule('teachers');
                setStatusFilter('all');
              }}
              className={`flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeModule === 'teachers'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Teacher Module</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded-full font-mono">
                {premisesSummary.staffTotal}
              </span>
            </button>
          </div>

          {/* Quick Scanner Action */}
          <button
            type="button"
            onClick={onOpenScanner}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition active:scale-95"
          >
            <Scan className="w-4 h-4" />
            <span>Open Attendance Scanner</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 text-xs">
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
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Classroom filter for students */}
            {activeModule === 'students' && (
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none shrink-0"
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
            <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg shrink-0">
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
                Present
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
                Absent
              </button>
            </div>
          </div>
        </div>

        {/* Student Module List */}
        {activeModule === 'students' && (
          <div>
            {/* Mobile Card View (< 640px) */}
            <div className="block sm:hidden space-y-2.5">
              {displayStudents.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No students found matching current filters.
                </div>
              ) : (
                displayStudents.map(({ student, log, status }) => (
                  <div
                    key={student.student_id}
                    className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900">{student.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: {student.student_id} · PIN: {student.pin_code}
                        </div>
                      </div>

                      <div>
                        {status === 'on_premises' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1"></span>
                            Present
                          </span>
                        )}
                        {status === 'checked_out' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Departed
                          </span>
                        )}
                        {status === 'absent' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Absent
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1.5 border-t border-slate-200/60">
                      <div>
                        <span className="font-semibold text-slate-800">{student.learning_center_id}</span>
                        <span className="text-slate-400 mx-1">·</span>
                        <span>{student.campus}</span>
                      </div>
                      <div className="text-slate-500">
                        {log?.check_in_time ? `In: ${log.check_in_time}` : 'No check-in'}
                        {log?.check_out_time ? ` · Out: ${log.check_out_time}` : ''}
                      </div>
                    </div>

                    {log?.pickup_dropoff_party && (
                      <div className="text-[10px] text-slate-500">
                        {log.pickup_dropoff_party.type}: <strong className="text-slate-700">{log.pickup_dropoff_party.name}</strong>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={onOpenScanner}
                      className="w-full py-2 px-3 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 font-semibold text-xs flex items-center justify-center space-x-1.5 transition active:scale-[0.98]"
                    >
                      <Scan className="w-3.5 h-3.5" />
                      <span>{status === 'on_premises' ? 'Scan Out Student' : 'Scan In Student'}</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Desktop / Tablet Table View (>= 640px) */}
            <div className="hidden sm:block divide-y divide-slate-100 overflow-x-auto">
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
                  {displayStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No students found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    displayStudents.map(({ student, log, status }) => (
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
                          <div className="flex items-center space-x-1.5">
                            <span className="font-semibold text-slate-800">{student.learning_center_id}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                student.campus === 'Spring Campus'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {student.campus || 'Campus'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Sup: <strong className="text-slate-700">{student.supervisor_name}</strong>
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
                              Absent
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

            {/* Lightweight pagination / show all toggle */}
            {filteredStudents.length > 25 && (
              <div className="pt-3 text-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAllRecords(!showAllRecords)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  {showAllRecords
                    ? 'Show First 25 Records'
                    : `Show All (${filteredStudents.length}) Students`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Teacher Module List */}
        {activeModule === 'teachers' && (
          <div>
            {/* Mobile Card View (< 640px) */}
            <div className="block sm:hidden space-y-2.5">
              {displayStaff.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No staff members found matching filters.
                </div>
              ) : (
                displayStaff.map(({ staff, log, status }) => (
                  <div
                    key={staff.staff_id}
                    className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900">{staff.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: {staff.staff_id} · PIN: {staff.pin_code}
                        </div>
                      </div>

                      <div>
                        {status === 'on_premises' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1"></span>
                            On Campus
                          </span>
                        )}
                        {status === 'checked_out' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Departed
                          </span>
                        )}
                        {status === 'off_campus' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                            Off Campus
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1.5 border-t border-slate-200/60">
                      <div>
                        <span className="font-semibold text-slate-800">{staff.role}</span>
                        <span className="text-slate-400 mx-1">·</span>
                        <span>{staff.learning_center_id || 'Main Campus'}</span>
                      </div>
                      <div className="text-slate-500">
                        {log?.check_in_time ? `In: ${log.check_in_time}` : 'Not clocked in'}
                        {log?.check_out_time ? ` · Out: ${log.check_out_time}` : ''}
                      </div>
                    </div>

                    {canScanTeachers ? (
                      <button
                        type="button"
                        onClick={onOpenScanner}
                        className="w-full py-2 px-3 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 text-indigo-700 font-semibold text-xs flex items-center justify-center space-x-1.5 transition active:scale-[0.98]"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{status === 'on_premises' ? 'Clock Out Staff' : 'Clock In Staff'}</span>
                      </button>
                    ) : (
                      <div className="text-[10px] text-slate-400 text-center py-1 italic">
                        Teacher scan restricted per security policy
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Desktop / Tablet Table View (>= 640px) */}
            <div className="hidden sm:block divide-y divide-slate-100 overflow-x-auto">
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
                  {displayStaff.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No staff members found matching filters.
                      </td>
                    </tr>
                  ) : (
                    displayStaff.map(({ staff, log, status }) => (
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

            {/* Lightweight pagination / show all toggle */}
            {filteredStaff.length > 25 && (
              <div className="pt-3 text-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAllRecords(!showAllRecords)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  {showAllRecords
                    ? 'Show First 25 Records'
                    : `Show All (${filteredStaff.length}) Staff`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Streamlined Live Recent Scans Activity Ticker (Latest 4 records) */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Recent Activity Stream</span>
          </h3>
          <span className="text-[11px] text-slate-400">Live feed</span>
        </div>

        {todayLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">No scans recorded yet today.</p>
        ) : (
          <div className="space-y-2">
            {todayLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
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
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
