import React, { useState } from 'react';
import { 
  Bot,
  Flame, 
  Sparkles, 
  Bookmark, 
  Sliders, 
  Layers, 
  Scale, 
  History, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  LogIn, 
  Package, 
  Play, 
  Video, 
  Radio, 
  X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  comparedCount?: number;
  bookmarkedCount?: number;
  onOpenLogin: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  comparedCount = 0,
  bookmarkedCount = 0,
  onOpenLogin,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [hoveredItem, setHoveredItem] = useState<{ label: string; badge?: string | number | null; top: number } | null>(null);

  const navItems = [
    { id: 'trending', label: t('tab_trending'), icon: Flame, badge: null },
    { id: 'podcast', label: t('tab_daily_podcast'), icon: Radio, badge: 'DAILY' },
    { id: 'agent_chat', label: t('tab_agent_chat'), icon: Bot, badge: 'RAG' },
    { id: 'bundles', label: t('tab_bundles'), icon: Package, badge: 'HOT' },
    { id: 'playground', label: t('tab_playground'), icon: Play, badge: 'LAB' },
    { id: 'studio', label: t('tab_studio'), icon: Video, badge: 'BETA' },
    { id: 'personalized', label: t('tab_personalized'), icon: Sparkles, badge: null },
    { id: 'compare', label: t('tab_compare'), icon: Scale, badge: comparedCount > 0 ? comparedCount : null },
    { id: 'categories', label: t('tab_categories'), icon: Layers, badge: null },
    { id: 'history', label: t('tab_history'), icon: History, badge: null },
    { id: 'bookmarks', label: t('tab_bookmarks'), icon: Bookmark, badge: bookmarkedCount > 0 ? bookmarkedCount : null },
    { id: 'preferences', label: t('tab_preferences'), icon: Sliders, badge: null },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Floating Tooltip for Collapsed Mode */}
      {collapsed && !mobileOpen && hoveredItem && (
        <div 
          className="fixed left-[76px] -translate-y-1/2 px-3.5 py-2 rounded-2xl neu-flat text-xs font-semibold whitespace-nowrap z-[100] pointer-events-none animate-scale-in flex items-center gap-2 text-slate-800 dark:text-slate-100"
          style={{ top: `${hoveredItem.top}px` }}
        >
          <span>{hoveredItem.label}</span>
          {hoveredItem.badge && (
            <span className="px-2 py-0.5 text-[10px] font-mono neu-inset-sm text-blue-600 dark:text-blue-400 rounded-lg font-bold">
              {hoveredItem.badge}
            </span>
          )}
        </div>
      )}

      <aside 
        className={`fixed md:relative inset-y-0 left-0 flex flex-col bg-[var(--bg)] transition-[width,transform] duration-200 ease-in-out z-50 md:z-30 shrink-0 select-none md:my-3 md:ml-3 md:rounded-3xl neu-flat md:h-[calc(100vh-1.5rem)] overflow-hidden ${
          mobileOpen ? 'translate-x-0 w-[260px] neu-modal' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-[68px]' : 'md:w-[264px]'}`}
      >
        {/* Brand Header */}
        <div className={`h-16 flex items-center shrink-0 ${
          collapsed && !mobileOpen ? 'justify-center px-0' : 'justify-between px-4'
        }`}>
          <div 
            onClick={() => {
              setActiveTab('trending');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`flex items-center cursor-pointer group min-w-0 ${
              collapsed && !mobileOpen ? 'w-10 h-10 justify-center' : 'gap-3 flex-1'
            }`}
          >
            <div className="w-9 h-9 rounded-2xl neu-inset flex items-center justify-center shrink-0 font-black text-blue-600 transition-transform group-hover:scale-105">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>

            {(!collapsed || mobileOpen) && (
              <div className="overflow-hidden whitespace-nowrap min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-slate-100 truncate">
                    Agent<span className="text-blue-600">Skills</span>
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono rounded-lg neu-inset-sm text-blue-600 dark:text-blue-400 font-bold shrink-0">
                    2026
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Close button for Mobile Drawer */}
          {onCloseMobile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseMobile();
              }}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-xl neu-btn text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shrink-0 ml-2 cursor-pointer active:scale-95 transition-all"
              title={t('sidebar_collapse')}
              aria-label={t('sidebar_collapse')}
            >
              <X className="w-4 h-4 shrink-0" />
            </button>
          )}
        </div>

        <div className="px-3">
          <div className="neu-divider" />
        </div>

        {/* Navigation Items */}
        <div className={`flex-1 py-2 overflow-y-auto scrollbar-none space-y-1.5 ${
          collapsed && !mobileOpen ? 'px-2 flex flex-col items-center' : 'px-3'
        }`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setHoveredItem(null);
                  if (onCloseMobile) onCloseMobile();
                }}
                onMouseEnter={(e) => {
                  if (collapsed && !mobileOpen) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredItem({
                      label: item.label,
                      badge: item.badge,
                      top: rect.top + rect.height / 2
                    });
                  }
                }}
                onMouseLeave={() => setHoveredItem(null)}
                className={`h-10 rounded-2xl flex items-center transition-all duration-150 relative group shrink-0 ${
                  collapsed && !mobileOpen 
                    ? 'w-10 justify-center p-0 mx-auto' 
                    : 'w-full px-3.5 gap-3'
                } ${
                  isActive
                    ? 'neu-inset text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-[var(--shadow-dark)]/15'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600'}`} />

                {(!collapsed || mobileOpen) && (
                  <div className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap">
                    <span className="truncate text-left text-xs">
                      {item.label}
                    </span>

                    {item.badge && (
                      <span className={`ml-2 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold shrink-0 ${
                        isActive 
                          ? 'neu-primary text-white' 
                          : 'neu-inset-sm text-slate-500 dark:text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* User Profile / Auth Area */}
        <div className="px-3">
          <div className="neu-divider" />
        </div>
        <div className={`p-3 pb-6 md:pb-3 space-y-2 flex flex-col shrink-0 ${
          collapsed && !mobileOpen ? 'items-center px-1.5' : ''
        }`}>
          {user ? (
            <div className={`flex items-center ${collapsed && !mobileOpen ? 'w-10 h-10 justify-center' : 'w-full gap-2.5 p-1'}`}>
              <div 
                className="w-8 h-8 rounded-xl neu-inset text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer"
                onMouseEnter={(e) => {
                  if (collapsed && !mobileOpen) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredItem({
                      label: `${user.display_name} (@${user.username})`,
                      top: rect.top + rect.height / 2
                    });
                  }
                }}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {user.display_name.charAt(0).toUpperCase()}
              </div>

              {(!collapsed || mobileOpen) && (
                <div className="flex-1 min-w-0 overflow-hidden whitespace-nowrap">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {user.display_name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    @{user.username} {user.is_admin && '• Admin'}
                  </div>
                </div>
              )}

              {(!collapsed || mobileOpen) && (
                <button
                  onClick={logout}
                  className="p-1.5 rounded-xl neu-btn text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shrink-0"
                  title={t('logout')}
                  aria-label={t('logout')}
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              onMouseEnter={(e) => {
                if (collapsed && !mobileOpen) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredItem({
                    label: t('login'),
                    top: rect.top + rect.height / 2
                  });
                }
              }}
              onMouseLeave={() => setHoveredItem(null)}
              className={`flex items-center h-10 rounded-2xl text-xs font-bold neu-primary text-white shadow-md transition-all active:scale-95 ${
                collapsed && !mobileOpen ? 'w-10 justify-center p-0' : 'w-full px-3.5 gap-2.5'
              }`}
            >
              <LogIn className="w-4 h-4 shrink-0" />
              {(!collapsed || mobileOpen) && (
                <span className="whitespace-nowrap">
                  {t('login')}
                </span>
              )}
            </button>
          )}

          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={() => {
              if (mobileOpen || (typeof window !== 'undefined' && window.innerWidth < 768)) {
                if (onCloseMobile) {
                  onCloseMobile();
                  return;
                }
              }
              setCollapsed(!collapsed);
              setHoveredItem(null);
            }}
            onMouseEnter={(e) => {
              if (collapsed && !mobileOpen) {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredItem({
                  label: t('sidebar_expand'),
                  top: rect.top + rect.height / 2
                });
              }
            }}
            onMouseLeave={() => setHoveredItem(null)}
            className={`flex items-center h-10 rounded-xl neu-btn text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all text-xs font-semibold cursor-pointer active:scale-95 ${
              collapsed && !mobileOpen ? 'w-10 justify-center p-0' : 'w-full px-3 gap-2'
            }`}
            aria-label={collapsed && !mobileOpen ? t('sidebar_expand') : t('sidebar_collapse')}
          >
            {collapsed && !mobileOpen ? (
              <ChevronRight className="w-4 h-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">
                  {t('sidebar_collapse')}
                </span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
