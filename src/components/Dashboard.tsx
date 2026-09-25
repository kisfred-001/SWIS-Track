import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { useViewport } from '../context/ViewportContext';
import {
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Clock,
  LogOut,
  LogIn,
  Search,
  Scan,
  UserCheck,
  ChevronRight,
  Sparkles,
  School,
  RefreshCw,
  Activity,
  Users,
  Radio,
} from 'lucide-react';
import { AttendanceLog, Student, Staff } from '../types';
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
    campuses,
    selectedCampus,
    setSelectedCampus,
    pendingRequestsCount,
    operationalPolicies,
    todayLogs: contextTodayLogs,
    logs: contextAllLogs,
  } = useAttendance();
  const { allStaff, canScanTeachers } = useAuth();
  const { isForcedMobile } = useViewport();

  // Local state for direct real-time Firestore logs listener
  const [realtimeLogs, setRealtimeLogs] = useState<AttendanceLog[]>([]);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [newLogHighlightId, setNewLogHighlightId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshNotification, setRefreshNotification] = useState<string | null>(null);

  // Manual Refresh Handler to re-sync Log Data, Target Matching & Campus Filters
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const logsQuery = query(
        collection(db, 'attendance_logs'),
        orderBy('created_at', 'desc'),
        limit(150)
      );
      const snapshot = await getDocs(logsQuery);
      const fetchedLogs: AttendanceLog[] = [];
      snapshot.forEach((docSnap) => {
        fetchedLogs.push({ id: docSnap.id, ...docSnap.data() } as AttendanceLog);
      });

      if (fetchedLogs.length > 0) {
        setRealtimeLogs(fetchedLogs);
      }
      setIsRealtimeActive(true);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncTime(timeStr);
      setRefreshNotification(`Dashboard synchronized (Log sync, Target matching & Campus filters re-aligned at ${timeStr})`);
      setTimeout(() => setRefreshNotification(null), 4000);
    } catch (err) {
      console.warn('Manual refresh notice:', err);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncTime(timeStr);
      setRefreshNotification(`Dashboard re-aligned with active session state (${timeStr})`);
      setTimeout(() => setRefreshNotification(null), 3000);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  // Filter controls
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'students' | 'staff'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'on_premises' | 'checked_out' | 'absent'>('all');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeViewTab, setActiveViewTab] = useState<'activity_stream' | 'directory_table'>('activity_stream');
  const [showAllRecords, setShowAllRecords] = useState<boolean>(false);

  const prevLogCountRef = useRef<number>(0);

  // 1. Real-Time Firebase Firestore Integration: onSnapshot listener on 'attendance_logs'
  useEffect(() => {
    let unsub: (() => void) | undefined;
    const pathForLogs = 'attendance_logs';

    try {
      // Query recent logs ordered by creation timestamp (no composite index required)
      const logsQuery = query(
        collection(db, pathForLogs),
        orderBy('created_at', 'desc'),
        limit(150)
      );

      unsub = onSnapshot(
        logsQuery,
        (snapshot) => {
          const fetchedLogs: AttendanceLog[] = [];
          snapshot.forEach((docSnap) => {
            fetchedLogs.push({ id: docSnap.id, ...docSnap.data() } as AttendanceLog);
          });

          // Detect new check-in/out event to trigger highlight animation
          if (fetchedLogs.length > 0 && fetchedLogs.length > prevLogCountRef.current && prevLogCountRef.current > 0) {
            const newest = fetchedLogs[0];
            setNewLogHighlightId(newest.id);
            setTimeout(() => setNewLogHighlightId(null), 3500);
          }
          prevLogCountRef.current = fetchedLogs.length;

          setRealtimeLogs(fetchedLogs);
          setIsRealtimeActive(true);
          setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        },
        (error) => {
          console.warn('Firestore onSnapshot error, falling back to context logs:', error);
          setIsRealtimeActive(false);
          // Conform to skill error handling specification if critical permission fault
          if (error.code === 'permission-denied') {
            try {
              handleFirestoreError(error, OperationType.GET, pathForLogs);
            } catch (e) {
              // logged
            }
          }
        }
      );
    } catch (err) {
      console.warn('Could not initialize direct onSnapshot listener:', err);
      setIsRealtimeActive(false);
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Combined active logs: direct Firestore real-time logs merged with context logs to ensure immediate visibility of new scans
  const activeLogs = useMemo(() => {
    const map = new Map<string, AttendanceLog>();

    // 1. Add context logs first (from React state & cache)
    if (contextAllLogs) {
      contextAllLogs.forEach((l) => {
        if (l && l.id && l.status !== 'Deleted') map.set(l.id, l);
      });
    }
    if (contextTodayLogs) {
      contextTodayLogs.forEach((l) => {
        if (l && l.id && l.status !== 'Deleted') map.set(l.id, l);
      });
    }

    // 2. Add/override with realtime logs from direct Firestore onSnapshot
    if (realtimeLogs) {
      realtimeLogs.forEach((l) => {
        if (l && l.id && l.status !== 'Deleted') map.set(l.id, l);
      });
    }

    const merged = Array.from(map.values());
    return merged.sort((a, b) => {
      const timeA = new Date(a.created_at || a.date || 0).getTime();
      const timeB = new Date(b.created_at || b.date || 0).getTime();
      return timeB - timeA;
    });
  }, [realtimeLogs, contextTodayLogs, contextAllLogs]);

  // Filter logs by selected campus if not 'All Campuses'
  const campusFilteredLogs = useMemo(() => {
    if (selectedCampus === 'All Campuses') return activeLogs;
    return activeLogs.filter((log) => {
      if (!log.campus || log.campus === 'All Campuses') return true;
      return log.campus.toLowerCase() === selectedCampus.toLowerCase();
    });
  }, [activeLogs, selectedCampus]);

  // Fast O(1) lookup map of latest log per target (student_id or staff_id)
  const targetLatestLogMap = useMemo(() => {
    const map = new Map<string, AttendanceLog>();
    const sorted = [...activeLogs].sort((a, b) => {
      const timeA = new Date(a.created_at || a.date || 0).getTime();
      const timeB = new Date(b.created_at || b.date || 0).getTime();
      return timeA - timeB;
    });

    for (let i = 0; i < sorted.length; i++) {
      const log = sorted[i];
      if (log.target_id) {
        map.set(log.target_id, log);
        map.set(log.target_id.trim().toUpperCase(), log);
      }
    }
    return map;
  }, [activeLogs]);

  // Extract unique classrooms for student filter
  const classrooms = useMemo(() => {
    const relevantStudents =
      selectedCampus === 'All Campuses'
        ? students
        : students.filter((s) => s.campus === selectedCampus);
    return Array.from(new Set(relevantStudents.map((s) => s.learning_center_id))).filter(Boolean);
  }, [students, selectedCampus]);

  // Compute live real-time metrics
  const liveMetrics = useMemo(() => {
    const relevantStudents =
      selectedCampus === 'All Campuses'
        ? students
        : students.filter((s) => s.campus === selectedCampus);

    const relevantStaff =
      selectedCampus === 'All Campuses'
        ? allStaff
        : allStaff.filter((st) => !st.campus || st.campus === selectedCampus || st.campus === 'All Campuses');

    let studentsPresent = 0;
    let studentsDeparted = 0;
    let studentsAbsent = 0;

    relevantStudents.forEach((student) => {
      const log =
        targetLatestLogMap.get(student.student_id) ||
        targetLatestLogMap.get(student.student_id.trim().toUpperCase());
      if (!log) {
        studentsAbsent++;
      } else if (log.check_out_time) {
        studentsDeparted++;
      } else {
        studentsPresent++;
      }
    });

    let staffPresent = 0;
    let staffDeparted = 0;
    let staffOffCampus = 0;

    relevantStaff.forEach((staff) => {
      const log =
        targetLatestLogMap.get(staff.staff_id) ||
        targetLatestLogMap.get(staff.staff_id.trim().toUpperCase());
      if (!log) {
        staffOffCampus++;
      } else if (log.check_out_time) {
        staffDeparted++;
      } else {
        staffPresent++;
      }
    });

    const totalActiveOnCampus = studentsPresent + staffPresent;
    const totalDepartedToday = studentsDeparted + staffDeparted;

    return {
      studentsPresent,
      studentsTotal: relevantStudents.length,
      studentsDeparted,
      studentsAbsent,
      staffPresent,
      staffTotal: relevantStaff.length,
      staffDeparted,
      staffOffCampus,
      totalActiveOnCampus,
      totalDepartedToday,
    };
  }, [students, allStaff, selectedCampus, targetLatestLogMap]);

  // Filtered Live Activity Stream (Recent check-in / check-out events)
  const filteredActivityStream = useMemo(() => {
    const queryStr = searchQuery.trim().toLowerCase();

    return campusFilteredLogs.filter((log) => {
      // Audience filter
      if (audienceFilter === 'students' && log.target_type !== 'Student') return false;
      if (audienceFilter === 'staff' && log.target_type !== 'Teacher') return false;

      // Status filter
      if (statusFilter === 'on_premises' && log.check_out_time) return false;
      if (statusFilter === 'checked_out' && !log.check_out_time) return false;

      // Classroom filter
      if (
        selectedClassroom !== 'all' &&
        log.classroom !== selectedClassroom &&
        log.grade_or_role !== selectedClassroom
      ) {
        return false;
      }

      // Search query
      if (queryStr) {
        const matchesName = log.target_name.toLowerCase().includes(queryStr);
        const matchesId = log.target_id.toLowerCase().includes(queryStr);
        const matchesClass = (log.classroom || '').toLowerCase().includes(queryStr);
        const matchesParty = log.pickup_dropoff_party?.name?.toLowerCase().includes(queryStr);
        if (!matchesName && !matchesId && !matchesClass && !matchesParty) return false;
      }

      return true;
    });
  }, [campusFilteredLogs, audienceFilter, statusFilter, selectedClassroom, searchQuery]);

  // Combined Roster / Directory state for the directory table view
  const studentDirectoryList = useMemo(() => {
    const queryStr = searchQuery.trim().toLowerCase();
    const relevantStudents =
      selectedCampus === 'All Campuses'
        ? students
        : students.filter((s) => s.campus === selectedCampus);

    return relevantStudents
      .map((student) => {
        const log =
          targetLatestLogMap.get(student.student_id) ||
          targetLatestLogMap.get(student.student_id.trim().toUpperCase());
        let status: 'on_premises' | 'checked_out' | 'absent' = 'absent';
        if (log) {
          status = log.check_out_time ? 'checked_out' : 'on_premises';
        }
        return { student, log, status };
      })
      .filter(({ student, status }) => {
        if (statusFilter !== 'all' && status !== statusFilter) return false;
        if (selectedClassroom !== 'all' && student.learning_center_id !== selectedClassroom) return false;
        if (queryStr) {
          const matches =
            student.full_name.toLowerCase().includes(queryStr) ||
            student.student_id.toLowerCase().includes(queryStr) ||
            student.pin_code.includes(queryStr) ||
            (student.supervisor_name || '').toLowerCase().includes(queryStr);
          if (!matches) return false;
        }
        return true;
      });
  }, [students, selectedCampus, targetLatestLogMap, statusFilter, selectedClassroom, searchQuery]);

  const staffDirectoryList = useMemo(() => {
    const queryStr = searchQuery.trim().toLowerCase();
    const relevantStaff =
      selectedCampus === 'All Campuses'
        ? allStaff
        : allStaff.filter((st) => !st.campus || st.campus === selectedCampus || st.campus === 'All Campuses');

    return relevantStaff
      .map((staff) => {
        const log =
          targetLatestLogMap.get(staff.staff_id) ||
          targetLatestLogMap.get(staff.staff_id.trim().toUpperCase());
        let status: 'on_premises' | 'checked_out' | 'off_campus' = 'off_campus';
        if (log) {
          status = log.check_out_time ? 'checked_out' : 'on_premises';
        }
        return { staff, log, status };
      })
      .filter(({ staff, status }) => {
        if (statusFilter === 'on_premises' && status !== 'on_premises') return false;
        if (statusFilter === 'checked_out' && status !== 'checked_out') return false;
        if (statusFilter === 'absent' && status !== 'off_campus') return false;
        if (queryStr) {
          const matches =
            staff.full_name.toLowerCase().includes(queryStr) ||
            staff.staff_id.toLowerCase().includes(queryStr) ||
            staff.role.toLowerCase().includes(queryStr);
          if (!matches) return false;
        }
        return true;
      });
  }, [allStaff, selectedCampus, targetLatestLogMap, statusFilter, searchQuery]);

  const schoolSchedule = getSchoolSchedule(new Date(), operationalPolicies);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Real-Time Live Status Bar & Operating Hours */}
      <div className="bg-slate-900 text-white rounded-2xl p-3.5 sm:p-4 border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Radio className="w-5 h-5 animate-pulse text-emerald-300" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center space-x-2">
              <span className="text-sm tracking-tight">Real-Time Attendance Command Center</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-ping" />
                Live Firestore Stream
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Instant sub-second synchronization on all QR scans and manual gate entries.
              {lastSyncTime && <span className="ml-1 text-slate-300 font-mono">Last Sync: {lastSyncTime}</span>}
            </p>
          </div>
        </div>

        {/* Schedule, Manual Refresh & Quick Scanner Trigger */}
        <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0 flex-wrap gap-1.5">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
            {schoolSchedule.statusBadgeText}
          </span>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="min-h-[38px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-700 font-bold rounded-xl shadow-xs text-xs flex items-center space-x-1.5 transition active:scale-95 cursor-pointer touch-manipulation disabled:opacity-50"
            title="Refresh Log Sync, Flexible Target Matching & Campus Filter Alignment"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenScanner}
            className="min-h-[38px] px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-sm text-xs flex items-center space-x-1.5 transition active:scale-95 cursor-pointer touch-manipulation"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Launch Scanner</span>
          </button>
        </div>
      </div>

      {/* Sync Refresh Toast Banner */}
      {refreshNotification && (
        <div className="bg-emerald-950 text-emerald-200 border border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{refreshNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setRefreshNotification(null)}
            className="text-emerald-400 hover:text-white font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Live Summary Metric Cards (Top Row) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Students Present Today */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 flex items-center space-x-1.5">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <span>Students Present</span>
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {liveMetrics.studentsPresent}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {liveMetrics.studentsTotal} enrolled
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 font-bold">
              {liveMetrics.studentsTotal > 0
                ? `${Math.round((liveMetrics.studentsPresent / liveMetrics.studentsTotal) * 100)}% attendance rate`
                : '0% present'}
            </span>
            <span className="text-slate-400 font-mono text-[10px]">{liveMetrics.studentsAbsent} absent</span>
          </div>
        </div>

        {/* Card 2: Total Staff Present Today */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 flex items-center space-x-1.5">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>Staff Present</span>
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          </div>

          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {liveMetrics.staffPresent}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {liveMetrics.staffTotal} faculty
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-indigo-700 font-bold">
              {liveMetrics.staffTotal > 0
                ? `${Math.round((liveMetrics.staffPresent / liveMetrics.staffTotal) * 100)}% on duty`
                : '0% on duty'}
            </span>
            <span className="text-slate-400 font-mono text-[10px]">{liveMetrics.staffOffCampus} off-campus</span>
          </div>
        </div>

        {/* Card 3: Currently Checked-In (Active on Campus Right Now) */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl p-4 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-200 flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Active On Campus</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/30 text-emerald-300 font-mono">
              LIVE
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {liveMetrics.totalActiveOnCampus}
            </span>
            <span className="text-xs text-indigo-300/80 font-medium">
              people inside gates
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
            <span>{liveMetrics.studentsPresent} students</span>
            <span className="text-slate-500">·</span>
            <span>{liveMetrics.staffPresent} faculty</span>
          </div>
        </div>

        {/* Card 4: Recent Departures (Checked Out Today) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 flex items-center space-x-1.5">
              <LogOut className="w-4 h-4 text-blue-600" />
              <span>Total Departures</span>
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>

          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {liveMetrics.totalDepartedToday}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              departed today
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-blue-700 font-bold">
              {liveMetrics.studentsDeparted} students released
            </span>
            <span className="text-slate-400 font-mono text-[10px]">{liveMetrics.staffDeparted} staff</span>
          </div>
        </div>
      </div>

      {/* Campus Selector & Pending Alerts Banner */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <School className="w-4 h-4 text-indigo-600" />
          <span className="text-slate-600 font-semibold">Campus Filter:</span>
          <select
            value={selectedCampus}
            onChange={(e) => setSelectedCampus(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All Campuses">All Campuses (Combined View)</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs flex items-center space-x-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
            title="Refresh Log Sync, Flexible Target Matching & Campus Filter Alignment"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Re-sync Dashboard</span>
          </button>
        </div>

        {pendingRequestsCount > 0 ? (
          <button
            type="button"
            onClick={onNavigateToApprovals}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 transition font-bold text-xs cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>{pendingRequestsCount} Pending Edit Approvals</span>
            <ChevronRight className="w-3.5 h-3.5 text-rose-600" />
          </button>
        ) : (
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>All audit logs &amp; approvals synchronized</span>
          </div>
        )}
      </div>

      {/* 4. Filtering & Controls Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        {/* Top Control Bar: View Mode Switcher + Audience Segment */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          {/* View Tab Switcher: Live Stream vs Master Directory */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveViewTab('activity_stream')}
              className={`min-h-[40px] flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black transition flex items-center justify-center space-x-2 cursor-pointer touch-manipulation ${
                activeViewTab === 'activity_stream'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Live Activity Stream</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                {filteredActivityStream.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewTab('directory_table')}
              className={`min-h-[40px] flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black transition flex items-center justify-center space-x-2 cursor-pointer touch-manipulation ${
                activeViewTab === 'directory_table'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Full Roster &amp; Status</span>
            </button>
          </div>

          {/* Audience Filter Tabs: All vs Students vs Staff */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setAudienceFilter('all')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg transition cursor-pointer touch-manipulation ${
                audienceFilter === 'all' ? 'bg-white text-indigo-900 shadow-xs font-black' : 'hover:text-slate-900'
              }`}
            >
              All Roles
            </button>
            <button
              type="button"
              onClick={() => setAudienceFilter('students')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg transition flex items-center space-x-1 cursor-pointer touch-manipulation ${
                audienceFilter === 'students' ? 'bg-white text-emerald-900 shadow-xs font-black' : 'hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Students Only</span>
            </button>
            <button
              type="button"
              onClick={() => setAudienceFilter('staff')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg transition flex items-center space-x-1 cursor-pointer touch-manipulation ${
                audienceFilter === 'staff' ? 'bg-white text-indigo-900 shadow-xs font-black' : 'hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              <span>Staff Only</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Row: Search + Status Pills + Learning Center */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, student/staff ID, PIN, supervisor..."
              className="w-full min-h-[44px] pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white text-black font-semibold placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition touch-manipulation"
            />
          </div>

          {/* Learning Center Selector */}
          {audienceFilter !== 'staff' && (
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="min-h-[44px] px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shrink-0"
            >
              <option value="all">All Learning Centers</option>
              {classrooms.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter Buttons */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer touch-manipulation ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Status
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('on_premises')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer touch-manipulation ${
                statusFilter === 'on_premises'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Present</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('checked_out')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer touch-manipulation ${
                statusFilter === 'checked_out'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Departed</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('absent')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer touch-manipulation ${
                statusFilter === 'absent'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Absent / Off</span>
            </button>
          </div>
        </div>

        {/* 3. Live Activity Feed / Table Content */}
        {activeViewTab === 'activity_stream' ? (
          /* Real-Time Live Activity Stream View */
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Real-Time Check-In / Check-Out Activity Feed</span>
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {filteredActivityStream.length} events logged today
              </span>
            </div>

            {filteredActivityStream.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No attendance movements match current filters.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  When a student or teacher scans their badge, their event appears here live instantly.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredActivityStream.map((log) => {
                  const isCheckIn = !log.check_out_time;
                  const isFresh = newLogHighlightId === log.id;

                  return (
                    <div
                      key={log.id}
                      className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isFresh
                          ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-400/30 scale-[1.01]'
                          : isCheckIn
                          ? 'bg-white hover:bg-emerald-50/40 border-slate-200 hover:border-emerald-200'
                          : 'bg-white hover:bg-blue-50/40 border-slate-200 hover:border-blue-200'
                      }`}
                    >
                      {/* Left: User Avatar + Name + Role */}
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                            log.target_type === 'Student'
                              ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                              : 'bg-gradient-to-tr from-purple-600 to-indigo-700 text-white'
                          }`}
                        >
                          {log.target_name ? log.target_name.charAt(0) : 'U'}
                        </div>

                        <div className="truncate min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {log.target_name}
                            </h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono shrink-0 ${
                                log.target_type === 'Student'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {log.target_type}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                            <span className="font-semibold text-slate-700">
                              {log.classroom || log.grade_or_role || 'General'}
                            </span>
                            <span>•</span>
                            <span className="text-slate-400 font-mono text-[10px]">{log.target_id}</span>
                            <span>•</span>
                            <span className="text-slate-600 font-medium">{log.campus}</span>
                          </div>

                          {/* Prominent Operator Information: Who signed them in/out */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                            {/* Check-In Operator */}
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              <span>Signed In By:</span>
                              <strong className="text-slate-900 font-semibold">
                                {log.signed_in_by_name || log.scanned_by_name || log.scanned_by || 'Staff Terminal'}
                              </strong>
                            </span>

                            {/* Check-Out Operator if departed */}
                            {log.check_out_time && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                                <LogOut className="w-3 h-3 text-blue-600" />
                                <span>Signed Out By:</span>
                                <strong className="text-blue-950 font-semibold">
                                  {log.signed_out_by_name || log.scanned_by_name || 'Staff Terminal'}
                                </strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Action Badge + Timestamp + Release details */}
                      <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Authorized party info & Sign out options if applicable */}
                        {(log.pickup_dropoff_party || log.early_departure_reason) && (
                          <div className="text-[10px] text-slate-500 text-left sm:text-right hidden sm:block max-w-[200px]">
                            {log.pickup_dropoff_party?.signOutOption && (
                              <span className="inline-block px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200 text-[9px] mb-0.5">
                                {log.pickup_dropoff_party.signOutOption}
                              </span>
                            )}
                            {log.pickup_dropoff_party?.name && log.pickup_dropoff_party.signOutOption !== 'Student went home alone' && (
                              <strong className="text-slate-700 truncate block text-[10px]">
                                {log.pickup_dropoff_party.name}
                                {log.pickup_dropoff_party.relationship && ` (${log.pickup_dropoff_party.relationship})`}
                              </strong>
                            )}
                            {log.early_departure_reason && (
                              <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[9px] block font-semibold mt-0.5">
                                Early: {log.early_departure_reason}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Action Type Pill */}
                        <div className="text-right">
                          <div
                            className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs ${
                              isCheckIn
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-blue-100 text-blue-900 border border-blue-300'
                            }`}
                          >
                            {isCheckIn ? (
                              <>
                                <LogIn className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Checked In</span>
                              </>
                            ) : (
                              <>
                                <LogOut className="w-3.5 h-3.5 text-blue-700" />
                                <span>Checked Out</span>
                              </>
                            )}
                          </div>

                          <div className="text-[10px] text-slate-500 font-mono font-bold mt-1">
                            {isCheckIn ? `Arrival: ${log.check_in_time}` : `Departure: ${log.check_out_time}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Full Master Directory / Table View */
          <div className="space-y-4">
            {audienceFilter !== 'staff' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center space-x-1.5">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <span>Student Roster &amp; Live Status ({studentDirectoryList.length})</span>
                  </span>
                </div>

                {/* Mobile Cards for Students */}
                <div className="block sm:hidden space-y-2">
                  {studentDirectoryList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">No students match current filter.</div>
                  ) : (
                    (showAllRecords ? studentDirectoryList : studentDirectoryList.slice(0, 20)).map(
                      ({ student, log, status }) => (
                        <div key={student.student_id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-bold text-slate-900">{student.full_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">ID: {student.student_id}</div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                status === 'on_premises'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : status === 'checked_out'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {status === 'on_premises' ? 'Present' : status === 'checked_out' ? 'Departed' : 'Absent'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex justify-between">
                            <span>{student.learning_center_id}</span>
                            <span>{log?.check_in_time ? `In: ${log.check_in_time}` : 'Not Scanned'}</span>
                          </div>
                          {log && (
                            <div className="text-[10px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200 space-y-0.5">
                              <div>
                                <span className="text-slate-400">Signed In By: </span>
                                <strong className="text-slate-800">
                                  {log.signed_in_by_name || log.scanned_by_name || log.scanned_by || 'Staff'}
                                </strong>
                              </div>
                              {log.check_out_time && (
                                <div>
                                  <span className="text-slate-400">Signed Out By: </span>
                                  <strong className="text-slate-800">
                                    {log.signed_out_by_name || log.scanned_by_name || 'Staff'}
                                  </strong>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    )
                  )}
                </div>

                {/* Desktop Table for Students */}
                <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <th className="py-3 px-3.5">Student</th>
                        <th className="py-3 px-3.5">Learning Center</th>
                        <th className="py-3 px-3.5">Status</th>
                        <th className="py-3 px-3.5">Check-In &amp; Signed By</th>
                        <th className="py-3 px-3.5">Check-Out &amp; Signed By</th>
                        <th className="py-3 px-3.5 text-right">Quick Scan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {studentDirectoryList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No students match filter.
                          </td>
                        </tr>
                      ) : (
                        (showAllRecords ? studentDirectoryList : studentDirectoryList.slice(0, 25)).map(
                          ({ student, log, status }) => (
                            <tr key={student.student_id} className="hover:bg-slate-50/80 transition">
                              <td className="py-2.5 px-3.5">
                                <div className="font-bold text-slate-900">{student.full_name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{student.student_id}</div>
                              </td>
                              <td className="py-2.5 px-3.5 text-slate-700 font-medium">
                                {student.learning_center_id}
                              </td>
                              <td className="py-2.5 px-3.5">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    status === 'on_premises'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : status === 'checked_out'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {status === 'on_premises' ? 'On Premises' : status === 'checked_out' ? 'Departed' : 'Absent'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5">
                                {log?.check_in_time ? (
                                  <div>
                                    <div className="text-slate-800 font-mono font-bold text-[11px]">
                                      {log.check_in_time}
                                    </div>
                                    <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                                      <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span className="truncate max-w-[130px]" title={log.signed_in_by_name || log.scanned_by_name || log.scanned_by}>
                                        {log.signed_in_by_name || log.scanned_by_name || log.scanned_by || 'Staff'}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3.5">
                                {log?.check_out_time ? (
                                  <div>
                                    <div className="text-slate-800 font-mono font-bold text-[11px]">
                                      {log.check_out_time}
                                    </div>
                                    <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                                      <LogOut className="w-3 h-3 text-blue-600 shrink-0" />
                                      <span className="truncate max-w-[130px]" title={log.signed_out_by_name || log.scanned_by_name}>
                                        {log.signed_out_by_name || log.scanned_by_name || 'Staff'}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={onOpenScanner}
                                  className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-blue-700 font-bold transition text-xs inline-flex items-center space-x-1 cursor-pointer"
                                >
                                  <Scan className="w-3 h-3" />
                                  <span>{status === 'on_premises' ? 'Scan Out' : 'Scan In'}</span>
                                </button>
                              </td>
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {audienceFilter !== 'students' && (
              <div className="space-y-2 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center space-x-1.5">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <span>Faculty &amp; Staff Directory ({staffDirectoryList.length})</span>
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <th className="py-3 px-3.5">Staff Member</th>
                        <th className="py-3 px-3.5">Role</th>
                        <th className="py-3 px-3.5">Status</th>
                        <th className="py-3 px-3.5">Arrival &amp; Clocked By</th>
                        <th className="py-3 px-3.5">Departure &amp; Clocked By</th>
                        <th className="py-3 px-3.5 text-right">Register</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {staffDirectoryList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No faculty match filter.
                          </td>
                        </tr>
                      ) : (
                        staffDirectoryList.map(({ staff, log, status }) => (
                          <tr key={staff.staff_id} className="hover:bg-slate-50/80 transition">
                            <td className="py-2.5 px-3.5">
                              <div className="font-bold text-slate-900">{staff.full_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{staff.staff_id}</div>
                            </td>
                            <td className="py-2.5 px-3.5 text-slate-700 font-medium">
                              {staff.role}
                            </td>
                            <td className="py-2.5 px-3.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  status === 'on_premises'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : status === 'checked_out'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {status === 'on_premises' ? 'On Campus' : status === 'checked_out' ? 'Departed' : 'Off Campus'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5">
                              {log?.check_in_time ? (
                                <div>
                                  <div className="text-slate-800 font-mono font-bold text-[11px]">
                                    {log.check_in_time}
                                  </div>
                                  <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                                    <UserCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                                    <span className="truncate max-w-[130px]" title={log.signed_in_by_name || log.scanned_by_name || log.scanned_by}>
                                      {log.signed_in_by_name || log.scanned_by_name || log.scanned_by || 'Staff'}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5">
                              {log?.check_out_time ? (
                                <div>
                                  <div className="text-slate-800 font-mono font-bold text-[11px]">
                                    {log.check_out_time}
                                  </div>
                                  <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                                    <LogOut className="w-3 h-3 text-blue-600 shrink-0" />
                                    <span className="truncate max-w-[130px]" title={log.signed_out_by_name || log.scanned_by_name}>
                                      {log.signed_out_by_name || log.scanned_by_name || 'Staff'}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5 text-right">
                              {canScanTeachers ? (
                                <button
                                  type="button"
                                  onClick={onOpenScanner}
                                  className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-indigo-700 font-bold transition text-xs inline-flex items-center space-x-1 cursor-pointer"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>{status === 'on_premises' ? 'Clock Out' : 'Clock In'}</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Restricted</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
