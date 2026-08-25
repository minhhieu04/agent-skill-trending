# 🚀 Agent Skill Trending & AI Solutions Platform (v2.0)

<div align="center">

![AgentSkills Banner](https://img.shields.io/badge/AgentSkills-v2.0_Enterprise-00C781?style=for-the-badge&logo=probot&logoColor=white)
<br/>

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=flat-square)](LICENSE)

<p align="center">
  <b>Nền tảng tự động thu thập, xếp hạng thông minh, so sánh trực quan và cá nhân hóa các AI Agent Skills, MCP Servers & Giải pháp Coding hàng đầu thế giới.</b>
  <br />
  <i>An automated intelligence platform that aggregates, analyzes, ranks, visually compares, and personalizes AI Agent skills, Model Context Protocol (MCP) servers, and coding workflows from global developer communities.</i>
</p>

[**🇻🇳 Tiếng Việt**](#-tiếng-việt) • [**🇬🇧 English**](#-english) • [**🏛️ Kiến Trúc**](#-kiến-trúc-hệ-thống--architecture) • [**📐 Thuật Toán Scoring**](#-thuật-toán-tính-điểm--scoring-algorithm) • [**⚡ Cài Đặt & Chạy**](#-hướng-dẫn-cài-đặt--quickstart)

---

</div>

<br/>

<a name="-tiếng-việt"></a>
## 🇻🇳 TIẾNG VIỆT

### 1. 💡 Vì Sao Dự Án Này Ra Đời? (The Vision)
Trong kỷ nguyên phát triển bùng nổ của AI, việc sử dụng AI Coding Assistants (**Cursor, Claude Code, Gemini CLI / Antigravity, Windsurf, Aider**) đã trở thành tiêu chuẩn. Tuy nhiên, lập trình viên thường xuyên đối mặt với 4 vấn đề lớn:
1. **Mất Ngữ Cảnh (Context Loss)**: Mỗi khi mở chat mới, bạn phải gõ lại hàng tá hướng dẫn về Clean Architecture, quy chuẩn dự án, cách cấu trúc file.
2. **AI Sinh Code Ảo (Hallucinations)**: AI dùng phiên bản thư viện cũ, import sai hoặc sinh code không đúng quy ước của team.
3. **Phân Mảnh Giải Pháp (Fragmented Ecosystem)**: Hàng nghìn Agent Skills, MCP Servers và `.cursorrules` xuất hiện rải rác trên GitHub, Reddit, Twitter nhưng không có nơi tổng hợp, xếp loại và đánh giá chất lượng code.
4. **Thiếu Cá Nhân Hóa (One-size-fits-all)**: Một skill tuyệt vời cho Python/FastAPI chưa chắc đã phù hợp với developer làm React/TypeScript hay Golang.

👉 **Agent Skill Trending v2.0** giải quyết triệt để các bài toán trên bằng cách xây dựng một **hệ thống Radar thông minh** tự động cào dữ liệu từ 4 nguồn cộng đồng, chấm điểm chất lượng, đối chiếu với tech stack cá nhân của bạn và cung cấp bài viết hướng dẫn chuyên sâu kèm Prompt mẫu copy 1-chạm.

---

### 2. ✨ Các Tính Năng Đột Phá (Core Features)

```mermaid
mindmap
  root((AgentSkills v2.0))
    Thu Thập Song Song
      GitHub Trending & Search
      Reddit Discussions
      HackerNews Algolia
      Awesome Curated Lists
    Engine Phân Tích ML
      Composite Trending Score
      Code Quality Heuristics
      Personalized Relevance Vector
      Log-scaled Star Velocity
    Trải Nghiệm Trực Quan
      Sơ Đồ Kiến Trúc Động
      Trước vs Sau Khi Áp Dụng
      Kịch Bản Thực Chiến & Prompt Copy
      So Sánh Đa Chiều 2-4 Skills
    Hạ Tầng Đa Nền Tảng
      Cursor IDE & Rules
      Claude Code CLI / Desktop
      Google Antigravity / Gemini CLI
      Windsurf & Aider
      PostgreSQL 16 + SQLite Fallback
      Song Ngữ i18n VI / EN + Dark/Light Mode
```

- 🚀 **Thu Thập Song Song Siêu Tốc (Parallel Non-blocking Ingestion)**: Chạy đồng thời các collector qua `asyncio.gather` có cơ chế `timeout=15s` và giao dịch database phân lập (isolated transactions), quét 250+ repo chỉ trong vài giây.
- 🎯 **Cá Nhân Hóa Riêng Cho Từng Developer (Personalized Relevance Matcher)**: Thuật toán so khớp vector đa chiều giữa sở thích của bạn (Ngôn ngữ, Runtimes, Chuyên mục, Tags) và metadata của Skill để đưa ra danh sách đề xuất chuẩn xác nhất.
- 📖 **Modal Chuyên Sâu Dạng Bài Viết Công Nghệ (Deep-Dive Tutorial Experience)**:
  - **Bài Viết Hướng Dẫn Chi Tiết**: Phân tích Vấn đề ➔ Giải pháp ➔ Quy trình 3 bước tích hợp.
  - **Kịch Bản & Prompt Mẫu**: Mỗi use case gồm tình huống cụ thể, **đoạn prompt chuẩn có nút sao chép**, code mẫu minh họa và mẹo chuyên gia (Pro Tips).
- ⚖️ **Bảng So Sánh Trực Quan (Side-by-Side Comparison Matrix)**: Đặt 2–4 công cụ cạnh nhau để so sánh đối tượng áp dụng (Target Audience), điểm mạnh cốt lõi và use case thực tế.
- 💻 **Hướng Dẫn Cài Đặt Đa IDE (Multi-Runtime Setup)**: Cung cấp sẵn file cấu hình và lệnh terminal 1-click cho **Cursor**, **Claude Code**, **Gemini CLI**, **Windsurf**, **Aider**.
- 🌓 **Giao Diện Sáng / Tối (Light & Dark Mode)**: Hỗ trợ chuyển đổi mượt mà với độ tương phản cao, tối ưu hiển thị trên mọi thiết bị.
- 🌐 **Giao Diện Song Ngữ Toàn Diện (i18n)**: Đổi ngôn ngữ tức thời giữa **Tiếng Việt 🇻🇳** và **English 🇬🇧**.
- 🛡️ **Lịch Sử Thu Thập & Audit Trail**: Theo dõi chi tiết từng đợt quét, tự động phục hồi các tiến trình bị gián đoạn (Auto-Recovery).

---

<br/>

<a name="-english"></a>
## 🇬🇧 ENGLISH

### 1. 💡 Project Overview & Problem Statement
With the rapid evolution of autonomous AI coding assistants (**Cursor, Claude Code, Gemini CLI, Windsurf, Aider**), developers increasingly rely on external procedural skills, Model Context Protocol (MCP) servers, and project-specific rule files. However, the ecosystem remains severely fragmented:
- **Scattered Solutions**: Thousands of community skills exist across GitHub, Reddit, and HackerNews with no central repository indexing their quality and velocity.
- **Context Overhead**: Developers waste substantial time rewriting prompts and establishing architectural guidelines for new chat sessions.
- **Relevance Mismatch**: Generic tools often do not align with a developer's specific programming language or IDE runtime.

👉 **Agent Skill Trending** is an automated platform that continuously discovers, evaluates, visualizes, and personalizes AI Agent skills, MCP tools, and workflow definitions for modern engineering teams.

---

### 2. 🌟 Key Capabilities
- **Multi-Source Parallel Scraping**: Concurrent data gathering via `asyncio.gather` from GitHub Search API, GitHub Trending, Reddit JSON API, HackerNews Algolia, and curated Awesome Lists.
- **Multi-Factor Scoring Engine**: Deterministic composite ranking calculated from Star Velocity (30%), Community Engagement (25%), Recency Exponential Decay (20%), Code Quality Signals (15%), and Fork Ratio (10%).
- **Dynamic Personalization**: Tailored feeds powered by multi-attribute relevance scoring against user-defined runtimes, languages, and interest tags.
- **Educational Deep-Dive Modal**: Each skill includes problem statements, **copyable prompt templates**, generated code snippets, execution mechanics, and expert pro tips.
- **Side-by-Side Visual Comparison**: Multi-column comparison matrix evaluating 2–4 tools simultaneously.
- **Multi-IDE Configuration Generator**: Pre-generated configurations and installation commands for **Cursor**, **Claude Code**, **Gemini CLI / Antigravity**, **Windsurf**, and **Aider**.
- **Full i18n & Theme Switching**: Instant localization (Vietnamese/English) and Dark/Light mode toggle.
- **Production PostgreSQL Architecture**: Backed by PostgreSQL 16 with zero-config local SQLite fallback.

---

<br/>

<a name="-kiến-trúc-hệ-thống--architecture"></a>
## 🏛️ KIẾN TRÚC HỆ THỐNG / SYSTEM ARCHITECTURE

```mermaid
flowchart TD
    subgraph External Sources ["🌐 Nguồn Dữ Liệu Cộng Đồng / External Sources"]
        GH["GitHub Search API & Trending Pages"]
        RD["Reddit Developer Subreddits (/r/AI_Agents, /r/LocalLLaMA)"]
        HN["HackerNews Algolia API (Stories & Comments)"]
        AW["Curated Awesome Lists (Markdown Parsers)"]
    end

    subgraph Collection Layer ["⚡ Tầng Thu Thập Song Song / Parallel Ingestion Layer"]
        COL["asyncio.gather Parallel Collector Manager (15s Hard Timeout)"]
        GH_COL["GitHubCollector"]
        RD_COL["RedditCollector"]
        HN_COL["HackerNewsCollector"]
        AW_COL["AwesomeListCollector"]
    end

    subgraph Processing Pipeline ["🧠 Tầng Xử Lý & Chấm Điểm / Processing Pipeline"]
        SC["Scorer: Log-Scale Velocity & Quality Signals"]
        CAT["Categorizer: Heuristic & Gemini AI Classification"]
        REL["RelevanceMatcher: Preference Vector Distance"]
        ATOM["Atomic Transaction Per-Item Database Committer"]
    end

    subgraph Storage Layer ["💾 Tầng Lưu Trữ & Bảo Mật / Storage & Security"]
        PG[("PostgreSQL 16 Container (Port 5433)")]
        SQLITE[("SQLite Fallback (agent_skills.db)")]
        AUTH["JWT Security & User Context Isolation"]
        AUDIT["Audit Trail & Ingestion Timeline"]
    end

    subgraph Application & Presentation ["💻 Tầng Ứng Dụng & Giao Diện / Application & UI"]
        API["FastAPI High-Performance REST API (Port 8899)"]
        FE["React 18 + Vite + Tailwind CSS + Lucide Icons (Port 3099)"]
    end

    GH --> GH_COL
    RD --> RD_COL
    HN --> HN_COL
    AW --> AW_COL

    GH_COL & RD_COL & HN_COL & AW_COL --> COL
    COL --> SC & CAT & REL
    SC & CAT & REL --> ATOM
    ATOM --> PG & SQLITE
    AUTH & AUDIT --> PG

    PG & SQLITE --> API
    API --> FE
```

---

<br/>

<a name="-thuật-toán-tính-điểm--scoring-algorithm"></a>
## 📐 THUẬT TOÁN TÍNH ĐIỂM / SCORING ALGORITHM

Hệ thống sử dụng mô hình toán học đa biến chuẩn mực theo **ML Best Practices**:

### 1. Trending Score Formula
Điểm Trending tổng hợp ($S_{\text{trending}} \in [0, 100]$) được tính bằng tổ hợp tuyến tính của 5 nhóm tín hiệu:

$$S_{\text{trending}} = 0.30 \cdot V_{\text{stars}} + 0.25 \cdot E_{\text{community}} + 0.20 \cdot D_{\text{recency}} + 0.15 \cdot Q_{\text{quality}} + 0.10 \cdot R_{\text{fork}}$$

Trong đó:
- **$V_{\text{stars}}$ (Star Velocity - Biến đổi Logarit)**: 
  $$V_{\text{stars}} = \min\left(100, \frac{\log_{10}(\text{stars} + 1)}{\log_{10}(50000)} \times 100\right)$$
  *(Giúp tránh hiện tượng các repo khổng lồ độc chiếm bảng xếp hạng và tạo cơ hội cho các skill mới nổi bật)*.
- **$E_{\text{community}}$ (Tương tác cộng đồng Reddit / HackerNews)**:
  $$E_{\text{community}} = \min(100, (\text{reddit\_score} \times 1.5) + (\text{hn\_score} \times 2.0))$$
- **$D_{\text{recency}}$ (Hàm suy giảm lũy thừa theo thời gian)**:
  $$D_{\text{recency}} = 100 \times \exp\left(-\frac{\Delta t_{\text{days}}}{45}\right)$$
- **$Q_{\text{quality}}$ (Điểm chất lượng mã nguồn)**:
  $$Q_{\text{quality}} = \text{base}(50) + \text{has\_readme}(15) + \text{has\_license}(10) + \text{has\_tests}(15) + \text{active\_commits}(10)$$
- **$R_{\text{fork}}$ (Tỷ lệ Fork / Đóng góp)**:
  $$R_{\text{fork}} = \min\left(100, \frac{\text{forks}}{\text{stars} + 1} \times 500\right)$$

---

### 2. Personalized Relevance Score Formula
Điểm phù hợp dành riêng cho từng User ($S_{\text{relevance}} \in [0, 100]$):

$$S_{\text{relevance}} = w_{\text{cat}} \cdot I(\text{category} \in \mathcal{C}_{\text{pref}}) + w_{\text{rt}} \cdot J(\mathcal{R}_{\text{skill}}, \mathcal{R}_{\text{pref}}) + w_{\text{lang}} \cdot I(\text{lang} \in \mathcal{L}_{\text{pref}}) + w_{\text{tags}} \cdot J(\mathcal{T}_{\text{skill}}, \mathcal{T}_{\text{pref}})$$

*(Trong đó $J(A, B) = \frac{|A \cap B|}{|A \cup B|}$ là hệ số tương đồng Jaccard giữa các tập nhãn).*

---

<br/>

<a name="-cấu-trúc-thư-mục--directory-structure"></a>
## 📁 CẤU TRÚC THƯ MỤC / DIRECTORY STRUCTURE

```text
agent-skill-trending/
├── backend/
│   ├── analyzer/                  # Thuật toán phân loại & tính điểm toán học
│   │   ├── __init__.py
│   │   ├── categorizer.py         # Heuristic & AI Categorization
│   │   ├── relevance.py           # Personalized Relevance Vector Matching
│   │   └── scorer.py              # Log-scaled Quality & Trending Scorer
│   ├── api/                       # REST API Endpoints (FastAPI Routers)
│   │   ├── __init__.py
│   │   ├── auth.py                # JWT Auth, Register, Login, Account Switcher
│   │   ├── collect.py             # Parallel Collector Trigger with 15s Timeout
│   │   ├── history.py             # Collection Runs Timeline & Auto-Recovery
│   │   ├── preferences.py         # User Tech Stack & Interest Persistence
│   │   └── skills.py              # Trending Feed, Filters, Search & Bookmarks
│   ├── collectors/                # Async Strategy Collectors
│   │   ├── __init__.py
│   │   ├── awesome_list_collector.py
│   │   ├── base.py
│   │   ├── github_collector.py    # Parallel Search & Trending Scraper
│   │   ├── hackernews_collector.py# Algolia HN API Collector
│   │   └── reddit_collector.py    # Reddit Subreddit JSON Collector
│   ├── middleware/                # Security & JWT Authentication Middleware
│   │   ├── __init__.py
│   │   └── auth.py
│   ├── models/                    # SQLAlchemy Database Models
│   │   ├── __init__.py
│   │   ├── audit_log.py           # User Action Audit Trail
│   │   ├── collection_run.py      # Ingestion Run History
│   │   ├── skill.py               # Composite Indexed Skill Entity
│   │   ├── source.py              # Data Source Health Entity
│   │   ├── user.py                # User Credentials & Role
│   │   └── user_preference.py     # Per-user Filter Settings
│   ├── scheduler/                 # APScheduler Background Automation
│   │   ├── __init__.py
│   │   └── collector_job.py
│   ├── services/                  # Clean Architecture Business Service Layer
│   │   ├── __init__.py
│   │   └── skill_service.py       # SQL-level Filtering & Scoring Operations
│   ├── tests/                     # Pytest Automated Test Suite (11/11 Passing)
│   │   ├── test_analyzer.py
│   │   ├── test_api.py
│   │   └── test_v2_features.py
│   ├── .env                       # API Credentials & Database Connection
│   ├── config.py                  # Pydantic Settings & Environment Parsing
│   ├── database.py                # PostgreSQL Engine with SQLite Fallback
│   ├── Dockerfile
│   ├── main.py                    # Application Entrypoint & Rich Seed Data
│   ├── pytest.ini
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                   # Typed API Client with JWT Interceptors
│   │   │   └── client.ts
│   │   ├── components/            # Reusable UI Components
│   │   │   ├── Navbar.tsx         # Brand, Tabs, Language & Theme Switchers
│   │   │   ├── ScoreBadge.tsx     # Color-coded Metric Badges
│   │   │   ├── SkillCard.tsx      # Adaptive Light/Dark Skill Card
│   │   │   ├── SkillDetailModal.tsx # Educational Tutorial & Prompt Copy Modal
│   │   │   ├── StatsHeader.tsx    # Live Metric Counters
│   │   │   └── TriggerCollectorModal.tsx
│   │   ├── context/               # Global React Context State
│   │   │   ├── AuthContext.tsx    # Multi-user Authentication State
│   │   │   ├── LanguageContext.tsx# Bilingual i18n Localization Context
│   │   │   ├── ThemeContext.tsx   # Light / Dark Mode Persistence
│   │   │   └── ToastContext.tsx   # Interactive Action Feedback
│   │   ├── i18n/                  # Translation Dictionaries
│   │   │   └── translations.ts    # Vietnamese & English Keys
│   │   ├── pages/                 # Full Page Views
│   │   │   ├── BookmarksPage.tsx  # User's Saved Skills Collection
│   │   │   ├── ExploreCategories.tsx # 9 Categorized Domain Cards
│   │   │   ├── HistoryPage.tsx    # Ingestion Timeline & Audit Trail
│   │   │   ├── LoginPage.tsx      # Quick Account Switcher & Auth
│   │   │   ├── PersonalizedFeed.tsx # For You Recommendation Feed
│   │   │   ├── PreferencesPage.tsx# Tech Stack & Filter Settings
│   │   │   ├── SkillCompare.tsx   # 2-4 Skills Side-by-Side Comparison
│   │   │   └── TrendingFeed.tsx   # Main Ranked Discovery Feed
│   │   ├── types/                 # TypeScript Data Contracts
│   │   │   └── index.ts
│   │   ├── App.tsx                # App Root with Provider Nesting & Hash Routing
│   │   ├── index.css              # Tailwind Base & Custom Scrollbar Rules
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts             # Vite Proxy to 127.0.0.1:8899
├── docker-compose.yml             # Full Production Stack (Postgres + Backend + Frontend)
├── start.sh                       # Unified One-Command Startup Script
└── README.md                      # Comprehensive Master Documentation
```

---

<br/>

<a name="-hướng-dẫn-cài-đặt--quickstart"></a>
## ⚡ HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY / QUICKSTART

### 1. Yêu Cầu Môi Trường (Prerequisites)
- **Node.js**: v18.0 trở lên & npm
- **Python**: v3.12 trở lên
- **Docker**: (Tùy chọn, nếu muốn chạy PostgreSQL 16)

---

### 2. Khởi Chạy Nhanh Bằng 1 Lệnh (Khuyến nghị / Recommended)
Chỉ cần mở terminal tại thư mục dự án và chạy:

```bash
./start.sh
```

Lệnh trên sẽ tự động:
1. Kích hoạt môi trường ảo Python và cài đặt thư viện cần thiết.
2. Khởi động **FastAPI Backend Server** tại: **[http://localhost:8899](http://localhost:8899)**
3. Khởi động **Vite React Frontend** tại: **[http://localhost:3099](http://localhost:3099)**
4. Tự động tắt toàn bộ các tiến trình con an toàn khi bạn bấm `Ctrl + C`.

---

### 3. Khởi Chạy Bằng Docker Compose (Kèm PostgreSQL 16)
Nếu muốn chạy full stack hoàn chỉnh trong container:

```bash
docker compose up --build -d
```

- **PostgreSQL 16 Container**: Port `5433:5432` (`agent_trending_pg`)
- **Backend Service**: Port `8899`
- **Frontend Service**: Port `3099`

---

### 4. Cấu Hình Biến Môi Trường (`backend/.env`)
File cấu hình mẫu đã được thiết lập sẵn trong `backend/.env`:

```env
# Database Connection (PostgreSQL Container on Port 5433)
DATABASE_URL=postgresql://agent_admin:agent_secure_2026@localhost:5433/agent_skills

# 1. GitHub Token (Miễn phí 5,000 requests/giờ)
# Lấy tại: https://github.com/settings/tokens
GITHUB_TOKEN=your_github_token_here

# 2. Google Gemini API Key (Miễn phí 1,500 requests/ngày)
# Lấy tại: https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here

# 3. Scheduler
COLLECTION_INTERVAL_HOURS=6
AUTO_SCHEDULE_ENABLED=true
```

---

<br/>

## 🧪 CHẠY KIỂM THỬ TỰ ĐỘNG / AUTOMATED TESTS

Toàn bộ backend được bao phủ bởi bộ kiểm thử tự động `pytest`:

```bash
# Chạy toàn bộ 11 Unit & Integration Tests
PYTHONPATH=backend backend/.venv/bin/pytest backend/tests -v
```

Kiểm tra biên dịch Frontend TypeScript:
```bash
npm --prefix frontend run build
```

---

<br/>

## 🌐 TÀI LIỆU REST API (SWAGGER DOCS)

Khi Backend đang chạy, truy cập tài liệu API tương tác tại:
- **Interactive Swagger UI**: [http://localhost:8899/docs](http://localhost:8899/docs)
- **ReDoc Documentation**: [http://localhost:8899/redoc](http://localhost:8899/redoc)

### Các Endpoint Chính:
| Phương thức | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/v1/skills/trending` | Lấy danh sách Top Trending Skills (có lọc Category, Runtime, Language, Sort) |
| `GET` | `/api/v1/skills/personalized` | Lấy danh sách Skills cá nhân hóa tính theo Relevance Score của User |
| `GET` | `/api/v1/skills/{id}` | Lấy chi tiết Skill, kịch bản thực chiến, sơ đồ và cấu hình IDE |
| `POST` | `/api/v1/skills/{id}/bookmark` | Bật / tắt lưu Skill vào bộ sưu tập cá nhân |
| `POST` | `/api/v1/collect/trigger` | Kích hoạt quét dữ liệu song song từ 4 nguồn |
| `GET` | `/api/v1/history/runs` | Xem lịch sử các đợt thu thập dữ liệu và báo cáo |
| `GET` | `/api/v1/history/audit-log` | Xem nhật ký kiểm toán hành động người dùng |
| `GET / PUT`| `/api/v1/preferences` | Đọc và cập nhật sở thích công nghệ của User |
| `POST` | `/api/v1/auth/login` | Đăng nhập tài khoản & nhận JWT Token |

---

<br/>

## 👥 TÀI KHOẢN TRẢI NGHIỆM MẪU (DEFAULT ACCOUNTS)

Hệ thống tích hợp sẵn tính năng **Chuyển Đổi Tài Khoản Nhanh (Quick Switcher)** ngay tại trang đăng nhập:

| Tên người dùng | Vai trò | Mật khẩu | Đặc quyền |
|---|---|---|---|
| **`hieu`** | **Admin Chính** | `123456` | Toàn quyền quét dữ liệu, quản trị và cấu hình sở thích |
| **`developer`** | **Member** | `123456` | Tùy biến bộ sưu tập và bộ lọc cá nhân riêng |

---

<br/>

## 📄 LICENSE
Dự án được phát hành theo giấy phép mã nguồn mở **[Apache License 2.0](LICENSE)**.
Mọi đóng góp từ cộng đồng (Issues, Pull Requests) đều được hoan nghênh nhiệt liệt!
