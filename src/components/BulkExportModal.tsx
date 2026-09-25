import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import {
  Download,
  X,
  FileSpreadsheet,
  FileJson,
  QrCode,
  Users,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Building,
  Archive,
  CheckCircle2,
  Printer,
  Sparkles,
  Info,
  Layers,
  Clock,
  Filter,
} from 'lucide-react';
import {
  downloadFile,
  exportStudentsCSV,
  exportStaffCSV,
  exportAdministratorsCSV,
  exportAttendanceLogsCSV,
  exportCampusesAndCentersCSV,
  generatePrintableBadgesHTML,
  generateMasterSystemZip,
} from '../utils/exportUtils';

interface BulkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkExportModal: React.FC<BulkExportModalProps> = ({ isOpen, onClose }) => {
  const { students, logs, campuses, learningCenters, editRequests, operationalPolicies } = useAttendance();
  const { allStaff } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'badges' | 'students' | 'staff' | 'admins' | 'logs'>('all');
  const [selectedCampus, setSelectedCampus] = useState<string>('All Campuses');
  const [selectedCenter, setSelectedCenter] = useState<string>('All Centers');
  const [isZipping, setIsZipping] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchCampus = selectedCampus === 'All Campuses' || s.campus === selectedCampus;
      const matchCenter = selectedCenter === 'All Centers' || s.learning_center_id === selectedCenter;
      return matchCampus && matchCenter;
    });
  }, [students, selectedCampus, selectedCenter]);

  // Filtered Staff
  const filteredStaff = useMemo(() => {
    return allStaff.filter((s) => {
      return selectedCampus === 'All Campuses' || s.campus === selectedCampus || !s.campus || s.campus === 'All Campuses';
    });
  }, [allStaff, selectedCampus]);

  // Filtered Administrators
  const adminRoles = [
    'ICCE Coordinator',
    'Campus Director',
    'Principal',
    'Administrator',
    'Learning Center Supervisor',
  ];
  const administrators = useMemo(() => {
    return filteredStaff.filter((s) => adminRoles.includes(s.role));
  }, [filteredStaff]);

  const showToast = (msg: string) => {
    setExportSuccessMsg(msg);
    setTimeout(() => setExportSuccessMsg(''), 4000);
  };

  // Export Handlers
  const handleExportStudentsCSV = () => {
    const csv = exportStudentsCSV(filteredStudents);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(csv, `students_list_${dateStr}.csv`);
    showToast(`Exported ${filteredStudents.length} student records to CSV.`);
  };

  const handleExportStudentsJSON = () => {
    const json = JSON.stringify(filteredStudents, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(json, `students_list_${dateStr}.json`, 'application/json');
    showToast(`Exported ${filteredStudents.length} student records to JSON.`);
  };

  const handleExportStaffCSV = () => {
    const csv = exportStaffCSV(filteredStaff);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(csv, `staff_members_${dateStr}.csv`);
    showToast(`Exported ${filteredStaff.length} staff records to CSV.`);
  };

  const handleExportStaffJSON = () => {
    const json = JSON.stringify(filteredStaff, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(json, `staff_members_${dateStr}.json`, 'application/json');
    showToast(`Exported ${filteredStaff.length} staff records to JSON.`);
  };

  const handleExportAdminsCSV = () => {
    const csv = exportAdministratorsCSV(administrators);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(csv, `administrators_${dateStr}.csv`);
    showToast(`Exported ${administrators.length} administrator records to CSV.`);
  };

  const handleExportAdminsJSON = () => {
    const json = JSON.stringify(administrators, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(json, `administrators_${dateStr}.json`, 'application/json');
    showToast(`Exported ${administrators.length} administrator records to JSON.`);
  };

  const handleExportLogsCSV = () => {
    const csv = exportAttendanceLogsCSV(logs);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(csv, `attendance_logs_${dateStr}.csv`);
    showToast(`Exported ${logs.length} attendance movement logs to CSV.`);
  };

  const handleExportLogsJSON = () => {
    const json = JSON.stringify(logs, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(json, `attendance_logs_${dateStr}.json`, 'application/json');
    showToast(`Exported ${logs.length} attendance movement logs to JSON.`);
  };

  const handlePrintBadges = () => {
    const html = generatePrintableBadgesHTML(filteredStudents);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      showToast(`Opened printable QR badges for ${filteredStudents.length} students.`);
    } else {
      alert('Pop-up blocked. Please allow pop-ups to open the printable badge sheet.');
    }
  };

  const handleExportMasterZip = async () => {
    setIsZipping(true);
    try {
      const zipBlob = await generateMasterSystemZip({
        students: filteredStudents,
        staff: filteredStaff,
        logs,
        campuses,
        learningCenters,
        editRequests,
        operationalPolicies,
      });
      const dateStr = new Date().toISOString().split('T')[0];
      downloadFile(zipBlob, `swis_system_data_archive_${dateStr}.zip`, 'application/zip');
      showToast('Successfully generated and downloaded complete system ZIP archive!');
    } catch (err: any) {
      alert('Failed to generate ZIP archive: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/30 border border-indigo-400/30 rounded-xl text-indigo-300">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-white">Bulk System Data &amp; Badges Export Center</h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold uppercase tracking-wider">
                  Full Roster &amp; Media
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Export comprehensive institutional data, QR student badges, staff rosters, administrative lists, and live logs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {exportSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center space-x-2 text-xs font-bold text-emerald-900 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportSuccessMsg}</span>
          </div>
        )}

        {/* Global Filter Bar */}
        <div className="bg-slate-50 p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-slate-700 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span>Filter Scope:</span>
            </span>

            {/* Campus selector */}
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All Campuses">All Campuses ({campuses.length})</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Learning Center selector */}
            <select
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All Centers">All Learning Centers ({learningCenters.length})</option>
              {learningCenters.map((lc) => (
                <option key={lc.id} value={lc.name}>
                  {lc.name} ({lc.campus})
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Scope: <strong className="text-slate-900">{filteredStudents.length}</strong> Students,{' '}
            <strong className="text-slate-900">{filteredStaff.length}</strong> Staff,{' '}
            <strong className="text-slate-900">{administrators.length}</strong> Admins
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-slate-200 bg-white px-4 pt-2 overflow-x-auto gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-indigo-600 text-indigo-900 bg-indigo-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Archive className="w-4 h-4 text-indigo-600" />
            <span>Master System ZIP Archive</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('badges')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'badges'
                ? 'border-indigo-600 text-indigo-900 bg-indigo-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4 text-purple-600" />
            <span>a). Student Badges ({filteredStudents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'students'
                ? 'border-indigo-600 text-indigo-900 bg-indigo-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>b). Students List ({filteredStudents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'staff'
                ? 'border-indigo-600 text-indigo-900 bg-indigo-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4 text-blue-600" />
            <span>c). Staff Roster ({filteredStaff.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admins')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'admins'
                ? 'border-indigo-600 text-indigo-900 bg-indigo-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>d). Administrators ({administrators.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'logs'
                ? 'border-indigo-600 text-indigo-900 bg-indigo-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-rose-600" />
            <span>e). Attendance Logs ({logs.length})</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* TAB 1: MASTER ZIP ARCHIVE */}
          {(activeTab === 'all' || activeTab === 'badges') && (
            <div className="p-5 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl shadow-md border border-indigo-500/30 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-indigo-600/40 border border-indigo-400/40 rounded-xl text-indigo-200 shrink-0">
                    <Archive className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">One-Click Complete Bulk System Archive (ZIP)</h4>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      Packages all student rosters, staff lists, administrative records, attendance logs, system structure JSONs, and printable QR badges into a single downloadable ZIP file.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportMasterZip}
                  disabled={isZipping}
                  className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs transition shadow-lg flex items-center space-x-2 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Download className={`w-4 h-4 ${isZipping ? 'animate-bounce' : ''}`} />
                  <span>{isZipping ? 'Packaging System ZIP...' : 'Download Master ZIP Archive'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-[11px] text-slate-300">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Students CSV &amp; JSON</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Staff &amp; Admins CSV</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Printable Badges Sheet</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Master Backup JSON</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION A: STUDENT BADGES */}
          {(activeTab === 'all' || activeTab === 'badges') && (
            <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-purple-100 text-purple-800 rounded-lg">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">a). Student Identification Badges</h4>
                    <p className="text-[11px] text-slate-600">
                      Printable A4 badge sheets equipped with QR codes, student IDs, supervisor names, and security PINs.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handlePrintBadges}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Badges Sheet (A4 PDF/HTML)</span>
                  </button>
                </div>
              </div>

              {/* Sample Badge Preview List */}
              <div className="bg-white p-3 rounded-xl border border-purple-200 max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {filteredStudents.slice(0, 6).map((s) => (
                  <div key={s.student_id} className="p-2 border border-slate-200 rounded-lg bg-slate-50 flex items-center space-x-2">
                    <div className="w-8 h-8 bg-purple-100 text-purple-800 font-bold rounded flex items-center justify-center shrink-0 text-[11px]">
                      QR
                    </div>
                    <div className="truncate min-w-0">
                      <div className="font-bold text-slate-900 text-[11px] truncate">{s.full_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{s.student_id} • {s.campus}</div>
                    </div>
                  </div>
                ))}
                {filteredStudents.length > 6 && (
                  <div className="p-2 border border-dashed border-purple-300 rounded-lg bg-purple-50/50 flex items-center justify-center text-[11px] font-bold text-purple-800">
                    + {filteredStudents.length - 6} More Student Badges Ready
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION B: LIST OF STUDENTS */}
          {(activeTab === 'all' || activeTab === 'students') && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">b). List of Students ({filteredStudents.length})</h4>
                    <p className="text-[11px] text-slate-600">
                      Full student roster containing admission IDs, assigned learning centers, campus, supervisor, and parent contacts.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleExportStudentsCSV}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportStudentsJSON}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <FileJson className="w-4 h-4" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION C: LIST OF STAFF MEMBERS */}
          {(activeTab === 'all' || activeTab === 'staff') && (
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">c). List of Staff Members ({filteredStaff.length})</h4>
                    <p className="text-[11px] text-slate-600">
                      Complete faculty and staff directory including roles, assigned campuses, email addresses, and security PINs.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleExportStaffCSV}
                    className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportStaffJSON}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <FileJson className="w-4 h-4" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION D: LIST OF ADMINISTRATORS */}
          {(activeTab === 'all' || activeTab === 'admins') && (
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-amber-100 text-amber-900 rounded-lg">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">d). List of Administrators ({administrators.length})</h4>
                    <p className="text-[11px] text-slate-600">
                      High-level administrators (ICCE Coordinator, Campus Directors, Principals, Administrators, Supervisors).
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleExportAdminsCSV}
                    className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportAdminsJSON}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <FileJson className="w-4 h-4" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>

              {/* Admin list preview */}
              <div className="bg-white p-3 rounded-xl border border-amber-200 divide-y divide-slate-100 max-h-36 overflow-y-auto">
                {administrators.map((a) => (
                  <div key={a.staff_id} className="py-1.5 flex items-center justify-between text-[11px]">
                    <div>
                      <strong className="text-slate-900 font-bold">{a.full_name}</strong>
                      <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-[10px]">{a.role}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[10px]">{a.campus || 'All Campuses'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION E: OTHER USEFUL AND RELEVANT DATA */}
          {(activeTab === 'all' || activeTab === 'logs') && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">e). Additional System &amp; Operational Datasets</h4>
                  <p className="text-[11px] text-slate-600">
                    Live attendance logs, audit edit requests, campuses, and learning center structures.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Attendance Logs &amp; Activity ({logs.length})</div>
                    <div className="text-[10px] text-slate-500">Every check-in, check-out, and release party</div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={handleExportLogsCSV}
                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      CSV
                    </button>
                    <button
                      type="button"
                      onClick={handleExportLogsJSON}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      JSON
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Campuses &amp; Centers ({campuses.length + learningCenters.length})</div>
                    <div className="text-[10px] text-slate-500 font-mono">Structure and assigned supervisors</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const csv = exportCampusesAndCentersCSV(campuses, learningCenters);
                      const dateStr = new Date().toISOString().split('T')[0];
                      downloadFile(csv, `system_structure_${dateStr}.csv`);
                      showToast('Exported campuses and learning centers structure to CSV.');
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    CSV
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-slate-500 font-mono text-[11px]">
            <Info className="w-3.5 h-3.5 text-indigo-600" />
            <span>All exported files strictly adhere to institutional security standard policies.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
