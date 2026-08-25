import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api/client';
import { Skill, CategoryInfo, RuntimeInfo, UserPreference, StatsData } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { StatsHeader } from './components/StatsHeader';
import { TrendingFeed } from './pages/TrendingFeed';
import { PersonalizedFeed } from './pages/PersonalizedFeed';
import { ExploreCategories } from './pages/ExploreCategories';
import { SkillCompare } from './pages/SkillCompare';
import { HistoryPage } from './pages/HistoryPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { PreferencesPage } from './pages/PreferencesPage';
import { LoginPage } from './pages/LoginPage';
import { BundlesPage } from './pages/BundlesPage';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { VideoBlogStudio } from './pages/VideoBlogStudio';
import { SkillDetailModal } from './components/SkillDetailModal';
import { TriggerCollectorModal } from './components/TriggerCollectorModal';
import { ErrorBoundary } from './components/ErrorBoundary';

const AppContent: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const mainScrollRef = useRef<HTMLDivElement>(null);
  
  // Sidebar State
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const handleToggleSidebar = (val: boolean) => {
    setSidebarCollapsed(val);
    localStorage.setItem('sidebar_collapsed', String(val));
  };

  // URL Hash Sync for Tab Navigation
  const [activeTab, setActiveTab] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return ['trending', 'bundles', 'playground', 'studio', 'personalized', 'compare', 'categories', 'history', 'bookmarks', 'preferences'].includes(hash)
      ? hash
      : 'trending';
  });
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['trending', 'bundles', 'playground', 'studio', 'personalized', 'compare', 'categories', 'history', 'bookmarks', 'preferences'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Studio Selection State
  const [studioSkill, setStudioSkill] = useState<Skill | null>(null);
  const handleOpenStudioForSkill = (skill: Skill) => {
    setStudioSkill(skill);
    handleTabChange('studio');
  };

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRuntime, setSelectedRuntime] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('trending_score');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Comparison State
  const [comparedSkillIds, setComparedSkillIds] = useState<number[]>([]);

  // Modals state
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Queries
  const { data: stats } = useQuery<StatsData>({
    queryKey: ['stats', user?.id],
    queryFn: api.getStats,
    refetchInterval: 30000,
  });

  const { data: categories = [] } = useQuery<CategoryInfo[]>({
    queryKey: ['categories'],
    queryFn: api.getCategories,
  });

  const { data: runtimes = [] } = useQuery<RuntimeInfo[]>({
    queryKey: ['runtimes'],
    queryFn: api.getRuntimes,
  });

  const { data: preferences = null } = useQuery<UserPreference>({
    queryKey: ['preferences', user?.id],
    queryFn: api.getPreferences,
  });

  const { data: trendingSkills = [], isLoading: loadingTrending } = useQuery<Skill[]>({
    queryKey: ['trendingSkills', selectedCategory, selectedRuntime, selectedLanguage, sortBy, searchTerm, user?.id],
    queryFn: () =>
      api.getTrendingSkills({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        runtime: selectedRuntime === 'all' ? undefined : selectedRuntime,
        language: selectedLanguage === 'all' ? undefined : selectedLanguage,
        search: searchTerm.trim() ? searchTerm.trim() : undefined,
        sort_by: sortBy,
      }),
  });

  const { data: personalizedSkills = [], isLoading: loadingPersonalized } = useQuery<Skill[]>({
    queryKey: ['personalizedSkills', user?.id],
    queryFn: () => api.getPersonalizedSkills(50),
    enabled: activeTab === 'personalized',
  });

  const { data: bookmarkedSkills = [], isLoading: loadingBookmarks } = useQuery<Skill[]>({
    queryKey: ['bookmarkedSkills', user?.id],
    queryFn: api.getBookmarkedSkills,
    enabled: activeTab === 'bookmarks',
  });

  // Toggle Compare Helper
  const handleToggleCompare = (id: number) => {
    if (comparedSkillIds.includes(id)) {
      setComparedSkillIds(comparedSkillIds.filter((x) => x !== id));
      showToast(t('toast_compared_removed'), 'info');
    } else {
      if (comparedSkillIds.length >= 4) {
        showToast(t('toast_compared_limit'), 'error');
        return;
      }
      setComparedSkillIds([...comparedSkillIds, id]);
      showToast(t('toast_compared_added'), 'success');
    }
  };

  // Toggle Bookmark Mutation
  const bookmarkMutation = useMutation({
    mutationFn: (id: number) => api.toggleBookmark(id),
    onSuccess: (updatedSkill) => {
      queryClient.invalidateQueries({ queryKey: ['trendingSkills'] });
      queryClient.invalidateQueries({ queryKey: ['personalizedSkills'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarkedSkills'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      if (selectedSkill && selectedSkill.id === updatedSkill.id) {
        setSelectedSkill(updatedSkill);
      }
      showToast(
        updatedSkill.is_bookmarked ? t('toast_bookmark_added') : t('toast_bookmark_removed'),
        updatedSkill.is_bookmarked ? 'success' : 'info'
      );
    },
  });

  // Update Preferences Mutation
  const updatePrefMutation = useMutation({
    mutationFn: (newPref: UserPreference) => api.updatePreferences(newPref),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      queryClient.invalidateQueries({ queryKey: ['personalizedSkills'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      showToast(t('toast_pref_saved'), 'success');
    },
  });

  const handleSelectCategoryFromExplore = (categoryKey: string) => {
    setSelectedCategory(categoryKey);
    handleTabChange('trending');
  };

  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        collapsed={sidebarCollapsed}
        setCollapsed={handleToggleSidebar}
        comparedCount={comparedSkillIds.length}
        bookmarkedCount={stats?.bookmarked_count || 0}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area (Header + Scrollable Body) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <Navbar
          onOpenTriggerModal={() => setIsTriggerModalOpen(true)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          comparedCount={comparedSkillIds.length}
          onGoToCompare={() => handleTabChange('compare')}
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* Scrollable Main Area */}
        <main ref={mainScrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="max-w-[1650px] w-full mx-auto space-y-6">
            {/* Top Metric Stats Counters */}
            <StatsHeader stats={stats || null} />

            {/* Active Tab View with Page Transition */}
            <div key={activeTab} className="animate-page-enter will-change-transform space-y-6">
              {activeTab === 'trending' && (
                <TrendingFeed
                  skills={trendingSkills}
                  categories={categories}
                  runtimes={runtimes}
                  loading={loadingTrending}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedRuntime={selectedRuntime}
                  setSelectedRuntime={setSelectedRuntime}
                  selectedLanguage={selectedLanguage}
                  setSelectedLanguage={setSelectedLanguage}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  comparedSkillIds={comparedSkillIds}
                  onToggleCompare={handleToggleCompare}
                  onToggleBookmark={(id) => bookmarkMutation.mutate(id)}
                  onSelectSkill={(skill) => setSelectedSkill(skill)}
                  onGoToCompare={() => handleTabChange('compare')}
                />
              )}

              {activeTab === 'bundles' && (
                <BundlesPage
                  onSelectSkillById={async (id) => {
                    try {
                      const fullSkill = await api.getSkillDetail(id);
                      setSelectedSkill(fullSkill);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                />
              )}

              {activeTab === 'playground' && (
                <PlaygroundPage />
              )}

              {activeTab === 'studio' && (
                <VideoBlogStudio
                  skills={trendingSkills}
                  initialSkill={studioSkill}
                />
              )}

              {activeTab === 'personalized' && (
                <PersonalizedFeed
                  skills={personalizedSkills}
                  preference={preferences}
                  loading={loadingPersonalized}
                  onToggleBookmark={(id) => bookmarkMutation.mutate(id)}
                  onSelectSkill={(skill) => setSelectedSkill(skill)}
                  onGoToPreferences={() => handleTabChange('preferences')}
                />
              )}

              {activeTab === 'compare' && (
                <SkillCompare
                  allSkills={trendingSkills}
                  comparedSkillIds={comparedSkillIds}
                  onRemoveSkillFromCompare={(id) => setComparedSkillIds(comparedSkillIds.filter((x) => x !== id))}
                  onAddSkillToCompare={(id) => setComparedSkillIds([...comparedSkillIds, id])}
                  onSelectSkill={(skill) => setSelectedSkill(skill)}
                />
              )}

              {activeTab === 'categories' && (
                <ExploreCategories
                  categories={categories}
                  onSelectCategory={handleSelectCategoryFromExplore}
                />
              )}

              {activeTab === 'history' && <HistoryPage />}

              {activeTab === 'bookmarks' && (
                <BookmarksPage
                  skills={bookmarkedSkills}
                  loading={loadingBookmarks}
                  onToggleBookmark={(id) => bookmarkMutation.mutate(id)}
                  onSelectSkill={(skill) => setSelectedSkill(skill)}
                  onBackToFeed={() => handleTabChange('trending')}
                />
              )}

              {activeTab === 'preferences' && (
                <PreferencesPage
                  preference={preferences}
                  categories={categories}
                  runtimes={runtimes}
                  onSavePreference={async (pref) => {
                    await updatePrefMutation.mutateAsync(pref);
                  }}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Detail Modal */}
      <SkillDetailModal
        skill={selectedSkill}
        onClose={() => setSelectedSkill(null)}
        onToggleBookmark={(id) => bookmarkMutation.mutate(id)}
        onOpenStudio={handleOpenStudioForSkill}
      />

      {/* Trigger Data Collection Modal */}
      <TriggerCollectorModal
        isOpen={isTriggerModalOpen}
        onClose={() => setIsTriggerModalOpen(false)}
        onRefreshData={() => {
          queryClient.invalidateQueries({ queryKey: ['trendingSkills'] });
          queryClient.invalidateQueries({ queryKey: ['personalizedSkills'] });
          queryClient.invalidateQueries({ queryKey: ['stats'] });
          queryClient.invalidateQueries({ queryKey: ['collectionRuns'] });
          queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
          showToast(t('toast_scan_triggered'), 'success');
        }}
      />

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-modal-backdrop"
          onClick={() => setIsLoginModalOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md animate-modal-pop">
            <LoginPage onSuccess={() => {
              setIsLoginModalOpen(false);
              showToast(t('toast_login_success'), 'success');
            }} />
          </div>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default App;
