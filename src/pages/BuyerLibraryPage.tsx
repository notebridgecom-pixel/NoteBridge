import React, { useState, useEffect } from 'react';
import { User, NoteItem, PurchaseOrder } from '../types';
import { WatermarkBadge } from '../components/WatermarkBadge';
import { PaymentScreenshotModal } from '../components/PaymentScreenshotModal';
import { submitSellerApplication, getStoredOrders, getStoredNotes, saveOrders, setCurrentUser } from '../utils/storage';
import { downloadWatermarkedPdf } from '../utils/pdfGenerator';
import { INITIAL_USERS } from '../data/mockData';
import { 
  ShoppingBag, 
  Download, 
  Star, 
  Eye, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  BookOpen,
  Clock,
  AlertTriangle,
  Lock,
  Search,
  Bookmark,
  Filter,
  CheckCircle,
  StickyNote,
  Save,
  Trash2,
  Share2,
  FolderCheck,
  Layers,
  Award,
  ChevronDown,
  ChevronUp,
  Bot,
  RefreshCw,
  UploadCloud,
  Check,
  AlertCircle,
  ExternalLink,
  GraduationCap,
  IndianRupee,
  UserCheck,
  ArrowRight,
  ShieldAlert,
  Zap,
  Camera
} from 'lucide-react';

interface BuyerLibraryPageProps {
  currentUser: User | null;
  notes: NoteItem[];
  orders: PurchaseOrder[];
  onOpenPreview: (note: NoteItem) => void;
  onOpenRate: (note: NoteItem) => void;
  onBrowseNotes: () => void;
  onRefreshOrders?: () => void;
  onOpenUpload?: () => void;
  onOpenProfilePhoto?: () => void;
  onNavigate?: (page: any) => void;
  onUpdateUser?: (user: User) => void;
}

