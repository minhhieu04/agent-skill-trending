import React from 'react';
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { VideoScene } from '../../types';

interface SceneInformationDeckProps {
  scene: VideoScene;
  sceneType: VideoScene['scene_type'];
  sceneIndex: number;
  totalScenes: number;
  durationInFrames: number;
}

interface InformationFact {
  icon: string;
  label: string;
  value: string;
  color: string;
}

const FACT_COLORS = ['#38bdf8', '#c084fc', '#34d399', '#fbbf24'];

const cleanText = (value?: string) => value?.replace(/\s+/g, ' ').trim() || '';

const truncate = (value: string, maxLength: number) => (
  value.length > maxLength ? `${value.slice(0, maxLength - 1).trimEnd()}…` : value
);

const formatCount = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return value.toLocaleString('en-US');
};

const repositoryLabel = (scene: VideoScene) => {
  if (scene.repository_name) {
    return scene.repository_owner
      ? `${scene.repository_owner}/${scene.repository_name}`
      : scene.repository_name;
  }

  const match = scene.repository_url?.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  return match ? `${match[1]}/${match[2]}` : '';
};

const addFact = (
  facts: InformationFact[],
  label: string,
  value: string | number | undefined,
  icon: string,
) => {
  if (value === undefined || value === null || value === '') return;
  const normalizedValue = cleanText(String(value));
  if (!normalizedValue) return;
  const duplicate = facts.some((fact) => (
    fact.label === label || fact.value.toLowerCase() === normalizedValue.toLowerCase()
  ));
  if (duplicate) return;

  facts.push({
    icon,
    label,
    value: truncate(normalizedValue, 72),
    color: FACT_COLORS[facts.length % FACT_COLORS.length],
  });
};

const buildFacts = (
  scene: VideoScene,
  sceneType: VideoScene['scene_type'],
  sceneIndex: number,
  totalScenes: number,
  actualDurationSeconds: number,
) => {
  const facts: InformationFact[] = [];
  const repo = repositoryLabel(scene);

  if (sceneType === 'stat') {
    if (scene.stars_count !== undefined) addFact(facts, 'GitHub stars', formatCount(scene.stars_count), '★');
    if (scene.forks_count !== undefined) addFact(facts, 'Forks', formatCount(scene.forks_count), '⑂');
    if (scene.open_issues !== undefined) addFact(facts, 'Open issues', formatCount(scene.open_issues), '●');
    if (scene.trending_score !== undefined) addFact(facts, 'Trending score', `${scene.trending_score}/100`, '↗');
  } else if (sceneType === 'comparison' || sceneType === 'pain') {
    addFact(facts, 'Trước', scene.before_text, '−');
    addFact(facts, 'Sau', scene.after_text, '+');
  } else if (sceneType === 'code') {
    const codeLines = scene.code_snippet?.split('\n').filter((line) => line.trim()).length;
    addFact(facts, 'Code đang xem', codeLines ? `${codeLines} dòng` : undefined, '</>');
    addFact(facts, 'Repository', repo, '⌘');
    addFact(facts, 'Loại tài nguyên', scene.asset_type, '◆');
  } else if (sceneType === 'terminal') {
    addFact(facts, 'Lệnh thực thi', scene.terminal_command, '$');
    scene.terminal_output?.slice(0, 3).forEach((line, index) => {
      addFact(facts, `Kết quả ${index + 1}`, line, index === 2 ? '✓' : '→');
    });
  } else if (sceneType === 'features' || sceneType === 'security') {
    scene.feature_items?.slice(0, 4).forEach((item) => {
      addFact(facts, item.title, item.desc, item.icon || '•');
    });
  } else {
    scene.feature_items?.slice(0, 2).forEach((item) => {
      addFact(facts, item.title, item.desc, item.icon || '•');
    });
    addFact(facts, 'Repository', repo, '⌘');
    addFact(facts, 'Loại tài nguyên', scene.asset_type, '◆');
  }

  // Factual fallbacks keep sparse scenes informative without inventing claims.
  addFact(facts, 'Repository', repo, '⌘');
  addFact(facts, 'Nguồn', scene.source_ref, '↗');
  addFact(facts, 'Thời lượng theo audio', `${actualDurationSeconds.toFixed(1)}s`, '◷');
  addFact(
    facts,
    'Vị trí nội dung',
    `Scene ${String(sceneIndex + 1).padStart(2, '0')} / ${String(totalScenes).padStart(2, '0')}`,
    '▦',
  );

  return facts.slice(0, 4);
};

