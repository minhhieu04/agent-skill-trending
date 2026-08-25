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
    { id: 'trending', label: t('tab_trending'), icon: Flame, badge: null, color: 'text-amber-500' },
    { id: 'bundles', label: t('tab_bundles'), icon: Package, badge: 'HOT', color: 'text-indigo-500' },
    { id: 'playground', label: t('tab_playground'), icon: Play, badge: 'AI', color: 'text-emerald-500' },
    { id: 'studio', label: t('tab_studio'), icon: Video, badge: 'NEW', color: 'text-rose-500' },
    { id: 'personalized', label: t('tab_personalized'), icon: Sparkles, badge: null, color: 'text-indigo-500' },
    { id: 'compare', label: t('tab_compare'), icon: Scale, badge: comparedCount > 0 ? comparedCount : null, color: 'text-sky-500' },
    { id: 'categories', label: t('tab_categories'), icon: Layers, badge: null, color: 'text-teal-500' },
    { id: 'history', label: t('tab_history'), icon: History, badge: null, color: 'text-orange-500' },
    { id: 'bookmarks', label: t('tab_bookmarks'), icon: Bookmark, badge: bookmarkedCount > 0 ? bookmarkedCount : null, color: 'text-purple-500' },
    { id: 'preferences', label: t('tab_preferences'), icon: Sliders, badge: null, color: 'text-emerald-500' },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Floating Tooltip for Collapsed Mode (Outside scroll container to prevent clipping) */}
      {collapsed && !mobileOpen && hoveredItem && (
        <div 
          className="fixed left-[68px] -translate-y-1/2 px-3 py-1.5 rounded-xl bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white text-xs font-semibold whitespace-nowrap shadow-2xl z-[100] pointer-events-none border border-slate-700/80 animate-scale-in flex items-center gap-2"
          style={{ top: `${hoveredItem.top}px` }}
        >
          <span>{hoveredItem.label}</span>
          {hoveredItem.badge && (
            <span className="px-1.5 py-0.2 text-[10px] font-mono bg-emerald-500 text-slate-950 rounded font-bold">
              {hoveredItem.badge}
            </span>
          )}
        </div>
      )}

      <aside 
        className={`fixed md:relative inset-y-0 left-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl transition-[width,transform] duration-300 ease-in-out z-50 md:z-30 shrink-0 select-none ${
          mobileOpen ? 'translate-x-0 w-[260px] shadow-2xl' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-[60px]' : 'md:w-[250px]'}`}
      >
        {/* Brand Header */}
        <div className={`h-16 flex items-center border-b border-slate-200 dark:border-slate-800 overflow-hidden ${
          collapsed && !mobileOpen ? 'justify-center px-0' : 'justify-between px-3.5'
        }`}>
          <div 
            onClick={() => {
              setActiveTab('trending');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`flex items-center cursor-pointer group overflow-hidden ${
              collapsed && !mobileOpen ? 'w-10 h-10 justify-center' : 'gap-3 w-full'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Bot className="w-5 h-5 text-slate-950 font-bold" />
            </div>

            {(!collapsed || mobileOpen) && (
              <div className="overflow-hidden whitespace-nowrap animate-fade-in flex-1">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="font-extrabold text-base text-slate-900 dark:text-slate-100 tracking-tight">
                    Agent<span className="text-emerald-500">Skills</span>
                  </span>
                  <span className="px-1.5 py-0.2 text-[9px] font-mono bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 rounded border border-emerald-500/30 font-bold">
                    2026
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate whitespace-nowrap">
                  Antigravity & Codex Radar
                </p>
              </div>
            )}
          </div>

          {/* Close button for Mobile Drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className={`flex-1 py-3 overflow-y-auto scrollbar-none space-y-2 ${
          collapsed && !mobileOpen ? 'px-0 flex flex-col items-center' : 'px-2.5'
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
                className={`h-10 rounded-2xl flex items-center transition-all duration-200 relative group shrink-0 ${
                  collapsed && !mobileOpen 
                    ? 'w-10 justify-center p-0 mx-auto' 
                    : 'w-full px-3 gap-3'
                } ${
                  isActive
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />

                {(!collapsed || mobileOpen) && (
                  <div className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap animate-fade-in">
                    <span className="truncate text-left text-xs font-semibold">
                      {item.label}
                    </span>

                    {item.badge && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                        isActive 
                          ? 'bg-emerald-500 text-slate-950' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
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
        <div className={`p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1.5 flex flex-col ${
          collapsed && !mobileOpen ? 'items-center px-0' : ''
        }`}>
          {user ? (
            <div className={`flex items-center ${collapsed && !mobileOpen ? 'w-10 h-10 justify-center' : 'w-full gap-2.5 px-2'}`}>
              <div 
                className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center font-bold text-slate-950 text-xs shadow-md shrink-0 cursor-pointer"
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
                <div className="flex-1 min-w-0 overflow-hidden whitespace-nowrap animate-fade-in">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {user.display_name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    @{user.username} {user.is_admin && <span className="text-emerald-500 font-bold">• Admin</span>}
                  </div>
                </div>
              )}

              {(!collapsed || mobileOpen) && (
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
                  title={t('logout')}
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
              className={`flex items-center h-10 rounded-2xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors overflow-hidden ${
                collapsed && !mobileOpen ? 'w-10 justify-center p-0' : 'w-full px-3 gap-2.5'
              }`}
            >
              <LogIn className="w-4 h-4 text-emerald-500 shrink-0" />
              {(!collapsed || mobileOpen) && (
                <span className="whitespace-nowrap animate-fade-in">
                  {t('login')}
                </span>
              )}
            </button>
          )}

          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={() => {
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
            className={`flex items-center h-10 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-xs font-medium ${
              collapsed && !mobileOpen ? 'w-10 justify-center p-0' : 'w-full px-3 gap-2.5'
            }`}
          >
            {collapsed && !mobileOpen ? (
              <ChevronRight className="w-4 h-4 shrink-0 transition-transform" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 shrink-0 transition-transform" />
                <span className="whitespace-nowrap animate-fade-in">
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
