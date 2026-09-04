import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { VideoScene, SubtitleEntry } from '../../types';
import { KenBurnsImage } from '../elements/KenBurnsImage';
import { FloatingParticles } from '../elements/FloatingParticles';
import { KaraokeSubtitle } from '../elements/KaraokeSubtitle';

interface OutroSceneProps {
  scene: VideoScene;
  subtitles?: SubtitleEntry[];
  skillTitle: string;
  durationInFrames: number;
}

// Staggered CTA item
const CTAItem: React.FC<{
  icon: string; label: string; sub: string;
  frame: number; fps: number; delay: number;
  color: string; isVertical: boolean;
}> = ({ icon, label, sub, frame, fps, delay, color, isVertical }) => {
  const s = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 16, stiffness: 150 } });
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const y = interpolate(s, [0, 1], [30, 0]);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: isVertical ? '12px 16px' : '14px 20px',
      borderRadius: '16px',
      background: `linear-gradient(135deg, ${color}15, ${color}08)`,
      border: `1px solid ${color}35`,
      boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 12px ${color}20`,
      backdropFilter: 'blur(12px)',
      opacity, transform: `translateY(${y}px)`,
      flex: 1, minWidth: isVertical ? '120px' : '150px',
    }}>
      <span style={{ fontSize: isVertical ? '24px' : '30px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: isVertical ? '12px' : '15px', fontWeight: 800, color: '#fff' }}>{label}</div>
        <div style={{ fontSize: isVertical ? '10px' : '12px', fontWeight: 600, color: color, letterSpacing: '0.05em' }}>{sub}</div>
      </div>
    </div>
  );
};

export const OutroScene: React.FC<OutroSceneProps> = ({
  scene, subtitles = [], skillTitle, durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const iconSpring = spring({ frame, fps, config: { damping: 10, mass: 0.5, stiffness: 170 } });
  const iconScale = interpolate(iconSpring, [0, 1], [0.5, 1]);
  const iconOpacity = interpolate(iconSpring, [0, 1], [0, 1]);

  const titleSpring = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 14, stiffness: 130 } });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  // Rocket pulse animation (no CSS animation)
  const rocketFloat = interpolate(
    frame % Math.round(fps * 1.8),
    [0, Math.round(fps * 0.9), Math.round(fps * 1.8)],
    [0, -8, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // CTA button glow pulse
  const glowPulse = interpolate(
    frame % Math.round(fps * 1.5),
    [0, Math.round(fps * 0.75), Math.round(fps * 1.5)],
    [0.6, 1, 0.6],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const fadeOut = interpolate(
    frame,
    [durationInFrames - Math.round(fps * 0.8), durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const ctaItems = [
    { icon: '🔎', label: 'Read Source', sub: 'Repository', color: '#fbbf24', delay: 20 },
    { icon: '📖', label: 'Inspect Setup', sub: 'README', color: '#a78bfa', delay: 30 },
    { icon: '🧪', label: 'Test Safely', sub: 'Sandbox First', color: '#34d399', delay: 40 },
  ];

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#090d16', opacity: fadeOut }}>
      <KenBurnsImage src={scene.image_url} direction="zoom-out" durationInFrames={durationInFrames} alt="Outro" />
      <FloatingParticles count={28} />

      {/* Radial glow in center */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(99,102,241,0.18) 0%, rgba(9,13,22,0.95) 70%)',
      }} />

      {/* ── Floating rocket icon ── */}
      <div style={{
        position: 'absolute',
        top: isVertical ? '8%' : '10%',
        left: '50%',
        transform: `translateX(-50%) translateY(${rocketFloat}px) scale(${iconScale})`,
        opacity: iconOpacity,
        fontSize: isVertical ? '48px' : '64px',
        filter: 'drop-shadow(0 8px 24px rgba(99,102,241,0.6))',
      }}>
        🚀
      </div>

      {/* ── Main content ── */}
      <div style={{
        position: 'absolute',
        top: isVertical ? '28%' : '26%',
        left: '5%', right: '5%',
        opacity: titleOpacity,
        transform: `translateY(${titleY}px)`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center',
        gap: isVertical ? '14px' : '18px',
        zIndex: 10,
      }}>
        {/* Title gradient */}
        <h2 style={{
          margin: 0,
          fontSize: isVertical ? '26px' : '38px',
          fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #fff 20%, #a78bfa 60%, #ec4899)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {scene.title || `Khám Phá ${skillTitle}`}
        </h2>

        {/* Subtitle */}
        <p style={{
          margin: 0, fontSize: isVertical ? '13px' : '17px',
          fontWeight: 600, color: '#94a3b8', lineHeight: 1.55, maxWidth: '600px',
        }}>
          {scene.voiceover_text || `Truy cập Agent Skill Trending — nơi cập nhật các AI skill trending mỗi tuần cho developer.`}
        </p>

        {/* CTA items row */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
          {ctaItems.map((item, i) => (
            <CTAItem key={i} {...item} frame={frame} fps={fps} isVertical={isVertical} />
          ))}
        </div>

        {/* Main CTA button */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          padding: isVertical ? '14px 28px' : '16px 36px',
          borderRadius: '18px',
          background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)',
          boxShadow: `0 12px 36px rgba(99,102,241,${glowPulse * 0.5}), 0 0 ${16 * glowPulse}px rgba(168,85,247,0.4)`,
          fontSize: isVertical ? '14px' : '18px', fontWeight: 900, color: '#fff',
          letterSpacing: '0.03em',
          opacity: interpolate(spring({ frame: Math.max(0, frame - 50), fps }), [0, 1], [0, 1]),
          transform: `translateY(${interpolate(spring({ frame: Math.max(0, frame - 50), fps }), [0, 1], [20, 0])}px)`,
        }}>
          <span>⚡ Agent Skill Trending</span>
        </div>
      </div>

      {/* Karaoke */}
      <div style={{ position: 'absolute', bottom: isVertical ? '6%' : '8%', left: 0, right: 0, zIndex: 20 }}>
        <KaraokeSubtitle subtitles={subtitles} fallbackText={scene.voiceover_text} />
      </div>

      {/* Progress bar (full) */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)', zIndex: 30 }} />
    </AbsoluteFill>
  );
};
