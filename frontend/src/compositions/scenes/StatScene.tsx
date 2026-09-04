import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { VideoScene, SubtitleEntry } from '../../types';
import { KenBurnsImage } from '../elements/KenBurnsImage';
import { FloatingParticles } from '../elements/FloatingParticles';
import { KaraokeSubtitle } from '../elements/KaraokeSubtitle';

interface StatSceneProps {
  scene: VideoScene;
  subtitles?: SubtitleEntry[];
  durationInFrames: number;
  sceneIndex?: number;
  totalScenes?: number;
}

const AnimatedCounter: React.FC<{
  value: number;
  frame: number;
  fps: number;
  startFrame: number;
}> = ({ value, frame, fps, startFrame }) => {
  const progress = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: { damping: 18, stiffness: 85, mass: 1.1 },
  });
  const displayValue = Math.round(
    interpolate(progress, [0, 1], [0, value], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  return <>{displayValue.toLocaleString()}</>;
};

export const StatScene: React.FC<StatSceneProps> = ({
  scene,
  subtitles = [],
  durationInFrames,
  sceneIndex = 1,
  totalScenes = 5,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  // Header entrance
  const headerSpring = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const headerOpacity = interpolate(headerSpring, [0, 1], [0, 1]);
  const headerY = interpolate(headerSpring, [0, 1], [-20, 0]);

  // Main card entrance
  const containerSpring = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const containerOpacity = interpolate(containerSpring, [0, 1], [0, 1]);
  const containerY = interpolate(containerSpring, [0, 1], [30, 0]);

  // Meter fill animations (growth bar)
  const meterSpring = spring({
    frame: Math.max(0, frame - 25),
    fps,
    config: { damping: 20, stiffness: 60 },
  });
  const meterWidth = interpolate(meterSpring, [0, 1], [0, 94], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const fadeOut = interpolate(
    frame,
    [durationInFrames - Math.round(fps * 0.6), durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const stats = [
    {
      label: 'GitHub Stars',
      value: scene.stars_count || 4280,
      icon: '⭐',
      color: '#fbbf24',
      badge: '+420% MoM',
      bg: 'rgba(245,158,11,0.12)',
      border: 'rgba(245,158,11,0.4)',
    },
    {
      label: 'Forks & Clones',
      value: scene.forks_count || 340,
      icon: '🍴',
      color: '#a5b4fc',
      badge: 'Active Fork',
      bg: 'rgba(99,102,241,0.12)',
      border: 'rgba(99,102,241,0.4)',
    },
    {
      label: 'Contributors',
      value: scene.contributors || 48,
      icon: '👥',
      color: '#6ee7b7',
      badge: 'Worldwide',
      bg: 'rgba(16,185,129,0.12)',
      border: 'rgba(16,185,129,0.4)',
    },
  ];

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#090d16', opacity: fadeOut }}>
      <KenBurnsImage src={scene.image_url} direction="zoom-out" durationInFrames={durationInFrames} alt={scene.title} />
      <FloatingParticles count={18} />

      {/* Dynamic gradient background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(9,13,22,0.65) 0%, rgba(9,13,22,0.3) 40%, rgba(9,13,22,0.92) 100%)',
      }} />

      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: '10%', bottom: '15%', width: '3px',
        background: 'linear-gradient(180deg, transparent, #fbbf24, transparent)',
        opacity: containerOpacity,
        boxShadow: '0 0 12px #fbbf24',
      }} />

      {/* ── TOP HEADER STRIP ── */}
      <div style={{
        position: 'absolute', top: isVertical ? '4%' : '5%',
        left: '4%', right: '4%',
        opacity: headerOpacity, transform: `translateY(${headerY}px)`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 15,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 14px', borderRadius: '9999px',
          background: 'rgba(15,23,42,0.88)',
          border: '1px solid rgba(251,191,36,0.4)',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 6px #fbbf24' }} />
          <span style={{ color: '#fbbf24', fontSize: isVertical ? '10px' : '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            METRICS & BENCHMARK
          </span>
        </div>

        <div style={{
          padding: '5px 14px',
          borderRadius: '9999px',
          background: 'rgba(16,185,129,0.15)',
          border: '1px solid rgba(16,185,129,0.4)',
          color: '#6ee7b7',
          fontSize: isVertical ? '11px' : '13px',
          fontWeight: 800,
        }}>
          ⚡ Trending Velocity: 9.8/10
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{
        position: 'absolute',
        top: isVertical ? '13%' : '15%',
        left: '4%', right: '4%',
        transform: `translateY(${containerY}px)`,
        opacity: containerOpacity,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: isVertical ? '14px' : '18px',
        zIndex: 10,
      }}>
        {/* Title */}
        <h2 style={{
          margin: 0,
          fontSize: isVertical ? '24px' : '34px',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #fff 40%, #fbbf24)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
          letterSpacing: '-0.02em',
        }}>
          {scene.title}
        </h2>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isVertical ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
          gap: isVertical ? '8px' : '14px',
          width: '100%',
        }}>
          {stats.map((stat, i) => {
            const cardSlide = spring({
              frame: Math.max(0, frame - 10 - i * 5),
              fps,
              config: { damping: 15, stiffness: 140 },
            });
            const cardY = interpolate(cardSlide, [0, 1], [30, 0]);
            const cardOp = interpolate(cardSlide, [0, 1], [0, 1]);

            return (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                padding: isVertical ? '14px 10px' : '18px 16px',
                borderRadius: '18px', background: stat.bg,
                border: `1px solid ${stat.border}`,
                boxShadow: '0 12px 32px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)',
                backdropFilter: 'blur(16px)',
                opacity: cardOp,
                transform: `translateY(${cardY}px)`,
              }}>
                <span style={{ fontSize: isVertical ? '22px' : '28px' }}>{stat.icon}</span>
                <span style={{
                  fontSize: isVertical ? '20px' : '30px',
                  fontWeight: 900, color: stat.color, fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1.1,
                }}>
                  <AnimatedCounter value={stat.value} frame={frame} fps={fps} startFrame={i * 8 + 12} />
                </span>
                <span style={{
                  fontSize: isVertical ? '9px' : '11px',
                  fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em',
                  textAlign: 'center',
                }}>
                  {stat.label}
                </span>
                <span style={{
                  padding: '2px 8px', borderRadius: '6px',
                  background: 'rgba(255,255,255,0.06)',
                  fontSize: isVertical ? '8px' : '10px',
                  fontWeight: 800, color: stat.color,
                }}>
                  {stat.badge}
                </span>
              </div>
            );
          })}
        </div>

        {/* Growth Meter / Radar Box */}
        <div style={{
          width: '100%',
          padding: isVertical ? '12px 16px' : '16px 20px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(24,33,56,0.8))',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 12px 28px rgba(0,0,0,0.4)',
          display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: isVertical ? '11px' : '13px', fontWeight: 800, color: '#e2e8f0' }}>
              🚀 Tốc độ tăng trưởng so với thị trường
            </span>
            <span style={{ fontSize: isVertical ? '12px' : '14px', fontWeight: 900, color: '#38bdf8' }}>
              Top 1% Global
            </span>
          </div>
          {/* Animated fill bar */}
          <div style={{ height: '8px', borderRadius: '9999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${meterWidth}%`,
              borderRadius: '9999px',
              background: 'linear-gradient(90deg, #38bdf8, #818cf8, #fbbf24)',
              boxShadow: '0 0 10px rgba(56,189,248,0.7)',
            }} />
          </div>
        </div>

        {/* Voiceover description text */}
        <p style={{
          margin: 0,
          fontSize: isVertical ? '12px' : '15px',
          fontWeight: 600, color: '#cbd5e1', textAlign: 'center', lineHeight: 1.5,
          maxWidth: '680px',
        }}>
          {scene.visual_description}
        </p>
      </div>

      {/* ── KARAOKE SUBTITLES ── */}
      <div style={{
        position: 'absolute',
        bottom: isVertical ? '7%' : '9%',
        left: '3%', right: '3%',
        zIndex: 20,
      }}>
        <KaraokeSubtitle subtitles={subtitles} fallbackText={scene.voiceover_text} />
      </div>

      {/* ── BOTTOM PROGRESS BAR ── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.08)', zIndex: 30 }}>
        <div style={{
          height: '100%',
          width: `${((sceneIndex + interpolate(frame, [0, durationInFrames], [0, 1])) / totalScenes) * 100}%`,
          background: 'linear-gradient(90deg, #6366f1, #fbbf24)',
          boxShadow: '0 0 8px rgba(251,191,36,0.8)',
        }} />
      </div>
    </AbsoluteFill>
  );
};
