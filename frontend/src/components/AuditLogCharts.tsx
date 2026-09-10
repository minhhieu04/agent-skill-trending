import React from 'react';
import { AuditLogStats } from '../types';
import { Activity, CheckCircle2, AlertTriangle, Globe } from 'lucide-react';

interface AuditLogChartsProps {
  stats: AuditLogStats | undefined;
  isLoading: boolean;
}

export const AuditLogCharts: React.FC<AuditLogChartsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-2xl neu-flat h-24" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const successCount = stats.collection_completed_count;
  const errorCount = stats.failed_count;
  const total = stats.total_events;
  const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0;
  const errorRate = total > 0 ? Math.round((errorCount / total) * 100) : 0;

  // Action breakdown for the bar
  const actionBreakdown = [
    { label: 'Completed', count: stats.collection_completed_count, color: '#10b981' },
    { label: 'Quota Exceeded', count: stats.quota_exceeded_count, color: '#f59e0b' },
    { label: 'Failed', count: stats.failed_count - stats.quota_exceeded_count > 0 ? stats.failed_count - stats.quota_exceeded_count : 0, color: '#ef4444' },
    { label: 'Other', count: Math.max(0, total - stats.collection_completed_count - stats.failed_count), color: '#3b82f6' },
  ].filter(a => a.count > 0);

  const maxBarValue = Math.max(...actionBreakdown.map(a => a.count), 1);

  const kpiCards = [
    {
      label: 'Tổng sự kiện',
      value: total.toLocaleString(),
      icon: <Activity className="w-4 h-4" />,
      color: 'text-[var(--primary)]',
    },
    {
      label: 'Tỷ lệ thành công',
      value: `${successRate}%`,
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'text-emerald-500',
    },
    {
      label: 'Tỷ lệ lỗi',
      value: `${errorRate}%`,
      icon: <AlertTriangle className="w-4 h-4" />,
      color: errorRate > 30 ? 'text-rose-500' : 'text-amber-500',
    },
    {
      label: 'Quota Exceeded',
      value: stats.quota_exceeded_count.toLocaleString(),
      icon: <Globe className="w-4 h-4" />,
      color: stats.quota_exceeded_count > 0 ? 'text-amber-500' : 'text-[var(--primary)]',
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="p-4 rounded-2xl neu-flat flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-xl neu-inset ${kpi.color}`}>
                {kpi.icon}
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                {kpi.label}
              </span>
            </div>
            <span className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* Action Breakdown Bar */}
      {actionBreakdown.length > 0 && (
        <div className="p-4 rounded-2xl neu-flat space-y-3">
          <h4 className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-[var(--primary)]" />
            Phân bổ hành động (7 ngày)
          </h4>

          {/* Stacked horizontal bar */}
          <div className="h-5 rounded-xl neu-inset-sm overflow-hidden flex">
            {actionBreakdown.map((a, i) => {
              const widthPct = total > 0 ? (a.count / total) * 100 : 0;
              return (
                <div
                  key={i}
                  style={{ width: `${widthPct}%`, backgroundColor: a.color }}
                  className="h-full transition-all duration-500 first:rounded-l-lg last:rounded-r-lg"
                  title={`${a.label}: ${a.count}`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            {actionBreakdown.map((a, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: a.color }}
                />
                <span className="text-[var(--text-muted)] font-mono">
                  {a.label}: <strong className="text-[var(--text-main)]">{a.count}</strong>
                </span>
              </div>
            ))}
          </div>

          {/* Recent Quota Error Info */}
          {stats.most_recent_quota_error && (
            <div className="p-3 rounded-xl neu-inset-sm text-xs text-amber-500 font-mono flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Quota gần nhất:</span>{' '}
                {stats.most_recent_quota_error}
                {stats.most_recent_quota_source && (
                  <span className="text-[var(--text-muted)]"> — nguồn: {stats.most_recent_quota_source}</span>
                )}
              </div>
            </div>
          )}

          {/* Simple SVG bar chart for action counts */}
          <div className="pt-2">
            <svg viewBox={`0 0 400 ${actionBreakdown.length * 36 + 8}`} className="w-full" role="img" aria-label="Action breakdown chart">
              {actionBreakdown.map((a, i) => {
                const barWidth = (a.count / maxBarValue) * 300;
                const y = i * 36 + 4;
                return (
                  <g key={i}>
                    {/* Background bar */}
                    <rect x="90" y={y} width="300" height="22" rx="6" fill="var(--shadow-dark)" opacity="0.15" />
                    {/* Value bar */}
                    <rect x="90" y={y} width={Math.max(barWidth, 4)} height="22" rx="6" fill={a.color} opacity="0.85">
                      <animate attributeName="width" from="0" to={Math.max(barWidth, 4)} dur="0.6s" fill="freeze" />
                    </rect>
                    {/* Label */}
                    <text x="85" y={y + 15} textAnchor="end" fontSize="11" fill="var(--text-muted)" fontFamily="monospace">
                      {a.label.length > 10 ? a.label.slice(0, 10) + '…' : a.label}
                    </text>
                    {/* Count */}
                    <text x={Math.max(barWidth, 4) + 96} y={y + 15} fontSize="11" fill="var(--text-main)" fontWeight="bold" fontFamily="monospace">
                      {a.count}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
