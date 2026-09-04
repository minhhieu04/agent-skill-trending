import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { VideoScene, SubtitleEntry } from '../../types';
import { KenBurnsImage } from '../elements/KenBurnsImage';
import { KaraokeSubtitle } from '../elements/KaraokeSubtitle';
import { FloatingParticles } from '../elements/FloatingParticles';

interface CodeSnippetSceneProps {
  scene: VideoScene;
  subtitles?: SubtitleEntry[];
  durationInFrames: number;
  sceneIndex?: number;
  totalScenes?: number;
}

const TOKEN_COLORS: Record<string, string> = {
  keyword: '#c792ea',
  string: '#c3e88d',
  comment: '#546e7a',
  function: '#82aaff',
  number: '#f78c6c',
  default: '#d4f0ff',
};

const colorizeCode = (line: string): React.ReactNode => {
  if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
    return <span style={{ color: TOKEN_COLORS.comment }}>{line}</span>;
  }
  const keywords = ['async', 'function', 'return', 'const', 'let', 'await', 'import', 'from', 'export', 'default', 'class', 'def', 'if', 'else', 'for', 'new'];
  const parts = line.split(/(\b(?:async|function|return|const|let|await|import|from|export|default|class|def|if|else|for|new)\b|'[^']*'|"[^"]*"|`[^`]*`|\d+)/);
  return (
    <>
      {parts.map((p, i) => {
        if (keywords.includes(p)) return <span key={i} style={{ color: TOKEN_COLORS.keyword }}>{p}</span>;
        if ((p.startsWith("'") || p.startsWith('"') || p.startsWith('`')) && p.length > 1) return <span key={i} style={{ color: TOKEN_COLORS.string }}>{p}</span>;
        if (/^\d+$/.test(p)) return <span key={i} style={{ color: TOKEN_COLORS.number }}>{p}</span>;
        return <span key={i} style={{ color: TOKEN_COLORS.default }}>{p}</span>;
      })}
    </>
  );
};

