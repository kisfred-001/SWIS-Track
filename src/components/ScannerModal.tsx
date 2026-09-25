import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/sound';
import {
  Camera,
  X,
  Keyboard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  LogOut,
  LogIn,
  Bed,
  HeartPulse,
  PhoneCall,
  Home,
  FileText,
} from 'lucide-react';
import { PickupDropoffParty, Student, Staff, SignOutOption, EarlyDepartureReasonOption } from '../types';
import { getSchoolSchedule, isEarlyDepartureTime, getBoardingScheduleStatus } from '../utils/schedule';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose }) => {
  const { processScan, findTargetByCode, operationalPolicies } = useAttendance();
  const { currentUser, canScanTeachers } = useAuth();

  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual');
  const [manualCode, setManualCode] = useState<string>('');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Target confirmation step state
  const [identifiedTarget, setIdentifiedTarget] = useState<{
    targetType: 'Student' | 'Teacher';
    student?: Student;
    staff?: Staff;
    actionType: 'check_in' | 'check_out';
    currentLog?: any;
  } | null>(null);

  // Modal form states for Student Check-in / Check-out
  const [partyType, setPartyType] = useState<'Parent' | 'Designate' | 'Self'>('Parent');
  const [signOutOption, setSignOutOption] = useState<SignOutOption>('Picked by parent');
  const [partyName, setPartyName] = useState<string>('');
  const [partyRelationship, setPartyRelationship] = useState<string>('');
  const [partyPhone, setPartyPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Early Departure States (4 options)
  const [isEarlyDeparture, setIsEarlyDeparture] = useState<boolean>(false);
  const [earlyReasonOption, setEarlyReasonOption] = useState<EarlyDepartureReasonOption>('Health reasons');
  const [customEarlyReason, setCustomEarlyReason] = useState<string>('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ code: string; time: number } | null>(null);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setIdentifiedTarget(null);
      setManualCode('');
      setErrorMessage(null);
      setScanSuccessMessage(null);
    }
  }, [isOpen]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setCameraError('No video camera devices found on this device.');
        return;
      }

      const cameraId = devices[devices.length - 1].id; // Prefer back camera if available
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          const now = Date.now();
          if (
            lastScannedRef.current &&
            lastScannedRef.current.code === decodedText &&
            now - lastScannedRef.current.time < 3500
          ) {
            return;
          }
          lastScannedRef.current = { code: decodedText, time: now };
          handleCodeDetected(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );

      setCameraActive(true);
    } catch {
      setCameraError(
        'Unable to access camera. Please allow camera permissions or use the PIN pad fallback.'
      );
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
      } catch (e) {
        // ignore
      }
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  };

  const handleModeChange = (mode: 'camera' | 'manual') => {
    setScanMode(mode);
    setErrorMessage(null);
    if (mode === 'camera') {
      setTimeout(() => {
        startCamera();
      }, 100);
    } else {
      stopCamera();
    }
  };

  // Called when code is scanned via camera or entered manually
  const handleCodeDetected = (code: string) => {
    setErrorMessage(null);
    setScanSuccessMessage(null);

    const lookup = findTargetByCode(code);
    if (!lookup.targetType) {
      sound.playError();
      setErrorMessage(`No matching student or staff member found for "${code}".`);
      return;
    }

    // Permission enforcement: Teachers cannot scan staff in/out
    if (lookup.targetType === 'Teacher') {
      if (!canScanTeachers) {
        sound.playError();
        setErrorMessage(
          'Permission Denied: Teachers are not authorized to scan staff members in/out. Please ask an Admin Assistant, Principal, or Director.'
        );
        return;
      }

      const staff = lookup.staff!;
      const actionType = lookup.actionType;

      if (!actionType) {
        sound.playError();
        setErrorMessage(
          `QR Code Already Scanned: ${staff.full_name} was already clocked OUT today (${lookup.currentLog?.check_out_time || 'Completed'}). QR code cannot be scanned more than once today.`
        );
        return;
      }

      setIdentifiedTarget({
        targetType: 'Teacher',
        staff,
        actionType,
        currentLog: lookup.currentLog,
      });
      return;
    }

    if (lookup.targetType === 'Student') {
      const student = lookup.student!;
      const actionType = lookup.actionType;

      if (!actionType) {
        sound.playError();
        setErrorMessage(
          `QR Code Already Scanned: ${student.full_name} was already checked OUT today at ${lookup.currentLog?.check_out_time || 'Completed'}. Attendance is complete; QR code cannot be scanned more than once today.`
        );
        return;
      }

      // Prepopulate form defaults
      if (actionType === 'check_in') {
        setPartyType('Parent');
        setPartyName((student.parent_names || '').split('&')[0]?.trim() || '');
        setPartyRelationship('Parent / Guardian');
        setPartyPhone(student.emergency_contact || '');
        setNotes('');
        setIsEarlyDeparture(false);
        setEarlyReasonOption('Health reasons');
        setCustomEarlyReason('');
      } else {
        setSignOutOption('Picked by parent');
        setPartyType('Parent');
        setPartyName((student.parent_names || '').split('&')[0]?.trim() || '');
        setPartyRelationship('Parent');
        setPartyPhone(student.emergency_contact || '');
        setNotes('');
        // Check if current time is before normal dismissal via operational policies
        const isEarly = isEarlyDepartureTime(new Date(), operationalPolicies);
        setIsEarlyDeparture(isEarly);
        setEarlyReasonOption('Health reasons');
        setCustomEarlyReason('');
      }

      setIdentifiedTarget({
        targetType: 'Student',
        student,
        actionType,
        currentLog: lookup.currentLog,
      });
    }
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeDetected(manualCode.trim());
  };

  const handleConfirmAction = async () => {
    if (!identifiedTarget) return;

    setProcessing(true);
    setErrorMessage(null);

    const code =
      identifiedTarget.targetType === 'Student'
        ? identifiedTarget.student!.student_id
        : identifiedTarget.staff!.staff_id;

    let party: PickupDropoffParty | undefined = undefined;
    if (identifiedTarget.targetType === 'Student') {
      if (identifiedTarget.actionType === 'check_out') {
        let finalType: 'Parent' | 'Designate' | 'Self' = 'Parent';
        let finalName = partyName.trim();
        let finalRel = partyRelationship.trim();

        if (signOutOption === 'Picked by parent') {
          finalType = 'Parent';
          if (!finalName) finalName = 'Parent / Guardian';
          if (!finalRel) finalRel = 'Parent';
        } else if (signOutOption === 'Picked by Designate') {
          finalType = 'Designate';
          if (!finalName) finalName = 'Authorized Designate';
          if (!finalRel) finalRel = 'Designate';
        } else if (signOutOption === 'Dropped by designate') {
          finalType = 'Designate';
          if (!finalName) finalName = 'Designate';
          if (!finalRel) finalRel = 'Designate';
        } else if (signOutOption === 'Student went home alone') {
          finalType = 'Self';
          finalName = `${identifiedTarget.student?.full_name} (Self / Home Alone)`;
          finalRel = 'Student Alone';
        }

        party = {
          type: finalType,
          signOutOption,
          name: finalName,
          relationship: finalRel || undefined,
          phone: partyPhone.trim() || undefined,
          notes: notes.trim() || undefined,
        };
      } else {
        party = {
          type: partyType,
          name: partyName.trim() || (partyType === 'Parent' ? 'Parent' : 'Authorized Designate'),
          relationship: partyRelationship.trim() || undefined,
          phone: partyPhone.trim() || undefined,
          notes: notes.trim() || undefined,
        };
      }
    }

    let computedEarlyReason: string | undefined = undefined;
    if (isEarlyDeparture) {
      if (earlyReasonOption === 'Enter reason') {
        computedEarlyReason = customEarlyReason.trim() || 'Early departure';
      } else {
        computedEarlyReason = earlyReasonOption;
      }
    }

    const res = await processScan({
      code,
      party,
      earlyDepartureReason: computedEarlyReason,
      intendedAction: identifiedTarget.actionType,
    });

    setProcessing(false);

    if (res.success) {
      // Trigger confetti celebration
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }

      setScanSuccessMessage(res.message);
      setIdentifiedTarget(null);
      setManualCode('');

      // Auto close after brief pause or allow another scan
      setTimeout(() => {
        setScanSuccessMessage(null);
      }, 4000);
    } else {
      setErrorMessage(res.message);
    }
  };

  const appendPinDigit = (digit: string) => {
    if (manualCode.length < 5) {
      const next = manualCode + digit;
      setManualCode(next);
      if (next.length === 3 || next.length === 4) {
        // Check if matches immediately
        const lookup = findTargetByCode(next);
        if (lookup.targetType) {
          handleCodeDetected(next);
        }
      }
    }
  };

  const clearPin = () => {
    setManualCode('');
    setErrorMessage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 my-auto">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex justify-between items-center border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8B1E2F] flex items-center justify-center shadow-sm">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Attendance Scanner Station</h2>
              <p className="text-xs text-slate-400">
                Operator: {currentUser?.full_name} ({currentUser?.role})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* School Schedule Operating Hours Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-[11px] text-amber-900">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-semibold">
              {operationalPolicies.schoolHours.enabled
                ? `Official Hours: Mon–Thu ${operationalPolicies.schoolHours.mondayToThursday.openLabel || '7:00 AM'} – ${operationalPolicies.schoolHours.mondayToThursday.closeLabel || '4:30 PM'} • Fri ${operationalPolicies.schoolHours.friday.openLabel || '7:00 AM'} – ${operationalPolicies.schoolHours.friday.closeLabel || '2:00 PM'}`
                : 'School Hours Policy: Testing Mode (Schedule Unrestricted)'}
            </span>
          </div>
          <span className="font-mono text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
            {getSchoolSchedule(new Date(), operationalPolicies).statusBadgeText}
          </span>
        </div>

        {/* Success Alert Banner */}
        {scanSuccessMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-3.5 flex items-start space-x-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-emerald-900">Success!</p>
              <p className="text-xs text-emerald-800">{scanSuccessMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setScanSuccessMessage(null)}
              className="text-emerald-700 text-xs font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="bg-red-50 border-b border-red-200 p-3.5 flex items-start space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-red-900">Notice</p>
              <p className="text-xs text-red-800">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-700 text-xs font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto">
          {/* Target Confirmation Card (Shown once code is read) */}
          {identifiedTarget ? (
            <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-xl p-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      identifiedTarget.actionType === 'check_in'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {identifiedTarget.actionType === 'check_in' ? (
                      <LogIn className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <LogOut className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        identifiedTarget.actionType === 'check_in'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {identifiedTarget.actionType === 'check_in' ? 'Check-In' : 'Check-Out'}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">
                      {identifiedTarget.targetType === 'Student'
                        ? identifiedTarget.student?.full_name
                        : identifiedTarget.staff?.full_name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {identifiedTarget.targetType === 'Student'
                        ? `${identifiedTarget.student?.grade} • ${identifiedTarget.student?.learning_center_id}`
                        : `${identifiedTarget.staff?.role} • ${identifiedTarget.staff?.learning_center_id || 'Campus'}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIdentifiedTarget(null)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>

              {/* Specific Options for Student Scanning */}
              {identifiedTarget.targetType === 'Student' && (
                <div className="space-y-3.5 text-xs">
                  {/* Boarding Section Information Notice */}
                  {identifiedTarget.student?.enrollment_type === 'Boarding' && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 space-y-1">
                      <div className="flex items-center space-x-1.5 font-bold">
                        <Bed className="w-4 h-4 text-purple-600" />
                        <span>Springs Campus Boarding Section (Mon–Fri)</span>
                      </div>
                      <p className="text-[11px] text-purple-800">
                        {getBoardingScheduleStatus(new Date(), operationalPolicies).message}
                      </p>
                    </div>
                  )}

                  {/* Registered Designated Pickup Quick Selection */}
                  {identifiedTarget.student?.designated_pickups &&
                    identifiedTarget.student.designated_pickups.length > 0 && (
                      <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
                        <div className="font-semibold text-blue-900 text-[11px] flex items-center justify-between">
                          <span>Security Registered Designated Persons:</span>
                          <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.2 rounded font-mono font-bold">
                            {identifiedTarget.student.designated_pickups.length} Registered
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {identifiedTarget.student.designated_pickups.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setPartyType('Designate');
                                setPartyName(p.name);
                                setPartyRelationship(p.relationship);
                                setPartyPhone(p.phone);
                                setNotes(p.notes || '');
                              }}
                              className="px-2 py-1 bg-white border border-blue-300 hover:bg-blue-100 text-blue-900 rounded-lg text-[10px] font-medium transition shadow-2xs text-left"
                            >
                              <strong>{p.name}</strong> ({p.relationship})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Check-In vs Check-Out Specific Controls */}
                  {identifiedTarget.actionType === 'check_in' ? (
                    <>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Dropped Off By:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPartyType('Parent')}
                            className={`py-2 px-3 rounded-lg border text-center font-medium transition ${
                              partyType === 'Parent'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            Parent / Guardian
                          </button>
                          <button
                            type="button"
                            onClick={() => setPartyType('Designate')}
                            className={`py-2 px-3 rounded-lg border text-center font-medium transition ${
                              partyType === 'Designate'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            Authorized Designate
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block font-medium text-slate-600 mb-1">
                            Person Full Name:
                          </label>
                          <input
                            type="text"
                            value={partyName}
                            onChange={(e) => setPartyName(e.target.value)}
                            placeholder="e.g. Maria Garcia"
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-slate-600 mb-1">
                            Relationship:
                          </label>
                          <input
                            type="text"
                            value={partyRelationship}
                            onChange={(e) => setPartyRelationship(e.target.value)}
                            placeholder={partyType === 'Parent' ? 'Mother / Father' : 'e.g. Driver / Aunt'}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Check-Out: Exactly 4 Options */
                    <div className="space-y-3">
                      <div>
                        <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                          Select Sign-Out Option (Required):
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {/* 1) Picked by parent */}
                          <button
                            type="button"
                            onClick={() => {
                              setSignOutOption('Picked by parent');
                              if (!partyName || partyName.includes('Alone') || partyName.includes('Designate')) {
                                setPartyName(identifiedTarget.student?.parent_names?.split('&')[0]?.trim() || 'Parent');
                                setPartyRelationship('Parent');
                              }
                            }}
                            className={`p-2.5 rounded-xl border text-left font-bold text-xs transition cursor-pointer ${
                              signOutOption === 'Picked by parent'
                                ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            1. Picked by parent
                          </button>

                          {/* 2) Picked by Designate */}
                          <button
                            type="button"
                            onClick={() => {
                              setSignOutOption('Picked by Designate');
                              if (!partyName || partyName === 'Parent' || partyName.includes('Alone')) {
                                setPartyName('');
                                setPartyRelationship('Authorized Designate');
                              }
                            }}
                            className={`p-2.5 rounded-xl border text-left font-bold text-xs transition cursor-pointer ${
                              signOutOption === 'Picked by Designate'
                                ? 'bg-blue-50 border-blue-600 text-blue-950 ring-2 ring-blue-500/20 shadow-xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            2. Picked by Designate
                          </button>

                          {/* 3) Dropped by designate */}
                          <button
                            type="button"
                            onClick={() => {
                              setSignOutOption('Dropped by designate');
                              if (!partyName || partyName === 'Parent' || partyName.includes('Alone')) {
                                setPartyName('');
                                setPartyRelationship('Authorized Designate');
                              }
                            }}
                            className={`p-2.5 rounded-xl border text-left font-bold text-xs transition cursor-pointer ${
                              signOutOption === 'Dropped by designate'
                                ? 'bg-amber-50 border-amber-600 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            3. Dropped by designate
                          </button>

                          {/* 4) Student went home alone */}
                          <button
                            type="button"
                            onClick={() => {
                              setSignOutOption('Student went home alone');
                              setPartyName(`${identifiedTarget.student?.full_name} (Self / Home Alone)`);
                              setPartyRelationship('Self');
                            }}
                            className={`p-2.5 rounded-xl border text-left font-bold text-xs transition cursor-pointer ${
                              signOutOption === 'Student went home alone'
                                ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            4. Student went home alone
                          </button>
                        </div>
                      </div>

                      {/* Party details if not home alone */}
                      {signOutOption !== 'Student went home alone' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                          <div>
                            <label className="block font-medium text-slate-600 mb-1 text-[11px]">
                              {signOutOption === 'Picked by parent' ? 'Parent / Guardian Name:' : 'Designate Name:'}
                            </label>
                            <input
                              type="text"
                              value={partyName}
                              onChange={(e) => setPartyName(e.target.value)}
                              placeholder="Name of person..."
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                            />
                          </div>
                          <div>
                            <label className="block font-medium text-slate-600 mb-1 text-[11px]">
                              Relationship:
                            </label>
                            <input
                              type="text"
                              value={partyRelationship}
                              onChange={(e) => setPartyRelationship(e.target.value)}
                              placeholder="e.g. Mother, Driver, Aunt"
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {/* Check Out Before Official Time (4 reasons) */}
                      <div className="border border-amber-200 bg-amber-50/60 p-3 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="earlyDeparture"
                              checked={isEarlyDeparture}
                              onChange={(e) => setIsEarlyDeparture(e.target.checked)}
                              className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                            <label
                              htmlFor="earlyDeparture"
                              className="font-bold text-amber-950 cursor-pointer text-xs"
                            >
                              Check out before official time
                            </label>
                          </div>
                          {isEarlyDeparture && (
                            <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                              Early Departure
                            </span>
                          )}
                        </div>

                        {isEarlyDeparture && (
                          <div className="space-y-1.5 pt-1 border-t border-amber-200">
                            <label className="block font-bold text-amber-900 text-[11px]">
                              Early Check-Out Reason:
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                              {/* 1) Health reasons */}
                              <button
                                type="button"
                                onClick={() => setEarlyReasonOption('Health reasons')}
                                className={`p-2 rounded-lg text-left font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition ${
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
                                className={`p-2 rounded-lg text-left font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition ${
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
                                className={`p-2 rounded-lg text-left font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition ${
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
                                className={`p-2 rounded-lg text-left font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition ${
                                  earlyReasonOption === 'Enter reason'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-white border border-amber-300 text-amber-950 hover:bg-amber-100'
                                }`}
                              >
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">4. Enter reason</span>
                              </button>
                            </div>

                            {earlyReasonOption === 'Enter reason' && (
                              <input
                                type="text"
                                value={customEarlyReason}
                                onChange={(e) => setCustomEarlyReason(e.target.value)}
                                placeholder="Type specific departure reason..."
                                className="w-full mt-1.5 px-3 py-1.5 border border-amber-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900 text-xs font-medium"
                                autoFocus
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Specific Confirmation for Teacher Scanning */}
              {identifiedTarget.targetType === 'Teacher' && (
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                  <p className="text-slate-600">
                    Registering staff campus presence for{' '}
                    <strong className="text-slate-900">
                      {identifiedTarget.staff?.full_name}
                    </strong>
                    .
                  </p>
                  <p className="text-slate-500">
                    Action:{' '}
                    <span className="font-semibold text-blue-600">
                      {identifiedTarget.actionType === 'check_in'
                        ? 'Check In (Arrival)'
                        : 'Check Out (Departure)'}
                    </span>
                  </p>
                </div>
              )}

              {/* Confirmation Action Button */}
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIdentifiedTarget(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleConfirmAction}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                >
                  {processing
                    ? 'Recording...'
                    : `Confirm ${identifiedTarget.actionType === 'check_in' ? 'Check-In' : 'Check-Out'}`}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Scan Mode Toggle Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleModeChange('manual')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                    scanMode === 'manual'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Keyboard className="w-4 h-4 text-blue-600" />
                  <span>Manual PIN Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('camera')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                    scanMode === 'camera'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Camera QR Scanner</span>
                </button>
              </div>

              {/* Camera Scanner View */}
              {scanMode === 'camera' ? (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square max-w-sm mx-auto flex items-center justify-center border-2 border-dashed border-slate-700">
                    <div id="qr-reader" className="w-full h-full"></div>

                    {!cameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-900/90 text-white space-y-3">
                        <Camera className="w-10 h-10 text-slate-400 animate-pulse" />
                        <p className="text-xs text-slate-300">
                          {cameraError || 'Initializing device camera for QR scanning...'}
                        </p>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold"
                        >
                          Retry Camera Access
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-center text-[11px] text-slate-500">
                    Hold a Student ID Card or Staff Badge up to the camera. It will detect QR codes automatically.
                  </p>
                </div>
              ) : (
                /* Manual PIN Entry Pad */
                <div className="space-y-3">
                  <form onSubmit={handleManualSubmit} className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        placeholder="Enter 4-digit Student PIN or 3-digit Staff PIN"
                        className="w-full text-center text-xl tracking-widest font-mono font-bold py-3 px-4 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white text-black placeholder:text-slate-400"
                        maxLength={10}
                        autoFocus
                      />
                    </div>

                    {/* Numeric Keypad for fast touch screen usage */}
                    <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                        <button
                          key={digit}
                          type="button"
                          onClick={() => appendPinDigit(digit)}
                          className="min-h-[48px] py-3.5 bg-slate-100 hover:bg-slate-200 active:bg-blue-100 active:text-blue-700 rounded-xl text-xl font-bold text-slate-800 transition touch-manipulation cursor-pointer active:scale-95"
                        >
                          {digit}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={clearPin}
                        className="min-h-[48px] py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition touch-manipulation cursor-pointer active:scale-95"
                      >
                        CLEAR
                      </button>
                      <button
                        type="button"
                        onClick={() => appendPinDigit('0')}
                        className="min-h-[48px] py-3.5 bg-slate-100 hover:bg-slate-200 active:bg-blue-100 active:text-blue-700 rounded-xl text-xl font-bold text-slate-800 transition touch-manipulation cursor-pointer active:scale-95"
                      >
                        0
                      </button>
                      <button
                        type="button"
                        onClick={() => handleManualSubmit()}
                        className="min-h-[48px] py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition shadow-sm touch-manipulation cursor-pointer active:scale-95"
                      >
                        ENTER
                      </button>
                    </div>
                  </form>

                  {/* Quick-test chips for instant evaluation */}
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
                      Quick Demo Test Codes (Click to scan):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setManualCode('1042');
                          handleCodeDetected('1042');
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded text-[11px] font-medium text-slate-700"
                      >
                        Liam Miller
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setManualCode('2091');
                          handleCodeDetected('2091');
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded text-[11px] font-medium text-slate-700"
                      >
                        Sophia Chen
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setManualCode('3314');
                          handleCodeDetected('3314');
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded text-[11px] font-medium text-slate-700"
                      >
                        Noah Williams
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setManualCode('102');
                          handleCodeDetected('102');
                        }}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded text-[11px] font-medium text-amber-800"
                      >
                        Dr. Evelyn Reed (Staff)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Audit Trail Enabled</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
