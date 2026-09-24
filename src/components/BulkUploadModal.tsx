import React, { useState, useRef } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  X,
  FileText,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ClipboardPaste,
  Filter,
} from 'lucide-react';
import { Student } from '../types';
import { sound } from '../utils/sound';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedStudentRow {
  student_id: string;
  full_name: string;
  campus: string;
  grade: string;
  learning_center_id: string;
  supervisor_name: string;
  monitor_name: string;
  parent_names: string;
  emergency_contact: string;
  pin_code: string;
  isExisting: boolean;
  currentRecord?: Student;
  isValid: boolean;
  validationError?: string;
  selected: boolean;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose }) => {
  const { students, bulkSaveStudents } = useAttendance();
  const { currentUser, isTeacherOnly } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    created: number;
    updated: number;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  // Existing student map by ID and by lowercase name for smart match
  const studentByIdMap = new Map<string, Student>();
  const studentByNameMap = new Map<string, Student>();
  students.forEach((s) => {
    studentByIdMap.set(s.student_id.trim().toUpperCase(), s);
    studentByNameMap.set(s.full_name.trim().toLowerCase(), s);
  });

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const headers = [
      'student_id',
      'full_name',
      'grade',
      'learning_center_id',
      'supervisor_name',
      'monitor_name',
      'parent_names',
      'emergency_contact',
      'pin_code',
    ];

    const sampleRows = [
      [
        'STU-1001',
        'Ariana Akoli',
        'Hope • Bethany',
        'Bethany',
        'Mrs. Eunice Mutebe',
        'Mrs. Joan Nandhego',
        'Mr. & Mrs. Akoli',
        '+256 700 123 456',
        '1001',
      ],
      [
        'STU-1002',
        'Jerome Gad Amani',
        'Spring • Kayil',
        'Kayil',
        'Mrs. Irene Oryem',
        '',
        'Mr. & Mrs. Amani',
        '+256 700 234 567',
        '1002',
      ],
      [
        'STU-1003',
        'Nissi Mwiza',
        'Spring • Doxa',
        'Doxa',
        'Mr. David Kimbugwe',
        '',
        'Mr. & Mrs. Mwiza',
        '+256 700 345 678',
        '1003',
      ],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...sampleRows.map((row) =>
          row.map((val) => (val.includes(',') ? `"${val}"` : val)).join(',')
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'SWIS_Track_Student_Roster_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Robust CSV parser supporting quotes & escaped quotes
  const parseCSVText = (text: string) => {
    setParsingError(null);
    setImportResult(null);

    const cleanText = text.trim();
    if (!cleanText) {
      setParsingError('The uploaded CSV file is empty.');
      return;
    }

    // Split rows taking quotes into account
    const lines: string[] = [];
    let currentLine = '';
    let inQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        currentLine += char;
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }
        currentLine = '';
        if (char === '\r' && cleanText[i + 1] === '\n') {
          i++; // skip \n
        }
      } else {
        currentLine += char;
      }
    }
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    if (lines.length < 2) {
      setParsingError('CSV must include a header row and at least one student data row.');
      return;
    }

    // Parse a line into columns handling commas and quotes
    const parseLineToCols = (line: string): string[] => {
      const cols: string[] = [];
      let cur = '';
      let inside = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inside && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inside = !inside;
          }
        } else if (c === ',' && !inside) {
          cols.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      cols.push(cur.trim());
      return cols;
    };

    const headerCols = parseLineToCols(lines[0]).map((h) =>
      h.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    );

    // Flexible column index resolvers
    const findIndex = (possibleNames: string[]) => {
      for (const name of possibleNames) {
        const idx = headerCols.findIndex(
          (h) => h === name || h.replace(/_/g, '') === name.replace(/_/g, '')
        );
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const idIdx = findIndex(['student_id', 'id', 'studentid', 'student_code', 'code']);
    const nameIdx = findIndex(['full_name', 'name', 'student_name', 'studentname', 'fullname']);
    const gradeIdx = findIndex(['grade', 'grade_level', 'class', 'year']);
    const campusIdx = findIndex(['campus', 'school_campus', 'branch', 'location']);
    const centerIdx = findIndex([
      'learning_center_id',
      'learning_center',
      'classroom',
      'center',
      'room',
    ]);
    const supervisorIdx = findIndex([
      'supervisor_name',
      'supervisor',
      'teacher',
      'lead_teacher',
    ]);
    const monitorIdx = findIndex(['monitor_name', 'monitor', 'assistant', 'aide']);
    const parentsIdx = findIndex(['parent_names', 'parents', 'parent', 'guardian', 'guardians']);
    const emergencyIdx = findIndex([
      'emergency_contact',
      'emergency',
      'phone',
      'contact',
      'parent_phone',
    ]);
    const pinIdx = findIndex(['pin_code', 'pin', 'pincode', 'code', 'passcode']);

    if (nameIdx === -1) {
      setParsingError(
        'CSV must contain a column for Student Name (e.g., "full_name", "student_name", or "name").'
      );
      return;
    }

    const rows: ParsedStudentRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseLineToCols(lines[i]);
      if (cols.every((c) => !c.trim())) continue; // skip blank line

      const rawName = cols[nameIdx] || '';
      if (!rawName.trim()) {
        continue;
      }

      let rawId = idIdx !== -1 && cols[idIdx] ? cols[idIdx].trim().toUpperCase() : '';
      const rawGrade = gradeIdx !== -1 && cols[gradeIdx] ? cols[gradeIdx].trim() : 'Grade 1';
      let rawCenter =
        centerIdx !== -1 && cols[centerIdx]
          ? cols[centerIdx].trim()
          : (isTeacherOnly && currentUser?.learning_center_id) || 'Kayil';

      // Map obsolete or variations of center names
      if (rawCenter.toLowerCase().includes('bethany')) rawCenter = 'Bethany';
      else if (rawCenter.toLowerCase().includes('kayil')) rawCenter = 'Kayil';
      else if (rawCenter.toLowerCase().includes('doxa')) rawCenter = 'Doxa';
      else if (rawCenter.toLowerCase().includes('splendor')) rawCenter = 'Splendor';
      else if (rawCenter.toLowerCase().includes('antioch')) rawCenter = 'Antioch';
      else if (rawCenter.toLowerCase().includes('azusa')) rawCenter = 'Azusa';
      else rawCenter = 'Kayil';

      // Official supervisors by learning center
      let rawSupervisor =
        rawCenter === 'Kayil'
          ? 'Mrs. Irene Oryem'
          : rawCenter === 'Doxa'
          ? 'Mr. David Kimbugwe'
          : rawCenter === 'Splendor'
          ? 'Mr. Arthur Mutebi'
          : rawCenter === 'Bethany'
          ? 'Mrs. Eunice Mutebe'
          : rawCenter === 'Antioch'
          ? 'Mrs. Doreen Mugaga'
          : rawCenter === 'Azusa'
          ? 'Mr. Shafic Musika'
          : '';

      if (supervisorIdx !== -1 && cols[supervisorIdx]) {
        rawSupervisor = cols[supervisorIdx].trim() || rawSupervisor;
      }

      // Mrs. Joan Nandhego is the ONLY monitor in SWIS, assigned exclusively to Bethany
      let rawMonitor = rawCenter === 'Bethany' ? 'Mrs. Joan Nandhego' : '';
      if (monitorIdx !== -1 && cols[monitorIdx] && rawCenter === 'Bethany') {
        rawMonitor = cols[monitorIdx].trim() || rawMonitor;
      }

      const rawParents = parentsIdx !== -1 && cols[parentsIdx] ? cols[parentsIdx].trim() : 'Parents';
      const rawEmergency = emergencyIdx !== -1 && cols[emergencyIdx] ? cols[emergencyIdx].trim() : '';
      let rawPin = pinIdx !== -1 && cols[pinIdx] ? cols[pinIdx].trim() : '';

      // Check if this student already exists in SWIS Track by ID or by name
      let currentRecord = rawId ? studentByIdMap.get(rawId) : undefined;
      if (!currentRecord) {
        currentRecord = studentByNameMap.get(rawName.trim().toLowerCase());
        if (currentRecord && !rawId) {
          rawId = currentRecord.student_id;
        }
      }

      const isExisting = !!currentRecord;

      // Bethany is strictly Hope Campus
      let rawCampus =
        rawCenter === 'Bethany' || rawCenter === 'Antioch' || rawCenter === 'Azusa'
          ? 'Hope Campus'
          : 'Spring Campus';

      // Assign student_id if empty
      if (!rawId) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        rawId = `STU-${randomNum}`;
      }

      // Assign 4-digit PIN if empty
      if (!rawPin || rawPin.length < 4) {
        rawPin = currentRecord?.pin_code || Math.floor(1000 + Math.random() * 9000).toString();
      }

      rows.push({
        student_id: rawId,
        full_name: rawName.trim(),
        campus: rawCampus,
        grade: rawGrade,
        learning_center_id: rawCenter,
        supervisor_name: rawSupervisor,
        monitor_name: rawMonitor,
        parent_names: rawParents,
        emergency_contact: rawEmergency,
        pin_code: rawPin,
        isExisting,
        currentRecord,
        isValid: true,
        selected: true,
      });
    }

    if (rows.length === 0) {
      setParsingError('No valid student rows could be parsed from the file.');
      return;
    }

    setParsedRows(rows);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSVText(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('text')) {
      setParsingError('Please upload a valid .csv spreadsheet file.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSVText(text);
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      setParsingError('Please paste CSV text or table rows from your spreadsheet.');
      return;
    }
    setFileName('Pasted CSV Data');
    parseCSVText(pastedText);
  };

  const toggleRowSelection = (index: number) => {
    setParsedRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, selected: !row.selected } : row))
    );
  };

  const toggleAllRows = (select: boolean) => {
    setParsedRows((prev) => prev.map((row) => ({ ...row, selected: select })));
  };

  const handleCommitImport = async () => {
    const selectedRows = parsedRows.filter((r) => r.selected && r.isValid);
    if (selectedRows.length === 0) {
      setParsingError('Please select at least one valid student record to import.');
      return;
    }

    setIsProcessing(true);
    setParsingError(null);

    // Format for bulkSaveStudents
    const studentPayloads = selectedRows.map((r) => ({
      id: r.student_id,
      student_id: r.student_id,
      full_name: r.full_name,
      campus: r.campus || 'Spring Campus',
      grade: r.grade,
      learning_center_id: r.learning_center_id,
      supervisor_name: r.supervisor_name,
      monitor_name: r.monitor_name,
      parent_names: r.parent_names,
      emergency_contact: r.emergency_contact,
      pin_code: r.pin_code,
      qr_code_url: `SWIS-STU-${r.student_id}-${r.pin_code}`,
      created_at: r.currentRecord?.created_at || new Date().toISOString(),
    }));

    const result = await bulkSaveStudents(studentPayloads);
    setIsProcessing(false);

    if (result.success) {
      setImportResult({
        success: true,
        created: result.created,
        updated: result.updated,
        message: result.message,
      });
      sound.playSuccessChime();
    } else {
      setParsingError(result.message);
      sound.playError();
    }
  };

  const selectedCount = parsedRows.filter((r) => r.selected).length;
  const updatesCount = parsedRows.filter((r) => r.selected && r.isExisting).length;
  const createsCount = parsedRows.filter((r) => r.selected && !r.isExisting).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base">Bulk Student Roster Import</h3>
                <span className="bg-blue-500/30 text-blue-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
                  CSV Transitions
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Add or update multiple students simultaneously for semester rollovers or grade promotions.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold border border-white/20 transition"
              title="Download CSV format template"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV Template</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Success Banner */}
          {importResult && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-start space-x-3 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-sm">Roster Import Completed Successfully!</h4>
                <p className="text-xs text-emerald-700 mt-1">
                  {importResult.message}
                </p>
                <div className="flex items-center space-x-3 mt-2 text-xs font-semibold">
                  <span className="bg-emerald-200/60 px-2 py-0.5 rounded text-emerald-800">
                    +{importResult.created} New Students Added
                  </span>
                  <span className="bg-blue-100 px-2 py-0.5 rounded text-blue-800">
                    {importResult.updated} Existing Students Updated
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
              >
                Done
              </button>
            </div>
          )}

          {/* Error Banner */}
          {parsingError && (
            <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 flex items-start space-x-2.5 text-rose-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{parsingError}</span>
            </div>
          )}

          {/* Upload or Paste Options if not yet parsed or to reset */}
          {parsedRows.length === 0 && !importResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Upload Method:
                </span>
                <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setPasteMode(false)}
                    className={`px-3 py-1 rounded-md transition font-medium ${
                      !pasteMode ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    File Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasteMode(true)}
                    className={`px-3 py-1 rounded-md transition font-medium ${
                      pasteMode ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Paste CSV / Table
                  </button>
                </div>
              </div>

              {!pasteMode ? (
                /* Drag and drop upload box */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                    <Upload className="w-7 h-7 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Click to choose a CSV file or drag & drop here
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Supports .csv files exported from Excel, Google Sheets, or student databases.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                    <span>Columns:</span>
                    <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">student_id</code>
                    <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">full_name</code>
                    <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">grade</code>
                    <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">learning_center_id</code>
                  </div>
                </div>
              ) : (
                /* Paste text box */
                <div className="space-y-2">
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`student_id,full_name,grade,learning_center_id,supervisor_name,monitor_name,parent_names,emergency_contact,pin_code\nSTU-1001,Liam Henderson,Grade 5,Learning Center Alpha,David Miller,Amanda Cruz,Sarah Henderson,(555) 234-5678,1001\nSTU-1002,Sophia Martinez,Grade 4,Learning Center Beta,Rachel Vance,David Miller,Carlos Martinez,(555) 345-6789,1002`}
                    className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handlePasteSubmit}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>Parse Pasted Content</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Helpful Instructions Box */}
              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-2">
                <div className="flex items-center space-x-1.5 font-bold text-blue-800">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span>How Bulk Import & Semester Rollovers Work:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                  <li>
                    <strong className="text-slate-800">Updating Existing Students:</strong> If a row includes an existing <code className="bg-blue-100 px-1 rounded text-blue-800 font-mono">student_id</code> (or matches an existing name), it will update their grade, learning center/classroom, or parent contacts without altering their previous attendance history.
                  </li>
                  <li>
                    <strong className="text-slate-800">Adding New Students:</strong> If <code className="bg-blue-100 px-1 rounded text-blue-800 font-mono">student_id</code> is blank or not found, a unique ID is automatically generated.
                  </li>
                  <li>
                    <strong className="text-slate-800">4-Digit PIN Generation:</strong> Any omitted PIN codes are automatically assigned a unique 4-digit code.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Parsed Records Preview Table */}
          {parsedRows.length > 0 && !importResult && (
            <div className="space-y-4">
              {/* Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs text-slate-800">File:</span>
                  <span className="text-xs text-slate-600 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                    {fileName}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    ({parsedRows.length} rows parsed)
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    +{createsCount} New
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                    {updatesCount} Updates
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setParsedRows([]);
                      setFileName('');
                      setPastedText('');
                    }}
                    className="text-slate-500 hover:text-slate-800 underline text-[11px] ml-2"
                  >
                    Reset & Upload Another
                  </button>
                </div>
              </div>

              {/* Bulk Selection actions */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => toggleAllRows(true)}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Select All ({parsedRows.length})
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => toggleAllRows(false)}
                    className="text-slate-500 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>

                <span className="text-slate-500 text-[11px]">
                  {selectedCount} of {parsedRows.length} students selected for import
                </span>
              </div>

              {/* Data Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-2.5 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedCount === parsedRows.length && parsedRows.length > 0}
                            onChange={(e) => toggleAllRows(e.target.checked)}
                            className="rounded text-blue-600"
                          />
                        </th>
                        <th className="p-2.5">Action</th>
                        <th className="p-2.5">Student ID</th>
                        <th className="p-2.5">Full Name</th>
                        <th className="p-2.5">Grade</th>
                        <th className="p-2.5">Classroom / Center</th>
                        <th className="p-2.5">Supervisor</th>
                        <th className="p-2.5">PIN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50 transition ${
                            !row.selected ? 'opacity-50 bg-slate-50/50' : ''
                          }`}
                        >
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={() => toggleRowSelection(idx)}
                              className="rounded text-blue-600"
                            />
                          </td>
                          <td className="p-2.5">
                            {row.isExisting ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                Update
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                + New
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono font-semibold text-slate-700">
                            {row.student_id}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900">
                            {row.full_name}
                          </td>
                          <td className="p-2.5">
                            {row.isExisting && row.currentRecord && row.currentRecord.grade !== row.grade ? (
                              <div className="flex items-center space-x-1">
                                <span className="line-through text-slate-400">
                                  {row.currentRecord.grade}
                                </span>
                                <ArrowRight className="w-3 h-3 text-blue-600" />
                                <span className="font-bold text-blue-700">{row.grade}</span>
                              </div>
                            ) : (
                              <span className="text-slate-700">{row.grade}</span>
                            )}
                          </td>
                          <td className="p-2.5">
                            {row.isExisting && row.currentRecord && row.currentRecord.learning_center_id !== row.learning_center_id ? (
                              <div className="flex items-center space-x-1">
                                <span className="line-through text-slate-400 truncate max-w-[90px]">
                                  {row.currentRecord.learning_center_id}
                                </span>
                                <ArrowRight className="w-3 h-3 text-blue-600" />
                                <span className="font-bold text-blue-700 truncate max-w-[100px]">
                                  {row.learning_center_id}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-600 truncate max-w-[130px] block">
                                {row.learning_center_id}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-600 truncate max-w-[100px]">
                            {row.supervisor_name}
                          </td>
                          <td className="p-2.5 font-mono text-slate-700">
                            {row.pin_code}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition"
          >
            Cancel
          </button>

          {parsedRows.length > 0 && !importResult && (
            <button
              type="button"
              disabled={isProcessing || selectedCount === 0}
              onClick={handleCommitImport}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center space-x-2 shadow-md shadow-blue-500/20 active:scale-95"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Batch ({selectedCount} records)...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Import ({selectedCount} Students)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
