import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Video, 
  Mic, 
  FileText, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Volume2, 
  VolumeX,
  Layers, 
  Smartphone, 
  Monitor, 
  Copy, 
  Check, 
  Radio, 
  Sliders,
  ChevronRight,
  RefreshCw,
  Zap,
  Flame,
  Film,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Palette,
  Scale,
  BarChart3,
  Code,
  Terminal,
  GitFork,
  Target,
  MessageSquare,
  Star
} from 'lucide-react';
import { NeuSelect } from '../components/NeuSelect';


import { useQuery, useMutation } from '@tanstack/react-query';
import { Player, PlayerRef } from '@remotion/player';
import { SkillVideoComposition } from '../compositions/SkillVideoComposition';
import { buildVideoTimeline, getVideoDurationInFrames } from '../compositions/videoTimeline';
import { api } from '../api/client';
import { 
  Skill, 
  VoiceOption, 
  BlogPost, 
  VideoStoryboard, 
  TTSResult 
} from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

interface VideoBlogStudioProps {
  skills?: Skill[];
  initialSkill?: Skill | null;
}

// Constants outside component to avoid re-computation on each render
const VIDEO_FPS = 30;

const formatSRTTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = ms % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
};

export const VideoBlogStudio: React.FC<VideoBlogStudioProps> = ({ 
  skills = [], 
  initialSkill = null 
}) => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [activeStep, setActiveStep] = useState<'script' | 'voice' | 'player'>('script');

  const [selectedSkillId, setSelectedSkillId] = useState<number | ''>(initialSkill ? initialSkill.id : '');
  const [customTopic, setCustomTopic] = useState<string>(
    initialSkill ? (initialSkill.title || initialSkill.name) : 'Xu Hướng Kỹ Năng Lập Trình AI & Agent Skills 2026'
  );
  const [tone, setTone] = useState<string>('professional');
  const [targetDuration, setTargetDuration] = useState<number>(60);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [customNotes, setCustomNotes] = useState<string>('');

  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [storyboard, setStoryboard] = useState<VideoStoryboard | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>('gemini-Aoede');
  const [readingSpeed, setReadingSpeed] = useState<string>('+15%');
  const [pitch, setPitch] = useState<string>('+2Hz');
  const [voicePreset, setVoicePreset] = useState<'hype' | 'professional' | 'podcast'>('hype');
  const [voiceProviderFilter, setVoiceProviderFilter] = useState<'all' | 'gemini_audio' | 'google_tts' | 'edge_tts'>('all');
  const [ttsResult, setTtsResult] = useState<TTSResult | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  const [isExportingVideo, setIsExportingVideo] = useState<boolean>(false);

  const [exportProgress, setExportProgress] = useState<number>(0);
  const [isGeneratingImages, setIsGeneratingImages] = useState<boolean>(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<PlayerRef | null>(null);
  const currentSceneIndexRef = React.useRef(0);

  // audioBlobUrl: useEffect with cleanup to prevent Blob URL memory leaks
  const [audioBlobUrl, setAudioBlobUrl] = React.useState<string | undefined>(undefined);
  React.useEffect(() => {
    if (!ttsResult?.audio_base64) {
      setAudioBlobUrl(undefined);
      return;
    }
    try {
      const byteCharacters = atob(ttsResult.audio_base64);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      const isWav = byteArray.length > 4 && byteArray[0] === 0x52 && byteArray[1] === 0x49 && byteArray[2] === 0x46 && byteArray[3] === 0x46;
      const mimeType = isWav ? 'audio/wav' : 'audio/mp3';
      const blob = new Blob([byteArray], { type: mimeType });
      const url = URL.createObjectURL(blob);
      setAudioBlobUrl(url);
      return () => URL.revokeObjectURL(url); // cleanup on unmount or ttsResult change
    } catch (e) {
      console.error('Error creating audio blob:', e);
      setAudioBlobUrl(undefined);
    }
  }, [ttsResult?.audio_base64]);

  const totalDurationInFrames = React.useMemo(() => {
    return getVideoDurationInFrames(storyboard?.scenes || [], ttsResult, VIDEO_FPS);
  }, [ttsResult, storyboard?.scenes]);
  const playerTimeline = React.useMemo(() => buildVideoTimeline({
    scenes: storyboard?.scenes || [],
    ttsResult,
    fps: VIDEO_FPS,
  }), [storyboard?.scenes, ttsResult]);


  const currentSkill = skills.find(s => s.id === Number(selectedSkillId)) || initialSkill;

  useEffect(() => {
    if (initialSkill) {
      setSelectedSkillId(initialSkill.id);
      setCustomTopic(initialSkill.title || initialSkill.name);
    }
  }, [initialSkill]);

  const { data: voices = [] } = useQuery<VoiceOption[]>({
    queryKey: ['studioVoices'],
    queryFn: api.getVoices,
  });

  useEffect(() => {
    if (language === 'en' && selectedVoice.startsWith('vi-')) {
      setSelectedVoice('en-US-ChristopherNeural');
      setTtsResult(null);
    } else if (language === 'vi' && !selectedVoice.startsWith('vi-')) {
      setSelectedVoice('vi-VN-HoaiMyNeural');
      setTtsResult(null);
    }
  }, [language]);

  const skillSelectOptions = React.useMemo(() => [
    { value: '' as any, label: t('studio_select_skill') },
    ...skills.map((s) => ({
      value: s.id,
      label: s.title || s.name,
      badge: `${s.stars.toLocaleString()} ★`,
      sublabel: s.primary_language ? `${s.primary_language} • ${s.category}` : s.category,
      icon: <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
    }))
  ], [skills, t]);

  const toneOptions = React.useMemo(() => [
    { value: 'professional', label: t('studio_tone_professional') },
    { value: 'hype', label: t('studio_tone_hype') },
    { value: 'casual', label: t('studio_tone_casual') },
    { value: 'deep_dive', label: t('studio_tone_deepdive') },
  ], [t]);

  const aspectRatioOptions = React.useMemo(() => [
    { value: '9:16', label: '9:16 (TikTok/Shorts/Reels)', icon: <Smartphone className="w-3.5 h-3.5 text-[var(--primary)]" /> },
    { value: '16:9', label: '16:9 (YouTube/Landscape)', icon: <Monitor className="w-3.5 h-3.5 text-[var(--primary)]" /> },
  ], []);

  const sceneTypeOptions = React.useMemo(() => [
    { value: 'intro', label: 'Hook Intro' },
    { value: 'github', label: 'GitHub Walkthrough' },
    { value: 'comparison', label: 'So Sánh (Before/After)' },
    { value: 'stat', label: 'Số Liệu (Stats)' },
    { value: 'architecture', label: 'Kiến Trúc Flow' },
    { value: 'code', label: 'Code Demo' },
    { value: 'terminal', label: 'Terminal CLI' },
    { value: 'features', label: '4 Tính Năng' },
    { value: 'content', label: 'Nội Dung' },
    { value: 'outro', label: 'Kêu Gọi (Outro)' },
  ], []);

  const applyVoicePreset = (preset: 'hype' | 'professional' | 'podcast') => {
    setTtsResult(null);
    setVoicePreset(preset);
    if (preset === 'hype') {
      setReadingSpeed('+15%');
      setPitch('+2Hz');
    } else if (preset === 'professional') {
      setReadingSpeed('+5%');
      setPitch('+0Hz');
    } else {
      setReadingSpeed('-5%');
      setPitch('-2Hz');
    }
  };

  const blogMutation = useMutation({
    mutationFn: api.generateBlog,
    onSuccess: (data) => {
      setBlogPost(data);
      showToast(language === 'vi' ? 'Đã sinh bài viết blog công nghệ thành công!' : 'Tech blog generated successfully!');
    },
    onError: (err: any) => {
      showToast(err.message || 'Lỗi khi sinh blog', 'error');
    }
  });

  const storyboardMutation = useMutation({
    mutationFn: api.generateStoryboard,
    onSuccess: async (data) => {
      setStoryboard(data);
      setTtsResult(null);
      setCurrentSceneIndex(0);
      const captures = new Map<string, Awaited<ReturnType<typeof api.captureGitHubRepository>> | null>();
      const enrichedScenes = [];
      for (const scene of data.scenes) {
        if ((scene.scene_type === 'github' || scene.asset_type === 'github_walkthrough') && scene.repository_url) {
          if (!captures.has(scene.repository_url)) {
            try {
              captures.set(scene.repository_url, await api.captureGitHubRepository(
                scene.repository_url,
                data.aspect_ratio as '9:16' | '16:9',
                scene.duration_seconds,
              ));
            } catch {
              captures.set(scene.repository_url, null);
            }
          }
          const capture = captures.get(scene.repository_url);
          enrichedScenes.push(capture ? { ...scene, ...capture } : { ...scene, capture_status: 'unavailable' as const });
        } else {
          enrichedScenes.push(scene);
        }
      }
      setStoryboard({ ...data, scenes: enrichedScenes });
      const captureFailed = enrichedScenes.some(scene => scene.scene_type === 'github' && scene.capture_status === 'unavailable');
      showToast(captureFailed
        ? (language === 'vi' ? 'Kịch bản đã tạo, nhưng repository nguồn không capture được. Hãy kiểm tra URL GitHub.' : 'Storyboard created, but the repository source could not be captured. Check its GitHub URL.')
        : (language === 'vi' ? 'Đã tạo kịch bản và capture GitHub thật!' : 'Storyboard and real GitHub capture generated!'),
        captureFailed ? 'error' : 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Lỗi khi sinh storyboard', 'error');
    }
  });

  const sceneImageMutation = useMutation({
    mutationFn: ({ prompt, sceneNumber }: { prompt: string; sceneNumber: number }) => 
      api.generateSceneImage(prompt, sceneNumber, aspectRatio),
    onSuccess: (data) => {
      if (storyboard) {
        const updatedScenes = storyboard.scenes.map(s => 
          s.scene_number === data.scene_number ? { ...s, image_url: data.image_url } : s
        );
        setStoryboard({ ...storyboard, scenes: updatedScenes });
        showToast(language === 'vi' ? `Đã cập nhật ảnh AI Scene ${data.scene_number}!` : `Scene ${data.scene_number} image updated!`);
      }
    },
    onError: (err: any) => {
      showToast(err.message || 'Lỗi khi sinh ảnh AI', 'error');
    }
  });

  const ttsMutation = useMutation({
    mutationFn: api.synthesizeTTS,
    onSuccess: (data) => {
      setTtsResult(data);
      showToast(language === 'vi' ? 'Đã tạo giọng đọc AI thành công!' : 'AI voice audio synthesized!');
      setActiveStep('player');
    },
    onError: (err: any) => {
      showToast(err.message || 'Lỗi khi tạo audio', 'error');
    }
  });

  const handleRegenerateSceneImage = (sceneNumber: number, prompt?: string) => {
    const scene = storyboard?.scenes.find(s => s.scene_number === sceneNumber);
    const targetPrompt = prompt || scene?.visual_prompt || scene?.visual_description || 'Modern AI Coding Agent';
    sceneImageMutation.mutate({ prompt: targetPrompt, sceneNumber });
  };

  const handleGenerateAllSceneImages = async () => {
    if (!storyboard?.scenes || storyboard.scenes.length === 0) return;
    setIsGeneratingImages(true);
    showToast(language === 'vi' ? 'Đang tạo ảnh nghệ thuật AI cho các phân cảnh...' : 'Generating AI scene visuals...');
    try {
      const updatedScenes = [...storyboard.scenes];
      const pendingIndexes = updatedScenes
        .map((scene, index) => ({ scene, index }))
        .filter(({ scene }) => scene.scene_type !== 'github' && scene.asset_type !== 'github_walkthrough')
        .map(({ index }) => index);
      let nextJob = 0;
      const worker = async () => {
        while (nextJob < pendingIndexes.length) {
          const index = pendingIndexes[nextJob];
          nextJob += 1;
          const scene = updatedScenes[index];
          const targetPrompt = scene.visual_prompt || scene.visual_description || 'AI Coding Assistant';
          const res = await api.generateSceneImage(targetPrompt, scene.scene_number, aspectRatio);
          updatedScenes[index] = { ...scene, image_url: res.image_url };
          setStoryboard(prev => prev ? { ...prev, scenes: [...updatedScenes] } : prev);
        }
      };
      await Promise.all(Array.from({ length: Math.min(3, pendingIndexes.length) }, worker));
      showToast(language === 'vi' ? 'Đã hoàn thành sinh toàn bộ ảnh AI!' : 'All AI scene visuals generated!');
    } catch (e: any) {
      showToast(e.message || 'Lỗi sinh ảnh AI', 'error');
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const handleGenerateAll = async () => {
    const skillId = selectedSkillId ? Number(selectedSkillId) : undefined;
    const skill = skills.find(s => s.id === skillId);
    try {
      const generatedBlog = await blogMutation.mutateAsync({
        skill_id: skillId,
        topic: customTopic,
        tone,
        language: language as 'vi' | 'en',
        custom_notes: customNotes,
      });
      const skillContext = skill
        ? `${skill.title || skill.name}: ${skill.description || skill.ai_summary || ''}`
        : customTopic;
      await storyboardMutation.mutateAsync({
        skill_id: skillId,
        content: `${skillContext}\n\n${generatedBlog.content}`,
        target_duration: targetDuration,
        aspect_ratio: aspectRatio,
        language: language as 'vi' | 'en',
      });
    } catch {
      // Mutations already surface their specific errors through onError.
    }
  };

  const handleAddScene = (type: any = 'content') => {
    if (!storyboard) return;
    const nextNum = storyboard.scenes.length + 1;
    const newScene = {
      scene_number: nextNum,
      scene_type: type,
      title: type === 'github' ? 'Khám Phá Repository' :
             type === 'code' ? 'Demo Code Thực Tế' :
             type === 'comparison' ? 'So Sánh Before & After' :
             type === 'architecture' ? 'Kiến Trúc Multi-Agent' :
             type === 'stat' ? 'Số Liệu Benchmark' :
             type === 'terminal' ? 'Cài Đặt 1 Dòng Lệnh' :
             type === 'features' ? '4 Trụ Cột Tính Năng' :
             type === 'outro' ? 'Kêu Gọi Hành Động' : 'Phân Cảnh Nội Dung',
      voiceover_text: 'Đoạn lời thoại chi tiết cung cấp facts công nghệ cụ thể cho phân cảnh này.',
      visual_description: 'Hiệu ứng chuyển động trực quan với các layer đồ họa công nghệ cao.',
      duration_seconds: 8,
      image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    };
    const updated = [...storyboard.scenes, newScene].map((s, idx) => ({ ...s, scene_number: idx + 1 }));
    setStoryboard({ ...storyboard, scenes: updated });
    setTtsResult(null);
    showToast(language === 'vi' ? `Đã thêm phân cảnh (Scene ${updated.length})` : `Added Scene ${updated.length}`);
  };

  const handleDeleteScene = (sceneIndex: number) => {
    if (!storyboard || storyboard.scenes.length <= 1) {
      showToast(language === 'vi' ? 'Video phải có ít nhất 1 phân cảnh' : 'Video must have at least 1 scene', 'error');
      return;
    }
    const updated = storyboard.scenes.filter((_, i) => i !== sceneIndex).map((s, idx) => ({ ...s, scene_number: idx + 1 }));
    setStoryboard({ ...storyboard, scenes: updated });
    setTtsResult(null);
    showToast(language === 'vi' ? 'Đã xóa phân cảnh' : 'Scene deleted');
  };

  const handleUpdateScene = (sceneIndex: number, patch: Partial<any>) => {
    if (!storyboard) return;
    const updated = storyboard.scenes.map((s, i) => i === sceneIndex ? { ...s, ...patch } : s);
    setStoryboard({ ...storyboard, scenes: updated });
    if (patch.voiceover_text !== undefined) setTtsResult(null);
  };

  const handleMoveScene = (sceneIndex: number, direction: 'up' | 'down') => {
    if (!storyboard) return;
    const targetIndex = direction === 'up' ? sceneIndex - 1 : sceneIndex + 1;
    if (targetIndex < 0 || targetIndex >= storyboard.scenes.length) return;
    const copy = [...storyboard.scenes];
    const [moved] = copy.splice(sceneIndex, 1);
    copy.splice(targetIndex, 0, moved);
    const updated = copy.map((s, idx) => ({ ...s, scene_number: idx + 1 }));
    setStoryboard({ ...storyboard, scenes: updated });
    setTtsResult(null);
  };


  const handlePreviewVoice = async (voice: VoiceOption) => {
    // If currently previewing this exact voice, toggle stop
    if (previewingVoiceId === voice.id && previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
      setPreviewingVoiceId(null);
      return;
    }

    // Stop any existing preview audio
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }

    setPreviewingVoiceId(voice.id);
    showToast(language === 'vi' ? `Đang tải giọng đọc ${voice.name}...` : `Loading ${voice.name} preview...`);

    try {
      const res = await api.synthesizeTTS({
        text: voice.preview_text,
        voice: voice.id,
        provider: voice.provider || 'edge_tts',
        rate: readingSpeed,
        pitch: pitch
      });

      if (res && res.audio_base64) {
        const audio = new Audio(`data:audio/mp3;base64,${res.audio_base64}`);
        audio.volume = volume;
        previewAudioRef.current = audio;

        audio.onended = () => {
          setPreviewingVoiceId(null);
        };
        audio.onerror = (e) => {
          console.warn('Audio preview error:', e);
          setPreviewingVoiceId(null);
          showToast(language === 'vi' ? 'Không thể phát âm thanh nghe thử' : 'Failed to play preview', 'error');
        };

        await audio.play();
      } else {
        setPreviewingVoiceId(null);
        showToast(language === 'vi' ? 'Không nhận được dữ liệu âm thanh' : 'No audio data received', 'error');
      }
    } catch (err: any) {
      setPreviewingVoiceId(null);
      showToast(err.message || 'Lỗi khi nghe thử giọng', 'error');
    }
  };

  const handleSynthesizeFullAudio = () => {
    if (!storyboard || storyboard.scenes.length === 0) {
      showToast(language === 'vi' ? 'Vui lòng sinh kịch bản video trước' : 'Please generate storyboard first', 'error');
      return;
    }

    // Stop preview if playing
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
      setPreviewingVoiceId(null);
    }

    const currentVoiceObj = voices.find(v => v.id === selectedVoice);
    const fullScript = storyboard.scenes.map(s => s.voiceover_text).join(' ');
    ttsMutation.mutate({
      text: fullScript,
      scene_texts: storyboard.scenes.map(s => s.voiceover_text),
      voice: selectedVoice,
      provider: currentVoiceObj?.provider || 'edge_tts',
      rate: readingSpeed,
      pitch: pitch
    });
  };

  useEffect(() => {
    setCurrentSceneIndex(0);
    currentSceneIndexRef.current = 0;
    setIsPlaying(false);
  }, [ttsResult]);

  const togglePlay = () => {
    if (!ttsResult?.audio_base64) {
      if (storyboard && storyboard.scenes.length > 0) {
        showToast(language === 'vi' ? 'Đang tự động tạo giọng đọc AI cho toàn bộ video...' : 'Synthesizing AI voiceover for video...');
        handleSynthesizeFullAudio();
        return;
      }
      showToast(language === 'vi' ? 'Vui lòng sinh kịch bản ở Bước 1 trước' : 'Please generate storyboard first', 'error');
      return;
    }

    if (playerRef.current) {
      if (playerRef.current.isPlaying()) {
        playerRef.current.pause();
        setIsPlaying(false);
      } else {
        playerRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

  };

  useEffect(() => {
    const player = playerRef.current;
    if (!player || activeStep !== 'player') return;

    const handleFrameUpdate = (event: { detail: { frame: number } }) => {
      const matchingSegment = playerTimeline.find((segment, index) => (
        event.detail.frame >= segment.fromFrame
        && (event.detail.frame < segment.fromFrame + segment.durationFrames || index === playerTimeline.length - 1)
      ));
      const newSceneIndex = matchingSegment?.index ?? 0;
      if (newSceneIndex !== currentSceneIndexRef.current) {
        currentSceneIndexRef.current = newSceneIndex;
        setCurrentSceneIndex(newSceneIndex);
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      currentSceneIndexRef.current = 0;
      setCurrentSceneIndex(0);
    };

    player.addEventListener('frameupdate', handleFrameUpdate);
    player.addEventListener('play', handlePlay);
    player.addEventListener('pause', handlePause);
    player.addEventListener('ended', handleEnded);
    return () => {
      player.removeEventListener('frameupdate', handleFrameUpdate);
      player.removeEventListener('play', handlePlay);
      player.removeEventListener('pause', handlePause);
      player.removeEventListener('ended', handleEnded);
    };
  }, [activeStep, playerTimeline]);

  const handleSeekScene = (sceneIdx: number) => {
    if (!storyboard || !storyboard.scenes[sceneIdx]) return;
    const targetFrame = playerTimeline[sceneIdx]?.fromFrame || 0;

    currentSceneIndexRef.current = sceneIdx;
    setCurrentSceneIndex(sceneIdx);
    if (playerRef.current) {
      playerRef.current.seekTo(targetFrame);
    }
  };

  const handleExportVideo = async () => {
    if (!ttsResult?.audio_base64) {
      showToast(language === 'vi' ? 'Vui lòng sinh giọng đọc trước khi xuất video' : 'Please synthesize audio first', 'error');
      return;
    }
    if (!storyboard) {
      showToast(language === 'vi' ? 'Vui lòng tạo storyboard trước khi render' : 'Please create a storyboard before rendering', 'error');
      return;
    }

    setIsExportingVideo(true);
    setExportProgress(12);
    showToast(language === 'vi'
      ? 'Đang render MP4 chất lượng cao từ đúng composition preview...'
      : 'Rendering a high-quality MP4 from the preview composition...');

    try {
      const mp4Blob = await api.renderSkillVideo({
        storyboard,
        tts_result: ttsResult,
        skill_title: blogPost?.title || customTopic || currentSkill?.title || currentSkill?.name || 'AI Agent Skill',
        skill_stats: {
          stars: currentSkill?.stars,
          forks: currentSkill?.forks,
          language: currentSkill?.primary_language,
        },
        show_captions: showCaptions,
      });
      if (mp4Blob.size < 1024) throw new Error('Rendered MP4 is empty');

      setExportProgress(100);
      const mp4Url = URL.createObjectURL(mp4Blob);
      const download = document.createElement('a');
      download.href = mp4Url;
      download.download = `ai_video_${(currentSkill?.name || 'skill').replace(/\s+/g, '_')}_${Date.now()}.mp4`;
      download.click();
      URL.revokeObjectURL(mp4Url);
      showToast(language === 'vi'
        ? 'Xuất MP4 thành công — audio, cảnh và karaoke dùng chung một timeline.'
        : 'MP4 exported — audio, scenes, and karaoke share one timeline.');
    } catch (renderError) {
      setExportProgress(0);
      const message = renderError instanceof Error ? renderError.message : 'renderer không phản hồi';
      console.error('Remotion MP4 render failed:', renderError);
      showToast(language === 'vi'
        ? `Render MP4 thất bại: ${message}. Hệ thống đã chặn bản Canvas chất lượng thấp.`
        : `MP4 render failed: ${message}. The low-quality Canvas fallback was blocked.`, 'error');
    } finally {
      setIsExportingVideo(false);
    }
  };

  const handleCopyScript = () => {
    if (!blogPost) return;
    navigator.clipboard.writeText(blogPost.content);
    setCopiedScript(true);
    showToast(t('toast_copied'));
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleDownloadAudio = () => {
    if (!ttsResult?.audio_base64) {
      showToast(language === 'vi' ? 'Chưa có file audio để tải' : 'No audio file to download', 'error');
      return;
    }
    const byteCharacters = atob(ttsResult.audio_base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const isWav = byteArray.length > 4 && byteArray[0] === 0x52 && byteArray[1] === 0x49 && byteArray[2] === 0x46 && byteArray[3] === 0x46;
    const ext = isWav ? 'wav' : 'mp3';
    const blob = new Blob([byteArray], { type: isWav ? 'audio/wav' : 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_voice_${selectedVoice}_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('downloaded_file'));
  };

  const handleDownloadSRT = () => {
    if (!ttsResult?.subtitle_entries || ttsResult.subtitle_entries.length === 0) {
      showToast(language === 'vi' ? 'Chưa có phụ đề để tải' : 'No subtitles to download', 'error');
      return;
    }
    let srtContent = '';
    ttsResult.subtitle_entries.forEach((sub, idx) => {
      const start = formatSRTTime(sub.start_ms);
      const end = formatSRTTime(sub.end_ms);
      srtContent += `${idx + 1}\n${start} --> ${end}\n${sub.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles_${Date.now()}.srt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('downloaded_file'));
  };


  const handleDownloadMarkdown = () => {
    if (!blogPost) return;
    const blob = new Blob([blogPost.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${blogPost.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('downloaded_file'));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-3xl neu-flat p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider neu-inset-sm text-[var(--primary)] flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <Radio className="w-3 h-3 text-[var(--primary)]" />
                AI Video & Blog Studio (Beta)
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-mono rounded-full neu-inset-sm text-[var(--text-muted)] flex items-center gap-1 whitespace-nowrap shrink-0">
                <Sparkles className="w-2.5 h-2.5 text-[var(--primary)]" />
                Gemini 2.0 Live & Google AI
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-mono rounded-full neu-inset-sm text-[var(--text-muted)] whitespace-nowrap shrink-0 inline-flex items-center">
                Audio: Neural Edge-TTS (0đ)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight flex items-center gap-2.5">
              <Video className="w-6 h-6 text-[var(--primary)]" />
              {t('studio_title')}
            </h1>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {t('studio_subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-2xl neu-inset self-start md:self-auto shrink-0">
            <button
              onClick={() => setActiveStep('script')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeStep === 'script'
                  ? 'neu-flat-sm text-[var(--primary)] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              {t('studio_step1_title')}
            </button>
            <button
              onClick={() => setActiveStep('voice')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeStep === 'voice'
                  ? 'neu-flat-sm text-[var(--primary)] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              {t('studio_step2_title')}
            </button>
            <button
              onClick={() => setActiveStep('player')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeStep === 'player'
                  ? 'neu-flat-sm text-[var(--primary)] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              {t('studio_step3_title')}
            </button>
          </div>
        </div>
      </div>

      {activeStep === 'script' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-5 rounded-3xl neu-flat p-5 sm:p-6">
            <h2 className="text-sm sm:text-base font-bold text-[var(--text-main)] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[var(--primary)]" />
              {language === 'vi' ? 'Cấu Hình Nội Dung AI' : 'AI Content Configuration'}
            </h2>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-muted)]">
                {t('studio_topic_label')}
              </label>
              <NeuSelect
                value={selectedSkillId}
                onChange={(val) => {
                  const id = val ? Number(val) : '';
                  setSelectedSkillId(id);
                  if (id) {
                    const sk = skills.find(s => s.id === id);
                    if (sk) setCustomTopic(sk.title || sk.name);
                  }
                }}
                options={skillSelectOptions}
                placeholder={t('studio_select_skill')}
                icon={<Star className="w-3.5 h-3.5 text-amber-400" />}
                size="md"
                variant="inset"
                searchable={true}
                searchPlaceholder="Tìm kiếm skill theo tên, tag, ngôn ngữ..."
                fullWidth={true}
              />

              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder={t('studio_topic_placeholder')}
                className="w-full px-4 py-2.5 text-xs rounded-xl neu-inset text-[var(--text-main)] placeholder-[var(--text-muted)]/50 focus:outline-none"
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-[var(--text-muted)] font-semibold self-center">
                  {language === 'vi' ? 'Gợi ý hot:' : 'Hot topics:'}
                </span>
                {[
                  'Google Antigravity & AI Agent 2026',
                  'DeepMind Gemini 2.0 Live Audio',
                  'Model Context Protocol & Subagent',
                  'AST Security Scanner'
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setCustomTopic(tag);
                      setSelectedSkillId('');
                    }}
                    className="px-2.5 py-1 text-[10px] rounded-lg neu-btn-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-all font-medium cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-muted)]">
                  {t('studio_tone_label')}
                </label>
                <NeuSelect
                  value={tone}
                  onChange={(val) => setTone(String(val))}
                  options={toneOptions}
                  size="md"
                  variant="inset"
                  searchable={false}
                  fullWidth={true}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-muted)]">
                  {t('studio_aspect_ratio')}
                </label>
                <NeuSelect
                  value={aspectRatio}
                  onChange={(val) => setAspectRatio(val as '9:16' | '16:9')}
                  options={aspectRatioOptions}
                  size="md"
                  variant="inset"
                  searchable={false}
                  fullWidth={true}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-[var(--text-muted)]">
                <span>{language === 'vi' ? 'Thời Lượng Video Dự Kiến:' : 'Target Duration:'}</span>
                <span className="font-mono font-bold text-[var(--primary)]">{targetDuration}s</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[30, 60, 90, 180].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setTargetDuration(dur)}
                    className={`py-2 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer ${
                      targetDuration === dur
                        ? 'neu-inset text-[var(--primary)]'
                        : 'neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {dur}s
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-muted)]">
                {language === 'vi' ? 'Ghi Chú & Yêu Cầu Riêng (Tùy Chọn):' : 'Custom Notes (Optional):'}
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder={language === 'vi' ? 'Nhấn mạnh Subagent, Type-Safety, AST Security Scanner...' : 'Emphasize subagents, type-safety, AST security...'}
                rows={2}
                className="w-full px-4 py-2.5 text-xs rounded-xl neu-inset text-[var(--text-main)] placeholder-[var(--text-muted)]/50 focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={handleGenerateAll}
              disabled={blogMutation.isPending || storyboardMutation.isPending}
              className="w-full py-3 px-4 neu-primary font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {blogMutation.isPending || storyboardMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {language === 'vi' ? 'AI Đang Viết Blog & Kịch Bản...' : 'AI Generating Content...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {language === 'vi' ? 'Tự Động Sinh Blog & Kịch Bản Phân Cảnh' : 'Generate Blog & Storyboard'}
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-7 space-y-5">
            {storyboard && storyboard.scenes.length > 0 && (
              <div className="rounded-3xl neu-flat p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[var(--primary)]" />
                    {language === 'vi' ? 'Kịch Bản Phân Cảnh & Ảnh AI' : 'Video Storyboard & AI Visuals'} ({storyboard.scenes.length} {language === 'vi' ? 'cảnh' : 'scenes'})
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGenerateAllSceneImages}
                      disabled={isGeneratingImages}
                      className="px-3 py-1.5 text-[11px] font-bold rounded-xl neu-btn text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isGeneratingImages ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-[var(--primary)]" />}
                      <span>{language === 'vi' ? 'Sinh Lại Tất Cả Ảnh AI' : 'Re-generate All Visuals'}</span>
                    </button>
                    <button
                      onClick={() => setActiveStep('voice')}
                      className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {language === 'vi' ? 'Tiếp: Giọng đọc' : 'Next: Voice'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {storyboard.scenes.map((scene, idx) => {
                    return (
                      <div
                        key={scene.scene_number || idx}
                        className="p-4 rounded-2xl neu-inset space-y-3 transition-all"
                      >
                        <div className="flex items-center justify-between text-xs gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[var(--primary)] font-mono">
                              Scene {scene.scene_number}:
                            </span>
                            <input
                              type="text"
                              value={scene.title}
                              onChange={(e) => handleUpdateScene(idx, { title: e.target.value })}
                              className="font-bold bg-transparent text-[var(--text-main)] border-b border-transparent hover:border-[var(--shadow-dark)]/40 focus:border-[var(--primary)] focus:outline-none text-xs px-1"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Scene Type Selector */}
                            <NeuSelect
                              value={scene.scene_type || 'content'}
                              onChange={(val) => handleUpdateScene(idx, { scene_type: val as any })}
                              options={sceneTypeOptions}
                              size="xs"
                              variant="flat"
                              searchable={false}
                              align="right"
                            />

                            <button
                              type="button"
                              onClick={() => handleMoveScene(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] neu-btn-sm disabled:opacity-30 cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveScene(idx, 'down')}
                              disabled={idx === storyboard.scenes.length - 1}
                              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] neu-btn-sm disabled:opacity-30 cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteScene(idx)}
                              className="p-1 rounded-lg text-rose-500 hover:text-rose-600 neu-btn-sm cursor-pointer"
                              title="Delete Scene"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {scene.image_url && (
                          <div className="relative h-24 rounded-xl overflow-hidden neu-flat-xs group/img">
                            <img
                              src={scene.image_url}
                              alt={`Scene ${scene.scene_number}`}
                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-2">
                              <span className="text-[9px] font-mono text-white font-bold bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
                                <Palette className="w-2.5 h-2.5 inline text-[var(--primary)]" />
                                <span>AI Visual Layer</span>
                              </span>
                              <button
                                onClick={() => handleRegenerateSceneImage(scene.scene_number)}
                                disabled={sceneImageMutation.isPending}
                                className="px-2 py-0.5 text-[9px] font-bold rounded-lg bg-black/70 text-white hover:text-[var(--primary)] backdrop-blur-sm flex items-center gap-1 cursor-pointer"
                              >
                                <Sparkles className="w-2.5 h-2.5 text-[var(--primary)]" />
                                <span>{language === 'vi' ? 'Đổi Ảnh AI' : 'New Image'}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <div className="text-[11px] text-[var(--text-main)]">
                            <div className="flex items-center gap-1 mb-1">
                              <Mic className="w-3 h-3 text-[var(--primary)] inline shrink-0" />
                              <span className="font-semibold text-[var(--primary)]">Lời thoại:</span>
                            </div>
                            <textarea
                              value={scene.voiceover_text}
                              onChange={(e) => handleUpdateScene(idx, { voiceover_text: e.target.value })}
                              rows={2}
                              className="w-full p-2.5 text-xs rounded-xl neu-flat-xs text-[var(--text-main)] focus:outline-none resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Scene Toolbar */}
                  <div className="p-3 rounded-2xl neu-inset flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--primary)]">
                      {language === 'vi' ? '+ Thêm phân cảnh nhanh:' : '+ Quick add scene:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { type: 'github', label: 'GitHub' },
                        { type: 'comparison', label: 'So Sánh' },
                        { type: 'stat', label: 'Số Liệu' },
                        { type: 'architecture', label: 'Kiến Trúc' },
                        { type: 'code', label: 'Code Demo' },
                        { type: 'terminal', label: 'Terminal' },
                        { type: 'features', label: 'Tính Năng' },
                        { type: 'outro', label: 'Kêu Gọi' },
                      ].map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => handleAddScene(item.type)}
                          className="px-2.5 py-1 text-[10px] font-bold rounded-lg neu-btn-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-3xl neu-flat p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--primary)]" />
                  {blogPost ? blogPost.title : (language === 'vi' ? 'Bài Viết Blog Markdown' : 'Tech Blog Article')}
                </h3>
                {blogPost && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyScript}
                      className="px-3 py-1.5 text-xs font-semibold neu-btn text-[var(--text-muted)] hover:text-[var(--primary)] rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                    >
                      {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedScript ? 'Copied' : 'Copy MD'}
                    </button>
                    <button
                      onClick={handleDownloadMarkdown}
                      className="px-3 py-1.5 text-xs font-semibold neu-btn text-[var(--text-muted)] hover:text-[var(--primary)] rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      .md
                    </button>
                  </div>
                )}
              </div>

              {blogPost ? (
                <div className="p-4 rounded-2xl neu-inset max-h-[400px] overflow-y-auto text-xs text-[var(--text-main)] space-y-3 font-sans leading-relaxed">
                  <div className="whitespace-pre-wrap font-mono text-[11px]">
                    {blogPost.content}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-[var(--text-muted)] text-xs space-y-3">
                  <Sparkles className="w-8 h-8 mx-auto opacity-40 text-[var(--primary)] animate-pulse" />
                  <p>
                    {language === 'vi'
                      ? 'Chưa có nội dung. Hãy nhấn nút dưới đây để AI tự động viết blog & phân cảnh!'
                      : 'No content generated yet. Click the button below to generate AI blog & storyboard!'}
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateAll}
                    disabled={blogMutation.isPending || storyboardMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 neu-primary rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {language === 'vi' ? 'Bấm Để Sinh Blog & Kịch Bản Ngay' : 'Generate Blog & Storyboard Now'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeStep === 'voice' && (
        <div className="space-y-6">
          <div className="rounded-3xl neu-flat p-5 sm:p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                  <Mic className="w-5 h-5 text-[var(--primary)]" />
                  {t('studio_voice_select_label')}
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {language === 'vi' 
                    ? 'Tùy chỉnh ngữ điệu AI giàu cảm xúc (TikTok Viral / Bản tin / Podcast).' 
                    : 'Curated expressive AI voice profiles (TikTok Viral / Keynote / Podcast).'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-2xl neu-inset">
                <button
                  type="button"
                  onClick={() => applyVoicePreset('hype')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    voicePreset === 'hype' 
                      ? 'neu-flat-sm text-[var(--primary)] font-bold' 
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>TikTok Viral (+15%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyVoicePreset('professional')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    voicePreset === 'professional' 
                      ? 'neu-flat-sm text-[var(--primary)] font-bold' 
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Bản Tin (+5%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyVoicePreset('podcast')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    voicePreset === 'podcast' 
                      ? 'neu-flat-sm text-[var(--primary)] font-bold' 
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Podcast (-5%)</span>
                </button>
              </div>
            </div>

            {/* Provider Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[var(--shadow-dark)]/20 pb-3">
              <span className="text-xs font-semibold text-[var(--text-muted)] mr-2">
                {language === 'vi' ? 'Công nghệ AI Speech:' : 'Speech Engine:'}
              </span>
              <button
                type="button"
                onClick={() => setVoiceProviderFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  voiceProviderFilter === 'all'
                    ? 'neu-inset text-[var(--primary)] font-bold'
                    : 'neu-btn-sm text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {language === 'vi' ? 'Tất Cả' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setVoiceProviderFilter('gemini_audio')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  voiceProviderFilter === 'gemini_audio'
                    ? 'neu-inset text-[var(--primary)] font-bold'
                    : 'neu-btn-sm text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[var(--primary)]" />
                <span>Google AI Studio (Gemini 3.1 Live)</span>
              </button>
              <button
                type="button"
                onClick={() => setVoiceProviderFilter('edge_tts')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  voiceProviderFilter === 'edge_tts'
                    ? 'neu-inset text-[var(--primary)] font-bold'
                    : 'neu-btn-sm text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Microsoft Edge-TTS (Diểm Phúc & Minh Hiếu)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {voices
                .filter((v) => voiceProviderFilter === 'all' || v.provider === voiceProviderFilter)
                .map((voice) => {
                const isSelected = selectedVoice === voice.id;
                return (
                  <div
                    key={voice.id}
                    onClick={() => {
                      setSelectedVoice(voice.id);
                      setTtsResult(null);
                    }}
                    className={`p-5 rounded-3xl transition-all cursor-pointer space-y-3 relative group ${
                      isSelected
                        ? 'neu-inset ring-2 ring-[var(--primary)]/40'
                        : 'neu-flat hover:text-[var(--primary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                          isSelected 
                            ? 'neu-primary text-white' 
                            : 'neu-inset text-[var(--text-muted)]'
                        }`}>
                          {voice.id.includes('Aoede') ? <Star className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-amber-500'}`} /> :
                           voice.id.includes('Puck') ? <Flame className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-orange-500'}`} /> :
                           voice.id.includes('Charon') ? <Target className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-indigo-500'}`} /> :
                           voice.id.includes('Kore') ? <Sparkles className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-emerald-500'}`} /> :
                           voice.id.includes('Fenrir') ? <Radio className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-cyan-500'}`} /> :
                           voice.id.includes('HoaiMy') ? <Zap className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-amber-500'}`} /> :
                           voice.id.includes('NamMinh') ? <Mic className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-sky-500'}`} /> :
                           <Volume2 className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[var(--primary)]'}`} />}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[var(--text-main)] flex items-center gap-1.5">
                            {voice.name}
                            {isSelected && <Check className="w-4 h-4 text-[var(--primary)]" />}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--primary)] font-semibold flex items-center gap-1.5">
                            <span>{voice.style}</span>
                            {voice.badge && (
                              <span className="px-1.5 py-0.5 rounded neu-inset-sm text-[8px] font-bold text-[var(--primary)] whitespace-nowrap shrink-0 inline-flex items-center">
                                {voice.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full neu-inset-sm text-[var(--text-muted)] font-mono font-bold whitespace-nowrap shrink-0 inline-flex items-center">
                        {voice.language}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                      {voice.description}
                    </p>

                    <div className="pt-2.5 border-t border-[var(--shadow-dark)]/20 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewVoice(voice);
                        }}
                        className={`text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          previewingVoiceId === voice.id
                            ? 'text-[var(--primary)] font-bold animate-pulse'
                            : 'text-[var(--text-muted)] hover:text-[var(--primary)]'
                        }`}
                      >
                        {previewingVoiceId === voice.id ? (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-[var(--primary)] animate-bounce" />
                            <span>{language === 'vi' ? 'Đang Phát (Bấm Dừng)' : 'Playing (Stop)'}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-[var(--primary)]" />
                            <span>{t('studio_preview_audio')}</span>
                          </>
                        )}
                      </button>

                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        {voice.id.split('-')[0].toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-5 rounded-3xl neu-flat flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                  {language === 'vi' ? 'Tạo Giọng Đọc Đầy Đủ Kịch Bản' : 'Synthesize Full Video Voiceover'}
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {language === 'vi' 
                    ? `Đang chọn giọng: ${voices.find(v => v.id === selectedVoice)?.name || selectedVoice} (Preset: ${voicePreset.toUpperCase()})` 
                    : `Active voice: ${selectedVoice}`}
                </p>
              </div>

              <button
                onClick={handleSynthesizeFullAudio}
                disabled={ttsMutation.isPending || !storyboard}
                className="py-3 px-5 neu-primary font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {ttsMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {language === 'vi' ? 'Đang Tổng Hợp Audio AI...' : 'Synthesizing Audio...'}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    {language === 'vi' ? 'Tạo Audio Toàn Bộ & Chuyển Sang Video Player' : 'Synthesize All & Open Video Player'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeStep === 'player' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="neu-flat p-4 md:p-6 rounded-3xl flex flex-col items-center justify-center min-h-[580px] relative overflow-hidden group">
              <div
                ref={videoContainerRef}
                className={`relative z-10 transition-all duration-300 rounded-2xl overflow-hidden neu-inset bg-black flex flex-col justify-center items-center ${
                  aspectRatio === '9:16'
                    ? 'w-[320px] sm:w-[360px] h-[580px]'
                    : 'w-full max-w-[780px] h-[440px]'
                }`}
              >
                {ttsResult && (
                  <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-[0.12em] neu-inset-sm backdrop-blur-md ${
                      ttsResult.timing_quality === 'word'
                        ? 'bg-emerald-950/80 text-emerald-400'
                        : 'bg-amber-950/80 text-amber-300'
                    }`}>
                      {ttsResult.timing_quality === 'word'
                        ? `● SYNC LOCK · ${ttsResult.actual_provider === 'edge_tts' ? 'WORD BOUNDARY' : 'SPEECH MARKS'}`
                        : '● SYNC ASSIST · ESTIMATED'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full neu-inset-sm bg-slate-950/80 text-sky-300 text-[9px] font-mono font-bold backdrop-blur-md">
                      AUDIO MASTER · {(ttsResult.duration_seconds || 0).toFixed(2)}s
                    </span>
                  </div>
                )}
                <Player
                  ref={playerRef}
                  component={SkillVideoComposition}
                  inputProps={{
                    storyboard,
                    ttsResult,
                    audioSrc: audioBlobUrl,
                    skillTitle: blogPost?.title || customTopic || 'AI Autonomous Agent',
                    skillStats: currentSkill ? {
                      stars: currentSkill.stars,
                      forks: currentSkill.forks,
                      language: currentSkill.primary_language,
                    } : {
                      language: 'TypeScript / AI Agent',
                    },
                    showCaptions,
                  }}
                  durationInFrames={totalDurationInFrames}
                  compositionWidth={aspectRatio === '9:16' ? 720 : 1280}
                  compositionHeight={aspectRatio === '9:16' ? 1280 : 720}
                  fps={VIDEO_FPS}
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                  controls
                  loop={false}
                  initialVolume={volume}
                  initiallyMuted={isMuted}
                />
              </div>

              {!ttsResult?.audio_base64 && (
                <div className="w-full max-w-xl p-4 rounded-2xl neu-inset flex items-center justify-between gap-3 text-xs mt-4 animate-in fade-in">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <Sparkles className="w-4 h-4 text-[var(--primary)] shrink-0" />
                    <span className="font-medium">
                      {language === 'vi'
                        ? 'Chưa tạo giọng đọc cho video này.'
                        : 'No voiceover synthesized yet.'}
                    </span>
                  </div>
                  <button
                    onClick={handleSynthesizeFullAudio}
                    disabled={ttsMutation.isPending || !storyboard}
                    className="px-3.5 py-2 neu-primary font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {ttsMutation.isPending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{language === 'vi' ? 'Đang tạo...' : 'Creating...'}</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" />
                        <span>{language === 'vi' ? 'Tạo Giọng Đọc Ngay' : 'Synthesize Now'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="w-full max-w-xl mt-4 flex items-center justify-between gap-3 neu-flat p-3 rounded-2xl">
                <button
                  onClick={() => {
                    if (playerRef.current) playerRef.current.seekTo(0);
                    setCurrentSceneIndex(0);
                    setIsPlaying(false);
                  }}
                  className="p-2 rounded-xl neu-btn-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={togglePlay}
                  className="px-5 py-2.5 neu-primary text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      {t('studio_pause_video')}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      {t('studio_play_video')}
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const nextMuted = !isMuted;
                      setIsMuted(nextMuted);
                      if (nextMuted) playerRef.current?.mute();
                      else playerRef.current?.unmute();
                    }}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      isMuted ? 'neu-inset text-rose-500' : 'neu-btn-sm text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setVolume(val);
                      setIsMuted(false);
                      playerRef.current?.setVolume(val);
                      playerRef.current?.unmute();
                    }}
                    className="w-16 accent-[var(--primary)] h-1 neu-inset rounded-lg cursor-pointer hidden sm:block"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCaptions(!showCaptions)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      showCaptions
                        ? 'neu-inset text-[var(--primary)]'
                        : 'neu-btn-sm text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                    title={showCaptions ? 'Tắt phụ đề' : 'Bật phụ đề'}
                  >
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{showCaptions ? 'CC ON' : 'CC OFF'}</span>
                    </span>
                  </button>

                  <div className="flex items-center gap-1 neu-inset p-1 rounded-xl">
                    <button
                      onClick={() => setAspectRatio('9:16')}
                      className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        aspectRatio === '9:16' ? 'neu-flat-xs text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setAspectRatio('16:9')}
                      className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        aspectRatio === '16:9' ? 'neu-flat-xs text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-3xl neu-flat p-5 sm:p-6 space-y-5">
              <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                <Download className="w-4 h-4 text-[var(--primary)]" />
                {language === 'vi' ? 'Xuất & Tải Tài Nguyên' : 'Export & Downloads'}
              </h3>

              <div className="space-y-3">
                <button
                  onClick={handleExportVideo}
                  disabled={!ttsResult?.audio_base64 || isExportingVideo}
                  className="w-full p-4 rounded-2xl neu-primary text-left flex items-center justify-between transition-all group disabled:opacity-50 active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
                      {isExportingVideo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{language === 'vi' ? 'Render & Tải MP4 Chất Lượng Cao' : 'Render High-Quality MP4'}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-white/30 text-white font-mono font-bold">HD</span>
                      </div>
                      <div className="text-[10px] text-white/80 font-mono">
                        {isExportingVideo 
                          ? `${language === 'vi' ? 'Đang xuất video...' : 'Exporting...'} ${exportProgress}%` 
                          : `${aspectRatio} | Full Visuals & Audio`}
                      </div>
                    </div>
                  </div>
                  <Download className="w-5 h-5 text-white/90 group-hover:text-white group-hover:translate-y-0.5 transition-all" />
                </button>

                <button
                  onClick={handleDownloadAudio}
                  disabled={!ttsResult?.audio_base64}
                  className="w-full p-3.5 rounded-2xl neu-btn text-left flex items-center justify-between transition-all group disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl neu-inset text-[var(--primary)] flex items-center justify-center font-bold">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-main)]">
                        {t('studio_download_audio')}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">
                        MP3 128kbps | {ttsResult ? `${ttsResult.duration_seconds}s` : '0s'}
                      </div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                </button>

                <button
                  onClick={handleDownloadSRT}
                  disabled={!ttsResult?.subtitle_entries || ttsResult.subtitle_entries.length === 0}
                  className="w-full p-3.5 rounded-2xl neu-btn text-left flex items-center justify-between transition-all group disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl neu-inset text-[var(--primary)] flex items-center justify-center font-bold">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-main)]">
                        {t('studio_download_subtitles')}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">
                        SubRip (.srt) CapCut/Premiere
                      </div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                </button>

                <button
                  onClick={handleDownloadMarkdown}
                  disabled={!blogPost}
                  className="w-full p-3.5 rounded-2xl neu-btn text-left flex items-center justify-between transition-all group disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl neu-inset text-[var(--primary)] flex items-center justify-center font-bold">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-main)]">
                        {t('studio_download_markdown')}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">
                        SEO Tech Article (.md)
                      </div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                </button>
              </div>

              <div className="pt-4 border-t border-[var(--shadow-dark)]/20 space-y-2">
                <div className="text-xs font-semibold text-[var(--text-muted)] flex items-center justify-between">
                  <span>{language === 'vi' ? 'Nhảy Nhanh Phân Cảnh:' : 'Jump to Scene:'}</span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">Click to seek</span>
                </div>
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {storyboard?.scenes.map((s, idx) => {
                    const sceneIcons: Record<string, React.ComponentType<{ className?: string }>> = {
                      intro: Sparkles,
                      github: GitFork,
                      comparison: Scale,
                      stat: BarChart3,
                      architecture: Layers,
                      code: Code,
                      terminal: Terminal,
                      features: Layers,
                      outro: Target,
                      content: FileText,
                    };
                    const Icon = sceneIcons[s.scene_type || 'content'] || FileText;

                    return (
                      <div
                        key={s.scene_number || idx}
                        onClick={() => handleSeekScene(idx)}
                        className={`px-3 py-2 rounded-xl text-[11px] font-mono cursor-pointer transition-all flex items-center justify-between ${
                          currentSceneIndex === idx
                            ? 'neu-inset text-[var(--primary)] font-bold'
                            : 'neu-btn-sm text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-5 h-5 rounded-lg neu-inset flex items-center justify-center text-[10px] font-bold shrink-0 text-[var(--primary)]">
                            <Icon className="w-3 h-3" />
                          </span>
                          <span className="truncate">{s.title}</span>
                        </div>
                        <span className="text-[10px] opacity-70 shrink-0">~{s.duration_seconds}s</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
