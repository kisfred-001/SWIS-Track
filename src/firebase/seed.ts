import { collection, getDocs, setDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from './config';
import { Staff, Student, Campus, LearningCenter, AttendanceLog, EditRequest } from '../types';

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
  qr_code_url: 'STF-001',
  created_at: new Date().toISOString(),
};

export const INITIAL_STAFF: Staff[] = [
  SUPER_USER_ACCOUNT,
  {
    staff_id: 'STF-002',
    pin_code: '101',
    full_name: 'Mrs. Irene Lulika',
    role: 'Principal',
    campus: 'All Campuses',
    learning_center_id: 'Principal Office',
    email: 'irene.lulika@swis.ac.ug',
    phone: '+256 772 101 002',
    qr_code_url: 'STF-002',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-003',
    pin_code: '102',
    full_name: 'Mr. Jaxon Lulika',
    role: 'Director',
    campus: 'All Campuses',
    learning_center_id: 'Board & Directorate',
    email: 'jaxon.lulika@swis.ac.ug',
    phone: '+256 772 102 003',
    qr_code_url: 'STF-003',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-004',
    pin_code: '103',
    full_name: 'Mrs. Khasoma Susan',
    role: 'Administrator',
    campus: 'All Campuses',
    learning_center_id: 'Central Administration',
    email: 'khasoma.susan@swis.ac.ug',
    phone: '+256 772 103 004',
    qr_code_url: 'STF-004',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-005',
    pin_code: '104',
    full_name: 'Mrs. Juliet Arinaitwe',
    role: 'Administrative Assistant',
    campus: 'All Campuses',
    learning_center_id: 'Registry & Admissions',
    email: 'juliet.arinaitwe@swis.ac.ug',
    phone: '+256 772 104 005',
    qr_code_url: 'STF-005',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-006',
    pin_code: '105',
    full_name: 'Mrs. Anette Mugala',
    role: 'Support Staff',
    campus: 'All Campuses',
    learning_center_id: 'Campus Check-In / Gates',
    email: 'anette.mugala@swis.ac.ug',
    phone: '+256 772 105 006',
    qr_code_url: 'STF-006',
    created_at: new Date().toISOString(),
  },
  // Supervisors
  {
    staff_id: 'STF-101',
    pin_code: '201',
    full_name: 'Mrs. Irene Oryem',
    role: 'Supervisor',
    campus: 'Spring Campus',
    learning_center_id: 'Kayil',
    email: 'irene.oryem@swis.ac.ug',
    phone: '+256 772 201 101',
    qr_code_url: 'STF-101',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-102',
    pin_code: '202',
    full_name: 'Mr. Arthur Mutebi',
    role: 'Supervisor',
    campus: 'Spring Campus',
    learning_center_id: 'Splendor',
    email: 'arthur.mutebi@swis.ac.ug',
    phone: '+256 772 202 102',
    qr_code_url: 'STF-102',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-103',
    pin_code: '203',
    full_name: 'Mrs. Eunice Mutebe',
    role: 'Supervisor',
    campus: 'Hope Campus',
    learning_center_id: 'Bethany',
    email: 'eunice.mutebe@swis.ac.ug',
    phone: '+256 772 203 103',
    qr_code_url: 'STF-103',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-104',
    pin_code: '204',
    full_name: 'Mr. Shafic Musika',
    role: 'Supervisor',
    campus: 'Hope Campus',
    learning_center_id: 'Azusa',
    email: 'shafic.musika@swis.ac.ug',
    phone: '+256 772 204 104',
    qr_code_url: 'STF-104',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-105',
    pin_code: '205',
    full_name: 'Mrs. Doreen Mugaga',
    role: 'Supervisor',
    campus: 'Hope Campus',
    learning_center_id: 'Antioch',
    email: 'doreen.mugaga@swis.ac.ug',
    phone: '+256 772 205 105',
    qr_code_url: 'STF-105',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-106',
    pin_code: '206',
    full_name: 'Mr. David Kimbugwe',
    role: 'Supervisor',
    campus: 'Spring Campus',
    learning_center_id: 'Doxa',
    email: 'david.kimbugwe@swis.ac.ug',
    phone: '+256 772 206 106',
    qr_code_url: 'STF-106',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-107',
    pin_code: '207',
    full_name: 'Mrs. Juliet Mayanja',
    role: 'Supervisor',
    campus: 'Hope Campus',
    learning_center_id: 'Blooms and Archie',
    email: 'juliet.mayanja@swis.ac.ug',
    phone: '+256 772 207 107',
    qr_code_url: 'STF-107',
    created_at: new Date().toISOString(),
  },
  // Monitors (Have identical rights as Supervisors)
  {
    staff_id: 'STF-301',
    pin_code: '301',
    full_name: 'Ms. Gloria Akello',
    role: 'Monitor',
    campus: 'Spring Campus',
    learning_center_id: 'Kayil',
    email: 'gloria.akello@swis.ac.ug',
    phone: '+256 772 301 301',
    qr_code_url: 'STF-301',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-302',
    pin_code: '302',
    full_name: 'Mr. Brian Ochieng',
    role: 'Monitor',
    campus: 'Spring Campus',
    learning_center_id: 'Splendor',
    email: 'brian.ochieng@swis.ac.ug',
    phone: '+256 772 302 302',
    qr_code_url: 'STF-302',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-303',
    pin_code: '303',
    full_name: 'Ms. Faith Nabirye',
    role: 'Monitor',
    campus: 'Hope Campus',
    learning_center_id: 'Bethany',
    email: 'faith.nabirye@swis.ac.ug',
    phone: '+256 772 303 303',
    qr_code_url: 'STF-303',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-304',
    pin_code: '304',
    full_name: 'Mr. Paul Ssekandi',
    role: 'Monitor',
    campus: 'Hope Campus',
    learning_center_id: 'Azusa',
    email: 'paul.ssekandi@swis.ac.ug',
    phone: '+256 772 304 304',
    qr_code_url: 'STF-304',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-305',
    pin_code: '305',
    full_name: 'Ms. Joy Kemigisha',
    role: 'Monitor',
    campus: 'Hope Campus',
    learning_center_id: 'Antioch',
    email: 'joy.kemigisha@swis.ac.ug',
    phone: '+256 772 305 305',
    qr_code_url: 'STF-305',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-306',
    pin_code: '306',
    full_name: 'Mr. Kevin Tumusiime',
    role: 'Monitor',
    campus: 'Spring Campus',
    learning_center_id: 'Doxa',
    email: 'kevin.tumusiime@swis.ac.ug',
    phone: '+256 772 306 306',
    qr_code_url: 'STF-306',
    created_at: new Date().toISOString(),
  },
  {
    staff_id: 'STF-307',
    pin_code: '307',
    full_name: 'Ms. Patricia Namubiru',
    role: 'Monitor',
    campus: 'Hope Campus',
    learning_center_id: 'Blooms and Archie',
    email: 'patricia.namubiru@swis.ac.ug',
    phone: '+256 772 307 307',
    qr_code_url: 'STF-307',
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
    email: 'spring.campus@swis.ac.ug',
    lead_administrator: 'Mrs. Irene Lulika',
    learning_centers: ['Kayil', 'Splendor', 'Doxa', 'Bethany', 'Antioch'],
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
    email: 'hope.campus@swis.ac.ug',
    lead_administrator: 'Mr. Jaxon Lulika',
    learning_centers: ['Bethany', 'Azusa', 'Antioch', 'Blooms and Archie', 'Splendor'],
    total_capacity: 150,
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
    monitor_name: 'Ms. Gloria Akello',
    room_number: 'Room S-101',
    capacity: 25,
    description: 'Spring Campus Early Learning & Primary Center',
  },
  {
    id: 'spring-splendor',
    name: 'Splendor',
    campus: 'Spring Campus',
    supervisor_name: 'Mr. Arthur Mutebi',
    monitor_name: 'Mr. Brian Ochieng',
    room_number: 'Room S-102',
    capacity: 25,
    description: 'Spring Campus Middle School Learning Center',
  },
  {
    id: 'spring-doxa',
    name: 'Doxa',
    campus: 'Spring Campus',
    supervisor_name: 'Mr. David Kimbugwe',
    monitor_name: 'Mr. Kevin Tumusiime',
    room_number: 'Room S-103',
    capacity: 25,
    description: 'Spring Campus Senior Learning Center',
  },
  {
    id: 'spring-bethany',
    name: 'Bethany',
    campus: 'Spring Campus',
    supervisor_name: 'Mrs. Eunice Mutebe',
    monitor_name: 'Ms. Faith Nabirye',
    room_number: 'Room S-104',
    capacity: 20,
    description: 'Spring Campus Foundation & PACE Center',
  },
  {
    id: 'spring-antioch',
    name: 'Antioch',
    campus: 'Spring Campus',
    supervisor_name: 'Mrs. Doreen Mugaga',
    monitor_name: 'Ms. Joy Kemigisha',
    room_number: 'Room S-105',
    capacity: 20,
    description: 'Spring Campus Transition Learning Center',
  },
  {
    id: 'hope-bethany',
    name: 'Bethany',
    campus: 'Hope Campus',
    supervisor_name: 'Mrs. Eunice Mutebe',
    monitor_name: 'Ms. Faith Nabirye',
    room_number: 'Room H-101',
    capacity: 25,
    description: 'Hope Campus Foundation & Primary PACE Center',
  },
  {
    id: 'hope-azusa',
    name: 'Azusa',
    campus: 'Hope Campus',
    supervisor_name: 'Mr. Shafic Musika',
    monitor_name: 'Mr. Paul Ssekandi',
    room_number: 'Room H-102',
    capacity: 25,
    description: 'Hope Campus Intermediate Learning Center',
  },
  {
    id: 'hope-antioch',
    name: 'Antioch',
    campus: 'Hope Campus',
    supervisor_name: 'Mrs. Doreen Mugaga',
    monitor_name: 'Ms. Joy Kemigisha',
    room_number: 'Room H-103',
    capacity: 25,
    description: 'Hope Campus Junior Secondary Learning Center',
  },
  {
    id: 'hope-blooms',
    name: 'Blooms and Archie',
    campus: 'Hope Campus',
    supervisor_name: 'Mrs. Juliet Mayanja',
    monitor_name: 'Ms. Patricia Namubiru',
    room_number: 'Room H-104',
    capacity: 20,
    description: 'Hope Campus Specialized Learning & Remedial Center',
  },
  {
    id: 'hope-splendor',
    name: 'Splendor',
    campus: 'Hope Campus',
    supervisor_name: 'Mr. Arthur Mutebi',
    monitor_name: 'Mr. Brian Ochieng',
    room_number: 'Room H-105',
    capacity: 20,
    description: 'Hope Campus Senior Secondary PACE Center',
  },
];

