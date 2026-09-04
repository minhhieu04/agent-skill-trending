import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SubtitleEntry } from '../../types';

interface KaraokeSubtitleProps {
  subtitles?: SubtitleEntry[];
  fallbackText?: string;
  maxWordsWindow?: number;
  containerStyle?: React.CSSProperties;
  showCaptions?: boolean;
}

export const KaraokeSubtitle: React.FC<KaraokeSubtitleProps> = ({
  subtitles = [],
  fallbackText,
  maxWordsWindow = 7,
  containerStyle,
  showCaptions = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const isLarge = width > 900;

  const currentMs = (frame / fps) * 1000;
  let activeIndex = subtitles.findIndex(subtitle => currentMs >= subtitle.start_ms && currentMs < subtitle.end_ms);
  if (activeIndex < 0 && subtitles.length > 0) {
    activeIndex = 0;
    for (let index = 0; index < subtitles.length; index += 1) {
      if (currentMs >= subtitles[index].start_ms) activeIndex = index;
    }
  }
  const halfWindow = Math.floor(maxWordsWindow / 2);
  const windowStart = Math.max(0, Math.min(activeIndex - halfWindow, Math.max(0, subtitles.length - maxWordsWindow)));
  const visibleSubtitles = subtitles.slice(windowStart, windowStart + maxWordsWindow);
  const fallbackWords = (fallbackText || '').split(/\s+/).filter(Boolean).slice(0, maxWordsWindow);
  const activeSubtitle = subtitles[activeIndex];
  const activeWordProgress = activeSubtitle
    ? interpolate(
      currentMs,
      [activeSubtitle.start_ms, Math.max(activeSubtitle.start_ms + 1, activeSubtitle.end_ms)],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    )
    : 0;
  const activeWordFrame = activeSubtitle ? Math.round((activeSubtitle.start_ms / 1000) * fps) : 0;
  const wordSpring = spring({
    frame: Math.max(0, frame - activeWordFrame),
    fps,
    config: { damping: 12, stiffness: 220 },
  });

  // Smooth entrance spring for the caption card
  const entranceSpring = spring({
    frame: Math.max(0, frame - 3),
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const opacity = interpolate(entranceSpring, [0, 1], [0, 1]);
  const translateY = interpolate(entranceSpring, [0, 1], [15, 0]);

  if (!showCaptions || (visibleSubtitles.length === 0 && fallbackWords.length === 0)) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: isLarge ? '12px 28px' : '10px 18px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(11, 17, 33, 0.88), rgba(15, 23, 42, 0.92))',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255,255,255,0.15)',
        maxWidth: '92%',
        margin: '0 auto',
        opacity,
        transform: `translateY(${translateY}px)`,
        ...containerStyle,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', lineHeight: 1.45 }}>
        {(visibleSubtitles.length > 0 ? visibleSubtitles.map(item => item.text) : fallbackWords).map((word, index) => {
          const absoluteIndex = windowStart + index;
          const isActive = visibleSubtitles.length > 0 && absoluteIndex === activeIndex;
          const isPhraseCaption = visibleSubtitles.length === 1 && word.trim().includes(' ');
          const cleanWord = word.replace(/[^a-zA-Z0-9à-ỹÀ-Ỹ%]/g, '');
          const isKeyword = /\d+/.test(cleanWord) || /^(AI|LLM|MCP|CLI|IDE|API|GitHub|TypeScript|Python|Agent|Skill|Subagent|Cursor|Claude|Gemini)$/i.test(cleanWord);
          return (
            <span
              key={`${absoluteIndex}-${word}`}
              style={{
                display: 'inline-block',
                position: 'relative',
                marginRight: '6px',
                marginBottom: '2px',
                padding: isActive && !isPhraseCaption ? '1px 5px 2px' : 0,
                borderRadius: 7,
                background: isActive && !isPhraseCaption ? 'rgba(250, 204, 21, 0.16)' : 'transparent',
                fontWeight: isPhraseCaption ? 750 : isActive || isKeyword ? 900 : 700,
                color: isPhraseCaption ? '#f8fafc' : isActive ? '#fde047' : isKeyword ? '#7dd3fc' : '#f8fafc',
                textShadow: isActive && !isPhraseCaption
                  ? '0 0 18px rgba(253,224,71,0.75), 0 2px 6px rgba(0,0,0,0.9)'
                  : '0 2px 6px rgba(0,0,0,0.9)',
                fontSize: isPhraseCaption
                  ? (isLarge ? '17px' : '12px')
                  : isLarge ? (isActive ? '21px' : '18px') : (isActive ? '15px' : '13px'),
                letterSpacing: '0.01em',
                transform: isActive && !isPhraseCaption ? `scale(${interpolate(wordSpring, [0, 1], [0.86, 1.08])})` : 'scale(1)',
              }}
            >
              {word}
              {isActive && !isPhraseCaption && (
                <span style={{
                  position: 'absolute',
                  left: 4,
                  right: 4,
                  bottom: -3,
                  height: 3,
                  borderRadius: 99,
                  background: 'rgba(255,255,255,0.2)',
                  overflow: 'hidden',
                }}>
                  <span style={{
                    display: 'block',
                    width: `${activeWordProgress * 100}%`,
                    height: '100%',
                    borderRadius: 99,
                    background: 'linear-gradient(90deg, #facc15, #fff7a8)',
                    boxShadow: '0 0 9px rgba(250,204,21,0.9)',
                  }} />
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
};
