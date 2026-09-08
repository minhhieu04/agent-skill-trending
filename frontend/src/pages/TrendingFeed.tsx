import React, { useState, useRef, useEffect } from 'react';
import { Skill, CategoryInfo, RuntimeInfo, AIRecommendationResponse } from '../types';
import { SkillCard } from '../components/SkillCard';
import { GridSkeleton } from '../components/Skeleton';
import { LearningTrackFinder } from '../components/LearningTrackFinder';
import { AIAdvisorModal } from '../components/AIAdvisorModal';
import { api } from '../api/client';
import { 
  Flame, 
  Filter, 
  ArrowUpDown, 
  Code, 
  Terminal,
  Scale,
  Bot,
  Sparkles,
  TrendingUp,
  Star,
  Clock,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { NeuSelect } from '../components/NeuSelect';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

interface TrendingFeedProps {
  skills: Skill[];
  categories: CategoryInfo[];
  runtimes: RuntimeInfo[];
  loading: boolean;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedRuntime: string;
  setSelectedRuntime: (rt: string) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  comparedSkillIds: number[];
  onToggleCompare: (id: number) => void;
  onToggleBookmark: (id: number) => void;
  onSelectSkill: (skill: Skill) => void;
  onGoToCompare: () => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  onOpenAgentChat?: (initialQuery?: string) => void;
}

export const TrendingFeed: React.FC<TrendingFeedProps> = ({
  skills,
  categories,
  runtimes,
  loading,
  selectedCategory,
  setSelectedCategory,
  selectedRuntime,
  setSelectedRuntime,
  selectedLanguage,
  setSelectedLanguage,
  sortBy,
  setSortBy,
  comparedSkillIds,
  onToggleCompare,
  onToggleBookmark,
  onSelectSkill,
  onGoToCompare,
  searchTerm = '',
  setSearchTerm,
  onOpenAgentChat,
}) => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const languages = ["all", "Python", "TypeScript", "JavaScript", "Go", "Rust", "Markdown"];

  // AI Advisor Modal State
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendationResponse | null>(null);

  const handleOpenAIAdvisor = async (goalQuery: string) => {
    setAiModalOpen(true);
    setAiLoading(true);
    try {
      const res = await api.getAIRecommendedTrack(goalQuery, language, 8);
      setAiRecommendation(res);
    } catch (err: any) {
      showToast(err.message || 'Không thể kết nối AI Advisor', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelectLearningTrack = (trackQuery: string, lang?: string, cat?: string) => {
    if (setSearchTerm) {
      setSearchTerm(trackQuery);
    }
    if (lang && lang !== 'all') {
      setSelectedLanguage(lang);
    } else if (lang === 'all') {
      setSelectedLanguage('all');
    }
    if (cat && cat !== 'all') {
      setSelectedCategory(cat);
    } else if (cat === 'all') {
      setSelectedCategory('all');
    }
  };

  const handleClearLearningTrack = () => {
    if (setSearchTerm) {
      setSearchTerm('');
    }
    setSelectedLanguage('all');
    setSelectedCategory('all');
    setSelectedRuntime('all');
  };

  // Horizontal scroll controller for categories
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateCategoryScrollState = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateCategoryScrollState();
    window.addEventListener('resize', updateCategoryScrollState);
    return () => window.removeEventListener('resize', updateCategoryScrollState);
  }, [categories]);

  const handleScrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -260 : 260,
        behavior: 'smooth',
      });
      setTimeout(updateCategoryScrollState, 250);
    }
  };

  const sortOptions = [
    { value: 'trending_score', label: t('sort_trending'), icon: <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> },
    { value: 'quality_score', label: t('sort_quality'), icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" /> },
    { value: 'stars', label: t('sort_stars'), icon: <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> },
    { value: 'recent', label: t('sort_recent'), icon: <Clock className="w-3.5 h-3.5 text-cyan-500" /> },
  ];

  const totalRuntimeSkills = runtimes.reduce((acc, r) => acc + r.count, 0);
  const runtimeOptions = [
    { 
      value: 'all', 
      label: language === 'vi' ? 'Tất cả môi trường' : 'All Runtimes', 
      badge: totalRuntimeSkills > 0 ? totalRuntimeSkills : undefined,
      icon: <Terminal className="w-3.5 h-3.5 text-[var(--primary)]" />
    },
    ...runtimes.map(rt => ({
      value: rt.name,
      label: rt.name,
      badge: rt.count,
      icon: <Terminal className="w-3.5 h-3.5" />
    }))
  ];

  const languageOptions = [
    { 
      value: 'all', 
      label: language === 'vi' ? 'Tất cả ngôn ngữ' : 'All Languages',
      icon: <Code className="w-3.5 h-3.5 text-[var(--primary)]" />
    },
    ...languages.filter(l => l !== 'all').map(lang => ({
      value: lang,
      label: lang,
      icon: <Code className="w-3.5 h-3.5" />
    }))
  ];

  return (
    <div className="space-y-5">
      {/* Learning Goals & Skills Track Finder Widget */}
      <LearningTrackFinder
        onSelectTrack={handleSelectLearningTrack}
        onOpenAIAdvisor={handleOpenAIAdvisor}
        activeQuery={searchTerm || (selectedLanguage !== 'all' ? selectedLanguage : (selectedCategory !== 'all' ? selectedCategory : undefined))}
        onClearTrack={handleClearLearningTrack}
      />

      {/* RAG Agent Chat Banner - Neumorphic Soft UI */}
      {onOpenAgentChat && (
        <div className="p-5 rounded-3xl neu-flat flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center font-bold shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[var(--text-main)] flex items-center gap-2">
                <span>{t('agent_chat_trending_banner_title')}</span>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono neu-inset-sm text-[var(--primary)] font-bold">
                  RAG SCAN
                </span>
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-1 max-w-2xl leading-relaxed">
                {t('agent_chat_trending_banner_desc')}
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenAgentChat(searchTerm)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl neu-primary text-xs font-bold text-white shrink-0 whitespace-nowrap active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('agent_chat_trending_banner_btn')}</span>
          </button>
        </div>
      )}

      {/* Header & Filter Controls Bar */}
      <div className="p-5 sm:p-6 rounded-3xl neu-flat space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-main)]">
                {t('feed_title')}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {t('feed_sub')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
            {onOpenAgentChat && (
              <button
                onClick={() => onOpenAgentChat(searchTerm)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl neu-btn text-[var(--text-muted)] hover:text-[var(--primary)] text-xs font-semibold"
                title={t('tab_agent_chat')}
              >
                <Bot className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span className="hidden sm:inline">{t('agent_chat_ask_filter')}</span>
                <span className="px-1.5 py-0.2 rounded-lg text-[10px] font-mono neu-inset-sm text-[var(--primary)] font-bold">RAG</span>
              </button>
            )}

            {comparedSkillIds.length > 0 && (
              <button
                onClick={onGoToCompare}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl neu-btn text-[var(--primary)] text-xs font-bold"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>So sánh ({comparedSkillIds.length})</span>
              </button>
            )}

            {/* Custom Sort Select Dropdown */}
            <NeuSelect
              value={sortBy}
              onChange={(val) => setSortBy(String(val))}
              options={sortOptions}
              icon={<ArrowUpDown className="w-3.5 h-3.5" />}
              size="sm"
              variant="inset"
              align="right"
              title={t('sort_by') || 'Sắp xếp'}
            />
          </div>
        </div>

        <div className="neu-divider" />

        {/* Category Segmented Navigation with Horizontal Scroll Buttons */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              <Filter className="w-3 h-3 text-[var(--primary)]" />
              <span>{t('category_label')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {categories.reduce((acc, c) => acc + c.count, 0)} {language === 'vi' ? 'kỹ năng sẵn sàng' : 'skills indexed'}
              </span>
              {/* Mini Scroll Buttons */}
              <div className="hidden sm:flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleScrollCategories('left')}
                  disabled={!canScrollLeft}
                  className="w-5 h-5 rounded-lg neu-btn-sm flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Cuộn sang trái"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScrollCategories('right')}
                  disabled={!canScrollRight}
                  className="w-5 h-5 rounded-lg neu-btn-sm flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Cuộn sang phải"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="relative">
            <div
              ref={categoryScrollRef}
              onScroll={updateCategoryScrollState}
              className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none scroll-smooth"
            >
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'neu-primary text-white shadow-sm'
                    : 'neu-flat-xs text-[var(--text-muted)] hover:text-[var(--text-main)] hover:neu-flat-sm'
                }`}
              >
                <span>{t('category_all')}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  selectedCategory === 'all' ? 'bg-white/25 text-white font-bold' : 'neu-inset-sm text-[var(--text-muted)]'
                }`}>
                  {categories.reduce((acc, c) => acc + c.count, 0)}
                </span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    selectedCategory === cat.key
                      ? 'neu-primary text-white shadow-sm'
                      : 'neu-flat-xs text-[var(--text-muted)] hover:text-[var(--text-main)] hover:neu-flat-sm'
                  }`}
                >
                  <span>{cat.title}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                    selectedCategory === cat.key ? 'bg-white/25 text-white font-bold' : 'neu-inset-sm text-[var(--text-muted)]'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Unified Filter Controls Strip (Runtime & Language) */}
        <div className="p-2.5 rounded-2xl neu-inset-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Runtime Select Dropdown */}
            <NeuSelect
              value={selectedRuntime}
              onChange={(val) => setSelectedRuntime(String(val))}
              options={runtimeOptions}
              icon={<Terminal className="w-3.5 h-3.5" />}
              size="sm"
              variant="flat"
              title={t('runtime_label')}
            />

            {/* Language Select Dropdown */}
            <NeuSelect
              value={selectedLanguage}
              onChange={(val) => setSelectedLanguage(String(val))}
              options={languageOptions}
              icon={<Code className="w-3.5 h-3.5" />}
              size="sm"
              variant="flat"
              title={t('language_label')}
            />

            {/* Popular quick-select runtime chips - 2xl screens only to avoid collision */}
            <div className="hidden 2xl:flex items-center gap-1.5 pl-2 border-l border-[var(--shadow-dark)]/20">
              <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] tracking-wider">
                Hot:
              </span>
              {runtimes.slice(0, 3).map((rt) => {
                const shortName = rt.name.replace('& AI Agent', '').replace('Google ', '').replace('OpenAI ', '');
                return (
                  <button
                    key={rt.name}
                    type="button"
                    onClick={() => setSelectedRuntime(selectedRuntime === rt.name ? 'all' : rt.name)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                      selectedRuntime === rt.name
                        ? 'neu-primary text-white font-bold'
                        : 'neu-flat-xs text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {shortName}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
            {/* Reset Filter Button if active */}
            {(selectedCategory !== 'all' || selectedRuntime !== 'all' || selectedLanguage !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedRuntime('all');
                  setSelectedLanguage('all');
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-xl text-rose-500 hover:text-rose-600 neu-btn-sm transition-all cursor-pointer"
                title="Đặt lại toàn bộ bộ lọc"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'vi' ? 'Đặt lại' : 'Reset'}</span>
              </button>
            )}

            <div className="text-xs font-mono text-[var(--text-muted)] whitespace-nowrap">
              {language === 'vi' ? 'Hiển thị: ' : 'Showing: '}
              <strong className="text-[var(--primary)] font-bold">{skills.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid View or Skeleton Loading */}
      {loading ? (
        <GridSkeleton count={8} />
      ) : skills.length === 0 ? (
        <div className="p-12 text-center rounded-3xl neu-flat space-y-4">
          <Filter className="w-10 h-10 text-[var(--primary)] mx-auto" />
          <h3 className="text-sm font-bold text-[var(--text-main)]">{t('no_skills_found')}</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            {t('agent_chat_empty_hint')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedRuntime('all');
                setSelectedLanguage('all');
              }}
              className="px-4 py-2 rounded-2xl text-xs font-bold neu-btn text-[var(--text-main)]"
            >
              {t('category_all')}
            </button>
            {onOpenAgentChat && (
              <button
                onClick={() => onOpenAgentChat(searchTerm)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold neu-primary text-white transition-all active:scale-95"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>{t('agent_chat_btn_ask_ai')}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 animate-fade-in">
          {skills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onToggleBookmark={onToggleBookmark}
              onSelectSkill={onSelectSkill}
              onToggleCompare={onToggleCompare}
              isCompared={comparedSkillIds.includes(skill.id)}
            />
          ))}
        </div>
      )}

      {/* AI Goal & Learning Track Advisor Modal */}
      <AIAdvisorModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        recommendation={aiRecommendation}
        loading={aiLoading}
        onSelectSkill={onSelectSkill}
        onApplyFilter={(queryText) => {
          if (setSearchTerm) {
            setSearchTerm(queryText);
          }
        }}
        onToggleBookmark={onToggleBookmark}
      />
    </div>
  );
};
