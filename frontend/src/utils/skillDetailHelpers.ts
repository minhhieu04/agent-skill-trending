import { Skill } from '../types';

export type SkillDomainKey = 
  | 'subagents'
  | 'rag'
  | 'scraper'
  | 'media'
  | 'marketing'
  | 'finance'
  | 'document'
  | 'mobile'
  | 'frontend'
  | 'angular'
  | 'database'
  | 'devops'
  | 'linear'
  | 'mcp'
  | 'golang'
  | 'python'
  | 'rust'
  | 'java'
  | 'typescript'
  | 'general';

export const detectSkillDomain = (skill: Skill): SkillDomainKey => {
  const isMCP = skill.category === 'mcp-server';
  const lang = (skill.primary_language || '').toLowerCase();
  const text = `${skill.name} ${skill.title || ''} ${skill.description || ''} ${(skill.tags || []).join(' ')} ${skill.category} ${lang}`.toLowerCase();

  const matchAny = (keywords: string[]) => keywords.some(k => text.includes(k));

  if (matchAny(['superpower', 'subagent', 'sdlc', 'methodology', 'ruflo', 'deer-flow', 'hermes-agent', 'tradingagents'])) return 'subagents';
  if (matchAny(['linear', 'issue-tracking', 'sprint-automation'])) return 'linear';
  if (matchAny(['angular'])) return 'angular';
  if (matchAny(['qdrant', 'chroma', 'pinecone', 'milvus', 'weaviate', 'rag', 'retrieval', 'vector', 'embedding', 'graphify'])) return 'rag';
  if (matchAny(['firecrawl', 'browser-use', 'openclaw', 'scrape', 'crawler', 'playwright', 'puppeteer'])) return 'scraper';
  if (matchAny(['youtube', 'video', 'clipper', 'moneyprinter', 'openmontage', 'voice', 'audio', 'speech', 'tts', 'stt', 'whisper', 'pipecat', 'subtitle'])) return 'media';
  if (matchAny(['twitter', 'tweet', 'tweetclaw', 'seo', 'aso', 'email', 'mailtrap', 'courier', 'postiz', 'humanizer', 'unslop', 'prose', 'marketing', 'gtm', 'supercmo'])) return 'marketing';
  if (matchAny(['cfo', 'accountant', 'finance', 'trading', 'money', 'crypto', 'stock', 'tax', 'charlie-cfo', 'openaccountants'])) return 'finance';
  if (matchAny(['pdf', 'nutrient', 'pspdfkit', 'nanobanana', 'slide', 'presentation', 'notebooklm', 'document', 'deck'])) return 'document';
  if (matchAny(['ios', 'android', 'flutter', 'react-native', 'swift', 'kotlin', 'simulator', 'app-store', 'preflight'])) return 'mobile';
  if (matchAny(['react', 'next', 'vue', 'svelte', 'tailwind', 'ui', 'ux', 'component', 'design', 'frontend', 'accessibility', 'wcag', 'screenshot-to-code'])) return 'frontend';
  if (matchAny(['database', 'postgres', 'mysql', 'sqlite', 'redis', 'sql', 'prisma', 'drizzle', 'mongodb', 'orm'])) return 'database';
  if (matchAny(['docker', 'k8s', 'kubernetes', 'secret-knowledge', 'linux', 'sysadmin', 'devops', 'terraform', 'aws', 'gcp', 'cloud', 'security', 'audit', 'selfhosted'])) return 'devops';
  if (isMCP || text.includes('mcp')) return 'mcp';
  if (lang === 'go' || matchAny(['golang', 'go-agent'])) return 'golang';
  if (lang === 'python' || matchAny(['python', 'fastapi', 'django', 'pytest'])) return 'python';
  if (lang === 'rust' || matchAny(['rust', 'axum', 'tokio'])) return 'rust';
  if (lang === 'java' || matchAny(['java', 'spring', 'jvm'])) return 'java';
  if (lang === 'typescript' || matchAny(['typescript', 'pocock'])) return 'typescript';
  return 'general';
};

