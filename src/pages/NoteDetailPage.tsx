import React, { useState, useEffect, useMemo } from 'react';
import { NoteItem, User, PurchaseOrder, NoteReview } from '../types';
import { downloadWatermarkedPdf, getNoteRenderablePdfUrl } from '../utils/pdfGenerator';
import { voteReviewHelpful } from '../utils/storage';
import { DocumentCanvasViewer } from '../components/DocumentCanvasViewer';
import { 
  ArrowLeft, 
  Star, 
  ShieldCheck, 
  CheckCircle2, 
  Eye, 
  FileText, 
  Download, 
  Lock, 
  Share2, 
  Check, 
  GraduationCap,
  Sparkles,
  MessageSquare,
  ExternalLink,
  Trash2,
  ThumbsUp,
  Award,
  BookOpen,
  PenTool,
  Target,
  Lightbulb,
  SlidersHorizontal,
  TrendingUp,
  Filter,
  Clock
} from 'lucide-react';

interface NoteDetailPageProps {
  note: NoteItem;
  currentUser: User | null;
  onBack: () => void;
  onBuy: (note: NoteItem) => void;
  isPurchased: boolean;
  onOpenPreviewModal: (note: NoteItem) => void;
  onRateNote?: (note: NoteItem) => void;
  onDeleteNote?: (noteId: string) => void;
  onUpdateNoteStatus?: (noteId: string, status: NoteItem['status'], feedback?: string) => void;
}

