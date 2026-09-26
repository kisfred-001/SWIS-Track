export type UserRole =
  | 'ICCE Coordinator'
  | 'Principal'
  | 'Director'
  | 'Administrator'
  | 'Administrative Assistant'
  | 'Supervisor'
  | 'Monitor'
  | 'Support Staff';

export interface Campus {
  id: string; // 'spring-campus' | 'hope-campus'
  name: string; // 'Spring Campus' | 'Hope Campus'
  code: string; // 'SPRING' | 'HOPE'
  location: string;
  phone: string;
  email: string;
  lead_administrator: string;
  learning_centers: string[];
  capacity?: number;
  total_capacity?: number;
  opening_time?: string;
  closing_time?: string;
  created_at?: string;
}

export interface LearningCenter {
  id: string;
  name: string;
  campus: string; // 'Spring Campus' | 'Hope Campus'
  supervisor_name: string; // Assigned supervisor for this center
  monitor_name?: string; // Optional monitor (Bethany Learning Center has Mrs. Joan Nandhego)
  room_number?: string;
  capacity?: number;
  description?: string;
}

export interface DesignatedPickupPerson {
  id: string;
  name: string;
  relationship: string; // e.g., 'Driver', 'Aunt', 'Uncle', 'Grandparent', 'Family Friend', 'Guardian'
  phone: string;
  id_number?: string; // National ID, Driver's License or Passport #
  notes?: string;
  photo_url?: string;
}

export interface ParentContactInfo {
  father_name?: string;
  father_phone?: string;
  father_email?: string;
  mother_name?: string;
  mother_phone?: string;
  mother_email?: string;
  home_address?: string;
  emergency_phone?: string;
}

