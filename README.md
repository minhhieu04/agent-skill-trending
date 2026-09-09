# 🚀 Agent Skill Trending & AI Solutions Platform (v3.5)

<div align="center">

![AgentSkills Banner](https://img.shields.io/badge/AgentSkills-v3.5_Enterprise-00C781?style=for-the-badge&logo=probot&logoColor=white)
<br/>

[![Live Demo](https://img.shields.io/badge/Live_Frontend-Vercel-black?style=flat-square&logo=vercel&logoColor=white)](https://agent-skill-trending.vercel.app)
[![API Server](https://img.shields.io/badge/API_Server-Render-46E3B7?style=flat-square&logo=render&logoColor=white)](https://gent-skill-trending-api.onrender.com)
[![Database](https://img.shields.io/badge/Database-Neon_PostgreSQL-00E599?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Remotion](https://img.shields.io/badge/Remotion-4.0-E11D48?style=flat-square&logo=react&logoColor=white)](https://remotion.dev)
[![Gemini](https://img.shields.io/badge/Google_Gemini-3.8_/_TTS_2.5-4285F4?style=flat-square&logo=google&logoColor=white)](https://aistudio.google.com/)
[![Tests](https://img.shields.io/badge/Pytest-71_Passed_(100%25)-00C781?style=flat-square&logo=pytest&logoColor=white)](backend/tests)
[![License: MIT OR Apache-2.0](https://img.shields.io/badge/License-MIT_or_Apache_2.0-blue.svg?style=flat-square)](LICENSE)

<p align="center">
  <b>Nền tảng Radar thông minh tự động thu thập, xếp hạng xu hướng, kiểm định an toàn AI, xuất cấu hình 1-chạm cho 6 IDE runtimes, phát thanh AI Audio Podcast song ngữ, sản xuất Remotion Video Walkthrough và đồng hành cùng AI Agent RAG.</b>
  <br />
  <i>An enterprise intelligence platform that aggregates, analyzes, audits AI safety, streams bilingual AI podcasts, renders Remotion video walkthroughs, and personalizes AI Agent skills, MCP servers, and multi-IDE configs from global developer communities.</i>
</p>

[**🌐 Live Demo**](#-live-demo--cloud-endpoints) • [**🇻🇳 Tiếng Việt**](#-tiếng-việt) • [**🇬🇧 English**](#-english) • [**🏛️ Kiến Trúc**](#-kiến-trúc-hệ-thống--architecture) • [**📐 Thuật Toán Scoring**](#-thuật-toán-tính-điểm--scoring-algorithm) • [**📂 Cấu Trúc Dự Án**](#-cấu-trúc-dự-án--project-structure) • [**⚡ Cài Đặt & Chạy**](#-hướng-dẫn-cài-đặt--quickstart)

---

</div>

<br/>

<a name="-live-demo--cloud-endpoints"></a>
## 🌐 LIVE DEMO & CLOUD ENDPOINTS

| Thành Phần | Địa Chỉ / Endpoint | Mô Tả |
| :--- | :--- | :--- |
| 🌐 **Frontend Web App** | [https://agent-skill-trending.vercel.app](https://agent-skill-trending.vercel.app) | Single Page Application triển khai trên Vercel CDN |
| 🔌 **Backend API** | [https://gent-skill-trending-api.onrender.com](https://gent-skill-trending-api.onrender.com) | FastAPI REST API chạy trên Render Cloud |
| 📚 **Swagger Docs** | [https://gent-skill-trending-api.onrender.com/docs](https://gent-skill-trending-api.onrender.com/docs) | Tài liệu API tương tác trực tiếp (Swagger UI & OpenAPI 3.0) |
| 🎙️ **AI Podcast Studio** | [/podcast](https://agent-skill-trending.vercel.app/podcast) | Bản tin xu hướng công nghệ hàng ngày & Audio Podcast song ngữ |
| 🎬 **Remotion Video Studio** | [/studio](https://agent-skill-trending.vercel.app/studio) | Dựng video walkthrough kỹ năng AI đa phân cảnh chuyên nghiệp |
| 🤖 **AI Agent RAG Companion** | [/agent-chat](https://agent-skill-trending.vercel.app/agent-chat) | Trợ lý AI đồng hành thông minh với bộ nhớ hội thoại bền vững |
| 🧭 **Adminer DB Web GUI** | `http://localhost:8088` *(Docker)* | Quản trị trực quan PostgreSQL 16 serverless và container |
| 🪐 **Matrix 01 Health View** | [https://gent-skill-trending-api.onrender.com/health/matrix](https://gent-skill-trending-api.onrender.com/health/matrix) | Trạng thái hệ thống qua ma trận nhị phân 01 Cyberpunk |
| 🗄️ **Serverless Database** | [Neon.tech](https://neon.tech) | PostgreSQL 16 Serverless Database trên Cloud |

---

<br/>

<a name="-tiếng-việt"></a>
## 🇻🇳 TIẾNG VIỆT

### 1. 💡 Vì Sao Dự Án Này Ra Đời? (The Vision)
Trong kỷ nguyên phát triển bùng nổ của AI, việc sử dụng AI Coding Assistants (**Google Antigravity, OpenAI Codex, Cursor, Claude Code, Windsurf, Aider**) đã trở thành tiêu chuẩn của kỹ sư phần mềm. Tuy nhiên, cộng đồng lập trình viên thường xuyên đối mặt với 5 bài toán nan giải:
1. **Mất Ngữ Cảnh (Context Loss)**: Mỗi khi mở phiên chat mới, bạn phải gõ lại hàng tá hướng dẫn về Clean Architecture, quy chuẩn dự án, cách cấu trúc file.
2. **AI Sinh Code Ảo (Hallucinations)**: AI dùng phiên bản thư viện lỗi thời, import sai hoặc vi phạm kiến trúc bảo mật của team.
3. **Phân Mảnh Giải Pháp (Fragmented Ecosystem)**: Hàng nghìn Agent Skills, MCP Servers và quy tắc cấu hình xuất hiện rải rác trên GitHub, Reddit, HackerNews nhưng không có nơi tổng hợp, kiểm định an toàn và xếp hạng chất lượng.
4. **Thiếu Cá Nhân Hóa (One-size-fits-all)**: Một skill tuyệt vời cho Python/FastAPI chưa chắc đã phù hợp với developer làm React/TypeScript hay Golang Microservices.
5. **Rào Cản Tiếp Cận & Học Hỏi (Steep Learning Curve)**: Các tài liệu kỹ năng dạng văn bản dài dòng, thiếu video minh họa trực quan cách hoạt động và thiếu kênh tin tức âm thanh (podcast) tóm tắt nhanh mỗi sáng.

👉 **Agent Skill Trending v3.5** giải quyết triệt để các bài toán trên bằng cách xây dựng một **hệ sinh thái Radar & AI Media thông minh**: tự động cào dữ liệu song song từ cộng đồng, chấm điểm chất lượng đa yếu tố, quét bảo mật AI guardrails, phát thanh Audio Podcast tin tức hàng ngày bằng Gemini TTS, dựng video giới thiệu chuyển động chuyên nghiệp bằng Remotion và đồng hành giải đáp cùng trợ lý AI Agent RAG.

---

### 2. ✨ Các Tính Năng Đột Phá (Core Features)

```mermaid
mindmap
  root((AgentSkills v3.5))
    Thu Thập Đa Nguồn
      GitHub Trending & Search
      Reddit r/AI_Agents & LocalLLaMA
      HackerNews Algolia API
      Curated Awesome Lists
    Engine Phân Tích & Bảo Mật
      Composite Trending Score
      Personalized Relevance Vector
      AI Security Guardrail Scanner
      Log-scaled Star Velocity
    AI Media & Trợ Lý RAG
      Daily Digest & Podcast Studio
      Google AI Studio Gemini 2.5 TTS
      Remotion Video Blog Studio
      AI Agent Chat RAG Memory
    Xuất Cấu Hình & Tương Tác
      1-Click 6 IDE Runtimes Exporter
      Google Antigravity & Codex Specs
      Interactive Prompt Simulator
      Image-to-Binary Matrix 01
    Hạ Tầng & Giao Diện
      PostgreSQL 16 + Neon Serverless
      Adminer DB Web GUI Port 8088
      Neumorphic Soft UI & 3D Physics
      View Transitions API Dark Light
```

- 🎙️ **AI Daily Digest & Tech Podcast Studio (Bản Tin Âm Thanh Hàng Ngày)**:
  - Tự động thu thập, phân tích và tổng hợp các chuyển động công nghệ nóng nhất trong ngày từ GitHub, Reddit và HackerNews bằng mô hình **Gemini 3.8 / 3.9 Flash**.
  - Tự động sản xuất chương trình Podcast song ngữ (Việt - Anh) với giọng đọc AI tự nhiên từ **Google AI Studio Gemini 2.5 Flash TTS** (hỗ trợ các giọng đọc đa dạng: Aoede, Puck, Charon, Fenrir, Kore...).
  - Đóng gói âm thanh chuẩn WAV lossless, bộ phát Audio Player Deck thời gian thực với điều hướng ngày trực quan, nút kích hoạt cào dữ liệu tức thì và dịch thuật kịch bản 1-chạm.
  - Lập lịch phát thanh tự động hai lần mỗi ngày vào buổi sáng và buổi trưa thông qua APScheduler CronTrigger.

- 🎬 **Remotion Video Blog Studio (Dựng Video Walkthrough AI Chuyên Nghiệp)**:
  - Studio dựng video chuyển động tự động bằng framework **Remotion** (React-based video rendering engine).
  - Tự động phân tích README/GitHub và dựng video giới thiệu đa phân cảnh: Intro Scene, Feature Grid, Terminal Code Showcase, System Architecture, Comparison Scene, Outro Scene.
  - Đồng bộ hóa giọng đọc thuyết minh AI chính xác đến từng khung hình kèm phụ đề Karaoke Subtitles, hiệu ứng chuyển động ảnh mượt mà (Ken Burns) và hạt bụi chuyển động không gian.
  - Xuất file MP4 độ phân giải cao sẵn sàng đăng tải lên YouTube Shorts, TikTok, LinkedIn, Twitter/X.

- 🤖 **AI Agent Companion & Semantic Chat (Trợ Lý RAG Thông Minh)**:
  - Trợ lý AI đồng hành thông minh hỗ trợ 2 chế độ hiển thị: Ngăn kéo nổi (Floating Drawer) trên mọi trang và Trang làm việc tập trung chuyên sâu (`/agent-chat`).
  - Cơ chế **RAG (Retrieval-Augmented Generation)** kết hợp phân tích tương đồng ngữ nghĩa (Semantic Relevance Score) và ngưỡng lọc an toàn, ngăn chặn hiện tượng sinh code ngoài lề.
  - Gợi ý câu hỏi ngữ cảnh thông minh (Context-Aware Prompts) dựa trên kỹ năng người dùng đang xem hoặc phân tích so sánh kỹ thuật.
  - Lưu trữ lịch sử hội thoại bền vững (Database Persistence) trong PostgreSQL, tích hợp bảo mật tài khoản người dùng JWT.

- 🌐 **AI README Translator & Smart Markdown Engine**:
  - Trình xem README trực tiếp từ GitHub tích hợp tính năng dịch thuật AI thông minh 1-Click sang Tiếng Việt bằng Gemini/Ollama.
  - Cơ chế chia nhỏ thông minh (Chunking) kèm bộ nhớ đệm nâng cấp tự động (Cache upgrade) xử lý trơn tru các tài liệu dài mà không vượt giới hạn token.
  - Sử dụng native DOMParser an toàn, hỗ trợ đầy đủ bảng biểu HTML thô, huy hiệu SVG và hình ảnh phức tạp.

- 🎨 **Neumorphic Soft UI & Motion Design System**:
  - Ngôn ngữ thiết kế Neumorphism / Soft UI xúc giác hiện đại với hiệu ứng vật lý lò xo 3D (3D spring physics animations).
  - Trình chọn tùy biến chuyên dụng NeuSelect dropdown, xử lý triệt để hiện tượng cắt bóng (shadow clipping) và tràn viền.
  - Chuyển đổi giao diện Dark / Light mode tức thì bằng native **View Transitions API**, loại bỏ triệt để hiện tượng nhấp nháy hoặc race condition.
  - Tương thích đáp ứng (responsive) mượt mà trên cả 3 phân khúc thiết bị: Desktop (bố cục 3 cột / 2 cột thoáng đãng), Tablet (ngăn kéo Overlay Drawer tiện lợi) và Mobile.

- 🎛️ **Quản Trị Cơ Sở Dữ Liệu Tích Hợp (Adminer Web GUI)**:
  - Docker Compose tích hợp sẵn dịch vụ Adminer Web trên cổng **8088** giúp kỹ sư khám phá, truy vấn SQL và quản lý dữ liệu PostgreSQL 16 trực quan chỉ với 1 cú click.

- 🪐 **Hỗ Trợ Toàn Diện Google Antigravity & OpenAI Codex**:
  - Chuẩn hóa cấu trúc `.gemini/config/skills/<slug>/SKILL.md` với đầy đủ YAML frontmatter, quy trình Subagents và Planning Mode.
  - Hỗ trợ `.github/copilot-instructions.md` với các ràng buộc kiểu dữ liệu và kiểm thử tự động.

- 📦 **1-Click Multi-IDE Exporter**: Cung cấp sẵn mã nguồn, nút sao chép, tải file `.md / .mdc / .yml` và lệnh terminal CLI cài đặt trực tiếp cho 6 nền tảng: **Google Antigravity**, **OpenAI Codex**, **Cursor Rules**, **Claude Code**, **Windsurf**, **Aider**.

- 🛡️ **AI Security Guardrail Scanner**: Quét phân tích AST & Heuristics phát hiện rủi ro tiêm lệnh shell injection, lộ tokens/keys và phân quyền sandbox cho từng Agent Skill.

- 🧩 **Tech Stack Starter Bundles**: 4 gói kỹ năng cài đặt nhanh cho Golang Microservices, Next.js 15 App Router, UI/UX Design System và Antigravity AI Stack.

- 🖼️ **Image-to-Binary Matrix 01 Generator**: Bộ công cụ biến bất kỳ bức ảnh nào (chân dung, logo, meme) thành ma trận chuỗi nhị phân 01 hoặc Matrix Katakana thời gian thực, xử lý 100% trên trình duyệt (Client Privacy) với khả năng xuất Web HTML phát sáng.

- ⚡ **Interactive Prompt Simulator**: Thử nghiệm và so sánh trực quan đoạn code trước vs sau khi nạp Rules với chỉ số thời gian phản hồi (latency ms) và danh sách quy tắc được áp dụng.

- 🚀 **Thu Thập Song Song Siêu Tốc (Parallel Non-blocking Ingestion)**: Chạy đồng thời các collector qua `asyncio.gather` có cơ chế `timeout=15s` và giao dịch database phân lập.

---

<br/>

<a name="-english"></a>
## 🇬🇧 ENGLISH

### 1. 💡 Project Overview & Problem Statement
With the explosive growth of autonomous AI coding assistants (**Google Antigravity, OpenAI Codex, Cursor, Claude Code, Windsurf, Aider**), developers increasingly depend on external skills, Model Context Protocol (MCP) servers, and project-specific rule files. However, software engineering teams still face 5 fundamental challenges:
1. **Context Loss**: Developers waste substantial time repeating architectural instructions, clean code rules, and formatting specs for every new chat.
2. **AI Hallucinations**: Models rely on outdated APIs, suggest non-existent packages, or breach repository security practices.
3. **Fragmented Ecosystem**: Thousands of community skills exist across GitHub, Reddit, and HackerNews without a unified registry evaluating their safety, maintainability, and growth velocity.
4. **Lack of Personalization**: One-size-fits-all prompts fail to adapt to specialized tech stacks (e.g., Go Microservices vs. Next.js 15 App Router).
5. **High Onboarding Friction**: Long textual READMEs lack interactive walkthroughs, automated audio digests, or video demonstrations of procedural skills in action.

👉 **Agent Skill Trending v3.5** delivers an **end-to-end AI Intelligence & Media Ecosystem**: continuously collecting community trends, auditing AI security, broadcasting daily bilingual podcasts via Gemini TTS, rendering Remotion walkthrough videos, and providing a persistent RAG companion assistant.

---

### 2. 🌟 Key Capabilities
- 🎙️ **AI Daily Digest & Tech Podcast Studio**:
  - Automated daily trend aggregation across GitHub, Reddit, and HackerNews powered by **Gemini 3.8 / 3.9 Flash**.
  - Bilingual (Vietnamese - English) podcast synthesis using **Google AI Studio Gemini 2.5 Flash TTS** with realistic voice personas (Aoede, Puck, Charon, Fenrir, Kore...).
  - Real-time Audio Player Deck with date navigation, instant manual ingestion trigger, and one-click script translation.
  - Automated morning and midday scheduled runs via APScheduler CronTrigger.

- 🎬 **Remotion Video Blog Studio**:
  - Professional code walkthrough video rendering engine powered by **Remotion** (React-based video framework).
  - Automated multi-scene storyboard generation: Intro, Feature Grid, Terminal Execution, System Architecture, Comparison, and Outro.
  - Pixel-perfect frame-accurate voiceover sync with Karaoke Subtitles, smooth Ken Burns image panning, and ambient motion particles.
  - High-resolution MP4 rendering optimized for YouTube Shorts, TikTok, LinkedIn, and X/Twitter.

- 🤖 **AI Agent Companion & Semantic Chat (RAG Assistant)**:
  - Persistent AI engineering assistant available as both an interactive full-screen workspace (`/agent-chat`) and an ambient Floating Drawer across all views.
  - **RAG (Retrieval-Augmented Generation)** with semantic vector relevance scoring and guardrail safety checks to eliminate hallucinations.
  - Context-aware prompt suggestions reflecting active skills, comparative benchmarks, or architectural blueprints.
  - Full PostgreSQL database persistence for chat sessions and message histories with JWT user authentication.

- 🌐 **AI README Translator & Smart Markdown Engine**:
  - In-app GitHub README viewer with 1-click bilingual translation powered by Gemini and Ollama fallback.
  - Token-safe chunking and automatic translation cache upgrading for large documentation files.
  - Safe native DOMParser rendering raw HTML tables, SVG tech badges, and nested images.

- 🎨 **Neumorphic Soft UI & Motion Design System**:
  - Modern Neumorphic / Soft UI tactile aesthetics with realistic 3D spring physics animations.
  - Custom NeuSelect dropdowns preventing layout shifts and shadow clipping.
  - Instant zero-lag Dark / Light mode switching powered by the native **View Transitions API**.
  - Seamless responsive design optimized across Desktop (3-column layout), Tablet (overlay drawer), and Mobile.

- 🎛️ **Adminer Database Web Management**:
  - Pre-configured Adminer container on port **8088** for visual PostgreSQL 16 database inspection, table browsing, and custom SQL queries.

- 🪐 **First-Class Google Antigravity & OpenAI Codex Support**: Complete schema compliance for Antigravity `.gemini/config/skills/` (YAML frontmatter, Subagent workflows, Planning Mode) and Codex `.github/copilot-instructions.md`.

- 📦 **1-Click Multi-IDE Exporter**: Instant download, clipboard copy, and CLI curl install commands for 6 major AI runtimes (**Google Antigravity, OpenAI Codex, Cursor Rules, Claude Code, Windsurf, Aider**).

- 🛡️ **AI Security Guardrail Scanner**: AST & pattern heuristics auditing prompt injection, shell command risks, and API key exposure, grading skills from *Verified Safe (95+)* to *Caution*.

- 🧩 **Tech Stack Starter Bundles**: Curated packs for Go Microservices, Next.js 15 UI/UX, Multi-Agent MCP setups, and Antigravity AI Stack.

- 🖼️ **Interactive Image-to-Binary Matrix 01 Generator**: Real-time browser-based Canvas engine turning photos into binary strings and glowing Matrix HTML pages with 100% client-side privacy.

- ⚡ **Interactive Prompt Playground**: Live side-by-side simulator comparing raw unconstrained AI code vs skill-enforced code with latency metrics.

- 🚀 **Parallel Non-blocking Ingestion**: High-throughput parallel ingestion via `asyncio.gather` with 15-second hard timeouts and transaction isolation.

---

<br/>

<a name="-kiến-trúc-hệ-thống--architecture"></a>
## 🏛️ KIẾN TRÚC HỆ THỐNG / SYSTEM ARCHITECTURE

```mermaid
flowchart TD
    subgraph External Sources ["🌐 Nguồn Dữ Liệu Cộng Đồng / External Sources"]
        GH["GitHub Search API & Trending Repos"]
        RD["Reddit Developer Subreddits (/r/AI_Agents, /r/LocalLLaMA)"]
        HN["HackerNews Algolia API (Stories & Comments)"]
        AW["Curated Awesome Lists (Markdown Parsers)"]
    end

    subgraph Collection & Scheduler ["⚡ Tầng Thu Thập & Lập Lịch / Ingestion & Scheduling"]
        COL["asyncio.gather Parallel Collector Manager (15s Hard Timeout)"]
        SCHED["APScheduler CronTrigger (Morning & Midday Auto-Run)"]
    end

    subgraph Intelligence & Media Engines ["🧠 AI Intelligence & Media Engines"]
        SC["Scorer: Log-Scale Velocity & Quality Signals"]
        SEC["Security Scanner: AST & Permission Guardrails"]
        CAT["Categorizer: Multi-tier Gemini 3.9/3.8 Flash Cascade"]
        TTS["Podcast Engine: Google AI Studio Gemini 2.5 Flash TTS (WAV Lossless)"]
        REMOTION["Video Studio: Remotion React Multi-Scene MP4 Engine"]
        RAG["Agent Chat Service: Vector Relevance & Context-Aware Memory"]
        EXP["Multi-IDE Exporter: Antigravity, Codex, Cursor, Claude, Windsurf, Aider"]
    end

    subgraph Storage & Management ["💾 Tầng Lưu Trữ & Quản Trị / Storage & Administration"]
        NEON[("Neon.tech PostgreSQL Serverless")]
        PG_LOCAL[("PostgreSQL 16 Container (Port 5433)")]
        SQLITE[("SQLite Local Fallback")]
        ADMINER["Adminer Database Web GUI (Port 8088)"]
        AUTH["JWT Security & Session Persistence"]
    end

    subgraph Application & Presentation ["💻 Tầng Ứng Dụng & Giao Diện / Application & UI"]
        FASTAPI["FastAPI Backend Server (Port 8899)"]
        VERCEL["Vercel CDN / React 18 SPA (Port 3099)"]
        NEU_UI["Neumorphic Soft UI & View Transitions API"]
        AUDIO_DECK["Audio Player Deck & Real-time Timeline"]
        AGENT_DRAWER["AI Agent Companion Drawer & Chat Workspace"]
        MATRIX_CANVAS["Canvas Image-to-Binary Matrix 01 Generator"]
        PLAYGROUND["Interactive Prompt Playground"]
    end

    GH --> COL
    RD --> COL
    HN --> COL
    AW --> COL
    SCHED --> COL

    COL --> SC
    SC --> SEC
    SEC --> CAT
    CAT --> EXP

    CAT --> TTS
    CAT --> REMOTION
    CAT --> RAG

    EXP --> NEON
    EXP --> PG_LOCAL
    EXP --> SQLITE
    ADMINER -.->|Manage DB| PG_LOCAL
    ADMINER -.->|Inspect| NEON

    NEON --> FASTAPI
    PG_LOCAL --> FASTAPI
    SQLITE --> FASTAPI

    FASTAPI --> VERCEL
    VERCEL --> NEU_UI
    NEU_UI --> AUDIO_DECK
    NEU_UI --> AGENT_DRAWER
    NEU_UI --> MATRIX_CANVAS
    NEU_UI --> PLAYGROUND
```

---

<br/>

<a name="-thuật-toán-tính-điểm--scoring-algorithm"></a>
## 📐 THUẬT TOÁN TÍNH ĐIỂM / SCORING ALGORITHM

Hệ thống sử dụng công thức tính điểm hỗn hợp nhiều trọng số (Multi-factor Weighted Scoring Model):

$$\text{TrendingScore} = 0.30 \cdot S_v + 0.25 \cdot E_c + 0.20 \cdot R_t + 0.15 \cdot Q_s + 0.10 \cdot F_r$$

Trong đó:
1. **$S_v$ (Star Velocity - Tốc độ tăng trưởng)**: $\min\left(100, \frac{\text{Stars}}{\text{DaysActive} + 1} \times 15\right)$
2. **$E_c$ (Community Engagement - Thảo luận cộng đồng)**: Tính từ số bình luận, upvotes và lượt đề cập trên Reddit, HackerNews.
3. **$R_t$ (Recency Decay - Độ tươi mới)**: Phân rã mũ $e^{-\lambda \cdot t}$ theo số ngày kể từ commit cuối.
4. **$Q_s$ (Quality Signals - Tín hiệu chất lượng)**: Đánh giá README chi tiết, hướng dẫn cài đặt, license, bài kiểm thử.
5. **$F_r$ (Fork Ratio - Tỷ lệ nhân bản)**: Đánh giá độ tin cậy thực tế thông qua $\frac{\text{Forks}}{\text{Stars}}$.

---

<br/>

<a name="-cấu-trúc-dự-án--project-structure"></a>
## 📂 CẤU TRÚC DỰ ÁN / PROJECT STRUCTURE

```text
agent-skill-trending/
├── backend/
│   ├── analyzer/                  # Thuật toán tính điểm, phân loại và độ tương quan
│   │   ├── categorizer.py         # Phân loại kỹ năng & Gemini model cascade
│   │   ├── relevance.py           # Tính khoảng cách vector sở thích lập trình viên
│   │   ├── scorer.py              # Công thức Multi-Factor Trending Score
│   │   └── skill_enricher.py      # Bổ sung siêu dữ liệu & phân tích AST
│   ├── api/                       # RESTful API Endpoints (FastAPI Routers)
│   │   ├── agent_chat.py          # AI Agent Companion & persistent chat sessions
│   │   ├── daily_digest.py        # AI Daily Digest & Audio Podcast synthesis
│   │   ├── studio.py              # Remotion video studio & storyboard generation
│   │   ├── skills.py              # Feed, filter, category, export 1-click
│   │   ├── auth.py                # JWT Authentication & user management
│   │   └── playground.py          # Prompt rules simulator & benchmark
│   ├── collectors/                # Parallel async collectors (asyncio.gather)
│   │   ├── github_collector.py    # GitHub Search API & Trending scraping
│   │   ├── reddit_collector.py    # Reddit API (/r/AI_Agents, /r/LocalLLaMA)
│   │   ├── hackernews_collector.py# HackerNews Algolia API
│   │   └── awesome_list_collector.py # Markdown lists parser
│   ├── models/                    # SQLAlchemy Database ORM Models
│   │   ├── skill.py / user.py     # Kỹ năng AI, Tài khoản người dùng
│   │   ├── daily_digest.py        # Bản tin hàng ngày & podcast metadata
│   │   └── agent_chat.py          # ChatSession & ChatMessage models
│   ├── scheduler/                 # APScheduler tự động hóa tác vụ ngầm
│   │   └── jobs.py                # CronTrigger sáng & trưa hàng ngày
│   ├── services/                  # Business logic services
│   │   ├── tts_service.py         # Google AI Studio Gemini 2.5 Flash TTS (WAV)
│   │   ├── blog_video_service.py  # Remotion scene rendering & narration sync
│   │   ├── agent_chat_service.py  # RAG semantic vector search & context injection
│   │   └── daily_digest_service.py# AI news summarizer & audio generation
│   └── tests/                     # 71 Automated Pytest Suites (100% Passed)
├── frontend/
│   ├── src/
│   │   ├── components/            # Neumorphic UI, NeuSelect, AudioDeck, Drawer
│   │   ├── compositions/          # Remotion Video Engine (Scenes, Subtitles, Particles)
│   │   ├── context/               # View Transitions Theme, Auth, i18n, Toast
│   │   └── pages/
│   │       ├── DailyPodcastPage.tsx   # AI Daily Digest & Audio Podcast Studio
│   │       ├── VideoBlogStudio.tsx    # Remotion Video Walkthrough Studio
│   │       ├── AgentChatPage.tsx      # Full-page AI Companion Workspace
│   │       ├── TrendingFeed.tsx       # Khám phá kỹ năng & radar xu hướng
│   │       ├── BundlesPage.tsx        # Tech Stack Starter Bundles
│   │       └── PlaygroundPage.tsx     # Prompt Simulator & Matrix 01 Generator
│   ├── Dockerfile                 # Multi-stage Nginx production container
│   └── package.json               # React 18, Vite 5, Remotion 4.0, Tailwind CSS
├── docker-compose.yml             # Fullstack Orchestration (PostgreSQL 16, Adminer, App)
└── deploy.sh                      # Kịch bản triển khai tự động 1-chạm
```

---

<br/>

<a name="-hướng-dẫn-cài-đặt--quickstart"></a>
## ⚡ HƯỚNG DẪN CÀI ĐẶT & CHẠY / QUICKSTART

### 1. Cách 1: Chạy Tự Động 1-Click bằng Docker Compose (Khuyên dùng)

```bash
# Clone dự án
git clone https://github.com/minhhieu04/agent-skill-trending.git
cd agent-skill-trending

# Chạy deploy script tự động
chmod +x deploy.sh
./deploy.sh
```

- 🌐 **Frontend UI**: [http://localhost:3099](http://localhost:3099)
- 🔌 **Backend API**: [http://localhost:8899](http://localhost:8899)
- 📚 **Swagger Docs**: [http://localhost:8899/docs](http://localhost:8899/docs)
- 🪐 **Matrix View**: [http://localhost:8899/health/matrix](http://localhost:8899/health/matrix)
- 🗄️ **PostgreSQL**: `localhost:5433` (user: `agent_admin`, db: `agent_skills`)
- 🧭 **Adminer DB Web**: [http://localhost:8088](http://localhost:8088) *(Hệ thống: PostgreSQL, Server: `db`, User: `agent_admin`, Password: `agent_secure_2026`, Database: `agent_skills`)*

---

### 2. Cách 2: Chạy Thủ Công cho Lập Trình Viên (Local Development)

#### Backend (Python 3.12+):
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Khởi động Backend server
uvicorn main:app --host 0.0.0.0 --port 8899 --reload
```

#### Frontend (React + Vite):
```bash
cd frontend
npm install
npm run dev
```

---

### 3. Cấu Hình Biến Môi Trường (`.env`)

```env
# Database Connection (Neon PostgreSQL hoặc PostgreSQL cục bộ)
DATABASE_URL=postgresql://neondb_owner:***@ep-***.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Security & CORS
SECRET_KEY=your_random_secret_key_here_change_in_production
CORS_ORIGINS=*

# API Keys (Tùy chọn nâng cao)
GITHUB_TOKEN=your_github_token_here
GEMINI_API_KEY=your_gemini_api_key_here
REDDIT_CLIENT_ID=your_reddit_client_id_here
REDDIT_CLIENT_SECRET=your_reddit_client_secret_here
OLLAMA_HOST=http://localhost:11434

# Scheduler
COLLECTION_INTERVAL_HOURS=6
AUTO_SCHEDULE_ENABLED=true
```

---

<br/>

## 🧪 KIỂM THỬ TỰ ĐỘNG / AUTOMATED TESTS

Toàn bộ hệ thống Backend được bao phủ bởi **71 bài kiểm thử tự động (100% Passed)** với `pytest`:

| Bộ Kiểm Thử (Test Suite) | Số Tests | Nội Dung Xác Minh |
| :--- | :---: | :--- |
| `tests/test_agent_chat.py` | 11 | RAG semantic retrieval, prompt context injection, DB persistence, session CRUD |
| `tests/test_daily_digest.py` | 8 | Tổng hợp tin tức hàng ngày, Gemini TTS voice synthesis, audio streaming |
| `tests/test_studio.py` | 8 | Storyboard video generation, phân cảnh code/architecture, đồng bộ voiceover |
| `tests/test_readme_service.py` | 6 | Cào README từ GitHub, dịch thuật AI (Gemini/Ollama), chunking & cache |
| `tests/test_learning_track.py` | 4 | Gợi ý lộ trình học tập kỹ năng AI cá nhân hóa theo vai trò kỹ sư |
| `tests/test_analyzer.py` | 10 | Công thức tính điểm Multi-factor Scorer, phân loại heuristic & relevance |
| `tests/test_api.py` | 12 | Endpoints kỹ năng, bộ lọc đa chiều, bookmarks, thu thập dữ liệu song song |
| `tests/test_v2_features.py` | 6 | Xác thực JWT, phân quyền tài khoản, lịch sử collector, audit logs |
| `tests/test_v3_features.py` | 6 | Xuất 6 runtimes IDE, kiểm định bảo mật AST guardrails, starter bundles |
| **TỔNG CỘNG** | **71 Passed** | **Tỷ lệ thành công: 100% (~3 phút)** |

```bash
# Chạy toàn bộ 71 bài kiểm thử
PYTHONPATH=backend backend/.venv/bin/pytest backend/tests -v --tb=short

# Hoặc chạy kiểm thử nhanh theo từng phân hệ
PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/test_daily_digest.py -v
PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/test_agent_chat.py -v
PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/test_studio.py -v
```

---

<br/>

## 📜 GIẤY PHÉP / LICENSE

Dự án này được cấp phép kép (**Dual-Licensed**) theo một trong hai giấy phép tùy chọn của người sử dụng (tương tự chuẩn của hệ sinh thái Rust/WebAssembly):

* **[MIT License](LICENSE-MIT)**: Cực kỳ thông thoáng, cho phép mọi người tự do sử dụng, chỉnh sửa và đóng gói thương mại.
* **[Apache License 2.0](LICENSE-APACHE)**: Bổ sung điều khoản bảo vệ quyền sở hữu trí tuệ, bằng sáng chế (Patent Grant) và thương hiệu tác giả.

Chi tiết xem tại file **[LICENSE](LICENSE)**.

Copyright (c) 2026 **Minh Hieu Tran (minhhieu04)**.
