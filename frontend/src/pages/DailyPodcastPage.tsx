import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Radio,
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Sparkles,
  Calendar,
  Star,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Target,
  ArrowRight,
  Headphones,
  FileText,
  Bookmark,
  Share2,
  Search,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Cpu,
  Terminal,
  Mic,
  Flame,
  Globe,
  Compass,
  Bot
} from 'lucide-react';
import { api } from '../api/client';
import { DailyDigest, DailyDigestDateInfo, SkillDigestSummary, SocialMediaPost, VoiceOption } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { SocialTechPostCard } from '../components/SocialTechPostCard';
import { SocialTechPostModal } from '../components/SocialTechPostModal';
import { NeuSelect } from '../components/NeuSelect';
import { copyToClipboard } from '../utils/clipboard';

// Curated AI Voices Fallback
const DEFAULT_PODCAST_VOICES: VoiceOption[] = [
  // Google AI Studio - Gemini 3.1 Live Native Audio (Top Community Choice)
  { id: 'gemini-Aoede', name: 'Aoede (Nữ - Siêu Tự Nhiên, Chuẩn Song Ngữ)', provider: 'gemini_audio', language: 'multi', gender: 'female', style: 'Gemini 3.1 Multimodal Expressive Voice', preview_text: '', badge: 'COMMUNITY CHOICE' },
  { id: 'gemini-Puck', name: 'Puck (Nam - Năng Động, Chuẩn Tech Reviewer)', provider: 'gemini_audio', language: 'multi', gender: 'male', style: 'Gemini 3.1 Multimodal Expressive Voice', preview_text: '', badge: 'TRENDING REVIEW' },
  { id: 'gemini-Charon', name: 'Charon (Nam - Trầm Ấm, Chuyên Gia Kiến Trúc)', provider: 'gemini_audio', language: 'multi', gender: 'male', style: 'Gemini 3.1 Multimodal Expressive Voice', preview_text: '', badge: 'SYSTEM ARCHITECT' },
  { id: 'gemini-Kore', name: 'Kore (Nữ - Trong Trẻo, Host Hướng Dẫn)', provider: 'gemini_audio', language: 'multi', gender: 'female', style: 'Gemini 3.1 Multimodal Expressive Voice', preview_text: '', badge: 'TUTORIAL HOST' },
  { id: 'gemini-Fenrir', name: 'Fenrir (Nam - Bản Lĩnh, Keynote Leader)', provider: 'gemini_audio', language: 'multi', gender: 'male', style: 'Gemini 3.1 Multimodal Expressive Voice', preview_text: '', badge: 'KEYNOTE LEADER' },
  // Tiêu Chuẩn Giọng Đọc Việt Nam Được Giữ Lại (Diểm Phúc & Minh Hiếu)
  { id: 'vi-VN-HoaiMyNeural', name: 'Diểm Phúc (Nữ - Truyền Cảm, TikTok Hot)', provider: 'edge_tts', language: 'vi-VN', gender: 'female', style: 'Viral Reviewer, TikTok Hot', preview_text: '', badge: 'TIKTOK VIRAL' },
  { id: 'vi-VN-NamMinhNeural', name: 'Minh Hiếu (Nam - Trầm Ấm, Radar Tech)', provider: 'edge_tts', language: 'vi-VN', gender: 'male', style: 'Tech Radar, Thời Sự', preview_text: '', badge: 'TECH RADAR' },
  // Tiếng Anh Quốc Tế (Silicon Valley & DeepMind)
  { id: 'en-US-Journey-F', name: 'Google Journey (Female - Expressive)', provider: 'google_tts', language: 'en-US', gender: 'female', style: 'DeepMind Next-Gen Journey', preview_text: '', badge: 'DEEPMIND' },
  { id: 'en-US-ChristopherNeural', name: 'Christopher (Male - Silicon Valley Keynote)', provider: 'edge_tts', language: 'en-US', gender: 'male', style: 'Tech Podcast & Keynote', preview_text: '', badge: 'SILICON VALLEY' },
  { id: 'en-US-JennyNeural', name: 'Jenny (Female - Dynamic Tech Host)', provider: 'edge_tts', language: 'en-US', gender: 'female', style: 'Tutorial & Explainer', preview_text: '', badge: 'DYNAMIC HOST' },
];


const formatModelName = (model?: string) => {
  if (!model) return 'Gemini 3.8 Flash';
  if (model.includes('3.8-flash')) return 'Gemini 3.8 Flash';
  if (model.includes('3.1-pro')) return 'Gemini 3.1 Pro';
  if (model.includes('3.6-flash')) return 'Gemini 3.6 Flash';
  if (model.includes('3.5-flash-lite')) return 'Gemini 3.5 Flash Lite';
  if (model.includes('3.5-flash')) return 'Gemini 3.5 Flash';
  if (model.includes('3-flash')) return 'Gemini 3 Flash';
  if (model.includes('3.1-flash-lite')) return 'Gemini 3.1 Flash Lite';
  if (model.includes('2.5-flash')) return 'Gemini 2.5 Flash';
  if (model.includes('2.5-pro')) return 'Gemini 2.5 Pro';
  if (model.includes('flash-latest')) return 'Gemini Flash';
  return model.replace('models/', '').replace(/^gemini-/, 'Gemini ');
};

export const formatDisplayDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  const match = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    return `${match[3].padStart(2, '0')}/${match[2].padStart(2, '0')}`;
  }
  if (clean.toLowerCase() === 'today' || clean.toLowerCase() === 'hôm nay') {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  const parts = clean.split('-');
  if (parts.length === 3 && parts[1] && parts[2]) {
    const day = parts[2].trim().replace(/\D.*$/, '').padStart(2, '0');
    const month = parts[1].trim().replace(/\D.*$/, '').padStart(2, '0');
    if (day && month) return `${day}/${month}`;
  }
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  return clean;
};

interface DailyPodcastPageProps {
  onSelectSkillById?: (id: number) => void;
  onToggleBookmark?: (id: number) => void;
  onOpenAgentChat?: (query?: string) => void;
}

