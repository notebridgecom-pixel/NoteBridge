import React, { useState, useEffect, useRef } from 'react';
import { User, AiDocumentSummaryResult, AiSummaryMode, NoteItem } from '../types';
import { 
  parseUploadedDocument, 
  generateDocumentSummary, 
  getSavedAiSummaries, 
  deleteSavedAiSummary,
  downloadSummaryPdf
} from '../utils/aiDocumentSummarizerService';
import { AiDocumentSummaryViewer } from '../components/AiDocumentSummaryViewer';
import { 
  Sparkles, 
  UploadCloud, 
  FileText, 
  BookOpen, 
  Zap, 
  Award, 
  HelpCircle, 
  Clock, 
  Trash2, 
  Download, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  FileCheck, 
  ArrowRight,
  Bookmark,
  Layers,
  ChevronRight,
  Library,
  Lightbulb,
  Search
} from 'lucide-react';

interface AiSummarizerPageProps {
  currentUser: User | null;
  onBrowseNotes?: () => void;
  onOpenNote?: (noteId: string) => void;
  initialDocumentText?: string;
  initialTitle?: string;
}

const SAMPLE_DOCS = [
  {
    title: 'Computer Networks - TCP/IP & Subnetting',
    subject: 'Computer Networks',
    university: 'SPPU Pune University',
    semester: 5,
    text: `Chapter 4: Network Layer & IP Addressing.
The IP layer is responsible for host-to-host communication across heterogeneous networks. IPv4 addresses are 32-bit logical addresses written in dotted-decimal format (e.g., 192.168.1.1). Subnetting allows network administrators to divide a large network into smaller, manageable sub-networks using subnet masks.
Key concepts:
1. Classful vs Classless Inter-Domain Routing (CIDR). Class A (/8), Class B (/16), Class C (/24).
2. Subnet calculation: Number of subnets = 2^s where s is borrowed bits. Usable host IPs per subnet = 2^h - 2 (subtracting network ID and broadcast address).
3. Address Resolution Protocol (ARP): Maps IP addresses to MAC addresses dynamically using broadcast request and unicast reply.
4. Routing Algorithms: Distance Vector (Bellman-Ford algorithm, suffering from Count-to-Infinity problem, mitigated by Split Horizon) and Link State Routing (Dijkstra's Shortest Path First algorithm).
Exam PYQ: Calculate subnet mask, first host, last host, and broadcast address for 200.100.10.0/27. Explain 3-way handshake in TCP connection establishment.`
  },
  {
    title: 'Data Structures - Binary Search Trees & AVL Trees',
    subject: 'Data Structures & Algorithms',
    university: 'Mumbai University',
    semester: 3,
    text: `Module 3: Tree Data Structures & Self-Balancing Trees.
A Binary Search Tree (BST) is a hierarchical node-based structure where the key in each node is greater than all keys in its left subtree and less than all keys in its right subtree.
Time Complexity of BST:
- Average Case Search, Insertion, Deletion: O(log n)
- Worst Case (Skewed Tree): O(n)
To prevent worst-case degradation, AVL Trees maintain height balance. Balance Factor = Height(Left Subtree) - Height(Right Subtree). For every node in an AVL tree, Balance Factor must be in {-1, 0, +1}.
Rotations in AVL:
1. LL Rotation (Single Right Rotation when inserted into left subtree of left child)
2. RR Rotation (Single Left Rotation when inserted into right subtree of right child)
3. LR Rotation (Double rotation: Left rotation on left child followed by Right rotation on root)
4. RL Rotation (Double rotation: Right rotation on right child followed by Left rotation on root)
University 10-Mark Question: Construct an AVL tree by inserting the sequence: 50, 20, 60, 10, 8, 15, 30, 25. Show balance factors at each step and indicate required rotations.`
  },
  {
    title: 'Engineering Physics - Quantum Mechanics & Band Theory',
    subject: 'Engineering Physics',
    university: 'VTU Karnataka',
    semester: 1,
    text: `Unit 1: Quantum Mechanics & Wave-Particle Duality.
De Broglie Hypothesis states that matter exhibits wave-like properties with wavelength λ = h / p = h / (m*v).
Heisenberg Uncertainty Principle: Δx * Δp >= h / (4π). It is fundamentally impossible to simultaneously determine both the exact position and momentum of a subatomic particle.
Schrodinger's Time-Independent Wave Equation: (d²ψ/dx²) + (8π²m/h²)(E - V)ψ = 0.
Applications: Particle trapped in an infinite 1D potential well (box of width L).
Energy Eigenvalues: En = (n² * h²) / (8 * m * L²), where n = 1, 2, 3...
Kronig-Penney Model explains the origin of energy bands in solids (Conduction Band, Valence Band, and Forbidden Energy Gap Eg).
Classifications:
- Conductors: Overlapping bands (Eg = 0)
- Semiconductors: Small band gap (Eg ≈ 1.1 eV for Silicon, 0.7 eV for Germanium)
- Insulators: Wide band gap (Eg > 3 eV).`
  }
];

