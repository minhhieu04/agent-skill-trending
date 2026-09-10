import React, { useMemo } from 'react';
import { AuditLogStats, AuditLogItem } from '../types';
import { Activity, CheckCircle2, AlertTriangle, Globe, BarChart3 } from 'lucide-react';

interface AuditLogChartsProps {
  stats: AuditLogStats | undefined;
  logs: AuditLogItem[];
  isLoading: boolean;
}

export const AuditLogCharts: React.FC<AuditLogChartsProps> = ({ stats, logs, isLoading }) => {
  // Compute 7-day timeline from logs
  const timeline = useMemo(() => {
    const days: { label: string; dateKey: string; success: number; error: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      days.push({ label, dateKey, success: 0, error: 0 });
    }
    for (const log of logs) {
      const logDate = (log.created_at.endsWith('Z') ? log.created_at : `${log.created_at}Z`).slice(0, 10);
      const dayEntry = days.find(d => d.dateKey === logDate);
      if (dayEntry) {
        const a = log.action.toLowerCase();
        if (a.includes('error') || a.includes('failed')) {
          dayEntry.error++;
        } else {
          dayEntry.success++;
        }
      }
    }
    return days;
  }, [logs]);

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
    { label: 'Failed', count: (stats.failed_count - stats.quota_exceeded_count) > 0 ? stats.failed_count - stats.quota_exceeded_count : 0, color: '#ef4444' },
    { label: 'Other', count: Math.max(0, total - stats.collection_completed_count - stats.failed_count), color: '#3b82f6' },
  ].filter(a => a.count > 0);

  const maxBarValue = Math.max(...actionBreakdown.map(a => a.count), 1);

  // Timeline chart calculations
  const maxTimelineValue = Math.max(...timeline.map(d => d.success + d.error), 1);
  const chartHeight = 120;
  const barGroupWidth = 400 / 7;

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

      {/* 7-Day Timeline Bar Chart */}
      <div className="p-4 rounded-2xl neu-flat space-y-3">
        <h4 className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
          <BarChart3 className="w-3 h-3 text-[var(--primary)]" />
          Biểu đồ 7 ngày gần nhất
        </h4>

        <svg viewBox={`0 0 400 ${chartHeight + 30}`} className="w-full" role="img" aria-label="7-day timeline chart">
          {timeline.map((day, i) => {
            const x = i * barGroupWidth + barGroupWidth * 0.15;
            const bw = barGroupWidth * 0.3;
            const successH = maxTimelineValue > 0 ? (day.success / maxTimelineValue) * chartHeight : 0;
            const errorH = maxTimelineValue > 0 ? (day.error / maxTimelineValue) * chartHeight : 0;

            return (
              <g key={i}>
                {/* Background */}
                <rect x={x} y={0} width={bw * 2 + 4} height={chartHeight} rx="4" fill="var(--shadow-dark)" opacity="0.08" />
                {/* Success bar (green) */}
                <rect x={x} y={chartHeight - successH} width={bw} height={Math.max(successH, 0)} rx="3" fill="#10b981" opacity="0.85">
                  <animate attributeName="height" from="0" to={Math.max(successH, 0)} dur="0.5s" fill="freeze" />
                  <animate attributeName="y" from={chartHeight} to={chartHeight - successH} dur="0.5s" fill="freeze" />
                </rect>
                {/* Error bar (red) */}
                <rect x={x + bw + 4} y={chartHeight - errorH} width={bw} height={Math.max(errorH, 0)} rx="3" fill="#ef4444" opacity="0.85">
                  <animate attributeName="height" from="0" to={Math.max(errorH, 0)} dur="0.5s" fill="freeze" />
                  <animate attributeName="y" from={chartHeight} to={chartHeight - errorH} dur="0.5s" fill="freeze" />
                </rect>
                {/* Success count label */}
                {day.success > 0 && (
                  <text x={x + bw / 2} y={chartHeight - successH - 4} textAnchor="middle" fontSize="9" fill="#10b981" fontFamily="monospace" fontWeight="bold">
                    {day.success}
                  </text>
                )}
                {/* Error count label */}
                {day.error > 0 && (
                  <text x={x + bw + 4 + bw / 2} y={chartHeight - errorH - 4} textAnchor="middle" fontSize="9" fill="#ef4444" fontFamily="monospace" fontWeight="bold">
                    {day.error}
                  </text>
                )}
                {/* Day label */}
                <text x={x + bw + 2} y={chartHeight + 16} textAnchor="middle" fontSize="10" fill="var(--text-muted)" fontFamily="monospace">
                  {day.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#10b981' }} />
            <span className="text-[var(--text-muted)] font-mono">Success</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#ef4444' }} />
            <span className="text-[var(--text-muted)] font-mono">Error / Failed</span>
          </div>
        </div>
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