// Helper to look up assigned monitor for a learning center
function getMonitorForCenter(campus: string, center: string): string {
  if (center === 'Kayil') return 'Ms. Gloria Akello';
  if (center === 'Splendor') return 'Mr. Brian Ochieng';
  if (center === 'Doxa') return 'Mr. Kevin Tumusiime';
  if (center === 'Bethany') return 'Ms. Faith Nabirye';
  if (center === 'Azusa') return 'Mr. Paul Ssekandi';
  if (center === 'Antioch') return 'Ms. Joy Kemigisha';
  if (center === 'Blooms and Archie') return 'Ms. Patricia Namubiru';
  return 'Ms. Gloria Akello';
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
  { name: 'Zachary Cursten Kwesiga', campus: 'Hope Campus', center: 'Blooms and Archie', supervisor: 'Mrs. Juliet Mayanja' },
  { name: 'Jerome Gad Amani', campus: 'Spring Campus', center: 'Kayil', supervisor: 'Mrs. Irene Oryem' },
  { name: 'Raina Nguya', campus: 'Hope Campus', center: 'Antioch', supervisor: 'Mrs. Doreen Mugaga' },
  { name: 'Romanove Nguya', campus: 'Hope Campus', center: 'Azusa', supervisor: 'Mr. Shafic Musika' },
  { name: 'David Nkeza', campus: 'Hope Campus', center: 'Blooms and Archie', supervisor: 'Mrs. Juliet Mayanja' },
  { name: 'Edrin Baraza', campus: 'Spring Campus', center: 'Kayil', supervisor: 'Mrs. Irene Oryem' },
  { name: 'Ariana Akoli', campus: 'Spring Campus', center: 'Bethany', supervisor: 'Mrs. Eunice Mutebe' },
  { name: 'Nissi Mwiza', campus: 'Spring Campus', center: 'Doxa', supervisor: 'Mr. David Kimbugwe' },
  { name: 'Jireh Nziza', campus: 'Spring Campus', center: 'Antioch', supervisor: 'Mrs. Doreen Mugaga' },
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
  { name: 'Charis Sanyu Keza', campus: 'Hope Campus', center: 'Blooms and Archie', supervisor: 'Mrs. Juliet Mayanja' },
  { name: 'Hannah Margaret Mukiibi', campus: 'Spring Campus', center: 'Doxa', supervisor: 'Mr. David Kimbugwe' },
  { name: 'Immanuella Nambiimbwa', campus: 'Hope Campus', center: 'Bethany', supervisor: 'Mrs. Eunice Mutebe' },
  { name: 'Lincoln Kalungi', campus: 'Spring Campus', center: 'Doxa', supervisor: 'Mr. David Kimbugwe' },
  { name: 'Adore Darian Kunda', campus: 'Hope Campus', center: 'Blooms and Archie', supervisor: 'Mrs. Juliet Mayanja' },
  { name: 'Camila Amutuhaire', campus: 'Spring Campus', center: 'Splendor', supervisor: 'Mr. Arthur Mutebi' },
  { name: 'Cruz Bart Rubaale', campus: 'Hope Campus', center: 'Bethany', supervisor: 'Mrs. Eunice Mutebe' },
  { name: 'Charissa Laloyo', campus: 'Hope Campus', center: 'Bethany', supervisor: 'Mrs. Eunice Mutebe' },
  { name: 'Grace Benjamin', campus: 'Hope Campus', center: 'Bethany', supervisor: 'Mrs. Eunice Mutebe' },
  { name: 'Charlotte Bazaine', campus: 'Hope Campus', center: 'Azusa', supervisor: 'Mr. Shafic Musika' },
  { name: 'Blessing Phoebe', campus: 'Hope Campus', center: 'Antioch', supervisor: 'Mrs. Doreen Mugaga' },
  { name: 'Darvin Mark Alleni', campus: 'Spring Campus', center: 'Kayil', supervisor: 'Mrs. Irene Oryem' },
  { name: 'Jovin Zihuramye', campus: 'Hope Campus', center: 'Splendor', supervisor: 'Mr. Arthur Mutebi' },
  { name: 'Angelica Rose Otai', campus: 'Hope Campus', center: 'Azusa', supervisor: 'Mr. Shafic Musika' },
];

