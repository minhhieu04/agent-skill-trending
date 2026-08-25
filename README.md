# Agent Skill Trending (2026) 🚀

Nền tảng tự động **tổng hợp, phân tích, xếp hạng và đề xuất** các AI Agent Skills, MCP Servers, và giải pháp AI coding hàng đầu từ cộng đồng (GitHub, Reddit, HackerNews, Awesome Lists).

---

## 🌟 Tính Năng Nổi Bật

1. **Thu thập dữ liệu đa nguồn (Multi-source Collectors)**:
   - **GitHub Trending & Search API**: Quét các repository về Agent Skills, MCP Servers, `.cursorrules`, `SKILL.md`, v.v.
   - **Reddit Curation**: Quét các thảo luận và repo được đánh giá cao trên `r/AI_Agents`, `r/LocalLLaMA`, `r/ChatGPTCoding`.
   - **HackerNews Signal**: Trích xuất các stories và công cụ AI được quan tâm nhiều trên HN.
   - **Curated Awesome Lists**: Tự động parse các danh mục chuẩn như `VoltAgent/awesome-agent-skills`, `anthropics/skills`.

2. **Hệ thống chấm điểm đa chiều (Multi-factor Scoring Engine)**:
   - **Trending Score**: Tính toán dựa trên tốc độ tăng trưởng sao (star velocity), thảo luận cộng đồng (Reddit/HN mentions), độ mới (recency) và tỷ lệ fork.
   - **Quality Score**: Đánh giá sức khỏe mã nguồn, tài liệu README, license hợp lệ, và tỷ lệ issues.
   - **Relevance Score (Cá nhân hóa cho Hiếu)**: Đối chiếu với sở thích công nghệ (chuyên mục ưu tiên, ngôn ngữ lập trình, runtimes sử dụng như Cursor, Claude Code, Gemini CLI, Aider).

3. **Giao diện người dùng hiện đại (React + Vite + TailwindCSS)**:
   - **Trending Feed**: Xem danh sách các skills hot nhất với bộ lọc chuyên mục, runtime, ngôn ngữ.
   - **Dành Cho Hiếu (Personalized Feed)**: Tab gợi ý thông minh dựa trên preferences cá nhân.
   - **Khám Phá Chuyên Mục**: Phân loại theo 9 nhóm năng lực (Coding Agents, MCP Servers, Skill Files, Workflow Automation, Local LLMs...).
   - **Đánh dấu (Bookmarks)**: Lưu trữ các skill ưng ý.
   - **Cài đặt & Hướng dẫn một chạm**: Cung cấp sẵn lệnh npx / git / curl để cài đặt vào Claude Code, Cursor hoặc Antigravity.

4. **Tự động hóa định kỳ (Scheduled Background Worker)**:
   - Tích hợp `APScheduler` tự động kích hoạt pipeline thu thập mỗi 6 giờ.
   - Cho phép kích hoạt quét thủ công ngay trên giao diện UI bất cứ lúc nào.

---

## 🛠️ Cấu Trúc Dự Án

```
agent-skill-trending/
├── backend/
│   ├── main.py                  # FastAPI Entrypoint & Lifespan Seeder
│   ├── config.py                # Cấu hình Pydantic Settings
│   ├── database.py              # SQLAlchemy DB Connection
│   ├── requirements.txt         # Python dependencies
│   ├── models/                  # DB Models (Skill, DataSource, UserPreference)
│   ├── collectors/              # GitHub, Reddit, HN, Awesome Lists collectors
│   ├── analyzer/                # Scorer, Categorizer (AI & Heuristic), RelevanceMatcher
│   ├── api/                     # REST API Routers
│   ├── scheduler/               # APScheduler background tasks
│   └── tests/                   # Pytest test suite
│
├── frontend/
│   ├── src/
│   │   ├── api/                 # API Client
│   │   ├── components/          # SkillCard, ScoreBadge, Navbar, Modals
│   │   ├── pages/               # TrendingFeed, PersonalizedFeed, Explore, Bookmarks, Preferences
│   │   └── types/               # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml           # Chạy trọn gói qua Docker
├── start.sh                     # Script chạy nhanh cho Local Development
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

### Cách 1: Chạy trực tiếp qua Script (Khuyến nghị cho Local Dev)

Chỉ cần chạy file `start.sh`:

```bash
./start.sh
```

- **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)

---

### Cách 2: Chạy qua Docker Compose

```bash
docker compose up --build
```

---

## 🧪 Chạy Kiểm Thử (Unit Tests)

```bash
PYTHONPATH=backend backend/.venv/bin/pytest backend/tests
```
