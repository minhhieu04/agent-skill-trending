import React, { useState } from 'react';
import { AuditLogItem } from '../types';
import { 
  X, 
  Copy, 
  Check, 
  ShieldAlert, 
  Clock, 
  User, 
  Globe, 
  Target, 
  Code2 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AuditLogDetailModalProps {
  log: AuditLogItem | null;
  onClose: () => void;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({ log, onClose }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isError = 
    log.action === 'login_failed' ||
    log.action === 'quota_exceeded' ||
    log.action === 'collection_failed' ||
    Boolean(log.detail?.error || log.detail?.reason);

  const formatLocalTime = (isoString: string) => {
    try {
      const utcString = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
      return new Date(utcString).toLocaleString('vi-VN', {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl rounded-3xl neu-flat bg-[var(--bg)] border border-[var(--shadow-dark)]/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[var(--shadow-dark)]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl neu-inset flex items-center justify-center shrink-0 ${
              isError ? 'text-rose-500' : 'text-[var(--primary)]'
            }`}>
              {isError ? <ShieldAlert className="w-5 h-5" /> : <Code2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-main)]">
                  {t('modal_log_detail')}
                </h3>
                <span className="px-2 py-0.5 rounded-lg neu-inset text-[10px] font-mono text-[var(--text-muted)]">
                  #{log.id}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                {log.action}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl neu-flat hover:neu-inset flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Error Summary Banner if applicable */}
          {isError && (
            <div className="p-4 rounded-2xl neu-inset border border-rose-500/30 bg-rose-500/10 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Cảnh báo Sự cố / Lỗi Hệ thống</span>
              </div>
              <p className="text-xs font-mono text-[var(--text-main)] break-all">
                {log.detail?.reason || log.detail?.error || 'Phát hiện sự kiện thất bại hoặc vi phạm an ninh.'}
              </p>
              {log.action === 'quota_exceeded' && (
                <p className="text-[11px] text-[var(--text-muted)]">
                  Gợi ý: Kiểm tra hạn ngạch Gemini API hoặc chuyển đổi mô hình dự phòng.
                </p>
              )}
            </div>
          )}

          {/* Grid Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Timestamp */}
            <div className="p-3.5 rounded-2xl neu-inset space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[var(--text-muted)]">
                <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>{t('col_time')}</span>
              </div>
              <div className="text-xs font-bold text-[var(--text-main)]">
                {formatLocalTime(log.created_at)}
              </div>
              <div className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                UTC: {log.created_at}
              </div>
            </div>

            {/* User */}
            <div className="p-3.5 rounded-2xl neu-inset space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[var(--text-muted)]">
                <User className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>{t('col_user')}</span>
              </div>
              <div className="text-xs font-bold text-[var(--text-main)]">
                @{log.username || 'anonymous'}
              </div>
              <div className="text-[10px] font-mono text-[var(--text-muted)]">
                User ID: {log.user_id ? `#${log.user_id}` : 'None (System)'}
              </div>
            </div>

            {/* IP Address */}
            <div className="p-3.5 rounded-2xl neu-inset space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[var(--text-muted)]">
                <Globe className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>{t('col_ip')}</span>
              </div>
              <div className="text-xs font-mono font-bold text-[var(--text-main)]">
                {log.ip_address || '127.0.0.1'}
              </div>
              <div className="text-[10px] font-mono text-[var(--text-muted)]">
                {log.ip_address?.startsWith('system') ? 'Hệ thống tự động' : 'Client HTTP'}
              </div>
            </div>

            {/* Target */}
            <div className="p-3.5 rounded-2xl neu-inset space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[var(--text-muted)]">
                <Target className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>{t('col_target')}</span>
              </div>
              <div className="text-xs font-bold text-[var(--text-main)]">
                {log.target_type || 'system'}
              </div>
              <div className="text-[10px] font-mono text-[var(--text-muted)]">
                Target ID: {log.target_id ? `#${log.target_id}` : 'None'}
              </div>
            </div>
          </div>

          {/* JSON Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Payload Chi Tiết (JSON)
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl neu-flat hover:neu-inset text-xs font-mono text-[var(--primary)] flex items-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t('copied') : t('copy_json')}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl neu-inset overflow-x-auto bg-[var(--bg)]">
              <pre className="text-[11px] font-mono text-[var(--text-main)] leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(log.detail || {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[var(--shadow-dark)]/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl neu-flat hover:neu-inset text-xs font-semibold text-[var(--text-main)] transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
