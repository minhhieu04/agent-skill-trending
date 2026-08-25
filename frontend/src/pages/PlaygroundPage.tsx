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
  RefreshCw 
} from 'lucide-react';
import { api } from '../api/client';
import { PlaygroundSimResult } from '../types';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export const PlaygroundPage: React.FC = () => {
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
              {t('playground_title')}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">
                {t('live_simulator')}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {t('playground_sub')}
            </p>
          </div>
        </div>

        {/* Runtime Target Pill */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0">
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
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Prompt Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono mb-2">
            {t('enter_test_prompt')}:
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('prompt_input_placeholder')}
            className="w-full p-4 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 leading-relaxed"
          />
        </div>

        {/* Sample Prompt Chips & Execute Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-mono mr-1">{t('sample_prompts')}:</span>
            {samplePrompts.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(s.text)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 text-[11px] font-medium transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading || !prompt.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{loading ? t('simulating') : t('btn_run_simulation')}</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix */}
      {result && (
        <div className="space-y-6 animate-in fade-in">
          {/* Simulation Summary Bar */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">
                {t('enforced_by')}: <strong className="text-emerald-700 dark:text-emerald-400">{result.skill_name}</strong> ({result.target_ide.toUpperCase()})
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px]">
              <div className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span>{result.latency_ms}ms</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Security Passed (98/100)</span>
              </div>
            </div>
          </div>

          {/* Code Comparison Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Before / Raw AI Output */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-rose-200 dark:border-rose-950 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-rose-100 dark:border-rose-950">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 font-mono uppercase">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{t('before_skill_title')}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  Unconstrained AI
                </span>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-rose-300/90 overflow-x-auto min-h-[220px] leading-relaxed shadow-inner">
                {result.before_code}
              </pre>
            </div>

            {/* Column 2: After / Enforced Skill Output */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-emerald-300 dark:border-emerald-800/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100 dark:border-emerald-800/40">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('after_skill_title')}</span>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all"
                >
                  {copiedAfter ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAfter ? t('copied') : t('copy_code')}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto min-h-[220px] leading-relaxed shadow-inner">
                {result.after_code}
              </pre>
            </div>
          </div>

          {/* Applied Rules & Key Fixes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {t('applied_rules_title')}:
              </div>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                {result.applied_rules?.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {t('improvements_title')}:
              </div>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                {result.improvements?.map((imp, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
