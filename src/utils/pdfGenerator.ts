import jsPDF from 'jspdf';
import { Student, Staff } from '../types';

export interface CardItem {
  item: Student | Staff;
  type: 'Student' | 'Staff';
  qrDataUrl?: string;
  customLogoUrl?: string;
}

/**
 * Generates an individual ID Card PDF (Wallet/Lanyard Standard size: 85mm x 54mm)
 */
export const generateSingleCardPDF = (
  item: Student | Staff,
  type: 'Student' | 'Staff',
  qrDataUrl?: string,
  customLogoUrl?: string
): jsPDF => {
  const isStudent = type === 'Student';
  const student = isStudent ? (item as Student) : null;
  const staff = !isStudent ? (item as Staff) : null;

  const idCode = isStudent ? student!.student_id : staff!.staff_id;
  const pinCode = isStudent ? student!.pin_code : staff!.pin_code;
  const fullName = item.full_name;
  const roleOrGrade = isStudent ? student!.grade : staff!.role;
  const center = isStudent
    ? student!.learning_center_id
    : staff!.learning_center_id || 'Campus Wide';

  // Standard CR80 Card: 85.6mm x 54mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85.6, 54],
  });

  const cardWidth = 85.6;
  const cardHeight = 54;

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, cardWidth, cardHeight, 'F');

  // Outer Border
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.roundedRect(1, 1, cardWidth - 2, cardHeight - 2, 2.5, 2.5, 'S');

  // Header Bar
  // 1. Header background in School Maroon / Burgundy
  if (isStudent) {
    doc.setFillColor(139, 30, 47); // Maroon #8B1E2F
  } else {
    doc.setFillColor(88, 28, 135); // Purple #581C87
  }
  doc.rect(1, 1, cardWidth - 2, 11, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.8);
  doc.setFont('times', 'bold');
  doc.text('SPIRIT & WORD INT. SCHOOL', 4, 5);

  doc.setFontSize(4.8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(254, 240, 138); // Yellow-200
  doc.text('The Quick, The Sharp and The Clever', 4, 8);

  doc.setFontSize(4.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(
    isStudent
      ? (student?.enrollment_type === 'Boarding' ? 'OFFICIAL ID • BOARDING SECTION' : 'OFFICIAL STUDENT ID')
      : 'FACULTY & STAFF CREDENTIAL',
    4,
    10.5
  );

  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.text('2026–2027', cardWidth - 14, 5, { align: 'right' });

  // Optional Branded Logo in header
  const logoToUse = customLogoUrl || (typeof window !== 'undefined' ? localStorage.getItem('swis_custom_logo') : null);
  if (logoToUse) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(cardWidth - 12, 1.8, 8.5, 8.5, 1, 1, 'F');
      doc.addImage(logoToUse, 'PNG', cardWidth - 11.5, 2.3, 7.5, 7.5);
    } catch {
      // safe fallback
    }
  }

  // QR Code on Left
  const qrSize = 25;
  const qrX = 4;
  const qrY = 14;

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    } catch {
      // fallback placeholder
      doc.setFillColor(241, 245, 249);
      doc.rect(qrX, qrY, qrSize, qrSize, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(6);
      doc.text('QR CODE', qrX + qrSize / 2, qrY + qrSize / 2, { align: 'center' });
    }
  } else {
    doc.setFillColor(241, 245, 249);
    doc.rect(qrX, qrY, qrSize, qrSize, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6);
    doc.text('QR CODE', qrX + qrSize / 2, qrY + qrSize / 2, { align: 'center' });
  }

  // QR Frame
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(qrX, qrY, qrSize, qrSize, 'S');

  // Details on Right
  const textX = 32;
  let curY = 16;

  // Name
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const truncatedName = fullName.length > 20 ? fullName.substring(0, 19) + '…' : fullName;
  doc.text(truncatedName, textX, curY);

  curY += 4.5;
  doc.setTextColor(71, 85, 105); // slate-600
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${roleOrGrade} • ${center}`, textX, curY);

  curY += 4.5;
  // Security credentials badge box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(textX, curY, 49, 13, 1.5, 1.5, 'FD');

  // Inside credential box
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text('IDENTIFIER', textX + 2.5, curY + 4);
  doc.text('SECURITY PIN', textX + 26, curY + 4);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.setFont('courier', 'bold');
  doc.text(idCode, textX + 2.5, curY + 9.5);

  doc.setTextColor(isStudent ? 29 : 109, isStudent ? 78 : 40, isStudent ? 216 : 217); // blue or purple
  doc.setFontSize(9);
  doc.setFont('courier', 'bold');
  doc.text(pinCode, textX + 26, curY + 9.5);

  // Footer line
  curY = 49;
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(4.8);
  doc.setFont('helvetica', 'normal');
  const footerText = isStudent
    ? (student?.supervisor_name
        ? `Supervisor: ${student.supervisor_name} • SWIS Security`
        : `SWIS Official ID • ${student?.campus || 'Spirit & Word'}`)
    : `Official Personnel • Property of SWIS Academy`;
  doc.text(footerText, cardWidth / 2, curY, { align: 'center' });

  return doc;
};

/**
 * Generates a Multi-Card Printable Sheet PDF (Standard A4: 210mm x 297mm)
 * Fits 6 ID Cards per page (2 columns x 3 rows) with dashed cut guides!
 */
export const generateBatchCardsPDF = (
  items: CardItem[],
  options?: { title?: string }
): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // Grid setup: 2 columns x 3 rows = 6 cards per page
  const cols = 2;
  const rows = 3;
  const cardsPerPage = cols * rows;

  const cardWidth = 88;
  const cardHeight = 78;
  const startX = 13;
  const startY = 22;
  const gapX = 8;
  const gapY = 8;

  const totalPages = Math.ceil(items.length / cardsPerPage);

  for (let p = 0; p < totalPages; p++) {
    if (p > 0) {
      doc.addPage('a4', 'portrait');
    }

    // Page Header / Sheet Title
    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(options?.title || 'SWIS Academy — Official ID Cards Sheet', startX, 12);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Printable Roster Badges • Page ${p + 1} of ${totalPages} • Cut along dashed guidelines ✂`,
      startX,
      17
    );

    // Render cards for this page
    const startIndex = p * cardsPerPage;
    const pageItems = items.slice(startIndex, startIndex + cardsPerPage);

    pageItems.forEach((cardItem, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      const x = startX + col * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);

      drawSingleCardOnSheet(doc, cardItem, x, y, cardWidth, cardHeight);
    });

    // Page Footer
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `SWIS Track Automated School Attendance System • Academic Year 2026–2027`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  return doc;
};

