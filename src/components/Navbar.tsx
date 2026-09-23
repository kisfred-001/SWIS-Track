import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
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
} from 'lucide-react';
import { Staff } from '../types';

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
    isSuperUser,
    canScanTeachers,
  } = useAuth();
  const { premisesSummary, pendingRequestsCount } = useAttendance();

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
      setPinError('Invalid 3-digit PIN. Try 101, 102, 103, 201, 301, or 302.');
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
      case 'Admin Assistant':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Teacher':
      default:
        return 'bg-sky-100 text-sky-800 border-sky-300';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <School className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                    EduTrack Pro
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                    Live Campus
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  School Attendance & Roster System
                </p>
              </div>
            </div>

            {/* Live Campus Premises Quick Pill */}
            <div className="hidden lg:flex items-center space-x-4 bg-slate-800/80 px-3.5 py-1.5 rounded-lg border border-slate-700/60 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">Students on Campus:</span>
                <span className="font-bold text-emerald-400">
                  {premisesSummary.studentsOnPremises}
                </span>
                <span className="text-slate-500">/ {premisesSummary.studentsTotal}</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">Staff Present:</span>
                <span className="font-bold text-sky-400">
                  {premisesSummary.staffOnPremises}
                </span>
                <span className="text-slate-500">/ {premisesSummary.staffTotal}</span>
              </div>
            </div>

            {/* Quick Actions & User Switcher */}
            <div className="flex items-center space-x-2.5">
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

              {/* Quick Scanner Launch Button */}
              <button
                type="button"
                onClick={onOpenScanner}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm shadow-blue-500/30 transition transform active:scale-95"
              >
                <Scan className="w-4 h-4" />
                <span className="hidden sm:inline">Launch Scanner</span>
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
            </div>
          </div>

          {/* Navigation Bar Tabs */}
          <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/80 text-xs font-medium scrollbar-none">
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

            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                activeTab === 'attendance'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Attendance Logs & Audits
            </button>

            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition flex items-center space-x-1.5 ${
                activeTab === 'approvals'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Edit Approvals</span>
              {pendingRequestsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-bold rounded-full animate-bounce">
                  {pendingRequestsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                activeTab === 'roster'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Roster & ID Badges
            </button>

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
              {/* Quick PIN Input */}
              <form onSubmit={handlePinSubmit} className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Quick PIN Entry (3-digit Staff Code)
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      maxLength={3}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="e.g. 101, 102, 201, 301"
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
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              PIN: {staff.pin_code}
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
    </>
  );
};
