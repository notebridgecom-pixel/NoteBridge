import React, { useState } from 'react';
import { User, NoteItem } from '../types';
import { addNoteReview } from '../utils/storage';
import { Star, X, CheckCircle2, MessageSquare, Award, Sparkles, BookOpen, PenTool, Target, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

interface RateNoteModalProps {
  note: NoteItem;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const RateNoteModal: React.FC<RateNoteModalProps> = ({
  note,
  user,
  onClose,
  onSuccess,
}) => {
  const existingUserReview = note.reviews?.find((r) => r.userId === user?.id);

  const [rating, setRating] = useState<number>(existingUserReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  
  // Dimensional Criteria (1-5 stars)
  const [handwritingScore, setHandwritingScore] = useState<number>(existingUserReview?.criteria?.handwriting || 5);
  const [syllabusScore, setSyllabusScore] = useState<number>(existingUserReview?.criteria?.syllabusCoverage || 5);
  const [examScore, setExamScore] = useState<number>(existingUserReview?.criteria?.examRelevance || 5);
  const [conceptScore, setConceptScore] = useState<number>(existingUserReview?.criteria?.conceptClarity || 5);
  const [showDetailedAspects, setShowDetailedAspects] = useState<boolean>(false);

  // Tags & Feedback
  const [selectedTags, setSelectedTags] = useState<string[]>(
    existingUserReview?.tags || ['Helped me score 9+ CGPA', 'Accurate to university syllabus']
  );
  const [comment, setComment] = useState(existingUserReview?.comment || '');
  const [gradeAchieved, setGradeAchieved] = useState(existingUserReview?.userGradeAchieved || '');
  const [userCourse, setUserCourse] = useState(
    existingUserReview?.userCourse || (user?.degree && user?.branch ? `${user.degree} ${user.branch}` : '')
  );

  const availableTags = [
    'Helped me score 9+ CGPA',
    'Accurate to university syllabus',
    'Clear diagrams & handwriting',
    'Solved PYQs saved my exam',
    'Super crisp formula sheet',
    '100% Exam numericals covered',
    'Best for one-night-before revision',
    'Simple & easy language',
  ];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 5:
        return '⭐⭐⭐⭐⭐ Outstanding! Must-have for exams';
      case 4:
        return '⭐⭐⭐⭐ Very Good! Clear & informative';
      case 3:
        return '⭐⭐⭐ Average — Helpful reference material';
      case 2:
        return '⭐⭐ Below Expectations — Needs more depth';
      case 1:
        return '⭐ Poor — Missing key syllabus topics';
      default:
        return '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalComment = comment.trim()
      ? comment.trim()
      : selectedTags.length > 0
      ? `${selectedTags.join(', ')}. Highly recommended study material for semester exams!`
      : 'Comprehensive, accurate notes with clean diagrams and solved question papers.';

    addNoteReview({
      noteId: note.id,
      user,
      rating,
      criteria: {
        handwriting: handwritingScore,
        syllabusCoverage: syllabusScore,
        examRelevance: examScore,
        conceptClarity: conceptScore,
      },
      tags: selectedTags,
      userCourse: userCourse.trim() || undefined,
      userGradeAchieved: gradeAchieved.trim() || undefined,
      comment: finalComment,
    });

    onSuccess();
    onClose();
  };

  return (
    <div
      id="rate-note-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="rate-note-dialog"
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 my-6 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/70">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                Verified Student Feedback
              </span>
              {existingUserReview && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  Editing Previous Review
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-base text-slate-900 mt-1 line-clamp-1">
              Rate & Review: {note.title}
            </h3>
            <p className="text-xs text-slate-500">
              Subject: <strong className="text-slate-700">{note.subject}</strong> • Author: {note.sellerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Primary Star Rating Selector */}
          <div className="text-center p-4 bg-amber-50/50 rounded-2xl border border-amber-100/80 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Overall Rating for this Study Document
            </label>
            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-all hover:scale-125 focus:outline-none"
                  title={`${star} Star`}
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      (hoverRating || rating) >= star
                        ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                        : 'text-slate-200 fill-slate-100 hover:text-amber-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-amber-900 min-h-[1.25rem]">
              {getRatingLabel(hoverRating || rating)}
            </p>
          </div>

          {/* Detailed Aspect Scores (Collapsible / Expandable) */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/40 space-y-3">
            <button
              type="button"
              onClick={() => setShowDetailedAspects(!showDetailedAspects)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-800"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Rate Specific Quality Aspects (Optional)</span>
              </span>
              <span className="text-[11px] text-blue-600 flex items-center gap-1">
                {showDetailedAspects ? 'Hide Aspects' : 'Expand Details'}
                {showDetailedAspects ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </span>
            </button>

            {showDetailedAspects && (
              <div className="space-y-3 pt-2 border-t border-slate-200/60 animate-in fade-in duration-150">
                {/* 1. Handwriting */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <PenTool className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Handwriting & Diagrams</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setHandwritingScore(s)}
                        className="p-0.5"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            handwritingScore >= s
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200 fill-slate-100'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-[11px] font-bold text-slate-600 ml-1 w-4 text-right">
                      {handwritingScore}
                    </span>
                  </div>
                </div>

                {/* 2. Syllabus Coverage */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                    <span>Syllabus & Unit Coverage</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSyllabusScore(s)}
                        className="p-0.5"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            syllabusScore >= s
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200 fill-slate-100'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-[11px] font-bold text-slate-600 ml-1 w-4 text-right">
                      {syllabusScore}
                    </span>
                  </div>
                </div>

                {/* 3. Exam Relevance */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Target className="w-3.5 h-3.5 text-rose-500" />
                    <span>Exam Relevance & Solved PYQs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setExamScore(s)}
                        className="p-0.5"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            examScore >= s
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200 fill-slate-100'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-[11px] font-bold text-slate-600 ml-1 w-4 text-right">
                      {examScore}
                    </span>
                  </div>
                </div>

                {/* 4. Concept Clarity */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Concept Clarity & Formulas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setConceptScore(s)}
                        className="p-0.5"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            conceptScore >= s
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200 fill-slate-100'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-[11px] font-bold text-slate-600 ml-1 w-4 text-right">
                      {conceptScore}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Highlight Tags (Multi-select) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Select Key Highlights (Tap to select multiple):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Student Credential / Grade Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Your Academic Branch / Year
              </label>
              <input
                type="text"
                placeholder="e.g. B.Tech CS (3rd Year)"
                value={userCourse}
                onChange={(e) => setUserCourse(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Score / Grade Achieved (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Scored 9.2 CGPA / A+ Grade"
                value={gradeAchieved}
                onChange={(e) => setGradeAchieved(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Detailed Review for Fellow Students:
              </label>
              <span className="text-[10px] text-slate-400">{comment.length} characters</span>
            </div>
            <textarea
              rows={3}
              placeholder="How did these notes help you prepare? Mention specific units, formulas, question patterns, or handwriting legibility..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Live Preview Card */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-slate-400" />
              Live Preview of Your Verified Review Badge
            </span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs text-slate-900">{user?.name || 'Verified Student'}</span>
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Verified Buyer
                </span>
                {gradeAchieved && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                    <Award className="w-2.5 h-2.5" />
                    {gradeAchieved}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                ))}
              </div>
            </div>
            <p className="text-[10px] text-slate-500">{user?.college || 'Polytechnic & Engineering Institute'}</p>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedTags.slice(0, 3).map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded-md font-medium">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-700 italic pt-1 line-clamp-2">
              &quot;{comment || (selectedTags.length > 0 ? selectedTags.join(', ') : 'Accurate and comprehensive notes!')}&quot;
            </p>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{existingUserReview ? 'Update Verified Review' : 'Post Verified Rating'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