/**
 * Draws an individual ID card with cut lines onto the sheet
 */
function drawSingleCardOnSheet(
  doc: jsPDF,
  cardItem: CardItem,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const { item, type, qrDataUrl } = cardItem;
  const isStudent = type === 'Student';
  const student = isStudent ? (item as Student) : null;
  const staff = !isStudent ? (item as Staff) : null;

  const idCode = isStudent ? student!.student_id : staff!.staff_id;
  const pinCode = isStudent ? student!.pin_code : staff!.pin_code;
  const fullName = item.full_name;
  const roleOrGrade = isStudent ? student!.grade : staff!.role;
  const center = isStudent
    ? student!.learning_center_id
    : staff!.learning_center_id || 'Staff Directory';

  // 1. Dashed Cutting Guide
  doc.setDrawColor(180, 190, 205);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.setLineWidth(0.2);
  doc.rect(x - 1, y - 1, w + 2, h + 2, 'S');
  doc.setLineDashPattern([], 0); // reset dash

  // 2. Card Background & Rounded Border
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, w, h, 2, 2, 'S');

  // 3. Top Banner
  if (isStudent) {
    doc.setFillColor(139, 30, 47); // Maroon #8B1E2F
  } else {
    doc.setFillColor(88, 28, 135); // purple-900
  }
  doc.rect(x, y, w, 13, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('times', 'bold');
  doc.text('SPIRIT & WORD INT. SCHOOL', x + 3.5, y + 5.5);

  doc.setFontSize(5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(254, 240, 138); // Yellow-200
  doc.text('The Quick, The Sharp and The Clever', x + 3.5, y + 9);

  doc.setFontSize(4.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(
    isStudent
      ? (student?.enrollment_type === 'Boarding' ? 'OFFICIAL ID • BOARDING SECTION' : 'OFFICIAL STUDENT ID')
      : 'FACULTY & STAFF CREDENTIAL',
    x + 3.5,
    y + 12
  );

  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.text('2026–2027', x + w - 16, y + 5.5, { align: 'right' });

  // Optional Branded Logo in header
  const sheetLogoToUse = cardItem.customLogoUrl || (typeof window !== 'undefined' ? localStorage.getItem('swis_custom_logo') : null);
  if (sheetLogoToUse) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x + w - 14, y + 1.8, 10, 10, 1, 1, 'F');
      doc.addImage(sheetLogoToUse, 'PNG', x + w - 13.5, y + 2.3, 9, 9);
    } catch {
      // safe fallback
    }
  }

  // 4. Content Area
  // Left Column: QR Code
  const qrSize = 30;
  const qrX = x + 3.5;
  const qrY = y + 17;

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    } catch {
      doc.setFillColor(241, 245, 249);
      doc.rect(qrX, qrY, qrSize, qrSize, 'F');
    }
  } else {
    doc.setFillColor(241, 245, 249);
    doc.rect(qrX, qrY, qrSize, qrSize, 'F');
  }

  // QR Border
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.rect(qrX, qrY, qrSize, qrSize, 'S');

  // Right Column: Identity Details
  const infoX = x + 37;
  let curY = y + 19;

  // Name
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  const displayName = fullName.length > 20 ? fullName.substring(0, 19) + '…' : fullName;
  doc.text(displayName, infoX, curY);

  curY += 4.5;
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(`${roleOrGrade}`, infoX, curY);

  curY += 3.8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  const displayCenter = center.length > 24 ? center.substring(0, 23) + '…' : center;
  doc.text(displayCenter, infoX, curY);

  // Security Credentials Box
  curY += 4.5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(infoX, curY, w - 40.5, 16, 1.5, 1.5, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text('SYSTEM ID', infoX + 2.5, curY + 4.5);
  doc.text('MANUAL PIN', infoX + 24, curY + 4.5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.setFont('courier', 'bold');
  doc.text(idCode, infoX + 2.5, curY + 11);

  doc.setTextColor(isStudent ? 29 : 109, isStudent ? 78 : 40, isStudent ? 216 : 217);
  doc.setFontSize(9.5);
  doc.setFont('courier', 'bold');
  doc.text(pinCode, infoX + 24, curY + 11.5);

  // Bottom Card Bar
  const bottomY = y + 54;
  doc.setDrawColor(241, 245, 249);
  doc.line(x + 2, bottomY, x + w - 2, bottomY);

  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);

  if (isStudent) {
    if (student?.supervisor_name) {
      doc.text(`Supervisor: ${student.supervisor_name}`, x + 3.5, y + 60);
    } else {
      doc.text(`Monitor: ${student?.monitor_name || 'Assigned Staff'}`, x + 3.5, y + 60);
    }
    doc.text(`Emergency: ${student!.emergency_contact || 'Campus Office'}`, x + 3.5, y + 64.5);
    doc.text(`Parents: ${student!.parent_names || 'N/A'}`, x + 3.5, y + 69);
  } else {
    doc.text(`Contact: ${staff!.phone || 'Campus Office'}`, x + 3.5, y + 60);
    doc.text(`Email: ${staff!.email || 'N/A'}`, x + 3.5, y + 64.5);
    doc.text(`Role: Authorized School Staff`, x + 3.5, y + 69);
  }

  // Barcode decoration strip
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('SCAN OR ENTER PIN AT KIOSK', x + w - 3.5, y + 74, { align: 'right' });
}
