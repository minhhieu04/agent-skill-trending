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
        return <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-[11px] font-mono">login</span>;
      case 'register':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[11px] font-mono">register</span>;
      case 'bookmark':
        return <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 text-[11px] font-mono">bookmark</span>;
      case 'unbookmark':
        return <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700 text-[11px] font-mono">unbookmark</span>;
      case 'trigger_collection':
        return <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 text-[11px] font-mono">trigger_collection</span>;
      case 'update_preferences':
        return <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 text-[11px] font-mono">update_preferences</span>;
      case 'collection_completed':
        return <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20 text-[11px] font-mono">collection_completed</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[11px] font-mono">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{t('history_title')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('history_sub')}
            </p>
          </div>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setSubTab('runs')}
            className={`px-4 py-2 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
              subTab === 'runs'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {t('subtab_runs')} ({runs.length})
          </button>
          <button
            onClick={() => setSubTab('audit')}
            className={`px-4 py-2 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
              subTab === 'audit'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-500" />
              {t('recent_runs')}
            </h3>
            <button
              onClick={() => refetchRuns()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('refresh')}</span>
            </button>
          </div>

          {loadingRuns ? (
            <TableSkeleton rows={4} />
          ) : runs.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 animate-fade-in">
              <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-float" />
              <p className="text-xs text-slate-500">{t('no_history_runs')}</p>
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-all duration-300 ease-spring hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${
                        run.status === 'completed' 
                          ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : run.status === 'running'
                          ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-spin'
                          : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
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
                        <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                          {t('scan_batch_prefix')}{run.id}
                        </span>
                        <span className="text-xs text-slate-400 ml-2 font-mono">
                          {t('run_by')} <strong className="text-slate-700 dark:text-slate-300">@{run.triggered_by}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(run.started_at)}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 font-mono text-[11px] font-bold">
                        +{run.total_new_skills} {t('new_skills')}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {run.total_updated_skills} {t('updated_skills')}
                      </span>
                    </div>
                  </div>

                  {run.summary && (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300">
                      {run.summary}
                    </div>
                  )}

                  {run.error_detail && (
                    <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/30 text-xs text-rose-700 dark:text-rose-300 font-mono">
                      {run.error_detail}
                    </div>
                  )}

                  {run.sources_summary && Object.keys(run.sources_summary).length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase font-mono mr-1">{t('sources')}</span>
                      {Object.entries(run.sources_summary).map(([src, stat]: [string, any]) => (
                        <span
                          key={src}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
                        >
                          {src}: <strong className="text-emerald-600 dark:text-emerald-400">{typeof stat === 'object' ? stat.total || 0 : stat}</strong>
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
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-500" />
              {t('audit_trail')}
            </h3>

            {/* Filter Actions */}
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
              >
                <option value="all">{t('all_actions')}</option>
                <option value="login">Login</option>
                <option value="register">Register</option>
                <option value="bookmark">Bookmark</option>
                <option value="trigger_collection">Trigger Collection</option>
                <option value="update_preferences">Update Preferences</option>
              </select>
            </div>
          </div>

          {loadingAudit ? (
            <TableSkeleton rows={5} />
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
              <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">{t('no_history_runs')}</p>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/80 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                      <th className="p-3.5 pl-5">{t('col_time')}</th>
                      <th className="p-3.5">{t('col_user')}</th>
                      <th className="p-3.5">{t('col_action')}</th>
                      <th className="p-3.5">{t('col_target')}</th>
                      <th className="p-3.5 pr-5">{t('col_detail')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 pl-5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                          @{log.username || 'guest'}
                        </td>
                        <td className="p-3.5">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                          {log.target_type ? `${log.target_type}${log.target_id ? ` #${log.target_id}` : ''}` : '-'}
                        </td>
                        <td className="p-3.5 pr-5 font-mono text-[10px] text-slate-600 dark:text-slate-400 max-w-xs truncate">
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
