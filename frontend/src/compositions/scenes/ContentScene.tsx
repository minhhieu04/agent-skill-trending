import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { VideoScene, SubtitleEntry } from '../../types';
import { KenBurnsImage } from '../elements/KenBurnsImage';
import { FloatingParticles } from '../elements/FloatingParticles';
import { KaraokeSubtitle } from '../elements/KaraokeSubtitle';

interface ContentSceneProps {
  scene: VideoScene;
  sceneIndex: number;
  totalScenes: number;
  subtitles?: SubtitleEntry[];
  durationInFrames: number;
}

// Animated horizontal progress bar across bottom of screen
const VideoProgressBar: React.FC<{
  frame: number;
  durationInFrames: number;
  sceneIndex: number;
  totalScenes: number;
  fps: number;
}> = ({ frame, durationInFrames, sceneIndex, totalScenes, fps }) => {
  const globalProgress = (sceneIndex + frame / durationInFrames) / totalScenes;
  const barWidth = interpolate(globalProgress, [0, 1], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Glow pulse
  const glowPulse = interpolate(
    frame % Math.round(fps * 1.2),
    [0, Math.round(fps * 0.6), Math.round(fps * 1.2)],
    [0.8, 1.2, 0.8],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.08)', zIndex: 30 }}>
      <div style={{
        height: '100%',
        width: `${barWidth}%`,
        background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)',
        boxShadow: `0 0 ${8 * glowPulse}px rgba(139,92,246,0.8)`,
        transition: 'width 0.1s linear',
      }} />
    </div>
  );
};

// Animated bullet points that slide in one by one
const BulletPoints: React.FC<{
  points: string[];
  frame: number;
  fps: number;
  startFrame: number;
  isVertical: boolean;
}> = ({ points, frame, fps, startFrame, isVertical }) => {
  const framesPerBullet = Math.round(fps * 0.55);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {points.map((point, i) => {
        const bulletFrame = Math.max(0, frame - startFrame - i * framesPerBullet);
        const bulletSpring = spring({ frame: bulletFrame, fps, config: { damping: 16, stiffness: 160 } });
        const opacity = interpolate(bulletSpring, [0, 1], [0, 1]);
        const x = interpolate(bulletSpring, [0, 1], [-30, 0]);
        if (bulletFrame <= 0) return null;
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            opacity, transform: `translateX(${x}px)`,
          }}>
            <span style={{
              width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 900, color: '#fff',
              boxShadow: '0 2px 8px rgba(99,102,241,0.5)',
              marginTop: '2px',
            }}>
              {i + 1}
            </span>
            <span style={{
              fontSize: isVertical ? '13px' : '15px',
              fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4, flex: 1,
            }}>
              {point}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Sliding info panel from the side
const InfoPanel: React.FC<{
  label: string;
  value: string;
  icon: string;
  frame: number;
  fps: number;
  delay: number;
  fromLeft?: boolean;
  color: string;
  isVertical: boolean;
}> = ({ label, value, icon, frame, fps, delay, fromLeft = true, color, isVertical }) => {
  const s = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 18, stiffness: 140 } });
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const x = interpolate(s, [0, 1], [fromLeft ? -40 : 40, 0]);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: isVertical ? '8px 14px' : '10px 18px',
      borderRadius: '14px',
      background: 'rgba(15,23,42,0.85)',
      border: `1px solid ${color}40`,
      backdropFilter: 'blur(12px)',
      boxShadow: `0 4px 16px rgba(0,0,0,0.4), 0 0 8px ${color}20`,
      opacity,
      transform: `translateX(${x}px)`,
    }}>
      <span style={{ fontSize: isVertical ? '18px' : '22px' }}>{icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: isVertical ? '9px' : '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {label}
        </span>
        <span style={{ fontSize: isVertical ? '12px' : '14px', fontWeight: 800, color: color, lineHeight: 1.2 }}>
          {value}
        </span>
      </div>
    </div>
  );
};

