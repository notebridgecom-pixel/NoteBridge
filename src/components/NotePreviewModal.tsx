import React, { useState, useEffect } from 'react';
import { NoteItem, User, PurchaseOrder, AiDocumentSummaryResult } from '../types';
import { downloadWatermarkedPdf, getNoteRenderablePdfUrl } from '../utils/pdfGenerator';
import { generateDocumentSummary } from '../utils/aiDocumentSummarizerService';
import { DocumentCanvasViewer } from './DocumentCanvasViewer';
import { AiDocumentSummaryViewer } from './AiDocumentSummaryViewer';
import { 
  X, 
  Lock, 
  ShieldCheck, 
  Star, 
  Download, 
  CheckCircle, 
  ExternalLink,
  Sparkles,
  BookOpen,
  RefreshCw,
  FileText
} from 'lucide-react';

interface NotePreviewModalProps {
  note: NoteItem;
  currentUser: User | null;
  onClose: () => void;
  onBuy: (note: NoteItem) => void;
  isPurchased?: boolean;
}

export const NotePreviewModal: React.FC<NotePreviewModalProps> = ({
  note,
  currentUser,
  onClose,
  onBuy,
  isPurchased = false,
}) => {
  const [currentNote, setCurrentNote] = useState<NoteItem>(note);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [viewerMode, setViewerMode] = useState<'pages' | 'ai_summary'>('pages');
  const [aiSummary, setAiSummary] = useState<AiDocumentSummaryResult | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    getNoteRenderablePdfUrl(currentNote).then((url) => {
      if (active && url) {
        setPdfBlobUrl(url);
      }
    });
    return () => {
      active = false;
    };
  }, [currentNote]);

  const loadAiSummary = async (mode = 'comprehensive') => {
    if (aiSummary && aiSummary.mode === mode) return;
    setIsLoadingAi(true);
    try {
      const content = currentNote.textContent || 
        `${currentNote.title}\nSubject: ${currentNote.subject}\nUnits: ${currentNote.unitsCovered}\n${currentNote.description}`;
      const res = await generateDocumentSummary({
        textContent: content,
        title: currentNote.title,
        subject: currentNote.subject,
        university: currentNote.university,
        semester: currentNote.semester,
        mode: mode as any,
      });
      setAiSummary(res);
    } catch (e) {
      console.error('Failed to load summary in modal:', e);
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div 
      id="note-preview-modal-backdrop" 
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none"
      style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
    >
      <div 
        id="note-preview-dialog"
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
        className="bg-slate-900 rounded-3xl max-w-5xl w-full h-[94vh] overflow-hidden shadow-2xl border border-slate-700 flex flex-col md:flex-row text-white animate-in zoom-in-95 duration-200 select-none"
      >
        {/* Left / Center: Document Viewer or AI Summary */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden border-b md:border-b-0 md:border-r border-slate-800">
          {/* Top Window Bar with View Selector */}
          <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewerMode('pages')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    viewerMode === 'pages'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Document Reader</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setViewerMode('ai_summary');
                    loadAiSummary();
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    viewerMode === 'ai_summary'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>AI Study Summary</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isPurchased && pdfBlobUrl && viewerMode === 'pages' && (
                <a
                  href={pdfBlobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1 text-xs font-medium px-2.5"
                  title="Open PDF in Full Tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Tab</span>
                </a>
              )}

              {/* Close button on mobile */}
              <button
                onClick={onClose}
                className="md:hidden p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* View Container */}
          {viewerMode === 'pages' ? (
            <div className="flex-1 overflow-hidden p-2 sm:p-3 bg-slate-950 flex justify-center items-stretch">
              <DocumentCanvasViewer 
                note={currentNote} 
                pdfUrl={pdfBlobUrl}
                isPurchased={isPurchased}
                maxPreviewPages={3}
                onBuy={() => onBuy(currentNote)}
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950">
              {isLoadingAi && !aiSummary ? (
                <div className="py-24 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">Extracting AI Study Summary with Gemini 3.7...</p>
                </div>
              ) : aiSummary ? (
                <AiDocumentSummaryViewer
                  summary={aiSummary}
                  onRegenerate={(m) => loadAiSummary(m)}
                  isRegenerating={isLoadingAi}
                  showCloseButton={false}
                />
              ) : (
                <div className="py-16 text-center space-y-3">
                  <p className="text-xs text-slate-400">Click below to generate the AI study pack for this note.</p>
                  <button
                    onClick={() => loadAiSummary()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                  >
                    Generate AI Summary
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Locked Pages Banner (if not purchased) */}
          {!isPurchased && (
            <div className="bg-slate-900 p-3.5 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  Showing preview for <strong>{currentNote.title}</strong>. Full clean PDF unlocked after UPI payment.
                </span>
              </div>
              <button
                onClick={() => onBuy(currentNote)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-sm transition flex-shrink-0 ml-2"
              >
                Unlock for ₹{currentNote.price}
              </button>
            </div>
          )}
        </div>


        {/* Right Sidebar: Note Details, Seller & Buy Action */}
        <div className="w-full md:w-80 lg:w-96 bg-slate-900 p-6 flex flex-col justify-between overflow-y-auto space-y-6">
          <div className="space-y-5">
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 text-[11px] font-bold">
                  {currentNote.subject}
                </span>
                <h2 className="text-lg font-bold text-white mt-2 leading-tight">
                  {currentNote.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="hidden md:block p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Note Meta Specs */}
            <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">University</span>
                <span className="font-semibold text-slate-200 text-right truncate max-w-[180px]">
                  {currentNote.university.split('(')[0].trim()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Branch & Sem</span>
                <span className="font-semibold text-slate-200">
                  {currentNote.branch.split('(')[1]?.replace(')', '') || currentNote.branch} • Sem {currentNote.semester}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Length</span>
                <span className="font-semibold text-slate-200">{currentNote.totalPages} Pages ({currentNote.fileSizeMb} MB)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Syllabus Coverage</span>
                <span className="font-semibold text-emerald-400">{currentNote.unitsCovered}</span>
              </div>
            </div>

            {/* Seller Profile Card */}
            <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    {currentNote.sellerName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-white text-sm">{currentNote.sellerName}</span>
                      {currentNote.sellerVerified && (
                        <ShieldCheck className="w-4 h-4 text-blue-400 fill-blue-950" title="Verified Senior Badge" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{currentNote.sellerCollege}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-700 text-xs text-slate-300">
                <div className="flex items-center gap-1">
                  {currentNote.sellerRating > 0 ? (
                    <>
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <strong className="text-white">{currentNote.sellerRating.toFixed(1)}</strong>
                      <span className="text-slate-400">({currentNote.sellerRatingsCount} ratings)</span>
                    </>
                  ) : (
                    <span className="text-slate-400 text-[11px]">New Senior Author</span>
                  )}
                </div>
                <span className="text-blue-300 font-medium">{currentNote.sellerYear || 'Senior'}</span>
              </div>
            </div>

            {/* Trust Points */}
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Direct PDF access after UPI verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Verified original handwritten student material</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Clean PDF download with no watermark</span>
              </div>
            </div>
          </div>

          {/* Bottom Buy CTA */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Price</span>
                <div className="text-2xl font-black text-white font-heading">
                  ₹{currentNote.price}
                </div>
              </div>
              <span className="text-[10px] text-slate-400 text-right">
                Includes Lifetime Access
              </span>
            </div>

            {isPurchased ? (
              <div className="space-y-2">
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-700/80 rounded-xl text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Purchased & In Your Library</span>
                </div>
                <button
                  onClick={async () => {
                    const mockOrder: Partial<PurchaseOrder> = {
                      id: `order-${Date.now()}`,
                      orderNumber: `NB-${Date.now().toString().slice(-6)}`,
                      noteId: currentNote.id,
                      noteTitle: currentNote.title,
                      subject: currentNote.subject,
                      sellerId: currentNote.sellerId,
                      sellerName: currentNote.sellerName,
                      buyerId: currentUser?.id || 'verified-buyer',
                      buyerName: currentUser?.name || 'Verified Student',
                      buyerEmail: currentUser?.email || 'student@college.edu',
                      amount: currentNote.price,
                      sellerShare: currentNote.price * 0.9,
                      platformShare: currentNote.price * 0.1,
                      paymentMethod: 'upi_qr',
                      status: 'completed',
                      watermarkText: '',
                      purchasedAt: new Date().toISOString(),
                    };
                    await downloadWatermarkedPdf(mockOrder, currentNote);
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Clean PDF (No Watermark)</span>
                </button>
              </div>
            ) : (
              <button
                id="btn-preview-modal-pay-upi"
                onClick={() => onBuy(currentNote)}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
              >
                <span>Pay with UPI & Access</span>
                <span className="px-2 py-0.5 bg-white/20 rounded-md font-mono text-xs">₹{currentNote.price}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
