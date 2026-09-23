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
  supervisor_name: string;
  monitor_name: string;
  room_number?: string;
  capacity?: number;
  description?: string;
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
  created_at?: string;
}

export interface Student {
  id?: string;
  student_id: string; // Unique ID, e.g., STU-1001
  pin_code: string; // Unique 4-digit code
  full_name: string;
  campus: string; // 'Spring Campus' | 'Hope Campus'
  learning_center_id: string; // Classroom or Center e.g. Kayil, Splendor, Doxa, Bethany, Antioch, Azusa, Blooms and Archie
  supervisor_name: string; // Main teacher / supervisor
  monitor_name: string; // Assistant teacher / monitor
  grade?: string;
  parent_names?: string;
  emergency_contact?: string;
  qr_code_url?: string;
  created_at?: string;
}

export interface PickupDropoffParty {
  type: 'Parent' | 'Designate';
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
  pickup_dropoff_party?: PickupDropoffParty;
  early_departure_reason?: string;
  status: AttendanceLogStatus;
  created_at: string;
  updated_at?: string;
  last_edited_by?: string;
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
