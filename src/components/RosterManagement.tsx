import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  GraduationCap,
  Plus,
  QrCode,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Shield,
  Sparkles,
  Phone,
  UserPlus,
  Briefcase,
  KeyRound,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';
import { Student, Staff, UserRole } from '../types';
import { BadgeModal } from './BadgeModal';
import { BulkUploadModal } from './BulkUploadModal';
import { IDCardGeneratorModal } from './IDCardGeneratorModal';

export const RosterManagement: React.FC = () => {
  const {
    students,
    saveStudent,
    saveStaff,
    campuses,
    learningCenters,
    selectedCampus,
    setSelectedCampus,
  } = useAttendance();
  const { currentUser, allStaff, isSuperUser, isTeacherOnly } = useAuth();

  const [activeTab, setActiveTab] = useState<'students' | 'staff'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [centerFilter, setCenterFilter] = useState('all');

  // Bulk Upload Modal
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  // ID Card Generator & PDF Export Modal
  const [isIDGeneratorOpen, setIsIDGeneratorOpen] = useState(false);
  const [idGeneratorDefaultType, setIdGeneratorDefaultType] = useState<'Student' | 'Staff'>('Student');

  // Badge Modal
  const [badgeTarget, setBadgeTarget] = useState<{ item: Student | Staff; type: 'Student' | 'Staff' } | null>(null);

  // Add Student Modal
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentCampus, setStudentCampus] = useState('Spring Campus');
  const [studentGrade, setStudentGrade] = useState('Grade 4');
  const [studentCenter, setStudentCenter] = useState('Kayil');
  const [studentSupervisor, setStudentSupervisor] = useState('Mrs. Rachel');
  const [studentMonitor, setStudentMonitor] = useState('Mr. Benson');
  const [studentParents, setStudentParents] = useState('');
  const [studentEmergency, setStudentEmergency] = useState('');
  const [studentPin, setStudentPin] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());

  // Add Staff Modal (ICCE Coordinator Super User)
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('Supervisor');
  const [staffCenter, setStaffCenter] = useState('Kayil');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPin, setStaffPin] = useState(() => Math.floor(100 + Math.random() * 900).toString());

  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const centers = useMemo(() => {
    const list =
      selectedCampus === 'All Campuses'
        ? students
        : students.filter((s) => s.campus === selectedCampus);
    return Array.from(new Set(list.map((s) => s.learning_center_id))).filter(Boolean);
  }, [students, selectedCampus]);

  // If user is a Teacher, enforce learning center scope if assigned
  const teacherCenter = isTeacherOnly ? currentUser?.learning_center_id : null;

  // Filter students (memoized)
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      const matchesCampus =
        selectedCampus === 'All Campuses' || s.campus === selectedCampus;
      const matchesCenter =
        centerFilter === 'all' || s.learning_center_id === centerFilter;
      const matchesSearch =
        !q ||
        s.full_name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q) ||
        s.pin_code.includes(q) ||
        (s.grade || '').toLowerCase().includes(q) ||
        s.supervisor_name.toLowerCase().includes(q);

      return (
        matchesCampus &&
        matchesCenter &&
        matchesSearch &&
        (teacherCenter ? s.learning_center_id === teacherCenter : true)
      );
    });
  }, [students, selectedCampus, centerFilter, searchQuery, teacherCenter]);

  // Filter staff (memoized)
  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allStaff.filter((st) => {
      const matchesSearch =
        !q ||
        st.full_name.toLowerCase().includes(q) ||
        st.staff_id.toLowerCase().includes(q) ||
        st.role.toLowerCase().includes(q) ||
        st.pin_code.includes(q);
      return matchesSearch;
    });
  }, [allStaff, searchQuery]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setFormMsg({ type: 'error', text: 'Student full name is required.' });
      return;
    }

    const newId = `STU-${Date.now().toString().slice(-4)}`;
    const res = await saveStudent({
      student_id: newId,
      pin_code: studentPin,
      full_name: studentName.trim(),
      campus: studentCampus || 'Spring Campus',
      grade: studentGrade,
      learning_center_id: studentCenter,
      supervisor_name: studentSupervisor,
      monitor_name: studentMonitor,
      parent_names: studentParents.trim() || 'Parent / Guardian',
      emergency_contact: studentEmergency.trim() || '(555) 000-0000',
      qr_code_url: newId,
      created_at: new Date().toISOString(),
    });

    if (res.success) {
      setFormMsg({ type: 'success', text: `Student ${studentName} registered with PIN ${studentPin}!` });
      setIsAddStudentOpen(false);
      setStudentName('');
      setStudentParents('');
      setStudentEmergency('');
      setStudentPin(Math.floor(1000 + Math.random() * 9000).toString());
      setTimeout(() => setFormMsg(null), 5000);
    } else {
      setFormMsg({ type: 'error', text: res.message });
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffEmail.trim()) {
      setFormMsg({ type: 'error', text: 'Staff full name and email are required.' });
      return;
    }

    const newStaffId = `STF-${Date.now().toString().slice(-3)}`;
    const res = await saveStaff({
      staff_id: newStaffId,
      pin_code: staffPin,
      full_name: staffName.trim(),
      email: staffEmail.trim(),
      role: staffRole,
      learning_center_id: staffCenter,
      phone: staffPhone.trim() || '(555) 000-0000',
      qr_code_url: newStaffId,
      created_at: new Date().toISOString(),
    });

    if (res.success) {
      setFormMsg({ type: 'success', text: `Staff account for ${staffName} created with PIN ${staffPin}!` });
      setIsAddStaffOpen(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPhone('');
      setStaffPin(Math.floor(100 + Math.random() * 900).toString());
      setTimeout(() => setFormMsg(null), 5000);
    } else {
      setFormMsg({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="space-y-5">
      {/* Alert Banner */}
      {formMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 ${
            formMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {formMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{formMsg.text}</span>
        </div>
      )}

      {/* Main Roster Container */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
        {/* Header Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-bold text-base text-slate-900 flex items-center space-x-2">
              <span>School Roster & ID Badges</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage student enrollment and faculty profiles, generate digital QR badges and PIN credentials.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Tab switch */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('students')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'students'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Students ({students.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('staff')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'staff'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Staff Directory ({allStaff.length})
              </button>
            </div>

            {/* Action buttons based on RBAC */}
            {activeTab === 'students' ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIdGeneratorDefaultType('Student');
                    setIsIDGeneratorOpen(true);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-semibold shadow-2xs transition"
                  title="Generate printable student ID cards and PDF sheets"
                >
                  <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Print ID Cards (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBulkUploadOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition"
                  title="Bulk upload student CSV for semester rollovers or class updates"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                  <span>Bulk Import CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStudentPin(Math.floor(1000 + Math.random() * 9000).toString());
                    setIsAddStudentOpen(true);
                  }}
                  className="inline-flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Student</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIdGeneratorDefaultType('Staff');
                    setIsIDGeneratorOpen(true);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-semibold shadow-2xs transition"
                  title="Generate printable faculty & staff ID credential cards and PDF sheets"
                >
                  <QrCode className="w-3.5 h-3.5 text-purple-600" />
                  <span>Print Credentials (PDF)</span>
                </button>

                {isSuperUser && (
                  <button
                    type="button"
                    onClick={() => {
                      setStaffPin(Math.floor(100 + Math.random() * 900).toString());
                      setIsAddStaffOpen(true);
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Staff (Super User)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Teacher scope notice */}
        {isTeacherOnly && teacherCenter && activeTab === 'students' && (
          <div className="bg-sky-50 border border-sky-200 text-sky-800 text-xs p-3 rounded-xl flex items-center justify-between">
            <span>
              Showing students enrolled in your assigned learning center: <strong>{teacherCenter}</strong>
            </span>
            <span className="text-[10px] bg-sky-200 text-sky-900 px-2 py-0.5 rounded font-semibold">
              Teacher Filter Active
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'students'
                  ? 'Search student name, PIN, grade, ID...'
                  : 'Search staff name, role, ID, PIN...'
              }
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {activeTab === 'students' && (
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All Campuses">All Campuses</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {activeTab === 'students' && !teacherCenter && (
            <select
              value={centerFilter}
              onChange={(e) => setCenterFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Learning Centers</option>
              {centers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Students Table */}
        {activeTab === 'students' && (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Student Name & ID</th>
                  <th className="py-2.5 px-3">Grade & Center</th>
                  <th className="py-2.5 px-3">4-Digit PIN</th>
                  <th className="py-2.5 px-3">Class Supervisor</th>
                  <th className="py-2.5 px-3">Parent & Contact</th>
                  <th className="py-2.5 px-3 text-right">Badge & QR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.student_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{s.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {s.student_id}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-slate-800">{s.learning_center_id}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                              s.campus === 'Spring Campus'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {s.campus || 'Campus'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">{s.grade}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {s.pin_code}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-medium">{s.supervisor_name}</div>
                        <div className="text-[10px] text-slate-400">Monitor: {s.monitor_name}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-medium">{s.parent_names}</div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{s.emergency_contact}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setBadgeTarget({ item: s, type: 'Student' })}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-blue-600 font-semibold transition text-[11px]"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>View Badge</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Staff Table */}
        {activeTab === 'staff' && (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Staff Name & ID</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">3-Digit PIN</th>
                  <th className="py-2.5 px-3">Assigned Center / Dept</th>
                  <th className="py-2.5 px-3">Email & Contact</th>
                  <th className="py-2.5 px-3 text-right">Credential Badge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((st) => (
                  <tr key={st.staff_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{st.full_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ID: {st.staff_id}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {st.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {st.pin_code}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {st.learning_center_id || 'Main Administration'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-800">{st.email}</div>
                      <div className="text-[10px] text-slate-400">{st.phone || '—'}</div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setBadgeTarget({ item: st, type: 'Staff' })}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-indigo-600 font-semibold transition text-[11px]"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Staff Badge</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 my-auto">
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <GraduationCap className="w-4 h-4" />
                <span>Enroll New Student</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddStudentOpen(false)}
                className="text-blue-100 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Mason Alexander"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Grade:</label>
                  <select
                    value={studentGrade}
                    onChange={(e) => setStudentGrade(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Kindergarten">Kindergarten</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Auto-Generated 4-Digit PIN:
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      maxLength={4}
                      value={studentPin}
                      onChange={(e) => setStudentPin(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Learning Center / Classroom:
                </label>
                <select
                  value={studentCenter}
                  onChange={(e) => setStudentCenter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="Learning Center Alpha">Learning Center Alpha</option>
                  <option value="Learning Center Beta">Learning Center Beta</option>
                  <option value="Learning Center Gamma">Learning Center Gamma</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supervisor (Main Teacher):</label>
                  <input
                    type="text"
                    value={studentSupervisor}
                    onChange={(e) => setStudentSupervisor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monitor (Assistant):</label>
                  <input
                    type="text"
                    value={studentMonitor}
                    onChange={(e) => setStudentMonitor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parent / Guardian Names:</label>
                <input
                  type="text"
                  value={studentParents}
                  onChange={(e) => setStudentParents(e.target.value)}
                  placeholder="e.g. Thomas & Laura Alexander"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency Telephone:</label>
                <input
                  type="text"
                  value={studentEmergency}
                  onChange={(e) => setStudentEmergency(e.target.value)}
                  placeholder="e.g. (555) 392-1823"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-sm"
                >
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal (Super User ICCE Coordinator) */}
      {isAddStaffOpen && isSuperUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 my-auto">
            <div className="bg-purple-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <Shield className="w-4 h-4 text-purple-300" />
                <span>Super User: Register Staff Member</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="text-purple-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Staff Full Name:</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Jessica Sterling"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address:</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="e.g. jessica.sterling@school.edu"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Role:</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                  >
                    <option value="Teacher">Teacher</option>
                    <option value="Admin Assistant">Admin Assistant</option>
                    <option value="Principal">Principal</option>
                    <option value="Director">Director</option>
                    <option value="ICCE Coordinator">ICCE Coordinator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Unique 3-Digit Staff PIN:
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-purple-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Department / Classroom:
                </label>
                <input
                  type="text"
                  value={staffCenter}
                  onChange={(e) => setStaffCenter(e.target.value)}
                  placeholder="e.g. Learning Center Gamma"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Telephone:</label>
                <input
                  type="text"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="e.g. (555) 234-5678"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-semibold shadow-sm"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
      />

      {/* QR Code & Printable ID Card PDF Generator Module */}
      <IDCardGeneratorModal
        isOpen={isIDGeneratorOpen}
        onClose={() => setIsIDGeneratorOpen(false)}
        defaultType={idGeneratorDefaultType}
      />

      {/* ID Badge Viewer Modal */}
      {badgeTarget && (
        <BadgeModal
          item={badgeTarget.item}
          type={badgeTarget.type}
          onClose={() => setBadgeTarget(null)}
        />
      )}
    </div>
  );
};
