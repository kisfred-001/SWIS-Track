import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import {
  School,
  Users,
  GraduationCap,
  Building,
  CheckCircle2,
  Clock,
  LogOut,
  LogIn,
  Search,
  Filter,
  Phone,
  Mail,
  UserCheck,
  Shield,
  Layers,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Campus, LearningCenter, Student, AttendanceLog } from '../types';

export const CampusesView: React.FC = () => {
  const {
    campuses,
    learningCenters,
    students,
    todayLogs,
    selectedCampus,
    setSelectedCampus,
    processScan,
  } = useAttendance();
  const { currentUser, allStaff, canScanStudents, isSupportStaff } = useAuth();

  // Active campus selection within this module
  const [activeCampusId, setActiveCampusId] = useState<string>(() => {
    if (selectedCampus && selectedCampus !== 'All Campuses') {
      const match = campuses.find((c) => c.name === selectedCampus);
      if (match) return match.id;
    }
    return campuses[0]?.id || 'spring-campus';
  });

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'learning_centers' | 'students' | 'staff' | 'logs'>('overview');
  const [selectedCenterFilter, setSelectedCenterFilter] = useState<string>('all');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const activeCampus = useMemo(() => {
    return campuses.find((c) => c.id === activeCampusId) || campuses[0];
  }, [campuses, activeCampusId]);

  // Fast O(1) map of today's attendance logs
  const todayLogsMap = useMemo(() => {
    const map = new Map<string, AttendanceLog>();
    for (let i = 0; i < todayLogs.length; i++) {
      map.set(todayLogs[i].target_id, todayLogs[i]);
    }
    return map;
  }, [todayLogs]);

  // Students enrolled in this campus
  const campusStudents = useMemo(() => {
    if (!activeCampus) return [];
    return students.filter((s) => s.campus === activeCampus.name);
  }, [students, activeCampus]);

  // Learning centers belonging to this campus
  const campusLearningCenters = useMemo(() => {
    if (!activeCampus) return [];
    return learningCenters.filter(
      (lc) =>
        lc.campus === activeCampus.name &&
        !(lc.name === 'Bethany' && lc.campus !== 'Hope Campus') &&
        lc.id !== 'spring-bethany'
    );
  }, [learningCenters, activeCampus]);

  // Staff assigned to this campus (or All Campuses)
  const campusStaff = useMemo(() => {
    if (!activeCampus) return [];
    return allStaff.filter(
      (st) => !st.campus || st.campus === activeCampus.name || st.campus === 'All Campuses'
    );
  }, [allStaff, activeCampus]);

  // Today's logs for this campus
  const campusTodayLogs = useMemo(() => {
    if (!activeCampus) return [];
    return todayLogs.filter((l) => l.campus === activeCampus.name);
  }, [todayLogs, activeCampus]);

  // Real-time premises metrics for this campus
  const metrics = useMemo(() => {
    let studentsPresent = 0;
    let studentsCheckedOut = 0;
    let staffPresent = 0;

    for (let i = 0; i < campusTodayLogs.length; i++) {
      const log = campusTodayLogs[i];
      if (log.target_type === 'Student') {
        if (log.check_out_time) {
          studentsCheckedOut++;
        } else {
          studentsPresent++;
        }
      } else if (log.target_type === 'Teacher') {
        if (!log.check_out_time) {
          staffPresent++;
        }
      }
    }

    const studentsTotal = campusStudents.length;
    const studentsAbsent = Math.max(0, studentsTotal - (studentsPresent + studentsCheckedOut));
    const attendanceRate = studentsTotal > 0
      ? Math.round(((studentsPresent + studentsCheckedOut) / studentsTotal) * 100)
      : 0;

    return {
      studentsTotal,
      studentsPresent,
      studentsCheckedOut,
      studentsAbsent,
      staffPresent,
      staffTotal: campusStaff.length,
      attendanceRate,
    };
  }, [campusStudents, campusTodayLogs, campusStaff]);

  // Filtered students within the campus
  const filteredStudents = useMemo(() => {
    const q = studentSearchQuery.trim().toLowerCase();
    return campusStudents.filter((s) => {
      const matchesCenter = selectedCenterFilter === 'all' || s.learning_center_id === selectedCenterFilter;
      const matchesSearch =
        !q ||
        s.full_name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q) ||
        s.pin_code.includes(q) ||
        (s.supervisor_name || '').toLowerCase().includes(q);
      return matchesCenter && matchesSearch;
    });
  }, [campusStudents, selectedCenterFilter, studentSearchQuery]);

  // Quick scan/action from table
  const handleQuickToggleAttendance = async (student: Student) => {
    if (!canScanStudents) return;
    setActionLoadingId(student.student_id);
    try {
      await processScan({ code: student.student_id });
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!activeCampus) {
    return <div className="p-8 text-center text-slate-500">Loading Campus Modules...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Campus Selector & Module Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Building className="w-6 h-6 text-indigo-600" />
            <span>Campus Modules & Learning Centers</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dedicated administrative modules for each campus, learning center, staff, and student roster.
          </p>
        </div>

        {/* Campus Switcher Pills */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
          {campuses.map((c) => {
            const isSelected = c.id === activeCampus.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActiveCampusId(c.id);
                  setSelectedCampus(c.name);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <School className="w-4 h-4" />
                <span>{c.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-indigo-500/40 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {c.code}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Campus Hero Information Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                Official Campus Module • {activeCampus.code}
              </span>
              <span className="text-xs text-slate-400 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Hours: {activeCampus.opening_time || '07:30 AM'} - {activeCampus.closing_time || '04:30 PM'}</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {activeCampus.name}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <div className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>{activeCampus.location}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Lead Administrator: <strong>{activeCampus.lead_administrator}</strong></span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-400" />
                <span>{activeCampus.phone}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeCampus.email}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 text-center">
            <div className="px-3 py-1">
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">Enrolled Students</div>
              <div className="text-xl font-black text-white">{metrics.studentsTotal}</div>
            </div>
            <div className="px-3 py-1 border-l border-slate-700">
              <div className="text-[10px] text-emerald-400 uppercase tracking-wide">On Premises</div>
              <div className="text-xl font-black text-emerald-400">{metrics.studentsPresent}</div>
            </div>
            <div className="px-3 py-1 border-l border-slate-700">
              <div className="text-[10px] text-sky-400 uppercase tracking-wide">Checked Out</div>
              <div className="text-xl font-black text-sky-400">{metrics.studentsCheckedOut}</div>
            </div>
            <div className="px-3 py-1 border-l border-slate-700">
              <div className="text-[10px] text-amber-400 uppercase tracking-wide">Absent</div>
              <div className="text-xl font-black text-amber-400">{metrics.studentsAbsent}</div>
            </div>
          </div>
        </div>

        {/* Live Attendance Rate Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-300 font-medium">Campus Daily Turnout:</span>
            <div className="w-48 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${metrics.attendanceRate}%` }}
              />
            </div>
            <span className="font-bold text-emerald-400">{metrics.attendanceRate}%</span>
          </div>
          <div className="text-slate-400">
            {metrics.staffPresent} of {metrics.staffTotal} assigned faculty present today
          </div>
        </div>
      </div>

      {/* Sub-Module Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`px-3 py-2 rounded-lg transition whitespace-nowrap ${
            activeSubTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Campus Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('learning_centers')}
          className={`px-3 py-2 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
            activeSubTab === 'learning_centers'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Learning Centers ({campusLearningCenters.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('students')}
          className={`px-3 py-2 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
            activeSubTab === 'students'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Students Roster ({campusStudents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('staff')}
          className={`px-3 py-2 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
            activeSubTab === 'staff'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Campus Staff ({campusStaff.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('logs')}
          className={`px-3 py-2 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
            activeSubTab === 'logs'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Today's Stream ({campusTodayLogs.length})</span>
        </button>
      </div>

      {/* Sub-Tab 1: Learning Centers Overview */}
      {(activeSubTab === 'overview' || activeSubTab === 'learning_centers') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Learning Centers in {activeCampus.name}</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Every supervisor and monitor has equal rights pertaining to their assigned learning center.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campusLearningCenters.map((lc) => {
              // Students in this specific learning center
              const lcStudents = campusStudents.filter((s) => s.learning_center_id === lc.name);
              let presentCount = 0;
              let checkedOutCount = 0;
              for (const s of lcStudents) {
                const log = todayLogsMap.get(s.student_id);
                if (log) {
                  if (log.check_out_time) checkedOutCount++;
                  else presentCount++;
                }
              }
              const absentCount = Math.max(0, lcStudents.length - (presentCount + checkedOutCount));

              return (
                <div
                  key={lc.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-indigo-300 transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h4 className="font-bold text-base text-slate-900">{lc.name}</h4>
                        <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                          {lc.room_number || 'Room'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{lc.description}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                      {lcStudents.length} / {lc.capacity || 25}
                    </span>
                  </div>

                  {/* Supervisor & Monitor Info */}
                  <div className="bg-slate-50 rounded-lg p-2.5 text-xs space-y-1.5 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Supervisor:</span>
                      <strong className="text-slate-800">
                        {lc.supervisor_name || <span className="text-slate-400 font-normal">None (Bethany only)</span>}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Monitor:</span>
                      <strong className="text-slate-800">{lc.monitor_name || '—'}</strong>
                    </div>
                  </div>

                  {/* Today's Center Attendance Pill Counter */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
                    <div className="bg-emerald-50 text-emerald-800 py-1 rounded-md border border-emerald-200/60 font-semibold">
                      {presentCount} Present
                    </div>
                    <div className="bg-sky-50 text-sky-800 py-1 rounded-md border border-sky-200/60 font-semibold">
                      {checkedOutCount} Left
                    </div>
                    <div className="bg-amber-50 text-amber-800 py-1 rounded-md border border-amber-200/60 font-semibold">
                      {absentCount} Absent
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCenterFilter(lc.name);
                      setActiveSubTab('students');
                    }}
                    className="w-full text-center text-xs text-indigo-600 hover:text-indigo-800 font-bold py-1.5 hover:bg-indigo-50 rounded-lg transition flex items-center justify-center space-x-1"
                  >
                    <span>View {lcStudents.length} Enrolled Students</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Enrolled Students Roster */}
      {activeSubTab === 'students' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Enrolled Students in {activeCampus.name} ({filteredStudents.length})
              </h3>
              <p className="text-xs text-slate-500">
                Official student body imported from school CSV records.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Learning Center Filter */}
              <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedCenterFilter}
                  onChange={(e) => setSelectedCenterFilter(e.target.value)}
                  className="bg-transparent focus:outline-none font-medium text-slate-700"
                >
                  <option value="all">All Learning Centers</option>
                  {campusLearningCenters.map((lc) => (
                    <option key={lc.id} value={lc.name}>
                      {lc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Search student or PIN..."
                  className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
                />
              </div>
            </div>
          </div>

          {/* Mobile Card List for Students (< 768px) */}
          <div className="block md:hidden divide-y divide-slate-100 p-2 space-y-2">
            {filteredStudents.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No students found in this campus.
              </div>
            ) : (
              filteredStudents.slice(0, 30).map((student) => {
                const log = todayLogsMap.get(student.student_id);
                const isPresent = log && !log.check_out_time;
                const isCheckedOut = log && Boolean(log.check_out_time);
                const isAbsent = !log;

                return (
                  <div
                    key={student.student_id}
                    className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900">{student.full_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ID: {student.student_id} · PIN: {student.pin_code}
                        </div>
                      </div>

                      <div>
                        {isPresent && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Present
                          </span>
                        )}
                        {isCheckedOut && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                            Left
                          </span>
                        )}
                        {isAbsent && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-600">
                            Absent
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span>Center: <strong>{student.learning_center_id}</strong></span>
                      <span className="text-slate-500">
                        {student.supervisor_name ? `Sup: ${student.supervisor_name}` : 'No Sup.'}
                      </span>
                    </div>

                    {canScanStudents && (
                      <button
                        type="button"
                        disabled={actionLoadingId === student.student_id}
                        onClick={() => handleQuickToggleAttendance(student)}
                        className={`w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                          isAbsent
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : isPresent
                            ? 'bg-sky-600 hover:bg-sky-700 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        <span>
                          {actionLoadingId === student.student_id
                            ? 'Processing...'
                            : isAbsent
                            ? 'Quick Check In'
                            : isPresent
                            ? 'Quick Check Out'
                            : 'Completed'}
                        </span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-2.5 text-left">Student</th>
                  <th className="px-4 py-2.5 text-left">Learning Center</th>
                  <th className="px-4 py-2.5 text-left">Supervisor</th>
                  <th className="px-4 py-2.5 text-left">Monitor</th>
                  <th className="px-4 py-2.5 text-center">PIN Code</th>
                  <th className="px-4 py-2.5 text-center">Today's Status</th>
                  <th className="px-4 py-2.5 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const log = todayLogsMap.get(student.student_id);
                  const isPresent = log && !log.check_out_time;
                  const isCheckedOut = log && Boolean(log.check_out_time);
                  const isAbsent = !log;

                  return (
                    <tr key={student.student_id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900">{student.full_name}</span>
                          {student.enrollment_type === 'Boarding' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              Boarding (Mon-Fri)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{student.student_id}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {student.learning_center_id}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {student.supervisor_name || <span className="text-slate-400 italic">None</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {student.monitor_name}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-600">
                        {student.pin_code}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isPresent && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                            On Premises ({log.check_in_time})
                          </span>
                        )}
                        {isCheckedOut && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                            Checked Out ({log.check_out_time})
                          </span>
                        )}
                        {isAbsent && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            Absent / Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canScanStudents && (
                          <button
                            type="button"
                            disabled={actionLoadingId === student.student_id}
                            onClick={() => handleQuickToggleAttendance(student)}
                            className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                              isAbsent
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : isPresent
                                ? 'bg-sky-600 hover:bg-sky-700 text-white'
                                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {actionLoadingId === student.student_id
                              ? 'Saving...'
                              : isAbsent
                              ? 'Check In'
                              : isPresent
                              ? 'Check Out'
                              : 'Completed'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Campus Staff & Assigned Faculty */}
      {activeSubTab === 'staff' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-900">
              Staff & Faculty Assigned to {activeCampus.name} ({campusStaff.length})
            </h3>
            <p className="text-xs text-slate-500">
              Administrators, Supervisors, Monitors, and Support Personnel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {campusStaff.map((staff) => {
              const log = todayLogsMap.get(staff.staff_id);
              const isPresent = log && !log.check_out_time;

              return (
                <div
                  key={staff.staff_id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition space-y-2 bg-slate-50/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{staff.full_name}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">ID: {staff.staff_id}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {staff.role}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-600 pt-1">
                    <div>Assignment: <strong>{staff.learning_center_id || staff.campus || 'Campus Wide'}</strong></div>
                    <div className="truncate">{staff.email}</div>
                    {staff.phone && <div>{staff.phone}</div>}
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Terminal PIN: <strong className="font-mono">{staff.pin_code}</strong></span>
                    {isPresent ? (
                      <span className="text-emerald-700 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Present</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Off-premises</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Today's Stream */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-900">
              Live Attendance Feed for {activeCampus.name} ({campusTodayLogs.length})
            </h3>
            <p className="text-xs text-slate-500">
              Real-time gate and classroom scan log for this campus today.
            </p>
          </div>

          {campusTodayLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No check-ins recorded yet for {activeCampus.name} today. Use the Quick Scan button to check in students!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {campusTodayLogs.map((log) => (
                <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        log.target_type === 'Student'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {log.target_type === 'Student' ? 'ST' : 'FC'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{log.target_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {log.classroom} • Scanned by: {log.scanned_by_name || log.scanned_by}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-slate-800">
                      In: <span className="text-emerald-700">{log.check_in_time}</span>
                      {log.check_out_time && (
                        <span> • Out: <span className="text-sky-700">{log.check_out_time}</span></span>
                      )}
                    </div>
                    {log.pickup_dropoff_party && (
                      <div className="text-[10px] text-slate-400">
                        Party: {log.pickup_dropoff_party.name} ({log.pickup_dropoff_party.type})
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
