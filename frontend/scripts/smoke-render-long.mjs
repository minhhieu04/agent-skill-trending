import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { renderSkillVideo } from './render-skill-video.mjs';

const createSilentWavDataUrl = (durationSeconds, sampleRate = 8000) => {
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

const outputLocation = process.argv[2] || resolve(tmpdir(), 'agent-skill-video-long-smoke.mp4');
const captureDir = process.argv[3];
if (!captureDir) throw new Error('Pass the GitHub capture directory as the second argument');
const captureFrames = await Promise.all(['github-root.png', 'github-readme.png'].map(async (filename) => {
  const buffer = await readFile(resolve(captureDir, filename));
  return `data:image/png;base64,${buffer.toString('base64')}`;
}));

const sceneDurationMs = 7500;
const sceneBlueprints = [
  ['intro', 'Google Skills nguồn chính thức', 'Mở đầu bằng nguồn và dữ liệu đã xác minh.'],
  ['github', 'Repository thật', 'Mở repository thật rồi xem file tree và README.'],
  ['comparison', 'Use case cụ thể', 'So sánh workflow cũ với quy trình dùng skill.'],
  ['stat', 'Số liệu có nguồn', 'Stars forks và issues chỉ phản ánh dữ liệu hiện tại.'],
  ['code', 'Đọc file chính', 'Code xuất hiện một lần rồi giữ nguyên để đọc.'],
  ['terminal', 'Kiểm tra terminal', 'Clone vào sandbox và xem dependency trước khi chạy.'],
  ['features', 'Các use case', 'Mỗi use case có một thẻ nội dung riêng biệt.'],
  ['architecture', 'Luồng hoạt động', 'Dữ liệu chạy một chiều qua skill và runtime.'],
  ['security', 'Kiểm tra an toàn', 'Đọc README quyền truy cập dependency và network.'],
  ['content', 'Giới hạn cần biết', 'Bỏ qua claim không có nguồn hoặc benchmark độc lập.'],
  ['stat', 'Đọc metrics đúng', 'Community interest không tự động chứng minh hiệu năng.'],
  ['outro', 'Kiểm tra trước khi cài', 'Mở source đọc code và thử trong sandbox trước.'],
];

const scenes = sceneBlueprints.map(([sceneType, title, voiceover], index) => ({
  scene_number: index + 1,
  scene_type: sceneType,
  title,
  voiceover_text: voiceover,
  visual_description: title,
  duration_seconds: sceneDurationMs / 1000,
  repository_url: sceneType === 'github' ? 'https://github.com/google/skills' : undefined,
  github_capture_frames: sceneType === 'github' ? captureFrames : undefined,
  capture_status: sceneType === 'github' ? 'captured' : undefined,
  cursor_actions: sceneType === 'github' ? [
    { at: 0.08, x: 0.50, y: 0.10, type: 'move', frame_index: 0 },
    { at: 0.27, x: 0.24, y: 0.42, type: 'click', frame_index: 0 },
    { at: 0.48, x: 0.84, y: 0.72, type: 'scroll', frame_index: 1 },
    { at: 0.90, x: 0.54, y: 0.42, type: 'highlight', frame_index: 1 },
  ] : undefined,
  stars_count: 18700,
  forks_count: 1500,
  open_issues: 23,
  trending_score: 92,
  before_text: 'Manual source review',
  after_text: 'Structured skill workflow',
  code_snippet: 'git clone https://github.com/google/skills\ncd skills\nopen README.md\n# inspect before running',
  terminal_command: 'git clone https://github.com/google/skills',
  terminal_output: ['→ isolated workspace', '→ dependencies inspected', '→ permissions limited', '✓ ready for a small test'],
  feature_items: [
    { icon: '📖', title: 'README', desc: 'Read documented behavior' },
    { icon: '📦', title: 'Dependencies', desc: 'Inspect packages first' },
    { icon: '🔐', title: 'Permissions', desc: 'Limit access' },
    { icon: '🧪', title: 'Sandbox', desc: 'Run a small test' },
  ],
}));

const subtitleEntries = [];
const sceneSegments = [];
scenes.forEach((scene, sceneIndex) => {
  const words = scene.voiceover_text.split(/\s+/).filter(Boolean);
  const startMs = sceneIndex * sceneDurationMs;
  const wordDuration = sceneDurationMs / words.length;
  const subtitleStartIndex = subtitleEntries.length;
  words.forEach((text, wordIndex) => subtitleEntries.push({
    text,
    start_ms: Math.round(startMs + wordIndex * wordDuration),
    end_ms: Math.round(startMs + (wordIndex + 1) * wordDuration),
  }));
  sceneSegments.push({
    scene_index: sceneIndex,
    start_ms: startMs,
    end_ms: startMs + sceneDurationMs,
    subtitle_start_index: subtitleStartIndex,
    subtitle_end_index: subtitleEntries.length,
  });
});

const durationSeconds = scenes.length * sceneDurationMs / 1000;
await renderSkillVideo({
  outputLocation,
  inputProps: {
    storyboard: { total_duration: durationSeconds, aspect_ratio: '9:16', scenes },
    ttsResult: {
      audio_base64: '',
      duration_seconds: durationSeconds,
      subtitle_entries: subtitleEntries,
      scene_segments: sceneSegments,
      timing_quality: 'word',
      voice: 'long-smoke',
      status: 'success',
    },
    audioSrc: createSilentWavDataUrl(durationSeconds),
    skillTitle: 'Google Agent Skills',
    skillStats: { stars: 18700, forks: 1500, language: 'Python' },
    showCaptions: true,
  },
});

process.stdout.write(`${outputLocation}\n`);
