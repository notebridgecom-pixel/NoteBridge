import { SecurityLog, SecurityLogAction, SecurityLogCategory, SecurityLogSeverity, UserRole } from '../types';

const STORAGE_KEY = 'notebridge_security_logs_v2';

const INITIAL_SECURITY_LOGS: SecurityLog[] = [
  {
    id: 'sec-log-101',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    action: 'qr_config_updated',
    category: 'system_security',
    severity: 'info',
    performedBy: 'Raj Sambhaji Bhosale (Admin)',
    performedByRole: 'admin',
    targetType: 'qr_config',
    targetId: 'phonepe-standee-v1',
    targetLabel: 'PhonePe Merchant Standee QR Configuration',
    details: 'Verified manual PhonePe UPI payment receiver: RAJ SAMBHAJI BHOSALE (8591587848@ybl) with high-density dynamic QR generation.',
    metadata: {
      receiver: 'RAJ SAMBHAJI BHOSALE',
      upiId: '8591587848@ybl',
      channel: 'PhonePe Official Standee',
    },
    ipAddress: '103.24.12.89 (Mumbai, MH)',
    deviceInfo: 'Chrome 128 / macOS NoteBridge Admin Console',
  },
  {
    id: 'sec-log-102',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    action: 'branch_created',
    category: 'catalog_management',
    severity: 'info',
    performedBy: 'Raj Sambhaji Bhosale (Admin)',
    performedByRole: 'admin',
    targetType: 'catalog',
    targetId: 'catalog-root',
    targetLabel: 'Academic Catalog Core Hierarchy',
    details: 'Initialized institutions: Vidyalankar Engineering College (Mumbai University) and Vidyalankar Polytechnic (MSBTE) with Department Semesters.',
    metadata: {
      colleges: 'VEC & VPT',
      university: 'Mumbai University & MSBTE',
      status: 'Active',
    },
    ipAddress: '103.24.12.89 (Mumbai, MH)',
    deviceInfo: 'Chrome 128 / macOS NoteBridge Admin Console',
  },
  {
    id: 'sec-log-103',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    action: 'admin_login',
    category: 'system_security',
    severity: 'info',
    performedBy: 'Raj Sambhaji Bhosale (Admin)',
    performedByRole: 'admin',
    targetType: 'system',
    targetId: 'auth-session-001',
    targetLabel: 'Admin Console Authentication',
    details: 'Master administrator session authenticated with role-based access control and encrypted token integrity.',
    metadata: {
      adminEmail: 'rajbhosaletkd@gmail.com',
      scope: 'full_platform_access',
    },
    ipAddress: '103.24.12.89 (Mumbai, MH)',
    deviceInfo: 'Chrome 128 / macOS NoteBridge Admin Console',
  },
];

export function getStoredSecurityLogs(): SecurityLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SECURITY_LOGS));
      return INITIAL_SECURITY_LOGS;
    }
    const parsed: SecurityLog[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SECURITY_LOGS;
  } catch (e) {
    console.error('Failed to load security logs', e);
    return INITIAL_SECURITY_LOGS;
  }
}

export function saveSecurityLogs(logs: SecurityLog[]): void {
  try {
    // Keep max 250 most recent logs to avoid unbounded storage growth
    const trimmed = logs.slice(0, 250);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save security logs', e);
  }
}

export interface LogSecurityParams {
  action: SecurityLogAction;
  category: SecurityLogCategory;
  severity?: SecurityLogSeverity;
  performedBy?: string;
  performedByRole?: UserRole | 'system';
  targetType: SecurityLog['targetType'];
  targetId: string;
  targetLabel: string;
  details: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export function logSecurityEvent(params: LogSecurityParams): SecurityLog {
  const currentLogs = getStoredSecurityLogs();

  const newLog: SecurityLog = {
    id: `sec-log-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: new Date().toISOString(),
    action: params.action,
    category: params.category,
    severity: params.severity || 'info',
    performedBy: params.performedBy || 'Raj Sambhaji Bhosale (Admin)',
    performedByRole: params.performedByRole || 'admin',
    targetType: params.targetType,
    targetId: params.targetId,
    targetLabel: params.targetLabel,
    details: params.details,
    metadata: params.metadata,
    ipAddress: '103.24.12.89 (Mumbai, MH)',
    deviceInfo: 'Chrome / NoteBridge Admin Console',
  };

  const updatedLogs = [newLog, ...currentLogs];
  saveSecurityLogs(updatedLogs);
  return newLog;
}

export function clearSecurityLogs(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to clear security logs', e);
  }
}

export function exportSecurityLogsAsCsv(logs: SecurityLog[]): void {
  const headers = ['Log ID', 'Timestamp', 'Action', 'Category', 'Severity', 'Performed By', 'Target Type', 'Target ID', 'Target Label', 'Details', 'IP Address'];
  
  const csvRows = logs.map((log) => [
    `"${log.id}"`,
    `"${log.timestamp}"`,
    `"${log.action}"`,
    `"${log.category}"`,
    `"${log.severity}"`,
    `"${log.performedBy}"`,
    `"${log.targetType}"`,
    `"${log.targetId}"`,
    `"${log.targetLabel.replace(/"/g, '""')}"`,
    `"${log.details.replace(/"/g, '""')}"`,
    `"${log.ipAddress || ''}"`,
  ].join(','));

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `notebridge_security_audit_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
