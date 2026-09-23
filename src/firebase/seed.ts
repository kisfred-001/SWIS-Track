import { collection, getDocs, setDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from './config';
import { Staff, Student, AttendanceLog, EditRequest } from '../types';

export const INITIAL_STAFF: Staff[] = [
  {
    staff_id: 'STF-101',
    pin_code: '101',
    full_name: 'Eleanor Vance',
    role: 'ICCE Coordinator',
    learning_center_id: 'All Centers',
    email: 'eleanor.vance@school.edu',
    phone: '(555) 234-5601',
    qr_code_url: 'STF-101',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-102',
    pin_code: '102',
    full_name: 'Dr. Marcus Reed',
    role: 'Principal',
    learning_center_id: 'Main Administration',
    email: 'marcus.reed@school.edu',
    phone: '(555) 234-5602',
    qr_code_url: 'STF-102',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-103',
    pin_code: '103',
    full_name: 'Sarah Jenkins',
    role: 'Director',
    learning_center_id: 'Executive Office',
    email: 'sarah.jenkins@school.edu',
    phone: '(555) 234-5603',
    qr_code_url: 'STF-103',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-201',
    pin_code: '201',
    full_name: 'Amanda Cruz',
    role: 'Admin Assistant',
    learning_center_id: 'Front Desk / Reception',
    email: 'amanda.cruz@school.edu',
    phone: '(555) 234-5604',
    qr_code_url: 'STF-201',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-301',
    pin_code: '301',
    full_name: 'David Miller',
    role: 'Teacher',
    learning_center_id: 'Learning Center Alpha',
    email: 'david.miller@school.edu',
    phone: '(555) 234-5605',
    qr_code_url: 'STF-301',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-302',
    pin_code: '302',
    full_name: 'Rachel Green',
    role: 'Teacher',
    learning_center_id: 'Learning Center Beta',
    email: 'rachel.green@school.edu',
    phone: '(555) 234-5606',
    qr_code_url: 'STF-302',
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_STUDENTS: Student[] = [
  {
    student_id: 'STU-1001',
    pin_code: '1042',
    full_name: 'Liam Miller',
    grade: 'Grade 4',
    learning_center_id: 'Learning Center Alpha',
    supervisor_name: 'David Miller',
    monitor_name: 'Amanda Cruz',
    parent_names: 'Robert & Clara Miller',
    emergency_contact: '(555) 301-4491',
    qr_code_url: 'STU-1001',
    created_at: new Date().toISOString(),
  },
  {
    student_id: 'STU-1002',
    pin_code: '2091',
    full_name: 'Sophia Chen',
    grade: 'Grade 4',
    learning_center_id: 'Learning Center Alpha',
    supervisor_name: 'David Miller',
    monitor_name: 'Amanda Cruz',
    parent_names: 'Wei & Mei Chen',
    emergency_contact: '(555) 492-3321',
    qr_code_url: 'STU-1002',
    created_at: new Date().toISOString(),
  },
  {
    student_id: 'STU-1003',
    pin_code: '3314',
    full_name: 'Noah Williams',
    grade: 'Grade 5',
    learning_center_id: 'Learning Center Beta',
    supervisor_name: 'Rachel Green',
    monitor_name: 'Amanda Cruz',
    parent_names: 'James Williams',
    emergency_contact: '(555) 819-2041',
    qr_code_url: 'STU-1003',
    created_at: new Date().toISOString(),
  },
  {
    student_id: 'STU-1004',
    pin_code: '4185',
    full_name: 'Emma Garcia',
    grade: 'Grade 5',
    learning_center_id: 'Learning Center Beta',
    supervisor_name: 'Rachel Green',
    monitor_name: 'Amanda Cruz',
    parent_names: 'Maria & Carlos Garcia',
    emergency_contact: '(555) 723-9912',
    qr_code_url: 'STU-1004',
    created_at: new Date().toISOString(),
  },
  {
    student_id: 'STU-1005',
    pin_code: '5293',
    full_name: 'Oliver Brown',
    grade: 'Grade 3',
    learning_center_id: 'Learning Center Alpha',
    supervisor_name: 'David Miller',
    monitor_name: 'Amanda Cruz',
    parent_names: 'Arthur & Helen Brown',
    emergency_contact: '(555) 612-4409',
    qr_code_url: 'STU-1005',
    created_at: new Date().toISOString(),
  },
  {
    student_id: 'STU-1006',
    pin_code: '6032',
    full_name: 'Ava Martinez',
    grade: 'Grade 6',
    learning_center_id: 'Learning Center Gamma',
    supervisor_name: 'Sarah Jenkins',
    monitor_name: 'Amanda Cruz',
    parent_names: 'Lucia Martinez',
    emergency_contact: '(555) 902-8812',
    qr_code_url: 'STU-1006',
    created_at: new Date().toISOString(),
  },
  {
    student_id: 'STU-1007',
    pin_code: '7124',
    full_name: 'Lucas Davis',
    grade: 'Grade 4',
    learning_center_id: 'Learning Center Alpha',
    supervisor_name: 'David Miller',
    monitor_name: 'Amanda Cruz',
    parent_names: 'Patricia & Daniel Davis',
    emergency_contact: '(555) 812-7634',
    qr_code_url: 'STU-1007',
    created_at: new Date().toISOString(),
  },
  {
    student_id: 'STU-1008',
    pin_code: '8459',
    full_name: 'Mia Taylor',
    grade: 'Grade 5',
    learning_center_id: 'Learning Center Beta',
    supervisor_name: 'Rachel Green',
    monitor_name: 'Amanda Cruz',
    parent_names: 'Grace Taylor',
    emergency_contact: '(555) 345-6712',
    qr_code_url: 'STU-1008',
    created_at: new Date().toISOString(),
  },
];

export async function seedDatabaseIfEmpty(): Promise<boolean> {
  try {
    const staffSnapshot = await getDocs(collection(db, 'staff'));
    if (!staffSnapshot.empty) {
      return false; // already seeded
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const batch = writeBatch(db);

    // Seed Staff
    INITIAL_STAFF.forEach((staff) => {
      const staffRef = doc(db, 'staff', staff.staff_id);
      batch.set(staffRef, staff);
    });

    // Seed Students
    INITIAL_STUDENTS.forEach((student) => {
      const studentRef = doc(db, 'students', student.student_id);
      batch.set(studentRef, student);
    });

    // Seed Initial Attendance Logs for Today
    const initialLogs: AttendanceLog[] = [
      {
        id: 'LOG-101',
        log_id: 'LOG-101',
        target_type: 'Student',
        target_id: 'STU-1001',
        target_name: 'Liam Miller',
        grade_or_role: 'Grade 4',
        classroom: 'Learning Center Alpha',
        date: todayStr,
        check_in_time: '08:05 AM',
        check_out_time: null,
        scanned_by: 'STF-301',
        scanned_by_name: 'David Miller',
        pickup_dropoff_party: {
          type: 'Parent',
          name: 'Robert Miller',
          relationship: 'Father',
          phone: '(555) 301-4491',
        },
        status: 'Active',
        created_at: new Date().toISOString(),
      },
      {
        id: 'LOG-102',
        log_id: 'LOG-102',
        target_type: 'Student',
        target_id: 'STU-1002',
        target_name: 'Sophia Chen',
        grade_or_role: 'Grade 4',
        classroom: 'Learning Center Alpha',
        date: todayStr,
        check_in_time: '08:12 AM',
        check_out_time: null,
        scanned_by: 'STF-301',
        scanned_by_name: 'David Miller',
        pickup_dropoff_party: {
          type: 'Parent',
          name: 'Mei Chen',
          relationship: 'Mother',
          phone: '(555) 492-3321',
        },
        status: 'Active',
        created_at: new Date().toISOString(),
      },
      {
        id: 'LOG-103',
        log_id: 'LOG-103',
        target_type: 'Student',
        target_id: 'STU-1003',
        target_name: 'Noah Williams',
        grade_or_role: 'Grade 5',
        classroom: 'Learning Center Beta',
        date: todayStr,
        check_in_time: '08:18 AM',
        check_out_time: null,
        scanned_by: 'STF-201',
        scanned_by_name: 'Amanda Cruz',
        pickup_dropoff_party: {
          type: 'Designate',
          name: 'Evelyn Carter',
          relationship: 'Aunt / Authorized Designate',
          phone: '(555) 819-2041',
          notes: 'Signed designate pickup form on file',
        },
        status: 'Active',
        created_at: new Date().toISOString(),
      },
      {
        id: 'LOG-104',
        log_id: 'LOG-104',
        target_type: 'Student',
        target_id: 'STU-1004',
        target_name: 'Emma Garcia',
        grade_or_role: 'Grade 5',
        classroom: 'Learning Center Beta',
        date: todayStr,
        check_in_time: '08:10 AM',
        check_out_time: '01:15 PM',
        scanned_by: 'STF-302',
        scanned_by_name: 'Rachel Green',
        pickup_dropoff_party: {
          type: 'Parent',
          name: 'Maria Garcia',
          relationship: 'Mother',
          phone: '(555) 723-9912',
          notes: 'Picked up early for medical appointment',
        },
        early_departure_reason: 'Dentist appointment at 2:00 PM (Approved note submitted)',
        status: 'Active',
        created_at: new Date().toISOString(),
      },
      {
        id: 'LOG-105',
        log_id: 'LOG-105',
        target_type: 'Teacher',
        target_id: 'STF-102',
        target_name: 'Dr. Marcus Reed',
        grade_or_role: 'Principal',
        classroom: 'Main Administration',
        date: todayStr,
        check_in_time: '07:35 AM',
        check_out_time: null,
        scanned_by: 'STF-201',
        scanned_by_name: 'Amanda Cruz',
        status: 'Active',
        created_at: new Date().toISOString(),
      },
      {
        id: 'LOG-106',
        log_id: 'LOG-106',
        target_type: 'Teacher',
        target_id: 'STF-301',
        target_name: 'David Miller',
        grade_or_role: 'Teacher',
        classroom: 'Learning Center Alpha',
        date: todayStr,
        check_in_time: '07:45 AM',
        check_out_time: null,
        scanned_by: 'STF-201',
        scanned_by_name: 'Amanda Cruz',
        status: 'Active',
        created_at: new Date().toISOString(),
      },
      {
        id: 'LOG-107',
        log_id: 'LOG-107',
        target_type: 'Teacher',
        target_id: 'STF-302',
        target_name: 'Rachel Green',
        grade_or_role: 'Teacher',
        classroom: 'Learning Center Beta',
        date: todayStr,
        check_in_time: '07:55 AM',
        check_out_time: null,
        scanned_by: 'STF-201',
        scanned_by_name: 'Amanda Cruz',
        status: 'Active',
        created_at: new Date().toISOString(),
      },
      {
        id: 'LOG-108',
        log_id: 'LOG-108',
        target_type: 'Student',
        target_id: 'STU-1007',
        target_name: 'Lucas Davis',
        grade_or_role: 'Grade 4',
        classroom: 'Learning Center Alpha',
        date: todayStr,
        check_in_time: '09:25 AM',
        check_out_time: null,
        scanned_by: 'STF-301',
        scanned_by_name: 'David Miller',
        pickup_dropoff_party: {
          type: 'Parent',
          name: 'Daniel Davis',
          relationship: 'Father',
        },
        status: 'Pending Edit Approval',
        created_at: new Date().toISOString(),
      },
    ];

    initialLogs.forEach((log) => {
      const logRef = doc(db, 'attendance_logs', log.log_id);
      batch.set(logRef, log);
    });

    // Seed Sample Edit Request for LOG-108
    const sampleEditRequest: EditRequest = {
      id: 'REQ-501',
      request_id: 'REQ-501',
      log_id: 'LOG-108',
      target_type: 'Student',
      target_name: 'Lucas Davis',
      date: todayStr,
      requested_by_id: 'STF-301',
      requested_by_name: 'David Miller (Teacher)',
      original_data: {
        check_in_time: '09:25 AM',
        check_out_time: null,
        pickup_dropoff_party: {
          type: 'Parent',
          name: 'Daniel Davis',
          relationship: 'Father',
        },
        early_departure_reason: '',
        status: 'Active',
      },
      proposed_data: {
        check_in_time: '08:15 AM',
        check_out_time: null,
        pickup_dropoff_party: {
          type: 'Parent',
          name: 'Daniel Davis',
          relationship: 'Father',
          notes: 'Arrived at 8:15 AM on Bus 4; gate scanner was syncing',
        },
        early_departure_reason: '',
        status: 'Edited',
      },
      reason_for_edit: 'Bus 4 arrived on time at 8:15 AM. Handheld gate scanner experienced a network sync queue delay and stamped 9:25 AM. Verified with bus roster.',
      status: 'Pending',
      created_at: new Date().toISOString(),
    };

    const reqRef = doc(db, 'edit_requests', sampleEditRequest.request_id);
    batch.set(reqRef, sampleEditRequest);

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
}
