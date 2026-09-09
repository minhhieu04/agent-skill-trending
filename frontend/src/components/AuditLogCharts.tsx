import React, { useState } from 'react';
import { AuditStatsSummary } from '../types';
import { Activity, CheckCircle2, AlertTriangle, Users, BarChart3, PieChart, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AuditLogChartsProps {
  stats?: AuditStatsSummary;
  isLoading: boolean;
  days: number;
  onDaysChange: (days: number) => void;
}

const ACTION_COLOR_MAP: Record<string, string> = {
  login: 'bg-emerald-500',
  login_failed: 'bg-rose-500',
  register: 'bg-teal-500',
  bookmark: 'bg-[var(--primary)]',
  unbookmark: 'bg-amber-500',
  bookmark_bundle: 'bg-indigo-500',
  trigger_collection: 'bg-blue-500',
  collection_completed: 'bg-emerald-600',
  collection_failed: 'bg-red-600',
  quota_exceeded: 'bg-rose-600',
  update_preferences: 'bg-purple-500',
  gemini_categorizer: 'bg-cyan-500',
};

export const AuditLogCharts: React.FC<AuditLogChartsProps> = ({
  stats,
  isLoading,
  days,
  onDaysChange,
}) => {
  const { t } = useLanguage();
  const [hoveredDay, setHoveredDay] = useState<{ date: string; total: number; success: number; error: number } | null>(null);

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-2xl neu-flat h-24" />
        ))}
      </div>
    );
  }

  const timeline = stats.daily_timeline || [];
  const maxDayTotal = Math.max(...timeline.map((d) => d.total), 5);

  return (
    <div className="space-y-4">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Events */}
        <div className="p-4 rounded-2xl neu-flat flex items-center gap-3 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl neu-inset text-[var(--primary)] flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              {t('stat_total_events')}
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--text-main)]">
              {stats.total_events.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="p-4 rounded-2xl neu-flat flex items-center gap-3 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl neu-inset text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              {t('stat_success_rate')}
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-500">
              {(100 - stats.error_rate_percent).toFixed(1)}%
            </div>
            <div className="text-[10px] text-[var(--text-muted)] font-mono">
              {stats.success_count} thành công
            </div>
          </div>
        </div>

        {/* Error Count */}
        <div className="p-4 rounded-2xl neu-flat flex items-center gap-3 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl neu-inset text-rose-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              {t('stat_error_count')}
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-rose-500">
              {stats.failed_count}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] font-mono">
              {stats.quota_exceeded_count > 0 ? `${stats.quota_exceeded_count} 429 Quota` : 'Hệ thống ổn định'}
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="p-4 rounded-2xl neu-flat flex items-center gap-3 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl neu-inset text-indigo-500 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              {t('stat_active_users')}
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--text-main)]">
              {stats.active_users_count}
            </div>
          </div>
        </div>
      </div>

      {/* Quota Error Alert Callout (if any recent error occurred) */}
      {stats.most_recent_quota_error && (
        <div className="p-4 rounded-2xl neu-inset border border-rose-500/20 bg-rose-500/5 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <span>Sự cố Quota gần nhất ({stats.most_recent_quota_source || 'Gemini AI'})</span>
            </div>
            <div className="font-mono text-[11px] text-[var(--text-muted)]">
              {stats.most_recent_quota_error}
            </div>
          </div>
        </div>
      )}

      {/* Chart Section: Pure SVG Timeline & Action Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-3xl neu-flat space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
              <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--text-main)] font-bold">
                {t('chart_activity_timeline')}
              </h4>
            </div>

            {/* Days selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl neu-inset text-[11px] font-mono">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => onDaysChange(d)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    days === d
                      ? 'neu-flat font-bold text-[var(--primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="relative pt-2">
            {hoveredDay && (
              <div className="absolute top-0 right-2 px-2.5 py-1 rounded-lg neu-inset text-[10px] font-mono text-[var(--text-main)] z-10 flex items-center gap-2">
                <span className="font-bold">{hoveredDay.date}</span>
                <span className="text-emerald-500">{hoveredDay.success} OK</span>
                {hoveredDay.error > 0 && <span className="text-rose-500">{hoveredDay.error} Lỗi</span>}
                <span className="text-[var(--text-muted)]">Tổng: {hoveredDay.total}</span>
              </div>
            )}

            <div className="p-3 sm:p-4 rounded-2xl neu-inset overflow-x-auto">
              <div className="min-w-[320px] h-40 flex items-end justify-between gap-1.5 sm:gap-2 pt-6">
                {timeline.map((day) => {
                  const totalHeight = Math.max((day.total / maxDayTotal) * 100, 6);
                  const errorHeight = day.total > 0 ? (day.error / day.total) * 100 : 0;
                  const successHeight = 100 - errorHeight;
                  const shortDate = day.date.slice(5); // MM-DD

                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      <div className="text-[9px] font-mono text-[var(--text-muted)] mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {day.total}
                      </div>

                      {/* Stacked Bar */}
                      <div
                        className="w-full max-w-[28px] rounded-lg overflow-hidden flex flex-col justify-end transition-all duration-300 group-hover:scale-105 group-hover:brightness-110 shadow-sm"
                        style={{ height: `${totalHeight}%` }}
                      >
                        {day.error > 0 && (
                          <div
                            className="w-full bg-rose-500"
                            style={{ height: `${errorHeight}%` }}
                          />
                        )}
                        <div
                          className="w-full bg-emerald-500"
                          style={{ height: `${successHeight}%` }}
                        />
                      </div>

                      <span className="text-[10px] font-mono text-[var(--text-muted)] mt-2 group-hover:text-[var(--text-main)] group-hover:font-bold">
                        {shortDate}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-3 text-[11px] font-mono text-[var(--text-muted)]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Thành công</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>Lỗi / Vượt Quota</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Distribution Breakdown */}
        <div className="p-5 rounded-3xl neu-flat space-y-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[var(--primary)]" />
            <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--text-main)] font-bold">
              {t('chart_action_breakdown')}
            </h4>
          </div>

          <div className="space-y-3 pt-1">
            {stats.action_distribution.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">Chưa có dữ liệu hành động</p>
            ) : (
              stats.action_distribution.slice(0, 6).map((item) => {
                const colorClass = ACTION_COLOR_MAP[item.action] || 'bg-[var(--primary)]';
                return (
                  <div key={item.action} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-mono text-[11px] text-[var(--text-main)] font-medium truncate max-w-[150px]">
                        {item.label}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--text-muted)]">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full neu-inset overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                        style={{ width: `${Math.max(item.percentage, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
