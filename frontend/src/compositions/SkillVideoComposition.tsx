import React from 'react';
import { AbsoluteFill, Audio, Sequence, useVideoConfig } from 'remotion';
import { VideoStoryboard, TTSResult } from '../types';
import { IntroScene } from './scenes/IntroScene';
import { ContentScene } from './scenes/ContentScene';
import { OutroScene } from './scenes/OutroScene';
import { StatScene } from './scenes/StatScene';
import { CodeSnippetScene } from './scenes/CodeSnippetScene';
import { ComparisonScene } from './scenes/ComparisonScene';
import { ArchitectureScene } from './scenes/ArchitectureScene';
import { TerminalScene } from './scenes/TerminalScene';
import { FeatureGridScene } from './scenes/FeatureGridScene';
import { GitHubWalkthroughScene } from './scenes/GitHubWalkthroughScene';
import { SceneInformationDeck } from './elements/SceneInformationDeck';
import { buildVideoTimeline } from './videoTimeline';

export interface SkillVideoCompositionProps extends Record<string, unknown> {
  storyboard: VideoStoryboard | null;
  ttsResult: TTSResult | null;
  audioSrc?: string;
  skillTitle?: string;
  skillStats?: {
    stars?: number;
    forks?: number;
    language?: string;
  };
  showCaptions?: boolean;
}

export const SkillVideoComposition: React.FC<SkillVideoCompositionProps> = ({
  storyboard,
  ttsResult,
  audioSrc,
  skillTitle = 'Trending Agent Skill 2026',
  skillStats,
  showCaptions = true,
}) => {

  const { fps } = useVideoConfig();

  const scenes = React.useMemo(() => {
    if (storyboard?.scenes && storyboard.scenes.length > 0) {
      return storyboard.scenes;
    }
    return [
      {
        scene_number: 1,
        title: 'Khám Phá Kỹ Năng AI Trending 2026',
        voiceover_text: 'Chào mừng bạn đến với tổng quan kỹ năng AI tự hành mới nhất.',
        visual_description: 'Giới thiệu kỹ năng lập trình AI và hệ sinh thái.',
        duration_seconds: 5,
        image_url:
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      },
      {
        scene_number: 2,
        title: 'Tự Động Hóa Quy Trình Với Subagent',
        voiceover_text: 'Khả năng phối hợp đa tác tử xử lý các tác vụ phức tạp trong vài giây.',
        visual_description: 'Sơ đồ luồng phối hợp subagent và workflow tự động hóa.',
        duration_seconds: 6,
        image_url:
          'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
      },
      {
        scene_number: 3,
        title: 'Trải Nghiệm Ngay Hôm Nay',
        voiceover_text: 'Cài đặt và triển khai ngay vào workflow của bạn qua Agent Skills Trending.',
        visual_description: 'Giao diện cài đặt một chạm và hướng dẫn sử dụng.',
        duration_seconds: 5,
        image_url:
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
      },
    ];
  }, [storyboard?.scenes]);

  // Audio is the only clock once narration exists. The pure timeline builder
  // guarantees contiguous frames and keeps preview/export on identical cuts.
  const scenesWithTimeline = React.useMemo(() => {
    return buildVideoTimeline({ scenes, ttsResult, fps });
  }, [scenes, ttsResult, fps]);



  return (
    <AbsoluteFill style={{ backgroundColor: '#090d16', fontFamily: 'sans-serif' }}>
      {/* Audio Track */}
      {audioSrc && (
        <Audio
          src={audioSrc}
          volume={1}
        />
      )}

      {/* Render Scenes Sequentially */}
      {scenesWithTimeline.map(({ scene, fromFrame, durationFrames, sceneSubtitles, index }) => {
        const isIntro = index === 0;
        const isOutro = index === scenesWithTimeline.length - 1;
        // scene_type field from backend takes precedence; fallback to position-based inference
        const sceneType = scene.scene_type || (isIntro ? 'intro' : isOutro ? 'outro' : 'content');
        const activeScene = showCaptions ? scene : { ...scene, voiceover_text: '' };
        const showInformationDeck = !['intro', 'github', 'outro'].includes(sceneType);

        return (
          <Sequence
            key={`${scene.scene_number ?? index}-${index}`}
            from={fromFrame}
            durationInFrames={durationFrames}
          >
            {sceneType === 'intro' && (
              <IntroScene
                scene={activeScene}
                subtitles={showCaptions ? sceneSubtitles : []}
                skillTitle={skillTitle}
                skillStats={skillStats}
                durationInFrames={durationFrames}
                totalScenes={scenesWithTimeline.length}
              />
            )}
            {sceneType === 'stat' && (
              <StatScene
                scene={activeScene}
                subtitles={showCaptions ? sceneSubtitles : []}
                durationInFrames={durationFrames}
                sceneIndex={index}
                totalScenes={scenesWithTimeline.length}
              />
            )}
            {sceneType === 'github' && (
              <GitHubWalkthroughScene
                scene={activeScene}
                subtitles={showCaptions ? sceneSubtitles : []}
                durationInFrames={durationFrames}
                sceneIndex={index}
                totalScenes={scenesWithTimeline.length}
              />
            )}
            {sceneType === 'code' && (
              <CodeSnippetScene
                scene={activeScene}
                subtitles={showCaptions ? sceneSubtitles : []}
                durationInFrames={durationFrames}
                sceneIndex={index}
                totalScenes={scenesWithTimeline.length}
              />
            )}
            {(sceneType === 'comparison' || sceneType === 'pain') && (
              <ComparisonScene
                scene={activeScene}
                subtitles={showCaptions ? sceneSubtitles : []}
                durationInFrames={durationFrames}
                sceneIndex={index}
                totalScenes={scenesWithTimeline.length}
              />
            )}
            {sceneType === 'architecture' && (
              <ArchitectureScene
                scene={activeScene}
                subtitles={showCaptions ? sceneSubtitles : []}
                durationInFrames={durationFrames}
                sceneIndex={index}
                totalScenes={scenesWithTimeline.length}
              />
            )}
            {sceneType === 'terminal' && (
              <TerminalScene
                scene={activeScene}
                subtitles={showCaptions ? sceneSubtitles : []}
                durationInFrames={durationFrames}
                sceneIndex={index}
                totalScenes={scenesWithTimeline.length}
              />
            )}
            {(sceneType === 'features' || sceneType === 'security') && (
              <FeatureGridScene
                scene={activeScene}
                subtitles={showCaptions ? sceneSubtitles : []}
                durationInFrames={durationFrames}
                sceneIndex={index}
                totalScenes={scenesWithTimeline.length}
              />
            )}
            {sceneType === 'outro' && (
              <OutroScene
                scene={activeScene}
                subtitles={showCaptions ? sceneSubtitles : []}
                skillTitle={skillTitle}
                durationInFrames={durationFrames}
              />
            )}
            {sceneType === 'content' && (
              <ContentScene
                scene={activeScene}
                sceneIndex={index}
                totalScenes={scenesWithTimeline.length}
                subtitles={showCaptions ? sceneSubtitles : []}
                durationInFrames={durationFrames}
              />
            )}
            {showInformationDeck && (
              <SceneInformationDeck
                scene={scene}
                sceneType={sceneType}
                sceneIndex={index}
                totalScenes={scenesWithTimeline.length}
                durationInFrames={durationFrames}
              />
            )}
          </Sequence>
        );
      })}

    </AbsoluteFill>
  );
};
