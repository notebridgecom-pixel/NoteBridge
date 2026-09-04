import React, { useState, useMemo } from 'react';
import { User, UserRole } from '../types';
import { 
  Users, 
  UserCheck, 
  GraduationCap, 
  Building2, 
  ShieldCheck, 
  Search, 
  Filter, 
  UserX, 
  Crown, 
  ShieldAlert, 
  Award, 
  Mail, 
  Phone, 
  BookOpen, 
  CheckCircle2, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  School
} from 'lucide-react';

interface AdminAccountsOverviewProps {
  users: User[];
  isMasterAdmin: boolean;
  currentUser?: User | null;
  onToggleBlockUser: (user: User) => void;
  onChangeUserRole: (user: User, newRole: UserRole) => void;
  onToggleSeniorVerification: (user: User) => void;
  onDeleteUserModal: (user: User) => void;
}

export const AdminAccountsOverview: React.FC<AdminAccountsOverviewProps> = ({
  users,
  isMasterAdmin,
  currentUser,
  onToggleBlockUser,
  onChangeUserRole,
  onToggleSeniorVerification,
  onDeleteUserModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'buyer' | 'seller' | 'moderator' | 'admin'>('all');
  const [streamFilter, setStreamFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');

  // Key platform account counts
  const totalAccountsCount = users.length;
  
  // Active students: students who are not blocked and are either buyers, sellers, or standard students
  const activeStudents = useMemo(() => {
    return users.filter(u => !u.isBlocked && (u.role === 'buyer' || u.role === 'seller' || !u.role));
  }, [users]);

  const activeStudentsCount = activeStudents.length;
  const verifiedSellersCount = users.filter(u => u.isVerifiedSenior || u.role === 'seller').length;
  const staffAccountsCount = users.filter(u => u.role === 'admin' || u.role === 'moderator').length;
  const blockedAccountsCount = users.filter(u => u.isBlocked).length;

  // Stream breakdown calculations (Diploma, B.Tech, BCA, B.Sc, MCA, etc.)
  const streamBreakdown = useMemo(() => {
    const counts: { [key: string]: number } = {
      'Diploma': 0,
      'B.Tech / B.E.': 0,
      'BCA': 0,
      'B.Sc Computer Science / IT': 0,
      'M.Tech / M.E.': 0,
      'MCA': 0,
      'Other Streams': 0,
    };

    users.forEach((u) => {
      const deg = u.degree || '';
      if (deg.toLowerCase().includes('diploma')) {
        counts['Diploma']++;
      } else if (deg.toLowerCase().includes('b.tech') || deg.toLowerCase().includes('b.e')) {
        counts['B.Tech / B.E.']++;
      } else if (deg.toLowerCase().includes('bca')) {
        counts['BCA']++;
      } else if (deg.toLowerCase().includes('b.sc') || deg.toLowerCase().includes('bsc')) {
        counts['B.Sc Computer Science / IT']++;
      } else if (deg.toLowerCase().includes('m.tech') || deg.toLowerCase().includes('m.e')) {
        counts['M.Tech / M.E.']++;
      } else if (deg.toLowerCase().includes('mca')) {
        counts['MCA']++;
      } else {
        counts['Other Streams']++;
      }
    });

    return counts;
  }, [users]);

  // Branch breakdown (Computer, Telecommunication Engineering (TE), IT, AI&DS, ME, CE, EE)
  const branchBreakdown = useMemo(() => {
    const counts: { [key: string]: number } = {};
    users.forEach((u) => {
      let b = u.branch || 'General';
      if (b.toLowerCase().includes('telecom') || b.toLowerCase().includes('te') || b.toLowerCase().includes('extc') || b.toLowerCase().includes('entc')) {
        b = 'Telecommunication Engineering (TE)';
      } else if (b.toLowerCase().includes('computer') || b.toLowerCase().includes('cmpn') || b.toLowerCase().includes('co')) {
        b = 'Computer Engineering (CO / CMPN)';
      } else if (b.toLowerCase().includes('information tech') || b.toLowerCase().includes('it') || b.toLowerCase().includes('if')) {
        b = 'Information Technology (IT / IF)';
      } else if (b.toLowerCase().includes('ai') || b.toLowerCase().includes('data science')) {
        b = 'AI & Data Science (AI & DS)';
      }
      counts[b] = (counts[b] || 0) + 1;
    });
    return counts;
  }, [users]);

  // Filtered users for registry table
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter === 'active' && u.isBlocked) return false;
      if (statusFilter === 'blocked' && !u.isBlocked) return false;

      if (streamFilter !== 'all') {
        const d = (u.degree || '').toLowerCase();
        if (streamFilter === 'diploma' && !d.includes('diploma')) return false;
        if (streamFilter === 'btech' && !d.includes('b.tech') && !d.includes('b.e')) return false;
        if (streamFilter === 'bca' && !d.includes('bca')) return false;
        if (streamFilter === 'bsc' && !d.includes('b.sc') && !d.includes('bsc')) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (u.name || '').toLowerCase().includes(q);
        const matchesEmail = (u.email || '').toLowerCase().includes(q);
        const matchesCollege = (u.college || '').toLowerCase().includes(q);
        const matchesBranch = (u.branch || '').toLowerCase().includes(q);
        const matchesPhone = (u.phone || '').toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesCollege || matchesBranch || matchesPhone;
      }
      return true;
    });
  }, [users, roleFilter, streamFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Metric Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full">
                User Registry &amp; Student Demographics
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-600" />
                <span>{activeStudentsCount} Active Students</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-1">
              Registered Accounts &amp; Academic Streams
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Complete directory of student accounts, academic streams (Diploma, B.Tech, etc.), branches, and staff role permissions in NoteBridge.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl text-xs">
            <School className="w-4 h-4 text-purple-700" />
            <span className="font-bold text-slate-700">Total Registered: <strong className="text-slate-950 font-black text-sm">{totalAccountsCount}</strong></span>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Students */}
          <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wide">
                Active Number of Students
              </span>
              <UserCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-blue-950 font-heading">
              {activeStudentsCount}
            </div>
            <div className="text-[11px] text-blue-700 font-medium">
              {totalAccountsCount > 0 ? Math.round((activeStudentsCount / totalAccountsCount) * 100) : 0}% of all registered users
            </div>
          </div>

          {/* Total Registered Accounts */}
          <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50/50 border border-purple-200/80 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wide">
                Total Registered Accounts
              </span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-3xl font-black text-purple-950 font-heading">
              {totalAccountsCount}
            </div>
            <div className="text-[11px] text-purple-700 font-medium">
              Across all universities &amp; polytechnics
            </div>
          </div>

          {/* Verified Senior Authors */}
          <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide">
                Senior Note Creators
              </span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-950 font-heading">
              {verifiedSellersCount}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">
              Verified toppers &amp; study authors
            </div>
          </div>

          {/* Moderation & Admin Staff */}
          <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
                Platform Admin &amp; Staff
              </span>
              <ShieldCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-3xl font-black text-amber-950 font-heading">
              {staffAccountsCount}
            </div>
            <div className="text-[11px] text-amber-700 font-medium">
              Master Admin: Raj Sambhaji Bhosale
            </div>
          </div>
        </div>
      </div>

      {/* Stream & Branch Demographics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Stream Breakdown (Diploma, B.Tech, BCA, B.Sc) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Academic Stream Breakdown
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              Diploma &amp; Degree Programs
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(streamBreakdown).map(([streamName, count]) => {
              const numCount = Number(count) || 0;
              const pct = totalAccountsCount > 0 ? Math.round((numCount / totalAccountsCount) * 100) : 0;
              return (
                <div key={streamName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{streamName}</span>
                    <span className="font-mono text-slate-500">{numCount} students ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        streamName === 'Diploma' ? 'bg-purple-600' :
                        streamName === 'B.Tech / B.E.' ? 'bg-blue-600' :
                        streamName === 'BCA' ? 'bg-emerald-500' :
                        streamName === 'B.Sc Computer Science / IT' ? 'bg-amber-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Branch / Department Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Branch &amp; Department Distribution
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              Engineering &amp; Polytechnic
            </span>
          </div>

          <div className="space-y-2.5 pt-1 max-h-64 overflow-y-auto pr-1">
            {Object.entries(branchBreakdown).map(([branchName, count]) => {
              const isTE = branchName.includes('Telecommunication') || branchName.includes('TE');
              const isCO = branchName.includes('Computer');
              return (
                <div key={branchName} className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition ${
                  isTE ? 'bg-purple-50/60 border-purple-200' : isCO ? 'bg-blue-50/60 border-blue-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{branchName}</span>
                      {isTE && (
                        <span className="px-1.5 py-0.2 bg-purple-200 text-purple-900 text-[9px] font-black rounded uppercase">
                          TE Branch
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500">Student accounts enrolled</div>
                  </div>
                  <span className="font-mono font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {count} accounts
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full Registered Accounts Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Registered Accounts Directory
            </h3>
            <p className="text-xs text-slate-500">
              Showing {filteredUsers.length} of {totalAccountsCount} user accounts registered on NoteBridge.
            </p>
          </div>

          {/* Quick Stream Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setStreamFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                streamFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Streams
            </button>
            <button
              onClick={() => setStreamFilter('diploma')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                streamFilter === 'diploma' ? 'bg-purple-700 text-white' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
              }`}
            >
              Diploma ({streamBreakdown['Diploma'] || 0})
            </button>
            <button
              onClick={() => setStreamFilter('btech')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                streamFilter === 'btech' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
            >
              B.Tech / B.E. ({streamBreakdown['B.Tech / B.E.'] || 0})
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, email, college, or branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Roles</option>
              <option value="buyer">Student Buyers</option>
              <option value="seller">Senior Sellers</option>
              <option value="moderator">Moderators</option>
              <option value="admin">Admins</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Accounts Only</option>
              <option value="blocked">Suspended Only</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Student Account</th>
                  <th className="p-3.5">Stream / Degree</th>
                  <th className="p-3.5">Branch / Department</th>
                  <th className="p-3.5">College / University</th>
                  <th className="p-3.5">Role &amp; Status</th>
                  <th className="p-3.5">Wallet / Earnings</th>
                  <th className="p-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const isBlocked = user.isBlocked;
                  const isPrimaryAdmin = user.email.toLowerCase() === 'rajbhosaletkd@gmail.com';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {user.name ? user.name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isPrimaryAdmin && (
                                <Crown className="w-3.5 h-3.5 text-amber-500" title="Master Admin" />
                              )}
                              {user.isVerifiedSenior && (
                                <Award className="w-3.5 h-3.5 text-blue-600" title="Verified Senior" />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-800">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          (user.degree || '').toLowerCase().includes('diploma')
                            ? 'bg-purple-100 text-purple-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}>
                          {user.degree || 'B.Tech / B.E.'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">
                          {user.branch || 'Computer Engineering'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Sem {user.semester || 4}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate" title={user.college || user.university}>
                        {user.college || user.university || 'Mumbai University (MU)'}
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            user.role === 'admin' ? 'bg-purple-700 text-white' :
                            user.role === 'moderator' ? 'bg-amber-600 text-white' :
                            user.role === 'seller' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-800'
                          }`}>
                            {user.role || 'buyer'}
                          </span>
                          <div>
                            {isBlocked ? (
                              <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                                Suspended
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                                Active Student
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">
                          ₹{user.walletBalance || 0}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Total: ₹{user.totalEarnings || 0}
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Block/Unblock toggle */}
                          {!isPrimaryAdmin && (
                            <button
                              onClick={() => onToggleBlockUser(user)}
                              className={`p-1.5 rounded-lg text-xs font-bold transition ${
                                isBlocked 
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              }`}
                              title={isBlocked ? 'Restore Account' : 'Suspend Account'}
                            >
                              {isBlocked ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {/* Senior Verified Toggle */}
                          <button
                            onClick={() => onToggleSeniorVerification(user)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition ${
                              user.isVerifiedSenior 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title={user.isVerifiedSenior ? 'Revoke Senior Badge' : 'Grant Verified Senior Badge'}
                          >
                            <Award className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700 text-sm">No student accounts matched your query.</p>
            <p className="text-slate-500">Try changing the stream or search filter above.</p>
          </div>
        )}
      </div>
    </div>
  );
};
