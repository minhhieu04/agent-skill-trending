import React, { useEffect, useState, useRef } from 'react';
import { X, RefreshCw, CheckCircle2, AlertCircle, Database, Play } from 'lucide-react';
import { api } from '../api/client';
import { DataSourceStatus } from '../types';

interface TriggerCollectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

// Brand SVG Icons for Data Sources
const GitHubIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const RedditIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

const HackerNewsIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M0 0v24h24V0H0zm12.9 13.7v5.5h-1.8v-5.5L7.2 4.8h2.1l2.7 5.6 2.7-5.6h2.1l-3.9 8.9z" />
  </svg>
);

const AwesomeListsIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export const TriggerCollectorModal: React.FC<TriggerCollectorModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [sources, setSources] = useState<DataSourceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await api.getSourcesStatus();
      setSources(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const handleTrigger = async () => {
    try {
      setTriggering(true);
      setMessage(null);
      const res = await api.triggerCollection();
      setMessage(res.message);
      setTimeout(() => {
        fetchStatus();
        onRefreshData();
      }, 1500);
    } catch (e: any) {
      setMessage(`Lỗi khi kích hoạt: ${e.message}`);
    } finally {
      setTriggering(false);
    }
  };

  if (!isOpen) return null;

  const getSourceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('github')) return <GitHubIcon className="w-4 h-4 text-slate-900 dark:text-slate-100" />;
    if (lower.includes('reddit')) return <RedditIcon className="w-4 h-4 text-[#FF4500]" />;
    if (lower.includes('hacker') || lower.includes('hn')) return <HackerNewsIcon className="w-4 h-4 text-[#FF6600]" />;
    return <AwesomeListsIcon className="w-4 h-4 text-amber-500" />;
  };

  const formatSourceName = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('github')) return 'GitHub Trending';
    if (lower.includes('reddit')) return 'Reddit r/LocalLLaMA';
    if (lower.includes('hacker') || lower.includes('hn')) return 'Hacker News Show';
    if (lower.includes('awesome')) return 'Awesome Agent Skills';
    return name.replace(/_/g, ' ');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 dark:bg-black/70 backdrop-blur-md animate-modal-backdrop"
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
        className="relative w-full max-w-lg bg-[var(--bg)] rounded-3xl neu-modal overflow-hidden animate-modal-pop text-[var(--text-main)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between bg-[var(--bg)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--text-main)]">Cập Nhật Dữ Liệu AI Skills</h3>
              <p className="text-xs text-[var(--text-muted)]">Thu thập & lập chỉ mục từ GitHub, Reddit, HN & Awesome Lists</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
            title="Đóng (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="neu-divider" />

        <div className="p-5 space-y-4">
          <p className="text-xs text-[var(--text-muted)] leading-relaxed font-normal">
            Hệ thống tự động chạy background job mỗi 6 giờ. Bạn cũng có thể kích hoạt quét dữ liệu song song ngay bây giờ:
          </p>

          {message && (
            <div className="p-3 rounded-2xl neu-inset-sm text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Sources List */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between">
              <span>Trạng thái các nguồn thu thập</span>
              <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Tự động đồng bộ</span>
            </div>

            <div className="p-2 rounded-2xl neu-inset space-y-1.5">
              {sources.length === 0 ? (
                <div className="text-xs text-[var(--text-muted)] py-4 text-center">Đang tải trạng thái...</div>
              ) : (
                sources.map((s) => (
                  <div 
                    key={s.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors hover:bg-[var(--shadow-dark)]/10 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg neu-flat-xs flex items-center justify-center shrink-0">
                        {getSourceIcon(s.name)}
                      </div>
                      <div>
                        <div className="font-bold text-[var(--text-main)] text-xs">
                          {formatSourceName(s.name)}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">
                          ID: {s.name.toLowerCase()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="neu-inset-sm px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold text-[var(--text-main)]">
                        {s.items_collected_count} items
                      </span>
                      {s.last_status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="capitalize">{s.last_status}</span>
                        </span>
                      ) : s.last_status === 'running' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang chạy</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span className="capitalize">{s.last_status}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="neu-divider" />

        {/* Footer Actions */}
        <div className="p-4 bg-[var(--bg)] flex items-center justify-between">
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl neu-btn text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl neu-primary text-white font-bold text-xs transition-all disabled:opacity-50 cursor-pointer active:scale-95 shadow-md"
          >
            {triggering ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>{triggering ? 'Đang kích hoạt quét...' : 'Bắt Đầu Quét Ngay'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
