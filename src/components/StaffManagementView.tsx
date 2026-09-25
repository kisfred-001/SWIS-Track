import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { Staff, UserRole, AttendanceLog } from '../types';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Clock,
  Edit,
  Trash2,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  Briefcase,
} from 'lucide-react';
import { sound } from '../utils/sound';
import { SchoolLogo } from './SchoolLogo';
import { BadgeModal } from './BadgeModal';
import { IDCardGeneratorModal } from './IDCardGeneratorModal';

export const StaffManagementView: React.FC = () => {
  const {
    saveStaff,
    deleteStaff,
    selectedCampus,
    todayLogs,
    logs,
    processScan,
  } = useAttendance();
  const {
    allStaff,
    canManageStaff,
    idleTimeoutMinutes,
    setIdleTimeoutMinutes,
  } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'logs' | 'roles'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [presenceFilter, setPresenceFilter] = useState<'all' | 'present' | 'departed' | 'absent'>('all');

  // Modals
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [badgeTarget, setBadgeTarget] = useState<Staff | null>(null);
  const [isIDGeneratorOpen, setIsIDGeneratorOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);

  // Quick PIN reveal states
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    staff_id: string;
    full_name: string;
    email: string;
    phone: string;
    emergency_contact: string;
    role: UserRole;
    campus: string;
    learning_center_id: string;
    pin_code: string;
    password: string;
    job_title: string;
    department: string;
    status: 'Active' | 'On Leave' | 'Inactive';
    shift_start: string;
    shift_end: string;
    can_scan_teachers: boolean;
    can_manage_staff: boolean;
    can_approve_edits: boolean;
    notes: string;
  }>({
    staff_id: '',
    full_name: '',
    email: '',
    phone: '',
    emergency_contact: '',
    role: 'Supervisor',
    campus: 'Spring Campus',
    learning_center_id: 'Kayil',
    pin_code: '',
    password: '',
    job_title: 'Supervisor',
    department: 'Teaching & Instruction',
    status: 'Active',
    shift_start: '07:30',
    shift_end: '16:30',
    can_scan_teachers: false,
    can_manage_staff: false,
    can_approve_edits: false,
    notes: '',
  });

  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map today's attendance for all staff
  const staffAttendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceLog>();
    todayLogs
      .filter((l) => l.target_type === 'Teacher')
      .forEach((l) => {
        // keep latest log for today
        map.set(l.target_id, l);
      });
    return map;
  }, [todayLogs]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = allStaff.length;
    let onPremises = 0;
    let checkedOut = 0;
    let notCheckedIn = 0;

    allStaff.forEach((st) => {
      const log = staffAttendanceMap.get(st.staff_id);
      if (log) {
        if (!log.check_out_time) {
          onPremises++;
        } else {
          checkedOut++;
        }
      } else {
        notCheckedIn++;
      }
    });

    const springStaff = allStaff.filter((s) => s.campus === 'Spring Campus').length;
    const hopeStaff = allStaff.filter((s) => s.campus === 'Hope Campus').length;

    return { total, onPremises, checkedOut, notCheckedIn, springStaff, hopeStaff };
  }, [allStaff, staffAttendanceMap]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allStaff.filter((st) => {
      const matchesSearch =
        !q ||
        st.full_name.toLowerCase().includes(q) ||
        st.staff_id.toLowerCase().includes(q) ||
        st.pin_code.includes(q) ||
        st.role.toLowerCase().includes(q) ||
        (st.email && st.email.toLowerCase().includes(q)) ||
        (st.phone && st.phone.includes(q)) ||
        (st.learning_center_id && st.learning_center_id.toLowerCase().includes(q));

      const matchesCampus =
        campusFilter === 'all' ||
        st.campus === campusFilter ||
        st.campus === 'All Campuses';

      const matchesRole = roleFilter === 'all' || st.role === roleFilter;

      const log = staffAttendanceMap.get(st.staff_id);
      let matchesPresence = true;
      if (presenceFilter === 'present') {
        matchesPresence = Boolean(log && !log.check_out_time);
      } else if (presenceFilter === 'departed') {
        matchesPresence = Boolean(log && log.check_out_time);
      } else if (presenceFilter === 'absent') {
        matchesPresence = !log;
      }

      return matchesSearch && matchesCampus && matchesRole && matchesPresence;
    });
  }, [allStaff, searchQuery, campusFilter, roleFilter, presenceFilter, staffAttendanceMap]);

  // Staff Logs
  const staffLogs = useMemo(() => {
    return logs
      .filter((l) => l.target_type === 'Teacher')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [logs]);

  // Open modal for editing
  const handleOpenEdit = (st: Staff) => {
    setEditingStaff(st);
    setFormData({
      staff_id: st.staff_id,
      full_name: st.full_name,
      email: st.email || '',
      phone: st.phone || '',
      emergency_contact: st.emergency_contact || '',
      role: st.role,
      campus: st.campus || 'Spring Campus',
      learning_center_id: st.learning_center_id || 'Main Office',
      pin_code: st.pin_code,
      password: st.password || '',
      job_title: st.job_title || st.role,
      department: st.department || 'Administration & Instruction',
      status: st.status || 'Active',
      shift_start: st.shift_start || '07:30',
      shift_end: st.shift_end || '16:30',
      can_scan_teachers: Boolean(st.can_scan_teachers),
      can_manage_staff: Boolean(st.can_manage_staff),
      can_approve_edits: Boolean(st.can_approve_edits),
      notes: st.notes || '',
    });
    setFormMsg(null);
  };

  // Open modal for adding
  const handleOpenAdd = () => {
    const randomPin = Math.floor(100 + Math.random() * 900).toString();
    const newId = `STF-${(allStaff.length + 1).toString().padStart(3, '0')}`;
    setEditingStaff(null);
    setFormData({
      staff_id: newId,
      full_name: '',
      email: '',
      phone: '',
      emergency_contact: '',
      role: 'Supervisor',
      campus: selectedCampus === 'All Campuses' ? 'Spring Campus' : selectedCampus,
      learning_center_id: 'Kayil',
      pin_code: randomPin,
      password: '',
      job_title: 'Supervisor',
      department: 'Teaching & Instruction',
      status: 'Active',
      shift_start: '07:30',
      shift_end: '16:30',
      can_scan_teachers: false,
      can_manage_staff: false,
      can_approve_edits: false,
      notes: '',
    });
    setIsAddStaffOpen(true);
    setFormMsg(null);
  };

  // Quick 1-click Check In / Check Out for Staff
  const handleToggleStaffAttendance = async (st: Staff) => {
    try {
      const res = await processScan({ code: st.pin_code });
      if (res.success) {
        sound.playSuccessChime();
        setFormMsg({
          type: 'success',
          text: `${st.full_name} (${st.role}) attendance logged: ${res.action === 'check_in' ? 'Checked In' : 'Checked Out'}.`,
        });
      } else {
        sound.playError();
        setFormMsg({ type: 'error', text: res.message });
      }
      setTimeout(() => setFormMsg(null), 4000);
    } catch (err: any) {
      sound.playError();
      setFormMsg({ type: 'error', text: err?.message || 'Attendance action failed.' });
    }
  };

  // Quick Generate New Unique PIN
  const handleGenerateNewPin = () => {
    let pin = '';
    let attempts = 0;
    while (attempts < 50) {
      pin = Math.floor(100 + Math.random() * 900).toString();
      const existing = allStaff.find(
        (s) => s.pin_code === pin && s.staff_id !== formData.staff_id
      );
      if (!existing) break;
      attempts++;
    }
    setFormData((prev) => ({ ...prev, pin_code: pin }));
  };

  // Save Staff (Add or Edit)
  const handleSaveStaffForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!formData.full_name.trim()) {
      setFormMsg({ type: 'error', text: 'Full Name is required.' });
      return;
    }
    if (!formData.email.trim()) {
      setFormMsg({ type: 'error', text: 'Email is required.' });
      return;
    }
    if (!formData.pin_code.trim() || formData.pin_code.length !== 3 || !/^\d{3}$/.test(formData.pin_code)) {
      setFormMsg({ type: 'error', text: 'Security PIN must be a valid 3-digit number.' });
      return;
    }

    // Check PIN uniqueness
    const pinConflict = allStaff.find(
      (s) => s.pin_code === formData.pin_code && s.staff_id !== formData.staff_id
    );
    if (pinConflict) {
      setFormMsg({
        type: 'error',
        text: `PIN ${formData.pin_code} is already assigned to ${pinConflict.full_name}. Please choose or generate another PIN.`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Staff = {
        staff_id: formData.staff_id,
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || '+256 700 000 000',
        emergency_contact: formData.emergency_contact.trim(),
        role: formData.role,
        campus: formData.campus,
        learning_center_id: formData.learning_center_id,
        pin_code: formData.pin_code,
        password: formData.password || undefined,
        job_title: formData.job_title.trim() || formData.role,
        department: formData.department.trim(),
        status: formData.status,
        shift_start: formData.shift_start,
        shift_end: formData.shift_end,
        duty_schedule: `${formData.shift_start} - ${formData.shift_end} (Mon-Fri)`,
        can_scan_teachers: formData.can_scan_teachers,
        can_manage_staff: formData.can_manage_staff,
        can_approve_edits: formData.can_approve_edits,
        notes: formData.notes.trim(),
        qr_code_url: formData.staff_id,
        updated_at: new Date().toISOString(),
      };

      if (!editingStaff) {
        payload.created_at = new Date().toISOString();
      }

      const res = await saveStaff(payload, formData.staff_id);
      if (res.success) {
        sound.playSuccessChime();
        setFormMsg({
          type: 'success',
          text: `Staff member ${payload.full_name} (${payload.role}) saved successfully with PIN ${payload.pin_code}!`,
        });
        setIsAddStaffOpen(false);
        setEditingStaff(null);
        setTimeout(() => setFormMsg(null), 5000);
      } else {
        sound.playError();
        setFormMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      sound.playError();
      setFormMsg({ type: 'error', text: err?.message || 'Failed to save staff record.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Staff confirmation
  const handleConfirmDeleteStaff = async () => {
    if (!deletingStaff) return;
    try {
      const res = await deleteStaff(deletingStaff.staff_id);
      if (res.success) {
        setFormMsg({
          type: 'success',
          text: `Staff member ${deletingStaff.full_name} removed.`,
        });
        setDeletingStaff(null);
        setTimeout(() => setFormMsg(null), 4000);
      } else {
        setFormMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setFormMsg({ type: 'error', text: err?.message || 'Failed to delete staff member.' });
    }
  };

  // Export Staff List CSV
  const handleExportStaffCSV = () => {
    try {
      const headers = [
        'Staff ID',
        'Full Name',
        'Role',
        'PIN Code',
        'Campus',
        'Learning Center / Dept',
        'Email',
        'Phone',
        'Status',
        'Today Status',
        'Check-In Time',
        'Check-Out Time',
      ];
      const rows = allStaff.map((st) => {
        const log = staffAttendanceMap.get(st.staff_id);
        const todayStatus = log
          ? log.check_out_time
            ? 'Departed'
            : 'Present'
          : 'Absent';
        return [
          `"${st.staff_id}"`,
          `"${st.full_name}"`,
          `"${st.role}"`,
          `"${st.pin_code}"`,
          `"${st.campus || 'All Campuses'}"`,
          `"${st.learning_center_id || 'Main Office'}"`,
          `"${st.email || ''}"`,
          `"${st.phone || ''}"`,
          `"${st.status || 'Active'}"`,
          `"${todayStatus}"`,
          `"${log?.check_in_time || ''}"`,
          `"${log?.check_out_time || ''}"`,
        ];
      });

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `SWIS_Staff_Directory_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      sound.playSuccessChime();
    } catch {
      sound.playError();
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ICCE Coordinator':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Principal':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Director':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Administrator':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Administrative Assistant':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Supervisor':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'Monitor':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'Support Staff':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {formMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            formMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            {formMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{formMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormMsg(null)}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Header with Brand & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <SchoolLogo variant="emblem" size="lg" className="bg-white p-1 rounded-2xl shadow-md shrink-0 hidden sm:block" />
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                  Faculty &amp; Administration
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {stats.onPremises} On Duty Now
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Staff Management Module
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Configure faculty credentials, security PINs, campus and learning center assignments, permissions, and monitor real-time staff duty clock attendance.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
            {canManageStaff && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/30 transition transform active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Staff Member</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsIDGeneratorOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-indigo-400" />
              <span>Print Staff Badges</span>
            </button>

            <button
              type="button"
              onClick={handleExportStaffCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              title="Export Staff Roster to CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block font-medium">Total Staff</span>
            <span className="text-xl font-black text-white mt-0.5 block">{stats.total}</span>
            <span className="text-[10px] text-slate-400">All Departments</span>
          </div>

          <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/30">
            <span className="text-emerald-300 text-[11px] block font-medium flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>On Premises</span>
            </span>
            <span className="text-xl font-black text-emerald-300 mt-0.5 block">{stats.onPremises}</span>
            <span className="text-[10px] text-emerald-400/80">Signed In Today</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block font-medium">Checked Out</span>
            <span className="text-xl font-black text-slate-200 mt-0.5 block">{stats.checkedOut}</span>
            <span className="text-[10px] text-slate-400">Completed Shift</span>
          </div>

          <div className="bg-amber-950/40 p-3 rounded-2xl border border-amber-500/30">
            <span className="text-amber-300 text-[11px] block font-medium">Not Signed In</span>
            <span className="text-xl font-black text-amber-300 mt-0.5 block">{stats.notCheckedIn}</span>
            <span className="text-[10px] text-amber-400/80">Pending Arrival</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-indigo-300 text-[11px] block font-medium">Spring Campus</span>
            <span className="text-xl font-black text-indigo-300 mt-0.5 block">{stats.springStaff}</span>
            <span className="text-[10px] text-slate-400">Assigned Staff</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-purple-300 text-[11px] block font-medium">Hope Campus</span>
            <span className="text-xl font-black text-purple-300 mt-0.5 block">{stats.hopeStaff}</span>
            <span className="text-[10px] text-slate-400">Assigned Staff</span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('directory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeSubTab === 'directory'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Directory &amp; Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeSubTab === 'logs'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Staff Attendance &amp; Timesheet ({staffLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('roles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeSubTab === 'roles'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Roles, Rights &amp; Policy Matrix</span>
        </button>
      </div>

      {/* Sub-Tab 1: Staff Directory & Management */}
      {activeSubTab === 'directory' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          {/* Filters Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, PIN, role, center, email..."
                className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Campus Filter */}
              <select
                value={campusFilter}
                onChange={(e) => setCampusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Campuses</option>
                <option value="Spring Campus">Spring Campus</option>
                <option value="Hope Campus">Hope Campus</option>
              </select>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Roles</option>
                <option value="ICCE Coordinator">ICCE Coordinator</option>
                <option value="Principal">Principal</option>
                <option value="Director">Director</option>
                <option value="Administrator">Administrator</option>
                <option value="Administrative Assistant">Administrative Assistant</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Monitor">Monitor</option>
                <option value="Support Staff">Support Staff</option>
              </select>

              {/* Presence Filter */}
              <select
                value={presenceFilter}
                onChange={(e) => setPresenceFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="present">🟢 On Premises (Checked In)</option>
                <option value="departed">⚪ Departed (Checked Out)</option>
                <option value="absent">🟡 Not Yet Checked In</option>
              </select>
            </div>
          </div>

          {/* Staff Table (Desktop & Tablet) */}
          <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3.5">Staff Member &amp; ID</th>
                  <th className="py-3 px-3">Role &amp; Title</th>
                  <th className="py-3 px-3">Campus &amp; Center</th>
                  <th className="py-3 px-3">Security 3-Digit PIN</th>
                  <th className="py-3 px-3">Today's Duty Status</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No staff members match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((st) => {
                    const todayLog = staffAttendanceMap.get(st.staff_id);
                    const isPresent = Boolean(todayLog && !todayLog.check_out_time);
                    const isDeparted = Boolean(todayLog && todayLog.check_out_time);
                    const pinRevealed = revealedPins[st.staff_id] || false;

                    return (
                      <tr key={st.staff_id} className="hover:bg-slate-50/80 transition">
                        {/* Name & ID */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                                {st.full_name.charAt(0)}
                              </div>
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                  isPresent
                                    ? 'bg-emerald-500 animate-pulse'
                                    : isDeparted
                                    ? 'bg-slate-400'
                                    : 'bg-amber-400'
                                }`}
                                title={
                                  isPresent
                                    ? 'Present on premises'
                                    : isDeparted
                                    ? 'Departed'
                                    : 'Not yet signed in'
                                }
                              />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 leading-tight">
                                {st.full_name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                ID: <span className="font-semibold text-slate-600">{st.staff_id}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role & Title */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeStyle(
                              st.role
                            )}`}
                          >
                            {st.role}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[130px]">
                            {st.job_title || st.role}
                          </div>
                        </td>

                        {/* Campus & Center */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">
                            {st.campus || 'All Campuses'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {st.learning_center_id || 'Main Office'}
                          </div>
                        </td>

                        {/* 3-Digit PIN */}
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              {pinRevealed ? st.pin_code : '•••'}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedPins((prev) => ({
                                  ...prev,
                                  [st.staff_id]: !pinRevealed,
                                }))
                              }
                              className="text-slate-400 hover:text-slate-700 p-1 rounded"
                              title={pinRevealed ? 'Hide PIN' : 'Reveal PIN'}
                            >
                              {pinRevealed ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Today's Duty Status & 1-Click Action */}
                        <td className="py-3 px-3">
                          {isPresent ? (
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>In: {todayLog?.check_in_time}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleStaffAttendance(st)}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 hover:bg-rose-200 transition"
                                title="Sign Out Staff Member"
                              >
                                Sign Out
                              </button>
                            </div>
                          ) : isDeparted ? (
                            <div>
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                <span>Out: {todayLog?.check_out_time}</span>
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Not Clocked In
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleStaffAttendance(st)}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
                                title="Sign In Staff Member"
                              >
                                Sign In
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Contact */}
                        <td className="py-3 px-3">
                          <div className="text-slate-800 truncate max-w-[130px]" title={st.email}>
                            {st.email}
                          </div>
                          <div className="text-[10px] text-slate-400">{st.phone || '—'}</div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Print Badge */}
                            <button
                              type="button"
                              onClick={() => setBadgeTarget(st)}
                              className="p-1.5 rounded-lg border border-slate-200 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition"
                              title="Print Credential Badge"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            {canManageStaff && (
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(st)}
                                className="p-1.5 rounded-lg border border-slate-200 text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition"
                                title="Edit Staff Settings"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete (Cannot delete Super User) */}
                            {canManageStaff && st.staff_id !== 'STF-001' && (
                              <button
                                type="button"
                                onClick={() => setDeletingStaff(st)}
                                className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition"
                                title="Remove Staff Member"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (< 768px) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredStaff.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl">
                No staff members match the selected filters.
              </div>
            ) : (
              filteredStaff.map((st) => {
                const todayLog = staffAttendanceMap.get(st.staff_id);
                const isPresent = Boolean(todayLog && !todayLog.check_out_time);
                const isDeparted = Boolean(todayLog && todayLog.check_out_time);
                const pinRevealed = revealedPins[st.staff_id] || false;

                return (
                  <div
                    key={st.staff_id}
                    className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3 text-xs shadow-2xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                            {st.full_name.charAt(0)}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                              isPresent ? 'bg-emerald-500' : isDeparted ? 'bg-slate-400' : 'bg-amber-400'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm leading-tight">
                            {st.full_name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            ID: {st.staff_id} • PIN:{' '}
                            <span className="font-bold text-purple-700 bg-purple-100 px-1 py-0.2 rounded">
                              {pinRevealed ? st.pin_code : '•••'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeStyle(
                          st.role
                        )}`}
                      >
                        {st.role}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Campus &amp; Center:</span>
                        <span className="font-semibold text-slate-800">
                          {st.campus || 'All Campuses'} • {st.learning_center_id || 'Office'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Duty Status:</span>
                        {isPresent ? (
                          <span className="text-emerald-700 font-bold">Present (In {todayLog?.check_in_time})</span>
                        ) : isDeparted ? (
                          <span className="text-slate-600 font-medium">Out {todayLog?.check_out_time}</span>
                        ) : (
                          <span className="text-amber-700 font-medium">Not Clocked In</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => handleToggleStaffAttendance(st)}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition text-center ${
                          isPresent
                            ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {isPresent ? 'Clock Out' : 'Clock In'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setBadgeTarget(st)}
                        className="py-1.5 px-3 rounded-xl border border-slate-300 text-indigo-700 hover:bg-indigo-50 font-semibold text-[11px]"
                      >
                        Badge
                      </button>

                      {canManageStaff && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(st)}
                          className="py-1.5 px-3 rounded-xl border border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold text-[11px]"
                        >
                          Settings
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Staff Attendance & Timesheet Logs */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Staff Duty Clock &amp; Attendance Logs</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive audit logs of all faculty arrivals, departures, and time spent on school premises.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              {staffLogs.length} Total Shift Entries
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3.5">Date</th>
                  <th className="py-2.5 px-3">Staff Name &amp; ID</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Campus</th>
                  <th className="py-2.5 px-3">Clock In</th>
                  <th className="py-2.5 px-3">Clock Out</th>
                  <th className="py-2.5 px-3">Duty Status</th>
                  <th className="py-2.5 px-3 text-right">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No staff attendance records logged yet.
                    </td>
                  </tr>
                ) : (
                  staffLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3.5 font-medium text-slate-700 font-mono text-[11px]">
                        {l.date}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{l.target_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {l.target_id}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeStyle(l.grade_or_role)}`}>
                          {l.grade_or_role}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {l.campus || 'Spring Campus'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                        {l.check_in_time}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">
                        {l.check_out_time || (
                          <span className="text-emerald-600 animate-pulse font-normal italic">On Duty</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {!l.check_out_time ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Present On Campus
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-300">
                            Shift Ended
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-[11px] text-slate-500">
                        {l.scanned_by_name || l.scanned_by || 'Terminal Scanner'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Roles, Rights & Operational Policy Matrix */}
      {activeSubTab === 'roles' && (
        <div className="space-y-5">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
              <Shield className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Role-Based Access Control (RBAC) &amp; Operational Permissions Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Strict security hierarchy governing terminal scanning, attendance approvals, and administrative duties across Spring and Hope Campuses.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {/* ICCE Coordinator */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-purple-900 uppercase tracking-wide">
                    ICCE Coordinator
                  </span>
                  <span className="text-[10px] font-bold bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                    Highest Tier
                  </span>
                </div>
                <p className="text-xs text-purple-950 font-medium">Mr. Fredrick Kariuki</p>
                <ul className="text-[11px] text-purple-900/80 space-y-1 list-disc pl-4">
                  <li>Full administrative authority over all campuses.</li>
                  <li>Exclusive access to System Diagnostic and Setup Module.</li>
                  <li>Direct edit of logs without requiring approval.</li>
                  <li>Can create, edit, and delete staff accounts.</li>
                </ul>
              </div>

              {/* Principal & Director */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-900 uppercase tracking-wide">
                    Principal &amp; Director
                  </span>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                    Executive
                  </span>
                </div>
                <p className="text-xs text-amber-950 font-medium">Mrs. Irene Lulika &amp; Mr. Jaxon Lulika</p>
                <ul className="text-[11px] text-amber-900/80 space-y-1 list-disc pl-4">
                  <li>Executive leadership oversight.</li>
                  <li>Real-time FCM Urgent Edit Alert notifications.</li>
                  <li>One-click approval/rejection of edit requests.</li>
                  <li>Comprehensive reporting &amp; analytics access.</li>
                </ul>
              </div>

              {/* Administrator & Assistant */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-900 uppercase tracking-wide">
                    Administrator
                  </span>
                  <span className="text-[10px] font-bold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                    Operations
                  </span>
                </div>
                <p className="text-xs text-indigo-950 font-medium">Mrs. Khasoma Susan &amp; Mrs. Juliet Arinaitwe</p>
                <ul className="text-[11px] text-indigo-900/80 space-y-1 list-disc pl-4">
                  <li>Operational roster management (add/edit students).</li>
                  <li>Can scan teachers and staff in/out.</li>
                  <li>Review and approve attendance adjustments.</li>
                  <li>Print student and faculty ID badges.</li>
                </ul>
              </div>

              {/* Supervisor & Monitor */}
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-sky-900 uppercase tracking-wide">
                    Supervisor &amp; Monitor
                  </span>
                  <span className="text-[10px] font-bold bg-sky-200 text-sky-800 px-2 py-0.5 rounded-full">
                    Equal Rights
                  </span>
                </div>
                <p className="text-xs text-sky-950 font-medium">Classroom Faculty &amp; Assistant Teachers</p>
                <ul className="text-[11px] text-sky-900/80 space-y-1 list-disc pl-4">
                  <li>Exact same rights pertaining to the system.</li>
                  <li>Scan student attendance for assigned learning centers.</li>
                  <li>Submit formal Edit Requests with urgent alert trigger.</li>
                  <li>View center student profiles and emergency contacts.</li>
                </ul>
              </div>

              {/* Support Staff */}
              <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-orange-900 uppercase tracking-wide">
                    Support Staff
                  </span>
                  <span className="text-[10px] font-bold bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">
                    Gate &amp; Logistics
                  </span>
                </div>
                <p className="text-xs text-orange-950 font-medium">Miss. Anette Mugala (Hope Campus)</p>
                <ul className="text-[11px] text-orange-900/80 space-y-1 list-disc pl-4">
                  <li>Strictly bounded to signing children in and out.</li>
                  <li>Cannot scan teacher attendance or approve edits.</li>
                  <li>No access to student profile management or deletion.</li>
                  <li>Streamlined mobile scanning terminal mode.</li>
                </ul>
              </div>

              {/* System Security Policy */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                    Terminal Inactivity Policy
                  </span>
                  <span className="text-[10px] font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
                    {idleTimeoutMinutes} Mins Timeout
                  </span>
                </div>
                <p className="text-xs text-slate-700">
                  Safeguards confidential student records when a mobile phone or terminal is left unattended.
                </p>
                {canManageStaff && (
                  <div className="pt-1 flex items-center space-x-2">
                    <label className="text-[11px] text-slate-600 font-semibold">Change Timeout:</label>
                    <select
                      value={idleTimeoutMinutes}
                      onChange={(e) => setIdleTimeoutMinutes(parseInt(e.target.value, 10))}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold"
                    >
                      <option value={2}>2 Minutes (Strict)</option>
                      <option value={5}>5 Minutes (Default)</option>
                      <option value={10}>10 Minutes</option>
                      <option value={15}>15 Minutes</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {(isAddStaffOpen || editingStaff) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 my-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
                  <Briefcase className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {editingStaff ? `Edit Staff: ${editingStaff.full_name}` : 'Register New Staff Member'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Configure staff persona, security credentials, campus assignment, and duties.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddStaffOpen(false);
                  setEditingStaff(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStaffForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                    formMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formMsg.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Mrs. Eunice Mutebe"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Staff ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Staff ID Code
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingStaff)}
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 font-mono text-slate-700 focus:outline-none"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assigned Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const nextRole = e.target.value as UserRole;
                      setFormData({
                        ...formData,
                        role: nextRole,
                        job_title: formData.job_title === formData.role ? nextRole : formData.job_title,
                      });
                    }}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold"
                  >
                    <option value="Supervisor">Supervisor</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Principal">Principal</option>
                    <option value="Director">Director</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Administrative Assistant">Administrative Assistant</option>
                    <option value="Support Staff">Support Staff</option>
                    <option value="ICCE Coordinator">ICCE Coordinator</option>
                  </select>
                </div>

                {/* Campus Assignment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assigned Campus
                  </label>
                  <select
                    value={formData.campus}
                    onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold"
                  >
                    <option value="Spring Campus">Spring Campus</option>
                    <option value="Hope Campus">Hope Campus</option>
                    <option value="All Campuses">All Campuses (Leadership)</option>
                  </select>
                </div>

                {/* Learning Center / Dept */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assigned Center / Classroom
                  </label>
                  <input
                    type="text"
                    value={formData.learning_center_id}
                    onChange={(e) => setFormData({ ...formData, learning_center_id: e.target.value })}
                    placeholder="e.g. Kayil, Splendor, Main Office"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 3-Digit PIN with Generator */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      3-Digit Security PIN *
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateNewPin}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Auto Generate</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={formData.pin_code}
                    onChange={(e) =>
                      setFormData({ ...formData, pin_code: e.target.value.replace(/\D/g, '').slice(0, 3) })
                    }
                    placeholder="e.g. 103"
                    className="w-full text-center text-lg font-mono font-bold tracking-widest p-2 border border-purple-300 rounded-xl bg-purple-50 text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Institutional Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="staff@spiritandword.org"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Contact
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+256 700 000 000"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Job Title / Designation
                  </label>
                  <input
                    type="text"
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    placeholder="e.g. Center Supervisor, Lead Teacher"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Employment Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold"
                  >
                    <option value="Active">Active Duty</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              {/* Working Hours / Shift Schedule */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Staff Working Hours &amp; Shift Schedule
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                      Shift Start (Arrival)
                    </label>
                    <input
                      type="time"
                      value={formData.shift_start}
                      onChange={(e) => setFormData({ ...formData, shift_start: e.target.value })}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                      Shift End (Departure)
                    </label>
                    <input
                      type="time"
                      value={formData.shift_end}
                      onChange={(e) => setFormData({ ...formData, shift_end: e.target.value })}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Operational Permissions Overrides */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Operational Permissions &amp; Capabilities
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.can_scan_teachers}
                      onChange={(e) => setFormData({ ...formData, can_scan_teachers: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700">Scan Teachers In/Out</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.can_manage_staff}
                      onChange={(e) => setFormData({ ...formData, can_manage_staff: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700">Manage Staff Rosters</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.can_approve_edits}
                      onChange={(e) => setFormData({ ...formData, can_approve_edits: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700">Approve Edit Requests</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Faculty Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional qualifications, shift notes, or special directives..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddStaffOpen(false);
                    setEditingStaff(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving to Firebase...' : editingStaff ? 'Update Staff Member' : 'Save New Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Staff Confirmation Modal */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl animate-in zoom-in duration-150 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Remove Staff Member?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong className="text-slate-800">{deletingStaff.full_name}</strong> ({deletingStaff.role}, ID: {deletingStaff.staff_id}) from active staff roster?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                className="py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStaff}
                className="py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md"
              >
                Delete Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Badge Modal for Single Staff */}
      {badgeTarget && (
        <BadgeModal
          item={badgeTarget}
          type="Staff"
          onClose={() => setBadgeTarget(null)}
        />
      )}

      {/* Batch / Multi-Card Generator Modal */}
      <IDCardGeneratorModal
        isOpen={isIDGeneratorOpen}
        onClose={() => setIsIDGeneratorOpen(false)}
        defaultType="Staff"
      />
    </div>
  );
};