export const getDomainProblems = (skill: Skill, domain: SkillDomainKey): string[] => {
  const name = skill.title || skill.name;
  const lang = skill.primary_language || 'công nghệ';

  switch (domain) {
    case 'subagents':
      return [
        `Phân tán ngữ cảnh khi xử lý task lớn: AI thường cố giải quyết toàn bộ task trong một prompt duy nhất dẫn đến code bị cắt xén, thiếu logic biên và không kiểm thử.`,
        `Thiếu quy trình thẩm định đa tầng: Không có cơ chế checkpoints phân tách rõ ràng giữa giai đoạn lập kế hoạch, viết test, sinh mã và review độc lập.`,
        `Ảo giác và suy yếu test assertions: AI tự ý nới lỏng hoặc xóa test case để ép code pass thay vì truy tìm nguyên nhân gốc rễ (Root Cause Tracing).`
      ];
    case 'database':
      return [
        `Nguy cơ rò rỉ và phá hủy dữ liệu: AI có thể vô tình sinh câu lệnh SQL dùng nối chuỗi thô (SQL Injection) hoặc chạy query thay đổi dữ liệu thiếu transaction rollback an toàn.`,
        `Tắc nghẽn hiệu năng sản xuất: Các câu truy vấn không tối ưu hoặc thiếu index làm Full Table Scan, cạn kiệt connection pool và treo database.`,
        `Sai lệch phiên bản Schema: Thiếu migration scripts tự động có kiểm soát phiên bản khiến cấu trúc bảng giữa Dev và Production bị bất đồng bộ.`
      ];
    case 'rag':
      return [
        `Tràn cửa sổ ngữ cảnh (Context Overflow): Nhồi toàn bộ tài liệu thô vào prompt làm phình token, tăng độ trễ và khiến AI bị sao nhãng khỏi thông tin cốt lõi.`,
        `Ảo giác do dữ liệu nhiễu: Vector search đơn thuần dễ bị nhiễu bởi các đoạn văn bản tương tự về mặt từ vựng nhưng sai lệch hoàn toàn ngữ cảnh nghiệp vụ.`,
        `Thiếu cơ chế Semantic Reranking: Không đo lường và xếp hạng lại mức độ liên quan khiến câu trả lời của Agent thiếu độ tin cậy thực tế.`
      ];
    case 'scraper':
      return [
        `Vỡ layout bộ cào khi DOM thay đổi: Viết CSS selectors cứng dễ bị hỏng khi website đích cập nhật giao diện hoặc thay đổi cấu trúc HTML.`,
        `Bị chặn bởi cơ chế chống bot: Các trang web ứng dụng SPA, SSR hoặc sử dụng Cloudflare dễ dàng chặn các script request thông thường.`,
        `Dữ liệu thô chứa quá nhiều mã rác: HTML thô ngốn dung lượng token và chứa nhiều quảng cáo, scripts không cần thiết cho mô hình LLM.`
      ];
    case 'frontend':
    case 'angular':
      return [
        `Vi phạm tiêu chuẩn Accessibility: Component AI sinh ra thường thiếu thuộc tính aria-labels, phím tắt và độ tương phản màu sắc không đạt chuẩn WCAG 2.1.`,
        `Vỡ giao diện trên màn hình di động: Bố cục cứng nhắc với fixed pixel, không linh hoạt trên các kích thước thiết bị khác nhau và thiếu dark mode hoàn chỉnh.`,
        `Suy giảm chỉ số Core Web Vitals: Rò rỉ re-render không cần thiết và Cumulative Layout Shift (CLS) làm giảm trải nghiệm người dùng thực tế.`
      ];
    case 'devops':
      return [
        `Container images quá nặng nề: Không áp dụng multi-stage build khiến Docker image phình to trên 1GB, kéo dài thời gian CI/CD build và deployment.`,
        `Rò rỉ Secrets và đặc quyền root: Thiếu bộ lọc bảo mật khiến API keys hoặc database passwords vô tình bị lưu cứng vào manifests Kubernetes.`,
        `Thiếu Health Checks và Rollback: Cấu hình thiếu liveness/readiness probes dẫn đến gián đoạn dịch vụ (downtime) khi một container gặp sự cố.`
      ];
    case 'mcp':
      return [
        `Đứt gãy luồng tư duy (Context Switching): Developer phải liên tục rời IDE để mở trình duyệt hoặc chạy công cụ terminal bên ngoài.`,
        `Thiếu sandbox kiểm soát quyền: AI thực thi các lệnh hệ thống hoặc gọi API ngoại vi mà không có cơ chế phân quyền (read_only vs full_access) rõ ràng.`,
        `Sai lệch JSON-RPC Schema: AI truyền sai định dạng tham số khiến tool call thất bại và làm gián đoạn toàn bộ chuỗi suy luận của Agent.`
      ];
    case 'media':
      return [
        `Lệch pha timeline âm thanh và phụ đề: Tính toán sai duration khiến phụ đề bị trôi tiếng hoặc xuất hiện lệch nhịp so với giọng đọc.`,
        `Biên tập video thủ công tốn thời gian: Phải tự xem lại hàng giờ video để tìm điểm nhấn viral và xuất phụ đề rời rạc.`,
        `Độ trễ cao khi stream audio: Buffer không tối ưu khiến giọng nói AI bị ngắt quãng hoặc giật lag trên đường truyền yếu.`
      ];
    case 'marketing':
      return [
        `Văn phong AI sáo rỗng (AI Slop): Các bài viết tràn ngập từ ngữ sáo rỗng khiến người đọc mất hứng thú ngay từ những câu đầu tiên.`,
        `Thiếu cấu trúc Hook & Viral formatting: Nội dung không có nhịp điệu ngắt nghỉ, thiếu phân cấp thị giác phù hợp với thuật toán mạng xã hội.`,
        `Bỏ quên On-page SEO: Bài viết không có semantic tags, meta description và cấu trúc schema rich snippets chuẩn.`
      ];
    case 'mobile':
      return [
        `Rò rỉ retain cycles và memory leak: Ứng dụng native bị crash ngầm khi chuyển đổi màn hình hoặc tiêu hao pin bất thường.`,
        `Nguy cơ bị từ chối trên App Store: Vi phạm các hướng dẫn xét duyệt nghiêm ngặt của Apple hoặc Google về quyền riêng tư và UI guidelines.`,
        `Khó khăn khi test simulator tự động: Thiếu bộ kịch bản tự động chạy luồng người dùng trên nhiều kích cỡ màn hình iOS/Android.`
      ];
    case 'finance':
      return [
        `Sai số tính toán số học: AI ngôn ngữ tự nhiên thường tính toán sai lệch các công thức tài chính phức tạp hoặc tỷ lệ phần trăm.`,
        `Thiếu đối soát và kiểm toán: Không có dấu vết kiểm toán (audit trail) rõ ràng cho các dòng tiền và chứng từ kế toán.`,
        `Rủi ro lộ dữ liệu tài chính nhạy cảm: Thiếu cơ chế ẩn danh (masking) thông tin P&L và số dư ngân hàng.`
      ];
    case 'golang':
      return [
        `Rò rỉ Goroutines & Race Conditions: Tạo goroutines ngầm không có context timeout hoặc sync.WaitGroup dẫn đến tràn bộ nhớ và race hazards.`,
        `Bỏ qua kiểm tra lỗi (error != nil): AI thường lười xử lý lỗi triệt để hoặc không bọc lỗi với fmt.Errorf("%w") đúng chuẩn Go idiomatic.`,
        `Vi phạm Uber Go Style Guide: Cấu trúc package lộn xộn, lạm dụng global variables hoặc interface quá lớn gây khó bảo trì.`
      ];
    case 'python':
      return [
        `Sử dụng cú pháp Pydantic v1 lỗi thời: AI nhầm lẫn giữa v1 và v2, gây lỗi validation schema và thiếu model_dump().`,
        `Async/Await sai cách: Gọi các hàm blocking đồng bộ trong luồng async gây nghẽn event loop của FastAPI.`,
        `Thiếu Type Annotations nghiêm ngặt: Không vượt qua được mypy --strict và ruff linting.`
      ];
    case 'rust':
      return [
        `Lạm dụng .unwrap() và .clone(): Gây panic đột ngột khi gặp lỗi runtime và làm mất đi ưu thế an toàn bộ nhớ của Rust.`,
        `Xung đột với Borrow Checker: AI không giải quyết được các vấn đề lifetime phức tạp và mutable references.`,
        `Thiếu định nghĩa Error Enum chuẩn: Dùng string error thay vì thiserror/anyhow có pattern matching.`
      ];
    default:
      return [
        `Thiếu ngữ cảnh chuyên sâu về stack ${lang}: Đối với tác vụ "${skill.use_cases?.[0] || 'triển khai nghiệp vụ'}", AI chỉ đưa ra gợi ý chung chung, không nắm rõ quy ước dự án.`,
        `Sai lệch chuẩn mã nguồn: Thiếu các chỉ dẫn cụ thể cho ${name}, dẫn đến việc code sinh ra dễ bị hallucination hoặc vi phạm các quy tắc bảo mật.`,
        `Tốn công sức kiểm định thủ công: Không có cơ chế tự động kiểm tra cú pháp, sandbox guardrail và test case khiến developer phải tự sửa lỗi vặt nhiều lần.`
      ];
  }
};

