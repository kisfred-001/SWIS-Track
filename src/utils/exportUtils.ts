import { Student, StaffUser, AttendanceLog } from '../types';

/**
 * Utility to trigger browser file download for text/blob
 */
export function downloadFile(content: Blob | string, filename: string, mimeType?: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType || 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escapes CSV cell values
 */
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Converts array of objects to CSV string
 */
export function objectsToCSV(headers: { key: string; label: string }[], data: Record<string, any>[]): string {
  const headerRow = headers.map((h) => escapeCSV(h.label)).join(',');
  const rows = data.map((item) =>
    headers.map((h) => escapeCSV(item[h.key])).join(',')
  );
  return [headerRow, ...rows].join('\n');
}

/**
 * 1. Export Students CSV
 */
export function exportStudentsCSV(students: Student[]): string {
  const headers = [
    { key: 'student_id', label: 'Student ID' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'pin_code', label: 'Security PIN' },
    { key: 'campus', label: 'Campus' },
    { key: 'learning_center_id', label: 'Learning Center' },
    { key: 'supervisor_name', label: 'Supervisor' },
    { key: 'monitor_name', label: 'Monitor' },
    { key: 'parent_names', label: 'Parents / Guardians' },
    { key: 'parent_phone', label: 'Parent Phone' },
    { key: 'parent_email', label: 'Parent Email' },
    { key: 'authorized_pickups_count', label: 'Authorized Pickups Count' },
    { key: 'status', label: 'Roster Status' },
  ];

  const data = students.map((s) => ({
    student_id: s.student_id,
    full_name: s.full_name,
    pin_code: s.pin_code || 'N/A',
    campus: s.campus,
    learning_center_id: s.learning_center_id,
    supervisor_name: s.supervisor_name || '',
    monitor_name: s.monitor_name || '',
    parent_names: s.parent_names || 'Not Registered',
    parent_phone: s.parent_info?.father_phone || s.parent_info?.mother_phone || s.emergency_contact || '',
    parent_email: s.parent_info?.father_email || s.parent_info?.mother_email || '',
    authorized_pickups_count: s.designated_pickups?.length || 0,
    status: 'Active',
  }));

  return objectsToCSV(headers, data);
}

/**
 * 2. Export Staff CSV
 */
export function exportStaffCSV(staff: StaffUser[]): string {
  const headers = [
    { key: 'staff_id', label: 'Staff ID' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'role', label: 'System Role' },
    { key: 'campus', label: 'Campus Assignment' },
    { key: 'learning_center', label: 'Learning Center' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'pin_code', label: 'Security PIN' },
    { key: 'status', label: 'Status' },
  ];

  const data = staff.map((s) => ({
    staff_id: s.staff_id,
    full_name: s.full_name,
    role: s.role,
    campus: s.campus || 'All Campuses',
    learning_center: s.learning_center_id || 'General',
    email: s.email || '',
    phone: s.phone || '',
    pin_code: s.pin_code || 'N/A',
    status: s.status || 'Active',
  }));

  return objectsToCSV(headers, data);
}

/**
 * 3. Export Attendance Logs CSV
 */
export function exportAttendanceLogsCSV(logs: AttendanceLog[]): string {
  const headers = [
    { key: 'log_id', label: 'Log Reference' },
    { key: 'date', label: 'Date' },
    { key: 'target_type', label: 'Category' },
    { key: 'target_id', label: 'ID Number' },
    { key: 'target_name', label: 'Full Name' },
    { key: 'campus', label: 'Campus' },
    { key: 'classroom', label: 'Learning Center / Role' },
    { key: 'check_in_time', label: 'Arrival Time' },
    { key: 'signed_in_by', label: 'Checked In By' },
    { key: 'check_out_time', label: 'Departure Time' },
    { key: 'signed_out_by', label: 'Checked Out By' },
    { key: 'sign_out_option', label: 'Release Option' },
    { key: 'pickup_party', label: 'Pickup / Dropoff Party' },
    { key: 'early_reason', label: 'Early Checkout Reason' },
    { key: 'status', label: 'Status' },
  ];

  const data = logs.map((l) => ({
    log_id: l.log_id || l.id,
    date: l.date,
    target_type: l.target_type,
    target_id: l.target_id,
    target_name: l.target_name,
    campus: l.campus,
    classroom: l.classroom || l.grade_or_role || '',
    check_in_time: l.check_in_time || 'N/A',
    signed_in_by: l.signed_in_by_name || l.scanned_by_name || l.scanned_by || '',
    check_out_time: l.check_out_time || 'Present On Campus',
    signed_out_by: l.signed_out_by_name || (l.check_out_time ? l.scanned_by_name || 'Staff' : ''),
    sign_out_option: l.pickup_dropoff_party?.signOutOption || '',
    pickup_party: l.pickup_dropoff_party ? `${l.pickup_dropoff_party.name} (${l.pickup_dropoff_party.relationship || l.pickup_dropoff_party.type})` : '',
    early_reason: l.early_departure_reason || '',
    status: l.status,
  }));

  return objectsToCSV(headers, data);
}
