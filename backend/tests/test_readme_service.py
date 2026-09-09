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