export const getDomainSolutionStats = (skill: Skill, domain: SkillDomainKey) => {
  const trend = Math.round(skill.trending_score);
  const qual = Math.round(skill.quality_score);

  switch (domain) {
    case 'subagents':
      return [
        { stat: '+85% Tốc Độ Debug', label: 'TDD & Root Cause Tracing', color: 'text-emerald-500' },
        { stat: '100% Phân Rã Task', label: 'Autonomous Subagents song song', color: 'text-sky-500' },
        { stat: 'Zero Hallucination', label: 'Checkpoints thẩm định đa tầng', color: 'text-purple-500' }
      ];
    case 'database':
      return [
        { stat: '100% Parameterized', label: 'Chống triệt để SQL Injection', color: 'text-emerald-500' },
        { stat: '< 5ms Phản Hồi', label: 'EXPLAIN & Index Tối Ưu', color: 'text-sky-500' },
        { stat: 'Zero Data Loss', label: 'Sandbox & Rollback tự động', color: 'text-purple-500' }
      ];
    case 'frontend':
    case 'angular':
      return [
        { stat: '100% WCAG 2.1 AA', label: 'Chuẩn Accessibility Quốc Tế', color: 'text-emerald-500' },
        { stat: '100 Điểm Lighthouse', label: 'Core Web Vitals Tối Ưu', color: 'text-sky-500' },
        { stat: 'Zero Layout Shift', label: 'Responsive Mobile & Desktop', color: 'text-purple-500' }
      ];
    case 'rag':
      return [
        { stat: '+95% Độ Khớp', label: 'Hybrid Search & Reranking', color: 'text-emerald-500' },
        { stat: '-70% Token Context', label: 'Semantic Chunking siêu nhẹ', color: 'text-sky-500' },
        { stat: 'Zero Hallucination', label: 'Groundedness kiểm định', color: 'text-purple-500' }
      ];
    case 'devops':
      return [
        { stat: '-80% Dung Lượng Image', label: 'Multi-stage Docker build', color: 'text-emerald-500' },
        { stat: 'Zero Secret Leak', label: 'Quét AST & Sandbox Guardrails', color: 'text-sky-500' },
        { stat: '100% Rollback Safe', label: 'Terraform & K8s Manifests', color: 'text-purple-500' }
      ];
    case 'mcp':
      return [
        { stat: 'Zero Context Switch', label: 'Gọi Tool trực tiếp trong IDE', color: 'text-emerald-500' },
        { stat: '< 20ms Tool Latency', label: 'JSON-RPC 2.0 giao thức chuẩn', color: 'text-sky-500' },
        { stat: 'Sandbox Guardrail', label: 'Kiểm soát quyền truy cập tool', color: 'text-purple-500' }
      ];
    case 'media':
      return [
        { stat: '< 2 Phút Sản Xuất', label: 'Tự động hóa kịch bản & video', color: 'text-emerald-500' },
        { stat: '100% Khớp Phụ Đề', label: 'Timeline đồng bộ theo ms', color: 'text-sky-500' },
        { stat: 'Zero Lag Audio', label: 'Buffer & Stream tối ưu', color: 'text-purple-500' }
      ];
    case 'marketing':
      return [
        { stat: '100% Unslop Tone', label: 'Khử sáo rỗng, chuẩn chuyên gia', color: 'text-emerald-500' },
        { stat: '+3x Độ Lan Tỏa', label: 'Cấu trúc Hook & Thread tối ưu', color: 'text-sky-500' },
        { stat: 'Chuẩn SEO On-page', label: 'Schema & Semantic Keywords', color: 'text-purple-500' }
      ];
    case 'mobile':
      return [
        { stat: '100% Pass Preflight', label: 'Tuân thủ App Store Guidelines', color: 'text-emerald-500' },
        { stat: 'Zero Native Leak', label: 'Quản lý vòng đời bộ nhớ chuẩn', color: 'text-sky-500' },
        { stat: 'Tự Động Simulator', label: 'Kiểm thử đa thiết bị', color: 'text-purple-500' }
      ];
    case 'finance':
      return [
        { stat: '100% Chuẩn Báo Cáo', label: 'Đối soát P&L và dòng tiền', color: 'text-emerald-500' },
        { stat: 'Số Học Chính Xác', label: 'Thuật toán Quant backtesting', color: 'text-sky-500' },
        { stat: 'Audit Trail Khép Kín', label: 'Bảo mật số liệu tài chính', color: 'text-purple-500' }
      ];
    default:
      return [
        { stat: `+${Math.max(65, trend)}% Tốc Độ`, label: `Trending Score ${trend}/100`, color: 'text-emerald-500' },
        { stat: `${qual}/100 Điểm Chuẩn`, label: 'Chất lượng mã nguồn kiểm định', color: 'text-sky-500' },
        { stat: `${skill.runtimes?.length || 4}+ IDE Tương Thích`, label: 'Google, Cursor, Claude & Windsurf', color: 'text-purple-500' }
      ];
  }
};

