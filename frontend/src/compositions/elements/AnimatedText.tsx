import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface AnimatedTextProps {
  text: string;
  delayFrames?: number;
  mode?: 'lines' | 'words' | 'heading';
  style?: React.CSSProperties;
  className?: string;
  gradient?: boolean;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  delayFrames = 0,
  mode = 'lines',
  style,
  gradient = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = React.useMemo(() => text.split(' '), [text]);

  if (mode === 'heading') {
    const headingSpring = spring({
      frame: frame - delayFrames,
      fps,
      config: { damping: 12, mass: 0.6, stiffness: 140 },
    });

    const translateY = interpolate(headingSpring, [0, 1], [35, 0]);
    const opacity = interpolate(headingSpring, [0, 1], [0, 1]);
    const scale = interpolate(headingSpring, [0, 1], [0.92, 1]);

    return (
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px) scale(${scale})`,
          ...style,
        }}
      >
        {gradient ? (
          <span
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 45%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {text}
          </span>
        ) : (
          text
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '4px 8px',
        ...style,
      }}
    >
      {words.map((word, idx) => {
        const wordDelay = delayFrames + idx * 2.5;
        const wordSpring = spring({
          frame: frame - wordDelay,
          fps,
          config: { damping: 14, mass: 0.5, stiffness: 160 },
        });

        const wordOpacity = interpolate(wordSpring, [0, 1], [0, 1]);
        const wordTranslateY = interpolate(wordSpring, [0, 1], [18, 0]);

        return (
          <span
            key={idx}
            style={{
              display: 'inline-block',
              opacity: wordOpacity,
              transform: `translateY(${wordTranslateY}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
