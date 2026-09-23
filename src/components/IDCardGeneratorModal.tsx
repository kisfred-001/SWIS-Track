import React, { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { Student, Staff } from '../types';
import {
  generateSingleCardPDF,
  generateBatchCardsPDF,
  CardItem,
} from '../utils/pdfGenerator';
import {
  QrCode,
  Printer,
  Download,
  X,
  CheckSquare,
  Square,
  Search,
  Filter,
  Users,
  Briefcase,
  Layers,
  Sparkles,
  School,
  Scissors,
  CheckCircle2,
  FileText,
  Loader2,
} from 'lucide-react';
import { sound } from '../utils/sound';

interface IDCardGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'Student' | 'Staff';
  defaultSelectedId?: string;
}

export const IDCardGeneratorModal: React.FC<IDCardGeneratorModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'Student',
  defaultSelectedId,
}) => {
  const { students } = useAttendance();
  const { allStaff, isTeacherOnly, currentUser } = useAuth();

  const [category, setCategory] = useState<'Student' | 'Staff'>(defaultType);
  const [layoutMode, setLayoutMode] = useState<'sheet' | 'single'>('sheet');
  const [searchQuery, setSearchQuery] = useState('');
  const [centerFilter, setCenterFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  // Available learning centers
  const centers = Array.from(new Set(students.map((s) => s.learning_center_id))).filter(Boolean);

  // Initialize selected IDs when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultSelectedId) {
        setSelectedIds([defaultSelectedId]);
      } else if (category === 'Student') {
        const initial = isTeacherOnly && currentUser?.learning_center_id
          ? students.filter((s) => s.learning_center_id === currentUser.learning_center_id).map((s) => s.student_id)
          : students.map((s) => s.student_id);
        setSelectedIds(initial);
      } else {
        setSelectedIds(allStaff.map((s) => s.staff_id));
      }
    }
  }, [isOpen, category, defaultSelectedId]);

  if (!isOpen) return null;

  // Filter lists based on category, search, and center
  const availableStudents = students.filter((s) => {
    const matchesCenter = centerFilter === 'all' || s.learning_center_id === centerFilter;
    const matchesTeacherScope =
      !isTeacherOnly || !currentUser?.learning_center_id || s.learning_center_id === currentUser.learning_center_id;
    const matchesSearch =
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.pin_code.includes(searchQuery) ||
      s.grade.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCenter && matchesTeacherScope && matchesSearch;
  });

  const availableStaff = allStaff.filter((st) => {
    const matchesSearch =
      st.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.staff_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.pin_code.includes(searchQuery);
    return matchesSearch;
  });

  const currentAvailableList = category === 'Student' ? availableStudents : availableStaff;

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (select: boolean) => {
    if (select) {
      const allIds = currentAvailableList.map((item) =>
        category === 'Student' ? (item as Student).student_id : (item as Staff).staff_id
      );
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  // Get selected items
  const selectedItems: Array<{ item: Student | Staff; type: 'Student' | 'Staff' }> = [];
  if (category === 'Student') {
    students.forEach((s) => {
      if (selectedIds.includes(s.student_id)) {
        selectedItems.push({ item: s, type: 'Student' });
      }
    });
  } else {
    allStaff.forEach((st) => {
      if (selectedIds.includes(st.staff_id)) {
        selectedItems.push({ item: st, type: 'Staff' });
      }
    });
  }

  // Get QR DataURL from rendered canvas in DOM
  const getQRDataUrl = (idCode: string): string | undefined => {
    const canvas = document.getElementById(`qr-render-canvas-${idCode}`) as HTMLCanvasElement;
    if (canvas) {
      try {
        return canvas.toDataURL('image/png');
      } catch (err) {
        console.warn('Canvas toDataURL error', err);
      }
    }
    return undefined;
  };

  // Download PDF Handler
  const handleDownloadPDF = async () => {
    if (selectedItems.length === 0) return;

    setIsExporting(true);
    try {
      // Allow DOM to settle so canvas elements are drawn
      await new Promise((resolve) => setTimeout(resolve, 150));

      const cardItems: CardItem[] = selectedItems.map(({ item, type }) => {
        const idCode = type === 'Student' ? (item as Student).student_id : (item as Staff).staff_id;
        const qrDataUrl = getQRDataUrl(idCode);
        return { item, type, qrDataUrl };
      });

      if (layoutMode === 'single' && cardItems.length === 1) {
        const single = cardItems[0];
        const doc = generateSingleCardPDF(single.item, single.type, single.qrDataUrl);
        const nameSlug = single.item.full_name.replace(/[^a-zA-Z0-9]/g, '_');
        doc.save(`SWIS_${single.type}_ID_${nameSlug}.pdf`);
      } else {
        const doc = generateBatchCardsPDF(cardItems, {
          title: `SWIS Academy — ${category === 'Student' ? 'Student ID Cards' : 'Faculty & Staff Credentials'}`,
        });
        const dateStr = new Date().toISOString().slice(0, 10);
        doc.save(`SWIS_${category}_ID_Cards_Sheet_${dateStr}.pdf`);
      }

      sound.playSuccessChime();
    } catch (err) {
      console.error('PDF export failed:', err);
      sound.playError();
    } finally {
      setIsExporting(false);
    }
  };

  // Browser Print Sheet Handler
  const handlePrint = () => {
    window.print();
  };

  const previewItem = selectedItems[activePreviewIndex] || selectedItems[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-blue-800 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <QrCode className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg">ID Card & QR Code Generator</h3>
                <span className="bg-blue-500/30 text-blue-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-blue-400/30">
                  Print Ready PDF
                </span>
              </div>
              <p className="text-xs text-blue-100/90 mt-0.5">
                Generate high-resolution printable ID cards featuring official QR codes, security PINs, and academic credentials.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Configuration & Multi-Selection (5 cols) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 lg:pr-5 pb-5 lg:pb-0">
            {/* Category Switcher */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Card Category
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setCategory('Student');
                    setActivePreviewIndex(0);
                  }}
                  className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold transition ${
                    category === 'Student'
                      ? 'bg-white text-blue-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Students ({students.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategory('Staff');
                    setActivePreviewIndex(0);
                  }}
                  className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold transition ${
                    category === 'Staff'
                      ? 'bg-white text-purple-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Faculty & Staff ({allStaff.length})</span>
                </button>
              </div>
            </div>

            {/* Layout Mode Switcher */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Print & PDF Layout
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLayoutMode('sheet')}
                  className={`p-2.5 rounded-xl border text-left transition flex items-start space-x-2.5 ${
                    layoutMode === 'sheet'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Scissors className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold">Printable Sheet</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      6 cards / page with cutting guides
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutMode('single')}
                  className={`p-2.5 rounded-xl border text-left transition flex items-start space-x-2.5 ${
                    layoutMode === 'single'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold">Individual Badge</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      CR80 Standard Wallet / Lanyard
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Filter by name, PIN, ID, or ${category === 'Student' ? 'grade' : 'role'}...`}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {category === 'Student' && !isTeacherOnly && (
                <select
                  value={centerFilter}
                  onChange={(e) => setCenterFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="all">All Classrooms / Learning Centers</option>
                  {centers.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Selection Toolbar */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => toggleSelectAll(true)}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Select All ({currentAvailableList.length})
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => toggleSelectAll(false)}
                  className="text-slate-500 hover:underline"
                >
                  Clear
                </button>
              </div>

              <span className="text-slate-500 font-medium text-[11px]">
                {selectedItems.length} selected
              </span>
            </div>

            {/* Scrollable Person Selection List */}
            <div className="flex-1 overflow-y-auto max-h-56 border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
              {currentAvailableList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No matching individuals found.
                </div>
              ) : (
                currentAvailableList.map((item) => {
                  const id = category === 'Student' ? (item as Student).student_id : (item as Staff).staff_id;
                  const isChecked = selectedIds.includes(id);
                  const pin = item.pin_code;
                  const subtitle =
                    category === 'Student'
                      ? `${(item as Student).grade} • ${(item as Student).learning_center_id}`
                      : `${(item as Staff).role} • ${item.pin_code}`;

                  return (
                    <div
                      key={id}
                      onClick={() => toggleSelectId(id)}
                      className={`flex items-center space-x-3 p-2.5 cursor-pointer transition select-none ${
                        isChecked ? 'bg-blue-50/80 hover:bg-blue-100/60' : 'hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-blue-600 w-4 h-4"
                      />
                      <div className="flex-1 truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {item.full_name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{subtitle}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[11px] font-bold text-blue-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          PIN: {pin}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Live Card Preview & Batch Output (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Live Card Preview
                </h4>
                <p className="text-[11px] text-slate-500">
                  Visual representation of the generated PDF card & QR scan code.
                </p>
              </div>

              {selectedItems.length > 1 && (
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Showing #{activePreviewIndex + 1} of {selectedItems.length}
                  </span>
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      disabled={activePreviewIndex === 0}
                      onClick={() => setActivePreviewIndex((prev) => Math.max(0, prev - 1))}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-slate-700 font-bold"
                    >
                      &larr;
                    </button>
                    <button
                      type="button"
                      disabled={activePreviewIndex >= selectedItems.length - 1}
                      onClick={() =>
                        setActivePreviewIndex((prev) =>
                          Math.min(selectedItems.length - 1, prev + 1)
                        )
                      }
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-slate-700 font-bold"
                    >
                      &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Box */}
            <div className="flex-1 bg-gradient-to-br from-slate-100 to-slate-200/80 rounded-2xl p-6 flex flex-col items-center justify-center border border-slate-300/80 shadow-inner min-h-[300px]">
              {previewItem ? (
                <div className="w-full max-w-sm bg-white rounded-2xl border-2 border-slate-300 shadow-xl overflow-hidden transition-all duration-200 transform hover:scale-[1.01]">
                  {/* Card Header */}
                  <div
                    className={`p-3 text-white flex items-center justify-between ${
                      previewItem.type === 'Student'
                        ? 'bg-gradient-to-r from-blue-800 via-blue-900 to-indigo-900'
                        : 'bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900'
                    }`}
                  >
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-blue-200">
                        SWIS Academy
                      </p>
                      <h4 className="font-extrabold text-xs uppercase tracking-wider">
                        {previewItem.type === 'Student'
                          ? 'Official Student ID'
                          : 'Faculty & Staff Credential'}
                      </h4>
                    </div>
                    <span className="text-[9px] font-mono bg-white/20 px-2 py-0.5 rounded-full font-bold">
                      2026–2027
                    </span>
                  </div>

                  {/* Card Main Body */}
                  <div className="p-4 space-y-3.5">
                    <div className="flex items-start space-x-3.5">
                      {/* Live QR Canvas Display */}
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0 flex flex-col items-center">
                        <QRCodeCanvas
                          id={`preview-qr-canvas`}
                          value={
                            previewItem.type === 'Student'
                              ? (previewItem.item as Student).student_id
                              : (previewItem.item as Staff).staff_id
                          }
                          size={110}
                          level="H"
                          includeMargin={false}
                        />
                        <span className="text-[8px] font-mono text-slate-400 mt-1 uppercase font-semibold">
                          Scan at Kiosk
                        </span>
                      </div>

                      {/* Credentials */}
                      <div className="flex-1 space-y-1">
                        <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                          {previewItem.item.full_name}
                        </h3>
                        <p className="text-xs font-bold text-blue-700">
                          {previewItem.type === 'Student'
                            ? (previewItem.item as Student).grade
                            : (previewItem.item as Staff).role}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {previewItem.type === 'Student'
                            ? (previewItem.item as Student).learning_center_id
                            : (previewItem.item as Staff).learning_center_id || 'School Staff'}
                        </p>

                        {/* PIN & ID Highlight Box */}
                        <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-1.5 text-left">
                          <div>
                            <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block">
                              Card ID
                            </span>
                            <span className="font-mono font-bold text-xs text-slate-800">
                              {previewItem.type === 'Student'
                                ? (previewItem.item as Student).student_id
                                : (previewItem.item as Staff).staff_id}
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block">
                              Security PIN
                            </span>
                            <span className="font-mono font-extrabold text-xs text-blue-700">
                              {previewItem.item.pin_code}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Information */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                      {previewItem.type === 'Student' ? (
                        <>
                          <span>
                            Supervisor: <strong>{(previewItem.item as Student).supervisor_name}</strong>
                          </span>
                          <span className="truncate max-w-[120px]">
                            {(previewItem.item as Student).emergency_contact}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>Official Staff Credential</span>
                          <span>SWIS Premises Security</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400 text-xs">
                  No students or staff selected for preview. Check at least one profile on the left.
                </div>
              )}
            </div>

            {/* Batch summary metrics */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-700 font-medium">
                  <strong>{selectedItems.length}</strong> {category.toLowerCase()} ID badges selected for export
                </span>
              </div>
              <span className="text-slate-500 text-[11px]">
                {layoutMode === 'sheet'
                  ? `~${Math.ceil(selectedItems.length / 6)} printable A4 page(s)`
                  : `${selectedItems.length} single badge card(s)`}
              </span>
            </div>
          </div>
        </div>

        {/* Hidden Canvas Renderers for ALL selected items to capture pristine PNG data for jsPDF */}
        <div className="hidden" aria-hidden="true">
          {selectedItems.map(({ item, type }) => {
            const idCode = type === 'Student' ? (item as Student).student_id : (item as Staff).staff_id;
            return (
              <QRCodeCanvas
                key={idCode}
                id={`qr-render-canvas-${idCode}`}
                value={idCode}
                size={300}
                level="H"
                includeMargin={false}
              />
            );
          })}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition"
          >
            Close
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {/* Native Print / Save to PDF */}
            <button
              type="button"
              disabled={selectedItems.length === 0}
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Preview</span>
            </button>

            {/* Download Real PDF */}
            <button
              type="button"
              disabled={selectedItems.length === 0 || isExporting}
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-none px-6 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-md shadow-blue-600/20 active:scale-95"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download ID Cards PDF ({selectedItems.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
