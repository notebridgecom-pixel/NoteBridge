import React, { useState } from 'react';
import { 
  Search, 
  BookOpen, 
  UploadCloud, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Star, 
  TrendingUp, 
  Award, 
  IndianRupee, 
  GraduationCap, 
  Layers, 
  Lock, 
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Users,
  Download,
  Percent,
  Flame,
  Filter,
  CheckCircle,
  Sliders,
  Compass,
  BookmarkCheck,
  Shield,
  ThumbsUp,
  School
} from 'lucide-react';
import { getColleges, getBranches, getCourses } from '../utils/catalogStorage';
import { POPULAR_SUBJECTS } from '../data/mockData';
import { NoteItem } from '../types';
import { NoteCard } from '../components/NoteCard';

const SEMESTERS = ['All Semesters', 'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

const STREAMS_LIST = [
  { id: 'all', name: 'All Streams', icon: Compass },
  { id: 'btech', name: 'B.Tech / B.E.', icon: GraduationCap },
  { id: 'diploma', name: 'Diploma / Polytechnic', icon: School },
  { id: 'bca', name: 'BCA / MCA', icon: Layers },
  { id: 'bsc', name: 'B.Sc / Science', icon: BookOpen },
];

const FAQS = [
  {
    q: 'How does the free 3-page preview work?',
    a: 'Every note listed on NoteBridge has its first 2 to 3 pages freely viewable with an anti-tamper watermark. You can inspect the author’s handwriting clarity, diagram precision, and syllabus alignment before paying a single rupee.'
  },
  {
    q: 'How do I download the PDF after paying with UPI?',
    a: 'Once you complete your payment via PhonePe, Google Pay, or Paytm and submit the 12-digit UTR / Transaction ID, your order is verified and the clean, high-resolution watermark-free PDF is immediately unlocked in your Library for unlimited offline reading.'
  },
  {
    q: 'How much do senior note authors earn and when are payouts sent?',
    a: 'Senior authors receive 80% of every sale directly to their UPI ID or bank account. NoteBridge charges a modest 20% platform fee to maintain server bandwidth, security, and verification infrastructure. Withdrawal requests are processed in under 3 hours.'
  },
  {
    q: 'Are the notes aligned with official university syllabi?',
    a: 'Yes! Notes are categorized strictly by University (e.g. Mumbai University, SPPU Pune, MSBTE, VTU, AKTU), Academic Stream, Branch, and Semester. Sellers must tag the exact subject code and syllabus scheme (e.g., MSBTE I-Scheme or MU Rev-2019).'
  },
  {
    q: 'Can I sell my handwritten notes if I am a Diploma or First Year student?',
    a: 'Absolutely! Any student with clean handwritten notes, solved previous year questions (PYQs), formula cheat sheets, or lab code summaries can upload their PDF and start earning passive income right away.'
  },
  {
    q: 'What if the note has quality issues or missing pages?',
    a: 'You can report any problematic note directly through our buyer dispute system. Our moderator team reviews flagged notes and issues wallet credits or full refunds if the content violates quality guidelines.'
  }
];

interface HomePageProps {
  onNavigate: (page: string, params?: any) => void;
  onOpenUpload: () => void;
  onPreviewNote: (note: NoteItem) => void;
  onBuyNote: (note: NoteItem) => void;
  featuredNotes: NoteItem[];
  purchasedNoteIds: string[];
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onOpenUpload,
  onPreviewNote,
  onBuyNote,
  featuredNotes,
  purchasedNoteIds,
}) => {
  const dynamicColleges = getColleges(false);
  const dynamicCourses = getCourses(undefined, false);

  // Search bar state
  const [selectedStream, setSelectedStream] = useState('All Streams');
  const [selectedCollege, setSelectedCollege] = useState('All Colleges');
  const [selectedBranch, setSelectedBranch] = useState('All Branches');
  const [selectedSemester, setSelectedSemester] = useState('All Semesters');
  const [subjectQuery, setSubjectQuery] = useState('');

  // Dynamically resolve branches matching the chosen stream/college with strict uniqueness
  const selectedCourseObj = selectedStream !== 'All Streams' ? dynamicCourses.find((c) => c.name.toLowerCase() === selectedStream.toLowerCase()) : undefined;
  const selectedCollegeObj = selectedCollege !== 'All Colleges' ? dynamicColleges.find((c) => c.name.toLowerCase() === selectedCollege.toLowerCase()) : undefined;

  const rawBranches = getBranches(selectedCourseObj?.id, selectedCollegeObj?.id, false);
  const dynamicBranches = Array.from(
    new Map(rawBranches.map((b) => [b.name.toLowerCase().trim(), b])).values()
  );

  // Active category filter for featured notes
  const [activeNoteCategory, setActiveNoteCategory] = useState<'all' | 'pyqs' | 'topper' | 'cheatsheet'>('all');

  // Stream explorer active tab
  const [activeStreamTab, setActiveStreamTab] = useState('all');

  // Senior Earnings Calculator State
  const [calcNotesCount, setCalcNotesCount] = useState<number>(4);
  const [calcBuyersPerSem, setCalcBuyersPerSem] = useState<number>(45);
  const [calcAvgPrice, setCalcAvgPrice] = useState<number>(49);

  // FAQ open index
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Earnings calculations
  const totalGrossSales = calcNotesCount * calcBuyersPerSem * calcAvgPrice;
  const seniorTakeHomeEarnings = Math.round(totalGrossSales * 0.80);
  const platformFee = Math.round(totalGrossSales * 0.20);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('browse', {
      degree: selectedStream !== 'All Streams' ? selectedStream : undefined,
      collegeName: selectedCollege !== 'All Colleges' ? selectedCollege : undefined,
      branch: selectedBranch !== 'All Branches' ? selectedBranch : undefined,
      semester: selectedSemester !== 'All Semesters' ? selectedSemester : undefined,
      searchQuery: subjectQuery.trim() || undefined,
    });
  };

  const handleSubjectClick = (subjectName: string) => {
    onNavigate('browse', {
      subject: subjectName,
      searchQuery: subjectName,
    });
  };

  const handleStreamClick = (streamName: string) => {
    onNavigate('browse', {
      degree: streamName !== 'All Streams' ? streamName : undefined,
    });
  };

  // Filtered featured notes based on category
  const filteredNotes = featuredNotes.filter((note) => {
    if (activeNoteCategory === 'all') return true;
    const title = (note.title + ' ' + (note.description || '') + ' ' + (note.subject || '')).toLowerCase();
    if (activeNoteCategory === 'pyqs') return title.includes('pyq') || title.includes('question') || title.includes('exam') || title.includes('solved');
    if (activeNoteCategory === 'topper') return (note.rating && note.rating >= 4.8) || (note.authorCgpa && note.authorCgpa >= 9.0) || title.includes('topper') || title.includes('handwritten');
    if (activeNoteCategory === 'cheatsheet') return title.includes('formula') || title.includes('cheat') || title.includes('summary') || title.includes('short');
    return true;
  });

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION & SMART MULTI-LEVEL SEARCH ENGINE */}
      {/* ========================================================================= */}
      <section className="relative pt-6 sm:pt-12 pb-8 sm:pb-16 overflow-hidden">
        {/* Background Gradients & Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[32rem] bg-gradient-to-b from-blue-100/70 via-indigo-50/40 to-transparent pointer-events-none -z-10 rounded-3xl" />
        <div className="absolute -top-12 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-48 -left-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Top Live Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-900 text-xs sm:text-sm font-semibold shadow-xs">
            <span className="flex h-2.5 w-2.5 rounded-full bg-blue-600 animate-ping" />
            <span className="font-bold">India&apos;s #1 Academic Marketplace</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-normal">B.Tech, Diploma, BCA &amp; Science</span>
          </div>

          {/* Hero Headlines */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight font-heading leading-tight sm:leading-none">
              Ace Your College Exams with{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                Verified Senior Notes
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
              Buy 100% syllabus-aligned handwritten notes, solved PYQs, and formula cheat sheets from verified college rankers.
            </p>
          </div>

          {/* Trust Highlights Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/80 border border-slate-200/80 rounded-full shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>100% Syllabus Aligned</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/80 border border-slate-200/80 rounded-full shadow-2xs">
              <Eye className="w-4 h-4 text-orange-500" />
              <span>3-Page Free Previews</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/80 border border-slate-200/80 rounded-full shadow-2xs">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Instant UPI &amp; PDF Download</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/80 border border-slate-200/80 rounded-full shadow-2xs">
              <IndianRupee className="w-4 h-4 text-purple-600" />
              <span>Seniors Earn 80% Payout</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            <button
              id="hero-browse-notes-btn"
              onClick={() => onNavigate('browse')}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl font-bold text-base shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              <span>Explore All Notes</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>

            <button
              id="hero-sell-notes-btn"
              onClick={onOpenUpload}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 active:scale-95 text-slate-800 border-2 border-slate-200 hover:border-blue-300 rounded-2xl font-bold text-base shadow-xs transition flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-5 h-5 text-blue-600" />
              <span>Sell Your Notes</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full ml-1">
                Earn 80%
              </span>
            </button>

            <button
              id="hero-ai-summarizer-btn"
              onClick={() => onNavigate('ai-summarizer')}
              className="w-full sm:w-auto px-7 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 active:scale-95 text-white rounded-2xl font-bold text-base shadow-md transition flex items-center justify-center gap-2 border border-blue-700/50"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>AI Document Summarizer</span>
              <span className="text-xs bg-amber-400 text-slate-900 font-black px-2 py-0.5 rounded-full ml-1">
                Gemini 3.7
              </span>
            </button>
          </div>

          {/* 5-Field Smart Search Hub */}
          <div className="pt-2">
            <form
              id="hero-quick-search-form"
              onSubmit={handleQuickSearch}
              className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-200/80 max-w-5xl mx-auto text-left"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    Smart Syllabus &amp; Subject Search
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Matches your exact university &amp; department scheme
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* 1. Academic Stream */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    1. Stream
                  </label>
                  <select
                    id="search-stream"
                    value={selectedStream}
                    onChange={(e) => setSelectedStream(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="All Streams">All Streams</option>
                    <option value="Diploma">Diploma</option>
                    <option value="B.Tech / B.E.">B.Tech / B.E.</option>
                    <option value="BCA">BCA</option>
                    <option value="B.Sc Computer Science / IT">B.Sc CS / IT</option>
                    <option value="M.Tech / M.E.">M.Tech</option>
                    <option value="MCA">MCA</option>
                  </select>
                </div>

                {/* 2. College / University */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    2. College / Uni
                  </label>
                  <select
                    id="search-college"
                    value={selectedCollege}
                    onChange={(e) => setSelectedCollege(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="All Colleges">All Institutions</option>
                    {dynamicColleges.map((c) => (
                      <option key={c.id} value={c.name}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                {/* 3. Branch / Dept */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    3. Branch
                  </label>
                  <select
                    id="search-branch"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="All Branches">All Branches</option>
                    {dynamicBranches.map((b) => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Semester */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    4. Semester
                  </label>
                  <select
                    id="search-sem"
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                  >
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* 5. Subject Keyword */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    5. Subject / Topic
                  </label>
                  <input
                    id="search-subject-input"
                    type="text"
                    placeholder="e.g. Maths, DSA, TE"
                    value={subjectQuery}
                    onChange={(e) => setSubjectQuery(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              {/* Submit trigger & trending tags */}
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <span className="font-bold text-slate-700">Quick Tags:</span>
                  <button type="button" onClick={() => handleSubjectClick('Electronics and Computer Engineering')} className="text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md font-semibold transition">Electronics &amp; Computer Engg</button>
                  <button type="button" onClick={() => handleSubjectClick('Telecommunication Engineering (TE)')} className="text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md font-semibold transition">TE Core Notes</button>
                  <button type="button" onClick={() => handleSubjectClick('Engineering Mathematics')} className="text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md font-semibold transition">M-2 / M-3</button>
                  <button type="button" onClick={() => handleSubjectClick('Data Structures & Algorithms')} className="text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md font-semibold transition">DSA &amp; Trees</button>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Matched Notes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ACADEMIC STREAM & PROGRAM EXPLORER */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
              Structured Study Tracks
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              Explore by Academic Program
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select your degree stream to find curriculum-synchronized notes and lab manuals.
            </p>
          </div>
          
          {/* Stream Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            {STREAMS_LIST.map((st) => {
              const Icon = st.icon;
              const isActive = activeStreamTab === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setActiveStreamTab(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    isActive 
                      ? 'bg-white text-blue-700 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{st.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: B.Tech / B.E. */}
          <div 
            onClick={() => handleStreamClick('B.Tech / B.E.')}
            className="group p-6 bg-white rounded-3xl border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition cursor-pointer space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition">
                B.Tech / B.E. Engineering
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                4-Year Degree • Sem 1 to Sem 8. CSE, Electronics & Computer Engg (ECE), IT, TE, AI/DS, Mech, Civil.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-bold text-blue-600">
              <span>View B.Tech Notes</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 2: Diploma / Polytechnic */}
          <div 
            onClick={() => handleStreamClick('Diploma')}
            className="group p-6 bg-white rounded-3xl border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition cursor-pointer space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 group-hover:text-purple-600 transition">
                Diploma / Polytechnic
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                3-Year Course • Sem 1 to Sem 6. MSBTE I-Scheme, Board syllabus notes, solved model question papers.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-bold text-purple-600">
              <span>View Diploma Notes</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 3: BCA / MCA Computer Apps */}
          <div 
            onClick={() => handleStreamClick('BCA')}
            className="group p-6 bg-white rounded-3xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition cursor-pointer space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-600 transition">
                BCA / MCA Computer Applications
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Software Dev, Java, Web Technologies, Database Systems, Networking, and Project Viva guides.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-bold text-emerald-600">
              <span>View BCA / MCA Notes</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 4: B.Sc Science & IT */}
          <div 
            onClick={() => handleStreamClick('B.Sc Computer Science / IT')}
            className="group p-6 bg-white rounded-3xl border border-slate-200/80 hover:border-amber-300 hover:shadow-md transition cursor-pointer space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 group-hover:text-amber-600 transition">
                B.Sc CS, IT &amp; Sciences
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Core mathematics, algorithms, cyber security, statistics, cloud computing, and practical manuals.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-bold text-amber-600">
              <span>View B.Sc Notes</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FEATURED NOTES & TOP-RATED SENIOR STUDY MATERIAL */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
              Exam Hall Ready
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              Top Rated Notes by Verified Seniors
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Handpicked handwritten notes, solved past papers, and formula summaries with 4.8+ ratings.
            </p>
          </div>

          {/* Note Category Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveNoteCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeNoteCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Top Notes
            </button>
            <button
              onClick={() => setActiveNoteCategory('pyqs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeNoteCategory === 'pyqs'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📝 Solved PYQs
            </button>
            <button
              onClick={() => setActiveNoteCategory('topper')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeNoteCategory === 'topper'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ⭐ Topper Handwritten (9+ CGPA)
            </button>
            <button
              onClick={() => setActiveNoteCategory('cheatsheet')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeNoteCategory === 'cheatsheet'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ⚡ Formula Sheets
            </button>
          </div>
        </div>

        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.slice(0, 6).map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onPreview={onPreviewNote}
                onBuy={onBuyNote}
                onOpenDetail={(n) => onNavigate('note-detail', { noteId: n.id })}
                isPurchased={purchasedNoteIds.includes(note.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-xs space-y-4 max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Be the First Senior to Publish Notes</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Share your handwritten semester notes, formula cheat sheets, or solved PYQs and earn 80% direct to your UPI.
              </p>
            </div>
            <button
              onClick={onOpenUpload}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs transition inline-flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Notes Now</span>
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => onNavigate('browse')}
            className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-xs transition inline-flex items-center gap-2"
          >
            <span>Browse Full Catalog of 500+ University Notes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. POPULAR ENGINEERING & DIPLOMA SUBJECTS */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
              Curated Study Material
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              Popular Engineering &amp; Core Subjects
            </h2>
          </div>
          <button
            onClick={() => onNavigate('browse')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View all subjects</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {POPULAR_SUBJECTS.map((subj) => (
            <div
              key={subj.name}
              onClick={() => handleSubjectClick(subj.name)}
              className="group p-6 bg-white rounded-3xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition cursor-pointer flex items-start justify-between"
            >
              <div className="space-y-2 pr-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition">
                    {subj.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {subj.description}
                </p>
                <span className="inline-block text-[11px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200/60 px-3 py-0.5 rounded-full">
                  {subj.count}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-slate-900 group-hover:text-white text-slate-400 flex items-center justify-center transition flex-shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE SENIOR EARNINGS CALCULATOR */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white rounded-[2.5rem] p-6 sm:p-12 shadow-md relative overflow-hidden">
          {/* Subtle Ambient Shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Calculator Controls */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-purple-300 bg-purple-900/60 border border-purple-700/50 px-3 py-1 rounded-full">
                  Senior Author Revenue Simulator
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-heading">
                  How Much Can You Earn from Your Notes?
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                  Set your note count, expected semester buyers, and pricing. See your verified 80% direct net payout in real-time.
                </p>
              </div>

              {/* Sliders Container */}
              <div className="space-y-5 bg-white/5 border border-white/10 p-5 sm:p-6 rounded-3xl backdrop-blur-xs">
                {/* Slider 1: Number of Notes */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200">Notes Published:</span>
                    <span className="font-extrabold text-purple-300 bg-purple-900/80 px-2.5 py-0.5 rounded-lg font-mono">
                      {calcNotesCount} Subject Notes
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={calcNotesCount}
                    onChange={(e) => setCalcNotesCount(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>1 Note (Single Subject)</span>
                    <span>10 Notes</span>
                    <span>20 Notes (Full Semesters)</span>
                  </div>
                </div>

                {/* Slider 2: Estimated Buyers per Note */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200">Estimated Buyers per Semester:</span>
                    <span className="font-extrabold text-blue-300 bg-blue-900/80 px-2.5 py-0.5 rounded-lg font-mono">
                      {calcBuyersPerSem} Students / Note
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={200}
                    step={5}
                    value={calcBuyersPerSem}
                    onChange={(e) => setCalcBuyersPerSem(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>10 Classmates</span>
                    <span>100 Batchmates</span>
                    <span>200 College Students</span>
                  </div>
                </div>

                {/* Slider 3: Price per Note */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200">Price per Note:</span>
                    <span className="font-extrabold text-emerald-300 bg-emerald-900/80 px-2.5 py-0.5 rounded-lg font-mono">
                      ₹{calcAvgPrice}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={19}
                    max={199}
                    step={10}
                    value={calcAvgPrice}
                    onChange={(e) => setCalcAvgPrice(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>₹19 (Quick Cheat Sheet)</span>
                    <span>₹99 (Full Module)</span>
                    <span>₹199 (Complete Bundle)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Earnings Result Box */}
            <div className="lg:col-span-5 bg-white/10 border border-white/15 p-6 sm:p-8 rounded-[2rem] space-y-6 text-center lg:text-left backdrop-blur-md">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                  Your Net Take-Home (80%)
                </span>
                <div className="text-4xl sm:text-5xl font-black font-heading text-white tracking-tight">
                  ₹{seniorTakeHomeEarnings.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-300">
                  Transferred directly to your PhonePe / GPay UPI
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Gross Student Purchases:</span>
                  <span className="font-bold font-mono text-white">₹{totalGrossSales.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Senior Payout Share (80%):</span>
                  <span className="font-bold font-mono text-emerald-400">₹{seniorTakeHomeEarnings.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>NoteBridge Infrastructure Fee (20%):</span>
                  <span className="font-bold font-mono text-purple-300">₹{platformFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Average Withdrawal Processing:</span>
                  <span className="font-bold text-amber-300">Under 3 Hours</span>
                </div>
              </div>

              <button
                onClick={onOpenUpload}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black rounded-2xl text-sm transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-5 h-5" />
                <span>Upload Notes &amp; Start Earning</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. HOW IT WORKS (3-STEP INTERACTIVE WORKFLOW) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
            Frictionless 3-Step Experience
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-heading">
            How NoteBridge Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Zero complicated signups. Built specifically for college exams and verified academic notes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Step 1 */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
              1
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Filter by University &amp; Branch
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Find notes customized strictly to your university syllabus, engineering branch, and semester. Filter by top ratings and solved PYQs.
            </p>
            <div className="pt-2 text-xs text-blue-600 font-bold flex items-center gap-1">
              <span>Syllabus 100% matched</span>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white font-black text-lg flex items-center justify-center shadow-xs">
              2
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Read Free 3-Page Sample
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Read the first 2–3 pages for free. Check handwriting legibility, diagram clarity, and senior seller credentials before paying a single rupee.
            </p>
            <div className="pt-2 text-xs text-orange-600 font-bold flex items-center gap-1">
              <span>Free 3-page preview</span>
              <Eye className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
              3
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Pay via UPI &amp; Download PDF
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Pay ₹19–₹199 seamlessly via Google Pay, PhonePe, or Paytm. Download your clean, high-resolution PDF instantly to your device library.
            </p>
            <div className="pt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
              <span>Instant Clean PDF Access</span>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. NOTEBRIDGE VS RANDOM GROUPS COMPARISON MATRIX */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[2.5rem] border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
              Why Students Choose NoteBridge
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              NoteBridge vs. Random WhatsApp &amp; Telegram Groups
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Stop scrolling through endless unverified forwarded PDFs before exam day.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase">
                  <th className="pb-4 pt-2">Feature / Guarantee</th>
                  <th className="pb-4 pt-2 text-blue-700 bg-blue-50/70 px-4 rounded-t-2xl font-extrabold">NoteBridge Verified</th>
                  <th className="pb-4 pt-2 text-slate-500 px-4">WhatsApp / Telegram Groups</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-4 font-semibold text-slate-800">Syllabus Alignment</td>
                  <td className="py-4 px-4 bg-blue-50/40 text-blue-900 font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>100% University Verified</span>
                  </td>
                  <td className="py-4 px-4 text-slate-500">Often outdated, wrong scheme</td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold text-slate-800">Preview Before Buying</td>
                  <td className="py-4 px-4 bg-blue-50/40 text-blue-900 font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Free 3-Page Handwriting Preview</span>
                  </td>
                  <td className="py-4 px-4 text-slate-500">Blind download, often corrupt</td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold text-slate-800">Document Quality &amp; Diagrams</td>
                  <td className="py-4 px-4 bg-blue-50/40 text-blue-900 font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>High-Res Scanned PDFs</span>
                  </td>
                  <td className="py-4 px-4 text-slate-500">Blurry phone camera photos</td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold text-slate-800">Senior Author Compensation</td>
                  <td className="py-4 px-4 bg-blue-50/40 text-blue-900 font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>80% Direct UPI Payouts to Authors</span>
                  </td>
                  <td className="py-4 px-4 text-slate-500">Zero compensation for hard work</td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold text-slate-800">Offline Library Persistence</td>
                  <td className="py-4 px-4 bg-blue-50/40 text-blue-900 font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Permanent Cloud Library Access</span>
                  </td>
                  <td className="py-4 px-4 text-slate-500">Links expire or get deleted</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. STUDENT & SENIOR TESTIMONIALS (SOCIAL PROOF) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
            Real Reviews
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-heading">
            Loved by 12,000+ College Students &amp; Seniors
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Review 1 */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
              <Star className="w-4 h-4 fill-amber-400" />
              <Star className="w-4 h-4 fill-amber-400" />
              <Star className="w-4 h-4 fill-amber-400" />
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
              &quot;The Engineering Mathematics-3 notes saved my semester! The step-by-step Laplace and Fourier solutions were identical to the questions in Mumbai University paper.&quot;
            </p>
            <div className="pt-2 flex items-center gap-3 border-t border-slate-100">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                AB
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Aarav Bhosale</h4>
                <p className="text-[11px] text-slate-500">2nd Year B.Tech • VIT Mumbai</p>
              </div>
            </div>
          </div>

          {/* Review 2 */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
              <Star className="w-4 h-4 fill-amber-400" />
              <Star className="w-4 h-4 fill-amber-400" />
              <Star className="w-4 h-4 fill-amber-400" />
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
              &quot;I uploaded my 5th sem Telecommunication &amp; Microcontroller notes. In just one exam month, I made over ₹7,400 with the 80% payout directly to my PhonePe UPI!&quot;
            </p>
            <div className="pt-2 flex items-center gap-3 border-t border-slate-100">
              <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                RD
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Rohan Deshmukh</h4>
                <p className="text-[11px] text-slate-500">4th Year Senior • Vidyalankar</p>
              </div>
            </div>
          </div>

          {/* Review 3 */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
              <Star className="w-4 h-4 fill-amber-400" />
              <Star className="w-4 h-4 fill-amber-400" />
              <Star className="w-4 h-4 fill-amber-400" />
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
              &quot;Being a Diploma student, it was so hard to find proper MSBTE I-Scheme notes. NoteBridge had the exact subject codes and solved question banks with diagrams.&quot;
            </p>
            <div className="pt-2 flex items-center gap-3 border-t border-slate-100">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                SK
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Sneha Kulkarni</h4>
                <p className="text-[11px] text-slate-500">Diploma Comp Engg • MSBTE</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. INTERACTIVE FAQ ACCORDION */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Everything you need to know about purchasing, previews, and earning as a senior.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left font-bold text-slate-900 flex items-center justify-between gap-4 hover:bg-slate-50 transition text-sm"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. CALL TO ACTION FOR SENIOR SELLERS & BUYERS */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 sm:p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
          {/* Decorative Overlays */}
          <div className="w-64 h-64 bg-white/10 rounded-full blur-2xl absolute -bottom-10 -right-10 pointer-events-none" />
          <div className="w-32 h-32 bg-indigo-400/20 rounded-full blur-xl absolute top-0 right-1/3 pointer-events-none" />

          <div className="space-y-3 text-center md:text-left max-w-xl relative z-10">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-100 bg-white/20 px-3 py-1 rounded-full">
              Join 12,000+ Indian College Students
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-heading">
              Ready to Score Higher and Earn on NoteBridge?
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Whether you need semester-saving notes or want to turn your handwritten notes into passive income with 80% payouts, NoteBridge is built for you.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
            <button
              onClick={() => onNavigate('browse')}
              className="bg-white text-blue-600 px-7 py-4 rounded-2xl font-bold text-sm hover:bg-blue-50 transition shadow-xs flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Browse Notes</span>
            </button>

            <button
              onClick={onOpenUpload}
              className="bg-slate-900/90 text-white border border-white/20 px-7 py-4 rounded-2xl font-bold text-sm hover:bg-slate-900 transition shadow-xs flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              <span>Sell Notes (Free)</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
