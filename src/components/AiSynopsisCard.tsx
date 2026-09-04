import React, { useState } from 'react';
import { NoteItem, User } from '../types';
import { generateNoteSynopsis, hasSufficientContent } from '../utils/geminiSynopsisService';
import { updateNoteSynopsis, getStoredNotes } from '../utils/storage';
import { 
  Sparkles, 
  Bot, 
  Copy, 
  Check, 
  RotateCw, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  Zap,
  BookOpen
} from 'lucide-react';

interface AiSynopsisCardProps {
  note: NoteItem;
  currentUser?: User;
  onSynopsisUpdated?: (updatedNote: NoteItem) => void;
}

export const AiSynopsisCard: React.FC<AiSynopsisCardProps> = ({
  note,
  currentUser,
  onSynopsisUpdated,
}) => {
  const [synopsis, setSynopsis] = useState<string | undefined>(note.aiSynopsis);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showFullContent, setShowFullContent] = useState<boolean>(false);
  const [modelBadge, setModelBadge] = useState<string>('Gemini 3.7 Flash');

  const contentText = note.textContent || (
    // Fallback if sample pages have text
    note.samplePages && note.samplePages.length > 0
      ? note.samplePages.map((p) => `${p.title}: ${p.sections.map((s) => `${s.heading || ''} ${s.body}`).join(' ')}`).join('\n')
      : note.description
  );

  const isEligible = hasSufficientContent(contentText);

  const handleGenerate = async () => {
    if (!isEligible) {
      setError('This note requires at least 40 characters of textual content body from the seller to generate an AI synopsis.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await generateNoteSynopsis({
        textContent: contentText,
        title: note.title,
        subject: note.subject,
        unitsCovered: note.unitsCovered,
      });

      setSynopsis(response.synopsis);
      setModelBadge(response.model === 'gemini-3.7-flash' ? 'Gemini 3.7 Flash' : 'Gemini AI');
      
      // Persist in local storage
      const updated = updateNoteSynopsis(note.id, response.synopsis);
      if (updated && onSynopsisUpdated) {
        onSynopsisUpdated(updated);
      }
    } catch (err: any) {
      console.error('Failed to generate synopsis:', err);
      setError(err.message || 'Unable to generate AI synopsis. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!synopsis) return;
    navigator.clipboard.writeText(synopsis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/70 rounded-[2rem] border border-blue-100/80 p-6 sm:p-7 shadow-xs relative overflow-hidden">
      {/* Decorative ambient background blur */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-200/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-200/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-blue-100/80 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                AI-Generated Synopsis
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                <Bot className="w-3 h-3" />
                {modelBadge}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              High-yield exam takeaways distilled from seller content body
            </p>
          </div>
        </div>

        {synopsis && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-xs font-semibold text-slate-700 hover:text-blue-600 transition shadow-xs"
              title="Copy Synopsis"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 text-[11px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px]">Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-xs font-semibold text-slate-700 hover:text-blue-600 transition shadow-xs disabled:opacity-50"
              title="Regenerate Synopsis with Gemini"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
              <span className="text-[11px]">Refresh</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Synopsis Content Area */}
      <div className="relative z-10">
        {isLoading ? (
          <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
              <Sparkles className="w-4 h-4 text-blue-600 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Gemini AI is analyzing the notes content body...
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mt-0.5">
                Extracting core definitions, university PYQ concepts, and key formulas
              </p>
            </div>
          </div>
        ) : synopsis ? (
          <div className="space-y-3.5">
            <div className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line bg-white/90 p-4 sm:p-5 rounded-2xl border border-blue-50/80 shadow-2xs">
              {synopsis.split('\n').map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={idx} className="h-1.5" />;

                // Check for bullet lines
                const isBullet = trimmed.startsWith('•') || trimmed.startsWith('*') || trimmed.startsWith('-');
                const cleanLine = isBullet ? trimmed.replace(/^[•*-]\s*/, '') : trimmed;

                // Simple parser for bold **text**
                const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

                return (
                  <div key={idx} className={`flex items-start gap-2 ${isBullet ? 'my-1.5' : 'my-1'}`}>
                    {isBullet && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                    )}
                    <p className="flex-1 text-slate-800 text-xs sm:text-[13px] leading-relaxed">
                      {parts.map((part, pIdx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return (
                            <strong key={pIdx} className="font-bold text-slate-950">
                              {part.slice(2, -2)}
                            </strong>
                          );
                        }
                        return part;
                      })}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-blue-700 font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Verified quick revision summary for exam preparation
              </span>
              
              {note.textContent && (
                <button
                  onClick={() => setShowFullContent(!showFullContent)}
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{showFullContent ? 'Hide Original Content Body' : 'View Seller Content Body'}</span>
                  {showFullContent ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* Collapsible Original Text Content Body */}
            {showFullContent && note.textContent && (
              <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 whitespace-pre-line max-h-60 overflow-y-auto font-mono text-[11px] leading-relaxed">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 font-bold text-slate-900 font-sans">
                  <span>Seller-Provided Textual Content Body</span>
                  <span className="text-[10px] text-slate-500 font-mono">{note.textContent.length} characters</span>
                </div>
                {note.textContent}
              </div>
            )}
          </div>
        ) : (
          <div className="py-5 px-4 text-center space-y-3 bg-white/70 rounded-2xl border border-blue-100/50">
            {isEligible ? (
              <div className="space-y-3 max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-50 text-blue-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Detailed Notes Content Available
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    The seller has provided a detailed textual content body. Generate an instant AI synopsis powered by Gemini to extract key formulas and exam highlights.
                  </p>
                </div>
                <button
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-xs transition transform hover:-translate-y-0.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate AI Synopsis with Gemini</span>
                </button>
              </div>
            ) : (
              <div className="py-2 text-center text-xs text-slate-500 space-y-1.5">
                <AlertCircle className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <p className="font-semibold text-slate-700">No Long Textual Content Body Provided Yet</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  AI Synopsis can be generated for notes when the seller uploads or attaches a detailed text summary (40+ characters).
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Unable to Generate Synopsis</p>
              <p className="text-[11px] text-rose-700 mt-0.5">{error}</p>
            </div>
            <button
              onClick={handleGenerate}
              className="text-xs font-bold underline text-rose-900 hover:text-rose-950"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
