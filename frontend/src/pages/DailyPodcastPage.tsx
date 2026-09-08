import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Radio,
  Play,
  Pause,
  Volume2,
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
  Search,
  LayoutGrid,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../api/client';
import { DailyDigest, DailyDigestDateInfo, SkillDigestSummary, SocialMediaPost, VoiceOption } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { SocialTechPostCard } from '../components/SocialTechPostCard';
import { SocialTechPostModal } from '../components/SocialTechPostModal';
import { NeuSelect } from '../components/NeuSelect';
import { copyToClipboard } from '../utils/clipboard';

// Curated AI Voices Fallback
const DEFAULT_PODCAST_VOICES: VoiceOption[] = [
  // Vietnamese
  { id: 'vi-VN-NamMinhNeural', name: 'Minh Hiếu (Nam - Trầm Ấm)', provider: 'edge_tts', language: 'vi-VN', gender: 'male', style: 'Tech Radar, Thời Sự', preview_text: '', badge: 'STUDIO' },
  { id: 'vi-VN-HoaiMyNeural', name: 'Diểm Phúc (Nữ - Truyền Cảm)', provider: 'edge_tts', language: 'vi-VN', gender: 'female', style: 'Viral Reviewer, TikTok Hot', preview_text: '', badge: 'HOT' },
  { id: 'vi-VN-Wavenet-A', name: 'Google WaveNet (Nữ - Chuẩn Studio)', provider: 'google_tts', language: 'vi-VN', gender: 'female', style: 'Google Cloud WaveNet', preview_text: '', badge: 'GOOGLE AI' },
  { id: 'vi-VN-Wavenet-B', name: 'Google WaveNet (Nam - Phát Thanh)', provider: 'google_tts', language: 'vi-VN', gender: 'male', style: 'Google Studio Broadcast', preview_text: '', badge: 'GOOGLE AI' },
  // Gemini 2.0 Live Native Audio
  { id: 'gemini-Aoede', name: 'Gemini 2.0 Live - Aoede (Nữ - Biểu Cảm)', provider: 'gemini_audio', language: 'multi', gender: 'female', style: 'Gemini 2.0 Multimodal Native Audio', preview_text: '', badge: 'GEMINI 2.0' },
  { id: 'gemini-Puck', name: 'Gemini 2.0 Live - Puck (Nam - Năng Động)', provider: 'gemini_audio', language: 'multi', gender: 'male', style: 'Gemini 2.0 Multimodal Native Audio', preview_text: '', badge: 'GEMINI 2.0' },
  { id: 'gemini-Charon', name: 'Gemini 2.0 Live - Charon (Nam - Trầm Lắng)', provider: 'gemini_audio', language: 'multi', gender: 'male', style: 'Gemini 2.0 Multimodal Native Audio', preview_text: '', badge: 'GEMINI 2.0' },
  { id: 'gemini-Kore', name: 'Gemini 2.0 Live - Kore (Nữ - Trong Trẻo)', provider: 'gemini_audio', language: 'multi', gender: 'female', style: 'Gemini 2.0 Multimodal Native Audio', preview_text: '', badge: 'GEMINI 2.0' },
  { id: 'gemini-Fenrir', name: 'Gemini 2.0 Live - Fenrir (Nam - Bản Lĩnh)', provider: 'gemini_audio', language: 'multi', gender: 'male', style: 'Gemini 2.0 Multimodal Native Audio', preview_text: '', badge: 'GEMINI 2.0' },
  // English & Global Studio
  { id: 'en-US-Journey-F', name: 'Google Journey (Female - Expressive)', provider: 'google_tts', language: 'en-US', gender: 'female', style: 'DeepMind Next-Gen Journey', preview_text: '', badge: 'GOOGLE AI' },
  { id: 'en-US-ChristopherNeural', name: 'Christopher (Male - Keynote)', provider: 'edge_tts', language: 'en-US', gender: 'male', style: 'Apple Keynote, Silicon Valley', preview_text: '', badge: 'STUDIO' },
  { id: 'en-US-JennyNeural', name: 'Jenny (Female - Dynamic Tech Host)', provider: 'edge_tts', language: 'en-US', gender: 'female', style: 'Silicon Valley Tech Host', preview_text: '', badge: 'HOT' },
  { id: 'en-US-GuyNeural', name: 'Alex (Male - Casual Silicon Valley)', provider: 'edge_tts', language: 'en-US', gender: 'male', style: 'Casual Founder & Hacker', preview_text: '', badge: 'CASUAL' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia (Female - British Accent)', provider: 'edge_tts', language: 'en-GB', gender: 'female', style: 'BBC Tech Reporter', preview_text: '', badge: 'UK ACCENT' },
];

interface DailyPodcastPageProps {
  onSelectSkillById?: (id: number) => void;
  onToggleBookmark?: (id: number) => void;
}

export const DailyPodcastPage: React.FC<DailyPodcastPageProps> = ({
  onSelectSkillById,
  onToggleBookmark,
}) => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Audio Player State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [selectedVoice, setSelectedVoice] = useState<string>('vi-VN-NamMinhNeural');
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);

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

  const voiceSelectOptions = React.useMemo(() => [
    ...vietnameseVoices.map((v) => ({
      value: v.id,
      label: v.name,
      badge: v.badge,
      group: 'Giọng Đọc Tiếng Việt',
    })),
    ...geminiVoices.map((v) => ({
      value: v.id,
      label: v.name,
      badge: v.badge,
      group: 'Gemini 2.0 Live Native Audio',
    })),
    ...internationalVoices.map((v) => ({
      value: v.id,
      label: v.name,
      badge: v.badge,
      group: 'English & Global Studio',
    })),
  ], [vietnameseVoices, geminiVoices, internationalVoices]);

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

  // Track bookmarked skills reactively
  const { data: bookmarkedSkills = [] } = useQuery<any[]>({
    queryKey: ['bookmarkedSkills'],
    queryFn: api.getBookmarkedSkills,
  });
  const bookmarkedSkillIds = new Set(bookmarkedSkills.map((s: any) => s.id));

  // Reset audio when date or voice changes
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

    if (!selectedDate) {
      showToast('Vui lòng chọn ngày bản tin', 'error');
      return;
    }

    // Direct audio streaming URL
    const streamUrl = api.getPodcastAudioStreamUrl(selectedDate, selectedVoice);

    if (audioRef.current) {
      // Check if current source matches selected date and voice
      const hasMatchingSrc =
        audioRef.current.src &&
        (audioRef.current.src.includes(encodeURIComponent(selectedDate)) || audioRef.current.src.startsWith('data:audio')) &&
        audioRef.current.currentTime > 0 &&
        !audioRef.current.ended;

      if (hasMatchingSrc) {
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
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setIsAudioLoading(false);
      } catch (err: any) {
        console.error('Playback error or waiting for stream:', err);
        // Browser might wait for stream buffering, keep isAudioLoading true
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1.0, 1.25, 1.5, 2.0];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  // 4. Regenerate Digest Mutation
  const regenerateMutation = useMutation({
    mutationFn: () => api.regenerateDailyDigest(selectedDate, language),
    onSuccess: (updatedDigest) => {
      queryClient.setQueryData(['dailyDigest', selectedDate], updatedDigest);
      queryClient.invalidateQueries({ queryKey: ['dailyDigestDates'] });
      // Reset audio so it re-synthesizes on play
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setIsPlaying(false);
      setCurrentTime(0);
      showToast('Đã dùng AI phân tích và tạo lại bản tin podcast!', 'success');
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
  const rawSkills: SkillDigestSummary[] = digest?.skill_summaries || [];
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

  // Safely extract highlights list regardless of backend runtime data shape (array, string, JSON string)
  const rawHighlights: any = digest?.highlights;
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
            <div className="flex items-center gap-1">
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
            className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none scroll-smooth"
          >
            {loadingDates ? (
              <div className="h-8 w-48 neu-inset rounded-xl animate-pulse" />
            ) : (
              availableDates.map((item) => {
                const isSelected = item.date === selectedDate;
                const dateParts = item.date.split('-');
                const label = `${dateParts[2]}/${dateParts[1]}`;
                return (
                  <button
                    key={item.date}
                    onClick={() => setSelectedDate(item.date)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                      isSelected
                        ? 'neu-inset text-[var(--primary)]'
                        : 'neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <span>{label}</span>
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
              digest?.title || `Bản Tin AI Radar Ngày ${selectedDate}`
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex-1 min-w-0">
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
                searchable={true}
                searchPlaceholder="Tìm kiếm giọng đọc..."
                title="Chọn mô hình giọng đọc AI"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 justify-end">
              {/* Force Audio Re-synthesize Button */}
              <button
                onClick={() => {
                  setIsAudioLoading(true);
                  audioMutation.mutate(true);
                }}
                disabled={isAudioLoading || loadingDigest}
                title="Ép AI tạo lại âm thanh bằng giọng đọc này"
                className="px-3 py-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--primary)] neu-btn disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Zap className={`w-3.5 h-3.5 ${isAudioLoading ? 'animate-spin text-[var(--primary)]' : ''}`} />
                <span className="text-[11px] whitespace-nowrap">Tạo lại Audio</span>
              </button>

              {/* AI Regenerate Digest Button */}
              <button
                onClick={() => regenerateMutation.mutate()}
                disabled={regenerateMutation.isPending || loadingDigest}
                title={t('podcast_regenerate')}
                className="px-3 py-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--primary)] neu-btn disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <RotateCcw
                  className={`w-3.5 h-3.5 ${regenerateMutation.isPending ? 'animate-spin text-[var(--primary)]' : ''}`}
                />
                <span className="text-[11px] whitespace-nowrap">Tái tạo bài</span>
              </button>
            </div>
          </div>

          {/* Bottom of Deck: Big Play Button + Waveform + Progress Slider + Times */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={togglePlayPodcast}
              disabled={isAudioLoading || loadingDigest}
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
                value={currentTime}
                onChange={handleSeek}
                style={{ '--range-progress': `${duration > 0 ? (currentTime / duration) * 100 : 0}%` } as React.CSSProperties}
                className="w-full h-2 neu-inset rounded-lg appearance-none cursor-pointer accent-[var(--primary)] my-0"
              />

              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <span>{formatSeconds(currentTime)}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={cyclePlaybackRate}
                    className="px-2 py-0.5 rounded-lg neu-btn-sm text-[var(--text-muted)] font-mono font-bold text-[10px] hover:text-[var(--primary)] cursor-pointer"
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
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setHeroTab('script')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  heroTab === 'script'
                    ? 'neu-inset text-[var(--primary)] font-bold'
                    : 'neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Kịch Bản</span>
                <span className="hidden sm:inline font-normal">(Radio Script)</span>
              </button>
              <button
                onClick={() => setHeroTab('highlights')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  heroTab === 'highlights'
                    ? 'neu-inset text-[var(--primary)] font-bold'
                    : 'neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Điểm Nhấn Nổi Bật</span>
              </button>
            </div>

            <span className="text-[10px] sm:text-[11px] text-[var(--text-muted)] font-mono ml-auto">
              Model: {digest?.source_model || 'Gemini 2.5 Flash'}
            </span>
          </div>

          <div className="rounded-2xl neu-inset p-4 max-h-48 overflow-y-auto text-xs text-[var(--text-main)] leading-relaxed space-y-2">
            {loadingDigest ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-3.5 bg-[var(--shadow-dark)]/20 rounded-lg w-full" />
                <div className="h-3.5 bg-[var(--shadow-dark)]/20 rounded-lg w-5/6" />
                <div className="h-3.5 bg-[var(--shadow-dark)]/20 rounded-lg w-4/6" />
              </div>
            ) : heroTab === 'script' ? (
              digest?.podcast_script ? (
                <div className="whitespace-pre-line font-sans">
                  {digest.podcast_script}
                </div>
              ) : (
                <p className="text-[var(--text-muted)] italic">Chưa có kịch bản cho ngày này. Bấm Tái tạo bài để tạo.</p>
              )
            ) : (
              <div className="space-y-2">
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
            <div className="flex items-center gap-1.5 p-1 rounded-2xl neu-inset self-start sm:self-auto">
              <button
                onClick={() => setFeedViewMode('feed')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  feedViewMode === 'feed'
                    ? 'neu-flat-sm text-[var(--primary)] font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                title="Xem bài post đầy đủ như mạng xã hội"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Mạng Xã Hội ({filteredSkills.length})</span>
              </button>

              <button
                onClick={() => setFeedViewMode('matrix')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  feedViewMode === 'matrix'
                    ? 'neu-flat-sm text-[var(--primary)] font-bold'
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
          /* SOCIAL MEDIA FEED VIEW: Full viral posts stream */
          <div className="space-y-6 max-w-4xl mx-auto">
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
        ) : (
          /* QUICK MATRIX CARDS VIEW: 2-column cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {filteredSkills.map((item, idx) => {
              const isCardBookmarked = bookmarkedSkillIds.has(item.skill_id);
              return (
                <div
                  key={item.skill_id || idx}
                  className="rounded-3xl neu-flat transition-all flex flex-col justify-between p-5 sm:p-6"
                >
                  <div className="space-y-3.5">
                    {/* Card Header: Title & Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] uppercase tracking-wider neu-inset-sm text-[var(--primary)] font-mono font-semibold">
                            {item.category}
                          </span>
                          {item.primary_language && (
                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono neu-inset-sm text-[var(--text-muted)]">
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
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-[var(--text-muted)] flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-[var(--primary)]" />
                        {t('label_target_audience')}:
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg neu-inset-sm text-[var(--text-muted)] font-mono text-[11px]">
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
