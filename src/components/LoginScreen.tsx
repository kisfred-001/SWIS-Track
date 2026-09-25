import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  School,
  Lock,
  KeyRound,
  Mail,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  Users,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Delete,
  Building2,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { sound } from '../utils/sound';
import { Staff } from '../types';
import { MobileSignInHub } from './MobileSignInHub';

export const LoginScreen: React.FC = () => {
  const {
    allStaff,
    idleTimedOut,
    loginWithPin,
    loginWithEmailPassword,
    switchUser,
    idleTimeoutMinutes,
    superUserCredentials,
  } = useAuth();

  const [authMode, setAuthMode] = useState<'pin' | 'email' | 'roster' | 'signin_station'>('pin');

  // When opening on mobile, primarily open the option of signing in children and staff!
  useEffect(() => {
    const isMobile =
      typeof window !== 'undefined' &&
      (window.innerWidth < 768 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
    if (isMobile && !idleTimedOut) {
      setAuthMode('signin_station');
    }
  }, [idleTimedOut]);
  const [pinInput, setPinInput] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showCredentialsGuide, setShowCredentialsGuide] = useState<boolean>(false);
  const [searchStaff, setSearchStaff] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'admin' | 'spring' | 'hope' | 'support'>('all');

  const pinInputRef = useRef<HTMLInputElement>(null);

  // Focus PIN input when switching to PIN tab
  useEffect(() => {
    if (authMode === 'pin') {
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 100);
    }
  }, [authMode]);

  // Handle PIN authentication
  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    const cleanPin = pinInput.trim();
    if (!cleanPin) {
      setErrorMessage('Please enter your 3-digit staff PIN.');
      sound.playError();
      return;
    }

    const success = loginWithPin(cleanPin);
    if (success) {
      sound.playSuccessChime();
    } else {
      sound.playError();
      setErrorMessage('Invalid PIN code. Please verify your 3-digit staff PIN.');
      setPinInput('');
    }
  };

  // Auto-submit when 3 digits are entered
  const handlePinDigitPress = (digit: string) => {
    if (pinInput.length >= 3) return;
    const newPin = pinInput + digit;
    setPinInput(newPin);
    setErrorMessage('');

    if (newPin.length === 3) {
      setTimeout(() => {
        const success = loginWithPin(newPin);
        if (success) {
          sound.playSuccessChime();
        } else {
          sound.playError();
          setErrorMessage('Invalid PIN code. Please verify your 3-digit staff PIN.');
          setPinInput('');
        }
      }, 150);
    }
  };

  const handlePinBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handlePinClear = () => {
    setPinInput('');
    setErrorMessage('');
  };

  // Handle Email & Password authentication
  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emailInput.trim() || !passwordInput.trim()) {
      setErrorMessage('Please provide both your email/username and password.');
      sound.playError();
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithEmailPassword(emailInput.trim(), passwordInput.trim());
      if (res.success) {
        sound.playSuccessChime();
      } else {
        sound.playError();
        setErrorMessage(res.message || 'Invalid username or password. Please verify credentials.');
      }
    } catch (err: any) {
      sound.playError();
      setErrorMessage(err?.message || 'Authentication error. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle direct persona selection
  const handleSelectStaff = (staff: Staff) => {
    switchUser(staff);
    sound.playSuccessChime();
  };

  // Quick fill Super User credentials
  const handleFillSuperUser = () => {
    setAuthMode('email');
    setEmailInput(superUserCredentials.email);
    setPasswordInput('P@haneroo@555');
    setErrorMessage('');
  };

  // Quick fill PIN for Fredrick
  const handleFillSuperUserPin = () => {
    setAuthMode('pin');
    setPinInput('555');
    setErrorMessage('');
    setTimeout(() => {
      loginWithPin('555');
      sound.playSuccessChime();
    }, 150);
  };

  // Filter staff list
  const filteredStaff = allStaff.filter((s) => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(searchStaff.toLowerCase()) ||
      s.role.toLowerCase().includes(searchStaff.toLowerCase()) ||
      (s.learning_center_id && s.learning_center_id.toLowerCase().includes(searchStaff.toLowerCase())) ||
      (s.campus && s.campus.toLowerCase().includes(searchStaff.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === 'admin') {
      return ['ICCE Coordinator', 'Principal', 'Director', 'Administrator', 'Administrative Assistant'].includes(
        s.role
      );
    }
    if (selectedFilter === 'spring') {
      return s.campus === 'Spring Campus';
    }
    if (selectedFilter === 'hope') {
      return s.campus === 'Hope Campus';
    }
    if (selectedFilter === 'support') {
      return s.role === 'Support Staff';
    }
    return true;
  });

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Brand Bar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between text-white/80 py-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 border border-blue-400/30">
            <School className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black tracking-tight text-white text-lg">SWIS Track</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                Official Terminal
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Spring Campus & Hope Campus • School Attendance System
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Premises Security Active</span>
        </div>
      </header>

      {/* Main Authentication Container */}
      <div className="max-w-xl w-full mx-auto my-auto py-4">
        {authMode === 'signin_station' ? (
          <div className="space-y-3">
            <div className="bg-slate-900/90 text-white p-3.5 rounded-3xl border border-slate-800 flex items-center justify-between shadow-xl">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <div>
                  <span className="text-xs font-black text-white block">Mobile Attendance Gate Station</span>
                  <span className="text-[10px] text-emerald-300">Signing In Children &amp; Staff</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAuthMode('pin')}
                className="text-xs text-indigo-300 hover:text-white font-bold flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 rounded-xl border border-slate-700 transition"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Staff Terminal Login</span>
              </button>
            </div>
            <MobileSignInHub onNavigateToDashboard={() => setAuthMode('pin')} />
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 text-center relative overflow-hidden">
              {/* Ambient background decoration */}
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Lock className="w-7 h-7 text-indigo-300" />
              </div>

              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-2">
                <Building2 className="w-3.5 h-3.5" />
                <span>Multi-Campus Identity System</span>
              </div>

              <h1 className="text-2xl font-black text-white tracking-tight">
                {idleTimedOut ? 'Session Inactivity Lock' : 'School Terminal Sign In'}
              </h1>

              <p className="text-xs text-slate-300 mt-1.5 max-w-md mx-auto leading-relaxed">
                {idleTimedOut
                  ? `Terminal locked automatically after ${idleTimeoutMinutes} minutes of inactivity to safeguard student records. Enter your staff PIN or credentials to resume.`
                  : 'Welcome to SWIS Track. Please authenticate with your authorized staff PIN, account credentials, or select your staff persona.'}
              </p>

              {idleTimedOut && (
                <div className="mt-3 inline-flex items-center space-x-1.5 bg-amber-500/20 border border-amber-400/40 text-amber-200 px-3 py-1 rounded-xl text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-300" />
                  <span>Inactivity Security Protocol Triggered</span>
                </div>
              )}
            </div>

            {/* Quick Option to Open Sign-In Station */}
            <div className="p-4 sm:p-6 pb-0">
              <button
                type="button"
                onClick={() => setAuthMode('signin_station')}
                className="w-full py-3 px-4 rounded-2xl text-xs font-black transition flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 cursor-pointer active:scale-98"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse"></span>
                <span>📱 Open Sign-In Station (Children &amp; Staff)</span>
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="p-4 sm:p-6 pb-2">
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('pin');
                  setErrorMessage('');
                }}
                className={`py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  authMode === 'pin'
                    ? 'bg-white text-indigo-900 shadow-sm'
                    : 'hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span>Staff PIN</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('email');
                  setErrorMessage('');
                }}
                className={`py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  authMode === 'email'
                    ? 'bg-white text-indigo-900 shadow-sm'
                    : 'hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Account Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('roster');
                  setErrorMessage('');
                }}
                className={`py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  authMode === 'roster'
                    ? 'bg-white text-indigo-900 shadow-sm'
                    : 'hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Users className="w-4 h-4 text-purple-600" />
                <span>Staff Directory</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Staff PIN Entry */}
          {authMode === 'pin' && (
            <div className="p-4 sm:p-6 pt-2 space-y-5">
              <div className="text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Authorized Personnel PIN
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your assigned 3-digit security PIN to unlock the terminal
                </p>
              </div>

              {/* PIN Display Input */}
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative max-w-xs w-full">
                    <input
                      ref={pinInputRef}
                      type="password"
                      maxLength={3}
                      value={pinInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                        setPinInput(val);
                        setErrorMessage('');
                        if (val.length === 3) {
                          setTimeout(() => {
                            const success = loginWithPin(val);
                            if (success) {
                              sound.playSuccessChime();
                            } else {
                              sound.playError();
                              setErrorMessage('Invalid PIN code. Please verify your 3-digit staff PIN.');
                              setPinInput('');
                            }
                          }, 150);
                        }
                      }}
                      placeholder="•••"
                      className="w-full text-center text-3xl sm:text-4xl tracking-[0.5em] font-mono py-3 px-4 border-2 border-slate-300 rounded-2xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition bg-slate-50 font-black text-slate-900"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="flex items-center justify-center space-x-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className="font-semibold">{errorMessage}</span>
                  </div>
                )}

                {/* Touch Numeric Keypad */}
                <div className="max-w-xs mx-auto grid grid-cols-3 gap-2 pt-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handlePinDigitPress(digit)}
                      className="h-12 bg-slate-100 hover:bg-indigo-50 active:bg-indigo-100 border border-slate-200 hover:border-indigo-300 text-slate-800 hover:text-indigo-900 rounded-xl text-lg font-bold font-mono transition flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handlePinClear}
                    className="h-12 bg-slate-100 hover:bg-rose-50 active:bg-rose-100 border border-slate-200 hover:border-rose-300 text-slate-600 hover:text-rose-700 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePinDigitPress('0')}
                    className="h-12 bg-slate-100 hover:bg-indigo-50 active:bg-indigo-100 border border-slate-200 hover:border-indigo-300 text-slate-800 hover:text-indigo-900 rounded-xl text-lg font-bold font-mono transition flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handlePinBackspace}
                    className="h-12 bg-slate-100 hover:bg-amber-50 active:bg-amber-100 border border-slate-200 hover:border-amber-300 text-slate-600 hover:text-amber-700 rounded-xl transition flex items-center justify-center cursor-pointer"
                    title="Backspace"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>

                <div className="max-w-xs mx-auto pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/20 transition flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Unlock Terminal</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: Email & Password */}
          {authMode === 'email' && (
            <div className="p-4 sm:p-6 pt-2 space-y-4">
              <div className="text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Institutional Account Sign In
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sign in with your registered email and authorized password or staff PIN
                </p>
              </div>

              <form onSubmit={handleEmailPasswordSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email / Staff Username
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="e.g. kisfred@gmail.com or staff@swis.ac.ug"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password / Staff PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter password or 3-digit PIN"
                      className="w-full pl-4 pr-10 py-2.5 text-sm border-2 border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition bg-white text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="flex items-center space-x-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className="font-semibold">{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/20 transition flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Terminal</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Tab 3: Staff Directory / Quick Persona Selector */}
          {authMode === 'roster' && (
            <div className="p-4 sm:p-6 pt-2 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Quick Staff Directory
                  </span>
                  <p className="text-xs text-slate-500">
                    Select your personnel profile to sign in immediately
                  </p>
                </div>

                {/* Filter buttons */}
                <div className="flex flex-wrap gap-1 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setSelectedFilter('all')}
                    className={`px-2 py-1 rounded-lg transition ${
                      selectedFilter === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({allStaff.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFilter('admin')}
                    className={`px-2 py-1 rounded-lg transition ${
                      selectedFilter === 'admin'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Leadership
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFilter('spring')}
                    className={`px-2 py-1 rounded-lg transition ${
                      selectedFilter === 'spring'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Spring
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFilter('hope')}
                    className={`px-2 py-1 rounded-lg transition ${
                      selectedFilter === 'hope'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Hope
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <input
                type="text"
                value={searchStaff}
                onChange={(e) => setSearchStaff(e.target.value)}
                placeholder="Search staff by name, role, or center..."
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-none bg-slate-50"
              />

              {/* Staff Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {filteredStaff.map((staff) => {
                  const isSuper = staff.staff_id === 'STF-001' || staff.email === 'kisfred@gmail.com';
                  return (
                    <button
                      key={staff.staff_id}
                      type="button"
                      onClick={() => handleSelectStaff(staff)}
                      className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-left transition group cursor-pointer ${
                        isSuper
                          ? 'border-purple-300 bg-purple-50/70 hover:bg-purple-100/70'
                          : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition ${
                          isSuper
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-700'
                        }`}
                      >
                        {staff.full_name.charAt(0)}
                      </div>
                      <div className="truncate flex-1">
                        <div className="flex items-center space-x-1">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-900 truncate">
                            {staff.full_name}
                          </p>
                          {isSuper && <span className="text-[10px] text-purple-600 font-black">★</span>}
                        </div>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(
                              staff.role
                            )}`}
                          >
                            {staff.role}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            PIN: {staff.pin_code}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 transition" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Staff Credentials Accordion */}
          <div className="border-t border-slate-100 bg-slate-50/70 p-4">
            <button
              type="button"
              onClick={() => setShowCredentialsGuide(!showCredentialsGuide)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-indigo-900 transition cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Authorized Staff PIN & Credentials Quick Reference</span>
              </div>
              {showCredentialsGuide ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showCredentialsGuide && (
              <div className="mt-3 space-y-2 text-xs animate-in fade-in">
                {/* Super User Callout */}
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-purple-950">Mr. Fredrick Kariuki</span>
                      <span className="px-1.5 py-0.2 bg-purple-200 text-purple-800 text-[9px] font-bold rounded">
                        ICCE Coordinator • Super User
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 space-x-2">
                      <span>Email: <code className="font-mono text-purple-700">kisfred@gmail.com</code></span>
                      <span>•</span>
                      <span>PIN: <code className="font-mono text-purple-700 font-bold">555</code></span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={handleFillSuperUserPin}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold transition shadow-2xs cursor-pointer"
                    >
                      Quick Sign In (PIN 555)
                    </button>
                  </div>
                </div>

                {/* Key Roles Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800">Mrs. Irene Lulika</strong> (Principal • Springs)
                      <span className="text-[10px] text-slate-500 block font-mono">principal@spiritandword.ug</span>
                    </div>
                    <span className="font-mono bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-indigo-700 font-bold">
                      PIN: 101
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800">Mr. Jaxon Lulika</strong> (Director • Springs)
                      <span className="text-[10px] text-slate-500 block font-mono">pastor@spiritandword.ug</span>
                    </div>
                    <span className="font-mono bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-indigo-700 font-bold">
                      PIN: 102
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800">Mrs. Khasoma Susan</strong> (Administrator • Hope)
                      <span className="text-[10px] text-slate-500 block font-mono">susan.khasoma@spiritandword.ug</span>
                    </div>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold">
                      PIN: 103
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800">Mrs. Juliet Arinaitwe</strong> (Admin Assistant • Hope)
                      <span className="text-[10px] text-slate-500 block font-mono">jarineitwe@spiritandword.ug</span>
                    </div>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold">
                      PIN: 104
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800">Miss. Anette Mugala</strong> (Support Staff • Hope)
                      <span className="text-[10px] text-slate-500 block font-mono">annet@spiritandword.ug</span>
                    </div>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold">
                      PIN: 105
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800">Mrs. Irene Oryem</strong> (Kayil Supervisor • Springs)
                      <span className="text-[10px] text-slate-500 block font-mono">irene.auma@spiritandword.ug</span>
                    </div>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold">
                      PIN: 201
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800">Mr. Arthur Mutebi</strong> (Splendor Supervisor • Springs)
                      <span className="text-[10px] text-slate-500 block font-mono">arthur@spiritandword.ug</span>
                    </div>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold">
                      PIN: 202
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800">Mrs. Eunice Mutebe</strong> (Bethany Supervisor • Hope)
                      <span className="text-[10px] text-slate-500 block font-mono">eunice@spiritandword.ug</span>
                    </div>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold">
                      PIN: 203
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800">Mr. Shafic Musika</strong> (Azusa Supervisor • Hope)
                      <span className="text-[10px] text-slate-500 block font-mono">shafic@spiritandword.ug</span>
                    </div>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold">
                      PIN: 204
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800">Mrs. Doreen Mugaga</strong> (Antioch Supervisor • Hope)
                      <span className="text-[10px] text-slate-500 block font-mono">doreen.amali@spiritandword.ug</span>
                    </div>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold">
                      PIN: 205
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800">Mr. David Kimbugwe Mugaga</strong> (Doxa Supervisor • Springs)
                      <span className="text-[10px] text-slate-500 block font-mono">david.kimbugwe@spiritandword.ug</span>
                    </div>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold">
                      PIN: 206
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800">Mrs. Julie Mayanja</strong> (Bloom & Archie Supervisor • Hope)
                      <span className="text-[10px] text-slate-500 block font-mono">julie.mayanja@spiritandword.ug</span>
                    </div>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold">
                      PIN: 207
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800">Mrs. Joan Nandhego</strong> (Bethany Monitor • Hope)
                      <span className="text-[10px] text-slate-500 block font-mono">joan@spiritandword.ug</span>
                    </div>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold">
                      PIN: 208
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security Assurance Footer */}
          <div className="p-3 bg-slate-900 text-white/70 text-center text-[10px] flex items-center justify-center space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SWIS Track Premises Access • Safe International School Attendance & Verification</span>
          </div>
        </div>
        )}
      </div>

      {/* Page Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center text-xs text-slate-500 py-2">
        <p>© {new Date().getFullYear()} SWIS Track International • Spring Campus & Hope Campus • Role-Based Terminal Access</p>
      </footer>
    </div>
  );
};
