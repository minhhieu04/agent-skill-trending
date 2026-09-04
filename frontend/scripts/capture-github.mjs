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

  await page.evaluate(() => {
    const heading = Array.from(document.querySelectorAll('h1, h2')).find((node) =>
      (node.textContent || '').toLowerCase().includes('readme'),
    );
    const fallback = document.querySelector('article.markdown-body');
    (heading || fallback)?.scrollIntoView({ block: 'start' });
  });
  await wait(350);
  const readmePath = await capture(page, 'github-readme.png');

  let skillPath = null;
  if (skillTarget?.href && new URL(skillTarget.href).hostname === 'github.com') {
    await page.goto({ url: skillTarget.href, timeout: 45000 });
    await wait(900);
    skillPath = await capture(page, 'github-skill.png');
  }

  const frames = [rootPath, readmePath, skillPath].filter(Boolean);
  const manifest = {
    source_url: repositoryUrl.toString(),
    viewport,
    frames,
    cursor_actions: [
      { at: 0.08, x: 0.50, y: 0.10, type: 'move', frame_index: 0 },
      { at: 0.27, x: readmeTarget?.x ?? 0.30, y: readmeTarget?.y ?? 0.36, type: 'click', frame_index: 0 },
      { at: 0.46, x: 0.84, y: 0.72, type: 'scroll', frame_index: 1 },
      { at: 0.69, x: skillTarget?.x ?? 0.28, y: skillTarget?.y ?? 0.32, type: 'click', frame_index: frames.length > 2 ? 2 : 1 },
      { at: 0.90, x: 0.54, y: 0.42, type: 'highlight', frame_index: frames.length - 1 },
    ],
  };
  await writeFile(resolve(safeOutputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  process.stdout.write(JSON.stringify(manifest));
} finally {
  await browser.close({ silent: true });
}
