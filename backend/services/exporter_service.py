import json
from typing import Dict, Any, Optional
from models.skill import Skill

class ExporterService:
    @staticmethod
    def export_skill_config(skill: Skill, target_ide: str) -> Dict[str, Any]:
        """
        Generates production-ready config/rules content for various agentic IDEs & runtimes.
        Supports: antigravity, codex, cursor, claude, windsurf, aider, mcp.
        """
        name = skill.name or "custom-skill"
        slug = name.replace("/", "-").replace("_", "-").lower()
        title = skill.title or skill.name
        desc = skill.description or skill.ai_summary or "AI Agent procedural skill."
        use_cases = skill.use_cases or []
        tags = skill.tags or []
        
        target = target_ide.lower()

        # 1. Google Antigravity Format (SKILL.md)
        if target in ["antigravity", "gemini", "agy"]:
            content = f"""---
name: {slug}
description: {desc}
tags: {json.dumps(tags)}
version: 1.0.0
---

# {title}

{desc}

## Target Audience & Context
- **Applicability**: {skill.target_audience or 'Fullstack Developers & AI Engineers'}
- **Primary Language**: {skill.primary_language or 'Multi-language'}
- **Category**: {skill.category}

## Procedural Rules & Constraints
1. **Strict Verification**: Always verify code changes with relevant test suites or linter before completing the response.
2. **Deterministic Architecture**: Adhere strictly to the established design patterns and conventions in the codebase.
3. **Safety & Sandboxing**: Execute write and modifying commands safely within the project sandbox.

## Realistic Use Cases
"""
            for i, uc in enumerate(use_cases, 1):
                content += f"{i}. {uc}\n"

            content += f"""
## Reference & Upstream Repository
- Source: {skill.repository_url}
- Stars: {skill.stars} | Trending Score: {skill.trending_score}/100
"""
            return {
                "ide": "Google Antigravity",
                "file_path": f".gemini/config/skills/{slug}/SKILL.md",
                "file_name": "SKILL.md",
                "syntax": "markdown",
                "content": content.strip(),
                "cli_command": f"mkdir -p .gemini/config/skills/{slug} && curl -s http://localhost:8899/api/v1/skills/{skill.id}/export/antigravity/raw > .gemini/config/skills/{slug}/SKILL.md"
            }

        # 2. OpenAI Codex / GitHub Copilot Instructions Format
        elif target in ["codex", "copilot", "github-copilot"]:
            content = f"""# GitHub Copilot & OpenAI Codex Instructions: {title}

> {desc}

## Coding Conventions & Quality Rules
- Enforce strict typing and error boundary validations.
- Never write hardcoded secrets or arbitrary environment credentials.
- Ensure all functions have clear docstrings, deterministic return types, and corresponding unit tests.

## Key Directives for this Project:
- Category: {skill.category}
- Applicable Stack: {skill.primary_language or 'TypeScript / Go / Python'}
"""
            for uc in use_cases:
                content += f"- Standard: {uc}\n"

            content += f"\n<!-- Upstream Source: {skill.repository_url} -->\n"

            return {
                "ide": "OpenAI Codex / Copilot",
                "file_path": ".github/copilot-instructions.md",
                "file_name": "copilot-instructions.md",
                "syntax": "markdown",
                "content": content.strip(),
                "cli_command": f"mkdir -p .github && curl -s http://localhost:8899/api/v1/skills/{skill.id}/export/codex/raw > .github/copilot-instructions.md"
            }

        # 3. Cursor Rules (.mdc format)
        elif target in ["cursor", "cursorrules", "cursor-rules"]:
            content = f"""---
description: {desc}
globs: *
alwaysApply: true
---

# {title} (.cursorrules)

You are an expert developer specializing in {skill.category}.
Follow these strict architectural guidelines when generating code:

## Guidelines:
1. Follow idiomatically standard conventions for {skill.primary_language or 'the target codebase'}.
2. Ensure clean modular separation of concerns.
3. Validate inputs, handle edge-cases, and prevent race conditions.

## Specific Behaviors & Use Cases:
"""
            for uc in use_cases:
                content += f"- {uc}\n"

            content += f"\n## Upstream Reference\nRepository: {skill.repository_url}\n"

            return {
                "ide": "Cursor",
                "file_path": f".cursor/rules/{slug}.mdc",
                "file_name": f"{slug}.mdc",
                "syntax": "markdown",
                "content": content.strip(),
                "cli_command": f"mkdir -p .cursor/rules && curl -s http://localhost:8899/api/v1/skills/{skill.id}/export/cursor/raw > .cursor/rules/{slug}.mdc"
            }

        # 4. Claude Code / Claude Desktop Format
        elif target in ["claude", "claude-code", "anthropic"]:
            if skill.category == "mcp-server":
                mcp_config = {
                    "mcpServers": {
                        slug: {
                            "command": "npx",
                            "args": ["-y", f"@{skill.name or slug}/server"],
                            "env": {}
                        }
                    }
                }
                return {
                    "ide": "Claude Desktop / MCP",
                    "file_path": "claude_desktop_config.json",
                    "file_name": "claude_desktop_config.json",
                    "syntax": "json",
                    "content": json.dumps(mcp_config, indent=2),
                    "cli_command": f"claude mcp add {slug} -- npx -y {skill.name}"
                }
            else:
                content = f"""# Claude Code Agent Skill: {title}

## Description
{desc}

## System Instructions
Always apply these guidelines when working on code in this repository:
- Follow Clean Architecture principles.
- Maintain high test coverage (>80%).
- Ensure deterministic error handling.

## Scenarios:
"""
                for uc in use_cases:
                    content += f"- {uc}\n"

                return {
                    "ide": "Claude Code",
                    "file_path": f"~/.claude/skills/{slug}/SKILL.md",
                    "file_name": "SKILL.md",
                    "syntax": "markdown",
                    "content": content.strip(),
                    "cli_command": f"mkdir -p ~/.claude/skills/{slug} && curl -s http://localhost:8899/api/v1/skills/{skill.id}/export/claude/raw > ~/.claude/skills/{slug}/SKILL.md"
                }

        # 5. Windsurf (.windsurfrules)
        elif target in ["windsurf", "codeium"]:
            content = f"""# Windsurf Rules for {title}

{desc}

- Follow idiomatic patterns for {skill.primary_language or 'project'}.
- Maintain strict typing and modularity.
"""
            for uc in use_cases:
                content += f"- Focus: {uc}\n"

            return {
                "ide": "Windsurf",
                "file_path": ".windsurfrules",
                "file_name": ".windsurfrules",
                "syntax": "markdown",
                "content": content.strip(),
                "cli_command": f"curl -s http://localhost:8899/api/v1/skills/{skill.id}/export/windsurf/raw >> .windsurfrules"
            }

        # 6. Aider (.aider.conf.yml)
        elif target in ["aider"]:
            content = f"""# Aider Configuration & Conventions
# Skill: {title}
# Source: {skill.repository_url}

model: anthropic/claude-3-7-sonnet-20250219
auto-commits: true
read:
  - CONVENTIONS.md
"""
            return {
                "ide": "Aider",
                "file_path": ".aider.conf.yml",
                "file_name": ".aider.conf.yml",
                "syntax": "yaml",
                "content": content.strip(),
                "cli_command": f"curl -s http://localhost:8899/api/v1/skills/{skill.id}/export/aider/raw > .aider.conf.yml"
            }

        # Fallback / Generic MCP
        else:
            return {
                "ide": "Generic MCP",
                "file_path": "mcp.json",
                "file_name": "mcp.json",
                "syntax": "json",
                "content": json.dumps({"mcpServers": {slug: {"url": skill.repository_url}}}, indent=2),
                "cli_command": f"# Generic MCP Config for {skill.name}"
            }
