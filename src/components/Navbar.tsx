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
  Menu,
  X,
  Briefcase,
  Smartphone,
  Monitor,
  Download,
} from 'lucide-react';
import { SchoolLogo } from './SchoolLogo';
import { BulkExportModal } from './BulkExportModal';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

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
      setPinError('Invalid 3-digit PIN. (E.g. 555 for Fredrick, 103 for Khasoma, 104 for Julie Arinaitwe, 105 for Miss. Anette Mugala, 207 for Mrs. Julie Mayanja).');
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
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-3">
              <SchoolLogo variant="emblem" size="md" className="bg-white p-1 rounded-xl shadow-md shrink-0" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-base sm:text-lg tracking-tight text-white font-serif">
                    Spirit &amp; Word
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                    Live Campus
                  </span>
                </div>
                <p className="text-[10px] text-amber-300/90 italic hidden sm:block">
                  The Quick, The Sharp and The Clever
                </p>
              </div>
            </div>

            {/* Live Campus Premises Quick Pill & Campus Dropdown */}
            <div className="hidden lg:flex items-center space-x-3 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs">
              {/* Campus Selector Dropdown */}
              <div className="flex items-center space-x-1.5 pr-2 border-r border-slate-700">
                <School className="w-3.5 h-3.5 text-indigo-400" />
                <select
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  className="bg-slate-900 text-white font-bold text-xs rounded-md px-2 py-0.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All Campuses">All Campuses</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">Students:</span>
                <span className="font-bold text-emerald-400">
                  {filteredPremisesSummary.studentsOnPremises}
                </span>
                <span className="text-slate-500">/ {filteredPremisesSummary.studentsTotal}</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">Staff:</span>
                <span className="font-bold text-sky-400">
                  {filteredPremisesSummary.staffOnPremises}
                </span>
                <span className="text-slate-500">/ {filteredPremisesSummary.staffTotal}</span>
              </div>
            </div>

            {/* Quick Actions & User Switcher */}
            <div className="flex items-center space-x-2 sm:space-x-2.5">
              {/* Device View Segmented Switcher */}
              <div
                className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-xs"
                role="group"
                aria-label="Device View Switcher"
              >
                <button
                  type="button"
                  onClick={() => setViewportMode('auto')}
                  className={`flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    viewportMode === 'auto'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
                  }`}
                  title="Responsive (Auto) - Fluid full-width desktop view"
                  aria-pressed={viewportMode === 'auto'}
                >
                  <Monitor className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden md:inline">Responsive (Auto)</span>
                  <span className="hidden xs:inline md:hidden">Auto</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewportMode('mobile')}
                  className={`flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    viewportMode === 'mobile'
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xs ring-1 ring-indigo-400/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
                  }`}
                  title="Mobile View - Fixed-width centered mobile phone shell preview"
                  aria-pressed={viewportMode === 'mobile'}
                >
                  <Smartphone className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden md:inline">Mobile View</span>
                  <span className="hidden xs:inline md:hidden">Mobile</span>
                </button>
              </div>

              {/* Sound Toggle */}
              <button
                type="button"
                onClick={handleToggleSound}
                title={soundEnabled ? 'Mute Audio Chimes' : 'Enable Audio Chimes'}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {/* Mobile Quick Sign In Button */}
              <button
                type="button"
                onClick={() => setActiveTab('signin')}
                className={`sm:hidden px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  activeTab === 'signin'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
                title="Sign In Children & Staff"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Sign In</span>
              </button>

              {/* Quick Scanner Launch Button */}
              <button
                type="button"
                onClick={onOpenScanner}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm shadow-blue-500/30 transition transform active:scale-95 cursor-pointer"
              >
                <Scan className="w-4 h-4" />
                <span className="hidden sm:inline">Launch Scanner</span>
              </button>

              {/* Bulk Export Button */}
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition transform active:scale-95 cursor-pointer"
                title="Bulk Export System Data & Student Badges"
              >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Bulk Export</span>
              </button>

              {/* Active User Pill with Switch Modal Trigger */}
              <button
                type="button"
                onClick={() => setShowSwitchModal(true)}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 rounded-lg px-2.5 py-1.5 transition text-left"
              >
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-indigo-300 border border-slate-600">
                  {currentUser?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-white leading-tight truncate max-w-[110px]">
                    {currentUser?.full_name}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-none">
                    {currentUser?.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Secure Lock / Sign Out Button */}
              <button
                type="button"
                onClick={() => logout(false)}
                className="p-2 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 border border-slate-700/80 rounded-lg transition"
                title="Lock Terminal"
              >
                <Lock className="w-4 h-4" />
              </button>

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 rounded-lg transition"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Responsive Mobile / Tablet Campus Selector Bar (< 1024px) */}
          <div className="flex lg:hidden items-center justify-between py-2 border-t border-slate-800 text-xs">
            <div className="flex items-center space-x-1.5 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700">
              <School className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="All Campuses" className="bg-slate-900">All Campuses</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.name} className="bg-slate-900">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 text-[11px]">
              <span className="text-slate-400">
                Present: <strong className="text-emerald-400 font-bold">{filteredPremisesSummary.studentsOnPremises}</strong>
                <span className="text-slate-500">/{filteredPremisesSummary.studentsTotal}</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">
                Staff: <strong className="text-sky-400 font-bold">{filteredPremisesSummary.staffOnPremises}</strong>
              </span>
            </div>
          </div>

          {/* Mobile Collapsible Navigation Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden py-3 border-t border-slate-800 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Device View Mode Switcher in Mobile Drawer */}
              <div className="bg-slate-800/80 p-2 rounded-2xl border border-slate-700/80">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1 flex items-center justify-between">
                  <span>Display Mode</span>
                  <span className="text-indigo-400 font-mono">{viewportMode === 'mobile' ? 'Phone Shell Active' : 'Fluid Auto Active'}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setViewportMode('auto');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      viewportMode === 'auto'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Responsive (Auto)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewportMode('mobile');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      viewportMode === 'mobile'
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xs'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile View</span>
                  </button>
                </div>
              </div>

              {/* Primary Mobile Gate Check-in for Children and Staff */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-black flex items-center justify-between transition ${
                  activeTab === 'signin'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-sm">Sign In Children &amp; Staff</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200">
                  Primary Mobile Gate
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <School className="w-4 h-4 text-blue-400" />
                  <span>Real-Time Dashboard</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('campuses');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                  activeTab === 'campuses'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <School className="w-4 h-4 text-indigo-400" />
                  <span>Campus Modules</span>
                </div>
              </button>

              {!isSupportStaff && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('staff');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                    activeTab === 'staff'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Briefcase className="w-4 h-4 text-sky-400" />
                    <span>Staff Module</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-700 text-slate-300 rounded font-mono">
                    {filteredPremisesSummary.staffTotal}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setActiveTab('attendance');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                  activeTab === 'attendance'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Attendance Logs</span>
                </div>
              </button>

              {!isSupportStaff && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('approvals');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                    activeTab === 'approvals'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Edit Requests</span>
                  </div>
                  {pendingRequestsCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>
              )}

              {!isSupportStaff && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('roster');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                    activeTab === 'roster'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Roster & Badges</span>
                  </div>
                </button>
              )}

              {canAccessReports && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('reports');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                    activeTab === 'reports'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Analytics & Reports</span>
                  </div>
                </button>
              )}

              {canAccessSetup && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('setup');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                    activeTab === 'setup'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-amber-300 hover:bg-slate-800 hover:text-white border border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Administrative Setup</span>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Navigation Bar Tabs (Scrollable on Tablet & Desktop) */}
          <nav className="hidden sm:flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/80 text-xs font-medium scrollbar-none">
            {/* Primary Sign In Station for Children and Staff */}
            <button
              onClick={() => setActiveTab('signin')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition flex items-center space-x-1.5 font-bold ${
                activeTab === 'signin'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Sign In (Children &amp; Staff)</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Real-Time Dashboard
            </button>

            {/* Campus Modules Tab */}
            <button
              onClick={() => setActiveTab('campuses')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition flex items-center space-x-1.5 ${
                activeTab === 'campuses'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>Campus Modules</span>
            </button>

            {/* Staff Management Module */}
            {!isSupportStaff && (
              <button
                onClick={() => setActiveTab('staff')}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition flex items-center space-x-1.5 ${
                  activeTab === 'staff'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Staff Module</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                activeTab === 'attendance'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Attendance Logs
            </button>

            {/* Edit Approvals - visible to staff with edit rights */}
            {!isSupportStaff && (
              <button
                onClick={() => setActiveTab('approvals')}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition flex items-center space-x-1.5 ${
                  activeTab === 'approvals'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>Edit Requests</span>
                {pendingRequestsCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-bold rounded-full animate-bounce">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
            )}

            {/* Student & Staff Roster */}
            {!isSupportStaff && (
              <button
                onClick={() => setActiveTab('roster')}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                  activeTab === 'roster'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Roster & Badges
              </button>
            )}

            {/* Reports */}
            {canAccessReports && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                  activeTab === 'reports'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Analytics & Reports
              </button>
            )}

            {/* ICCE Coordinator Exclusive Administrative Setup Tab */}
            {canAccessSetup && (
              <button
                onClick={() => setActiveTab('setup')}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition flex items-center space-x-1.5 ${
                  activeTab === 'setup'
                    ? 'bg-amber-600 text-white shadow-sm font-bold'
                    : 'text-amber-400 hover:text-white hover:bg-slate-800 font-semibold border border-amber-500/30'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Administrative Setup</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Role Switcher & PIN Login Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-base flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-indigo-400" />
                    <span>Switch Staff Role</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Select a staff persona or enter a 3-digit PIN code to test permissions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSwitchModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
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
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
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
                      className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                        idleTimeoutMinutes === mins
                          ? 'bg-amber-600 text-white shadow-xs'
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
                    className="ml-auto text-[10px] text-rose-700 hover:text-rose-900 font-bold underline"
                    title="Test immediate inactivity timeout lock"
                  >
                    Test Auto-Lock Now
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
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
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
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                        isActive
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
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
                        {isActive && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Permission Summary of Current User */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
                <p className="font-semibold text-slate-800">
                  Current Role Capabilities ({currentUser?.role}):
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li>Scan students in/out via QR or 4-digit PIN: <strong className="text-emerald-700">Allowed</strong></li>
                  <li>
                    Scan teachers in/out:{' '}
                    <strong className={canScanTeachers ? 'text-emerald-700' : 'text-red-700'}>
                      {canScanTeachers ? 'Allowed' : 'Restricted (Admin only)'}
                    </strong>
                  </li>
                  <li>
                    Direct edit/delete logs:{' '}
                    <strong
                      className={
                        currentUser?.role === 'Principal' ||
                        currentUser?.role === 'Director' ||
                        currentUser?.role === 'ICCE Coordinator'
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }
                    >
                      {currentUser?.role === 'Principal' ||
                      currentUser?.role === 'Director' ||
                      currentUser?.role === 'ICCE Coordinator'
                        ? 'Allowed'
                        : 'Must Submit Edit Request'}
                    </strong>
                  </li>
                  {isSuperUser && (
                    <li>
                      Super User Account Management: <strong className="text-purple-700">Full Access</strong>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk System Data & Student Badges Export Modal */}
      <BulkExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </>
  );
};
