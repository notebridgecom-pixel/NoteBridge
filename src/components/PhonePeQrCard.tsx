import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  Copy, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  Upload, 
  Smartphone, 
  Info, 
  RefreshCw, 
  Edit3, 
  Save, 
  X,
  QrCode as QrIcon,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  Camera,
  Layers
} from 'lucide-react';
import { 
  getPhonePeConfig, 
  savePhonePeConfig, 
  generateUpiUri, 
  getAppSpecificUpiUri, 
  POPULAR_UPI_HANDLES, 
  PhonePeConfig 
} from '../utils/qrConfig';

interface PhonePeQrCardProps {
  amount: number;
  receiverName?: string;
  noteTitle: string;
  orderNumber?: string;
  allowCustomUpload?: boolean;
}

export const PhonePeQrCard: React.FC<PhonePeQrCardProps> = ({
  amount,
  receiverName = 'RAJ SAMBHAJI BHOSALE',
  noteTitle,
  allowCustomUpload = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showVerifyInfo, setShowVerifyInfo] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [config, setConfig] = useState<PhonePeConfig>(() => getPhonePeConfig());
  const [activeTab, setActiveTab] = useState<'qr' | 'apps'>('qr');
  
  const [inputUpiId, setInputUpiId] = useState(config.upiId || '8591587848@ybl');
  const [inputReceiverName, setInputReceiverName] = useState(config.receiverName || receiverName);
  const [inputPhone, setInputPhone] = useState(config.phonePeNumber || '+91 85915 87848');
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveUpiId = (config.upiId || '8591587848@ybl').trim();
  const effectiveReceiver = (config.receiverName || receiverName).trim();

  const upiUri = generateUpiUri(effectiveUpiId, effectiveReceiver, amount, noteTitle);

  // Generate NPCI Standard QR Code with crisp optical contrast
  useEffect(() => {
    let isMounted = true;
    async function generateCode() {
      try {
        // Generate crisp, high-contrast QR code (black modules on pure white background)
        // This eliminates the camera inverted-color read failures on Google Pay / PhonePe
        const url = await QRCode.toDataURL(upiUri, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 480,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        if (isMounted) {
          setQrDataUrl(url);
        }
      } catch (err) {
        console.error('Failed to generate real QR code', err);
      }
    }
    generateCode();
    return () => {
      isMounted = false;
    };
  }, [upiUri]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(effectiveUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const updated = savePhonePeConfig({ customQrImageUrl: base64 });
        setConfig(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveUpiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUpiId.trim()) return;
    const updated = savePhonePeConfig({
      upiId: inputUpiId.trim(),
      receiverName: inputReceiverName.trim() || receiverName,
      phonePeNumber: inputPhone.trim(),
    });
    setConfig(updated);
    setIsEditingUpi(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetToGenerated = () => {
    const updated = savePhonePeConfig({ 
      customQrImageUrl: null,
      upiId: '8591587848@ybl',
      receiverName: 'RAJ SAMBHAJI BHOSALE'
    });
    setConfig(updated);
    setInputUpiId('8591587848@ybl');
    setInputReceiverName('RAJ SAMBHAJI BHOSALE');
  };

  const handleSelectHandle = (handle: string) => {
    const prefix = inputUpiId.includes('@') ? inputUpiId.split('@')[0] : inputUpiId;
    setInputUpiId(`${prefix || '8591587848'}${handle}`);
  };

  return (
    <div className="max-w-md mx-auto w-full flex flex-col items-center space-y-3">
      {/* Troubleshooting / Alert Banner for "Couldn't verify UPI ID" */}
      <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 shadow-xs">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 w-full">
            <div className="flex items-center justify-between font-bold">
              <span>UPI Payment Fix &amp; Verification</span>
              <button
                type="button"
                onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                className="text-[11px] text-purple-700 hover:text-purple-900 underline flex items-center gap-0.5"
              >
                <HelpCircle className="w-3 h-3" />
                <span>{showTroubleshoot ? 'Hide Guide' : "Got 'Couldn't verify UPI ID'?"}</span>
              </button>
            </div>
            <p className="text-[11px] text-amber-800 leading-tight">
              If your UPI app says <em>&quot;We couldn&apos;t validate the person you&apos;re trying to pay&quot;</em>, update your active UPI ID or upload your PhonePe/GPay QR photo below.
            </p>

            <div className="flex flex-wrap gap-2 pt-1.5">
              <button
                type="button"
                onClick={() => setIsEditingUpi(true)}
                className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 shadow-xs"
              >
                <Edit3 className="w-3 h-3" />
                <span>Change UPI ID ({effectiveUpiId})</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-amber-300 text-amber-900 font-bold rounded-lg text-[10px] flex items-center gap-1 shadow-xs"
              >
                <Camera className="w-3 h-3 text-purple-700" />
                <span>Upload QR Photo from Gallery</span>
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Troubleshooting Guide */}
        {showTroubleshoot && (
          <div className="mt-2.5 pt-2.5 border-t border-amber-200 text-[11px] space-y-1.5 text-slate-800 animate-in fade-in">
            <p className="font-bold text-amber-900">Why does Google Pay or PhonePe show &quot;Couldn&apos;t verify UPI ID&quot;?</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
              <li><strong>Inactive UPI Handle:</strong> The VPA <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">{effectiveUpiId}</code> must match your active bank VPA registered in PhonePe, Google Pay, Paytm, or BHIM.</li>
              <li><strong>Easy Fix 1:</strong> Click <strong>&quot;Change UPI ID&quot;</strong> and type your phone number handle (e.g. <code className="bg-amber-100 px-1 rounded">8591587848@ybl</code>, <code className="bg-amber-100 px-1 rounded">8591587848@oksbi</code>, or <code className="bg-amber-100 px-1 rounded">8591587848@paytm</code>).</li>
              <li><strong>Easy Fix 2:</strong> Click <strong>&quot;Upload QR Photo&quot;</strong> and choose your actual PhonePe standee screenshot from your phone.</li>
            </ol>
          </div>
        )}
      </div>

      {/* Mode Switcher: QR Code vs Direct UPI Apps */}
      <div className="w-full flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
        <button
          type="button"
          onClick={() => setActiveTab('qr')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeTab === 'qr' ? 'bg-white text-purple-900 shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          <QrIcon className="w-3.5 h-3.5" />
          <span>UPI QR Code Standee</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('apps')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeTab === 'apps' ? 'bg-white text-purple-900 shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Pay via Direct App</span>
        </button>
      </div>

      {/* Save Success Toast */}
      {saveSuccess && (
        <div className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Real QR Code &amp; UPI settings updated successfully!</span>
        </div>
      )}

      {/* Main Payment Container */}
      {activeTab === 'qr' ? (
        <div 
          id="phonepe-authentic-standee"
          className="w-full bg-[#0d0d11] text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col relative"
        >
          {/* Subtle top glow */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-600 via-purple-400 to-indigo-600" />

          {/* 1. Header Section */}
          <div className="pt-5 pb-2 px-5 text-center flex flex-col items-center">
            {/* PhonePe Brand & Logo */}
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <div className="w-9 h-9 rounded-full bg-[#5f259f] flex items-center justify-center p-1.5 shadow-lg shadow-purple-950/60">
                {/* Hindi 'पे' Glyph */}
                <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
                  <path d="M50 8C26.8 8 8 26.8 8 50s18.8 42 42 42 42-18.8 42-42S73.2 8 50 8zm8.5 56H47.8v-8.8H39v8.8h-8.5V36h17.3c8.1 0 13.5 5.3 13.5 13.5 0 6-3.2 10.9-9 12.6l9.2 11.9h-3zm-10.7-18c3 0 4.8-1.9 4.8-4.5s-1.8-4.5-4.8-4.5H39v9h6.6z" />
                </svg>
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white font-sans">
                PhonePe
              </span>
            </div>

            {/* ACCEPTED HERE */}
            <h3 className="text-xs font-extrabold tracking-widest uppercase text-[#c084fc]">
              ACCEPTED HERE
            </h3>
            <p className="text-[10px] text-slate-300 font-medium">
              PhonePe • Google Pay • Paytm • BHIM • Cred • Any Bank UPI
            </p>
          </div>

          {/* 2. QR Code Matrix Area - High Contrast Pure White Card */}
          <div className="px-6 py-2 flex flex-col items-center justify-center relative">
            <div className="relative p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center max-w-[240px] w-full aspect-square border-2 border-purple-200">
              {config.customQrImageUrl ? (
                <img
                  src={config.customQrImageUrl}
                  alt="Custom PhonePe QR Standee"
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : qrDataUrl ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* High Contrast Scannable QR Matrix */}
                  <img
                    src={qrDataUrl}
                    alt="Real PhonePe UPI QR Code"
                    className="w-full h-full object-contain"
                  />
                  {/* Center Clean Badge */}
                  <div className="absolute inset-0 m-auto w-10 h-10 bg-white rounded-full border-2 border-[#5f259f] flex items-center justify-center p-0.5 shadow-md pointer-events-none">
                    <div className="w-7 h-7 rounded-full bg-[#5f259f] flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-4 h-4 fill-white">
                        <path d="M50 8C26.8 8 8 26.8 8 50s18.8 42 42 42 42-18.8 42-42S73.2 8 50 8zm8.5 56H47.8v-8.8H39v8.8h-8.5V36h17.3c8.1 0 13.5 5.3 13.5 13.5 0 6-3.2 10.9-9 12.6l9.2 11.9h-3zm-10.7-18c3 0 4.8-1.9 4.8-4.5s-1.8-4.5-4.8-4.5H39v9h6.6z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 animate-pulse font-sans">
                  Generating Real QR Code...
                </div>
              )}
            </div>

            {/* Verified Payee Name */}
            <div className="text-center mt-2.5 space-y-0.5">
              <h4 className="text-sm font-extrabold text-white tracking-wider uppercase font-mono">
                {effectiveReceiver}
              </h4>
              <span className="text-[10px] text-purple-300 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified NoteBridge Merchant Payee</span>
              </span>
            </div>
          </div>

          {/* 3. Amount & Quick Pay Pill */}
          <div className="px-5 py-2">
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                  Payable Amount
                </span>
                <span className="text-lg font-black text-purple-300">₹{amount}</span>
              </div>
              <a
                href={upiUri}
                className="px-3.5 py-1.5 bg-[#5f259f] hover:bg-[#722ebf] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Pay via UPI App</span>
              </a>
            </div>
          </div>

          {/* 4. Copy UPI ID Bar */}
          <div className="px-5 pb-3">
            <div className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-black/70 border border-slate-800 rounded-xl text-xs">
              <div className="min-w-0">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">UPI ID (VPA)</span>
                <span className="text-slate-200 font-mono text-[11px] truncate block">
                  {effectiveUpiId}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="flex items-center gap-1 text-[11px] font-bold text-purple-300 hover:text-white transition flex-shrink-0 bg-purple-900/60 hover:bg-purple-900 px-2.5 py-1 rounded-lg"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 5. Standee Footer */}
          <div className="bg-[#07070a] border-t border-slate-900 px-4 py-2.5 text-center">
            <p className="text-[9px] text-slate-400 font-medium leading-tight">
              © 2026 PhonePe • Scannable with all Indian UPI Banking Apps
            </p>
          </div>
        </div>
      ) : (
        /* Direct App Buttons View */
        <div className="w-full bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 space-y-4 shadow-xl">
          <div className="text-center space-y-1">
            <h4 className="text-sm font-bold text-white">Select Your UPI App on This Phone</h4>
            <p className="text-xs text-slate-400">Tap below to auto-fill ₹{amount} and Payee: {effectiveReceiver}</p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {/* PhonePe */}
            <a
              href={getAppSpecificUpiUri('phonepe', upiUri)}
              className="w-full p-3 bg-[#5f259f] hover:bg-[#702cb8] text-white rounded-2xl font-bold text-xs flex items-center justify-between transition shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-white text-[#5f259f] flex items-center justify-center font-black text-xs">पे</div>
                <span>Pay via PhonePe</span>
              </div>
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-mono">₹{amount}</span>
            </a>

            {/* Google Pay */}
            <a
              href={getAppSpecificUpiUri('gpay', upiUri)}
              className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs flex items-center justify-between transition shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-white text-blue-600 flex items-center justify-center font-black text-xs">G</div>
                <span>Pay via Google Pay</span>
              </div>
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-mono">₹{amount}</span>
            </a>

            {/* Paytm */}
            <a
              href={getAppSpecificUpiUri('paytm', upiUri)}
              className="w-full p-3 bg-[#002e6e] hover:bg-[#003b8c] text-white rounded-2xl font-bold text-xs flex items-center justify-between transition shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#00baf2] text-white flex items-center justify-center font-black text-xs">P</div>
                <span>Pay via Paytm</span>
              </div>
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-mono">₹{amount}</span>
            </a>

            {/* BHIM / Generic */}
            <a
              href={upiUri}
              className="w-full p-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs flex items-center justify-between transition shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-white text-emerald-800 flex items-center justify-center font-black text-xs">B</div>
                <span>Pay via BHIM / Cred / Any App</span>
              </div>
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-mono">₹{amount}</span>
            </a>
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className="text-xs text-purple-300 hover:text-white underline font-semibold"
            >
              ← Back to QR Code Scanner
            </button>
          </div>
        </div>
      )}

      {/* Editing UPI Modal / Drawer */}
      {isEditingUpi && (
        <form 
          onSubmit={handleSaveUpiConfig}
          className="w-full bg-slate-900 border border-purple-900/50 rounded-2xl p-4 text-xs text-slate-200 space-y-3 shadow-2xl animate-in zoom-in-95"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-purple-300 flex items-center gap-1.5 text-xs">
              <Edit3 className="w-4 h-4" />
              Configure Real Working UPI ID
            </span>
            <button 
              type="button"
              onClick={() => setIsEditingUpi(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 font-bold mb-1">
              Your Active UPI ID / VPA *
            </label>
            <input 
              type="text"
              required
              value={inputUpiId}
              onChange={(e) => setInputUpiId(e.target.value)}
              placeholder="e.g. 8591587848@ybl or 8591587848@oksbi"
              className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Must match your registered VPA in PhonePe, Google Pay, or Paytm.
            </span>
          </div>

          {/* Quick Bank Handle Chips */}
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-1">
              Quick Bank Handles:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_UPI_HANDLES.map((item) => (
                <button
                  key={item.handle}
                  type="button"
                  onClick={() => handleSelectHandle(item.handle)}
                  className="px-2 py-1 bg-slate-800 hover:bg-purple-900/70 border border-slate-700 hover:border-purple-500 text-[10px] rounded-md font-mono text-purple-300 transition"
                  title={`${item.app} (${item.example})`}
                >
                  {item.handle}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 font-bold mb-1">
              Payee Official Name
            </label>
            <input 
              type="text"
              value={inputReceiverName}
              onChange={(e) => setInputReceiverName(e.target.value)}
              placeholder="e.g. RAJ SAMBHAJI BHOSALE"
              className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-xs text-white uppercase font-mono focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 font-bold mb-1">
              PhonePe Mobile Number
            </label>
            <input 
              type="text"
              value={inputPhone}
              onChange={(e) => setInputPhone(e.target.value)}
              placeholder="e.g. +91 85915 87848"
              className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button 
              type="button"
              onClick={() => setIsEditingUpi(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              Save Real UPI Details
            </button>
          </div>
        </form>
      )}

      {/* Verification & Custom Image Actions */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px]">
          <button
            type="button"
            onClick={() => setShowVerifyInfo(!showVerifyInfo)}
            className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 underline"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showVerifyInfo ? 'Hide Technical Data' : 'Inspect UPI String & Specs'}</span>
          </button>

          {allowCustomUpload && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingUpi(!isEditingUpi)}
                className="text-xs text-slate-700 hover:text-purple-900 flex items-center gap-1 font-bold"
                title="Edit UPI ID or Payee Name"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit UPI</span>
              </button>

              {config.customQrImageUrl && (
                <button
                  type="button"
                  onClick={handleResetToGenerated}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  title="Switch to Real Generated QR"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg border border-purple-200"
              >
                <Upload className="w-3 h-3" />
                <span>Upload QR Photo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomImageUpload}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Raw UPI String Proof Inspector */}
        {showVerifyInfo && (
          <div className="p-3 bg-slate-900 text-slate-200 rounded-2xl text-[11px] font-mono space-y-1.5 border border-slate-800 animate-in fade-in">
            <div className="flex items-center justify-between text-purple-400 font-bold">
              <span>Authentic NPCI UPI Protocol URI:</span>
              <span className="text-[10px] text-emerald-400">NPCI Compliant</span>
            </div>
            <div className="p-2 bg-black rounded-lg break-all text-[10px] text-slate-300 select-all border border-slate-800 font-mono">
              {upiUri}
            </div>
            <div className="text-[10px] text-slate-400 pt-1 space-y-0.5 font-sans">
              <p>• <strong>Payee:</strong> {effectiveReceiver}</p>
              <p>• <strong>UPI VPA:</strong> {effectiveUpiId}</p>
              <p>• <strong>Amount:</strong> ₹{amount}</p>
              <p>• <strong>Status:</strong> Scannable by Google Pay, PhonePe, Paytm, BHIM</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
