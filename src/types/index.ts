export type UserRole =
  | 'Teacher'
  | 'Admin Assistant'
  | 'Principal'
  | 'Director'
  | 'ICCE Coordinator';

export interface Staff {
  id?: string;
  staff_id: string; // Unique ID, e.g., STF-101
  pin_code: string; // Unique 3-digit code
  full_name: string;
  role: UserRole;
  learning_center_id?: string; // e.g. Learning Center Alpha
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
  grade: string;
  learning_center_id: string; // Classroom or Center
  supervisor_name: string; // Main teacher
  monitor_name: string; // Assistant teacher
  parent_names: string;
  emergency_contact: string;
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
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_comment?: string;
  created_at: string;
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
