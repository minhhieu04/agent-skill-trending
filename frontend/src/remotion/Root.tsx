import React from 'react';
import { CalculateMetadataFunction, Composition } from 'remotion';
import { SkillVideoComposition, SkillVideoCompositionProps } from '../compositions/SkillVideoComposition';
import { getVideoDurationInFrames } from '../compositions/videoTimeline';

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
  const scenes = props.storyboard?.scenes || [];
  return {
    durationInFrames: getVideoDurationInFrames(scenes, props.ttsResult, FPS),
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