export interface Staff {
  id?: string;
  staff_id: string; // Unique ID, e.g., STF-001
  pin_code: string; // Unique 3-digit code
  password?: string; // Optional password for email/password authentication
  full_name: string;
  role: UserRole;
  campus?: string; // 'Spring Campus' | 'Hope Campus' | 'All Campuses'
  learning_center_id?: string; // e.g. Kayil, Splendor, Main Office
  email: string;
  phone?: string;
  qr_code_url?: string;
  job_title?: string;
  department?: string;
  status?: 'Active' | 'On Leave' | 'Inactive';
  emergency_contact?: string;
  duty_schedule?: string;
  shift_start?: string;
  shift_end?: string;
  can_scan_teachers?: boolean;
  can_manage_staff?: boolean;
  can_approve_edits?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type StaffUser = Staff;

export interface Student {
  id?: string;
  student_id: string; // Unique ID, e.g., STU-1001
  pin_code: string; // Unique 4-digit code
  full_name: string;
  campus: string; // 'Spring Campus' | 'Hope Campus'
  learning_center_id: string; // Classroom or Center e.g. Kayil, Splendor, Doxa, Bethany, Antioch, Azusa, Blooms and Archie
  supervisor_name?: string; // ONLY for Bethany Learning Center ('Mrs. Eunice Mutebe')
  monitor_name?: string; // Assistant teacher / monitor
  grade?: string;
  enrollment_type?: 'Day' | 'Boarding'; // Springs Campus boarding option (Mon-Fri)
  photo_url?: string; // Uploaded profile picture
  parent_info?: ParentContactInfo;
  parent_names?: string;
  emergency_contact?: string;
  designated_pickups?: DesignatedPickupPerson[]; // Authorized drop-off / pick-up persons other than parents
  qr_code_url?: string;
  created_at?: string;
  updated_at?: string;
}

export type SignOutOption =
  | 'Picked by parent'
  | 'Picked by Designate'
  | 'Dropped by designate'
  | 'Student went home alone';

export type EarlyDepartureReasonOption =
  | 'Health reasons'
  | 'Parent request'
  | 'Child sent home'
  | 'Enter reason';

export interface PickupDropoffParty {
  type?: 'Parent' | 'Designate' | 'Self';
  signOutOption?: SignOutOption;
  name: string;
  relationship?: string;
  phone?: string;
  notes?: string;
}

export type AttendanceLogStatus =
  | 'Active'
  | 'Pending Edit Approval'
  | 'Edited'
  | 'Deleted';

export interface AttendanceLog {
  id: string;
  log_id: string;
  target_type: 'Student' | 'Teacher';
  target_id: string; // student_id or staff_id
  target_name: string;
  campus?: string; // 'Spring Campus' | 'Hope Campus'
  grade_or_role: string;
  classroom: string;
  date: string; // YYYY-MM-DD
  check_in_time: string; // e.g., "08:12 AM"
  check_out_time: string | null; // e.g., "03:15 PM" or null
  scanned_by: string; // staff_id or staff name
  scanned_by_name?: string;
  signed_in_by?: string;
  signed_in_by_name?: string;
  signed_out_by?: string;
  signed_out_by_name?: string;
  pickup_dropoff_party?: PickupDropoffParty;
  early_departure_reason?: string;
  status: AttendanceLogStatus;
  created_at: string;
  updated_at?: string;
  last_edited_by?: string;
  audit_note?: string;
}

export interface EditRequest {
  id: string;
  request_id: string;
  log_id: string;
  target_type: 'Student' | 'Teacher';
  target_name: string;
  campus?: string;
  date: string;
  requested_by_id: string;
  requested_by_name: string;
  original_data: {
    check_in_time: string;
    check_out_time: string | null;
    pickup_dropoff_party?: PickupDropoffParty;
    early_departure_reason?: string;
    status: AttendanceLogStatus;
  };
  proposed_data: {
    check_in_time: string;
    check_out_time: string | null;
    pickup_dropoff_party?: PickupDropoffParty;
    early_departure_reason?: string;
    status?: AttendanceLogStatus;
  };
  reason_for_edit: string;
  is_urgent?: boolean;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_comment?: string;
  created_at: string;
}

export interface UrgentAlert {
  id: string;
  request_id: string;
  log_id: string;
  target_name: string;
  target_type: 'Student' | 'Teacher';
  campus?: string;
  teacher_name: string;
  teacher_role: string;
  reason: string;
  timestamp: string;
  dismissed_by?: string[];
  fcm_message_id?: string;
}

export interface PremisesSummary {
  studentsTotal: number;
  studentsOnPremises: number;
  studentsCheckedOut: number;
  studentsAbsent: number;
  staffTotal: number;
  staffOnPremises: number;
  staffCheckedOut: number;
  staffAbsent: number;
}

export interface SchoolHoursSchedule {
  enabled: boolean;
  mondayToThursday: {
    openTime: string; // e.g. "07:00"
    closeTime: string; // e.g. "16:30"
    openLabel?: string;
    closeLabel?: string;
  };
  friday: {
    openTime: string; // e.g. "07:00"
    closeTime: string; // e.g. "14:00"
    openLabel?: string;
    closeLabel?: string;
  };
  weekendClosed: boolean;
}

export interface BoardingScheduleConfig {
  enabled: boolean;
  campusName: string; // 'Spring Campus'
  dropoffDayName: string; // 'Monday'
  dropoffTime: string; // '07:00'
  dismissalDayName: string; // 'Friday'
  dismissalTime: string; // '14:00'
  notifyMidWeekDepartures: boolean; // Mid-week departures trigger resident security notifications
  requireApprovalForMidWeek: boolean;
}

export interface EarlyDepartureEnforcementConfig {
  enabled: boolean;
  monThuDismissalTime: string; // '16:30'
  friDismissalTime: string; // '14:00'
  earlyDepartureBufferMinutes: number; // 10 minutes buffer
  requireAuthorizationNote: boolean;
  requirePartyDetails: boolean;
}

export interface OperationalPolicySettings {
  schoolHours: SchoolHoursSchedule;
  boardingSchedule: BoardingScheduleConfig;
  earlyDeparture: EarlyDepartureEnforcementConfig;
  updated_at?: string;
  updated_by?: string;
}

export interface SystemSettings {
  id: string;
  school_name: string;
  academic_year: string;
  idle_timeout_minutes: number;
  require_pin_for_edits: boolean;
  fcm_alerts_enabled: boolean;
  updated_at: string;
  updated_by: string;
}