export const SceneInformationDeck: React.FC<SceneInformationDeckProps> = React.memo(({
  scene,
  sceneType,
  sceneIndex,
  totalScenes,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;
  const sceneProgress = Math.max(0, Math.min(1, frame / Math.max(1, durationInFrames - 1)));
  const visualBeats = React.useMemo(
    () => (scene.visual_beats || []).slice().sort((left, right) => left.at - right.at),
    [scene.visual_beats],
  );
  const activeBeat = visualBeats.reduce(
    (current, beat) => (beat.at <= sceneProgress ? beat : current),
    visualBeats[0],
  );
  const facts = React.useMemo(
    () => buildFacts(scene, sceneType, sceneIndex, totalScenes, durationInFrames / fps),
    [scene, sceneType, sceneIndex, totalScenes, durationInFrames, fps],
  );
  const source = cleanText(scene.source_ref)
    || repositoryLabel(scene)
    || cleanText(scene.asset_type)
    || 'Chưa có source_ref';
  const takeaway = truncate(
    cleanText(activeBeat?.detail)
      || cleanText(scene.readme_excerpt)
      || cleanText(scene.visual_description)
      || cleanText(scene.voiceover_text),
    isVertical ? 180 : 240,
  );

  const deckSpring = spring({
    frame: Math.max(0, frame - Math.round(fps * 0.28)),
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.9 },
  });
  const opacity = interpolate(deckSpring, [0, 1], [0, 1]);
  const translateY = interpolate(deckSpring, [0, 1], [42, 0]);
  const fadeOut = interpolate(
    frame,
    [Math.max(0, durationInFrames - Math.round(fps * 0.5)), durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <div style={{
      position: 'absolute',
      top: isVertical ? '48.5%' : '51%',
      left: isVertical ? '4%' : '5%',
      right: isVertical ? '4%' : '5%',
      bottom: isVertical ? '16.5%' : '15%',
      zIndex: 18,
      pointerEvents: 'none',
      opacity: opacity * fadeOut,
      transform: `translateY(${translateY}px)`,
      display: 'flex',
      flexDirection: 'column',
      gap: isVertical ? 14 : 10,
      padding: isVertical ? '22px 24px' : '14px 18px',
      borderRadius: isVertical ? 28 : 20,
      overflow: 'hidden',
      background: 'linear-gradient(145deg, rgba(9,15,30,0.96), rgba(22,28,50,0.94))',
      border: '1px solid rgba(125,211,252,0.25)',
      boxShadow: '0 26px 70px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,255,255,0.08)',
      backdropFilter: 'blur(24px)',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 90% 0%, rgba(168,85,247,0.16), transparent 42%), radial-gradient(circle at 0% 100%, rgba(56,189,248,0.12), transparent 38%)',
      }} />

      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: isVertical ? 9 : 7,
            height: isVertical ? 9 : 7,
            borderRadius: 999,
            background: '#38bdf8',
            boxShadow: '0 0 14px rgba(56,189,248,0.9)',
          }} />
          <span style={{
            color: '#7dd3fc',
            fontSize: isVertical ? 18 : 13,
            fontWeight: 900,
            letterSpacing: '0.14em',
          }}>
            {truncate(
              activeBeat
                ? `${activeBeat.badge || 'BEAT'} · ${activeBeat.title}`
                : 'QUICK CONTEXT',
              isVertical ? 58 : 76,
            )}
          </span>
        </div>
        <span style={{
          color: '#94a3b8',
          fontSize: isVertical ? 17 : 12,
          fontWeight: 800,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {String(sceneIndex + 1).padStart(2, '0')} / {String(totalScenes).padStart(2, '0')}
        </span>
      </div>

      {visualBeats.length > 1 && (
        <div style={{ position: 'relative', display: 'flex', gap: 7 }}>
          {visualBeats.map((beat, index) => {
            const active = beat === activeBeat;
            return (
              <span key={`${beat.at}-${index}`} style={{
                height: 4,
                flex: 1,
                borderRadius: 99,
                background: active ? '#38bdf8' : beat.at < sceneProgress ? 'rgba(56,189,248,0.38)' : 'rgba(148,163,184,0.18)',
                boxShadow: active ? '0 0 12px rgba(56,189,248,0.75)' : 'none',
              }} />
            );
          })}
        </div>
      )}

      <div style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: isVertical ? '0.78fr 1.22fr' : '0.9fr 1.1fr',
        gap: isVertical ? 18 : 12,
        flex: 1,
        minHeight: 0,
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minWidth: 0,
          padding: isVertical ? '16px 16px 14px' : '10px 12px',
          borderRadius: isVertical ? 20 : 14,
          background: 'linear-gradient(145deg, rgba(56,189,248,0.12), rgba(99,102,241,0.08))',
          border: '1px solid rgba(125,211,252,0.2)',
        }}>
          <div>
            <div style={{
              marginBottom: isVertical ? 10 : 6,
              color: '#64748b',
              fontSize: isVertical ? 15 : 11,
              fontWeight: 900,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>
              Key takeaway
            </div>
            <div style={{
              color: '#f8fafc',
              fontSize: isVertical ? 25 : 17,
              fontWeight: 800,
              lineHeight: 1.32,
              display: '-webkit-box',
              WebkitLineClamp: isVertical ? 5 : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {takeaway}
            </div>
          </div>
          <div style={{
            marginTop: 12,
            paddingTop: isVertical ? 12 : 8,
            borderTop: '1px solid rgba(148,163,184,0.18)',
            color: '#94a3b8',
            fontSize: isVertical ? 15 : 11,
            fontWeight: 700,
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            SOURCE · {truncate(source, 48)}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(2, minmax(0, 1fr))',
          gap: isVertical ? 10 : 8,
          minWidth: 0,
        }}>
          {facts.map((fact, index) => {
            const cardSpring = spring({
              frame: Math.max(0, frame - Math.round(fps * (0.42 + index * 0.1))),
              fps,
              config: { damping: 17, stiffness: 145 },
            });
            const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
            const cardY = interpolate(cardSpring, [0, 1], [24, 0]);

            return (
              <div key={`${fact.label}-${index}`} style={{
                minWidth: 0,
                padding: isVertical ? '14px 15px' : '9px 11px',
                borderRadius: isVertical ? 18 : 12,
                background: `linear-gradient(145deg, ${fact.color}18, rgba(15,23,42,0.82))`,
                border: `1px solid ${fact.color}38`,
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: isVertical ? 8 : 5,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ color: fact.color, fontSize: isVertical ? 19 : 13, fontWeight: 900 }}>
                    {fact.icon}
                  </span>
                  <span style={{
                    minWidth: 0,
                    color: '#94a3b8',
                    fontSize: isVertical ? 14 : 10,
                    fontWeight: 900,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {fact.label}
                  </span>
                </div>
                <div style={{
                  color: '#f8fafc',
                  fontSize: isVertical ? 20 : 14,
                  fontWeight: 800,
                  lineHeight: 1.25,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  overflowWrap: 'anywhere',
                }}>
                  {fact.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

SceneInformationDeck.displayName = 'SceneInformationDeck';
