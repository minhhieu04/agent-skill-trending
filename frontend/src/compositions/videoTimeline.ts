import { SubtitleEntry, TTSResult, VideoScene } from '../types';

export interface SceneTimelineItem {
  scene: VideoScene;
  index: number;
  fromFrame: number;
  durationFrames: number;
  startMs: number;
  endMs: number;
  sceneSubtitles: SubtitleEntry[];
}

interface BuildVideoTimelineInput {
  scenes: VideoScene[];
  ttsResult: TTSResult | null;
  fps: number;
}

const sceneWords = (scene: VideoScene) => (
  (scene.voiceover_text || '').trim().split(/\s+/).filter(Boolean)
);

const clamp = (value: number, min: number, max: number) => (
  Math.max(min, Math.min(max, value))
);

export const getVideoDurationInFrames = (
  scenes: VideoScene[],
  ttsResult: TTSResult | null,
  fps: number,
) => {
  const audioDuration = Number(ttsResult?.duration_seconds || 0);
  const storyboardDuration = scenes.reduce((sum, scene) => sum + Number(scene.duration_seconds || 0), 0);
  return Math.max(fps * 2, Math.round((audioDuration || storyboardDuration || 2) * fps));
};

const hasValidExplicitSegments = (
  segments: NonNullable<TTSResult['scene_segments']>,
  sceneCount: number,
  audioDurationMs: number,
) => {
  if (segments.length !== sceneCount || audioDurationMs <= 0) return false;
  let previousEnd = 0;
  return segments.every((segment, index) => {
    const valid = segment.scene_index === index
      && segment.start_ms >= 0
      && segment.end_ms > segment.start_ms
      && segment.start_ms >= previousEnd - 2
      && segment.end_ms <= audioDurationMs + 2;
    previousEnd = segment.end_ms;
    return valid;
  });
};

export const buildVideoTimeline = ({
  scenes,
  ttsResult,
  fps,
}: BuildVideoTimelineInput): SceneTimelineItem[] => {
  if (scenes.length === 0) return [];

  const subtitles = (ttsResult?.subtitle_entries || [])
    .filter((entry) => entry.text?.trim() && Number.isFinite(entry.start_ms) && Number.isFinite(entry.end_ms))
    .map((entry) => ({
      text: entry.text.trim(),
      start_ms: Math.max(0, Math.round(entry.start_ms)),
      end_ms: Math.max(Math.round(entry.start_ms) + 1, Math.round(entry.end_ms)),
    }));
  const audioDurationMs = ttsResult?.duration_seconds
    ? Math.max(1, Math.round(ttsResult.duration_seconds * 1000))
    : Math.max(1, Math.round(scenes.reduce((sum, scene) => sum + (scene.duration_seconds || 0), 0) * 1000));
  const totalFrames = getVideoDurationInFrames(scenes, ttsResult, fps);
  const explicitSegments = ttsResult?.scene_segments || [];
  const useExplicitSegments = hasValidExplicitSegments(explicitSegments, scenes.length, audioDurationMs);
  const captionLeadMs = ttsResult ? Math.max(0, ttsResult.caption_lead_ms ?? 90) : 0;

  const wordCounts = scenes.map((scene) => Math.max(1, sceneWords(scene).length));
  const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
  const durationWeights = scenes.map((scene) => Math.max(1, Number(scene.duration_seconds || 1)));
  const totalDurationWeight = durationWeights.reduce((sum, weight) => sum + weight, 0);
  let cumulativeWords = 0;
  let cumulativeDurationWeight = 0;
  let previousEndMs = 0;
  let previousEndFrame = 0;
  let previousSubtitleEnd = 0;

  return scenes.map((scene, index) => {
    const isLast = index === scenes.length - 1;
    const explicit = useExplicitSegments ? explicitSegments[index] : null;
    const startMs = previousEndMs;

    cumulativeWords += wordCounts[index];
    cumulativeDurationWeight += durationWeights[index];

    let endMs: number;
    if (isLast) {
      endMs = audioDurationMs;
    } else if (explicit) {
      endMs = clamp(Math.round(explicit.end_ms), startMs + 1, audioDurationMs - 1);
    } else if (subtitles.length > 0) {
      const nextSubtitleIndex = clamp(
        Math.round(cumulativeWords / totalWords * subtitles.length),
        previousSubtitleEnd + 1,
        subtitles.length,
      );
      endMs = nextSubtitleIndex < subtitles.length
        ? subtitles[nextSubtitleIndex].start_ms
        : Math.round(audioDurationMs * cumulativeWords / totalWords);
    } else {
      endMs = Math.round(audioDurationMs * cumulativeDurationWeight / totalDurationWeight);
    }
    endMs = clamp(endMs, startMs + 1, audioDurationMs);

    const subtitleStart = explicit
      ? clamp(explicit.subtitle_start_index, 0, subtitles.length)
      : previousSubtitleEnd;
    const subtitleEnd = explicit
      ? clamp(explicit.subtitle_end_index, subtitleStart, subtitles.length)
      : (isLast
        ? subtitles.length
        : clamp(Math.round(cumulativeWords / totalWords * subtitles.length), subtitleStart, subtitles.length));
    const sceneSubtitles = subtitles.slice(subtitleStart, subtitleEnd).map((subtitle) => ({
      text: subtitle.text,
      start_ms: clamp(subtitle.start_ms - startMs - captionLeadMs, 0, Math.max(0, endMs - startMs - 1)),
      end_ms: clamp(subtitle.end_ms - startMs - captionLeadMs, 1, endMs - startMs),
    })).map((subtitle) => ({
      ...subtitle,
      end_ms: Math.max(subtitle.start_ms + 1, subtitle.end_ms),
    }));

    const fromFrame = previousEndFrame;
    const endFrame = isLast
      ? totalFrames
      : clamp(Math.round(endMs / 1000 * fps), fromFrame + 1, totalFrames - 1);
    const item: SceneTimelineItem = {
      scene,
      index,
      fromFrame,
      durationFrames: Math.max(1, endFrame - fromFrame),
      startMs,
      endMs,
      sceneSubtitles,
    };

    previousEndMs = endMs;
    previousEndFrame = endFrame;
    previousSubtitleEnd = subtitleEnd;
    return item;
  });
};