export const getDomainQuickSteps = (skill: Skill, selectedRuntime: string) => {
  const pkgName = skill.name.replace('/', '-').replace('_', '-').toLowerCase();
  const lang = (skill.primary_language || '').toLowerCase();
  const firstUc = skill.use_cases?.[0] || 'triển khai tác vụ thực tế';

  let verifyCmd = 'npm test';
  if (lang === 'go') verifyCmd = 'go test -race ./...';
  else if (lang === 'python') verifyCmd = 'pytest -v --cov';
  else if (lang === 'rust') verifyCmd = 'cargo test && cargo clippy';
  else if (lang === 'java') verifyCmd = 'mvn test';
  else if (skill.category === 'mcp-server') verifyCmd = `npx @modelcontextprotocol/inspector`;

  let installDesc = `Cấu hình tại .gemini/config/skills/${pkgName}/SKILL.md hoặc .cursor/rules/${pkgName}.mdc`;
  if (selectedRuntime === 'cursor') installDesc = `Tạo file .cursor/rules/${pkgName}.mdc để Cursor tự động kích hoạt.`;
  else if (selectedRuntime === 'claude') installDesc = `Nạp vào ~/.claude/skills/${pkgName}/SKILL.md cho Claude Code.`;

  return [
    {
      step: 1,
      title: 'Kích hoạt cấu hình',
      desc: installDesc,
      badge: 'BƯỚC 1'
    },
    {
      step: 2,
      title: 'Chạy Prompt Tác Vụ',
      desc: `Yêu cầu Agent: "Áp dụng ${skill.title || skill.name} để ${firstUc.toLowerCase()}"`,
      badge: 'BƯỚC 2'
    },
    {
      step: 3,
      title: 'Kiểm định & Bàn giao',
      desc: `Chạy lệnh verify: \`${verifyCmd}\` và kiểm tra điểm an toàn (${skill.security_rating?.toUpperCase() || 'SAFE'}).`,
      badge: 'BƯỚC 3'
    }
  ];
};

