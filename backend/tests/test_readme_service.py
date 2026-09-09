import pytest
import asyncio
from unittest.mock import patch, AsyncMock
from services.readme_service import ReadmeService


def test_parse_github_repo():
    # Standard URL
    res = ReadmeService.parse_github_repo("https://github.com/langgenius/dify")
    assert res == ("langgenius", "dify")

    # URL with .git
    res = ReadmeService.parse_github_repo("https://github.com/langgenius/dify.git")
    assert res == ("langgenius", "dify")

    # URL with subpaths
    res = ReadmeService.parse_github_repo("https://github.com/langgenius/dify/tree/main/docs")
    assert res == ("langgenius", "dify")

    # Trailing slash
    res = ReadmeService.parse_github_repo("https://github.com/langgenius/dify/")
    assert res == ("langgenius", "dify")

    # Invalid URL
    res = ReadmeService.parse_github_repo("https://gitlab.com/user/project")
    assert res is None

    # Empty URL
    res = ReadmeService.parse_github_repo("")
    assert res is None


def test_normalize_markdown_images():
    owner = "langgenius"
    repo = "dify"

    # Markdown syntax relative ./
    md_in = "![logo](./images/logo.png)"
    md_out = ReadmeService.normalize_markdown_images(md_in, owner, repo)
    assert md_out == "![logo](https://raw.githubusercontent.com/langgenius/dify/HEAD/images/logo.png)"

    # Markdown syntax relative without ./
    md_in2 = "![banner](assets/banner.png)"
    md_out2 = ReadmeService.normalize_markdown_images(md_in2, owner, repo)
    assert md_out2 == "![banner](https://raw.githubusercontent.com/langgenius/dify/HEAD/assets/banner.png)"

    # Absolute URL should remain untouched
    md_in3 = "![badge](https://img.shields.io/badge/test-green)"
    md_out3 = ReadmeService.normalize_markdown_images(md_in3, owner, repo)
    assert md_out3 == md_in3

    # HTML img tag relative
    html_in = '<img src="./images/cover.png" alt="Cover" />'
    html_out = ReadmeService.normalize_markdown_images(html_in, owner, repo)
    assert 'src="https://raw.githubusercontent.com/langgenius/dify/HEAD/images/cover.png"' in html_out


@pytest.mark.asyncio
async def test_empty_content_translation():
    res = await ReadmeService.translate_markdown_content("", target_lang="vi")
    assert res["success"] is False
    assert res["provider"] == "none"


@pytest.mark.asyncio
async def test_translate_via_engine_mock():
    # Test code block preservation in engine fallback
    text = "Intro to project\n\n```bash\nnpm install my-package\n```\n\nOutro text"
    
    from unittest.mock import MagicMock
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "responseData": {"translatedText": "Giới thiệu dự án"}
        }
        mock_get.return_value = mock_resp

        result = await ReadmeService._translate_via_engine(text, target_lang="vi")
        # Code block should remain completely intact
        assert "```bash\nnpm install my-package\n```" in result


@pytest.mark.asyncio
async def test_get_active_ollama_url_fallback():
    # Test that get_active_ollama_url falls back to host.docker.internal when localhost fails
    from unittest.mock import MagicMock
    ReadmeService._cached_ollama_url = None

    async def mock_get(url, *args, **kwargs):
        resp = MagicMock()
        if "host.docker.internal" in str(url):
            resp.status_code = 200
            resp.json.return_value = {"models": [{"name": "qwen2.5:7b"}]}
            return resp
        raise Exception("Connection refused")

    with patch("httpx.AsyncClient.get", side_effect=mock_get):
        active = await ReadmeService.get_active_ollama_url()
        assert active is not None
        assert "host.docker.internal" in active[0]
        assert active[1] == "qwen2.5:7b"

        # Check that check_ollama_status also succeeds
        has_ollama, model_name = await ReadmeService.check_ollama_status()
        assert has_ollama is True
        assert model_name == "qwen2.5:7b"


@pytest.mark.asyncio
async def test_get_available_providers_streamlined():
    providers = await ReadmeService.get_available_providers()
    provider_ids = [p["id"] for p in providers]
    assert "auto" in provider_ids
    assert "local_llm" in provider_ids
    assert "gemini" in provider_ids
    assert "translation_engine" in provider_ids
    # Ensure redundant individual gemini-3.x models are no longer cluttering the list
    assert "gemini-3.8-flash" not in provider_ids


@pytest.mark.asyncio
async def test_local_llm_markdown_translation():
    from unittest.mock import MagicMock
    ReadmeService._cached_ollama_url = "http://host.docker.internal:11434"

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"response": "# Tài Liệu Dự Án\nNội dung đã dịch"}

    with patch.object(ReadmeService, "get_active_ollama_url", return_value=("http://host.docker.internal:11434", "qwen2.5:7b")), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_resp):
        res = await ReadmeService.translate_markdown_content("# Project Docs\nEnglish text", preferred_provider="local_llm")
        assert res["success"] is True
        assert res["provider"] == "local_llm"
        assert "Local Ollama" in res["model_used"]
        assert "Tài Liệu Dự Án" in res["translated_text"]


@pytest.mark.asyncio
async def test_translate_summary_cjk_fallback():
    # Verify no NameError on is_cjk and fallback when all providers fail
    with patch("services.readme_service.settings.GEMINI_API_KEY", None), \
         patch.object(ReadmeService, "get_active_ollama_url", return_value=None), \
         patch.object(ReadmeService, "_translate_via_engine", side_effect=Exception("API fail")):
        # English fallback returns original text
        en_res = await ReadmeService.translate_summary_to_vietnamese("Hello world")
        assert en_res == "Hello world"

        # CJK text returns empty string when untranslated
        cjk_res = await ReadmeService.translate_summary_to_vietnamese("这是一个测试")
        assert cjk_res == ""

