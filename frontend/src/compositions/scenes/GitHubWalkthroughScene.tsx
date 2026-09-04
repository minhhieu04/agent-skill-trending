import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SubtitleEntry, VideoScene } from '../../types';
import { KaraokeSubtitle } from '../elements/KaraokeSubtitle';

interface GitHubWalkthroughSceneProps {
  scene: VideoScene;
  subtitles?: SubtitleEntry[];
  durationInFrames: number;
  sceneIndex?: number;
  totalScenes?: number;
}

const DEFAULT_ACTIONS: NonNullable<VideoScene['cursor_actions']> = [
  { at: 0.06, x: 0.50, y: 0.09, type: 'move', frame_index: 0 },
  { at: 0.28, x: 0.24, y: 0.43, type: 'click', frame_index: 0 },
  { at: 0.48, x: 0.86, y: 0.72, type: 'scroll', frame_index: 1 },
  { at: 0.72, x: 0.30, y: 0.35, type: 'click', frame_index: 2 },
  { at: 0.92, x: 0.52, y: 0.42, type: 'highlight', frame_index: 2 },
];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export const GitHubWalkthroughScene: React.FC<GitHubWalkthroughSceneProps> = ({
  scene,
  subtitles = [],
  durationInFrames,
  sceneIndex = 1,
  totalScenes = 8,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const progress = clamp01(frame / Math.max(1, durationInFrames - 1));
  const frames = scene.github_capture_frames?.filter(Boolean) || [];
  const actions = (scene.cursor_actions?.length ? scene.cursor_actions : DEFAULT_ACTIONS)
    .slice()
    .sort((left, right) => left.at - right.at);

  const upcomingIndex = actions.findIndex((action) => progress <= action.at);
  const nextIndex = upcomingIndex === -1 ? actions.length - 1 : upcomingIndex;
  const previousIndex = Math.max(0, nextIndex - 1);
  const previousAction = actions[previousIndex] || DEFAULT_ACTIONS[0];
  const nextAction = actions[nextIndex] || previousAction;
  const segmentProgress = previousIndex === nextIndex
    ? 1
    : interpolate(progress, [previousAction.at, nextAction.at], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

  const latestAction = actions.reduce((latest, action) => (action.at <= progress ? action : latest), actions[0]);
  const activeFrameIndex = Math.max(0, Math.min(frames.length - 1, latestAction?.frame_index ?? 0));
  const frameChangeAt = latestAction?.at ?? 0;
  const frameOpacity = interpolate(progress, [frameChangeAt, frameChangeAt + 0.035], [0.45, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const cardWidth = width * 0.92;
  const cardHeight = Math.min(cardWidth * 1.4, height * 0.73);
  const cardLeft = (width - cardWidth) / 2;
  const cardTop = height * 0.055;
  const browserBarHeight = Math.max(44, height * 0.032);
  const screenshotHeight = cardHeight - browserBarHeight;
  const cursorX = cardLeft + interpolate(segmentProgress, [0, 1], [previousAction.x, nextAction.x]) * cardWidth;
  const cursorY = cardTop + browserBarHeight + interpolate(segmentProgress, [0, 1], [previousAction.y, nextAction.y]) * screenshotHeight;
  const clickDistance = Math.min(
    ...actions.filter((action) => action.type === 'click').map((action) => Math.abs(progress - action.at)),
    1,
  );
  const clickPulse = interpolate(clickDistance, [0, 0.045], [1, 0], { extrapolateRight: 'clamp' });
  const zoom = interpolate(progress, [0, 0.5, 1], [1, 1.025, 1.045], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const panY = interpolate(progress, [0, 1], [0, -18], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const entrance = spring({ frame, fps, config: { damping: 18, stiffness: 125 } });
  const fadeOut = interpolate(frame, [durationInFrames - fps * 0.35, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const repositoryLabel = scene.repository_url?.replace(/^https:\/\/github\.com\//, '') || 'repository source unavailable';

  return (
    <AbsoluteFill style={{ backgroundColor: '#05070b', opacity: fadeOut, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 18%, rgba(47,129,247,0.16), transparent 48%), #05070b' }} />

      <div
        style={{
          position: 'absolute',
          left: cardLeft,
          top: cardTop,
          width: cardWidth,
          height: cardHeight,
          borderRadius: 22,
          overflow: 'hidden',
          backgroundColor: '#0d1117',
          border: '1px solid rgba(240,246,252,0.2)',
          boxShadow: '0 34px 100px rgba(0,0,0,0.76), 0 0 48px rgba(47,129,247,0.12)',
          opacity: entrance,
          transform: `scale(${interpolate(entrance, [0, 1], [0.965, 1])})`,
        }}
      >
        <div style={{ height: browserBarHeight, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', background: '#161b22', borderBottom: '1px solid #30363d' }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((color) => <span key={color} style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: color }} />)}
          <div style={{ marginLeft: 7, flex: 1, borderRadius: 8, background: '#0d1117', border: '1px solid #30363d', color: '#c9d1d9', padding: '7px 12px', fontFamily: 'monospace', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            github.com/{repositoryLabel}
          </div>
          <span style={{ color: frames.length ? '#3fb950' : '#f85149', fontSize: 12, fontWeight: 800 }}>
            {frames.length ? '● LIVE CAPTURE' : '● SOURCE ERROR'}
          </span>
        </div>

        <div style={{ position: 'relative', height: screenshotHeight, overflow: 'hidden', background: '#0d1117' }}>
          {frames.length ? frames.map((src, index) => (
            <Img
              key={`${src.slice(0, 48)}-${index}`}
              src={src}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'top center',
                opacity: index === activeFrameIndex ? frameOpacity : 0,
                transform: `translateY(${panY}px) scale(${zoom})`,
                transformOrigin: progress < 0.5 ? '50% 22%' : '50% 58%',
              }}
            />
          )) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, color: '#f0f6fc', padding: 56, textAlign: 'center' }}>
              <div style={{ fontSize: 68 }}>⚠</div>
              <div style={{ fontSize: 30, fontWeight: 900 }}>Không capture được repository thật</div>
              <div style={{ color: '#8b949e', fontSize: 20, lineHeight: 1.5 }}>{scene.repository_url || 'Scene chưa có repository_url hợp lệ.'}</div>
              <div style={{ color: '#f85149', fontSize: 17 }}>Video không dùng giao diện GitHub giả lập.</div>
            </div>
          )}
        </div>
      </div>

      {frames.length > 0 && (
        <div style={{ position: 'absolute', left: cursorX, top: cursorY, zIndex: 60, transform: `translate(-3px, -3px) scale(${1 + clickPulse * 0.12})`, filter: 'drop-shadow(0 4px 5px rgba(0,0,0,0.75))' }}>
          {clickPulse > 0.01 && <div style={{ position: 'absolute', left: -20, top: -20, width: 44, height: 44, borderRadius: '50%', border: '4px solid rgba(47,129,247,0.95)', transform: `scale(${1 + clickPulse * 0.65})`, opacity: clickPulse }} />}
          <svg width="34" height="44" viewBox="0 0 34 44" aria-hidden="true">
            <path d="M3 2L3 34L12 26L19 41L25 38L18 24L31 23Z" fill="white" stroke="#111827" strokeWidth="2.4" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: height * 0.055, left: width * 0.04, right: width * 0.04, zIndex: 70 }}>
        <KaraokeSubtitle subtitles={subtitles} fallbackText={scene.voiceover_text} maxWordsWindow={7} />
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ height: '100%', width: `${((sceneIndex + progress) / totalScenes) * 100}%`, background: 'linear-gradient(90deg, #238636, #58a6ff)' }} />
      </div>
    </AbsoluteFill>
  );
};
