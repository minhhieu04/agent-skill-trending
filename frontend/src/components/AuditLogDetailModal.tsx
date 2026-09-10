import React, { useEffect, useCallback, useState } from 'react';
import { AuditLogItem } from '../types';
import { X, Copy, Check, AlertTriangle, Clock, User, Globe, Tag, Target } from 'lucide-react';

interface AuditLogDetailModalProps {
  log: AuditLogItem | null;
  onClose: () => void;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({ log, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!log) return null;

  const isError =
    log.action.toLowerCase().includes('error') ||
    log.action.toLowerCase().includes('failed');

  const formatUTC = (isoString: string) => {
    try {
      const utcString = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
      const d = new Date(utcString);
      return d.toLocaleString('en-GB', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' UTC';
    } catch {
      return isoString;
    }
  };

  const formatVN = (isoString: string) => {
    try {
      const utcString = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
      const d = new Date(utcString);
      return d.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' (VN)';
    } catch {
      return isoString;
    }
  };

  const detailJson = JSON.stringify(log.detail, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(detailJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = detailJson;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getActionColor = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('error') || a.includes('failed')) return 'text-rose-500 bg-rose-500/10';
    if (a.includes('success') || a.includes('completed') || a === 'login' || a === 'register' || a === 'bookmark') return 'text-emerald-500 bg-emerald-500/10';
    if (a.includes('update') || a.includes('quota')) return 'text-amber-500 bg-amber-500/10';
    return 'text-[var(--primary)] bg-[var(--primary)]/10';
  };

  // Colorize JSON keys/values
  const renderColoredJson = (jsonStr: string) => {
    // Simple regex-based colorization
    const parts = jsonStr.split(/("(?:[^"\\]|\\.)*")/g);
    return parts.map((part, i) => {
      if (part.startsWith('"') && part.endsWith('"')) {
        const nextPart = parts[i + 1]?.trimStart();
        if (nextPart?.startsWith(':')) {
          return <span key={i} className="text-[var(--primary)]">{part}</span>;
        } else {
          return <span key={i} className="text-emerald-500">{part}</span>;
        }
      }
      // Numbers
      const numColored = part.replace(/\b(\d+\.?\d*)\b/g, '<NUM>$1</NUM>');
      if (numColored.includes('<NUM>')) {
        const numParts = numColored.split(/(<NUM>.*?<\/NUM>)/g);
        return (
          <React.Fragment key={i}>
            {numParts.map((np, j) => {
              const match = np.match(/<NUM>(.*?)<\/NUM>/);
              if (match) return <span key={j} className="text-amber-500">{match[1]}</span>;
              // booleans and null
              const boolColored = np.replace(/\b(true|false|null)\b/g, '###$1###');
              if (boolColored.includes('###')) {
                const boolParts = boolColored.split(/(###.*?###)/g);
                return (
                  <React.Fragment key={j}>
                    {boolParts.map((bp, k) => {
                      const boolMatch = bp.match(/###(.*?)###/);
                      if (boolMatch) return <span key={k} className="text-rose-400">{boolMatch[1]}</span>;
                      return <span key={k}>{bp}</span>;
                    })}
                  </React.Fragment>
                );
              }
              return <span key={j}>{np}</span>;
            })}
          </React.Fragment>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl neu-flat p-5 sm:p-6 space-y-4 animate-fade-in custom-scrollbar">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl neu-inset-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 pr-8">
          <div className="p-2 rounded-xl neu-inset text-[var(--primary)]">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)]">Chi tiết Audit Log</h3>
            <p className="text-[10px] font-mono text-[var(--text-muted)]">ID: #{log.id}</p>
          </div>
        </div>

        {/* Error callout */}
        {isError && (
          <div className="p-3 rounded-xl neu-inset-sm flex items-center gap-2 text-rose-500 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Hành động này chứa lỗi hoặc thất bại!</span>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Time */}
          <div className="p-3 rounded-xl neu-inset-sm space-y-1">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[10px] font-mono uppercase">
              <Clock className="w-3 h-3" /> Thời gian
            </div>
            <p className="font-mono text-[var(--text-main)] text-[11px]">{formatUTC(log.created_at)}</p>
            <p className="font-mono text-[var(--text-muted)] text-[11px]">{formatVN(log.created_at)}</p>
          </div>

          {/* Username */}
          <div className="p-3 rounded-xl neu-inset-sm space-y-1">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[10px] font-mono uppercase">
              <User className="w-3 h-3" /> Người dùng
            </div>
            <p className="font-bold text-[var(--text-main)]">@{log.username || 'system'}</p>
          </div>

          {/* IP Address */}
          <div className="p-3 rounded-xl neu-inset-sm space-y-1">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[10px] font-mono uppercase">
              <Globe className="w-3 h-3" /> Địa chỉ IP
            </div>
            <p className="font-mono text-[var(--text-main)]">{log.ip_address || '-'}</p>
          </div>

          {/* Action */}
          <div className="p-3 rounded-xl neu-inset-sm space-y-1">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[10px] font-mono uppercase">
              <Tag className="w-3 h-3" /> Hành động
            </div>
            <span className={`inline-block px-2 py-0.5 rounded-lg text-[11px] font-mono font-semibold ${getActionColor(log.action)}`}>
              {log.action}
            </span>
          </div>

          {/* Target */}
          <div className="p-3 rounded-xl neu-inset-sm space-y-1 sm:col-span-2">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[10px] font-mono uppercase">
              <Target className="w-3 h-3" /> Đối tượng
            </div>
            <p className="font-mono text-[var(--text-main)]">
              {log.target_type ? `${log.target_type}${log.target_id ? ` #${log.target_id}` : ''}` : '-'}
            </p>
          </div>
        </div>

        {/* JSON Detail */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              Detail (JSON)
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono neu-inset-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-500">Đã copy!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3 rounded-xl neu-inset text-[11px] font-mono leading-relaxed overflow-x-auto max-h-48 custom-scrollbar whitespace-pre-wrap break-all">
            {log.detail && Object.keys(log.detail).length > 0 ? renderColoredJson(detailJson) : <span className="text-[var(--text-muted)]">{'{ }'}</span>}
          </pre>
        </div>
      </div>
    </div>
  );
};
