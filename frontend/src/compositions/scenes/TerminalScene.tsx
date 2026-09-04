import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { VideoScene, SubtitleEntry } from '../../types';
import { KenBurnsImage } from '../elements/KenBurnsImage';
import { FloatingParticles } from '../elements/FloatingParticles';
import { KaraokeSubtitle } from '../elements/KaraokeSubtitle';

interface TerminalSceneProps {
  scene: VideoScene;
  subtitles?: SubtitleEntry[];
  durationInFrames: number;
  sceneIndex?: number;
  totalScenes?: number;
}

export const TerminalScene: React.FC<TerminalSceneProps> = ({
  scene,
  subtitles = [],
  durationInFrames,
  sceneIndex = 3,
  totalScenes = 8,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  // Header entrance
  const headerSpring = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const headerOpacity = interpolate(headerSpring, [0, 1], [0, 1]);
  const headerY = interpolate(headerSpring, [0, 1], [-20, 0]);

  // Terminal box entrance
  const termSpring = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 15, stiffness: 130 } });
  const termOpacity = interpolate(termSpring, [0, 1], [0, 1]);
  const termY = interpolate(termSpring, [0, 1], [30, 0]);

  const command = scene.terminal_command || `npx @agent/skills add ${scene.title.toLowerCase().replace(/[^a-z0-9]/g, '-')} --sandbox`;

  // Typing animation for CLI command
  const commandTypeFrames = Math.round(fps * 1.5);
  const commandCharCount = Math.min(
    command.length,
    Math.floor(interpolate(frame, [10, 10 + commandTypeFrames], [0, command.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  );
  const typedCommand = command.slice(0, commandCharCount);

  // Blinking cursor
  const cursorVisible = (frame % Math.round(fps * 0.5)) < Math.round(fps * 0.25);

  // Stdout log lines appearing sequentially
  const defaultLogs = [
    '✔ Resolving verified skill package from registry...',
    '✔ Running AST Security & Sandbox Guardrails audit [PASS]',
    '✔ Injecting deterministic subagent instructions & MCP tools',
    '✔ Synthesizing memory vector embeddings (128 dims)',
    '🚀 Ready! Skill deployed with 1-click execution',
  ];
  const logs = scene.terminal_output || defaultLogs;
  const logStartFrame = 10 + commandTypeFrames + 5;
  const framesPerLog = Math.round(fps * 0.4);
  const visibleLogCount = Math.max(0, Math.min(logs.length, Math.floor((frame - logStartFrame) / framesPerLog) + 1));

  const fadeOut = interpolate(
    frame,
    [durationInFrames - Math.round(fps * 0.6), durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#090d16', opacity: fadeOut }}>
      <KenBurnsImage src={scene.image_url} direction="zoom-out" durationInFrames={durationInFrames} alt={scene.title} />
      <FloatingParticles count={14} />

      {/* Cyberpunk dark gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(9,13,22,0.7) 0%, rgba(9,13,22,0.3) 40%, rgba(9,13,22,0.92) 100%)' }} />

      {/* Left green accent stripe */}
      <div style={{
        position: 'absolute', left: 0, top: '10%', bottom: '15%', width: '3px',
        background: 'linear-gradient(180deg, transparent, #22c55e, transparent)',
        opacity: termOpacity,
        boxShadow: '0 0 12px #22c55e',
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
          border: '1px solid rgba(34,197,94,0.4)',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
          <span style={{ color: '#22c55e', fontSize: isVertical ? '10px' : '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            CLI INSTALLATION
          </span>
        </div>

        <div style={{
          padding: '5px 14px',
          borderRadius: '9999px',
          background: 'rgba(34,197,94,0.15)',
          border: '1px solid rgba(34,197,94,0.4)',
          color: '#86efac',
          fontSize: isVertical ? '11px' : '13px',
          fontWeight: 800,
        }}>
          ⚡ Zero Configuration
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{
        position: 'absolute',
        top: isVertical ? '12%' : '14%',
        left: '3%', right: '3%',
        transform: `translateY(${termY}px)`,
        opacity: termOpacity,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: isVertical ? '10px' : '14px',
        zIndex: 10,
      }}>
        <h2 style={{
          margin: 0,
          fontSize: isVertical ? '22px' : '32px',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #fff 40%, #22c55e)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
          letterSpacing: '-0.02em',
        }}>
          {scene.title}
        </h2>

        {/* Terminal Window Card */}
        <div style={{
          width: '100%',
          borderRadius: '18px', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 24px rgba(34,197,94,0.18)',
          border: '1px solid rgba(255,255,255,0.14)',
          background: '#090d16',
        }}>
          {/* Header Bar */}
          <div style={{
            background: '#161b26', padding: '10px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
              <span style={{ marginLeft: 8, fontSize: 12, color: '#94a3b8', fontFamily: 'monospace', fontWeight: 700 }}>
                zsh — agent-cli
              </span>
            </div>
            <span style={{
              padding: '2px 8px', borderRadius: '6px',
              background: 'rgba(34,197,94,0.15)', color: '#86efac',
              fontSize: '10px', fontWeight: 800, fontFamily: 'monospace',
            }}>
              Node v20.11
            </span>
          </div>

          {/* Terminal Body */}
          <div style={{
            padding: isVertical ? '14px 16px' : '18px 20px',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontSize: isVertical ? '11px' : '13.5px',
            lineHeight: 1.7,
            minHeight: isVertical ? '140px' : '170px',
            display: 'flex', flexDirection: 'column', gap: '4px',
          }}>
            {/* Command Line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc' }}>
              <span style={{ color: '#22c55e', fontWeight: 900 }}>❯</span>
              <span>{typedCommand}</span>
              {frame < logStartFrame && cursorVisible && (
                <span style={{ color: '#22c55e' }}>▌</span>
              )}
            </div>

            {/* Streaming Logs */}
            {logs.slice(0, visibleLogCount).map((log, i) => (
              <div key={i} style={{
                color: log.startsWith('🚀') ? '#38bdf8' : '#cbd5e1',
                fontWeight: log.startsWith('🚀') ? 800 : 500,
                fontSize: isVertical ? '10px' : '12.5px',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <span>{log}</span>
              </div>
            ))}
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
          background: 'linear-gradient(90deg, #6366f1, #22c55e)',
          boxShadow: '0 0 8px rgba(34,197,94,0.8)',
        }} />
      </div>
    </AbsoluteFill>
  );
};