// Lower-third news-ticker style label
const LowerThird: React.FC<{
  text: string;
  frame: number;
  fps: number;
  isVertical: boolean;
}> = ({ text, frame, fps, isVertical }) => {
  const s = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 20, stiffness: 200 } });
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const x = interpolate(s, [0, 1], [-60, 0]);
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '0',
      opacity, transform: `translateX(${x}px)`,
    }}>
      <div style={{
        padding: '5px 14px',
        background: 'linear-gradient(90deg, #6366f1, #a855f7)',
        borderRadius: '8px 0 0 8px',
        fontSize: isVertical ? '10px' : '12px',
        fontWeight: 900, color: '#fff', letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>
        ⚡ HOT
      </div>
      <div style={{
        padding: '5px 16px',
        background: 'rgba(15,23,42,0.9)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderLeft: 'none',
        borderRadius: '0 8px 8px 0',
        fontSize: isVertical ? '11px' : '13px',
        fontWeight: 700, color: '#a5b4fc',
      }}>
        {text}
      </div>
    </div>
  );
};

export const ContentScene: React.FC<ContentSceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  subtitles = [],
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const directions: ('zoom-in' | 'pan-left' | 'zoom-out' | 'pan-right')[] = [
    'zoom-in', 'pan-left', 'zoom-out', 'pan-right',
  ];
  const direction = directions[sceneIndex % directions.length];

  // Header entrance
  const headerSpring = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const headerOpacity = interpolate(headerSpring, [0, 1], [0, 1]);
  const headerY = interpolate(headerSpring, [0, 1], [-20, 0]);

  // Main card entrance
  const cardSpring = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 15, stiffness: 140 } });
  const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
  const cardY = interpolate(cardSpring, [0, 1], [35, 0]);

  // Fade out near end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - Math.round(fps * 0.6), durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Parse visual_description into bullet points (split by . or | or \n)
  const rawDesc = scene.visual_description || '';
  const bulletPoints = rawDesc
    .split(/[.\n|]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10)
    .slice(0, 4);

  // Info panels data based on scene index variety
  const infoPanels = [
    { label: 'Trend', value: `#${(sceneIndex + 1) * 7 + 3} GitHub`, icon: '🔥', color: '#f59e0b', delay: 18 },
    { label: 'Type', value: scene.title.split(' ').slice(-1)[0] || 'Feature', icon: '🧠', color: '#6ee7b7', delay: 26 },
  ];

  const accentColors = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];
  const accent = accentColors[sceneIndex % accentColors.length];

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#090d16', opacity: fadeOut }}>
      {/* Ken Burns background */}
      <KenBurnsImage src={scene.image_url} direction={direction} durationInFrames={durationInFrames} alt={scene.title} />

      {/* Floating particles */}
      <FloatingParticles count={18} />

      {/* Deep gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(9,13,22,0.55) 0%, rgba(9,13,22,0.2) 40%, rgba(9,13,22,0.85) 100%)',
      }} />

      {/* Left edge accent line */}
      <div style={{
        position: 'absolute', left: 0, top: '10%', bottom: '15%', width: '3px',
        background: `linear-gradient(180deg, transparent, ${accent}, transparent)`,
        opacity: cardOpacity,
        boxShadow: `0 0 12px ${accent}`,
      }} />

      {/* ── TOP HEADER STRIP ── */}
      <div style={{
        position: 'absolute', top: isVertical ? '4%' : '5%',
        left: '4%', right: '4%',
        opacity: headerOpacity, transform: `translateY(${headerY}px)`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 15,
      }}>
        {/* Scene counter pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 14px', borderRadius: '9999px',
          background: 'rgba(15,23,42,0.88)',
          border: `1px solid ${accent}50`,
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accent, boxShadow: `0 0 6px ${accent}` }} />
          <span style={{ color: '#a5b4fc', fontSize: isVertical ? '10px' : '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Scene {String(sceneIndex + 1).padStart(2, '0')} / {String(totalScenes).padStart(2, '0')}
          </span>
        </div>

        {/* Lower-third tag */}
        <LowerThird text="Agent Skills Trending" frame={frame} fps={fps} isVertical={isVertical} />
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div style={{
        position: 'absolute',
        top: isVertical ? '14%' : '16%',
        left: '4%', right: '4%',
        opacity: cardOpacity,
        transform: `translateY(${cardY}px)`,
        display: 'flex', flexDirection: 'column', gap: isVertical ? '10px' : '14px',
        zIndex: 10,
      }}>
        {/* TITLE with accent bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '4px 12px', borderRadius: '6px',
            background: `${accent}18`, border: `1px solid ${accent}40`,
            alignSelf: 'flex-start',
          }}>
            <span style={{ color: accent, fontSize: isVertical ? '9px' : '11px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              KEY INSIGHT
            </span>
          </div>
          <h2 style={{
            margin: 0,
            fontSize: isVertical ? '22px' : '32px',
            fontWeight: 900,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            background: `linear-gradient(135deg, #fff 30%, ${accent})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: 'none',
          }}>
            {scene.title}
          </h2>
        </div>

        {/* GLASS CARD with bullet points */}
        <div style={{
          padding: isVertical ? '16px 18px' : '20px 24px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(24,33,56,0.8))',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 48px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {bulletPoints.length > 1 ? (
            <BulletPoints
              points={bulletPoints}
              frame={frame}
              fps={fps}
              startFrame={10}
              isVertical={isVertical}
            />
          ) : (
            <p style={{
              margin: 0,
              fontSize: isVertical ? '13px' : '17px',
              fontWeight: 600,
              color: '#cbd5e1',
              lineHeight: 1.55,
            }}>
              {scene.visual_description}
            </p>
          )}

          {/* Code snippet inline */}
          {scene.code_snippet && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(2,6,23,0.95)',
              border: '1px solid rgba(56,189,248,0.2)',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: isVertical ? '10px' : '13px',
              color: '#7dd3fc',
              lineHeight: 1.6,
              whiteSpace: 'pre',
              overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', gap: '5px', marginBottom: '6px' }}>
                {['#ef4444', '#f59e0b', '#10b981'].map((c, i) => (
                  <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: c }} />
                ))}
              </div>
              {scene.code_snippet.split('\n').slice(0, isVertical ? 4 : 6).join('\n')}
            </div>
          )}
        </div>

        {/* INFO PANELS row */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {infoPanels.map((panel, i) => (
            <InfoPanel
              key={i}
              label={panel.label}
              value={panel.value}
              icon={panel.icon}
              frame={frame}
              fps={fps}
              delay={panel.delay}
              fromLeft={i % 2 === 0}
              color={panel.color}
              isVertical={isVertical}
            />
          ))}
          {/* Duration badge */}
          <InfoPanel
            label="Thời lượng"
            value={`${scene.duration_seconds}s`}
            icon="⏱️"
            frame={frame}
            fps={fps}
            delay={34}
            fromLeft={false}
            color="#94a3b8"
            isVertical={isVertical}
          />
        </div>
      </div>

      {/* ── KARAOKE SUBTITLES ── */}
      <div style={{
        position: 'absolute',
        bottom: isVertical ? '8%' : '10%',
        left: '3%', right: '3%',
        zIndex: 20,
      }}>
        <KaraokeSubtitle subtitles={subtitles} fallbackText={scene.voiceover_text} />
      </div>

      {/* ── PROGRESS BAR ── */}
      <VideoProgressBar
        frame={frame}
        durationInFrames={durationInFrames}
        sceneIndex={sceneIndex}
        totalScenes={totalScenes}
        fps={fps}
      />
    </AbsoluteFill>
  );
};
