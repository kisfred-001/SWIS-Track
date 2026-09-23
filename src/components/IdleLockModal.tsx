import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  School,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { sound } from '../utils/sound';

export const IdleLockModal: React.FC = () => {
  const {
    currentUser,
    allStaff,
    idleTimedOut,
    loginWithPin,
    loginWithEmailPassword,
    switchUser,
    idleTimeoutMinutes,
  } = useAuth();

  const [authMode, setAuthMode] = useState<'email' | 'pin'>('email');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Only display if user is logged out or idle timed out
  if (currentUser && !idleTimedOut) {
    return null;
  }

  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!pinInput.trim()) {
      setErrorMsg('Please enter your 3-digit staff PIN code.');
      return;
    }

    const ok = loginWithPin(pinInput.trim());
    if (ok) {
      sound.playSuccessChime();
      setPinInput('');
    } else {
      sound.playError();
      setErrorMsg('Invalid PIN code. Please enter your authorized staff PIN.');
    }
  };

  const handleUnlockEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!emailInput.trim() || !passwordInput.trim()) {
      setErrorMsg('Please enter your username/email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithEmailPassword(emailInput.trim(), passwordInput.trim());
      if (res.success) {
        sound.playSuccessChime();
      } else {
        sound.playError();
        setErrorMsg(res.message || 'Invalid username or password.');
      }
    } catch {
      sound.playError();
      setErrorMsg('Authentication error. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStaff = (staff: any) => {
    switchUser(staff);
    sound.playSuccessChime();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Security Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Lock className="w-7 h-7 animate-pulse" />
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Campus Security Protocol Active</span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            {idleTimedOut ? 'Session Inactivity Lock' : 'SWIS Track Terminal Login'}
          </h2>

          <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
            {idleTimedOut
              ? `This terminal was automatically locked after ${idleTimeoutMinutes} minutes of inactivity to protect student records and premises security.`
              : 'Sign in with your authorized school staff credentials or Staff PIN.'}
          </p>

          {/* Security Status Badge */}
          <div className="mt-3 inline-flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700/60 text-slate-200 px-3 py-1 rounded-xl text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Authorized Personnel Terminal Access</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Auth Mode Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('email');
                setErrorMsg('');
              }}
              className={`py-2 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                authMode === 'email'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Username & Password</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('pin');
                setErrorMsg('');
              }}
              className={`py-2 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                authMode === 'pin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>3-Digit PIN</span>
            </button>
          </div>

          {/* Email / Password Form */}
          {authMode === 'email' ? (
            <form onSubmit={handleUnlockEmailPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Username / Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter username or email"
                    className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-4 pr-10 py-2.5 text-sm border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center space-x-1.5 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center space-x-2 active:scale-98"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Terminal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* PIN Entry Form */
            <form onSubmit={handleUnlockPin} className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Enter 3-Digit Staff PIN
              </label>

              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    maxLength={3}
                    autoFocus
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value.replace(/\D/g, ''));
                      setErrorMsg('');
                    }}
                    placeholder="•••"
                    className="w-full pl-11 pr-4 py-2.5 text-lg tracking-widest font-mono border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 focus:outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center space-x-1.5 active:scale-95"
                >
                  <span>Unlock</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="flex items-center space-x-1.5 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </form>
          )}

          {/* Quick Select Authorized Personnel */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Or Quick Switch Staff Persona
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {allStaff.map((staff) => {
                const isSuper = staff.staff_id === 'STF-001' || staff.email === 'kisfred@gmail.com';
                return (
                  <button
                    key={staff.staff_id}
                    type="button"
                    onClick={() => handleSelectStaff(staff)}
                    className={`flex items-center space-x-2.5 p-2 rounded-xl border text-left transition group ${
                      isSuper
                        ? 'border-purple-300 bg-purple-50/70 hover:bg-purple-100/70'
                        : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50/50'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition ${
                        isSuper
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700'
                      }`}
                    >
                      {staff.full_name.charAt(0)}
                    </div>
                    <div className="truncate flex-1">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate flex items-center space-x-1">
                        <span>{staff.full_name}</span>
                        {isSuper && <span className="text-[9px] text-purple-700 font-bold">★</span>}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {staff.role} • {staff.learning_center_id || 'All Centers'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 flex items-center justify-center space-x-1">
            <School className="w-3.5 h-3.5 text-slate-400" />
            <span>SWIS Track Premises Access Control • Auto-Lock Policy Enforced</span>
          </p>
        </div>
      </div>
    </div>
  );
};
