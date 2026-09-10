import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AuditLogItem } from '../types';
import { X, Copy, Check, AlertTriangle, Clock, User, Globe, Tag, Target, FileJson, ShieldCheck } from 'lucide-react';

interface AuditLogDetailModalProps {
  log: AuditLogItem | null;
  onClose: () => void;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({ log, onClose }) => {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, [onClose]);

  if (!log) return null;

  const isError =
    log.action.toLowerCase().includes('error') ||
    log.action.toLowerCase().includes('failed') ||
    log.action.toLowerCase().includes('quota');

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
      });
    } catch {
      return isoString;
    }
  };

  const detailJson = JSON.stringify(log.detail || {}, null, 2);
  const detailKeyCount = log.detail && typeof log.detail === 'object' ? Object.keys(log.detail).length : 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(detailJson);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = detailJson;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const getActionBadgeStyle = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('quota')) return 'text-amber-500 bg-amber-500/10 border border-amber-500/20';
    if (a.includes('error') || a.includes('failed') || a === 'login_failed') return 'text-rose-500 bg-rose-500/10 border border-rose-500/20';
    if (a === 'trigger_collection' || a === 'collection_completed') return 'text-sky-500 bg-sky-500/10 border border-sky-500/20';
    if (a === 'login' || a === 'register') return 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20';
    if (a.includes('preference') || a === 'bookmark' || a === 'unbookmark') return 'text-purple-500 bg-purple-500/10 border border-purple-500/20';
    return 'text-zinc-500 bg-zinc-500/10 border border-zinc-500/20';
  };

  // Syntax highlight JSON string
  const renderColoredJson = (json: string) => {
    const parts = json.split(/("(?:[^"\\]|\\.)*")/g);
    return parts.map((part, i) => {
      if (part.startsWith('"') && part.endsWith('"')) {
        const nextPart = parts[i + 1] || '';
        if (/^\s*:/.test(nextPart)) {
          return <span key={i} className="text-sky-400 font-semibold">{part}</span>;
        } else {
          return <span key={i} className="text-emerald-400">{part}</span>;
        }
      }
      // Numbers, booleans and null
      const tokenized = part
        .replace(/\b(true|false|null)\b/g, '<BOOL>$1</BOOL>')
        .replace(/\b(\d+\.?\d*)\b/g, '<NUM>$1</NUM>');

      if (tokenized.includes('<NUM>') || tokenized.includes('<BOOL>')) {
        const subParts = tokenized.split(/(<(?:NUM|BOOL)>.*?<\/(?:NUM|BOOL)>)/g);
        return (
          <React.Fragment key={i}>
            {subParts.map((sp, j) => {
              const numMatch = sp.match(/<NUM>(.*?)<\/NUM>/);
              if (numMatch) return <span key={j} className="text-amber-400 font-semibold">{numMatch[1]}</span>;
              const boolMatch = sp.match(/<BOOL>(.*?)<\/BOOL>/);
              if (boolMatch) return <span key={j} className="text-rose-400 font-bold">{boolMatch[1]}</span>;
              return <span key={j} className="text-[var(--text-muted)]">{sp}</span>;
            })}
          </React.Fragment>
        );
      }
      return <span key={i} className="text-[var(--text-muted)]">{part}</span>;
    });
  };

  // Teleport modal straight to document.body so it is never trapped by parent CSS transforms
  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 dark:bg-black/70 backdrop-blur-md animate-modal-backdrop"
      onMouseDown={(e) => {
        mouseDownTargetRef.current = e.target;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && mouseDownTargetRef.current === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="relative w-full max-w-xl bg-[var(--bg)] rounded-3xl neu-modal overflow-hidden animate-modal-pop text-[var(--text-main)] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between bg-[var(--bg)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-[var(--text-main)]">Chi tiết Audit Log</h3>
                <span className="px-2 py-0.5 rounded-lg neu-inset-sm font-mono text-[10px] text-[var(--text-muted)] font-bold">
                  #{log.id}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Nhật ký hoạt động & an ninh hệ thống
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all shrink-0"
            title="Đóng (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="neu-divider shrink-0" />

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Error Callout Banner if error exists */}
          {isError && (
            <div className="p-3 rounded-2xl neu-inset-sm flex items-center gap-2.5 text-rose-500 text-xs font-semibold border border-rose-500/20">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Sự kiện này ghi nhận lỗi, thất bại hoặc chạm trần hạn mức (Quota)!</span>
            </div>
          )}

          {/* Info Grid with standard neu-inset containers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Thời gian */}
            <div className="p-3 rounded-2xl neu-inset space-y-1">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                Thời gian ghi nhận
              </span>
              <p className="font-mono text-xs font-bold text-[var(--text-main)]">
                {formatVN(log.created_at)}
              </p>
              <p className="font-mono text-[10px] text-[var(--text-muted)]">
                {formatUTC(log.created_at)}
              </p>
            </div>

            {/* Người thực hiện */}
            <div className="p-3 rounded-2xl neu-inset space-y-1">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[var(--primary)]" />
                Người thực hiện
              </span>
              <p className="font-mono text-xs font-bold text-[var(--text-main)] truncate">
                @{log.username || 'system'}
              </p>
              <p className="font-mono text-[10px] text-[var(--text-muted)]">
                {log.user_id ? `User ID: #${log.user_id}` : 'Tác vụ hệ thống (System)'}
              </p>
            </div>

            {/* Hành động */}
            <div className="p-3 rounded-2xl neu-inset space-y-1.5">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[var(--primary)]" />
                Hành động
              </span>
              <div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold ${getActionBadgeStyle(log.action)}`}>
                  {log.action}
                </span>
              </div>
            </div>

            {/* Địa chỉ IP & Target */}
            <div className="p-3 rounded-2xl neu-inset space-y-1">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[var(--primary)]" />
                Địa chỉ IP
              </span>
              <p className="font-mono text-xs font-bold text-[var(--text-main)]">
                {log.ip_address || '— (Nội bộ / Docker)'}
              </p>
              <p className="font-mono text-[10px] text-[var(--text-muted)] flex items-center gap-1 truncate">
                <Target className="w-3 h-3 text-[var(--primary)] shrink-0" />
                <span>{log.target_type ? `${log.target_type}${log.target_id ? ` #${log.target_id}` : ''}` : 'Target: System'}</span>
              </p>
            </div>
          </div>

          {/* JSON Payload Detail */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold min-w-0">
                <FileJson className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                <span className="truncate">
                  <span className="hidden sm:inline">Dữ liệu chi tiết (Detail Payload)</span>
                  <span className="sm:hidden">Dữ liệu chi tiết (Payload)</span>
                </span>
                {detailKeyCount > 0 && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded neu-inset-sm text-[9px] font-bold text-[var(--primary)] whitespace-nowrap">
                    {detailKeyCount} {detailKeyCount === 1 ? 'key' : 'keys'}
                  </span>
                )}
              </div>

              <button
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono neu-btn text-[var(--text-muted)] hover:text-[var(--primary)] transition-all cursor-pointer ml-auto"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-bold">Đã chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép JSON</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-2xl neu-inset font-mono text-xs leading-relaxed max-h-56 overflow-y-auto custom-scrollbar whitespace-pre-wrap break-all">
              {detailKeyCount > 0 ? renderColoredJson(detailJson) : <span className="text-[var(--text-muted)] font-italic">Không có payload đính kèm {'{ }'}</span>}
            </pre>
          </div>
        </div>

        <div className="neu-divider shrink-0" />

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-[var(--bg)] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-2xl neu-btn text-xs font-semibold text-[var(--text-main)] hover:text-[var(--primary)] transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
