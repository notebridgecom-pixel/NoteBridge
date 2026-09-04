import React, { useState, useRef } from 'react';
import { User } from '../types';
import { 
  Camera, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  Trash2, 
  X, 
  Sparkles, 
  UserCheck, 
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import { updateUserProfilePhoto } from '../utils/storage';

interface ProfilePhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserUpdated: (updatedUser: User) => void;
}

// Preset avatars curated for college students and senior scholars
const AVATAR_PRESETS = [
  {
    id: 'male-eng-1',
    label: 'Tech Scholar',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'female-eng-1',
    label: 'Computer Lead',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'male-eng-2',
    label: 'Senior Topper',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'female-eng-2',
    label: 'Academic Pro',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'male-eng-3',
    label: 'Polytechnic Rep',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'female-eng-3',
    label: 'Research Fellow',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  },
];

export const ProfilePhotoUploadModal: React.FC<ProfilePhotoUploadModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
}) => {
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>(currentUser.avatarUrl || '');
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isSenior = currentUser.role === 'seller';
  const roleLabel = isSenior ? 'Senior Scholar' : currentUser.role === 'admin' ? 'Admin' : 'Junior Student';

  // Handle local file upload (PNG, JPG, WebP)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, JPEG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Photo size must be less than 5 MB.');
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSelectedPhotoUrl(result);
      setIsProcessing(false);
      setSuccessMsg('Photo selected! Click "Save Profile Photo" to apply.');
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read image file.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    if (!customUrlInput.startsWith('http://') && !customUrlInput.startsWith('https://') && !customUrlInput.startsWith('data:image')) {
      setErrorMsg('Please enter a valid image URL (e.g. https://...)');
      return;
    }
    setErrorMsg(null);
    setSelectedPhotoUrl(customUrlInput.trim());
    setCustomUrlInput('');
    setSuccessMsg('Photo URL linked! Click "Save Profile Photo" to apply.');
  };

  const handleSave = () => {
    try {
      const updated = updateUserProfilePhoto(currentUser.id, selectedPhotoUrl);
      if (updated) {
        onUserUpdated(updated);
        setSuccessMsg('Profile photo updated successfully!');
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        setErrorMsg('Failed to update profile photo.');
      }
    } catch (err) {
      setErrorMsg('Error saving profile photo.');
    }
  };

  const handleRemovePhoto = () => {
    setSelectedPhotoUrl('');
    setCustomUrlInput('');
    setErrorMsg(null);
    const updated = updateUserProfilePhoto(currentUser.id, '');
    if (updated) {
      onUserUpdated(updated);
      setSuccessMsg('Profile photo removed.');
    }
  };

  return (
    <div 
      id="profile-photo-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        id="profile-photo-modal-card"
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col text-slate-900 animate-in zoom-in-95 duration-200 max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-blue-300 backdrop-blur-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Upload Profile Photo</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/30 text-blue-200 border border-blue-400/40">
                  {roleLabel}
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Personalize your {isSenior ? 'Senior seller' : 'Junior student'} account photo
              </p>
            </div>
          </div>
          <button
            id="close-profile-photo-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(92vh-140px)]">
          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <span className="font-bold">Notice:</span> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2 font-bold">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Live Preview Card */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-slate-900 border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-white text-3xl font-extrabold flex-shrink-0">
                {selectedPhotoUrl ? (
                  <img
                    src={selectedPhotoUrl}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    onError={() => {
                      setErrorMsg('Failed to render photo from URL. Please check the image link.');
                      setSelectedPhotoUrl('');
                    }}
                  />
                ) : (
                  <span>{currentUser.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center justify-center transition"
                title="Choose new file from device"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center sm:text-left space-y-1 flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                <h4 className="font-bold text-slate-900 text-sm">{currentUser.name}</h4>
                {currentUser.isVerifiedSenior && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                    Senior
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{currentUser.college || 'Engineering & Polytechnic College'}</p>
              <p className="text-[11px] text-slate-400 font-mono">{currentUser.email}</p>
              
              {selectedPhotoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 font-semibold hover:underline"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove photo
                </button>
              )}
            </div>
          </div>

          {/* Option 1: Direct File Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              1. Upload Photo from Device (Phone or Laptop)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 group-hover:bg-blue-200 text-blue-600 flex items-center justify-center transition">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-blue-700">Click to choose image</span>
                <span className="text-slate-500"> or drag &amp; drop file here</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Supports JPG, PNG, WebP up to 5 MB
              </p>
            </div>
          </div>

          {/* Option 2: Choose Curated Student Avatar Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                2. Or Choose an Academic Avatar
              </label>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                1-Click Select
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedPhotoUrl(preset.url);
                    setErrorMsg(null);
                    setSuccessMsg(`Selected ${preset.label} avatar!`);
                  }}
                  className={`p-1.5 rounded-2xl border text-center transition flex flex-col items-center gap-1 relative group ${
                    selectedPhotoUrl === preset.url
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200">
                    <img 
                      src={preset.url} 
                      alt={preset.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 leading-none truncate w-full">
                    {preset.label}
                  </span>
                  {selectedPhotoUrl === preset.url && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Option 3: Image URL Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              3. Or Enter Direct Image Web URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleApplyCustomUrl}
                disabled={!customUrlInput.trim()}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition"
              >
                Apply URL
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Save Profile Photo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
