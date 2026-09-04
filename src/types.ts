export type UserRole = 'buyer' | 'seller' | 'moderator' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  college: string;
  university: string;
  degree: string;
  branch: string;
  semester: number;
  role: UserRole;
  avatarUrl?: string;
  isVerified?: boolean;
  isVerifiedSenior?: boolean;
  collegeIdPhoto?: string;
  isEmailVerified?: boolean;
  rating?: number;
  totalRatingsCount?: number;
  walletBalance: number; // for sellers (in INR)
  totalEarnings: number; // for sellers
  isBlocked?: boolean;
  blockedReason?: string;
  createdAt: string;
}

export type OtpPurpose = 'signup' | 'login' | 'reset_password' | 'verify_email' | 'email_verification';

export interface OtpRecord {
  email: string;
  code: string;
  purpose: OtpPurpose;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

export type SecurityLogAction =
  | 'note_uploaded'
  | 'note_approved'
  | 'note_rejected'
  | 'note_deleted'
  | 'note_changes_requested'
  | 'payment_approved'
  | 'payment_rejected'
  | 'order_deleted'
  | 'user_blocked'
  | 'user_unblocked'
  | 'user_role_changed'
  | 'user_deleted'
  | 'withdrawal_deleted'
  | 'report_deleted'
  | 'college_created'
  | 'college_updated'
  | 'college_deleted'
  | 'course_created'
  | 'course_updated'
  | 'course_deleted'
  | 'branch_created'
  | 'branch_updated'
  | 'branch_deleted'
  | 'subject_created'
  | 'subject_updated'
  | 'subject_deleted'
  | 'payout_requested'
  | 'payout_processed'
  | 'payout_completed'
  | 'payout_rejected'
  | 'qr_config_updated'
  | 'admin_login'
  | 'security_alert';

export type SecurityLogCategory =
  | 'payment_verification'
  | 'note_moderation'
  | 'user_management'
  | 'catalog_management'
  | 'finance_payout'
  | 'system_security';

export type SecurityLogSeverity = 'info' | 'success' | 'warning' | 'critical';

export interface SecurityLog {
  id: string;
  timestamp: string; // ISO 8601 string
  action: SecurityLogAction;
  category: SecurityLogCategory;
  severity: SecurityLogSeverity;
  performedBy: string; // e.g. "Raj Sambhaji Bhosale (Admin)"
  performedByRole: UserRole | 'system';
  targetType: 'order' | 'note' | 'user' | 'catalog' | 'payout' | 'qr_config' | 'system';
  targetId: string;
  targetLabel: string; // e.g., "Order #NB-2026-4921", "User: Rohan Deshmukh"
  details: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
  ipAddress?: string;
  deviceInfo?: string;
}

export type ListingStatus = 'approved' | 'pending' | 'rejected' | 'changes_requested';

export interface AcademicCollege {
  id: string;
  name: string;
  code: string;
  location: string;
  affiliatedUniversity: string;
  courseIds: string[]; // Associated degrees / courses offered
  isActive: boolean;
  createdAt: string;
}

export interface AcademicCourse {
  id: string;
  name: string; // e.g. "Diploma", "BE / B.Tech", "B.Com", "M.Com", "B.Sc", "M.Sc", "BCA", "MCA", "BBA", "MBA", "BA", "M.Tech"
  category: 'Engineering & Technology' | 'Diploma / Polytechnic' | 'Computer Applications' | 'Management' | 'Commerce & Arts' | 'Science & Research';
  durationYears: number;
  totalSemesters: number;
  isActive: boolean;
}

export interface AcademicBranch {
  id: string;
  name: string;
  code: string;
  courseId: string; // which course/degree this branch belongs to (or 'all')
  collegeIds: string[]; // colleges offering this branch
  isActive: boolean;
}

export interface AcademicSubject {
  id: string;
  name: string;
  code: string;
  collegeId?: string; // specific college or 'all'
  courseId: string;
  branchId: string;
  semester: number;
  units: string[]; // e.g. ["Unit 1: Introduction", "Unit 2: Dynamic Memory", "Unit 3: Trees & Graphs", ...]
  academicYears: string[]; // e.g. ["2024-2025", "2025-2026", "2023-2024"]
  isActive: boolean;
}

export interface AcademicCatalog {
  colleges: AcademicCollege[];
  courses: AcademicCourse[];
  branches: AcademicBranch[];
  subjects: AcademicSubject[];
  academicYears: string[];
  updatedAt: string;
}

export interface NoteReviewCriteria {
  handwriting?: number; // 1 to 5
  syllabusCoverage?: number; // 1 to 5
  examRelevance?: number; // 1 to 5
  conceptClarity?: number; // 1 to 5
}

export interface NoteReview {
  id: string;
  userId: string;
  userName: string;
  userCollege: string;
  userCourse?: string; // e.g. "B.Tech Computer Science (3rd Year)"
  userGradeAchieved?: string; // e.g. "Scored 9.2 CGPA", "Scored 92% in Sem Exam"
  rating: number; // 1 to 5
  criteria?: NoteReviewCriteria;
  tags?: string[];
  comment: string;
  createdAt: string;
  verifiedPurchase: boolean;
  helpfulCount?: number;
  helpfulUserIds?: string[];
}

export interface NotePagePreview {
  pageNumber: number;
  title: string;
  contentSnippet?: string;
  sections: {
    heading?: string;
    body: string;
    formula?: string;
    diagramDescription?: string;
    pyqAlert?: string;
    tips?: string;
  }[];
}

export interface NoteItem {
  id: string;
  title: string;
  description: string;
  subject: string;
  subjectId?: string;
  university: string;
  collegeName?: string;
  collegeId?: string;
  degree: string;
  courseId?: string;
  branch: string;
  branchId?: string;
  semester: number;
  unitsCovered: string; // e.g. "Unit 1 - 5 (Complete)"
  unitId?: string;
  academicYear: string; // e.g. "2024-2025"
  price: number; // Set by author (any amount)
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  sellerRating: number;
  sellerRatingsCount: number;
  sellerVerified: boolean;
  sellerCollege: string;
  sellerYear: string; // e.g., "4th Year Finalist"
  totalPages: number;
  fileSizeMb: number;
  pdfUrl?: string;
  pdfData?: string;
  pdfFileName?: string;
  samplePages: NotePagePreview[];
  tags: string[];
  status: ListingStatus;
  adminFeedback?: string;
  salesCount: number;
  rating: number;
  reviewsCount: number;
  reviews: NoteReview[];
  featured?: boolean;
  hasPYQ: boolean;
  hasHandwrittenFormulas: boolean;
  textContent?: string; // Long textual content body provided by seller (notes body, lecture transcripts, detailed syllabus breakdown)
  aiSynopsis?: string; // Short AI-Generated Synopsis generated using Gemini API
  aiSynopsisGeneratedAt?: string;
  createdAt: string;
}

export type OrderStatus = 'completed' | 'pending_verification' | 'rejected' | 'failed' | 'refunded';

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  noteId: string;
  noteTitle: string;
  subject: string;
  university: string;
  collegeName?: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  amount: number; // Total paid in ₹
  sellerShare: number; // 80% in ₹
  platformShare: number; // 20% in ₹
  paymentMethod: 'phonepe' | 'upi_qr' | 'gpay' | 'paytm' | 'bhim' | 'cred' | 'upi_id';
  upiTransactionId: string; // 12-digit UTR / UPI Transaction Reference Number
  receiverName?: string; // "Raj Sambhaji Bhosale"
  paymentScreenshotUrl?: string; // Uploaded payment screenshot preview URL / base64
  status: OrderStatus;
  purchasedAt: string;
  watermarkText: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  userRated?: boolean;
  userRating?: number;
}

