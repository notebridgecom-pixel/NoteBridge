import React, { useState, useEffect, useMemo } from 'react';
import { User, NoteItem } from '../types';
import { 
  getColleges, 
  getCourses, 
  getBranches, 
  getSemestersForCourse, 
  getSubjects, 
  getUnitsForSubject, 
  getAcademicYears 
} from '../utils/catalogStorage';
import { createNewNoteListing, BUSINESS_RULES } from '../utils/storage';
import { generateNoteSynopsis, hasSufficientContent } from '../utils/geminiSynopsisService';
import { fileToBase64, getPdfFileInfo } from '../utils/pdfGenerator';
import { 
  X, 
  UploadCloud, 
  FileText, 
  ShieldCheck, 
  CheckCircle, 
  Info, 
  Sparkles, 
  AlertTriangle,
  IndianRupee,
  Check,
  Building2,
  GraduationCap,
  Layers,
  BookOpen,
  Bot,
  RotateCw
} from 'lucide-react';

interface UploadNoteModalProps {
  currentUser: User | null;
  onClose: () => void;
  onSuccess: (newNote: NoteItem) => void;
}

export const UploadNoteModal: React.FC<UploadNoteModalProps> = ({
  currentUser,
  onClose,
  onSuccess,
}) => {
  const colleges = useMemo(() => getColleges(true), []);
  const academicYears = useMemo(() => getAcademicYears(), []);

  // Academic hierarchy cascading state
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(
    () => colleges.find((c) => c.name.toLowerCase().includes('polytechnic') || c.name.toLowerCase().includes('engineering'))?.id || colleges[0]?.id || ''
  );

  const availableCourses = useMemo(() => {
    return getCourses(selectedCollegeId, true);
  }, [selectedCollegeId]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => availableCourses[0]?.id || 'course-btech');

  // When available courses change, make sure selection is valid
  useEffect(() => {
    if (availableCourses.length > 0 && !availableCourses.some((c) => c.id === selectedCourseId)) {
      setSelectedCourseId(availableCourses[0].id);
    }
  }, [availableCourses, selectedCourseId]);

  const availableBranches = useMemo(() => {
    return getBranches(selectedCourseId, selectedCollegeId, true);
  }, [selectedCourseId, selectedCollegeId]);

  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => availableBranches[0]?.id || '');

  useEffect(() => {
    if (availableBranches.length > 0 && !availableBranches.some((b) => b.id === selectedBranchId)) {
      setSelectedBranchId(availableBranches[0].id);
    }
  }, [availableBranches, selectedBranchId]);

  const availableSemesters = useMemo(() => {
    return getSemestersForCourse(selectedCourseId);
  }, [selectedCourseId]);

  const [selectedSemester, setSelectedSemester] = useState<number>(3);

  useEffect(() => {
    if (availableSemesters.length > 0 && !availableSemesters.includes(selectedSemester)) {
      setSelectedSemester(availableSemesters[0]);
    }
  }, [availableSemesters, selectedSemester]);

  // Dynamic subjects based on College, Course, Branch, Semester
  const availableSubjects = useMemo(() => {
    return getSubjects({
      collegeId: selectedCollegeId,
      courseId: selectedCourseId,
      branchId: selectedBranchId,
      semester: selectedSemester,
      activeOnly: true,
    });
  }, [selectedCollegeId, selectedCourseId, selectedBranchId, selectedSemester]);

  const [selectedSubjectName, setSelectedSubjectName] = useState<string>('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubjectInput, setCustomSubjectInput] = useState('');

  useEffect(() => {
    if (availableSubjects.length > 0) {
      setSelectedSubjectName(availableSubjects[0].name);
      setIsCustomSubject(false);
    } else {
      setSelectedSubjectName('');
      setIsCustomSubject(true);
    }
  }, [availableSubjects]);

  // Dynamic Units
  const activeSubjectName = isCustomSubject ? customSubjectInput : selectedSubjectName;
  const availableUnits = useMemo(() => {
    return getUnitsForSubject(activeSubjectName);
  }, [activeSubjectName]);

  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [customUnitInput, setCustomUnitInput] = useState('');

  useEffect(() => {
    if (availableUnits.length > 0) {
      setSelectedUnit(availableUnits[availableUnits.length - 1] || availableUnits[0]);
    }
  }, [availableUnits]);

  // Form Details
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [detectedPages, setDetectedPages] = useState<number>(24);
  const [detectedSizeMb, setDetectedSizeMb] = useState<number>(4.8);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [textContent, setTextContent] = useState('');
  const [aiSynopsis, setAiSynopsis] = useState('');
  const [isGeneratingSynopsis, setIsGeneratingSynopsis] = useState(false);
  const [synopsisMessage, setSynopsisMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(academicYears[0] || '2024-2025');
  const [price, setPrice] = useState<number>(49);
  const [hasPYQ, setHasPYQ] = useState(true);
  const [hasHandwrittenFormulas, setHasHandwrittenFormulas] = useState(true);
  const [copyrightPledgeAccepted, setCopyrightPledgeAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 80/20 earnings calculation
  const sellerEarnings = Math.round(price * BUSINESS_RULES.SELLER_PAYOUT_RATE * 10) / 10;
  const platformFee = Math.round(price * BUSINESS_RULES.PLATFORM_COMMISSION_RATE * 10) / 10;

  const handleGenerateSynopsis = async () => {
    if (!hasSufficientContent(textContent)) {
      setSynopsisMessage({
        text: 'Please write or paste at least 40 characters in the text content body to generate an AI synopsis.',
        isError: true,
      });
      return;
    }

    setIsGeneratingSynopsis(true);
    setSynopsisMessage(null);

    try {
      const finalSubject = (isCustomSubject ? customSubjectInput : selectedSubjectName).trim();
      const finalUnits = (isCustomUnit ? customUnitInput : selectedUnit).trim();

      const result = await generateNoteSynopsis({
        textContent,
        title: title || 'Academic Notes',
        subject: finalSubject || 'Engineering',
        unitsCovered: finalUnits || 'Comprehensive',
      });

      setAiSynopsis(result.synopsis);
      setSynopsisMessage({
        text: '✨ AI Synopsis generated successfully using Gemini 3.7 Flash!',
        isError: false,
      });
    } catch (err: any) {
      setSynopsisMessage({
        text: err.message || 'Failed to generate synopsis with Gemini.',
        isError: true,
      });
    } finally {
      setIsGeneratingSynopsis(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setFileName(selected.name);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
      try {
        const info = await getPdfFileInfo(selected);
        setDetectedPages(info.totalPages);
        setDetectedSizeMb(info.fileSizeMb);
      } catch (err) {
        console.warn('Error reading PDF metadata:', err);
      }
    }
  };

  const currentCollegeObj = colleges.find((c) => c.id === selectedCollegeId);
  const currentCourseObj = availableCourses.find((c) => c.id === selectedCourseId);
  const currentBranchObj = availableBranches.find((b) => b.id === selectedBranchId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const finalSubject = (isCustomSubject ? customSubjectInput : selectedSubjectName).trim();
    if (!finalSubject) {
      setErrorMsg('Please specify the subject name for your notes.');
      return;
    }

    const finalUnits = (isCustomUnit ? customUnitInput : selectedUnit).trim();
    if (!finalUnits) {
      setErrorMsg('Please specify the units / modules covered.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Please enter a descriptive note title.');
      return;
    }
    if (isNaN(price) || price < 0) {
      setErrorMsg('Please enter a valid listing price (₹0 or higher).');
      return;
    }
    if (!copyrightPledgeAccepted) {
      setErrorMsg('You must certify that these notes are your original work and not copyrighted textbook scans.');
      return;
    }

    setIsSubmitting(true);

    try {
      let pdfBase64: string | undefined = undefined;
      if (file) {
        pdfBase64 = await fileToBase64(file);
      }

      const newListing = createNewNoteListing({
        title: title.trim(),
        description: description.trim() || `Comprehensive handwritten academic notes for ${finalSubject} covering ${finalUnits} strictly according to ${currentCollegeObj?.name || 'College'} syllabus.`,
        subject: finalSubject,
        subjectId: availableSubjects.find((s) => s.name === finalSubject)?.id,
        university: currentCollegeObj?.affiliatedUniversity || 'Mumbai University (MU)',
        collegeName: currentCollegeObj?.name || 'Vidyalankar Engineering College',
        collegeId: selectedCollegeId,
        degree: currentCourseObj?.name || 'BE / B.Tech',
        courseId: selectedCourseId,
        branch: currentBranchObj?.name || 'Computer Engineering',
        branchId: selectedBranchId,
        semester: selectedSemester,
        unitsCovered: finalUnits,
        unitId: finalUnits,
        academicYear: selectedAcademicYear,
        price,
        sellerId: currentUser?.id || 'guest-seller',
        sellerName: currentUser?.name || 'Guest Contributor',
        sellerRating: currentUser?.rating || 5.0,
        sellerRatingsCount: currentUser?.totalRatingsCount || 1,
        sellerVerified: currentUser?.isVerifiedSenior ?? true,
        sellerCollege: currentCollegeObj?.name || currentUser?.college || 'Vidyalankar Engineering College',
        sellerYear: 'Senior Scholar',
        totalPages: detectedPages || Math.floor(20 + Math.random() * 20),
        fileSizeMb: detectedSizeMb || (file ? Math.round((file.size / (1024 * 1024)) * 10) / 10 : 4.8),
        pdfData: pdfBase64,
        pdfFileName: fileName || (file ? file.name : undefined),
        tags: [finalSubject, `Sem ${selectedSemester}`, currentBranchObj?.code || 'CSE', 'PYQ Solved'],
        hasPYQ,
        hasHandwrittenFormulas,
        textContent: textContent.trim() || undefined,
        aiSynopsis: aiSynopsis.trim() || undefined,
        aiSynopsisGeneratedAt: aiSynopsis.trim() ? new Date().toISOString() : undefined,
        samplePages: [
          {
            pageNumber: 1,
            title: `Unit 1: Overview & Fundamental Concepts in ${finalSubject}`,
            sections: [
              {
                heading: '1.1 Key Principles & Definitions',
                body: textContent ? textContent.slice(0, 300) : `Core principles and theoretical framework according to current ${currentCollegeObj?.name || 'College'} curriculum.`,
                formula: 'F(s) = \\int_0^\\infty f(t) e^{-st} dt \\quad \\text{(Exam high-weightage equation)}',
                pyqAlert: '★ Frequently Asked in End-Sem Exam (7-8 Marks)',
                tips: 'Pro Tip: Include neat step-by-step derivations for full evaluation marks.'
              }
            ]
          },
          {
            pageNumber: 2,
            title: `Unit 2: Solved University Numerical & Diagrams`,
            sections: [
              {
                heading: '2.1 Step-by-Step Solved Problem Model',
                body: 'Detailed working solution with all standard university assumption steps laid out sequentially.',
                diagramDescription: '[Block Architecture / Circuit / Flow Schematic]'
              }
            ]
          }
        ]
      });

      setIsSubmitting(false);
      onSuccess(newListing);
    } catch (err: any) {
      console.error('Failed to submit listing:', err);
      setErrorMsg(err.message || 'Failed to process and upload your PDF note.');
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      id="upload-note-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        id="upload-note-dialog"
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md">
              <UploadCloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white leading-tight">
                Upload & Monetize Your Notes
              </h3>
              <p className="text-xs text-blue-100">
                Linked to Academic Catalog: College → Course → Branch → Semester → Subject → Unit
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Academic Catalog Linkage Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Academic Catalog Hierarchy Linkage</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. College Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  1. College / Institution *
                </label>
                <select
                  value={selectedCollegeId}
                  onChange={(e) => setSelectedCollegeId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {colleges.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name} ({col.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Course / Degree Stream */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  2. Course / Stream *
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {availableCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.durationYears} Years • {c.totalSemesters} Sem)
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Branch Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  3. Branch / Department *
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {availableBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Semester Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  4. Semester *
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {availableSemesters.map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 5. Subject selection & Custom Subject toggle */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  5. Subject Name *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomSubject(!isCustomSubject)}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline"
                >
                  {isCustomSubject ? '← Pick from Catalog' : '+ Enter custom subject'}
                </button>
              </div>

              {!isCustomSubject && availableSubjects.length > 0 ? (
                <select
                  value={selectedSubjectName}
                  onChange={(e) => setSelectedSubjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {availableSubjects.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures & Algorithms or Strength of Materials"
                  value={customSubjectInput}
                  onChange={(e) => setCustomSubjectInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* 6. Units Covered */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  6. Units / Syllabus Modules Covered *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomUnit(!isCustomUnit)}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline"
                >
                  {isCustomUnit ? '← Pick standard unit' : '+ Custom units'}
                </button>
              </div>

              {!isCustomUnit && availableUnits.length > 0 ? (
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {availableUnits.map((u, i) => (
                    <option key={i} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 1 to 5 (Full Syllabus) or Unit 3 & 4"
                  value={customUnitInput}
                  onChange={(e) => setCustomUnitInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </div>

          {/* PDF Drag and Drop Area */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Upload PDF Notes Document *
            </label>
            <div className="border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl p-5 bg-blue-50/50 hover:bg-blue-50 transition text-center cursor-pointer relative">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                {fileName ? (
                  <div>
                    <span className="text-xs font-bold text-blue-900 block truncate max-w-xs">{fileName}</span>
                    <span className="text-[11px] text-emerald-700 font-semibold">✓ PDF Selected ({file ? (file.size / (1024 * 1024)).toFixed(1) : '8.4'} MB)</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Click or Drag & Drop your PDF notes</span>
                    <span className="text-[11px] text-slate-500">Supports PDF up to 45 MB • Must be clean & legible</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Note Title & Academic Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Note Listing Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Complete Handwritten Notes with Solved PYQs"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Academic Year *
              </label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white font-medium"
              >
                {academicYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Short Description & Highlights
            </label>
            <textarea
              rows={2}
              placeholder="Highlight special sections, derivations, or frequent exam questions included..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Textual Content Body (For Gemini AI Synopsis) */}
          <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900">
                    Detailed Notes Text Content Body
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Provide or paste topic notes text to enable instant AI Synopsis generation
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${textContent.length >= 40 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                {textContent.length} chars {textContent.length >= 40 ? '(Ready for AI)' : '(Min 40)'}
              </span>
            </div>

            <textarea
              rows={3}
              placeholder="Paste chapter text, lecture key points, theorem statements, or solved question summaries here to empower student exam revisions with Gemini AI..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleGenerateSynopsis}
                disabled={isGeneratingSynopsis || textContent.trim().length < 40}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                {isGeneratingSynopsis ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing with Gemini 3.7 Flash...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Generate AI Synopsis</span>
                  </>
                )}
              </button>

              {synopsisMessage && (
                <span className={`text-xs font-medium ${synopsisMessage.isError ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {synopsisMessage.text}
                </span>
              )}
            </div>

            {aiSynopsis && (
              <div className="p-3 bg-white rounded-xl border border-blue-200 text-xs text-slate-800 space-y-1 mt-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-blue-700 pb-1 border-b border-blue-100">
                  <span className="flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    Generated AI Synopsis Preview
                  </span>
                  <span className="text-slate-400">Included on Note Page</span>
                </div>
                <p className="whitespace-pre-line text-[11px] leading-relaxed text-slate-700 pt-1">
                  {aiSynopsis}
                </p>
              </div>
            )}
          </div>

          {/* Price & Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Listing Price (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">₹</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={price}
                  onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                You earn <strong className="text-emerald-600">₹{sellerEarnings} (80%)</strong>
              </div>
            </div>

            <div className="sm:col-span-2 flex flex-col justify-center space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={hasPYQ}
                  onChange={(e) => setHasPYQ(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="font-medium">Includes Solved University Previous Year Questions (PYQs)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={hasHandwrittenFormulas}
                  onChange={(e) => setHasHandwrittenFormulas(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="font-medium">Includes Handwritten Formula Sheets & Derivations</span>
              </label>
            </div>
          </div>

          {/* Copyright Pledge */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2.5">
            <input
              type="checkbox"
              id="copyright-pledge"
              checked={copyrightPledgeAccepted}
              onChange={(e) => setCopyrightPledgeAccepted(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <label htmlFor="copyright-pledge" className="text-xs text-slate-700 cursor-pointer leading-relaxed">
              <strong>Senior Honor Code & Originality Pledge:</strong> I certify that these notes are handwritten by me and comply with NoteBridge quality guidelines. I will receive payments to verified account <strong>Raj Sambhaji Bhosale</strong>.
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Publishing Listing...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Submit Notes for Approval</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
