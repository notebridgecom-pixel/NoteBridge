import React, { useState } from 'react';
import { User, NoteItem, PurchaseOrder, ContentReport, WithdrawalRequest, UserRole } from '../types';
import { 
  saveNotes, 
  saveReports, 
  saveUsers, 
  getStoredOrders, 
  getStoredUsers, 
  getStoredReports,
  getStoredWithdrawals,
  toggleUserBlockStatus, 
  updateUserRole, 
  toggleUserSeniorVerification, 
  updateWithdrawalStatus,
  deleteNote,
  deleteUser,
  deleteWithdrawal,
  deleteReport,
  BUSINESS_RULES 
} from '../utils/storage';
import { logSecurityEvent, getStoredSecurityLogs } from '../utils/securityLogs';
import { AdminCatalogManager } from '../components/AdminCatalogManager';
import { AdminOrderVerification } from '../components/AdminOrderVerification';
import { AdminSecurityLogs } from '../components/AdminSecurityLogs';
import { AdminTransactionAnalytics } from '../components/AdminTransactionAnalytics';
import { AdminAccountsOverview } from '../components/AdminAccountsOverview';
import { PhonePeQrCard } from '../components/PhonePeQrCard';
import { getPhonePeConfig, savePhonePeConfig, POPULAR_UPI_HANDLES, PhonePeConfig } from '../utils/qrConfig';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  FileText, 
  Eye, 
  IndianRupee, 
  Search, 
  Filter, 
  Check, 
  MessageSquare,
  Sparkles,
  Lock,
  Building2,
  QrCode,
  Layers,
  GraduationCap,
  ShieldAlert,
  UserX,
  UserCheck,
  KeyRound,
  Terminal,
  Settings,
  Upload,
  RefreshCw,
  Save,
  Smartphone,
  Trash2,
  Wallet,
  Copy,
  ExternalLink,
  Send,
  Crown,
  UserCog,
  BadgeCheck,
  Award,
  Mail
} from 'lucide-react';
import { resolveSellerEmail } from '../utils/emailAlertService';

