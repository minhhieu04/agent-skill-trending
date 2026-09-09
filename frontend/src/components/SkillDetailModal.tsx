import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Code, 
  Scale, 
  FileText, 
  CheckCircle2, 
  Workflow, 
  Sparkles, 
  ArrowRight, 
  Cpu, 
  Boxes, 
  XCircle, 
  BookOpen, 
  MessageSquare, 
  Lightbulb, 
  AlertTriangle, 
  Download, 
  ShieldCheck, 
  Video, 
  RefreshCw,
  Target,
  Languages,
  Loader2
} from 'lucide-react';
import { Skill, SecurityReport, TranslationProviderOption } from '../types';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { ExportModal } from './ExportModal';
import { SecurityBadge } from './SecurityBadge';
import { TechLogo } from './TechLogo';
import { MarkdownRenderer } from './MarkdownRenderer';
import { NeuSelect, NeuSelectOption } from './NeuSelect';
import { api } from '../api/client';

interface SkillDetailModalProps {
  skill: Skill | null;
  onClose: () => void;
  onToggleBookmark: (id: number) => void;
  onOpenStudio?: (skill: Skill) => void;
}

export const SkillDetailModal: React.FC<SkillDetailModalProps> = ({
  skill,
  onClose,
  onToggleBookmark,
  onOpenStudio,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedPromptIdx, setCopiedPromptIdx] = useState<number | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'scenarios' | 'install' | 'compare' | 'security'>('overview');
  const [selectedRuntimeGuide, setSelectedRuntimeGuide] = useState<string>('antigravity');
  const [isScanningSecurity, setIsScanningSecurity] = useState(false);
  const [liveSecurityReport, setLiveSecurityReport] = useState<SecurityReport | null>(null);
  const mouseDownTargetRef = useRef<EventTarget | null>(null);
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && skill) {
        if (isExportOpen) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        onClose();
      }
    };
    if (skill) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [skill, isExportOpen, onClose]);

  const handleScanSecurity = async () => {
    if (!skill) return;
    setIsScanningSecurity(true);
    try {
      const report = await api.getSkillSecurityReport(skill.id);
      setLiveSecurityReport(report);
      showToast('Kiểm định bảo mật thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi kiểm định bảo mật', 'error');
    } finally {
      setIsScanningSecurity(false);
    }
  };

  // Official README & AI Translation State
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [isLoadingReadme, setIsLoadingReadme] = useState<boolean>(false);
  const [isRefreshingReadme, setIsRefreshingReadme] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [readmeMode, setReadmeMode] = useState<'original' | 'translated'>('original');
  const [targetLanguage, setTargetLanguage] = useState<string>('vi');
  const [providers, setProviders] = useState<TranslationProviderOption[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('auto');
  const [translations, setTranslations] = useState<Record<string, { content: string; model_used?: string; provider?: string; translated_at?: string }>>({});
  const [activeTranslationMeta, setActiveTranslationMeta] = useState<{ model_used?: string; provider?: string } | null>(null);
  const [copiedReadme, setCopiedReadme] = useState(false);
  const [summaryText, setSummaryText] = useState<string>('');
  const [isTranslatingSummary, setIsTranslatingSummary] = useState<boolean>(false);

  // Load available translation providers (Gemini, Ollama status, Web Engine)
  useEffect(() => {
    api.getTranslationProviders()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProviders(data);
        }
      })
      .catch((err) => {
        console.warn('Could not load translation providers:', err);
      });
  }, []);

  useEffect(() => {
    if (!skill) {
      setReadmeContent('');
      setTranslations({});
      setReadmeMode('original');
      setActiveTranslationMeta(null);
      setSummaryText('');
      return;
    }

    const initialSummary = skill.ai_summary || skill.description || '';
    setSummaryText(initialSummary);

    // Auto-detect CJK / foreign characters and auto-translate summary to Vietnamese
    const cjkRegex = /[\u4e00-\u9fff]/;
    if (initialSummary && cjkRegex.test(initialSummary)) {
      setIsTranslatingSummary(true);
      api.translateSkillSummary(skill.id)
        .then((res) => {
          if (res.ai_summary && !cjkRegex.test(res.ai_summary)) {
            setSummaryText(res.ai_summary);
            skill.ai_summary = res.ai_summary;
          }
        })
        .catch((err) => {
          console.warn('Could not auto-translate summary:', err);
        })
        .finally(() => {
          setIsTranslatingSummary(false);
        });
    }

    const initial = skill.readme_preview || '';
    setReadmeContent(initial);
    const initialTrans = skill.readme_translations || {};
    setTranslations(initialTrans);

    if (initialTrans['vi']?.content) {
      setActiveTranslationMeta({
        model_used: initialTrans['vi'].model_used,
        provider: initialTrans['vi'].provider,
      });
    } else {
      setActiveTranslationMeta(null);
    }

    const isPlaceholder = !initial || initial.length < 100 || (initial.startsWith('#') && initial.includes('Xem thêm chi tiết tại:'));
    if (isPlaceholder && skill.repository_url) {
      setIsLoadingReadme(true);
      api.getSkillReadme(skill.id)
        .then((data) => {
          if (data.readme) {
            setReadmeContent(data.readme);
          }
          if (data.translations) {
            setTranslations(data.translations);
            if (data.translations['vi']?.content) {
              setActiveTranslationMeta({
                model_used: data.translations['vi'].model_used,
                provider: data.translations['vi'].provider,
              });
            }
          }
        })
        .catch((err) => {
          console.warn('Could not auto-fetch README:', err);
        })
        .finally(() => {
          setIsLoadingReadme(false);
        });
    }
  }, [skill?.id]);

  const handleTranslateReadme = async (force: boolean = false, overrideProvider?: string) => {
    if (!skill) return;
    setIsTranslating(true);
    const providerToUse = overrideProvider || selectedProvider;
    try {
      const res = await api.translateSkillReadme(skill.id, targetLanguage, force, providerToUse);
      if (res.translated_text) {
        setTranslations((prev) => ({
          ...prev,
          [targetLanguage]: {
            content: res.translated_text,
            model_used: res.model_used,
            provider: res.provider,
          }
        }));
        setActiveTranslationMeta({
          model_used: res.model_used,
          provider: res.provider,
        });
        setReadmeMode('translated');
        showToast(
          language === 'vi'
            ? `Dịch thành công bằng ${res.model_used || 'AI'}!`
            : `Translated successfully using ${res.model_used || 'AI'}!`,
          'success'
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi dịch tài liệu', 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRefreshReadme = async () => {
    if (!skill) return;
    setIsRefreshingReadme(true);
    try {
      const res = await api.refreshSkillReadme(skill.id);
      if (res.readme) {
        setReadmeContent(res.readme);
        setTranslations({});
        setReadmeMode('original');
        setActiveTranslationMeta(null);
        showToast(language === 'vi' ? 'Đã tải README mới nhất từ GitHub!' : 'Fetched latest README from GitHub!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi đồng bộ README', 'error');
    } finally {
      setIsRefreshingReadme(false);
    }
  };

  const handleCopyReadme = () => {
    const textToCopy = readmeMode === 'translated' && translations[targetLanguage]?.content
      ? translations[targetLanguage].content
      : readmeContent || skill?.description || '';
    navigator.clipboard.writeText(textToCopy);
    setCopiedReadme(true);
    showToast(language === 'vi' ? 'Đã sao chép nội dung Markdown!' : 'Copied Markdown to clipboard!', 'success');
    setTimeout(() => setCopiedReadme(false), 2000);
  };

  const languageOptions: NeuSelectOption<string>[] = useMemo(() => [
    { value: 'vi', label: 'Tiếng Việt', sublabel: 'Vietnamese', icon: <span className="text-sm">🇻🇳</span> },
    { value: 'en', label: 'English', sublabel: 'Tiếng Anh', icon: <span className="text-sm">🇬🇧</span> },
    { value: 'ja', label: '日本語', sublabel: 'Japanese', icon: <span className="text-sm">🇯🇵</span> },
    { value: 'zh', label: '简体中文', sublabel: 'Simplified Chinese', icon: <span className="text-sm">🇨🇳</span> },
    { value: 'ko', label: '한국어', sublabel: 'Korean', icon: <span className="text-sm">🇰🇷</span> },
  ], []);

  const providerOptions: NeuSelectOption<string>[] = useMemo(() => {
    const rawList = providers.length > 0 ? providers : [
      {
        id: 'auto',
        name: 'Tự động thông minh (Auto)',
        description: 'Tự động ưu tiên Gemini / Local Ollama -> Web Engine',
        available: true,
        badge: 'Khuyên dùng',
        category: 'auto'
      },
      {
        id: 'local_llm',
        name: 'Local LLM (Ollama)',
        description: 'Chạy trực tiếp trên máy cá nhân (Offline, bảo mật, miễn phí)',
        available: true,
        badge: 'Local AI',
        category: 'local'
      },
      {
        id: 'gemini',
        name: 'Google Gemini Cloud',
        description: 'Mô hình Cloud AI tốc độ cao của Google',
        available: true,
        badge: 'Cloud AI',
        category: 'gemini'
      },
      {
        id: 'translation_engine',
        name: 'Web Translation Engine',
        description: 'Dịch nhanh dự phòng không cần AI API key',
        available: true,
        badge: 'Miễn phí',
        category: 'fallback'
      }
    ];

    return rawList.map((p) => {
      const isLocal = p.id === 'local_llm';
      const cleanName = p.name.replace(/^⚡\s*/, '').replace(/^🖥️\s*/, '').replace(/^🌐\s*/, '');
      let icon = <Sparkles className="w-3.5 h-3.5 text-blue-500" />;
      if (p.id === 'auto') {
        icon = <Zap className="w-3.5 h-3.5 text-amber-500" />;
      } else if (isLocal) {
        icon = <Cpu className="w-3.5 h-3.5 text-purple-500" />;
      } else if (p.id === 'translation_engine') {
        icon = <Languages className="w-3.5 h-3.5 text-emerald-500" />;
      }

      return {
        value: p.id,
        label: cleanName,
        sublabel: p.description,
        badge: p.badge,
        icon,
        disabled: false,
      };
    });
  }, [providers]);

  const handleTargetLanguageChange = (newLang: string) => {
    setTargetLanguage(newLang);
    if (readmeMode === 'translated' && skill) {
      if (translations[newLang]?.content) {
        setActiveTranslationMeta({
          model_used: translations[newLang].model_used,
          provider: translations[newLang].provider,
        });
      } else {
        setIsTranslating(true);
        api.translateSkillReadme(skill.id, newLang, false, selectedProvider)
          .then((res) => {
            if (res.translated_text) {
              setTranslations((prev) => ({
                ...prev,
                [newLang]: {
                  content: res.translated_text,
                  model_used: res.model_used,
                  provider: res.provider,
                }
              }));
              setActiveTranslationMeta({
                model_used: res.model_used,
                provider: res.provider,
              });
            }
          })
          .catch((err) => {
            showToast(err.message || 'Lỗi dịch thuật', 'error');
          })
          .finally(() => {
            setIsTranslating(false);
          });
      }
    }
  };

  const handleProviderChange = (newProvider: string) => {
    setSelectedProvider(newProvider);
    if (readmeMode === 'translated') {
      handleTranslateReadme(true, newProvider);
    }
  };

  if (!skill) return null;

  const handleCopyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast(t('toast_copied'), 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPrompt = (prompt: string, idx: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPromptIdx(idx);
    showToast(t('toast_prompt_copied'), 'success');
    setTimeout(() => setCopiedPromptIdx(null), 2000);
  };

  // Generate Rich Deep-Dive Scenarios & Community Article Data based on skill properties
  const getEnrichedUseCases = () => {
    // If the skill has use_cases in DB, create tailored deep scenarios for each one!
    if (skill.use_cases && skill.use_cases.length > 0) {
      return skill.use_cases.map((uc, idx) => {
        let problem = `Khi yêu cầu AI thực hiện "${uc}", AI thường thiếu ngữ cảnh dự án, sinh mã rời rạc hoặc bỏ quên các bước kiểm thử quan trọng.`;
        let codeSnippet = `// Áp dụng quy chuẩn từ ${skill.title || skill.name}\n// Use case: ${uc}\nconsole.log("Ready for production execution");`;
        let prompt = `Áp dụng tiêu chuẩn từ ${skill.title || skill.name}: Hãy thực hiện "${uc}". Tuân thủ Clean Architecture, error handling nghiêm ngặt và viết kèm test case tương ứng.`;
        let agentAction = `Agent đọc quy tắc của ${skill.name}, nạp context về ${skill.primary_language || 'dự án'}, tự động xử lý ${uc.toLowerCase()} và kiểm tra tính hợp lệ trước khi bàn giao.`;
        let tip = `Định cấu hình rule tại .cursor/rules/${skill.name.replace(/[^a-zA-Z0-9]/g, '-')}.mdc hoặc .gemini/config/skills/ để Agent tự động áp dụng.`;

        const ucLower = uc.toLowerCase();
        if (ucLower.includes('subagent') || ucLower.includes('phân rã') || ucLower.includes('autonomous')) {
          problem = "AI thông thường cố gắng giải quyết toàn bộ task lớn trong một câu trả lời duy nhất, dẫn đến code bị cắt xén, hallucination hoặc không có kiểm định bài bản.";
          prompt = `Phân rã task lớn thành các subtasks độc lập và điều phối Autonomous Subagents thực thi song song theo phương pháp Subagent-Driven Development cho "${uc}".`;
          agentAction = `Agent phân chia phạm vi công việc, kích hoạt worker subagents với nhiệm vụ rõ ràng, theo dõi tiến độ và đánh giá kỹ lưỡng tại từng checkpoint.`;
          codeSnippet = `# Subagent-Driven Development Execution Plan\nsubagent: worker-execution\ntask: "${uc}"\nvalidation:\n  - run_unit_tests: true\n  - lint_check: passed\ncheckpoints:\n  - verify_against_requirements: true`;
          tip = "Sử dụng lệnh điều phối subagents hoặc /dispatch để tận dụng tối đa sức mạnh phân luồng của Google Antigravity & Claude Code.";
        } else if (ucLower.includes('security') || ucLower.includes('bảo mật') || ucLower.includes('audit')) {
          problem = "Phần lớn code sinh ra bởi LLM có thể chứa các lỗ hổng rò rỉ thông tin đăng nhập, SQL Injection hoặc thiếu kiểm tra phân quyền truy cập.";
          prompt = `Kiểm định an toàn và quét lỗ hổng theo chuẩn Security Guardrails của ${skill.title || skill.name} đối với mã nguồn liên quan đến "${uc}".`;
          agentAction = `Agent kích hoạt bộ AST scanner, rà soát các secrets trong environment, phân tích dữ liệu đầu vào và đề xuất patch khắc phục ngay lập tức.`;
          codeSnippet = `// Security Audit Checkpoint\nconst auditResult = await securityGuardrail.scan({\n  scope: "${uc}",\n  strict: true\n});\nconsole.assert(auditResult.isSafe, "Security check failed!");`;
          tip = "Đặt mức kiểm định bảo mật 'Strict Sandbox' trước khi cho phép Agent chạy các lệnh bash hoặc can thiệp file hệ thống.";
        }

        return {
          title: `Tình Huống ${idx + 1}: ${uc}`,
          problem,
          prompt,
          agentAction,
          codeExample: codeSnippet,
          tip
        };
      });
    }

    // Default Fallback Rich Scenarios
    return [
      {
        title: `Tình Huống 1: Tối ưu quy trình & Tiêu chuẩn hóa mã nguồn`,
        problem: `Lập trình viên và AI thường xuyên có sự lệch pha trong quy chuẩn code, dẫn đến việc phải refactor liên tục và phát sinh lỗi runtime ngoài ý muốn.`,
        prompt: `Sử dụng quy tắc của ${skill.title || skill.name}: Tối ưu hóa kiến trúc module hiện tại, bổ sung typing chặt chẽ, xử lý ngoại lệ biên và viết unit test bao phủ toàn bộ luồng.`,
        agentAction: `Agent nạp rule ${skill.name}, quét cấu trúc thư mục, tự động áp dụng pattern phù hợp với stack ${skill.primary_language || 'công nghệ'} và chạy verify.`,
        codeExample: `// Production Pattern via ${skill.name}\nexport async function executeStandardizedWorkflow() {\n  // Automated validation\n  return { status: 'verified', timestamp: Date.now() };\n}`,
        tip: `Có thể bổ sung yêu cầu 'Trình bày tư duy phản biện trước khi viết code' vào prompt để tăng độ tin cậy của AI.`
      },
      {
        title: `Tình Huống 2: Tự động hóa kiểm thử & Bàn giao chất lượng cao`,
        problem: `AI thường bỏ qua bước viết test case hoặc chỉ viết các test case đơn giản (happy path), bỏ sót các trường hợp biên nguy hiểm (edge cases).`,
        prompt: `Dựa trên đặc tả của ${skill.title || skill.name}: Viết bộ kiểm thử toàn diện gồm Unit Test, Integration Test và kiểm tra các trường hợp biên đặc thù.`,
        agentAction: `Agent sinh test suite theo chuẩn của dự án, mock các external service chính xác và đảm bảo tỷ lệ coverage đạt trên 90%.`,
        codeExample: `describe("${skill.name} Verification Suite", () => {\n  it("should handle boundary conditions properly", async () => {\n    // Automated test assertion\n  });\n});`,
        tip: `Kết hợp kỹ thuật Test-Driven Development (TDD) bằng cách yêu cầu Agent viết test trước khi viết code logic.`
      }
    ];
  };

  const getRuntimeInstallConfigs = () => {
    const isMCP = skill.category === 'mcp-server';
    const serverName = skill.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const safeTitle = skill.title || skill.name;

    if (isMCP) {
      return {
        antigravity: {
          title: 'Google Antigravity MCP',
          file: '~/.gemini/antigravity/mcp_config.json',
          code: JSON.stringify({
            mcpServers: {
              [serverName]: {
                command: 'npx',
                args: ['-y', `@modelcontextprotocol/server-${serverName}`],
                env: {
                  GITHUB_PERSONAL_ACCESS_TOKEN: 'ghp_your_token_here'
                }
              }
            }
          }, null, 2),
          command: `curl -fsSL http://localhost:8899/api/v1/skills/${skill.id}/export/antigravity/raw >> ~/.gemini/antigravity/mcp_config.json`
        },
        cursor: {
          title: 'Cursor IDE (.cursor/mcp.json)',
          file: '.cursor/mcp.json',
          code: JSON.stringify({
            mcpServers: {
              [serverName]: {
                command: 'npx',
                args: ['-y', `@modelcontextprotocol/server-${serverName}`]
              }
            }
          }, null, 2),
          command: `curl -fsSL http://localhost:8899/api/v1/skills/${skill.id}/export/cursor/raw > .cursor/mcp.json`
        },
        claude: {
          title: 'Claude Desktop / Claude Code',
          file: 'claude_desktop_config.json',
          code: JSON.stringify({
            mcpServers: {
              [serverName]: {
                command: 'npx',
                args: ['-y', `@modelcontextprotocol/server-${serverName}`]
              }
            }
          }, null, 2),
          command: `curl -fsSL http://localhost:8899/api/v1/skills/${skill.id}/export/claude/raw > claude_desktop_config.json`
        },
        windsurf: {
          title: 'Windsurf IDE (Cascade)',
          file: '~/.codeium/windsurf/mcp_config.json',
          code: JSON.stringify({
            mcpServers: {
              [serverName]: {
                command: 'npx',
                args: ['-y', `@modelcontextprotocol/server-${serverName}`]
              }
            }
          }, null, 2),
          command: `curl -fsSL http://localhost:8899/api/v1/skills/${skill.id}/export/windsurf/raw > ~/.codeium/windsurf/mcp_config.json`
        },
        aider: {
          title: 'Aider CLI (.aider.conf.yml)',
          file: '.aider.conf.yml',
          code: `# Aider configuration for ${skill.name}\nread: [".aider.tags.cache.v3"]\nauto-commits: true`,
          command: `curl -fsSL http://localhost:8899/api/v1/skills/${skill.id}/export/aider/raw > .aider.conf.yml`
        }
      };
    }

    return {
      antigravity: {
        title: 'Google Antigravity Skill (.gemini/config/skills/)',
        file: `.gemini/config/skills/${serverName}/SKILL.md`,
        code: `---\nname: ${serverName}\ndescription: ${safeTitle}\n---\n\n# ${safeTitle}\n\n${skill.description || ''}\n\n## Khi Nào Sử Dụng\n- Sử dụng khi cần giải quyết các bài toán về ${skill.category}\n- Tối ưu cho ngôn ngữ ${skill.primary_language || 'General'}\n`,
        command: `mkdir -p ~/.gemini/config/skills/${serverName} && curl -fsSL http://localhost:8899/api/v1/skills/${skill.id}/export/antigravity/raw > ~/.gemini/config/skills/${serverName}/SKILL.md`
      },
      cursor: {
        title: 'Cursor Rules (.cursor/rules/)',
        file: `.cursor/rules/${serverName}.mdc`,
        code: `---\ndescription: ${safeTitle}\nglobs: *.{${(skill.primary_language || 'ts,js').toLowerCase()}}\n---\n\n# ${safeTitle}\n\n${skill.description || ''}\n`,
        command: `mkdir -p .cursor/rules && curl -fsSL http://localhost:8899/api/v1/skills/${skill.id}/export/cursor/raw > .cursor/rules/${serverName}.mdc`
      },
      claude: {
        title: 'Claude Code Skill / Rule',
        file: `.claude/skills/${serverName}/SKILL.md`,
        code: `# ${safeTitle}\n\n${skill.description || ''}\n\nÁp dụng cho mọi tác vụ liên quan đến ${skill.category}.`,
        command: `mkdir -p .claude/skills/${serverName} && curl -fsSL http://localhost:8899/api/v1/skills/${skill.id}/export/claude/raw > .claude/skills/${serverName}/SKILL.md`
      },
      windsurf: {
        title: 'Windsurf Memories / Rules',
        file: `.windsurfrules`,
        code: `# Rules for ${skill.name}\n${skill.description || ''}`,
        command: `curl -fsSL http://localhost:8899/api/v1/skills/${skill.id}/export/windsurf/raw >> .windsurfrules`
      },
      aider: {
        title: 'Aider Conventions',
        file: '.aider.conf.yml',
        code: `# Aider conventions for ${skill.name}\nauto-commits: true\nread:\n  - CONVENTIONS.md`,
        command: `curl -fsSL http://localhost:8899/api/v1/skills/${skill.id}/export/aider/raw > .aider.conf.yml`
      }
    };
  };

  const configs = getRuntimeInstallConfigs();
  const enrichedUseCases = getEnrichedUseCases();

  const modalTabs = [
    {
      id: 'overview' as const,
      label: language === 'vi' ? 'Tổng Quan & Luồng' : 'Overview & Flow',
      icon: BookOpen,
    },
    {
      id: 'scenarios' as const,
      label: language === 'vi' ? 'Kịch Bản & Prompt' : 'Prompts & Scenarios',
      icon: MessageSquare,
      badge: enrichedUseCases.length > 0 ? String(enrichedUseCases.length) : undefined,
    },
    {
      id: 'install' as const,
      label: language === 'vi' ? 'Cài Đặt Đa IDE' : 'Multi-IDE Setup',
      icon: Code,
    },
    {
      id: 'compare' as const,
      label: language === 'vi' ? 'So Sánh Hiệu Quả' : 'Benchmark & Compare',
      icon: Scale,
    },
    {
      id: 'security' as const,
      label: language === 'vi' ? 'Kiểm Định & Docs' : 'Security & Docs',
      icon: ShieldCheck,
      badge: (skill.security_rating || 'SAFE').toUpperCase(),
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-slate-950/50 dark:bg-black/70 backdrop-blur-md animate-modal-backdrop"
      onMouseDown={(e) => {
        mouseDownTargetRef.current = e.target;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && mouseDownTargetRef.current === e.currentTarget) {
          onClose();
        }
      }}
    >
      <ExportModal 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        skill={skill} 
      />
      <div 
        className="relative w-full max-w-5xl neu-modal rounded-3xl overflow-hidden flex flex-col h-[92vh] sm:h-[88vh] animate-modal-pop transition-all text-[var(--text-main)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header - Always Fixed at Top */}
        <div className="p-4 sm:p-5 bg-[var(--bg)] flex flex-row items-start justify-between gap-3 sm:gap-4 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-mono font-bold text-[var(--primary)] neu-inset-sm px-2.5 py-0.5 rounded-xl whitespace-nowrap shrink-0 inline-flex items-center">
                {skill.category}
              </span>
              <SecurityBadge rating={skill.security_rating || 'safe'} score={skill.security_score || 95} size="sm" />
              {skill.primary_language && (
                <span className="text-[11px] font-mono font-bold text-[var(--text-muted)] neu-inset-sm px-2.5 py-0.5 rounded-xl whitespace-nowrap shrink-0 inline-flex items-center">
                  {skill.primary_language}
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-xl font-black text-[var(--text-main)] tracking-tight leading-snug break-words">
              {skill.title || skill.name}
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-1 break-all sm:break-normal flex items-center gap-1.5 flex-wrap">
              <span>{skill.name}</span>
              <span>•</span>
              <span>{language === 'vi' ? 'Tác giả:' : 'Author:'} <span className="text-[var(--text-main)] font-bold">{skill.author || 'Community'}</span></span>
              {skill.repository_url && (
                <a
                  href={skill.repository_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--primary)] hover:underline inline-flex items-center gap-0.5 ml-1 font-bold"
                  title="Mở repository trên GitHub"
                >
                  <span>(GitHub)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {/* AI Video & Blog Studio Button */}
            {onOpenStudio && (
              <button
                onClick={() => {
                  onClose();
                  onOpenStudio(skill);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl neu-btn text-[var(--primary)] font-bold text-xs shrink-0 cursor-pointer hover:text-[var(--primary)] transition-all"
                title={t('studio_btn_create_from_skill')}
                aria-label={t('studio_btn_create_from_skill')}
              >
                <Video className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{t('studio_btn_create_from_skill')}</span>
              </button>
            )}

            {/* 1-Click Multi-IDE Export Button */}
            <button
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl neu-primary font-bold text-xs shrink-0 cursor-pointer"
              title={t('btn_export')}
              aria-label={t('btn_export')}
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{t('btn_export')}</span>
            </button>

            <button
              onClick={() => onToggleBookmark(skill.id)}
              className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                skill.is_bookmarked
                  ? 'neu-inset text-amber-500 font-bold'
                  : 'neu-btn text-[var(--text-muted)] hover:text-amber-500'
              }`}
              title={skill.is_bookmarked ? (language === 'vi' ? 'Bỏ lưu bookmark' : 'Remove bookmark') : (language === 'vi' ? 'Lưu bookmark' : 'Bookmark')}
              aria-label={skill.is_bookmarked ? (language === 'vi' ? 'Bỏ lưu bookmark' : 'Remove bookmark') : (language === 'vi' ? 'Lưu bookmark' : 'Bookmark')}
            >
              {skill.is_bookmarked ? <BookmarkCheck className="w-4 h-4 text-amber-500" /> : <Bookmark className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors shrink-0 cursor-pointer"
              title={language === 'vi' ? 'Đóng (Esc)' : 'Close (Esc)'}
              aria-label={language === 'vi' ? 'Đóng (Esc)' : 'Close (Esc)'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="neu-divider" />

        {/* Tab Navigation - Modern Segmented Control */}
        <div className="bg-[var(--bg)] px-3 sm:px-6 py-2.5 shrink-0">
          <div className="p-1 rounded-2xl neu-inset flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
            {modalTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[110px] sm:min-w-0 py-2 px-2.5 sm:px-3 rounded-xl transition-all duration-200 ease-out active:scale-[0.97] flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer ${
                    isActive
                      ? 'neu-primary text-white font-bold shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--primary)] font-medium hover:bg-[var(--shadow-dark)]/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono shrink-0 whitespace-nowrap inline-flex items-center ${
                      isActive ? 'bg-white/25 text-white font-bold' : 'neu-inset-sm text-[var(--primary)]'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="neu-divider" />


        {/* Modal Body with Internal Scrolling */}
        <div className="p-4 sm:p-6 md:p-7 overflow-y-auto space-y-6 flex-1 min-h-0 text-slate-800 dark:text-slate-200 overscroll-contain scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          
          {/* TAB 1: TỔNG QUAN & LUỒNG (OVERVIEW & FLOW) */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in leading-relaxed">
              {/* Article Header Card */}
              <div className="p-5 sm:p-6 rounded-2xl neu-flat space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-[var(--primary)] shrink-0" />
                  <span>{language === 'vi' ? 'Chuyên Đề Đánh Giá & Hướng Dẫn Thực Hành Toàn Diện' : 'In-depth Practical Guide & Overview'}</span>
                </div>
                <h3 className="text-lg sm:text-2xl font-black text-[var(--text-main)] leading-snug">
                  {language === 'vi' ? `Hiểu rõ bản chất & Làm chủ ${skill.title || skill.name} trong 5 phút` : `Master ${skill.title || skill.name} in 5 Minutes`}
                </h3>
                <div className="relative flex flex-col gap-1.5">
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                    {summaryText || skill.ai_summary || skill.description}
                  </p>
                  {isTranslatingSummary && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--primary)] font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>{language === 'vi' ? 'Đang dịch tóm tắt sang Tiếng Việt...' : 'Translating summary to Vietnamese...'}</span>
                    </div>
                  )}
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 sm:gap-4 text-xs font-medium text-[var(--text-muted)]">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" /> {language === 'vi' ? 'Dành cho:' : 'Audience:'} <strong className="text-[var(--text-main)]">{skill.target_audience || 'Developers'}</strong></span>
                    <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" /> {language === 'vi' ? 'Đánh giá:' : 'Community:'} <strong className="text-amber-500">{skill.stars.toLocaleString()} Stars</strong></span>
                  </div>
                  <button
                    onClick={async () => {
                      if (!skill || isTranslatingSummary) return;
                      setIsTranslatingSummary(true);
                      try {
                        const res = await api.translateSkillSummary(skill.id);
                        if (res.ai_summary) {
                          setSummaryText(res.ai_summary);
                          skill.ai_summary = res.ai_summary;
                          showToast(language === 'vi' ? 'Đã dịch tóm tắt sang Tiếng Việt!' : 'Summary translated to Vietnamese!', 'success');
                        }
                      } catch (err: any) {
                        showToast(err.message || 'Lỗi dịch tóm tắt', 'error');
                      } finally {
                        setIsTranslatingSummary(false);
                      }
                    }}
                    disabled={isTranslatingSummary}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                    title={language === 'vi' ? 'Dịch tóm tắt sang Tiếng Việt bằng AI' : 'Translate summary with AI'}
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{language === 'vi' ? 'Dịch tóm tắt AI' : 'Translate Summary'}</span>
                  </button>
                </div>
              </div>

              {/* Section 1 & 2: The Problem & The Solution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Problem */}
                <div className="p-5 rounded-2xl neu-flat space-y-3">
                  <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{language === 'vi' ? '1. Vấn đề thực tế (The Problem)' : '1. Real-world Challenge'}</span>
                  </h4>
                  <div className="p-4 rounded-xl neu-inset text-xs text-[var(--text-main)] space-y-2">
                    <p>
                      {language === 'vi' ? (
                        <>Khi phát triển trên nền tảng <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{skill.primary_language || 'công nghệ'}</strong> mà thiếu quy chuẩn từ <strong className="text-[var(--text-main)]">{skill.title || skill.name}</strong>:</>
                      ) : (
                        <>When developing without conventions from <strong className="text-[var(--text-main)]">{skill.title || skill.name}</strong>:</>
                      )}
                    </p>
                    <ul className="list-disc pl-4 space-y-1.5 text-[var(--text-muted)]">
                      <li>
                        <strong>Context Deficit:</strong> AI thường sinh code chung chung, không nắm rõ kiến trúc và quy ước của dự án.
                      </li>
                      <li>
                        <strong>Pattern Drift:</strong> Thiếu các chỉ dẫn cụ thể cho stack {skill.primary_language || 'dự án'}, dẫn đến code dễ hallucination hoặc thiếu test.
                      </li>
                      <li>
                        <strong>Tốn công kiểm định:</strong> Thiếu sandbox guardrail và test case tự động khiến dev phải tự debug thủ công.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Solution */}
                <div className="p-5 rounded-2xl neu-flat space-y-3">
                  <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{language === 'vi' ? '2. Giải pháp triệt để (The Solution)' : '2. The Solution'}</span>
                  </h4>
                  <div className="p-4 rounded-xl neu-flat text-xs text-[var(--text-main)] space-y-3">
                    <p className="leading-relaxed text-[var(--text-muted)]">
                      {skill.comparison_notes || 'Giải pháp này đóng vai trò như một lớp Protocol / Rules trung gian chuẩn hóa, nạp sẵn toàn bộ kiến thức chuyên sâu và công cụ cần thiết vào bộ nhớ của AI Agent.'}
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="p-2.5 rounded-xl neu-inset-sm text-center">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">+{Math.max(65, Math.round(skill.trending_score))}% Tốc Độ</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Trending Score</div>
                      </div>
                      <div className="p-2.5 rounded-xl neu-inset-sm text-center">
                        <div className="font-bold text-sky-600 dark:text-sky-400 text-xs sm:text-sm">{Math.round(skill.quality_score)}/100</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Chất lượng mã</div>
                      </div>
                      <div className="p-2.5 rounded-xl neu-inset-sm text-center">
                        <div className="font-bold text-purple-600 dark:text-purple-400 text-xs sm:text-sm">{(skill.runtimes?.length || 4)}+ IDE</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Tương thích</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sơ Đồ Luồng Thực Thi Của Agent */}
              <div>
                <h4 className="text-sm font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-[var(--primary)] shrink-0" />
                  <span>{language === 'vi' ? 'Sơ Đồ Luồng Thực Thi Của Agent' : 'Agent Execution Flow Diagram'}</span>
                </h4>
                
                <div className="p-5 sm:p-6 rounded-2xl neu-flat space-y-4">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
                    {/* Node 1: Developer Intent */}
                    <div className="flex-1 p-4 rounded-2xl neu-inset text-center">
                      <div className="w-8 h-8 mx-auto rounded-xl neu-inset-sm text-[var(--primary)] flex items-center justify-center mb-2">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-[var(--text-main)]">1. Developer Intent</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-1 line-clamp-1" title={skill.use_cases?.[0] || skill.title || skill.name}>
                        "{skill.use_cases?.[0] || skill.title || skill.name}"
                      </div>
                      <div className="mt-2 text-[10px] font-mono text-[var(--primary)] neu-inset-sm px-2 py-0.5 rounded-lg inline-block font-bold">
                        {(skill.tags || []).slice(0, 2).map(t => `#${t}`).join(' ') || `#${skill.category}`}
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="flex items-center justify-center py-1 md:py-0">
                      <ArrowRight className="hidden md:block w-5 h-5 text-[var(--primary)] shrink-0" />
                      <ArrowRight className="md:hidden w-5 h-5 text-[var(--primary)] shrink-0 rotate-90" />
                    </div>

                    {/* Node 2: Skill / Protocol Layer */}
                    <div className="flex-1 p-4 rounded-2xl neu-primary text-center text-white">
                      <div className="w-8 h-8 mx-auto rounded-xl bg-white/20 text-white flex items-center justify-center mb-2 font-bold">
                        <Boxes className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-white truncate">{skill.title || skill.name}</div>
                      <div className="text-[10px] text-white/90 mt-1 font-mono">
                        {skill.category === 'mcp-server' ? 'MCP Protocol Tool Call' : 'Procedural Rule Engine'}
                      </div>
                      <div className="mt-2 text-[10px] font-mono text-white bg-black/20 px-2 py-0.5 rounded-lg inline-block">
                        Quyền: {skill.permission_level || 'read_only'}
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="flex items-center justify-center py-1 md:py-0">
                      <ArrowRight className="hidden md:block w-5 h-5 text-[var(--primary)] shrink-0" />
                      <ArrowRight className="md:hidden w-5 h-5 text-[var(--primary)] shrink-0 rotate-90" />
                    </div>

                    {/* Node 3: Target System / Execution */}
                    <div className="flex-1 p-4 rounded-2xl neu-inset text-center">
                      <div className="w-8 h-8 mx-auto rounded-xl neu-inset-sm text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-[var(--text-main)]">3. {skill.primary_language || 'Mã Nguồn'} Runtime</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-1">
                        Kiểm thử & Linter tự động
                      </div>
                      <div className="mt-2 text-[10px] font-mono text-purple-600 dark:text-purple-400 neu-inset-sm px-2 py-0.5 rounded-lg inline-block font-bold">
                        {(skill.runtimes || ['antigravity', 'cursor', 'claude']).slice(0, 3).join(', ')}
                      </div>
                    </div>
                  </div>

                  {/* Architecture Specs Breakdown */}
                  <div className="neu-divider my-3" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                    <div className="p-3 rounded-xl neu-inset-sm">
                      <span className="text-[var(--text-muted)] block font-semibold mb-0.5">Giao thức tương tác</span>
                      <span className="text-[var(--text-main)] font-mono font-medium">
                        {skill.category === 'mcp-server' ? 'JSON-RPC (Model Context Protocol)' : 'Agent Prompt Directives & Rules'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl neu-inset-sm">
                      <span className="text-[var(--text-muted)] block font-semibold mb-0.5">Môi trường thực thi</span>
                      <span className="text-[var(--text-main)] font-mono font-medium">
                        {skill.primary_language ? `${skill.primary_language} Environment` : 'Polyglot System'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl neu-inset-sm">
                      <span className="text-[var(--text-muted)] block font-semibold mb-0.5">Mức độ bảo vệ Sandbox</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                        {skill.permission_level === 'read_only' ? 'Strict Read-Only Isolation' : `${skill.permission_level || 'Safe'} Guardrail`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Quick 3-Step Setup */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-sky-500 shrink-0" />
                  <span>{language === 'vi' ? '3. Quy trình 3 bước tích hợp nhanh' : '3-Step Quick Integration'}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div 
                    onClick={() => setActiveTab('install')}
                    className="p-4 rounded-2xl neu-flat-sm space-y-2 cursor-pointer hover:scale-[1.02] transition-transform"
                  >
                    <span className="w-6 h-6 rounded-lg neu-primary text-white font-bold flex items-center justify-center text-xs">1</span>
                    <div className="font-bold text-[var(--text-main)]">Cài đặt cấu hình</div>
                    <div className="text-[var(--text-muted)] text-[11px]">Chuyển sang tab "Cài Đặt Đa IDE" để copy file cấu hình cho {selectedRuntimeGuide.toUpperCase()} hoặc chạy lệnh curl tự động.</div>
                  </div>
                  <div 
                    onClick={() => setActiveTab('scenarios')}
                    className="p-4 rounded-2xl neu-flat-sm space-y-2 cursor-pointer hover:scale-[1.02] transition-transform"
                  >
                    <span className="w-6 h-6 rounded-lg neu-primary text-white font-bold flex items-center justify-center text-xs">2</span>
                    <div className="font-bold text-[var(--text-main)]">Áp dụng Prompt</div>
                    <div className="text-[var(--text-muted)] text-[11px]">Chọn một trong {enrichedUseCases.length} tình huống thực chiến ở tab "Kịch Bản & Prompt" để AI Agent thực thi.</div>
                  </div>
                  <div 
                    onClick={() => setActiveTab('security')}
                    className="p-4 rounded-2xl neu-flat-sm space-y-2 cursor-pointer hover:scale-[1.02] transition-transform"
                  >
                    <span className="w-6 h-6 rounded-lg neu-primary text-white font-bold flex items-center justify-center text-xs">3</span>
                    <div className="font-bold text-[var(--text-main)]">Kiểm thử & Bàn giao</div>
                    <div className="text-[var(--text-muted)] text-[11px]">Xác nhận kết quả với bộ test tự động và mức bảo mật {skill.security_rating?.toUpperCase() || 'SAFE'} ở tab "Kiểm Định & Docs".</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KỊCH BẢN & PROMPT THỰC CHIẾN (SCENARIOS & PROMPTS) */}
          {activeTab === 'scenarios' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{language === 'vi' ? 'Các Tình Huống Thực Chiến Kèm Prompt Mẫu & Code Minh Họa' : 'Practical Scenarios, Prompts & Code'}</span>
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {language === 'vi' ? 'Bấm sao chép prompt để AI Agent thực thi tác vụ chính xác tuyệt đối' : 'Click to copy prompt directly for your AI Agent'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {enrichedUseCases.map((uc, idx) => (
                  <div 
                    key={idx} 
                    className="p-5 sm:p-6 rounded-2xl neu-flat space-y-3.5 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-xl neu-inset-sm text-[var(--primary)] flex items-center justify-center font-mono font-bold text-xs shrink-0">
                        0{idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-bold text-[var(--text-main)] leading-snug">
                          {uc.title}
                        </h5>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                          <strong className="text-rose-600 dark:text-rose-400">Vấn đề: </strong>{uc.problem}
                        </p>
                      </div>
                    </div>

                    {/* Prompt */}
                    <div className="rounded-2xl neu-inset p-3.5 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[var(--text-main)]">
                        <span className="flex items-center gap-1.5 text-[var(--primary)]">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                          <span>Prompt Mẫu Cho AI:</span>
                        </span>
                        <button
                          onClick={() => handleCopyPrompt(uc.prompt, idx)}
                          className="flex items-center gap-1 px-3 py-1 rounded-xl neu-btn text-[11px] font-semibold text-[var(--text-main)] transition-colors ml-auto cursor-pointer"
                        >
                          {copiedPromptIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedPromptIdx === idx ? 'Đã sao chép' : 'Sao chép prompt'}</span>
                        </button>
                      </div>
                      <p className="text-xs font-mono text-[var(--text-main)] p-3 rounded-xl neu-inset-sm whitespace-pre-wrap break-words leading-relaxed">
                        "{uc.prompt}"
                      </p>
                    </div>

                    {/* Agent Execution */}
                    <div className="text-xs text-[var(--text-main)] flex items-start gap-2 p-3 rounded-xl neu-inset-sm leading-relaxed">
                      <ArrowRight className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-[var(--primary)]">Cách Agent xử lý: </strong>
                        {uc.agentAction}
                      </div>
                    </div>

                    {/* Code Snippet */}
                    {uc.codeExample && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1 uppercase tracking-wider">
                          <Code className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                          <span>Cấu hình / Code mẫu minh họa:</span>
                        </div>
                        <pre className="p-3.5 rounded-xl neu-inset text-[11px] font-mono text-[var(--text-main)] overflow-x-auto max-w-full leading-relaxed">
                          {uc.codeExample}
                        </pre>
                      </div>
                    )}

                    {/* Pro Tip */}
                    {uc.tip && (
                      <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300/90 p-3 rounded-xl neu-inset-sm leading-relaxed">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span><strong>Mẹo chuyên gia: </strong>{uc.tip}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SO SÁNH HIỆU QUẢ (BENCHMARK & COMPARE) */}
          {activeTab === 'compare' && (
            <div className="space-y-6 animate-fade-in">
              {/* Score Radar / Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl neu-flat">
                <div className="p-3 text-center rounded-xl neu-inset-sm">
                  <div className="text-[11px] font-semibold text-[var(--text-muted)] mb-0.5">Trending Score</div>
                  <div className="text-xl sm:text-2xl font-black text-[var(--primary)] font-mono">
                    {Math.round(skill.trending_score)}<span className="text-xs text-[var(--text-muted)]">/100</span>
                  </div>
                </div>
                <div className="p-3 text-center rounded-xl neu-inset-sm">
                  <div className="text-[11px] font-semibold text-[var(--text-muted)] mb-0.5">Quality Score</div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {Math.round(skill.quality_score)}<span className="text-xs text-[var(--text-muted)]">/100</span>
                  </div>
                </div>
                <div className="p-3 text-center rounded-xl neu-inset-sm">
                  <div className="text-[11px] font-semibold text-[var(--text-muted)] mb-0.5">Personal Match</div>
                  <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {Math.round(skill.relevance_score)}<span className="text-xs text-[var(--text-muted)]">/100</span>
                  </div>
                </div>
                <div className="p-3 text-center rounded-xl neu-inset-sm">
                  <div className="text-[11px] font-semibold text-[var(--text-muted)] mb-0.5">Cộng Đồng GitHub</div>
                  <div className="text-xl sm:text-2xl font-black text-amber-500 font-mono flex items-center justify-center gap-1">
                    <span>{skill.stars.toLocaleString()}</span>
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400 inline" />
                  </div>
                </div>
              </div>

              {/* Before vs After Comparison */}
              <div>
                <h4 className="text-sm font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>Hiệu Quả Thực Tế: Trước và Sau Khi Sử Dụng</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* BEFORE */}
                  <div className="p-5 rounded-2xl neu-flat space-y-3">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>Trước khi áp dụng {skill.title || skill.name}:</span>
                    </div>
                    <ul className="space-y-2 text-xs text-[var(--text-main)]">
                      <li className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>AI không có ngữ cảnh chuyên sâu về stack <strong className="text-rose-600 dark:text-rose-400 font-semibold">{skill.primary_language || 'công nghệ'}</strong>, sinh code chung chung hoặc sai lệch thư viện chuẩn.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>Thiếu hướng dẫn chuẩn cho tác vụ chính, lập trình viên phải tự viết prompt dài hàng chục dòng mỗi khi mở chat.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>Dễ xảy ra lỗi bảo mật tiềm ẩn, không có cơ chế sandbox guardrail để hạn chế rò rỉ token hoặc ghi đè file.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>Mất nhiều thời gian sửa lỗi thủ công do AI không tự viết unit test bao phủ các edge cases.</span>
                      </li>
                    </ul>
                  </div>

                  {/* AFTER */}
                  <div className="p-5 rounded-2xl neu-flat space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Sau khi tích hợp {skill.title || skill.name}:</span>
                    </div>
                    <ul className="space-y-2 text-xs text-[var(--text-main)]">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Tự động 100%:</strong> AI tự động kích hoạt rule chuyên sâu, áp dụng Clean Architecture và chuẩn coding của {skill.primary_language || 'dự án'}.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Thực thi mượt mà:</strong> Xử lý tức thì {skill.use_cases?.slice(0, 2).map(u => `"${u}"`).join(' & ') || 'các tác vụ cốt lõi'}.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>An toàn & Kiểm soát:</strong> Đạt chứng nhận <span className="uppercase font-bold text-emerald-600 dark:text-emerald-400">{skill.security_rating || 'SAFE'}</span> ({skill.security_score || 95}/100) với quyền {skill.permission_level || 'read_only'}.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Sẵn sàng trên {(skill.runtimes?.length || 4)}+ IDE:</strong> Code sinh ra kèm test case, vượt qua kiểm tra chất lượng ({Math.round(skill.quality_score)}/100).</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Feature Matrix Table */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[var(--primary)] shrink-0" />
                  <span>Bảng So Sánh Với Cách Làm Truyền Thống</span>
                </h4>
                <div className="rounded-2xl neu-inset overflow-x-auto text-xs p-3.5">
                  <table className="w-full text-left min-w-[480px]">
                    <thead>
                      <tr className="text-[var(--text-muted)] font-semibold">
                        <th className="p-3">Tiêu chí</th>
                        <th className="p-3">{skill.title || skill.name}</th>
                        <th className="p-3 text-[var(--text-muted)]">Cách làm truyền thống</th>
                      </tr>
                    </thead>
                    <tbody className="text-[var(--text-main)]">
                      <tr className="border-t border-[var(--shadow-dark)]/15">
                        <td className="p-3 font-semibold">Tự động hóa Context</td>
                        <td className="p-3 text-[var(--primary)] font-bold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[var(--primary)]" /> Tự động nạp qua {(skill.runtimes || ['antigravity', 'cursor']).join(', ')}</td>
                        <td className="p-3 text-[var(--text-muted)]"><span className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" /> Copy/paste thủ công từng file</span></td>
                      </tr>
                      <tr className="border-t border-[var(--shadow-dark)]/15">
                        <td className="p-3 font-semibold">Chuyên môn hóa lĩnh vực</td>
                        <td className="p-3 text-[var(--primary)] font-bold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[var(--primary)]" /> Tối ưu chuyên sâu cho {(skill.tags || [skill.category]).slice(0, 3).join(', ')}</td>
                        <td className="p-3 text-[var(--text-muted)]"><span className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" /> Prompt generic, AI dễ hallucinate</span></td>
                      </tr>
                      <tr className="border-t border-[var(--shadow-dark)]/15">
                        <td className="p-3 font-semibold">Kiểm soát an toàn & Quyền hạn</td>
                        <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> {skill.security_rating?.toUpperCase() || 'SAFE'} ({skill.security_score || 95}/100) • Quyền {skill.permission_level || 'read_only'}</td>
                        <td className="p-3 text-[var(--text-muted)]"><span className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" /> Không có kiểm tra AST / Rò rỉ secrets</span></td>
                      </tr>
                      <tr className="border-t border-[var(--shadow-dark)]/15">
                        <td className="p-3 font-semibold">Khả năng kiểm thử & Bàn giao</td>
                        <td className="p-3 text-[var(--primary)] font-bold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[var(--primary)]" /> Kèm kịch bản verify & test cho {skill.primary_language || 'dự án'}</td>
                        <td className="p-3 text-[var(--text-muted)]"><span className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" /> Không kèm test case, tốn công gỡ lỗi</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MULTI-RUNTIME INSTALL */}
          {activeTab === 'install' && (
            <div className="space-y-5 animate-fade-in">
              <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                <Code className="w-4 h-4 text-[var(--primary)] shrink-0" />
                <span>{language === 'vi' ? 'Hướng Dẫn Cài Đặt Cho Từng Runtime & IDE' : 'Installation Guide per Runtime & IDE'}</span>
              </h4>

              {/* Runtime Selector Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {Object.entries(configs).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedRuntimeGuide(key)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                      selectedRuntimeGuide === key
                        ? 'neu-primary text-white font-bold'
                        : 'neu-btn text-[var(--text-main)]'
                    }`}
                  >
                    <TechLogo name={key} className="w-4 h-4 shrink-0" />
                    <span>{item.title.replace(/^[^\w\s\(\)\[\]\.\-]+/u, '').trim()}</span>
                  </button>
                ))}
              </div>

              {/* Code Box */}
              {(() => {
                const currentConfig = (configs as any)[selectedRuntimeGuide] || configs.cursor;
                return (
                  <div className="rounded-2xl neu-flat p-5 sm:p-6 font-mono text-xs text-[var(--text-main)] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[var(--text-muted)] pb-2 text-[11px]">
                      <span>{language === 'vi' ? 'File cấu hình:' : 'Config file:'} <strong className="text-[var(--primary)] break-all">{currentConfig.file}</strong></span>
                      <button
                        onClick={() => handleCopyCommand(currentConfig.code)}
                        className="px-3 py-1.5 rounded-xl neu-btn text-[var(--text-main)] flex items-center gap-1.5 transition-colors ml-auto font-semibold cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? (language === 'vi' ? 'Đã chép' : 'Copied') : (language === 'vi' ? 'Sao chép code' : 'Copy code')}</span>
                      </button>
                    </div>

                    <pre className="p-4 rounded-xl neu-inset text-[var(--text-main)] overflow-x-auto text-[11px] leading-relaxed max-w-full">
                      {currentConfig.code}
                    </pre>

                    <div className="neu-divider my-2.5" />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
                      <span className="text-[var(--text-muted)] shrink-0 font-sans font-semibold">{language === 'vi' ? 'Lệnh terminal nhanh:' : 'Quick terminal command:'}</span>
                      <code className="text-[var(--primary)] font-bold break-all neu-inset-sm px-3 py-1.5 rounded-xl max-w-full overflow-x-auto">$ {currentConfig.command}</code>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 4: SECURITY AUDIT & OFFICIAL README DOCS */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 sm:p-6 rounded-2xl neu-flat space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl neu-inset-sm text-emerald-600 dark:text-emerald-400 shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-main)]">
                        {t('security_audit_title')}
                      </h4>
                      <p className="text-xs text-[var(--text-muted)]">
                        {language === 'vi' ? 'Phân tích AST và heuristic kiểm định mã nguồn độc hại & rò rỉ secret' : 'AST static analysis & heuristics for malicious patterns and secrets leak'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleScanSecurity}
                      disabled={isScanningSecurity}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl neu-primary disabled:opacity-50 text-white font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
                      title="Chạy kiểm định an toàn AST thời gian thực"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isScanningSecurity ? 'animate-spin' : ''}`} />
                      <span>{isScanningSecurity ? (language === 'vi' ? 'Đang quét...' : 'Scanning...') : (language === 'vi' ? 'Quét lại bảo mật' : 'Rescan Security')}</span>
                    </button>
                    <SecurityBadge 
                      rating={liveSecurityReport?.security_rating || skill.security_rating || 'safe'} 
                      score={liveSecurityReport?.security_score || skill.security_score || 95} 
                      size="md" 
                    />
                  </div>
                </div>

                <div className="neu-divider my-1" />

                {/* Live Scan Notification if available */}
                {liveSecurityReport && (
                  <div className="p-3.5 rounded-2xl neu-inset-sm text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">{language === 'vi' ? 'Kết quả kiểm định AST trực tiếp: ' : 'Live AST Verification Result: '}</span>
                      <span>{liveSecurityReport.badge_text} • {liveSecurityReport.recommendation}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 font-mono text-xs">
                  <div className="p-3.5 rounded-2xl neu-inset-sm">
                    <span className="text-[var(--text-muted)] text-[11px] block">{t('security_rating_label')}</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-sm capitalize">
                      {liveSecurityReport?.security_rating || skill.security_rating || 'safe'}
                    </strong>
                  </div>
                  <div className="p-3.5 rounded-2xl neu-inset-sm">
                    <span className="text-[var(--text-muted)] text-[11px] block">{t('permission_level_label')}</span>
                    <strong className="text-[var(--text-main)] text-sm">
                      {liveSecurityReport?.permission_level || skill.permission_level || 'read_only'}
                    </strong>
                  </div>
                  <div className="p-3.5 rounded-2xl neu-inset-sm">
                    <span className="text-[var(--text-muted)] text-[11px] block">{t('sandbox_status_label')}</span>
                    <strong className={`text-sm flex items-center gap-1.5 ${liveSecurityReport ? (liveSecurityReport.sandbox_compliant ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400') : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {liveSecurityReport ? (
                        liveSecurityReport.sandbox_compliant ? (
                          <><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Compliant</>
                        ) : (
                          <><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Non-compliant</>
                        )
                      ) : (
                        <><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Compliant</>
                      )}
                    </strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-[var(--text-main)] font-mono uppercase">
                    {t('security_flags_detected')}:
                  </div>
                  {((liveSecurityReport ? liveSecurityReport.flags : skill.security_flags) || []).length > 0 ? (
                    <div className="space-y-2">
                      {((liveSecurityReport ? liveSecurityReport.flags : skill.security_flags) || []).map((flag, idx) => (
                        <div key={idx} className="p-3 rounded-xl neu-inset-sm text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <strong>{flag.pattern}:</strong> {flag.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl neu-inset-sm text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{t('no_security_flags')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Official Repository README with Multi-Tier AI Translation */}
              <div className="p-5 sm:p-6 rounded-2xl neu-flat space-y-4">
                {/* Header & Controls Bar */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
                  {/* Left: Title & Status Badge */}
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl neu-inset-sm text-[var(--primary)] shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-[var(--text-main)]">
                          {language === 'vi' ? 'Tài Liệu README' : 'Repository README'}
                        </h4>
                        {readmeMode === 'original' ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg neu-inset-sm text-[var(--text-muted)]">
                            RAW MARKDOWN
                          </span>
                        ) : isTranslating ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg neu-inset-sm text-amber-500 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>{language === 'vi' ? 'ĐANG DỊCH...' : 'TRANSLATING...'}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg neu-inset-sm text-[var(--primary)] flex items-center gap-1">
                            {activeTranslationMeta?.provider === 'local_llm' ? '🖥️ ' : activeTranslationMeta?.provider === 'translation_engine' ? '🌐 ' : '⚡ '}
                            <span>{activeTranslationMeta?.model_used || (language === 'vi' ? 'ĐÃ DỊCH AI' : 'AI TRANSLATED')}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        {language === 'vi' 
                          ? 'Trích xuất nguyên bản từ GitHub • Hỗ trợ dịch Local LLM & Cloud AI' 
                          : 'Extracted from GitHub • Local LLM & Cloud AI translation'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Streamlined Actions Toolbar */}
                  <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
                    {/* View Mode Switch: Original vs AI Translated */}
                    <div className="flex items-center p-0.5 rounded-xl neu-inset-sm text-xs font-semibold">
                      <button
                        onClick={() => setReadmeMode('original')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          readmeMode === 'original'
                            ? 'bg-[var(--primary)] text-white shadow-xs font-bold'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                        title={language === 'vi' ? 'Xem tài liệu gốc từ GitHub' : 'View original README'}
                      >
                        {language === 'vi' ? 'Bản Gốc' : 'Original'}
                      </button>
                      <button
                        onClick={() => {
                          setReadmeMode('translated');
                          if (!translations[targetLanguage]?.content) {
                            handleTranslateReadme(false);
                          }
                        }}
                        className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                          readmeMode === 'translated'
                            ? 'bg-[var(--primary)] text-white shadow-xs font-bold'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                        title={language === 'vi' ? 'Xem bản dịch AI' : 'View AI translation'}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{language === 'vi' ? 'Bản Dịch AI' : 'AI Translation'}</span>
                      </button>
                    </div>

                    {/* Translation Settings (Visible in Translated Mode) */}
                    {readmeMode === 'translated' && (
                      <>
                        {/* Target Language Dropdown */}
                        <NeuSelect
                          value={targetLanguage}
                          onChange={(val) => handleTargetLanguageChange(String(val))}
                          options={languageOptions}
                          size="sm"
                          variant="inset"
                          align="right"
                          dropdownClassName="z-[80] min-w-[170px]"
                          title={language === 'vi' ? 'Ngôn ngữ đích' : 'Target language'}
                        />

                        {/* AI Provider / Engine Selector */}
                        <NeuSelect
                          value={selectedProvider}
                          onChange={(val) => handleProviderChange(String(val))}
                          options={providerOptions}
                          size="sm"
                          variant="inset"
                          align="right"
                          dropdownClassName="z-[80] min-w-[240px]"
                          title={language === 'vi' ? 'Mô hình dịch' : 'Translation engine'}
                        />

                        {/* Single Re-translate Button */}
                        <button
                          onClick={() => handleTranslateReadme(true)}
                          disabled={isTranslating}
                          className={`p-1.5 rounded-xl neu-btn text-[var(--primary)] hover:neu-flat transition-all cursor-pointer ${
                            isTranslating ? 'opacity-50 cursor-wait' : ''
                          }`}
                          title={language === 'vi' ? 'Dịch lại tài liệu với mô hình đã chọn' : 'Re-translate with selected model'}
                          aria-label="Re-translate"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin text-amber-500' : ''}`} />
                        </button>
                      </>
                    )}

                    <div className="h-4 w-px bg-[var(--border)] mx-0.5 hidden sm:block" />

                    {/* Utility Actions */}
                    <div className="flex items-center gap-1">
                      {/* Copy Markdown Button */}
                      <button
                        onClick={handleCopyReadme}
                        className="p-1.5 rounded-xl neu-btn text-[var(--text-muted)] hover:text-emerald-500 transition-all cursor-pointer"
                        title={language === 'vi' ? 'Sao chép nội dung' : 'Copy markdown'}
                        aria-label="Copy Markdown"
                      >
                        {copiedReadme ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Sync from GitHub Button */}
                      <button
                        onClick={handleRefreshReadme}
                        disabled={isRefreshingReadme || isLoadingReadme}
                        className={`p-1.5 rounded-xl neu-btn text-[var(--text-muted)] hover:text-[var(--primary)] transition-all cursor-pointer ${
                          isRefreshingReadme ? 'opacity-70 cursor-wait' : ''
                        }`}
                        title={language === 'vi' ? 'Đồng bộ lại README từ GitHub' : 'Re-fetch latest README from GitHub'}
                        aria-label="Refresh README"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingReadme ? 'animate-spin text-[var(--primary)]' : ''}`} />
                      </button>

                      {/* View on GitHub */}
                      {skill.repository_url && (
                        <a
                          href={skill.repository_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl neu-btn text-[var(--text-muted)] hover:text-[var(--primary)] transition-all flex items-center shrink-0"
                          title={language === 'vi' ? 'Mở trên GitHub' : 'Open on GitHub'}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="p-4 sm:p-5 rounded-2xl neu-inset max-w-full overflow-hidden min-h-[140px]">
                  {isLoadingReadme ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3 text-center text-[var(--text-muted)]">
                      <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                      <p className="text-xs font-mono font-medium">
                        {language === 'vi' ? 'Đang trích xuất README từ GitHub repository...' : 'Extracting authentic README from GitHub...'}
                      </p>
                    </div>
                  ) : isTranslating ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3 text-center text-[var(--text-muted)]">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                      <p className="text-xs font-mono font-medium text-[var(--text-main)]">
                        {language === 'vi' 
                          ? 'AI đang dịch tài liệu Markdown (Local Ollama / Google Gemini)...' 
                          : 'AI is translating Markdown (Local Ollama / Google Gemini)...'}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {language === 'vi' 
                          ? 'Giữ nguyên toàn bộ lệnh terminal, mã nguồn và cấu trúc bảng' 
                          : 'Preserving terminal commands, code samples and table formats'}
                      </p>
                    </div>
                  ) : readmeMode === 'translated' && !translations[targetLanguage]?.content ? (
                    <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
                      <p className="text-xs text-[var(--text-muted)]">
                        {language === 'vi' 
                          ? 'Chưa có bản dịch cho ngôn ngữ này.' 
                          : 'No translation available for this language yet.'}
                      </p>
                      <button
                        onClick={() => handleTranslateReadme(false)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl neu-primary text-xs font-bold cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{language === 'vi' ? 'Dịch ngay bằng AI' : 'Translate with AI now'}</span>
                      </button>
                    </div>
                  ) : (
                    <MarkdownRenderer
                      content={
                        readmeMode === 'translated' && translations[targetLanguage]?.content
                          ? translations[targetLanguage].content
                          : (readmeContent || `# ${skill.title || skill.name}\n\n${skill.description || 'Chưa có tài liệu chi tiết.'}\n\nXem thêm chi tiết tại: ${skill.repository_url}`)
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="neu-divider" />
        <div className="p-4 bg-[var(--bg)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">
            <span className="flex items-center gap-1.5 neu-inset-sm px-3 py-1.5 rounded-xl">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              {skill.stars.toLocaleString()} Stars
            </span>
            <span className="flex items-center gap-1.5 neu-inset-sm px-3 py-1.5 rounded-xl">
              <GitFork className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {skill.forks.toLocaleString()} Forks
            </span>
          </div>

          <a
            href={skill.repository_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl neu-primary text-white font-bold text-xs transition-transform active:scale-95"
          >
            <span>Mở trên GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
};
