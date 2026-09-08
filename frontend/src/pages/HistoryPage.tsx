import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { CollectionRun, AuditLog } from '../types';
import { TableSkeleton } from '../components/Skeleton';
import { 
  History, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Activity,
  Calendar,
  Filter
} from 'lucide-react';
import { NeuSelect } from '../components/NeuSelect';
import { useLanguage } from '../context/LanguageContext';

export const HistoryPage: React.FC = () => {
  const [subTab, setSubTab] = useState<'runs' | 'audit'>('runs');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const { t } = useLanguage();

  const { data: runs = [], isLoading: loadingRuns, refetch: refetchRuns } = useQuery<CollectionRun[]>({
    queryKey: ['collectionRuns'],
    queryFn: () => api.getCollectionRuns(50),
  });

  const { data: auditLogs = [], isLoading: loadingAudit } = useQuery<AuditLog[]>({
    queryKey: ['auditLogs', actionFilter],
    queryFn: () => api.getAuditLogs({ action: actionFilter === 'all' ? undefined : actionFilter, limit: 100 }),
  });

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    try {
      // Ensure UTC string has Z if missing
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
        return <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-[var(--primary)] text-[11px] font-mono font-semibold">login</span>;
      case 'register':
        return <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-emerald-500 text-[11px] font-mono font-semibold">register</span>;
      case 'bookmark':
        return <span className="px-2.5 py-0.5 rounded-lg neu-primary text-white text-[11px] font-mono font-bold">bookmark</span>;
      case 'unbookmark':
        return <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-[var(--text-muted)] text-[11px] font-mono">unbookmark</span>;
      case 'trigger_collection':
        return <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-[var(--primary)] text-[11px] font-mono font-semibold">trigger_collection</span>;
      case 'update_preferences':
        return <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-[var(--primary)] text-[11px] font-mono font-semibold">update_preferences</span>;
      case 'collection_completed':
        return <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-emerald-500 text-[11px] font-mono font-semibold">collection_completed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-[var(--text-muted)] font-mono text-[11px]">{action}</span>;
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
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)]">{t('history_title')}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {t('history_sub')}
            </p>
          </div>
        </div>

        {/* Sub-tab Switcher */}
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
            {t('subtab_audit')} ({auditLogs.length})
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
            <button
              onClick={() => refetchRuns()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold neu-btn text-[var(--text-main)] hover:text-[var(--primary)] transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t('refresh')}</span>
            </button>
          </div>

          {loadingRuns ? (
            <TableSkeleton rows={4} />
          ) : runs.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-3xl neu-inset">
              <Activity className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
              <p className="text-xs text-[var(--text-muted)]">{t('no_history_runs')}</p>
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="p-5 rounded-3xl neu-flat space-y-3 transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-[var(--shadow-dark)]/20">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl neu-inset ${
                        run.status === 'completed' 
                          ? 'text-emerald-500' 
                          : run.status === 'running'
                          ? 'text-amber-500 animate-spin'
                          : 'text-rose-500'
                      }`}>
                        {run.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : run.status === 'running' ? (
                          <RefreshCw className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-[var(--text-main)] text-sm">
                          {t('scan_batch_prefix')}{run.id}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] ml-2 font-mono">
                          {t('run_by')} <strong className="text-[var(--text-main)] font-semibold">@{run.triggered_by}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs">
                      <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-mono">
                        <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
                        <span>{formatDate(run.started_at)}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-emerald-500 font-mono font-semibold text-[11px]">
                        +{run.total_new_skills} {t('new_skills')}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-[var(--text-muted)] font-mono text-[11px]">
                        {run.total_updated_skills} {t('updated_skills')}
                      </span>
                    </div>
                  </div>

                  {run.summary && (
                    <div className="p-3 rounded-2xl neu-inset text-xs text-[var(--text-main)]">
                      {run.summary}
                    </div>
                  )}

                  {run.error_detail && (
                    <div className="p-3 rounded-2xl neu-inset text-xs text-rose-500 font-mono">
                      {run.error_detail}
                    </div>
                  )}

                  {run.sources_summary && Object.keys(run.sources_summary).length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase mr-1">{t('sources')}</span>
                      {Object.entries(run.sources_summary).map(([src, stat]: [string, any]) => (
                        <span
                          key={src}
                          className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-[var(--text-muted)] font-mono text-[11px]"
                        >
                          {src}: <strong className="text-[var(--text-main)]">{typeof stat === 'object' ? stat.total || 0 : stat}</strong>
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
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary)]" />
              {t('audit_trail')}
            </h3>

            {/* Filter Actions */}
            <NeuSelect
              value={actionFilter}
              onChange={(val) => setActionFilter(String(val))}
              options={[
                { value: 'all', label: t('all_actions') },
                { value: 'login', label: 'Login' },
                { value: 'register', label: 'Register' },
                { value: 'bookmark', label: 'Bookmark' },
                { value: 'trigger_collection', label: 'Trigger Collection' },
                { value: 'update_preferences', label: 'Update Preferences' },
              ]}
              icon={<Filter className="w-3.5 h-3.5" />}
              size="sm"
              variant="inset"
              searchable={false}
              title={t('all_actions')}
            />
          </div>

          {loadingAudit ? (
            <TableSkeleton rows={5} />
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-3xl neu-inset">
              <ShieldCheck className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
              <p className="text-xs text-[var(--text-muted)]">{t('no_history_runs')}</p>
            </div>
          ) : (
            <div className="rounded-3xl neu-flat overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--shadow-dark)]/20 shadow-[0_2px_4px_var(--shadow-dark)] bg-[var(--bg)] text-[var(--text-muted)] uppercase tracking-wider font-mono text-[10px]">
                      <th className="p-3.5 pl-5">{t('col_time')}</th>
                      <th className="p-3.5">{t('col_user')}</th>
                      <th className="p-3.5">{t('col_action')}</th>
                      <th className="p-3.5">{t('col_target')}</th>
                      <th className="p-3.5 pr-5">{t('col_detail')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--shadow-dark)]/15 font-sans">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[var(--shadow-dark)]/10 transition-colors">
                        <td className="p-3.5 pl-5 font-mono text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="p-3.5 font-bold text-[var(--text-main)]">
                          @{log.username || 'guest'}
                        </td>
                        <td className="p-3.5">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="p-3.5 font-mono text-[var(--text-muted)] text-[11px]">
                          {log.target_type ? `${log.target_type}${log.target_id ? ` #${log.target_id}` : ''}` : '-'}
                        </td>
                        <td className="p-3.5 pr-5 font-mono text-[10px] text-[var(--text-muted)] max-w-xs truncate">
                          {log.detail ? JSON.stringify(log.detail) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
