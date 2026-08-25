import pytest
from analyzer.scorer import Scorer
from analyzer.categorizer import Categorizer
from analyzer.relevance import RelevanceMatcher
from models.user_preference import UserPreference

def test_scorer_quality():
    item = {
        "stars": 1500,
        "forks": 150,
        "open_issues": 10,
        "description": "An awesome production-ready tool for AI agent workflows and automation.",
        "raw_data": {"license": "MIT"}
    }
    quality = Scorer.calculate_quality_score(item)
    assert 50.0 <= quality <= 100.0

def test_scorer_trending():
    item = {
        "stars": 2500,
        "forks": 200,
        "reddit_score": 150,
        "reddit_mentions": 3,
        "hackernews_score": 80,
        "hackernews_mentions": 2,
        "source_type": "github_trending_daily"
    }
    trending = Scorer.calculate_trending_score(item, quality_score=90.0)
    assert trending > 70.0

def test_categorizer_heuristics():
    # MCP Server test
    res = Categorizer.rule_based_categorize("github-mcp-server", "MCP server for GitHub", ["mcp", "tools"])
    assert res["category"] == "mcp-server"

    # Skill File test
    res_skill = Categorizer.rule_based_categorize("cursor-rules-pack", "Collection of rules for Cursor IDE", ["cursor", "skills"])
    assert res_skill["category"] == "skill-file"

    # Coding Agent test
    res_agent = Categorizer.rule_based_categorize("auto-coder", "Autonomous coding agent for fullstack dev", ["agent"])
    assert res_agent["category"] == "coding-agent"

def test_relevance_matching():
    pref = UserPreference(
        preferred_categories=["coding-agent", "mcp-server"],
        preferred_languages=["Python", "TypeScript"],
        preferred_runtimes=["Claude Code", "Cursor"],
        interested_tags=["mcp", "agent"],
        min_stars=50
    )
    
    matching_item = {
        "category": "coding-agent",
        "primary_language": "Python",
        "runtimes": ["Claude Code", "Cursor"],
        "tags": ["mcp", "agent", "python"],
        "stars": 500
    }
    
    score = RelevanceMatcher.calculate_relevance(matching_item, pref)
    assert score >= 70.0