export const AiSummarizerPage: React.FC<AiSummarizerPageProps> = ({
  currentUser,
  onBrowseNotes,
  onOpenNote,
  initialDocumentText = '',
  initialTitle = '',
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create');
  const [inputText, setInputText] = useState(initialDocumentText);
  const [docTitle, setDocTitle] = useState(initialTitle || '');
  const [subject, setSubject] = useState('');
  const [university, setUniversity] = useState(currentUser?.university || 'University Syllabus');
  const [semester, setSemester] = useState(currentUser?.semester?.toString() || '');
  const [studyMode, setStudyMode] = useState<AiSummaryMode>('comprehensive');
  
  // Uploaded file info
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | undefined>(undefined);
  const [fileMimeType, setFileMimeType] = useState<string>('application/pdf');
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Summarization State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentSummary, setCurrentSummary] = useState<AiDocumentSummaryResult | null>(null);

  // Saved summaries history
  const [savedSummaries, setSavedSummaries] = useState<AiDocumentSummaryResult[]>([]);
  const [savedSearchQuery, setSavedSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setSavedSummaries(getSavedAiSummaries());
  }, [currentSummary, activeTab]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsParsingFile(true);
    setErrorMessage('');
    try {
      setUploadedFile(file);
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      }

      const parsed = await parseUploadedDocument(file);
      if (parsed.text && parsed.text.length > 20) {
        setInputText(parsed.text);
      }
      if (parsed.base64) {
        setFileBase64(parsed.base64);
        setFileMimeType(parsed.mimeType);
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMessage('Could not process document file. Please paste text directly or try another file.');
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleGenerate = async (overrideMode?: AiSummaryMode) => {
    const modeToUse = overrideMode || studyMode;
    const hasText = inputText.trim().length >= 20;
    const hasFile = !!fileBase64;

    if (!hasText && !hasFile) {
      setErrorMessage('Please upload a document or paste at least 20 characters of notes text.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const summaryResult = await generateDocumentSummary({
        textContent: inputText,
        fileBase64,
        mimeType: fileMimeType,
        title: docTitle || uploadedFile?.name || 'Academic Study Document',
        subject: subject || 'Course Subject',
        university: university || 'Indian University',
        semester: semester || undefined,
        mode: modeToUse,
      });

      setCurrentSummary(summaryResult);
      // Auto refresh saved list
      setSavedSummaries(getSavedAiSummaries());
      // Scroll smoothly to results
      window.scrollTo({ top: 400, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Generate summary error:', err);
      setErrorMessage(err.message || 'Failed to generate summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = (sample: typeof SAMPLE_DOCS[0]) => {
    setDocTitle(sample.title);
    setSubject(sample.subject);
    setUniversity(sample.university);
    setSemester(sample.semester.toString());
    setInputText(sample.text);
    setUploadedFile(null);
    setFileBase64(undefined);
    setErrorMessage('');
  };

  const handleDeleteSaved = (id: string) => {
    deleteSavedAiSummary(id);
    setSavedSummaries((prev) => prev.filter((s) => s.id !== id));
    if (currentSummary?.id === id) {
      setCurrentSummary(null);
    }
  };

  const filteredSavedSummaries = savedSummaries.filter((s) => {
    const q = savedSearchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || (s.subject && s.subject.toLowerCase().includes(q));
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-extrabold rounded-full backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>NoteBridge AI Academic Engine • Google Gemini 3.7</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black font-heading text-white tracking-tight leading-tight">
            AI Document Summarizer & Exam Study Pack Generator
          </h1>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            Upload any college document, syllabus PDF, handwritten notes photo, or lecture transcript. Get high-yield exam cheat-sheets, high-probability PYQs, formulas breakdown, and interactive practice quizzes in seconds.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'create'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Summarize New Document</span>
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 relative ${
                activeTab === 'saved'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved AI Summaries</span>
              {savedSummaries.length > 0 && (
                <span className="px-2 py-0.5 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full">
                  {savedSummaries.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio View */}
      {activeTab === 'create' ? (
        <div className="space-y-8">
          {/* Upload & Input Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Document Input & Study Preferences</span>
                </h2>
                <p className="text-xs text-slate-500">Upload PDF / Word / Image or paste lecture text</p>
              </div>

              {/* Sample presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Quick Samples:</span>
                {SAMPLE_DOCS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleLoadSample(s)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-xs font-semibold rounded-lg transition"
                  >
                    {s.subject}
                  </button>
                ))}
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/70'
                  : uploadedFile
                  ? 'border-emerald-300 bg-emerald-50/40'
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                {isParsingFile ? (
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                ) : uploadedFile ? (
                  <FileCheck className="w-6 h-6 text-emerald-600" />
                ) : (
                  <UploadCloud className="w-6 h-6 text-blue-600" />
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  {isParsingFile
                    ? 'Extracting and reading document content...'
                    : uploadedFile
                    ? `Uploaded: ${uploadedFile.name} (${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB)`
                    : 'Click or Drag & Drop PDF, Scanned Notes Image, or Text File'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Supports PDF, Scanned handwritten note images (PNG/JPG), TXT, Markdown (Max 25MB)
                </p>
              </div>

              {uploadedFile && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-0.5 rounded-full">
                    ✓ Ready for AI Analysis
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedFile(null);
                      setFileBase64(undefined);
                      setInputText('');
                    }}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Remove File
                  </button>
                </div>
              )}
            </div>

            {/* Document Metadata Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Document / Topic Title *
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Unit 3: Dynamic Programming"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Subject / Course
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  University / Board
                </label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. SPPU Pune / Mumbai Univ / VTU"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Target Study Mode
                </label>
                <select
                  value={studyMode}
                  onChange={(e) => setStudyMode(e.target.value as AiSummaryMode)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="comprehensive">Comprehensive Exam Study Guide</option>
                  <option value="exam_revision">5-Minute Exam Revision Cheat-Sheet</option>
                  <option value="formulas_theorems">Formulas & Theorems Sheet</option>
                  <option value="pyq_viva">Exam PYQs & Viva Practice</option>
                  <option value="quiz">Interactive Practice Quiz</option>
                </select>
              </div>
            </div>

            {/* Direct Text Editor / Extracted Text Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Document Text Content / Syllabus Breakdown {inputText ? `(${inputText.length} chars)` : ''}
                </label>
                {inputText && (
                  <button
                    type="button"
                    onClick={() => setInputText('')}
                    className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold"
                  >
                    Clear Text
                  </button>
                )}
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste lecture notes, chapter text, key derivations, or syllabus points here..."
                rows={6}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* CTA Button */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Instant parsing with Gemini 3.7 Flash • Generates formulas, PYQs & quizzes</span>
              </div>

              <button
                id="btn-generate-ai-summary"
                disabled={isLoading}
                onClick={() => handleGenerate()}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing & Synthesizing Study Pack...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate AI Study Summary</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Viewer Section */}
          {currentSummary && (
            <div id="ai-summary-results-section" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Generated AI Study Pack</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  Ready for revision & PDF download
                </span>
              </div>

              <AiDocumentSummaryViewer
                summary={currentSummary}
                onRegenerate={(newMode) => handleGenerate(newMode)}
                isRegenerating={isLoading}
              />
            </div>
          )}
        </div>
      ) : (
        /* Saved Summaries Library View */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-blue-600" />
                <span>My Saved AI Study Packs ({savedSummaries.length})</span>
              </h2>
              <p className="text-xs text-slate-500">Access and download your previously generated AI summaries</p>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={savedSearchQuery}
                onChange={(e) => setSavedSearchQuery(e.target.value)}
                placeholder="Search saved summaries..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {filteredSavedSummaries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSavedSummaries.map((summary) => (
                <div
                  key={summary.id}
                  className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-3 transition flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                        {summary.subject || 'Academic'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(summary.generatedAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {summary.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {summary.executiveSummary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 gap-2">
                    <button
                      onClick={() => {
                        setCurrentSummary(summary);
                        setActiveTab('create');
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <span>Open Study Pack</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => downloadSummaryPdf(summary)}
                        className="p-1.5 bg-white hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(summary.id)}
                        className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 transition"
                        title="Delete Summary"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
                <Bookmark className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Saved Summaries Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Generate your first AI Study Pack by uploading a document or notes above.
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
              >
                Summarize a Document
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