export const BuyerLibraryPage: React.FC<BuyerLibraryPageProps> = ({
  currentUser,
  notes,
  orders,
  onOpenPreview,
  onOpenRate,
  onBrowseNotes,
  onRefreshOrders,
  onOpenUpload,
  onOpenProfilePhoto,
  onNavigate,
  onUpdateUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'authored' | 'payments' | 'starred'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const [isApplyingSeller, setIsApplyingSeller] = useState(false);
  const [sellerApplyNotice, setSellerApplyNotice] = useState('');
  const [sellerIdPhotoUrl, setSellerIdPhotoUrl] = useState('');
  const [previewScreenshotOrder, setPreviewScreenshotOrder] = useState<PurchaseOrder | null>(null);

  // Local persistence for student study preferences
  const effectiveUserId = currentUser?.id || 'guest';
  const [starredNoteIds, setStarredNoteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`notebridge_starred_${effectiveUserId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [completedNoteIds, setCompletedNoteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`notebridge_completed_${effectiveUserId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [personalNotes, setPersonalNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(`notebridge_study_notes_${effectiveUserId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [activeNoteEditorId, setActiveNoteEditorId] = useState<string | null>(null);
  const [currentEditNoteText, setCurrentEditNoteText] = useState('');
  const [expandedSynopsisIds, setExpandedSynopsisIds] = useState<string[]>([]);

  const toggleSynopsis = (noteId: string) => {
    setExpandedSynopsisIds((prev) =>
      prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId]
    );
  };

  useEffect(() => {
    try {
      localStorage.setItem(`notebridge_starred_${effectiveUserId}`, JSON.stringify(starredNoteIds));
    } catch (e) {
      console.error(e);
    }
  }, [starredNoteIds, effectiveUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(`notebridge_completed_${effectiveUserId}`, JSON.stringify(completedNoteIds));
    } catch (e) {
      console.error(e);
    }
  }, [completedNoteIds, effectiveUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(`notebridge_study_notes_${effectiveUserId}`, JSON.stringify(personalNotes));
    } catch (e) {
      console.error(e);
    }
  }, [personalNotes, effectiveUserId]);

  const toggleStar = (noteId: string) => {
    setStarredNoteIds((prev) => 
      prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId]
    );
  };

  const toggleCompleted = (noteId: string) => {
    setCompletedNoteIds((prev) => 
      prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId]
    );
  };

  const handleSavePersonalNote = (noteId: string) => {
    setPersonalNotes((prev) => ({
      ...prev,
      [noteId]: currentEditNoteText.trim(),
    }));
    setActiveNoteEditorId(null);
  };

  const handleRefreshStatus = () => {
    setIsRefreshingOrders(true);
    if (onRefreshOrders) {
      onRefreshOrders();
    }
    setTimeout(() => {
      setIsRefreshingOrders(false);
    }, 600);
  };

  const handleApplySellerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const updated = submitSellerApplication(currentUser.id, sellerIdPhotoUrl.trim() || undefined);
    if (updated) {
      if (onUpdateUser) onUpdateUser(updated);
      setSellerApplyNotice('🎉 Application Approved! You are now a Verified Senior Seller with 80% payout rights.');
      setTimeout(() => {
        setIsApplyingSeller(false);
        setSellerApplyNotice('');
      }, 2500);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            Sign In to Access Your Library
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            View your purchased study notes, read revision materials, check live UPI order statuses, and download clean, watermark-free PDF files.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => onNavigate ? onNavigate('auth') : (window.location.hash = '#auth')}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2"
          >
            <span>Sign In / Create Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onBrowseNotes}
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>Browse Notes Catalog</span>
          </button>
        </div>
      </div>
    );
  }

  // Determine active identity for query matching
  const activeUser = currentUser;

  // 1. Find all orders belonging to this user (comprehensive match with deduplication)
  const rawOrders = orders.filter((o) => {
    if (!currentUser) return false;
    const matchId = o.buyerId && o.buyerId === currentUser.id;
    const matchEmail = o.buyerEmail && currentUser.email && o.buyerEmail.trim().toLowerCase() === currentUser.email.trim().toLowerCase();
    const matchPhone = o.buyerPhone && currentUser.phone && o.buyerPhone.trim() === currentUser.phone.trim();
    return matchId || matchEmail || matchPhone;
  });

  // Deduplicate orders by ID or Order Number
  const seenOrderKeys = new Set<string>();
  const myOrders = rawOrders.filter((o) => {
    const key = o.id || o.orderNumber;
    if (!key || seenOrderKeys.has(key)) return false;
    seenOrderKeys.add(key);
    return true;
  });

  // 2. Find all notes authored/uploaded by this user (deduplicated by note.id)
  const seenAuthoredIds = new Set<string>();
  const myAuthoredNotes = currentUser
    ? notes.filter((n) => {
        if (!n || !n.id || seenAuthoredIds.has(n.id)) return false;
        const matchId = n.sellerId && n.sellerId === currentUser.id;
        const matchName = n.sellerName && currentUser.name && n.sellerName.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
        const matchEmail = n.sellerId && currentUser.email && n.sellerId.trim().toLowerCase() === currentUser.email.trim().toLowerCase();
        const isMatch = matchId || matchName || matchEmail;
        if (isMatch) {
          seenAuthoredIds.add(n.id);
          return true;
        }
        return false;
      })
    : [];

  // 3. Connect notes with orders
  const purchasedItems = myOrders.map((order) => {
    const matchedNote = notes.find((n) => n.id === order.noteId);
    return {
      order,
      isAuthored: false,
      note: matchedNote || ({
        id: order.noteId,
        title: order.noteTitle,
        subject: order.subject,
        university: order.university,
        price: order.amount,
        sellerName: order.sellerName,
        sellerCollege: 'Verified College Senior',
        totalPages: 40,
        unitsCovered: 'Unit 1 to 5',
        semester: 3,
        rating: 5,
        reviewsCount: 1,
        status: 'approved',
      } as NoteItem),
    };
  });

  // Authored notes as library items (automatically unlocked for creator)
  const authoredItems = myAuthoredNotes
    .filter((note) => !purchasedItems.some((pi) => pi.note.id === note.id))
    .map((note) => {
      const mockOrder: PurchaseOrder = {
        id: `ord-authored-${note.id}`,
        orderNumber: `AUTH-${note.id.slice(0, 6)}`,
        noteId: note.id,
        noteTitle: note.title,
        subject: note.subject,
        university: note.university,
        sellerId: activeUser.id,
        sellerName: activeUser.name,
        buyerId: activeUser.id,
        buyerName: activeUser.name,
        buyerEmail: activeUser.email,
        buyerPhone: activeUser.phone,
        amount: note.price,
        sellerShare: Math.round(note.price * 0.8),
        platformShare: Math.round(note.price * 0.2),
        paymentMethod: 'upi_id',
        upiTransactionId: 'AUTHOR_ACCESS',
        status: 'completed',
        purchasedAt: note.createdAt || new Date().toISOString(),
        watermarkText: `Author & Creator Copy - ${activeUser.name} (${activeUser.college || 'College Senior'})`,
      };
      return {
        order: mockOrder,
        isAuthored: true,
        note,
      };
    });

  // Combined library pool
  const allLibraryItems = [...purchasedItems, ...authoredItems];

  // Unique subjects in buyer library
  const availableSubjects = Array.from(new Set(allLibraryItems.map((item) => item.note.subject)));

  // Filtered items based on active tab and search
  const filteredItems = allLibraryItems.filter(({ order, note, isAuthored }) => {
    const isUnlocked = order.status === 'verified' || order.status === 'completed';
    const isPending = order.status === 'pending_verification';
    const isStarred = starredNoteIds.includes(note.id);

    // Tab filter
    if (activeTab === 'unlocked' && !isUnlocked) return false;
    if (activeTab === 'authored' && !isAuthored) return false;
    if (activeTab === 'starred' && !isStarred) return false;

    // Subject filter
    if (selectedSubject !== 'all' && note.subject !== selectedSubject) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = note.title.toLowerCase().includes(q);
      const matchSubject = note.subject.toLowerCase().includes(q);
      const matchAuthor = (note.sellerName || '').toLowerCase().includes(q);
      const matchOrder = (order.orderNumber || '').toLowerCase().includes(q);
      const matchUtr = (order.upiTransactionId || '').toLowerCase().includes(q);
      if (!matchTitle && !matchSubject && !matchAuthor && !matchOrder && !matchUtr) return false;
    }

    return true;
  });

  // Summary Metrics
  const unlockedCount = allLibraryItems.filter((i) => i.order.status === 'verified' || i.order.status === 'completed').length;
  const pendingOrdersList = myOrders.filter((o) => o.status === 'pending_verification');
  const pendingCount = pendingOrdersList.length;
  const totalPagesSum = allLibraryItems
    .filter((i) => i.order.status === 'verified' || i.order.status === 'completed')
    .reduce((acc, curr) => acc + (curr.note.totalPages || 0), 0);
  const completedCount = completedNoteIds.filter((id) => 
    allLibraryItems.some((i) => i.note.id === id && (i.order.status === 'verified' || i.order.status === 'completed'))
  ).length;

  const handleDownloadAgain = async (order: PurchaseOrder, note: NoteItem) => {
    if (order.status === 'pending_verification') {
      alert('This order is awaiting admin verification for PhonePe transaction. Once verified, the download unlocks.');
      return;
    }
    try {
      await downloadWatermarkedPdf(order, note);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Digital Exam Vault & Library
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold">
              {allLibraryItems.length} Notes Available
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-heading">
            My Note Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access your purchased study guides, authored web notes, revision summaries, payment verification status, and clean PDF downloads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRefreshStatus}
            disabled={isRefreshingOrders}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5"
            title="Refresh payment & approval statuses"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshingOrders ? 'animate-spin' : ''}`} />
            <span>{isRefreshingOrders ? 'Refreshing...' : 'Refresh Status'}</span>
          </button>

          {currentUser.role === 'seller' && onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>+ Upload Notes</span>
            </button>
          )}

          <button
            id="library-browse-more-btn"
            onClick={onBrowseNotes}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse Catalog</span>
          </button>
        </div>
      </div>

      {/* 1. SELLER APPLICATION & APPROVAL STATUS BANNER */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-[2rem] p-6 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="relative group flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 overflow-hidden border-2 border-slate-700 shadow-md text-white flex items-center justify-center font-bold text-xl">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${
                    currentUser.isVerifiedSenior 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : currentUser.role === 'seller'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <GraduationCap className="w-6 h-6" />}
                  </div>
                )}
              </div>
              {onOpenProfilePhoto && (
                <button
                  type="button"
                  onClick={onOpenProfilePhoto}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center justify-center transition"
                  title="Upload / Change Account Photo"
                >
                  <Camera className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Application For Selling Approval Status
                </span>
                {currentUser.isVerifiedSenior ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    APPROVED & VERIFIED SENIOR
                  </span>
                ) : currentUser.role === 'seller' ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-extrabold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    UNDER MODERATOR REVIEW
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">
                    STUDENT BUYER ACCOUNT
                  </span>
                )}
                {onOpenProfilePhoto && (
                  <button
                    type="button"
                    onClick={onOpenProfilePhoto}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold hover:underline"
                  >
                    <Camera className="w-3 h-3" />
                    Upload / Change Photo
                  </button>
                )}
              </div>

              <h3 className="text-lg font-bold text-white">
                {currentUser.isVerifiedSenior
                  ? `Verified Senior Scholar — ${currentUser.name} (${currentUser.college || 'Engineering & Polytechnic'})`
                  : currentUser.role === 'seller'
                  ? 'Senior Seller Application in Review'
                  : `Student Account — ${currentUser.name}`}
              </h3>

              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {currentUser.isVerifiedSenior
                  ? 'Your seller profile is fully approved by the Academic Council. You earn 80% direct royalty on every syllabus note download with automated UPI payouts.'
                  : currentUser.role === 'seller'
                  ? 'Your College ID verification has been submitted to the moderation desk. You can upload notes now; listings will display the verified badge upon review.'
                  : 'Welcome to your student library! You can also apply for Verified Senior Seller status to upload original exam revision sheets and syllabus summaries to earn 80% per download.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {currentUser.isVerifiedSenior ? (
              <button
                onClick={() => onNavigate && onNavigate('seller-dashboard')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-2"
              >
                <span>Go to Seller Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setIsApplyingSeller(!isApplyingSeller)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>{currentUser.role === 'seller' ? 'Update ID Verification' : 'Apply for Seller Approval'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Expandable Seller Application Form */}
        {isApplyingSeller && (
          <form onSubmit={handleApplySellerSubmit} className="mt-6 pt-6 border-t border-slate-800 bg-slate-950/60 p-5 rounded-2xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wide">
                Submit Academic Verification & Seller Application
              </h4>
              <button
                type="button"
                onClick={() => setIsApplyingSeller(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Cancel
              </button>
            </div>

            {sellerApplyNotice && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-xl text-xs flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{sellerApplyNotice}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  disabled
                  value={currentUser.name}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">College / Polytechnic</label>
                <input
                  type="text"
                  disabled
                  value={currentUser.college || 'Engineering Institute'}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Degree & Branch</label>
                <input
                  type="text"
                  disabled
                  value={`${currentUser.degree || 'BE/B.Tech'} - ${currentUser.branch || 'Computer Engineering'}`}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">College ID Card Photo URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://... (or leave blank to use profile ID)"
                  value={sellerIdPhotoUrl}
                  onChange={(e) => setSellerIdPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Submit & Activate Senior Seller Status</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. PAYMENT APPROVAL STATUS TRACKER (PENDING VERIFICATION ORDERS) */}
      {pendingCount > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 animate-pulse">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Payment Approval in Progress
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-800">
                    {pendingCount} Order{pendingCount > 1 ? 's' : ''} Awaiting Moderator Verification
                  </span>
                </div>
                <h4 className="text-sm font-bold text-amber-950 mt-0.5">
                  Your PhonePe / UPI payment is being verified by Admin Moderator (Raj Bhosale)
                </h4>
              </div>
            </div>

            <button
              onClick={handleRefreshStatus}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingOrders ? 'animate-spin' : ''}`} />
              <span>Check Payment Status</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingOrdersList.map((order) => (
              <div key={order.id} className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {order.orderNumber}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                      {order.noteTitle}
                    </h5>
                    <p className="text-[11px] text-slate-500">{order.subject} • ₹{order.amount}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Pending Approval
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] space-y-1 font-mono text-slate-600">
                  <div className="flex justify-between">
                    <span>UTR / UPI Ref:</span>
                    <strong className="text-slate-900">{order.upiTransactionId || 'Under Verification'}</strong>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>Submitted:</span>
                    <span>{new Date(order.purchasedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(order.purchasedAt).toLocaleDateString()})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-amber-800">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>Manual UTR verification in progress. Access unlocks immediately upon approval.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics & Study Progress Tracker Bar */}
      {allLibraryItems.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <FolderCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Unlocked Web Notes</p>
              <p className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>Unlimited</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Lifetime</span>
              </p>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Study Pages & Units</p>
              <p className="text-lg font-extrabold text-slate-900">{totalPagesSum} Pages</p>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Authored by You</p>
              <p className="text-lg font-extrabold text-slate-900">{myAuthoredNotes.length} Notes</p>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Pending Verifications</p>
              <p className="text-lg font-extrabold text-slate-900">{pendingCount} Orders</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search your web notes by subject, title, author, or order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            />
          </div>

          {/* Subject Filter Pill Select */}
          {availableSubjects.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">All Subjects ({availableSubjects.length})</option>
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>All Web Notes ({allLibraryItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('unlocked')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'unlocked'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Purchased & Unlocked ({purchasedItems.filter(p => p.order.status === 'completed' || p.order.status === 'verified').length})</span>
          </button>

          {myAuthoredNotes.length > 0 && (
            <button
              onClick={() => setActiveTab('authored')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'authored'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>My Uploaded Notes ({myAuthoredNotes.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
            <span>Payment Approval Tracking ({myOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('starred')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'starred'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>Starred ({starredNoteIds.length})</span>
          </button>
        </div>
      </div>

      {/* TAB: PAYMENT APPROVAL TRACKING VIEW */}
      {activeTab === 'payments' ? (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Payment & Transaction Approval Ledger</h3>
              <p className="text-xs text-slate-500">
                Track verification status for all your PhonePe & UPI payments with transaction IDs.
              </p>
            </div>
            <button
              onClick={handleRefreshStatus}
              className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-xs transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingOrders ? 'animate-spin' : ''}`} />
              <span>Re-Sync Status</span>
            </button>
          </div>

          {myOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
              <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No payment records found</h4>
              <p className="text-xs text-slate-500">You have not submitted any UPI orders yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders.map((order) => {
                const isApproved = order.status === 'completed' || order.status === 'verified';
                const isPending = order.status === 'pending_verification';
                const isRejected = order.status === 'rejected';
                const matchedNote = notes.find((n) => n.id === order.noteId);

                return (
                  <div key={order.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-blue-300 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
                            {order.orderNumber}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(order.purchasedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">
                          {order.noteTitle}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Subject: <strong>{order.subject}</strong> • University: {order.university}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-slate-400 font-medium">Amount Paid</p>
                          <p className="text-lg font-black text-slate-900">₹{order.amount}</p>
                        </div>

                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isPending
                            ? 'bg-amber-100 text-amber-900 animate-pulse'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isApproved ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Payment Approved</span>
                            </>
                          ) : isPending ? (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Pending Verification</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Rejected</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Step Progress Tracker */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                          ✓
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">1. Payment Sent</p>
                          <p className="text-[10px] text-slate-500 font-mono">UTR: {order.upiTransactionId || 'Submitted'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          isApproved ? 'bg-emerald-100 text-emerald-700' : isPending ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isApproved ? '✓' : '2'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">2. Moderator Review</p>
                          <p className="text-[10px] text-slate-500">Raj Bhosale (Admin)</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          isApproved ? 'bg-emerald-500 text-white' : isRejected ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isApproved ? '✓' : isRejected ? '✕' : '3'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">3. Web Access</p>
                          <p className="text-[10px] text-slate-500">
                            {isApproved ? 'Unlocked & Download Ready' : isRejected ? 'Verification Failed' : 'Pending'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {isRejected && order.rejectionReason && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span><strong>Rejection Reason:</strong> {order.rejectionReason}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setPreviewScreenshotOrder(order)}
                        className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-purple-200"
                      >
                        <Eye className="w-3.5 h-3.5 text-purple-700" />
                        <span>{order.paymentScreenshotUrl ? 'View Payment Screenshot' : 'View Payment Proof'}</span>
                      </button>

                      {isApproved && matchedNote && (
                        <button
                          onClick={() => onOpenPreview(matchedNote)}
                          className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open Unlocked Web Notes</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : filteredItems.length > 0 ? (
        /* MAIN NOTE CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(({ order, note, isAuthored }) => {
            const isCompleted = completedNoteIds.includes(note.id);
            const isStarred = starredNoteIds.includes(note.id);
            const isPending = order.status === 'pending_verification';
            const isRejected = order.status === 'rejected';
            const userNoteText = personalNotes[note.id] || '';
            const isEditingPersonalNote = activeNoteEditorId === note.id;
            const isSynopsisExpanded = expandedSynopsisIds.includes(note.id);

            return (
              <div
                key={`${order.id}-${note.id}`}
                className={`bg-white rounded-3xl border transition-all duration-200 flex flex-col overflow-hidden shadow-xs hover:shadow-md ${
                  isPending 
                    ? 'border-amber-200/80 bg-amber-50/10' 
                    : isRejected
                    ? 'border-rose-200 bg-rose-50/20'
                    : isAuthored
                    ? 'border-purple-200 hover:border-purple-300'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                {/* Note Top Bar */}
                <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700">
                        {note.subject}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        Sem {note.semester}
                      </span>
                      {isAuthored ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5" />
                          Author Copy
                        </span>
                      ) : isPending ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          Pending Review
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Verified
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-base leading-snug line-clamp-2 mt-1">
                      {note.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleStar(note.id)}
                      className={`p-2 rounded-xl transition ${
                        isStarred
                          ? 'text-amber-500 bg-amber-50'
                          : 'text-slate-400 hover:bg-slate-100'
                      }`}
                      title={isStarred ? 'Remove Star' : 'Star this note'}
                    >
                      <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 flex-1 space-y-4">
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">University:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[180px]">{note.university}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Syllabus Coverage:</span>
                      <span className="font-semibold text-slate-800">{note.unitsCovered}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Author / Senior:</span>
                      <span className="font-semibold text-blue-600">{note.sellerName}</span>
                    </div>
                  </div>

                  {/* AI Synopsis Quick Read */}
                  {note.aiSynopsis && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                          <Bot className="w-3.5 h-3.5 text-blue-600" />
                          <span>Gemini AI Synopsis</span>
                        </div>
                        <button
                          onClick={() => toggleSynopsis(note.id)}
                          className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                        >
                          <span>{isSynopsisExpanded ? 'Hide' : 'Quick Read'}</span>
                          {isSynopsisExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                      {isSynopsisExpanded && (
                        <p className="text-slate-600 text-[11px] leading-relaxed pt-1 border-t border-slate-200/60 whitespace-pre-line">
                          {note.aiSynopsis}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Personal Study Scratchpad */}
                  <div className="border border-slate-100 rounded-2xl p-3 bg-white space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                        <span>My Study Scratchpad</span>
                      </div>
                      {!isEditingPersonalNote && (
                        <button
                          onClick={() => {
                            setActiveNoteEditorId(note.id);
                            setCurrentEditNoteText(userNoteText);
                          }}
                          className="text-[10px] text-blue-600 font-bold hover:underline"
                        >
                          {userNoteText ? 'Edit Note' : '+ Write Note'}
                        </button>
                      )}
                    </div>

                    {isEditingPersonalNote ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          placeholder="Type formulas, exam hints, unit deadlines..."
                          value={currentEditNoteText}
                          onChange={(e) => setCurrentEditNoteText(e.target.value)}
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setActiveNoteEditorId(null)}
                            className="px-2.5 py-1 text-[10px] text-slate-500 font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSavePersonalNote(note.id)}
                            className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    ) : userNoteText ? (
                      <p className="text-[11px] text-slate-600 italic bg-amber-50/50 p-2 rounded-xl border border-amber-100/60 line-clamp-2">
                        &quot;{userNoteText}&quot;
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400">
                        No private revision notes added yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions Bottom Footer */}
                <div className="p-5 bg-slate-50/70 border-t border-slate-100 space-y-3 mt-auto">
                  {isPending ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-amber-100/70 border border-amber-200 rounded-2xl text-[11px] text-amber-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>Payment Approval Pending</span>
                        </div>
                        <p className="text-[10px] text-amber-800">
                          UTR: <strong className="font-mono">{order.upiTransactionId || 'Processing'}</strong>
                        </p>
                      </div>
                      <button
                        onClick={handleRefreshStatus}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingOrders ? 'animate-spin' : ''}`} />
                        <span>Check Verification</span>
                      </button>
                    </div>
                  ) : isRejected ? (
                    <div className="text-center py-2 text-xs text-rose-600 font-semibold">
                      Payment could not be verified. Please contact support or re-attempt.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          id={`btn-read-note-${note.id}`}
                          onClick={() => onOpenPreview(note)}
                          className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open Notes</span>
                        </button>

                        <button
                          id={`btn-download-again-${order.id}`}
                          onClick={() => handleDownloadAgain(order, note)}
                          className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl transition flex items-center gap-1 text-xs font-bold"
                          title="Download Clean PDF (No Watermark)"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-600" />
                          <span>PDF</span>
                        </button>
                      </div>

                      <button
                        onClick={() => onOpenPreview(note)}
                        className="w-full py-2 bg-linear-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>AI Exam Summary & Cheat-Sheet</span>
                      </button>
                    </div>
                  )}

                  {/* Rating / Revision Indicator */}
                  <div className="flex items-center justify-between pt-1">
                    {!isPending && !isRejected && !isAuthored ? (
                      <button
                        onClick={() => onOpenRate(note)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                        <span>{order.userRated ? 'Update Rating' : 'Rate this Note'}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        {isAuthored ? 'Author Access' : isPending ? 'Verification in progress' : 'Transaction rejected'}
                      </span>
                    )}

                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                      isPending
                        ? 'bg-amber-100 text-amber-800'
                        : isRejected
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isPending ? <Clock className="w-3 h-3" /> : isRejected ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      {isAuthored ? 'Creator' : `₹${order.amount} (${order.status === 'pending_verification' ? 'Pending' : order.status === 'rejected' ? 'Rejected' : 'Paid'})`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : allLibraryItems.length > 0 ? (
        /* No Match Filter State */
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 p-6 space-y-3 max-w-sm mx-auto shadow-sm">
          <Search className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No matching notes found</h3>
          <p className="text-xs text-slate-500">
            No items matched your search query &quot;{searchQuery}&quot; or filter tabs.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveTab('all');
              setSelectedSubject('all');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Empty State */
        <div className="space-y-6">
          <div className="text-center py-12 bg-white rounded-[2.5rem] border border-slate-200/80 p-8 space-y-6 max-w-xl mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 font-heading">
                Your Library is Empty
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                You haven&apos;t purchased any study materials yet. Browse university notes handwritten by verified college seniors to add to your library.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                id="empty-lib-browse-btn"
                onClick={onBrowseNotes}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Explore Notes Catalog</span>
              </button>
              {currentUser?.role === 'seller' ? (
                <button
                  onClick={onOpenUpload}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Your Notes</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsApplyingSeller(true)}
                  className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold text-xs transition"
                >
                  Apply to Sell Notes (80% Royalty)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Screenshot & Receipt Modal */}
      {previewScreenshotOrder && (
        <PaymentScreenshotModal
          screenshotUrl={previewScreenshotOrder.paymentScreenshotUrl || null}
          order={previewScreenshotOrder}
          onClose={() => setPreviewScreenshotOrder(null)}
        />
      )}
    </div>
  );
};
