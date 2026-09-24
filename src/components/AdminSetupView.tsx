import React, { useState, useEffect } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  ShieldCheck,
  Settings,
  Building,
  Layers,
  Users,
  KeyRound,
  Database,
  RefreshCw,
  CheckCircle2,
  Clock,
  Lock,
  Download,
  AlertTriangle,
  Sparkles,
  School,
  Edit,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  Check,
  Trash2,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  Eye,
  FileCheck,
  Info,
  ExternalLink,
} from 'lucide-react';
import { Campus, LearningCenter, UserRole } from '../types';
import { SchoolLogo } from './SchoolLogo';

export const AdminSetupView: React.FC = () => {
  const {
    campuses,
    learningCenters,
    students,
    logs,
    editRequests,
    urgentAlerts,
    saveCampus,
    saveLearningCenter,
    forceResetToOfficialRoster,
    purgeAllDummyData,
    systemLogo,
    updateSystemLogo,
  } = useAttendance();

  const {
    currentUser,
    allStaff,
    switchUser,
    canAccessSetup,
    idleTimeoutMinutes,
    setIdleTimeoutMinutes,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'branding' | 'campuses' | 'learning_centers' | 'rbac' | 'security' | 'database'>('branding');

  // Branding & Logo State
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(systemLogo);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [logoFileError, setLogoFileError] = useState('');
  const [logoSaving, setLogoSaving] = useState(false);
  const [logoSuccessMsg, setLogoSuccessMsg] = useState('');
  const [logoMode, setLogoMode] = useState<'upload' | 'url'>('upload');

  // Sync logo preview if systemLogo updates from remote
  useEffect(() => {
    if (systemLogo && !logoPreviewUrl) {
      setLogoPreviewUrl(systemLogo);
    }
  }, [systemLogo]);

  // Edit Campus Modal state
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  const [campusLeadAdmin, setCampusLeadAdmin] = useState('');
  const [campusLocation, setCampusLocation] = useState('');
  const [campusPhone, setCampusPhone] = useState('');
  const [campusEmail, setCampusEmail] = useState('');
  const [campusHours, setCampusHours] = useState('');
  const [campusCapacity, setCampusCapacity] = useState<number>(100);

  // Edit Learning Center Modal state
  const [editingLC, setEditingLC] = useState<LearningCenter | null>(null);
  const [lcSupervisor, setLcSupervisor] = useState('');
  const [lcMonitor, setLcMonitor] = useState('');
  const [lcRoom, setLcRoom] = useState('');
  const [lcCapacity, setLcCapacity] = useState<number>(25);

  // Feedback states
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [savingMsg, setSavingMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [cleanLoading, setCleanLoading] = useState(false);
  const [cleanResult, setCleanResult] = useState<{
    success: boolean;
    message: string;
    deletedLogs?: number;
    deletedRequests?: number;
    deletedAlerts?: number;
  } | null>(null);

  // Filter learning centers to strictly enforce single Bethany at Hope Campus
  const validLearningCenters = learningCenters.filter(
    (lc) => !(lc.name === 'Bethany' && lc.campus !== 'Hope Campus') && lc.id !== 'spring-bethany'
  );

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFileError('');

    if (!file.type.startsWith('image/')) {
      setLogoFileError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoFileError('Image file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreviewUrl(reader.result as string);
    };
    reader.onerror = () => {
      setLogoFileError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyLogoUrl = () => {
    if (!logoUrlInput.trim()) {
      setLogoFileError('Please enter a valid image URL.');
      return;
    }
    setLogoFileError('');
    setLogoPreviewUrl(logoUrlInput.trim());
  };

  const handleSaveSystemLogo = async () => {
    if (!logoPreviewUrl) {
      setLogoFileError('Please choose or enter an image before saving.');
      return;
    }
    setLogoSaving(true);
    setLogoFileError('');
    const res = await updateSystemLogo(logoPreviewUrl);
    setLogoSaving(false);
    if (res.success) {
      setLogoSuccessMsg(res.message);
      setTimeout(() => setLogoSuccessMsg(''), 4500);
    } else {
      setLogoFileError(res.message);
    }
  };

  const handleResetSystemLogo = async () => {
    if (!window.confirm('Reset system logo to default branding?')) {
      return;
    }
    setLogoSaving(true);
    const res = await updateSystemLogo(null);
    setLogoPreviewUrl(null);
    setLogoUrlInput('');
    setLogoSaving(false);
    setLogoSuccessMsg(res.message);
    setTimeout(() => setLogoSuccessMsg(''), 4500);
  };

  // Guard: ONLY accessible to ICCE Coordinator
  if (!canAccessSetup) {
    const icceUser = allStaff.find((s) => s.role === 'ICCE Coordinator');

    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl border border-red-200 shadow-md text-center space-y-5">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">
            ICCE Coordinator Access Required
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            The <strong>Administrative Setup Module</strong> is strictly reserved for the <strong>ICCE Coordinator</strong> (Mr. Fredrick Kariuki). Your current account (<strong>{currentUser?.full_name}</strong> - <em>{currentUser?.role}</em>) does not possess high-level administrative setup privileges.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 text-left space-y-1">
          <div className="font-bold flex items-center space-x-1.5">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>Master System Policy</span>
          </div>
          <div>
            System setup, learning center assignments, campus parameters, and database sync can only be executed by the ICCE Coordinator.
          </div>
        </div>

        {icceUser && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => switchUser(icceUser)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <KeyRound className="w-4 h-4" />
              <span>Switch to ICCE Coordinator ({icceUser.full_name})</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Handle Edit Campus Save
  const handleSaveCampus = async () => {
    if (!editingCampus) return;
    setSavingMsg(null);
    const updated: Campus = {
      ...editingCampus,
      lead_administrator: campusLeadAdmin || editingCampus.lead_administrator,
      location: campusLocation || editingCampus.location,
      phone: campusPhone || editingCampus.phone,
      email: campusEmail || editingCampus.email,
      capacity: campusCapacity || editingCampus.capacity,
    };

    const res = await saveCampus(updated);
    if (res.success) {
      setSavingMsg({ type: 'success', message: res.message });
      setEditingCampus(null);
    } else {
      setSavingMsg({ type: 'error', message: res.message });
    }
  };

  // Handle Edit Learning Center Save
  const handleSaveLC = async () => {
    if (!editingLC) return;
    setSavingMsg(null);
    const updated: LearningCenter = {
      ...editingLC,
      supervisor_name: lcSupervisor || editingLC.supervisor_name,
      monitor_name: lcMonitor || editingLC.monitor_name,
      room_number: lcRoom || editingLC.room_number,
      capacity: lcCapacity || editingLC.capacity,
    };

    const res = await saveLearningCenter(updated);
    if (res.success) {
      setSavingMsg({ type: 'success', message: res.message });
      setEditingLC(null);
    } else {
      setSavingMsg({ type: 'error', message: res.message });
    }
  };

  // Handle Force Sync
  const handleForceSync = async () => {
    if (!window.confirm('Are you sure you want to re-synchronize the database with official school data? This ensures all 74 students from the CSV and official staff are properly updated.')) {
      return;
    }
    setSyncLoading(true);
    setSyncStatus(null);
    try {
      const res = await forceResetToOfficialRoster();
      setSyncStatus({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
    } finally {
      setSyncLoading(false);
    }
  };

  // Handle Clean System Data & Purge AI Dummy Data
  const handleCleanSystemData = async () => {
    if (
      !window.confirm(
        'PERMANENT ACTION: Are you sure you want to clean all system data and purge all AI dummy data?\n\n' +
        '• Purges all dummy/test attendance logs\n' +
        '• Purges all dummy/test edit requests\n' +
        '• Purges all urgent alerts\n' +
        '• Removes all dummy AI student records and restores strictly the 74 official CSV students\n' +
        '• Restores institutional staff roles and campus learning centers'
      )
    ) {
      return;
    }
    setCleanLoading(true);
    setCleanResult(null);
    setSyncStatus(null);
    try {
      const res = await purgeAllDummyData();
      setCleanResult({
        success: res.success,
        message: res.message,
        deletedLogs: res.deletedLogs,
        deletedRequests: res.deletedRequests,
        deletedAlerts: res.deletedAlerts,
      });
    } finally {
      setCleanLoading(false);
    }
  };

  // Export full snapshot JSON
  const handleExportSnapshot = () => {
    const backup = {
      timestamp: new Date().toISOString(),
      exported_by: currentUser?.full_name,
      campuses,
      learningCenters,
      studentsCount: students.length,
      students,
      staff: allStaff,
      logsCount: logs.length,
      logs,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `swis_attendance_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ICCE Coordinator Exclusive Module
            </span>
            <span className="text-xs text-slate-400">Master Level Administrative Rights</span>
          </div>
          <h1 className="text-2xl font-black mt-1 flex items-center space-x-2">
            <Settings className="w-6 h-6 text-indigo-400" />
            <span>Master System Administration & Setup</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Logged in as <strong>{currentUser?.full_name}</strong> ({currentUser?.email}) • Highest-Level Administrator
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleExportSnapshot}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export Snapshot</span>
          </button>

          <button
            type="button"
            onClick={handleForceSync}
            disabled={syncLoading}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
            <span>{syncLoading ? 'Synchronizing...' : 'Sync Official Roster'}</span>
          </button>
        </div>
      </div>

      {/* Sync Status Alert */}
      {syncStatus && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start space-x-2.5 border ${
            syncStatus.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-red-50 text-red-900 border-red-300'
          }`}
        >
          {syncStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          )}
          <div className="flex-1 font-medium">{syncStatus.message}</div>
          <button type="button" onClick={() => setSyncStatus(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {savingMsg && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
            savingMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-red-50 text-red-900 border-red-300'
          }`}
        >
          <span>{savingMsg.message}</span>
          <button type="button" onClick={() => setSavingMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Setup Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`px-3.5 py-2 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'branding'
              ? 'bg-[#8B1E2F] text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>School Logo & Branding</span>
          {systemLogo && (
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('campuses')}
          className={`px-3.5 py-2 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'campuses'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Campus Master Setup ({campuses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('learning_centers')}
          className={`px-3.5 py-2 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'learning_centers'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Learning Centers Master ({validLearningCenters.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rbac')}
          className={`px-3.5 py-2 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'rbac'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Role Hierarchy & RBAC Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-3.5 py-2 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'security'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Security & Timeout Policies</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('database')}
          className={`px-3.5 py-2 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'database'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Official Data Synchronization</span>
        </button>
      </div>

      {/* Tab: School Logo & System Branding */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-[#8B1E2F]">
                  Identity &amp; Media
                </span>
                {systemLogo ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                    <Check className="w-3 h-3 mr-1 text-emerald-600" /> Custom Logo Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                    Default Crest Active
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">Official School Logo &amp; Identity</h3>
              <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
                Upload the high-resolution official logo of Spirit &amp; Word International School. Your logo is automatically synchronized across the top navigation bar, student ID badges, staff credentials, and PDF exports.
              </p>
            </div>

            {systemLogo && (
              <button
                type="button"
                onClick={handleResetSystemLogo}
                disabled={logoSaving}
                className="px-3 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default Logo</span>
              </button>
            )}
          </div>

          {/* Feedback messages */}
          {logoSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center space-x-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{logoSuccessMsg}</span>
            </div>
          )}

          {logoFileError && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 flex items-center space-x-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{logoFileError}</span>
            </div>
          )}

          {/* Upload and Configuration Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 6 cols: Upload / Source controls */}
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>Logo Source</span>
                </span>

                <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setLogoMode('upload')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      logoMode === 'upload' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    File Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoMode('url')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      logoMode === 'url' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Image URL
                  </button>
                </div>
              </div>

              {logoMode === 'upload' ? (
                <div className="space-y-3">
                  <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition group">
                    <div className="p-3 bg-white rounded-full shadow-xs group-hover:scale-105 transition mb-2">
                      <Upload className="w-6 h-6 text-indigo-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      Click to browse or drop official school logo
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">
                      PNG, JPG, SVG, WebP up to 5MB (Square 1:1 or circular PNG recommended)
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    💡 <strong>Pro Tip:</strong> For highest print quality on Student ID Cards and Badges, use a square transparent PNG (e.g. 500×500 px or larger) showing the official school crest or emblem.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Direct Image URL
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        value={logoUrlInput}
                        onChange={(e) => setLogoUrlInput(e.target.value)}
                        placeholder="https://example.com/assets/swis-logo.png"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyLogoUrl}
                        className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition"
                      >
                        Preview URL
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Enter the full https:// URL of the hosted logo image.
                  </p>
                </div>
              )}

              {/* Apply / Save Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {logoPreviewUrl ? 'Logo ready for application.' : 'Select an image file to preview.'}
                </span>

                <button
                  type="button"
                  onClick={handleSaveSystemLogo}
                  disabled={!logoPreviewUrl || logoSaving}
                  className="px-4 py-2.5 bg-[#8B1E2F] hover:bg-[#721825] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-2"
                >
                  {logoSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Logo...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Apply &amp; Save School Logo</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right 6 cols: Live Multi-Surface Preview */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span>Live Multi-Surface Previews</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  Verify how your uploaded logo appears in different sections of the application:
                </p>

                {/* Surface 1: Dark Navigation Bar Surface */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Surface 1: Main Dark Navigation Bar
                  </span>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white p-1 rounded-xl shadow-md shrink-0">
                        {logoPreviewUrl ? (
                          <img
                            src={logoPreviewUrl}
                            alt="Logo Preview"
                            className="w-10 h-10 object-contain rounded"
                          />
                        ) : (
                          <SchoolLogo variant="emblem" size="md" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-white font-serif">Spirit &amp; Word</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/20 text-emerald-300">
                            Live Campus
                          </span>
                        </div>
                        <p className="text-[9px] text-amber-300 italic">
                          The Quick, The Sharp and The Clever
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Surface 2: Student ID Card Maroon Header */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Surface 2: Official Student ID Card Header
                  </span>
                  <div className="bg-[#8B1E2F] p-3 rounded-xl text-white flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="bg-white p-1 rounded-lg shrink-0 shadow-xs">
                        {logoPreviewUrl ? (
                          <img
                            src={logoPreviewUrl}
                            alt="ID Preview"
                            className="w-9 h-9 object-contain rounded"
                          />
                        ) : (
                          <SchoolLogo variant="emblem" size="sm" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-serif font-black tracking-wider text-[11px] uppercase text-white leading-tight">
                          SPIRIT &amp; WORD INT. SCHOOL
                        </h4>
                        <p className="font-serif text-[7.5px] tracking-widest uppercase text-amber-200 font-semibold">
                          The Quick, The Sharp and The Clever
                        </p>
                        <p className="text-[7px] text-slate-100 font-sans uppercase font-bold tracking-wider mt-0.5">
                          OFFICIAL STUDENT ID • 2026-2027
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Surface 3: Letterhead / Dashboard Header Banner */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Surface 3: Light Branded Banner (Dashboard &amp; Reports)
                  </span>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center space-x-3">
                    <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                      {logoPreviewUrl ? (
                        <img
                          src={logoPreviewUrl}
                          alt="Banner Preview"
                          className="w-11 h-11 object-contain rounded"
                        />
                      ) : (
                        <SchoolLogo variant="emblem" size="md" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-serif font-extrabold text-[#8B1E2F] text-sm uppercase leading-tight">
                        SPIRIT &amp; WORD INTERNATIONAL SCHOOL
                      </h4>
                      <div className="h-[1.5px] w-full bg-[#8B1E2F] my-0.5" />
                      <p className="text-[10px] text-slate-700 italic">
                        The Quick, The Sharp and The Clever
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Campuses Setup */}
      {activeTab === 'campuses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Campus Configurations</h3>
              <p className="text-xs text-slate-500">
                Configure primary administrators, operational hours, location, and capacity for Spring Campus and Hope Campus.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campuses.map((c) => {
              const campusStudentCount = students.filter((s) => s.campus === c.name).length;
              const campusLCCount = learningCenters.filter((lc) => lc.campus === c.name).length;

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 relative"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {c.code}
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900">{c.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{c.location}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingCampus(c);
                        setCampusLeadAdmin(c.lead_administrator);
                        setCampusLocation(c.location);
                        setCampusPhone(c.phone);
                        setCampusEmail(c.email);
                        setCampusCapacity(c.capacity || c.total_capacity || 100);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                      title="Edit Campus Details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Lead Administrator</span>
                      <strong className="text-slate-800">{c.lead_administrator}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Phone</span>
                      <span className="text-slate-700">{c.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Learning Centers</span>
                      <span className="text-indigo-600 font-bold">{campusLCCount} Centers</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Official Students</span>
                      <span className="text-emerald-600 font-bold">{campusStudentCount} Students</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Operating Hours:</span>
                      <span className="font-semibold">{c.opening_time} - {c.closing_time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Total Campus Capacity:</span>
                      <span className="font-semibold">{c.capacity} students</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Learning Centers Master Matrix */}
      {activeTab === 'learning_centers' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Master Learning Centers Directory ({validLearningCenters.length} Centers)
              </h3>
              <p className="text-xs text-slate-500">
                Assign supervisors, monitors, and room numbers. Monitors and Supervisors have equal rights in the system.
              </p>
            </div>
          </div>

          {/* Institutional Policy Banner */}
          <div className="p-3.5 bg-amber-50/90 border-b border-amber-200 text-amber-900 text-xs flex items-center space-x-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <div className="leading-snug">
              <strong>Official Staff &amp; Center Structure:</strong> Each learning center is led by an assigned <strong>Supervisor</strong> (Kayil: Mrs. Irene Oryem, Doxa: Mr. David Kimbugwe, Splendor: Mr. Arthur Mutebi, Bethany: Mrs. Eunice Mutebe, Antioch: Mrs. Doreen Mugaga, Azusa: Mr. Shafic Musika, Bloom and Archie: Mrs. Julie Mayanja). There is only one monitor in the school: <strong>Mrs. Joan Nandhego</strong> for Bethany Learning Center.
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-2.5 text-left">Learning Center</th>
                  <th className="px-4 py-2.5 text-left">Campus</th>
                  <th className="px-4 py-2.5 text-left">Supervisor</th>
                  <th className="px-4 py-2.5 text-left">Monitor</th>
                  <th className="px-4 py-2.5 text-center">Room</th>
                  <th className="px-4 py-2.5 text-center">Enrolled</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {validLearningCenters.map((lc) => {
                  const enrolledCount = students.filter(
                    (s) => s.campus === lc.campus && s.learning_center_id === lc.name
                  ).length;

                  return (
                    <tr key={lc.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {lc.name}
                        <div className="text-[10px] font-normal text-slate-400">{lc.description}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            lc.campus === 'Spring Campus'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {lc.campus}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {lc.supervisor_name ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {lc.supervisor_name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {lc.monitor_name ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            {lc.monitor_name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-600">
                        {lc.room_number || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-slate-900">{enrolledCount}</span>
                        <span className="text-slate-400 text-[10px]"> / {lc.capacity || 25}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLC(lc);
                            setLcSupervisor(lc.supervisor_name || '');
                            setLcMonitor(lc.monitor_name || '');
                            setLcRoom(lc.room_number || '');
                            setLcCapacity(lc.capacity || 25);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                        >
                          Configure
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Role Hierarchy & RBAC Matrix */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Official Institutional Role Architecture</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Highest Level Admin</span>
                <div className="font-extrabold text-indigo-900">Mr. Fredrick Kariuki</div>
                <div className="text-indigo-700 font-semibold">ICCE Coordinator</div>
                <div className="text-[11px] text-slate-600 pt-1">
                  Full system control, exclusive access to Setup Module, user accounts, and master sync.
                </div>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Executive Leadership</span>
                <div className="font-extrabold text-purple-900">Mrs. Irene Lulika & Mr. Jaxon Lulika</div>
                <div className="text-purple-700 font-semibold">Principal & Director</div>
                <div className="text-[11px] text-slate-600 pt-1">
                  Administrative accounts: Direct log edits, approve/reject edit requests, roster management.
                </div>
              </div>

              <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Administration</span>
                <div className="font-extrabold text-sky-900">Mrs. Khasoma & Mrs. Julie Arinaitwe</div>
                <div className="text-sky-700 font-semibold">Administrator & Admin Assistant</div>
                <div className="text-[11px] text-slate-600 pt-1">
                  Administrative rights: Manage student rosters, teacher sign in/out, approvals.
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Support Personnel</span>
                <div className="font-extrabold text-amber-900">Miss. Anette Mugala</div>
                <div className="text-amber-700 font-semibold">Support Staff (Hope Campus)</div>
                <div className="text-[11px] text-slate-600 pt-1">
                  Strictly limited to student sign in and out only at Hope Campus. No report access, no roster edits.
                </div>
              </div>
            </div>
          </div>

          {/* Granular Permission Matrix Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                System Access Rights Matrix
              </h4>
              <p className="text-xs text-slate-500">
                Notice: Supervisor and Monitor roles have 100% equal rights across all features.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Role</th>
                    <th className="px-3 py-2.5 text-center">Scan Students</th>
                    <th className="px-3 py-2.5 text-center">Scan Faculty</th>
                    <th className="px-3 py-2.5 text-center">Manage Roster</th>
                    <th className="px-3 py-2.5 text-center">Submit Edit Req.</th>
                    <th className="px-3 py-2.5 text-center">Direct Edit Logs</th>
                    <th className="px-3 py-2.5 text-center">Approve Edits</th>
                    <th className="px-3 py-2.5 text-center">Setup Module</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-indigo-50/40 font-semibold">
                    <td className="px-4 py-2.5 text-indigo-900">ICCE Coordinator (Mr. Fredrick Kariuki)</td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-indigo-600 font-bold"><Check className="w-4 h-4 mx-auto" /></td>
                  </tr>

                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-800">Principal (Mrs. Irene Lulika)</td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                  </tr>

                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-800">Director (Mr. Jaxon Lulika)</td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                  </tr>

                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-800">Administrator (Mrs. Khasoma)</td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                  </tr>

                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-800">Administrative Assistant (Mrs. Julie Arinaitwe)</td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                  </tr>

                  <tr className="bg-sky-50/20">
                    <td className="px-4 py-2.5 font-semibold text-slate-700">Supervisor</td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                  </tr>

                  <tr className="bg-sky-50/20">
                    <td className="px-4 py-2.5 font-semibold text-slate-700">Monitor (Equal rights as Supervisor)</td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                    <td className="px-3 py-2.5 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                  </tr>

                  <tr className="bg-amber-50/30">
                    <td className="px-4 py-2.5 font-semibold text-amber-900">Support Staff (Miss. Anette Mugala • Hope Campus)</td>
                    <td className="px-3 py-2.5 text-center text-emerald-600 font-bold"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                    <td className="px-3 py-2.5 text-center text-slate-300">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security & Timeout Policies */}
      {activeTab === 'security' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Security & Terminal Inactivity Policies</h3>
            <p className="text-xs text-slate-500">
              Configure auto-logout timers and strict terminal safety rules.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-800">Terminal Inactivity Auto-Lock</div>
                <div className="text-[11px] text-slate-500">
                  Automatically sign out kiosk terminals when idle to prevent unauthorized attendance log manipulation.
                </div>
              </div>
              <span className="font-mono text-xs font-bold px-3 py-1 bg-indigo-100 text-indigo-800 rounded-lg">
                Current: {idleTimeoutMinutes} minutes
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {[1, 2, 5, 10, 15, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setIdleTimeoutMinutes(mins)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    idleTimeoutMinutes === mins
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {mins} min{mins > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Database Synchronization */}
      {activeTab === 'database' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Official Database State & Data Hygiene</h3>
            <p className="text-xs text-slate-500">
              Manage master institutional data records, purge AI test artifacts, and maintain official system hygiene.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Official Students</span>
              <div className="text-xl font-black text-slate-900">{students.length}</div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">CSV Verified</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total Staff</span>
              <div className="text-xl font-black text-slate-900">{allStaff.length}</div>
              <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">Authorized</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Campuses</span>
              <div className="text-xl font-black text-slate-900">{campuses.length}</div>
              <div className="text-[10px] text-purple-600 font-semibold mt-0.5">Spring & Hope</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Learning Centers</span>
              <div className="text-xl font-black text-slate-900">{learningCenters.length}</div>
              <div className="text-[10px] text-purple-600 font-semibold mt-0.5">Assigned</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Attendance Logs</span>
              <div className="text-xl font-black text-slate-900">{logs.length}</div>
              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Live Records</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Audit Requests</span>
              <div className="text-xl font-black text-slate-900">{editRequests.length}</div>
              <div className="text-[10px] text-amber-600 font-semibold mt-0.5">{urgentAlerts.length} Alerts</div>
            </div>
          </div>

          {/* Feedback Status Alert */}
          {cleanResult && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-start space-x-3 ${
                cleanResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <CheckCircle2
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  cleanResult.success ? 'text-emerald-600' : 'text-rose-600'
                }`}
              />
              <div className="space-y-1">
                <div className="font-bold">
                  {cleanResult.success ? 'System Successfully Purged & Cleaned' : 'Purge Operation Failed'}
                </div>
                <p className="text-[11px] leading-relaxed">{cleanResult.message}</p>
                {cleanResult.success && (
                  <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]">
                    <span className="px-2 py-0.5 bg-emerald-100 rounded text-emerald-800">
                      Deleted Logs: {cleanResult.deletedLogs ?? 0}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 rounded text-emerald-800">
                      Deleted Edit Requests: {cleanResult.deletedRequests ?? 0}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 rounded text-emerald-800">
                      Deleted Alerts: {cleanResult.deletedAlerts ?? 0}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 rounded text-emerald-800">
                      Official Students: 74
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {syncStatus && !cleanResult && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-center space-x-2 ${
                syncStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{syncStatus.message}</span>
            </div>
          )}

          {/* Primary Action 1: Clean System Data & Remove All AI Dummy Data */}
          <div className="p-5 bg-rose-50/50 border border-rose-200 rounded-xl space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-bold text-rose-950">
                    Clean System Data & Remove All AI Dummy Data
                  </h4>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold uppercase tracking-wider">
                    Full Sanitization
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Permanently deletes all AI dummy/test attendance logs, edit requests, urgent alerts, and any non-official student or staff records from Firestore. Restores the exact <strong>74 official students</strong> from the school roster across <strong>Spring Campus</strong> and <strong>Hope Campus</strong>.
                </p>
                <div className="mt-2 text-[10px] text-slate-500 space-y-0.5">
                  <div>✓ Deletes all records in <code className="bg-white px-1 py-0.5 rounded border text-rose-700">attendance_logs</code></div>
                  <div>✓ Deletes all records in <code className="bg-white px-1 py-0.5 rounded border text-rose-700">edit_requests</code></div>
                  <div>✓ Deletes all records in <code className="bg-white px-1 py-0.5 rounded border text-rose-700">urgent_alerts</code></div>
                  <div>✓ Re-establishes strictly the official 74 CSV students in <code className="bg-white px-1 py-0.5 rounded border text-emerald-700">students</code></div>
                  <div>✓ Re-establishes authorized institutional leadership and faculty in <code className="bg-white px-1 py-0.5 rounded border text-indigo-700">staff</code></div>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleCleanSystemData}
                disabled={cleanLoading || syncLoading}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
              >
                <Trash2 className={`w-4 h-4 ${cleanLoading ? 'animate-spin' : ''}`} />
                <span>{cleanLoading ? 'Cleaning System & Purging Dummy Data...' : 'Clean System Data & Remove All AI Dummy Data'}</span>
              </button>
            </div>
          </div>

          {/* Primary Action 2: Sync Official School CSV Data */}
          <div className="p-5 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3">
            <div className="flex items-start space-x-3">
              <RefreshCw className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-indigo-900">
                  Re-Sync Official School CSV Roster
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Synchronizes official students, learning centers, and administrative credentials without touching active operational data.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleForceSync}
                disabled={syncLoading || cleanLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
                <span>{syncLoading ? 'Executing Roster Sync...' : 'Sync Official Roster Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Campus */}
      {editingCampus && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Configure {editingCampus.name}</h3>
              <button
                type="button"
                onClick={() => setEditingCampus(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Lead Administrator</label>
                <input
                  type="text"
                  value={campusLeadAdmin}
                  onChange={(e) => setCampusLeadAdmin(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Campus Location</label>
                <input
                  type="text"
                  value={campusLocation}
                  onChange={(e) => setCampusLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={campusPhone}
                    onChange={(e) => setCampusPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={campusEmail}
                    onChange={(e) => setCampusEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Total Capacity</label>
                <input
                  type="number"
                  value={campusCapacity}
                  onChange={(e) => setCampusCapacity(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingCampus(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCampus}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
              >
                Save Campus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Learning Center */}
      {editingLC && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configure {editingLC.name}</h3>
                <span className="text-[11px] text-slate-500">{editingLC.campus}</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingLC(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                  <span>Assigned Supervisor</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Supervisor
                  </span>
                </label>
                <input
                  type="text"
                  value={lcSupervisor}
                  onChange={(e) => setLcSupervisor(e.target.value)}
                  placeholder="Supervisor Name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              {editingLC.name === 'Bethany' ? (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                    <span>Assigned Monitor (Bethany Exclusive)</span>
                    <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                      Monitor
                    </span>
                  </label>
                  <input
                    type="text"
                    value={lcMonitor}
                    onChange={(e) => setLcMonitor(e.target.value)}
                    placeholder="Mrs. Joan Nandhego"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Mrs. Joan Nandhego is the official and only monitor in the school, assigned to Bethany Learning Center.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-800 font-bold text-[11px]">
                    <Info className="w-3.5 h-3.5 text-slate-600" />
                    <span>Monitor Policy</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Bethany Learning Center is the only center with an assigned Monitor (Mrs. Joan Nandhego). This center is supervised by Mrs. Eunice Mutebe.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Room Number</label>
                  <input
                    type="text"
                    value={lcRoom}
                    onChange={(e) => setLcRoom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Room Capacity</label>
                  <input
                    type="number"
                    value={lcCapacity}
                    onChange={(e) => setLcCapacity(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingLC(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLC}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
              >
                Save Learning Center
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
