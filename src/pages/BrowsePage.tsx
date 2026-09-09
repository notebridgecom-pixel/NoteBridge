import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  ArrowUpDown, 
  BookOpen, 
  RotateCcw, 
  GraduationCap, 
  Sparkles, 
  Check, 
  ShieldCheck,
  Building2,
  Layers,
  Clock,
  X
} from 'lucide-react';
import { NoteItem, FilterState } from '../types';
import { getColleges, getCourses, getBranches } from '../utils/catalogStorage';
import { NoteCard } from '../components/NoteCard';

interface BrowsePageProps {
  notes: NoteItem[];
  purchasedNoteIds: string[];
  initialFilters?: Partial<FilterState>;
  onPreviewNote: (note: NoteItem) => void;
  onBuyNote: (note: NoteItem) => void;
  onOpenDetail: (note: NoteItem) => void;
}

export const BrowsePage: React.FC<BrowsePageProps> = ({
  notes,
  purchasedNoteIds,
  initialFilters = {} as Partial<FilterState>,
  onPreviewNote,
  onBuyNote,
  onOpenDetail,
}) => {
  const dynamicColleges = useMemo(() => getColleges(false), []);
  const dynamicCourses = useMemo(() => getCourses(undefined, false), []);
  const dynamicBranches = useMemo(() => getBranches(undefined, undefined, false), []);

  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery || '');
  const [selectedCollege, setSelectedCollege] = useState(initialFilters.collegeName || 'All Colleges');
  const [selectedDegree, setSelectedDegree] = useState(initialFilters.degree || 'All Courses');
  const [selectedBranch, setSelectedBranch] = useState(initialFilters.branch || 'All Branches');
  const [selectedSemester, setSelectedSemester] = useState(initialFilters.semester || 'All Semesters');
  const [selectedSubject, setSelectedSubject] = useState(initialFilters.subject || 'All Subjects');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'price_low' | 'price_high' | 'newest'>('popular');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [hasPYQOnly, setHasPYQOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(initialFilters.maxPrice !== undefined ? initialFilters.maxPrice : 1000);

  // Persisted recent searches via local storage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('notebridge_recent_searches_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return ['Engineering Mathematics', 'Data Structures', 'Applied Physics'];
    } catch {
      return ['Engineering Mathematics', 'Data Structures', 'Applied Physics'];
    }
  });

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('notebridge_recent_searches_v1', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save recent searches:', err);
      }
      return updated;
    });
  };

  const handleRemoveRecentSearch = (e: React.MouseEvent, itemToRemove: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== itemToRemove);
      try {
        localStorage.setItem('notebridge_recent_searches_v1', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to update recent searches:', err);
      }
      return updated;
    });
  };

  const handleClearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('notebridge_recent_searches_v1');
    } catch (err) {
      console.warn('Failed to clear recent searches:', err);
    }
  };

  // Debounced persistence when user types search terms
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) return;
    const timer = setTimeout(() => {
      saveRecentSearch(searchQuery);
    }, 1200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Derive unique subject names from approved notes
  const subjectList = useMemo(() => {
    const subs = new Set<string>();
    notes.forEach((n) => {
      if (n.status === 'approved' && n.subject) subs.add(n.subject);
    });
    return ['All Subjects', ...Array.from(subs)];
  }, [notes]);

  // Filter and sort
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // Only approved listings are shown to buyers
      if (n.status !== 'approved') return false;

      // College / Institution
      if (selectedCollege !== 'All Colleges') {
        const matchesCollege = n.collegeName?.toLowerCase().includes(selectedCollege.toLowerCase()) ||
          n.university.toLowerCase().includes(selectedCollege.toLowerCase());
        if (!matchesCollege) return false;
      }

      // Degree / Course
      if (selectedDegree !== 'All Courses' && selectedDegree !== 'All Degrees') {
        const noteDegree = (n.degree || '').toLowerCase();
        const filterDegree = selectedDegree.toLowerCase();
        if (!noteDegree.includes(filterDegree) && !filterDegree.includes(noteDegree)) {
          return false;
        }
      }

      // Branch
      if (selectedBranch !== 'All Branches') {
        const noteBranch = (n.branch || '').toLowerCase();
        const filterBranch = selectedBranch.toLowerCase();
        if (!noteBranch.includes(filterBranch) && !filterBranch.includes(noteBranch)) {
          return false;
        }
      }

      // Semester
      if (selectedSemester !== 'All Semesters') {
        const semNum = parseInt(selectedSemester.replace(/[^0-9]/g, ''), 10);
        if (n.semester !== semNum) return false;
      }

      // Subject
      if (selectedSubject !== 'All Subjects' && n.subject !== selectedSubject) {
        return false;
      }

      // Price
      if (n.price > maxPrice) {
        return false;
      }

      // Verified only
      if (verifiedOnly && !n.sellerVerified) {
        return false;
      }

      // PYQ only
      if (hasPYQOnly && !n.hasPYQ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesSubj = n.subject.toLowerCase().includes(q);
        const matchesUni = n.university.toLowerCase().includes(q);
        const matchesCol = (n.collegeName || '').toLowerCase().includes(q);
        const matchesTags = n.tags.some((t) => t.toLowerCase().includes(q));
        const matchesSeller = n.sellerName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubj && !matchesUni && !matchesCol && !matchesTags && !matchesSeller) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'popular') return (b.salesCount || 0) - (a.salesCount || 0);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'price_high') return b.price - a.price;
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });
  }, [
    notes,
    selectedCollege,
    selectedDegree,
    selectedBranch,
    selectedSemester,
    selectedSubject,
    searchQuery,
    maxPrice,
    verifiedOnly,
    hasPYQOnly,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCollege('All Colleges');
    setSelectedDegree('All Courses');
    setSelectedBranch('All Branches');
    setSelectedSemester('All Semesters');
    setSelectedSubject('All Subjects');
    setMaxPrice(1000);
    setVerifiedOnly(false);
    setHasPYQOnly(false);
    setSortBy('popular');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCollege !== 'All Colleges' ||
    (selectedDegree !== 'All Courses' && selectedDegree !== 'All Degrees') ||
    selectedBranch !== 'All Branches' ||
    selectedSemester !== 'All Semesters' ||
    selectedSubject !== 'All Subjects' ||
    maxPrice < 1000 ||
    verifiedOnly ||
    hasPYQOnly;

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading tracking-tight">
              Explore Academic Notes
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Browse syllabus-mapped notes from Vidyalankar Polytechnic, Vidyalankar Engineering College, and other verified colleges.
            </p>
          </div>

          {/* Quick Stat Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-800 rounded-full text-xs font-semibold self-start md:self-auto border border-blue-100">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>{filteredNotes.length} curated listings available</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by subject name, topic (e.g. Trees, Pointers, SOM), college, or senior author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                saveRecentSearch(searchQuery);
              }
            }}
            onBlur={() => {
              if (searchQuery.trim().length >= 2) {
                saveRecentSearch(searchQuery);
              }
            }}
            className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-slate-200 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-1 rounded-lg"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Filters Sidebar + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span>Catalog Filters</span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold transition"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {/* 1. College Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>College / Institution</span>
            </label>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="All Colleges">All Colleges & Universities</option>
              {dynamicColleges.map((col) => (
                <option key={col.id} value={col.name}>
                  {col.name} ({col.code})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Stream / Degree */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              <span>Stream / Program</span>
            </label>
            <select
              value={selectedDegree}
              onChange={(e) => setSelectedDegree(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="All Courses">All Streams & Degrees</option>
              {dynamicCourses.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Branch / Department */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Branch / Department
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="All Branches">All Branches</option>
              {dynamicBranches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Semester */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="All Semesters">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={`Semester ${s}`}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Subject Name
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {subjectList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Maximum Price Slider */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Max Price
              </label>
              <span className="text-xs font-bold text-blue-700">₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>₹0</span>
              <span>₹500</span>
              <span>₹1000</span>
            </div>
          </div>

          {/* 7. Special Checkboxes */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Verified Seniors Only
              </span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasPYQOnly}
                onChange={(e) => setHasPYQOnly(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="font-medium">
                Solved University PYQs Included
              </span>
            </label>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Recent Searches Pill-Based UI */}
          {recentSearches.length > 0 && (
            <div 
              id="recent-searches-pill-bar"
              className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Recent Searches</span>
                  <span className="text-[10px] text-slate-400 font-normal">({recentSearches.length})</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearAllRecentSearches}
                  className="text-[11px] font-medium text-slate-400 hover:text-rose-600 transition cursor-pointer"
                >
                  Clear history
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {recentSearches.map((term) => {
                  const isSelected = searchQuery.trim().toLowerCase() === term.toLowerCase();
                  return (
                    <div
                      key={term}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/30'
                          : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/80 hover:border-blue-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery(term);
                          saveRecentSearch(term);
                        }}
                        className="cursor-pointer text-left"
                      >
                        {term}
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove recent search ${term}`}
                        onClick={(e) => handleRemoveRecentSearch(e, term)}
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition cursor-pointer ${
                          isSelected
                            ? 'hover:bg-blue-700 text-blue-200 hover:text-white'
                            : 'hover:bg-slate-300 text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Sort & Count Bar */}
          <div className="bg-white p-3.5 px-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-600 font-medium">
              Showing <strong>{filteredNotes.length}</strong> matching notes
            </span>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="popular">Most Popular (Sales)</option>
                <option value="rating">Highest Rated</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="newest">Newest Additions</option>
              </select>
            </div>
          </div>

          {/* Notes Grid */}
          {filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isPurchased={purchasedNoteIds.includes(note.id)}
                  onPreview={() => onPreviewNote(note)}
                  onBuy={() => onBuyNote(note)}
                  onOpenDetail={() => onOpenDetail(note)}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  No notes match your filter criteria
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try widening your search, picking another college, or clearing specific branch/semester filters.
                </p>
              </div>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
