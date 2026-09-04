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
  ArrowDown
} from 'lucide-react';


import { useQuery, useMutation } from '@tanstack/react-query';
import { Player, PlayerRef } from '@remotion/player';
import { SkillVideoComposition } from '../compositions/SkillVideoComposition';
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
  const [selectedVoice, setSelectedVoice] = useState<string>('vi-VN-HoaiMyNeural');
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
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
      const blob = new Blob([byteArray], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      setAudioBlobUrl(url);
      return () => URL.revokeObjectURL(url); // cleanup on unmount or ttsResult change
    } catch (e) {
      console.error('Error creating audio blob:', e);
      setAudioBlobUrl(undefined);
    }
  }, [ttsResult?.audio_base64]);

  const totalDurationInFrames = React.useMemo(() => {
    if (ttsResult?.duration_seconds && ttsResult.duration_seconds > 0) {
      return Math.max(VIDEO_FPS * 2, Math.round(ttsResult.duration_seconds * VIDEO_FPS));
    }
    if (!storyboard?.scenes || storyboard.scenes.length === 0) {
      return VIDEO_FPS * 20;
    }
    const totalSec = storyboard.scenes.reduce((acc, s) => acc + (s.duration_seconds || 5), 0);
    return Math.max(VIDEO_FPS * 5, Math.round(totalSec * VIDEO_FPS));
  }, [ttsResult?.duration_seconds, storyboard?.scenes]);


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
    } else if (language === 'vi' && !selectedVoice.startsWith('vi-')) {
      setSelectedVoice('vi-VN-HoaiMyNeural');
    }
  }, [language]);

  const applyVoicePreset = (preset: 'hype' | 'professional' | 'podcast') => {
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
      setCurrentSceneIndex(0);
      const captures = new Map<string, Awaited<ReturnType<typeof api.captureGitHubRepository>> | null>();
      const enrichedScenes = [];
      for (const scene of data.scenes) {
        if ((scene.scene_type === 'github' || scene.asset_type === 'github_walkthrough') && scene.repository_url) {
          if (!captures.has(scene.repository_url)) {
            try {
              captures.set(scene.repository_url, await api.captureGitHubRepository(scene.repository_url));
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
      for (let i = 0; i < updatedScenes.length; i++) {
        const scene = updatedScenes[i];
        if (scene.scene_type === 'github' || scene.asset_type === 'github_walkthrough') {
          continue;
        }
        const targetPrompt = scene.visual_prompt || scene.visual_description || 'AI Coding Assistant';
        const res = await api.generateSceneImage(targetPrompt, scene.scene_number, aspectRatio);
        updatedScenes[i] = { ...scene, image_url: res.image_url };
        setStoryboard(prev => prev ? { ...prev, scenes: [...updatedScenes] } : prev);
      }
      showToast(language === 'vi' ? '✨ Đã hoàn thành sinh toàn bộ ảnh AI!' : '✨ All AI scene visuals generated!');
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
      title: type === 'github' ? '🐙 Khám Phá Repository' :
             type === 'code' ? '💻 Demo Code Thực Tế' :
             type === 'comparison' ? '⚖️ So Sánh Before & After' :
             type === 'architecture' ? '🧠 Kiến Trúc Multi-Agent' :
             type === 'stat' ? '📊 Số Liệu Benchmark' :
             type === 'terminal' ? '⚡ Cài Đặt 1 Dòng Lệnh' :
             type === 'features' ? '🧩 4 Trụ Cột Tính Năng' :
             type === 'outro' ? '🎯 Kêu Gọi Hành Động' : '✨ Phân Cảnh Nội Dung',
      voiceover_text: 'Đoạn lời thoại chi tiết cung cấp facts công nghệ cụ thể cho phân cảnh này.',
      visual_description: 'Hiệu ứng chuyển động trực quan với các layer đồ họa công nghệ cao.',
      duration_seconds: 8,
      image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    };
    const updated = [...storyboard.scenes, newScene].map((s, idx) => ({ ...s, scene_number: idx + 1 }));
    setStoryboard({ ...storyboard, scenes: updated });
    showToast(language === 'vi' ? `Đã thêm phân cảnh (Scene ${updated.length})` : `Added Scene ${updated.length}`);
  };

  const handleDeleteScene = (sceneIndex: number) => {
    if (!storyboard || storyboard.scenes.length <= 1) {
      showToast(language === 'vi' ? 'Video phải có ít nhất 1 phân cảnh' : 'Video must have at least 1 scene', 'error');
      return;
    }
    const updated = storyboard.scenes.filter((_, i) => i !== sceneIndex).map((s, idx) => ({ ...s, scene_number: idx + 1 }));
    setStoryboard({ ...storyboard, scenes: updated });
    showToast(language === 'vi' ? 'Đã xóa phân cảnh' : 'Scene deleted');
  };

  const handleUpdateScene = (sceneIndex: number, patch: Partial<any>) => {
    if (!storyboard) return;
    const updated = storyboard.scenes.map((s, i) => i === sceneIndex ? { ...s, ...patch } : s);
    setStoryboard({ ...storyboard, scenes: updated });
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
    if (audioRef.current && ttsResult?.audio_base64) {
      const audioUrl = `data:audio/mp3;base64,${ttsResult.audio_base64}`;
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
      setCurrentSceneIndex(0);
      setIsPlaying(false);
    }
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

    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Playback error:', e);
        showToast(language === 'vi' ? 'Hãy bấm lại nút phát để trình duyệt cấp quyền âm thanh' : 'Click play again to permit audio', 'error');
      });
    }
  };

  const handleTimeUpdate = React.useCallback(() => {
    if (!audioRef.current) return;
    const currentMs = audioRef.current.currentTime * 1000;
    const scenes = storyboard?.scenes || [];
    const subtitles = ttsResult?.subtitle_entries || [];

    if (scenes.length === 0) return;

    let newSceneIdx = scenes.length - 1;
    const sceneSegments = ttsResult?.scene_segments || [];

    if (sceneSegments.length === scenes.length) {
      const matchingSegment = sceneSegments.find(segment => currentMs >= segment.start_ms && currentMs < segment.end_ms);
      newSceneIdx = matchingSegment?.scene_index ?? scenes.length - 1;
    } else if (subtitles.length > 0) {
      // Use real TTS timestamps for accurate scene boundary detection
      let curSubIdx = 0;
      for (let sIdx = 0; sIdx < scenes.length; sIdx++) {
        const words = (scenes[sIdx].voiceover_text || '').trim().split(/\s+/).filter(Boolean);
        const isLast = sIdx === scenes.length - 1;
        const endIdx = isLast ? subtitles.length : Math.min(subtitles.length, curSubIdx + words.length);
        const sceneSubs = subtitles.slice(curSubIdx, endIdx);
        curSubIdx = endIdx;
        if (sceneSubs.length > 0) {
          const sceneEndMs = isLast ? Infinity : sceneSubs[sceneSubs.length - 1].end_ms;
          if (currentMs <= sceneEndMs) {
            newSceneIdx = sIdx;
            break;
          }
        }
      }
    } else {
      // Fallback: use duration_seconds
      let accumulatedSec = 0;
      for (let i = 0; i < scenes.length; i++) {
        accumulatedSec += scenes[i].duration_seconds || 5;
        if (currentMs / 1000 <= accumulatedSec) {
          newSceneIdx = i;
          break;
        }
      }
    }

    // Only setState when scene actually changes (avoids 60fps re-renders)
    if (newSceneIdx !== currentSceneIndexRef.current) {
      currentSceneIndexRef.current = newSceneIdx;
      setCurrentSceneIndex(newSceneIdx);
    }
  }, [storyboard, ttsResult]);

  const handleAudioEnded = () => {
    setIsPlaying(false);
    currentSceneIndexRef.current = 0;
    setCurrentSceneIndex(0);
  };

  const handleSeekScene = (sceneIdx: number) => {
    if (!storyboard || !storyboard.scenes[sceneIdx]) return;
    const subtitles = ttsResult?.subtitle_entries || [];
    const sceneSegments = ttsResult?.scene_segments || [];
    const scenes = storyboard.scenes;
    let targetSec = 0;

    if (sceneSegments[sceneIdx]) {
      targetSec = sceneSegments[sceneIdx].start_ms / 1000;
    } else if (subtitles.length > 0) {
      // Use real subtitle timestamps
      let curSubIdx = 0;
      for (let sIdx = 0; sIdx < sceneIdx; sIdx++) {
        const words = (scenes[sIdx].voiceover_text || '').trim().split(/\s+/).filter(Boolean);
        const endIdx = Math.min(subtitles.length, curSubIdx + words.length);
        if (endIdx > curSubIdx && subtitles[endIdx - 1]) {
          curSubIdx = endIdx;
        }
      }
      if (curSubIdx < subtitles.length) {
        targetSec = subtitles[curSubIdx].start_ms / 1000;
      }
    } else {
      for (let i = 0; i < sceneIdx; i++) {
        targetSec += scenes[i].duration_seconds || 5;
      }
    }

    currentSceneIndexRef.current = sceneIdx;
    setCurrentSceneIndex(sceneIdx);
    if (playerRef.current) {
      playerRef.current.seekTo(Math.round(targetSec * VIDEO_FPS));
    }
    if (audioRef.current) {
      audioRef.current.currentTime = targetSec;
    }
  };

  const handleExportVideo = async () => {
    if (!ttsResult?.audio_base64) {
      showToast(language === 'vi' ? 'Vui lòng sinh giọng đọc trước khi xuất video' : 'Please synthesize audio first', 'error');
      return;
    }

    setIsExportingVideo(true);
    setExportProgress(0);
    showToast(language === 'vi' ? '🎬 Đang render MP4 từ chính video preview...' : '🎬 Rendering MP4 from the preview composition...');

    if (storyboard) {
      try {
        setExportProgress(12);
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
        setIsExportingVideo(false);
        showToast(language === 'vi' ? '🎬 Xuất MP4 thành công — hình ảnh giống video preview!' : '🎬 MP4 exported successfully with preview-quality visuals!');
        return;
      } catch (renderError) {
        console.warn('Remotion MP4 render failed, using browser WebM fallback:', renderError);
        setExportProgress(0);
        showToast(language === 'vi' ? 'MP4 renderer chưa sẵn sàng, đang dùng WebM dự phòng...' : 'MP4 renderer unavailable, using WebM fallback...', 'error');
      }
    }

    try {
      // Decode audio
      const byteCharacters = atob(ttsResult.audio_base64);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }

      // Canvas setup
      const canvas = document.createElement('canvas');
      canvas.width = aspectRatio === '9:16' ? 720 : 1280;
      canvas.height = aspectRatio === '9:16' ? 1280 : 720;
      const ctx = canvas.getContext('2d')!;
      const W = canvas.width;
      const H = canvas.height;

      // Audio setup
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      const audioBuffer = await audioCtx.decodeAudioData(byteArray.buffer.slice(0));

      const canvasStream = canvas.captureStream(30);
      const dest = audioCtx.createMediaStreamDestination();
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(dest);
      source.connect(audioCtx.destination); // needed for timing

      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ]);

      // Pick supported MIME
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 2_500_000 });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const totalMs = Math.ceil(ttsResult.duration_seconds * 1000);
      const scenes = storyboard?.scenes || [];
      const subtitles = ttsResult.subtitle_entries || [];
      const explicitSegments = ttsResult.scene_segments || [];
      const title = blogPost?.title || customTopic || 'AI Video';
      const exportStart = Date.now();

      // Scene timing dynamically mapped to real TTS audio word timestamps
      const sceneTimings: { start: number; end: number }[] = [];
      let curSubIdx = 0;
      scenes.forEach((s, sIdx) => {
        const explicitSegment = explicitSegments.find(segment => segment.scene_index === sIdx);
        if (explicitSegment) {
          sceneTimings.push({ start: explicitSegment.start_ms, end: explicitSegment.end_ms });
          return;
        }
        const words = (s.voiceover_text || '').trim().split(/\s+/).filter(Boolean);
        const isLast = sIdx === scenes.length - 1;
        const endIdx = isLast ? subtitles.length : Math.min(subtitles.length, curSubIdx + words.length);
        const sceneSubs = subtitles.slice(curSubIdx, endIdx);
        curSubIdx = endIdx;

        if (sceneSubs.length > 0) {
          const start = sceneSubs[0].start_ms;
          const end = isLast ? totalMs : sceneSubs[sceneSubs.length - 1].end_ms;
          sceneTimings.push({ start, end: Math.max(start + 500, end) });
        } else {
          const perSceneMs = totalMs / Math.max(1, scenes.length);
          sceneTimings.push({ start: sIdx * perSceneMs, end: (sIdx + 1) * perSceneMs });
        }
      });

      // Scene gradient colors
      const sceneColors = [
        ['#e11d48', '#6366f1', '#7c3aed'], // rose → indigo → purple
        ['#d97706', '#dc2626', '#1e293b'], // amber → red → slate
        ['#059669', '#0d9488', '#4f46e5'], // emerald → teal → indigo
        ['#0284c7', '#6366f1', '#7c3aed'], // sky → indigo → purple
        ['#6366f1', '#e11d48', '#059669'], // indigo → rose → emerald
      ];

      // Word wrap helper
      const wrapText = (text: string, maxW: number, font: string): string[] => {
        ctx.font = font;
        const words = text.split(' ');
        const result: string[] = [];
        let line = '';
        for (const w of words) {
          const test = line ? line + ' ' + w : w;
          if (ctx.measureText(test).width > maxW && line) {
            result.push(line);
            line = w;
          } else {
            line = test;
          }
        }
        if (line) result.push(line);
        return result;
      };

      // Animation render loop
      let animId: number;
      let audioStartTime = 0;
      const renderFrame = () => {
        const elapsedMs = audioStartTime > 0
          ? Math.max(0, (audioCtx.currentTime - audioStartTime) * 1000)
          : Date.now() - exportStart;
        const progress = Math.min(1, elapsedMs / totalMs);

        // Determine current scene
        let sceneIdx = 0;
        for (let i = 0; i < sceneTimings.length; i++) {
          if (elapsedMs >= sceneTimings[i].start && elapsedMs < sceneTimings[i].end) {
            sceneIdx = i;
            break;
          }
          if (i === sceneTimings.length - 1) sceneIdx = i;
        }
        const scene = scenes[sceneIdx];
        const colors = sceneColors[sceneIdx % sceneColors.length];

        // Scene-local progress (0 → 1)
        const st = sceneTimings[sceneIdx];
        const sceneProgress = st ? Math.min(1, (elapsedMs - st.start) / (st.end - st.start)) : 0;

        // === BACKGROUND ===
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);

        // Animated gradient
        const angle = elapsedMs * 0.0003;
        const gx = W / 2 + Math.cos(angle) * W * 0.4;
        const gy = H / 2 + Math.sin(angle) * H * 0.4;
        const grad = ctx.createRadialGradient(gx, gy, 0, W / 2, H / 2, W * 0.8);
        grad.addColorStop(0, colors[0] + '55');
        grad.addColorStop(0.5, colors[1] + '33');
        grad.addColorStop(1, colors[2] + '11');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Floating particles
        for (let p = 0; p < 12; p++) {
          const px = (Math.sin(elapsedMs * 0.001 + p * 1.7) * 0.5 + 0.5) * W;
          const py = (Math.cos(elapsedMs * 0.0008 + p * 2.3) * 0.5 + 0.5) * H;
          const pr = 2 + Math.sin(elapsedMs * 0.002 + p) * 2;
          ctx.beginPath();
          ctx.arc(px, py, pr, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p % 2 === 0 ? '99,102,241' : '244,63,94'},${0.15 + Math.sin(elapsedMs * 0.003 + p) * 0.1})`;
          ctx.fill();
        }

        // === TOP BAR ===
        ctx.fillStyle = 'rgba(15,23,42,0.85)';
        ctx.fillRect(0, 0, W, 56);
        // Recording dot
        ctx.beginPath();
        ctx.arc(24, 28, 5 + Math.sin(elapsedMs * 0.005) * 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        // Title
        ctx.font = `bold ${Math.round(W / 50)}px sans-serif`;
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('AGENT SKILLS TRENDING', 42, 28);
        // Scene badge
        ctx.textAlign = 'right';
        ctx.font = `bold ${Math.round(W / 55)}px monospace`;
        ctx.fillStyle = '#818cf8';
        ctx.fillText(`Scene ${sceneIdx + 1}/${scenes.length || 5}  •  ${(elapsedMs / 1000).toFixed(1)}s`, W - 20, 28);

        // === MAIN CONTENT ===
        const contentY = 80;
        const contentH = H - 180;
        ctx.textAlign = 'center';

        // Scene title badge
        if (scene?.title) {
          const badgeFont = `bold ${Math.round(W / 38)}px sans-serif`;
          ctx.font = badgeFont;
          const badgeW = ctx.measureText(scene.title).width + 36;
          const badgeX = (W - badgeW) / 2;
          const badgeY = contentY + 20;
          // Slide-in animation
          const slideX = Math.min(1, sceneProgress * 4) * 0 + (1 - Math.min(1, sceneProgress * 4)) * -50;

          ctx.fillStyle = colors[0] + '44';
          ctx.beginPath();
          ctx.roundRect(badgeX + slideX, badgeY, badgeW, 36, 18);
          ctx.fill();
          ctx.strokeStyle = colors[0] + '88';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#fecdd3';
          ctx.fillText(scene.title, W / 2 + slideX, badgeY + 19);
        }

        // Main title or scene voiceover text
        const mainText = sceneIdx === 0 ? title : (scene?.voiceover_text || '');
        if (mainText) {
          const mainFont = sceneIdx === 0
            ? `900 ${Math.round(W / 16)}px sans-serif`
            : `bold ${Math.round(W / 26)}px sans-serif`;
          const wrappedLines = wrapText(mainText, W * 0.8, mainFont);
          const lineHeight = sceneIdx === 0 ? Math.round(W / 14) : Math.round(W / 22);
          const startY = contentY + contentH / 2 - (wrappedLines.length * lineHeight) / 2 + 20;

          // Fade-in per line
          wrappedLines.forEach((line, li) => {
            const lineDelay = li * 0.08;
            const lineAlpha = Math.min(1, Math.max(0, (sceneProgress - lineDelay) * 5));
            const offsetY = (1 - lineAlpha) * 15;
            ctx.globalAlpha = lineAlpha;
            ctx.font = mainFont;
            ctx.fillStyle = sceneIdx === 0 ? '#f1f5f9' : '#cbd5e1';
            ctx.fillText(line, W / 2, startY + li * lineHeight + offsetY);
          });
          ctx.globalAlpha = 1;
        }

        // Stats badges (scene 0 only)
        if (sceneIdx === 0 && currentSkill) {
          const statsY = contentY + contentH / 2 + 80;
          const stats = [
            { icon: '⭐', text: `${currentSkill.stars?.toLocaleString() || '4,280'} Stars`, color: '#fbbf24' },
            { icon: '🍴', text: `${currentSkill.forks?.toLocaleString() || '320'} Forks`, color: '#818cf8' },
            { icon: '⚡', text: currentSkill.primary_language || 'TypeScript', color: '#34d399' },
          ];
          const badgeW = 130;
          const totalW = stats.length * badgeW + (stats.length - 1) * 12;
          const startX = (W - totalW) / 2;
          stats.forEach((s, si) => {
            const bx = startX + si * (badgeW + 12);
            const fadeIn = Math.min(1, Math.max(0, (sceneProgress - 0.3 - si * 0.1) * 4));
            ctx.globalAlpha = fadeIn;
            ctx.fillStyle = 'rgba(15,23,42,0.9)';
            ctx.beginPath();
            ctx.roundRect(bx, statsY, badgeW, 34, 12);
            ctx.fill();
            ctx.font = `bold ${Math.round(W / 55)}px monospace`;
            ctx.fillStyle = s.color;
            ctx.textAlign = 'center';
            ctx.fillText(`${s.icon} ${s.text}`, bx + badgeW / 2, statsY + 18);
          });
          ctx.globalAlpha = 1;
        }

        // === SUBTITLE BAR ===
        const subBarY = H - 100;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.beginPath();
        ctx.roundRect(W * 0.05, subBarY, W * 0.9, 44, 12);
        ctx.fill();

        // Find current subtitle word
        let currentSubIdx = -1;
        for (let w = 0; w < subtitles.length; w++) {
          if (elapsedMs >= subtitles[w].start_ms && elapsedMs <= subtitles[w].end_ms) {
            currentSubIdx = w;
            break;
          }
          if (elapsedMs >= subtitles[w].start_ms) currentSubIdx = w;
        }
        // Render ±4 words
        const subFont = `bold ${Math.round(W / 42)}px sans-serif`;
        ctx.font = subFont;
        ctx.textAlign = 'center';
        const windowWords: { text: string; active: boolean }[] = [];
        for (let w = Math.max(0, currentSubIdx - 4); w <= Math.min(subtitles.length - 1, currentSubIdx + 4); w++) {
          windowWords.push({ text: subtitles[w].text, active: w === currentSubIdx });
        }
        if (windowWords.length > 0) {
          let subX = W / 2;
          const fullStr = windowWords.map(w => w.text).join(' ');
          const fullW = ctx.measureText(fullStr).width;
          subX = W / 2 - fullW / 2;
          windowWords.forEach((w) => {
            const ww = ctx.measureText(w.text + ' ').width;
            if (w.active) {
              ctx.fillStyle = '#fbbf24';
              ctx.font = `900 ${Math.round(W / 40)}px sans-serif`;
            } else {
              ctx.fillStyle = 'rgba(148,163,184,0.7)';
              ctx.font = subFont;
            }
            ctx.textAlign = 'left';
            ctx.fillText(w.text, subX, subBarY + 26);
            subX += ww;
          });
        }

        // === PROGRESS BAR ===
        const pbY = H - 44;
        ctx.fillStyle = 'rgba(30,41,59,0.9)';
        ctx.fillRect(0, pbY, W, 44);
        // Progress track
        ctx.fillStyle = 'rgba(51,65,85,0.8)';
        ctx.beginPath();
        ctx.roundRect(20, pbY + 16, W - 40, 6, 3);
        ctx.fill();
        // Progress fill
        const progGrad = ctx.createLinearGradient(20, 0, 20 + (W - 40) * progress, 0);
        progGrad.addColorStop(0, '#e11d48');
        progGrad.addColorStop(0.5, '#6366f1');
        progGrad.addColorStop(1, '#10b981');
        ctx.fillStyle = progGrad;
        ctx.beginPath();
        ctx.roundRect(20, pbY + 16, (W - 40) * progress, 6, 3);
        ctx.fill();
        // Time label
        ctx.font = `bold ${Math.round(W / 60)}px monospace`;
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'right';
        ctx.fillText(`${(elapsedMs / 1000).toFixed(1)}s / ${(totalMs / 1000).toFixed(0)}s`, W - 20, pbY + 10);
        // Branding
        ctx.textAlign = 'left';
        ctx.fillStyle = '#475569';
        ctx.fillText('AI Video Studio • Agent Skill Trending', 20, pbY + 10);

        // Continue rendering
        if (elapsedMs < totalMs + 500) {
          animId = requestAnimationFrame(renderFrame);
        }

        // Update export progress
        setExportProgress(Math.min(95, Math.round(progress * 100)));
      };

      // Recording callbacks
      recorder.onstop = () => {
        cancelAnimationFrame(animId);
        setExportProgress(100);
        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size < 1000) {
          showToast(language === 'vi' ? 'Video quá nhỏ, đang tải audio MP3...' : 'Video too small, downloading MP3...', 'error');
          const audioBlob = new Blob([byteArray], { type: 'audio/mp3' });
          const url = URL.createObjectURL(audioBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ai_audio_${Date.now()}.mp3`;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ai_video_${(currentSkill?.name || 'skill').replace(/\s+/g, '_')}_${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
          showToast(language === 'vi' ? '🎬 Xuất video thành công! (WebM — dùng CloudConvert.com để chuyển sang MP4 nếu cần)' : '🎬 Video exported! (WebM — use CloudConvert.com to convert to MP4 if needed)');
        }
        setTimeout(() => { setIsExportingVideo(false); audioCtx.close(); }, 300);
      };

      // Start recording + animation
      recorder.start(200);
      source.start(0);
      audioStartTime = audioCtx.currentTime;
      animId = requestAnimationFrame(renderFrame);

      // Auto-stop after audio finishes
      source.onended = () => {
        setTimeout(() => {
          try { recorder.stop(); } catch (_) {}
        }, 500);
      };

    } catch (err: any) {
      setIsExportingVideo(false);
      showToast(language === 'vi' ? 'Trình duyệt không hỗ trợ quay video, đang tải audio MP3...' : 'Video not supported, downloading MP3 audio...', 'error');
      try {
        const byteCharacters = atob(ttsResult.audio_base64);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteArray[i] = byteCharacters.charCodeAt(i);
        const audioBlob = new Blob([byteArray], { type: 'audio/mp3' });
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai_audio_${Date.now()}.mp3`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (_) {}
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
    const blob = new Blob([byteArray], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_voice_${selectedVoice}_${Date.now()}.mp3`;
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
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-950 border border-indigo-500/20 p-6 md:p-8 shadow-2xl shadow-indigo-950/40">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-[11px] font-bold font-mono tracking-wider uppercase rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                AI Video & Blog Studio v4.0
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Gemini 2.0 Live & Google AI
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                Audio: Neural Edge-TTS (0đ)
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Video className="w-8 h-8 text-rose-400" />
              {t('studio_title')}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {t('studio_subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto shrink-0">
            <button
              onClick={() => setActiveStep('script')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeStep === 'script'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              {t('studio_step1_title')}
            </button>
            <button
              onClick={() => setActiveStep('voice')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeStep === 'voice'
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="w-4 h-4" />
              {t('studio_step2_title')}
            </button>
            <button
              onClick={() => setActiveStep('player')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeStep === 'player'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Play className="w-4 h-4" />
              {t('studio_step3_title')}
            </button>
          </div>
        </div>
      </div>

      {activeStep === 'script' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-5 bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-rose-500" />
              {language === 'vi' ? 'Cấu Hình Nội Dung AI' : 'AI Content Configuration'}
            </h2>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t('studio_topic_label')}
              </label>
              <select
                value={selectedSkillId}
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : '';
                  setSelectedSkillId(id);
                  if (id) {
                    const sk = skills.find(s => s.id === id);
                    if (sk) setCustomTopic(sk.title || sk.name);
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">{t('studio_select_skill')}</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    ⭐ {s.stars} | {s.title || s.name} ({s.primary_language || s.category})
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder={t('studio_topic_placeholder')}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold self-center">
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
                    className="px-2 py-0.5 text-[10px] rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-all font-medium"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('studio_tone_label')}
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="professional">{t('studio_tone_professional')}</option>
                  <option value="hype">{t('studio_tone_hype')}</option>
                  <option value="casual">{t('studio_tone_casual')}</option>
                  <option value="deep_dive">{t('studio_tone_deepdive')}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('studio_aspect_ratio')}
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as '9:16' | '16:9')}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="9:16">📱 9:16 (TikTok/Shorts/Reels)</option>
                  <option value="16:9">💻 16:9 (YouTube/Landscape)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>{language === 'vi' ? 'Thời Lượng Video Dự Kiến:' : 'Target Duration:'}</span>
                <span className="font-mono text-rose-500">{targetDuration}s</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[30, 60, 90, 180].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setTargetDuration(dur)}
                    className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                      targetDuration === dur
                        ? 'bg-rose-500/10 border-rose-500 text-rose-500'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {dur}s
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'vi' ? 'Ghi Chú & Yêu Cầu Riêng (Tùy Chọn):' : 'Custom Notes (Optional):'}
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder={language === 'vi' ? 'Nhấn mạnh Subagent, Type-Safety, AST Security Scanner...' : 'Emphasize subagents, type-safety, AST security...'}
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <button
              onClick={handleGenerateAll}
              disabled={blogMutation.isPending || storyboardMutation.isPending}
              className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {blogMutation.isPending || storyboardMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {language === 'vi' ? 'AI Đang Viết Blog & Kịch Bản...' : 'AI Generating Content...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {language === 'vi' ? '🚀 Tự Động Sinh Blog & Kịch Bản Phân Cảnh' : '🚀 Generate Blog & Storyboard'}
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-7 space-y-5">
            {storyboard && storyboard.scenes.length > 0 && (
              <div className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    {language === 'vi' ? 'Kịch Bản Phân Cảnh & Ảnh AI' : 'Video Storyboard & AI Visuals'} ({storyboard.scenes.length} {language === 'vi' ? 'cảnh' : 'scenes'})
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGenerateAllSceneImages}
                      disabled={isGeneratingImages}
                      className="px-3 py-1 text-[11px] font-bold rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {isGeneratingImages ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-rose-500" />}
                      <span>{language === 'vi' ? '✨ Sinh Lại Tất Cả Ảnh AI' : '✨ Re-generate All Visuals'}</span>
                    </button>
                    <button
                      onClick={() => setActiveStep('voice')}
                      className="text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1"
                    >
                      {language === 'vi' ? 'Tiếp: Giọng đọc' : 'Next: Voice'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {storyboard.scenes.map((scene, idx) => {
                    const sceneTypeColors: Record<string, string> = {
                      intro: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
                      github: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
                      comparison: 'bg-red-500/15 text-red-400 border-red-500/40',
                      stat: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
                      architecture: 'bg-purple-500/15 text-purple-400 border-purple-500/40',
                      code: 'bg-sky-500/15 text-sky-400 border-sky-500/40',
                      terminal: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
                      features: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40',
                      outro: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/40',
                      content: 'bg-slate-500/15 text-slate-300 border-slate-500/40',
                    };
                    const typeColor = sceneTypeColors[scene.scene_type || 'content'] || sceneTypeColors.content;

                    return (
                      <div
                        key={scene.scene_number || idx}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 space-y-3 hover:border-indigo-500/40 transition-all"
                      >
                        <div className="flex items-center justify-between text-xs gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-indigo-500 font-mono">
                              Scene {scene.scene_number}:
                            </span>
                            <input
                              type="text"
                              value={scene.title}
                              onChange={(e) => handleUpdateScene(idx, { title: e.target.value })}
                              className="font-bold bg-transparent text-slate-900 dark:text-slate-100 border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none text-xs px-1"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Scene Type Selector */}
                            <select
                              value={scene.scene_type || 'content'}
                              onChange={(e) => handleUpdateScene(idx, { scene_type: e.target.value as any })}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border focus:outline-none ${typeColor}`}
                            >
                              <option value="intro">🌟 Hook Intro</option>
                              <option value="github">🐙 GitHub Walkthrough</option>
                              <option value="comparison">⚖️ So Sánh (Before/After)</option>
                              <option value="stat">📊 Số Liệu (Stats)</option>
                              <option value="architecture">🧠 Kiến Trúc Flow</option>
                              <option value="code">💻 Code Demo</option>
                              <option value="terminal">⚡ Terminal CLI</option>
                              <option value="features">🧩 4 Tính Năng</option>
                              <option value="content">✨ Nội Dung</option>
                              <option value="outro">🎯 Kêu Gọi (Outro)</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleMoveScene(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveScene(idx, 'down')}
                              disabled={idx === storyboard.scenes.length - 1}
                              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteScene(idx)}
                              className="p-1 rounded-md text-rose-400 hover:bg-rose-500/10"
                              title="Delete Scene"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {scene.image_url && (
                          <div className="relative h-24 rounded-xl overflow-hidden border border-slate-800 group/img">
                            <img
                              src={scene.image_url}
                              alt={`Scene ${scene.scene_number}`}
                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end justify-between p-2">
                              <span className="text-[9px] font-mono text-slate-300 font-bold bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-sm border border-slate-700/60">
                                🎨 AI Visual Layer
                              </span>
                              <button
                                onClick={() => handleRegenerateSceneImage(scene.scene_number)}
                                disabled={sceneImageMutation.isPending}
                                className="px-2 py-0.5 text-[9px] font-bold rounded-lg bg-slate-900/90 text-slate-200 hover:text-white border border-slate-700/80 backdrop-blur-sm flex items-center gap-1"
                              >
                                <Sparkles className="w-2.5 h-2.5 text-rose-400" />
                                <span>{language === 'vi' ? 'Đổi Ảnh AI' : 'New Image'}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <div className="text-[11px] text-slate-700 dark:text-slate-300">
                            🎙️ <span className="font-semibold text-rose-500">Lời thoại:</span>
                            <textarea
                              value={scene.voiceover_text}
                              onChange={(e) => handleUpdateScene(idx, { voiceover_text: e.target.value })}
                              rows={2}
                              className="w-full mt-1 p-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Scene Toolbar */}
                  <div className="p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-indigo-400">
                      {language === 'vi' ? '+ Thêm phân cảnh nhanh:' : '+ Quick add scene:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { type: 'github', label: '🐙 GitHub' },
                        { type: 'comparison', label: '⚖️ So Sánh' },
                        { type: 'stat', label: '📊 Số Liệu' },
                        { type: 'architecture', label: '🧠 Kiến Trúc' },
                        { type: 'code', label: '💻 Code Demo' },
                        { type: 'terminal', label: '⚡ Terminal' },
                        { type: 'features', label: '🧩 Tính Năng' },
                        { type: 'outro', label: '🎯 Kêu Gọi' },
                      ].map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => handleAddScene(item.type)}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all flex items-center gap-1"
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


            <div className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  {blogPost ? blogPost.title : (language === 'vi' ? 'Bài Viết Blog Markdown' : 'Tech Blog Article')}
                </h3>
                {blogPost && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyScript}
                      className="px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1 transition-all"
                    >
                      {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedScript ? 'Copied' : 'Copy MD'}
                    </button>
                    <button
                      onClick={handleDownloadMarkdown}
                      className="px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      .md
                    </button>
                  </div>
                )}
              </div>

              {blogPost ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 max-h-[400px] overflow-y-auto text-xs text-slate-800 dark:text-slate-200 space-y-3 font-sans leading-relaxed">
                  <div className="whitespace-pre-wrap font-mono text-[11px]">
                    {blogPost.content}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 dark:text-slate-600 text-xs space-y-3">
                  <Sparkles className="w-8 h-8 mx-auto opacity-40 text-rose-500 animate-pulse" />
                  <p>
                    {language === 'vi'
                      ? 'Chưa có nội dung. Hãy nhấn nút dưới đây để AI tự động viết blog & phân cảnh!'
                      : 'No content generated yet. Click the button below to generate AI blog & storyboard!'}
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateAll}
                    disabled={blogMutation.isPending || storyboardMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    {language === 'vi' ? '🚀 Bấm Để Sinh Blog & Kịch Bản Ngay' : '🚀 Generate Blog & Storyboard Now'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeStep === 'voice' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/90 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-indigo-500" />
                  {t('studio_voice_select_label')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'vi' 
                    ? 'Tùy chỉnh ngữ điệu AI giàu cảm xúc (TikTok Viral / Bản tin / Podcast).' 
                    : 'Curated expressive AI voice profiles (TikTok Viral / Keynote / Podcast).'}
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => applyVoicePreset('hype')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                    voicePreset === 'hype' 
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>⚡ TikTok Viral (+15%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyVoicePreset('professional')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                    voicePreset === 'professional' 
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>🎙️ Bản Tin (+5%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyVoicePreset('podcast')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                    voicePreset === 'podcast' 
                      ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>🎧 Podcast (-5%)</span>
                </button>
              </div>
            </div>

            {/* Provider Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-2">
                {language === 'vi' ? 'Công nghệ AI Speech:' : 'Speech Engine:'}
              </span>
              <button
                type="button"
                onClick={() => setVoiceProviderFilter('all')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  voiceProviderFilter === 'all'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {language === 'vi' ? 'Tất Cả' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setVoiceProviderFilter('gemini_audio')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  voiceProviderFilter === 'gemini_audio'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 font-extrabold'
                    : 'text-slate-500 hover:text-cyan-400'
                }`}
              >
                <Radio className="w-3 h-3 text-cyan-300 animate-pulse" />
                <span>Gemini 2.0 Live Audio ⚡</span>
              </button>
              <button
                type="button"
                onClick={() => setVoiceProviderFilter('google_tts')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  voiceProviderFilter === 'google_tts'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'text-slate-500 hover:text-rose-400'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Google WaveNet Studio 🌟</span>
              </button>
              <button
                type="button"
                onClick={() => setVoiceProviderFilter('edge_tts')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  voiceProviderFilter === 'edge_tts'
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-500 hover:text-indigo-400'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>Microsoft Edge-TTS ⚡</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {voices
                .filter((v) => voiceProviderFilter === 'all' || v.provider === voiceProviderFilter)
                .map((voice) => {
                const isSelected = selectedVoice === voice.id;
                return (
                  <div
                    key={voice.id}
                    onClick={() => setSelectedVoice(voice.id)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 relative group ${
                      isSelected
                        ? 'bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-50/50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isSelected 
                            ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30' 
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {voice.gender === 'female' ? '👩' : '👨'}
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            {voice.name}
                            {isSelected && <Check className="w-4 h-4 text-indigo-500" />}
                          </div>
                          <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1.5">
                            <span>{voice.style}</span>
                            {voice.badge && (
                              <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                                voice.badge.includes('GEMINI')
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : voice.badge.includes('GOOGLE')
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'bg-indigo-500/20 text-indigo-400'
                              }`}>
                                {voice.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold">
                        {voice.language}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {voice.description}
                    </p>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewVoice(voice);
                        }}
                        className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${
                          previewingVoiceId === voice.id
                            ? 'text-rose-500 font-extrabold animate-pulse'
                            : 'text-slate-700 dark:text-slate-300 hover:text-indigo-500'
                        }`}
                      >
                        {previewingVoiceId === voice.id ? (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                            <span>{language === 'vi' ? 'Đang Phát (Bấm Dừng)' : 'Playing (Stop)'}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{t('studio_preview_audio')}</span>
                          </>
                        )}
                      </button>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {voice.id.split('-')[0].toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-slate-950 border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  {language === 'vi' ? 'Tạo Giọng Đọc Đầy Đủ Kịch Bản' : 'Synthesize Full Video Voiceover'}
                </div>
                <p className="text-xs text-slate-400">
                  {language === 'vi' 
                    ? `Đang chọn giọng: ${voices.find(v => v.id === selectedVoice)?.name || selectedVoice} (Preset: ${voicePreset.toUpperCase()})` 
                    : `Active voice: ${selectedVoice}`}
                </p>
              </div>

              <button
                onClick={handleSynthesizeFullAudio}
                disabled={ttsMutation.isPending || !storyboard}
                className="py-3 px-6 bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-600 hover:to-rose-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {ttsMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {language === 'vi' ? 'Đang Tổng Hợp Audio AI...' : 'Synthesizing Audio...'}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    {language === 'vi' ? '🎙️ Tạo Audio Toàn Bộ & Chuyển Sang Video Player' : '🎙️ Synthesize All & Open Video Player'}
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
            <div className="bg-slate-950 p-4 md:p-6 rounded-3xl border border-slate-800 shadow-2xl flex flex-col items-center justify-center min-h-[580px] relative overflow-hidden group">
              
              <div 
                className={`absolute inset-0 opacity-20 blur-3xl transition-all duration-700 pointer-events-none ${
                  currentSceneIndex === 0 ? 'bg-gradient-to-br from-rose-600 via-indigo-600 to-purple-800' :
                  currentSceneIndex === 1 ? 'bg-gradient-to-br from-amber-600 via-rose-700 to-slate-900' :
                  currentSceneIndex === 2 ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-900' :
                  currentSceneIndex === 3 ? 'bg-gradient-to-br from-sky-600 via-indigo-600 to-purple-900' :
                  'bg-gradient-to-br from-indigo-600 via-rose-600 to-emerald-600'
                }`} 
              />

              <div
                ref={videoContainerRef}
                className={`relative z-10 transition-all duration-300 rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950 flex flex-col justify-center items-center ${
                  aspectRatio === '9:16'
                    ? 'w-[320px] sm:w-[360px] h-[580px]'
                    : 'w-full max-w-[780px] h-[440px]'
                }`}
              >
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
                      stars: 4280,
                      forks: 340,
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
                />
              </div>

              {!ttsResult?.audio_base64 && (
                <div className="w-full max-w-xl p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/90 to-slate-900 border border-indigo-500/30 flex items-center justify-between gap-3 text-xs mt-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-indigo-300">
                    <Sparkles className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                    <span className="font-semibold">
                      {language === 'vi'
                        ? 'Chưa tạo giọng đọc cho video này.'
                        : 'No voiceover synthesized yet.'}
                    </span>
                  </div>
                  <button
                    onClick={handleSynthesizeFullAudio}
                    disabled={ttsMutation.isPending || !storyboard}
                    className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-600 hover:to-rose-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition-all disabled:opacity-50"
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

              <div className="w-full max-w-xl mt-4 flex items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 shadow-lg">
                <button
                  onClick={() => {
                    if (playerRef.current) playerRef.current.seekTo(0);
                    if (audioRef.current) audioRef.current.currentTime = 0;
                    setCurrentSceneIndex(0);
                    setIsPlaying(false);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={togglePlay}
                  className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-500/25 flex items-center gap-2 transition-all active:scale-95"
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

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const nextMuted = !isMuted;
                      setIsMuted(nextMuted);
                      if (audioRef.current) audioRef.current.muted = nextMuted;
                    }}
                    className={`p-2 rounded-xl transition-colors ${
                      isMuted ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
                      if (audioRef.current) {
                        audioRef.current.volume = val;
                        audioRef.current.muted = false;
                      }
                    }}
                    className="w-16 accent-rose-500 h-1 bg-slate-700 rounded-lg cursor-pointer hidden sm:block"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowCaptions(!showCaptions)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      showCaptions
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 font-extrabold shadow-sm'
                        : 'border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                    title={showCaptions ? 'Tắt phụ đề' : 'Bật phụ đề'}
                  >
                    💬 {showCaptions ? 'CC ON' : 'CC OFF'}
                  </button>

                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setAspectRatio('9:16')}
                      className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                        aspectRatio === '9:16' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setAspectRatio('16:9')}
                      className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                        aspectRatio === '16:9' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'
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
            <div className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-500" />
                {language === 'vi' ? 'Xuất & Tải Tài Nguyên' : 'Export & Downloads'}
              </h3>

              <div className="space-y-2.5">
                <button
                  onClick={handleExportVideo}
                  disabled={!ttsResult?.audio_base64 || isExportingVideo}
                  className="w-full p-4 rounded-2xl bg-gradient-to-r from-rose-500 via-indigo-600 to-emerald-500 text-white text-left flex items-center justify-between transition-all group disabled:opacity-50 shadow-lg shadow-rose-500/25 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                      {isExportingVideo ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Film className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                        <span>{language === 'vi' ? 'Xuất & Tải Video (MP4 / WebM)' : 'Export Video (MP4 / WebM)'}</span>
                        <span className="px-1.5 py-0.5 text-[9px] bg-white/20 rounded font-mono font-bold">HD</span>
                      </div>
                      <div className="text-[10px] text-white/80 font-mono">
                        {isExportingVideo 
                          ? `${language === 'vi' ? 'Đang xuất video...' : 'Exporting...'} ${exportProgress}%` 
                          : `${aspectRatio} | Full Visuals & Audio`}
                      </div>
                    </div>
                  </div>
                  <Download className="w-5 h-5 text-white/80 group-hover:text-white group-hover:translate-y-0.5 transition-all" />
                </button>

                <button
                  onClick={handleDownloadAudio}
                  disabled={!ttsResult?.audio_base64}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-left flex items-center justify-between transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {t('studio_download_audio')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        MP3 128kbps | {ttsResult ? `${ttsResult.duration_seconds}s` : '0s'}
                      </div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </button>

                <button
                  onClick={handleDownloadSRT}
                  disabled={!ttsResult?.subtitle_entries || ttsResult.subtitle_entries.length === 0}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-left flex items-center justify-between transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {t('studio_download_subtitles')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        SubRip (.srt) CapCut/Premiere
                      </div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </button>

                <button
                  onClick={handleDownloadMarkdown}
                  disabled={!blogPost}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-rose-500 text-left flex items-center justify-between transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {t('studio_download_markdown')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        SEO Tech Article (.md)
                      </div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
                </button>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>{language === 'vi' ? 'Nhảy Nhanh Phân Cảnh:' : 'Jump to Scene:'}</span>
                  <span className="text-[10px] font-mono text-slate-400">Click to seek</span>
                </div>
                <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                  {storyboard?.scenes.map((s, idx) => {
                    const sceneIcons: Record<string, string> = {
                      intro: '🌟',
                      github: '🐙',
                      comparison: '⚖️',
                      stat: '📊',
                      architecture: '🧠',
                      code: '💻',
                      terminal: '⚡',
                      features: '🧩',
                      outro: '🎯',
                      content: '✨',
                    };
                    const icon = sceneIcons[s.scene_type || 'content'] || '✨';

                    return (
                      <div
                        key={s.scene_number || idx}
                        onClick={() => handleSeekScene(idx)}
                        className={`px-3 py-2 rounded-xl text-[11px] font-mono cursor-pointer transition-all flex items-center justify-between border ${
                          currentSceneIndex === idx
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/40 font-bold shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-transparent hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-5 h-5 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {icon}
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
