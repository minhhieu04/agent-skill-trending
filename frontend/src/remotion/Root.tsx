import React from 'react';
import { CalculateMetadataFunction, Composition } from 'remotion';
import { SkillVideoComposition, SkillVideoCompositionProps } from '../compositions/SkillVideoComposition';

const FPS = 30;

const defaultProps: SkillVideoCompositionProps = {
  storyboard: null,
  ttsResult: null,
  audioSrc: undefined,
  skillTitle: 'AI Agent Skill',
  skillStats: {},
  showCaptions: true,
};

const calculateMetadata: CalculateMetadataFunction<SkillVideoCompositionProps> = ({ props }) => {
  const aspectRatio = props.storyboard?.aspect_ratio || '9:16';
  const audioDuration = props.ttsResult?.duration_seconds || 0;
  const storyboardDuration = props.storyboard?.scenes?.reduce(
    (total, scene) => total + (scene.duration_seconds || 5),
    0,
  ) || 20;
  return {
    durationInFrames: Math.max(FPS * 2, Math.round((audioDuration || storyboardDuration) * FPS)),
    width: aspectRatio === '9:16' ? 1080 : 1920,
    height: aspectRatio === '9:16' ? 1920 : 1080,
    fps: FPS,
    props,
  };
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="SkillVideo"
    component={SkillVideoComposition}
    durationInFrames={FPS * 20}
    fps={FPS}
    width={1080}
    height={1920}
    defaultProps={defaultProps}
    calculateMetadata={calculateMetadata}
  />
);
