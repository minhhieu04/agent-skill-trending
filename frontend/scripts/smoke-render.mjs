import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { renderSkillVideo } from './render-skill-video.mjs';

const createSilentWavDataUrl = (durationSeconds = 2, sampleRate = 8000) => {
  const sampleCount = Math.round(durationSeconds * sampleRate);
  const dataSize = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return `data:audio/wav;base64,${buffer.toString('base64')}`;
};

const outputLocation = process.argv[2] || resolve(tmpdir(), 'agent-skill-video-smoke.mp4');
const captureDir = process.argv[3];
const aspectRatio = process.argv[4] === '16:9' ? '16:9' : '9:16';
const captureFrames = captureDir
  ? await Promise.all(['github-root.png', 'github-readme.png'].map(async (filename) => {
    const buffer = await readFile(resolve(captureDir, filename));
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }))
  : [];
const captureVideo = captureDir
  ? await readFile(resolve(captureDir, 'github-walkthrough.mp4'))
    .then((buffer) => `data:video/mp4;base64,${buffer.toString('base64')}`)
    .catch(() => undefined)
  : undefined;
const inputProps = {
  storyboard: {
    total_duration: 8,
    aspect_ratio: aspectRatio,
    scenes: [{
      scene_number: 1,
      scene_type: 'github',
      title: 'Repository Walkthrough',
      voiceover_text: 'Open the verified repository.',
      visual_description: 'GitHub walkthrough smoke test.',
      duration_seconds: 8,
      repository_url: 'https://github.com/google/skills',
      repository_owner: 'google',
      repository_name: 'skills',
      readme_excerpt: 'Source-backed skill information rendered with cursor navigation.',
      stars_count: 321,
      forks_count: 12,
      open_issues: 4,
      github_capture_frames: captureFrames,
      github_capture_video: captureVideo,
      github_capture_duration_seconds: captureVideo ? 4 : undefined,
      github_capture_fps: captureVideo ? 12 : undefined,
      capture_status: captureVideo || captureFrames.length ? 'captured' : 'unavailable',
      cursor_actions: [
        { at: 0.08, x: 0.50, y: 0.10, type: 'move', frame_index: 0 },
        { at: 0.27, x: 0.24, y: 0.42, type: 'click', frame_index: 0 },
        { at: 0.48, x: 0.84, y: 0.72, type: 'scroll', frame_index: 1 },
        { at: 0.90, x: 0.54, y: 0.42, type: 'highlight', frame_index: 1 },
      ],
    }],
  },
  ttsResult: {
    audio_base64: '',
    duration_seconds: 8,
    subtitle_entries: [
      { text: 'Open', start_ms: 0, end_ms: 1800 },
      { text: 'the', start_ms: 1800, end_ms: 3000 },
      { text: 'verified', start_ms: 3000, end_ms: 5200 },
      { text: 'repository.', start_ms: 5200, end_ms: 7800 },
    ],
    voice: 'smoke',
    status: 'success',
    timing_quality: 'word',
    scene_segments: [{ scene_index: 0, start_ms: 0, end_ms: 8000, subtitle_start_index: 0, subtitle_end_index: 4 }],
  },
  audioSrc: createSilentWavDataUrl(8),
  skillTitle: 'Verified Skill',
  skillStats: { stars: 321, forks: 12, language: 'TypeScript' },
  showCaptions: true,
};

await renderSkillVideo({ inputProps, outputLocation });
process.stdout.write(`${outputLocation}\n`);
