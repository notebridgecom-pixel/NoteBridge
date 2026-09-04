import React, { useState } from 'react';
import { User } from '../types';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  Info, 
  Wallet,
  ArrowRight
} from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onConfirmDelete: (reason: string) => void;
  onNavigateToWallet?: () => void;
}

const DELETION_REASONS = [
  'Completed / Graduated from college',
  'Created a duplicate or test account',
  'Privacy and personal data removal',
  'Switching to a different college or email',
  'Not actively using the platform anymore',
  'Other reason',
];

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  user,
  onClose,
  onConfirmDelete,
  onNavigateToWallet,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(DELETION_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [confirmText, setConfirmText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const isMasterAdmin = user.email.toLowerCase() === 'rajbhosaletkd@gmail.com';
  const expectedConfirmation = 'DELETE';
  const isConfirmed = confirmText.trim().toUpperCase() === expectedConfirmation || confirmText.trim().toLowerCase() === user.email.toLowerCase();
  const hasWalletBalance = (user.walletBalance || 0) > 0;

  const handleDelete = () => {
    if (isMasterAdmin) {
      setErrorMessage('Master administrator account cannot be deleted for platform security and stability.');
      return;
    }

    if (!isConfirmed) {
      setErrorMessage(`Please type "${expectedConfirmation}" or your registered email address to confirm.`);
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    const finalReason = selectedReason === 'Other reason' && customReason.trim()
      ? customReason.trim()
      : selectedReason;

    setTimeout(() => {
      onConfirmDelete(finalReason);
      setIsDeleting(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-rose-200/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header Banner */}
        <div className="bg-rose-50 border-b border-rose-100 p-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-rose-950 font-heading">
                Delete Account
              </h3>
              <p className="text-xs text-rose-700 font-medium">
                Permanent and irreversible action
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Master Admin Guard */}
          {isMasterAdmin ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Protected Master Administrator Account</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                The master administrator account (<strong>{user.email}</strong>) is the root authority for syllabus verification, UPI orders, and platform operations. This account cannot be self-deleted.
              </p>
            </div>
          ) : (
            <>
              {/* Wallet warning if balance > 0 */}
              {hasWalletBalance && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <Wallet className="w-4 h-4 text-amber-600" />
                      <span>Unwithdrawn Wallet Balance: ₹{user.walletBalance}</span>
                    </div>
                    {onNavigateToWallet && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToWallet();
                        }}
                        className="text-[11px] font-bold text-amber-800 hover:underline flex items-center gap-1"
                      >
                        <span>Withdraw First</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    You currently have ₹{user.walletBalance} in your seller balance. Deleting your account will forfeit this balance unless you request a payout first.
                  </p>
                </div>
              )}

              {/* Data Loss Warning Checklist */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-slate-500" />
                  What happens when you delete your account:
                </h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>Your student profile, academic credentials, and email association will be permanently deleted.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>Active device sessions, login tokens, and senior seller verification will be immediately revoked.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>Your unlocked note purchases and rating records will be unlinked.</span>
                  </li>
                </ul>
              </div>

              {/* Reason Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  Please tell us why you are deleting your account:
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {DELETION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {selectedReason === 'Other reason' && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Briefly describe the reason..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                )}
              </div>

              {/* Confirmation Input */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-800 block">
                  To confirm, type <span className="font-mono text-rose-600 font-black">DELETE</span> or your email (<span className="font-mono text-slate-700">{user.email}</span>):
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => {
                    setConfirmText(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Type DELETE here..."
                  className="w-full px-4 py-3 bg-rose-50/50 border border-rose-200 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-100 border border-rose-300 text-rose-900 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200/80 p-5 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            Cancel &amp; Keep Account
          </button>

          {!isMasterAdmin && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isConfirmed || isDeleting}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                isConfirmed && !isDeleting
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Deleting Account...' : 'Permanently Delete Account'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