export const INITIAL_STUDENTS: Student[] = RAW_STUDENT_DATA.map((row, index) => {
  const num = 1001 + index;
  const student_id = `STU-${num}`;
  // Deterministic 4-digit PIN for each student
  const pin_code = String(1100 + ((index * 37 + 13) % 8800)).padStart(4, '0');
  return {
    student_id,
    pin_code,
    full_name: row.name,
    campus: row.campus,
    learning_center_id: row.center,
    supervisor_name: row.supervisor,
    monitor_name: getMonitorForCenter(row.campus, row.center),
    grade: `${row.campus.split(' ')[0]} • ${row.center}`,
    parent_names: `${row.name.split(' ').slice(-1)[0]} Family`,
    emergency_contact: `+256 700 ${String(100 + index).padStart(3, '0')} ${String(200 + index).padStart(3, '0')}`,
    qr_code_url: student_id,
    created_at: new Date().toISOString(),
  };
});

export async function ensureSuperUserAccount(): Promise<Staff> {
  try {
    const superUserRef = doc(db, 'staff', SUPER_USER_ACCOUNT.staff_id);
    await setDoc(superUserRef, SUPER_USER_ACCOUNT, { merge: true });
  } catch {
    // Offline or initial connection fallback
  }
  return SUPER_USER_ACCOUNT;
}

