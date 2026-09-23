import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  where,
  getDocs,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { seedDatabaseIfEmpty } from '../firebase/seed';
import {
  AttendanceLog,
  EditRequest,
  Student,
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
  logs: AttendanceLog[];
  todayLogs: AttendanceLog[];
  editRequests: EditRequest[];
  pendingRequestsCount: number;
  urgentAlerts: UrgentAlert[];
  activeUrgentAlerts: UrgentAlert[];
  dismissAlert: (alertId: string) => Promise<void>;
  premisesSummary: PremisesSummary;
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
  bulkSaveStudents: (
    studentList: Array<Omit<Student, 'id'> & { id?: string }>
  ) => Promise<{ success: boolean; created: number; updated: number; message: string }>;
  saveStaff: (staff: any, id?: string) => Promise<{ success: boolean; message: string }>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, allStaff, canScanTeachers, canDirectlyEditLogs, canApproveEditRequests } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [editRequests, setEditRequests] = useState<EditRequest[]>([]);
  const [urgentAlerts, setUrgentAlerts] = useState<UrgentAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Initialize DB seeding on start
  useEffect(() => {
    seedDatabaseIfEmpty().finally(() => {
      setLoading(false);
    });
  }, []);

  // Initialize FCM registration for current staff user
  useEffect(() => {
    if (currentUser?.staff_id) {
      initFCM(currentUser.staff_id).catch(() => {});
    }
  }, [currentUser?.staff_id]);

  // Subscribe to students
  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Student[];
      setStudents(list);
    });
    return () => unsubStudents();
  }, []);

  // Subscribe to all attendance logs
  useEffect(() => {
    const q = query(collection(db, 'attendance_logs'), orderBy('created_at', 'desc'));
    const unsubLogs = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AttendanceLog[];
      setLogs(list);
    });
    return () => unsubLogs();
  }, []);

  // Subscribe to edit requests
  useEffect(() => {
    const q = query(collection(db, 'edit_requests'), orderBy('created_at', 'desc'));
    const unsubReqs = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as EditRequest[];
      setEditRequests(list);
    });
    return () => unsubReqs();
  }, []);

  // Subscribe to urgent alerts (FCM channel for Principals & Directors)
  useEffect(() => {
    const q = query(collection(db, 'urgent_alerts'), orderBy('timestamp', 'desc'), limit(15));
    let initialLoad = true;
    const unsubAlerts = onSnapshot(q, (snap) => {
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
    });
    return () => unsubAlerts();
  }, [canApproveEditRequests]);

  // Compute active (not dismissed) urgent alerts for current user
  const activeUrgentAlerts = urgentAlerts.filter((a) => {
    if (!currentUser) return false;
    return !a.dismissed_by?.includes(currentUser.staff_id);
  });

  const dismissAlert = async (alertId: string) => {
    if (!currentUser) return;
    await dismissUrgentAlert(alertId, currentUser.staff_id);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter((l) => l.date === todayStr && l.status !== 'Deleted');

  const pendingRequestsCount = editRequests.filter((r) => r.status === 'Pending').length;

  // Calculate live premises summary for today
  const studentLogsToday = todayLogs.filter((l) => l.target_type === 'Student');
  const studentsOnPremises = studentLogsToday.filter((l) => !l.check_out_time).length;
  const studentsCheckedOut = studentLogsToday.filter((l) => !!l.check_out_time).length;
  const studentsAbsent = Math.max(0, students.length - studentLogsToday.length);

  const teacherLogsToday = todayLogs.filter((l) => l.target_type === 'Teacher');
  const staffOnPremises = teacherLogsToday.filter((l) => !l.check_out_time).length;
  const staffCheckedOut = teacherLogsToday.filter((l) => !!l.check_out_time).length;
  const staffAbsent = Math.max(0, allStaff.length - teacherLogsToday.length);

  const premisesSummary: PremisesSummary = {
    studentsTotal: students.length,
    studentsOnPremises,
    studentsCheckedOut,
    studentsAbsent,
    staffTotal: allStaff.length,
    staffOnPremises,
    staffCheckedOut,
    staffAbsent,
  };

  // Helper to format time nicely (e.g., 08:42 AM)
  const formatTimeNow = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Code resolution helper
  const findTargetByCode = (rawCode: string) => {
    const clean = rawCode.trim().toUpperCase();

    // 1. Check if it's a student ID or PIN
    const student = students.find(
      (s) =>
        s.student_id.toUpperCase() === clean ||
        s.pin_code === clean ||
        s.qr_code_url?.toUpperCase() === clean
    );

    if (student) {
      const activeLog = todayLogs.find(
        (l) => l.target_id === student.student_id && l.date === todayStr
      );
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
    const staff = allStaff.find(
      (s) =>
        s.staff_id.toUpperCase() === clean ||
        s.pin_code === clean ||
        s.qr_code_url?.toUpperCase() === clean
    );

    if (staff) {
      const activeLog = todayLogs.find(
        (l) => l.target_id === staff.staff_id && l.date === todayStr
      );
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
  };

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
          name: student.parent_names.split('&')[0].trim() || 'Parent',
        };

        const newLog: AttendanceLog = {
          id: newLogId,
          log_id: newLogId,
          target_type: 'Student',
          target_id: student.student_id,
          target_name: student.full_name,
          grade_or_role: student.grade,
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
          name: student.parent_names.split('&')[0].trim() || 'Authorized Parent',
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
      console.error('Error submitting edit request:', err);
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
      const ref = doc(db, 'students', studentId);
      await setDoc(ref, { ...studentData, id: studentId }, { merge: true });
      sound.playSuccessChime();
      return { success: true, message: `Student ${studentData.full_name} saved successfully!` };
    } catch (err: any) {
      sound.playError();
      return { success: false, message: err?.message || 'Failed to save student.' };
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
      console.error('Bulk save error:', err);
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

  return (
    <AttendanceContext.Provider
      value={{
        students,
        logs,
        todayLogs,
        editRequests,
        pendingRequestsCount,
        urgentAlerts,
        activeUrgentAlerts,
        dismissAlert,
        premisesSummary,
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
        bulkSaveStudents,
        saveStaff,
      }}
    >
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
