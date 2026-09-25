import JSZip from 'jszip';
import { Student, StaffUser, AttendanceLog, Campus, LearningCenter, EditRequest, OperationalPolicySettings } from '../types';

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
 * 3. Export Administrators CSV
 */
export function exportAdministratorsCSV(staff: StaffUser[]): string {
  const adminRoles = [
    'ICCE Coordinator',
    'Campus Director',
    'Principal',
    'Administrator',
    'Learning Center Supervisor',
  ];

  const admins = staff.filter((s) => adminRoles.includes(s.role));

  const headers = [
    { key: 'staff_id', label: 'Admin Staff ID' },
    { key: 'full_name', label: 'Administrator Name' },
    { key: 'role', label: 'Administrative Title' },
    { key: 'campus', label: 'Campus Authority' },
    { key: 'email', label: 'Contact Email' },
    { key: 'phone', label: 'Contact Phone' },
    { key: 'pin_code', label: 'Security PIN' },
  ];

  const data = admins.map((s) => ({
    staff_id: s.staff_id,
    full_name: s.full_name,
    role: s.role,
    campus: s.campus || 'All Campuses',
    email: s.email || '',
    phone: s.phone || '',
    pin_code: s.pin_code || 'N/A',
  }));

  return objectsToCSV(headers, data);
}

/**
 * 4. Export Attendance Logs CSV
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

/**
 * 5. Export Campuses & Learning Centers CSV
 */
export function exportCampusesAndCentersCSV(campuses: Campus[], learningCenters: LearningCenter[]): string {
  const headers = [
    { key: 'type', label: 'Entity Type' },
    { key: 'name', label: 'Campus / Center Name' },
    { key: 'campus_parent', label: 'Belongs to Campus' },
    { key: 'lead_person', label: 'Lead Admin / Supervisor' },
    { key: 'secondary_person', label: 'Monitor' },
    { key: 'capacity', label: 'Student Capacity' },
  ];

  const campusRows = campuses.map((c) => ({
    type: 'Campus',
    name: c.name,
    campus_parent: c.name,
    lead_person: c.lead_administrator,
    secondary_person: '',
    capacity: c.capacity,
  }));

  const lcRows = learningCenters.map((lc) => ({
    type: 'Learning Center',
    name: lc.name,
    campus_parent: lc.campus,
    lead_person: lc.supervisor_name,
    secondary_person: lc.monitor_name || '',
    capacity: lc.capacity,
  }));

  return objectsToCSV(headers, [...campusRows, ...lcRows]);
}

/**
 * 6. Generate Printable HTML Sheet for Student Badges
 */
