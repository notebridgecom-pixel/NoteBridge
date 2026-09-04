import React, { useState } from 'react';
import {
  User as UserType,
  NoteItem,
  PurchaseOrder,
  WithdrawalRequest,
} from '../types';
import {
  User,
  Camera,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  BookOpen,
  Calendar,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Clock,
  LogOut,
  Edit3,
  Save,
  ArrowRight,
  UploadCloud,
  ShoppingBag,
  Sparkles,
  Award,
  KeyRound,
  FileCheck,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import {
  updateUserProfileDetails,
  submitSellerApplication,
  BUSINESS_RULES,
  saveUsers,
  getStoredUsers,
  deleteCurrentUserAccount,
} from '../utils/storage';
import { EmailOtpVerificationModal } from '../components/EmailOtpVerificationModal';
import { DeleteAccountModal } from '../components/DeleteAccountModal';

interface AccountPageProps {
  currentUser: UserType | null;
  notes: NoteItem[];
  orders: PurchaseOrder[];
  withdrawals: WithdrawalRequest[];
  onOpenProfilePhoto: () => void;
  onOpenUpload: () => void;
  onOpenWithdraw: () => void;
  onNavigate: (page: string, params?: any) => void;
  onLogout: () => void;
  onUpdateUser: (user: UserType) => void;
  onDeleteAccount?: (reason?: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  currentUser,
  notes,
  orders,
  withdrawals,
  onOpenProfilePhoto,
  onOpenUpload,
  onOpenWithdraw,
  onNavigate,
  onLogout,
  onUpdateUser,
  onDeleteAccount,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'wallet' | 'verification' | 'security'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Edit form state
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    college: currentUser?.college || '',
    university: currentUser?.university || '',
    degree: currentUser?.degree || '',
    branch: currentUser?.branch || '',
    semester: currentUser?.semester || 1,
  });

  // Seller Application state
  const [sellerIdPhotoUrl, setSellerIdPhotoUrl] = useState('');
  const [sellerApplyNotice, setSellerApplyNotice] = useState<string | null>(null);

  // Email OTP Verification state
  const [isEmailOtpModalOpen, setIsEmailOtpModalOpen] = useState(false);

  // Account Deletion state
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [deleteErrorNotice, setDeleteErrorNotice] = useState<string | null>(null);

  const handleConfirmDeleteAccount = (reason: string) => {
    const result = deleteCurrentUserAccount(reason);
    if (result.success) {
      setIsDeleteAccountModalOpen(false);
      if (onDeleteAccount) {
        onDeleteAccount(reason);
      } else {
        onLogout();
        onNavigate('home');
      }
    } else {
      setDeleteErrorNotice(result.error || 'Failed to delete account.');
      setTimeout(() => setDeleteErrorNotice(null), 5000);
    }
  };

  const handleEmailOtpVerified = () => {
    if (!currentUser) return;
    const users = getStoredUsers();
    const updatedUsers = users.map((u) => {
      if (u.id === currentUser.id) {
        return { ...u, isVerified: true, isEmailVerified: true };
      }
      return u;
    });
    saveUsers(updatedUsers);

    const updatedUser: UserType = {
      ...currentUser,
      isVerified: true,
      isEmailVerified: true,
    };
    onUpdateUser(updatedUser);
    setIsEmailOtpModalOpen(false);
    setSaveSuccessNotice('🎉 Student Email successfully verified with 6-digit OTP!');
    setTimeout(() => setSaveSuccessNotice(null), 4000);
  };

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            Sign In to Access Your Account
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Log in to view your profile, manage academic details, track unlocked notes, and view earnings.
          </p>
        </div>
        <button
          onClick={() => onNavigate('auth')}
          className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-600/20 transition inline-flex items-center gap-2"
        >
          <span>Sign In / Create Account</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Calculate statistics
  const userPurchases = orders.filter((o) => o.buyerId === currentUser.id || o.buyerEmail === currentUser.email);
  const userUploads = notes.filter((n) => n.sellerId === currentUser.id || n.sellerName?.toLowerCase() === currentUser.name?.toLowerCase());
  const userSales = orders.filter((o) => (o.sellerId === currentUser.id || o.sellerName?.toLowerCase() === currentUser.name?.toLowerCase()) && (o.status === 'completed' || (o.status as string) === 'verified'));
  const userCompletedWithdrawals = withdrawals.filter((w) => w.sellerId === currentUser.id && w.status === 'completed');

  const totalEarnings = userSales.reduce((sum, o) => sum + (o.sellerShare || 0), 0) || currentUser.totalEarnings || 0;
  const availableBalance = currentUser.walletBalance ?? 0;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = updateUserProfileDetails(currentUser.id, {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      college: formData.college.trim(),
      university: formData.university.trim(),
      degree: formData.degree.trim(),
      branch: formData.branch.trim(),
      semester: Number(formData.semester),
    });

    if (updated) {
      onUpdateUser(updated);
      setIsEditing(false);
      setSaveSuccessNotice('✓ Profile details updated and saved successfully!');
      setTimeout(() => setSaveSuccessNotice(null), 3500);
    }
  };

  const handleApplySellerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = submitSellerApplication(currentUser.id, sellerIdPhotoUrl.trim() || undefined);
    if (updated) {
      onUpdateUser(updated);
      setSellerApplyNotice('🎉 Application Approved! You are now a Verified Senior Seller with 80% payout rights.');
      setTimeout(() => {
        setSellerApplyNotice(null);
      }, 3500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Toast notice */}
      {saveSuccessNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* 1. Header Profile Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-[2.5rem] p-6 sm:p-10 text-white shadow-md relative overflow-hidden">
        {/* Background decorative aura */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar with Upload button */}
            <div className="relative group flex-shrink-0">
              <div 
                onClick={onOpenProfilePhoto}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-800 border-4 border-white/20 shadow-xl overflow-hidden cursor-pointer flex items-center justify-center transition-transform group-hover:scale-105"
                title="Click to change profile photo"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-3xl">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <button
                onClick={onOpenProfilePhoto}
                className="absolute -bottom-2 -right-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg border-2 border-slate-900 transition-transform active:scale-95"
                title="Change Photo"
                aria-label="Upload photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
                  {currentUser.name}
                </h1>
                {currentUser.role === 'admin' ? (
                  <span className="px-3 py-1 bg-purple-500/30 text-purple-200 border border-purple-400/40 rounded-full text-xs font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                    Admin
                  </span>
                ) : currentUser.isVerifiedSenior ? (
                  <span className="px-3 py-1 bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 rounded-full text-xs font-bold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-emerald-300" />
                    Verified Senior Contributor
                  </span>
                ) : currentUser.role === 'seller' ? (
                  <span className="px-3 py-1 bg-blue-500/30 text-blue-200 border border-blue-400/40 rounded-full text-xs font-bold flex items-center gap-1">
                    <UploadCloud className="w-3.5 h-3.5 text-blue-300" />
                    Senior Seller
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-slate-700/80 text-slate-200 border border-slate-600 rounded-full text-xs font-bold flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                    Junior Student
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentUser.email}</span>
                  {currentUser.isEmailVerified ? (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEmailOtpModalOpen(true)}
                      className="px-2 py-0.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-400/30 rounded-full text-[10px] font-bold flex items-center gap-1 transition"
                    >
                      <span>⚠️ Verify Email OTP</span>
                    </button>
                  )}
                </div>
                {currentUser.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {currentUser.phone}
                  </span>
                )}
                {currentUser.college && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {currentUser.college}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={onOpenProfilePhoto}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/15 transition flex items-center gap-2"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Change Photo</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('profile');
                setIsEditing(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition flex items-center gap-2"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>

            <button
              onClick={onLogout}
              className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/30 rounded-xl text-xs font-bold transition flex items-center gap-2"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Account Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Personal & Academic Details</span>
        </button>

        <button
          onClick={() => setActiveTab('wallet')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'wallet'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Wallet &amp; Purchases</span>
          {currentUser.role === 'seller' && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
              ₹{availableBalance}
            </span>
          )}
        </button>

        {currentUser.role !== 'admin' && (
          <button
            onClick={() => setActiveTab('verification')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'verification'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Senior Seller Verification</span>
            {currentUser.isVerifiedSenior && (
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-full uppercase">
                Verified
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setActiveTab('security')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Security &amp; Session</span>
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Purchased Notes</span>
                <ShoppingBag className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 font-heading">
                {userPurchases.length}
              </div>
              <div className="text-[11px] text-slate-400">
                Clean PDFs available in My Library
              </div>
            </div>

            {/* Metric 2 */}
            <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Uploaded Notes</span>
                <UploadCloud className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 font-heading">
                {userUploads.length}
              </div>
              <div className="text-[11px] text-slate-400">
                Original study materials submitted
              </div>
            </div>

            {/* Metric 3 */}
            <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Available Wallet</span>
                <Wallet className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 font-heading">
                ₹{availableBalance}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold">
                3-hour instant PhonePe/UPI payout
              </div>
            </div>

            {/* Metric 4 */}
            <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Earnings</span>
                <Award className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 font-heading">
                ₹{totalEarnings}
              </div>
              <div className="text-[11px] text-slate-400">
                Net earnings across {userSales.length} note sales
              </div>
            </div>
          </div>

          {/* Quick Hub Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Study Hub */}
            <div className="p-6 sm:p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base font-heading">
                    My Study Library
                  </h3>
                  <p className="text-xs text-slate-500">
                    Access your purchased exam notes &amp; clean PDF downloads.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Unlocked Notes:</span>
                  <span className="font-bold text-slate-900">{userPurchases.length} documents</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Watermark Status:</span>
                  <span className="font-bold text-emerald-600">Clean Unwatermarked PDFs</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => onNavigate('library')}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Open Student Library</span>
                </button>
                <button
                  onClick={() => onNavigate('browse')}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Browse Notes
                </button>
              </div>
            </div>

            {/* Senior Creator Hub */}
            <div className="p-6 sm:p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base font-heading">
                    Senior Creator Hub &amp; Earnings
                  </h3>
                  <p className="text-xs text-slate-500">
                    Monetize handwritten notes and receive 80% revenue direct to UPI.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-2 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-600">Platform Royalty Rate:</span>
                  <span className="font-bold text-emerald-800">80% to Author (20% NoteBridge)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Available Wallet Balance:</span>
                  <span className="font-black text-emerald-950 text-sm">₹{availableBalance}</span>
                </div>
              </div>

              <div className="flex gap-3">
                {currentUser.role === 'seller' ? (
                  <>
                    <button
                      onClick={() => onNavigate('seller-dashboard')}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>Open Seller Dashboard</span>
                    </button>
                    <button
                      onClick={onOpenWithdraw}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                      Withdraw
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setActiveTab('verification')}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
                  >
                    <Award className="w-4 h-4" />
                    <span>Apply to Become a Senior Seller (80% Royalty)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Profile Details */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-heading">
                Academic &amp; Profile Details
              </h2>
              <p className="text-xs text-slate-500">
                Update your student credentials and college syllabus alignment.
              </p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mobile Number (for UPI Payouts &amp; Alerts)</span>
                </label>
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 8591587848"
                />
              </div>

              {/* College */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>College / Institute</span>
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Government Polytechnic Mumbai"
                />
              </div>

              {/* University */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  <span>University / Board</span>
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. MSBTE / Mumbai University / SPPU"
                />
              </div>

              {/* Degree */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Degree / Course</span>
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Diploma in Engineering (Polytechnic) / B.Tech"
                />
              </div>

              {/* Branch */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  <span>Branch / Department</span>
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Computer Engineering / Mechanical"
                />
              </div>

              {/* Semester */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Current Semester</span>
                </label>
                <select
                  disabled={!isEditing}
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Registered Email (Account ID)</span>
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono"
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            )}
          </form>

          {/* Danger Zone in Profile Tab */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50/60 p-5 rounded-2xl border border-rose-200/70">
            <div>
              <h4 className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Delete Account &amp; Student Profile</span>
              </h4>
              <p className="text-[11px] text-rose-700">
                Permanently erase your account, uploads, and data from NoteBridge.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsDeleteAccountModalOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Wallet & Purchases */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          {/* Financial summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-blue-600 text-white rounded-[2rem] shadow-sm space-y-2 relative overflow-hidden">
              <div className="w-24 h-24 bg-blue-500 rounded-full opacity-30 absolute -bottom-4 -right-4 pointer-events-none" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
                Available Wallet Balance
              </span>
              <div className="text-3xl font-black font-heading">
                ₹{availableBalance}
              </div>
              <div className="pt-2">
                <button
                  onClick={onOpenWithdraw}
                  className="px-4 py-2 bg-white text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition"
                >
                  Withdraw to Mobile/UPI →
                </button>
              </div>
            </div>

            <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Lifetime 80% Seller Royalties
              </span>
              <div className="text-3xl font-black text-slate-900 font-heading">
                ₹{totalEarnings}
              </div>
              <p className="text-xs text-slate-400">
                Earned from verified junior note downloads.
              </p>
            </div>

            <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Disbursed Payouts
              </span>
              <div className="text-3xl font-black text-slate-900 font-heading">
                ₹{userCompletedWithdrawals.reduce((sum, w) => sum + w.amount, 0)}
              </div>
              <p className="text-xs text-slate-400">
                Successfully credited via PhonePe/GPay/UPI.
              </p>
            </div>
          </div>

          {/* Unlocked Notes List */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base font-heading">
                  My Purchased Study Notes ({userPurchases.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Clean, unwatermarked high-resolution PDF study materials.
                </p>
              </div>
              <button
                onClick={() => onNavigate('library')}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>View in Library</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {userPurchases.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {userPurchases.map((order) => (
                  <div key={order.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs text-slate-900">{order.noteTitle}</div>
                      <div className="text-[11px] text-slate-500">
                        {order.subject} • Ref: {order.orderNumber} • Paid: ₹{order.amount}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Unlocked
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">
                  No note purchases found yet. Explore top exam notes created by university seniors.
                </p>
                <button
                  onClick={() => onNavigate('browse')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Browse Notes Catalog
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Senior Seller Verification */}
      {activeTab === 'verification' && currentUser.role !== 'admin' && (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-heading">
                Senior Seller Accreditation &amp; 80% Royalty
              </h2>
              <p className="text-xs text-slate-500">
                Verified Seniors earn an industry-leading 80% payout on every syllabus note download.
              </p>
            </div>
          </div>

          {currentUser.isVerifiedSenior ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Verified Senior Scholar Badge Active</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Your account is accredited by the Academic Verification Desk. All notes you upload automatically feature the Verified Senior Badge and grant you <strong>80% net royalty</strong> credited directly to your UPI ID.
              </p>
              <div className="pt-2">
                <button
                  onClick={onOpenUpload}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload More Notes</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {sellerApplyNotice && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{sellerApplyNotice}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <strong className="text-xs text-slate-900 block">💰 80% Payout Royalty</strong>
                  <span className="text-[11px] text-slate-600">Keep 80% of every sale. NoteBridge keeps 20% platform maintenance fee.</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <strong className="text-xs text-slate-900 block">⚡ 3-Hour Mobile/UPI Payouts</strong>
                  <span className="text-[11px] text-slate-600">Withdraw any balance amount with no minimum threshold to PhonePe, GPay, or Paytm.</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <strong className="text-xs text-slate-900 block">🛡️ Verified Scholar Badge</strong>
                  <span className="text-[11px] text-slate-600">Boost student trust and download rates with an official verification tick.</span>
                </div>
              </div>

              <form onSubmit={handleApplySellerSubmit} className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                  Submit Verification Application
                </h4>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">
                    College ID Card Photo URL / Proof (Optional)
                  </label>
                  <input
                    type="url"
                    value={sellerIdPhotoUrl}
                    onChange={(e) => setSellerIdPhotoUrl(e.target.value)}
                    placeholder="https://... (or leave blank for instant student approval)"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    Your name ({currentUser.name}) and college ({currentUser.college || 'Engineering & Polytechnic'}) will be registered for 80% royalty rights.
                  </p>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>Activate 80% Senior Seller Account</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Security & Session */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-heading">
                Security &amp; Active Session
              </h2>
              <p className="text-xs text-slate-500">
                Manage your credentials, login device session, and access keys.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Current User ID:</span>
                <span className="font-mono font-bold text-slate-800">{currentUser.id}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Account Role:</span>
                <span className="font-bold uppercase text-blue-600">{currentUser.role}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Session Security:</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Local Key Encrypted &amp; Active
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Email Verification Status:</span>
                {currentUser.isEmailVerified ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified ({currentUser.email})
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEmailOtpModalOpen(true)}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <span>Verify 6-Digit Email OTP</span>
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Active Session Termination
                </span>
                <span className="text-xs text-slate-500">
                  Ready to switch accounts or end your session on this device?
                </span>
              </div>
              <button
                onClick={onLogout}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out from Device</span>
              </button>
            </div>

            {/* Danger Zone: Account Deletion */}
            <div className="p-5 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5 text-rose-950 font-heading">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-950">
                      Danger Zone: Delete Student Account
                    </h4>
                    <p className="text-xs text-rose-700">
                      Permanently remove your profile, data, login credentials, and personal records from NoteBridge.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDeleteAccountModalOpen(true)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Account</span>
                </button>
              </div>

              {deleteErrorNotice && (
                <div className="p-3 bg-rose-200/80 border border-rose-300 text-rose-950 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>{deleteErrorNotice}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email OTP Verification Modal */}
      {currentUser && (
        <EmailOtpVerificationModal
          isOpen={isEmailOtpModalOpen}
          email={currentUser.email}
          purpose="email_verification"
          userName={currentUser.name}
          title="Verify Registered Student Email"
          subtitle="Enter the 6-digit verification code sent to your academic email to complete identity verification."
          onVerified={handleEmailOtpVerified}
          onClose={() => setIsEmailOtpModalOpen(false)}
        />
      )}

      {/* Account Deletion Confirmation Modal */}
      {currentUser && (
        <DeleteAccountModal
          isOpen={isDeleteAccountModalOpen}
          user={currentUser}
          onClose={() => setIsDeleteAccountModalOpen(false)}
          onConfirmDelete={handleConfirmDeleteAccount}
          onNavigateToWallet={() => setActiveTab('wallet')}
        />
      )}
    </div>
  );
};
