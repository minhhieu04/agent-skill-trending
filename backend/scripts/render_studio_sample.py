"""Render a real-TTS Studio sample for end-to-end synchronization QA."""

import argparse
import asyncio
import json
import subprocess
import tempfile
from pathlib import Path

from api.studio import _capture_github_repository
from services.blog_video_service import BlogVideoService
from services.tts_service import TTSService


async def render_sample(output: Path) -> dict:
    # Keep the repeatable QA fixture public and generic so no workspace content
    # is sent to the external speech provider.
    repository_url = "https://github.com/google/skills"
    storyboard = BlogVideoService._generate_curated_storyboard(
        "Public Agent Skill Demo",
        target_duration=30,
        aspect_ratio="9:16",
        language="vi",
        skill_data={
            "name": "google/skills",
            "title": "Public Agent Skill Demo",
            "repository_url": repository_url,
            "description": "Bản kiểm thử công khai cho quy trình đọc nguồn và trình bày agent skill.",
            "readme_preview": "# Public Agent Skill Demo\n\nĐọc tài liệu, kiểm tra repository và thử trong sandbox.",
            "primary_language": "TypeScript",
            "use_cases": ["Đọc tài liệu", "Kiểm tra repository", "Thử trong sandbox"],
            "runtimes": ["Codex", "Claude Code", "Cursor"],
        },
    )
    scene_texts = [scene["voiceover_text"] for scene in storyboard["scenes"]]
    tts_result = await TTSService.synthesize(
        text=" ".join(scene_texts),
        scene_texts=scene_texts,
        voice="vi-VN-HoaiMyNeural",
        rate="+15%",
        pitch="+0Hz",
        provider="edge_tts",
    )
    if not tts_result.get("audio_base64"):
        raise RuntimeError(f"Real TTS failed: {tts_result.get('message') or tts_result.get('status')}")

    github_scene = next((scene for scene in storyboard["scenes"] if scene.get("scene_type") == "github"), None)
    capture = await _capture_github_repository(
        repository_url,
        storyboard["aspect_ratio"],
        float((github_scene or {}).get("duration_seconds") or 8),
    )
    if capture and github_scene:
        github_scene.update(capture)

    frontend_dir = Path(__file__).resolve().parents[2] / "frontend"
    render_script = frontend_dir / "scripts" / "render-skill-video.mjs"
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="studio-sync-sample-") as temp_dir:
        props_path = Path(temp_dir) / "props.json"
        props_path.write_text(json.dumps({
            "storyboard": storyboard,
            "ttsResult": tts_result,
            "audioSrc": f"data:audio/mpeg;base64,{tts_result['audio_base64']}",
            "skillTitle": "Public Agent Skill Demo",
            "skillStats": {"language": "TypeScript"},
            "showCaptions": True,
        }, ensure_ascii=False), encoding="utf-8")
        subprocess.run(
            ["node", str(render_script), "--props", str(props_path), "--output", str(output)],
            cwd=frontend_dir,
            check=True,
            timeout=1200,
        )

    probe = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "stream=codec_type,codec_name,duration,width,height,r_frame_rate:format=duration,size",
            "-of", "json", str(output),
        ],
        check=True,
        capture_output=True,
        text=True,
        timeout=30,
    )
    media = json.loads(probe.stdout)
    streams = media.get("streams") or []
    video_stream = next(stream for stream in streams if stream.get("codec_type") == "video")
    audio_stream = next(stream for stream in streams if stream.get("codec_type") == "audio")
    av_drift_ms = abs(float(video_stream["duration"]) - float(audio_stream["duration"])) * 1000
    if av_drift_ms > 120:
        raise RuntimeError(f"Rendered A/V drift exceeds 120 ms: {av_drift_ms:.1f} ms")

    return {
        "output": str(output),
        "duration_seconds": tts_result["duration_seconds"],
        "timeline_version": tts_result.get("timeline_version"),
        "timing_quality": tts_result.get("timing_quality"),
        "actual_provider": tts_result.get("actual_provider"),
        "narration_revision": tts_result.get("narration_revision"),
        "caption_lead_ms": tts_result.get("caption_lead_ms"),
        "sync_diagnostics": tts_result.get("sync_diagnostics"),
        "scene_segments": tts_result.get("scene_segments"),
        "github_capture": bool(capture),
        "github_recording": bool((capture or {}).get("github_capture_video")),
        "render_diagnostics": {
            "video_codec": video_stream.get("codec_name"),
            "audio_codec": audio_stream.get("codec_name"),
            "width": video_stream.get("width"),
            "height": video_stream.get("height"),
            "fps": video_stream.get("r_frame_rate"),
            "video_duration_seconds": float(video_stream["duration"]),
            "audio_duration_seconds": float(audio_stream["duration"]),
            "av_drift_ms": round(av_drift_ms, 3),
            "size_bytes": int((media.get("format") or {}).get("size") or 0),
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = asyncio.run(render_sample(args.output.resolve()))
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
