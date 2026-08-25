import React from 'react';
import { 
  X, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  Star, 
  GitFork, 
  Terminal, 
  Copy, 
  Check, 
  Zap,
  Code
} from 'lucide-react';
import { Skill } from '../types';

interface SkillDetailModalProps {
  skill: Skill | null;
  onClose: () => void;
  onToggleBookmark: (id: number) => void;
}

export const SkillDetailModal: React.FC<SkillDetailModalProps> = ({
  skill,
  onClose,
  onToggleBookmark,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!skill) return null;

  const handleCopyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getInstallGuide = () => {
    if (skill.category === 'mcp-server') {
      return {
        title: 'Cài đặt MCP Server vào Claude Desktop / Cursor',
        command: `npx -y @modelcontextprotocol/inspector ${skill.name}`,
        config: `{
  "mcpServers": {
    "${skill.name.split('/')[1] || 'custom-server'}": {
      "command": "npx",
      "args": ["-y", "${skill.name}"]
    }
  }
}`
      };
    } else if (skill.category === 'skill-file') {
      return {
        title: 'Tải và cài đặt Skill File (SKILL.md / .cursorrules)',
        command: `curl -fsSL https://raw.githubusercontent.com/${skill.name}/main/SKILL.md -o .gemini/skills/${skill.name.split('/')[1]}/SKILL.md`,
        config: `# Copy file cấu hình hoặc rules vào thư mục workspace:
# Cho Cursor: .cursorrules
# Cho Claude Code: .claude/skills/
# Cho Antigravity/Gemini: .gemini/skills/`
      };
    } else {
      return {
        title: 'Cài đặt và sử dụng công cụ',
        command: `git clone ${skill.repository_url}.git`,
        config: `# Clone repository và làm theo hướng dẫn trong README.md`
      };
    }
  };

  const guide = getInstallGuide();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2.5 py-0.5 rounded-full">
                {skill.category}
              </span>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                Độ khó: {skill.difficulty}
              </span>
              {skill.primary_language && (
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {skill.primary_language}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-100">
              {skill.title || skill.name}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {skill.name} • Tác giả: {skill.author || 'Community'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleBookmark(skill.id)}
              className={`p-2.5 rounded-xl border transition-all ${
                skill.is_bookmarked
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Bookmark"
            >
              {skill.is_bookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Scores Overview */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">Trending Score</div>
              <div className="text-2xl font-bold text-amber-400 font-mono">
                {Math.round(skill.trending_score)}/100
              </div>
            </div>
            <div className="text-center border-x border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Quality Score</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {Math.round(skill.quality_score)}/100
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">Personal Match</div>
              <div className="text-2xl font-bold text-indigo-400 font-mono">
                {Math.round(skill.relevance_score)}/100
              </div>
            </div>
          </div>

          {/* AI Summary / Solution Overview */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Giải pháp & Tóm tắt AI
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/40 p-4 rounded-xl border border-slate-800">
              {skill.ai_summary || skill.description}
            </p>
          </div>

          {/* Compatible Agent Runtimes */}
          {skill.runtimes && skill.runtimes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Tương thích Runtimes / AI Agents
              </h4>
              <div className="flex flex-wrap gap-2">
                {skill.runtimes.map((rt) => (
                  <span
                    key={rt}
                    className="px-3 py-1 text-xs font-mono rounded-lg bg-emerald-950/50 text-emerald-300 border border-emerald-800/50"
                  >
                    ✓ {rt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Install & Usage Guide */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
              <Code className="w-4 h-4 text-sky-400" />
              {guide.title}
            </h4>
            <div className="relative rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-slate-200">
              <button
                onClick={() => handleCopyCommand(guide.command)}
                className="absolute right-3 top-3 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>
              <div className="text-emerald-400 font-bold mb-1">$ {guide.command}</div>
              <pre className="mt-3 pt-3 border-t border-slate-800 text-slate-400 overflow-x-auto text-[11px]">
                {guide.config}
              </pre>
            </div>
          </div>

          {/* Tags */}
          {skill.tags && skill.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-slate-400 mb-2">Thẻ (Tags)</h4>
              <div className="flex flex-wrap gap-1.5">
                {skill.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400" />
              {skill.stars.toLocaleString()} Stars
            </span>
            <span className="flex items-center gap-1.5">
              <GitFork className="w-4 h-4 text-slate-400" />
              {skill.forks.toLocaleString()} Forks
            </span>
          </div>

          <a
            href={skill.repository_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-lg shadow-emerald-600/20"
          >
            Mở trên GitHub
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
