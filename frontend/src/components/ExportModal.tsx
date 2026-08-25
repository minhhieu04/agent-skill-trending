import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  Sparkles 
} from 'lucide-react';
import { Skill, ExportConfig } from '../types';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

interface ExportModalProps {
  skill: Skill | null;
  isOpen?: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ skill, isOpen = true, onClose }) => {
  const [activeIde, setActiveIde] = useState<string>('antigravity');
  const [config, setConfig] = useState<ExportConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const { showToast } = useToast();
  const { t } = useLanguage();

  const ideOptions = [
    { id: 'antigravity', name: 'Google Antigravity', icon: '🪐', badge: '.gemini/config/skills/' },
    { id: 'codex', name: 'OpenAI Codex / Copilot', icon: '🧠', badge: '.github/copilot-instructions.md' },
    { id: 'cursor', name: 'Cursor Rules', icon: '⚡', badge: '.cursor/rules/*.mdc' },
    { id: 'claude', name: 'Claude Code & Desktop', icon: '🤖', badge: '~/.claude/skills/' },
    { id: 'windsurf', name: 'Windsurf Rules', icon: '🌊', badge: '.windsurfrules' },
    { id: 'aider', name: 'Aider AI', icon: '💻', badge: '.aider.conf.yml' },
  ];

  useEffect(() => {
    if (!isOpen || !skill) return;
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const res = await api.exportSkillConfig(skill.id, activeIde);
        setConfig(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [isOpen, skill, activeIde]);

  if (!isOpen || !skill) return null;

  const handleCopyCode = () => {
    if (!config) return;
    navigator.clipboard.writeText(config.content);
    setCopiedCode(true);
    showToast(t('toast_copied'), 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyCli = () => {
    if (!config) return;
    navigator.clipboard.writeText(config.cli_command);
    setCopiedCli(true);
    showToast(t('toast_copied'), 'success');
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!config) return;
    const blob = new Blob([config.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = config.file_name;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`${t('downloaded_file')} ${config.file_name}`, 'success');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl h-[90vh] sm:h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-modal-pop transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shrink-0">
              <Sparkles className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                <span>{t('export_modal_title')}</span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-normal">
                  ({skill.name})
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('export_modal_sub')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* IDE Selector Tabs */}
        <div className="px-4 sm:px-6 pt-3 border-b border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
          {ideOptions.map((ide) => (
            <button
              key={ide.id}
              onClick={() => setActiveIde(ide.id)}
              className={`px-3.5 sm:px-4 py-2.5 sm:py-3 border-b-2 font-medium text-xs whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                activeIde === ide.id
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-slate-900 rounded-t-xl'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>{ide.icon}</span>
              <span>{ide.name}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 min-h-0 overscroll-contain scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {loading ? (
            <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-400">
              Đang sinh cấu hình chuẩn cho {activeIde}...
            </div>
          ) : config ? (
            <div className="space-y-4">
              {/* Target File Path & Quick Actions */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-300 min-w-0">
                  <span className="text-slate-400 shrink-0">{t('target_file')}:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 break-all">
                    {config.file_path}
                  </strong>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={handleDownloadFile}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-500 text-xs font-bold transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('btn_download_file')}</span>
                  </button>

                  <button
                    onClick={handleCopyCode}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                    <span>{copiedCode ? t('copied') : t('copy_code')}</span>
                  </button>
                </div>
              </div>

              {/* CLI Command Helper */}
              {config.cli_command && (
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {t('cli_quick_install')}
                    </span>
                    <button
                      onClick={handleCopyCli}
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      {copiedCli ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedCli ? t('copied') : t('copy_command')}
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap break-all select-all max-w-full">
                    {config.cli_command}
                  </pre>
                </div>
              )}

              {/* Code Content Preview */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                  {t('file_preview')} ({config.file_name})
                </div>
                <pre className="p-4 sm:p-5 rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 overflow-x-auto max-h-72 leading-relaxed shadow-inner max-w-full">
                  {config.content}
                </pre>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
