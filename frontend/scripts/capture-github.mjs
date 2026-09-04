import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { openBrowser } from '@remotion/renderer';

const args = process.argv.slice(2);
const valueFor = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const rawUrl = valueFor('--url');
const outputDir = valueFor('--output-dir');

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

const browser = await openBrowser('chrome', {
  chromeMode: 'headless-shell',
  logLevel: 'error',
  chromiumOptions: {
    darkMode: true,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36',
  },
});

const viewport = { width: 1000, height: 1400, deviceScaleFactor: 1 };

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
  const readmeTarget = await getTarget(page, 'README.md');
  const skillTarget = await getTarget(page, 'SKILL.md');

  let readmePath = null;
  let readmeDetailsPath = null;
  if (readmeTarget?.href && new URL(readmeTarget.href).hostname === 'github.com') {
    await page.goto({ url: readmeTarget.href, timeout: 45000 });
    await wait(900);
    readmePath = await capture(page, 'github-readme.png');
    await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.62)));
    await wait(300);
    readmeDetailsPath = await capture(page, 'github-readme-details.png');
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
    await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.62)));
    await wait(300);
    readmeDetailsPath = await capture(page, 'github-readme-details.png');
  }

  let skillPath = null;
  if (skillTarget?.href && new URL(skillTarget.href).hostname === 'github.com') {
    await page.goto({ url: skillTarget.href, timeout: 45000 });
    await wait(900);
    skillPath = await capture(page, 'github-skill.png');
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
  const manifest = {
    source_url: repositoryUrl.toString(),
    viewport,
    frames,
    cursor_actions: cursorActions,
  };
  await writeFile(resolve(safeOutputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  process.stdout.write(JSON.stringify(manifest));
} finally {
  await browser.close({ silent: true });
}
