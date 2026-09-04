import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface FloatingParticlesProps {
  count?: number;
  primaryColor?: string;
  secondaryColor?: string;
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = 18,
  primaryColor = 'rgba(99, 102, 241, 0.45)', // indigo
  secondaryColor = 'rgba(244, 63, 94, 0.35)', // rose
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const particles = React.useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      baseX: ((i * 73) % 100) / 100,
      baseY: ((i * 37) % 100) / 100,
      size: 3 + (i % 5) * 2.5,
      speedX: 0.0008 + (i % 3) * 0.0005,
      speedY: 0.001 + (i % 4) * 0.0006,
      phase: (i * Math.PI) / 3,
      isPrimary: i % 2 === 0,
    }));
  }, [count]);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map((p) => {
        const xOffset = Math.sin(frame * p.speedX * 25 + p.phase) * (width * 0.06);
        const yOffset = Math.cos(frame * p.speedY * 20 + p.phase) * (height * 0.08);

        const x = p.baseX * width + xOffset;
        const y = p.baseY * height + yOffset;

        const opacity = interpolate(
          Math.sin(frame * 0.05 + p.phase),
          [-1, 1],
          [0.2, 0.75]
        );

        const scale = interpolate(
          Math.cos(frame * 0.04 + p.phase),
          [-1, 1],
          [0.8, 1.3]
        );

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: p.isPrimary ? primaryColor : secondaryColor,
              boxShadow: `0 0 ${p.size * 3}px ${p.isPrimary ? primaryColor : secondaryColor}`,
              opacity,
              transform: `scale(${scale})`,
              filter: 'blur(0.5px)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
