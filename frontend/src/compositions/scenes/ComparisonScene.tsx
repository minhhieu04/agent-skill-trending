import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { VideoScene, SubtitleEntry } from '../../types';
import { KenBurnsImage } from '../elements/KenBurnsImage';
import { FloatingParticles } from '../elements/FloatingParticles';
import { KaraokeSubtitle } from '../elements/KaraokeSubtitle';

interface ComparisonSceneProps {
  scene: VideoScene;
  subtitles?: SubtitleEntry[];
  durationInFrames: number;
  sceneIndex?: number;
  totalScenes?: number;
}

export const ComparisonScene: React.FC<ComparisonSceneProps> = ({
  scene,
  subtitles = [],
  durationInFrames,
  sceneIndex = 4,
  totalScenes = 8,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  // Header entrance
  const headerSpring = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const headerOpacity = interpolate(headerSpring, [0, 1], [0, 1]);
  const headerY = interpolate(headerSpring, [0, 1], [-20, 0]);

  // Left card (Before) entrance
  const beforeSpring = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 15, stiffness: 140 },
  });
  const beforeX = interpolate(beforeSpring, [0, 1], [-50, 0]);
  const beforeOpacity = interpolate(beforeSpring, [0, 1], [0, 1]);

  // Right card (After) entrance (delayed)
  const afterSpring = spring({
    frame: Math.max(0, frame - 16),
    fps,
    config: { damping: 15, stiffness: 140 },
  });
  const afterX = interpolate(afterSpring, [0, 1], [50, 0]);
  const afterOpacity = interpolate(afterSpring, [0, 1], [0, 1]);

  // VS badge bounce
  const vsSpring = spring({
    frame: Math.max(0, frame - 12),
    fps,
    config: { damping: 10, mass: 0.5, stiffness: 200 },
  });
  const vsScale = interpolate(vsSpring, [0, 1], [0, 1]);

  const fadeOut = interpolate(
    frame,
    [durationInFrames - Math.round(fps * 0.6), durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const toPoints = (value: string | undefined, fallback: string) => (
    (value || fallback).split(/\n|[;•]/).map((item) => item.trim()).filter(Boolean).slice(0, 4)
  );
  const beforePoints = toPoints(scene.before_text, 'Chưa có dữ liệu quy trình trước trong nguồn.');
  const afterPoints = toPoints(scene.after_text, 'Chưa có dữ liệu quy trình sau trong nguồn.');

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#090d16', opacity: fadeOut }}>
      <KenBurnsImage src={scene.image_url} direction="zoom-in" durationInFrames={durationInFrames} alt={scene.title} />
      <FloatingParticles count={16} />

      {/* Gradient Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(9,13,22,0.7) 0%, rgba(9,13,22,0.3) 40%, rgba(9,13,22,0.92) 100%)' }} />

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
          border: '1px solid rgba(244,63,94,0.4)',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 6px #f43f5e' }} />
          <span style={{ color: '#f43f5e', fontSize: isVertical ? '10px' : '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            BEFORE VS AFTER
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
          ◉ SOURCE-BACKED COMPARISON
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{
        position: 'absolute',
        top: isVertical ? '12%' : '14%',
        left: '3%', right: '3%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: isVertical ? '10px' : '14px',
        zIndex: 10,
      }}>
        <h2 style={{
          margin: 0,
          fontSize: isVertical ? '20px' : '30px',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #fff 40%, #f43f5e)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
          letterSpacing: '-0.02em',
        }}>
          {scene.title}
        </h2>

        {/* Side-by-side comparison grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isVertical ? '1fr' : '1fr 1fr',
          gap: isVertical ? '10px' : '18px',
          width: '100%',
          position: 'relative',
        }}>
          {/* Left card: Without / Before */}
          <div style={{
            padding: isVertical ? '12px 14px' : '18px 20px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(15,23,42,0.9))',
            border: '1px solid rgba(239,68,68,0.35)',
            boxShadow: '0 12px 32px rgba(239,68,68,0.15)',
            backdropFilter: 'blur(16px)',
            opacity: beforeOpacity,
            transform: `translateX(${beforeX}px)`,
            display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '6px', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
              <span style={{ fontSize: '16px' }}>❌</span>
              <span style={{ fontSize: isVertical ? '12px' : '14px', fontWeight: 900, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Trước
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {beforePoints.slice(0, isVertical ? 3 : 4).map((pt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 900, fontSize: '11px', marginTop: '1px' }}>✕</span>
                  <span style={{ fontSize: isVertical ? '10.5px' : '13px', color: '#cbd5e1', lineHeight: 1.35 }}>{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Center VS Badge */}
          {!isVertical && (
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: `translate(-50%, -50%) scale(${vsScale})`,
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #f43f5e, #10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 900, color: '#fff',
              boxShadow: '0 0 20px rgba(244,63,94,0.6)',
              zIndex: 20, border: '2px solid #090d16',
            }}>
              VS
            </div>
          )}

          {/* Right card: With Agent Skill */}
          <div style={{

            padding: isVertical ? '12px 14px' : '18px 20px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.14), rgba(15,23,42,0.92))',
            border: '1px solid rgba(16,185,129,0.45)',
            boxShadow: '0 12px 32px rgba(16,185,129,0.2), 0 0 20px rgba(16,185,129,0.15)',
            backdropFilter: 'blur(16px)',
            opacity: afterOpacity,
            transform: `translateX(${afterX}px)`,
            display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '6px', borderBottom: '1px solid rgba(16,185,129,0.2)' }}>
              <span style={{ fontSize: '16px' }}>⚡</span>
              <span style={{ fontSize: isVertical ? '12px' : '14px', fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sau
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {afterPoints.slice(0, isVertical ? 3 : 4).map((pt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontWeight: 900, fontSize: '11px', marginTop: '1px' }}>✓</span>
                  <span style={{ fontSize: isVertical ? '10.5px' : '13px', color: '#ecfdf5', fontWeight: 600, lineHeight: 1.35 }}>{pt}</span>
                </div>
              ))}
            </div>
          </div>
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
          background: 'linear-gradient(90deg, #f43f5e, #10b981)',
          boxShadow: '0 0 8px rgba(16,185,129,0.8)',
        }} />
      </div>
    </AbsoluteFill>
  );
};
