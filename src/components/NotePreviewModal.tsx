import React, { useState, useEffect } from 'react';
import { NoteItem, User, PurchaseOrder } from '../types';
import { downloadWatermarkedPdf, getNoteRenderablePdfUrl } from '../utils/pdfGenerator';
import { DocumentCanvasViewer } from './DocumentCanvasViewer';
import { 
  X, 
  Lock, 
  ShieldCheck, 
  Star, 
  Download, 
  CheckCircle, 
  ExternalLink
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
        {/* Left / Center: Real Canvas-Rendered PDF Document Viewer */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden border-b md:border-b-0 md:border-r border-slate-800">
          {/* Top Window Bar */}
          <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="ml-2 text-xs font-mono text-slate-300 truncate max-w-[200px] sm:max-w-md">
                {currentNote.pdfFileName || `${currentNote.title}.pdf`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isPurchased && pdfBlobUrl && (
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

          {/* Real PDF & Photo Canvas Rendering */}
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

          {/* Locked Pages Banner (if not purchased) */}
          {!isPurchased && (
            <div className="bg-slate-900 p-3.5 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  Showing preview for <strong>{currentNote.title}</strong>. Full document unlocked (clean original PDF without watermark) after purchase.
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
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <strong className="text-white">{currentNote.sellerRating.toFixed(1)}</strong>
                  <span className="text-slate-400">({currentNote.sellerRatingsCount} ratings)</span>
                </div>
                <span className="text-blue-300 font-medium">{currentNote.sellerYear}</span>
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
                      sellerShare: currentNote.price * 0.8,
                      platformShare: currentNote.price * 0.2,
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
            ) : currentNote.status !== 'approved' ? (
              <div className="space-y-2">
                <div className={`p-3 rounded-xl text-xs font-semibold text-center border ${
                  currentNote.status === 'pending'
                    ? 'bg-amber-950/80 border-amber-700/80 text-amber-300'
                    : currentNote.status === 'changes_requested'
                    ? 'bg-orange-950/80 border-orange-700/80 text-orange-300'
                    : 'bg-rose-950/80 border-rose-700/80 text-rose-300'
                }`}>
                  <div className="font-bold flex items-center justify-center gap-1.5 mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {currentNote.status === 'pending' && 'Under Moderation Review'}
                      {currentNote.status === 'changes_requested' && 'Revisions Requested'}
                      {currentNote.status === 'rejected' && 'Listing Rejected'}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-tight">
                    {currentNote.status === 'pending' && 'This note is in the moderation queue and cannot be purchased until approved.'}
                    {currentNote.status === 'changes_requested' && (currentNote.adminFeedback || 'Revisions were requested by moderators.')}
                    {currentNote.status === 'rejected' && (currentNote.adminFeedback || 'Listing does not comply with academic standards.')}
                  </p>
                </div>
                <button
                  disabled
                  className="w-full py-3 bg-slate-800 text-slate-400 rounded-2xl font-bold text-xs cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Not Available for Purchase Yet</span>
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
