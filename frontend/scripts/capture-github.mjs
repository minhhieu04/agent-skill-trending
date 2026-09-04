import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { openBrowser } from '@remotion/renderer';

const execFileAsync = promisify(execFile);

const args = process.argv.slice(2);
const valueFor = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const rawUrl = valueFor('--url');
const outputDir = valueFor('--output-dir');
const aspectRatio = valueFor('--aspect-ratio') === '16:9' ? '16:9' : '9:16';
const requestedDuration = Number(valueFor('--duration-seconds') || 8);
const durationSeconds = Math.max(4, Math.min(20, Number.isFinite(requestedDuration) ? requestedDuration : 8));
const fps = 12;

if (!rawUrl || !outputDir) {
  throw new Error('Usage: capture-github.mjs --url <github-url> --output-dir <directory>');
}

const repositoryUrl = new URL(rawUrl);
if (repositoryUrl.protocol !== 'https:' || repositoryUrl.hostname !== 'github.com') {
  throw new Error('Only public https://github.com repository URLs can be captured');
}

repositoryUrl.hash = '';
repositoryUrl.search = '';
const safeOutputDir = resolve(outputDir);
await mkdir(safeOutputDir, { recursive: true });
const videoFramesDir = resolve(safeOutputDir, 'video-frames');
await mkdir(videoFramesDir, { recursive: true });

const browser = await openBrowser('chrome', {
  chromeMode: 'headless-shell',
  logLevel: 'error',
  chromiumOptions: {
    darkMode: true,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36',
  },
});

const viewport = aspectRatio === '16:9'
  ? { width: 1600, height: 700, deviceScaleFactor: 1 }
  : { width: 1000, height: 1360, deviceScaleFactor: 1 };

const wait = (ms) => new Promise((resolveWait) => setTimeout(resolveWait, ms));

const capture = async (page, filename) => {
  const result = await page._client().send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    fromSurface: true,
  });
  const screenshotData = result?.value?.data ?? result?.data ?? result?.result?.data;
  if (!screenshotData) throw new Error('Chrome did not return screenshot bytes');
  const path = resolve(safeOutputDir, filename);
  await writeFile(path, Buffer.from(screenshotData, 'base64'));
  return path;
};

let videoFrameNumber = 0;
const captureVideoFrame = async (page) => {
  const result = await page._client().send('Page.captureScreenshot', {
    format: 'jpeg',
    quality: 82,
    captureBeyondViewport: false,
    fromSurface: true,
  });
  const screenshotData = result?.value?.data ?? result?.data ?? result?.result?.data;
  if (!screenshotData) throw new Error('Chrome did not return video frame bytes');
  videoFrameNumber += 1;
  const path = resolve(videoFramesDir, `browser-${String(videoFrameNumber).padStart(4, '0')}.jpg`);
  await writeFile(path, Buffer.from(screenshotData, 'base64'));
};

const prepareRecordedPage = async (page) => page.evaluate(() => {
  document.documentElement.style.scrollBehavior = 'auto';
  let cursor = document.getElementById('agent-skill-recorded-cursor');
  if (!cursor) {
    cursor = document.createElement('div');
    cursor.id = 'agent-skill-recorded-cursor';
    cursor.innerHTML = '<svg width="34" height="44" viewBox="0 0 34 44"><path d="M3 2L3 34L12 26L19 41L25 38L18 24L31 23Z" fill="white" stroke="#111827" stroke-width="2.4" stroke-linejoin="round"/></svg><span></span>';
    Object.assign(cursor.style, {
      position: 'fixed', left: '0', top: '0', width: '34px', height: '44px',
      zIndex: '2147483647', pointerEvents: 'none', transform: 'translate(-3px,-3px)',
      filter: 'drop-shadow(0 4px 5px rgba(0,0,0,.78))', transition: 'none',
    });
    const pulse = cursor.querySelector('span');
    Object.assign(pulse.style, {
      position: 'absolute', left: '-17px', top: '-17px', width: '42px', height: '42px',
      borderRadius: '999px', border: '4px solid #2f81f7', opacity: '0',
    });
    document.documentElement.appendChild(cursor);
  }
});

const updateRecordedPage = async (page, state) => page.evaluate((nextState) => {
  const cursor = document.getElementById('agent-skill-recorded-cursor');
  if (cursor) {
    cursor.style.left = `${nextState.x * window.innerWidth}px`;
    cursor.style.top = `${nextState.y * window.innerHeight}px`;
    const pulse = cursor.querySelector('span');
    if (pulse) {
      pulse.style.opacity = String(nextState.pulse);
      pulse.style.transform = `scale(${1 + nextState.pulse * 0.65})`;
    }
  }
  window.scrollTo(0, nextState.scrollY);
}, state);