export const getDomainBeforeAfter = (skill: Skill, domain: SkillDomainKey) => {
  const lang = skill.primary_language || 'công nghệ';
  const ucs = skill.use_cases || [];

  switch (domain) {
    case 'subagents':
      return {
        before: [
          'AI giải quyết task lớn trong một câu trả lời duy nhất, dẫn đến code bị cắt ngắn và bỏ qua edge cases.',
          'Không có ranh giới rõ ràng giữa lập kế hoạch và thực thi, dễ bị lạc đề (rabbit hole).',
          'Tự ý sửa đổi assertions trong bài test để ép code pass thay vì sửa logic thật.',
          'Mất hàng giờ debug thủ công khi hệ thống phát sinh lỗi bất ngờ.'
        ],
        after: [
          'Phân rã task thành các subtasks độc lập và điều phối Autonomous Subagents thực thi song song.',
          'Checkpoints đánh giá nghiêm ngặt tại từng giai đoạn trước khi chuyển sang bước tiếp theo.',
          'Tuân thủ phương pháp Test-Driven Development (TDD) và Systematic Debugging đa tầng.',
          'Mã nguồn sạch, có test suite bao phủ toàn diện và sẵn sàng chuyển giao vào production.'
        ]
      };
    case 'database':
      return {
        before: [
          'AI sinh câu lệnh SQL dùng nối chuỗi thô tiềm ẩn nguy cơ SQL Injection nghiêm trọng.',
          'Truy vấn không có index làm Full Table Scan gây treo hệ thống khi dữ liệu lớn.',
          'Thao tác UPDATE/DELETE không bọc trong transaction an toàn, dễ mất dữ liệu vĩnh viễn.',
          'Thiếu migration script có version control, gây lỗi sai lệch schema.'
        ],
        after: [
          '100% Parameterized Queries bắt buộc, loại bỏ hoàn toàn nguy cơ SQL Injection.',
          'Tự động phân tích EXPLAIN ANALYZE và đề xuất đánh index tối ưu độ trễ dưới 5ms.',
          'Bọc mọi thao tác thay đổi dữ liệu trong transaction có cơ chế rollback an toàn.',
          'Tự động sinh migration scripts chuẩn hóa, tương thích ORM và có ràng buộc toàn vẹn.'
        ]
      };
    case 'frontend':
    case 'angular':
      return {
        before: [
          'AI sinh component thiếu dark mode, vỡ layout khi xem trên thiết bị di động.',
          'Bỏ quên tiêu chuẩn Accessibility (WCAG 2.1), không có aria-labels cho screen readers.',
          'Mã nguồn lộn xộn, không tuân thủ Design System và quy chuẩn Component Library.',
          'Chỉ số Core Web Vitals thấp, bị giật layout (CLS) và re-render lãng phí.'
        ],
        after: [
          'Component chuẩn TypeScript, hỗ trợ hoàn hảo cả Dark Mode và Responsive 100%.',
          'Đạt chứng nhận Accessibility WCAG 2.1 AA với đầy đủ phím tắt và aria attributes.',
          'Tuân thủ chặt chẽ Design Tokens, bảng màu tương phản cao và hiệu ứng mượt mà.',
          'Tối ưu hóa Core Web Vitals đạt 100 điểm Google Lighthouse, triệt tiêu CLS.'
        ]
      };
    case 'rag':
      return {
        before: [
          'Nhồi toàn bộ tài liệu thô vào context window làm tràn token limit và tốn kém chi phí.',
          'Vector search thông thường bị nhiễu bởi các từ đồng âm, sinh câu trả lời bị ảo giác.',
          'Không có cơ chế xếp hạng lại (reranking), bỏ sót các dữ liệu nghiệp vụ quan trọng.',
          'Độ trễ phản hồi cao do phải xử lý khối lượng ngữ cảnh khổng lồ.'
        ],
        after: [
          'Semantic Chunking thông minh kết hợp Hybrid Search (Dense Vector + BM25 Sparse).',
          'Reranking đa tầng chọn lọc chính xác các đoạn văn bản có độ liên quan > 95%.',
          'Kiểm định tính xác thực (Groundedness) trước khi phản hồi, triệt tiêu hallucination.',
          'Tiết kiệm 70% chi phí token và giảm độ trễ phản hồi xuống dưới 1 giây.'
        ]
      };
    case 'devops':
      return {
        before: [
          'Dockerfile một tầng cồng kềnh (>1GB), kéo dài thời gian build và tốn băng thông CI/CD.',
          'Rò rỉ secret tokens hoặc cấp quyền root trong Kubernetes pods gây rủi ro an ninh mạng.',
          'Cấu hình hạ tầng thủ công bằng click chuột trên Cloud Console, không thể tái lập.',
          'Thiếu health checks khiến container lỗi vẫn nhận traffic làm chết dịch vụ.'
        ],
        after: [
          'Dockerfile multi-stage siêu nhẹ, giảm dung lượng image hơn 80% và build thần tốc.',
          'Áp dụng nguyên tắc Zero-Trust, quét rò rỉ secret và chạy container với non-root user.',
          'Hạ tầng định nghĩa bằng mã (IaC Terraform) có version control và rollback tự động.',
          'Đầy đủ Liveness và Readiness Probes đảm bảo tính khả dụng 99.99% của hệ thống.'
        ]
      };
    case 'mcp':
      return {
        before: [
          'Phải liên tục copy/paste dữ liệu thủ công giữa các tab trình duyệt và IDE.',
          'Không có cơ chế kiểm soát quyền hạn, AI có thể vô tình chạy script nguy hại.',
          'Đứt gãy mạch suy nghĩ lập trình viên khi phải chuyển đổi công cụ liên tục.',
          'Khó khăn khi muốn mở rộng thêm công cụ mới cho AI Coding Assistant.'
        ],
        after: [
          'Kết nối hai chiều qua Model Context Protocol (MCP), Agent thực thi trực tiếp trong IDE.',
          'Sandbox phân quyền nghiêm ngặt, hiển thị xác nhận trước khi thực hiện hành động nhạy cảm.',
          'Duy trì ngữ cảnh liền mạch, tiết kiệm hơn 80% thời gian thao tác thủ công.',
          'Tương thích chuẩn mở, dễ dàng kết nối với hàng trăm MCP servers trong hệ sinh thái.'
        ]
      };
    default:
      return {
        before: [
          `AI không có ngữ cảnh chuyên sâu về stack ${lang}, sinh code chung chung hoặc sai lệch thư viện.`,
          `Thiếu hướng dẫn chuẩn cho tác vụ: "${ucs[0] || 'nghiệp vụ chính'}", phải gõ prompt dài hàng chục dòng.`,
          `Dễ xảy ra lỗi bảo mật tiềm ẩn, không có cơ chế sandbox guardrail để kiểm soát mã nguồn.`,
          `Mất nhiều thời gian sửa lỗi do AI không tự viết unit test bao phủ các trường hợp biên.`
        ],
        after: [
          `Tự động 100%: AI kích hoạt rule chuyên sâu, áp dụng Clean Architecture của ${lang}.`,
          `Thực thi mượt mà các use cases: Xử lý tức thì các tác vụ cốt lõi không cần gõ lại prompt.`,
          `An toàn & Kiểm soát: Đạt chứng nhận an toàn ${skill.security_rating?.toUpperCase() || 'SAFE'} (${skill.security_score || 95}/100).`,
          `Sẵn sàng trên ${(skill.runtimes?.length || 4)}+ IDE: Code sinh ra kèm test suite, vượt qua kiểm tra chất lượng.`
        ]
      };
  }
};

