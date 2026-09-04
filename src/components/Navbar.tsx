import React, { useState } from 'react';
import { Logo } from './Logo';
import { User, UserRole } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { 
  Search, 
  BookOpen, 
  UploadCloud, 
  Wallet, 
  ShieldCheck, 
  UserCircle, 
  Menu, 
  X, 
  ShoppingBag, 
  Sparkles, 
  ChevronDown,
  Layers,
  LogOut,
  GraduationCap,
  Camera
} from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, params?: any) => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenUpload: () => void;
  onOpenProfilePhoto?: () => void;
  purchasedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  currentUser,
  onLogout,
  onOpenUpload,
  onOpenProfilePhoto,
  purchasedCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isBuyer = currentUser?.role === 'buyer';
  const isSeller = currentUser?.role === 'seller';
  const isAdmin = currentUser?.role === 'admin';
  const isUnverified = Boolean(currentUser && currentUser.isEmailVerified === false && currentUser.role !== 'admin');

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Unverified Email Warning Banner */}
      {isUnverified && (
        <div 
          id="navbar-unverified-email-banner"
          className="bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-300 dark:border-amber-700/50 px-4 py-2 text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
            <span className="truncate">
              Action Required: Please verify your email ({currentUser?.email}) to unlock all features.
            </span>
          </div>
          <button
            id="navbar-verify-now-btn"
            onClick={() => onNavigate('verify-email', { email: currentUser?.email })}
            className="shrink-0 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition cursor-pointer"
          >
            Verify Email Now →
          </button>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            onClick={() => onNavigate('home')} 
            className="cursor-pointer group py-1"
          >
            <Logo size="md" showTagline={true} />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
            <button
              id="nav-home"
              onClick={() => onNavigate('home')}
              className={`px-3.5 py-2 rounded-2xl text-sm font-bold transition-colors ${
                currentPage === 'home' 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60' 
                  : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              Home
            </button>

            <button
              id="nav-browse"
              onClick={() => onNavigate('browse')}
              className={`px-3.5 py-2 rounded-2xl text-sm font-bold transition-colors flex items-center gap-1.5 ${
                currentPage === 'browse' || currentPage === 'note-detail'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60' 
                  : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Browse Notes
            </button>

            <button
              id="nav-ai-summarizer"
              onClick={() => onNavigate('ai-summarizer')}
              className={`px-3.5 py-2 rounded-2xl text-sm font-bold transition-colors flex items-center gap-1.5 ${
                currentPage === 'ai-summarizer' 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60' 
                  : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI Summarizer</span>
            </button>

            <button
              id="nav-library"
              onClick={() => onNavigate('library')}
              className={`px-3.5 py-2 rounded-2xl text-sm font-bold transition-colors flex items-center gap-1.5 relative ${
                currentPage === 'library' 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60' 
                  : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              My Library
              {purchasedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                  {purchasedCount}
                </span>
              )}
            </button>

            <button
              id="nav-seller-dashboard"
              onClick={() => onNavigate('seller-dashboard')}
              className={`px-3.5 py-2 rounded-2xl text-sm font-bold transition-colors flex items-center gap-1.5 ${
                currentPage === 'seller-dashboard' 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60' 
                  : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Seller Hub
              {currentUser?.role === 'seller' && (
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  ₹{currentUser.walletBalance}
                </span>
              )}
            </button>

            {isAdmin && (
              <button
                id="nav-admin"
                onClick={() => onNavigate('admin-dashboard')}
                className={`px-3.5 py-2 rounded-2xl text-sm font-bold transition-colors flex items-center gap-1.5 ${
                  currentPage === 'admin-dashboard' 
                    ? 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60' 
                    : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Admin
              </button>
            )}

            {currentUser && (
              <button
                id="nav-account"
                onClick={() => onNavigate('account')}
                className={`px-3.5 py-2 rounded-2xl text-sm font-bold transition-colors flex items-center gap-1.5 ${
                  currentPage === 'account' 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60' 
                    : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <UserCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                My Account
              </button>
            )}
          </nav>

          {/* Right Action CTA Buttons & Theme Toggle */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Global Theme Toggle */}
            <ThemeToggle id="desktop-theme-toggle" variant="icon-only" />

            <button
              id="header-sell-notes-btn"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800 px-4 py-2 rounded-2xl font-bold text-sm transition-colors shadow-2xs"
            >
              <UploadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Sell Your Notes</span>
            </button>

            {/* Profile Avatar / Login Toggle */}
            {currentUser ? (
              <div className="relative">
                <div 
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 cursor-pointer group select-none"
                  title="Account Menu"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm text-white flex items-center justify-center font-bold text-sm group-hover:scale-105 transition overflow-hidden">
                    {currentUser.avatarUrl ? (
                      <img 
                        src={currentUser.avatarUrl} 
                        alt={currentUser.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      currentUser.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-none truncate max-w-[100px]">
                      {currentUser.name.split(' ')[0]}
                    </p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium capitalize">
                      {currentUser.role === 'seller' ? 'Senior' : currentUser.role === 'buyer' ? 'Student' : 'Admin'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-800 overflow-hidden flex-shrink-0 text-white flex items-center justify-center text-xs font-bold">
                        {currentUser.avatarUrl ? (
                          <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                        ) : (
                          currentUser.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{currentUser?.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser?.email}</p>
                      </div>
                    </div>

                    {/* My Account & Profile Option */}
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('account');
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-900 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <UserCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>My Account &amp; Profile</span>
                    </button>

                    {/* Change Profile Photo Button */}
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenProfilePhoto && onOpenProfilePhoto();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Change Profile Photo</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('library');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>My Library &amp; Notes</span>
                      {purchasedCount > 0 && (
                        <span className="ml-auto px-1.5 py-0.2 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                          {purchasedCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('auth');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <UserCircle className="w-4 h-4 text-slate-400" />
                      <span>Switch Account / Role</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 mt-1"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <button
                  id="nav-signin-btn"
                  onClick={() => onNavigate('auth')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Sign In
                </button>
                <button
                  id="nav-signup-btn"
                  onClick={() => onNavigate('auth')}
                  className="px-4 py-2 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>

          {/* Mobile Actions: Theme Toggle + Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle id="mobile-quick-theme-toggle" variant="icon-only" />

            <button
              id="mobile-sell-btn"
              onClick={onOpenUpload}
              className="p-2 bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Sell</span>
            </button>

            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div id="mobile-menu-drawer" className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top duration-200 shadow-xl">
          {/* Mobile Theme Toggle Button */}
          <div className="pb-1">
            <ThemeToggle id="mobile-menu-theme-full" variant="full" />
          </div>

          {currentUser ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl mb-3 flex items-center justify-between border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenProfilePhoto && onOpenProfilePhoto();
                  }}
                  className="w-10 h-10 rounded-full bg-slate-900 dark:bg-slate-700 overflow-hidden text-white flex items-center justify-center font-bold text-xs cursor-pointer ring-2 ring-blue-500/20 flex-shrink-0"
                  title="Change Profile Photo"
                >
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    (currentUser?.name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{currentUser?.name}</p>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenProfilePhoto && onOpenProfilePhoto();
                    }}
                    className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Change Photo</span>
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-rose-600 dark:text-rose-400 font-semibold px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 rounded-xl"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 rounded-xl mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-950 dark:text-blue-200">You are browsing as Guest</p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">Sign in to access your library & wallet</p>
              </div>
              <button
                onClick={() => {
                  onNavigate('auth');
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Sign In
              </button>
            </div>
          )}

          <button
            id="mobile-nav-home"
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
              currentPage === 'home' 
                ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold' 
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            Home
          </button>

          <button
            id="mobile-nav-browse"
            onClick={() => {
              onNavigate('browse');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
              currentPage === 'browse' 
                ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold' 
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Browse All Notes
          </button>

          <button
            id="mobile-nav-ai-summarizer"
            onClick={() => {
              onNavigate('ai-summarizer');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
              currentPage === 'ai-summarizer' 
                ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold' 
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            AI Document Summarizer
          </button>

          <button
            id="mobile-nav-library"
            onClick={() => {
              onNavigate('library');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
              currentPage === 'library' 
                ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold' 
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              My Library (Downloads)
            </div>
            {purchasedCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                {purchasedCount}
              </span>
            )}
          </button>

          <button
            id="mobile-nav-seller"
            onClick={() => {
              onNavigate('seller-dashboard');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
              currentPage === 'seller-dashboard' 
                ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold' 
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Seller Dashboard & Wallet
            </div>
            {currentUser?.role === 'seller' && (
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                ₹{currentUser.walletBalance}
              </span>
            )}
          </button>

          {currentUser && (
            <button
              id="mobile-nav-account"
              onClick={() => {
                onNavigate('account');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                currentPage === 'account' 
                  ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold' 
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <UserCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              My Account &amp; Profile
            </button>
          )}

          {isAdmin && (
            <button
              id="mobile-nav-admin"
              onClick={() => {
                onNavigate('admin-dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Admin Moderation Panel
            </button>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                onOpenUpload();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm text-center shadow-md"
            >
              + Upload & Sell New Notes
            </button>
            <button
              onClick={() => {
                onNavigate('auth');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs text-center hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              {currentUser ? 'Switch Account / Role' : 'Sign In / Register'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

