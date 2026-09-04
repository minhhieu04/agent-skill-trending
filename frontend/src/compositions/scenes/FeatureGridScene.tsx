import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { VideoScene, SubtitleEntry } from '../../types';
import { KenBurnsImage } from '../elements/KenBurnsImage';
import { FloatingParticles } from '../elements/FloatingParticles';
import { KaraokeSubtitle } from '../elements/KaraokeSubtitle';

interface FeatureGridSceneProps {
  scene: VideoScene;
  subtitles?: SubtitleEntry[];
  durationInFrames: number;
  sceneIndex?: number;
  totalScenes?: number;
}

export const FeatureGridScene: React.FC<FeatureGridSceneProps> = ({
  scene,
  subtitles = [],
  durationInFrames,
  sceneIndex = 5,
  totalScenes = 8,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  // Header entrance
  const headerSpring = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const headerOpacity = interpolate(headerSpring, [0, 1], [0, 1]);
  const headerY = interpolate(headerSpring, [0, 1], [-20, 0]);

  // Main container
  const containerSpring = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 15, stiffness: 130 } });
  const containerOpacity = interpolate(containerSpring, [0, 1], [0, 1]);
  const containerY = interpolate(containerSpring, [0, 1], [30, 0]);

  const defaultFeatures = [
    { icon: '🧠', title: 'Context Memory', desc: 'Lưu trữ ngữ cảnh liên phiên làm việc không bị mất dữ liệu', color: '#c084fc' },
    { icon: '🛡️', title: 'Sandbox Guardrails', desc: 'Kiểm duyệt quyền truy cập CLI và sandbox tự động', color: '#34d399' },
    { icon: '⚡', title: 'Subagent Swarm', desc: 'Điều phối đa agent giải quyết các task phức tạp song song', color: '#38bdf8' },
    { icon: '🚀', title: '1-Click IDE Export', desc: 'Tương thích sẵn với Antigravity, Cursor, Codex & Claude', color: '#fbbf24' },
  ];

  const features = scene.feature_items || defaultFeatures;

  const fadeOut = interpolate(
    frame,
    [durationInFrames - Math.round(fps * 0.6), durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#090d16', opacity: fadeOut }}>
      <KenBurnsImage src={scene.image_url} direction="zoom-in" durationInFrames={durationInFrames} alt={scene.title} />
      <FloatingParticles count={16} />

      {/* Cyberpunk Gradient Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(9,13,22,0.7) 0%, rgba(9,13,22,0.3) 40%, rgba(9,13,22,0.92) 100%)' }} />

      {/* Left blue accent stripe */}
      <div style={{
        position: 'absolute', left: 0, top: '10%', bottom: '15%', width: '3px',
        background: 'linear-gradient(180deg, transparent, #38bdf8, transparent)',
        opacity: containerOpacity,
        boxShadow: '0 0 12px #38bdf8',
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
          border: '1px solid rgba(56,189,248,0.4)',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }} />
          <span style={{ color: '#38bdf8', fontSize: isVertical ? '10px' : '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            CORE CAPABILITIES
          </span>
        </div>

        <div style={{
          padding: '5px 14px',
          borderRadius: '9999px',
          background: 'rgba(56,189,248,0.15)',
          border: '1px solid rgba(56,189,248,0.4)',
          color: '#7dd3fc',
          fontSize: isVertical ? '11px' : '13px',
          fontWeight: 800,
        }}>
          ✨ 4 Core Pillars
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{
        position: 'absolute',
        top: isVertical ? '12%' : '14%',
        left: '3%', right: '3%',
        transform: `translateY(${containerY}px)`,
        opacity: containerOpacity,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: isVertical ? '10px' : '14px',
        zIndex: 10,
      }}>
        <h2 style={{
          margin: 0,
          fontSize: isVertical ? '22px' : '32px',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #fff 40%, #38bdf8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
          letterSpacing: '-0.02em',
        }}>
          {scene.title}
        </h2>

        {/* 4-Quadrant Feature Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: isVertical ? '8px' : '14px',
          width: '100%',
        }}>
          {features.slice(0, 4).map((feat, i) => {
            const cardSpring = spring({
              frame: Math.max(0, frame - 10 - i * 5),
              fps,
              config: { damping: 15, stiffness: 140 },
            });
            const cardY = interpolate(cardSpring, [0, 1], [30, 0]);
            const cardOp = interpolate(cardSpring, [0, 1], [0, 1]);
            const palette = ['#c084fc', '#34d399', '#38bdf8', '#fbbf24'];
            const cardColor = (feat as any).color || palette[i % palette.length];


            return (
              <div key={i} style={{
                padding: isVertical ? '12px 10px' : '16px 14px',
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${cardColor}15, rgba(15,23,42,0.92))`,
                border: `1px solid ${cardColor}40`,
                boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 12px ${cardColor}18`,
                backdropFilter: 'blur(16px)',
                opacity: cardOp,
                transform: `translateY(${cardY}px)`,
                display: 'flex', flexDirection: 'column', gap: '6px',
              }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: isVertical ? '18px' : '22px' }}>{feat.icon}</span>
                  <span style={{ fontSize: isVertical ? '11px' : '14px', fontWeight: 900, color: '#fff' }}>
                    {feat.title}
                  </span>
                </div>
                <p style={{
                  margin: 0,
                  fontSize: isVertical ? '9.5px' : '12px',
                  color: '#94a3b8',
                  lineHeight: 1.35,
                  fontWeight: 500,
                }}>
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Visual description */}
        <p style={{
          margin: 0,
          fontSize: isVertical ? '11.5px' : '14px',
          fontWeight: 600, color: '#94a3b8', textAlign: 'center', lineHeight: 1.45,
          maxWidth: '650px',
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
          background: 'linear-gradient(90deg, #6366f1, #38bdf8)',
          boxShadow: '0 0 8px rgba(56,189,248,0.8)',
        }} />
      </div>
    </AbsoluteFill>
  );
};
