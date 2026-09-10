import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { CollectionRun, AuditLogItem, AuditLogPageResponse, AuditStatsSummary } from '../types';
import { TableSkeleton } from '../components/Skeleton';
import { 
  History, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  RefreshCw, 
  Activity, 

  Filter,
  Search,
  Lock,
  Globe,
  Crown,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { NeuSelect } from '../components/NeuSelect';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { AuditLogCharts } from '../components/AuditLogCharts';
import { AuditLogDetailModal } from '../components/AuditLogDetailModal';

export const HistoryPage: React.FC = () => {
  const [subTab, setSubTab] = useState<'runs' | 'audit'>('runs');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [daysFilter, setDaysFilter] = useState<number>(7);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const { t } = useLanguage();
  const { user, allUsers } = useAuth();
  const queryClient = useQueryClient();

  // 1. Collection Runs Query
  const { data: runs = [], isLoading: loadingRuns, refetch: refetchRuns } = useQuery<CollectionRun[]>({
    queryKey: ['collectionRuns'],
    queryFn: () => api.getCollectionRuns(50),
  });

  // 2. Audit Stats Query
  const { data: stats, isLoading: loadingStats } = useQuery<AuditStatsSummary>({
    queryKey: ['auditStats', daysFilter, user?.id],
    queryFn: () => api.getAuditStats(daysFilter),
    enabled: Boolean(user),
  });

  // 3. Audit Logs Paginated Query
  const { 
    data: auditData, 
    isLoading: loadingAudit, 
    isFetching: fetchingAudit,
    refetch: refetchAudit 
  } = useQuery<AuditLogPageResponse>({
    queryKey: ['auditLogs', actionFilter, userFilter, sourceFilter, searchQuery, page, pageSize, user?.id, user?.is_admin],
    queryFn: () => api.getAuditLogs({
      action: actionFilter === 'all' ? undefined : actionFilter,
      username: user?.is_admin ? (userFilter === 'all' ? undefined : userFilter) : undefined,
      search: searchQuery.trim() || undefined,
      source: sourceFilter === 'all' ? undefined : sourceFilter,
      page,
      page_size: pageSize
    }),
    enabled: Boolean(user),
  });

  const auditLogs = auditData?.items || [];
  const totalAuditLogs = auditData?.total || 0;
  const totalPages = auditData?.total_pages || 1;

  const handleRefresh = () => {
    if (subTab === 'runs') {
      refetchRuns();
    } else {
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      queryClient.invalidateQueries({ queryKey: ['auditStats'] });
      refetchAudit();
    }
  };

  const handleOpenLogin = () => {
    window.dispatchEvent(new CustomEvent('open-login-modal'));
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    try {
      const utcString = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
      const d = new Date(utcString);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'login':
        return (
          <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-emerald-500 text-[11px] font-mono font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            login
          </span>
        );
      case 'login_failed':
        return (
          <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-rose-500 border border-rose-500/30 text-[11px] font-mono font-bold whitespace-nowrap shrink-0 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            login_failed
          </span>
        );
      case 'register':
        return (
          <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-teal-500 text-[11px] font-mono font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            register
          </span>
        );
      case 'bookmark':
        return (
          <span className="px-2.5 py-0.5 rounded-lg neu-primary text-white text-[11px] font-mono font-bold whitespace-nowrap shrink-0 inline-flex items-center gap-1 shadow-sm">
            bookmark
          </span>
        );
      case 'unbookmark':
        return (
          <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-amber-500 text-[11px] font-mono whitespace-nowrap shrink-0 inline-flex items-center gap-1">
            unbookmark
          </span>
        );
      case 'bookmark_bundle':
        return (
          <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-indigo-500 text-[11px] font-mono font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1">
            bundle_save
          </span>
        );
      case 'trigger_collection':
        return (
          <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-[var(--primary)] text-[11px] font-mono font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1">
            trigger_scan
          </span>
        );
      case 'collection_completed':
        return (
          <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-emerald-600 text-[11px] font-mono font-bold whitespace-nowrap shrink-0 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            scan_success
          </span>
        );
      case 'collection_failed':
        return (
          <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-red-500 border border-red-500/30 text-[11px] font-mono font-bold whitespace-nowrap shrink-0 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            scan_failed
          </span>
        );
      case 'quota_exceeded':
        return (
          <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-rose-600 border border-rose-500/40 text-[11px] font-mono font-bold whitespace-nowrap shrink-0 inline-flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            quota_429
          </span>
        );
      case 'update_preferences':
        return (
          <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-purple-500 text-[11px] font-mono font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1">
            update_pref
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-[var(--text-muted)] font-mono text-[11px] whitespace-nowrap shrink-0 inline-flex items-center">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl neu-flat flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)]">
              {t('history_title')}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {t('history_sub')}
            </p>
          </div>
        </div>

        {/* Sub-tab Switcher & Refresh Button */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="flex items-center p-1.5 rounded-2xl neu-inset text-xs gap-1">
            <button
              onClick={() => setSubTab('runs')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                subTab === 'runs'
                  ? 'neu-flat text-[var(--primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {t('subtab_runs')} ({runs.length})
            </button>
            <button
              onClick={() => setSubTab('audit')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                subTab === 'audit'
                  ? 'neu-flat text-[var(--primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {t('subtab_audit')} {user ? `(${totalAuditLogs})` : ''}
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-2xl neu-flat hover:neu-inset text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
            title={t('refresh')}
            aria-label={t('refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${fetchingAudit ? 'animate-spin text-[var(--primary)]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Subtab 1: Collection Runs */}
      {subTab === 'runs' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[var(--primary)]" />
              {t('recent_runs')}
            </h3>
          </div>

          {loadingRuns ? (
            <TableSkeleton rows={4} />
          ) : runs.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-3xl neu-inset">
              <Activity className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
              <p className="text-xs text-[var(--text-muted)]">{t('no_history_runs')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="p-4 sm:p-5 rounded-2xl neu-flat space-y-3 hover:translate-y-[-1px] transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {run.status === 'completed' ? (
                        <span className="w-7 h-7 rounded-xl neu-inset text-emerald-500 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      ) : run.status === 'running' ? (
                        <span className="w-7 h-7 rounded-xl neu-inset text-amber-500 flex items-center justify-center shrink-0">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        </span>
                      ) : (
                        <span className="w-7 h-7 rounded-xl neu-inset text-rose-500 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-4 h-4" />
                        </span>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--text-main)]">
                            {t('scan_batch_prefix')}{run.id}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            {t('run_by')} <strong className="text-[var(--text-main)] font-mono">@{run.triggered_by}</strong>
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(run.started_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="px-2.5 py-1 rounded-xl neu-inset-sm text-emerald-500 font-mono text-[11px] font-semibold">
                        +{run.total_new_skills} {t('new_skills')}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl neu-inset-sm text-amber-500 font-mono text-[11px] font-semibold">
                        ~{run.total_updated_skills} {t('updated_skills')}
                      </span>
                    </div>
                  </div>

                  {run.summary && (
                    <p className="text-xs text-[var(--text-muted)] bg-[var(--shadow-dark)]/5 p-2.5 rounded-xl">
                      {run.summary}
                    </p>
                  )}

                  {run.sources_summary && Object.keys(run.sources_summary).length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase mr-1">
                        {t('sources')}
                      </span>
                      {Object.entries(run.sources_summary).map(([src, stat]: [string, any]) => (
                        <span
                          key={src}
                          className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-[var(--text-muted)] font-mono text-[11px] whitespace-nowrap shrink-0 inline-flex items-center"
                        >
                          {src}: <strong className="text-[var(--text-main)] ml-1">{typeof stat === 'object' ? stat.total || 0 : stat}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Audit Logs */}
      {subTab === 'audit' && (
        <div className="space-y-6 animate-fade-in">
          {/* Unauthenticated Lock Screen */}
          {!user ? (
            <div className="p-8 sm:p-12 rounded-3xl neu-flat text-center max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl neu-inset text-[var(--primary)] flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-[var(--primary)]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-main)]">
                  {t('audit_login_required')}
                </h3>
                <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                  {t('audit_login_hint')}
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleOpenLogin}
                  className="px-6 py-2.5 rounded-2xl neu-primary text-white font-semibold text-xs transition-all hover:scale-105 shadow-md"
                >
                  {t('btn_login_now')}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Role Header Banner (Admin Master View) */}
              <div className="p-4 sm:p-5 rounded-2xl neu-inset flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl neu-flat flex items-center justify-center shrink-0 ${
                    user.is_admin ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {user.is_admin ? <Crown className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--text-main)]">
                        {user.is_admin ? t('audit_master_view') : t('audit_my_activity')}
                      </span>
                      <span className="px-2 py-0.5 rounded-md neu-inset text-[10px] font-mono text-[var(--text-muted)]">
                        @{user.username}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {user.is_admin 
                        ? 'Toàn quyền giám sát bảo mật, lỗi quota API và hoạt động của người dùng toàn hệ thống.'
                        : 'Hiển thị các thao tác bookmark, cập nhật sở thích và phiên làm việc của bạn.'}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-[var(--text-muted)] shrink-0 self-end sm:self-auto">
                  Tổng bản ghi: <strong className="text-[var(--text-main)]">{totalAuditLogs.toLocaleString()}</strong>
                </div>
              </div>

              {/* Visual Stats & Charts Dashboard */}
              <AuditLogCharts
                stats={stats}
                isLoading={loadingStats}
                days={daysFilter}
                onDaysChange={(d) => setDaysFilter(d)}
              />

              {/* Multi-Tier Filter & Search Controls */}
              <div className="p-4 sm:p-5 rounded-3xl neu-flat space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Bộ lọc nâng cao & Tìm kiếm</span>
                </div>

                <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${user.is_admin ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-3`}>
                  {/* Search input */}
                  <div className="sm:col-span-2 lg:col-span-2 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                      placeholder={t('search_audit_placeholder')}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl neu-inset bg-transparent text-[var(--text-main)] placeholder-[var(--text-muted)] outline-none transition-all focus:ring-1 focus:ring-[var(--primary)]/50"
                    />
                    <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5" />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setPage(1);
                        }}
                        className="absolute right-3 top-2.5 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filter Action */}
                  <NeuSelect
                    value={actionFilter}
                    onChange={(val) => {
                      setActionFilter(String(val));
                      setPage(1);
                    }}
                    options={[
                      { value: 'all', label: t('all_actions') },
                      { value: 'login', label: 'Login' },
                      { value: 'login_failed', label: 'Login Failed' },
                      { value: 'register', label: 'Register' },
                      { value: 'bookmark', label: 'Bookmark' },
                      { value: 'unbookmark', label: 'Unbookmark' },
                      { value: 'bookmark_bundle', label: 'Bookmark Bundle' },
                      { value: 'trigger_collection', label: 'Trigger Collection' },
                      { value: 'collection_completed', label: 'Collection Success' },
                      { value: 'collection_failed', label: 'Collection Failed' },
                      { value: 'quota_exceeded', label: 'Quota Exceeded (429)' },
                      { value: 'update_preferences', label: 'Update Preferences' },
                    ]}
                    icon={<Filter className="w-3.5 h-3.5" />}
                    size="sm"
                    variant="inset"
                    searchable={false}
                    title={t('filter_action')}
                  />

                  {/* Filter User (if Admin) */}
                  {user.is_admin && (
                    <NeuSelect
                      value={userFilter}
                      onChange={(val) => {
                        setUserFilter(String(val));
                        setPage(1);
                      }}
                      options={[
                        { value: 'all', label: t('all_users') },
                        ...allUsers.map((u) => ({ value: u.username, label: `@${u.username}` })),
                      ]}
                      icon={<Crown className="w-3.5 h-3.5" />}
                      size="sm"
                      variant="inset"
                      searchable={false}
                      title={t('filter_user')}
                    />
                  )}

                  {/* Filter Source (always available) */}
                  <NeuSelect
                    value={sourceFilter}
                    onChange={(val) => {
                      setSourceFilter(String(val));
                      setPage(1);
                    }}
                    options={[
                      { value: 'all', label: 'Tất cả nguồn' },
                      { value: 'gemini_ai', label: 'Gemini AI' },
                      { value: 'github', label: 'GitHub' },
                      { value: 'reddit', label: 'Reddit' },
                      { value: 'hackernews', label: 'HackerNews' },
                    ]}
                    icon={<Globe className="w-3.5 h-3.5" />}
                    size="sm"
                    variant="inset"
                    searchable={false}
                    title="Nguồn"
                  />

                  {/* Page Size */}
                  <NeuSelect
                    value={String(pageSize)}
                    onChange={(val) => {
                      setPageSize(Number(val));
                      setPage(1);
                    }}
                    options={[
                      { value: '20', label: '20 dòng / trang' },
                      { value: '50', label: '50 dòng / trang' },
                      { value: '100', label: '100 dòng / trang' },
                      { value: '200', label: '200 dòng / trang' },
                    ]}
                    size="sm"
                    variant="inset"
                    searchable={false}
                    title={t('page_size_label')}
                  />
                </div>
              </div>

              {/* Audit Log Table */}
              {loadingAudit ? (
                <TableSkeleton rows={8} />
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-16 p-6 rounded-3xl neu-inset">
                  <ShieldCheck className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-semibold text-[var(--text-main)]">Không tìm thấy bản ghi kiểm toán nào</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Thử nới lỏng bộ lọc hoặc xóa từ khóa tìm kiếm để xem thêm nhật ký.
                  </p>
                </div>
              ) : (
                <div className="rounded-3xl neu-flat overflow-hidden shadow-lg border border-[var(--shadow-dark)]/20">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--shadow-dark)]/20 shadow-[0_2px_4px_var(--shadow-dark)] bg-[var(--bg)] text-[var(--text-muted)] uppercase tracking-wider font-mono text-[10px]">
                          <th className="p-3.5 pl-5">{t('col_time')}</th>
                          <th className="p-3.5">{t('col_user')}</th>
                          <th className="p-3.5">{t('col_action')}</th>
                          <th className="p-3.5">{t('col_ip')}</th>
                          <th className="p-3.5">{t('col_target')}</th>
                          <th className="p-3.5">{t('col_detail')}</th>
                          <th className="p-3.5 pr-5 text-right">Chi tiết</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--shadow-dark)]/15 font-sans">
                        {auditLogs.map((log) => {
                          const isErrorRow = 
                            log.action === 'login_failed' ||
                            log.action === 'quota_exceeded' ||
                            log.action === 'collection_failed';

                          return (
                            <tr
                              key={log.id}
                              onClick={() => setSelectedLog(log)}
                              className={`group cursor-pointer transition-colors ${
                                isErrorRow 
                                  ? 'hover:bg-rose-500/5 bg-rose-500/[0.02]' 
                                  : 'hover:bg-[var(--shadow-dark)]/10'
                              }`}
                            >
                              {/* Timestamp */}
                              <td className="p-3.5 pl-5 font-mono text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                                <div className="text-[var(--text-main)] font-semibold">
                                  {formatDate(log.created_at)}
                                </div>
                              </td>

                              {/* User */}
                              <td className="p-3.5 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${
                                    log.username?.startsWith('system') 
                                      ? 'bg-purple-500' 
                                      : 'bg-emerald-500'
                                  }`} />
                                  <span className="font-bold text-[var(--text-main)] font-mono text-xs">
                                    @{log.username || 'guest'}
                                  </span>
                                </div>
                              </td>

                              {/* Action */}
                              <td className="p-3.5">
                                {getActionBadge(log.action)}
                              </td>

                              {/* IP Address */}
                              <td className="p-3.5 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-lg neu-inset-sm text-[11px] font-mono text-[var(--text-muted)]">
                                  {log.ip_address || '127.0.0.1'}
                                </span>
                              </td>

                              {/* Target */}
                              <td className="p-3.5 font-mono text-[var(--text-muted)] text-[11px] whitespace-nowrap">
                                {log.target_type ? `${log.target_type}${log.target_id ? ` #${log.target_id}` : ''}` : '—'}
                              </td>

                              {/* Detail Snippet */}
                              <td className="p-3.5 font-mono text-[10px] text-[var(--text-muted)] max-w-xs truncate">
                                {log.detail?.reason || log.detail?.error 
                                  ? <span className="text-rose-500 font-semibold">{log.detail.reason || log.detail.error}</span>
                                  : log.detail 
                                    ? JSON.stringify(log.detail) 
                                    : '—'}
                              </td>

                              {/* View Action Button */}
                              <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedLog(log);
                                  }}
                                  className="w-7 h-7 rounded-lg neu-flat group-hover:neu-inset flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-all ml-auto"
                                  title="Xem chi tiết"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Navigation Footer */}
                  <div className="p-4 border-t border-[var(--shadow-dark)]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="text-[var(--text-muted)] font-mono text-[11px]">
                      Hiển thị <strong>{totalAuditLogs > 0 ? (page - 1) * pageSize + 1 : 0}</strong> -{' '}
                      <strong>{Math.min(page * pageSize, totalAuditLogs)}</strong> trên{' '}
                      <strong>{totalAuditLogs.toLocaleString()}</strong> sự kiện
                      <span className="ml-2 font-normal text-[10px]">
                        (Trang {page} / {totalPages})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono">
                      {/* First Page */}
                      <button
                        onClick={() => setPage(1)}
                        disabled={page <= 1}
                        className="p-1.5 rounded-lg neu-flat hover:neu-inset disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
                        title="Trang đầu"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>

                      {/* Prev Page */}
                      <button
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        disabled={page <= 1}
                        className="px-2.5 py-1.5 rounded-lg neu-flat hover:neu-inset disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 transition-all"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>{t('btn_prev')}</span>
                      </button>

                      {/* Current Page Badge */}
                      <span className="px-3 py-1.5 rounded-lg neu-inset font-bold text-[var(--primary)] text-xs">
                        {page}
                      </span>

                      {/* Next Page */}
                      <button
                        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                        disabled={page >= totalPages}
                        className="px-2.5 py-1.5 rounded-lg neu-flat hover:neu-inset disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 transition-all"
                      >
                        <span>{t('btn_next')}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Last Page */}
                      <button
                        onClick={() => setPage(totalPages)}
                        disabled={page >= totalPages}
                        className="p-1.5 rounded-lg neu-flat hover:neu-inset disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
                        title="Trang cuối"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Log Detail Modal */}
              <AuditLogDetailModal
                log={selectedLog}
                onClose={() => setSelectedLog(null)}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};
