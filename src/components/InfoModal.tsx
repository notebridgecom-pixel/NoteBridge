import React from 'react';
import { X, ShieldCheck, Mail, BookOpen, AlertTriangle, CheckCircle, Heart, Phone, MapPin, Instagram } from 'lucide-react';
import { Logo } from './Logo';

export type InfoModalType = 'about' | 'contact' | 'terms' | 'privacy' | 'copyright';

interface InfoModalProps {
  type: InfoModalType | null;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div 
      id="info-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        id="info-modal-dialog"
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" inverted={true} />
            <h3 className="font-bold text-base text-white">
              {type === 'about' && 'About NoteBridge'}
              {type === 'contact' && 'Contact & Support'}
              {type === 'terms' && 'Terms of Service'}
              {type === 'privacy' && 'Privacy & Data Policy'}
              {type === 'copyright' && 'Anti-Piracy & Copyright Policy'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {type === 'about' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-blue-900 text-base">Study Smart. Earn Smart.</h4>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full">
                    Founded by Raj Bhosale
                  </span>
                </div>
                <p className="text-slate-600">
                  NoteBridge is a dedicated peer-to-peer academic marketplace founded by <strong className="text-slate-800">Raj Bhosale</strong> built specifically for engineering and college students across India. 
                  Every semester, hardworking top-rank seniors create pristine, handwritten exam revision notes, while junior students struggle to find syllabus-aligned notes before exams.
                </p>
              </div>

              <h5 className="font-bold text-slate-900 text-sm">Why NoteBridge?</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 block mb-1">🎯 100% Syllabus Aligned</strong>
                  <span className="text-slate-600 text-xs">Notes are mapped strictly to SPPU, Mumbai Univ, VTU, AKTU and Anna University exam schemes.</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 block mb-1">💰 Fair 80/20 Revenue Split</strong>
                  <span className="text-slate-600 text-xs">Sellers keep 80% of every sale directly to their UPI VPA. NoteBridge keeps 20% for platform maintenance.</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 block mb-1">🔒 Clean Original Study Material</strong>
                  <span className="text-slate-600 text-xs">Sample previews protect against piracy, while buyers receive 100% clean, unwatermarked high-resolution study PDFs.</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 block mb-1">⚡ Instant UPI Access</strong>
                  <span className="text-slate-600 text-xs">Scan & pay with GPay, PhonePe, or Paytm with zero friction and instant PDF download.</span>
                </div>
              </div>
            </div>
          )}

          {type === 'contact' && (
            <div className="space-y-4">
              <p className="text-slate-600">
                Have a question regarding note submissions, payout verification, or syllabus suggestions? Our support team led by founder <strong>Raj Bhosale</strong> is here to assist:
              </p>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-slate-900 block text-xs">Email Support</strong>
                    <a href="mailto:notebridge.com@gmail.com" className="text-blue-600 font-mono text-xs hover:underline">
                      notebridge.com@gmail.com
                    </a>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-slate-900 block text-xs">Phone &amp; WhatsApp Support</strong>
                    <a href="tel:8591587848" className="text-emerald-700 font-mono text-xs font-bold hover:underline">
                      +91 8591587848 (8591587848)
                    </a>
                    <span className="text-[11px] text-slate-500 block">Mon–Sat (9:00 AM - 9:00 PM IST)</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-slate-900 block text-xs">Founder Desk</strong>
                    <span className="text-slate-700 text-xs font-semibold">Raj Bhosale</span>
                    <span className="text-[11px] text-slate-500 block">Mumbai, Maharashtra, India</span>
                    <a
                      href="https://www.instagram.com/rajbhosaletkd?igsi=MWU1NjQ0MDY1Y2Z0MA%3D%3D"
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-700 hover:text-purple-900 text-xs font-medium hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                      <span>@rajbhosaletkd on Instagram</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {type === 'copyright' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-900 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Strict Anti-Piracy and Textbook Protection Policy</span>
              </div>

              <p className="text-slate-600 text-xs leading-relaxed">
                NoteBridge operates with zero tolerance for copyright infringement. As a seller on our platform:
              </p>

              <ul className="space-y-2 text-xs text-slate-700 list-disc pl-5">
                <li><strong>Prohibited Material:</strong> Scanning published textbooks, commercial guides, coaching modules, or third-party paid answer keys is strictly illegal and causes immediate permanent ban.</li>
                <li><strong>Allowed Material:</strong> Only original, student-authored handwritten or typed lecture notes, self-solved past year university examination questions (PYQs), formula cheat sheets, and conceptual diagrams are approved.</li>
                <li><strong>Moderation:</strong> Every submission is audited by university moderators before going live.</li>
                <li><strong>Buyer Clean Access:</strong> Junior buyers unlock clean, unwatermarked original study PDFs for hassle-free studying and note-taking.</li>
              </ul>
            </div>
          )}

          {type === 'terms' && (
            <div className="space-y-3 text-xs text-slate-600">
              <h5 className="font-bold text-slate-900">1. Student Marketplace Terms</h5>
              <p>
                NoteBridge facilitates academic content transactions between verified student sellers and buyer peers. Sellers have full autonomy to set custom prices for their original study materials.
              </p>
              <h5 className="font-bold text-slate-900">2. Revenue & Payouts</h5>
              <p>
                Sellers receive 80% net revenue on every completed purchase. NoteBridge retains 20% platform commission for cloud storage, fast hosting, and payment infrastructure. Payouts can be requested directly to your Mobile Number (PhonePe/GPay/Paytm) or UPI ID for any available wallet amount with no minimum threshold, and are received within 3 hours.
              </p>
              <h5 className="font-bold text-slate-900">3. Reviews and Ratings</h5>
              <p>
                Ratings and reviews can only be submitted by verified buyers who completed a successful transaction for that specific document.
              </p>
            </div>
          )}

          {type === 'privacy' && (
            <div className="space-y-3 text-xs text-slate-600">
              <h5 className="font-bold text-slate-900">Data Security & Privacy</h5>
              <p>
                NoteBridge respects student privacy. We only collect basic information (name, college email, phone number, and college details) needed to authenticate users and execute UPI payouts.
              </p>
              <p>
                We do not sell student data to third-party marketing companies. All payments are routed via authorized UPI banking channels.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
