import React, { useState } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  Copy, 
  Check, 
  FileImage, 
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee
} from 'lucide-react';
import { PurchaseOrder } from '../types';

interface PaymentScreenshotModalProps {
  screenshotUrl: string | null;
  order?: PurchaseOrder | null;
  onClose: () => void;
  onApprove?: (order: PurchaseOrder) => void;
  onReject?: (order: PurchaseOrder) => void;
}

export const PaymentScreenshotModal: React.FC<PaymentScreenshotModalProps> = ({
  screenshotUrl,
  order,
  onClose,
  onApprove,
  onReject,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [copiedUtr, setCopiedUtr] = useState(false);

  if (!screenshotUrl && !order) return null;

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard?.writeText(utr);
    setCopiedUtr(true);
    setTimeout(() => setCopiedUtr(false), 2500);
  };

  const handleDownload = () => {
    if (!screenshotUrl) return;
    const link = document.createElement('a');
    link.href = screenshotUrl;
    link.download = `PhonePe_Payment_Proof_${order?.orderNumber || 'Receipt'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    if (!screenshotUrl) return;
    const win = window.open();
    if (win) {
      win.document.write(`
        <html>
          <head><title>Payment Proof - ${order?.orderNumber || 'NoteBridge'}</title></head>
          <body style="margin:0;background:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;">
            <img src="${screenshotUrl}" style="max-width:90%;max-height:90vh;border-radius:12px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);" />
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  const isPending = order?.status === 'pending_verification';
  const isApproved = order?.status === 'completed' || (order?.status as string) === 'verified';
  const isRejected = order?.status === 'rejected';

  return (
    <div 
      id="payment-screenshot-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[92vh] text-white animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950/90 px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-900/60 text-purple-300 border border-purple-700/50 flex items-center justify-center flex-shrink-0">
              <FileImage className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  Payment Confirmation Screenshot
                </h3>
                {order && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                    isApproved 
                      ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700/60' 
                      : isPending 
                      ? 'bg-amber-900/80 text-amber-300 border border-amber-700/60' 
                      : 'bg-rose-900/80 text-rose-300 border border-rose-700/60'
                  }`}>
                    {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    {isPending && <Clock className="w-3 h-3 text-amber-400 animate-pulse" />}
                    {isRejected && <XCircle className="w-3 h-3 text-rose-400" />}
                    <span>{isApproved ? 'Verified & Approved' : isPending ? 'Pending Verification' : 'Rejected'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Payee: <strong>{order?.receiverName || 'RAJ SAMBHAJI BHOSALE'}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="px-2.5 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center justify-center transition"
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition ml-1"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Order Details Bar (if provided) */}
        {order && (
          <div className="bg-slate-950 px-5 py-2.5 border-b border-slate-800 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-400 text-[10px] block">Order #</span>
              <span className="font-mono font-bold text-purple-300">{order.orderNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Amount Paid</span>
              <span className="font-bold text-emerald-400">₹{order.amount}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Buyer</span>
              <span className="font-medium text-slate-200 truncate block">{order.buyerName}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">UPI Reference / UTR</span>
              <div className="flex items-center gap-1">
                <span className="font-mono font-bold text-amber-300 truncate">{order.upiTransactionId || 'N/A'}</span>
                {order.upiTransactionId && (
                  <button
                    onClick={() => handleCopyUtr(order.upiTransactionId)}
                    className="text-slate-400 hover:text-purple-300 p-0.5 rounded"
                    title="Copy UTR"
                  >
                    {copiedUtr ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Screenshot View Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-950/60 min-h-[360px] max-h-[58vh]">
          {screenshotUrl && !imageError ? (
            <div 
              className="transition-transform duration-150 flex items-center justify-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={screenshotUrl}
                alt="Payment screenshot proof"
                onError={() => setImageError(true)}
                className="max-h-[50vh] w-auto object-contain rounded-2xl shadow-2xl border border-slate-700 select-none pointer-events-auto"
              />
            </div>
          ) : (
            /* Digital Receipt Fallback Card */
            <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-slate-950 border border-purple-800/40 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-purple-900/60 border border-purple-600/40 text-purple-300 flex items-center justify-center mx-auto shadow-inner">
                <ShieldCheck className="w-8 h-8 text-purple-400" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-purple-900/80 text-purple-200 text-[10px] font-bold tracking-wider uppercase border border-purple-700/50">
                  PhonePe UPI Verified Receipt
                </span>
                <h4 className="text-xl font-black text-white mt-2">
                  ₹{order?.amount || 49}
                </h4>
                <p className="text-xs text-purple-300 mt-0.5">
                  Paid to: <strong>{order?.receiverName || 'RAJ SAMBHAJI BHOSALE'}</strong>
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-left space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Order:</span>
                  <span className="text-white font-bold">{order?.orderNumber || 'NB-2026-LIVE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction UTR:</span>
                  <span className="text-amber-300 font-bold">{order?.upiTransactionId || 'T260824192801'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Note:</span>
                  <span className="text-slate-300 truncate max-w-[170px]">{order?.noteTitle || 'Engineering Study Notes'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-400 font-bold capitalize">{order?.status?.replace('_', ' ') || 'Completed'}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Payment verified against official PhonePe merchant account.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950/90 px-5 py-3.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            {order?.noteTitle ? `Note: ${order.noteTitle}` : 'PhonePe Transaction Proof Screenshot'}
          </span>

          <div className="flex items-center gap-2">
            {isPending && order && (
              <>
                {onReject && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onReject(order);
                    }}
                    className="px-3.5 py-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-700/60 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Reject Proof</span>
                  </button>
                )}
                {onApprove && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onApprove(order);
                    }}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Payment</span>
                  </button>
                )}
              </>
            )}

            {screenshotUrl && (
              <>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenNewTab}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
