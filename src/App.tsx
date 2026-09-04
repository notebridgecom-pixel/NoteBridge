import React, { useState, useEffect } from 'react';
import { 
  User, 
  NoteItem, 
  PurchaseOrder, 
  WithdrawalRequest, 
  ContentReport, 
  FilterState, 
  UserRole 
} from './types';
import { 
  getStoredNotes, 
  saveNotes, 
  getStoredUsers, 
  getCurrentUser, 
  setCurrentUser, 
  logoutUser,
  getStoredOrders, 
  getStoredWithdrawals, 
  getStoredReports, 
  recordPurchase,
  preloadNoteFiles,
  deleteNote
} from './utils/storage';
import { 
  fetchServerNotes, 
  postServerNote, 
  updateServerNote, 
  deleteServerNote, 
  fetchServerOrders, 
  postServerOrder 
} from './utils/apiSync';

// Components
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { UpiPaymentModal } from './components/UpiPaymentModal';
import { NotePreviewModal } from './components/NotePreviewModal';
import { UploadNoteModal } from './components/UploadNoteModal';
import { RateNoteModal } from './components/RateNoteModal';
import { WithdrawModal } from './components/WithdrawModal';
import { InfoModal, InfoModalType } from './components/InfoModal';
import { ProfilePhotoUploadModal } from './components/ProfilePhotoUploadModal';
import { syncNoteToFirestore, syncOrderToFirestore } from './utils/firebase';

// Pages
import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { NoteDetailPage } from './pages/NoteDetailPage';
import { AuthPage } from './pages/AuthPage';
import { SellerDashboard } from './pages/SellerDashboard';
import { BuyerLibraryPage } from './pages/BuyerLibraryPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AccountPage } from './pages/AccountPage';
import { AiSummarizerPage } from './pages/AiSummarizerPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';

