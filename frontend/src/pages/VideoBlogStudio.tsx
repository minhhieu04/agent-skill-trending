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
  Star,
  GitFork,
  ShieldCheck,
  Zap,
  Terminal,
  AlertTriangle,
  Flame,
  ArrowRight,
  Globe,
  FolderGit2,
  FileCode,
  Film
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
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

export const VideoBlogStudio: React.FC<VideoBlogStudioProps> = ({ 
  skills = [], 
  initialSkill = null 
}) => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [activeStep, setActiveStep] = useState<'script' | 'voice' | 'player'>('script');

  const [selectedSkillId, setSelectedSkillId] = useState<number | ''>(initialSkill ? initialSkill.id : '');
  const [customTopic, setCustomTopic] = useState<string>(
    initialSkill ? (initialSkill.title || initialSkill.name) : 'Google Antigravity & Kỹ Năng Lập Trình AI 2026'
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
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [playbackTimeMs, setPlaybackTimeMs] = useState<number>(0);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [isExportingVideo, setIsExportingVideo] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [isGeneratingImages, setIsGeneratingImages] = useState<boolean>(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);

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
    onSuccess: (data) => {
      setStoryboard(data);
      setCurrentSceneIndex(0);
      showToast(language === 'vi' ? 'Đã sinh kịch bản video phân cảnh kèm ảnh AI!' : 'Video storyboard & AI visuals generated!');
    },
    onError: (err: any) => {
      showToast(err.message || 'Lỗi khi sinh storyboard', 'error');
    }
  });

  const sceneImageMutation = useMutation({
    mutationFn: ({ prompt, sceneNumber }: { prompt: string; sceneNumber: number }) => 
      api.generateSceneImage(prompt, sceneNumber),
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
        const targetPrompt = scene.visual_prompt || scene.visual_description || 'AI Coding Assistant';
        const res = await api.generateSceneImage(targetPrompt, scene.scene_number);
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

  const handleGenerateAll = () => {
    const skillId = selectedSkillId ? Number(selectedSkillId) : undefined;
    blogMutation.mutate({
      skill_id: skillId,
      topic: customTopic,
      tone,
      language: language as 'vi' | 'en',
      custom_notes: customNotes
    });

    storyboardMutation.mutate({
      skill_id: skillId,
      content: customTopic,
      target_duration: targetDuration,
      aspect_ratio: aspectRatio,
      language: language as 'vi' | 'en'
    });
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
      setPlaybackTimeMs(0);
      setCurrentSceneIndex(0);
      setCurrentWordIndex(0);
      setIsPlaying(false);
    }
  }, [ttsResult]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (!ttsResult?.audio_base64) {
      if (storyboard && storyboard.scenes.length > 0) {
        showToast(language === 'vi' ? 'Đang tự động tạo giọng đọc AI cho toàn bộ video...' : 'Synthesizing AI voiceover for video...');
        handleSynthesizeFullAudio();
        return;
      }
      showToast(language === 'vi' ? 'Vui lòng sinh kịch bản ở Bước 1 trước' : 'Please generate storyboard first', 'error');
      return;
    }

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

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const currentMs = audioRef.current.currentTime * 1000;
    setPlaybackTimeMs(currentMs);

    if (storyboard && storyboard.scenes.length > 0) {
      let accumulatedSec = 0;
      const currentElapsedSec = currentMs / 1000;
      for (let i = 0; i < storyboard.scenes.length; i++) {
        accumulatedSec += storyboard.scenes[i].duration_seconds;
        if (currentElapsedSec <= accumulatedSec) {
          setCurrentSceneIndex(i);
          break;
        }
      }
    }

    if (ttsResult?.subtitle_entries && ttsResult.subtitle_entries.length > 0) {
      for (let w = 0; w < ttsResult.subtitle_entries.length; w++) {
        const entry = ttsResult.subtitle_entries[w];
        if (currentMs >= entry.start_ms && currentMs <= entry.end_ms) {
          setCurrentWordIndex(w);
          break;
        }
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setPlaybackTimeMs(0);
    setCurrentSceneIndex(0);
    setCurrentWordIndex(0);
  };

  const handleSeekScene = (sceneIdx: number) => {
    if (!storyboard || !storyboard.scenes[sceneIdx]) return;
    let targetSec = 0;
    for (let i = 0; i < sceneIdx; i++) {
      targetSec += storyboard.scenes[i].duration_seconds;
    }
    setCurrentSceneIndex(sceneIdx);
    setPlaybackTimeMs(targetSec * 1000);
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
    showToast(language === 'vi' ? '🎬 Đang ghi hình video với hiệu ứng chuyển cảnh...' : '🎬 Recording video with scene transitions...');

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
      const title = blogPost?.title || customTopic || 'AI Video';
      const exportStart = Date.now();

      // Scene timing
      const sceneTimings: { start: number; end: number }[] = [];
      let acc = 0;
      scenes.forEach(s => {
        sceneTimings.push({ start: acc * 1000, end: (acc + s.duration_seconds) * 1000 });
        acc += s.duration_seconds;
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
      const renderFrame = () => {
        const elapsedMs = (audioCtx.currentTime * 1000) || (Date.now() - exportStart);
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
        ctx.fillText('AGENT SKILLS RADAR', 42, 28);
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
        let currentSubIdx = 0;
        for (let w = 0; w < subtitles.length; w++) {
          if (elapsedMs >= subtitles[w].start_ms && elapsedMs <= subtitles[w].end_ms) {
            currentSubIdx = w;
            break;
          }
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

  const formatSRTTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSec % 60).toString().padStart(2, '0');
    const millis = (ms % 1000).toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds},${millis}`;
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

  const currentScene = storyboard?.scenes[currentSceneIndex] || null;
  const totalDurationSec = ttsResult?.duration_seconds || (storyboard?.total_duration || targetDuration);
  const progressPercent = Math.min(100, Math.max(0, ((playbackTimeMs / 1000) / totalDurationSec) * 100));

  const currentSceneSubtitles = ttsResult?.subtitle_entries
    ? ttsResult.subtitle_entries.filter((_entry, idx) => Math.abs(idx - currentWordIndex) <= 5)
    : [];

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

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {storyboard.scenes.map((scene) => (
                    <div
                      key={scene.scene_number}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 space-y-3 hover:border-indigo-500/40 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-indigo-500 font-mono">
                          Scene {scene.scene_number}: {scene.title}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-200 dark:bg-slate-800 rounded font-bold">
                          ⏱️ ~{scene.duration_seconds}s
                        </span>
                      </div>

                      {scene.image_url && (
                        <div className="relative h-28 rounded-xl overflow-hidden border border-slate-800 group/img">
                          <img
                            src={scene.image_url}
                            alt={`Scene ${scene.scene_number}`}
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end justify-between p-2">
                            <span className="text-[10px] font-mono text-slate-300 font-bold bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-sm border border-slate-700/60">
                              🎨 Google Imagen 3 (4K)
                            </span>
                            <button
                              onClick={() => handleRegenerateSceneImage(scene.scene_number)}
                              disabled={sceneImageMutation.isPending}
                              className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-900/90 text-slate-200 hover:text-white border border-slate-700/80 backdrop-blur-sm flex items-center gap-1"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-rose-400" />
                              <span>{language === 'vi' ? 'Đổi Ảnh AI' : 'New Image'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        🎙️ <span className="font-semibold text-rose-500">Lời thoại:</span> "{scene.voiceover_text}"
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        🎬 <span className="font-semibold text-teal-400">Visual:</span> {scene.visual_description}
                      </p>
                    </div>
                  ))}
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
                className={`relative z-10 transition-all duration-300 rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-900/95 flex flex-col justify-between p-4 md:p-6 ${
                  aspectRatio === '9:16'
                    ? 'w-[320px] sm:w-[360px] h-[580px]'
                    : 'w-full max-w-[760px] h-[450px]'
                }`}
              >
                {/* Google Imagen 3 Cinematic Background Layer */}
                {currentScene?.image_url && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <img
                      src={currentScene.image_url}
                      alt="AI Cinematic Scene"
                      className="w-full h-full object-cover opacity-25 scale-105 transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/75 to-slate-950/90" />
                  </div>
                )}

                <div className="relative z-10 flex items-center justify-between text-xs pb-2.5 border-b border-slate-800/80 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="font-extrabold text-[11px] tracking-wider text-slate-200 font-mono">
                      AGENT SKILLS RADAR
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">
                      Scene {currentSceneIndex + 1}/{storyboard?.scenes.length || 5}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-slate-800 text-emerald-400 font-bold">
                      ⏱️ {(playbackTimeMs / 1000).toFixed(1)}s / {totalDurationSec.toFixed(0)}s
                    </span>
                  </div>
                </div>

                <div className="relative z-10 my-auto py-2 space-y-3 overflow-hidden flex flex-col justify-center flex-1">
                  
                  {currentSceneIndex === 0 && (
                    <div className="space-y-3 text-center animate-in fade-in zoom-in-95 duration-300">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-extrabold text-xs font-mono shadow-lg shadow-rose-500/20">
                        <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                        {currentScene?.title || 'Hot Trending Skill 2026'}
                      </div>

                      <h2 className="text-base sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-rose-300 leading-tight drop-shadow-md">
                        {blogPost?.title || customTopic}
                      </h2>

                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-amber-400 font-bold shadow-sm">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{currentSkill?.stars.toLocaleString() || '4,280'} Stars</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-indigo-400 font-bold shadow-sm">
                          <GitFork className="w-3.5 h-3.5" />
                          <span>{currentSkill?.forks.toLocaleString() || '320'} Forks</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-mono text-emerald-400 font-bold shadow-sm">
                          <Zap className="w-3.5 h-3.5" />
                          <span>{currentSkill?.primary_language || 'TypeScript'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentSceneIndex === 1 && (
                    <div className="space-y-2 animate-in slide-in-from-bottom-3 duration-300 text-left">
                      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                        <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-lg bg-slate-950 text-[9px] font-mono text-slate-400 border border-slate-800">
                            <Globe className="w-2.5 h-2.5 text-slate-500" />
                            <span>https://agent.local/debugger</span>
                          </div>
                          <span className="text-[9px] font-mono text-rose-400 font-bold animate-pulse">
                            ⚠️ 3 ISSUES
                          </span>
                        </div>

                        <div className="p-3 space-y-1.5 font-mono text-[10px]">
                          <div className="flex items-center gap-2 p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>[FATAL] 8192/8192 Context Overflow in Session</span>
                          </div>
                          <div className="flex items-center gap-2 p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>[WARN] Manual Prompt Injection: 45m wasted/day</span>
                          </div>
                          <div className="flex items-center gap-2 p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                            <span>[INFO] High LLM API Cost Spike: +$240/mo</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentSceneIndex === 2 && (
                    <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300 text-left">
                      <div className="bg-slate-900/90 rounded-2xl p-3 border border-indigo-500/40 shadow-xl space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-800 pb-1.5">
                          <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                            <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>github.com/{currentSkill?.author || 'google'}/{currentSkill?.name || 'agent-skill'}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                            v2026.1
                          </span>
                        </div>

                        <div className="grid grid-cols-12 gap-2 text-[10px] font-mono">
                          <div className="col-span-4 bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 space-y-1 text-slate-400">
                            <div className="text-emerald-400 font-bold flex items-center gap-1">
                              <FileCode className="w-3 h-3" /> SKILL.md
                            </div>
                            <div className="flex items-center gap-1">
                              <FileCode className="w-3 h-3" /> index.ts
                            </div>
                            <div className="flex items-center gap-1">
                              <FileCode className="w-3 h-3" /> config.json
                            </div>
                          </div>

                          <div className="col-span-8 bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono text-[9px] space-y-1">
                            <div className="text-slate-500 flex items-center gap-1">
                              <Terminal className="w-2.5 h-2.5 text-emerald-400" />
                              <span>$ agy install {currentSkill?.name || 'agent-skill'}</span>
                            </div>
                            <div className="text-emerald-300 whitespace-pre-wrap leading-tight">
                              {currentScene?.code_snippet || `import { Agent } from '@agy/core';\nconst bot = new Agent({ mode: 'ultra' });`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentSceneIndex === 3 && (
                    <div className="space-y-2.5 animate-in slide-in-from-right-3 duration-300 text-left">
                      <div className="bg-slate-950/90 rounded-2xl p-2.5 border border-sky-500/30">
                        <div className="text-[10px] font-mono text-sky-400 font-bold mb-1 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          <span>ARCHITECTURE PIPELINE (SUBAGENT ORCHESTRATION)</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-mono gap-1 text-center">
                          <div className="flex-1 p-1 rounded bg-slate-900 border border-slate-800 text-slate-300">Prompt</div>
                          <span className="text-sky-400 font-bold">➡️</span>
                          <div className="flex-1 p-1 rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold">Subagent</div>
                          <span className="text-sky-400 font-bold">➡️</span>
                          <div className="flex-1 p-1 rounded bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold">AST Safe</div>
                          <span className="text-sky-400 font-bold">➡️</span>
                          <div className="flex-1 p-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold">10x Speed</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
                          <div className="text-[9px] text-slate-400 font-mono">Code Quality Score</div>
                          <div className="text-sm font-extrabold text-emerald-400 font-mono">
                            {currentSkill?.quality_score ? `${currentSkill.quality_score}/100` : '98.5 / 100'}
                          </div>
                        </div>
                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
                          <div className="text-[9px] text-slate-400 font-mono">AST Security</div>
                          <div className="text-sm font-extrabold text-teal-300 font-mono flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> 100% SAFE
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentSceneIndex === 4 && (
                    <div className="space-y-3 text-center animate-in zoom-in-95 duration-300">
                      <div className="inline-block p-2 rounded-2xl bg-gradient-to-br from-rose-500/20 to-indigo-500/20 border border-indigo-500/40">
                        <Sparkles className="w-6 h-6 text-rose-400 mx-auto animate-spin" style={{ animationDuration: '6s' }} />
                      </div>

                      <h3 className="text-sm sm:text-base font-extrabold text-white">
                        {currentScene?.title || 'Trải Nghiệm Kỹ Năng Này Ngay Hôm Nay'}
                      </h3>

                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-extrabold text-xs shadow-lg shadow-rose-500/30">
                        <span>Cài Đặt Qua Antigravity Radar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}

                </div>

                <div className="space-y-2 pt-1 shrink-0">
                  <div className="min-h-[44px] bg-black/85 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/10 flex items-center justify-center text-center">
                    {currentSceneSubtitles.length > 0 ? (
                      <p className="text-xs sm:text-sm font-extrabold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-snug tracking-wide flex flex-wrap items-center justify-center gap-1">
                        {currentSceneSubtitles.map((sub, idx) => {
                          const originalIdx = ttsResult?.subtitle_entries.indexOf(sub) ?? -1;
                          const isActive = currentWordIndex === originalIdx && isPlaying;
                          const isPast = originalIdx < currentWordIndex && isPlaying;
                          return (
                            <span
                              key={idx}
                              className={`transition-all duration-100 px-1 py-0.5 rounded ${
                                isActive
                                  ? 'bg-amber-400 text-slate-950 scale-110 shadow-lg shadow-amber-400/50 font-black'
                                  : isPast
                                  ? 'text-amber-200 opacity-90'
                                  : 'text-slate-400 opacity-60'
                              }`}
                            >
                              {sub.text}
                            </span>
                          );
                        })}
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm font-extrabold text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-snug tracking-wide">
                        {currentScene ? `"${currentScene.voiceover_text}"` : 'Agent Skill Trending 2026'}
                      </p>
                    )}
                  </div>

                  <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-rose-500 via-indigo-500 to-emerald-400 h-full transition-all duration-100"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
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
                    if (audioRef.current) audioRef.current.currentTime = 0;
                    setPlaybackTimeMs(0);
                    setCurrentSceneIndex(0);
                    setCurrentWordIndex(0);
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
                <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                  {storyboard?.scenes.map((s, idx) => (
                    <div
                      key={s.scene_number}
                      onClick={() => handleSeekScene(idx)}
                      className={`px-3 py-2 rounded-xl text-[11px] font-mono cursor-pointer transition-all flex items-center justify-between border ${
                        currentSceneIndex === idx
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/40 font-bold shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-transparent hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {s.scene_number}
                        </span>
                        <span className="truncate">{s.title}</span>
                      </div>
                      <span className="text-[10px] opacity-70 shrink-0">~{s.duration_seconds}s</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