export interface WithdrawalRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  amount: number; // in ₹
  upiId: string;
  status: 'processing' | 'completed' | 'rejected';
  requestedAt: string;
  completedAt?: string;
  utrNumber?: string;
}

export interface ContentReport {
  id: string;
  noteId: string;
  noteTitle: string;
  reporterName: string;
  reporterEmail: string;
  reason: 'copyright_textbook' | 'coaching_material' | 'wrong_syllabus' | 'poor_quality' | 'other';
  details: string;
  status: 'pending' | 'resolved' | 'dismissed';
  reportedAt: string;
}

export interface FilterState {
  collegeId?: string;
  collegeName?: string;
  university: string;
  degree: string;
  courseId?: string;
  branch: string;
  branchId?: string;
  semester: string;
  subject: string;
  searchQuery: string;
  sortBy: 'popular' | 'rating' | 'price_low' | 'price_high' | 'newest';
  maxPrice: number;
  verifiedOnly: boolean;
  hasPYQOnly: boolean;
}

export interface MockEmail {
  id: string;
  toEmail: string;
  toName: string;
  recipientRole: UserRole;
  fromEmail: string;
  fromName: string;
  subject: string;
  category: 'approval' | 'purchase' | 'sale_alert' | 'payout' | 'rejection';
  previewSnippet: string;
  htmlContent: string;
  createdAt: string;
  isRead: boolean;
  meta?: {
    noteId?: string;
    noteTitle?: string;
    orderNumber?: string;
    amount?: number;
    sellerShare?: number;
    upiTransactionId?: string;
    reason?: string;
  };
}

export type AiSummaryMode = 'comprehensive' | 'exam_revision' | 'formulas_theorems' | 'pyq_viva' | 'quiz';

export interface AiSummaryQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface AiDocumentSummaryResult {
  id: string;
  title: string;
  subject?: string;
  university?: string;
  semester?: number | string;
  mode: AiSummaryMode;
  executiveSummary: string; // 2-3 sentence high-level overview
  coreConcepts: {
    topic: string;
    description: string;
    keyPoints: string[];
  }[];
  highYieldFormulasAndTheorems?: {
    name: string;
    formulaOrStatement: string;
    explanation: string;
  }[];
  examProbableQuestions: {
    question: string;
    marks: number; // e.g. 5 or 10 marks
    answerBulletPoints: string[];
  }[];
  keyTakeaways: string[];
  quiz?: AiSummaryQuizQuestion[];
  rawMarkdown?: string;
  generatedAt: string;
  sourceType: 'uploaded_doc' | 'pasted_notes' | 'marketplace_note';
  sourceFileName?: string;
  sourceNoteId?: string;
  wordCount?: number;
  model: string;
  isFallback?: boolean;
}

