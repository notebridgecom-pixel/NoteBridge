// Storage and config for PhonePe & UPI QR Code

export interface PhonePeConfig {
  receiverName: string;
  upiId: string;
  customQrImageUrl?: string | null;
  phonePeNumber?: string;
  qrStyle?: 'standard_light' | 'phonepe_dark';
}

export const POPULAR_UPI_HANDLES = [
  { handle: '@ybl', app: 'PhonePe (YES Bank)', example: '8591587848@ybl' },
  { handle: '@ibl', app: 'PhonePe (IndusInd)', example: '8591587848@ibl' },
  { handle: '@axl', app: 'PhonePe (Axis Bank)', example: '8591587848@axl' },
  { handle: '@oksbi', app: 'Google Pay (SBI)', example: '8591587848@oksbi' },
  { handle: '@okhdfcbank', app: 'Google Pay (HDFC)', example: '8591587848@okhdfcbank' },
  { handle: '@okaxis', app: 'Google Pay (Axis)', example: '8591587848@okaxis' },
  { handle: '@okicici', app: 'Google Pay (ICICI)', example: '8591587848@okicici' },
  { handle: '@paytm', app: 'Paytm Payments', example: '8591587848@paytm' },
  { handle: '@upi', app: 'BHIM NPCI', example: '8591587848@upi' },
  { handle: '@postbank', app: 'IPPB Post Bank', example: '8591587848@postbank' },
];

const DEFAULT_PHONEPE_CONFIG: PhonePeConfig = {
  receiverName: 'RAJ SAMBHAJI BHOSALE',
  upiId: '8591587848@ybl',
  customQrImageUrl: null,
  phonePeNumber: '+91 85915 87848',
  qrStyle: 'standard_light',
};

const STORAGE_KEY = 'notebridge_phonepe_config_v3';

export function getPhonePeConfig(): PhonePeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Migrate or reset to phone-based UPI ID
      return DEFAULT_PHONEPE_CONFIG;
    }
    return { ...DEFAULT_PHONEPE_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_PHONEPE_CONFIG;
  }
}

export function savePhonePeConfig(config: Partial<PhonePeConfig>): PhonePeConfig {
  try {
    const current = getPhonePeConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return DEFAULT_PHONEPE_CONFIG;
  }
}

/**
 * Generates an NPCI compliant UPI payment URI string.
 * Strictly adheres to NPCI UPI spec to prevent "Couldn't verify UPI ID" parsing errors.
 */
export function generateUpiUri(
  upiId: string,
  name: string,
  amount: number,
  noteTitle?: string
): string {
  const cleanUpi = (upiId || '8591587848@ybl').trim().toLowerCase();
  const cleanName = (name || 'RAJ SAMBHAJI BHOSALE').trim();
  
  // Format amount with 2 decimal places as required by standard NPCI specification
  const formattedAmount = Number(amount || 0).toFixed(2);
  
  // Sanitize transaction note - remove colon, hash, ampersand, and limit length to 20 chars
  const sanitizedNote = noteTitle
    ? noteTitle.replace(/[^a-zA-Z0-9 ]/g, ' ').trim().substring(0, 20)
    : 'NoteBridge Notes';
  
  const encodedName = encodeURIComponent(cleanName);
  const encodedNote = encodeURIComponent(sanitizedNote || 'Notes Purchase');
  
  // Standard NPCI UPI URI with clean parameters
  return `upi://pay?pa=${cleanUpi}&pn=${encodedName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}`;
}

/**
 * Direct App Intent Links for Mobile Handsets
 */
export function getAppSpecificUpiUri(app: 'phonepe' | 'gpay' | 'paytm' | 'bhim' | 'generic', baseUpiUri: string): string {
  switch (app) {
    case 'phonepe':
      return baseUpiUri.replace('upi://', 'phonepe://');
    case 'gpay':
      return baseUpiUri.replace('upi://', 'tez://upi/');
    case 'paytm':
      return baseUpiUri.replace('upi://', 'paytmmp://');
    case 'bhim':
    case 'generic':
    default:
      return baseUpiUri;
  }
}
