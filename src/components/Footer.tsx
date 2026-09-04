import React, { useState } from 'react';
import { Logo } from './Logo';
import { 
  ShieldCheck, 
  Heart, 
  Instagram, 
  Mail, 
  AlertCircle, 
  HelpCircle, 
  ChevronDown, 
  CreditCard, 
  FileCheck, 
  Clock, 
  Lock,
  Sparkles,
  ArrowRight,
  Phone,
  UserCheck
} from 'lucide-react';

interface FooterProps {
  onOpenInfo?: (type: 'about' | 'contact' | 'terms' | 'privacy' | 'copyright') => void;
  onOpenInfoModal?: (type: 'about' | 'contact' | 'terms' | 'privacy' | 'copyright') => void;
  onNavigate?: (tab: string) => void;
  onOpenUpload?: () => void;
  onSelectUniversity?: (uni: string) => void;
}

interface FAQItem {
  id: string;
  category: 'upi' | 'verification' | 'withdrawals' | 'security';
  question: string;
  answer: string;
  badge?: string;
}

const FAQS: FAQItem[] = [
  {
    id: 'faq-upi-1',
    category: 'upi',
    badge: 'UPI Instant',
    question: 'How do UPI payments work and which apps are supported?',
    answer: 'NoteBridge generates dynamic instant UPI payment QR codes and direct intent links compatible with all standard Indian UPI apps including Google Pay, PhonePe, Paytm, Cred, BHIM, and bank UPI apps. As soon as payment completes, your note is immediately unlocked and added to "My Library".'
  },
  {
    id: 'faq-upi-2',
    category: 'upi',
    badge: 'Payment Safety',
    question: 'What if money is deducted via UPI but download does not start?',
    answer: 'All payments are tied to your unique 12-digit UPI reference number (UTR). If there is any network delay, your purchased PDF will automatically appear in your "My Library" dashboard once the transaction settles. You can also reach our 24/7 student support via WhatsApp or email with your UTR.'
  },
  {
    id: 'faq-verif-1',
    category: 'verification',
    badge: 'Quality Assurance',
    question: 'How does NoteBridge verify the quality and syllabus accuracy of notes?',
    answer: 'Every submitted PDF is reviewed by our academic moderation team for university syllabus alignment (e.g., SPPU 2024, MU, VTU, AKTU), high-resolution legibility, clear handwritten diagrams, and freedom from copyright textbook piracy. Senior sellers can also upload their College ID or Marksheet for a "Verified Senior" badge.'
  },
  {
    id: 'faq-verif-2',
    category: 'verification',
    badge: 'Free Preview',
    question: 'Can I preview the notes before paying?',
    answer: 'Yes! NoteBridge provides a free 3-page watermarked preview for every note so you can inspect handwriting style, unit coverage, formula summaries, and real ratings from students in your university before deciding to purchase.'
  },
  {
    id: 'faq-with-1',
    category: 'withdrawals',
    badge: '80% Revenue',
    question: 'How much do sellers earn and what are the withdrawal timelines?',
    answer: 'Senior sellers receive an industry-leading 80% revenue split on every single sale. Payouts can be requested directly to your Mobile Number (PhonePe/GPay/Paytm) or UPI ID for any available wallet balance amount with zero minimum threshold. Payouts are processed and received within 3 hours.'
  },
  {
    id: 'faq-sec-1',
    category: 'security',
    badge: 'Anti-Piracy',
    question: 'How are seller notes protected against unauthorized leaks or sharing?',
    answer: 'Before purchase, NoteBridge protects materials with secure preview samples. Once purchased by a junior student, they receive a clean, 100% original unwatermarked PDF for optimal exam preparation and crystal-clear printing.'
  }
];

