import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = dirname(scriptPath);

export const renderSkillVideo = async ({ inputProps, outputLocation }) => {
  const serveUrl = await bundle({
    entryPoint: resolve(scriptDir, '../src/remotion-entry.tsx'),
    onProgress: () => undefined,
  });
  const composition = await selectComposition({
    serveUrl,
    id: 'SkillVideo',
    inputProps,
  });

  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    audioCodec: 'aac',
    crf: 18,
    x264Preset: 'medium',
    audioBitrate: '192k',
    colorSpace: 'bt709',
    concurrency: '75%',
    imageFormat: 'jpeg',
    jpegQuality: 92,
    outputLocation: resolve(outputLocation),
    inputProps,
    overwrite: true,
  });
};

if (process.argv[1] && resolve(process.argv[1]) === resolve(scriptPath)) {
  const args = process.argv.slice(2);
  const valueFor = (flag) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const propsPath = valueFor('--props');
  const outputLocation = valueFor('--output');
  if (!propsPath || !outputLocation) {
    throw new Error('Usage: render-skill-video.mjs --props <props.json> --output <video.mp4>');
  }
  const inputProps = JSON.parse(await readFile(resolve(propsPath), 'utf8'));
  await renderSkillVideo({ inputProps, outputLocation });
}