export const getDomainComparisonMatrix = (skill: Skill, domain: SkillDomainKey) => {
  const lang = skill.primary_language || 'dự án';

  switch (domain) {
    case 'subagents':
      return [
        {
          criteria: 'Quản lý task lớn & phức tạp',
          current: `Phân rã bài toán và điều phối Autonomous Subagents có checkpoints`,
          traditional: `Nhồi toàn bộ vào 1 prompt duy nhất, code bị cắt ngắn và hallucinate`
        },
        {
          criteria: 'Quy trình kiểm thử chất lượng',
          current: `Ép buộc Test-Driven Development (TDD) và Root Cause Tracing`,
          traditional: `Sửa test để ép code pass hoặc chỉ test trường hợp thuận lợi`
        },
        {
          criteria: 'Cơ chế Code Review',
          current: `Review độc lập đa tầng trước khi hợp nhất mã nguồn`,
          traditional: `Bỏ qua review, tin tưởng mù quáng vào kết quả đầu tiên của AI`
        },
        {
          criteria: 'Tính nhất quán SDLC',
          current: `Phương pháp luận rõ ràng, duy trì ngữ cảnh qua từng giai đoạn`,
          traditional: `Thử và sai ngẫu nhiên, mất dấu tiến độ khi phiên chat kéo dài`
        }
      ];
    case 'database':
      return [
        {
          criteria: 'An toàn câu lệnh SQL',
          current: `100% Parameterized Binding bắt buộc, chống triệt để SQL Injection`,
          traditional: `Nối chuỗi thô dễ bị tấn công SQL Injection phá hủy dữ liệu`
        },
        {
          criteria: 'Tối ưu hiệu năng truy vấn',
          current: `Tự động phân tích EXPLAIN ANALYZE và đề xuất index tối ưu`,
          traditional: `Chạy query không có index gây Full Table Scan làm treo database`
        },
        {
          criteria: 'Bảo vệ dữ liệu sản xuất',
          current: `Sandbox Guardrails tự động rollback khi phát hiện câu lệnh rủi ro`,
          traditional: `Không có rollback, nguy cơ chạy nhầm lệnh DROP/TRUNCATE`
        },
        {
          criteria: 'Quản lý Migration Schema',
          current: `Tự động sinh migration scripts có version control và ràng buộc kiểu`,
          traditional: `Chỉnh sửa schema thủ công dẫn đến sai lệch giữa các môi trường`
        }
      ];
    case 'frontend':
    case 'angular':
      return [
        {
          criteria: 'Tiêu chuẩn Accessibility (a11y)',
          current: `Tuân thủ 100% chuẩn WCAG 2.1 AA (hỗ trợ screen readers & phím tắt)`,
          traditional: `Component thiếu aria attributes và tương phản màu sắc kém`
        },
        {
          criteria: 'Tương thích đa màn hình & Theme',
          current: `Responsive 100% trên Mobile/Tablet và hỗ trợ Dark Mode hoàn chỉnh`,
          traditional: `Dùng hardcoded pixel, vỡ layout trên màn hình hẹp và thiếu dark mode`
        },
        {
          criteria: 'Tối ưu Core Web Vitals',
          current: `Loại bỏ hoàn toàn Cumulative Layout Shift (CLS), đạt 100 Lighthouse`,
          traditional: `Re-render lãng phí, giật layout và thời gian tải trang kéo dài`
        },
        {
          criteria: 'Kiểm tra kiểu dữ liệu Props',
          current: `Strict TypeScript Types / Signals với validation đầu vào an toàn`,
          traditional: `Sử dụng kiểu 'any' bừa bãi dẫn đến lỗi runtime undefined`
        }
      ];
    case 'devops':
      return [
        {
          criteria: 'Tối ưu kích thước Container',
          current: `Multi-stage Dockerfile siêu nhẹ, giảm hơn 80% dung lượng image`,
          traditional: `Single stage container cồng kềnh (>1GB), kéo dài thời gian build CI/CD`
        },
        {
          criteria: 'Kiểm soát rò rỉ Secrets',
          current: `Quét AST và biến môi trường, ngăn chặn tuyệt đối lộ API keys`,
          traditional: `Hardcode token hoặc password vào Dockerfile / K8s manifests`
        },
        {
          criteria: 'Khả năng khôi phục hạ tầng',
          current: `IaC Terraform có phiên bản hóa và cơ chế rollback tự động`,
          traditional: `Cấu hình thủ công trên Console, không thể tái lập khi có thảm họa`
        },
        {
          criteria: 'Tính sẵn sàng dịch vụ',
          current: `Cấu hình đầy đủ Liveness & Readiness Probes đạt 99.99% uptime`,
          traditional: `Thiếu health checks khiến traffic đổ vào container đang chết`
        }
      ];
    case 'mcp':
      return [
        {
          criteria: 'Tương tác công cụ hai chiều',
          current: `Giao thức Model Context Protocol (MCP) chuẩn, gọi trực tiếp trong IDE`,
          traditional: `Chuyển đổi tab liên tục để copy/paste dữ liệu thủ công từ ngoài`
        },
        {
          criteria: 'Cơ chế Sandbox an toàn',
          current: `Phân quyền rõ ràng (read_only / safe execution) trước khi gọi tool`,
          traditional: `Thực thi script tự do không có sự kiểm soát quyền hạn`
        },
        {
          criteria: 'Độ trễ và Tính ổn định',
          current: `Giao thức JSON-RPC 2.0 tốc độ cao, xử lý luồng streaming <20ms`,
          traditional: `Gọi webhook rời rạc dễ timeout và không có retry tự động`
        },
        {
          criteria: 'Khả năng mở rộng hệ sinh thái',
          current: `Kết nối linh hoạt với hàng trăm công cụ trong hệ sinh thái MCP`,
          traditional: `Viết code tích hợp riêng cho từng công cụ, khó bảo trì`
        }
      ];
    default:
      return [
        {
          criteria: 'Tự động hóa Context',
          current: `Tự động nạp qua ${(skill.runtimes || ['antigravity', 'cursor']).join(', ')}`,
          traditional: `Copy/paste thủ công từng quy tắc và file vào phiên chat`
        },
        {
          criteria: 'Chuyên môn hóa lĩnh vực',
          current: `Tối ưu chuyên sâu cho ${(skill.tags || [skill.category]).slice(0, 3).join(', ')}`,
          traditional: `Prompt generic chung chung, AI dễ bị hallucinate`
        },
        {
          criteria: 'Kiểm soát an toàn & Quyền hạn',
          current: `${skill.security_rating?.toUpperCase() || 'SAFE'} (${skill.security_score || 95}/100) • Quyền ${skill.permission_level || 'read_only'}`,
          traditional: `Không có kiểm tra AST, tiềm ẩn rủi ro rò rỉ secrets`
        },
        {
          criteria: 'Khả năng kiểm thử & Bàn giao',
          current: `Kèm kịch bản verify & test suite chuyên sâu cho ${lang}`,
          traditional: `Không kèm test case, tốn công sức gỡ lỗi thủ công`
        }
      ];
  }
};