const easeOutCubic = (value) => 1 - ((1 - value) ** 3);
const recordSegment = async (page, count, options) => {
  for (let index = 0; index < count; index += 1) {
    const progress = count <= 1 ? 1 : index / (count - 1);
    const eased = easeOutCubic(progress);
    await updateRecordedPage(page, {
      x: options.from.x + (options.to.x - options.from.x) * eased,
      y: options.from.y + (options.to.y - options.from.y) * eased,
      scrollY: options.scrollStart + (options.scrollEnd - options.scrollStart) * eased,
      pulse: options.clickAtEnd ? Math.max(0, 1 - Math.abs(progress - 0.88) / 0.12) : 0,
    });
    await captureVideoFrame(page);
  }
};

const dispatchRealClick = async (page, target) => {
  const client = page._client();
  const x = Math.round(target.x * viewport.width);
  const y = Math.round(target.y * viewport.height);
  await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};

const getTarget = async (page, label) => page.evaluate((targetLabel) => {
  const normalized = targetLabel.toLowerCase();
  const anchors = Array.from(document.querySelectorAll('a'));
  const candidates = anchors
    .map((anchor) => ({
      anchor,
      text: (anchor.textContent || '').trim().toLowerCase(),
      rect: anchor.getBoundingClientRect(),
    }))
    .filter(({ text, rect }) => (
      (text === normalized || text.includes(normalized))
      && rect.width > 0
      && rect.height > 0
      && rect.right > 0
      && rect.bottom > 0
      && rect.left < window.innerWidth
      && rect.top < window.innerHeight
    ))
    .sort((left, right) => {
      const leftExact = left.text === normalized ? 1 : 0;
      const rightExact = right.text === normalized ? 1 : 0;
      if (leftExact !== rightExact) return rightExact - leftExact;
      const leftFileLink = left.anchor.href.includes('/blob/') ? 1 : 0;
      const rightFileLink = right.anchor.href.includes('/blob/') ? 1 : 0;
      if (leftFileLink !== rightFileLink) return rightFileLink - leftFileLink;
      return left.rect.top - right.rect.top;
    });
  const target = candidates[0];
  if (!target) return null;
  const { anchor: element, rect } = target;
  return {
    href: element.href || null,
    x: Math.max(0.03, Math.min(0.97, (rect.left + rect.width / 2) / window.innerWidth)),
    y: Math.max(0.03, Math.min(0.97, (rect.top + rect.height / 2) / window.innerHeight)),
  };
}, label);

