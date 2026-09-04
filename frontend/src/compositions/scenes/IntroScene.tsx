import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { VideoScene, SubtitleEntry } from '../../types';
import { KenBurnsImage } from '../elements/KenBurnsImage';
import { FloatingParticles } from '../elements/FloatingParticles';
import { KaraokeSubtitle } from '../elements/KaraokeSubtitle';
import { AnimatedText } from '../elements/AnimatedText';

interface IntroSceneProps {
  scene: VideoScene;
  subtitles?: SubtitleEntry[];
  skillTitle: string;
  skillStats?: { stars?: number; forks?: number; language?: string };
  durationInFrames: number;
  totalScenes?: number;
}

export const IntroScene: React.FC<IntroSceneProps> = ({
  scene,
  subtitles = [],
  skillTitle,
  skillStats,
  durationInFrames,
  totalScenes = 5,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  // Badge Spring Animation
  const badgeSpring = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.5, stiffness: 150 },
  });
  const badgeOpacity = interpolate(badgeSpring, [0, 1], [0, 1]);
  const badgeScale = interpolate(badgeSpring, [0, 1], [0.8, 1]);

  // Skill Card Entrance (delayed 6 frames)
  const cardSpring = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 14, mass: 0.6, stiffness: 130 },
  });
  const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
  const cardTranslateY = interpolate(cardSpring, [0, 1], [40, 0]);

  // Stat Badges Entrance (delayed 15 frames)
  const statsSpring = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 13, mass: 0.5, stiffness: 140 },
  });
  const statsOpacity = interpolate(statsSpring, [0, 1], [0, 1]);
  const statsScale = interpolate(statsSpring, [0, 1], [0.85, 1]);

  // Pulsing fire emoji
  const pulseOpacity = interpolate(
    frame % Math.round(fps * 1.4),
    [0, Math.round(fps * 0.7), Math.round(fps * 1.4)],
    [1, 0.45, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Typewriter effect: show trending tags one by one
  const tags = ['📦 Real Repository', '📖 README', '⌨️ Source Demo', '🔎 Verification', '🛡️ Safety Review'];
  const tagRevealFrame = Math.round(fps * 0.4);
  const visibleTagCount = Math.min(tags.length, Math.floor(Math.max(0, frame - 20) / tagRevealFrame) + 1);

  // Side badge slide-in
  const sideBadgeSpring = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 16, stiffness: 150 } });
  const sideBadgeX = interpolate(sideBadgeSpring, [0, 1], [-80, 0]);
  const sideBadgeOpacity = interpolate(sideBadgeSpring, [0, 1], [0, 1]);
  const verifiedStats = [
    skillStats?.stars !== undefined ? { icon: '⭐', label: `${skillStats.stars.toLocaleString()} Stars`, bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: '#fbbf24' } : null,
    skillStats?.forks !== undefined ? { icon: '🍴', label: `${skillStats.forks.toLocaleString()} Forks`, bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)', color: '#a5b4fc' } : null,
    skillStats?.language ? { icon: '⌘', label: skillStats.language, bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', color: '#6ee7b7' } : null,
  ].filter((stat): stat is NonNullable<typeof stat> => Boolean(stat));

  // Fade out near end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - Math.round(fps * 0.6), durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#090d16', opacity: fadeOut }}>
      {/* Background with Ken Burns Pan/Zoom */}
      <KenBurnsImage
        src={scene.image_url}
        direction="zoom-in"
        durationInFrames={durationInFrames}
        alt={scene.title}
      />

      {/* Ambient Floating Particles */}
      <FloatingParticles count={22} />

      {/* Full overlay gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(9,13,22,0.6) 0%, rgba(9,13,22,0.15) 45%, rgba(9,13,22,0.9) 100%)',
      }} />

      {/* Left vertical accent stripe */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
        background: 'linear-gradient(180deg, transparent 5%, #e11d48 40%, #6366f1 70%, transparent 95%)',
        opacity: cardOpacity,
        boxShadow: '0 0 10px rgba(225,29,72,0.5)',
      }} />

      {/* ── TOP BADGE ── */}
      <div style={{
        position: 'absolute',
        top: isVertical ? '5%' : '7%',
        left: '50%',
        transform: `translateX(-50%) scale(${badgeScale})`,
        opacity: badgeOpacity,
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 18px', borderRadius: '9999px',
        background: 'linear-gradient(90deg, rgba(225,29,72,0.45), rgba(99,102,241,0.45))',
        border: '1px solid rgba(244,63,94,0.5)',
        boxShadow: '0 8px 24px rgba(225,29,72,0.35)',
        backdropFilter: 'blur(12px)',
        zIndex: 10,
      }}>
        <span style={{ fontSize: '14px', opacity: pulseOpacity }}>🔥</span>
        <span style={{ fontSize: isVertical ? '13px' : '15px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          SOURCE-BACKED SKILL REVIEW
        </span>
      </div>

      {/* ── SIDE BADGE (rank) ── */}
      <div style={{
        position: 'absolute',
        top: isVertical ? '18%' : '22%',
        right: '4%',
        opacity: sideBadgeOpacity,
        transform: `translateX(${-sideBadgeX}px)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
        padding: '12px 16px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.8))',
        border: '1px solid rgba(251,191,36,0.4)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 12px rgba(251,191,36,0.2)',
        backdropFilter: 'blur(12px)',
        zIndex: 12,
        minWidth: isVertical ? '70px' : '90px',
      }}>
        <span style={{ fontSize: isVertical ? '22px' : '28px' }}>🎬</span>
        <span style={{ fontSize: isVertical ? '9px' : '11px', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.1em' }}>VIDEO BRIEF</span>
        <span style={{ fontSize: isVertical ? '16px' : '21px', fontWeight: 900, color: '#fff' }}>01/{String(totalScenes).padStart(2, '0')}</span>
      </div>

      {/* ── HERO CARD ── */}
      <div style={{
        position: 'absolute',
        top: isVertical ? '18%' : '22%',
        left: '4%',
        right: isVertical ? '4%' : '24%',
        opacity: cardOpacity,
        transform: `translateY(${cardTranslateY}px)`,
        display: 'flex', flexDirection: 'column',
        padding: isVertical ? '22px 18px' : '30px 28px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.78))',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.65), inset 0 1px 1px rgba(255,255,255,0.18)',
        backdropFilter: 'blur(20px)',
        zIndex: 10,
        gap: '14px',
      }}>
        {/* Title */}
        <AnimatedText
          text={skillTitle || scene.title || 'AI Autonomous Agent'}
          mode="heading"
          gradient
          style={{
            fontSize: isVertical ? '26px' : '40px',
            fontWeight: 900,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}
        />

        {/* Voiceover headline text */}
        <p style={{
          fontSize: isVertical ? '13px' : '17px',
          fontWeight: 600, color: '#94a3b8',
          margin: 0, lineHeight: 1.5,
        }}>
          {scene.title}
        </p>

        {/* Animated tech tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          {tags.slice(0, visibleTagCount).map((tag, i) => (
            <span key={i} style={{
              padding: '4px 12px', borderRadius: '9999px', fontSize: isVertical ? '10px' : '12px',
              fontWeight: 700, color: '#a5b4fc',
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* GitHub Stats row */}
        {verifiedStats.length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '10px',
            opacity: statsOpacity, transform: `scale(${statsScale})`,
          }}>
            {verifiedStats.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '12px',
                background: s.bg, border: `1px solid ${s.border}`,
                color: s.color, fontSize: isVertical ? '12px' : '14px', fontWeight: 800,
              }}>
                <span>{s.icon}</span><span>{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {scene.visual_beats && scene.visual_beats.length > 0 && (
        <div style={{
          position: 'absolute',
          top: isVertical ? '46%' : '55%',
          left: '4%',
          right: '4%',
          zIndex: 12,
          display: 'grid',
          gridTemplateColumns: isVertical ? '1fr' : 'repeat(3, 1fr)',
          gap: isVertical ? 12 : 16,
        }}>
          {scene.visual_beats.slice(0, 3).map((beat, index) => {
            const beatSpring = spring({
              frame: Math.max(0, frame - Math.round(fps * (0.65 + index * 0.18))),
              fps,
              config: { damping: 17, stiffness: 135 },
            });
            return (
              <div key={`${beat.at}-${index}`} style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: 14,
                alignItems: 'start',
                padding: isVertical ? '18px 20px' : '16px',
                borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(12,19,36,0.94), rgba(30,41,59,0.82))',
                border: '1px solid rgba(125,211,252,0.2)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                opacity: beatSpring,
                transform: `translateY(${interpolate(beatSpring, [0, 1], [26, 0])}px)`,
              }}>
                <span style={{ color: '#7dd3fc', fontWeight: 950, fontFamily: 'monospace', fontSize: isVertical ? 18 : 15 }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#e2e8f0', fontSize: isVertical ? 18 : 14, fontWeight: 900, marginBottom: 5 }}>
                    {beat.title}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: isVertical ? 14 : 11, lineHeight: 1.45, fontWeight: 650 }}>
                    {beat.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── KARAOKE SUBTITLES ── */}
      <div style={{ position: 'absolute', bottom: isVertical ? '6%' : '8%', left: 0, right: 0, zIndex: 20 }}>
        <KaraokeSubtitle subtitles={subtitles} fallbackText={scene.voiceover_text} />
      </div>

      {/* ── BOTTOM PROGRESS BAR (intro = 0/total filled) ── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.08)', zIndex: 30 }}>
        <div style={{
          height: '100%',
          width: `${interpolate(frame, [0, durationInFrames], [0, 100 / (totalScenes || 1)], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}%`,
          background: 'linear-gradient(90deg, #6366f1, #a855f7)',
          boxShadow: '0 0 8px rgba(139,92,246,0.8)',
        }} />
      </div>
    </AbsoluteFill>
  );
};
