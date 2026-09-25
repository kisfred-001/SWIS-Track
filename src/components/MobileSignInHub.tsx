import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/sound';
import {
  Camera,
  Keyboard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  School,
  Users,
  Briefcase,
  ArrowRight,
  Delete,
  X,
  ShieldCheck,
  LogOut,
  LogIn,
  UserCheck,
  HeartPulse,
  PhoneCall,
  Home,
  FileText,
} from 'lucide-react';
import { Student, PickupDropoffParty, SignOutOption, EarlyDepartureReasonOption } from '../types';
import { SchoolLogo } from './SchoolLogo';
import { isEarlyDepartureTime } from '../utils/schedule';

interface MobileSignInHubProps {
  onNavigateToDashboard?: () => void;
}

export const MobileSignInHub: React.FC<MobileSignInHubProps> = ({
  onNavigateToDashboard,
}) => {
  const {
    students,
    campuses,
    selectedCampus,
    setSelectedCampus,
    todayLogs,
    processScan,
    findTargetByCode,
    filteredPremisesSummary,
    operationalPolicies,
  } = useAttendance();
  const { allStaff } = useAuth();

  // Primary toggle: Children vs Staff
  const [activeTarget, setActiveTarget] = useState<'children' | 'staff'>('children');

  // Action toggle: Check-In vs Check-Out
  const [actionType, setActionType] = useState<'check_in' | 'check_out'>('check_in');

  // Input method: 'pin' | 'camera' | 'search'
  const [inputMethod, setInputMethod] = useState<'pin' | 'camera' | 'search'>('pin');

  // PIN Pad state
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCenter] = useState<string>('all');

  // Camera state
  const [, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedCodeRef = useRef<{ code: string; time: number } | null>(null);

  // Success / Confirmation overlay state
  const [lastProcessed, setLastProcessed] = useState<{
    name: string;
    roleOrCenter: string;
    action: 'check_in' | 'check_out';
    time: string;
    targetType: 'Student' | 'Staff';
  } | null>(null);

  // Student Checkout Modal (for Pickup Person & Early Reason)
  const [checkoutStudentTarget, setCheckoutStudentTarget] = useState<Student | null>(null);
  const [signOutOption, setSignOutOption] = useState<SignOutOption>('Picked by parent');
  const [pickupPartyName, setPickupPartyName] = useState<string>('');
  const [pickupPartyRelationship, setPickupPartyRelationship] = useState<string>('');
  const [pickupPartyPhone, setPickupPartyPhone] = useState<string>('');
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');

  // Early Departure / Check-out Before Official Time State
  const [isEarlyCheckout, setIsEarlyCheckout] = useState<boolean>(false);
  const [earlyReasonOption, setEarlyReasonOption] = useState<EarlyDepartureReasonOption>('Health reasons');
  const [customEarlyReason, setCustomEarlyReason] = useState<string>('');

  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState<boolean>(false);

  // Stop camera on unmount or mode change
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (inputMethod !== 'camera') {
      stopCamera();
    } else {
      startCamera();
    }
  }, [inputMethod]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setCameraError('No camera found on this device. Please use PIN pad or Search.');
        return;
      }
      const cameraId = devices[devices.length - 1].id;
      const scanner = new Html5Qrcode('mobile-qr-reader');
      html5QrCodeRef.current = scanner;

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 230, height: 230 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          const now = Date.now();
          if (
            lastScannedCodeRef.current &&
            lastScannedCodeRef.current.code === decodedText &&
            now - lastScannedCodeRef.current.time < 3500
          ) {
            return;
          }
          lastScannedCodeRef.current = { code: decodedText, time: now };
          handleDirectCodeScan(decodedText);
        },
        () => {}
      );
      setCameraActive(true);
    } catch {
      setCameraError('Camera access unavailable. Please use touch PIN pad or Search.');
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch {
        // ignore
      }
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  };

  // Direct Code Execution (from camera or PIN)
  const handleDirectCodeScan = async (code: string) => {
    setPinError('');
    const target = findTargetByCode(code);
    if (!target || !target.targetType) {
      sound.playError();
      setPinError(`Unrecognized code "${code}". Please verify the student or staff PIN.`);
      setPinInput('');
      return;
    }

    if (target.targetType === 'Student' && target.student) {
      const student = target.student;
      const existingLog = target.currentLog;

      // Duplicate Check-In Guard
      if (actionType === 'check_in' && existingLog) {
        sound.playError();
        setPinInput('');
        if (!existingLog.check_out_time) {
          setPinError(
            `Duplicate Sign-In / QR Scan Error: ${student.full_name} is already signed IN today at ${existingLog.check_in_time}. A student or QR code cannot be scanned or signed in more than once.`
          );
        } else {
          setPinError(
            `Duplicate Attendance Record: ${student.full_name} has already completed attendance today (Signed In: ${existingLog.check_in_time}, Signed Out: ${existingLog.check_out_time}). A QR code cannot be scanned again today.`
          );
        }
        return;
      }

      // Check-Out Guard: Not checked in yet or already checked out
      if (actionType === 'check_out') {
        if (!existingLog) {
          sound.playError();
          setPinInput('');
          setPinError(`Cannot Check Out: ${student.full_name} has not been signed in today yet. Please sign in the student first.`);
          return;
        }
        if (existingLog.check_out_time) {
          sound.playError();
          setPinInput('');
          setPinError(
            `Duplicate Check-Out / QR Scan Error: ${student.full_name} was already signed OUT today at ${existingLog.check_out_time}. A QR code cannot be scanned for checkout more than once.`
          );
          return;
        }

        // Open checkout modal with the 4 options
        const isEarly = isEarlyDepartureTime(new Date(), operationalPolicies);
        setCheckoutStudentTarget(student);
        setSignOutOption('Picked by parent');
        setPickupPartyName(student.parent_names?.split('&')[0]?.trim() || student.parent_info?.father_name || student.parent_info?.mother_name || 'Parent / Guardian');
        setPickupPartyRelationship('Parent');
        setPickupPartyPhone(student.emergency_contact || '');
        setCheckoutNotes('');
        setIsEarlyCheckout(isEarly);
        setEarlyReasonOption('Health reasons');
        setCustomEarlyReason('');
        return;
      }

      // Check-in student directly
      await executeAttendanceAction(
        code,
        student.full_name,
        student.learning_center_id,
        'Student'
      );
    } else if (target.staff) {
      const staff = target.staff;
      const existingLog = target.currentLog;

      if (actionType === 'check_in' && existingLog) {
        sound.playError();
        setPinInput('');
        if (!existingLog.check_out_time) {
          setPinError(
            `Duplicate Sign-In / QR Scan Error: ${staff.full_name} is already clocked IN today at ${existingLog.check_in_time}. QR code cannot be scanned more than once for check-in.`
          );
        } else {
          setPinError(
            `Duplicate Attendance Record: ${staff.full_name} has already completed attendance today (${existingLog.check_out_time}). QR code cannot be scanned again today.`
          );
        }
        return;
      }

      if (actionType === 'check_out') {
        if (!existingLog) {
          sound.playError();
          setPinInput('');
          setPinError(`Cannot Clock Out: ${staff.full_name} has not clocked in today yet.`);
          return;
        }
        if (existingLog.check_out_time) {
          sound.playError();
          setPinInput('');
          setPinError(
            `Duplicate Check-Out Error: ${staff.full_name} was already clocked OUT today at ${existingLog.check_out_time}.`
          );
          return;
        }
      }

      // Staff member
      await executeAttendanceAction(code, staff.full_name, staff.role, 'Staff');
    }
  };

  // Execute scan through AttendanceContext
  const executeAttendanceAction = async (
    code: string,
    fullName: string,
    roleOrCenter: string,
    targetType: 'Student' | 'Staff',
    party?: PickupDropoffParty,
    notes?: string,
    earlyDepartureReason?: string
  ) => {
    try {
      const res = await processScan({
        code,
        party,
        notes,
        earlyDepartureReason,
        intendedAction: actionType,
      });

      if (res.success) {
        sound.playSuccessChime();
        confetti({
          particleCount: 35,
          spread: 55,
          origin: { y: 0.75 },
        });

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastProcessed({
          name: fullName,
          roleOrCenter,
          action: res.action === 'check_in' ? 'check_in' : 'check_out',
          time: timeStr,
          targetType,
        });

        setPinInput('');
        setCheckoutStudentTarget(null);

        // Auto clear notification banner after 6 seconds
        setTimeout(() => {
          setLastProcessed(null);
        }, 6000);
      } else {
        sound.playError();
        setPinError(res.message);
        setPinInput('');
      }
    } catch (err: any) {
      sound.playError();
      setPinError(err?.message || 'Error processing attendance scan.');
      setPinInput('');
    }
  };

  // Handle PIN input touch
  const handlePinDigit = (digit: string) => {
    const maxLen = activeTarget === 'children' ? 4 : 3;
    if (pinInput.length >= maxLen) return;
    const newPin = pinInput + digit;
    setPinInput(newPin);
    setPinError('');

    if (newPin.length === maxLen) {
      setTimeout(() => {
        handleDirectCodeScan(newPin);
      }, 150);
    }
  };

  const handlePinBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError('');
  };

  const handlePinClear = () => {
    setPinInput('');
    setPinError('');
  };

  // Confirm Student Checkout with details
  const handleConfirmStudentCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutStudentTarget) return;

    setIsSubmittingCheckout(true);

    let partyType: 'Parent' | 'Designate' | 'Self' = 'Parent';
    let finalPartyName = pickupPartyName.trim();
    let finalRelationship = pickupPartyRelationship.trim();

    if (signOutOption === 'Picked by parent') {
      partyType = 'Parent';
      if (!finalPartyName) finalPartyName = 'Parent / Guardian';
      if (!finalRelationship) finalRelationship = 'Parent';
    } else if (signOutOption === 'Picked by Designate') {
      partyType = 'Designate';
      if (!finalPartyName) finalPartyName = 'Authorized Designate';
      if (!finalRelationship) finalRelationship = 'Designate';
    } else if (signOutOption === 'Dropped by designate') {
      partyType = 'Designate';
      if (!finalPartyName) finalPartyName = 'Designate';
      if (!finalRelationship) finalRelationship = 'Designate';
    } else if (signOutOption === 'Student went home alone') {
      partyType = 'Self';
      finalPartyName = `${checkoutStudentTarget.full_name} (Self / Home Alone)`;
      finalRelationship = 'Student Alone';
    }

    const party: PickupDropoffParty = {
      type: partyType,
      signOutOption,
      name: finalPartyName,
      relationship: finalRelationship,
      phone: pickupPartyPhone.trim() || undefined,
      notes: checkoutNotes.trim() || undefined,
    };

    let computedEarlyReason: string | undefined = undefined;
    if (isEarlyCheckout) {
      if (earlyReasonOption === 'Enter reason') {
        computedEarlyReason = customEarlyReason.trim() || 'Early dismissal';
      } else {
        computedEarlyReason = earlyReasonOption;
      }
    }

    await executeAttendanceAction(
      checkoutStudentTarget.pin_code,
      checkoutStudentTarget.full_name,
      checkoutStudentTarget.learning_center_id,
      'Student',
      party,
      checkoutNotes.trim(),
      computedEarlyReason
    );

    setIsSubmittingCheckout(false);
  };

  // Filtered lists for Quick Search Tap
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      const matchesCampus = selectedCampus === 'All Campuses' || s.campus === selectedCampus;
      const matchesCenter = selectedCenter === 'all' || s.learning_center_id === selectedCenter;
      const matchesSearch =
        !q ||
        s.full_name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q) ||
        s.pin_code.includes(q);
      return matchesCampus && matchesCenter && matchesSearch;
    });
  }, [students, selectedCampus, selectedCenter, searchQuery]);

  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allStaff.filter((st) => {
      const matchesCampus =
        selectedCampus === 'All Campuses' || st.campus === selectedCampus || st.campus === 'All Campuses';
      const matchesSearch =
        !q ||
        st.full_name.toLowerCase().includes(q) ||
        st.staff_id.toLowerCase().includes(q) ||
        st.role.toLowerCase().includes(q) ||
        st.pin_code.includes(q);
      return matchesCampus && matchesSearch;
    });
  }, [allStaff, selectedCampus, searchQuery]);

  // Today's recent sign-in activity feed
  const recentLogs = useMemo(() => {
    return [...todayLogs]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4);
  }, [todayLogs]);

  // Check if a specific student is checked in today
  const isStudentCheckedInToday = (studentId: string) => {
    const log = todayLogs.find((l) => l.target_type === 'Student' && l.target_id === studentId);
    return Boolean(log && !log.check_out_time);
  };

  // Check if a specific staff is checked in today
  const isStaffCheckedInToday = (staffId: string) => {
    const log = todayLogs.find((l) => l.target_type === 'Teacher' && l.target_id === staffId);
    return Boolean(log && !log.check_out_time);
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-10">
      {/* Top Mobile Header & Quick Campus Selector */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <SchoolLogo variant="emblem" size="md" className="bg-white p-0.5 rounded-xl shadow-xs shrink-0" />
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-black text-base text-white tracking-tight">SWIS Sign-In Station</h1>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="text-[10px] text-slate-400">
                Primary Attendance Gate &amp; Classroom Kiosk
              </p>
            </div>
          </div>

          {/* Campus Selector */}
          <div className="flex items-center space-x-1 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
            <School className="w-3.5 h-3.5 text-indigo-400" />
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
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Children Present</span>
              <span className="text-base font-black text-emerald-400">
                {filteredPremisesSummary.studentsOnPremises}
                <span className="text-xs text-slate-500 font-normal"> / {filteredPremisesSummary.studentsTotal}</span>
              </span>
            </div>
            <Users className="w-5 h-5 text-indigo-400" />
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Staff On Duty</span>
              <span className="text-base font-black text-sky-400">
                {filteredPremisesSummary.staffOnPremises}
                <span className="text-xs text-slate-500 font-normal"> / {filteredPremisesSummary.staffTotal}</span>
              </span>
            </div>
            <Briefcase className="w-5 h-5 text-sky-400" />
          </div>
        </div>
      </div>

      {/* Target Segmented Buttons: Children vs Staff */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => {
            setActiveTarget('children');
            setPinInput('');
            setPinError('');
          }}
          className={`min-h-[48px] py-3 px-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center space-x-2 cursor-pointer touch-manipulation select-none active:scale-[0.98] ${
            activeTarget === 'children'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Sign In Children</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-mono">4-Digit</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTarget('staff');
            setPinInput('');
            setPinError('');
          }}
          className={`min-h-[48px] py-3 px-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center space-x-2 cursor-pointer touch-manipulation select-none active:scale-[0.98] ${
            activeTarget === 'staff'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4 shrink-0" />
          <span>Sign In Staff</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-mono">3-Digit</span>
        </button>
      </div>

      {/* Action Mode Toggle: Check-In (Arrival) vs Check-Out (Departure) */}
      <div className="grid grid-cols-2 gap-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            setActionType('check_in');
            setPinError('');
          }}
          className={`min-h-[46px] py-3 px-3 rounded-2xl border transition flex items-center justify-center space-x-2 cursor-pointer touch-manipulation select-none active:scale-[0.98] ${
            actionType === 'check_in'
              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs ring-2 ring-emerald-400/30'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <LogIn className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="truncate">Arrival (In)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActionType('check_out');
            setPinError('');
          }}
          className={`min-h-[46px] py-3 px-3 rounded-2xl border transition flex items-center justify-center space-x-2 cursor-pointer touch-manipulation select-none active:scale-[0.98] ${
            actionType === 'check_out'
              ? 'bg-blue-50 border-blue-500 text-blue-950 font-black shadow-xs ring-2 ring-blue-400/30'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <LogOut className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="truncate">Departure (Out)</span>
        </button>
      </div>

      {/* Input Method Switcher: PIN Pad | QR Camera | Quick Search */}
      <div className="bg-slate-100 p-1.5 rounded-2xl grid grid-cols-3 gap-1.5 text-xs font-bold text-slate-600">
        <button
          type="button"
          onClick={() => {
            setInputMethod('pin');
            setPinError('');
          }}
          className={`min-h-[44px] py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer touch-manipulation ${
            inputMethod === 'pin' ? 'bg-white text-indigo-900 shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          <Keyboard className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Touch PIN</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setInputMethod('camera');
            setPinError('');
          }}
          className={`min-h-[44px] py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer touch-manipulation ${
            inputMethod === 'camera' ? 'bg-white text-indigo-900 shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          <Camera className="w-4 h-4 text-blue-600 shrink-0" />
          <span>QR Scanner</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setInputMethod('search');
            setPinError('');
          }}
          className={`min-h-[44px] py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer touch-manipulation ${
            inputMethod === 'search' ? 'bg-white text-indigo-900 shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          <Search className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Name List</span>
        </button>
      </div>

      {/* Recent Success Feedback Banner */}
      {lastProcessed && (
        <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg flex items-center justify-between animate-in zoom-in duration-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">{lastProcessed.name}</div>
              <div className="text-xs text-white/90">
                {lastProcessed.action === 'check_in' ? 'Successfully Clocked IN' : 'Successfully Clocked OUT'} at{' '}
                <strong className="underline">{lastProcessed.time}</strong> ({lastProcessed.roleOrCenter})
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLastProcessed(null)}
            className="text-white/80 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {pinError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center space-x-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="font-semibold">{pinError}</span>
        </div>
      )}

      {/* Input Mode 1: Touch Numeric Keypad */}
      {inputMethod === 'pin' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {activeTarget === 'children' ? 'Enter 4-Digit Child PIN' : 'Enter 3-Digit Staff PIN'}
            </span>
            <div className="mt-2 flex justify-center">
              <div className="h-14 px-6 min-w-[200px] bg-slate-50 border-2 border-slate-300 rounded-2xl flex items-center justify-center text-3xl font-mono font-black tracking-[0.4em] text-slate-900">
                {pinInput ? pinInput : <span className="text-slate-300 tracking-normal font-sans text-sm">••••</span>}
              </div>
            </div>
          </div>

          {/* Big Touch Keypad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handlePinDigit(digit)}
                className="h-14 bg-slate-100 hover:bg-indigo-50 active:bg-indigo-100 border border-slate-200 hover:border-indigo-300 text-slate-800 hover:text-indigo-900 rounded-2xl text-2xl font-bold font-mono transition flex items-center justify-center shadow-xs active:scale-95 cursor-pointer"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handlePinClear}
              className="h-14 bg-slate-100 hover:bg-rose-50 active:bg-rose-100 border border-slate-200 hover:border-rose-300 text-slate-600 hover:text-rose-700 rounded-2xl text-xs font-bold transition flex items-center justify-center cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handlePinDigit('0')}
              className="h-14 bg-slate-100 hover:bg-indigo-50 active:bg-indigo-100 border border-slate-200 hover:border-indigo-300 text-slate-800 hover:text-indigo-900 rounded-2xl text-2xl font-bold font-mono transition flex items-center justify-center shadow-xs active:scale-95 cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handlePinBackspace}
              className="h-14 bg-slate-100 hover:bg-amber-50 active:bg-amber-100 border border-slate-200 hover:border-amber-300 text-slate-600 hover:text-amber-700 rounded-2xl transition flex items-center justify-center cursor-pointer"
              title="Backspace"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Input Mode 2: Live Camera QR Scanner */}
      {inputMethod === 'camera' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 text-center">
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square max-w-xs mx-auto border-2 border-indigo-500 shadow-inner">
            <div id="mobile-qr-reader" className="w-full h-full" />
            <div className="absolute inset-0 pointer-events-none border-2 border-indigo-400/40 rounded-2xl flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-emerald-400 rounded-xl animate-pulse" />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Hold student or staff ID badge QR code in front of the lens.
          </p>
          {cameraError && (
            <div className="text-xs text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-xl">
              {cameraError}
            </div>
          )}
        </div>
      )}

      {/* Input Mode 3: Fast Name Search & 1-Tap Sign */}
      {inputMethod === 'search' && (
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTarget === 'children'
                  ? 'Type child name or PIN...'
                  : 'Type staff name or role...'
              }
              className="w-full min-h-[44px] text-sm pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 touch-manipulation"
            />
          </div>

          {/* Student Search Results */}
          {activeTarget === 'children' && (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No children found matching "{searchQuery}".
                </div>
              ) : (
                filteredStudents.slice(0, 15).map((s) => {
                  const isPresent = isStudentCheckedInToday(s.student_id);

                  return (
                    <div
                      key={s.student_id}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 transition touch-manipulation"
                    >
                      <div className="flex items-center space-x-2.5 truncate min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs shrink-0">
                          {s.full_name.charAt(0)}
                        </div>
                        <div className="truncate min-w-0">
                          <div className="font-bold text-xs text-slate-900 truncate">
                            {s.full_name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {s.learning_center_id} • PIN: <span className="font-mono font-bold text-indigo-700">{s.pin_code}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {isPresent ? (
                          <button
                            type="button"
                            onClick={() => {
                              setCheckoutStudentTarget(s);
                              setPickupPartyName(s.parent_names || 'Parent');
                            }}
                            className="min-h-[44px] min-w-[80px] px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs transition shadow-xs touch-manipulation cursor-pointer flex items-center justify-center"
                          >
                            Sign Out
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              executeAttendanceAction(s.pin_code, s.full_name, s.learning_center_id, 'Student')
                            }
                            className="min-h-[44px] min-w-[80px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs transition shadow-xs touch-manipulation cursor-pointer flex items-center justify-center"
                          >
                            Sign In
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Staff Search Results */}
          {activeTarget === 'staff' && (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredStaff.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No staff members found matching "{searchQuery}".
                </div>
              ) : (
                filteredStaff.slice(0, 15).map((st) => {
                  const isPresent = isStaffCheckedInToday(st.staff_id);

                  return (
                    <div
                      key={st.staff_id}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 transition touch-manipulation"
                    >
                      <div className="flex items-center space-x-2.5 truncate min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-xs shrink-0">
                          {st.full_name.charAt(0)}
                        </div>
                        <div className="truncate min-w-0">
                          <div className="font-bold text-xs text-slate-900 truncate">
                            {st.full_name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {st.role} • PIN: <span className="font-mono font-bold text-purple-700">{st.pin_code}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {isPresent ? (
                          <button
                            type="button"
                            onClick={() => executeAttendanceAction(st.pin_code, st.full_name, st.role, 'Staff')}
                            className="min-h-[44px] min-w-[80px] px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs transition shadow-xs touch-manipulation cursor-pointer flex items-center justify-center"
                          >
                            Clock Out
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => executeAttendanceAction(st.pin_code, st.full_name, st.role, 'Staff')}
                            className="min-h-[44px] min-w-[80px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs transition shadow-xs touch-manipulation cursor-pointer flex items-center justify-center"
                          >
                            Clock In
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent Feed */}
      {recentLogs.length > 0 && (
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Today's Recent Gate Logs</span>
            </span>
            <span>Live Sync</span>
          </div>

          <div className="space-y-1.5">
            {recentLogs.map((l) => (
              <div
                key={l.id}
                className="bg-white p-2 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      !l.check_out_time ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  <span className="font-bold text-slate-800">{l.target_name}</span>
                  <span className="text-[10px] text-slate-400">({l.target_type})</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono font-bold">
                  {!l.check_out_time ? `In ${l.check_in_time}` : `Out ${l.check_out_time}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Switch to Full Dashboard Link */}
      {onNavigateToDashboard && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onNavigateToDashboard}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center space-x-1 p-2 rounded-xl hover:bg-indigo-50 transition"
          >
            <span>Switch to Full Administrative Dashboard &amp; Staff Module</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Child Check-Out Modal (Child Departure Authorization) */}
      {checkoutStudentTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col border border-slate-200 animate-in slide-in-from-bottom-6 sm:zoom-in duration-150 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-rose-50 via-white to-orange-50 flex justify-between items-start shrink-0">
              <div className="space-y-1">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full border border-rose-200 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-rose-600" />
                    <span>Departure Authorization</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    PIN: {checkoutStudentTarget.pin_code}
                  </span>
                </div>
                <h3 className="font-black text-lg text-slate-900 leading-tight">
                  {checkoutStudentTarget.full_name}
                </h3>
                <p className="text-xs text-slate-600">
                  {checkoutStudentTarget.learning_center_id} • Campus: {checkoutStudentTarget.campus}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutStudentTarget(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl bg-white/80 border border-slate-200 shrink-0 cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleConfirmStudentCheckout} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {/* Sign-Out Options: EXACT 4 Options per user requirement */}
              <div className="space-y-2">
                <label className="block text-slate-900 font-black text-xs">
                  Select Sign-Out Option (Required):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {/* Option 1: Picked by parent */}
                  <button
                    type="button"
                    onClick={() => {
                      setSignOutOption('Picked by parent');
                      if (!pickupPartyName || pickupPartyName.includes('Alone') || pickupPartyName.includes('Designate')) {
                        setPickupPartyName(checkoutStudentTarget.parent_names?.split('&')[0]?.trim() || 'Parent');
                        setPickupPartyRelationship('Parent');
                      }
                    }}
                    className={`min-h-[50px] p-3 rounded-2xl border text-left transition flex items-center space-x-2.5 cursor-pointer touch-manipulation active:scale-[0.98] ${
                      signOutOption === 'Picked by parent'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-2 ring-indigo-500/20 font-bold shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-sm">
                      👨‍👩‍👧
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs truncate">1. Picked by parent</div>
                      <div className="text-[10px] text-slate-500 truncate">Mother / Father / Guardian</div>
                    </div>
                  </button>

                  {/* Option 2: Picked by Designate */}
                  <button
                    type="button"
                    onClick={() => {
                      setSignOutOption('Picked by Designate');
                      if (!pickupPartyName || pickupPartyName === 'Parent' || pickupPartyName.includes('Alone')) {
                        setPickupPartyName('');
                        setPickupPartyRelationship('Authorized Designate');
                      }
                    }}
                    className={`min-h-[50px] p-3 rounded-2xl border text-left transition flex items-center space-x-2.5 cursor-pointer touch-manipulation active:scale-[0.98] ${
                      signOutOption === 'Picked by Designate'
                        ? 'bg-blue-50 border-blue-600 text-blue-950 ring-2 ring-blue-500/20 font-bold shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-sm">
                      🚗
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs truncate">2. Picked by Designate</div>
                      <div className="text-[10px] text-slate-500 truncate">Driver / Relative / Friend</div>
                    </div>
                  </button>

                  {/* Option 3: Dropped by designate */}
                  <button
                    type="button"
                    onClick={() => {
                      setSignOutOption('Dropped by designate');
                      if (!pickupPartyName || pickupPartyName === 'Parent' || pickupPartyName.includes('Alone')) {
                        setPickupPartyName('');
                        setPickupPartyRelationship('Authorized Designate');
                      }
                    }}
                    className={`min-h-[50px] p-3 rounded-2xl border text-left transition flex items-center space-x-2.5 cursor-pointer touch-manipulation active:scale-[0.98] ${
                      signOutOption === 'Dropped by designate'
                        ? 'bg-amber-50 border-amber-600 text-amber-950 ring-2 ring-amber-500/20 font-bold shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 font-bold flex items-center justify-center shrink-0 text-sm">
                      🚐
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs truncate">3. Dropped by designate</div>
                      <div className="text-[10px] text-slate-500 truncate">School Shuttle / Designate</div>
                    </div>
                  </button>

                  {/* Option 4: Student went home alone */}
                  <button
                    type="button"
                    onClick={() => {
                      setSignOutOption('Student went home alone');
                      setPickupPartyName(`${checkoutStudentTarget.full_name} (Self / Home Alone)`);
                      setPickupPartyRelationship('Self');
                    }}
                    className={`min-h-[50px] p-3 rounded-2xl border text-left transition flex items-center space-x-2.5 cursor-pointer touch-manipulation active:scale-[0.98] ${
                      signOutOption === 'Student went home alone'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20 font-bold shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-sm">
                      🚶
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs truncate">4. Student went home alone</div>
                      <div className="text-[10px] text-slate-500 truncate">Independent Departure</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Dynamic Party Details if not home alone */}
              {signOutOption !== 'Student went home alone' && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {signOutOption === 'Picked by parent' ? 'Parent / Guardian Full Name:' : 'Designate Full Name:'}
                    </label>
                    <input
                      type="text"
                      required
                      value={pickupPartyName}
                      onChange={(e) => setPickupPartyName(e.target.value)}
                      placeholder={
                        signOutOption === 'Picked by parent'
                          ? 'e.g. Mother, Father, or Guardian full name'
                          : 'e.g. Driver Robert / Aunt Sarah / Designate'
                      }
                      className="w-full min-h-[42px] text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium touch-manipulation"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Relationship:</label>
                      <input
                        type="text"
                        value={pickupPartyRelationship}
                        onChange={(e) => setPickupPartyRelationship(e.target.value)}
                        placeholder="e.g. Mother / Driver"
                        className="w-full min-h-[42px] text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 touch-manipulation"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Contact Phone (Optional):</label>
                      <input
                        type="text"
                        value={pickupPartyPhone}
                        onChange={(e) => setPickupPartyPhone(e.target.value)}
                        placeholder="+256 7..."
                        className="w-full min-h-[42px] text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 touch-manipulation font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Check Out Before Official Time Section (4 options) */}
              <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="earlyCheckoutToggle"
                      checked={isEarlyCheckout}
                      onChange={(e) => setIsEarlyCheckout(e.target.checked)}
                      className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <label htmlFor="earlyCheckoutToggle" className="font-bold text-amber-950 cursor-pointer text-xs flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Check Out Before Official Time</span>
                    </label>
                  </div>
                  {isEarlyCheckout && (
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                      Early Departure
                    </span>
                  )}
                </div>

                {isEarlyCheckout && (
                  <div className="space-y-2 pt-1 border-t border-amber-200/80">
                    <label className="block text-[11px] font-bold text-amber-900">
                      Select Early Check-Out Reason (Mandatory):
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {/* 1) Health reasons */}
                      <button
                        type="button"
                        onClick={() => setEarlyReasonOption('Health reasons')}
                        className={`min-h-[40px] px-2.5 py-2 rounded-xl text-left font-bold text-xs flex items-center space-x-2 cursor-pointer transition touch-manipulation ${
                          earlyReasonOption === 'Health reasons'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white border border-amber-300 text-amber-950 hover:bg-amber-100'
                        }`}
                      >
                        <HeartPulse className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">1. Health reasons</span>
                      </button>

                      {/* 2) Parent request */}
                      <button
                        type="button"
                        onClick={() => setEarlyReasonOption('Parent request')}
                        className={`min-h-[40px] px-2.5 py-2 rounded-xl text-left font-bold text-xs flex items-center space-x-2 cursor-pointer transition touch-manipulation ${
                          earlyReasonOption === 'Parent request'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white border border-amber-300 text-amber-950 hover:bg-amber-100'
                        }`}
                      >
                        <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">2. Parent request</span>
                      </button>

                      {/* 3) Child sent home */}
                      <button
                        type="button"
                        onClick={() => setEarlyReasonOption('Child sent home')}
                        className={`min-h-[40px] px-2.5 py-2 rounded-xl text-left font-bold text-xs flex items-center space-x-2 cursor-pointer transition touch-manipulation ${
                          earlyReasonOption === 'Child sent home'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white border border-amber-300 text-amber-950 hover:bg-amber-100'
                        }`}
                      >
                        <Home className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">3. Child sent home</span>
                      </button>

                      {/* 4) Enter reason */}
                      <button
                        type="button"
                        onClick={() => setEarlyReasonOption('Enter reason')}
                        className={`min-h-[40px] px-2.5 py-2 rounded-xl text-left font-bold text-xs flex items-center space-x-2 cursor-pointer transition touch-manipulation ${
                          earlyReasonOption === 'Enter reason'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white border border-amber-300 text-amber-950 hover:bg-amber-100'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">4. Enter reason</span>
                      </button>
                    </div>

                    {/* Custom text field when "Enter reason" is chosen */}
                    {earlyReasonOption === 'Enter reason' && (
                      <div className="pt-1 animate-in fade-in">
                        <input
                          type="text"
                          required
                          value={customEarlyReason}
                          onChange={(e) => setCustomEarlyReason(e.target.value)}
                          placeholder="Type specific early check-out reason..."
                          className="w-full min-h-[40px] text-xs p-2.5 bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900 touch-manipulation"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  General Departure Notes (Optional):
                </label>
                <input
                  type="text"
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  placeholder="e.g. Cleared by front office desk..."
                  className="w-full min-h-[40px] text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white touch-manipulation"
                />
              </div>

              {/* Sticky Action Footer */}
              <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setCheckoutStudentTarget(null)}
                  className="min-h-[48px] py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmittingCheckout ||
                    (signOutOption !== 'Student went home alone' && !pickupPartyName.trim()) ||
                    (isEarlyCheckout && earlyReasonOption === 'Enter reason' && !customEarlyReason.trim())
                  }
                  className="min-h-[48px] py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black shadow-md disabled:opacity-50 transition active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center space-x-1.5 text-sm"
                >
                  {isSubmittingCheckout ? (
                    <span>Signing Out...</span>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      <span>Authorize Sign-Out</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
