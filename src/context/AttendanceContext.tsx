import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  getDocs,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  seedDatabaseIfEmpty,
  INITIAL_STUDENTS,
  INITIAL_CAMPUSES,
  INITIAL_LEARNING_CENTERS,
  forceSyncOfficialData,
  purgeAllDummyDataAndCleanSystem,
} from '../firebase/seed';
import {
  AttendanceLog,
  EditRequest,
  Student,
  Campus,
  LearningCenter,
  PremisesSummary,
  PickupDropoffParty,
  UrgentAlert,
} from '../types';
import { useAuth } from './AuthContext';
import { sound } from '../utils/sound';
import { initFCM, dispatchUrgentEditAlert, dismissUrgentAlert } from '../firebase/messaging';

interface ProcessScanOptions {
  code: string; // QR code or PIN code
  party?: PickupDropoffParty;
  earlyDepartureReason?: string;
  notes?: string;
}

interface AttendanceContextType {
  students: Student[];
  campuses: Campus[];
  learningCenters: LearningCenter[];
  selectedCampus: string; // 'All Campuses' | 'Spring Campus' | 'Hope Campus'
  setSelectedCampus: (campus: string) => void;
  logs: AttendanceLog[];
  todayLogs: AttendanceLog[];
  editRequests: EditRequest[];
  pendingRequestsCount: number;
  urgentAlerts: UrgentAlert[];
  activeUrgentAlerts: UrgentAlert[];
  dismissAlert: (alertId: string) => Promise<void>;
  premisesSummary: PremisesSummary;
  filteredPremisesSummary: PremisesSummary;
  loading: boolean;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  // Core Actions
  findTargetByCode: (code: string) => {
    targetType: 'Student' | 'Teacher' | null;
    student?: Student;
    staff?: any;
    currentLog?: AttendanceLog | null;
    actionType: 'check_in' | 'check_out' | null;
  };
  processScan: (options: ProcessScanOptions) => Promise<{
    success: boolean;
    message: string;
    action?: 'check_in' | 'check_out';
    targetName?: string;
    log?: AttendanceLog;
  }>;
  submitEditRequest: (
    logId: string,
    proposedData: Partial<AttendanceLog>,
    reasonForEdit: string,
    isUrgent?: boolean
  ) => Promise<{ success: boolean; message: string; alertDispatched?: boolean }>;
  directEditLog: (
    logId: string,
    updatedData: Partial<AttendanceLog>,
    reason?: string
  ) => Promise<{ success: boolean; message: string }>;
  deleteLog: (logId: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  reviewEditRequest: (
    requestId: string,
    decision: 'Approved' | 'Rejected',
    reviewComment: string
  ) => Promise<{ success: boolean; message: string }>;
  saveStudent: (student: Omit<Student, 'id'>, id?: string) => Promise<{ success: boolean; message: string }>;
  deleteStudent: (studentId: string) => Promise<{ success: boolean; message: string }>;
  bulkSaveStudents: (
    studentList: Array<Omit<Student, 'id'> & { id?: string }>
  ) => Promise<{ success: boolean; created: number; updated: number; message: string }>;
  saveStaff: (staff: any, id?: string) => Promise<{ success: boolean; message: string }>;
  saveCampus: (campus: Campus) => Promise<{ success: boolean; message: string }>;
  saveLearningCenter: (lc: LearningCenter) => Promise<{ success: boolean; message: string }>;
  forceResetToOfficialRoster: () => Promise<{ success: boolean; message: string }>;
  purgeAllDummyData: () => Promise<{
    success: boolean;
    message: string;
    deletedLogs: number;
    deletedRequests: number;
    deletedAlerts: number;
    studentsCount: number;
    staffCount: number;
  }>;
  systemLogo: string | null;
  updateSystemLogo: (logoDataUrlOrUrl: string | null) => Promise<{ success: boolean; message: string }>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, allStaff, canScanTeachers, canDirectlyEditLogs, canApproveEditRequests } = useAuth();
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [campuses, setCampuses] = useState<Campus[]>(INITIAL_CAMPUSES);
  const [learningCenters, setLearningCenters] = useState<LearningCenter[]>(INITIAL_LEARNING_CENTERS);
  const [selectedCampus, setSelectedCampus] = useState<string>('All Campuses');
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [editRequests, setEditRequests] = useState<EditRequest[]>([]);
  const [urgentAlerts, setUrgentAlerts] = useState<UrgentAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [systemLogo, setSystemLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem('swis_custom_logo') || null;
    } catch {
      return null;
    }
  });

  // Listen to system_settings/branding in Firestore
  useEffect(() => {
    try {
      const brandingDocRef = doc(db, 'system_settings', 'branding');
      const unsub = onSnapshot(
        brandingDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && typeof data.logo_url === 'string') {
              setSystemLogo(data.logo_url);
              try {
                localStorage.setItem('swis_custom_logo', data.logo_url);
              } catch {
                // ignore
              }
            }
          }
        },
        () => {
          // Soft fallback to localStorage
        }
      );
      return () => unsub();
    } catch (err) {
      console.warn('Could not subscribe to branding settings:', err);
    }
  }, []);

  // Initialize DB seeding on start
  useEffect(() => {
    seedDatabaseIfEmpty().finally(() => {
      setLoading(false);
    });
  }, []);

  // Subscribe to campuses with fallback & ensure Spring Campus has no Bethany
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'campuses'),
      (snap) => {
        let list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Campus[];
        list = list.map((c) => {
          if (c.id === 'spring-campus' || c.name === 'Spring Campus') {
            return {
              ...c,
              learning_centers: (c.learning_centers || []).filter((lcName) => lcName !== 'Bethany'),
            };
          }
          return c;
        });
        if (list.length > 0) {
          setCampuses(list);
        }
      },
      () => {
        setCampuses(INITIAL_CAMPUSES);
      }
    );
    return () => unsub();
  }, []);

  // Subscribe to learning centers with fallback & enforce official centers and monitors
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'learning_centers'),
      (snap) => {
        let list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as LearningCenter[];
        // Filter to official learning centers
        const validIds = new Set(INITIAL_LEARNING_CENTERS.map((lc) => lc.id));
        const invalidDocs = snap.docs.filter((d) => !validIds.has(d.id));
        invalidDocs.forEach((d) => {
          deleteDoc(d.ref).catch(() => {});
        });

        list = list.filter((lc) => validIds.has(lc.id));
        list = list.map((lc) => {
          if (lc.name === 'Bethany') {
            return {
              ...lc,
              supervisor_name: 'Mrs. Eunice Mutebe',
              monitor_name: 'Mrs. Joan Nandhego',
            };
          }
          if (lc.name === 'Kayil') return { ...lc, supervisor_name: 'Mrs. Irene Oryem', monitor_name: '' };
          if (lc.name === 'Doxa') return { ...lc, supervisor_name: 'Mr. David Kimbugwe', monitor_name: '' };
          if (lc.name === 'Splendor') return { ...lc, supervisor_name: 'Mr. Arthur Mutebi', monitor_name: '' };
          if (lc.name === 'Antioch') return { ...lc, supervisor_name: 'Mrs. Doreen Mugaga', monitor_name: '' };
          if (lc.name === 'Azusa') return { ...lc, supervisor_name: 'Mr. Shafic Musika', monitor_name: '' };
          return lc;
        });

        if (list.length > 0) {
          setLearningCenters(list);
        } else {
          setLearningCenters(INITIAL_LEARNING_CENTERS);
        }
      },
      () => {
        setLearningCenters(INITIAL_LEARNING_CENTERS);
      }
    );
    return () => unsub();
  }, []);

  // Initialize FCM registration for current staff user
  useEffect(() => {
    if (currentUser?.staff_id) {
      initFCM(currentUser.staff_id).catch(() => {});
    }
  }, [currentUser?.staff_id]);

  // Subscribe to students with error fallback
  useEffect(() => {
    const unsubStudents = onSnapshot(
      collection(db, 'students'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Student[];
        if (list.length > 0) {
          setStudents(list);
        }
      },
      () => {
        // Fallback gracefully without throwing unhandled listener errors
        setStudents((prev) => (prev.length > 0 ? prev : INITIAL_STUDENTS));
      }
    );
    return () => unsubStudents();
  }, []);

  // Subscribe to all attendance logs with error fallback
  useEffect(() => {
    const q = query(collection(db, 'attendance_logs'), orderBy('created_at', 'desc'));
    const unsubLogs = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AttendanceLog[];
        setLogs(list);
      },
      () => {
        // Soft fallback
      }
    );
    return () => unsubLogs();
  }, []);

  // Subscribe to edit requests with error fallback
  useEffect(() => {
    const q = query(collection(db, 'edit_requests'), orderBy('created_at', 'desc'));
    const unsubReqs = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as EditRequest[];
        setEditRequests(list);
      },
      () => {
        // Soft fallback
      }
    );
    return () => unsubReqs();
  }, []);

  // Subscribe to urgent alerts (FCM channel for Principals & Directors) with error fallback
  useEffect(() => {
    const q = query(collection(db, 'urgent_alerts'), orderBy('timestamp', 'desc'), limit(15));
    let initialLoad = true;
    const unsubAlerts = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as UrgentAlert[];
        setUrgentAlerts(list);

        // Play chime if a new urgent alert arrived after initial load for Principals & Directors
        if (!initialLoad && canApproveEditRequests) {
          snap.docChanges().forEach((change) => {
            if (change.type === 'added') {
              sound.playUrgentAlert();
            }
          });
        }
        initialLoad = false;
      },
      () => {
        // Soft fallback
      }
    );
    return () => unsubAlerts();
  }, [canApproveEditRequests]);

  // Compute active (not dismissed) urgent alerts for current user (memoized)
  const activeUrgentAlerts = useMemo(() => {
    if (!currentUser) return [];
    return urgentAlerts.filter((a) => !a.dismissed_by?.includes(currentUser.staff_id));
  }, [urgentAlerts, currentUser]);

  const dismissAlert = useCallback(async (alertId: string) => {
    if (!currentUser) return;
    await dismissUrgentAlert(alertId, currentUser.staff_id);
  }, [currentUser]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter logs for today (memoized)
  const todayLogs = useMemo(() => {
    return logs.filter((l) => l.date === todayStr && l.status !== 'Deleted');
  }, [logs, todayStr]);

  // Fast O(1) today log lookup map by target_id
  const todayLogsMap = useMemo(() => {
    const map = new Map<string, AttendanceLog>();
    for (let i = 0; i < todayLogs.length; i++) {
      map.set(todayLogs[i].target_id, todayLogs[i]);
    }
    return map;
  }, [todayLogs]);

  // Fast O(1) student lookup index by ID, PIN, and QR URL
  const studentIndex = useMemo(() => {
    const byCode = new Map<string, Student>();
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      if (s.student_id) byCode.set(s.student_id.toUpperCase(), s);
      if (s.pin_code) byCode.set(s.pin_code.toUpperCase(), s);
      if (s.qr_code_url) byCode.set(s.qr_code_url.toUpperCase(), s);
    }
    return byCode;
  }, [students]);

  // Fast O(1) staff lookup index by ID, PIN, and QR URL
  const staffIndex = useMemo(() => {
    const byCode = new Map<string, any>();
    for (let i = 0; i < allStaff.length; i++) {
      const st = allStaff[i];
      if (st.staff_id) byCode.set(st.staff_id.toUpperCase(), st);
      if (st.pin_code) byCode.set(st.pin_code.toUpperCase(), st);
      if (st.qr_code_url) byCode.set(st.qr_code_url.toUpperCase(), st);
    }
    return byCode;
  }, [allStaff]);

  const pendingRequestsCount = useMemo(() => {
    return editRequests.filter((r) => r.status === 'Pending').length;
  }, [editRequests]);

  // Calculate live premises summary for today (memoized)
  const premisesSummary: PremisesSummary = useMemo(() => {
    let studentsOnPremises = 0;
    let studentsCheckedOut = 0;
    let studentLogsCount = 0;

    let staffOnPremises = 0;
    let staffCheckedOut = 0;
    let staffLogsCount = 0;

    for (let i = 0; i < todayLogs.length; i++) {
      const log = todayLogs[i];
      if (log.target_type === 'Student') {
        studentLogsCount++;
        if (log.check_out_time) {
          studentsCheckedOut++;
        } else {
          studentsOnPremises++;
        }
      } else if (log.target_type === 'Teacher') {
        staffLogsCount++;
        if (log.check_out_time) {
          staffCheckedOut++;
        } else {
          staffOnPremises++;
        }
      }
    }

    return {
      studentsTotal: students.length,
      studentsOnPremises,
      studentsCheckedOut,
      studentsAbsent: Math.max(0, students.length - studentLogsCount),
      staffTotal: allStaff.length,
      staffOnPremises,
      staffCheckedOut,
      staffAbsent: Math.max(0, allStaff.length - staffLogsCount),
    };
  }, [todayLogs, students.length, allStaff.length]);

  // Calculate premises summary filtered by currently selected campus
  const filteredPremisesSummary: PremisesSummary = useMemo(() => {
    let targetStudents = students;
    let targetStaff = allStaff;
    let targetLogs = todayLogs;

    if (selectedCampus !== 'All Campuses') {
      targetStudents = students.filter((s) => s.campus === selectedCampus);
      targetStaff = allStaff.filter(
        (st) => !st.campus || st.campus === selectedCampus || st.campus === 'All Campuses'
      );
      targetLogs = todayLogs.filter((l) => l.campus === selectedCampus);
    }

    let studentsOnPremises = 0;
    let studentsCheckedOut = 0;
    let studentLogsCount = 0;

    let staffOnPremises = 0;
    let staffCheckedOut = 0;
    let staffLogsCount = 0;

    for (let i = 0; i < targetLogs.length; i++) {
      const log = targetLogs[i];
      if (log.target_type === 'Student') {
        studentLogsCount++;
        if (log.check_out_time) {
          studentsCheckedOut++;
        } else {
          studentsOnPremises++;
        }
      } else if (log.target_type === 'Teacher') {
        staffLogsCount++;
        if (log.check_out_time) {
          staffCheckedOut++;
        } else {
          staffOnPremises++;
        }
      }
    }

    return {
      studentsTotal: targetStudents.length,
      studentsOnPremises,
      studentsCheckedOut,
      studentsAbsent: Math.max(0, targetStudents.length - studentLogsCount),
      staffTotal: targetStaff.length,
      staffOnPremises,
      staffCheckedOut,
      staffAbsent: Math.max(0, targetStaff.length - staffLogsCount),
    };
  }, [students, allStaff, todayLogs, selectedCampus]);

  // Helper to format time nicely (e.g., 08:42 AM)
  const formatTimeNow = useCallback(() => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  // Code resolution helper (ultra-fast O(1) indexed lookup)
  const findTargetByCode = useCallback((rawCode: string) => {
    const clean = rawCode.trim().toUpperCase();

    // 1. Check if it's a student ID or PIN
    const student = studentIndex.get(clean);

    if (student) {
      const activeLog = todayLogsMap.get(student.student_id);
      const actionType: 'check_in' | 'check_out' | null = activeLog
        ? activeLog.check_out_time
          ? null // Already checked out today
          : 'check_out'
        : 'check_in';

      return {
        targetType: 'Student' as const,
        student,
        currentLog: activeLog || null,
        actionType,
      };
    }

    // 2. Check if it's a staff ID or PIN
    const staff = staffIndex.get(clean);

    if (staff) {
      const activeLog = todayLogsMap.get(staff.staff_id);
      const actionType: 'check_in' | 'check_out' | null = activeLog
        ? activeLog.check_out_time
          ? null
          : 'check_out'
        : 'check_in';

      return {
        targetType: 'Teacher' as const,
        staff,
        currentLog: activeLog || null,
        actionType,
      };
    }

    return {
      targetType: null,
      currentLog: null,
      actionType: null,
    };
  }, [studentIndex, staffIndex, todayLogsMap]);

  // Process a scan event
  const processScan = async (options: ProcessScanOptions) => {
    const { code, party, earlyDepartureReason } = options;
    const lookup = findTargetByCode(code);

    if (!lookup.targetType) {
      sound.playError();
      return {
        success: false,
        message: `No matching student or staff member found for code: "${code}".`,
      };
    }

    // Permission enforcement: Teachers cannot scan staff in/out
    if (lookup.targetType === 'Teacher') {
      if (!canScanTeachers) {
        sound.playError();
        return {
          success: false,
          message:
            'Permission Denied: Teachers are not authorized to scan staff members in/out. Please ask an Admin Assistant, Principal, or Director.',
        };
      }

      const staff = lookup.staff;
      const existingLog = lookup.currentLog;

      if (!existingLog) {
        // Check-in staff
        const newLogId = `LOG-${Date.now().toString().slice(-6)}`;
        const newLog: AttendanceLog = {
          id: newLogId,
          log_id: newLogId,
          target_type: 'Teacher',
          target_id: staff.staff_id,
          target_name: staff.full_name,
          campus: staff.campus || 'All Campuses',
          grade_or_role: staff.role,
          classroom: staff.learning_center_id || 'Campus',
          date: todayStr,
          check_in_time: formatTimeNow(),
          check_out_time: null,
          scanned_by: currentUser?.staff_id || 'System',
          scanned_by_name: currentUser?.full_name || 'System Operator',
          status: 'Active',
          created_at: new Date().toISOString(),
        };

        await setDoc(doc(db, 'attendance_logs', newLogId), newLog);
        sound.playSuccessChime();
        return {
          success: true,
          action: 'check_in' as const,
          targetName: staff.full_name,
          message: `${staff.full_name} (${staff.role}) successfully checked IN at ${newLog.check_in_time}.`,
          log: newLog,
        };
      } else if (!existingLog.check_out_time) {
        // Check-out staff
        const checkoutTime = formatTimeNow();
        await updateDoc(doc(db, 'attendance_logs', existingLog.id), {
          check_out_time: checkoutTime,
          updated_at: new Date().toISOString(),
        });
        sound.playSuccessChime();
        return {
          success: true,
          action: 'check_out' as const,
          targetName: staff.full_name,
          message: `${staff.full_name} successfully checked OUT at ${checkoutTime}.`,
        };
      } else {
        sound.playError();
        return {
          success: false,
          message: `${staff.full_name} is already checked out today (${existingLog.check_out_time}).`,
        };
      }
    }

    // Process Student Scan
    if (lookup.targetType === 'Student') {
      const student = lookup.student!;
      const existingLog = lookup.currentLog;

      if (!existingLog) {
        // Student Check-In
        const newLogId = `LOG-${Date.now().toString().slice(-6)}`;
        const checkInParty: PickupDropoffParty = party || {
          type: 'Parent',
          name: (student.parent_names || '').split('&')[0]?.trim() || 'Parent',
        };

        const newLog: AttendanceLog = {
          id: newLogId,
          log_id: newLogId,
          target_type: 'Student',
          target_id: student.student_id,
          target_name: student.full_name,
          campus: student.campus || 'Spring Campus',
          grade_or_role: student.grade || student.learning_center_id,
          classroom: student.learning_center_id,
          date: todayStr,
          check_in_time: formatTimeNow(),
          check_out_time: null,
          scanned_by: currentUser?.staff_id || 'STF-Unknown',
          scanned_by_name: currentUser?.full_name || 'Staff Member',
          pickup_dropoff_party: checkInParty,
          status: 'Active',
          created_at: new Date().toISOString(),
        };

        await setDoc(doc(db, 'attendance_logs', newLogId), newLog);
        sound.playSuccessChime();
        return {
          success: true,
          action: 'check_in' as const,
          targetName: student.full_name,
          message: `${student.full_name} (${student.grade}) checked IN at ${newLog.check_in_time}. Dropped by ${checkInParty.type}: ${checkInParty.name}.`,
          log: newLog,
        };
      } else if (!existingLog.check_out_time) {
        // Student Check-Out
        const checkoutTime = formatTimeNow();
        const pickParty = party || existingLog.pickup_dropoff_party || {
          type: 'Parent',
          name: (student.parent_names || '').split('&')[0]?.trim() || 'Authorized Parent',
        };

        const updatePayload: any = {
          check_out_time: checkoutTime,
          pickup_dropoff_party: pickParty,
          updated_at: new Date().toISOString(),
        };

        if (earlyDepartureReason && earlyDepartureReason.trim() !== '') {
          updatePayload.early_departure_reason = earlyDepartureReason.trim();
        }

        await updateDoc(doc(db, 'attendance_logs', existingLog.id), updatePayload);
        sound.playSuccessChime();
        return {
          success: true,
          action: 'check_out' as const,
          targetName: student.full_name,
          message: `${student.full_name} checked OUT at ${checkoutTime}. Picked up by ${pickParty.type}: ${pickParty.name}.`,
        };
      } else {
        sound.playError();
        return {
          success: false,
          message: `${student.full_name} was already checked out today at ${existingLog.check_out_time}.`,
        };
      }
    }

    return { success: false, message: 'Invalid scan context' };
  };

  // Submit edit request (Teachers, Admin Assistants)
  const submitEditRequest = async (
    logId: string,
    proposedData: Partial<AttendanceLog>,
    reasonForEdit: string,
    isUrgent: boolean = false
  ) => {
    try {
      const log = logs.find((l) => l.id === logId || l.log_id === logId);
      if (!log) {
        return { success: false, message: 'Attendance record not found.' };
      }

      if (!reasonForEdit || reasonForEdit.trim().length < 5) {
        return { success: false, message: 'A clear reason for edit is required (minimum 5 characters).' };
      }

      const reqId = `REQ-${Date.now().toString().slice(-6)}`;
      const newRequest: EditRequest = {
        id: reqId,
        request_id: reqId,
        log_id: log.log_id,
        target_type: log.target_type,
        target_name: log.target_name,
        date: log.date,
        requested_by_id: currentUser?.staff_id || 'STF-Unknown',
        requested_by_name: `${currentUser?.full_name || 'Staff'} (${currentUser?.role || 'Staff'})`,
        original_data: {
          check_in_time: log.check_in_time,
          check_out_time: log.check_out_time,
          pickup_dropoff_party: log.pickup_dropoff_party,
          early_departure_reason: log.early_departure_reason,
          status: log.status,
        },
        proposed_data: {
          check_in_time: proposedData.check_in_time || log.check_in_time,
          check_out_time: proposedData.check_out_time !== undefined ? proposedData.check_out_time : log.check_out_time,
          pickup_dropoff_party: proposedData.pickup_dropoff_party || log.pickup_dropoff_party,
          early_departure_reason: proposedData.early_departure_reason || log.early_departure_reason || '',
          status: 'Edited',
        },
        reason_for_edit: reasonForEdit.trim(),
        is_urgent: isUrgent,
        status: 'Pending',
        created_at: new Date().toISOString(),
      };

      // Mark log as Pending Edit Approval
      await updateDoc(doc(db, 'attendance_logs', log.id), {
        status: 'Pending Edit Approval',
        updated_at: new Date().toISOString(),
      });

      // Save edit request
      await setDoc(doc(db, 'edit_requests', reqId), newRequest);
      sound.playSuccessChime();

      // If marked as Urgent, broadcast Firebase Cloud Messaging alert to Principals & Directors
      if (isUrgent) {
        await dispatchUrgentEditAlert({
          request_id: reqId,
          log_id: log.log_id,
          target_name: log.target_name,
          target_type: log.target_type,
          teacher_name: currentUser?.full_name || 'Teacher',
          teacher_role: currentUser?.role || 'Teacher',
          reason: reasonForEdit.trim(),
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: true,
        alertDispatched: isUrgent,
        message: isUrgent
          ? 'URGENT: Edit request submitted! Firebase Cloud Messaging alert dispatched immediately to Principals & Directors.'
          : 'Attendance edit request submitted successfully! It has been routed to Administrators for review.',
      };
    } catch (err: any) {
      sound.playError();
      return { success: false, message: err?.message || 'Failed to submit edit request.' };
    }
  };

  // Direct edit log (Principals, Directors, ICCE Coordinators)
  const directEditLog = async (
    logId: string,
    updatedData: Partial<AttendanceLog>,
    reason?: string
  ) => {
    if (!canDirectlyEditLogs) {
      return {
        success: false,
        message: 'Unauthorized: Only Principals, Directors, and ICCE Coordinators can directly modify attendance records.',
      };
    }

    try {
      const log = logs.find((l) => l.id === logId || l.log_id === logId);
      if (!log) return { success: false, message: 'Log not found.' };

      const payload: any = {
        ...updatedData,
        status: 'Edited',
        last_edited_by: `${currentUser?.full_name} (${currentUser?.role})`,
        updated_at: new Date().toISOString(),
      };

      if (reason) {
        payload.audit_note = reason;
      }

      await updateDoc(doc(db, 'attendance_logs', log.id), payload);
      sound.playSuccessChime();
      return { success: true, message: 'Attendance record updated directly.' };
    } catch (err: any) {
      sound.playError();
      return { success: false, message: err?.message || 'Failed to update record.' };
    }
  };

  // Direct delete log (Principals, Directors, ICCE Coordinators)
  const deleteLog = async (logId: string, reason?: string) => {
    if (!canDirectlyEditLogs) {
      return {
        success: false,
        message: 'Unauthorized: Only Principals, Directors, and ICCE Coordinators can delete attendance records.',
      };
    }

    try {
      const log = logs.find((l) => l.id === logId || l.log_id === logId);
      if (!log) return { success: false, message: 'Log not found.' };

      await updateDoc(doc(db, 'attendance_logs', log.id), {
        status: 'Deleted',
        deleted_by: `${currentUser?.full_name} (${currentUser?.role})`,
        deletion_reason: reason || 'Deleted by Administrator',
        updated_at: new Date().toISOString(),
      });
      sound.playSuccessChime();
      return { success: true, message: 'Attendance record marked as deleted in audit trail.' };
    } catch (err: any) {
      sound.playError();
      return { success: false, message: err?.message || 'Failed to delete record.' };
    }
  };

  // Review Edit Request (Approve or Reject with mandatory comment)
  const reviewEditRequest = async (
    requestId: string,
    decision: 'Approved' | 'Rejected',
    reviewComment: string
  ) => {
    if (!canApproveEditRequests) {
      return {
        success: false,
        message: 'Unauthorized: Only Principals, Directors, and ICCE Coordinators can review attendance edit requests.',
      };
    }

    if (!reviewComment || reviewComment.trim().length < 3) {
      return {
        success: false,
        message: 'A mandatory administrator review comment or justification is required.',
      };
    }

    try {
      const req = editRequests.find((r) => r.id === requestId || r.request_id === requestId);
      if (!req) return { success: false, message: 'Request not found.' };

      const log = logs.find((l) => l.log_id === req.log_id || l.id === req.log_id);

      if (decision === 'Approved') {
        // Apply proposed changes to log
        if (log) {
          const updatedLogPayload: any = {
            ...req.proposed_data,
            status: 'Edited',
            last_edited_by: `Approved by ${currentUser?.full_name} (${currentUser?.role})`,
            updated_at: new Date().toISOString(),
          };
          await updateDoc(doc(db, 'attendance_logs', log.id), updatedLogPayload);
        }

        // Update request document
        await updateDoc(doc(db, 'edit_requests', req.id), {
          status: 'Approved',
          reviewed_by: `${currentUser?.full_name} (${currentUser?.role})`,
          review_comment: reviewComment.trim(),
          reviewed_at: new Date().toISOString(),
        });

        sound.playSuccessChime();
        return {
          success: true,
          message: `Edit Request ${req.request_id} has been APPROVED. Attendance record updated.`,
        };
      } else {
        // Revert log status back to Active (or whatever it was)
        if (log) {
          await updateDoc(doc(db, 'attendance_logs', log.id), {
            status: req.original_data?.status || 'Active',
            updated_at: new Date().toISOString(),
          });
        }

        // Update request document
        await updateDoc(doc(db, 'edit_requests', req.id), {
          status: 'Rejected',
          reviewed_by: `${currentUser?.full_name} (${currentUser?.role})`,
          review_comment: reviewComment.trim(),
          reviewed_at: new Date().toISOString(),
        });

        sound.playSuccessChime();
        return {
          success: true,
          message: `Edit Request ${req.request_id} has been REJECTED with notes recorded.`,
        };
      }
    } catch (err: any) {
      sound.playError();
      return { success: false, message: err?.message || 'Error processing review.' };
    }
  };

  // Add / edit student
  const saveStudent = async (studentData: Omit<Student, 'id'>, id?: string) => {
    try {
      const studentId = id || studentData.student_id;
      // Enforce: Bethany Learning center has a supervisor and not any other learning center
      const supervisor_name =
        studentData.learning_center_id === 'Bethany' ? 'Mrs. Eunice Mutebe' : '';

      const updatedPayload: Student = {
        ...studentData,
        id: studentId,
        student_id: studentId,
        supervisor_name,
        updated_at: new Date().toISOString(),
      };

      const ref = doc(db, 'students', studentId);
      await setDoc(ref, updatedPayload, { merge: true });

      // Immediate local state update for instant UI feedback
      setStudents((prev) => {
        const index = prev.findIndex((s) => s.student_id === studentId);
        if (index >= 0) {
          const next = [...prev];
          next[index] = { ...next[index], ...updatedPayload };
          return next;
        }
        return [updatedPayload, ...prev];
      });

      sound.playSuccessChime();
      return { success: true, message: `Student ${studentData.full_name} saved successfully!` };
    } catch (err: any) {
      // Local fallback if offline
      const studentId = id || studentData.student_id;
      const supervisor_name =
        studentData.learning_center_id === 'Bethany' ? 'Mrs. Eunice Mutebe' : '';
      const updatedPayload: Student = {
        ...studentData,
        id: studentId,
        student_id: studentId,
        supervisor_name,
        updated_at: new Date().toISOString(),
      };
      setStudents((prev) => {
        const index = prev.findIndex((s) => s.student_id === studentId);
        if (index >= 0) {
          const next = [...prev];
          next[index] = { ...next[index], ...updatedPayload };
          return next;
        }
        return [updatedPayload, ...prev];
      });
      sound.playSuccessChime();
      return { success: true, message: `Student ${studentData.full_name} saved to local roster.` };
    }
  };

  // Delete student
  const deleteStudent = async (studentId: string) => {
    try {
      const ref = doc(db, 'students', studentId);
      await deleteDoc(ref);
      setStudents((prev) => prev.filter((s) => s.student_id !== studentId && s.id !== studentId));
      sound.playSuccessChime();
      return { success: true, message: `Student record deleted successfully.` };
    } catch (err: any) {
      setStudents((prev) => prev.filter((s) => s.student_id !== studentId && s.id !== studentId));
      return { success: true, message: `Student removed from active roster.` };
    }
  };

  // Bulk add / update students (for semester / end-of-year transitions)
  const bulkSaveStudents = async (
    studentList: Array<Omit<Student, 'id'> & { id?: string }>
  ) => {
    try {
      if (!studentList || studentList.length === 0) {
        return { success: false, created: 0, updated: 0, message: 'No student records provided.' };
      }

      const existingIds = new Set(students.map((s) => s.student_id));
      let createdCount = 0;
      let updatedCount = 0;

      // Firestore batches support up to 500 operations per batch
      const batchSize = 450;
      for (let i = 0; i < studentList.length; i += batchSize) {
        const slice = studentList.slice(i, i + batchSize);
        const batch = writeBatch(db);

        slice.forEach((item) => {
          const studentId = item.id || item.student_id;
          if (existingIds.has(studentId)) {
            updatedCount++;
          } else {
            createdCount++;
          }
          const ref = doc(db, 'students', studentId);
          batch.set(
            ref,
            {
              ...item,
              id: studentId,
              student_id: studentId,
              updated_at: new Date().toISOString(),
            },
            { merge: true }
          );
        });

        await batch.commit();
      }

      sound.playSuccessChime();
      return {
        success: true,
        created: createdCount,
        updated: updatedCount,
        message: `Successfully processed ${studentList.length} student records (${createdCount} added, ${updatedCount} updated).`,
      };
    } catch (err: any) {
      sound.playError();
      return {
        success: false,
        created: 0,
        updated: 0,
        message: err?.message || 'Failed to bulk import students.',
      };
    }
  };

  // Add / edit staff
  const saveStaff = async (staffData: any, id?: string) => {
    try {
      const staffId = id || staffData.staff_id;
      const ref = doc(db, 'staff', staffId);
      await setDoc(ref, { ...staffData, id: staffId }, { merge: true });
      sound.playSuccessChime();
      return { success: true, message: `Staff member ${staffData.full_name} saved successfully!` };
    } catch (err: any) {
      sound.playError();
      return { success: false, message: err?.message || 'Failed to save staff.' };
    }
  };

  // Add / edit Campus
  const saveCampus = async (campusData: Campus) => {
    try {
      const ref = doc(db, 'campuses', campusData.id);
      await setDoc(ref, campusData, { merge: true });
      sound.playSuccessChime();
      return { success: true, message: `Campus ${campusData.name} updated successfully!` };
    } catch (err: any) {
      sound.playError();
      return { success: false, message: err?.message || 'Failed to save campus.' };
    }
  };

  // Add / edit Learning Center
  const saveLearningCenter = async (lcData: LearningCenter) => {
    try {
      const ref = doc(db, 'learning_centers', lcData.id);
      await setDoc(ref, lcData, { merge: true });
      sound.playSuccessChime();
      return { success: true, message: `Learning Center ${lcData.name} saved successfully!` };
    } catch (err: any) {
      sound.playError();
      return { success: false, message: err?.message || 'Failed to save learning center.' };
    }
  };

  // Purge all AI dummy data and clean system
  const purgeAllDummyData = async () => {
    try {
      setLoading(true);
      const res = await purgeAllDummyDataAndCleanSystem();
      if (res.success) {
        setLogs([]);
        setEditRequests([]);
        setUrgentAlerts([]);
        setStudents(INITIAL_STUDENTS);
        setCampuses(INITIAL_CAMPUSES);
        setLearningCenters(INITIAL_LEARNING_CENTERS);
        sound.playSuccessChime();
        return res;
      } else {
        sound.playError();
        return res;
      }
    } catch (err: any) {
      sound.playError();
      return {
        success: false,
        message: err?.message || 'Purge failed',
        deletedLogs: 0,
        deletedRequests: 0,
        deletedAlerts: 0,
        studentsCount: 0,
        staffCount: 0,
      };
    } finally {
      setLoading(false);
    }
  };

  // Re-sync / Purge dummy data and restore official roster
  const forceResetToOfficialRoster = async () => {
    return purgeAllDummyData();
  };

  // Upload or update official school branding logo
  const updateSystemLogo = async (logoDataUrlOrUrl: string | null): Promise<{ success: boolean; message: string }> => {
    try {
      setSystemLogo(logoDataUrlOrUrl);
      if (logoDataUrlOrUrl) {
        try {
          localStorage.setItem('swis_custom_logo', logoDataUrlOrUrl);
        } catch (e) {
          console.warn('LocalStorage limit reached or disabled:', e);
        }
        await setDoc(
          doc(db, 'system_settings', 'branding'),
          {
            logo_url: logoDataUrlOrUrl,
            updated_at: new Date().toISOString(),
            updated_by: currentUser?.full_name || 'Administrator',
          },
          { merge: true }
        );
      } else {
        try {
          localStorage.removeItem('swis_custom_logo');
        } catch {
          // ignore
        }
        await deleteDoc(doc(db, 'system_settings', 'branding')).catch(() => {});
      }
      sound.playSuccessChime();
      return {
        success: true,
        message: logoDataUrlOrUrl
          ? 'Official school logo updated successfully! New branding is now active across all screens, badges, and ID cards.'
          : 'School logo reset to default system branding.',
      };
    } catch (err: any) {
      console.warn('Error saving branding to Firestore:', err);
      sound.playSuccessChime();
      return {
        success: true,
        message: 'School logo updated successfully for current session and browser cache.',
      };
    }
  };

  const attendanceContextValue = useMemo<AttendanceContextType>(
    () => ({
      students,
      campuses,
      learningCenters,
      selectedCampus,
      setSelectedCampus,
      logs,
      todayLogs,
      editRequests,
      pendingRequestsCount,
      urgentAlerts,
      activeUrgentAlerts,
      dismissAlert,
      premisesSummary,
      filteredPremisesSummary,
      loading,
      selectedDate,
      setSelectedDate,
      findTargetByCode,
      processScan,
      submitEditRequest,
      directEditLog,
      deleteLog,
      reviewEditRequest,
      saveStudent,
      deleteStudent,
      bulkSaveStudents,
      saveStaff,
      saveCampus,
      saveLearningCenter,
      forceResetToOfficialRoster,
      purgeAllDummyData,
      systemLogo,
      updateSystemLogo,
    }),
    [
      students,
      campuses,
      learningCenters,
      selectedCampus,
      logs,
      todayLogs,
      editRequests,
      pendingRequestsCount,
      urgentAlerts,
      activeUrgentAlerts,
      dismissAlert,
      premisesSummary,
      filteredPremisesSummary,
      loading,
      selectedDate,
      findTargetByCode,
      processScan,
      submitEditRequest,
      directEditLog,
      deleteLog,
      reviewEditRequest,
      saveStudent,
      deleteStudent,
      bulkSaveStudents,
      saveStaff,
      saveCampus,
      saveLearningCenter,
      forceResetToOfficialRoster,
      purgeAllDummyData,
      systemLogo,
    ]
  );

  return (
    <AttendanceContext.Provider value={attendanceContextValue}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
