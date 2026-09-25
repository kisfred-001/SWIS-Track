import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SchoolLogo } from './SchoolLogo';
import { Users, Briefcase, LayoutDashboard, LogOut, UserCheck, KeyRound, CheckCircle2, X } from 'lucide-react';

interface SimplifiedLandingPageProps {
  onSelectAction: (action: 'signin_children' | 'signin_staff' | 'dashboard') => void;
  onOpenSwitchUserModal?: () => void;
}

export const SimplifiedLandingPage: React.FC<SimplifiedLandingPageProps> = ({
  onSelectAction,
  onOpenSwitchUserModal,
}) => {
  const { currentUser, allStaff, switchUser, logout } = useAuth();
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  // Leadership roles that have access to "Sign In Staff"
  const leadershipRoles = [
    'ICCE Coordinator',
    'Principal',
    'Director',
    'Administrator',
    'Administrative Assistant',
  ];

  const userRole = currentUser?.role || 'Teacher';
  const isLeadership = leadershipRoles.includes(userRole);

  const handleOpenSwitch = () => {
    if (onOpenSwitchUserModal) {
      onOpenSwitchUserModal();
    } else {
      setShowSwitchModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans selection:bg-[#FCCB0D] selection:text-slate-900 p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#A71C21]/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Top Header Row: System Branding & Quick User Action */}
      <header className="relative z-10 max-w-lg w-full mx-auto flex items-center justify-between pt-2 pb-4 border-b border-white/10">
        <div className="flex items-center space-x-2.5">
          <SchoolLogo variant="emblem" size="md" className="bg-white p-1 rounded-2xl shadow-lg shrink-0 border border-white/20" />
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-amber-400">
              Spirit &amp; Word
            </div>
            <div className="text-[10px] font-bold text-slate-300">
              Attendance Tracking System
            </div>
          </div>
        </div>

        {/* User Pill & Lock Terminal */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleOpenSwitch}
            className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer"
            title="Switch Staff Persona"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[11px] truncate max-w-[100px]">
              {currentUser?.full_name?.split(' ')[0]}
            </span>
          </button>

          <button
            type="button"
            onClick={() => logout(false)}
            className="p-2 bg-white/10 hover:bg-rose-600/80 text-white rounded-xl border border-white/20 transition cursor-pointer"
            title="Lock Terminal / Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Center Main Landing Card */}
      <main className="relative z-10 max-w-lg w-full mx-auto my-auto py-6 flex flex-col items-center text-center space-y-6">
        
        {/* Welcome Banner */}
        <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
          <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#A71C21]/80 border border-red-500/40 text-amber-200 text-xs font-extrabold tracking-wide shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SWIS Gate Station Active</span>
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight pt-1">
            Spirit &amp; Word Attendance
          </h1>

          <p className="text-sm text-slate-300 max-w-sm mx-auto font-medium leading-relaxed">
            Welcome, <strong className="text-white font-extrabold">{currentUser?.full_name}</strong>
            <span className="block text-xs text-amber-300 font-semibold mt-0.5">
              Role: {userRole}
            </span>
          </p>
        </div>

        {/* Action Buttons Grid (2 buttons for Teachers/Support, 3 buttons for Leadership) */}
        <div className="w-full space-y-3.5 pt-2">
          
          {/* Button 1: Sign In Children */}
          <button
            type="button"
            onClick={() => onSelectAction('signin_children')}
            className="w-full group relative overflow-hidden bg-gradient-to-r from-[#A71C21] to-[#88151a] hover:from-[#b91e24] hover:to-[#9c181e] text-white p-4 sm:p-5 rounded-2xl shadow-xl shadow-red-950/40 border border-red-500/30 flex items-center justify-between transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] cursor-pointer touch-manipulation min-h-[68px]"
          >
            <div className="flex items-center space-x-3.5 text-left">
              <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 group-hover:bg-[#FCCB0D] group-hover:text-slate-900 transition-colors">
                <Users className="w-6 h-6 text-amber-300 group-hover:text-slate-900" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black tracking-tight text-white flex items-center space-x-2">
                  <span>Sign In Children</span>
                </div>
                <p className="text-xs text-amber-100/80 font-medium">
                  Scan QR badge, enter 4-digit PIN, or search name
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-1 text-xs font-extrabold bg-white/15 px-3 py-1.5 rounded-xl border border-white/20 text-amber-200">
              <KeyRound className="w-3.5 h-3.5" />
              <span>4-Digit</span>
            </div>
          </button>

          {/* Button 2 (Leadership Only): Sign In Staff */}
          {isLeadership && (
            <button
              type="button"
              onClick={() => onSelectAction('signin_staff')}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white p-4 sm:p-5 rounded-2xl shadow-xl shadow-slate-950/50 border border-amber-500/30 flex items-center justify-between transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] cursor-pointer touch-manipulation min-h-[68px]"
            >
              <div className="flex items-center space-x-3.5 text-left">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 group-hover:bg-[#FCCB0D] group-hover:text-slate-900 transition-colors">
                  <Briefcase className="w-6 h-6 text-amber-400 group-hover:text-slate-900" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-black tracking-tight text-white flex items-center space-x-2">
                    <span>Sign In Staff</span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    Clock in/out staff via 3-digit PIN or QR scan
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center space-x-1 text-xs font-extrabold bg-amber-400/20 px-3 py-1.5 rounded-xl border border-amber-400/30 text-amber-300">
                <KeyRound className="w-3.5 h-3.5" />
                <span>3-Digit</span>
              </div>
            </button>
          )}

          {/* Button 3: Portal Access */}
          <button
            type="button"
            onClick={() => onSelectAction('dashboard')}
            className="w-full group relative overflow-hidden bg-[#3e3d40] hover:bg-slate-700 text-white p-4 sm:p-5 rounded-2xl shadow-xl shadow-slate-950/30 border border-slate-600/40 flex items-center justify-between transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] cursor-pointer touch-manipulation min-h-[68px]"
          >
            <div className="flex items-center space-x-3.5 text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 group-hover:bg-[#FCCB0D] group-hover:text-slate-900 transition-colors">
                <LayoutDashboard className="w-6 h-6 text-emerald-400 group-hover:text-slate-900" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black tracking-tight text-white">
                  Portal Access
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  Full dashboard, attendance logs, and administrative tools
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-1 text-xs font-extrabold bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-400/30 text-emerald-300">
              <span>Dashboard</span>
            </div>
          </button>

        </div>
      </main>

      {/* Footer System Info */}
      <footer className="relative z-10 max-w-lg w-full mx-auto text-center pt-4 border-t border-white/10 text-[11px] text-slate-400">
        <p className="font-medium">
          Spirit &amp; Word Attendance Tracking System • Role-Based Access Control
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Session: <strong className="text-slate-300">{currentUser?.full_name}</strong>
        </p>
      </footer>

      {/* Switch Persona Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-slate-900">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="bg-[#3e3d40] p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Switch Staff Persona</h3>
                <p className="text-[11px] text-slate-300">Select an active staff account to switch role.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
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
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition cursor-pointer ${
                      isActive
                        ? 'border-[#A71C21] bg-red-50 ring-2 ring-red-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-[#3e3d40] text-white flex items-center justify-center font-bold text-xs">
                        {staff.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">{staff.full_name}</div>
                        <div className="text-[10px] text-slate-500">{staff.role}</div>
                      </div>
                    </div>
                    {isActive && <CheckCircle2 className="w-4 h-4 text-[#A71C21]" />}
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="px-4 py-2 bg-[#3e3d40] text-white rounded-xl text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
