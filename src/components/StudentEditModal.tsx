import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Upload,
  User,
  Phone,
  MapPin,
  KeyRound,
  Trash2,
  Plus,
  Bed,
  Sun,
  AlertTriangle,
  X,
  Camera,
} from 'lucide-react';
import { Student, DesignatedPickupPerson, ParentContactInfo, Campus, LearningCenter } from '../types';

interface StudentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  onSave: (studentData: Omit<Student, 'id'>, existingId?: string) => Promise<{ success: boolean; message: string }>;
  campuses?: Campus[];
  learningCenters?: LearningCenter[];
}

export const StudentEditModal: React.FC<StudentEditModalProps> = ({
  isOpen,
  onClose,
  student,
  onSave,
}) => {
  const isEditing = Boolean(student);

  // Active Tab inside modal: 'profile' | 'parents' | 'pickups'
  const [activeTab, setActiveTab] = useState<'profile' | 'parents' | 'pickups'>('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile Fields
  const [fullName, setFullName] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [campus, setCampus] = useState('Spring Campus');
  const [learningCenterId, setLearningCenterId] = useState('Kayil');
  const [enrollmentType, setEnrollmentType] = useState<'Day' | 'Boarding'>('Day');
  const [photoUrl, setPhotoUrl] = useState<string>('');

  // Parent Contact Fields
  const [fatherName, setFatherName] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [fatherEmail, setFatherEmail] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [motherEmail, setMotherEmail] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Designated Pickups
  const [designatedPickups, setDesignatedPickups] = useState<DesignatedPickupPerson[]>([]);
  const [newPickupName, setNewPickupName] = useState('');
  const [newPickupRelation, setNewPickupRelation] = useState('School Van / Driver');
  const [newPickupPhone, setNewPickupPhone] = useState('');
  const [newPickupIdNum, setNewPickupIdNum] = useState('');
  const [newPickupNotes, setNewPickupNotes] = useState('');

  // When student prop changes or modal opens, initialize form state
  useEffect(() => {
    if (student) {
      setFullName(student.full_name || '');
      setPinCode(student.pin_code || '');
      setCampus(student.campus || 'Spring Campus');
      setLearningCenterId(student.learning_center_id || 'Kayil');
      setEnrollmentType(student.enrollment_type || 'Day');
      setPhotoUrl(student.photo_url || '');

      // Parents
      const pInfo = student.parent_info;
      setFatherName(pInfo?.father_name || student.parent_names?.split('&')[0]?.trim() || '');
      setFatherPhone(pInfo?.father_phone || student.emergency_contact || '');
      setFatherEmail(pInfo?.father_email || '');
      setMotherName(pInfo?.mother_name || student.parent_names?.split('&')[1]?.trim() || '');
      setMotherPhone(pInfo?.mother_phone || '');
      setMotherEmail(pInfo?.mother_email || '');
      setHomeAddress(pInfo?.home_address || '');
      setEmergencyPhone(pInfo?.emergency_phone || student.emergency_contact || '');

      // Pickups
      setDesignatedPickups(student.designated_pickups || []);
    } else {
      // New Student Defaults
      setFullName('');
      setPinCode(Math.floor(1000 + Math.random() * 9000).toString());
      setCampus('Spring Campus');
      setLearningCenterId('Kayil');
      setEnrollmentType('Day');
      setPhotoUrl('');

      setFatherName('');
      setFatherPhone('');
      setFatherEmail('');
      setMotherName('');
      setMotherPhone('');
      setMotherEmail('');
      setHomeAddress('');
      setEmergencyPhone('');

      setDesignatedPickups([]);
    }
    setActiveTab('profile');
    setErrorMsg(null);
  }, [student, isOpen]);

  if (!isOpen) return null;

  // Handle Photo Upload (Convert file to optimized base64 Data URL)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image file size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Create an offscreen image to resize/compress cleanly for storage
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 320;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setPhotoUrl(compressedDataUrl);
            setErrorMsg(null);
          }
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Add designated pickup person
  const handleAddPickupPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPickupName.trim() || !newPickupPhone.trim()) {
      setErrorMsg('Designated person name and phone number are required.');
      return;
    }

    const newPerson: DesignatedPickupPerson = {
      id: `pickup-${Date.now()}`,
      name: newPickupName.trim(),
      relationship: newPickupRelation,
      phone: newPickupPhone.trim(),
      id_number: newPickupIdNum.trim(),
      notes: newPickupNotes.trim(),
    };

    setDesignatedPickups((prev) => [...prev, newPerson]);
    setNewPickupName('');
    setNewPickupPhone('');
    setNewPickupIdNum('');
    setNewPickupNotes('');
    setErrorMsg(null);
  };

  const handleRemovePickupPerson = (id: string) => {
    setDesignatedPickups((prev) => prev.filter((p) => p.id !== id));
  };

  // Save student data
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setActiveTab('profile');
      setErrorMsg('Student full name is required.');
      return;
    }

    if (!pinCode || pinCode.length !== 4) {
      setActiveTab('profile');
      setErrorMsg('A valid 4-digit PIN is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const parentInfo: ParentContactInfo = {
      father_name: fatherName.trim(),
      father_phone: fatherPhone.trim(),
      father_email: fatherEmail.trim(),
      mother_name: motherName.trim(),
      mother_phone: motherPhone.trim(),
      mother_email: motherEmail.trim(),
      home_address: homeAddress.trim(),
      emergency_phone: emergencyPhone.trim() || fatherPhone.trim() || motherPhone.trim(),
    };

    // Composite parent name string
    const parentNamesSummary =
      [fatherName.trim(), motherName.trim()].filter(Boolean).join(' & ') || 'Parent / Guardian';

    // Enforce official supervisors for each learning center
    const supervisor_name =
      learningCenterId === 'Kayil'
        ? 'Mrs. Irene Oryem'
        : learningCenterId === 'Doxa'
        ? 'Mr. David Kimbugwe'
        : learningCenterId === 'Splendor'
        ? 'Mr. Arthur Mutebi'
        : learningCenterId === 'Bethany'
        ? 'Mrs. Eunice Mutebe'
        : learningCenterId === 'Antioch'
        ? 'Mrs. Doreen Mugaga'
        : learningCenterId === 'Azusa'
        ? 'Mr. Shafic Musika'
        : (learningCenterId === 'Bloom and Archie' || learningCenterId === 'Blooms and Archie')
        ? 'Mrs. Julie Mayanja'
        : '';

    // Mrs. Joan Nandhego is the ONLY monitor in SWIS, assigned exclusively to Bethany
    const finalMonitorName = learningCenterId === 'Bethany' ? 'Mrs. Joan Nandhego' : '';

    const newStudentId = student?.student_id || `STU-${Date.now().toString().slice(-4)}`;

    const payload: Omit<Student, 'id'> = {
      student_id: newStudentId,
      pin_code: pinCode,
      full_name: fullName.trim(),
      campus,
      learning_center_id: learningCenterId,
      supervisor_name,
      monitor_name: finalMonitorName,
      grade: `${campus.split(' ')[0]} • ${learningCenterId}`,
      enrollment_type: campus === 'Spring Campus' ? enrollmentType : 'Day',
      photo_url: photoUrl,
      parent_info: parentInfo,
      parent_names: parentNamesSummary,
      emergency_contact: emergencyPhone.trim() || fatherPhone.trim() || motherPhone.trim() || '+256 700 000 000',
      designated_pickups: designatedPickups,
      qr_code_url: newStudentId,
      created_at: student?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const res = await onSave(payload, student?.student_id);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  // Check if Bethany is selected
  const isBethany = learningCenterId === 'Bethany';
  const isSprings = campus === 'Spring Campus';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#8B1E2F] text-white p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="bg-white/10 p-2 rounded-lg">
              <GraduationCap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isEditing ? `Edit Student: ${student?.full_name}` : 'Enroll New Student'}
              </h3>
              <p className="text-[11px] text-amber-200">
                Spirit &amp; Word International School • Student Profile &amp; Security Dossier
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-1 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-t-lg transition border-b-2 ${
              activeTab === 'profile'
                ? 'border-[#8B1E2F] text-[#8B1E2F] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Student Profile &amp; Section
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('parents')}
            className={`px-4 py-2.5 rounded-t-lg transition border-b-2 ${
              activeTab === 'parents'
                ? 'border-[#8B1E2F] text-[#8B1E2F] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Parents Contact Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pickups')}
            className={`px-4 py-2.5 rounded-t-lg transition border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'pickups'
                ? 'border-[#8B1E2F] text-[#8B1E2F] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>3. Designated Pickups</span>
            <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full">
              {designatedPickups.length}
            </span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body Form */}
        <form onSubmit={handleSave} className="overflow-y-auto p-5 space-y-4 text-xs flex-1">
          {/* TAB 1: PROFILE & SECTION */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Profile Photo Upload Section */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group shrink-0">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Student Profile"
                      className="w-20 h-20 rounded-xl object-cover border-2 border-slate-300 shadow-xs"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-200 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                      <User className="w-8 h-8 text-slate-400" />
                      <span className="text-[9px] mt-1 font-medium">No Photo</span>
                    </div>
                  )}
                  <label className="absolute -bottom-1 -right-1 bg-[#8B1E2F] text-white p-1.5 rounded-full cursor-pointer hover:bg-[#6D1422] shadow-xs">
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm">Student Profile Picture</h4>
                  <p className="text-[11px] text-slate-500">
                    Upload official student photograph for security verification and digital ID cards (JPG or PNG, max 2MB).
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer hover:bg-slate-100 transition shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Student Name & Security PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Full Student Name: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Samuel David Kimbugwe"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#8B1E2F] focus:outline-none bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    4-Digit Security PIN: <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      maxLength={4}
                      required
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#8B1E2F] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Campus Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Campus:</label>
                  <select
                    value={campus}
                    onChange={(e) => {
                      const newCamp = e.target.value;
                      setCampus(newCamp);
                      if (newCamp !== 'Spring Campus') {
                        setEnrollmentType('Day');
                        if (learningCenterId === 'Kayil' || learningCenterId === 'Doxa' || learningCenterId === 'Splendor') {
                          setLearningCenterId('Bethany');
                        }
                      } else {
                        if (learningCenterId === 'Bethany' || learningCenterId === 'Antioch' || learningCenterId === 'Azusa') {
                          setLearningCenterId('Kayil');
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#8B1E2F] focus:outline-none bg-white font-medium"
                  >
                    <option value="Spring Campus">Spring Campus</option>
                    <option value="Hope Campus">Hope Campus</option>
                  </select>
                </div>

                {/* Springs Campus Day vs Boarding Selector */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Enrollment Section:
                  </label>
                  {isSprings ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEnrollmentType('Day')}
                        className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border font-semibold transition ${
                          enrollmentType === 'Day'
                            ? 'bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-400'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>Day Student</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEnrollmentType('Boarding')}
                        className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border font-semibold transition ${
                          enrollmentType === 'Boarding'
                            ? 'bg-purple-50 border-purple-400 text-purple-900 ring-1 ring-purple-400'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Bed className="w-3.5 h-3.5 text-purple-600" />
                        <span>Boarding (Mon-Fri)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-slate-100 rounded-lg border border-slate-200 text-slate-500 font-medium">
                      Day Student (Hope Campus)
                    </div>
                  )}
                </div>
              </div>

              {/* Springs Campus Boarding Schedule Banner */}
              {isSprings && enrollmentType === 'Boarding' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-[11px] flex items-start space-x-2">
                  <Bed className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Springs Campus Boarding Program:</strong>
                    <p className="text-purple-800 mt-0.5">
                      Students are dropped off on <strong>Monday morning (7:00 AM)</strong> and stay resident on campus until dismissal on <strong>Friday (2:00 PM)</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Learning Center, Supervisor & Monitor */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Learning Center:
                  </label>
                  <select
                    value={learningCenterId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLearningCenterId(val);
                      if (val === 'Bethany') {
                        setCampus('Hope Campus');
                        setEnrollmentType('Day');
                      } else if (val === 'Antioch') {
                        setCampus('Hope Campus');
                        setEnrollmentType('Day');
                      } else if (val === 'Azusa') {
                        setCampus('Hope Campus');
                        setEnrollmentType('Day');
                      } else if (val === 'Bloom and Archie' || val === 'Blooms and Archie') {
                        setCampus('Hope Campus');
                        setEnrollmentType('Day');
                      } else if (val === 'Kayil') {
                        setCampus('Spring Campus');
                      } else if (val === 'Doxa') {
                        setCampus('Spring Campus');
                      } else if (val === 'Splendor') {
                        setCampus('Spring Campus');
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#8B1E2F] focus:outline-none bg-white font-medium"
                  >
                    {campus === 'Spring Campus' ? (
                      <>
                        <option value="Kayil">Kayil (Supervisor: Mrs. Irene Oryem)</option>
                        <option value="Doxa">Doxa (Supervisor: Mr. David Kimbugwe)</option>
                        <option value="Splendor">Splendor (Supervisor: Mr. Arthur Mutebi)</option>
                        <option value="Bloom and Archie">Bloom and Archie (Supervisor: Mrs. Julie Mayanja)</option>
                      </>
                    ) : (
                      <>
                        <option value="Bethany">Bethany (Supervisor: Mrs. Eunice Mutebe • Monitor: Mrs. Joan Nandhego)</option>
                        <option value="Antioch">Antioch (Supervisor: Mrs. Doreen Mugaga)</option>
                        <option value="Azusa">Azusa (Supervisor: Mr. Shafic Musika)</option>
                        <option value="Bloom and Archie">Bloom and Archie (Supervisor: Mrs. Julie Mayanja)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Supervisor Field: Official Supervisor for Center */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Supervisor:
                  </label>
                  <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 font-semibold flex items-center justify-between">
                    <span className="truncate">
                      {learningCenterId === 'Kayil'
                        ? 'Mrs. Irene Oryem'
                        : learningCenterId === 'Doxa'
                        ? 'Mr. David Kimbugwe'
                        : learningCenterId === 'Splendor'
                        ? 'Mr. Arthur Mutebi'
                        : learningCenterId === 'Bethany'
                        ? 'Mrs. Eunice Mutebe'
                        : learningCenterId === 'Antioch'
                        ? 'Mrs. Doreen Mugaga'
                        : learningCenterId === 'Azusa'
                        ? 'Mr. Shafic Musika'
                        : (learningCenterId === 'Bloom and Archie' || learningCenterId === 'Blooms and Archie')
                        ? 'Mrs. Julie Mayanja'
                        : 'Assigned Supervisor'}
                    </span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold shrink-0">
                      Supervisor
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    * Officially assigned supervisor for {learningCenterId}.
                  </p>
                </div>

                {/* Monitor Field: Bethany has Mrs. Joan Nandhego, others have none */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Monitor:
                  </label>
                  {isBethany ? (
                    <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 font-semibold flex items-center justify-between">
                      <span className="truncate">Mrs. Joan Nandhego</span>
                      <span className="text-[10px] bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-bold shrink-0">
                        Monitor
                      </span>
                    </div>
                  ) : (
                    <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 italic flex items-center justify-between">
                      <span>None</span>
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium shrink-0">
                        Bethany Only
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isBethany
                      ? '* Mrs. Joan Nandhego is the official monitor for Bethany.'
                      : '* Bethany is the only learning center with an assigned monitor.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PARENTS CONTACT INFORMATION */}
          {activeTab === 'parents' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px]">
                <strong className="font-semibold">Parent &amp; Emergency Contacts:</strong> Ensure accurate telephone numbers for automated SMS/push notifications and emergency check-out verification.
              </div>

              {/* Father's Details */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-800 flex items-center space-x-1.5 text-xs">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Father / Guardian 1 Details</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Father's Full Name:
                    </label>
                    <input
                      type="text"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder="e.g. Mr. David Kimbugwe"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#8B1E2F] focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Father's Telephone:
                    </label>
                    <input
                      type="tel"
                      value={fatherPhone}
                      onChange={(e) => setFatherPhone(e.target.value)}
                      placeholder="+256 772 123 456"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#8B1E2F] focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Father's Email:
                    </label>
                    <input
                      type="email"
                      value={fatherEmail}
                      onChange={(e) => setFatherEmail(e.target.value)}
                      placeholder="father@example.com"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#8B1E2F] focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Mother's Details */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-800 flex items-center space-x-1.5 text-xs">
                  <User className="w-3.5 h-3.5 text-purple-600" />
                  <span>Mother / Guardian 2 Details</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Mother's Full Name:
                    </label>
                    <input
                      type="text"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      placeholder="e.g. Mrs. Grace Kimbugwe"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#8B1E2F] focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Mother's Telephone:
                    </label>
                    <input
                      type="tel"
                      value={motherPhone}
                      onChange={(e) => setMotherPhone(e.target.value)}
                      placeholder="+256 701 987 654"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#8B1E2F] focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Mother's Email:
                    </label>
                    <input
                      type="email"
                      value={motherEmail}
                      onChange={(e) => setMotherEmail(e.target.value)}
                      placeholder="mother@example.com"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#8B1E2F] focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Residential Address & Emergency Hotline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Home / Residential Address:
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={homeAddress}
                      onChange={(e) => setHomeAddress(e.target.value)}
                      placeholder="e.g. Plot 18, Bukoto, Kampala"
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#8B1E2F] focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Primary Emergency Telephone:
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="tel"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="+256 772 000 111"
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#8B1E2F] focus:outline-none bg-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DESIGNATED PICKUP & DROPOFF PERSONS */}
          {activeTab === 'pickups' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                <strong className="font-semibold">Authorized Pickup Protocol:</strong> Only individuals registered here or biological parents are authorized to collect the student from campus. Security will verify identity during check-out.
              </div>

              {/* Add New Designated Person Form */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#8B1E2F]" />
                  <span>Authorize New Designated Drop-Off / Pick-Up Person</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Full Name: *
                    </label>
                    <input
                      type="text"
                      value={newPickupName}
                      onChange={(e) => setNewPickupName(e.target.value)}
                      placeholder="e.g. John Mukasa"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Relationship:
                    </label>
                    <select
                      value={newPickupRelation}
                      onChange={(e) => setNewPickupRelation(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="School Van / Driver">School Van / Family Driver</option>
                      <option value="Aunt">Aunt</option>
                      <option value="Uncle">Uncle</option>
                      <option value="Grandparent">Grandparent</option>
                      <option value="Family Friend">Family Friend</option>
                      <option value="Legal Guardian">Legal Guardian</option>
                      <option value="Sibling (Adult)">Adult Sibling</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Telephone Number: *
                    </label>
                    <input
                      type="tel"
                      value={newPickupPhone}
                      onChange={(e) => setNewPickupPhone(e.target.value)}
                      placeholder="+256 752 111 222"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      National ID / Driver License:
                    </label>
                    <input
                      type="text"
                      value={newPickupIdNum}
                      onChange={(e) => setNewPickupIdNum(e.target.value)}
                      placeholder="e.g. NIN CM890123"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Special Notes / Vehicle Registration / Days Authorized:
                  </label>
                  <input
                    type="text"
                    value={newPickupNotes}
                    onChange={(e) => setNewPickupNotes(e.target.value)}
                    placeholder="e.g. Drives Toyota Van UBD 412X, authorized Mon-Thu"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddPickupPerson}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#8B1E2F] hover:bg-[#6D1422] text-white rounded-lg font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Authorized List</span>
                  </button>
                </div>
              </div>

              {/* List of currently registered designated persons */}
              <div className="space-y-2">
                <h5 className="font-bold text-slate-800 text-xs">
                  Registered Authorized Persons ({designatedPickups.length})
                </h5>

                {designatedPickups.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400">
                    No designated pickup persons registered yet. Parents are default authorized.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {designatedPickups.map((person) => (
                      <div
                        key={person.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-start justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900">{person.name}</div>
                          <div className="text-[11px] font-semibold text-[#8B1E2F]">
                            {person.relationship}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {person.phone} {person.id_number && `• ID: ${person.id_number}`}
                          </div>
                          {person.notes && (
                            <div className="text-[10px] text-slate-600 bg-slate-50 p-1 rounded mt-1 border border-slate-100">
                              {person.notes}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemovePickupPerson(person.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded-md transition hover:bg-red-50"
                          title="Remove Authorization"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 rounded-b-2xl">
            <div className="text-[11px] text-slate-500">
              * Spirit &amp; Word Security Protocol: Changes are timestamped in audit logs.
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#8B1E2F] hover:bg-[#6D1422] text-white rounded-xl font-bold transition shadow-sm disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Saving...'
                  : isEditing
                  ? 'Update Student Profile'
                  : 'Complete Student Enrollment'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