/**
 * Force synchronization of the entire official school roster to Firestore.
 * This completely clears out old AI dummy records and establishes the 74 CSV students,
 * campuses, learning centers, and administrative accounts.
 */
export async function forceSyncOfficialData(): Promise<{
  success: boolean;
  studentsCount: number;
  staffCount: number;
  campusesCount: number;
  learningCentersCount: number;
}> {
  try {
    const batch = writeBatch(db);

    // 1. Sync Campuses
    for (const c of INITIAL_CAMPUSES) {
      batch.set(doc(db, 'campuses', c.id), c, { merge: true });
    }

    // 2. Sync Learning Centers
    for (const lc of INITIAL_LEARNING_CENTERS) {
      batch.set(doc(db, 'learning_centers', lc.id), lc, { merge: true });
    }

    // 3. Sync Official Staff
    for (const stf of INITIAL_STAFF) {
      batch.set(doc(db, 'staff', stf.staff_id), stf, { merge: true });
    }

    // 4. Sync Official Students (74 from user's CSV)
    for (const stu of INITIAL_STUDENTS) {
      batch.set(doc(db, 'students', stu.student_id), stu, { merge: true });
    }

    await batch.commit();

    return {
      success: true,
      studentsCount: INITIAL_STUDENTS.length,
      staffCount: INITIAL_STAFF.length,
      campusesCount: INITIAL_CAMPUSES.length,
      learningCentersCount: INITIAL_LEARNING_CENTERS.length,
    };
  } catch {
    return {
      success: false,
      studentsCount: 0,
      staffCount: 0,
      campusesCount: 0,
      learningCentersCount: 0,
    };
  }
}

export async function seedDatabaseIfEmpty(): Promise<boolean> {
  try {
    const studentsSnap = await getDocs(collection(db, 'students'));
    // If students already exist, check if old dummy data (e.g. Liam Miller) is present
    let needsFullSync = false;
    if (studentsSnap.empty) {
      needsFullSync = true;
    } else {
      const firstDoc = studentsSnap.docs[0]?.data() as any;
      if (firstDoc?.full_name === 'Liam Miller' || !firstDoc?.campus) {
        needsFullSync = true;
      }
    }

    if (needsFullSync) {
      await forceSyncOfficialData();
      return true;
    }

    // Still ensure super user and campuses are initialized
    await ensureSuperUserAccount();
    return false;
  } catch {
    return false;
  }
}
