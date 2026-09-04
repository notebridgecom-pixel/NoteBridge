import React from 'react';
import { NoteItem } from '../types';
import { 
  Star, 
  ShieldCheck, 
  Eye, 
  ArrowRight, 
  FileText, 
  GraduationCap, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface NoteCardProps {
  note: NoteItem;
  onPreview: (note: NoteItem) => void;
  onBuy: (note: NoteItem) => void;
  onOpenDetail?: (note: NoteItem) => void;
  isPurchased?: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onPreview,
  onBuy,
  onOpenDetail,
  isPurchased = false,
}) => {
  // Vibrant category badge colors based on subject/branch
  const getSubjectBadgeStyle = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('math') || s.includes('calculus')) {
      return 'bg-orange-100 text-orange-700';
    } else if (s.includes('electronic') || s.includes('digital') || s.includes('circuits')) {
      return 'bg-purple-100 text-purple-700';
    } else if (s.includes('data') || s.includes('software') || s.includes('structure') || s.includes('algorithm') || s.includes('cloud')) {
      return 'bg-blue-100 text-blue-700';
    } else if (s.includes('mechanic') || s.includes('civil') || s.includes('thermo')) {
      return 'bg-emerald-100 text-emerald-700';
    } else {
      return 'bg-indigo-100 text-indigo-700';
    }
  };

  const badgeClass = getSubjectBadgeStyle(note.subject);

  return (
    <div 
      id={`note-card-${note.id}`}
      className="group bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer relative"
      onClick={() => onOpenDetail ? onOpenDetail(note) : onPreview(note)}
    >
      <div>
        {/* Top Header: Category Badge + Rating */}
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex items-center gap-1.5 flex-wrap max-w-[75%]">
            <span className={`${badgeClass} text-xs font-bold px-3 py-1 rounded-full truncate`}>
              {note.subject}
            </span>
            {(note.aiSynopsis || (note.textContent && note.textContent.length >= 40)) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                AI Synopsis
              </span>
            )}
          </div>
          {note.rating && note.rating > 0 ? (
            <div className="flex items-center gap-1 text-slate-700 text-xs font-bold flex-shrink-0 bg-amber-50/80 border border-amber-200/60 px-2.5 py-0.5 rounded-full shadow-2xs">
              <span className="text-amber-500">★</span>
              <span className="text-slate-900">{note.rating.toFixed(1)}</span>
              <span className="text-slate-400 font-medium text-[10px]">({note.reviewsCount || note.reviews?.length || 0})</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-500 text-[11px] font-semibold flex-shrink-0 bg-slate-50 border border-slate-200/80 px-2.5 py-0.5 rounded-full">
              <span className="text-blue-600 font-bold">New</span>
              <span className="text-slate-400 font-normal">Listing</span>
            </div>
          )}
        </div>

        {/* Note Title */}
        <h3 
          className="font-bold text-base sm:text-lg leading-tight mb-2 text-slate-900 group-hover:text-blue-600 transition line-clamp-2"
          title={note.title}
        >
          {note.title}
        </h3>

        {/* Note Description / Unit Subtitle */}
        <p className="text-slate-500 text-xs sm:text-sm mb-4 line-clamp-2">
          {note.unitsCovered} • {note.totalPages} pages with diagrams and solved PYQs.
        </p>

        {/* University & Author Bio Row */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
            {note.sellerName.charAt(0)}
          </div>
          <span className="text-xs font-medium text-slate-600 truncate">
            {note.sellerName} • {note.sellerYear || 'Senior'}
          </span>
          {note.sellerVerified && (
            <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded flex-shrink-0">
              Verified
            </span>
          )}
        </div>
      </div>

      {/* Bottom Row: Price & Action Buttons */}
      <div 
        className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xl sm:text-2xl font-black text-blue-600 font-heading">
          ₹{note.price}
        </span>

        <div className="flex items-center gap-2">
          <button
            id={`btn-preview-${note.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(note);
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            Preview
          </button>

          {isPurchased ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(note);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Owned</span>
            </button>
          ) : (
            <button
              id={`btn-buy-${note.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBuy(note);
              }}
              className="bg-slate-900 hover:bg-slate-800 active:scale-95 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <span>Buy Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
