import React, { useEffect, useState } from 'react';
import { X, RefreshCw, CheckCircle2, Database, Play } from 'lucide-react';
import { api } from '../api/client';
import { DataSourceStatus } from '../types';

interface TriggerCollectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const TriggerCollectorModal: React.FC<TriggerCollectorModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [sources, setSources] = useState<DataSourceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100">Cập Nhật Dữ Liệu AI Skills</h3>
              <p className="text-xs text-slate-400">Thu thập từ GitHub, Reddit, HN & Awesome Lists</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Hệ thống tự động chạy background job mỗi 6 giờ. Bạn cũng có thể kích hoạt quét trực tiếp ngay bây giờ:
          </p>

          {message && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Sources List */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Trạng thái các nguồn thu thập
            </div>
            {sources.length === 0 ? (
              <div className="text-xs text-slate-500 py-2">Chưa có thông tin nguồn dữ liệu. Nhấn quét ngay để khởi tạo.</div>
            ) : (
              sources.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      s.last_status === 'success' ? 'bg-emerald-400' :
                      s.last_status === 'running' ? 'bg-amber-400 animate-ping' : 'bg-slate-500'
                    }`} />
                    <span className="font-medium text-slate-200">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                    <span>{s.items_collected_count} items</span>
                    <span className="capitalize text-slate-300">({s.last_status})</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới trạng thái
          </button>

          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {triggering ? 'Đang gửi yêu cầu...' : 'Kích Hoạt Quét Ngay'}
          </button>
        </div>
      </div>
    </div>
  );
};
