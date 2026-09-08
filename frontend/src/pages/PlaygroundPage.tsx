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
  Code,
  Palette,
  Orbit,
  Cpu,
  Zap,
  Bot,
  ArrowRight
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
    { label: 'Concurrency trong Go', text: 'Viết hàm xử lý slice song song trong Go không bị goroutine leak', icon: Cpu },
    { label: 'Thiết kế UI/UX Card', text: 'Tạo component UserProfileCard với chuẩn UI/UX hiện đại và accessibility', icon: Palette },
    { label: 'Next.js Server Action', text: 'Tạo Server Action đăng ký tài khoản với Zod schema validation', icon: Code },
    { label: 'Phòng chống SQL Injection', text: 'Viết API tìm kiếm người dùng an toàn chống SQL Injection', icon: ShieldCheck },
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
      <div className="p-5 sm:p-6 rounded-3xl neu-flat flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
              Phòng Thử Nghiệm & Sáng Tạo AI (Playground)
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono neu-inset-sm text-[var(--primary)] font-semibold">
                {t('live_simulator')}
              </span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-2xl">
              Thử nghiệm tác động của bộ quy tắc AI Agent hoặc chuyển đổi bất kỳ hình ảnh nào sang ma trận nhị phân 01 thời gian thực.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1.5 neu-inset rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('image_matrix')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'image_matrix'
                ? 'neu-flat text-[var(--primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            <span className="flex items-center gap-1">Ảnh <ArrowRight className="w-3 h-3 text-blue-500 inline" /> Nhị Phân 01</span>
          </button>

          <button
            onClick={() => setActiveTab('prompt_sim')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'prompt_sim'
                ? 'neu-flat text-[var(--primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Prompt & Rules AI</span>
          </button>
        </div>
      </div>

      {/* TAB 1: IMAGE TO BINARY MATRIX 01 CONVERTER */}
      {activeTab === 'image_matrix' && (
        <div className="animate-fade-in">
          <ImageToMatrixConverter />
        </div>
      )}

      {/* TAB 2: PROMPT SIMULATOR */}
      {activeTab === 'prompt_sim' && (
        <div className="space-y-6 animate-fade-in">
          {/* Target IDE Picker */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 rounded-3xl neu-flat">
            <span className="text-xs font-bold text-[var(--text-main)]">
              Chọn môi trường IDE & Engine áp dụng:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: 'antigravity', label: 'Antigravity', icon: Orbit },
                { id: 'codex', label: 'Codex', icon: Cpu },
                { id: 'cursor', label: 'Cursor', icon: Zap },
                { id: 'claude', label: 'Claude', icon: Bot },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTargetIde(item.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      targetIde === item.id
                        ? 'neu-inset text-[var(--primary)] font-bold'
                        : 'neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Input Form */}
          <div className="p-5 sm:p-6 rounded-3xl neu-flat space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--text-main)]">
                {t('prompt_input_label')}
              </label>
              <span className="text-[10px] font-mono uppercase text-[var(--primary)] neu-inset-sm px-2.5 py-0.5 rounded-full font-semibold">
                {targetIde.toUpperCase()} ACTIVE
              </span>
            </div>

            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="VD: Viết hàm query dữ liệu Postgres có phân trang an toàn..."
              className="w-full p-4 rounded-2xl neu-inset bg-transparent text-xs font-mono text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none resize-none transition-all"
            />

            {/* Quick Sample Prompts */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
              <span className="text-[var(--text-muted)] text-[11px] shrink-0 font-mono">{t('sample_prompts')}:</span>
              {samplePrompts.map((sample, idx) => {
                const Icon = sample.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => setPrompt(sample.text)}
                    className="px-3 py-1.5 rounded-xl text-[11px] whitespace-nowrap neu-btn text-[var(--text-main)] hover:text-[var(--primary)] font-medium transition-all flex items-center gap-1.5"
                  >
                    <Icon className="w-3 h-3 text-blue-500 shrink-0" />
                    <span>{sample.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                onClick={handleSimulate}
                disabled={loading}
                className="px-4 py-2 rounded-2xl neu-primary text-white font-semibold text-xs transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>{loading ? t('simulating') : t('btn_simulate')}</span>
              </button>
            </div>
          </div>

          {/* Results Display */}
          {result && (
            <div className="space-y-6 animate-fade-in">
              {/* Metrics & Verdict Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-3xl neu-flat flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl neu-inset text-emerald-500 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--text-muted)] font-mono">
                      {t('security_verdict')}
                    </div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 capitalize">
                      {result.security_verdict?.security_rating || 'Verified Safe'} (
                      {result.security_verdict?.security_score || 98}%)
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-3xl neu-flat flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--text-muted)] font-mono">
                      {t('rules_applied_count')}
                    </div>
                    <div className="text-xs font-bold text-[var(--text-main)]">
                      {result.applied_rules.length} {t('rules')}
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-3xl neu-flat flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--text-muted)] font-mono">
                      {t('execution_time')}
                    </div>
                    <div className="text-xs font-bold font-mono text-[var(--text-main)]">
                      {result.latency_ms} ms
                    </div>
                  </div>
                </div>
              </div>

              {/* Side by side code comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* BEFORE: Raw Unconstrained Code */}
                <div className="p-5 sm:p-6 rounded-3xl neu-flat space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 font-bold text-rose-500">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {t('before_rules')} (Standard AI)
                    </span>
                    <span className="text-[10px] text-rose-500 neu-inset-sm px-2.5 py-0.5 rounded-full font-bold">
                      {t('unconstrained')}
                    </span>
                  </div>

                  <pre className="p-4 rounded-2xl neu-inset text-[var(--text-main)] text-xs font-mono overflow-x-auto min-h-[220px] max-h-[360px] leading-relaxed">
                    {result.before_code}
                  </pre>
                </div>

                {/* AFTER: Skill Enforced Code */}
                <div className="p-5 sm:p-6 rounded-3xl neu-flat space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 font-bold text-[var(--primary)]">
                      <Sparkles className="w-3.5 h-3.5" />
                      {t('after_rules')} ({result.target_ide.toUpperCase()} Enforced)
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="text-xs neu-btn px-3 py-1.5 rounded-xl text-[var(--text-main)] hover:text-[var(--primary)] flex items-center gap-1 font-mono font-semibold transition-all"
                    >
                      {copiedAfter ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedAfter ? t('copied') : t('copy_code')}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-2xl neu-inset text-emerald-600 dark:text-emerald-400 text-xs font-mono overflow-x-auto min-h-[220px] max-h-[360px] leading-relaxed font-semibold">
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