interface AdminDashboardProps {
  notes: NoteItem[];
  users: User[];
  orders: PurchaseOrder[];
  reports: ContentReport[];
  withdrawals: WithdrawalRequest[];
  currentUser?: User | null;
  onPreviewNote: (note: NoteItem) => void;
  onUpdateNoteStatus: (noteId: string, status: NoteItem['status'], feedback?: string) => void;
  onDeleteNote?: (noteId: string) => void;
  onRefreshOrders?: () => void;
  onRefreshUsers?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  notes,
  users: initialUsers,
  orders: initialOrders,
  reports: initialReports,
  withdrawals: initialWithdrawals,
  currentUser,
  onPreviewNote,
  onUpdateNoteStatus,
  onDeleteNote,
  onRefreshOrders,
  onRefreshUsers,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'transactions-analytics' | 'accounts-overview' | 'catalog' | 'pending' | 'all-notes' | 'users' | 'staff-roles' | 'withdrawals' | 'revenue' | 'reports' | 'logs' | 'qr-settings'>('orders');
  const [feedbackInput, setFeedbackInput] = useState<{ [noteId: string]: string }>({});
  const [actionSuccess, setActionSuccess] = useState('');
  const [orders, setOrders] = useState<PurchaseOrder[]>(initialOrders);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(initialWithdrawals);
  const [reports, setReports] = useState<ContentReport[]>(initialReports);
  const [userSearch, setUserSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [staffFilter, setStaffFilter] = useState<'all' | 'staff_only' | 'admins' | 'moderators' | 'sellers' | 'buyers'>('all');
  
  // Master Admin (Founder) Security Check
  const MASTER_ADMIN_EMAIL = 'rajbhosaletkd@gmail.com';
  const isMasterAdmin = !currentUser || currentUser.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
  
  // Withdrawal Tab Specific States
  const [withdrawalSearch, setWithdrawalSearch] = useState('');
  const [withdrawalFilterStatus, setWithdrawalFilterStatus] = useState<'all' | 'processing' | 'completed' | 'rejected'>('all');
  const [copiedUpi, setCopiedUpi] = useState<string | null>(null);
  const [fulfillModalTarget, setFulfillModalTarget] = useState<WithdrawalRequest | null>(null);
  const [fulfillUtrInput, setFulfillUtrInput] = useState('');
  
  // Deletion Modal States
  const [deleteNoteTarget, setDeleteNoteTarget] = useState<NoteItem | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<User | null>(null);
  const [deleteWithdrawalTarget, setDeleteWithdrawalTarget] = useState<WithdrawalRequest | null>(null);
  const [deleteReportTarget, setDeleteReportTarget] = useState<ContentReport | null>(null);
  
  // PhonePe / UPI Settings State
  const [qrConfig, setQrConfig] = useState<PhonePeConfig>(() => getPhonePeConfig());
  const [editUpiId, setEditUpiId] = useState(qrConfig.upiId || '8591587848@ybl');
  const [editReceiverName, setEditReceiverName] = useState(qrConfig.receiverName || 'RAJ SAMBHAJI BHOSALE');
  const [editPhone, setEditPhone] = useState(qrConfig.phonePeNumber || '+91 85915 87848');
  const [customQrImage, setCustomQrImage] = useState<string | null>(qrConfig.customQrImageUrl || null);
  const qrFileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync orders with localStorage
  const handleRefreshOrders = () => {
    const fresh = getStoredOrders();
    setOrders(fresh);
    if (onRefreshOrders) onRefreshOrders();
  };

  const handleRefreshUsers = () => {
    const freshUsers = getStoredUsers();
    setUsers(freshUsers);
    if (onRefreshUsers) onRefreshUsers();
  };

  const handleRefreshWithdrawals = () => {
    const fresh = getStoredWithdrawals();
    setWithdrawals(fresh);
  };

  const handleRefreshReports = () => {
    const fresh = getStoredReports();
    setReports(fresh);
  };

  // Delete Handlers
  const handleConfirmDeleteNote = () => {
    if (!deleteNoteTarget) return;
    const noteId = deleteNoteTarget.id;
    const title = deleteNoteTarget.title;
    
    if (onDeleteNote) {
      onDeleteNote(noteId);
    } else {
      deleteNote(noteId, 'Raj Sambhaji Bhosale (Admin)');
    }

    setDeleteNoteTarget(null);
    setActionSuccess(`Note "${title}" (#${noteId}) was permanently deleted from the academic catalog.`);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const handleConfirmDeleteUser = () => {
    if (!deleteUserTarget) return;
    const uName = deleteUserTarget.name;
    const uEmail = deleteUserTarget.email;

    if (uEmail === 'rajbhosaletkd@gmail.com') {
      alert('Master admin account cannot be deleted for system safety.');
      setDeleteUserTarget(null);
      return;
    }

    const ok = deleteUser(deleteUserTarget.id, 'Raj Sambhaji Bhosale (Admin)');
    if (ok) {
      handleRefreshUsers();
      setDeleteUserTarget(null);
      setActionSuccess(`User account for ${uName} (${uEmail}) has been deleted permanently.`);
      setTimeout(() => setActionSuccess(''), 4000);
    }
  };

  const handleConfirmDeleteWithdrawal = () => {
    if (!deleteWithdrawalTarget) return;
    const wId = deleteWithdrawalTarget.id;
    const seller = deleteWithdrawalTarget.sellerName;
    const amount = deleteWithdrawalTarget.amount;

    const ok = deleteWithdrawal(wId, 'Raj Sambhaji Bhosale (Admin)');
    if (ok) {
      handleRefreshWithdrawals();
      setDeleteWithdrawalTarget(null);
      setActionSuccess(`Withdrawal request #${wId} (₹${amount} for ${seller}) was deleted.`);
      setTimeout(() => setActionSuccess(''), 4000);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedUpi(text);
    setActionSuccess(`Copied ${label} (${text}) to clipboard!`);
    setTimeout(() => {
      setCopiedUpi(null);
      setActionSuccess('');
    }, 3000);
  };

  const handleConfirmFulfillWithdrawal = () => {
    if (!fulfillModalTarget) return;
    const wId = fulfillModalTarget.id;
    const seller = fulfillModalTarget.sellerName;
    const amount = fulfillModalTarget.amount;
    const utr = fulfillUtrInput.trim() || `UPI-TXN-${Date.now().toString().slice(-8)}`;

    const ok = updateWithdrawalStatus(wId, 'completed', utr, 'Raj Sambhaji Bhosale (Admin)');
    if (ok) {
      handleRefreshWithdrawals();
      setFulfillModalTarget(null);
      setFulfillUtrInput('');
      setActionSuccess(`₹${amount} payout to ${seller} marked as COMPLETED (UTR: ${utr}). Logged in Security & Audit Ledger.`);
      setTimeout(() => setActionSuccess(''), 5000);
    }
  };

  const handleRejectWithdrawal = (w: WithdrawalRequest) => {
    const reason = prompt(`Enter rejection reason for withdrawal #${w.id} (₹${w.amount} to ${w.sellerName}):`, 'Invalid UPI ID or incorrect mobile number provided.') || undefined;
    if (!reason) return;

    const ok = updateWithdrawalStatus(w.id, 'rejected', undefined, 'Raj Sambhaji Bhosale (Admin)');
    if (ok) {
      handleRefreshWithdrawals();
      handleRefreshUsers();
      setActionSuccess(`Withdrawal #${w.id} rejected. ₹${w.amount} refunded back to ${w.sellerName}'s wallet balance.`);
      setTimeout(() => setActionSuccess(''), 5000);
    }
  };

  const handleConfirmDeleteReport = () => {
    if (!deleteReportTarget) return;
    const rId = deleteReportTarget.id;
    const ok = deleteReport(rId, 'Raj Sambhaji Bhosale (Admin)');
    if (ok) {
      handleRefreshReports();
      setDeleteReportTarget(null);
      setActionSuccess(`Copyright report #${rId} was dismissed and deleted.`);
      setTimeout(() => setActionSuccess(''), 4000);
    }
  };

  // User moderation actions
  const handleToggleBlock = (user: User) => {
    const reason = user.isBlocked ? undefined : prompt('Enter suspension reason:', 'Violation of NoteBridge academic honesty policy.') || undefined;
    const updated = toggleUserBlockStatus(user.id, reason, 'Raj Sambhaji Bhosale (Admin)');
    if (updated) {
      handleRefreshUsers();
      setActionSuccess(`User ${user.name} account ${updated.isBlocked ? 'SUSPENDED' : 'RESTORED'}. Action logged in Security & Audit Ledger.`);
      setTimeout(() => setActionSuccess(''), 4000);
    }
  };

  const handleChangeRole = (user: User, newRole: UserRole) => {
    // If promoting to or demoting from admin or moderator, ensure only master admin can perform it
    if ((newRole === 'admin' || newRole === 'moderator' || user.role === 'admin' || user.role === 'moderator') && !isMasterAdmin) {
      alert(`Master Admin Exclusive: Only the platform founder Raj Sambhaji Bhosale (${MASTER_ADMIN_EMAIL}) can appoint or revoke Moderator and Admin privileges.`);
      return;
    }

    if (user.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() && newRole !== 'admin') {
      alert(`Root Account Protected: The Master Admin (${MASTER_ADMIN_EMAIL}) cannot be demoted.`);
      return;
    }

    const updated = updateUserRole(user.id, newRole, 'Raj Sambhaji Bhosale (Master Admin)');
    if (updated) {
      handleRefreshUsers();
      setActionSuccess(`Role for ${user.name} (${user.email}) successfully updated to ${newRole.toUpperCase()} by Master Admin. Recorded in Security Ledger.`);
      setTimeout(() => setActionSuccess(''), 4500);
    }
  };

  const handleToggleSeniorVerification = (user: User) => {
    const willVerify = !user.isVerifiedSenior;
    const updated = toggleUserSeniorVerification(user.id, willVerify, 'Raj Sambhaji Bhosale (Admin)');
    if (updated) {
      handleRefreshUsers();
      setActionSuccess(`Seller verification for ${user.name} ${willVerify ? 'APPROVED & VERIFIED' : 'REVOKED'}.`);
      setTimeout(() => setActionSuccess(''), 4000);
    }
  };

  // Analytics & Platform Counters
  const totalGMV = orders.filter(o => o.status === 'completed' || (o.status as string) === 'verified').reduce((sum, o) => sum + o.amount, 0);
  const platformRevenue = Math.round(totalGMV * BUSINESS_RULES.PLATFORM_COMMISSION_RATE); // 20%
  const seniorPayouts = Math.round(totalGMV * BUSINESS_RULES.SELLER_PAYOUT_RATE); // 80%
  const pendingNotes = notes.filter((n) => n.status === 'pending' || n.status === 'changes_requested');
  const pendingOrders = orders.filter((o) => o.status === 'pending_verification');
  const totalTransactionsCount = orders.length;
  const completedTransactionsCount = orders.filter(o => o.status === 'completed' || (o.status as string) === 'verified').length;
  const totalAccountsCount = users.length;
  const activeStudentsCount = users.filter(u => !u.isBlocked && (u.role === 'buyer' || u.role === 'seller' || !u.role)).length;
  const processingWithdrawalsCount = withdrawals.filter((w) => w.status === 'processing').length;
  const completedWithdrawalsCount = withdrawals.filter((w) => w.status === 'completed').length;
  const totalDisbursedAmount = withdrawals.filter((w) => w.status === 'completed').reduce((sum, w) => sum + w.amount, 0);
  const securityLogsCount = getStoredSecurityLogs().length;

  const handleApprove = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    onUpdateNoteStatus(noteId, 'approved');

    logSecurityEvent({
      action: 'note_approved',
      category: 'note_moderation',
      severity: 'success',
      performedBy: 'Raj Sambhaji Bhosale (Admin)',
      targetType: 'note',
      targetId: noteId,
      targetLabel: note?.title || `Note #${noteId}`,
      details: `Approved academic study note '${note?.title || noteId}' by seller ${note?.sellerName || 'author'}. Listed in public marketplace catalog at ₹${note?.price || 49}.`,
      metadata: {
        noteId,
        title: note?.title,
        subject: note?.subject,
        college: note?.collegeName || note?.university,
        author: note?.sellerName,
        price: `₹${note?.price || 49}`,
      },
    });

    setActionSuccess(`Note #${noteId} successfully APPROVED and logged in Security Ledger! Notice dispatched to ${note?.sellerName || 'author'}.`);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const handleReject = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    const reason = feedbackInput[noteId] || 'Material violates original handwritten study note policy (copyright scan or poor scan resolution).';
    onUpdateNoteStatus(noteId, 'rejected', reason);

    logSecurityEvent({
      action: 'note_rejected',
      category: 'note_moderation',
      severity: 'warning',
      performedBy: 'Raj Sambhaji Bhosale (Admin)',
      targetType: 'note',
      targetId: noteId,
      targetLabel: note?.title || `Note #${noteId}`,
      details: `Rejected submission for note '${note?.title || noteId}'. Feedback reason: ${reason}. Author: ${note?.sellerName || 'author'}.`,
      metadata: {
        noteId,
        title: note?.title,
        reason,
        author: note?.sellerName,
      },
    });

    setActionSuccess(`Note #${noteId} REJECTED and recorded in Security Logs. Moderation notice emailed to ${note?.sellerName || 'author'}.`);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const handleRequestChanges = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    const reason = feedbackInput[noteId] || 'Please re-upload higher resolution scan or clearly specify syllabus units.';
    onUpdateNoteStatus(noteId, 'changes_requested', reason);

    logSecurityEvent({
      action: 'note_changes_requested',
      category: 'note_moderation',
      severity: 'info',
      performedBy: 'Raj Sambhaji Bhosale (Admin)',
      targetType: 'note',
      targetId: noteId,
      targetLabel: note?.title || `Note #${noteId}`,
      details: `Requested revision from author for note '${note?.title || noteId}'. Required changes: ${reason}.`,
      metadata: {
        noteId,
        title: note?.title,
        reason,
        author: note?.sellerName,
      },
    });

    setActionSuccess(`Requested changes for Note #${noteId}. Moderation alert emailed to ${note?.sellerName || 'author'} with your feedback.`);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
              Quality Assurance & Moderation Cell
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-heading mt-1">
            NoteBridge Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage Academic Catalog, verify PhonePe UPI payments (Payee: <strong>Raj Sambhaji Bhosale</strong>), review note submissions, and monitor 20% platform revenue.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-purple-50 text-purple-900 px-4 py-2 rounded-2xl border border-purple-200 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-purple-700" />
          <span>Admin Access Active</span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 5 Financial, Transaction & Moderation KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Active Number of Students */}
        <div 
          onClick={() => setActiveTab('accounts-overview')}
          className="p-5 bg-white hover:bg-slate-50 transition cursor-pointer rounded-3xl border border-slate-200/80 shadow-xs space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wide">
              Active Students
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
            {activeStudentsCount}
          </div>
          <div className="text-[11px] text-slate-500">
            Across {totalAccountsCount} registered accounts
          </div>
        </div>

        {/* Metric 2: Total Registered Accounts */}
        <div 
          onClick={() => setActiveTab('accounts-overview')}
          className="p-5 bg-white hover:bg-slate-50 transition cursor-pointer rounded-3xl border border-slate-200/80 shadow-xs space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wide">
              Total Accounts
            </span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
            {totalAccountsCount}
          </div>
          <div className="text-[11px] text-slate-500">
            Diploma, B.Tech, BCA &amp; Staff
          </div>
        </div>

        {/* Metric 3: Total Transactions */}
        <div 
          onClick={() => setActiveTab('transactions-analytics')}
          className="p-5 bg-white hover:bg-slate-50 transition cursor-pointer rounded-3xl border border-slate-200/80 shadow-xs space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide">
              Total Transactions
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
            {totalTransactionsCount}
          </div>
          <div className="text-[11px] text-slate-500">
            {completedTransactionsCount} settled • {pendingOrders.length} pending
          </div>
        </div>

        {/* Metric 4: Total Marketplace GMV */}
        <div 
          onClick={() => setActiveTab('transactions-analytics')}
          className="p-5 bg-white hover:bg-slate-50 transition cursor-pointer rounded-3xl border border-slate-200/80 shadow-xs space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
              Marketplace GMV
            </span>
            <IndianRupee className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
            ₹{totalGMV}
          </div>
          <div className="text-[11px] text-slate-500">
            Gross student purchase volume
          </div>
        </div>

        {/* Metric 5: Platform Revenue (20%) */}
        <div className="p-5 bg-[#5f259f] text-white rounded-3xl shadow-xs space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-purple-100 uppercase tracking-wide">
              NoteBridge (20%)
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">Commission</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-heading">
            ₹{platformRevenue}
          </div>
          <div className="text-[11px] text-purple-200">
            Payee: Raj Sambhaji Bhosale
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-[#5f259f] text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>PhonePe Payment Verification ({pendingOrders.length})</span>
        </button>

        {/* Tab: Transaction Analytics (1D / 1M / 1Y) */}
        <button
          onClick={() => setActiveTab('transactions-analytics')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'transactions-analytics'
              ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-400'
              : 'text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-extrabold'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span>Transactions (1 Day, 1 Month, 1 Year)</span>
        </button>

        {/* Tab: Registered Accounts Hub & Demographics */}
        <button
          onClick={() => setActiveTab('accounts-overview')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'accounts-overview'
              ? 'bg-blue-700 text-white shadow-xs ring-2 ring-blue-400'
              : 'text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 font-extrabold'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-blue-600" />
          <span>Registered Accounts &amp; Streams ({totalAccountsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Academic Catalog Management</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Note Submissions Queue ({pendingNotes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('all-notes')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'all-notes'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>All Notes Catalog ({notes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Students &amp; Seniors Directory ({users.length})</span>
        </button>

        {/* Tab: Master Admin Moderator & Admin Access Control */}
        <button
          onClick={() => setActiveTab('staff-roles')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'staff-roles'
              ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-xs ring-2 ring-amber-400'
              : 'text-purple-900 bg-purple-100/70 hover:bg-purple-200/90 border border-purple-200 font-extrabold'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-amber-500" />
          <span>Moderator &amp; Admin Access ({users.filter(u => u.role === 'admin' || u.role === 'moderator').length})</span>
        </button>

        {/* Tab: Withdrawal Requests */}
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'withdrawals'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-3.5 h-3.5 text-emerald-500" />
          <span>Withdrawal Requests ({withdrawals.length})</span>
          {processingWithdrawalsCount > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'withdrawals' 
                ? 'bg-white text-emerald-800' 
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {processingWithdrawalsCount} pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'revenue'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <IndianRupee className="w-3.5 h-3.5" />
          <span>Revenue &amp; Platform Cut</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Copyright Claims ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('qr-settings')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'qr-settings'
              ? 'bg-[#5f259f] text-white shadow-xs ring-2 ring-purple-400'
              : 'text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300 font-extrabold'
          }`}
        >
          <QrCode className="w-3.5 h-3.5 text-purple-700" />
          <span>PhonePe QR &amp; UPI Configuration</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-slate-950 text-white shadow-xs ring-2 ring-purple-500/50'
              : 'text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
          <span>Security &amp; Audit Logs ({securityLogsCount})</span>
        </button>
      </div>

      {/* Tab 1: PhonePe Orders Verification */}
      {activeTab === 'orders' && (
        <AdminOrderVerification
          orders={orders}
          onOrderUpdated={handleRefreshOrders}
        />
      )}

      {/* Tab: Transaction Analytics (1 Day, 1 Month, 1 Year Breakdown) */}
      {activeTab === 'transactions-analytics' && (
        <AdminTransactionAnalytics
          orders={orders}
          withdrawals={withdrawals}
        />
      )}

      {/* Tab: Registered Accounts, Students & Stream Breakdown */}
      {activeTab === 'accounts-overview' && (
        <AdminAccountsOverview
          users={users}
          notes={notes}
          orders={orders}
        />
      )}

      {/* Tab 2: Academic Catalog Management */}
      {activeTab === 'catalog' && (
        <AdminCatalogManager />
      )}

      {/* Tab 3: Pending Note Moderation Queue */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-950 text-white rounded-[2rem] border border-slate-900 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-sm">Admin Moderation Guidelines:</p>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                1. Verify that the note is original student handwriting/typing and NOT a copyrighted scan from commercial textbooks.<br />
                2. Check syllabus alignment: College → Course → Branch → Semester → Subject → Units.<br />
                3. Ensure reasonable author pricing and accurate document page count.
              </p>
            </div>
          </div>

          {pendingNotes.length > 0 ? (
            <div className="space-y-4">
              {pendingNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white rounded-[2rem] border border-slate-100 p-6 sm:p-8 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold text-xs rounded-full">
                          {note.subject}
                        </span>
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                          Sem {note.semester}
                        </span>
                        <span className="font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full text-xs">
                          Price: ₹{note.price} (Seller gets ₹{(note.price * 0.8).toFixed(1)})
                        </span>
                        {note.status === 'changes_requested' ? (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                            Revision Requested
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full animate-pulse">
                            Pending Review
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 text-base">{note.title}</h3>
                      <p className="text-xs text-slate-600">{note.description}</p>
                      <p className="text-[11px] text-slate-500">
                        Uploaded by <strong className="text-slate-800">{note.sellerName}</strong> ({note.sellerCollege || note.collegeName}) • {note.university}
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          <Mail className="w-2.5 h-2.5" />
                          {resolveSellerEmail(note).email}
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={() => onPreviewNote(note)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 self-start"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Inspect PDF Pages</span>
                    </button>
                  </div>

                  {/* Feedback Box & Actions */}
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <input
                        type="text"
                        placeholder="Admin feedback reason (emailed directly to seller upon rejection/revision)..."
                        value={feedbackInput[note.id] || ''}
                        onChange={(e) => setFeedbackInput({ ...feedbackInput, [note.id]: e.target.value })}
                        className="w-full sm:w-96 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleRequestChanges(note.id)}
                          className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition flex items-center gap-1"
                          title="Triggers email alert to seller requesting revisions"
                        >
                          <Mail className="w-3 h-3 text-amber-600" />
                          <span>Request Revision</span>
                        </button>
                        <button
                          onClick={() => handleReject(note.id)}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                          title="Triggers email alert to seller with rejection feedback"
                        >
                          <Mail className="w-3 h-3 text-rose-600" />
                          <span>Reject</span>
                        </button>
                      <button
                        onClick={() => handleApprove(note.id)}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                      >
                        Approve & Publish
                      </button>
                      <button
                        onClick={() => setDeleteNoteTarget(note)}
                        className="px-3 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-500 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        title="Delete note submission permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">Review Queue Clear</h3>
              <p className="text-xs text-slate-500">All submitted student notes have been reviewed.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: All Notes Inventory */}
      {activeTab === 'all-notes' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Full Academic Notes Directory</h3>
            <span className="text-xs text-slate-500">{notes.length} total entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="p-3">Title & Subject</th>
                  <th className="p-3">Institution / Board</th>
                  <th className="p-3">Seller</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Sales</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notes.map((note) => (
                  <tr key={note.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900 max-w-xs truncate">
                      {note.title}
                      <span className="block text-[11px] font-normal text-slate-500">{note.subject} (Sem {note.semester})</span>
                    </td>
                    <td className="p-3 text-slate-600">{note.collegeName || note.university}</td>
                    <td className="p-3 font-medium text-slate-800">{note.sellerName}</td>
                    <td className="p-3 font-bold text-purple-950">₹{note.price}</td>
                    <td className="p-3 font-bold text-emerald-700">{note.salesCount || 0}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        note.status === 'approved' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : note.status === 'pending'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : note.status === 'changes_requested'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {note.status === 'approved' ? '✓ Approved' : note.status === 'pending' ? '⏳ Pending' : note.status === 'changes_requested' ? '⚠️ Revision' : '✕ Rejected'}
                      </span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                      {note.status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(note.id)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 transition"
                          title="Approve note listing"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                      )}
                      <button
                        onClick={() => onPreviewNote(note)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px]"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => setDeleteNoteTarget(note)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 transition"
                        title="Delete note permanently"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Manage Students & Seniors */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">User Management & Account Status Control</h3>
              <p className="text-xs text-slate-500">
                Manage roles, verify senior scholars, or suspend accounts for academic dishonesty or invalid payments.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-full self-start">
              {users.length} registered accounts
            </span>
          </div>

          {/* User Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users by name, email, college or branch..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users
              .filter(u => !userSearch.trim() || 
                (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) || 
                (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                (u.college || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                (u.branch || '').toLowerCase().includes(userSearch.toLowerCase())
              )
              .map((u) => (
                <div 
                  key={u.id} 
                  className={`p-5 rounded-2xl border transition space-y-3 ${
                    u.isBlocked 
                      ? 'bg-red-50/40 border-red-200' 
                      : 'bg-slate-50 border-slate-200 hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">{u.name}</span>
                        {u.isBlocked && (
                          <span className="px-2 py-0.2 bg-red-600 text-white text-[9px] font-bold rounded-full uppercase">
                            SUSPENDED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                    </div>

                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                      u.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                        : u.role === 'seller'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {u.role}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600">
                    <strong>{u.college || 'Vidyalankar Polytechnic'}</strong> • {u.degree || 'Diploma'} ({u.branch || 'CO'})
                  </p>

                  {u.isBlocked && u.blockedReason && (
                    <div className="p-2 bg-red-100/60 border border-red-200 rounded-lg text-[10px] text-red-900">
                      <strong>Reason:</strong> {u.blockedReason}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Wallet: <strong>₹{u.walletBalance || 0}</strong></span>
                    <span className="text-emerald-700 font-bold">Rating: ★ {u.rating || 5.0}</span>
                  </div>

                  {/* Interactive Admin Account Controls */}
                  <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                      {/* Role selector */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">Role:</span>
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u, e.target.value as UserRole)}
                          className="text-[10px] bg-white border border-slate-200 rounded-md px-1.5 py-0.5 font-bold text-slate-700"
                        >
                          <option value="buyer">Buyer</option>
                          <option value="seller">Seller</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                    <div className="flex items-center gap-1.5">
                      {/* Senior Seller Approval Toggle */}
                      <button
                        onClick={() => handleToggleSeniorVerification(u)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                          u.isVerifiedSenior
                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                        title={u.isVerifiedSenior ? 'Revoke Senior Seller Verification' : 'Approve Senior Seller Verification'}
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>{u.isVerifiedSenior ? 'Verified' : 'Verify'}</span>
                      </button>

                      {/* Block / Unblock Toggle */}
                      <button
                        onClick={() => handleToggleBlock(u)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                          u.isBlocked
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.isBlocked ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            <span>Restore</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3" />
                            <span>Suspend</span>
                          </>
                        )}
                      </button>

                      {/* Delete User Option */}
                      <button
                        onClick={() => setDeleteUserTarget(u)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-red-700 hover:bg-red-50 transition flex items-center gap-0.5"
                        title="Permanently Delete User Account"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tab: Master Admin Moderator & Admin Access Control */}
      {activeTab === 'staff-roles' && (
        <div className="space-y-6">
          {/* Master Admin Founder Verification Banner */}
          <div className="bg-gradient-to-r from-amber-500 via-purple-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <Crown className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                    Master Admin Authority
                  </span>
                  <span className="px-3 py-1 bg-white/20 text-white font-bold text-xs rounded-full">
                    Root Role Governance
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-heading">
                  Moderator &amp; Admin Assignment Center
                </h2>
                <p className="text-xs sm:text-sm text-purple-100 max-w-2xl leading-relaxed">
                  Only the platform founder <strong>Raj Sambhaji Bhosale</strong> (<span className="font-mono underline text-amber-300">rajbhosaletkd@gmail.com</span>) possesses root authority to appoint new Moderators, promote Administrators, or revoke staff privileges across NoteBridge.
                </p>
              </div>

              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex flex-col items-start md:items-end flex-shrink-0 text-xs">
                <span className="text-amber-200 font-bold">Authorized Master Admin:</span>
                <span className="text-sm font-extrabold text-white">Raj Sambhaji Bhosale</span>
                <span className="font-mono text-[11px] text-purple-200">{MASTER_ADMIN_EMAIL}</span>
                <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-bold">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Root Security Active
                </span>
              </div>
            </div>
          </div>

          {!isMasterAdmin && (
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-3xl flex items-start gap-4 text-xs text-rose-900">
              <ShieldAlert className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-rose-950">Master Admin Privilege Locked</h4>
                <p className="mt-1 leading-relaxed text-rose-800">
                  You are currently viewing in limited administrative mode. Role elevating and demoting capabilities are cryptographically secured and strictly reserved for <strong>Raj Sambhaji Bhosale ({MASTER_ADMIN_EMAIL})</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Quick Staff Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-purple-600">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Admins</span>
                <Crown className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <p className="text-[11px] text-slate-400">Full operational control</p>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-blue-600">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Moderators</span>
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                {users.filter(u => u.role === 'moderator').length}
              </div>
              <p className="text-[11px] text-slate-400">Quality &amp; notes review cell</p>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-emerald-600">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Senior Sellers</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                {users.filter(u => u.role === 'seller' && u.isVerifiedSenior).length}
              </div>
              <p className="text-[11px] text-slate-400">Verified note creators</p>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Student Buyers</span>
                <Users className="w-4 h-4 text-slate-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                {users.filter(u => u.role === 'buyer').length}
              </div>
              <p className="text-[11px] text-slate-400">Catalog learners &amp; students</p>
            </div>
          </div>

          {/* Staff Roster & 1-Click Assignment Station */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg font-heading">
                  User Role Assignment Station
                </h3>
                <p className="text-xs text-slate-500">
                  Search any student or scholar account to promote them to <strong>Moderator</strong> or <strong>Admin</strong> in 1 click.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: `All Users (${users.length})` },
                  { id: 'staff_only', label: `Staff Only (${users.filter(u => u.role === 'admin' || u.role === 'moderator').length})` },
                  { id: 'admins', label: `Admins (${users.filter(u => u.role === 'admin').length})` },
                  { id: 'moderators', label: `Moderators (${users.filter(u => u.role === 'moderator').length})` },
                  { id: 'sellers', label: `Sellers (${users.filter(u => u.role === 'seller').length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStaffFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                      staffFilter === f.id
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative max-w-lg">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user by name, email, college, degree or branch..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* User Cards with 1-Click Promote / Demote */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users
                .filter(u => {
                  if (staffFilter === 'staff_only') return u.role === 'admin' || u.role === 'moderator';
                  if (staffFilter === 'admins') return u.role === 'admin';
                  if (staffFilter === 'moderators') return u.role === 'moderator';
                  if (staffFilter === 'sellers') return u.role === 'seller';
                  if (staffFilter === 'buyers') return u.role === 'buyer';
                  return true;
                })
                .filter(u => !roleSearch.trim() || 
                  (u.name || '').toLowerCase().includes(roleSearch.toLowerCase()) || 
                  (u.email || '').toLowerCase().includes(roleSearch.toLowerCase()) ||
                  (u.college || '').toLowerCase().includes(roleSearch.toLowerCase()) ||
                  (u.branch || '').toLowerCase().includes(roleSearch.toLowerCase())
                )
                .map((u) => {
                  const isUserMasterAdmin = u.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
                  return (
                    <div
                      key={u.id}
                      className={`p-5 rounded-2xl border transition-all space-y-4 ${
                        isUserMasterAdmin
                          ? 'bg-gradient-to-br from-amber-50 to-purple-50/50 border-amber-300 ring-1 ring-amber-400'
                          : u.role === 'admin'
                          ? 'bg-purple-50/50 border-purple-200 hover:border-purple-300'
                          : u.role === 'moderator'
                          ? 'bg-blue-50/50 border-blue-200 hover:border-blue-300'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* User Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 ${
                            isUserMasterAdmin
                              ? 'bg-gradient-to-tr from-amber-500 to-purple-600'
                              : u.role === 'admin'
                              ? 'bg-purple-600'
                              : u.role === 'moderator'
                              ? 'bg-blue-600'
                              : u.role === 'seller'
                              ? 'bg-emerald-600'
                              : 'bg-slate-600'
                          }`}>
                            {isUserMasterAdmin ? <Crown className="w-5 h-5" /> : (u.name.charAt(0).toUpperCase())}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-extrabold text-xs text-slate-900">{u.name}</h4>
                              {isUserMasterAdmin && (
                                <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[9px] font-black rounded uppercase">
                                  MASTER ADMIN
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase border ${
                          isUserMasterAdmin
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                            : u.role === 'moderator'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : u.role === 'seller'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {u.role}
                        </span>
                      </div>

                      {/* User Metadata */}
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <p className="truncate"><strong>College:</strong> {u.college || 'Vidyalankar Polytechnic'}</p>
                        <p><strong>Program:</strong> {u.degree || 'Diploma'} • {u.branch || 'CO'} (Sem {u.semester || 4})</p>
                      </div>

                      {/* 1-Click Role Change Buttons */}
                      <div className="pt-3 border-t border-slate-200/80 space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                          <span>Set Role Privileges</span>
                          {isUserMasterAdmin && <span className="text-amber-600 font-black">Founder Account</span>}
                        </div>

                        {isUserMasterAdmin ? (
                          <div className="p-2 bg-amber-100/70 border border-amber-300 rounded-xl text-[10px] text-amber-900 font-bold text-center">
                            👑 Platform Owner &amp; Root Administrator (Cannot be modified)
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-1.5">
                            {/* 1. Make Moderator Button */}
                            <button
                              onClick={() => handleChangeRole(u, 'moderator')}
                              disabled={!isMasterAdmin || u.role === 'moderator'}
                              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold transition flex items-center justify-center gap-1 ${
                                u.role === 'moderator'
                                  ? 'bg-blue-600 text-white shadow-xs cursor-default'
                                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                              } disabled:opacity-50`}
                              title="Assign Moderator role (review notes, handwriting & syllabus verification)"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>{u.role === 'moderator' ? 'Current: Moderator' : 'Make Moderator'}</span>
                            </button>

                            {/* 2. Make Admin Button */}
                            <button
                              onClick={() => handleChangeRole(u, 'admin')}
                              disabled={!isMasterAdmin || u.role === 'admin'}
                              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold transition flex items-center justify-center gap-1 ${
                                u.role === 'admin'
                                  ? 'bg-purple-700 text-white shadow-xs cursor-default'
                                  : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                              } disabled:opacity-50`}
                              title="Assign Admin role (manage catalog, verify PhonePe orders, disburse payouts)"
                            >
                              <Crown className="w-3 h-3" />
                              <span>{u.role === 'admin' ? 'Current: Admin' : 'Make Admin'}</span>
                            </button>

                            {/* 3. Make Senior Seller Button */}
                            <button
                              onClick={() => handleChangeRole(u, 'seller')}
                              disabled={!isMasterAdmin || u.role === 'seller'}
                              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold transition flex items-center justify-center gap-1 ${
                                u.role === 'seller'
                                  ? 'bg-emerald-600 text-white shadow-xs cursor-default'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                              } disabled:opacity-50`}
                              title="Assign Senior Seller role (upload and monetize notes)"
                            >
                              <Award className="w-3 h-3" />
                              <span>{u.role === 'seller' ? 'Current: Seller' : 'Make Seller'}</span>
                            </button>

                            {/* 4. Reset to Buyer */}
                            <button
                              onClick={() => handleChangeRole(u, 'buyer')}
                              disabled={!isMasterAdmin || u.role === 'buyer'}
                              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                                u.role === 'buyer'
                                  ? 'bg-slate-700 text-white shadow-xs cursor-default'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                              } disabled:opacity-50`}
                              title="Reset user to standard student buyer"
                            >
                              <Users className="w-3 h-3" />
                              <span>{u.role === 'buyer' ? 'Current: Buyer' : 'Make Buyer'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Role Governance & Permissions Matrix */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-base text-white">
                NoteBridge Governance &amp; Role Permissions Hierarchy
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Role Tier</th>
                    <th className="p-3">Assigned Authority</th>
                    <th className="p-3">Catalog &amp; Notes</th>
                    <th className="p-3">PhonePe &amp; Payments</th>
                    <th className="p-3">Staff Assignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-[11px]">
                  <tr className="bg-amber-950/20 text-amber-100">
                    <td className="p-3 font-extrabold flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Master Admin (Founder)</span>
                    </td>
                    <td className="p-3 font-semibold">Raj Sambhaji Bhosale</td>
                    <td className="p-3">Full Catalog Control &amp; Deletion</td>
                    <td className="p-3">Configure QR / UPI &amp; Payouts</td>
                    <td className="p-3 font-bold text-amber-300">👑 Sole Authority to Make Admins &amp; Moderators</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-purple-300">Platform Admin</td>
                    <td className="p-3">Delegated by Master Admin</td>
                    <td className="p-3">Approve/Reject Notes &amp; Manage Catalog</td>
                    <td className="p-3">Verify Orders &amp; Disburse Payouts</td>
                    <td className="p-3 text-slate-400">View Only</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-blue-300">Moderator</td>
                    <td className="p-3">Delegated by Master Admin</td>
                    <td className="p-3">Review Handwritten Quality &amp; Syllabus</td>
                    <td className="p-3 text-slate-500">No Access</td>
                    <td className="p-3 text-slate-500">No Access</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-emerald-300">Senior Seller</td>
                    <td className="p-3">Approved Senior Contributor</td>
                    <td className="p-3">Upload &amp; Monetize Handwritten Notes</td>
                    <td className="p-3">Receive Royalties (Instant Withdrawal)</td>
                    <td className="p-3 text-slate-500">No Access</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-300">Student Buyer</td>
                    <td className="p-3">Registered Learner</td>
                    <td className="p-3">3-Page Free Preview, Unlock Full PDFs</td>
                    <td className="p-3">Pay via PhonePe / UPI QR</td>
                    <td className="p-3 text-slate-500">No Access</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Dedicated Senior Seller Withdrawal Requests */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  Senior Author Payout Cell
                </span>
                <span className="text-xs text-slate-400 font-mono">3-Hour Guaranteed SLA</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-xl font-heading mt-1">
                Senior Seller Withdrawal Requests
              </h3>
              <p className="text-xs text-slate-500 max-w-2xl">
                Manage and disburse earnings to note creators. Senior sellers retain <strong>80% of sales</strong> (₹{seniorPayouts} total author earnings pool). Payouts are transferred via Mobile Number (PhonePe/GPay/Paytm) or UPI ID.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshWithdrawals}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                title="Refresh withdrawal requests list"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Requests</span>
              <div className="text-2xl font-black text-slate-900 font-heading">{withdrawals.length}</div>
              <div className="text-[10px] text-slate-500">All submitted payout claims</div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">Awaiting Disbursal</span>
                {processingWithdrawalsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                )}
              </div>
              <div className="text-2xl font-black text-amber-900 font-heading">{processingWithdrawalsCount}</div>
              <div className="text-[10px] text-amber-700 font-medium">⚡ Within 3-Hour Target SLA</div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Total Disbursed</span>
              <div className="text-2xl font-black text-emerald-950 font-heading">₹{totalDisbursedAmount}</div>
              <div className="text-[10px] text-emerald-700">{completedWithdrawalsCount} successful payouts</div>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wide">Payment Channels</span>
              <div className="text-sm font-extrabold text-purple-950 flex items-center gap-1.5 pt-1">
                <Smartphone className="w-4 h-4 text-purple-700" />
                <span>PhonePe / GPay / UPI</span>
              </div>
              <div className="text-[10px] text-purple-700">Direct mobile number or UPI VPA</div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by seller name, mobile number, UPI ID, payout ID..."
                value={withdrawalSearch}
                onChange={(e) => setWithdrawalSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setWithdrawalFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  withdrawalFilterStatus === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({withdrawals.length})
              </button>
              <button
                onClick={() => setWithdrawalFilterStatus('processing')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  withdrawalFilterStatus === 'processing'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-800 hover:bg-amber-100/60'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Processing ({processingWithdrawalsCount})</span>
              </button>
              <button
                onClick={() => setWithdrawalFilterStatus('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  withdrawalFilterStatus === 'completed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-800 hover:bg-emerald-100/60'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Completed ({completedWithdrawalsCount})</span>
              </button>
              <button
                onClick={() => setWithdrawalFilterStatus('rejected')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  withdrawalFilterStatus === 'rejected'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-red-700 hover:bg-red-100/60'
                }`}
              >
                Rejected ({withdrawals.filter(w => w.status === 'rejected').length})
              </button>
            </div>
          </div>

          {/* Table */}
          {withdrawals.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Payout ID</th>
                    <th className="p-3.5">Seller Name</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Mobile / UPI Destination</th>
                    <th className="p-3.5">Requested At &amp; SLA</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">UTR / Ref</th>
                    <th className="p-3.5 text-right">Fulfillment Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawals
                    .filter((w) => {
                      const matchesSearch =
                        w.sellerName.toLowerCase().includes(withdrawalSearch.toLowerCase()) ||
                        w.upiId.toLowerCase().includes(withdrawalSearch.toLowerCase()) ||
                        w.id.toLowerCase().includes(withdrawalSearch.toLowerCase()) ||
                        (w.utrNumber && w.utrNumber.toLowerCase().includes(withdrawalSearch.toLowerCase()));
                      const matchesStatus =
                        withdrawalFilterStatus === 'all' || w.status === withdrawalFilterStatus;
                      return matchesSearch && matchesStatus;
                    })
                    .map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">#{w.id}</span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                              {w.sellerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{w.sellerName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">ID: {w.sellerId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-black text-sm text-emerald-700">
                          ₹{w.amount}
                        </td>
                        <td className="p-3.5">
                          <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                            <Smartphone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span className="font-mono font-semibold text-slate-800 text-xs">{w.upiId}</span>
                            <button
                              onClick={() => handleCopyText(w.upiId, 'Mobile / UPI Destination')}
                              className="p-1 hover:bg-slate-200 text-slate-500 rounded transition ml-1"
                              title="Copy Destination"
                            >
                              {copiedUpi === w.upiId ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-600">
                          <div className="font-medium">
                            {new Date(w.requestedAt).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          {w.status === 'processing' && (
                            <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1 mt-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              <span>Within 3h SLA window</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {w.status === 'completed' && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full uppercase">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Completed</span>
                            </span>
                          )}
                          {w.status === 'processing' && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-full uppercase">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Processing (3h)</span>
                            </span>
                          )}
                          {w.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-rose-100 text-rose-800 font-bold px-2.5 py-1 rounded-full uppercase">
                              <XCircle className="w-3 h-3" />
                              <span>Rejected &amp; Refunded</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {w.utrNumber ? (
                            <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {w.utrNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          {w.status === 'processing' && (
                            <>
                              <button
                                onClick={() => {
                                  setFulfillModalTarget(w);
                                  setFulfillUtrInput(`UPI-TXN-${Date.now().toString().slice(-8)}`);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1 shadow-xs"
                                title="Send payout and mark completed"
                              >
                                <Check className="w-3 h-3" />
                                <span>Fulfill Payout</span>
                              </button>

                              <button
                                onClick={() => handleRejectWithdrawal(w)}
                                className="px-2 py-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-xl text-xs font-bold transition inline-flex items-center gap-1"
                                title="Reject and refund wallet"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setDeleteWithdrawalTarget(w)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-500 rounded-xl text-xs font-bold transition inline-flex items-center gap-1"
                            title="Delete withdrawal record"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl space-y-2">
              <Wallet className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700 text-sm">No withdrawal requests submitted yet.</p>
              <p className="text-slate-500">When verified senior note sellers request payouts, their requests will appear here for 3-hour disbursal.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Revenue & Financials */}
      {activeTab === 'revenue' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">NoteBridge Financial Reconciliation</h3>
              <p className="text-xs text-slate-500">
                Official UPI Receiver: <strong>RAJ SAMBHAJI BHOSALE</strong> (8591587848@ybl)
              </p>
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
              80/20 Commission Standard
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-purple-900 block">Gross Merchandise Value (GMV)</span>
              <span className="text-2xl font-black text-purple-950">₹{totalGMV}</span>
              <span className="text-[10px] text-purple-700">Processed across all colleges</span>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-blue-900 block">Platform Retained (20%)</span>
              <span className="text-2xl font-black text-blue-950">₹{platformRevenue}</span>
              <span className="text-[10px] text-blue-700">Dedicated for platform hosting & security</span>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-emerald-900 block">Senior Seller Earnings (80%)</span>
              <span className="text-2xl font-black text-emerald-950">₹{seniorPayouts}</span>
              <span className="text-[10px] text-emerald-700">Payable to note authors</span>
            </div>
          </div>

          {/* Senior Seller Disbursal Overview Card */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-sm text-slate-900">Senior Seller Disbursals &amp; UPI Ledger</h4>
              </div>
              <p className="text-xs text-slate-500">
                {withdrawals.length} total withdrawal claims ({processingWithdrawalsCount} awaiting 3h fulfillment, ₹{totalDisbursedAmount} disbursed).
              </p>
            </div>
            
            <button
              onClick={() => setActiveTab('withdrawals')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Go to Withdrawal Requests Tab</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 7: Copyright Reports */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Copyright & Content Reports</h3>
            <span className="text-xs text-slate-500">{reports.length} total reports</span>
          </div>

          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div key={rep.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-900">
                    <span className="font-mono">Report #{rep.id} - Note ID: {rep.noteId}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-rose-700 capitalize bg-rose-100 px-2 py-0.5 rounded-full text-[10px]">{rep.reason}</span>
                      <button
                        onClick={() => setDeleteReportTarget(rep)}
                        className="px-2.5 py-1 bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition shadow-2xs"
                        title="Dismiss & Delete Report"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Dismiss & Delete</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-600">{rep.details}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No copyright reports filed.</div>
          )}
        </div>
      )}

      {/* Tab 8: Security & Audit Logs */}
      {activeTab === 'logs' && (
        <AdminSecurityLogs onRefresh={handleRefreshOrders} />
      )}

      {/* Tab 9: Official PhonePe QR & UPI Configuration */}
      {activeTab === 'qr-settings' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-[11px] font-bold rounded-full">
                  Official Merchant Banking Setup
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>NPCI Unified Payments Interface</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-1">
                PhonePe QR Code &amp; UPI Receiver Settings
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure your real registered UPI ID (VPA), merchant name, and upload your official PhonePe Standee photo to receive student payments directly.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const updated = savePhonePeConfig({
                    upiId: '8591587848@ybl',
                    receiverName: 'RAJ SAMBHAJI BHOSALE',
                    phonePeNumber: '+91 85915 87848',
                    customQrImageUrl: null,
                  });
                  setQrConfig(updated);
                  setEditUpiId('8591587848@ybl');
                  setEditReceiverName('RAJ SAMBHAJI BHOSALE');
                  setEditPhone('+91 85915 87848');
                  setCustomQrImage(null);
                  setActionSuccess('Reset to default PhonePe parameters (8591587848@ybl).');
                  setTimeout(() => setActionSuccess(''), 3000);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>
            </div>
          </div>

          {/* Troubleshooting Explanation Box */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Important: Fixing &quot;Couldn&apos;t verify UPI ID&quot; on Google Pay / PhonePe</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              When students scan the QR code with Google Pay, PhonePe, or Paytm, the banking app contacts NPCI to verify that the UPI VPA is actively registered. If your UPI ID is linked with a different handle (e.g. <code>8591587848@ybl</code>, <code>8591587848@oksbi</code>, or <code>8591587848@paytm</code>), enter your exact active UPI ID below or upload your official PhonePe QR photo from your phone.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Configuration Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editUpiId.trim()) return;
                const updated = savePhonePeConfig({
                  upiId: editUpiId.trim().toLowerCase(),
                  receiverName: editReceiverName.trim() || 'RAJ SAMBHAJI BHOSALE',
                  phonePeNumber: editPhone.trim(),
                  customQrImageUrl: customQrImage,
                });
                setQrConfig(updated);
                setActionSuccess('Official PhonePe UPI settings saved successfully! All purchase screens updated.');
                setTimeout(() => setActionSuccess(''), 4000);
              }}
              className="lg:col-span-7 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Active UPI ID / Virtual Payment Address (VPA) *
                </label>
                <input
                  type="text"
                  required
                  value={editUpiId}
                  onChange={(e) => setEditUpiId(e.target.value)}
                  placeholder="e.g. 8591587848@ybl or 8591587848@oksbi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  This is the exact handle where student payments are credited.
                </span>
              </div>

              {/* Popular UPI Handle Selector Chips */}
              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  Click to use popular Bank Handle suffix:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {POPULAR_UPI_HANDLES.map((item) => (
                    <button
                      key={item.handle}
                      type="button"
                      onClick={() => {
                        const prefix = editUpiId.includes('@') ? editUpiId.split('@')[0] : editUpiId;
                        setEditUpiId(`${prefix || '8591587848'}${item.handle}`);
                      }}
                      className="p-2 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl text-left transition text-xs"
                    >
                      <span className="font-mono font-bold text-purple-900 block">{item.handle}</span>
                      <span className="text-[9px] text-slate-500 block truncate">{item.app}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Payee Official Legal Name
                  </label>
                  <input
                    type="text"
                    value={editReceiverName}
                    onChange={(e) => setEditReceiverName(e.target.value)}
                    placeholder="e.g. RAJ SAMBHAJI BHOSALE"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    PhonePe Linked Mobile Number
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="e.g. +91 85915 87848"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              {/* Upload Standee Photo Section */}
              <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-purple-950">
                    Upload Your Official PhonePe QR Photo (Recommended)
                  </label>
                  {customQrImage && (
                    <button
                      type="button"
                      onClick={() => setCustomQrImage(null)}
                      className="text-[11px] text-rose-600 hover:underline font-bold"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-purple-800">
                  You can upload an actual photo/screenshot of your PhonePe standee or GPay QR code. When uploaded, this photo will be shown directly to students during checkout.
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => qrFileInputRef.current?.click()}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{customQrImage ? 'Replace Standee Photo' : 'Upload QR Image from Phone'}</span>
                  </button>
                  <input
                    ref={qrFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onload = () => {
                          setCustomQrImage(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  {customQrImage && (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Custom Photo Active</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-[#5f259f] to-[#421570] hover:from-[#521f8a] hover:to-[#35105b] text-white font-bold rounded-2xl shadow-lg shadow-purple-900/20 text-xs sm:text-sm flex items-center justify-center gap-2 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Save &amp; Apply Official PhonePe QR Settings</span>
                </button>
              </div>
            </form>

            {/* Right: Live Standee Preview */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full text-center mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Live Checkout Preview
                </span>
              </div>
              <PhonePeQrCard
                amount={39}
                receiverName={editReceiverName}
                noteTitle="Sample Live Note"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Fulfill Senior Payout Modal */}
      {fulfillModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-emerald-700">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 font-heading">
                  Disburse Payout to Senior Seller
                </h3>
                <p className="text-xs text-slate-500">
                  Request #{fulfillModalTarget.id} • 3-Hour Guaranteed SLA Window
                </p>
              </div>
            </div>

            {/* Payout Details Card */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
                <span className="text-xs text-emerald-800 font-semibold">Author Name:</span>
                <span className="text-xs font-bold text-slate-900">{fulfillModalTarget.sellerName}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
                <span className="text-xs text-emerald-800 font-semibold">Payout Amount (80% Earnings):</span>
                <span className="text-xl font-black text-emerald-950 font-heading">₹{fulfillModalTarget.amount}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-emerald-800 font-semibold">Mobile / UPI Destination:</span>
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                  <span className="font-mono text-xs font-bold text-slate-900">{fulfillModalTarget.upiId}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(fulfillModalTarget.upiId, 'Mobile / UPI Destination')}
                    className="p-1 hover:bg-slate-100 text-slate-500 rounded transition"
                    title="Copy UPI / Mobile"
                  >
                    {copiedUpi === fulfillModalTarget.upiId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#5f259f]" />
                <span>Disbursal Steps (PhonePe / GPay / Paytm / UPI):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                <li>Copy the author's mobile number or UPI ID: <strong>{fulfillModalTarget.upiId}</strong></li>
                <li>Transfer <strong>₹{fulfillModalTarget.amount}</strong> from your PhonePe/banking app.</li>
                <li>Enter the Bank UTR / Transaction ID below and click <strong>Confirm Disbursal</strong>.</li>
              </ol>
            </div>

            {/* UTR Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Bank UTR / UPI Reference Number (Auto-Generated or Custom)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={fulfillUtrInput}
                  onChange={(e) => setFulfillUtrInput(e.target.value)}
                  placeholder="e.g. 423589123456 or UPI-TXN-..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setFulfillUtrInput(`UPI-TXN-${Date.now().toString().slice(-8)}`)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl whitespace-nowrap transition"
                >
                  Generate
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setFulfillModalTarget(null);
                  setFulfillUtrInput('');
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmFulfillWithdrawal}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Disbursal &amp; Mark Paid</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Delete Note Confirmation Modal */}
      {deleteNoteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Delete Academic Note?
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">
                  ID: #{deleteNoteTarget.id} • {deleteNoteTarget.subject}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">{deleteNoteTarget.title}</p>
              <p className="text-slate-600">Author: {deleteNoteTarget.sellerName} | Price: ₹{deleteNoteTarget.price}</p>
              <p className="text-[11px] text-red-600 font-semibold pt-1">
                ⚠️ This will permanently delete this note, remove its PDF files from vault storage, and remove it from the student catalog.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteNoteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteNote}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete Note</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete User Confirmation Modal */}
      {deleteUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Delete User Account?
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">
                  {deleteUserTarget.email}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">{deleteUserTarget.name}</p>
              <p className="text-slate-600">Role: <span className="uppercase font-semibold">{deleteUserTarget.role}</span> | Wallet Balance: ₹{deleteUserTarget.walletBalance || 0}</p>
              <p className="text-[11px] text-red-600 font-semibold pt-1">
                ⚠️ Deleting this user account will revoke login access permanently.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteUserTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Withdrawal Confirmation Modal */}
      {deleteWithdrawalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Delete Withdrawal Request?
                </h3>
                <p className="text-xs text-slate-500">
                  ID: #{deleteWithdrawalTarget.id} • ₹{deleteWithdrawalTarget.amount}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Are you sure you want to remove withdrawal record <strong>#{deleteWithdrawalTarget.id}</strong> requested by <strong>{deleteWithdrawalTarget.sellerName}</strong> for ₹{deleteWithdrawalTarget.amount}?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteWithdrawalTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteWithdrawal}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Content Report Confirmation Modal */}
      {deleteReportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Dismiss & Delete Report?
                </h3>
                <p className="text-xs text-slate-500">
                  Report #{deleteReportTarget.id} • Note ID: {deleteReportTarget.noteId}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              This will permanently dismiss and delete this copyright/content issue report from the admin dashboard.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteReportTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteReport}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Dismiss & Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
