import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  BarChart3,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  Printer,
  Users,
  Search,
  Filter,
} from 'lucide-react';
import { AttendanceLog } from '../types';

export const ReportingView: React.FC = () => {
  const { logs, students, todayLogs } = useAttendance();

  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'all'>('7days');
  const [filterType, setFilterType] = useState<'all' | 'Student' | 'Teacher'>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const classrooms = Array.from(new Set(students.map((s) => s.learning_center_id))).filter(Boolean);

  // Compute date filter boundary
  const now = new Date();
  const getDaysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const todayStr = now.toISOString().split('T')[0];
  const sevenDaysAgo = getDaysAgo(7);
  const thirtyDaysAgo = getDaysAgo(30);

  const filteredLogs = logs.filter((log) => {
    if (log.status === 'Deleted') return false;

    // Date range filter
    if (dateRange === 'today' && log.date !== todayStr) return false;
    if (dateRange === '7days' && log.date < sevenDaysAgo) return false;
    if (dateRange === '30days' && log.date < thirtyDaysAgo) return false;

    // Target type
    if (filterType !== 'all' && log.target_type !== filterType) return false;

    // Classroom
    if (selectedClass !== 'all' && log.classroom !== selectedClass) return false;

    return true;
  });

  // Calculate statistics
  const totalLogsCount = filteredLogs.length;
  const studentLogs = filteredLogs.filter((l) => l.target_type === 'Student');
  const earlyDeparturesCount = studentLogs.filter((l) => l.early_departure_reason && l.early_departure_reason.trim() !== '').length;

  // Identify students with patterns of concern
  // 1. Chronic non-attendance or absent today
  const absentStudents = students.filter(
    (s) => !todayLogs.some((l) => l.target_id === s.student_id)
  );

  // 2. Early departures frequency
  const earlyDepartureCountsByStudent: Record<string, number> = {};
  studentLogs.forEach((l) => {
    if (l.early_departure_reason) {
      earlyDepartureCountsByStudent[l.target_name] = (earlyDepartureCountsByStudent[l.target_name] || 0) + 1;
    }
  });

  // 3. Late arrivals (after 8:30 AM)
  const lateArrivals = studentLogs.filter((l) => {
    if (!l.check_in_time) return false;
    // Simple check: if check-in is after 08:30 AM
    return l.check_in_time.includes('09:') || l.check_in_time.includes('10:') || l.check_in_time.includes('11:');
  });

  // Daily attendance trends for the last 7 days
  const last7DaysList: string[] = [];
  for (let i = 6; i >= 0; i--) {
    last7DaysList.push(getDaysAgo(i));
  }

  const trendsByDay = last7DaysList.map((dayDate) => {
    const dayLogs = logs.filter((l) => l.date === dayDate && l.status !== 'Deleted' && l.target_type === 'Student');
    const dayLabel = new Date(dayDate + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
    });
    return {
      date: dayDate,
      label: dayLabel,
      count: dayLogs.length,
      percentage: students.length > 0 ? Math.min(100, Math.round((dayLogs.length / students.length) * 100)) : 0,
    };
  });

  // Export to CSV function
  const handleExportCSV = () => {
    const headers = [
      'Log ID',
      'Date',
      'Target Type',
      'Target ID',
      'Full Name',
      'Classroom/Department',
      'Check-In Time',
      'Check-Out Time',
      'Party Type',
      'Party Name',
      'Early Departure Reason',
      'Status',
      'Scanned By',
    ];

    const rows = filteredLogs.map((l) => [
      l.log_id,
      l.date,
      l.target_type,
      l.target_id,
      `"${l.target_name.replace(/"/g, '""')}"`,
      `"${l.classroom.replace(/"/g, '""')}"`,
      l.check_in_time || '',
      l.check_out_time || '',
      l.pickup_dropoff_party?.type || '',
      `"${(l.pickup_dropoff_party?.name || '').replace(/"/g, '""')}"`,
      `"${(l.early_departure_reason || '').replace(/"/g, '""')}"`,
      l.status,
      `"${(l.scanned_by_name || l.scanned_by || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EduTrack_Attendance_Report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Actions */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-bold text-base text-slate-900 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Attendance Analytics & Pattern Reporting</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Analyze daily check-in trends, identify non-attendance patterns, and generate certified export files.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV Data</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Date Range Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Date Scope:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="today">Today Only ({todayStr})</option>
              <option value="7days">Last 7 Days (Rolling)</option>
              <option value="30days">Last 30 Days (Monthly)</option>
              <option value="all">All-Time Historical</option>
            </select>
          </div>

          {/* Target Type */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Category:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">Students and Faculty Staff</option>
              <option value="Student">Students Only</option>
              <option value="Teacher">Faculty / Staff Only</option>
            </select>
          </div>

          {/* Learning Center */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Classroom / Center:</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Classrooms & Centers</option>
              {classrooms.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Filtered Check-Ins</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalLogsCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Recorded in selected period</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Early Departures</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{earlyDeparturesCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Pickups ahead of dismissal</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Late Arrivals Flagged</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{lateArrivals.length}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Scanned after standard bell</p>
        </div>
      </div>

      {/* Daily Trends Visualization */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Daily Student Attendance Trends (Last 7 Days)</span>
          </h3>
          <span className="text-xs text-slate-400">Total Enrolled: {students.length}</span>
        </div>

        <div className="space-y-3 pt-2">
          {trendsByDay.map((day) => (
            <div key={day.date} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700">{day.label}</span>
                <span className="text-slate-900 font-bold">
                  {day.count} Students ({day.percentage}%)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    day.percentage >= 85
                      ? 'bg-emerald-500'
                      : day.percentage >= 70
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${day.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pattern Detection & Non-Attendance Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chronic Non-Attendance / Absence Alert Panel */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-rose-900 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Non-Attendance Flagged Today</span>
          </h3>
          <p className="text-xs text-slate-500">
            Students currently not logged on campus for the active session:
          </p>

          {absentStudents.length === 0 ? (
            <p className="text-xs text-emerald-600 font-semibold py-4">
              ✓ 100% Attendance today! All enrolled students are checked in.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {absentStudents.map((s) => (
                <div
                  key={s.student_id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{s.full_name}</span>
                    <p className="text-[11px] text-slate-500">
                      {s.grade} • {s.learning_center_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                      Unexcused Absence
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Contact: {s.emergency_contact}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Frequent Early Departures Alert Panel */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-amber-900 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Early Departure Reasons & Patterns</span>
          </h3>
          <p className="text-xs text-slate-500">
            Identified instances of students departing prior to official dismissal:
          </p>

          {earlyDeparturesCount === 0 ? (
            <p className="text-xs text-slate-400 py-4">No early departures logged in this period.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {studentLogs
                .filter((l) => l.early_departure_reason)
                .map((l) => (
                  <div
                    key={l.id}
                    className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-1"
                  >
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>{l.target_name}</span>
                      <span className="text-amber-800 font-mono text-[11px]">
                        Departed: {l.check_out_time}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Reason: <strong className="text-slate-900">{l.early_departure_reason}</strong>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Authorized by: {l.pickup_dropoff_party?.type} ({l.pickup_dropoff_party?.name})
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
