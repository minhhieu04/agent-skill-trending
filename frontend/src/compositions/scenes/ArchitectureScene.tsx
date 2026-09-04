import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { VideoScene, SubtitleEntry } from '../../types';
import { KenBurnsImage } from '../elements/KenBurnsImage';
import { FloatingParticles } from '../elements/FloatingParticles';
import { KaraokeSubtitle } from '../elements/KaraokeSubtitle';

interface ArchitectureSceneProps {
  scene: VideoScene;
  subtitles?: SubtitleEntry[];
  durationInFrames: number;
  sceneIndex?: number;
  totalScenes?: number;
}

export const ArchitectureScene: React.FC<ArchitectureSceneProps> = ({
  scene,
  subtitles = [],
  durationInFrames,
  sceneIndex = 2,
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

  // Use storyboard facts instead of presenting a made-up architecture as truth.
  const palette = [
    { icon: '①', color: '#a5b4fc', bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)' },
    { icon: '②', color: '#c084fc', bg: 'rgba(192,132,252,0.15)', border: 'rgba(192,132,252,0.4)' },
    { icon: '③', color: '#38bdf8', bg: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.4)' },
    { icon: '✓', color: '#34d399', bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.4)' },
  ];
  const beatNodes = (scene.visual_beats || []).slice(0, 4).map((beat, index) => ({
    title: beat.title,
    desc: beat.detail,
    ...palette[index % palette.length],
  }));
  const nodes = beatNodes.length > 0 ? beatNodes : [{
    title: scene.title,
    desc: scene.visual_description,
    ...palette[0],
  }];

  // One directional pass across the scene; do not restart on long videos.
  const beamProgress = interpolate(
    frame,
    [Math.round(fps * 0.7), Math.max(Math.round(fps * 0.8), durationInFrames - Math.round(fps * 0.7))],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const fadeOut = interpolate(
    frame,
    [durationInFrames - Math.round(fps * 0.6), durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#090d16', opacity: fadeOut }}>
      <KenBurnsImage src={scene.image_url} direction="pan-right" durationInFrames={durationInFrames} alt={scene.title} />
      <FloatingParticles count={18} />

      {/* Deep Cyberpunk Gradient */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(9,13,22,0.7) 0%, rgba(9,13,22,0.3) 40%, rgba(9,13,22,0.92) 100%)' }} />

      {/* Left purple accent stripe */}
      <div style={{
        position: 'absolute', left: 0, top: '10%', bottom: '15%', width: '3px',
        background: 'linear-gradient(180deg, transparent, #c084fc, transparent)',
        opacity: containerOpacity,
        boxShadow: '0 0 12px #c084fc',
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
          border: '1px solid rgba(192,132,252,0.4)',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c084fc', boxShadow: '0 0 6px #c084fc' }} />
          <span style={{ color: '#c084fc', fontSize: isVertical ? '10px' : '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            SYSTEM ARCHITECTURE
          </span>
        </div>

        <div style={{
          padding: '5px 14px',
          borderRadius: '9999px',
          background: 'rgba(192,132,252,0.15)',
          border: '1px solid rgba(192,132,252,0.4)',
          color: '#e879f9',
          fontSize: isVertical ? '11px' : '13px',
          fontWeight: 800,
        }}>
          🧠 Source-backed Flow
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
          background: 'linear-gradient(135deg, #fff 40%, #c084fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
          letterSpacing: '-0.02em',
        }}>
          {scene.title}
        </h2>

        {/* Pipeline Flow Diagram */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isVertical ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isVertical ? '8px' : '12px',
          width: '100%',
          position: 'relative',
        }}>
          {nodes.map((node, i) => {
            const nodeSpring = spring({
              frame: Math.max(0, frame - 10 - i * 6),
              fps,
              config: { damping: 15, stiffness: 140 },
            });
            const nodeY = interpolate(nodeSpring, [0, 1], [25, 0]);
            const nodeOp = interpolate(nodeSpring, [0, 1], [0, 1]);
            const isNodeActive = Math.floor(beamProgress * nodes.length) === i;

            return (
              <div key={i} style={{
                padding: isVertical ? '12px 10px' : '16px 14px',
                borderRadius: '16px',
                background: isNodeActive ? 'rgba(192,132,252,0.22)' : node.bg,
                border: `1px solid ${isNodeActive ? '#c084fc' : node.border}`,
                boxShadow: isNodeActive ? '0 0 24px rgba(192,132,252,0.4)' : '0 8px 24px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(16px)',
                opacity: nodeOp,
                transform: `translateY(${nodeY}px)`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px',
                transition: 'border-color 0.15s, background 0.15s',
              }}>
                <div style={{
                  width: isVertical ? '32px' : '40px', height: isVertical ? '32px' : '40px',
                  borderRadius: '12px', background: `${node.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isVertical ? '18px' : '22px',
                }}>
                  {node.icon}
                </div>
                <div style={{ fontSize: isVertical ? '11px' : '13px', fontWeight: 900, color: '#fff' }}>
                  {node.title}
                </div>
                <div style={{ fontSize: isVertical ? '9px' : '11px', color: node.color, fontWeight: 600, lineHeight: 1.2 }}>
                  {node.desc}
                </div>
                <div style={{
                  marginTop: '4px', padding: '2px 6px', borderRadius: '4px',
                  background: 'rgba(255,255,255,0.06)', fontSize: '8px',
                  fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em',
                }}>
                  STEP 0{i + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* Source badge row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
          {[
            '📖 Storyboard source',
            '🔎 Reviewable steps',
            '🔗 Recorded runtime',
            `📋 ${scene.source_ref || 'Editor context'}`,
          ].map((tag, i) => (
            <span key={i} style={{
              padding: isVertical ? '3px 8px' : '5px 12px',
              borderRadius: '9999px',
              background: 'rgba(15,23,42,0.85)',
              border: '1px solid rgba(192,132,252,0.3)',
              color: '#cbd5e1',
              fontSize: isVertical ? '9px' : '11px',
              fontWeight: 700,
            }}>
              {tag}
            </span>
          ))}
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
          background: 'linear-gradient(90deg, #6366f1, #c084fc)',
          boxShadow: '0 0 8px rgba(192,132,252,0.8)',
        }} />
      </div>
    </AbsoluteFill>
  );
};