export function generatePrintableBadgesHTML(students: Student[], schoolName = 'SWIS Attendance System'): string {
  const badgeCardsHTML = students
    .map(
      (s) => `
      <div class="badge-card">
        <div class="badge-header">
          <div class="badge-school">${schoolName}</div>
          <div class="badge-campus">${s.campus}</div>
        </div>
        <div class="badge-body">
          <div class="qr-box">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(s.student_id)}" alt="QR Code" />
          </div>
          <div class="badge-info">
            <div class="student-name">${s.full_name}</div>
            <div class="student-id">ID: <strong>${s.student_id}</strong></div>
            <div class="student-lc">Center: <strong>${s.learning_center_id}</strong></div>
            <div class="student-sup">Supervisor: ${s.supervisor_name || 'Unassigned'}</div>
            ${s.pin_code ? `<div class="student-pin">PIN: <code>${s.pin_code}</code></div>` : ''}
          </div>
        </div>
        <div class="badge-footer">
          OFFICIAL STUDENT IDENTIFICATION BADGE
        </div>
      </div>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Student Identification Badges - Bulk Export (${students.length} Students)</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }
    .print-bar { background: #1e293b; color: white; padding: 12px 20px; border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }
    .print-btn { background: #4f46e5; color: white; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; }
    .print-btn:hover { background: #4338ca; }
    .badge-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; page-break-inside: auto; }
    .badge-card { background: white; border: 2px solid #cbd5e1; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); page-break-inside: avoid; height: 210px; }
    .badge-header { background: linear-gradient(135deg, #1e1b4b, #312e81); color: white; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #6366f1; }
    .badge-school { font-weight: 800; font-size: 11px; letter-spacing: 0.5px; text-transform: uppercase; }
    .badge-campus { background: rgba(255, 255, 255, 0.2); padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; }
    .badge-body { padding: 12px; display: flex; align-items: center; gap: 14px; flex: 1; }
    .qr-box { width: 90px; height: 90px; shrink: 0; border: 1px solid #e2e8f0; border-radius: 12px; padding: 4px; background: white; }
    .qr-box img { width: 100%; height: 100%; object-fit: contain; }
    .badge-info { flex: 1; min-width: 0; }
    .student-name { font-size: 15px; font-weight: 900; color: #0f172a; margin-bottom: 4px; line-height: 1.2; word-break: break-word; }
    .student-id { font-size: 11px; color: #475569; margin-bottom: 2px; }
    .student-lc { font-size: 11px; color: #4338ca; font-weight: 600; margin-bottom: 2px; }
    .student-sup { font-size: 10px; color: #64748b; margin-bottom: 2px; }
    .student-pin { font-size: 10px; color: #d97706; font-weight: 700; margin-top: 4px; }
    .student-pin code { background: #fef3c7; padding: 1px 5px; border-radius: 4px; border: 1px solid #fde68a; }
    .badge-footer { background: #f1f5f9; text-align: center; font-size: 8px; font-weight: 800; color: #64748b; padding: 4px; letter-spacing: 1px; border-top: 1px solid #e2e8f0; }
    @media print {
      .print-bar { display: none; }
      body { background: white; padding: 0; }
      .badge-card { box-shadow: none; border-color: #94a3b8; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <div>
      <strong style="font-size: 16px;">Student QR Identification Badges</strong>
      <div style="font-size: 12px; color: #94a3b8;">${students.length} Official Student Badges Ready for Printing</div>
    </div>
    <button class="print-btn" onclick="window.print()">Print Badges Now</button>
  </div>
  <div class="badge-grid">
    ${badgeCardsHTML}
  </div>
</body>
</html>`;
}

/**
 * 7. Package Complete Bulk System Master Archive ZIP
 */
export async function generateMasterSystemZip(params: {
  students: Student[];
  staff: StaffUser[];
  logs: AttendanceLog[];
  campuses: Campus[];
  learningCenters: LearningCenter[];
  editRequests?: EditRequest[];
  operationalPolicies?: OperationalPolicySettings;
}): Promise<Blob> {
  const zip = new JSZip();
  const dateStr = new Date().toISOString().split('T')[0];

  // CSV Files
  zip.file(`students_list_${dateStr}.csv`, exportStudentsCSV(params.students));
  zip.file(`staff_members_list_${dateStr}.csv`, exportStaffCSV(params.staff));
  zip.file(`administrators_list_${dateStr}.csv`, exportAdministratorsCSV(params.staff));
  zip.file(`attendance_logs_${dateStr}.csv`, exportAttendanceLogsCSV(params.logs));
  zip.file(`campuses_and_centers_${dateStr}.csv`, exportCampusesAndCentersCSV(params.campuses, params.learningCenters));

  // JSON Datasets
  zip.file(`students_data.json`, JSON.stringify(params.students, null, 2));
  zip.file(`staff_data.json`, JSON.stringify(params.staff, null, 2));
  zip.file(`attendance_logs.json`, JSON.stringify(params.logs, null, 2));
  zip.file(`system_structure.json`, JSON.stringify({
    campuses: params.campuses,
    learningCenters: params.learningCenters,
    operationalPolicies: params.operationalPolicies || null,
  }, null, 2));

  // Printable Badges Sheet HTML
  zip.file(`student_badges_printable.html`, generatePrintableBadgesHTML(params.students));

  // Full System Snapshot JSON
  const fullSnapshot = {
    export_timestamp: new Date().toISOString(),
    system_version: 'SWIS-v2.5',
    students_count: params.students.length,
    staff_count: params.staff.length,
    logs_count: params.logs.length,
    students: params.students,
    staff: params.staff,
    logs: params.logs,
    campuses: params.campuses,
    learningCenters: params.learningCenters,
    editRequests: params.editRequests || [],
    operationalPolicies: params.operationalPolicies || null,
  };
  zip.file(`full_system_master_backup_${dateStr}.json`, JSON.stringify(fullSnapshot, null, 2));

  return await zip.generateAsync({ type: 'blob' });
}
