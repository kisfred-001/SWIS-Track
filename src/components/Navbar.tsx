import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
import { useViewport } from '../context/ViewportContext';
import { sound } from '../utils/sound';
import {
  School,
  UserCheck,
  ShieldAlert,
  Volume2,
  VolumeX,
  Users,
  Clock,
  Sparkles,
  ChevronDown,
  KeyRound,
  CheckCircle2,
  Scan,
  Lock,
  Briefcase,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { SchoolLogo } from './SchoolLogo';

interface NavbarProps {
  onOpenScanner: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenScanner,
  activeTab,
  setActiveTab,
}) => {
  const {
    currentUser,
    allStaff,
    switchUser,
    loginWithPin,
    logout,
    isSuperUser,
    canScanTeachers,
    canAccessSetup,
    canAccessReports,
    isSupportStaff,
    idleTimeoutMinutes,
    setIdleTimeoutMinutes,
  } = useAuth();
  const {
    filteredPremisesSummary,
    pendingRequestsCount,
    campuses,
    selectedCampus,
    setSelectedCampus,
  } = useAttendance();
  const { viewportMode, setViewportMode } = useViewport();

  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(sound.isEnabled());

  const handleToggleSound = () => {
    const next = !soundEnabled;
    sound.setSoundEnabled(next);
    setSoundEnabled(next);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    if (!pinInput.trim()) return;
    const ok = loginWithPin(pinInput.trim());
    if (ok) {
      setPinInput('');
      setShowSwitchModal(false);
      sound.playSuccessChime();
    } else {
      setPinError('Invalid 3-digit PIN.');
      sound.playError();
    }
  };

  const getRoleBadgeColor = (role: string) => {
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
    <>
      {/* Carnelian Red (#A71C21) Menubar Header */}
      <header className="sticky top-0 z-40 bg-[#A71C21] text-white shadow-xl border-b border-[#7A1216] font-sans">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          
          {/* ROW 1: On the Left ( Spirit and Word Logo and system name ) | On the Right ( Launch scanner ) ( Person logged in ) */}
          <div className="flex flex-wrap items-center justify-between py-2.5 border-b border-white/20 gap-3">
            {/* Left: Spirit and Word Logo and the name of the system */}
            <div className="flex items-center space-x-3 shrink-0">
              <SchoolLogo variant="emblem" size="md" className="bg-white p-1 rounded-xl shadow-md shrink-0 border border-slate-200" />
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-black text-base sm:text-xl tracking-tight text-white font-sans leading-none drop-shadow-xs">
                    Spirit &amp; Word
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3e3d40] text-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
                    Live System
                  </span>
                </div>
                <span className="text-[11px] text-amber-200 font-extrabold tracking-wide leading-tight mt-0.5">
                  Attendance Tracking System
                </span>
              </div>
            </div>

            {/* Right: Launch scanner & Person logged in */}
            <div className="flex items-center space-x-2 shrink-0">
              {/* Sound Chimes Toggle */}
              <button
                type="button"
                onClick={handleToggleSound}
                title={soundEnabled ? 'Mute Audio Chimes' : 'Enable Audio Chimes'}
                className="p-2 rounded-xl bg-[#3e3d40] hover:bg-[#FCCB0D] hover:text-slate-900 text-white transition cursor-pointer shadow-xs"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {/* Launch Scanner */}
              <button
                type="button"
                onClick={onOpenScanner}
                className="inline-flex items-center space-x-1.5 bg-[#3e3d40] hover:bg-[#FCCB0D] hover:text-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer shadow-xs"
              >
                <Scan className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">Launch Scanner</span>
              </button>

              {/* Person logged in */}
              <button
                type="button"
                onClick={() => setShowSwitchModal(true)}
                className="flex items-center space-x-2 bg-[#3e3d40] hover:bg-[#FCCB0D] hover:text-slate-900 text-white rounded-xl px-3 py-1.5 transition cursor-pointer text-left shadow-xs"
                title="Person Logged In - Switch Staff Persona"
              >
                <div className="w-6.5 h-6.5 rounded-full bg-[#A71C21] text-white flex items-center justify-center text-xs font-extrabold border border-white/40 shrink-0">
                  {currentUser?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                    {currentUser?.full_name}
                  </div>
                  <div className="text-[10px] text-amber-200 leading-none">
                    {currentUser?.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
              </button>

              {/* Lock Terminal */}
              <button
                type="button"
                onClick={() => logout(false)}
                className="p-2 bg-[#3e3d40] hover:bg-[#FCCB0D] hover:text-slate-900 text-white rounded-xl transition cursor-pointer shadow-xs"
                title="Lock Terminal"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ROW 2: All Campuses, Students, Staff, Responsive auto, Mobile View */}
          <div className="flex flex-wrap items-center justify-between py-2 border-b border-white/20 gap-2 text-xs font-semibold">
            {/* Left Group: Campus Selector, Students Count, Staff Count */}
            <div className="flex flex-wrap items-center gap-2">
              {/* All Campuses */}
              <div className="flex items-center space-x-1.5 bg-[#3e3d40] text-white px-3 py-1.5 rounded-xl shadow-xs">
                <School className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="text-slate-300 font-bold text-[11px]">Campus:</span>
                <select
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-1"
                >
                  <option value="All Campuses" className="bg-[#3e3d40] text-white">All Campuses</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.name} className="bg-[#3e3d40] text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Students Stats */}
              <div className="flex items-center space-x-1.5 bg-[#3e3d40] text-white px-3 py-1.5 rounded-xl shadow-xs">
                <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">Students:</span>
                <strong className="text-emerald-400 font-extrabold">
                  {filteredPremisesSummary.studentsOnPremises}
                </strong>
                <span className="text-slate-400 font-mono">/{filteredPremisesSummary.studentsTotal}</span>
              </div>

              {/* Staff Stats */}
              <div className="flex items-center space-x-1.5 bg-[#3e3d40] text-white px-3 py-1.5 rounded-xl shadow-xs">
                <Briefcase className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="text-slate-300">Staff:</span>
                <strong className="text-sky-400 font-extrabold">
                  {filteredPremisesSummary.staffOnPremises}
                </strong>
                <span className="text-slate-400 font-mono">/{filteredPremisesSummary.staffTotal}</span>
              </div>
            </div>

            {/* Right Group: Responsive auto & Mobile View Viewport Switchers */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setViewportMode('auto')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                  viewportMode === 'auto'
                    ? 'bg-[#FCCB0D] text-slate-900 ring-2 ring-white/50 font-extrabold'
                    : 'bg-[#3e3d40] text-white hover:bg-[#FCCB0D] hover:text-slate-900'
                }`}
                title="Responsive auto view"
              >
                <Monitor className="w-4 h-4" />
                <span>Responsive auto</span>
              </button>

              <button
                type="button"
                onClick={() => setViewportMode('mobile')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                  viewportMode === 'mobile'
                    ? 'bg-[#FCCB0D] text-slate-900 ring-2 ring-white/50 font-extrabold'
                    : 'bg-[#3e3d40] text-white hover:bg-[#FCCB0D] hover:text-slate-900'
                }`}
                title="Mobile View Phone Shell"
              >
                <Smartphone className="w-4 h-4" />
                <span>Mobile View</span>
              </button>
            </div>
          </div>

          {/* ROW 3: Real-Time Dashboard, Campus Modules, Staff Module, Attendance Logs, Edit Requests, Roster & Badges, Analytics & Reports */}
          <div className="flex items-center justify-between py-2 border-b border-white/20 gap-1.5 overflow-x-auto scrollbar-none text-xs font-bold">
            <div className="flex items-center space-x-2 shrink-0 flex-wrap sm:flex-nowrap gap-y-2">
              {/* Real-Time Dashboard */}
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 shadow-xs ${
                  activeTab === 'dashboard'
                    ? 'bg-[#FCCB0D] text-slate-900 ring-2 ring-white/50 font-extrabold'
                    : 'bg-[#3e3d40] text-white hover:bg-[#FCCB0D] hover:text-slate-900'
                }`}
              >
                <School className="w-4 h-4 text-slate-900" />
                <span>Real-Time Dashboard</span>
              </button>

              {/* Campus Modules */}
              <button
                type="button"
                onClick={() => setActiveTab('campuses')}
                className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 shadow-xs ${
                  activeTab === 'campuses'
                    ? 'bg-[#FCCB0D] text-slate-900 ring-2 ring-white/50 font-extrabold'
                    : 'bg-[#3e3d40] text-white hover:bg-[#FCCB0D] hover:text-slate-900'
                }`}
              >
                <span>Campus Modules</span>
              </button>

              {/* Staff Module */}
              {!isSupportStaff && (
                <button
                  type="button"
                  onClick={() => setActiveTab('staff')}
                  className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 shadow-xs ${
                    activeTab === 'staff'
                      ? 'bg-[#FCCB0D] text-slate-900 ring-2 ring-white/50 font-extrabold'
                      : 'bg-[#3e3d40] text-white hover:bg-[#FCCB0D] hover:text-slate-900'
                  }`}
                >
                  <span>Staff Module</span>
                </button>
              )}

              {/* Attendance Logs */}
              <button
                type="button"
                onClick={() => setActiveTab('attendance')}
                className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 shadow-xs ${
                  activeTab === 'attendance'
                    ? 'bg-[#FCCB0D] text-slate-900 ring-2 ring-white/50 font-extrabold'
                    : 'bg-[#3e3d40] text-white hover:bg-[#FCCB0D] hover:text-slate-900'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Attendance Logs</span>
              </button>

              {/* Edit Requests */}
              {!isSupportStaff && (
                <button
                  type="button"
                  onClick={() => setActiveTab('approvals')}
                  className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 shadow-xs ${
                    activeTab === 'approvals'
                      ? 'bg-[#FCCB0D] text-slate-900 ring-2 ring-white/50 font-extrabold'
                      : 'bg-[#3e3d40] text-white hover:bg-[#FCCB0D] hover:text-slate-900'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Edit Requests</span>
                  {pendingRequestsCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-[#A71C21] text-white text-[10px] font-black rounded-full animate-bounce">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>
              )}

              {/* Roster & Badges */}
              {!isSupportStaff && (
                <button
                  type="button"
                  onClick={() => setActiveTab('roster')}
                  className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 shadow-xs ${
                    activeTab === 'roster'
                      ? 'bg-[#FCCB0D] text-slate-900 ring-2 ring-white/50 font-extrabold'
                      : 'bg-[#3e3d40] text-white hover:bg-[#FCCB0D] hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Roster &amp; Badges</span>
                </button>
              )}

              {/* Analytics & Reports */}
              {canAccessReports && (
                <button
                  type="button"
                  onClick={() => setActiveTab('reports')}
                  className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 shadow-xs ${
                    activeTab === 'reports'
                      ? 'bg-[#FCCB0D] text-slate-900 ring-2 ring-white/50 font-extrabold'
                      : 'bg-[#3e3d40] text-white hover:bg-[#FCCB0D] hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Analytics &amp; Reports</span>
                </button>
              )}
            </div>
          </div>

          {/* ROW 4: On the Left ( Sign In Children and Staff ) | On the Right ( Administrative Setup ) */}
          <div className="flex items-center justify-between py-2 gap-3 text-xs font-bold">
            {/* On the Left: Sign In Children and Staff */}
            <button
              type="button"
              onClick={() => setActiveTab('signin')}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center space-x-2 font-black shadow-md ${
                activeTab === 'signin'
                  ? 'bg-[#FCCB0D] text-slate-900 ring-2 ring-white/50'
                  : 'bg-[#3e3d40] text-white hover:bg-[#FCCB0D] hover:text-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-sm">Sign In Children and Staff</span>
            </button>

            {/* On the Right: Administrative Setup */}
            {canAccessSetup && (
              <button
                type="button"
                onClick={() => setActiveTab('setup')}
                className={`px-4 py-2 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center space-x-2 font-black shadow-md ${
                  activeTab === 'setup'
                    ? 'bg-[#FCCB0D] text-slate-900 ring-2 ring-white/50'
                    : 'bg-[#3e3d40] text-white hover:bg-[#FCCB0D] hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Administrative Setup</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Role Switcher & PIN Login Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-[#3e3d40] p-5 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-base flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-amber-300" />
                    <span>Switch Staff Role</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Select a staff persona or enter a 3-digit PIN code.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSwitchModal(false)}
                  className="text-slate-400 hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Super User Profile Card */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wide">
                      Super User Account
                    </span>
                    <span className="bg-purple-200 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      ICCE Coordinator
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    Fredrick Kariuki
                  </p>
                  <p className="text-[11px] text-slate-600">
                    kisfred@gmail.com
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const ok = loginWithPin('555');
                    if (ok) {
                      setShowSwitchModal(false);
                      sound.playSuccessChime();
                    }
                  }}
                  className="px-3 py-1.5 bg-[#A71C21] hover:bg-[#88151a] text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  Sign In As Fredrick
                </button>
              </div>

              {/* Inactivity Auto-Logout Security Configuration */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-950">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Inactivity Auto-Logout Policy</span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
                    Active: {idleTimeoutMinutes} min
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 mb-2 leading-relaxed">
                  Terminal automatically locks and logs out staff after detected inactivity to protect student records.
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-amber-900">Timeout:</span>
                  {[2, 5, 10, 15, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setIdleTimeoutMinutes(mins)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                        idleTimeoutMinutes === mins
                          ? 'bg-[#A71C21] text-white shadow-xs'
                          : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setShowSwitchModal(false);
                      logout(true);
                    }}
                    className="ml-auto text-[10px] text-rose-700 hover:text-rose-900 font-bold underline cursor-pointer"
                    title="Test immediate inactivity timeout lock"
                  >
                    Test Lock
                  </button>
                </div>
              </div>

              {/* Quick PIN Input */}
              <form onSubmit={handlePinSubmit} className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Quick PIN Entry (3-digit Staff Code)
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      maxLength={3}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="Enter 3-digit PIN"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A71C21] font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#3e3d40] text-white rounded-lg text-xs font-semibold hover:bg-[#A71C21] transition cursor-pointer"
                  >
                    Authenticate
                  </button>
                </div>
                {pinError && <p className="text-xs text-red-600 font-medium">{pinError}</p>}
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 font-medium">
                    Or Select A Staff Persona
                  </span>
                </div>
              </div>

              {/* Staff List Selection */}
              <div className="space-y-2">
                {allStaff.map((staff) => {
                  const isActive = currentUser?.staff_id === staff.staff_id;
                  return (
                    <button
                      key={staff.staff_id}
                      type="button"
                      onClick={() => {
                        switchUser(staff);
                        setShowSwitchModal(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer ${
                        isActive
                          ? 'border-[#A71C21] bg-red-50 ring-2 ring-red-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-[#3e3d40] text-white flex items-center justify-center font-bold text-xs">
                          {staff.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-xs text-slate-900">
                              {staff.full_name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              ID: {staff.staff_id}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {staff.learning_center_id || 'Campus'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(
                            staff.role
                          )}`}
                        >
                          {staff.role}
                        </span>
                        {isActive && <CheckCircle2 className="w-4 h-4 text-[#A71C21]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="px-4 py-2 bg-[#3e3d40] text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
