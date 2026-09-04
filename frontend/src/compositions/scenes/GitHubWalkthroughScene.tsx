import React from 'react';
import { AbsoluteFill, Img, Video, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
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
  { at: 0.03, x: 0.50, y: 0.10, type: 'move', frame_index: 0, label: 'Repository overview' },
  { at: 0.18, x: 0.24, y: 0.43, type: 'move', frame_index: 0, label: 'Locate README.md' },
  { at: 0.27, x: 0.24, y: 0.43, type: 'click', frame_index: 0, label: 'Open README.md' },
  { at: 0.34, x: 0.50, y: 0.20, type: 'move', frame_index: 1, label: 'Read source documentation' },
  { at: 0.56, x: 0.86, y: 0.72, type: 'scroll', frame_index: 1, label: 'Review setup and usage' },
  { at: 0.72, x: 0.30, y: 0.35, type: 'click', frame_index: 2, label: 'Open SKILL.md' },
  { at: 0.92, x: 0.52, y: 0.42, type: 'highlight', frame_index: 2, label: 'Verified source content' },
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
  const recordedVideo = scene.github_capture_video;
  const actions = (scene.cursor_actions?.length ? scene.cursor_actions : DEFAULT_ACTIONS)
    .slice()
    .sort((left, right) => left.at - right.at);

  const upcomingIndex = actions.findIndex((action) => progress < action.at);
  const previousIndex = upcomingIndex <= 0
    ? 0
    : upcomingIndex === -1 ? actions.length - 1 : upcomingIndex - 1;
  const nextIndex = upcomingIndex === -1 ? previousIndex : upcomingIndex;
  const previousAction = actions[previousIndex] || DEFAULT_ACTIONS[0];
  const nextAction = actions[nextIndex] || previousAction;
  const sameCapturedFrame = (previousAction.frame_index ?? 0) === (nextAction.frame_index ?? 0);
  const segmentProgress = previousIndex === nextIndex || !sameCapturedFrame
    ? 1
    : interpolate(progress, [previousAction.at, nextAction.at], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  const latestAction = previousAction;
  const activeFrameIndex = Math.max(0, Math.min(frames.length - 1, latestAction.frame_index ?? 0));
  const frameChangeAt = latestAction.at;
  const frameOpacity = interpolate(progress, [frameChangeAt, frameChangeAt + 0.035], [0.45, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const cardWidth = width * 0.91;
  const captureViewport = scene.github_capture_viewport || { width: 1000, height: 1400 };
  const browserBarHeight = Math.max(44, height * 0.032);
  const screenshotHeight = Math.min(cardWidth * 1.4, height * 0.70);
  const cardHeight = screenshotHeight + browserBarHeight;
  const cardLeft = (width - cardWidth) / 2;
  const cardTop = height * 0.035;
  const captureAspect = captureViewport.width / Math.max(1, captureViewport.height);
  const panelAspect = cardWidth / Math.max(1, screenshotHeight);
  const useCoverLayout = Math.abs(captureAspect - panelAspect) > 0.32;
  const imageScale = useCoverLayout
    ? Math.max(cardWidth / captureViewport.width, screenshotHeight / captureViewport.height)
    : Math.min(cardWidth / captureViewport.width, screenshotHeight / captureViewport.height);
  const renderedImageWidth = captureViewport.width * imageScale;
  const renderedImageHeight = captureViewport.height * imageScale;
  const imageOffsetX = (cardWidth - renderedImageWidth) / 2;
  const imageOffsetY = (screenshotHeight - renderedImageHeight) / 2;
  const cursorProgress = sameCapturedFrame ? segmentProgress : 0;
  const normalizedCursorX = interpolate(cursorProgress, [0, 1], [previousAction.x, nextAction.x]);
  const normalizedCursorY = interpolate(cursorProgress, [0, 1], [previousAction.y, nextAction.y]);
  const cursorX = cardLeft + imageOffsetX + normalizedCursorX * renderedImageWidth;
  const cursorY = cardTop + browserBarHeight + imageOffsetY + normalizedCursorY * renderedImageHeight;
  const clickDistance = Math.min(
    ...actions.filter((action) => action.type === 'click').map((action) => Math.abs(progress - action.at)),
    1,
  );
  const clickPulse = interpolate(clickDistance, [0, 0.045], [1, 0], { extrapolateRight: 'clamp' });
  const entrance = spring({ frame, fps, config: { damping: 18, stiffness: 125 } });
  const fadeOut = interpolate(frame, [durationInFrames - fps * 0.35, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const repositoryLabel = scene.repository_url?.replace(/^https:\/\/github\.com\//, '') || 'repository source unavailable';
  const sceneDurationSeconds = durationInFrames / fps;
  const recordedDurationSeconds = Math.max(0.1, scene.github_capture_duration_seconds || sceneDurationSeconds);
  const playbackRate = Math.max(0.5, Math.min(4, recordedDurationSeconds / Math.max(0.1, sceneDurationSeconds)));
  const hasCapture = Boolean(recordedVideo || frames.length);

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
            {hasCapture
              ? (recordedVideo
                ? `● RECORDED${scene.github_capture_source_revision ? ` @ ${scene.github_capture_source_revision.slice(0, 7)}` : ' SOURCE'}`
                : '● CAPTURE FALLBACK')
              : '● SOURCE ERROR'}
          </span>
        </div>

        <div style={{ position: 'relative', height: screenshotHeight, overflow: 'hidden', background: '#0d1117' }}>
          {recordedVideo ? (
            <Video
              src={recordedVideo}
              muted
              playbackRate={playbackRate}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : frames.length ? frames.map((src, index) => (
            <Img
              key={`${src.slice(0, 48)}-${index}`}
              src={src}
              style={{
                position: 'absolute',
                left: imageOffsetX,
                top: imageOffsetY,
                width: renderedImageWidth,
                height: renderedImageHeight,
                objectFit: 'fill',
                opacity: index === activeFrameIndex ? frameOpacity : 0,
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

      {frames.length > 0 && !recordedVideo && (
        <div style={{ position: 'absolute', left: cursorX, top: cursorY, zIndex: 60, transform: `translate(-3px, -3px) scale(${1 + clickPulse * 0.12})`, filter: 'drop-shadow(0 4px 5px rgba(0,0,0,0.75))' }}>
          {clickPulse > 0.01 && <div style={{ position: 'absolute', left: -20, top: -20, width: 44, height: 44, borderRadius: '50%', border: '4px solid rgba(47,129,247,0.95)', transform: `scale(${1 + clickPulse * 0.65})`, opacity: clickPulse }} />}
          <svg width="34" height="44" viewBox="0 0 34 44" aria-hidden="true">
            <path d="M3 2L3 34L12 26L19 41L25 38L18 24L31 23Z" fill="white" stroke="#111827" strokeWidth="2.4" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {hasCapture && latestAction.label && (
        <div style={{
          position: 'absolute',
          top: cardTop + cardHeight + 18,
          left: width * 0.07,
          right: width * 0.07,
          zIndex: 65,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '12px 18px',
          borderRadius: 16,
          color: '#e6edf3',
          background: 'rgba(13,17,23,0.92)',
          border: '1px solid rgba(88,166,255,0.38)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.46)',
          fontSize: 17,
          fontWeight: 850,
        }}>
          <span style={{ color: '#58a6ff', fontFamily: 'monospace', fontSize: 14 }}>
            {String(previousIndex + 1).padStart(2, '0')} / {String(actions.length).padStart(2, '0')}
          </span>
          <span style={{ flex: 1 }}>{latestAction.label}</span>
          <span style={{ color: '#3fb950', fontSize: 13 }}>{recordedVideo ? 'REAL BROWSER CLIP' : 'CAPTURE FALLBACK'}</span>
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
