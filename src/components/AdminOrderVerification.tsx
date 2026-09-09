import React, { useState } from 'react';
import { PurchaseOrder, NoteItem, User } from '../types';
import { approvePurchaseOrder, rejectPurchaseOrder, deleteOrder } from '../utils/storage';
import { PhonePeQrCard } from './PhonePeQrCard';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  Search, 
  Filter, 
  ShieldCheck, 
  IndianRupee, 
  FileText, 
  QrCode, 
  Eye, 
  X,
  Check,
  Sparkles,
  Settings,
  Trash2
} from 'lucide-react';

interface AdminOrderVerificationProps {
  orders: PurchaseOrder[];
  onOrderUpdated: () => void;
}

export const AdminOrderVerification: React.FC<AdminOrderVerificationProps> = ({
  orders,
  onOrderUpdated,
}) => {
  const [filterStatus, setFilterStatus] = useState<'pending_verification' | 'completed' | 'rejected' | 'all'>('pending_verification');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);
  const [showQrStandeeModal, setShowQrStandeeModal] = useState(false);
  const [rejectionModalOrderId, setRejectionModalOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [deleteModalOrder, setDeleteModalOrder] = useState<PurchaseOrder | null>(null);
  const [successToast, setSuccessToast] = useState('');

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleApprove = (order: PurchaseOrder) => {
    const success = approvePurchaseOrder(order.id, 'Raj Sambhaji Bhosale (Admin)');
    if (success) {
      showToast(`Order #${order.orderNumber} APPROVED! Download access unlocked for ${order.buyerName} and seller wallet credited.`);
      onOrderUpdated();
    }
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModalOrderId) return;

    const reason = rejectionReason.trim() || 'Invalid PhonePe transaction reference or screenshot proof mismatch.';
    const success = rejectPurchaseOrder(rejectionModalOrderId, reason, 'Raj Sambhaji Bhosale (Admin)');
    if (success) {
      showToast(`Order marked as REJECTED. Buyer notified.`);
      setRejectionModalOrderId(null);
      setRejectionReason('');
      onOrderUpdated();
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteModalOrder) return;
    const orderNum = deleteModalOrder.orderNumber;
    const ok = deleteOrder(deleteModalOrder.id, 'Raj Sambhaji Bhosale (Admin)');
    if (ok) {
      showToast(`Order #${orderNum} deleted permanently from database.`);
      setDeleteModalOrder(null);
      onOrderUpdated();
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filterStatus !== 'all' && (order.status || 'completed') !== filterStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesOrder = (order.orderNumber || '').toLowerCase().includes(q);
      const matchesBuyer = (order.buyerName || '').toLowerCase().includes(q) || (order.buyerEmail || '').toLowerCase().includes(q);
      const matchesNote = (order.noteTitle || '').toLowerCase().includes(q);
      const matchesUtr = (order.upiTransactionId || '').toLowerCase().includes(q);
      return matchesOrder || matchesBuyer || matchesNote || matchesUtr;
    }
    return true;
  });

  const pendingCount = orders.filter((o) => o.status === 'pending_verification').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold">
              Manual PhonePe Verification
            </span>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-extrabold animate-pulse">
                {pendingCount} Awaiting Approval
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            PhonePe UPI Payment Verification & Approval
          </h2>
          <p className="text-xs text-slate-500">
            Verify buyer payment screenshot and 12-digit UTR against official payee account <strong>RAJ SAMBHAJI BHOSALE</strong>.
          </p>
        </div>

        {/* Stats Pill & QR Manager Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowQrStandeeModal(true)}
            className="px-3.5 py-2 bg-[#5f259f] hover:bg-[#702dbd] text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>View & Configure PhonePe Standee</span>
          </button>

          <div className="bg-purple-50 border border-purple-200 px-4 py-2 rounded-2xl text-xs">
            <span className="text-slate-500 text-[10px] block">Receiver</span>
            <strong className="text-purple-950 font-bold">Raj Sambhaji Bhosale</strong>
          </div>
        </div>
      </div>

      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl self-start">
          <button
            onClick={() => setFilterStatus('pending_verification')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filterStatus === 'pending_verification'
                ? 'bg-white text-amber-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending ({pendingCount})</span>
          </button>

          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filterStatus === 'completed'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Approved / Completed</span>
          </button>

          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filterStatus === 'rejected'
                ? 'bg-white text-rose-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Rejected</span>
          </button>

          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterStatus === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Orders ({orders.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by UTR, order, buyer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="p-3.5">Order / Date</th>
                  <th className="p-3.5">Buyer Details</th>
                  <th className="p-3.5">Note Details</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">PhonePe UTR / Screenshot</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const status = order.status || 'completed';
                  const isPending = status === 'pending_verification';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-slate-900 block">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(order.purchasedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{order.buyerName}</span>
                        <span className="text-[11px] text-slate-500">{order.buyerEmail || 'student@college.edu'}</span>
                      </td>

                      <td className="p-3.5 max-w-[200px]">
                        <span className="font-bold text-slate-900 block truncate">{order.noteTitle}</span>
                        <span className="text-[11px] text-slate-500 truncate block">
                          {order.subject} • {order.university}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-purple-950 text-sm block">₹{order.amount}</span>
                        <span className="text-[10px] text-slate-400">Payee: {order.receiverName || 'Raj Bhosale'}</span>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded block max-w-fit">
                            UTR: {order.upiTransactionId || 'T2608...'}
                          </span>
                          {order.paymentScreenshotUrl ? (
                            <button
                              onClick={() => setPreviewScreenshotUrl(order.paymentScreenshotUrl || null)}
                              className="text-[11px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 underline"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View Payment Screenshot</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">No screenshot</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            status === 'pending_verification'
                              ? 'bg-amber-100 text-amber-900'
                              : status === 'completed'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          {status === 'pending_verification' && <Clock className="w-3 h-3 animate-pulse" />}
                          {status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                          {status === 'rejected' && <XCircle className="w-3 h-3" />}
                          {status === 'pending_verification' ? 'Pending Review' : status === 'completed' ? 'Verified' : 'Rejected'}
                        </span>
                      </td>

                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleApprove(order)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition inline-flex items-center gap-1"
                              title="Approve order & unlock note"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => {
                                setRejectionModalOrderId(order.id);
                                setRejectionReason('');
                              }}
                              className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-xl text-xs transition inline-flex items-center gap-1"
                              title="Reject payment proof"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium mr-1.5">
                            {status === 'completed' ? 'Verified' : 'Dismissed'}
                          </span>
                        )}

                        {/* Admin Delete Order Option */}
                        <button
                          onClick={() => setDeleteModalOrder(order)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-500 rounded-xl text-xs font-bold transition inline-flex items-center gap-1"
                          title="Delete order record permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No orders found matching this filter.</p>
          </div>
        )}
      </div>

      {/* Screenshot Preview Modal */}
      {previewScreenshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                PhonePe Payment Screenshot Proof
              </h3>
              <button
                onClick={() => setPreviewScreenshotUrl(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center max-h-[70vh]">
              <img
                src={previewScreenshotUrl}
                alt="Payment proof screenshot"
                className="max-h-[68vh] object-contain rounded-xl"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewScreenshotUrl(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectionModalOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleConfirmReject} className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-rose-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Reject Order Payment</span>
              </h3>
              <button
                type="button"
                onClick={() => setRejectionModalOrderId(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Rejection (Visible to Buyer) *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. UTR number not found in Raj Sambhaji Bhosale's PhonePe statement, or amount mismatch."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectionModalOrderId(null)}
                className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Order Confirmation Modal */}
      {deleteModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Delete Order #{deleteModalOrder.orderNumber}?
                </h3>
                <p className="text-xs text-slate-500">
                  Buyer: <strong>{deleteModalOrder.buyerName}</strong> • ₹{deleteModalOrder.amount}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Are you sure you want to permanently delete this order record? This will remove the transaction from the audit ledger and cannot be undone.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PhonePe QR Standee Preview & Settings Modal */}
      {showQrStandeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-purple-700" />
                  <span>PhonePe QR Standee & UPI Settings</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Live preview of the customer-facing dark PhonePe standee with real scannable QR.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQrStandeeModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Standee Preview */}
            <div className="bg-slate-900 p-4 rounded-2xl">
              <PhonePeQrCard
                amount={49}
                receiverName="RAJ SAMBHAJI BHOSALE"
                noteTitle="Sample Study Note Verification"
                allowCustomUpload={true}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowQrStandeeModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