export const CodeSnippetScene: React.FC<CodeSnippetSceneProps> = ({
  scene,
  subtitles = [],
  durationInFrames,
  sceneIndex = 3,
  totalScenes = 5,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const codeText = scene.code_snippet || `# Source excerpt unavailable
# Open the repository and inspect README / source
# before executing project commands.`;

  const lines = codeText.split('\n');

  // Header entrance
  const headerSpring = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const headerOpacity = interpolate(headerSpring, [0, 1], [0, 1]);
  const headerY = interpolate(headerSpring, [0, 1], [-20, 0]);

  // Progressive line reveal — type lines one by one
  const totalTypeFrames = Math.round(durationInFrames * 0.75);
  const framesPerLine = Math.max(1, totalTypeFrames / Math.max(1, lines.length));
  const currentLineIndex = Math.min(lines.length - 1, Math.floor(frame / framesPerLine));
  const visibleLineCount = Math.min(lines.length, currentLineIndex + 1);
  const currentLineStart = currentLineIndex * framesPerLine;
  const currentLineCharProgress = interpolate(
    frame,
    [currentLineStart, currentLineStart + framesPerLine],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const lastLineCharCount = Math.floor(
    currentLineCharProgress * (lines[Math.min(visibleLineCount - 1, lines.length - 1)]?.length || 0)
  );

  const cardSpring = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 14, stiffness: 120 } });
  const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
  const cardY = interpolate(cardSpring, [0, 1], [30, 0]);

  // Output terminal appear after typing finished (delayed)
  const outputSpring = spring({
    frame: Math.max(0, frame - Math.round(durationInFrames * 0.45)),
    fps,
    config: { damping: 16, stiffness: 130 },
  });
  const outputOpacity = interpolate(outputSpring, [0, 1], [0, 1]);
  const outputY = interpolate(outputSpring, [0, 1], [20, 0]);

  const fadeOut = interpolate(
    frame,
    [durationInFrames - Math.round(fps * 0.6), durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Blinking cursor
  const cursorVisible = (frame % Math.round(fps * 0.55)) < Math.round(fps * 0.28);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#090d16', opacity: fadeOut }}>
      <KenBurnsImage src={scene.image_url} direction="pan-left" durationInFrames={durationInFrames} alt={scene.title} />
      <FloatingParticles count={14} />

      {/* Dynamic gradient */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(9,13,22,0.65) 0%, rgba(9,13,22,0.3) 40%, rgba(9,13,22,0.92) 100%)' }} />

      {/* Left cyan accent stripe */}
      <div style={{
        position: 'absolute', left: 0, top: '10%', bottom: '15%', width: '3px',
        background: 'linear-gradient(180deg, transparent, #38bdf8, transparent)',
        opacity: cardOpacity,
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
            LIVE CODE DEMO
          </span>
        </div>

        <div style={{
          padding: '5px 14px',
          borderRadius: '9999px',
          background: 'rgba(56,189,248,0.12)',
          border: '1px solid rgba(56,189,248,0.35)',
          color: '#7dd3fc',
          fontSize: isVertical ? '11px' : '13px',
          fontWeight: 800,
        }}>
          ◉ README / SOURCE EXCERPT
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{
        position: 'absolute',
        top: isVertical ? '12%' : '14%',
        left: '4%', right: '4%',
        opacity: cardOpacity,
        transform: `translateY(${cardY}px)`,
        display: 'flex', flexDirection: 'column',
        gap: isVertical ? '10px' : '14px',
        zIndex: 10,
      }}>
        <h2 style={{
          margin: 0,
          fontSize: isVertical ? '22px' : '32px',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #fff 40%, #38bdf8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em',
        }}>
          {scene.title}
        </h2>

        {/* Code Editor Card */}
        <div style={{
          borderRadius: '18px', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 20px rgba(56,189,248,0.15)',
          border: '1px solid rgba(255,255,255,0.14)',
        }}>
          {/* Editor title bar */}
          <div style={{
            background: '#1e2030', padding: '10px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
              <span style={{ marginLeft: 8, fontSize: 12, color: '#94a3b8', fontFamily: 'monospace', fontWeight: 700 }}>
                agent_runner.ts
              </span>
            </div>
            <span style={{
              padding: '2px 8px', borderRadius: '6px',
              background: 'rgba(56,189,248,0.15)', color: '#38bdf8',
              fontSize: '10px', fontWeight: 800, fontFamily: 'monospace',
            }}>
              TypeScript
            </span>
          </div>

          {/* Code area */}
          <div style={{
            background: '#0d1117', padding: isVertical ? '14px 16px' : '18px 20px',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontSize: isVertical ? '11px' : '14px', lineHeight: 1.7, minHeight: isVertical ? '130px' : '160px',
          }}>
            {lines.slice(0, visibleLineCount).map((line, i) => {
              const isCurrentLine = i === visibleLineCount - 1 && visibleLineCount < lines.length;
              const displayLine = isCurrentLine ? line.slice(0, lastLineCharCount) : line;
              return (
                <div key={i} style={{ display: 'flex', gap: '14px' }}>
                  <span style={{ color: '#2d3748', userSelect: 'none', minWidth: '18px', textAlign: 'right', fontSize: isVertical ? '10px' : '12px' }}>
                    {i + 1}
                  </span>
                  <span>
                    {colorizeCode(displayLine)}
                    {isCurrentLine && <span style={{ opacity: cursorVisible ? 1 : 0, color: '#82aaff' }}>▌</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Output Console Box */}
        <div style={{
          padding: isVertical ? '10px 14px' : '12px 18px',
          borderRadius: '14px',
          background: 'rgba(2,6,23,0.92)',
          border: '1px solid rgba(34,197,94,0.3)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          opacity: outputOpacity,
          transform: `translateY(${outputY}px)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ fontFamily: 'monospace', fontSize: isVertical ? '10px' : '12px', color: '#86efac', fontWeight: 700 }}>
              Source loaded for review — no untrusted code executed
            </span>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: isVertical ? '9px' : '11px', color: '#64748b' }}>
            {scene.source_ref || 'editor context'}
          </span>
        </div>
      </div>

      {/* ── KARAOKE SUBTITLES ── */}
      <div style={{ position: 'absolute', bottom: isVertical ? '7%' : '9%', left: '3%', right: '3%', zIndex: 20 }}>
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
