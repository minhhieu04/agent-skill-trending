import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api/client';
import { Skill, CategoryInfo, RuntimeInfo, UserPreference, StatsData } from './types';
import { Navbar } from './components/Navbar';
import { StatsHeader } from './components/StatsHeader';
import { TrendingFeed } from './pages/TrendingFeed';
import { PersonalizedFeed } from './pages/PersonalizedFeed';
import { ExploreCategories } from './pages/ExploreCategories';
import { BookmarksPage } from './pages/BookmarksPage';
import { PreferencesPage } from './pages/PreferencesPage';
import { SkillDetailModal } from './components/SkillDetailModal';
import { TriggerCollectorModal } from './components/TriggerCollectorModal';

export const App: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('trending');
  
  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRuntime, setSelectedRuntime] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('trending_score');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals state
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState<boolean>(false);

  // Queries
  const { data: stats } = useQuery<StatsData>({
    queryKey: ['stats'],
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
    queryKey: ['preferences'],
    queryFn: api.getPreferences,
  });

  const { data: trendingSkills = [], isLoading: loadingTrending } = useQuery<Skill[]>({
    queryKey: ['trendingSkills', selectedCategory, selectedRuntime, selectedLanguage, sortBy, searchTerm],
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
    queryKey: ['personalizedSkills'],
    queryFn: () => api.getPersonalizedSkills(50),
    enabled: activeTab === 'personalized',
  });

  const { data: bookmarkedSkills = [], isLoading: loadingBookmarks } = useQuery<Skill[]>({
    queryKey: ['bookmarkedSkills'],
    queryFn: api.getBookmarkedSkills,
    enabled: activeTab === 'bookmarks',
  });

  // Toggle Bookmark Mutation
  const bookmarkMutation = useMutation({
    mutationFn: (id: number) => api.toggleBookmark(id),
    onSuccess: (updatedSkill) => {
      queryClient.invalidateQueries({ queryKey: ['trendingSkills'] });
      queryClient.invalidateQueries({ queryKey: ['personalizedSkills'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarkedSkills'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      if (selectedSkill && selectedSkill.id === updatedSkill.id) {
        setSelectedSkill(updatedSkill);
      }
    },
  });

  // Update Preferences Mutation
  const updatePrefMutation = useMutation({
    mutationFn: (newPref: UserPreference) => api.updatePreferences(newPref),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      queryClient.invalidateQueries({ queryKey: ['personalizedSkills'] });
    },
  });

  const handleSelectCategoryFromExplore = (categoryKey: string) => {
    setSelectedCategory(categoryKey);
    setActiveTab('trending');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 selection:bg-emerald-500 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTriggerModal={() => setIsTriggerModalOpen(true)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StatsHeader stats={stats || null} />

        {/* Tab Content */}
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
            onToggleBookmark={(id) => bookmarkMutation.mutate(id)}
            onSelectSkill={(skill) => setSelectedSkill(skill)}
          />
        )}

        {activeTab === 'personalized' && (
          <PersonalizedFeed
            skills={personalizedSkills}
            preference={preferences}
            loading={loadingPersonalized}
            onToggleBookmark={(id) => bookmarkMutation.mutate(id)}
            onSelectSkill={(skill) => setSelectedSkill(skill)}
            onGoToPreferences={() => setActiveTab('preferences')}
          />
        )}

        {activeTab === 'categories' && (
          <ExploreCategories
            categories={categories}
            onSelectCategory={handleSelectCategoryFromExplore}
          />
        )}

        {activeTab === 'bookmarks' && (
          <BookmarksPage
            skills={bookmarkedSkills}
            loading={loadingBookmarks}
            onToggleBookmark={(id) => bookmarkMutation.mutate(id)}
            onSelectSkill={(skill) => setSelectedSkill(skill)}
            onBackToFeed={() => setActiveTab('trending')}
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
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p>
            Agent Skill Trending — Nền tảng tổng hợp & đề xuất AI Agent Skills & MCP Servers cho Developer.
          </p>
        </div>
      </footer>

      {/* Detail Modal */}
      <SkillDetailModal
        skill={selectedSkill}
        onClose={() => setSelectedSkill(null)}
        onToggleBookmark={(id) => bookmarkMutation.mutate(id)}
      />

      {/* Trigger Data Collection Modal */}
      <TriggerCollectorModal
        isOpen={isTriggerModalOpen}
        onClose={() => setIsTriggerModalOpen(false)}
        onRefreshData={() => {
          queryClient.invalidateQueries({ queryKey: ['trendingSkills'] });
          queryClient.invalidateQueries({ queryKey: ['personalizedSkills'] });
          queryClient.invalidateQueries({ queryKey: ['stats'] });
        }}
      />
    </div>
  );
};

export default App;
