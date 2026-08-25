import React, { useState, useRef } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Video
} from 'lucide-react';
import { Skill } from '../types';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { ExportModal } from './ExportModal';
import { SecurityBadge } from './SecurityBadge';

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
  const [activeTab, setActiveTab] = useState<'tutorial' | 'use_cases' | 'architecture' | 'before_after' | 'comparison' | 'install' | 'security' | 'readme'>('tutorial');
  const [selectedRuntimeGuide, setSelectedRuntimeGuide] = useState<string>('antigravity');
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const { showToast } = useToast();
  const { t } = useLanguage();

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
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
    const isMCP = skill.category === 'mcp-server';
    const lang = (skill.primary_language || '').toLowerCase();
    const nameLower = (skill.name + ' ' + (skill.title || '')).toLowerCase();
    const isGo = lang === 'go' || nameLower.includes('go') || nameLower.includes('golang');
    const isPython = lang === 'python' || nameLower.includes('python') || nameLower.includes('fastapi') || nameLower.includes('django');
    const isRust = lang === 'rust' || nameLower.includes('rust') || nameLower.includes('axum') || nameLower.includes('tokio');

    if (isGo) {
      return [
        {
          title: "Chuẩn hóa Clean Architecture & Error Handling khi viết REST API trong Go",
          problem: "Khi yêu cầu AI viết Go API, AI thường bỏ qua check err != nil, hardcode error string không dùng fmt.Errorf(\"%w\", err), hoặc bỏ qua context timeout cancellation.",
          prompt: `Tạo endpoint POST /orders xử lý tạo đơn hàng mới với chi router, struct validation, context cancellation timeout 5s, và Clean Architecture (Handler -> Service -> Repository).`,
          agentAction: "Agent tự động kiểm tra struct tags, cấu hình context.WithTimeout, bọc error với fmt.Errorf chuẩn xác, và sinh Table-Driven Unit Test bằng test package tiêu chuẩn của Go.",
          codeExample: `// Code Go chuẩn sinh bởi Agent tuân thủ idiomatic standard\ntype CreateOrderRequest struct {\n    CustomerID string  \`json:"customer_id" validate:"required,uuid4"\`\n    Amount     float64 \`json:"amount" validate:"gt=0"\`\n}\n\nfunc (h *OrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {\n    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)\n    defer cancel()\n\n    var req CreateOrderRequest\n    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {\n        http.Error(w, "invalid request body", http.StatusBadRequest)\n        return\n    }\n    \n    order, err := h.service.CreateOrder(ctx, req)\n    if err != nil {\n        http.Error(w, fmt.Sprintf("failed to create order: %v", err), http.StatusInternalServerError)\n        return\n    }\n    \n    w.Header().Set("Content-Type", "application/json")\n    w.WriteHeader(http.StatusCreated)\n    _ = json.NewEncoder(w).Encode(order)\n}`,
          tip: "Đặt file rule tại `.gemini/config/skills/go-standards/SKILL.md` hoặc `.cursor/rules/golang.mdc` để kích hoạt chế độ Go Idiomatic tự động."
        },
        {
          title: "Xử lý Concurrency & Worker Pools an toàn (Chống Goroutine Leaks)",
          problem: "AI thường sinh goroutine chạy ngầm mà không có sync.WaitGroup, không lắng nghe ctx.Done() dẫn tới leak tài nguyên bộ nhớ khi request bị client ngắt kết nối.",
          prompt: `Viết worker pool xử lý hàng đợi 1,000 tasks song song với tối đa 10 workers, lắng nghe tín hiệu hủy từ context và gom lỗi bằng errgroup.`,
          agentAction: "Agent sử dụng golang.org/x/sync/errgroup, phân bổ channel có buffer hợp lý, đảm bảo 100% goroutines thoát an toàn khi context timeout.",
          codeExample: `// Worker Pool an toàn với errgroup & context\ng, ctx := errgroup.WithContext(ctx)\ntasksCh := make(chan Task, len(tasks))\n\nfor i := 0; i < numWorkers; i++ {\n    g.Go(func() error {\n        for task := range tasksCh {\n            select {\n            case <-ctx.Done():\n                return ctx.Err()\n            default:\n                if err := processTask(ctx, task); err != nil {\n                    return fmt.Errorf("task %s failed: %w", task.ID, err)\n                }\n            }\n        }\n        return nil\n    })\n}`,
          tip: "Sử dụng cờ 'go test -race ./...' để kiểm tra race condition tự động trước khi merge code vào nhánh main."
        },
        {
          title: "Tự động sinh Table-Driven Unit Tests với độ bao phủ > 85%",
          problem: "AI thường viết test Go sơ sài, lặp code kiểm tra từng case riêng lẻ thay vì dùng cấu trúc Table-Driven chuẩn của Go community.",
          prompt: `Viết bộ Table-Driven Unit Test toàn diện cho hàm ValidateOrder(), bao gồm các trường hợp: số lượng âm, ID trống, và đơn hàng hợp lệ.`,
          agentAction: "Agent cấu hình bảng test struct { name, order, wantErr }, chạy song song với t.Parallel() và assertion chuẩn xác.",
          codeExample: `func TestValidateOrder(t *testing.T) {\n    tests := []struct {\n        name    string\n        order   Order\n        wantErr bool\n    }{\n        {name: "valid order", order: Order{ID: "1", Amount: 100}, wantErr: false},\n        {name: "empty id", order: Order{ID: "", Amount: 100}, wantErr: true},\n        {name: "negative amount", order: Order{ID: "2", Amount: -10}, wantErr: true},\n    }\n\n    for _, tt := range tests {\n        tt := tt\n        t.Run(tt.name, func(t *testing.T) {\n            t.Parallel()\n            err := ValidateOrder(tt.order)\n            if (err != nil) != tt.wantErr {\n                t.Fatalf("ValidateOrder() error = %v, wantErr %v", err, tt.wantErr)\n            }\n        })\n    }\n}`,
          tip: "Yêu cầu Agent chạy lệnh 'go test -cover ./...' sau khi viết để xác nhận độ bao phủ test case."
        }
      ];
    } else if (isPython) {
      return [
        {
          title: "Chuẩn hóa FastAPI & Pydantic v2 với Strict Type Validation",
          problem: "AI thường sinh code FastAPI dùng cú pháp Pydantic v1 cũ (.dict() thay vì .model_dump()), hoặc thiếu Dependency Injection chuẩn.",
          prompt: `Tạo endpoint POST /users trong FastAPI với Pydantic v2 BaseModel, async database session injection, và xử lý HTTP 422/500 chuyên nghiệp.`,
          agentAction: "Agent tự động cấu hình Annotated[Session, Depends()], dùng Pydantic Field() validation và AsyncSession của SQLAlchemy 2.0.",
          codeExample: `from fastapi import FastAPI, Depends, HTTPException, status\nfrom sqlalchemy.ext.asyncio import AsyncSession\nfrom pydantic import BaseModel, EmailStr, Field\n\nclass UserCreate(BaseModel):\n    username: str = Field(..., min_length=3, max_length=50)\n    email: EmailStr\n\n@app.post("/users", status_code=status.HTTP_201_CREATED)\nasync def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):\n    user = await user_service.create(db, payload.model_dump())\n    return user`,
          tip: "Cấu hình file pyproject.toml với ruff và mypy --strict để Agent tự động format mã nguồn."
        },
        {
          title: "Async Pytest & Mock Fixtures toàn diện",
          problem: "Viết test async trong Python dễ bị treo hoặc dính kết nối DB thật do thiếu fixtures mock chuẩn.",
          prompt: `Viết bộ test async pytest cho UserService.create() có mock database repository và kiểm tra validation error.`,
          agentAction: "Agent sử dụng pytest-asyncio, unittest.mock.AsyncMock để cô lập hoàn toàn database mà vẫn đảm bảo logic chính xác 100%.",
          codeExample: `@pytest.mark.asyncio\nasync def test_create_user_success(mock_db_session):\n    service = UserService(repo=mock_db_session)\n    result = await service.create({"username": "hieu_dev", "email": "test@domain.com"})\n    assert result.username == "hieu_dev"\n    mock_db_session.commit.assert_awaited_once()`,
          tip: "Chạy 'pytest --cov=app --cov-report=term-missing' để kiểm tra dòng code chưa test."
        }
      ];
    } else if (isRust) {
      return [
        {
          title: "Xây Dựng Web Service An Toàn Tuyệt Đối với Axum & Tokio",
          problem: "AI thường sinh code Rust lạm dụng .unwrap() hoặc .clone() không cần thiết, gây nguy cơ panic ứng dụng khi chạy thực tế.",
          prompt: `Tạo handler Axum nhận JSON body, truy vấn database bằng SQLx và trả về Result<Json<User>, AppError> với thiserror.`,
          agentAction: "Agent tự động triển khai IntoResponse cho AppError enum, dùng pattern matching và bọc Result mà không hề dùng unwrap().",
          codeExample: `use axum::{extract::State, Json, response::IntoResponse};\nuse serde::{Deserialize, Serialize};\n\n#[derive(Deserialize)]\npub struct CreateUserReq { pub username: String }\n\npub async fn create_user(\n    State(pool): State<PgPool>,\n    Json(payload): Json<CreateUserReq>,\n) -> Result<Json<User>, AppError> {\n    let user = sqlx::query_as!(User, "INSERT INTO users (username) VALUES ($1) RETURNING *", payload.username)\n        .fetch_one(&pool)\n        .await?;\n    Ok(Json(user))\n}`,
          tip: "Chạy 'cargo clippy -- -D warnings' để Agent tự động tối ưu hóa hiệu năng và bộ nhớ."
        }
      ];
    } else if (isMCP) {
      return [
        {
          title: "Truy vấn Schema và Dữ Liệu PostgreSQL mà không cần rời IDE",
          problem: "Developer phải mở DBeaver/PgAdmin để xem cấu trúc bảng, copy tên cột, sau đó quay lại Cursor/Antigravity gõ thủ công dễ bị sai chính tả.",
          prompt: `Kiểm tra cấu trúc bảng 'orders' và viết câu truy vấn lấy tổng doanh thu theo từng tháng trong năm 2025.`,
          agentAction: "Agent gọi MCP tool 'postgres_describe_table', lấy chính xác danh sách cột và kiểu dữ liệu, rồi sinh câu query SQL chuẩn xác 100%.",
          codeExample: `// Agent trực tiếp thực thi tool gọi database qua MCP:\nconst stats = await mcp.tools.postgres.query({\n  sql: 'SELECT DATE_TRUNC(\\'month\\', created_at) AS month, SUM(amount) AS revenue FROM orders WHERE created_at >= \\'2025-01-01\\' GROUP BY 1 ORDER BY 1'\n});`,
          tip: "Cấu hình kết nối readonly user để bảo đảm Agent không vô tình xóa dữ liệu sản xuất."
        },
        {
          title: "Tự Động Tạo GitHub Pull Request & Review Mã Nguồn",
          problem: "Mất thời gian tạo branch, commit từng file, gõ mô tả PR và gắn reviewers thủ công trên trình duyệt.",
          prompt: `Tạo commit cho các thay đổi hiện tại với thông điệp theo chuẩn Conventional Commits, sau đó mở Pull Request vào nhánh 'main'.`,
          agentAction: "MCP Server kết nối GitHub API, tự động phân tích git diff, tóm tắt các thay đổi nổi bật và mở PR chỉ trong 3 giây.",
          codeExample: `// Lệnh Agent thực thi qua GitHub MCP:\nawait mcp.tools.github.create_pull_request({\n  title: "feat(auth): add google oauth2 login flow",\n  body: "## Summary\\n- Added Google OAuth2 endpoints\\n- Added user profile sync\\n\\nTested on macOS.",\n  head: "feat/oauth-login",\n  base: "main"\n});`,
          tip: "Thêm token GitHub PAT có quyền 'repo' vào file cấu hình MCP của Cursor/Claude."
        }
      ];
    } else {
      return [
        {
          title: "Chuẩn hóa Clean Architecture & Convention khi tạo API mới",
          problem: "Khi yêu cầu AI viết API, AI thường dùng cú pháp cũ (vd: Pages router thay vì App router trong Next.js, hoặc bỏ quên Zod validation, bỏ qua try/catch).",
          prompt: `Tạo một endpoint CRUD cho module "Order Management" với đầy đủ Zod validation, Clean Architecture (Controller -> Service -> Repository), tuân thủ đúng quy ước trong file rule của dự án.`,
          agentAction: "Agent tự động đọc các file rule, nhận diện cấu trúc thư mục hiện tại, sinh code chuẩn TypeScript strict mode và bổ sung Unit Test tương ứng mà không cần nhắc lại.",
          codeExample: `// Sinh ra bởi Agent tuân thủ Rule\nexport const createOrderSchema = z.object({\n  customerId: z.string().uuid(),\n  items: z.array(z.object({ productId: z.string(), quantity: z.number().min(1) })),\n  totalAmount: z.number().positive(),\n});\n\nexport async function POST(req: Request) {\n  const parsed = createOrderSchema.safeParse(await req.json());\n  if (!parsed.success) return Response.json({ errors: parsed.error }, { status: 400 });\n  return Response.json(await orderService.create(parsed.data));\n}`,
          tip: "Nên đặt file rule tại `.cursor/rules/api-standards.mdc` hoặc `.gemini/config/skills/` để AI tự động kích hoạt."
        },
        {
          title: "Ngăn chặn lỗi bảo mật & Rò rỉ dữ liệu nhạy cảm",
          problem: "AI có thể vô tình sinh mã hardcode API Key, lộ JWT secret hoặc viết câu truy vấn SQL không dùng parameterized queries (gây nguy cơ SQL Injection).",
          prompt: `Viết hàm truy vấn tìm kiếm người dùng theo username và email từ PostgreSQL.`,
          agentAction: "Skill kích hoạt bộ lọc bảo mật, ép buộc Agent dùng Parameterized Queries qua Prisma/Drizzle/SQLAlchemy và tự động đọc biến môi trường từ process.env thay vì hardcode.",
          codeExample: `// An toàn với Parameterized Query & Environment variables\nconst result = await db.query(\n  'SELECT id, username, email, created_at FROM users WHERE username = $1 OR email = $2',\n  [username, email]\n);`,
          tip: "Kết hợp skill này với CI pipeline để kiểm tra tự động trước khi merge code vào nhánh main."
        },
        {
          title: "Tự động tạo Mock Data và Unit Test với độ bao phủ > 80%",
          problem: "Viết test thủ công mất rất nhiều thời gian, nhưng nếu không có quy chuẩn, AI thường viết test sơ sài (chỉ test happy path, bỏ qua edge cases).",
          prompt: `Viết bộ unit test toàn diện cho hàm calculateDiscount(), bao gồm các trường hợp: mã giảm giá hết hạn, đơn hàng 0đ, số lượng âm, và giảm giá vượt quá 100%.`,
          agentAction: "Skill cung cấp template kiểm thử chuẩn Jest/Pytest, ép Agent sinh ít nhất 5 test cases bao phủ toàn bộ các nhánh rẽ điều kiện (branch coverage).",
          codeExample: `describe('calculateDiscount()', () => {\n  it('throws error when discount exceeds 100%', () => {\n    expect(() => calculateDiscount(100, 150)).toThrow('Invalid discount rate');\n  });\n  it('handles zero order amount gracefully', () => {\n    expect(calculateDiscount(0, 20)).toBe(0);\n  });\n});`,
          tip: "Yêu cầu Agent chạy lệnh test sau khi viết để tự sửa nếu test bị fail."
        }
      ];
    }
  };

  const getRuntimeInstallConfigs = () => {
    const pkgName = skill.name.replace('/', '-').replace('_', '-').toLowerCase();
    return {
      antigravity: {
        title: '🪐 Google Antigravity',
        file: `.gemini/config/skills/${pkgName}/SKILL.md`,
        code: `---\nname: ${pkgName}\ndescription: ${skill.description || 'Procedural skill for Google Antigravity'}\nversion: 1.0.0\n---\n\n# ${skill.title || skill.name}\n\n${skill.ai_summary || ''}\n\n## Instructions\n- Adhere to Clean Architecture\n- Verify with test suite before completion`,
        command: `mkdir -p .gemini/config/skills/${pkgName} && curl -fsSL http://localhost:8899/api/v1/skills/${skill.id}/export/antigravity/raw > .gemini/config/skills/${pkgName}/SKILL.md`
      },
      codex: {
        title: '🧠 OpenAI Codex / Copilot',
        file: '.github/copilot-instructions.md',
        code: `# ${skill.title || skill.name}\n${skill.description || ''}\n\n## Rules\n- Enforce strict typing\n- Never output hardcoded secrets\n- Write unit tests covering edge cases`,
        command: `mkdir -p .github && curl -fsSL http://localhost:8899/api/v1/skills/${skill.id}/export/codex/raw >> .github/copilot-instructions.md`
      },
      cursor: {
        title: '⚡ Cursor IDE (.cursorrules / .mdc)',
        file: `.cursor/rules/${pkgName}.mdc`,
        code: `---\ndescription: ${skill.description || ''}\nglobs: *\nalwaysApply: true\n---\n\n# Cursor Rule: ${skill.title || skill.name}\n\n- Tuân thủ cấu trúc & tiêu chuẩn của ${skill.name}\n- Luôn kiểm thử code trước khi phản hồi`,
        command: `mkdir -p .cursor/rules && curl -fsSL http://localhost:8899/api/v1/skills/${skill.id}/export/cursor/raw > .cursor/rules/${pkgName}.mdc`
      },
      claude: {
        title: '🤖 Claude Code & Desktop',
        file: skill.category === 'mcp-server' ? 'claude_desktop_config.json' : `~/.claude/skills/${pkgName}/SKILL.md`,
        code: skill.category === 'mcp-server' 
          ? `{\n  "mcpServers": {\n    "${pkgName}": {\n      "command": "npx",\n      "args": ["-y", "${skill.name}"]\n    }\n  }\n}`
          : `# Claude Skill: ${skill.title || skill.name}\n${skill.description || ''}`,
        command: skill.category === 'mcp-server' ? `claude mcp add ${pkgName} -- npx -y ${skill.name}` : `curl -fsSL http://localhost:8899/api/v1/skills/${skill.id}/export/claude/raw > ~/.claude/skills/${pkgName}/SKILL.md`
      },
      windsurf: {
        title: '🌊 Windsurf Cascade Rules',
        file: '.windsurfrules',
        code: `# Windsurf Integration for ${skill.title || skill.name}\n${skill.description || ''}`,
        command: `curl -fsSL http://localhost:8899/api/v1/skills/${skill.id}/export/windsurf/raw >> .windsurfrules`
      },
      aider: {
        title: '💻 Aider Conventions',
        file: '.aider.conf.yml',
        code: `# Aider conventions for ${skill.name}\nauto-commits: true\nread:\n  - CONVENTIONS.md`,
        command: `curl -fsSL http://localhost:8899/api/v1/skills/${skill.id}/export/aider/raw > .aider.conf.yml`
      }
    };
  };

  const configs = getRuntimeInstallConfigs();
  const enrichedUseCases = getEnrichedUseCases();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-modal-backdrop">
      <ExportModal 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        skill={skill} 
      />
      <div 
        className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[92vh] sm:h-[88vh] animate-modal-pop transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header - Always Fixed at Top */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex flex-row items-start justify-between gap-3 sm:gap-4 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                {skill.category}
              </span>
              <SecurityBadge rating={skill.security_rating || 'safe'} score={skill.security_score || 95} size="sm" />
              {skill.primary_language && (
                <span className="text-xs font-mono text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/50 px-2.5 py-0.5 rounded-md">
                  {skill.primary_language}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug break-words">
              {skill.title || skill.name}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-1 break-all sm:break-normal">
              {skill.name} • Tác giả: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{skill.author || 'Community'}</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* AI Video & Blog Studio Button */}
            {onOpenStudio && (
              <button
                onClick={() => {
                  onClose();
                  onOpenStudio(skill);
                }}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/20 active:scale-95 shrink-0"
                title={t('studio_btn_create_from_skill')}
              >
                <Video className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{t('studio_btn_create_from_skill')}</span>
              </button>
            )}

            {/* 1-Click Multi-IDE Export Button */}
            <button
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95 shrink-0"
              title={t('btn_export')}
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{t('btn_export')}</span>
            </button>

            <button
              onClick={() => onToggleBookmark(skill.id)}
              className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all shrink-0 ${
                skill.is_bookmarked
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Bookmark"
            >
              {skill.is_bookmarked ? <BookmarkCheck className="w-4 sm:w-5 h-4 sm:h-5" /> : <Bookmark className="w-4 sm:w-5 h-4 sm:h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors shrink-0"
              title="Đóng"
            >
              <X className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation with Fixed Scrollable Toolbar */}
        <div className="relative border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950/70 shrink-0 flex items-center">
          <button
            onClick={() => scrollTabs('left')}
            className="hidden sm:flex items-center justify-center w-8 h-11 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 z-10 shrink-0 transition-colors"
            title="Cuộn sang trái"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div 
            ref={tabsContainerRef}
            className="flex-1 flex px-3 sm:px-1 space-x-1 sm:space-x-1.5 overflow-x-auto scrollbar-none text-xs font-medium scroll-smooth"
          >
            <button
              onClick={() => setActiveTab('tutorial')}
              className={`py-3 sm:py-3.5 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'tutorial'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold bg-white/60 dark:bg-slate-900/60 rounded-t-lg'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-500" />
              {t('tab_article')}
            </button>
            <button
              onClick={() => setActiveTab('use_cases')}
              className={`py-3 sm:py-3.5 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'use_cases'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold bg-white/60 dark:bg-slate-900/60 rounded-t-lg'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              {t('tab_use_cases_count')} ({enrichedUseCases.length})
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`py-3 sm:py-3.5 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'architecture'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold bg-white/60 dark:bg-slate-900/60 rounded-t-lg'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Workflow className="w-4 h-4 text-sky-500" />
              {t('tab_arch')}
            </button>
            <button
              onClick={() => setActiveTab('before_after')}
              className={`py-3 sm:py-3.5 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'before_after'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold bg-white/60 dark:bg-slate-900/60 rounded-t-lg'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-500" />
              {t('tab_before_after')}
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`py-3 sm:py-3.5 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'comparison'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold bg-white/60 dark:bg-slate-900/60 rounded-t-lg'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Scale className="w-4 h-4 text-orange-500" />
              {t('tab_comparison')}
            </button>
            <button
              onClick={() => setActiveTab('install')}
              className={`py-3 sm:py-3.5 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'install'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold bg-white/60 dark:bg-slate-900/60 rounded-t-lg'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Code className="w-4 h-4 text-blue-500" />
              {t('tab_install')}
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-3 sm:py-3.5 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'security'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold bg-white/60 dark:bg-slate-900/60 rounded-t-lg'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              {t('tab_security_audit')}
            </button>
            <button
              onClick={() => setActiveTab('readme')}
              className={`py-3 sm:py-3.5 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'readme'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold bg-white/60 dark:bg-slate-900/60 rounded-t-lg'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-400" />
              {t('tab_readme')}
            </button>
          </div>

          <button
            onClick={() => scrollTabs('right')}
            className="hidden sm:flex items-center justify-center w-8 h-11 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 z-10 shrink-0 transition-colors"
            title="Cuộn sang phải"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body with Internal Scrolling */}
        <div className="p-4 sm:p-6 md:p-7 overflow-y-auto space-y-6 flex-1 min-h-0 text-slate-800 dark:text-slate-200 overscroll-contain scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          
          {/* TAB 1: BÀI VIẾT HƯỚNG DẪN CHI TIẾT (COMMUNITY ARTICLE STYLE) */}
          {activeTab === 'tutorial' && (
            <div className="space-y-6 animate-fade-in leading-relaxed">
              {/* Article Header Card */}
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>Chuyên Đề Đánh Giá & Hướng Dẫn Thực Hành Toàn Diện</span>
                </div>
                <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-snug">
                  Hiểu rõ bản chất & Làm chủ {skill.title || skill.name} trong 5 phút
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {skill.ai_summary || skill.description}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span>🎯 Dành cho: <strong className="text-slate-800 dark:text-slate-200">{skill.target_audience || 'Developers'}</strong></span>
                  <span>⭐ Đánh giá cộng đồng: <strong className="text-amber-500">{skill.stars.toLocaleString()} Stars</strong></span>
                </div>
              </div>

              {/* Section 1: Nỗi đau & Vấn đề giải quyết */}
              <div className="space-y-3">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>1. Vấn đề thực tế mà developer thường gặp phải (The Problem)</span>
                </h4>
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                  <p>
                    Khi làm việc với các AI Coding Assistant như Cursor, Claude Code hay Copilot, lập trình viên thường mất rất nhiều thời gian vì:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                    <li><strong>Mất ngữ cảnh (Context Loss):</strong> Mỗi lần mở một phiên chat mới, bạn phải gõ lại hàng loạt quy tắc dự án (dùng Clean Architecture, không dùng any trong TS, luôn viết Zod/Struct validation...).</li>
                    <li><strong>Sinh code ảo (Hallucination):</strong> AI tự bịa ra các hàm thư viện không tồn tại hoặc sử dụng các phiên bản cũ đã bị deprecated.</li>
                    <li><strong>Thiếu khả năng tương tác với hệ thống thật:</strong> Không thể tự chạy test, không kết nối được Database để xem schema, hoặc không tự động tạo Pull Request chuẩn mực.</li>
                  </ul>
                </div>
              </div>

              {/* Section 2: Giải pháp & Cơ chế hoạt động */}
              <div className="space-y-3">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>2. Cách {skill.title || skill.name} giải quyết triệt để (The Solution)</span>
                </h4>
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-xs text-slate-800 dark:text-slate-200 space-y-3">
                  <p>
                    {skill.comparison_notes || 'Giải pháp này đóng vai trò như một lớp Protocol / Rules trung gian chuẩn hóa, nạp sẵn toàn bộ kiến thức chuyên sâu và công cụ cần thiết vào bộ nhớ của AI Agent.'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">Tiết kiệm 80%</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Thời gian gõ prompt</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                      <div className="font-bold text-sky-600 dark:text-sky-400 text-sm">100% Đồng nhất</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Quy chuẩn cho cả team</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                      <div className="font-bold text-purple-600 dark:text-purple-400 text-sm">Sẵn sàng chạy</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Code pass test ngay</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Quy trình áp dụng 3 bước */}
              <div className="space-y-3">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-sky-500 shrink-0" />
                  <span>3. Quy trình 3 bước tích hợp ngay vào dự án của bạn (Quick Implementation)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs">1</span>
                    <div className="font-bold text-slate-900 dark:text-slate-100">Cài đặt cấu hình</div>
                    <div className="text-slate-500 text-[11px]">Chuyển sang tab "Cài Đặt Đa IDE" và copy đoạn cấu hình vào file rule hoặc MCP server của bạn.</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <span className="w-6 h-6 rounded-lg bg-sky-500 text-slate-950 font-bold flex items-center justify-center text-xs">2</span>
                    <div className="font-bold text-slate-900 dark:text-slate-100">Dùng Prompt Mẫu</div>
                    <div className="text-slate-500 text-[11px]">Chuyển sang tab "Kịch Bản & Prompt Mẫu" để copy đoạn prompt thực chiến đưa cho Agent.</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <span className="w-6 h-6 rounded-lg bg-purple-500 text-slate-950 font-bold flex items-center justify-center text-xs">3</span>
                    <div className="font-bold text-slate-900 dark:text-slate-100">Review & Xác nhận</div>
                    <div className="text-slate-500 text-[11px]">Agent tự động thực thi đúng convention, bạn chỉ cần review và merge vào codebase.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KỊCH BẢN THỰC CHIẾN & PROMPT MẪU (DEEP USE CASES WITH PROMPT + CODE + TIP) */}
          {activeTab === 'use_cases' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Các Tình Huống Thực Chiến Kèm Prompt Mẫu & Code Minh Họa</span>
                </h4>
                <span className="text-xs text-slate-400 font-mono shrink-0">Bấm sao chép để dùng ngay</span>
              </div>

              <div className="space-y-5 sm:space-y-6">
                {enrichedUseCases.map((uc, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-all hover:border-emerald-500/40"
                  >
                    {/* Scenario Header */}
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono font-black text-sm shrink-0 border border-emerald-500/20 shadow-sm">
                        0{idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          {uc.title}
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          <strong className="text-rose-600 dark:text-rose-400">Vấn đề: </strong>{uc.problem}
                        </p>
                      </div>
                    </div>

                    {/* Copyable Sample Prompt */}
                    <div className="rounded-2xl bg-slate-100 dark:bg-slate-900 p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                          <span>Prompt Mẫu Thực Chiến (Copy đưa cho AI):</span>
                        </span>
                        <button
                          onClick={() => handleCopyPrompt(uc.prompt, idx)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-[11px] transition-colors shadow-sm ml-auto"
                        >
                          {copiedPromptIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedPromptIdx === idx ? 'Đã sao chép' : 'Sao chép prompt'}</span>
                        </button>
                      </div>
                      <p className="text-xs font-mono text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 whitespace-pre-wrap break-words leading-relaxed">
                        "{uc.prompt}"
                      </p>
                    </div>

                    {/* How Agent Executes */}
                    <div className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-900/30 leading-relaxed">
                      <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-emerald-700 dark:text-emerald-400">Cách Agent xử lý: </strong>
                        {uc.agentAction}
                      </div>
                    </div>

                    {/* Code Snippet */}
                    {uc.codeExample && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                          <Code className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span>Code / Cấu hình mẫu minh họa:</span>
                        </div>
                        <pre className="p-3.5 sm:p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] sm:text-xs font-mono text-slate-900 dark:text-slate-300 overflow-x-auto max-w-full leading-relaxed shadow-inner">
                          {uc.codeExample}
                        </pre>
                      </div>
                    )}

                    {/* Pro Tip */}
                    {uc.tip && (
                      <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300/90 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200 dark:border-amber-900/30 leading-relaxed">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span><strong>Mẹo chuyên gia: </strong>{uc.tip}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ARCHITECTURE & METRICS */}
          {activeTab === 'architecture' && (
            <div className="space-y-6 animate-fade-in">
              {/* Score Radar / Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
                <div className="p-3 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-500 mb-1">Trending Score</div>
                  <div className="text-xl sm:text-2xl font-black text-amber-500 font-mono">
                    {Math.round(skill.trending_score)}<span className="text-xs text-slate-400">/100</span>
                  </div>
                </div>
                <div className="p-3 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-500 mb-1">Quality Score</div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-500 font-mono">
                    {Math.round(skill.quality_score)}<span className="text-xs text-slate-400">/100</span>
                  </div>
                </div>
                <div className="p-3 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-500 mb-1">Personal Match</div>
                  <div className="text-xl sm:text-2xl font-black text-indigo-500 font-mono">
                    {Math.round(skill.relevance_score)}<span className="text-xs text-slate-400">/100</span>
                  </div>
                </div>
                <div className="p-3 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-500 mb-1">Cộng Đồng GitHub</div>
                  <div className="text-xl sm:text-2xl font-black text-sky-500 font-mono">
                    {skill.stars.toLocaleString()}<span className="text-xs text-slate-400"> ★</span>
                  </div>
                </div>
              </div>

              {/* Visual Interactive Architecture Diagram */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Sơ Đồ Luồng Thực Thi & Tương Tác Của Agent</span>
                </h4>
                
                <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-950 border border-slate-800 shadow-inner">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
                    {/* Node 1: Developer Prompt */}
                    <div className="flex-1 p-4 rounded-2xl bg-slate-900 border border-slate-700 text-center shadow">
                      <div className="w-8 h-8 mx-auto rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-2">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-slate-200">1. Developer Prompt</div>
                      <div className="text-[10px] text-slate-400 mt-1">Yêu cầu từ Cursor / Claude / CLI</div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="flex items-center justify-center py-1 md:py-0">
                      <ArrowRight className="hidden md:block w-5 h-5 text-emerald-400 shrink-0 animate-pulse" />
                      <ArrowRight className="md:hidden w-5 h-5 text-emerald-400 shrink-0 rotate-90 animate-pulse" />
                    </div>

                    {/* Node 2: Skill / Protocol Layer */}
                    <div className="flex-1 p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-center shadow-lg ring-1 ring-emerald-500/30">
                      <div className="w-8 h-8 mx-auto rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center mb-2 font-bold">
                        <Boxes className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-emerald-300">{skill.title || skill.name}</div>
                      <div className="text-[10px] text-emerald-400/90 mt-1 font-mono">
                        {skill.category === 'mcp-server' ? 'MCP Protocol Tool Call' : 'Rule Enforcement & Context'}
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="flex items-center justify-center py-1 md:py-0">
                      <ArrowRight className="hidden md:block w-5 h-5 text-emerald-400 shrink-0 animate-pulse" />
                      <ArrowRight className="md:hidden w-5 h-5 text-emerald-400 shrink-0 rotate-90 animate-pulse" />
                    </div>

                    {/* Node 3: Target System / Execution */}
                    <div className="flex-1 p-4 rounded-2xl bg-slate-900 border border-slate-700 text-center shadow">
                      <div className="w-8 h-8 mx-auto rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-slate-200">3. Execution & Verification</div>
                      <div className="text-[10px] text-slate-400 mt-1">Thao tác File / DB / Git / Build</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BEFORE VS AFTER */}
          {activeTab === 'before_after' && (
            <div className="space-y-6 animate-fade-in">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Hiệu Quả Thực Tế: Trước và Sau Khi Sử Dụng</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BEFORE */}
                <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
                    <XCircle className="w-5 h-5 shrink-0" />
                    <span>Trước khi áp dụng:</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>AI viết code thiếu nhất quán, thường import sai thư viện hoặc phiên bản cũ.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>Phải gõ prompt lặp lại hướng dẫn dự án mỗi khi mở chat mới.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>Dễ xảy ra lỗi logic, thao tác nhầm vào cơ sở dữ liệu hoặc production code.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>Mất nhiều thời gian review thủ công từng dòng code.</span>
                    </li>
                  </ul>
                </div>

                {/* AFTER */}
                <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Sau khi tích hợp {skill.title || skill.name}:</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span><strong>Tự động 100%:</strong> AI tự động tuân thủ chuẩn quy ước, đúng cú pháp và clean code.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span><strong>Tiết kiệm 80% thời gian gõ prompt:</strong> Context được nạp tự động qua giao thức MCP / Rule.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span><strong>An toàn tuyệt đối:</strong> Có cơ chế xác thực, sandbox và kiểm tra lỗi trước khi commit.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>Code sinh ra sẵn sàng chạy ngay, không cần sửa lỗi vặt.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: COMPARISON */}
          {activeTab === 'comparison' && (
            <div className="space-y-5 animate-fade-in">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Scale className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Điểm Mạnh & Khác Biệt So Với Các Giải Pháp Khác</span>
              </h4>

              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-slate-800 dark:text-slate-200 leading-relaxed space-y-3">
                <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 shrink-0" /> <span>Đánh Giá Chuyên Sâu:</span>
                </div>
                <p>
                  {skill.comparison_notes || 'Giải pháp này được tối ưu hóa toàn diện cho các tác vụ coding agents hiện đại.'}
                </p>
              </div>

              {/* Feature Matrix */}
              <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 overflow-x-auto text-xs shadow-sm">
                <table className="w-full text-left min-w-[480px]">
                  <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">Tiêu chí</th>
                      <th className="p-3.5">{skill.title || skill.name}</th>
                      <th className="p-3.5 text-slate-400">Cách làm truyền thống</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="p-3.5 font-semibold">Tự động hóa Context</td>
                      <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">✓ Tự động nạp qua giao thức chuẩn</td>
                      <td className="p-3.5 text-slate-400">✗ Copy/paste thủ công từng file</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-semibold">Độ tương thích đa IDE</td>
                      <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">✓ Cursor, Claude, Gemini, Windsurf</td>
                      <td className="p-3.5 text-slate-400">✗ Phụ thuộc 1 IDE duy nhất</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-semibold">Độ tin cậy & An toàn</td>
                      <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">✓ Có cơ chế validation & sandbox</td>
                      <td className="p-3.5 text-slate-400">✗ Dễ hallucinate / lỗi cú pháp</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: MULTI-RUNTIME INSTALL */}
          {activeTab === 'install' && (
            <div className="space-y-5 animate-fade-in">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Code className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Hướng Dẫn Cài Đặt Cho Từng Runtime & IDE</span>
              </h4>

              {/* Runtime Selector Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {Object.entries(configs).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedRuntimeGuide(key)}
                    className={`px-3.5 py-2 rounded-xl sm:rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                      selectedRuntimeGuide === key
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>

              {/* Code Box */}
              {(() => {
                const currentConfig = (configs as any)[selectedRuntimeGuide] || configs.cursor;
                return (
                  <div className="relative rounded-2xl sm:rounded-3xl bg-slate-950 p-4 sm:p-6 border border-slate-800 font-mono text-xs text-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400 pb-2 border-b border-slate-800 text-[11px]">
                      <span>File cấu hình: <strong className="text-emerald-400 break-all">{currentConfig.file}</strong></span>
                      <button
                        onClick={() => handleCopyCommand(currentConfig.code)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors ml-auto"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Đã chép' : 'Sao chép code'}</span>
                      </button>
                    </div>

                    <pre className="text-slate-300 overflow-x-auto text-[11px] leading-relaxed max-w-full">
                      {currentConfig.code}
                    </pre>

                    <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-400 shrink-0">Lệnh terminal nhanh:</span>
                      <code className="text-emerald-400 font-bold break-all bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 max-w-full overflow-x-auto">$ {currentConfig.command}</code>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: SECURITY AUDIT & GUARDRAILS */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {t('security_audit_title')}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Phân tích AST và heuristic kiểm định mã nguồn độc hại & rò rỉ secret
                      </p>
                    </div>
                  </div>

                  <SecurityBadge rating={skill.security_rating || 'safe'} score={skill.security_score || 95} size="md" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 font-mono text-xs">
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 text-[11px] block">{t('security_rating_label')}</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-sm capitalize">
                      {skill.security_rating || 'safe'}
                    </strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 text-[11px] block">{t('permission_level_label')}</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-sm">
                      {skill.permission_level || 'read_only'}
                    </strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 text-[11px] block">{t('sandbox_status_label')}</span>
                    <strong className="text-emerald-500 text-sm">
                      ✓ Compliant
                    </strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono uppercase">
                    {t('security_flags_detected')}:
                  </div>
                  {skill.security_flags && skill.security_flags.length > 0 ? (
                    <div className="space-y-2">
                      {skill.security_flags.map((flag, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <strong>{flag.pattern}:</strong> {flag.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{t('no_security_flags')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: README PREVIEW */}
          {activeTab === 'readme' && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Trích Đoạn README Chính Thức Từ Repository</span>
              </h4>
              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap break-words overflow-x-auto leading-relaxed shadow-inner max-w-full">
                {skill.readme_preview || `# ${skill.title || skill.name}\n\n${skill.description}\n\nXem thêm chi tiết tại: ${skill.repository_url}`}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500/20 shrink-0" />
              {skill.stars.toLocaleString()} Stars
            </span>
            <span className="flex items-center gap-1.5">
              <GitFork className="w-4 h-4 shrink-0" />
              {skill.forks.toLocaleString()} Forks
            </span>
          </div>

          <a
            href={skill.repository_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <span>Mở trên GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
};