export const NoteDetailPage: React.FC<NoteDetailPageProps> = ({
  note,
  currentUser,
  onBack,
  onBuy,
  isPurchased,
  onOpenPreviewModal,
  onRateNote,
  onDeleteNote,
  onUpdateNoteStatus,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [adminFeedbackText, setAdminFeedbackText] = useState('');
  const [adminActionNotice, setAdminActionNotice] = useState('');

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'moderator';
  const isAuthor = currentUser?.id === note.sellerId;
  const isApproved = note.status === 'approved';

  // Review System Filters & State
  const [localReviews, setLocalReviews] = useState<NoteReview[]>(note.reviews || []);
  const [starFilter, setStarFilter] = useState<'all' | number>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [reviewSort, setReviewSort] = useState<'helpful' | 'highest' | 'recent'>('helpful');
  const [votedReviewIds, setVotedReviewIds] = useState<Set<string>>(new Set());

  const canDelete = currentUser && (currentUser.role === 'admin' || currentUser.id === note.sellerId);

  useEffect(() => {
    setLocalReviews(note.reviews || []);
  }, [note.reviews]);

  useEffect(() => {
    let active = true;
    getNoteRenderablePdfUrl(note).then((url) => {
      if (active && url) {
        setPdfBlobUrl(url);
      }
    });
    return () => {
      active = false;
    };
  }, [note]);

  // Calculations for rating system
  const totalReviewsCount = localReviews.length;
  const avgScore = totalReviewsCount > 0 
    ? Math.round((localReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviewsCount) * 10) / 10
    : (note.rating || 5.0);

  // Distribution breakdown (5, 4, 3, 2, 1)
  const starCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    localReviews.forEach((r) => {
      const star = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      counts[star] = (counts[star] || 0) + 1;
    });
    return counts;
  }, [localReviews]);

  // Recommendation rate
  const positiveReviews = (starCounts[5] || 0) + (starCounts[4] || 0);
  const recommendationRate = totalReviewsCount > 0
    ? Math.round((positiveReviews / totalReviewsCount) * 100)
    : 98;

  // Aspect average scores
  const aspectScores = useMemo(() => {
    let hwSum = 0, sylSum = 0, examSum = 0, conceptSum = 0;
    let count = 0;
    localReviews.forEach((r) => {
      if (r.criteria) {
        hwSum += r.criteria.handwriting || r.rating;
        sylSum += r.criteria.syllabusCoverage || r.rating;
        examSum += r.criteria.examRelevance || r.rating;
        conceptSum += r.criteria.conceptClarity || r.rating;
        count++;
      }
    });
    if (count === 0) {
      return {
        handwriting: 4.9,
        syllabus: 5.0,
        exam: 4.8,
        concept: 4.9,
      };
    }
    return {
      handwriting: Math.round((hwSum / count) * 10) / 10,
      syllabus: Math.round((sylSum / count) * 10) / 10,
      exam: Math.round((examSum / count) * 10) / 10,
      concept: Math.round((conceptSum / count) * 10) / 10,
    };
  }, [localReviews]);

  // Unique tags across reviews
  const allReviewTags = useMemo(() => {
    const set = new Set<string>();
    localReviews.forEach((r) => {
      if (r.tags) {
        r.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set);
  }, [localReviews]);

  // Filtered & Sorted reviews
  const displayedReviews = useMemo(() => {
    let list = [...localReviews];

    if (starFilter !== 'all') {
      list = list.filter((r) => Math.round(r.rating) === starFilter);
    }

    if (tagFilter !== 'all') {
      list = list.filter((r) => r.tags?.includes(tagFilter) || r.comment.includes(tagFilter));
    }

    list.sort((a, b) => {
      if (reviewSort === 'helpful') {
        return (b.helpfulCount || 0) - (a.helpfulCount || 0);
      }
      if (reviewSort === 'highest') {
        return (b.rating || 0) - (a.rating || 0);
      }
      // 'recent'
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });

    return list;
  }, [localReviews, starFilter, tagFilter, reviewSort]);

  const handleHelpfulVote = (reviewId: string) => {
    const voterId = currentUser?.id || 'guest-voter';
    const result = voteReviewHelpful(note.id, reviewId, voterId);
    
    setLocalReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const currentVoters = new Set(r.helpfulUserIds || []);
          if (result.hasVoted) {
            currentVoters.add(voterId);
          } else {
            currentVoters.delete(voterId);
          }
          return {
            ...r,
            helpfulCount: result.helpfulCount,
            helpfulUserIds: Array.from(currentVoters),
          };
        }
        return r;
      })
    );

    setVotedReviewIds((prev) => {
      const next = new Set(prev);
      if (result.hasVoted) {
        next.add(reviewId);
      } else {
        next.delete(reviewId);
      }
      return next;
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Notes Catalog</span>
        </button>

        <div className="flex items-center gap-2">
          {canDelete && onDeleteNote && (
            <button
              onClick={() => setIsConfirmingDelete(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl border border-rose-200 shadow-xs transition"
              title="Delete Note from Catalog"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Note</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs transition"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-600">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share Notes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Moderation Status Banner */}
      {!isApproved && (
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          note.status === 'pending'
            ? 'bg-amber-50 border-amber-200 text-amber-950'
            : note.status === 'changes_requested'
            ? 'bg-orange-50 border-orange-200 text-orange-950'
            : 'bg-rose-50 border-rose-200 text-rose-950'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl mt-0.5 ${
              note.status === 'pending'
                ? 'bg-amber-100 text-amber-700'
                : note.status === 'changes_requested'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-rose-100 text-rose-700'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold">
                {note.status === 'pending' && '⏳ Moderation Queue: Awaiting Admin Approval'}
                {note.status === 'changes_requested' && '⚠️ Revision Requested by Moderation Team'}
                {note.status === 'rejected' && '❌ Listing Rejected by Academic Moderation'}
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {note.status === 'pending' && 'This study note is awaiting verification for syllabus alignment, original handwriting, and academic integrity before being published to the public catalog.'}
                {note.status === 'changes_requested' && (note.adminFeedback || 'The moderation team has requested revisions. Please check feedback and update.')}
                {note.status === 'rejected' && (note.adminFeedback || 'This submission does not meet NoteBridge syllabus guidelines or copyright rules.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
              note.status === 'pending'
                ? 'bg-amber-100 text-amber-800'
                : note.status === 'changes_requested'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-rose-100 text-rose-800'
            }`}>
              Status: {note.status.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Main Grid: Left PDF Preview + Right Purchase Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Document Reader */}
        <div className="lg:col-span-7 space-y-6">
          {/* Note Title & Academic Badge Header */}
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-full text-xs">
                {note.subject}
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold rounded-full text-xs">
                Semester {note.semester}
              </span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-xs">
                {note.unitsCovered}
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 font-heading leading-snug">
              {note.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {note.description}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <strong className="text-slate-800">{note.university}</strong>
              </span>
              <span>•</span>
              <span>{note.totalPages} Total Pages</span>
              <span>•</span>
              <span>{note.fileSizeMb} MB PDF</span>
            </div>
          </div>

          {/* In-Page Document Preview Frame */}
          <div 
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="bg-slate-950 rounded-[2rem] overflow-hidden shadow-md border border-slate-900 flex flex-col select-none"
            style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
          >
            {/* Viewer Header */}
            <div className="bg-slate-900 px-4 sm:px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between text-white text-xs gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="font-mono text-slate-300 truncate max-w-[200px] sm:max-w-xs">
                  {note.pdfFileName || `${note.title}.pdf`}
                </span>
                <span className="bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  {isPurchased ? 'Unlocked Clean PDF' : 'Document Preview'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isPurchased && pdfBlobUrl && (
                  <a
                    href={pdfBlobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition flex items-center gap-1 text-[11px] font-medium"
                    title="Open PDF in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Open in Tab</span>
                  </a>
                )}
                <button
                  onClick={() => onOpenPreviewModal(note)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Fullscreen</span>
                </button>
              </div>
            </div>

            {/* Pure Canvas / Image PDF Document Viewer */}
            <div className="p-2 sm:p-4 bg-slate-950 flex justify-center">
              <DocumentCanvasViewer
                note={note}
                pdfUrl={pdfBlobUrl}
                isPurchased={isPurchased}
                maxPreviewPages={3}
                onBuy={() => onBuy(note)}
                className="w-full min-h-[520px]"
              />
            </div>

            {/* Bottom Teaser */}
            {!isPurchased && (
              <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-orange-400" />
                  <span>Previewing verified student notes. Unlock full clean study PDF below.</span>
                </div>
              </div>
            )}
          </div>

          {/* UPGRADED: Verified Student Reviews & Quality Insights Center */}
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Student Reviews & Quality Insights
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verified peer evaluations from students across affiliated colleges
                  </p>
                </div>
              </div>

              {isPurchased && onRateNote && (
                <button
                  onClick={() => onRateNote(note)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>{localReviews.some(r => r.userId === currentUser?.id) ? 'Update My Review' : 'Write a Verified Review'}</span>
                </button>
              )}
            </div>

            {/* Rating Summary Scorecard & Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 bg-slate-50 rounded-3xl border border-slate-100">
              {/* Overall Score Box (4 cols) */}
              <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-3 sm:border-r border-slate-200/80 space-y-1.5">
                <div className="text-4xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
                  <span>{avgScore.toFixed(1)}</span>
                  <span className="text-base font-bold text-slate-400">/ 5.0</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        Math.round(avgScore) >= star
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200 fill-slate-100'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs font-bold text-slate-600">
                  Based on {totalReviewsCount} verified {totalReviewsCount === 1 ? 'review' : 'reviews'}
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[11px] rounded-full">
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    {recommendationRate}% Recommend
                  </span>
                </div>
              </div>

              {/* Star Distribution Breakdown (4 cols) */}
              <div className="md:col-span-4 space-y-1.5 justify-center flex flex-col text-xs">
                {[5, 4, 3, 2, 1].map((s) => {
                  const count = starCounts[s as 1|2|3|4|5] || 0;
                  const pct = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : (s === 5 ? 85 : s === 4 ? 15 : 0);
                  const isSelected = starFilter === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStarFilter(isSelected ? 'all' : s)}
                      className={`flex items-center gap-2 group text-left px-1.5 py-0.5 rounded-lg transition ${
                        isSelected ? 'bg-amber-100/60 font-bold' : 'hover:bg-slate-100'
                      }`}
                    >
                      <span className="w-6 font-bold text-slate-700 flex items-center gap-0.5 text-[11px]">
                        {s} <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                      </span>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 w-8 text-right font-medium">
                        {count} ({pct}%)
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Dimensional Quality Gauges (4 cols) */}
              <div className="md:col-span-4 space-y-2 border-t md:border-t-0 md:border-l border-slate-200/80 md:pl-4 pt-3 md:pt-0 justify-center flex flex-col text-xs">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                  Quality Dimensions
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 flex items-center gap-1">
                      <PenTool className="w-3 h-3 text-indigo-500" />
                      Handwriting
                    </span>
                    <strong className="text-slate-800 font-bold">{aspectScores.handwriting} ★</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-blue-500" />
                      Syllabus Depth
                    </span>
                    <strong className="text-slate-800 font-bold">{aspectScores.syllabus} ★</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Target className="w-3 h-3 text-rose-500" />
                      Exam Relevance
                    </span>
                    <strong className="text-slate-800 font-bold">{aspectScores.exam} ★</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-amber-500" />
                      Formulas & Diagrams
                    </span>
                    <strong className="text-slate-800 font-bold">{aspectScores.concept} ★</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter & Sort Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => {
                    setStarFilter('all');
                    setTagFilter('all');
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    starFilter === 'all' && tagFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({totalReviewsCount})
                </button>

                <button
                  onClick={() => setStarFilter(starFilter === 5 ? 'all' : 5)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 ${
                    starFilter === 5
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>5 Stars ({starCounts[5] || 0})</span>
                </button>

                {allReviewTags.slice(0, 3).map((tag) => {
                  const isSelected = tagFilter === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setTagFilter(isSelected ? 'all' : tag)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="font-semibold">Sort by:</span>
                <select
                  value={reviewSort}
                  onChange={(e) => setReviewSort(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="helpful">Most Helpful</option>
                  <option value="highest">Highest Rating</option>
                  <option value="recent">Most Recent</option>
                </select>
              </div>
            </div>

            {/* Review Cards List */}
            {displayedReviews.length > 0 ? (
              <div className="space-y-4">
                {displayedReviews.map((rev) => {
                  const hasVoted = votedReviewIds.has(rev.id) || (currentUser?.id && rev.helpfulUserIds?.includes(currentUser.id));
                  return (
                    <div
                      key={rev.id}
                      className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-3 transition-all hover:border-slate-200"
                    >
                      {/* Review Card Header */}
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-slate-900">{rev.userName}</span>
                            {rev.verifiedPurchase && (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                Verified Student Buyer
                              </span>
                            )}
                            {rev.userGradeAchieved && (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                                <Award className="w-3 h-3 text-blue-600" />
                                {rev.userGradeAchieved}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {rev.userCollege} {rev.userCourse ? `• ${rev.userCourse}` : ''} • {rev.createdAt}
                          </p>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-100 shadow-2xs">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < rev.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-200 fill-slate-100'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-black text-slate-800 ml-1">{rev.rating}.0</span>
                        </div>
                      </div>

                      {/* Criteria Mini Badges (if provided) */}
                      {rev.criteria && (
                        <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
                          {rev.criteria.handwriting && (
                            <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                              ✍️ Handwriting: <strong>{rev.criteria.handwriting}/5</strong>
                            </span>
                          )}
                          {rev.criteria.syllabusCoverage && (
                            <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                              📚 Syllabus: <strong>{rev.criteria.syllabusCoverage}/5</strong>
                            </span>
                          )}
                          {rev.criteria.examRelevance && (
                            <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                              🎯 Exam PYQs: <strong>{rev.criteria.examRelevance}/5</strong>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Highlight Tags */}
                      {rev.tags && rev.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {rev.tags.map((t) => (
                            <span
                              key={t}
                              className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded-lg font-bold border border-blue-100"
                            >
                              ✓ {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Review Comment Body */}
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {rev.comment}
                      </p>

                      {/* Helpful Vote Button */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-[11px] text-slate-400 font-medium">
                          Was this review helpful for your exam prep?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleHelpfulVote(rev.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition ${
                            hasVoted
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-white' : ''}`} />
                          <span>Helpful ({rev.helpfulCount || 0})</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-3xl border border-slate-100 p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-400 mx-auto flex items-center justify-center">
                  <Filter className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No reviews matching filter</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try switching filters back to 'All' to view all community feedback.
                </p>
                <button
                  onClick={() => {
                    setStarFilter('all');
                    setTagFilter('all');
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Seller Profile & Pricing Card */}
        <div className="lg:col-span-5 space-y-6 sticky top-24">
          {/* Purchase Action Box */}
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-sm space-y-5">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">One-Time Student Price</span>
                <div className="text-3xl font-black text-blue-600 font-heading">
                  ₹{note.price}
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                ⚡ Instant Download
              </span>
            </div>

            {isPurchased ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>You have purchased this note. It is saved in your My Library.</span>
                </div>
                <button
                  onClick={async () => {
                    const mockOrder: Partial<PurchaseOrder> = {
                      id: `order-${Date.now()}`,
                      orderNumber: `NB-${Date.now().toString().slice(-6)}`,
                      noteId: note.id,
                      noteTitle: note.title,
                      subject: note.subject,
                      sellerId: note.sellerId,
                      sellerName: note.sellerName,
                      buyerId: currentUser?.id || 'verified-buyer',
                      buyerName: currentUser?.name || 'Verified Student',
                      buyerEmail: currentUser?.email || 'rajbhosaletkd@gmail.com',
                      amount: note.price,
                      sellerShare: note.price * 0.8,
                      platformShare: note.price * 0.2,
                      paymentMethod: 'upi_qr',
                      status: 'completed',
                      watermarkText: '',
                      purchasedAt: new Date().toISOString(),
                    };
                    await downloadWatermarkedPdf(mockOrder, note);
                  }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Clean PDF (No Watermark)</span>
                </button>
                <button
                  onClick={() => onOpenPreviewModal(note)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open Full Screen Web Reader</span>
                </button>
              </div>
            ) : !isApproved ? (
              <div className="space-y-3">
                {isAdmin ? (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-3">
                    <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Admin Moderation Action</span>
                    </div>
                    {adminActionNotice ? (
                      <div className="p-2.5 bg-white rounded-xl text-xs font-semibold text-indigo-700 border border-indigo-100">
                        {adminActionNotice}
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder="Feedback reason (will be emailed to the author)..."
                          value={adminFeedbackText}
                          onChange={(e) => setAdminFeedbackText(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            onClick={() => {
                              onUpdateNoteStatus?.(note.id, 'approved', adminFeedbackText || undefined);
                              setAdminActionNotice('✅ Note has been approved & published to catalog!');
                            }}
                            className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => {
                              onUpdateNoteStatus?.(note.id, 'changes_requested', adminFeedbackText || 'Please re-upload higher resolution scan or clearly specify syllabus units.');
                              setAdminActionNotice('⚠️ Revisions requested. Email alert dispatched to author.');
                            }}
                            className="py-2.5 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>Request Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              onUpdateNoteStatus?.(note.id, 'rejected', adminFeedbackText || 'Does not meet syllabus guidelines');
                              setAdminActionNotice('❌ Submission rejected. Email alert dispatched to author.');
                            }}
                            className="py-2.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>Reject</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : isAuthor ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-900">
                    <div className="font-bold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Your Note is Under Moderation</span>
                    </div>
                    <p className="text-amber-800 leading-relaxed">
                      Our moderation team is reviewing this document. Once verified, it will be published to the catalog and other students can buy it.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-700">
                    <div className="font-bold flex items-center gap-1.5 text-slate-900">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Pending Academic Council Review</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      This note is awaiting syllabus verification and is not yet available for purchase.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => onOpenPreviewModal(note)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Inspect Document Preview</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  id="btn-detail-pay-with-upi"
                  onClick={() => onBuy(note)}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-2xl font-bold text-base shadow-sm transition flex items-center justify-center gap-2"
                >
                  <span>Pay with UPI & Download (₹{note.price})</span>
                </button>

                <button
                  onClick={() => onOpenPreviewModal(note)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview First 3 Pages Free</span>
                </button>
              </div>
            )}

            {/* Trust Points */}
            <div className="p-4 bg-slate-50 rounded-2xl space-y-2.5 text-xs text-slate-700 border border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>NoteBridge Student Protection:</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-600 pl-6 list-disc">
                <li>Instant PDF access immediately after UPI payment</li>
                <li>Clean, watermark-free high-resolution study PDF</li>
                <li>Original senior notes (no unauthorized scanned textbooks)</li>
                <li>100% money back if university syllabus does not match</li>
              </ul>
            </div>
          </div>

          {/* Seller Bio Card */}
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              About the Author Senior
            </h3>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg">
                {note.sellerName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">{note.sellerName}</h4>
                  {note.sellerVerified && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                      <ShieldCheck className="w-3 h-3 text-blue-600" />
                      Verified Senior
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{note.sellerCollege}</p>
                <p className="text-[11px] text-blue-600 font-bold">{note.sellerYear}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-center">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{note.sellerRating.toFixed(1)}</span>
                </div>
                <span className="text-[10px] text-slate-500">Author Rating</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <div className="text-sm font-bold text-slate-900">{note.salesCount} Copies</div>
                <span className="text-[10px] text-slate-500">Notes Distributed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {isConfirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Delete Note?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently remove <strong className="text-slate-700">"{note.title}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteNote) {
                    onDeleteNote(note.id);
                  }
                  setIsConfirmingDelete(false);
                  onBack();
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