export const DailyPodcastPage: React.FC<DailyPodcastPageProps> = ({
  onSelectSkillById,
  onToggleBookmark,
  onOpenAgentChat,
}) => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Role helpers
  const isAdmin = user?.is_admin === true;
  const isLoggedIn = !!user;

  // Audio Player State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [selectedVoice, setSelectedVoice] = useState<string>('gemini-Aoede');
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const isSeekingRef = useRef<boolean>(false);

  // Digest Model & Translation State (Gemini 3.8 Flash default)
  const selectedModel = 'gemini-3.8-flash';
  const [translatedDigest, setTranslatedDigest] = useState<DailyDigest | null>(null);
  const [activeDisplayLang, setActiveDisplayLang] = useState<'vi' | 'en'>('vi');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Active View Tab inside Hero: 'script' | 'highlights'
  const [heroTab, setHeroTab] = useState<'script' | 'highlights'>('script');

  // View Mode: 'feed' (Social Tech Posts) | 'matrix' (Quick Cards)
  const [feedViewMode, setFeedViewMode] = useState<'feed' | 'matrix'>('feed');
  const [selectedModalPost, setSelectedModalPost] = useState<{
    post: SocialMediaPost;
    summary: SkillDigestSummary;
  } | null>(null);

  // Filter state in practical matrix
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [copiedSkillId, setCopiedSkillId] = useState<number | null>(null);
  const [activePostSkillId, setActivePostSkillId] = useState<number | null>(null);
  const isUserNavigatingRef = useRef<boolean>(false);
  const jumpTimeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (jumpTimeoutRef.current) clearTimeout(jumpTimeoutRef.current);
    };
  }, []);

  // 1. Fetch available podcast voices
  const { data: voicesData } = useQuery<{ voices: VoiceOption[] }>({
    queryKey: ['podcastVoices'],
    queryFn: api.getPodcastVoices,
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  const allVoices: VoiceOption[] = (voicesData?.voices && voicesData.voices.length > 0)
    ? voicesData.voices
    : DEFAULT_PODCAST_VOICES;

  const currentVoiceObj = allVoices.find((v) => v.id === selectedVoice) || allVoices[0];

  const vietnameseVoices = allVoices.filter(
    (v) => v.language === 'vi-VN' || (!v.id.startsWith('gemini-') && !v.language.startsWith('en'))
  );
  const geminiVoices = allVoices.filter(
    (v) => v.id.startsWith('gemini-') || v.provider === 'gemini_audio'
  );
  const internationalVoices = allVoices.filter(
    (v) => v.language.startsWith('en') || (!v.id.startsWith('gemini-') && v.language !== 'vi-VN')
  );

  const getVoiceSelectIcon = (voiceId: string) => {
    if (voiceId.includes('Aoede')) return <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    if (voiceId.includes('Puck')) return <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
    if (voiceId.includes('Charon')) return <Target className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
    if (voiceId.includes('Kore')) return <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
    if (voiceId.includes('Fenrir')) return <Radio className="w-3.5 h-3.5 text-cyan-500 shrink-0" />;
    if (voiceId.includes('HoaiMy')) return <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    if (voiceId.includes('NamMinh')) return <Mic className="w-3.5 h-3.5 text-sky-500 shrink-0" />;
    if (voiceId.includes('Journey')) return <Compass className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
    if (voiceId.includes('Christopher')) return <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
    return <Volume2 className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />;
  };

  const voiceSelectOptions = React.useMemo(() => [
    ...geminiVoices.map((v) => ({
      value: v.id,
      label: v.name,
      badge: v.badge,
      icon: getVoiceSelectIcon(v.id),
      group: 'Google AI Studio (Siêu Tự Nhiên & Chuẩn Song Ngữ)',
    })),
    ...vietnameseVoices.map((v) => ({
      value: v.id,
      label: v.name,
      badge: v.badge,
      icon: getVoiceSelectIcon(v.id),
      group: 'Giọng Đọc Tiếng Việt Tiêu Chuẩn',
    })),
    ...internationalVoices.map((v) => ({
      value: v.id,
      label: v.name,
      badge: v.badge,
      icon: getVoiceSelectIcon(v.id),
      group: 'English & Global Studio',
    })),
  ], [geminiVoices, vietnameseVoices, internationalVoices]);

  // 2. Fetch available dates
  const { data: datesData, isLoading: loadingDates } = useQuery<{ dates: DailyDigestDateInfo[] }>({
    queryKey: ['dailyDigestDates'],
    queryFn: api.getDailyDigestDates,
  });

  const availableDates = datesData?.dates || [];
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Default to the first available date when dates load
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0].date);
    }
  }, [availableDates, selectedDate]);

  const todayLocalStr = React.useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Horizontal Scroll state for available dates
  const datesScrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollDatesLeft, setCanScrollDatesLeft] = useState(false);
  const [canScrollDatesRight, setCanScrollDatesRight] = useState(false);

  const updateDatesScrollState = () => {
    if (!datesScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = datesScrollRef.current;
    setCanScrollDatesLeft(scrollLeft > 5);
    setCanScrollDatesRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  useEffect(() => {
    updateDatesScrollState();
    window.addEventListener('resize', updateDatesScrollState);
    return () => window.removeEventListener('resize', updateDatesScrollState);
  }, [availableDates]);

  const handleScrollDates = (dir: 'left' | 'right') => {
    if (!datesScrollRef.current) return;
    const delta = dir === 'left' ? -200 : 200;
    datesScrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(updateDatesScrollState, 250);
  };

  // 3. Fetch or auto-generate digest for the selected date
  const {
    data: digest,
    isLoading: loadingDigest,
  } = useQuery<DailyDigest>({
    queryKey: ['dailyDigest', selectedDate],
    queryFn: () => api.getDailyDigest(selectedDate),
    enabled: Boolean(selectedDate),
  });

  // Active digest: translated version if user toggled to English, else server digest
  const activeDigest = (activeDisplayLang === 'en' && translatedDigest) ? translatedDigest : digest;

  // Reset translated digest when date changes
  useEffect(() => {
    setTranslatedDigest(null);
    setActiveDisplayLang('vi');
  }, [selectedDate]);

  // Track bookmarked skills reactively
  const { data: bookmarkedSkills = [] } = useQuery<any[]>({
    queryKey: ['bookmarkedSkills'],
    queryFn: api.getBookmarkedSkills,
  });
  const bookmarkedSkillIds = new Set(bookmarkedSkills.map((s: any) => s.id));

  // Sync selectedVoice from server to prevent voice mismatch on reload
  // This fixes the 5-10s delay: without this, selectedVoice defaults to 'gemini-Aoede'
  // but the server may have cached audio for 'gemini-Puck', causing full re-synthesis
  useEffect(() => {
    if (digest?.podcast_voice && digest.podcast_voice !== selectedVoice) {
      setSelectedVoice(digest.podcast_voice);
    }
  }, [digest?.podcast_voice]);

  // Reset audio when date changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setIsAudioLoading(false);
    setCurrentTime(0);
    setDuration(digest?.podcast_duration_sec || 0);
  }, [selectedDate, digest?.id]);

  // Handle HTML5 Audio events
  const handleAudioTimeUpdate = () => {
    // Skip time updates while user is dragging the seek bar
    if (isSeekingRef.current) return;
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Audio Synthesis Mutation (for explicit re-generation)
  const audioMutation = useMutation({
    mutationFn: (force: boolean = false) =>
      api.synthesizeDailyPodcastAudio(selectedDate, selectedVoice, '+5%', force),
    onSuccess: (data) => {
      queryClient.setQueryData(['dailyDigest', selectedDate], (old: DailyDigest | undefined) => {
        if (!old) return old;
        return {
          ...old,
          has_audio: true,
          podcast_duration_sec: data.duration_seconds,
          podcast_voice: data.voice,
        };
      });
      // Start streaming or play from base64
      if (audioRef.current) {
        audioRef.current.src = `data:audio/mp3;base64,${data.audio_base64}`;
        audioRef.current.playbackRate = playbackRate;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((e) => console.error('Audio play error:', e));
      }
      setIsAudioLoading(false);
      showToast(t('podcast_hero_badge') + ': Audio sẵn sàng!', 'success');
    },
    onError: (err: any) => {
      setIsAudioLoading(false);
      showToast(err.message || 'Lỗi khi tạo âm thanh podcast', 'error');
    },
  });

  const togglePlayPodcast = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (!selectedDate || loadingDigest) return;

    // Use the voice that's already cached in DB to avoid re-synthesis
    // Only use selectedVoice if user explicitly changed it (different from digest)
    const effectiveVoice = digest?.podcast_voice || selectedVoice;
    const streamUrl = api.getPodcastAudioStreamUrl(selectedDate, effectiveVoice);

    if (audioRef.current) {
      // Resume if already loaded and playing the same source
      if (
        audioRef.current.src &&
        !audioRef.current.ended &&
        audioRef.current.currentTime > 0 &&
        (audioRef.current.src.includes(encodeURIComponent(selectedDate)) || audioRef.current.src.startsWith('data:audio'))
      ) {
        audioRef.current.playbackRate = playbackRate;
        try {
          await audioRef.current.play();
          setIsPlaying(true);
          return;
        } catch (e) {
          console.error(e);
        }
      }

      // Load new stream source
      setIsAudioLoading(true);
      audioRef.current.src = streamUrl;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = isMuted ? 0 : volume;
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setIsAudioLoading(false);
      } catch (err: any) {
        console.error('Playback error or waiting for stream:', err);
        // Browser buffers stream, keep isAudioLoading true - onPlaying event will clear it
      }
    }
  };

  const handleSeekStart = () => {
    isSeekingRef.current = true;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    // Apply seek immediately to audio element
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSeekEnd = () => {
    isSeekingRef.current = false;
  };

  const cyclePlaybackRate = () => {
    const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIdx = rates.indexOf(playbackRate);
    const nextIdx = (currentIdx + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      audioRef.current.muted = newVol === 0;
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.muted = newMuted;
    }
  };

  // 4. Translate Summary Handler (Gemini 3.8 Flash)
  const handleToggleTranslate = async () => {
    if (activeDisplayLang === 'en') {
      setActiveDisplayLang('vi');
      showToast('Đã chuyển về bản tóm tắt Tiếng Việt', 'info');
      return;
    }

    if (translatedDigest) {
      setActiveDisplayLang('en');
      showToast('Đã hiển thị bản tóm tắt Tiếng Anh', 'success');
      return;
    }

    try {
      setIsTranslating(true);
      showToast(`Đang dịch toàn bộ bản tóm tắt sang Tiếng Anh bằng ${formatModelName(selectedModel)}...`, 'info');
      const trans = await api.translateDailyDigest(selectedDate, 'en', selectedModel);
      setTranslatedDigest(trans);
      setActiveDisplayLang('en');
      showToast('Dịch bản tóm tắt thành công!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Dịch bản tóm tắt thất bại', 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  // 5. Regenerate Digest Mutation with chosen model
  const regenerateMutation = useMutation({
    mutationFn: () => api.regenerateDailyDigest(selectedDate, language, selectedModel),
    onSuccess: (updatedDigest) => {
      queryClient.setQueryData(['dailyDigest', selectedDate], updatedDigest);
      queryClient.invalidateQueries({ queryKey: ['dailyDigestDates'] });
      setTranslatedDigest(null);
      setActiveDisplayLang('vi');
      // Reset audio so it re-synthesizes on play
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setIsPlaying(false);
      setCurrentTime(0);
      showToast(`Đã dùng AI (${formatModelName(updatedDigest.source_model)}) phân tích và tạo lại bản tin podcast!`, 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Lỗi khi tái tạo bản tin', 'error');
    },
  });

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopyPrompt = async (text: string, id: number) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedSkillId(id);
      showToast(t('label_copy_prompt_toast'), 'success');
      setTimeout(() => setCopiedSkillId(null), 2500);
    } else {
      showToast('Không thể sao chép lệnh', 'error');
    }
  };

  // Helper to guarantee every skill has a rich SocialMediaPost object
  const ensureSocialPost = (item: SkillDigestSummary): SocialMediaPost => {
    if (item.social_post) return item.social_post;
    return {
      id: `post-${item.skill_id}`,
      skill_id: item.skill_id,
      title: item.title,
      name: item.name,
      author_handle: `@${item.author ? item.author.toLowerCase().replace(/\s+/g, '_') : 'community'}`,
      author_name: item.author || 'Open Source Dev',
      posted_time_ago: 'Hôm nay • Phân tích chuyên sâu',
      badge: 'Đề Xuất Kỹ Thuật',
      hook: `Khám phá công cụ ${item.title}: ${item.what_it_does}`,
      summary: `${item.title} (${item.name}) giải quyết bài toán: ${item.what_it_does}`,
      pain_point_story: {
        before: 'Quy trình xử lý thủ công, tốn nhiều thời gian và thiếu chuẩn hóa.',
        after: item.pain_point_solved || 'Quy trình tự động hóa, tăng tốc độ và độ tin cậy.',
      },
      core_mechanism: `Kiến trúc tối ưu hóa phục vụ ${item.target_audience || 'lập trình viên'}.`,
      key_features: [
        item.what_it_does,
        `Tương thích hệ sinh thái ${item.primary_language || 'công nghệ'}`,
        `Dành cho: ${item.target_audience || 'Kỹ sư phần mềm'}`,
      ],
      code_example: {
        language: 'bash',
        filename: 'quickstart.sh',
        code: item.quick_start_prompt || `git clone ${item.repository_url}`,
        explanation: `Lệnh sử dụng nhanh cho ${item.title}.`,
      },
      pros_and_cons: {
        pros: ['Dễ tích hợp', 'Tối ưu hóa hiệu suất phát triển'],
        cons: ['Kiểm tra phiên bản tương thích trước khi dùng'],
      },
      who_should_use: item.target_audience || 'Lập trình viên và AI Engineers',
      hashtags: ['#TechTrending', '#DevTools', `#${item.category?.replace(/-/g, '') || 'Dev'}`],
      reactions: {
        likes: 150 + (item.stars % 400),
        hearts: 80 + (item.stars % 250),
        bookmarks: 45 + (item.stars % 150),
        shares: 20 + (item.stars % 80),
      },
      read_time_minutes: 3,
      repository_url: item.repository_url,
    };
  };

  // Speech synthesis fallback for individual skill snippets
  const handleReadSkillSegment = (snippet: string) => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(snippet);
      utter.lang = language === 'vi' ? 'vi-VN' : 'en-US';
      utter.rate = 1.05;
      window.speechSynthesis.speak(utter);
      showToast('Đang đọc đoạn phân tích của công cụ này...', 'info');
    }
  };

  // Filter skills in digest
  const rawSkills: SkillDigestSummary[] = activeDigest?.skill_summaries || [];
  const categoriesInDigest = Array.from(new Set(rawSkills.map((s) => s.category))).filter(Boolean);

  const filteredSkills = rawSkills.filter((s) => {
    const matchesCat = filterCategory === 'all' || s.category === filterCategory;
    const term = searchFilter.toLowerCase().trim();
    const post = s.social_post;
    const matchesSearch =
      !term ||
      s.name.toLowerCase().includes(term) ||
      s.title.toLowerCase().includes(term) ||
      s.what_it_does.toLowerCase().includes(term) ||
      s.pain_point_solved.toLowerCase().includes(term) ||
      (post && (
        post.hook.toLowerCase().includes(term) ||
        post.summary.toLowerCase().includes(term) ||
        post.core_mechanism.toLowerCase().includes(term) ||
        post.hashtags.some((h) => h.toLowerCase().includes(term))
      ));
    return matchesCat && matchesSearch;
  });

  // Automatically track active post
  useEffect(() => {
    if (filteredSkills.length > 0) {
      if (!activePostSkillId || !filteredSkills.some((s) => s.skill_id === activePostSkillId)) {
        setActivePostSkillId(filteredSkills[0].skill_id);
      }
    } else {
      setActivePostSkillId(null);
    }
  }, [filteredSkills, activePostSkillId]);

  // Observer to track visible post when scrolling in feed view mode
  useEffect(() => {
    if (feedViewMode !== 'feed' || filteredSkills.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isUserNavigatingRef.current) return;
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          const skillIdStr = visibleEntries[0].target.getAttribute('data-skill-id');
          if (skillIdStr) {
            const sid = Number(skillIdStr);
            if (sid && !isNaN(sid)) {
              setActivePostSkillId(sid);
            }
          }
        }
      },
      {
        rootMargin: '-10% 0px -40% 0px',
        threshold: [0.1, 0.3, 0.6],
      }
    );

    filteredSkills.forEach((skill) => {
      const el = document.getElementById(`post-${skill.skill_id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [filteredSkills, feedViewMode]);

  const activeSummary = filteredSkills.find((s) => s.skill_id === activePostSkillId) || filteredSkills[0] || null;
  const activePost = activeSummary ? ensureSocialPost(activeSummary) : null;

  const handleJumpToPost = (skillId: number) => {
    isUserNavigatingRef.current = true;
    setActivePostSkillId(skillId);
    if (jumpTimeoutRef.current) clearTimeout(jumpTimeoutRef.current);
    jumpTimeoutRef.current = setTimeout(() => {
      isUserNavigatingRef.current = false;
    }, 700);

    const el = document.getElementById(`post-${skillId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleJumpToSection = (sectionAnchorId: string) => {
    isUserNavigatingRef.current = true;
    if (jumpTimeoutRef.current) clearTimeout(jumpTimeoutRef.current);
    jumpTimeoutRef.current = setTimeout(() => {
      isUserNavigatingRef.current = false;
    }, 700);

    const el = document.getElementById(sectionAnchorId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleShareActivePost = async () => {
    if (!activePost) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#post-${activePost.skill_id}`;
    const cleanHookText = activePost.hook ? activePost.hook.replace(/[*_~`]/g, '').trim() : '';
    const shareContent = `🔥 [AI Radar] ${activePost.title}\n\n"${cleanHookText}"\n\n👉 Chi tiết phân tích: ${shareUrl}`;
    const ok = await copyToClipboard(shareContent);
    if (ok) {
      showToast('Đã sao chép liên kết chia sẻ bài viết!', 'success');
    } else {
      showToast('Không thể sao chép liên kết vào bộ nhớ tạm', 'error');
    }
  };

  // Safely extract highlights list regardless of backend runtime data shape (array, string, JSON string)
  const rawHighlights: any = activeDigest?.highlights;
  const safeHighlights: string[] = Array.isArray(rawHighlights)
    ? rawHighlights
    : typeof rawHighlights === 'string'
    ? rawHighlights.trim().startsWith('[')
      ? (() => {
          try {
            const parsed = JSON.parse(rawHighlights);
            return Array.isArray(parsed) ? parsed : [rawHighlights];
          } catch {
            return (rawHighlights as string).split('\n').map((s: string) => s.trim().replace(/^[-*•\d.]+\s*/, '')).filter(Boolean);
          }
        })()
      : (rawHighlights as string).split('\n').map((s: string) => s.trim().replace(/^[-*•\d.]+\s*/, '')).filter(Boolean)
    : [];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleAudioTimeUpdate}
        onLoadedMetadata={handleAudioLoadedMetadata}
        onEnded={handleAudioEnded}
        onWaiting={() => setIsAudioLoading(true)}
        onPlaying={() => {
          setIsPlaying(true);
          setIsAudioLoading(false);
        }}
        onPause={() => setIsPlaying(false)}
        onError={(e) => {
          console.error('Audio playback error:', e);
          setIsAudioLoading(false);
          setIsPlaying(false);
        }}
      />

      {/* TOP HEADER */}
      <div className="p-5 sm:p-6 rounded-3xl neu-flat space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-[var(--text-main)]">
                  {t('tab_daily_podcast')}
                </h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full neu-inset-sm text-[var(--primary)] font-mono font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
                  AI AUDIO FEED
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {t('practical_sub')}
              </p>
            </div>
          </div>
        </div>

        <div className="neu-divider" />

        {/* Date Selector Navigation with Horizontal Scroll Controls */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] whitespace-nowrap flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
              {t('podcast_select_date')}:
            </span>

              <div className="flex items-center gap-1 ml-1">
                <button
                  type="button"
                  onClick={() => handleScrollDates('left')}
                  disabled={!canScrollDatesLeft}
                  className="w-5 h-5 rounded-lg neu-btn-sm flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Cuộn sang trái"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScrollDates('right')}
                  disabled={!canScrollDatesRight}
                  className="w-5 h-5 rounded-lg neu-btn-sm flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Cuộn sang phải"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
          </div>

          <div
            ref={datesScrollRef}
            onScroll={updateDatesScrollState}
            className="flex items-center gap-2 overflow-x-auto py-2 px-1 scrollbar-none scroll-smooth"
          >
            {loadingDates ? (
              <div className="h-8 w-48 neu-inset rounded-xl animate-pulse" />
            ) : (
              availableDates.map((item) => {
                const isSelected = item.date === selectedDate;
                const isTodayDate = item.is_today || item.date === todayLocalStr;
                const label = formatDisplayDate(item.date);
                return (
                  <button
                    key={item.date}
                    onClick={() => setSelectedDate(item.date)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 neu-tab ${
                      isSelected
                        ? 'neu-inset text-[var(--primary)] font-bold'
                        : 'neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <span>{label}</span>
                    {isTodayDate && (
                      <span className="px-1.5 py-0.2 text-[9px] rounded-md font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        HÔM NAY
                      </span>
                    )}
                    {item.skills_count > 0 && (
                      <span
                        className={`px-1.5 py-0.2 text-[10px] rounded-md font-mono font-medium ${
                          isSelected
                            ? 'bg-[var(--primary)] text-white'
                            : 'neu-inset-sm text-[var(--text-muted)]'
                        }`}
                      >
                        {item.skills_count}
                      </span>
                    )}
                    {item.has_audio && (
                      <Headphones className="w-3 h-3 text-[var(--primary)] shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* FEATURED PODCAST HERO PLAYER CARD */}
      <div className="relative rounded-3xl neu-flat p-5 sm:p-6 space-y-4 sm:space-y-5">
        {/* Top: Badges & Episode Title */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-[var(--primary)] text-xs font-mono font-semibold uppercase flex items-center gap-1.5 shrink-0">
              <Radio className="w-3.5 h-3.5" />
              {t('podcast_hero_badge')}
            </span>
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 font-mono shrink-0">
              <Calendar className="w-3 h-3 text-[var(--primary)]" />
              {selectedDate}
            </span>
            <span className="text-xs text-[var(--text-muted)] neu-inset-sm px-2.5 py-0.5 rounded-lg font-mono shrink-0">
              {rawSkills.length} {t('label_skills_count')}
            </span>
          </div>

          <h2 className="text-base sm:text-xl lg:text-2xl font-bold tracking-tight text-[var(--text-main)] leading-snug">
            {loadingDigest ? (
              <div className="h-7 w-3/4 neu-inset rounded-xl animate-pulse" />
            ) : (
              activeDigest?.title || `Bản Tin AI Radar Ngày ${selectedDate}`
            )}
          </h2>

          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg neu-inset text-[var(--primary)] flex items-center justify-center font-bold text-[10px] shrink-0">
                {currentVoiceObj?.badge ? currentVoiceObj.badge.slice(0, 2) : 'AI'}
              </div>
              <span className="truncate">
                Host: <strong className="text-[var(--text-main)] font-semibold">{currentVoiceObj?.name || 'Minh Hiếu'}</strong>
                <span className="text-[var(--text-muted)] ml-1.5 hidden sm:inline">({currentVoiceObj?.style || 'Tech Radar'})</span>
              </span>
              {currentVoiceObj?.badge && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold neu-inset-sm text-[var(--primary)] shrink-0">
                  {currentVoiceObj.badge}
                </span>
              )}
            </div>
            <span className="text-[var(--shadow-dark)]">•</span>
            <div className="flex items-center gap-1 text-[var(--text-muted)] font-mono shrink-0">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Speed {playbackRate}x</span>
            </div>
          </div>
        </div>

        {/* Audio Player Control Deck - Dedicated Soft UI Sunken Panel */}
        <div className="p-4 sm:p-5 rounded-2xl neu-inset-sm space-y-3.5">
          {/* Top of Deck: Voice Selector & Action Buttons */}
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
            <div className="w-full xl:max-w-md min-w-0">
              <NeuSelect
                value={selectedVoice}
                onChange={(newVoice) => {
                  setSelectedVoice(String(newVoice));
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.src = '';
                  }
                  setIsPlaying(false);
                  setCurrentTime(0);
                }}
                options={voiceSelectOptions}
                size="sm"
                variant="inset"
                fullWidth={true}
                searchable={true}
                searchPlaceholder="Tìm kiếm giọng đọc..."
                title="Chọn mô hình giọng đọc AI"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 justify-start xl:justify-end">
              {/* Translate Summary (VI / EN) Toggle Button - Available for all */}
              <button
                onClick={handleToggleTranslate}
                disabled={isTranslating || loadingDigest}
                title={
                  activeDisplayLang === 'en'
                    ? 'Chuyển về bản gốc Tiếng Việt'
                    : isLoggedIn
                    ? 'Dịch toàn bộ bản tóm tắt sang Tiếng Anh bằng AI (Gemini)'
                    : 'Dịch tóm tắt sang Tiếng Anh'
                }
                className={`flex-1 sm:flex-none justify-center px-3 py-2 rounded-xl neu-btn disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${
                  activeDisplayLang === 'en'
                    ? 'neu-inset text-[var(--primary)] font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--primary)]'
                }`}
              >
                <Globe
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isTranslating
                      ? 'animate-spin text-[var(--primary)]'
                      : activeDisplayLang === 'en'
                      ? 'text-[var(--primary)]'
                      : 'text-sky-500'
                  }`}
                />
                <span className="text-[11px] whitespace-nowrap">
                  {isTranslating
                    ? 'Đang dịch...'
                    : activeDisplayLang === 'en'
                    ? 'Xem Tiếng Việt'
                    : 'Dịch tóm tắt (EN)'}
                </span>
              </button>

              {/* Force Audio Re-synthesize Button - Admin only */}
              {isAdmin && (
                <button
                  onClick={() => {
                    setIsAudioLoading(true);
                    audioMutation.mutate(true);
                  }}
                  disabled={isAudioLoading || loadingDigest}
                  title="Ép AI tạo lại âm thanh bằng giọng đọc này"
                  className="flex-1 sm:flex-none justify-center px-3 py-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--primary)] neu-btn disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <Zap className={`w-3.5 h-3.5 shrink-0 ${isAudioLoading ? 'animate-spin text-[var(--primary)]' : ''}`} />
                  <span className="text-[11px] whitespace-nowrap">Tạo lại Audio</span>
                </button>
              )}

              {/* AI Regenerate Digest Button - Admin only */}
              {isAdmin && (
                <button
                  onClick={() => regenerateMutation.mutate()}
                  disabled={regenerateMutation.isPending || loadingDigest}
                  title={t('podcast_regenerate')}
                  className="flex-1 sm:flex-none justify-center px-3 py-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--primary)] neu-btn disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw
                    className={`w-3.5 h-3.5 shrink-0 ${regenerateMutation.isPending ? 'animate-spin text-[var(--primary)]' : ''}`}
                  />
                  <span className="text-[11px] whitespace-nowrap">Tái tạo bài</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom of Deck: Big Play Button + Waveform + Progress Slider + Times */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={togglePlayPodcast}
              disabled={isAudioLoading || loadingDigest || loadingDates || !selectedDate}
              className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl neu-primary text-white transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer shadow-md"
              aria-label={isPlaying ? 'Tạm dừng' : 'Phát Podcast'}
            >
              {isAudioLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />
              )}
            </button>

            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Waveform graphic bars */}
              <div className="flex items-end gap-1 h-5 sm:h-6 px-1">
                {[40, 65, 85, 30, 95, 55, 75, 45, 90, 60, 35, 80, 50, 70, 90, 45, 60, 85, 30, 75, 50, 80, 65, 40].map(
                  (height, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 rounded-sm transition-all duration-300 ${
                        isPlaying ? 'bg-[var(--primary)]' : 'bg-[var(--shadow-dark)]/40'
                      }`}
                      style={{
                        height: isPlaying ? `${Math.max(15, (height * ((idx % 4) + 1)) % 100)}%` : '20%',
                        animationDelay: `${idx * 50}ms`,
                      }}
                    />
                  )
                )}
              </div>

              {/* Scrubber Range Slider with Live Progress */}
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onMouseDown={handleSeekStart}
                onTouchStart={handleSeekStart}
                onChange={handleSeekChange}
                onMouseUp={handleSeekEnd}
                onTouchEnd={handleSeekEnd}
                style={{ '--range-progress': `${duration > 0 ? (currentTime / duration) * 100 : 0}%` } as React.CSSProperties}
                className="w-full h-2 neu-inset rounded-lg appearance-none cursor-pointer accent-[var(--primary)] my-0"
              />

              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <span>{formatSeconds(currentTime)}</span>
                <div className="flex items-center gap-2">
                  {/* Volume Control */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={toggleMute}
                      className="p-0.5 rounded-md hover:text-[var(--primary)] cursor-pointer"
                      title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : volume < 0.5 ? (
                        <Volume1 className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 sm:w-20 h-1.5 neu-inset rounded-full appearance-none cursor-pointer accent-[var(--primary)]"
                      title={`Âm lượng: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                    />
                  </div>
                  <span className="text-[var(--shadow-dark)]">•</span>
                  {/* Playback Speed */}
                  <button
                    onClick={cyclePlaybackRate}
                    className="px-2 py-0.5 rounded-lg neu-btn-sm text-[var(--text-muted)] font-mono font-bold text-[10px] hover:text-[var(--primary)] cursor-pointer"
                    title={`Tốc độ phát: ${playbackRate}x (Nhấn để đổi)`}
                  >
                    {playbackRate}x
                  </button>
                  <span>{formatSeconds(duration)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM TABS: SCRIPT VS HIGHLIGHTS */}
        <div className="pt-2 border-t border-[var(--shadow-dark)]/20">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-2.5">
            <div className="flex items-center p-0.5 rounded-xl neu-inset-sm self-start sm:self-auto shrink-0 text-xs font-semibold">
              <button
                onClick={() => setHeroTab('script')}
                className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  heroTab === 'script'
                    ? 'bg-[var(--primary)] text-white font-bold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Kịch Bản</span>
                <span className="hidden sm:inline font-normal opacity-90">(Radio Script)</span>
              </button>
              <button
                onClick={() => setHeroTab('highlights')}
                className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  heroTab === 'highlights'
                    ? 'bg-[var(--primary)] text-white font-bold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Điểm Nhấn Nổi Bật</span>
              </button>
            </div>
          </div>

          <div className="pt-1">
            {heroTab === 'script' ? (
              <div className="rounded-2xl neu-inset p-4 max-h-48 overflow-y-auto text-xs text-[var(--text-main)] leading-relaxed space-y-2">
                {loadingDigest ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-3.5 bg-[var(--shadow-dark)]/20 rounded-lg w-full" />
                    <div className="h-3.5 bg-[var(--shadow-dark)]/20 rounded-lg w-5/6" />
                    <div className="h-3.5 bg-[var(--shadow-dark)]/20 rounded-lg w-4/6" />
                  </div>
                ) : activeDigest?.podcast_script ? (
                  <div className="whitespace-pre-line font-sans">
                    {activeDigest.podcast_script}
                  </div>
                ) : (
                  <p className="text-[var(--text-muted)] italic">Chưa có kịch bản cho ngày này. Bấm Tái tạo bài để tạo.</p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl neu-inset p-4 max-h-48 overflow-y-auto text-xs text-[var(--text-main)] leading-relaxed space-y-2">
                {safeHighlights.length > 0 ? (
                  safeHighlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Zap className="w-3.5 h-3.5 text-[var(--primary)] shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[var(--text-muted)] italic">Chưa có điểm nhấn cho ngày này.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRACTICAL VALUE & SOCIAL FEED SECTION */}
      <div className="space-y-6">
        <div className="p-5 sm:p-6 rounded-3xl neu-flat space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-main)]">
                  Bảng Tin & Phân Tích Thực Chiến
                </h3>
                <span className="px-2.5 py-0.5 rounded-full neu-inset-sm text-[var(--primary)] font-mono text-[10px] sm:text-xs font-bold whitespace-nowrap shrink-0">
                  DEEP-DIVE
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Bài post review chuyên sâu phong cách mạng xã hội (Substack/X/Dev.to) bóc tách cơ chế, nỗi đau thực tế và code mẫu.
              </p>
            </div>
          </div>

          <div className="neu-divider" />

          {/* Controls: View Switcher, Search, Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-xl neu-inset-sm self-start sm:self-auto text-xs font-semibold">
              <button
                onClick={() => setFeedViewMode('feed')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  feedViewMode === 'feed'
                    ? 'bg-[var(--primary)] text-white font-bold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                title="Xem bài post đầy đủ như mạng xã hội"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Mạng Xã Hội ({filteredSkills.length})</span>
              </button>

              <button
                onClick={() => setFeedViewMode('matrix')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  feedViewMode === 'matrix'
                    ? 'bg-[var(--primary)] text-white font-bold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                title="Xem thẻ tóm tắt nhanh gọn"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Thẻ Tóm Tắt</span>
              </button>
            </div>

            {/* Filter Search & Category */}
            <div className="flex items-center gap-2.5 flex-1 sm:flex-none justify-end">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Lọc bài viết, tool, tag..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl neu-inset text-[var(--text-main)] placeholder-[var(--text-muted)]/50 focus:outline-none transition-colors"
                />
              </div>

              {categoriesInDigest.length > 1 && (
                <div className="shrink-0">
                  <NeuSelect
                    value={filterCategory}
                    onChange={(val) => setFilterCategory(String(val))}
                    options={[
                      { value: 'all', label: `Tất cả (${rawSkills.length})` },
                      ...categoriesInDigest.map((cat) => ({ value: cat, label: cat }))
                    ]}
                    size="sm"
                    variant="inset"
                    align="right"
                    searchable={false}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FEED / MATRIX CONTENT */}
        {loadingDigest ? (
          <div className="space-y-4 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-3xl neu-flat animate-pulse p-6"
              />
            ))}
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="p-10 text-center rounded-3xl neu-inset">
            <Radio className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-60" />
            <h3 className="text-sm font-bold text-[var(--text-main)]">
              Không tìm thấy bài viết phù hợp trong ngày này
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Thử xóa bộ lọc tìm kiếm hoặc chuyển sang một ngày khác.
            </p>
          </div>
        ) : feedViewMode === 'feed' ? (
          /* SOCIAL MEDIA FEED VIEW: Full viral posts stream with 2-Column Desktop Layout */
          <div className="xl:flex xl:gap-8 items-start">
            {/* Cột chính (bên trái, chiếm 65-70% trên desktop): Bài phân tích chuyên sâu chi tiết */}
            <div className="flex-1 min-w-0 space-y-6">
              {filteredSkills.map((item, idx) => {
                const post = ensureSocialPost(item);
                return (
                  <SocialTechPostCard
                    key={item.skill_id || idx}
                    post={post}
                    skillSummary={item}
                    onSelectSkillById={onSelectSkillById}
                    onToggleBookmark={onToggleBookmark}
                    isBookmarked={bookmarkedSkillIds.has(item.skill_id)}
                  />
                );
              })}
            </div>

            {/* Cột sidebar cố định (bên phải, sticky top-6, w-80 hoặc w-96 trên desktop) */}
            <aside className="hidden xl:block w-80 2xl:w-96 shrink-0 sticky top-6 pb-12">
              {/* MASTER COMPANION CARD: Khối thống nhất, Soft UI chuẩn, không lồng hộp thừa thãi */}
              <div className="rounded-3xl neu-flat p-5 sm:p-6 pb-6 sm:pb-7 space-y-5 transition-all max-h-[calc(100vh-4.5rem)] overflow-y-auto scrollbar-none">
                {/* 1. HEADER & DANH SÁCH BÀI HÔM NAY */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-xs shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider font-mono truncate">
                        Bản Tin Hôm Nay
                      </h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full neu-inset-sm text-[10px] font-mono text-[var(--primary)] font-bold shrink-0">
                      {filteredSkills.length} BÀI
                    </span>
                  </div>

                  {/* Single Post Compact Banner vs Multi-post Switcher */}
                  {filteredSkills.length === 1 ? (
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--primary)]/5 border border-[var(--primary)]/20 transition-all">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-[var(--primary)] text-white text-xs font-mono font-bold flex items-center justify-center shrink-0 shadow-xs">
                          1
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[var(--primary)] truncate">
                            {filteredSkills[0].title}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                            {filteredSkills[0].name}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-mono text-amber-500 font-semibold shrink-0 pl-2">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>{filteredSkills[0].stars.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-1.5 rounded-2xl neu-inset-sm space-y-1 max-h-[160px] overflow-y-auto scrollbar-none bg-black/[0.01] dark:bg-white/[0.01]">
                      {filteredSkills.map((item, idx) => {
                        const isCurrentActive = item.skill_id === activePostSkillId;
                        return (
                          <button
                            key={item.skill_id}
                            type="button"
                            onClick={() => handleJumpToPost(item.skill_id)}
                            className={`w-full text-left p-2 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-2.5 group relative ${
                              isCurrentActive
                                ? 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30 font-semibold shadow-xs'
                                : 'hover:bg-[var(--shadow-dark)]/15 text-[var(--text-muted)] hover:text-[var(--text-main)]'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold shrink-0 transition-all ${
                                isCurrentActive
                                  ? 'bg-[var(--primary)] text-white shadow-xs scale-105'
                                  : 'neu-inset-sm text-[var(--text-muted)] group-hover:text-[var(--text-main)]'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div
                                className={`text-xs truncate ${
                                  isCurrentActive
                                    ? 'font-bold text-[var(--primary)]'
                                    : 'font-medium text-[var(--text-main)]'
                                }`}
                              >
                                {item.title}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)] truncate mt-0.5">
                                <span className="truncate">{item.name}</span>
                                <span>•</span>
                                <span className="text-amber-500 flex items-center gap-0.5 shrink-0 font-medium">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  {item.stars.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            {isCurrentActive && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="neu-divider" />

                {/* 2. MỤC LỤC BÀI VIẾT (Streamlined Stepper TOC) */}
                {activeSummary && activePost && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0">
                          <Compass className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider font-mono">
                          Mục Lục Bài Viết
                        </h4>
                      </div>
                      {filteredSkills.length > 1 && (
                        <span className="text-[10px] font-mono text-[var(--text-muted)] truncate max-w-[120px]">
                          {activeSummary.title}
                        </span>
                      )}
                    </div>

                    {/* Stepper Timeline List - Clean, compact, no heavy inner box */}
                    <div className="relative pl-3 border-l-2 border-[var(--primary)]/20 ml-2 space-y-0.5 text-xs py-0.5">
                      <button
                        type="button"
                        onClick={() => handleJumpToSection(`post-${activePost.skill_id}-hook`)}
                        className="w-full text-left px-2 py-1 rounded-xl text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/8 flex items-center justify-between transition-all cursor-pointer group text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Sparkles className="w-3.5 h-3.5 text-[var(--primary)] shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="truncate font-medium">Điểm nhấn & Hook</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-[var(--primary)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleJumpToSection(`post-${activePost.skill_id}-story`)}
                        className="w-full text-left px-2 py-1 rounded-xl text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/8 flex items-center justify-between transition-all cursor-pointer group text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="truncate font-medium">Nỗi đau & Trải nghiệm</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-rose-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>

                      {activePost.core_mechanism && (
                        <button
                          type="button"
                          onClick={() => handleJumpToSection(`post-${activePost.skill_id}-mechanism`)}
                          className="w-full text-left px-2 py-1 rounded-xl text-[var(--text-muted)] hover:text-blue-500 hover:bg-blue-500/8 flex items-center justify-between transition-all cursor-pointer group text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Cpu className="w-3.5 h-3.5 text-blue-500 shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="truncate font-medium">Kiến trúc & Cơ chế</span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      )}

                      {activePost.key_features && activePost.key_features.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleJumpToSection(`post-${activePost.skill_id}-features`)}
                          className="w-full text-left px-2 py-1 rounded-xl text-[var(--text-muted)] hover:text-amber-500 hover:bg-amber-500/8 flex items-center justify-between transition-all cursor-pointer group text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="truncate font-medium">Tính năng nổi bật</span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-amber-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      )}

                      {activePost.code_example?.code && (
                        <button
                          type="button"
                          onClick={() => handleJumpToSection(`post-${activePost.skill_id}-code`)}
                          className="w-full text-left px-2 py-1 rounded-xl text-[var(--text-muted)] hover:text-emerald-500 hover:bg-emerald-500/8 flex items-center justify-between transition-all cursor-pointer group text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Terminal className="w-3.5 h-3.5 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="truncate font-medium">
                              Code mẫu ({activePost.code_example.filename || activePost.code_example.language})
                            </span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      )}

                      {activePost.pros_and_cons && (
                        <button
                          type="button"
                          onClick={() => handleJumpToSection(`post-${activePost.skill_id}-proscons`)}
                          className="w-full text-left px-2 py-1 rounded-xl text-[var(--text-muted)] hover:text-teal-500 hover:bg-teal-500/8 flex items-center justify-between transition-all cursor-pointer group text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Check className="w-3.5 h-3.5 text-teal-500 shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="truncate font-medium">Ưu & Nhược điểm</span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-teal-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleJumpToSection(`post-${activePost.skill_id}-audience`)}
                        className="w-full text-left px-2 py-1 rounded-xl text-[var(--text-muted)] hover:text-indigo-500 hover:bg-indigo-500/8 flex items-center justify-between transition-all cursor-pointer group text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Target className="w-3.5 h-3.5 text-indigo-500 shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="truncate font-medium">Đối tượng phù hợp</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-indigo-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="neu-divider" />

                {/* 3. THAO TÁC NHANH (Tactile Quick Actions Deck) */}
                {activeSummary && (
                  <div className="space-y-3.5 pt-0.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider font-mono">
                        Thao Tác Nhanh
                      </h4>
                    </div>

                    {/* 4 Action Tiles in 2x2 Grid with generous gap for Neumorphic shadow diffusion */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* 1. Nghe Audio */}
                      <button
                        type="button"
                        onClick={() =>
                          handleReadSkillSegment(
                            activeSummary.podcast_snippet ||
                              `${activeSummary.title}. ${activeSummary.what_it_does}. Nỗi đau giải quyết: ${activeSummary.pain_point_solved}`
                          )
                        }
                        className="p-3 rounded-2xl neu-btn flex items-center gap-2.5 text-left cursor-pointer group transition-all"
                        title="Nghe giọng AI đọc tóm tắt công cụ này"
                      >
                        <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                          <Headphones className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[var(--text-main)] block leading-tight truncate">
                            Nghe Audio
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] block truncate mt-0.5">
                            Đọc tóm tắt
                          </span>
                        </div>
                      </button>

                      {/* 2. Hỏi AI Chat */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenAgentChat) {
                            onOpenAgentChat(
                              `Phân tích kỹ năng ${activeSummary.title} (${activeSummary.name}) và hướng dẫn tôi áp dụng vào dự án thực tế.`
                            );
                          } else {
                            showToast(`Hãy mở tab Agent Chat và hỏi về ${activeSummary.title}`, 'info');
                          }
                        }}
                        className="p-3 rounded-2xl neu-btn flex items-center gap-2.5 text-left cursor-pointer group transition-all"
                        title="Hỏi cố vấn RAG AI về kỹ năng này"
                      >
                        <div className="w-7 h-7 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[var(--text-main)] block leading-tight truncate">
                            Hỏi AI Chat
                          </span>
                          <span className="text-[10px] text-[var(--primary)] font-medium block truncate mt-0.5">
                            RAG Agent
                          </span>
                        </div>
                      </button>

                      {/* 3. Bookmark */}
                      {onToggleBookmark && (
                        <button
                          type="button"
                          onClick={() => onToggleBookmark(activeSummary.skill_id)}
                          className={`p-3 rounded-2xl flex items-center gap-2.5 text-left cursor-pointer transition-all group ${
                            bookmarkedSkillIds.has(activeSummary.skill_id)
                              ? 'neu-inset text-[var(--primary)] font-bold'
                              : 'neu-btn text-[var(--text-main)]'
                          }`}
                          title={
                            bookmarkedSkillIds.has(activeSummary.skill_id)
                              ? 'Bỏ lưu bookmark'
                              : 'Lưu bài viết này'
                          }
                        >
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs ${
                              bookmarkedSkillIds.has(activeSummary.skill_id)
                                ? 'bg-[var(--primary)] text-white'
                                : 'bg-indigo-500/15 text-indigo-500'
                            }`}
                          >
                            <Bookmark
                              className={`w-3.5 h-3.5 ${
                                bookmarkedSkillIds.has(activeSummary.skill_id) ? 'fill-current' : ''
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold block leading-tight truncate">
                              {bookmarkedSkillIds.has(activeSummary.skill_id) ? 'Đã Lưu' : 'Bookmark'}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] block truncate mt-0.5">
                              {bookmarkedSkillIds.has(activeSummary.skill_id) ? 'Đã ghim' : 'Lưu lại'}
                            </span>
                          </div>
                        </button>
                      )}

                      {/* 4. Chia sẻ */}
                      <button
                        type="button"
                        onClick={handleShareActivePost}
                        className="p-3 rounded-2xl neu-btn flex items-center gap-2.5 text-left cursor-pointer group transition-all"
                        title="Sao chép liên kết chia sẻ bài viết"
                      >
                        <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                          <Share2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[var(--text-main)] block leading-tight truncate">
                            Chia Sẻ
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] block truncate mt-0.5">
                            Sao chép link
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* 5. Cấu hình & Tích hợp (Primary CTA) */}
                    {onSelectSkillById && (
                      <button
                        type="button"
                        onClick={() => onSelectSkillById(activeSummary.skill_id)}
                        className="w-full py-3.5 px-4 rounded-2xl neu-primary text-xs font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shadow-md group mt-3.5"
                      >
                        <span>Cấu hình & Tích hợp Skill</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </aside>
          </div>
        ) : (
          /* QUICK MATRIX CARDS VIEW: 2-3 column cards */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
            {filteredSkills.map((item, idx) => {
              const isCardBookmarked = bookmarkedSkillIds.has(item.skill_id);
              return (
                <div
                  key={item.skill_id || idx}
                  className="rounded-3xl neu-flat neu-card-interactive transition-all flex flex-col justify-between p-5 sm:p-6"
                >
                  <div className="space-y-3.5">
                    {/* Card Header: Title & Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] uppercase tracking-wider neu-inset-sm text-[var(--primary)] font-mono font-semibold whitespace-nowrap shrink-0 inline-flex items-center">
                            {item.category}
                          </span>
                          {item.primary_language && (
                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono neu-inset-sm text-[var(--text-muted)] whitespace-nowrap shrink-0 inline-flex items-center">
                              {item.primary_language}
                            </span>
                          )}
                          <span className="text-xs font-mono font-medium text-amber-500 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {item.stars.toLocaleString()}
                          </span>
                        </div>

                        <h3
                          onClick={() => onSelectSkillById && onSelectSkillById(item.skill_id)}
                          className="text-sm sm:text-base font-bold text-[var(--text-main)] hover:text-[var(--primary)] transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{item.title}</span>
                        </h3>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono truncate max-w-sm">
                          {item.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onToggleBookmark && (
                          <button
                            onClick={() => onToggleBookmark(item.skill_id)}
                            title={isCardBookmarked ? "Bỏ bookmark" : "Lưu bookmark"}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${
                              isCardBookmarked
                                ? 'neu-inset text-[var(--primary)]'
                                : 'neu-btn text-[var(--text-muted)] hover:text-[var(--primary)]'
                            }`}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isCardBookmarked ? 'fill-current' : ''}`} />
                          </button>
                        )}
                        {item.repository_url && (
                          <a
                            href={item.repository_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Mở GitHub"
                            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--primary)] neu-btn transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* 1. TÁC DỤNG THỰC TẾ (What it actually does) */}
                    <div className="rounded-2xl neu-inset p-3.5 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          {t('label_what_it_does')}
                        </span>
                        {item.podcast_snippet && (
                          <button
                            onClick={() => handleReadSkillSegment(item.podcast_snippet)}
                            title={t('label_listen_segment')}
                            className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Headphones className="w-3 h-3" />
                            <span>{t('label_listen_segment')}</span>
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-main)] leading-relaxed font-normal">
                        {item.what_it_does}
                      </p>
                    </div>

                    {/* 2. NỖI ĐAU GIẢI QUYẾT (Pain point solved: Before vs After) */}
                    <div className="rounded-2xl neu-inset p-3.5 space-y-1">
                      <span className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5" />
                        {t('label_pain_point')}
                      </span>
                      <p className="text-xs text-[var(--text-main)] leading-relaxed">
                        {item.pain_point_solved}
                      </p>
                    </div>

                    {/* 3. AI NÊN DÙNG (Target Audience) */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-[var(--text-muted)] flex items-center gap-1 shrink-0">
                        <Target className="w-3.5 h-3.5 text-[var(--primary)]" />
                        {t('label_target_audience')}:
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-[var(--text-muted)] font-mono text-[11px] whitespace-nowrap shrink-0 inline-flex items-center">
                        {item.target_audience}
                      </span>
                    </div>

                    {/* 4. DÙNG NHANH (Quick prompt / CLI) */}
                    {item.quick_start_prompt && (
                      <div className="rounded-xl neu-inset p-2.5 flex items-center justify-between gap-2">
                        <code className="text-[11px] font-mono text-[var(--text-main)] truncate select-all">
                          {item.quick_start_prompt}
                        </code>
                        <button
                          onClick={() => handleCopyPrompt(item.quick_start_prompt, item.skill_id)}
                          title="Sao chép lệnh"
                          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors shrink-0 cursor-pointer"
                        >
                          {copiedSkillId === item.skill_id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Read Social Post & Detail Link */}
                  <div className="mt-4 pt-3 border-t border-[var(--shadow-dark)]/20 flex items-center justify-between text-xs gap-2 flex-wrap">
                    <button
                      onClick={() =>
                        setSelectedModalPost({ post: ensureSocialPost(item), summary: item })
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold neu-btn text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span>Đọc bài post MXH</span>
                    </button>

                    <div className="flex items-center gap-3 ml-auto">
                      <span className="text-[var(--text-muted)] font-mono text-[11px]">
                        Trending: <strong className="text-[var(--text-main)] font-bold">{item.trending_score}</strong>
                      </span>
                      {onSelectSkillById && (
                        <button
                          onClick={() => onSelectSkillById(item.skill_id)}
                          className="px-3.5 py-1.5 rounded-xl neu-primary font-semibold text-xs flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <span>Cấu hình</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL FOR DEEP DIVE SOCIAL POST */}
      <SocialTechPostModal
        isOpen={Boolean(selectedModalPost)}
        onClose={() => setSelectedModalPost(null)}
        post={selectedModalPost?.post || null}
        skillSummary={selectedModalPost?.summary || null}
        onSelectSkillById={onSelectSkillById}
        onToggleBookmark={onToggleBookmark}
        isBookmarked={selectedModalPost ? bookmarkedSkillIds.has(selectedModalPost.summary.skill_id) : false}
      />
    </div>
  );
};
