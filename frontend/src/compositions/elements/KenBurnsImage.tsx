import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';

interface KenBurnsImageProps {
  src?: string;
  direction?: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right';
  durationInFrames: number;
  alt?: string;
}

export const KenBurnsImage: React.FC<KenBurnsImageProps> = ({
  src,
  direction = 'zoom-in',
  durationInFrames,
  alt = 'AI Background',
}) => {
  const frame = useCurrentFrame();

  // Calculate dynamic zoom and pan transformations based on direction
  const progress = interpolate(frame, [0, Math.max(1, durationInFrames)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  let scale = 1.0;
  let translateX = 0;
  let translateY = 0;

  switch (direction) {
    case 'zoom-in':
      scale = 1.0 + progress * 0.16; // 1.0 -> 1.16
      translateY = -progress * 15;
      break;
    case 'zoom-out':
      scale = 1.16 - progress * 0.14; // 1.16 -> 1.02
      translateX = progress * 20;
      break;
    case 'pan-left':
      scale = 1.12;
      translateX = 30 - progress * 60; // 30px -> -30px
      break;
    case 'pan-right':
      scale = 1.12;
      translateX = -30 + progress * 60; // -30px -> 30px
      break;
  }

  const fallbackUrl =
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80';
  const finalSrc = src || fallbackUrl;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#090d16' }}>
      <Img
        src={finalSrc}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translate3d(${translateX}px, ${translateY}px, 0)`,
          transformOrigin: 'center center',
          filter: 'brightness(0.72) contrast(1.08) saturate(1.12)',
          transition: 'none',
        }}
      />

      {/* Cinematic Dark Gradient & Vignette Overlay */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(15,23,42,0.2) 0%, rgba(10,15,30,0.75) 75%, rgba(5,8,18,0.92) 100%)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Top & Bottom Cinematic Letterbox Shadows */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to bottom, rgba(15,23,42,0.85) 0%, transparent 22%, transparent 78%, rgba(15,23,42,0.95) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