export default function App() {
  // App Core State
  const [currentUser, setCurrentUserState] = useState<User | null>(getCurrentUser());
  const [notes, setNotes] = useState<NoteItem[]>(getStoredNotes());
  const [orders, setOrders] = useState<PurchaseOrder[]>(getStoredOrders());
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(getStoredWithdrawals());
  const [reports, setReports] = useState<ContentReport[]>(getStoredReports());

  // Routing State
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [browseFilters, setBrowseFilters] = useState<Partial<FilterState>>({});
  const [initialVerifyToken, setInitialVerifyToken] = useState<string>('');
  const [initialVerifyEmail, setInitialVerifyEmail] = useState<string>('');

  // Modals
  const [previewNote, setPreviewNote] = useState<NoteItem | null>(null);
  const [paymentNote, setPaymentNote] = useState<NoteItem | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isProfilePhotoModalOpen, setIsProfilePhotoModalOpen] = useState(false);
  const [rateNoteTarget, setRateNoteTarget] = useState<NoteItem | null>(null);
  const [infoModalType, setInfoModalType] = useState<InfoModalType | null>(null);

  // Global Toast Alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync refresh helpers
  const refreshAppData = () => {
    setNotes(getStoredNotes());
    setOrders(getStoredOrders());
    setWithdrawals(getStoredWithdrawals());
    setReports(getStoredReports());
    setCurrentUserState(getCurrentUser());
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUserState(null);
    refreshAppData();
    showToast('🔒 Signed out successfully.');
  };

  const handleDeleteAccount = (_reason?: string) => {
    logoutUser();
    setCurrentUserState(null);
    refreshAppData();
    setCurrentPage('home');
    showToast('🗑️ Your account and personal data have been permanently deleted.');
  };

  useEffect(() => {
    // 0. Detect /verify-email path or token params in URL
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const search = new URLSearchParams(window.location.search);
      const tokenParam = search.get('token');
      const emailParam = search.get('email');
      const pageParam = search.get('page');

      if (path === '/verify-email' || tokenParam || pageParam === 'verify-email') {
        if (tokenParam) setInitialVerifyToken(tokenParam);
        if (emailParam) setInitialVerifyEmail(emailParam);
        setCurrentPage('verify-email');
      }
    }

    // 1. Preload local indexedDB files
    preloadNoteFiles().then(() => {
      setNotes(getStoredNotes());
    });

    // 2. Fetch authoritative central server notes & orders immediately
    const performInitialSync = async () => {
      try {
        const serverNotes = await fetchServerNotes();
        if (Array.isArray(serverNotes)) {
          setNotes(serverNotes);
        }
        const serverOrders = await fetchServerOrders();
        if (Array.isArray(serverOrders)) {
          setOrders(serverOrders);
        }
      } catch (err) {
        console.warn('Initial server sync warning:', err);
      }
    };

    performInitialSync();

    // 3. Periodic real-time background poll (every 5s) so any note uploaded by any user is seen by all buyers instantly
    const syncInterval = setInterval(() => {
      fetchServerNotes().then((sn) => {
        if (Array.isArray(sn)) {
          setNotes(sn);
        }
      }).catch(() => {});

      fetchServerOrders().then((so) => {
        if (Array.isArray(so)) {
          setOrders(so);
        }
      }).catch(() => {});
    }, 5000);

    // 4. Focus sync when switching tabs/browser windows
    const handleWindowFocus = () => {
      fetchServerNotes().then((sn) => {
        if (Array.isArray(sn)) setNotes(sn);
      }).catch(() => {});
      fetchServerOrders().then((so) => {
        if (Array.isArray(so)) setOrders(so);
      }).catch(() => {});
    };
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, selectedNoteId]);

  // Navigation router
  const handleNavigate = (page: string, params?: any) => {
    if (params) {
      if (params.noteId) {
        setSelectedNoteId(params.noteId);
      }
      if (params.token) {
        setInitialVerifyToken(params.token);
      }
      if (params.email) {
        setInitialVerifyEmail(params.email);
      }
      if (params.university || params.branch || params.semester || params.subject || params.searchQuery) {
        setBrowseFilters({
          university: params.university,
          branch: params.branch,
          semester: params.semester,
          subject: params.subject,
          searchQuery: params.searchQuery,
        });
      }
    }

    // Access control: prevent unverified users from accessing protected sections
    const protectedPages = ['seller-dashboard', 'library', 'buyer-library', 'account'];
    if (
      protectedPages.includes(page) &&
      currentUser &&
      !currentUser.isEmailVerified &&
      currentUser.role !== 'admin'
    ) {
      showToast('⚠️ Please verify your student email address to unlock account features.');
      setCurrentPage('verify-email');
      return;
    }

    setCurrentPage(page);
  };

  // User Role Switcher
  const handleSwitchUserRole = (role: UserRole) => {
    const allUsers = getStoredUsers();
    let target = allUsers.find((u) => u.role === role);
    if (!target) {
      target = allUsers[0];
    }
    setCurrentUser(target);
    setCurrentUserState(target);
    showToast(`Switched persona to: ${target.name} (${target.role.toUpperCase()})`);

    if (role === 'seller' && currentPage !== 'seller-dashboard') {
      setCurrentPage('seller-dashboard');
    } else if (role === 'admin' && currentPage !== 'admin-dashboard') {
      setCurrentPage('admin-dashboard');
    } else if (role === 'buyer' && currentPage === 'admin-dashboard') {
      setCurrentPage('home');
    }
  };

  // Note actions
  const handleBuyNote = (note: NoteItem) => {
    if (currentUser && !currentUser.isEmailVerified && currentUser.role !== 'admin') {
      showToast('⚠️ Please verify your email before purchasing notes.');
      setCurrentPage('verify-email');
      return;
    }
    setPaymentNote(note);
  };

  const handleOpenUploadModal = () => {
    if (currentUser && !currentUser.isEmailVerified && currentUser.role !== 'admin') {
      showToast('⚠️ Please verify your email before publishing notes.');
      setCurrentPage('verify-email');
      return;
    }
    setIsUploadOpen(true);
  };

  const handlePaymentSuccess = async (order: PurchaseOrder) => {
    refreshAppData();
    showToast(`🎉 Payment Confirmed! Note unlocked in My Library (Order #${order.orderNumber}).`);
    try {
      await postServerOrder(order);
      await syncOrderToFirestore(order);
      const latestNotes = await fetchServerNotes();
      if (latestNotes && latestNotes.length > 0) {
        setNotes(latestNotes);
      }
    } catch {
      // safe fallback
    }
  };

  const handleUploadSuccess = async (newNote: NoteItem) => {
    // 1. Immediately update local state
    const currentNotes = getStoredNotes();
    const updated = [newNote, ...currentNotes.filter((n) => n.id !== newNote.id)];
    setNotes(updated);
    saveNotes(updated);
    refreshAppData();
    showToast(`🎉 Note Published Live! Available instantly in the marketplace for all buyers.`);

    // 2. Broadcast and persist to central server for all buyers worldwide
    try {
      await postServerNote(newNote);
      const serverUpdated = await fetchServerNotes();
      if (serverUpdated && serverUpdated.length > 0) {
        setNotes(serverUpdated);
      }
    } catch (e) {
      console.warn('Server sync error on upload:', e);
    }

    // 3. Sync to Firestore
    try {
      await syncNoteToFirestore(newNote);
    } catch {
      // safe fallback
    }
  };

  const handleWithdrawSuccess = (withdrawal: WithdrawalRequest) => {
    refreshAppData();
    showToast(`💰 Payout of ₹${withdrawal.amount} initiated to UPI: ${withdrawal.upiId}`);
  };

  const handleUpdateNoteStatus = (noteId: string, status: NoteItem['status'], feedback?: string) => {
    const updated = notes.map((n) => {
      if (n.id === noteId) {
        return {
          ...n,
          status,
          adminFeedback: feedback || n.adminFeedback,
        };
      }
      return n;
    });
    saveNotes(updated);
    setNotes(updated);
    refreshAppData();
    updateServerNote(noteId, { status, adminFeedback: feedback }).catch(() => {});

    if (status === 'approved') {
      showToast(`✅ Note Approved and published to catalog!`);
    } else if (status === 'rejected' || status === 'changes_requested') {
      showToast(`⚠️ Feedback updated for note submission.`);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    // 1. Immediately remove from React state to avoid any lag or flicker
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    if (previewNote && previewNote.id === noteId) {
      setPreviewNote(null);
    }
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
      setCurrentPage('browse');
    }

    const performer = currentUser?.name ? `${currentUser.name} (${currentUser.role || 'User'})` : 'Raj Sambhaji Bhosale (Admin)';
    const success = deleteNote(noteId, performer);
    if (success) {
      await deleteServerNote(noteId);
      refreshAppData();
      showToast(`🗑️ Note permanently deleted.`);
    }
  };

  // Active note for detail view
  const activeDetailNote = notes.find((n) => n.id === selectedNoteId) || notes[0];

  // Purchased and authored IDs for current user
  const purchasedNoteIds = [
    ...orders
      .filter(
        (o) =>
          (o.status === 'verified' || o.status === 'completed') &&
          currentUser &&
          (o.buyerId === currentUser.id ||
            (o.buyerEmail && currentUser.email && o.buyerEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
            (o.buyerPhone && currentUser.phone && o.buyerPhone === currentUser.phone))
      )
      .map((o) => o.noteId),
    ...notes.filter((n) => currentUser && n.sellerId === currentUser.id).map((n) => n.id),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-200 dark:selection:bg-blue-900 transition-colors duration-200">
      {/* Toast Banner */}
      {toastMessage && (
        <div 
          id="global-toast-notification"
          className="fixed bottom-5 right-5 z-50 bg-slate-900 dark:bg-slate-800 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-600 flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Responsive Navbar */}
      <Navbar
        currentUser={currentUser}
        onNavigate={handleNavigate}
        currentPage={currentPage}
        onOpenUpload={handleOpenUploadModal}
        onOpenProfilePhoto={() => setIsProfilePhotoModalOpen(true)}
        onLogout={handleLogout}
        purchasedCount={purchasedNoteIds.length}
      />

      {/* Main Page Routing Content */}
      <main className="flex-1 pb-16">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onOpenUpload={handleOpenUploadModal}
            onPreviewNote={(note) => setPreviewNote(note)}
            onBuyNote={handleBuyNote}
            featuredNotes={notes}
            purchasedNoteIds={purchasedNoteIds}
          />
        )}

        {currentPage === 'browse' && (
          <BrowsePage
            notes={notes}
            purchasedNoteIds={purchasedNoteIds}
            initialFilters={browseFilters}
            onPreviewNote={(note) => setPreviewNote(note)}
            onBuyNote={handleBuyNote}
            onOpenDetail={(note) => handleNavigate('note-detail', { noteId: note.id })}
          />
        )}

        {currentPage === 'note-detail' && activeDetailNote && (
          <NoteDetailPage
            note={activeDetailNote}
            currentUser={currentUser}
            onBack={() => handleNavigate('browse')}
            onBuy={handleBuyNote}
            isPurchased={purchasedNoteIds.includes(activeDetailNote.id)}
            onOpenPreviewModal={(note) => setPreviewNote(note)}
            onRateNote={(note) => setRateNoteTarget(note)}
            onDeleteNote={handleDeleteNote}
          />
        )}

        {currentPage === 'ai-summarizer' && (
          <AiSummarizerPage
            currentUser={currentUser}
            onBrowseNotes={() => handleNavigate('browse')}
            onOpenNote={(noteId) => handleNavigate('note-detail', { noteId })}
          />
        )}

        {currentPage === 'auth' && (
          <AuthPage
            currentUser={currentUser}
            onLoginSuccess={(user) => {
              setCurrentUserState(user);
              refreshAppData();
              if (user.role === 'seller') {
                setCurrentPage('seller-dashboard');
              } else if (user.role === 'admin') {
                setCurrentPage('admin-dashboard');
              } else {
                setCurrentPage('home');
              }
            }}
            onNavigateHome={() => setCurrentPage('home')}
            onNavigateToVerifyEmail={(targetEmail) => {
              setInitialVerifyEmail(targetEmail);
              setCurrentPage('verify-email');
            }}
          />
        )}

        {currentPage === 'verify-email' && (
          <VerifyEmailPage
            currentUser={currentUser}
            initialToken={initialVerifyToken}
            initialEmail={initialVerifyEmail}
            onVerificationSuccess={(verifiedUser) => {
              setCurrentUserState(verifiedUser);
              refreshAppData();
              showToast('🎉 Email verified successfully! Full NoteBridge access unlocked.');
              if (verifiedUser.role === 'seller') {
                setCurrentPage('seller-dashboard');
              } else if (verifiedUser.role === 'admin') {
                setCurrentPage('admin-dashboard');
              } else {
                setCurrentPage('home');
              }
            }}
            onNavigateHome={() => setCurrentPage('home')}
            onLogout={handleLogout}
          />
        )}

        {currentPage === 'seller-dashboard' && (
          <SellerDashboard
            currentUser={currentUser}
            notes={notes}
            orders={orders}
            withdrawals={withdrawals}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            onPreviewNote={(note) => setPreviewNote(note)}
            onOpenProfilePhoto={() => setIsProfilePhotoModalOpen(true)}
            onDeleteNote={handleDeleteNote}
          />
        )}

        {(currentPage === 'library' || currentPage === 'buyer-library') && (
          <BuyerLibraryPage
            currentUser={currentUser}
            notes={notes}
            orders={orders}
            onOpenPreview={(note) => setPreviewNote(note)}
            onOpenRate={(note) => setRateNoteTarget(note)}
            onBrowseNotes={() => handleNavigate('browse')}
            onRefreshOrders={refreshAppData}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenProfilePhoto={() => setIsProfilePhotoModalOpen(true)}
            onNavigate={handleNavigate}
            onUpdateUser={(updatedUser) => {
              setCurrentUserState(updatedUser);
              refreshAppData();
            }}
          />
        )}

        {currentPage === 'admin-dashboard' && (
          <AdminDashboard
            notes={notes}
            users={getStoredUsers()}
            orders={orders}
            reports={reports}
            withdrawals={withdrawals}
            currentUser={currentUser}
            onPreviewNote={(note) => setPreviewNote(note)}
            onUpdateNoteStatus={handleUpdateNoteStatus}
            onDeleteNote={handleDeleteNote}
            onRefreshOrders={refreshAppData}
          />
        )}

        {currentPage === 'account' && (
          <AccountPage
            currentUser={currentUser}
            notes={notes}
            orders={orders}
            withdrawals={withdrawals}
            onOpenProfilePhoto={() => setIsProfilePhotoModalOpen(true)}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteAccount}
            onUpdateUser={(updatedUser) => {
              setCurrentUserState(updatedUser);
              refreshAppData();
              showToast('✓ Account details updated successfully!');
            }}
          />
        )}
      </main>

      {/* Global Modals */}
      {/* 1. Payment Modal */}
      {paymentNote && (
        <UpiPaymentModal
          note={paymentNote}
          currentUser={currentUser}
          onClose={() => setPaymentNote(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* 2. Interactive Note Preview / Reader Modal */}
      {previewNote && (
        <NotePreviewModal
          note={previewNote}
          currentUser={currentUser}
          isPurchased={purchasedNoteIds.includes(previewNote.id)}
          onClose={() => setPreviewNote(null)}
          onBuy={(n) => {
            setPreviewNote(null);
            handleBuyNote(n);
          }}
        />
      )}

      {/* 3. Seller Upload Modal */}
      {isUploadOpen && (
        <UploadNoteModal
          currentUser={currentUser}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* 4. Seller Earnings Withdrawal Modal */}
      {isWithdrawOpen && (
        <WithdrawModal
          seller={currentUser}
          onClose={() => setIsWithdrawOpen(false)}
          onSuccess={handleWithdrawSuccess}
        />
      )}

      {/* 5. Rate Note Modal */}
      {rateNoteTarget && (
        <RateNoteModal
          note={rateNoteTarget}
          user={currentUser}
          onClose={() => setRateNoteTarget(null)}
          onSuccess={() => {
            refreshAppData();
            showToast('⭐ Thank you! Your verified rating was submitted.');
          }}
        />
      )}

      {/* 6. Profile Photo Upload Modal (Seniors and Juniors) */}
      {currentUser && (
        <ProfilePhotoUploadModal
          isOpen={isProfilePhotoModalOpen}
          onClose={() => setIsProfilePhotoModalOpen(false)}
          currentUser={currentUser}
          onUserUpdated={(updatedUser) => {
            setCurrentUserState(updatedUser);
            refreshAppData();
            showToast('📸 Profile photo updated successfully!');
          }}
        />
      )}

      {/* 7. Legal / Info Modal */}
      <InfoModal
        type={infoModalType}
        onClose={() => setInfoModalType(null)}
      />

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenInfo={(type) => setInfoModalType(type as InfoModalType)}
        onOpenInfoModal={(type) => setInfoModalType(type as InfoModalType)}
      />
    </div>
  );
}