try {
  const page = await browser.newPage({
    context: () => null,
    logLevel: 'error',
    indent: false,
    pageIndex: 0,
    onBrowserLog: null,
    onLog: () => undefined,
  });

  await page.setViewport(viewport);
  page.setDefaultNavigationTimeout(45000);
  const response = await page.goto({ url: repositoryUrl.toString(), timeout: 45000 });
  if (!response || response.status() >= 400) {
    throw new Error(`GitHub repository returned HTTP ${response?.status() ?? 'unknown'}`);
  }
  await wait(1600);

  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
  });
  await wait(250);

  const rootPath = await capture(page, 'github-root.png');
  const sourceRevision = await page.evaluate(() => {
    const commitLink = Array.from(document.querySelectorAll('a[href*="/commit/"]'))
      .map((anchor) => anchor.getAttribute('href') || '')
      .find((href) => /\/commit\/[0-9a-f]{7,40}/i.test(href));
    return commitLink?.match(/\/commit\/([0-9a-f]{7,40})/i)?.[1] || null;
  });
  const readmeTarget = await getTarget(page, 'README.md');
  const skillTarget = await getTarget(page, 'SKILL.md');
  const totalVideoFrames = Math.max(48, Math.round(durationSeconds * fps));
  const rootVideoFrames = Math.max(12, Math.round(totalVideoFrames * 0.28));
  const readmeVideoFrames = Math.max(18, Math.round(totalVideoFrames * 0.45));
  const finalVideoFrames = Math.max(1, totalVideoFrames - rootVideoFrames - readmeVideoFrames);
  const readmePoint = readmeTarget || { x: 0.30, y: 0.38 };
  await prepareRecordedPage(page);
  await recordSegment(page, rootVideoFrames, {
    from: { x: 0.52, y: 0.10 },
    to: readmePoint,
    scrollStart: 0,
    scrollEnd: 0,
    clickAtEnd: true,
  });

  let readmePath = null;
  let readmeDetailsPath = null;
  if (readmeTarget?.href && new URL(readmeTarget.href).hostname === 'github.com') {
    await dispatchRealClick(page, readmeTarget);
    await wait(180);
    await page.goto({ url: readmeTarget.href, timeout: 45000 });
    await wait(900);
    readmePath = await capture(page, 'github-readme.png');
  } else {
    await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h1, h2')).find((node) =>
        (node.textContent || '').toLowerCase().includes('readme'),
      );
      const fallback = document.querySelector('article.markdown-body');
      (heading || fallback)?.scrollIntoView({ block: 'start' });
    });
    await wait(350);
    readmePath = await capture(page, 'github-readme.png');
  }
  await prepareRecordedPage(page);
  const scrollLimit = await page.evaluate(() => Math.max(0, Math.min(
    document.documentElement.scrollHeight - window.innerHeight,
    Math.round(window.innerHeight * 0.9),
  )));
  await recordSegment(page, readmeVideoFrames, {
    from: { x: 0.48, y: 0.24 },
    to: { x: 0.87, y: 0.72 },
    scrollStart: 0,
    scrollEnd: scrollLimit,
    clickAtEnd: false,
  });
  readmeDetailsPath = await capture(page, 'github-readme-details.png');

  let skillPath = null;
  if (skillTarget?.href && new URL(skillTarget.href).hostname === 'github.com') {
    await page.goto({ url: skillTarget.href, timeout: 45000 });
    await wait(900);
    await prepareRecordedPage(page);
    skillPath = await capture(page, 'github-skill.png');
    await recordSegment(page, finalVideoFrames, {
      from: { x: 0.12, y: 0.13 },
      to: { x: 0.50, y: 0.38 },
      scrollStart: 0,
      scrollEnd: 0,
      clickAtEnd: true,
    });
  } else {
    await recordSegment(page, finalVideoFrames, {
      from: { x: 0.87, y: 0.72 },
      to: { x: 0.50, y: 0.42 },
      scrollStart: scrollLimit,
      scrollEnd: scrollLimit,
      clickAtEnd: true,
    });
  }

  const frames = [rootPath, readmePath, readmeDetailsPath, skillPath].filter(Boolean);
  const readmeFrameIndex = readmePath ? 1 : 0;
  const readmeDetailsFrameIndex = readmeDetailsPath ? readmeFrameIndex + 1 : readmeFrameIndex;
  const skillFrameIndex = skillPath ? frames.length - 1 : readmeFrameIndex;
  const cursorActions = [
    { at: 0.03, x: 0.50, y: 0.10, type: 'move', frame_index: 0, label: 'Repository overview' },
    { at: 0.15, x: readmeTarget?.x ?? 0.30, y: readmeTarget?.y ?? 0.36, type: 'move', frame_index: 0, label: 'Locate README.md' },
    { at: 0.24, x: readmeTarget?.x ?? 0.30, y: readmeTarget?.y ?? 0.36, type: 'click', frame_index: 0, label: 'Open README.md' },
    { at: 0.30, x: 0.50, y: 0.18, type: 'move', frame_index: readmeFrameIndex, label: 'Read source documentation' },
    { at: 0.49, x: 0.88, y: 0.74, type: 'scroll', frame_index: readmeFrameIndex, label: 'Review setup and usage' },
    { at: 0.55, x: 0.50, y: 0.32, type: 'move', frame_index: readmeDetailsFrameIndex, label: 'README details' },
  ];
  if (skillPath) {
    cursorActions.push(
      { at: 0.62, x: 0.08, y: 0.10, type: 'move', frame_index: 0, label: 'Back to file tree' },
      { at: 0.71, x: skillTarget?.x ?? 0.28, y: skillTarget?.y ?? 0.32, type: 'move', frame_index: 0, label: 'Locate SKILL.md' },
      { at: 0.79, x: skillTarget?.x ?? 0.28, y: skillTarget?.y ?? 0.32, type: 'click', frame_index: 0, label: 'Open SKILL.md' },
      { at: 0.85, x: 0.50, y: 0.25, type: 'move', frame_index: skillFrameIndex, label: 'Inspect skill instructions' },
      { at: 0.94, x: 0.50, y: 0.42, type: 'highlight', frame_index: skillFrameIndex, label: 'Verified source content' },
    );
  } else {
    cursorActions.push({ at: 0.90, x: 0.50, y: 0.42, type: 'highlight', frame_index: readmeFrameIndex, label: 'Verified README content' });
  }
  const videoPath = resolve(safeOutputDir, 'github-walkthrough.mp4');
  let videoEncoded = false;
  try {
    await execFileAsync('ffmpeg', [
      '-y', '-loglevel', 'error', '-framerate', String(fps),
      '-i', resolve(videoFramesDir, 'browser-%04d.jpg'),
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '21',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', videoPath,
    ], { timeout: 120000 });
    videoEncoded = true;
  } catch (error) {
    process.stderr.write(`GitHub video encoding failed; keeping still-frame fallback: ${error.message}\n`);
  }
  const semanticKeys = ['repository', 'readme', 'readme', 'details', 'details', 'details', 'repository', 'skill', 'skill', 'skill', 'verification'];
  const manifest = {
    source_url: repositoryUrl.toString(),
    source_revision: sourceRevision,
    captured_at: new Date().toISOString(),
    viewport,
    frames,
    video: videoEncoded ? videoPath : null,
    duration_seconds: videoFrameNumber / fps,
    fps,
    cursor_actions: cursorActions.map((action, index) => ({
      ...action,
      semantic_key: semanticKeys[index] || 'verification',
    })),
  };
  await writeFile(resolve(safeOutputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  process.stdout.write(JSON.stringify(manifest));
} finally {
  await browser.close({ silent: true });
}
