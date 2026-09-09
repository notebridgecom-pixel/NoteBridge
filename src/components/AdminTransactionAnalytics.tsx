import React, { useState, useMemo } from 'react';
import { PurchaseOrder, User, WithdrawalRequest } from '../types';
import { BUSINESS_RULES } from '../utils/storage';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  IndianRupee, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  BarChart3, 
  Wallet, 
  Layers, 
  Users, 
  FileText, 
  Smartphone,
  Copy,
  Check,
  Building2,
  GraduationCap,
  Sparkles
} from 'lucide-react';

interface AdminTransactionAnalyticsProps {
  orders: PurchaseOrder[];
  withdrawals?: WithdrawalRequest[];
  users?: User[];
}

type TimeInterval = 'day' | 'month' | 'year' | 'all';

export const AdminTransactionAnalytics: React.FC<AdminTransactionAnalyticsProps> = ({
  orders,
  withdrawals = [],
  users = [],
}) => {
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>('day');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending_verification' | 'rejected'>('all');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const ONE_MONTH_MS = 30 * ONE_DAY_MS;
  const ONE_YEAR_MS = 365 * ONE_DAY_MS;

  // Filter orders by selected time window
  const timeFilteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = new Date(order.purchasedAt || order.createdAt || '').getTime();
      if (isNaN(orderDate)) return true;
      const diff = now - orderDate;

      if (selectedInterval === 'day') {
        return diff <= ONE_DAY_MS;
      }
      if (selectedInterval === 'month') {
        return diff <= ONE_MONTH_MS;
      }
      if (selectedInterval === 'year') {
        return diff <= ONE_YEAR_MS;
      }
      return true;
    });
  }, [orders, selectedInterval, now]);

  // Overall calculations for the chosen interval
  const completedOrders = useMemo(() => {
    return timeFilteredOrders.filter((o) => o.status === 'completed' || (o.status as string) === 'verified');
  }, [timeFilteredOrders]);

  const pendingOrders = useMemo(() => {
    return timeFilteredOrders.filter((o) => o.status === 'pending_verification');
  }, [timeFilteredOrders]);

  const rejectedOrders = useMemo(() => {
    return timeFilteredOrders.filter((o) => o.status === 'rejected');
  }, [timeFilteredOrders]);

  const periodGMV = useMemo(() => {
    return completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  }, [completedOrders]);

  const periodPlatformRevenue = Math.round(periodGMV * BUSINESS_RULES.PLATFORM_COMMISSION_RATE); // 20%
  const periodSeniorPayouts = Math.round(periodGMV * BUSINESS_RULES.SELLER_PAYOUT_RATE); // 80%
  const periodTxnCount = timeFilteredOrders.length;
  const avgOrderValue = completedOrders.length > 0 ? Math.round(periodGMV / completedOrders.length) : 0;
  const successRate = periodTxnCount > 0 ? Math.round((completedOrders.length / periodTxnCount) * 100) : 100;

  // Search and status filtered list for the table
  const displayOrders = useMemo(() => {
    return timeFilteredOrders.filter((order) => {
      if (statusFilter !== 'all' && (order.status || 'completed') !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesOrder = (order.orderNumber || '').toLowerCase().includes(q);
        const matchesBuyer = (order.buyerName || '').toLowerCase().includes(q) || (order.buyerEmail || '').toLowerCase().includes(q);
        const matchesNote = (order.noteTitle || '').toLowerCase().includes(q);
        const matchesSubject = (order.subject || '').toLowerCase().includes(q);
        const matchesUtr = (order.upiTransactionId || '').toLowerCase().includes(q);
        return matchesOrder || matchesBuyer || matchesNote || matchesSubject || matchesUtr;
      }
      return true;
    });
  }, [timeFilteredOrders, statusFilter, searchQuery]);

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard?.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2500);
  };

  const handleExportCSV = () => {
    const headers = ['Order Number', 'Date', 'Buyer Name', 'Buyer Email', 'Note Title', 'Subject', 'Amount (INR)', 'Platform (20%)', 'Seller (80%)', 'Payment Method', 'UTR Ref', 'Status'];
    const rows = displayOrders.map(o => [
      o.orderNumber,
      new Date(o.purchasedAt || o.createdAt || '').toLocaleString('en-IN'),
      `"${o.buyerName || 'Student'}"`,
      o.buyerEmail || '',
      `"${(o.noteTitle || '').replace(/"/g, '""')}"`,
      `"${o.subject || ''}"`,
      o.amount,
      o.platformShare || Math.round(o.amount * 0.2),
      o.sellerShare || Math.round(o.amount * 0.8),
      o.paymentMethod || 'PhonePe UPI',
      o.upiTransactionId || 'N/A',
      o.status || 'completed'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NoteBridge_Transactions_${selectedInterval.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Time Interval Selector Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-[11px] font-bold rounded-full">
                Financial Telemetry
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full flex items-center gap-1">
                <IndianRupee className="w-3 h-3 text-emerald-600" />
                <span>Live Reconciliation</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-1">
              Transaction Analytics &amp; Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Detailed transaction data breakdown for <strong>1 Day</strong>, <strong>1 Month</strong>, and <strong>1 Year</strong> across all student purchases.
            </p>
          </div>

          {/* Timeframe Pill Controls */}
          <div className="flex flex-wrap items-center bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200">
            <button
              onClick={() => setSelectedInterval('day')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedInterval === 'day'
                  ? 'bg-[#5f259f] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>1 Day (Today)</span>
            </button>

            <button
              onClick={() => setSelectedInterval('month')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedInterval === 'month'
                  ? 'bg-[#5f259f] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>1 Month (30D)</span>
            </button>

            <button
              onClick={() => setSelectedInterval('year')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedInterval === 'year'
                  ? 'bg-[#5f259f] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>1 Year (365D)</span>
            </button>

            <button
              onClick={() => setSelectedInterval('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedInterval === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Time ({orders.length})</span>
            </button>
          </div>
        </div>

        {/* 6 High-Precision KPI Cards for Selected Interval */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
          {/* Metric 1: Total Transactions */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              {selectedInterval === 'day' ? 'Today’s Txns' : selectedInterval === 'month' ? '30-Day Txns' : selectedInterval === 'year' ? '1-Year Txns' : 'Total Txns'}
            </span>
            <div className="text-2xl font-black text-slate-900 font-heading">
              {periodTxnCount}
            </div>
            <div className="text-[10px] text-slate-400">
              {completedOrders.length} successful • {pendingOrders.length} pending
            </div>
          </div>

          {/* Metric 2: Period GMV */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wide">
              Period Volume (GMV)
            </span>
            <div className="text-2xl font-black text-purple-950 font-heading">
              ₹{periodGMV}
            </div>
            <div className="text-[10px] text-purple-700">Gross student volume</div>
          </div>

          {/* Metric 3: NoteBridge Platform Cut (20%) */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">
              Platform Cut (20%)
            </span>
            <div className="text-2xl font-black text-blue-950 font-heading">
              ₹{periodPlatformRevenue}
            </div>
            <div className="text-[10px] text-blue-700">Payee: Raj Bhosale</div>
          </div>

          {/* Metric 4: Senior Author Cut (80%) */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide">
              Author Pool (80%)
            </span>
            <div className="text-2xl font-black text-emerald-950 font-heading">
              ₹{periodSeniorPayouts}
            </div>
            <div className="text-[10px] text-emerald-700">Credited to sellers</div>
          </div>

          {/* Metric 5: Average Order Value */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wide">
              Avg Order Value
            </span>
            <div className="text-2xl font-black text-amber-950 font-heading">
              ₹{avgOrderValue}
            </div>
            <div className="text-[10px] text-amber-700">Per study note purchase</div>
          </div>

          {/* Metric 6: Approval / Success Rate */}
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-rose-900 uppercase tracking-wide">
              Verification Rate
            </span>
            <div className="text-2xl font-black text-rose-950 font-heading">
              {successRate}%
            </div>
            <div className="text-[10px] text-rose-700">{rejectedOrders.length} flagged / rejected</div>
          </div>
        </div>
      </div>

      {/* Transaction Breakdown & Payment Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Transaction Timeline Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-700" />
              <h3 className="font-bold text-slate-900 text-sm">
                {selectedInterval === 'day' ? 'Today’s Hourly Flow' : selectedInterval === 'month' ? '30-Day Volume Trend' : selectedInterval === 'year' ? 'Annual Transaction Distribution' : 'All-Time Volume Distribution'}
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {completedOrders.length} Settled Orders
            </span>
          </div>

          {/* Graphical Representation */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Settled Student Purchases (Completed)</span>
              <span className="font-bold text-emerald-700">{completedOrders.length} transactions (₹{periodGMV})</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${periodTxnCount > 0 ? (completedOrders.length / periodTxnCount) * 100 : 100}%` }}
              />
              <div 
                className="bg-amber-400 h-full transition-all duration-500" 
                style={{ width: `${periodTxnCount > 0 ? (pendingOrders.length / periodTxnCount) * 100 : 0}%` }}
              />
              <div 
                className="bg-rose-400 h-full transition-all duration-500" 
                style={{ width: `${periodTxnCount > 0 ? (rejectedOrders.length / periodTxnCount) * 100 : 0}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-700">Completed ({completedOrders.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="text-slate-700">Pending Verification ({pendingOrders.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                <span className="text-slate-700">Rejected / Disputed ({rejectedOrders.length})</span>
              </div>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-2xl text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-purple-950">
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              <span>NoteBridge Financial Summary ({selectedInterval === 'day' ? '24 Hours' : selectedInterval === 'month' ? 'Last 30 Days' : selectedInterval === 'year' ? 'Last 365 Days' : 'Lifetime'})</span>
            </div>
            <p className="text-purple-800 text-[11px] leading-relaxed">
              All transactions are routed directly to official payee <strong>RAJ SAMBHAJI BHOSALE</strong> (UPI VPA: <code>8591587848@ybl</code>). Authors receive their 80% earnings pool (₹{periodSeniorPayouts}) automatically credited to their verified seller wallets.
            </p>
          </div>
        </div>

        {/* Right 1 Col: Channels & Stream Distribution */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Payment Channels &amp; Methods</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#5f259f] text-white flex items-center justify-center font-bold text-xs">
                  P
                </div>
                <div>
                  <div className="font-bold text-slate-900">PhonePe QR Standee</div>
                  <div className="text-[10px] text-slate-500">Scan &amp; Pay Camera Flow</div>
                </div>
              </div>
              <span className="font-mono font-bold text-slate-800">
                {timeFilteredOrders.filter(o => o.paymentMethod === 'upi_qr' || !o.paymentMethod).length} orders
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  @
                </div>
                <div>
                  <div className="font-bold text-slate-900">UPI ID Direct (VPA)</div>
                  <div className="text-[10px] text-slate-500">8591587848@ybl</div>
                </div>
              </div>
              <span className="font-mono font-bold text-slate-800">
                {timeFilteredOrders.filter(o => o.paymentMethod === 'upi_id').length} orders
              </span>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-emerald-950">Senior Seller Payout Claims</div>
                <div className="text-[10px] text-emerald-700">Withdrawals processed</div>
              </div>
              <span className="font-mono font-bold text-emerald-900">
                {withdrawals.length} claims
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Ledger Table with Period Filter */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {selectedInterval === 'day' ? 'Today’s Live Transaction Ledger' : selectedInterval === 'month' ? '30-Day Transaction Ledger' : selectedInterval === 'year' ? '1-Year Transaction History' : 'All-Time Master Transaction Ledger'}
            </h3>
            <p className="text-xs text-slate-500">
              Showing {displayOrders.length} of {timeFilteredOrders.length} transactions for the selected interval.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={displayOrders.length === 0}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              title="Download CSV report of filtered transactions"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Search and Status Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order #, buyer name, note title, UTR number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({timeFilteredOrders.length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800 hover:bg-emerald-100/60'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Completed ({completedOrders.length})</span>
            </button>
            <button
              onClick={() => setStatusFilter('pending_verification')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                statusFilter === 'pending_verification'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-800 hover:bg-amber-100/60'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Pending ({pendingOrders.length})</span>
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === 'rejected'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-100/60'
              }`}
            >
              Rejected ({rejectedOrders.length})
            </button>
          </div>
        </div>

        {/* Orders Table */}
        {displayOrders.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Order / Txn ID</th>
                  <th className="p-3.5">Date &amp; Time</th>
                  <th className="p-3.5">Buyer Student</th>
                  <th className="p-3.5">Purchased Note</th>
                  <th className="p-3.5">Amount (₹)</th>
                  <th className="p-3.5">Platform (20%)</th>
                  <th className="p-3.5">Seller (80%)</th>
                  <th className="p-3.5">Payment Mode &amp; UTR</th>
                  <th className="p-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayOrders.map((order) => {
                  const isCompleted = order.status === 'completed' || (order.status as string) === 'verified';
                  const isPending = order.status === 'pending_verification';
                  const isRejected = order.status === 'rejected';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          #{order.orderNumber || order.id}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div className="font-medium">
                          {new Date(order.purchasedAt || order.createdAt || '').toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(order.purchasedAt || order.createdAt || '').toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{order.buyerName || 'Student Buyer'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{order.buyerEmail || 'student@college.edu'}</div>
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <div className="font-bold text-slate-900 truncate" title={order.noteTitle}>
                          {order.noteTitle}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {order.subject} • {order.university || 'Mumbai University'}
                        </div>
                      </td>
                      <td className="p-3.5 font-black text-sm text-slate-900">
                        ₹{order.amount}
                      </td>
                      <td className="p-3.5 font-bold text-blue-700 text-xs">
                        ₹{order.platformShare || Math.round(order.amount * 0.2)}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-700 text-xs">
                        ₹{order.sellerShare || Math.round(order.amount * 0.8)}
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700 uppercase">
                            {order.paymentMethod === 'upi_id' ? 'UPI VPA' : 'PhonePe QR'}
                          </span>
                          {order.upiTransactionId && (
                            <div className="flex items-center gap-1 font-mono text-[10px] text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded max-w-fit">
                              <span>{order.upiTransactionId}</span>
                              <button
                                onClick={() => handleCopyUtr(order.upiTransactionId!)}
                                className="p-0.5 hover:text-purple-700 text-slate-400 rounded"
                                title="Copy UTR Number"
                              >
                                {copiedUtr === order.upiTransactionId ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full uppercase">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Completed</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-full uppercase animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending UTR</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-rose-100 text-rose-800 font-bold px-2.5 py-1 rounded-full uppercase">
                            <AlertCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700 text-sm">No transactions found for {selectedInterval === 'day' ? 'Today' : selectedInterval === 'month' ? 'the past 30 days' : 'the selected period'}.</p>
            <p className="text-slate-500">Student purchases via PhonePe UPI will automatically appear here with full commission breakdown.</p>
          </div>
        )}
      </div>
    </div>
  );
};