export const Footer: React.FC<FooterProps> = ({ 
  onOpenInfo, 
  onOpenInfoModal, 
  onNavigate, 
  onOpenUpload, 
  onSelectUniversity 
}) => {
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-upi-1');
  const [activeCategory, setActiveCategory] = useState<'all' | 'upi' | 'verification' | 'withdrawals'>('all');

  const handleOpenInfo = (type: 'about' | 'contact' | 'terms' | 'privacy' | 'copyright') => {
    if (typeof onOpenInfo === 'function') {
      onOpenInfo(type);
    } else if (typeof onOpenInfoModal === 'function') {
      onOpenInfoModal(type);
    }
  };

  const filteredFaqs = activeCategory === 'all' 
    ? FAQS 
    : FAQS.filter(f => f.category === activeCategory || (activeCategory === 'upi' && f.category === 'security'));

  const toggleFaq = (id: string) => {
    setOpenFaqId(prev => prev === id ? null : id);
  };

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ================= Frequently Asked Questions Section ================= */}
        <div id="footer-faq-section" className="mb-16 pb-14 border-b border-slate-800/80">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-semibold mb-3">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Student Trust & Helpdesk</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Frequently Asked Questions
              </h3>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                Clear answers regarding UPI payments, academic note quality checks, and fast 3-hour senior earnings withdrawal to mobile number or UPI.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                id="faq-filter-all"
                onClick={() => setActiveCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                  activeCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/70'
                }`}
              >
                All Queries
              </button>
              <button
                id="faq-filter-upi"
                onClick={() => setActiveCategory('upi')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeCategory === 'upi'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/70'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                <span>UPI Payments</span>
              </button>
              <button
                id="faq-filter-verification"
                onClick={() => setActiveCategory('verification')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeCategory === 'verification'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/70'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Note Verification</span>
              </button>
              <button
                id="faq-filter-withdrawals"
                onClick={() => setActiveCategory('withdrawals')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeCategory === 'withdrawals'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/70'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Withdrawal & Payouts</span>
              </button>
            </div>
          </div>

          {/* FAQ Accordion Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  id={`faq-card-${faq.id}`}
                  className={`rounded-2xl transition-all border ${
                    isOpen 
                      ? 'bg-slate-800/90 border-blue-500/40 shadow-lg shadow-blue-950/40' 
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700/80 hover:bg-slate-800/60'
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-3 focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <div className="space-y-1.5 pr-2">
                      <div className="flex items-center gap-2">
                        {faq.badge && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            faq.category === 'upi' ? 'bg-blue-500/20 text-blue-300' :
                            faq.category === 'verification' ? 'bg-emerald-500/20 text-emerald-300' :
                            faq.category === 'withdrawals' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-purple-500/20 text-purple-300'
                          }`}>
                            {faq.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
                        {faq.question}
                      </h4>
                    </div>
                    <div className={`w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-blue-600 text-white' : 'text-slate-400'
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300/90 leading-relaxed border-t border-slate-700/50">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Support Prompt */}
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-slate-800/80 via-slate-800/50 to-blue-950/40 border border-slate-700/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white">Have a specific question about your notes or order?</span>
                <p className="text-slate-400 text-[11px]">
                  Email: <a href="mailto:notebridge.com@gmail.com" className="text-blue-400 font-semibold hover:underline">notebridge.com@gmail.com</a> • Phone: <a href="tel:8591587848" className="text-emerald-400 font-semibold hover:underline">8591587848</a> (Mon–Sat 9 AM – 9 PM IST)
                </p>
              </div>
            </div>
            <button
              onClick={() => handleOpenInfo('contact')}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition flex items-center gap-1.5 flex-shrink-0"
            >
              <span>Contact Support</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ================= Main Footer Directory ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Logo size="lg" inverted={true} showTagline={true} />
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              NoteBridge is India&apos;s leading peer-to-peer academic notes marketplace, founded by <strong className="text-slate-200 font-semibold">Raj Bhosale</strong>. 
              We empower verified college seniors to monetize their hard work while helping junior students ace semester exams with syllabus-aligned, clean original notes.
            </p>
            
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://www.instagram.com/rajbhosaletkd?igsi=MWU1NjQ0MDY1Y2Z0MA%3D%3D"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 text-slate-300 hover:text-white flex items-center justify-center transition"
                title="Follow Founder Raj Bhosale on Instagram (@rajbhosaletkd)"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="mailto:notebridge.com@gmail.com"
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center transition"
                title="Email notebridge.com@gmail.com"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="tel:8591587848"
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center transition"
                title="Call 8591587848"
              >
                <Phone className="w-4 h-4" />
              </a>
              <span className="text-xs text-slate-400 font-medium ml-1">
                notebridge.com@gmail.com
              </span>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900 border border-slate-800 text-blue-300 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Made with <Heart className="w-3 h-3 inline text-rose-400 fill-rose-400" /> for Indian College Students</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 text-sm">
            <h4 className="text-white font-bold tracking-wide uppercase text-xs">Platform</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button onClick={() => handleOpenInfo('about')} className="hover:text-white transition">
                  About NoteBridge
                </button>
              </li>
              <li>
                <button onClick={() => handleOpenInfo('contact')} className="hover:text-white transition">
                  Contact & Support
                </button>
              </li>
              <li>
                <span className="text-xs text-emerald-400 font-semibold block">80% Seller Earnings</span>
                <span className="text-xs text-slate-500">Direct UPI Payouts • Any Amount</span>
              </li>
              <li>
                <button onClick={() => handleOpenInfo('copyright')} className="hover:text-amber-300 transition flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Anti-Piracy Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Support & Founder */}
          <div className="space-y-3 text-sm">
            <h4 className="text-white font-bold tracking-wide uppercase text-xs">Contact &amp; Support</h4>
            <ul className="space-y-2.5 text-slate-400 text-xs">
              <li className="flex items-start gap-2">
                <UserCheck className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Founder</span>
                  <span className="text-slate-200 font-bold">Raj Bhosale</span>
                  <span className="text-[11px] text-slate-400 block">Mumbai, Maharashtra, India</span>
                  <a
                    href="https://www.instagram.com/rajbhosaletkd?igsi=MWU1NjQ0MDY1Y2Z0MA%3D%3D"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-xs inline-flex items-center gap-1 hover:underline mt-0.5"
                  >
                    <Instagram className="w-3 h-3 inline" />
                    <span>@rajbhosaletkd</span>
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Call / WhatsApp Support</span>
                  <a href="tel:8591587848" className="text-emerald-400 font-bold hover:underline font-mono">
                    8591587848
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Support Email</span>
                  <a href="mailto:notebridge.com@gmail.com" className="text-blue-400 font-medium hover:underline break-all">
                    notebridge.com@gmail.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Support Hours</span>
                  <span className="text-slate-300">Mon–Sat (9 AM – 9 PM IST)</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Legal & Trust */}
          <div className="space-y-3 text-sm">
            <h4 className="text-white font-bold tracking-wide uppercase text-xs">Trust & Legal</h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <button onClick={() => handleOpenInfo('terms')} className="hover:text-white transition">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => handleOpenInfo('privacy')} className="hover:text-white transition">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => handleOpenInfo('copyright')} className="hover:text-white transition">
                  Original Content Pledge
                </button>
              </li>
              <li>
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1 text-amber-400 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Fair-Use Protection</span>
                  </div>
                  <p>Copyrighted textbook scans & coaching materials are strictly prohibited.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} NoteBridge EdTech • Founder: <span className="text-slate-300 font-semibold">Raj Bhosale</span> • Contact: <a href="tel:8591587848" className="text-slate-300 font-mono hover:underline">8591587848</a> | <a href="mailto:notebridge.com@gmail.com" className="text-slate-300 hover:underline">notebridge.com@gmail.com</a></p>
          <div className="flex items-center gap-6">
            <span>Prices in Indian Rupee (₹)</span>
            <span>UPI & Instant Download</span>
            <span className="text-emerald-400 font-medium">100% Encrypted & Watermark-Free</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
