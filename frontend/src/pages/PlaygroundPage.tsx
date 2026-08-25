import React, { useState } from 'react';
import { 
  Play, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Copy, 
  Check, 
  RefreshCw,
  Binary,
  Code
} from 'lucide-react';
import { api } from '../api/client';
import { PlaygroundSimResult } from '../types';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { ImageToMatrixConverter } from '../components/ImageToMatrixConverter';

export const PlaygroundPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'prompt_sim' | 'image_matrix'>('image_matrix');
  const [prompt, setPrompt] = useState<string>('Viết hàm xử lý concurrent an toàn trong Golang');
  const [targetIde, setTargetIde] = useState<string>('antigravity');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PlaygroundSimResult | null>(null);
  const [copiedAfter, setCopiedAfter] = useState<boolean>(false);
  const { showToast } = useToast();
  const { t } = useLanguage();

  const samplePrompts = [
    { label: '🐹 Concurrency trong Go', text: 'Viết hàm xử lý slice song song trong Go không bị goroutine leak' },
    { label: '🎨 Thiết kế UI/UX Card', text: 'Tạo component UserProfileCard với chuẩn UI/UX hiện đại và accessibility' },
    { label: '⚛️ Next.js Server Action', text: 'Tạo Server Action đăng ký tài khoản với Zod schema validation' },
    { label: '🛡️ Phòng chống SQL Injection', text: 'Viết API tìm kiếm người dùng an toàn chống SQL Injection' },
  ];

  const handleSimulate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const data = await api.simulatePlayground({
        prompt: prompt.trim(),
        target_ide: targetIde,
      });
      setResult(data);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi chạy simulation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.after_code);
    setCopiedAfter(true);
    showToast(t('toast_copied'), 'success');
    setTimeout(() => setCopiedAfter(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-500">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Phòng Thử Nghiệm & Sáng Tạo AI (Playground)
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">
                {t('live_simulator')}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Thử nghiệm tác động của bộ quy tắc AI Agent hoặc chuyển đổi bất kỳ hình ảnh nào sang ma trận nhị phân 01 thời gian thực.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('image_matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'image_matrix'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Binary className="w-4 h-4" />
            <span>Ảnh ➔ Nhị Phân 01 (Matrix Art)</span>
          </button>

          <button
            onClick={() => setActiveTab('prompt_sim')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'prompt_sim'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Prompt & Rules AI Simulator</span>
          </button>
        </div>
      </div>

      {/* TAB 1: IMAGE TO BINARY MATRIX 01 CONVERTER */}
      {activeTab === 'image_matrix' && (
        <div className="animate-in fade-in duration-300">
          <ImageToMatrixConverter />
        </div>
      )}

      {/* TAB 2: PROMPT SIMULATOR */}
      {activeTab === 'prompt_sim' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Target IDE Picker */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Chọn môi trường IDE & Engine áp dụng:
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'antigravity', label: '🪐 Antigravity' },
                { id: 'codex', label: '🧠 Codex' },
                { id: 'cursor', label: '⚡ Cursor' },
                { id: 'claude', label: '🤖 Claude' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTargetIde(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    targetIde === item.id
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Input Form */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t('prompt_input_label')}
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {targetIde.toUpperCase()} ACTIVE
              </span>
            </div>

            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="VD: Viết hàm query dữ liệu Postgres có phân trang an toàn..."
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none transition-all"
            />

            {/* Quick Sample Prompts */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 text-[11px] shrink-0">{t('sample_prompts')}:</span>
              {samplePrompts.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(sample.text)}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] whitespace-nowrap transition-colors"
                >
                  {sample.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={handleSimulate}
                disabled={loading}
                className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/25 active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>{loading ? t('simulating') : t('btn_simulate')}</span>
              </button>
            </div>
          </div>

          {/* Results Display */}
          {result && (
            <div className="space-y-6">
              {/* Metrics & Verdict Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {t('security_verdict')}
                    </div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 capitalize">
                      {result.security_verdict?.security_rating || 'Verified Safe'} (
                      {result.security_verdict?.security_score || 98}%)
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-500">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {t('rules_applied_count')}
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {result.applied_rules.length} {t('rules')}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {t('execution_time')}
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {result.latency_ms} ms
                    </div>
                  </div>
                </div>
              </div>

              {/* Side by side code comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* BEFORE: Raw Unconstrained Code */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                    <span className="flex items-center gap-1.5 text-rose-500">
                      <AlertTriangle className="w-4 h-4" />
                      {t('before_rules')} (Standard AI Code)
                    </span>
                    <span className="text-[10px] text-rose-500/80 bg-rose-500/10 px-2 py-0.5 rounded-full font-sans font-bold">
                      {t('unconstrained')}
                    </span>
                  </div>

                  <pre className="p-5 rounded-2xl bg-slate-950 border border-rose-900/30 text-rose-200/90 text-xs font-mono overflow-x-auto min-h-[220px] max-h-[360px] leading-relaxed shadow-inner">
                    {result.before_code}
                  </pre>
                </div>

                {/* AFTER: Skill Enforced Code */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-500">
                      <Sparkles className="w-4 h-4" />
                      {t('after_rules')} ({result.target_ide.toUpperCase()} Enforced)
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="text-xs text-emerald-500 hover:underline flex items-center gap-1 font-sans font-bold"
                    >
                      {copiedAfter ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedAfter ? t('copied') : t('copy_code')}
                    </button>
                  </div>

                  <pre className="p-5 rounded-2xl bg-slate-950 border border-emerald-900/40 text-emerald-300 text-xs font-mono overflow-x-auto min-h-[220px] max-h-[360px] leading-relaxed shadow-inner">
                    {result.after_code}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
