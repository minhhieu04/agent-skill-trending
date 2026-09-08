"""
Intelligent Skill Metadata Enricher.
Derives domain-specific use cases, comparison notes, and targeted audiences
based on skill title, name, description, category, primary language, and tags.
Covers over 20 distinct technical and business domains with zero generic repetition.
"""

from typing import List, Tuple, Optional, Any
import re

def derive_skill_details(
    name: str,
    title: Optional[str] = None,
    desc: Optional[str] = None,
    cat: Optional[str] = None,
    lang: Optional[str] = None,
    tags: Optional[List[str]] = None
) -> Tuple[List[str], str, str]:
    clean_title = title or name.split('/')[-1].replace('-', ' ').replace('_', ' ').title()
    raw_desc = desc or ''
    # Filter out repository curation noise
    meaningful_desc = raw_desc.replace('Curated in VoltAgent/awesome-agent-skills', '').strip()
    tags_list = tags or []
    
    # Text corpus for matching keywords
    text = f"{name} {clean_title} {meaningful_desc} {' '.join(tags_list)} {cat or ''} {lang or ''}".lower()
    clean_name = name.split('/')[-1].lower()
    
    use_cases: List[str] = []
    comparison_notes = ""
    target_audience = ""
    
    # 1. Superpowers / Autonomous Subagents / SDLC Methodologies
    if any(k in text for k in ['superpower', 'subagent', 'sdlc', 'methodology', 'ruflo', 'deer-flow', 'hermes-agent', 'tradingagents']):
        use_cases = [
            f"Phân rã task phức tạp thành các subtasks và điều phối Autonomous Subagents thực thi song song qua {clean_title}",
            "Áp dụng phương pháp Test-Driven Development (TDD) và Systematic Debugging đa tầng có checkpoints thẩm định",
            "Tự động hóa quy trình brainstorm kiến trúc, lập kế hoạch chi tiết và code review độc lập trước khi merge"
        ]
        comparison_notes = f"Khác với việc giao toàn bộ dự án cho một prompt duy nhất dễ hallucination, {clean_title} thiết lập quy trình SDLC phân tầng với subagents chuyên trách, kiểm định từng bước chặt chẽ."
        target_audience = "AI Engineers, Software Architects & Engineering Leads"

    # 2. Vector DB / Semantic RAG / Knowledge Graph
    elif any(k in text for k in ['qdrant', 'chroma', 'pinecone', 'milvus', 'weaviate', 'rag', 'retrieval', 'vector', 'embedding', 'graphify', 'knowledge-graph']):
        use_cases = [
            f"Xây dựng pipeline Hybrid RAG kết hợp Vector Search và BM25 Keyword Search có semantic reranking cho {clean_title}",
            "Trích xuất thực thể quan hệ, xây dựng Knowledge Graph và thực hiện truy vấn đa tầng (multi-hop reasoning)",
            "Nạp ngữ cảnh tài liệu nội bộ chính xác vào prompt của Coding Agent, ngăn ngừa triệt để hallucination"
        ]
        comparison_notes = f"Thay vì nhồi toàn bộ tài liệu thô gây tràn context window, {clean_title} phân đoạn ngữ nghĩa và truy xuất chính xác thông tin liên quan với độ khớp >95%."
        target_audience = "RAG Developers, AI/ML Engineers & Knowledge Architects"

    # 3. Web Scraping / Headless Browser / Web Extraction
    elif any(k in text for k in ['firecrawl', 'browser-use', 'openclaw', 'scrape', 'crawler', 'playwright', 'puppeteer', 'selenium']):
        use_cases = [
            f"Chuyển đổi các trang web động (SPA/SSR) thành định dạng Clean Markdown tối ưu cho LLMs bằng {clean_title}",
            "Tự động điều khiển Headless Browser thực hiện luồng đăng nhập phức tạp, bypass CAPTCHA và thu thập dữ liệu",
            "Trích xuất dữ liệu dạng bảng biểu và cấu trúc JSON theo thời gian thực mà không cần viết CSS selector thủ công"
        ]
        comparison_notes = f"{clean_title} loại bỏ hoàn toàn việc bảo trì CSS selectors dễ gãy; Agent tự động thấu hiểu cấu trúc DOM và thu thập dữ liệu sạch cho AI pipeline."
        target_audience = "Data Scraping Specialists, Automation Engineers & AI Builders"

    # 4. Video / Audio / Voice / Media Processing / YouTube
    elif any(k in text for k in ['youtube', 'video', 'clipper', 'moneyprinter', 'openmontage', 'voice', 'audio', 'speech', 'tts', 'stt', 'whisper', 'pipecat', 'subtitle', 'dictation']):
        use_cases = [
            f"Tự động phân tích video, trích xuất điểm nhấn viral và cắt thành Short/Reels/TikTok kèm phụ đề qua {clean_title}",
            "Đồng bộ hóa luồng giọng đọc AI thời gian thực với timeline phụ đề và hình ảnh minh họa theo mili-giây",
            "Tự động sinh kịch bản lồng tiếng đa ngôn ngữ và tạo storyboard trực quan từ bài viết kỹ thuật"
        ]
        comparison_notes = f"{clean_title} tự động hóa quy trình sản xuất video & audio đa phương tiện từ kịch bản đến render cuối, rút ngắn thời gian từ 3 giờ xuống dưới 2 phút."
        target_audience = "Content Creators, Video Editors & Audio/Voice Engineers"

    # 5. Social Media / Twitter / Growth / Marketing / Copywriting
    elif any(k in text for k in ['twitter', 'tweet', 'tweetclaw', 'seo', 'aso', 'email', 'mailtrap', 'courier', 'postiz', 'humanizer', 'unslop', 'prose', 'marketing', 'gtm', 'supercmo', 'copywriting', 'linkedin']):
        use_cases = [
            f"Soạn thảo chuỗi bài viết Twitter/LinkedIn có hook thu hút, tối ưu độ lan tỏa và viral với {clean_title}",
            "Khử văn phong AI sáo rỗng (unslop), hiệu chỉnh ngữ điệu tự nhiên và chuẩn hóa tone giọng chuyên gia",
            "Tối ưu hóa SEO/ASO on-page, tự động nghiên cứu từ khóa ngữ nghĩa và thiết lập email drip campaigns"
        ]
        comparison_notes = f"{clean_title} biến ý tưởng kỹ thuật thô ráp thành nội dung truyền thông sắc bén, loại bỏ hoàn toàn các cấu trúc lặp nhàm chán của AI mặc định."
        target_audience = "Technical Marketers, Growth Hackers & DevRel Advocates"

    # 6. Finance / Accounting / CFO / Quantitative Trading
    elif any(k in text for k in ['cfo', 'accountant', 'finance', 'trading', 'money', 'crypto', 'stock', 'tax', 'charlie-cfo', 'openaccountants', 'linear']):
        if 'linear' in text:
            use_cases = [
                f"Tự động đồng bộ hóa Linear issues, cập nhật tiến độ sprint và quản lý cycle qua {clean_title}",
                "Tự động tạo sub-issues và liên kết pull request với Linear tickets theo đúng quy ước",
                "Phân tích backlog, gán story points và phát hiện sớm các rào cản tiến độ (blockers)"
            ]
            comparison_notes = f"{clean_title} kết nối trực tiếp workflow quản lý dự án Linear vào IDE, giúp developer tập trung viết code mà không phải mở tab ngoài."
            target_audience = "Product Managers, Tech Leads & Agile Teams"
        else:
            use_cases = [
                f"Phân tích dòng tiền (Cash Flow), dự phóng Runway và tự động lập mô hình tài chính P&L qua {clean_title}",
                "Tự động đối soát hóa đơn chứng từ, sinh bảng cân đối kế toán tuân thủ chuẩn báo cáo",
                "Phát triển chiến lược giao dịch tự động hóa và backtest trên tập dữ liệu thị trường quá khứ"
            ]
            comparison_notes = f"Đảm bảo tính chính xác số học tuyệt đối và bảo mật tài chính; {clean_title} thay thế hàng chục giờ tính toán Excel thủ công."
            target_audience = "Founders, CFOs, Accountants & Quant Developers"

    # 7. Document / PDF / Presentation / Slide Decks
    elif any(k in text for k in ['pdf', 'nutrient', 'pspdfkit', 'nanobanana', 'slide', 'presentation', 'notebooklm', 'document', 'deck', 'slides']):
        use_cases = [
            f"Trích xuất dữ liệu bảng biểu, form mẫu và chữ ký từ tài liệu PDF phức tạp với {clean_title}",
            "Tự động chuyển đổi tài liệu kỹ thuật thành slide thuyết trình HTML/Marp trực quan chuẩn tỉ lệ vàng",
            "Nghiên cứu tổng hợp đa nguồn tài liệu, sinh bản tóm tắt điều hành và audio brief chuyên sâu"
        ]
        comparison_notes = f"{clean_title} giúp AI xử lý tài liệu đa định dạng chính xác từng trang, xuất ra bản trình chiếu và báo cáo chuyên nghiệp chỉ sau một prompt."
        target_audience = "Business Analysts, Consultants & Product Managers"

    # 8. Mobile Development (iOS / Android / Flutter / React Native)
    elif any(k in text for k in ['ios', 'android', 'flutter', 'react-native', 'swift', 'kotlin', 'simulator', 'app-store', 'preflight']):
        use_cases = [
            f"Tự động hóa kiểm thử UI trên iOS Simulator và Android Emulator với {clean_title}",
            "Kiểm tra điều kiện xét duyệt Apple App Store & Google Play (Preflight Checklist) trước khi release",
            "Tối ưu hóa vòng đời ứng dụng, ngăn chặn rò rỉ bộ nhớ (retain cycles) và kiểm định chuẩn Accessibility"
        ]
        comparison_notes = f"Chuyên biệt hóa cho quy trình mobile app; {clean_title} phát hiện sớm các lỗi crash native và vi phạm chính sách của Store trước khi nộp build."
        target_audience = "iOS, Android & Cross-Platform Mobile Engineers"

    # 9. Frontend Frameworks & UI/UX Design Systems
    elif any(k in text for k in ['angular', 'react', 'next', 'vue', 'svelte', 'tailwind', 'ui', 'ux', 'component', 'design', 'frontend', 'accessibility', 'wcag', 'screenshot-to-code']):
        if 'angular' in text:
            use_cases = [
                f"Chuẩn hóa kiến trúc Angular Standalone Components, Signals và reactive state RxJS với {clean_title}",
                "Tự động sinh Unit Test với Karma/Jasmine hoặc Vitest cho Angular Services và Directives",
                "Tối ưu hóa ChangeDetectionStrategy.OnPush và Lazy Loading micro-frontends"
            ]
            comparison_notes = f"Ngăn ngừa tình trạng AI sinh cú pháp NgModules cũ; {clean_title} ép buộc áp dụng chuẩn Angular mới nhất với Signals và Standalone APIs."
            target_audience = "Angular Developers & Enterprise Frontend Engineers"
        else:
            use_cases = [
                f"Xây dựng bộ UI Component Library hiện đại, hỗ trợ dark mode và chuẩn WCAG 2.1 AA bằng {clean_title}",
                "Tự động chuyển đổi ảnh mockup thiết kế hoặc Figma thành component React/Next.js chuẩn TypeScript",
                "Tối ưu hóa Core Web Vitals, loại bỏ Cumulative Layout Shift (CLS) và nâng cao điểm Lighthouse"
            ]
            comparison_notes = f"Khắc phục nhược điểm AI sinh giao diện thiếu thẩm mỹ và vỡ layout; {clean_title} biến bản vẽ thô thành component cấp Production tức thì."
            target_audience = "Frontend Engineers, UI/UX Designers & Design System Leads"

    # 10. Database / SQL / Caching / ORM
    elif any(k in text for k in ['database', 'postgres', 'mysql', 'sqlite', 'redis', 'sql', 'prisma', 'drizzle', 'mongodb', 'orm']):
        use_cases = [
            f"Kiểm định cú pháp SQL, phân tích EXPLAIN ANALYZE và đề xuất đánh index tối ưu hiệu năng qua {clean_title}",
            "Tự động sinh migration scripts an toàn và thiết lập ORM schema có ràng buộc kiểu nghiêm ngặt",
            "Áp dụng cơ chế caching Redis và connection pooling chống nghẽn cổ chai khi tải cao"
        ]
        comparison_notes = f"Ngăn chặn hoàn toàn rủi ro chạy nhầm câu lệnh phá hủy dữ liệu (DROP/DELETE) nhờ cơ chế kiểm định AST và Parameterized Queries bắt buộc của {clean_title}."
        target_audience = "Backend Engineers & Database Administrators (DBA)"

    # 11. DevOps / Cloud / Infrastructure / Security
    elif any(k in text for k in ['docker', 'k8s', 'kubernetes', 'secret-knowledge', 'linux', 'sysadmin', 'devops', 'terraform', 'aws', 'gcp', 'cloud', 'security', 'audit', 'selfhosted']):
        use_cases = [
            f"Chuẩn hóa Dockerfile đa tầng (multi-stage) siêu nhẹ và manifests Kubernetes an toàn theo chuẩn {clean_title}",
            "Quét và phát hiện rò rỉ secret tokens, cấu hình phân quyền nguy hiểm và command injection",
            "Tự động hóa hạ tầng đám mây với Terraform/IaC kèm cơ chế kiểm tra rollback an toàn"
        ]
        comparison_notes = f"Cung cấp lớp khiên bảo vệ Guardrails vững chắc; {clean_title} ngăn chặn Agent vô tình thực thi lệnh phá hoại hệ thống hoặc đưa cấu hình hớ hênh lên mây."
        target_audience = "DevOps, SecOps & Cloud Infrastructure Engineers"

    # 12. IDE Tools, Prompt Engineering & Rules
    elif any(k in text for k in ['cursor', 'cline', 'claude-mem', 'cc-switch', 'prompts.chat', 'copilot', 'codex', 'thinking', 'career', 'job', 'resume', 'founder']):
        if any(k in text for k in ['job', 'career', 'resume', 'founder']):
            use_cases = [
                f"Tự động phân tích JD, tối ưu hóa CV/Resume vượt qua bộ lọc ATS với {clean_title}",
                "Luyện phỏng vấn kỹ thuật và System Design tương tác thời gian thực với AI Agent",
                "Hoàn thiện Pitch Deck, phân tích đối thủ và thẩm định mô hình kinh doanh cho Founder"
            ]
            comparison_notes = f"{clean_title} cá nhân hóa hồ sơ theo từng vị trí tuyển dụng, tăng tỷ lệ phản hồi phỏng vấn lên gấp 3 lần so với nộp CV chung chung."
            target_audience = "Software Engineers, Tech Job Seekers & Startup Founders"
        else:
            use_cases = [
                f"Tự động kích hoạt context và instruction rules chuyên sâu cho từng thư mục dự án qua {clean_title}",
                "Duy trì bộ nhớ dài hạn (persistent memory) giữa các phiên làm việc của Coding Agent",
                "Ép buộc AI tuân thủ nghiêm ngặt quy chuẩn kiến trúc của team mà không cần gõ lại prompt"
            ]
            comparison_notes = f"Chấm dứt việc phải copy/paste context thủ công; các rules được nạp tự động vào IDE giúp AI phản hồi chuẩn xác theo đúng quy ước dự án."
            target_audience = "Cursor, Claude Code & AI IDE Power Users"

    # 13. MCP Servers & Protocols
    elif cat == 'mcp-server' or 'mcp' in text:
        use_cases = [
            f"Kết nối Agent với dịch vụ {clean_title} qua giao thức Model Context Protocol (MCP) chuẩn",
            "Thực thi tool calls hai chiều có sandbox bảo mật, không làm đứt gãy luồng suy nghĩ của lập trình viên",
            f"Đồng bộ hóa dữ liệu thời gian thực giữa IDE và môi trường vận hành của {clean_title}"
        ]
        comparison_notes = f"Thay vì phải chuyển đổi qua lại giữa trình duyệt/terminal và IDE, {clean_title} mở đường ống kết nối trực tiếp để Agent đọc dữ liệu và hành động tức thì."
        target_audience = "Fullstack Engineers & Agent Tool Builders"

    # 14. Language: Go
    elif lang == 'Go' or 'golang' in text:
        use_cases = [
            f"Tối ưu hóa goroutines, channels và ngăn ngừa triệt để rò rỉ bộ nhớ theo chuẩn {clean_title}",
            "Tự động sinh Table-Driven Unit Tests và benchmarks chạy với 'go test -race ./...'",
            "Chuẩn hóa Clean Architecture, context cancellation và error wrapping với fmt.Errorf(\"%w\")"
        ]
        comparison_notes = f"Bộ quy chuẩn Golang chuyên sâu giúp Agent tránh các lỗi crash panic, race condition và tuân thủ 100% Uber Go Style Guide."
        target_audience = "Golang Developers & Systems Engineers"

    # 15. Language: Python
    elif lang == 'Python' or any(k in text for k in ['python', 'fastapi', 'django', 'pytest']):
        use_cases = [
            f"Chuẩn hóa FastAPI & Pydantic v2 với Strict Type Validation và async session handling qua {clean_title}",
            "Xây dựng bộ async pytest fixtures cô lập mock database và external dependencies",
            "Tối ưu hóa code quality với ruff, mypy strict và cấu hình packaging hiện đại"
        ]
        comparison_notes = f"{clean_title} ép buộc Agent sử dụng cú pháp Pydantic v2 mới nhất và dependency injection chuẩn, tránh các lỗi code lỗi thời (v1) phổ biến."
        target_audience = "Python Developers & Data Engineers"

    # 16. Language: Rust
    elif lang == 'Rust' or 'rust' in text:
        use_cases = [
            f"Xây dựng dịch vụ an toàn bộ nhớ tuyệt đối với Axum/Tokio, loại bỏ panic unwrap() bằng {clean_title}",
            "Xử lý error handling mạnh mẽ với thiserror/anyhow và pattern matching chuẩn mực",
            "Tối ưu hóa borrow checker, zero-cost abstractions và chạy cargo clippy tự động"
        ]
        comparison_notes = f"Giúp Agent chinh phục borrow checker của Rust mà không cần lạm dụng .clone() hay .unwrap(), mang lại mã nguồn hiệu năng cao tối đa."
        target_audience = "Rustaceans & Systems Developers"

    # 17. Language: Java
    elif lang == 'Java' or any(k in text for k in ['java', 'spring', 'jvm', 'kotlin']):
        use_cases = [
            f"Thiết kế kiến trúc Spring Boot 3 Microservices với Spring Security và JPA qua {clean_title}",
            "Tối ưu hóa bộ nhớ JVM, phân tích Garbage Collection và xử lý Concurrency an toàn",
            "Tự động sinh JUnit 5 và Mockito test suite đạt độ bao phủ dòng lệnh >85%"
        ]
        comparison_notes = f"{clean_title} chuẩn hóa cấu trúc doanh nghiệp cho Java/Spring Boot, loại bỏ code boilerplates và cấu hình sai lệch."
        target_audience = "Java/Spring Developers & Enterprise Architects"

    # 18. Language: TypeScript
    elif lang == 'TypeScript' or any(k in text for k in ['typescript', 'pocock']):
        use_cases = [
            f"Làm chủ Type Gymnastics, Conditional Types và Generic Constraints phức tạp với {clean_title}",
            "Chuẩn hóa runtime validation với Zod/Valibot suy diễn trực tiếp ra TypeScript types",
            "Loại bỏ hoàn toàn kiểu 'any', bật cấu hình strict mode và tối ưu hóa thời gian biên dịch tsc"
        ]
        comparison_notes = f"Chấm dứt việc dùng 'as any' để chữa cháy; {clean_title} ép buộc lập trình viên và AI viết mã TypeScript an toàn kiểu 100%."
        target_audience = "TypeScript Enthusiasts & Fullstack Engineers"

    # 19. Public APIs & Tooling Discovery
    elif any(k in text for k in ['public-api', 'awesome', 'discovery', 'curated']):
        use_cases = [
            f"Tra cứu, xác thực và tích hợp các REST/GraphQL APIs công khai vào dự án với {clean_title}",
            "Tự động sinh code client SDK có rate-limiting và error retry với exponential backoff",
            "Khám phá các thư viện mã nguồn mở uy tín nhất theo từng danh mục công nghệ"
        ]
        comparison_notes = f"{clean_title} sàng lọc sẵn các API hoạt động ổn định, có authentication rõ ràng, giúp rút ngắn thời gian tích hợp dịch vụ bên thứ ba."
        target_audience = "Fullstack Developers & API Integrators"

    # 20. Contextual Fallback for Specific Repositories
    else:
        # Extract meaningful tokens from repository name
        name_parts = [p.capitalize() for p in re.split(r'[-_/]', clean_name) if p.lower() not in ['skill', 'skills', 'agent', 'claude', 'gpt']]
        topic_phrase = ' '.join(name_parts) if name_parts else clean_title
        
        use_cases = [
            f"Tự động hóa quy trình làm việc và chuẩn hóa các tác vụ liên quan đến {topic_phrase}",
            f"Tích hợp quy tắc kiểm định, phát hiện sớm lỗi biên và nâng cao độ ổn định cho {clean_title}",
            f"Nạp sẵn ngữ cảnh nghiệp vụ chuyên sâu vào Coding Agent, giảm thiểu 80% thao tác cấu hình lặp lại"
        ]
        comparison_notes = f"{clean_title} đóng vai trò như một cẩm nang chuyên gia nạp trực tiếp vào ngữ cảnh của AI, đảm bảo mọi đoạn mã sinh ra đều tuân thủ chặt chẽ tiêu chuẩn dự án."
        target_audience = f"{topic_phrase} Practitioners & Modern Developers"

    return use_cases[:3], comparison_notes, target_audience
