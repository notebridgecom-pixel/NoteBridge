import React, { useState } from 'react';
import { User, NoteItem, PurchaseOrder, WithdrawalRequest } from '../types';
import { BUSINESS_RULES } from '../utils/storage';
import { 
  Wallet, 
  UploadCloud, 
  ArrowUpRight, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Eye, 
  FileText, 
  IndianRupee, 
  ShieldCheck, 
  Award,
  AlertCircle,
  HelpCircle,
  Camera,
  Trash2
} from 'lucide-react';

interface SellerDashboardProps {
  currentUser: User | null;
  notes: NoteItem[];
  orders: PurchaseOrder[];
  withdrawals: WithdrawalRequest[];
  onOpenUpload: () => void;
  onOpenWithdraw: () => void;
  onPreviewNote: (note: NoteItem) => void;
  onOpenProfilePhoto?: () => void;
  onDeleteNote?: (noteId: string) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  currentUser,
  notes,
  orders,
  withdrawals,
  onOpenUpload,
  onOpenWithdraw,
  onPreviewNote,
  onOpenProfilePhoto,
  onDeleteNote,
}) => {
  const [activeTab, setActiveTab] = useState<'listings' | 'sales' | 'wallet'>('listings');
  const [deleteTarget, setDeleteTarget] = useState<NoteItem | null>(null);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <Wallet className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Sign in to Access Your Seller Hub</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Upload verified study notes, track your 80% commission earnings, and withdraw payouts directly to UPI.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => window.location.hash = '#auth'}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-sm transition"
          >
            Sign In or Create Seller Account
          </button>
        </div>
      </div>
    );
  }

  // Filter listings belonging to this senior
  const myNotes = notes.filter((n) => (currentUser?.id && n.sellerId === currentUser.id) || (currentUser?.name && n.sellerName?.toLowerCase() === currentUser.name?.toLowerCase()));
  
  // Filter sales of this senior's notes
  const mySales = orders.filter((o) => (currentUser?.id && o.sellerId === currentUser.id) || (currentUser?.name && o.sellerName?.toLowerCase() === currentUser.name?.toLowerCase()));
  
  // Total earnings calculated from actual orders or user state
  const totalSalesCount = mySales.length;
  const calculatedTotalEarnings = mySales.filter(o => o.status === 'completed' || (o.status as string) === 'verified').reduce((sum, o) => sum + (o.sellerShare || 0), 0) || currentUser?.totalEarnings || 0;
  const availableWalletBalance = currentUser?.walletBalance ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900 overflow-hidden border-4 border-white shadow-md text-white flex items-center justify-center font-bold text-2xl flex-shrink-0">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                (currentUser?.name || 'S').charAt(0).toUpperCase()
              )}
            </div>
            {onOpenProfilePhoto && (
              <button
                type="button"
                onClick={onOpenProfilePhoto}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center justify-center transition"
                title="Change Senior Profile Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Senior Creator Hub
              </span>
              {currentUser?.isVerifiedSenior && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  Verified Senior
                </span>
              )}
              {onOpenProfilePhoto && (
                <button
                  type="button"
                  onClick={onOpenProfilePhoto}
                  className="text-[11px] text-slate-500 hover:text-blue-600 flex items-center gap-1 font-semibold ml-1 hover:underline"
                >
                  <Camera className="w-3 h-3" />
                  Change Photo
                </button>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              Seller Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Welcome, <strong>{currentUser?.name || 'Seller'}</strong> ({currentUser?.college || 'University'}). Monetize your original notes and earn 80% on every download.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="seller-withdraw-btn"
            onClick={onOpenWithdraw}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-2"
          >
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>Withdraw Earnings</span>
          </button>

          <button
            id="seller-upload-btn"
            onClick={onOpenUpload}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>+ Upload Notes</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Available Balance */}
        <div className="p-6 sm:p-8 bg-blue-600 text-white rounded-[2rem] shadow-sm space-y-3 relative overflow-hidden">
          <div className="w-24 h-24 bg-blue-500 rounded-full opacity-30 absolute -bottom-4 -right-4 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-100">
              Available Wallet Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="text-3xl font-black font-heading relative z-10">
            ₹{availableWalletBalance}
          </div>
          <div className="flex items-center justify-between pt-1 text-xs text-blue-100 relative z-10">
            <span>Mobile / UPI Payout in 3 Hours • Any Amount</span>
            <button
              onClick={onOpenWithdraw}
              className="text-white font-bold underline hover:text-blue-100"
            >
              Withdraw to Mobile/UPI →
            </button>
          </div>
        </div>

        {/* Card 2: Lifetime Total Earnings */}
        <div className="p-6 sm:p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Earnings
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-heading">
            ₹{calculatedTotalEarnings}
          </div>
          <p className="text-xs text-slate-500">
            Generated across all syllabus note downloads.
          </p>
        </div>

        {/* Card 3: Total Notes Distributed */}
        <div className="p-6 sm:p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Notes & Sales
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-heading">
            {myNotes.length} <span className="text-sm font-normal text-slate-500">Notes ({totalSalesCount} Sales)</span>
          </div>
          <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Watermark protection active</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'listings'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>My Uploaded Notes ({myNotes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sales')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'sales'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Sales & Royalties Table</span>
        </button>

        <button
          onClick={() => setActiveTab('wallet')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'wallet'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Wallet & Payout History</span>
        </button>
      </div>

      {/* Tab 1: Uploaded Listings Table */}
      {activeTab === 'listings' && (
        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
              Manage Your Note Listings
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              NoteBridge takes 20% platform fee • Senior receives 80%
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-4">Note Details & Subject</th>
                  <th className="p-4">University & Sem</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Your Earnings</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Sales</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myNotes.map((note) => {
                  const sellerShare = Math.round(note.price * BUSINESS_RULES.SELLER_PAYOUT_RATE * 10) / 10;
                  return (
                    <tr key={note.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-semibold text-slate-900 max-w-xs">
                        <div className="font-bold truncate">{note.title}</div>
                        <span className="text-[11px] text-blue-600 font-normal">{note.subject} • {note.unitsCovered}</span>
                      </td>
                      <td className="p-4 text-slate-600">
                        <div>{note.university.split('(')[0]}</div>
                        <span className="text-[11px] text-slate-400 font-medium">Sem {note.semester}</span>
                      </td>
                      <td className="p-4 font-bold text-slate-900">₹{note.price}</td>
                      <td className="p-4 font-black text-blue-600">₹{sellerShare}</td>
                      <td className="p-4">
                        {note.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            Approved & Live
                          </span>
                        )}
                        {note.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-900 font-bold rounded-full text-[10px]" title="Under Academic Council Verification">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        )}
                        {note.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-800 font-bold rounded-full text-[10px]" title={note.adminFeedback || 'Copyright or quality issue'}>
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-slate-800">
                        {note.salesCount || 0} copies
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => onPreviewNote(note)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition"
                            title="Preview Note"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                          {onDeleteNote && (
                            <button
                              onClick={() => setDeleteTarget(note)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                              title="Delete Note Listing"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Sales & Royalties Table */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-5 bg-slate-50/70 border-b border-slate-100">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
              Recent Sales Breakdown
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-4">Order Ref</th>
                  <th className="p-4">Note Title</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Total Price</th>
                  <th className="p-4">Your Share</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mySales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-mono font-bold text-blue-600">
                      {sale.orderNumber}
                    </td>
                    <td className="p-4 font-semibold text-slate-900 max-w-xs truncate">
                      {sale.noteTitle}
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(sale.purchasedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-4 font-bold text-slate-900">₹{sale.amount}</td>
                    <td className="p-4 font-black text-blue-600">₹{sale.sellerShare}</td>
                    <td className="p-4 uppercase text-[10px] font-mono text-slate-500">
                      {sale.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Credited
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Wallet & Payout History */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Registered Payout Method</span>
              <h4 className="text-sm font-bold text-slate-900">
                Direct UPI Transfer (Zero Deductions)
              </h4>
              <p className="text-xs text-slate-500">
                Withdrawals are transferred straight to your Google Pay / PhonePe UPI VPA within 15 minutes.
              </p>
            </div>
            <button
              onClick={onOpenWithdraw}
              className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-sm transition"
            >
              Withdraw Available ₹{availableWalletBalance}
            </button>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-5 bg-slate-50/70 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                UPI Withdrawal History
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="p-4">Transaction ID</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Receiver UPI ID</th>
                    <th className="p-4">Bank UTR Ref</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-mono font-semibold text-slate-900">{w.id}</td>
                      <td className="p-4 text-slate-500">
                        {new Date(w.requestedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="p-4 font-black text-slate-900">₹{w.amount}</td>
                      <td className="p-4 font-mono text-slate-600">{w.upiId}</td>
                      <td className="p-4 font-mono text-[11px] text-slate-500">{w.utrNumber || 'UTR-PENDING'}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          {w.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Delete Note Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Delete Note Listing?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently remove <strong className="text-slate-700">"{deleteTarget.title}"</strong>? This will remove the listing from the student catalog.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteNote && deleteTarget) {
                    onDeleteNote(deleteTarget.id);
                  }
                  setDeleteTarget(null);
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
