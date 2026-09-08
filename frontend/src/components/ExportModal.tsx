import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  Sparkles,
  Orbit,
  Cpu,
  Zap,
  Bot,
  Wind
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
  const mouseDownTargetRef = useRef<EventTarget | null>(null);
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  const ideOptions = [
    { id: 'antigravity', name: 'Google Antigravity', icon: Orbit, badge: '.gemini/config/skills/' },
    { id: 'codex', name: 'OpenAI Codex / Copilot', icon: Cpu, badge: '.github/copilot-instructions.md' },
    { id: 'cursor', name: 'Cursor Rules', icon: Zap, badge: '.cursor/rules/*.mdc' },
    { id: 'claude', name: 'Claude Code & Desktop', icon: Bot, badge: '~/.claude/skills/' },
    { id: 'windsurf', name: 'Windsurf Rules', icon: Wind, badge: '.windsurfrules' },
    { id: 'aider', name: 'Aider AI', icon: Terminal, badge: '.aider.conf.yml' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        e.stopImmediatePropagation();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

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
      className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm animate-modal-backdrop"
      onMouseDown={(e) => {
        mouseDownTargetRef.current = e.target;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && mouseDownTargetRef.current === e.currentTarget) {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div 
        className="w-full max-w-4xl h-[90vh] sm:h-[85vh] bg-[var(--bg)] rounded-3xl neu-modal flex flex-col overflow-hidden animate-modal-pop transition-all text-[var(--text-main)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 shadow-[0_4px_10px_var(--shadow-dark)] flex items-start sm:items-center justify-between gap-3 shrink-0 bg-[var(--bg)] relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[var(--text-main)] flex items-center gap-2 flex-wrap">
                <span>{t('export_modal_title')}</span>
                <span className="text-xs font-mono text-[var(--text-muted)] font-normal">
                  ({skill.name})
                </span>
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {t('export_modal_sub')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all shrink-0"
            title={language === 'vi' ? 'Đóng (Esc)' : 'Close (Esc)'}
            aria-label={language === 'vi' ? 'Đóng (Esc)' : 'Close (Esc)'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* IDE Selector Tabs */}
        <div className="px-4 sm:px-6 py-2.5 flex gap-2 overflow-x-auto scrollbar-none bg-[var(--bg)] shadow-[inset_0_-2px_4px_var(--shadow-dark)] shrink-0">
          {ideOptions.map((ide) => {
            const Icon = ide.icon;
            return (
              <button
                key={ide.id}
                onClick={() => setActiveIde(ide.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                  activeIde === ide.id
                    ? 'neu-inset text-[var(--primary)] font-bold'
                    : 'neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{ide.name}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 min-h-0 overscroll-contain scrollbar-thin">
          {loading ? (
            <div className="h-64 rounded-2xl neu-inset animate-pulse flex items-center justify-center text-xs text-[var(--text-muted)]">
              Đang sinh cấu hình chuẩn cho {activeIde}...
            </div>
          ) : config ? (
            <div className="space-y-4">
              {/* Target File Path & Quick Actions */}
              <div className="p-4 sm:p-5 rounded-2xl neu-flat flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--text-main)] min-w-0">
                  <span className="text-[var(--text-muted)] shrink-0 font-semibold">{t('target_file')}:</span>
                  <strong className="text-[var(--primary)] neu-inset-sm px-2.5 py-1 rounded-xl break-all font-semibold">
                    {config.file_path}
                  </strong>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                  <button
                    onClick={handleDownloadFile}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl neu-btn text-[var(--text-main)] hover:text-[var(--primary)] text-xs font-semibold transition-all"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('btn_download_file')}</span>
                  </button>

                  <button
                    onClick={handleCopyCode}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl neu-primary text-white text-xs font-semibold transition-all"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                    <span>{copiedCode ? t('copied') : t('copy_code')}</span>
                  </button>
                </div>
              </div>

              {/* CLI Command Helper */}
              {config.cli_command && (
                <div className="p-4 rounded-2xl neu-inset text-[var(--text-main)] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Terminal className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                      {t('cli_quick_install')}
                    </span>
                    <button
                      onClick={handleCopyCli}
                      className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 font-semibold"
                    >
                      {copiedCli ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedCli ? t('copied') : t('copy_command')}
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-[var(--text-main)] overflow-x-auto whitespace-pre-wrap break-all select-all max-w-full">
                    {config.cli_command}
                  </pre>
                </div>
              )}

              {/* Code Content Preview */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
                  {t('file_preview')} ({config.file_name})
                </div>
                <pre className="p-4 sm:p-5 rounded-2xl neu-inset text-xs font-mono text-[var(--text-main)] overflow-x-auto max-h-72 leading-relaxed max-w-full">
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
