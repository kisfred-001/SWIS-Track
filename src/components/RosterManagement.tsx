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
  Phone,
  UserPlus,
  Briefcase,
  KeyRound,
  FileSpreadsheet,
  Bed,
  Sun,
  Edit,
  Eye,
  Camera,
  Trash2,
} from 'lucide-react';
import { Student, Staff, UserRole } from '../types';
import { BadgeModal } from './BadgeModal';
import { BulkUploadModal } from './BulkUploadModal';
import { IDCardGeneratorModal } from './IDCardGeneratorModal';
import { StudentEditModal } from './StudentEditModal';
import { StudentProfileModal } from './StudentProfileModal';
import { SchoolLogo } from './SchoolLogo';

export const RosterManagement: React.FC = () => {
  const {
    students,
    saveStudent,
    deleteStudent,
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
  const [sectionFilter, setSectionFilter] = useState<'all' | 'Day' | 'Boarding'>('all');

  // Bulk Upload Modal
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  // ID Card Generator & PDF Export Modal
  const [isIDGeneratorOpen, setIsIDGeneratorOpen] = useState(false);
  const [idGeneratorDefaultType, setIdGeneratorDefaultType] = useState<'Student' | 'Staff'>('Student');

  // Badge Modal
  const [badgeTarget, setBadgeTarget] = useState<{ item: Student | Staff; type: 'Student' | 'Staff' } | null>(null);

  // Student Edit / Add Modal
  const [isStudentEditOpen, setIsStudentEditOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  // Student Profile Viewer Modal
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<Student | null>(null);

  // Add Staff Modal (ICCE Coordinator Super User)
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('Monitor');
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
      const matchesSection =
        sectionFilter === 'all' ||
        (sectionFilter === 'Boarding' ? s.enrollment_type === 'Boarding' : s.enrollment_type !== 'Boarding');

      const matchesSearch =
        !q ||
        s.full_name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q) ||
        s.pin_code.includes(q) ||
        (s.grade || '').toLowerCase().includes(q) ||
        (s.supervisor_name || '').toLowerCase().includes(q) ||
        (s.parent_names || '').toLowerCase().includes(q) ||
        (s.emergency_contact || '').includes(q);

      return (
        matchesCampus &&
        matchesCenter &&
        matchesSection &&
        matchesSearch &&
        (teacherCenter ? s.learning_center_id === teacherCenter : true)
      );
    });
  }, [students, selectedCampus, centerFilter, sectionFilter, searchQuery, teacherCenter]);

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
      phone: staffPhone.trim() || '+256 700 000 000',
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <SchoolLogo variant="emblem" size="md" className="hidden sm:inline-flex" />
            <div>
              <h2 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <span>Student Information &amp; Faculty Roster</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage student profiles, photographs, parent contacts, designated pickups, and ID credentials.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

            {/* Action buttons based on active tab */}
            {activeTab === 'students' ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIdGeneratorDefaultType('Student');
                    setIsIDGeneratorOpen(true);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-semibold shadow-2xs transition"
                  title="Generate printable student ID cards with official logo"
                >
                  <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Print ID Cards (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBulkUploadOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition"
                  title="Bulk upload student CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                  <span>Bulk Import CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStudentToEdit(null);
                    setIsStudentEditOpen(true);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#8B1E2F] hover:bg-[#6D1422] text-white rounded-lg text-xs font-bold shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Enroll New Student</span>
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

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'students'
                  ? 'Search student name, ID, PIN, parent, emergency phone...'
                  : 'Search staff name, role, ID, PIN...'
              }
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#8B1E2F] focus:outline-none"
            />
          </div>

          {activeTab === 'students' && (
            <>
              {/* Campus Selector */}
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-bold focus:ring-2 focus:ring-[#8B1E2F] focus:outline-none"
              >
                <option value="All Campuses">All Campuses</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Day vs Boarding Section Filter */}
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value as any)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-[#8B1E2F] focus:outline-none"
              >
                <option value="all">All Sections (Day &amp; Boarding)</option>
                <option value="Day">Day Students Only</option>
                <option value="Boarding">Boarding Section Only (Springs)</option>
              </select>

              {/* Learning Center Filter */}
              {!teacherCenter && (
                <select
                  value={centerFilter}
                  onChange={(e) => setCenterFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:ring-2 focus:ring-[#8B1E2F] focus:outline-none"
                >
                  <option value="all">All Learning Centers</option>
                  {centers.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
        </div>

        {/* Students Roster View */}
        {activeTab === 'students' && (
          <div className="space-y-3">
            {/* Desktop Table (>= 768px) */}
            <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">Student &amp; Photo</th>
                    <th className="py-2.5 px-3">Campus &amp; Section</th>
                    <th className="py-2.5 px-3">Learning Center</th>
                    <th className="py-2.5 px-3">Supervisor</th>
                    <th className="py-2.5 px-3">Parents &amp; Pickups</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No students matching current search or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => {
                      const isBethany = s.learning_center_id === 'Bethany';
                      const isBoarding = s.enrollment_type === 'Boarding';
                      const pickupCount = s.designated_pickups?.length || 0;

                      return (
                        <tr key={s.student_id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2.5">
                              {s.photo_url ? (
                                <img
                                  src={s.photo_url}
                                  alt={s.full_name}
                                  className="w-9 h-9 rounded-xl object-cover border border-slate-300 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">
                                  {s.full_name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedStudentProfile(s)}
                                  className="font-bold text-slate-900 hover:text-[#8B1E2F] hover:underline text-left block"
                                >
                                  {s.full_name}
                                </button>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  ID: {s.student_id} • PIN: <span className="font-bold text-blue-700">{s.pin_code}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">{s.campus}</div>
                            {isBoarding ? (
                              <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200 mt-0.5">
                                <Bed className="w-2.5 h-2.5" />
                                <span>Boarding (Mon-Fri)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 mt-0.5">
                                <Sun className="w-2.5 h-2.5" />
                                <span>Day Section</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-800">{s.learning_center_id}</div>
                            <div className="text-[10px] text-slate-500">
                              {s.monitor_name ? `Monitor: ${s.monitor_name}` : <span className="text-slate-400 italic">No monitor</span>}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            {s.supervisor_name ? (
                              <div>
                                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  {s.supervisor_name}
                                </span>
                                <div className="text-[9px] text-emerald-700 mt-0.5 font-medium">
                                  Center Supervisor
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-400 italic text-[11px]">
                                Assigned Supervisor
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <div className="text-slate-800 font-medium">{s.parent_names || 'Parent'}</div>
                            <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{s.emergency_contact}</span>
                            </div>
                            {pickupCount > 0 && (
                              <div className="text-[9px] text-indigo-700 font-semibold mt-0.5">
                                {pickupCount} Designated {pickupCount === 1 ? 'Person' : 'Persons'}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedStudentProfile(s)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                                title="View Security Dossier & Contacts"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setStudentToEdit(s);
                                  setIsStudentEditOpen(true);
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition"
                                title="Edit Student Info"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setBadgeTarget({ item: s, type: 'Student' })}
                                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-[#8B1E2F] hover:bg-[#8B1E2F]/10 text-[#8B1E2F] font-semibold transition text-[11px]"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>Badge</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< 768px) */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredStudents.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl">
                  No students found matching current filters.
                </div>
              ) : (
                filteredStudents.map((s) => {
                  const isBethany = s.learning_center_id === 'Bethany';
                  const isBoarding = s.enrollment_type === 'Boarding';
                  const pickupCount = s.designated_pickups?.length || 0;

                  return (
                    <div
                      key={s.student_id}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2.5">
                          {s.photo_url ? (
                            <img
                              src={s.photo_url}
                              alt={s.full_name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-300 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 font-bold shrink-0">
                              {s.full_name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{s.full_name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              ID: {s.student_id} • PIN: <span className="font-bold text-blue-700">{s.pin_code}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          {isBoarding ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                              Boarding
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                              Day
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/80">
                        <div>
                          <span className="text-slate-400">Campus:</span>{' '}
                          <strong className="text-slate-700">{s.campus}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Center:</span>{' '}
                          <strong className="text-slate-700">{s.learning_center_id}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Supervisor:</span>{' '}
                          {s.supervisor_name ? (
                            <strong className="text-emerald-800">{s.supervisor_name}</strong>
                          ) : (
                            <span className="text-slate-400 italic">Assigned Supervisor</span>
                          )}
                        </div>
                        <div>
                          <span className="text-slate-400">Monitor:</span>{' '}
                          {s.monitor_name ? (
                            <strong className="text-indigo-800">{s.monitor_name}</strong>
                          ) : (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-1 text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-200/60">
                        <span>Parents: {s.parent_names}</span>
                        {pickupCount > 0 && (
                          <span className="text-indigo-600 font-semibold">{pickupCount} Authorized</span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentProfile(s)}
                          className="py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-center hover:bg-slate-100"
                        >
                          Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStudentToEdit(s);
                            setIsStudentEditOpen(true);
                          }}
                          className="py-1.5 rounded-lg border border-blue-300 text-blue-700 font-semibold text-center hover:bg-blue-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setBadgeTarget({ item: s, type: 'Student' })}
                          className="py-1.5 rounded-lg bg-[#8B1E2F] text-white font-semibold text-center hover:bg-[#6D1422]"
                        >
                          Badge
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Staff Table */}
        {activeTab === 'staff' && (
          <div className="divide-y divide-slate-100 overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3">Staff Name &amp; ID</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">3-Digit PIN</th>
                  <th className="py-2.5 px-3">Assigned Center / Dept</th>
                  <th className="py-2.5 px-3">Email &amp; Contact</th>
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
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.role === 'Supervisor'
                            ? 'bg-emerald-100 text-emerald-800'
                            : st.role === 'Administrator' || st.role === 'Principal' || st.role === 'Director'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {st.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {st.pin_code}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{st.learning_center_id || 'Campus Wide'}</div>
                      <div className="text-[10px] text-slate-400">{st.campus || 'All Campuses'}</div>
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

      {/* Student Edit & Add Modal */}
      <StudentEditModal
        isOpen={isStudentEditOpen}
        onClose={() => {
          setIsStudentEditOpen(false);
          setStudentToEdit(null);
        }}
        student={studentToEdit}
        onSave={async (payload, existingId) => {
          const res = await saveStudent(payload, existingId);
          if (res.success) {
            setFormMsg({ type: 'success', text: res.message });
            setTimeout(() => setFormMsg(null), 5000);
          }
          return res;
        }}
        campuses={campuses}
        learningCenters={learningCenters}
      />

      {/* Student Profile Viewer Modal */}
      <StudentProfileModal
        isOpen={Boolean(selectedStudentProfile)}
        onClose={() => setSelectedStudentProfile(null)}
        student={selectedStudentProfile}
        onEdit={(st) => {
          setSelectedStudentProfile(null);
          setStudentToEdit(st);
          setIsStudentEditOpen(true);
        }}
        onPrintBadge={(st) => {
          setSelectedStudentProfile(null);
          setBadgeTarget({ item: st, type: 'Student' });
        }}
        onDelete={async (studentId) => {
          const res = await deleteStudent(studentId);
          setFormMsg({ type: 'success', text: res.message });
          setTimeout(() => setFormMsg(null), 5000);
        }}
      />

      {/* Add Staff Modal (ICCE Coordinator Super User) */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 my-auto">
            <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <UserPlus className="w-4 h-4" />
                <span>Create Staff Account</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="text-purple-100 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Mrs. Sarah Kigozi"
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
                  placeholder="sarah.kigozi@swis.ac.ug"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role:</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                  >
                    <option value="Monitor">Monitor (Assistant)</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Supervisor">Supervisor (Bethany)</option>
                    <option value="GateOfficer">Gate Security Officer</option>
                    <option value="OfficeAdmin">Office Admin</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">3-Digit PIN:</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-purple-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assigned Learning Center:
                </label>
                <select
                  value={staffCenter}
                  onChange={(e) => setStaffCenter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                >
                  <option value="Main Office">Main Office / Administration</option>
                  <option value="Security Gate">Security Gate</option>
                  <option value="Bethany">Bethany</option>
                  <option value="Kayil">Kayil</option>
                  <option value="Splendor">Splendor</option>
                  <option value="Doxa">Doxa</option>
                  <option value="Antioch">Antioch</option>
                  <option value="Azusa">Azusa</option>
                  <option value="Bloom and Archie">Bloom and Archie</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Telephone:</label>
                <input
                  type="text"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="+256 772 000 000"
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Badge Modal */}
      {badgeTarget && (
        <BadgeModal
          onClose={() => setBadgeTarget(null)}
          item={badgeTarget.item}
          type={badgeTarget.type}
        />
      )}

      {/* Bulk Upload Modal */}
      {isBulkUploadOpen && (
        <BulkUploadModal
          isOpen={isBulkUploadOpen}
          onClose={() => setIsBulkUploadOpen(false)}
        />
      )}

      {/* ID Card Generator & PDF Export Modal */}
      {isIDGeneratorOpen && (
        <IDCardGeneratorModal
          isOpen={isIDGeneratorOpen}
          onClose={() => setIsIDGeneratorOpen(false)}
          defaultType={idGeneratorDefaultType}
        />
      )}
    </div>
  );
};
