import { collection, getDocs, setDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from './config';
import { Staff, Student, Campus, LearningCenter } from '../types';

export const SUPER_USER_ACCOUNT: Staff = {
  staff_id: 'STF-001',
  pin_code: '555',
  password: 'P@haneroo@555',
  full_name: 'Mr. Fredrick Kariuki',
  role: 'ICCE Coordinator',
  campus: 'All Campuses',
  learning_center_id: 'ICCE Executive Office',
  email: 'kisfred@gmail.com',
  phone: '+256 772 000 555',
  job_title: 'ICCE Coordinator & Master Administrator',
  department: 'Executive Governance',
  status: 'Active',
  can_scan_teachers: true,
  can_manage_staff: true,
  can_approve_edits: true,
  qr_code_url: 'STF-001',
  created_at: new Date().toISOString(),
};

export const INITIAL_STAFF: Staff[] = [
  SUPER_USER_ACCOUNT, // ICCE Coordinator - Mr. Fredrick Kariuki (PIN 555)
  // School Principal - Mrs. Irene Lulika (Designated PIN 101)
  {
    staff_id: 'STF-002',
    pin_code: '101',
    password: 'Irynntess@2023!',
    full_name: 'Mrs. Irene Lulika',
    role: 'Principal',
    campus: 'Spring Campus',
    learning_center_id: 'Executive Leadership',
    email: 'principal@spiritandword.ug',
    phone: '+256 772 101 002',
    job_title: 'School Principal',
    department: 'School Leadership',
    status: 'Active',
    can_scan_teachers: true,
    can_manage_staff: true,
    can_approve_edits: true,
    qr_code_url: 'STF-002',
    created_at: new Date().toISOString(),
  },
  // School Director - Mr. Jaxon Lulika (Designated PIN 102)
  {
    staff_id: 'STF-003',
    pin_code: '102',
    password: 'Irynntess@2023!',
    full_name: 'Mr. Jaxon Lulika',
    role: 'Director',
    campus: 'Spring Campus',
    learning_center_id: 'Executive Leadership',
    email: 'pastor@spiritandword.ug',
    phone: '+256 772 102 003',
    job_title: 'School Director',
    department: 'Executive Governance',
    status: 'Active',
    can_scan_teachers: true,
    can_manage_staff: true,
    can_approve_edits: true,
    qr_code_url: 'STF-003',
    created_at: new Date().toISOString(),
  },
  // Administrator - Mrs. Khasoma Susan (PIN 103)
  {
    staff_id: 'STF-004',
    pin_code: '103',
    password: 'Irynntess@2023!',
    full_name: 'Mrs. Khasoma Susan',
    role: 'Administrator',
    campus: 'Hope Campus',
    learning_center_id: 'Central Administration',
    email: 'susan.khasoma@spiritandword.ug',
    phone: '+256 772 103 004',
    job_title: 'Campus Administrator',
    department: 'Administration',
    status: 'Active',
    can_scan_teachers: true,
    can_manage_staff: true,
    can_approve_edits: true,
    qr_code_url: 'STF-004',
    created_at: new Date().toISOString(),
  },
  // Administrative Assistant - Mrs. Juliet Arinaitwe (PIN 104)
  {
    staff_id: 'STF-005',
    pin_code: '104',
    password: 'Spiritual@20261',
    full_name: 'Mrs. Juliet Arinaitwe',
    role: 'Administrative Assistant',
    campus: 'Hope Campus',
    learning_center_id: 'Central Administration',
    email: 'jarineitwe@spiritandword.ug',
    phone: '+256 772 104 005',
    job_title: 'Administrative Assistant',
    department: 'Administration & Registry',
    status: 'Active',
    can_scan_teachers: true,
    can_manage_staff: false,
    can_approve_edits: true,
    qr_code_url: 'STF-005',
    created_at: new Date().toISOString(),
  },
  // Support Staff - Miss. Anette Mugala (PIN 105)
  {
    staff_id: 'STF-006',
    pin_code: '105',
    password: 'Spiritual@20231',
    full_name: 'Miss. Anette Mugala',
    role: 'Support Staff',
    campus: 'Hope Campus',
    learning_center_id: 'Campus Check-In / Gates',
    email: 'annet@spiritandword.ug',
    phone: '+256 772 105 006',
    job_title: 'Gate & Operations Support',
    department: 'Operations & Security',
    status: 'Active',
    can_scan_teachers: false,
    can_manage_staff: false,
    can_approve_edits: false,
    qr_code_url: 'STF-006',
    created_at: new Date().toISOString(),
  },
  // Kayil Supervisor - Mrs. Irene Oryem (PIN 201)
  {
    staff_id: 'STF-101',
    pin_code: '201',
    password: 'Spiritual@20231',
    full_name: 'Mrs. Irene Oryem',
    role: 'Supervisor',
    campus: 'Spring Campus',
    learning_center_id: 'Kayil',
    email: 'irene.auma@spiritandword.ug',
    phone: '+256 772 201 101',
    job_title: 'Kayil Learning Center Supervisor',
    department: 'Teaching Faculty',
    status: 'Active',
    can_scan_teachers: false,
    can_manage_staff: false,
    can_approve_edits: false,
    qr_code_url: 'STF-101',
    created_at: new Date().toISOString(),
  },
  // Splendor Supervisor - Mr. Arthur Mutebi (PIN 202)
  {
    staff_id: 'STF-102',
    pin_code: '202',
    password: 'Spiritual@2025',
    full_name: 'Mr. Arthur Mutebi',
    role: 'Supervisor',
    campus: 'Spring Campus',
    learning_center_id: 'Splendor',
    email: 'arthur@spiritandword.ug',
    phone: '+256 772 202 102',
    job_title: 'Splendor Learning Center Supervisor',
    department: 'Teaching Faculty',
    status: 'Active',
    can_scan_teachers: false,
    can_manage_staff: false,
    can_approve_edits: false,
    qr_code_url: 'STF-102',
    created_at: new Date().toISOString(),
  },
  // Bethany Supervisor - Mrs. Eunice Mutebe (PIN 203)
  {
    staff_id: 'STF-103',
    pin_code: '203',
    password: 'Spiritual@2023',
    full_name: 'Mrs. Eunice Mutebe',
    role: 'Supervisor',
    campus: 'Hope Campus',
    learning_center_id: 'Bethany',
    email: 'eunice@spiritandword.ug',
    phone: '+256 772 203 103',
    job_title: 'Bethany Learning Center Supervisor',
    department: 'Teaching Faculty',
    status: 'Active',
    can_scan_teachers: false,
    can_manage_staff: false,
    can_approve_edits: false,
    qr_code_url: 'STF-103',
    created_at: new Date().toISOString(),
  },
  // Azusa Supervisor - Mr. Shafic Musika (PIN 204)
  {
    staff_id: 'STF-104',
    pin_code: '204',
    password: 'Spiritual@20251',
    full_name: 'Mr. Shafic Musika',
    role: 'Supervisor',
    campus: 'Hope Campus',
    learning_center_id: 'Azusa',
    email: 'shafic@spiritandword.ug',
    phone: '+256 772 204 104',
    job_title: 'Azusa Learning Center Supervisor',
    department: 'Teaching Faculty',
    status: 'Active',
    can_scan_teachers: false,
    can_manage_staff: false,
    can_approve_edits: false,
    qr_code_url: 'STF-104',
    created_at: new Date().toISOString(),
  },
  // Antioch Supervisor - Mrs. Doreen Mugaga (PIN 205)
  {
    staff_id: 'STF-105',
    pin_code: '205',
    password: 'Spiritual@20231',
    full_name: 'Mrs. Doreen Mugaga',
    role: 'Supervisor',
    campus: 'Hope Campus',
    learning_center_id: 'Antioch',
    email: 'doreen.amali@spiritandword.ug',
    phone: '+256 772 205 105',
    job_title: 'Antioch Learning Center Supervisor',
    department: 'Teaching Faculty',
    status: 'Active',
    can_scan_teachers: false,
    can_manage_staff: false,
    can_approve_edits: false,
    qr_code_url: 'STF-105',
    created_at: new Date().toISOString(),
  },
  // Doxa Supervisor - Mr. David Kimbugwe Mugaga (PIN 206)
  {
    staff_id: 'STF-106',
    pin_code: '206',
    password: 'Spiritual@2025',
    full_name: 'Mr. David Kimbugwe Mugaga',
    role: 'Supervisor',
    campus: 'Spring Campus',
    learning_center_id: 'Doxa',
    email: 'david.kimbugwe@spiritandword.ug',
    phone: '+256 772 206 106',
    job_title: 'Doxa Learning Center Supervisor',
    department: 'Teaching Faculty',
    status: 'Active',
    can_scan_teachers: false,
    can_manage_staff: false,
    can_approve_edits: false,
    qr_code_url: 'STF-106',
    created_at: new Date().toISOString(),
  },
  // Bloom and Archie Supervisor - Mrs. Julie Mayanja (PIN 207)
  {
    staff_id: 'STF-107',
    pin_code: '207',
    password: 'Spiritual@20241',
    full_name: 'Mrs. Julie Mayanja',
    role: 'Supervisor',
    campus: 'Hope Campus',
    learning_center_id: 'Bloom and Archie',
    email: 'julie.mayanja@spiritandword.ug',
    phone: '+256 772 207 107',
    job_title: 'Bloom and Archie Learning Center Supervisor',
    department: 'Teaching Faculty',
    status: 'Active',
    can_scan_teachers: false,
    can_manage_staff: false,
    can_approve_edits: false,
    qr_code_url: 'STF-107',
    created_at: new Date().toISOString(),
  },
  // Bethany Monitor - Mrs. Joan Nandhego (PIN 208)
  {
    staff_id: 'STF-108',
    pin_code: '208',
    password: 'Spiritual@20261',
    full_name: 'Mrs. Joan Nandhego',
    role: 'Monitor',
    campus: 'Hope Campus',
    learning_center_id: 'Bethany',
    email: 'joan@spiritandword.ug',
    phone: '+256 772 208 108',
    job_title: 'Bethany Learning Center Monitor',
    department: 'Teaching Faculty',
    status: 'Active',
    can_scan_teachers: false,
    can_manage_staff: false,
    can_approve_edits: false,
    qr_code_url: 'STF-108',
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_CAMPUSES: Campus[] = [
  {
    id: 'spring-campus',
    name: 'Spring Campus',
    code: 'SPRING',
    location: 'North Wing, SWIS Academy',
    phone: '+256 700 123 456',
    email: 'spring.campus@spiritandword.ug',
    lead_administrator: 'Mrs. Irene Lulika & Mr. Jaxon Lulika',
    learning_centers: ['Kayil', 'Doxa', 'Splendor'],
    total_capacity: 150,
    opening_time: '07:30 AM',
    closing_time: '04:30 PM',
    created_at: new Date().toISOString(),
  },
  {
    id: 'hope-campus',
    name: 'Hope Campus',
    code: 'HOPE',
    location: 'South Wing, SWIS Academy',
    phone: '+256 700 789 012',
    email: 'hope.campus@spiritandword.ug',
    lead_administrator: 'Mrs. Khasoma Susan',
    learning_centers: ['Bethany', 'Antioch', 'Azusa', 'Bloom and Archie'],
    total_capacity: 175,
    opening_time: '07:30 AM',
    closing_time: '04:30 PM',
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_LEARNING_CENTERS: LearningCenter[] = [
  {
    id: 'spring-kayil',
    name: 'Kayil',
    campus: 'Spring Campus',
    supervisor_name: 'Mrs. Irene Oryem',
    monitor_name: '',
    room_number: 'Room S-101',
    capacity: 25,
    description: 'Spring Campus Early Learning & Primary Center (Supervisor: Mrs. Irene Oryem)',
  },
  {
    id: 'spring-doxa',
    name: 'Doxa',
    campus: 'Spring Campus',
    supervisor_name: 'Mr. David Kimbugwe',
    monitor_name: '',
    room_number: 'Room S-102',
    capacity: 25,
    description: 'Spring Campus Senior Learning Center (Supervisor: Mr. David Kimbugwe)',
  },
  {
    id: 'spring-splendor',
    name: 'Splendor',
    campus: 'Spring Campus',
    supervisor_name: 'Mr. Arthur Mutebi',
    monitor_name: '',
    room_number: 'Room S-103',
    capacity: 25,
    description: 'Spring Campus Middle School Learning Center (Supervisor: Mr. Arthur Mutebi)',
  },
  {
    id: 'hope-bethany',
    name: 'Bethany',
    campus: 'Hope Campus',
    supervisor_name: 'Mrs. Eunice Mutebe',
    monitor_name: 'Mrs. Joan Nandhego',
    room_number: 'Room H-101',
    capacity: 25,
    description: 'Hope Campus Foundation & Primary PACE Center (Supervisor: Mrs. Eunice Mutebe, Monitor: Mrs. Joan Nandhego - Only Bethany Center in SWIS)',
  },
  {
    id: 'hope-antioch',
    name: 'Antioch',
    campus: 'Hope Campus',
    supervisor_name: 'Mrs. Doreen Mugaga',
    monitor_name: '',
    room_number: 'Room H-102',
    capacity: 25,
    description: 'Hope Campus Junior Secondary Learning Center (Supervisor: Mrs. Doreen Mugaga)',
  },
  {
    id: 'hope-azusa',
    name: 'Azusa',
    campus: 'Hope Campus',
    supervisor_name: 'Mr. Shafic Musika',
    monitor_name: '',
    room_number: 'Room H-103',
    capacity: 25,
    description: 'Hope Campus Intermediate Learning Center (Supervisor: Mr. Shafic Musika)',
  },
  {
    id: 'hope-bloom-and-archie',
    name: 'Bloom and Archie',
    campus: 'Hope Campus',
    supervisor_name: 'Mrs. Julie Mayanja',
    monitor_name: '',
    room_number: 'Room H-104',
    capacity: 25,
    description: 'Hope Campus Early Childhood & Foundation Center (Supervisor: Mrs. Julie Mayanja)',
  },
];

// List of removed monitors to actively purge
export const REMOVED_STAFF_NAMES_OR_IDS = new Set([
  'Ms. Joy Kemigisha',
  'Ms Joy Kamugisha',
  'Joy Kemigisha',
  'Joy Kamugisha',
  'Mr. Paul Ssekandi',
  'Paul Ssekandi',
  'Ms. Faith Nabirye',
  'Faith Nabirye',
  'Ms. Patricia Namubiru',
  'Patricia Namubiru',
  'Mr. Brian Ochieng',
  'Brian Ochieng',
  'Mr. Kevin Tumusiime',
  'Kevin Tumusiime',
  'Ms. Gloria Akello',
  'Gloria Akello',
  'Miss. Anette Mugaga',
  'Anette Mugaga',
  'STF-301',
  'STF-302',
  'STF-303',
  'STF-304',
  'STF-305',
  'STF-306',
]);

// Helper to look up assigned supervisor for a learning center
export function getSupervisorForCenter(_campus: string, center: string): string {
  if (center === 'Kayil') return 'Mrs. Irene Oryem';
  if (center === 'Doxa') return 'Mr. David Kimbugwe';
  if (center === 'Splendor') return 'Mr. Arthur Mutebi';
  if (center === 'Bethany') return 'Mrs. Eunice Mutebe';
  if (center === 'Antioch') return 'Mrs. Doreen Mugaga';
  if (center === 'Azusa') return 'Mr. Shafic Musika';
  if (center === 'Bloom and Archie' || center === 'Blooms and Archie') return 'Mrs. Julie Mayanja';
  return '';
}

// Helper to look up assigned monitor for a learning center (Only Bethany has Mrs. Joan Nandhego)
export function getMonitorForCenter(_campus: string, center: string): string {
  if (center === 'Bethany') return 'Mrs. Joan Nandhego';
  return '';
}

// 74 Students directly from user's attached CSV
export const RAW_STUDENT_DATA = [
  { name: 'Tyra Blick', campus: 'Spring Campus', center: 'Kayil', supervisor: 'Mrs. Irene Oryem' },
  { name: 'Tamara Blick', campus: 'Spring Campus', center: 'Splendor', supervisor: 'Mr. Arthur Mutebi' },
  { name: 'Tiana Blick', campus: 'Spring Campus', center: 'Splendor', supervisor: 'Mr. Arthur Mutebi' },
  { name: 'Israel Andinda', campus: 'Spring Campus', center: 'Kayil', supervisor: 'Mrs. Irene Oryem' },
  { name: 'Hannah Ankunda', campus: 'Spring Campus', center: 'Splendor', supervisor: 'Mr. Arthur Mutebi' },
  { name: 'Josiah Kirabo', campus: 'Spring Campus', center: 'Splendor', supervisor: 'Mr. Arthur Mutebi' },
  { name: 'Gerald Prince', campus: 'Spring Campus', center: 'Kayil', supervisor: 'Mrs. Irene Oryem' },
  { name: 'Ashley Joy', campus: 'Spring Campus', center: 'Kayil', supervisor: 'Mrs. Irene Oryem' },
  { name: 'Abraham Kasi Kisa', campus: 'Hope Campus', center: 'Bethany', supervisor: 'Mrs. Eunice Mutebe' },
  { name: 'Tabitha Kirabo', campus: 'Hope Campus', center: 'Azusa', supervisor: 'Mr. Shafic Musika' },
  { name: 'Nicole Namakula', campus: 'Spring Campus', center: 'Splendor', supervisor: 'Mr. Arthur Mutebi' },
  { name: 'Darynne Nekesa Bisanda', campus: 'Spring Campus', center: 'Splendor', supervisor: 'Mr. Arthur Mutebi' },
  { name: 'Jeanelle Keza Bisanda', campus: 'Hope Campus', center: 'Bethany', supervisor: 'Mrs. Eunice Mutebe' },
  { name: 'Dielle Theresa Nabwire', campus: 'Hope Campus', center: 'Antioch', supervisor: 'Mrs. Doreen Mugaga' },
  { name: 'Shammah Mugisha', campus: 'Hope Campus', center: 'Antioch', supervisor: 'Mrs. Doreen Mugaga' },
  { name: 'Geraldine Nabwami', campus: 'Spring Campus', center: 'Kayil', supervisor: 'Mrs. Irene Oryem' },
  { name: 'Charles Biddawo', campus: 'Spring Campus', center: 'Kayil', supervisor: 'Mrs. Irene Oryem' },
  { name: 'Dezdyliz Ndibalekera', campus: 'Spring Campus', center: 'Doxa', supervisor: 'Mr. David Kimbugwe' },
  { name: 'Gabriel Musiige', campus: 'Hope Campus', center: 'Bethany', supervisor: 'Mrs. Eunice Mutebe' },
  { name: 'Daniel Mandy', campus: 'Hope Campus', center: 'Antioch', supervisor: 'Mrs. Doreen Mugaga' },
  { name: 'Sanyu Elaine', campus: 'Hope Campus', center: 'Bethany', supervisor: 'Mrs. Eunice Mutebe' },
  { name: 'Dorona Zoe Njeri', campus: 'Spring Campus', center: 'Doxa', supervisor: 'Mr. David Kimbugwe' },
  { name: 'Debra Pendo', campus: 'Hope Campus', center: 'Bethany', supervisor: 'Mrs. Eunice Mutebe' },
  { name: 'Nathan Musiime Kibwota', campus: 'Spring Campus', center: 'Doxa', supervisor: 'Mr. David Kimbugwe' },
  { name: 'Joseph Kakumba', campus: 'Spring Campus', center: 'Doxa', supervisor: 'Mr. David Kimbugwe' },
  { name: 'Matthew Feta', campus: 'Spring Campus', center: 'Splendor', supervisor: 'Mr. Arthur Mutebi' },
  { name: 'Abigail Ahumuza', campus: 'Spring Campus', center: 'Splendor', supervisor: 'Mr. Arthur Mutebi' },
  { name: 'Jesse Ampaire', campus: 'Spring Campus', center: 'Doxa', supervisor: 'Mr. David Kimbugwe' },
  { name: 'Alitza Ayeza', campus: 'Spring Campus', center: 'Splendor', supervisor: 'Mr. Arthur Mutebi' },
  { name: 'Sean Trinity Agaba', campus: 'Spring Campus', center: 'Kayil', supervisor: 'Mrs. Irene Oryem' },
  { name: 'Hannah Mulungi', campus: 'Hope Campus', center: 'Antioch', supervisor: 'Mrs. Doreen Mugaga' },
  { name: 'Neza Chad Adriel', campus: 'Hope Campus', center: 'Antioch', supervisor: 'Mrs. Doreen Mugaga' },
  { name: 'Christel Ahimbisibwe', campus: 'Spring Campus', center: 'Kayil', supervisor: 'Mrs. Irene Oryem' },
  { name: 'Ethel Ainembabazi', campus: 'Spring Campus', center: 'Splendor', supervisor: 'Mr. Arthur Mutebi' },
  { name: 'Philip Mubiru', campus: 'Hope Campus', center: 'Antioch', supervisor: 'Mrs. Doreen Mugaga' },
  { name: 'Lauren Faith Mubiru', campus: 'Spring Campus', center: 'Splendor', supervisor: 'Mr. Arthur Mutebi' },
  { name: 'Genevieve Nabukonde', campus: 'Hope Campus', center: 'Bethany', supervisor: 'Mrs. Eunice Mutebe' },
  { name: 'Legi Hellena Elain', campus: 'Spring Campus', center: 'Doxa', supervisor: 'Mr. David Kimbugwe' },
  { name: 'Payton A. Kobusingye', campus: 'Hope Campus', center: 'Antioch', supervisor: 'Mrs. Doreen Mugaga' },
  { name: 'Gregory James Mwesigye', campus: 'Hope Campus', center: 'Azusa', supervisor: 'Mr. Shafic Musika' },
  { name: 'Zachary Cursten Kwesiga', campus: 'Hope Campus', center: 'Azusa', supervisor: 'Mr. Shafic Musika' },
  { name: 'Jerome Gad Amani', campus: 'Spring Campus', center: 'Kayil', supervisor: 'Mrs. Irene Oryem' },
  { name: 'Raina Nguya', campus: 'Hope Campus', center: 'Antioch', supervisor: 'Mrs. Doreen Mugaga' },
  { name: 'Romanove Nguya', campus: 'Hope Campus', center: 'Azusa', supervisor: 'Mr. Shafic Musika' },
  { name: 'David Nkeza', campus: 'Hope Campus', center: 'Azusa', supervisor: 'Mr. Shafic Musika' },
  { name: 'Edrin Baraza', campus: 'Spring Campus', center: 'Kayil', supervisor: 'Mrs. Irene Oryem' },
  { name: 'Ariana Akoli', campus: 'Hope Campus', center: 'Bethany', supervisor: 'Mrs. Eunice Mutebe' },
  { name: 'Nissi Mwiza', campus: 'Spring Campus', center: 'Doxa', supervisor: 'Mr. David Kimbugwe' },
  { name: 'Jireh Nziza', campus: 'Spring Campus', center: 'Doxa', supervisor: 'Mr. David Kimbugwe' },
  { name: 'Zoe Jubilee Mutoni', campus: 'Spring Campus', center: 'Splendor', supervisor: 'Mr. Arthur Mutebi' },
  { name: 'Shaddai Keza', campus: 'Hope Campus', center: 'Bethany', supervisor: 'Mrs. Eunice Mutebe' },
  { name: 'Ariella Mpanja', campus: 'Hope Campus', center: 'Antioch', supervisor: 'Mrs. Doreen Mugaga' },
  { name: 'Ashwell Bisanda', campus: 'Hope Campus', center: 'Bethany', supervisor: 'Mrs. Eunice Mutebe' },
  { name: 'Benjamin Ranell Ssebulime', campus: 'Hope Campus', center: 'Antioch', supervisor: 'Mrs. Doreen Mugaga' },
  { name: 'Zuriel Zaabu Kavuma', campus: 'Hope Campus', center: 'Azusa', supervisor: 'Mr. Shafic Musika' },
  { name: 'Tyra Anna Kemigisa', campus: 'Spring Campus', center: 'Doxa', supervisor: 'Mr. David Kimbugwe' },
  { name: 'Keith Mwesigwa Katende', campus: 'Hope Campus', center: 'Bethany', supervisor: 'Mrs. Eunice Mutebe' },
  { name: 'Charis Khane Gzas', campus: 'Hope Campus', center: 'Azusa', supervisor: 'Mr. Shafic Musika' },
  { name: 'Lester Nino Kaburu', campus: 'Spring Campus', center: 'Doxa', supervisor: 'Mr. David Kimbugwe' },
  { name: 'Myles Kisa', campus: 'Hope Campus', center: 'Azusa', supervisor: 'Mr. Shafic Musika' },
  { name: 'Charis Sanyu Keza', campus: 'Hope Campus', center: 'Antioch', supervisor: 'Mrs. Doreen Mugaga' },
  { name: 'Hannah Margaret Mukiibi', campus: 'Spring Campus', center: 'Doxa', supervisor: 'Mr. David Kimbugwe' },
  { name: 'Immanuella Nambiimbwa', campus: 'Hope Campus', center: 'Bethany', supervisor: 'Mrs. Eunice Mutebe' },
  { name: 'Lincoln Kalungi', campus: 'Spring Campus', center: 'Doxa', supervisor: 'Mr. David Kimbugwe' },
  { name: 'Adore Darian Kunda', campus: 'Hope Campus', center: 'Antioch', supervisor: 'Mrs. Doreen Mugaga' },
  { name: 'Camila Amutuhaire', campus: 'Spring Campus', center: 'Splendor', supervisor: 'Mr. Arthur Mutebi' },
  { name: 'Cruz Bart Rubaale', campus: 'Hope Campus', center: 'Bethany', supervisor: 'Mrs. Eunice Mutebe' },
  { name: 'Charissa Laloyo', campus: 'Hope Campus', center: 'Bethany', supervisor: 'Mrs. Eunice Mutebe' },
  { name: 'Grace Benjamin', campus: 'Hope Campus', center: 'Bethany', supervisor: 'Mrs. Eunice Mutebe' },
  { name: 'Charlotte Bazaine', campus: 'Hope Campus', center: 'Azusa', supervisor: 'Mr. Shafic Musika' },
  { name: 'Blessing Phoebe', campus: 'Hope Campus', center: 'Antioch', supervisor: 'Mrs. Doreen Mugaga' },
  { name: 'Darvin Mark Alleni', campus: 'Spring Campus', center: 'Kayil', supervisor: 'Mrs. Irene Oryem' },
  { name: 'Jovin Zihuramye', campus: 'Spring Campus', center: 'Splendor', supervisor: 'Mr. Arthur Mutebi' },
  { name: 'Angelica Rose Otai', campus: 'Hope Campus', center: 'Azusa', supervisor: 'Mr. Shafic Musika' },
];

export const INITIAL_STUDENTS: Student[] = RAW_STUDENT_DATA.map((row, index) => {
  const num = 1001 + index;
  const student_id = `STU-${num}`;
  // Deterministic 4-digit PIN for each student
  const pin_code = String(1100 + ((index * 37 + 13) % 8800)).padStart(4, '0');

  // Springs Campus boarding option: some students are Boarding, others Day
  const isSprings = row.campus === 'Spring Campus';
  const enrollment_type: 'Day' | 'Boarding' = isSprings && (index % 3 === 0 || index % 5 === 0) ? 'Boarding' : 'Day';

  // Official supervisors for each learning center
  const supervisor_name = row.supervisor || getSupervisorForCenter(row.campus, row.center);

  return {
    student_id,
    pin_code,
    full_name: row.name,
    campus: row.campus,
    learning_center_id: row.center,
    supervisor_name,
    monitor_name: getMonitorForCenter(row.campus, row.center),
    grade: `${row.campus.split(' ')[0]} • ${row.center}`,
    enrollment_type,
    parent_names: '',
    emergency_contact: '',
    designated_pickups: [],
    qr_code_url: student_id,
    created_at: new Date().toISOString(),
  };
});

let staffSyncAttempted = false;

export async function ensureSuperUserAccount(): Promise<Staff> {
  if (staffSyncAttempted) return SUPER_USER_ACCOUNT;
  try {
    const superUserRef = doc(db, 'staff', SUPER_USER_ACCOUNT.staff_id);
    await setDoc(superUserRef, SUPER_USER_ACCOUNT, { merge: true });
  } catch {
    // Gracefully handle quota exhaustion / offline mode
  }
  return SUPER_USER_ACCOUNT;
}

export async function ensureOfficialStaffAccounts(): Promise<Staff[]> {
  if (staffSyncAttempted) return INITIAL_STAFF;
  staffSyncAttempted = true;
  try {
    const lastSync = localStorage.getItem('swis_staff_synced_v3');
    if (lastSync) {
      return INITIAL_STAFF;
    }
    const batch = writeBatch(db);
    INITIAL_STAFF.forEach((stf) => {
      const ref = doc(db, 'staff', stf.staff_id);
      batch.set(ref, stf, { merge: true });
    });
    await batch.commit();
    localStorage.setItem('swis_staff_synced_v3', String(Date.now()));
  } catch {
    // Gracefully handle quota exhaustion / offline mode without console noise
  }
  return INITIAL_STAFF;
}

/**
 * Helper to delete all documents in a collection in safe batches (max 300 per batch).
 */
export async function deleteCollectionDocs(collectionName: string): Promise<number> {
  try {
    const snap = await getDocs(collection(db, collectionName));
    if (snap.empty) return 0;

    let count = 0;
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += 300) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + 300);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      count += chunk.length;
    }
    return count;
  } catch (err) {
    console.warn(`Error deleting documents from ${collectionName}:`, err);
    return 0;
  }
}

/**
 * Completely purges all AI dummy data and system artifacts:
 * 1. Purges all attendance logs (attendance_logs).
 * 2. Purges all edit requests (edit_requests).
 * 3. Purges all urgent alerts (urgent_alerts).
 * 4. Completely wipes the students collection of dummy records and inserts the 74 official CSV students.
 * 5. Wipes any rogue staff records and syncs official institutional leadership and faculty.
 * 6. Sets pristine campus and learning center structures.
 */
export async function purgeAllDummyDataAndCleanSystem(): Promise<{
  success: boolean;
  message: string;
  deletedLogs: number;
  deletedRequests: number;
  deletedAlerts: number;
  studentsCount: number;
  staffCount: number;
}> {
  try {
    // 1. Purge attendance_logs (removes any test/dummy check-in or check-out logs)
    const deletedLogs = await deleteCollectionDocs('attendance_logs');

    // 2. Purge edit_requests (removes any test/dummy audit requests)
    const deletedRequests = await deleteCollectionDocs('edit_requests');

    // 3. Purge urgent_alerts (removes any test alerts)
    const deletedAlerts = await deleteCollectionDocs('urgent_alerts');

    // 4. Wipe students collection completely to ensure no dummy AI students linger
    await deleteCollectionDocs('students');

    // 5. Populate official 74 students in safe batches
    for (let i = 0; i < INITIAL_STUDENTS.length; i += 300) {
      const batch = writeBatch(db);
      const chunk = INITIAL_STUDENTS.slice(i, i + 300);
      chunk.forEach((stu) => {
        batch.set(doc(db, 'students', stu.student_id), stu);
      });
      await batch.commit();
    }

    // 6. Purge non-official staff records and sync official staff
    const staffSnap = await getDocs(collection(db, 'staff'));
    const officialStaffIds = new Set(INITIAL_STAFF.map((s) => s.staff_id));
    const rogueStaffDocs = staffSnap.docs.filter((d) => !officialStaffIds.has(d.id));
    if (rogueStaffDocs.length > 0) {
      for (let i = 0; i < rogueStaffDocs.length; i += 300) {
        const batch = writeBatch(db);
        rogueStaffDocs.slice(i, i + 300).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }

    // Write official staff
    const staffBatch = writeBatch(db);
    INITIAL_STAFF.forEach((stf) => {
      staffBatch.set(doc(db, 'staff', stf.staff_id), stf, { merge: true });
    });
    await staffBatch.commit();

    // 7. Sync Campuses
    const campusBatch = writeBatch(db);
    INITIAL_CAMPUSES.forEach((c) => {
      campusBatch.set(doc(db, 'campuses', c.id), c, { merge: true });
    });
    await campusBatch.commit();

    // 8. Sync Learning Centers
    const lcBatch = writeBatch(db);
    const validCenterIds = new Set(INITIAL_LEARNING_CENTERS.map((lc) => lc.id));
    const lcSnap = await getDocs(collection(db, 'learning_centers'));
    lcSnap.docs.forEach((d) => {
      if (!validCenterIds.has(d.id)) {
        lcBatch.delete(d.ref);
      }
    });
    INITIAL_LEARNING_CENTERS.forEach((lc) => {
      lcBatch.set(doc(db, 'learning_centers', lc.id), lc, { merge: true });
    });
    await lcBatch.commit();

    try {
      localStorage.setItem('swis_dummy_data_purged_v2', new Date().toISOString());
    } catch {
      // ignore
    }

    return {
      success: true,
      message: `System successfully cleaned: ${deletedLogs} logs, ${deletedRequests} edit requests, and ${deletedAlerts} alerts purged. Exactly ${INITIAL_STUDENTS.length} official students and ${INITIAL_STAFF.length} staff members established.`,
      deletedLogs,
      deletedRequests,
      deletedAlerts,
      studentsCount: INITIAL_STUDENTS.length,
      staffCount: INITIAL_STAFF.length,
    };
  } catch (error: any) {
    console.error('Error cleaning system data:', error);
    return {
      success: false,
      message: error?.message || 'Failed to purge dummy data',
      deletedLogs: 0,
      deletedRequests: 0,
      deletedAlerts: 0,
      studentsCount: 0,
      staffCount: 0,
    };
  }
}

/**
 * Ensures removed monitors are purged and official staff, campuses, and learning centers
 * are synchronized in Firestore.
 */
export async function syncOfficialStaffAndCenters(): Promise<void> {
  try {
    const staffSnap = await getDocs(collection(db, 'staff'));
    const officialStaffIds = new Set(INITIAL_STAFF.map((s) => s.staff_id));
    
    // Purge removed monitors or non-official staff
    const rogueDocs = staffSnap.docs.filter((d) => {
      const data = d.data();
      const fullName = (data.full_name || '').trim();
      return (
        !officialStaffIds.has(d.id) ||
        REMOVED_STAFF_NAMES_OR_IDS.has(d.id) ||
        REMOVED_STAFF_NAMES_OR_IDS.has(fullName)
      );
    });

    if (rogueDocs.length > 0) {
      for (let i = 0; i < rogueDocs.length; i += 300) {
        const batch = writeBatch(db);
        rogueDocs.slice(i, i + 300).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }

    // Sync official staff
    const staffBatch = writeBatch(db);
    INITIAL_STAFF.forEach((s) => {
      staffBatch.set(doc(db, 'staff', s.staff_id), s, { merge: true });
    });
    await staffBatch.commit();

    // Sync official learning centers and remove obsolete centers
    const lcSnap = await getDocs(collection(db, 'learning_centers'));
    const validCenterIds = new Set(INITIAL_LEARNING_CENTERS.map((lc) => lc.id));
    const lcBatch = writeBatch(db);
    lcSnap.docs.forEach((d) => {
      if (!validCenterIds.has(d.id)) {
        lcBatch.delete(d.ref);
      }
    });
    INITIAL_LEARNING_CENTERS.forEach((lc) => {
      lcBatch.set(doc(db, 'learning_centers', lc.id), lc, { merge: true });
    });
    await lcBatch.commit();

    // Sync Campuses
    const campusBatch = writeBatch(db);
    INITIAL_CAMPUSES.forEach((c) => {
      campusBatch.set(doc(db, 'campuses', c.id), c, { merge: true });
    });
    await campusBatch.commit();

    // Ensure all existing students have their official supervisor and monitor
    const studentsSnap = await getDocs(collection(db, 'students'));
    if (!studentsSnap.empty) {
      for (let i = 0; i < studentsSnap.docs.length; i += 300) {
        const studentBatch = writeBatch(db);
        const chunk = studentsSnap.docs.slice(i, i + 300);
        let batchNeedsCommit = false;
        chunk.forEach((d) => {
          const data = d.data();
          let center = (data.learning_center_id || '').trim();
          let campus = (data.campus || '').trim();
          const updates: Record<string, any> = {};
          let needsUpdate = false;

          // Normalize center names
          if (center === 'Blooms and Archie') {
            center = 'Bloom and Archie';
            updates.learning_center_id = 'Bloom and Archie';
            needsUpdate = true;
          }

          // Ensure campus mapping
          if ((center === 'Bloom and Archie' || center === 'Bethany' || center === 'Antioch' || center === 'Azusa') && campus !== 'Hope Campus') {
            campus = 'Hope Campus';
            updates.campus = 'Hope Campus';
            needsUpdate = true;
          } else if ((center === 'Kayil' || center === 'Doxa' || center === 'Splendor') && campus !== 'Spring Campus') {
            campus = 'Spring Campus';
            updates.campus = 'Spring Campus';
            needsUpdate = true;
          }

          const targetSupervisor = getSupervisorForCenter(campus, center);
          const targetMonitor = getMonitorForCenter(campus, center);

          if (data.supervisor_name !== targetSupervisor) {
            updates.supervisor_name = targetSupervisor;
            needsUpdate = true;
          }
          if (data.monitor_name !== targetMonitor) {
            updates.monitor_name = targetMonitor;
            needsUpdate = true;
          }

          // Clean dummy parent / pickup data if synthetic driver / aunt or fake phone numbers are present
          if (
            data.parent_names?.includes('Mr. David & Mrs. Grace') ||
            (data.designated_pickups && data.designated_pickups.some((dp: any) => dp.relationship?.includes('Driver') || dp.name?.includes('Family Driver')))
          ) {
            updates.parent_names = '';
            updates.emergency_contact = '';
            updates.parent_info = null;
            updates.designated_pickups = [];
            needsUpdate = true;
          }

          if (needsUpdate) {
            studentBatch.update(d.ref, updates);
            batchNeedsCommit = true;
          }
        });
        if (batchNeedsCommit) {
          await studentBatch.commit();
        }
      }
    }
  } catch (err) {
    console.warn('Sync official staff and centers error:', err);
  }
}

/**
 * Remove all dummy parents, guardians, and dummy authorized pickup and drop-off persons
 * from all student records across Firestore.
 */
export async function purgeDummyParentAndPickupData(): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const studentsSnap = await getDocs(collection(db, 'students'));
    if (studentsSnap.empty) {
      return { success: true, message: 'No student records to clean.', count: 0 };
    }

    let cleanedCount = 0;
    for (let i = 0; i < studentsSnap.docs.length; i += 300) {
      const batch = writeBatch(db);
      const chunk = studentsSnap.docs.slice(i, i + 300);
      chunk.forEach((d) => {
        batch.update(d.ref, {
          parent_names: '',
          emergency_contact: '',
          parent_info: null,
          designated_pickups: [],
          updated_at: new Date().toISOString(),
        });
        cleanedCount++;
      });
      await batch.commit();
    }

    return {
      success: true,
      message: `Successfully removed all dummy parents, guardians, and authorized pickup/drop-off records across ${cleanedCount} students.`,
      count: cleanedCount,
    };
  } catch (err: any) {
    console.error('Error purging dummy parent data:', err);
    return {
      success: false,
      message: err?.message || 'Failed to purge dummy parent data.',
      count: 0,
    };
  }
}

/**
 * Force synchronization of the entire official school roster to Firestore.
 */
export async function forceSyncOfficialData(): Promise<{
  success: boolean;
  studentsCount: number;
  staffCount: number;
  campusesCount: number;
  learningCentersCount: number;
}> {
  const purgeRes = await purgeAllDummyDataAndCleanSystem();
  return {
    success: purgeRes.success,
    studentsCount: purgeRes.studentsCount,
    staffCount: purgeRes.staffCount,
    campusesCount: INITIAL_CAMPUSES.length,
    learningCentersCount: INITIAL_LEARNING_CENTERS.length,
  };
}

export async function seedDatabaseIfEmpty(): Promise<boolean> {
  try {
    const studentsSnap = await getDocs(collection(db, 'students'));

    if (studentsSnap.empty) {
      // 1. Populate official 74 students in safe batches
      for (let i = 0; i < INITIAL_STUDENTS.length; i += 300) {
        const batch = writeBatch(db);
        const chunk = INITIAL_STUDENTS.slice(i, i + 300);
        chunk.forEach((stu) => {
          batch.set(doc(db, 'students', stu.student_id), stu);
        });
        await batch.commit();
      }
    }

    // Always ensure official staff, campuses, and learning centers are in sync and removed monitors are deleted
    await syncOfficialStaffAndCenters();

    // Always ensure super user account exists
    await ensureSuperUserAccount();
    return studentsSnap.empty;
  } catch (err) {
    console.warn('Database initialization check:', err);
    return false;
  }
}
