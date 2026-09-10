import React, { useState, useMemo } from 'react';
import { AuditLogStats, AuditLogItem } from '../types';
import { Activity, CheckCircle2, AlertTriangle, Globe, BarChart3, TrendingUp } from 'lucide-react';

interface AuditLogChartsProps {
  stats: AuditLogStats | undefined;
  logs: AuditLogItem[];
  isLoading: boolean;
}

export const AuditLogCharts: React.FC<AuditLogChartsProps> = ({ stats, logs, isLoading }) => {
  // Compute 7-day timeline from logs
  const timeline = useMemo(() => {
    const days: { label: string; dateKey: string; success: number; error: number; isToday: boolean }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      days.push({ label, dateKey, success: 0, error: 0, isToday: i === 0 });
    }
    for (const log of logs) {
      const logDate = (log.created_at.endsWith('Z') ? log.created_at : `${log.created_at}Z`).slice(0, 10);
      const dayEntry = days.find(d => d.dateKey === logDate);
      if (dayEntry) {
        const a = log.action.toLowerCase();
        if (a.includes('error') || a.includes('failed') || a.includes('quota')) {
          dayEntry.error++;
        } else {
          dayEntry.success++;
        }
      }
    }
    return days;
  }, [logs]);

  const total = stats?.total_events || logs.length || 0;
  const successCount = stats?.collection_completed_count ?? logs.filter(l => !l.action.includes('error') && !l.action.includes('failed')).length;
  const errorCount = stats?.failed_count ?? logs.filter(l => l.action.includes('error') || l.action.includes('failed') || l.action.includes('quota')).length;
  const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0;
  const errorRate = total > 0 ? Math.round((errorCount / total) * 100) : 0;
  const quotaExceededCount = stats?.quota_exceeded_count ?? logs.filter(l => l.action === 'quota_exceeded').length;

  // Granular action breakdown computed from real logs or fallback to stats
  const actionBreakdown = useMemo(() => {
    if (logs && logs.length > 0) {
      const counts: Record<string, number> = {};
      for (const log of logs) {
        const act = log.action || 'other';
        counts[act] = (counts[act] || 0) + 1;
      }
      const totalCount = logs.length;
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([action, count]) => {
          let label = action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          let color = '#3b82f6';
          const a = action.toLowerCase();
          if (a.includes('error') || a.includes('failed') || a === 'login_failed') {
            color = '#ef4444';
          } else if (a.includes('quota')) {
            color = '#f59e0b';
          } else if (a === 'collection_completed' || a.includes('success')) {
            color = '#10b981';
          } else if (a === 'login' || a === 'register') {
            color = '#06b6d4';
          } else if (a === 'trigger_collection') {
            color = '#6366f1';
          } else if (a.includes('preference') || a === 'bookmark' || a === 'unbookmark') {
            color = '#a855f7';
          }

          if (action === 'collection_completed') label = 'Collection Completed';
          if (action === 'trigger_collection') label = 'Trigger Collection';
          if (action === 'login') label = 'User Login';
          if (action === 'register') label = 'User Register';
          if (action === 'quota_exceeded') label = 'Quota Exceeded';
          if (action === 'update_preferences') label = 'Update Preferences';

          return {
            key: action,
            label,
            count,
            percent: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
            color,
          };
        });
    }

    return [
      { key: 'completed', label: 'Completed', count: successCount, percent: total > 0 ? Math.round((successCount / total) * 100) : 0, color: '#10b981' },
      { key: 'quota', label: 'Quota Exceeded', count: quotaExceededCount, percent: total > 0 ? Math.round((quotaExceededCount / total) * 100) : 0, color: '#f59e0b' },
      { key: 'failed', label: 'Failed', count: errorCount, percent: total > 0 ? Math.round((errorCount / total) * 100) : 0, color: '#ef4444' },
      { key: 'other', label: 'Other', count: Math.max(0, total - successCount - errorCount), percent: total > 0 ? Math.round((Math.max(0, total - successCount - errorCount) / total) * 100) : 0, color: '#3b82f6' },
    ].filter(a => a.count > 0);
  }, [logs, total, successCount, errorCount, quotaExceededCount]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 rounded-2xl neu-flat h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl neu-flat h-64" />
          <div className="p-5 rounded-2xl neu-flat h-64" />
        </div>
      </div>
    );
  }

  const [chartView, setChartView] = useState<'spline' | 'bar'>('spline');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Timeline chart calculations
  const maxTimelineValue = Math.max(...timeline.map(d => d.success + d.error), 1);
  const chartHeight = 85;
  const baselineY = 122;
  const colWidth = 500 / 7;

  // Spline coordinates and paths
  const paddingX = 36;
  const stepX = (500 - paddingX * 2) / (timeline.length - 1 || 1);

  const successPoints = useMemo(() => {
    return timeline.map((day, i) => {
      const x = paddingX + i * stepX;
      const h = maxTimelineValue > 0 ? (day.success / maxTimelineValue) * chartHeight : 0;
      const y = baselineY - h;
      return { x, y, day };
    });
  }, [timeline, maxTimelineValue, stepX, chartHeight, baselineY]);

  const errorPoints = useMemo(() => {
    return timeline.map((day, i) => {
      const x = paddingX + i * stepX;
      const h = maxTimelineValue > 0 ? (day.error / maxTimelineValue) * chartHeight : 0;
      const y = baselineY - h;
      return { x, y, day };
    });
  }, [timeline, maxTimelineValue, stepX, chartHeight, baselineY]);

  const hasAnyErrors = useMemo(() => timeline.some(d => d.error > 0), [timeline]);

  const getSplineD = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];

      if (p1.y === baselineY && p2.y === baselineY) {
        d += ` L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
        continue;
      }

      let cp1x = p1.x + (p2.x - p0.x) / 6;
      let cp1y = p1.y + (p2.y - p0.y) / 6;
      let cp2x = p2.x - (p3.x - p1.x) / 6;
      let cp2y = p2.y - (p3.y - p1.y) / 6;

      cp1y = Math.min(baselineY, Math.max(20, cp1y));
      cp2y = Math.min(baselineY, Math.max(20, cp2y));

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const successLineD = useMemo(() => getSplineD(successPoints), [successPoints]);
  const successAreaD = useMemo(() => {
    if (!successPoints.length) return '';
    return `${successLineD} L ${successPoints[successPoints.length - 1].x.toFixed(1)} ${baselineY} L ${successPoints[0].x.toFixed(1)} ${baselineY} Z`;
  }, [successLineD, successPoints, baselineY]);

  const errorLineD = useMemo(() => (hasAnyErrors ? getSplineD(errorPoints) : ''), [hasAnyErrors, errorPoints]);
  const errorAreaD = useMemo(() => {
    if (!hasAnyErrors || !errorPoints.length) return '';
    return `${errorLineD} L ${errorPoints[errorPoints.length - 1].x.toFixed(1)} ${baselineY} L ${errorPoints[0].x.toFixed(1)} ${baselineY} Z`;
  }, [hasAnyErrors, errorLineD, errorPoints, baselineY]);

  const kpiCards = [
    {
      label: 'Tổng sự kiện',
      value: total.toLocaleString(),
      icon: <Activity className="w-4 h-4" />,
      color: 'text-[var(--primary)]',
      bgColor: 'bg-[var(--primary)]/10',
    },
    {
      label: 'Tỷ lệ thành công',
      value: `${successRate}%`,
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Tỷ lệ lỗi',
      value: `${errorRate}%`,
      icon: <AlertTriangle className="w-4 h-4" />,
      color: errorRate > 20 ? 'text-rose-500' : 'text-amber-500',
      bgColor: errorRate > 20 ? 'bg-rose-500/10' : 'bg-amber-500/10',
    },
    {
      label: 'Hạn mức (Quota)',
      value: quotaExceededCount.toLocaleString(),
      icon: <Globe className="w-4 h-4" />,
      color: quotaExceededCount > 0 ? 'text-amber-500' : 'text-[var(--text-muted)]',
      bgColor: quotaExceededCount > 0 ? 'bg-amber-500/10' : 'bg-black/5 dark:bg-white/5',
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="p-3.5 sm:p-4 rounded-2xl neu-flat flex flex-col justify-between gap-2.5 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                {kpi.label}
              </span>
              <div className={`p-1.5 rounded-xl neu-inset-sm ${kpi.color}`}>
                {kpi.icon}
              </div>
            </div>
            <span className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${kpi.color}`}>
              {kpi.value}
            </span>
          </div>
        ))}
      </div>

      {/* 2-Column Responsive Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* Left Column: 7-Day Timeline Spline & Bar Graph */}
        <div className="p-4 sm:p-5 rounded-2xl neu-flat flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[var(--text-main)] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
              <span>Xu hướng hoạt động (7 ngày)</span>
            </h4>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Segmented View Switch */}
              <div className="flex items-center p-0.5 rounded-xl neu-inset-sm">
                <button
                  type="button"
                  onClick={() => setChartView('spline')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    chartView === 'spline'
                      ? 'neu-flat-xs text-[var(--primary)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                  title="Đồ thị đường cong (Spline Area)"
                >
                  <TrendingUp className="w-3 h-3" />
                  <span className="hidden sm:inline">Đồ thị</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartView('bar')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    chartView === 'bar'
                      ? 'neu-flat-xs text-[var(--primary)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                  title="Biểu đồ cột (Bar Chart)"
                >
                  <BarChart3 className="w-3 h-3" />
                  <span className="hidden sm:inline">Cột</span>
                </button>
              </div>

              {/* Mini Legend */}
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[var(--text-muted)] text-[10px]">Thành công</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-[var(--text-muted)] text-[10px]">Lỗi</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Container */}
          <div className="w-full pt-1">
            {chartView === 'spline' ? (
              <svg viewBox="0 0 500 165" className="w-full overflow-visible select-none" role="img" aria-label="7-day activity spline graph">
                <defs>
                  {/* Success Area Gradient */}
                  <linearGradient id="splineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                    <stop offset="65%" stopColor="#10b981" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Error Area Gradient */}
                  <linearGradient id="splineErrorAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                    <stop offset="80%" stopColor="#ef4444" stopOpacity="0.04" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Subtle Glow Filter */}
                  <filter id="neonLineGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10b981" floodOpacity="0.45" />
                  </filter>
                </defs>

                {/* Grid Guidelines */}
                <line x1={paddingX - 10} y1={baselineY} x2={500 - paddingX + 10} y2={baselineY} stroke="var(--shadow-dark)" strokeOpacity="0.28" strokeWidth="1" strokeDasharray="3 3" />
                <line x1={paddingX - 10} y1={baselineY - chartHeight / 2} x2={500 - paddingX + 10} y2={baselineY - chartHeight / 2} stroke="var(--shadow-dark)" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="2 2" />
                <line x1={paddingX - 10} y1={baselineY - chartHeight} x2={500 - paddingX + 10} y2={baselineY - chartHeight} stroke="var(--shadow-dark)" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="2 2" />

                {/* Area Gradient Fills */}
                <path d={successAreaD} fill="url(#splineAreaGrad)" />
                {hasAnyErrors && <path d={errorAreaD} fill="url(#splineErrorAreaGrad)" />}

                {/* Spline Glowing Strokes */}
                <path
                  d={successLineD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#neonLineGlow)"
                />
                {hasAnyErrors && (
                  <path
                    d={errorLineD}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="4 2"
                  />
                )}

                {/* Interactive Points & Vertical Guides */}
                {timeline.map((day, i) => {
                  const sp = successPoints[i];
                  const ep = errorPoints[i];
                  const isHovered = hoveredIdx === i;
                  const totalDay = day.success + day.error;
                  const activeY = day.success > 0 ? sp.y : ep.y;
                  const labelY = Math.max(16, activeY - 9);

                  return (
                    <g
                      key={i}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIdx(i)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    >
                      {/* Wide Click/Hover Hitbox */}
                      <rect
                        x={sp.x - stepX / 2}
                        y={15}
                        width={stepX}
                        height={baselineY + 25}
                        fill="transparent"
                      />

                      {/* Vertical Guideline */}
                      <line
                        x1={sp.x}
                        y1={Math.min(sp.y, ep.y) - 6}
                        x2={sp.x}
                        y2={baselineY}
                        stroke={isHovered ? 'var(--primary)' : 'var(--shadow-dark)'}
                        strokeOpacity={isHovered ? 0.6 : 0.15}
                        strokeWidth={isHovered ? 1.5 : 1}
                        strokeDasharray={isHovered ? '2 2' : '1 3'}
                      />

                      {/* Success Node */}
                      {day.success > 0 && (
                        <g>
                          <circle
                            cx={sp.x}
                            cy={sp.y}
                            r={isHovered || day.isToday ? 7.5 : 5}
                            fill="#10b981"
                            fillOpacity={isHovered ? 0.35 : 0.2}
                            className="transition-all duration-200"
                          />
                          <circle
                            cx={sp.x}
                            cy={sp.y}
                            r={isHovered ? 4.5 : 3.5}
                            fill="var(--bg)"
                            stroke="#10b981"
                            strokeWidth="2"
                            className="transition-all duration-200"
                          />
                        </g>
                      )}

                      {/* Error Node */}
                      {day.error > 0 && (
                        <g>
                          <circle
                            cx={ep.x}
                            cy={ep.y}
                            r={isHovered ? 6.5 : 4.5}
                            fill="#ef4444"
                            fillOpacity={0.3}
                          />
                          <circle
                            cx={ep.x}
                            cy={ep.y}
                            r={3}
                            fill="var(--bg)"
                            stroke="#ef4444"
                            strokeWidth="2"
                          />
                        </g>
                      )}

                      {/* Zero baseline dot */}
                      {totalDay === 0 && (
                        <circle
                          cx={sp.x}
                          cy={baselineY}
                          r={isHovered ? 3 : 2}
                          fill="var(--text-muted)"
                          opacity={isHovered ? 0.8 : 0.35}
                        />
                      )}

                      {/* Value Count Label above peak */}
                      {totalDay > 0 && (
                        <text
                          x={sp.x}
                          y={labelY}
                          textAnchor="middle"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                          fill={day.error > 0 && day.success === 0 ? '#ef4444' : '#10b981'}
                        >
                          {day.success > 0 && day.error > 0 ? `${day.success}+${day.error}` : totalDay}
                        </text>
                      )}

                      {/* Date label */}
                      <text
                        x={sp.x}
                        y={baselineY + 18}
                        textAnchor="middle"
                        fontSize="10.5"
                        fontFamily="monospace"
                        fill={day.isToday ? 'var(--primary)' : isHovered ? 'var(--text-main)' : 'var(--text-muted)'}
                        fontWeight={day.isToday || isHovered ? 'bold' : 'normal'}
                      >
                        {day.label}
                      </text>

                      {/* Today dot indicator */}
                      {day.isToday && (
                        <circle
                          cx={sp.x}
                          cy={baselineY + 26}
                          r="2"
                          fill="var(--primary)"
                        />
                      )}
                    </g>
                  );
                })}

                {/* Floating Tooltip Bubble when Hovered */}
                {hoveredIdx !== null && (() => {
                  const d = timeline[hoveredIdx];
                  const x = paddingX + hoveredIdx * stepX;
                  const tipX = Math.min(Math.max(x, 70), 500 - 70);
                  const tipY = 24;

                  return (
                    <g transform={`translate(${tipX}, ${tipY})`} className="pointer-events-none">
                      <rect
                        x="-65"
                        y="-18"
                        width="130"
                        height="38"
                        rx="10"
                        fill="var(--bg)"
                        stroke="var(--shadow-dark)"
                        strokeOpacity="0.4"
                        strokeWidth="1"
                        filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))"
                      />
                      <text
                        x="0"
                        y="-3"
                        textAnchor="middle"
                        fontSize="9.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                        fill="var(--text-main)"
                      >
                        {d.label} {d.isToday ? '• Hôm nay' : ''}
                      </text>
                      <text
                        x="0"
                        y="12"
                        textAnchor="middle"
                        fontSize="9.5"
                        fontFamily="monospace"
                        fill="var(--text-muted)"
                      >
                        <tspan fill="#10b981" fontWeight="bold">{d.success} ok</tspan>
                        {d.error > 0 && <tspan fill="#ef4444" fontWeight="bold"> • {d.error} lỗi</tspan>}
                      </text>
                    </g>
                  );
                })()}
              </svg>
            ) : (
              /* Bar Chart View */
              <svg viewBox="0 0 500 155" className="w-full overflow-visible select-none" role="img" aria-label="7-day timeline bar chart">
                <line x1="10" y1={baselineY} x2="490" y2={baselineY} stroke="var(--shadow-dark)" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="3 3" />
                {timeline.map((day, i) => {
                  const centerX = i * colWidth + colWidth / 2;
                  const totalDay = day.success + day.error;
                  const successH = maxTimelineValue > 0 ? (day.success / maxTimelineValue) * chartHeight : 0;
                  const errorH = maxTimelineValue > 0 ? (day.error / maxTimelineValue) * chartHeight : 0;
                  const hasBoth = day.success > 0 && day.error > 0;
                  const barWidth = hasBoth ? 10 : 13;

                  const successX = hasBoth ? centerX - barWidth - 1.5 : centerX - barWidth / 2;
                  const errorX = hasBoth ? centerX + 1.5 : centerX - barWidth / 2;
                  const successY = baselineY - successH;
                  const errorY = baselineY - errorH;

                  const successLabelY = Math.max(14, successY - 4);
                  const errorLabelY = Math.max(14, errorY - 4);

                  return (
                    <g key={i} className="cursor-pointer group">
                      <rect
                        x={centerX - 16}
                        y={baselineY - chartHeight}
                        width="32"
                        height={chartHeight}
                        rx="8"
                        fill="var(--shadow-dark)"
                        opacity="0.05"
                        className="group-hover:opacity-15 transition-opacity"
                      >
                        <title>{`${day.label}: ${day.success} thành công, ${day.error} lỗi`}</title>
                      </rect>

                      {day.success > 0 && (
                        <rect
                          x={successX}
                          y={successY}
                          width={barWidth}
                          height={Math.max(successH, 4)}
                          rx="5"
                          fill="#10b981"
                          opacity="0.9"
                        />
                      )}

                      {day.error > 0 && (
                        <rect
                          x={errorX}
                          y={errorY}
                          width={barWidth}
                          height={Math.max(errorH, 4)}
                          rx="5"
                          fill="#ef4444"
                          opacity="0.9"
                        />
                      )}

                      {day.success > 0 && (
                        <text
                          x={hasBoth ? successX + barWidth / 2 : centerX}
                          y={successLabelY}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#10b981"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {day.success}
                        </text>
                      )}

                      {day.error > 0 && (
                        <text
                          x={hasBoth ? errorX + barWidth / 2 : centerX}
                          y={errorLabelY}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#ef4444"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {day.error}
                        </text>
                      )}

                      {totalDay === 0 && (
                        <circle cx={centerX} cy={baselineY - 3} r="1.5" fill="var(--text-muted)" opacity="0.4" />
                      )}

                      <text
                        x={centerX}
                        y={baselineY + 18}
                        textAnchor="middle"
                        fontSize="10.5"
                        fontFamily="monospace"
                        fill={day.isToday ? 'var(--primary)' : 'var(--text-muted)'}
                        fontWeight={day.isToday ? 'bold' : 'normal'}
                      >
                        {day.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] border-t border-[var(--shadow-dark)]/15">
            <span>Tổng cộng 7 ngày qua:</span>
            <strong className="text-[var(--text-main)] font-bold">
              {timeline.reduce((acc, d) => acc + d.success + d.error, 0)} sự kiện
            </strong>
          </div>
        </div>

        {/* Right Column: Action Breakdown & Granular Percentages */}
        <div className="p-4 sm:p-5 rounded-2xl neu-flat flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[var(--text-main)] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--primary)]" />
              <span>Phân bổ hành động</span>
            </h4>
            <span className="text-[11px] font-mono neu-inset-sm px-2.5 py-0.5 rounded-lg text-[var(--primary)] font-bold">
              {total.toLocaleString()} sự kiện
            </span>
          </div>

          {/* Multi-segment stacked bar */}
          <div className="h-3 rounded-full neu-inset-sm overflow-hidden flex w-full">
            {actionBreakdown.map((a, i) => (
              <div
                key={i}
                style={{ width: `${a.percent}%`, backgroundColor: a.color }}
                className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full hover:opacity-90"
                title={`${a.label}: ${a.count} (${a.percent}%)`}
              />
            ))}
          </div>

          {/* Responsive Action Rows with mini progress bars */}
          <div className="space-y-2.5 pt-1 overflow-y-auto max-h-44 custom-scrollbar pr-1">
            {actionBreakdown.slice(0, 5).map((a) => (
              <div key={a.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                    <span className="font-medium text-[var(--text-main)] truncate text-[11px] sm:text-xs">{a.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                    <span className="font-bold text-[var(--text-main)]">{a.count.toLocaleString()}</span>
                    <span className="text-[var(--text-muted)] text-[10px]">({a.percent}%)</span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[var(--shadow-dark)]/15 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(a.percent, 3)}%`, backgroundColor: a.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Recent Quota Error Callout */}
          {stats?.most_recent_quota_error && (
            <div className="p-2.5 rounded-xl neu-inset-sm text-xs text-amber-500 font-mono flex items-center gap-2 border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <div className="truncate text-[11px]">
                <strong>Quota:</strong> {stats.most_recent_quota_error}
                {stats.most_recent_quota_source && (
                  <span className="text-[var(--text-muted)]"> ({stats.most_recent_quota_source})</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
