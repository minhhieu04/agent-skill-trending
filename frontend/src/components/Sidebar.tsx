import React from 'react';
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
  Play
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  comparedCount = 0,
  bookmarkedCount = 0,
  onOpenLogin,
}) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { id: 'trending', label: t('tab_trending'), icon: Flame, badge: null, color: 'text-amber-500' },
    { id: 'bundles', label: t('tab_bundles'), icon: Package, badge: 'HOT', color: 'text-indigo-500' },
    { id: 'playground', label: t('tab_playground'), icon: Play, badge: 'AI', color: 'text-emerald-500' },
    { id: 'personalized', label: t('tab_personalized'), icon: Sparkles, badge: null, color: 'text-indigo-500' },
    { id: 'compare', label: t('tab_compare'), icon: Scale, badge: comparedCount > 0 ? comparedCount : null, color: 'text-sky-500' },
    { id: 'categories', label: t('tab_categories'), icon: Layers, badge: null, color: 'text-teal-500' },
    { id: 'history', label: t('tab_history'), icon: History, badge: null, color: 'text-orange-500' },
    { id: 'bookmarks', label: t('tab_bookmarks'), icon: Bookmark, badge: bookmarkedCount > 0 ? bookmarkedCount : null, color: 'text-purple-500' },
    { id: 'preferences', label: t('tab_preferences'), icon: Sliders, badge: null, color: 'text-emerald-500' },
  ];

  return (
    <aside 
      className={`relative flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl transition-all duration-300 z-30 shrink-0 select-none ${
        collapsed ? 'w-[72px]' : 'w-[250px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-200 dark:border-slate-800">
        <div 
          onClick={() => setActiveTab('trending')}
          className={`flex items-center gap-3 cursor-pointer group overflow-hidden ${collapsed ? 'justify-center w-full' : ''}`}
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
            <Bot className="w-5 h-5 text-slate-950 font-bold" />
          </div>

          {!collapsed && (
            <div className="animate-in fade-in duration-200 truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base text-slate-900 dark:text-slate-100 tracking-tight">
                  Agent<span className="text-emerald-500">Skills</span>
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-mono bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 rounded border border-emerald-500/30 font-bold">
                  2026
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                Antigravity & Codex Radar
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-4 px-2.5 space-y-1.5 overflow-y-auto scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all relative group ${
                isActive
                  ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-500/30 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/80 border border-transparent'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />

              {!collapsed && (
                <span className="truncate flex-1 text-left">
                  {item.label}
                </span>
              )}

              {!collapsed && item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isActive 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}

              {/* Tooltip for collapsed mode */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 rounded-xl bg-slate-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
                  {item.label}
                  {item.badge && <span className="ml-1.5 text-emerald-400">({item.badge})</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* User Profile / Auth Area */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
        {user ? (
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${user.avatar_color || 'from-emerald-500 to-teal-500'} flex items-center justify-center font-bold text-slate-950 text-xs shadow-md shrink-0`}>
              {user.display_name.charAt(0).toUpperCase()}
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {user.display_name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  @{user.username} {user.is_admin && <span className="text-emerald-500 font-bold">• Admin</span>}
                </div>
              </div>
            )}

            {!collapsed && (
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title={t('logout')}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors ${
              collapsed ? 'justify-center px-0' : ''
            }`}
            title={collapsed ? t('login') : undefined}
          >
            <LogIn className="w-4 h-4 text-emerald-500 shrink-0" />
            {!collapsed && <span>{t('login')}</span>}
          </button>
        )}

        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-xs font-medium"
          title={collapsed ? t('sidebar_expand') : t('sidebar_collapse')}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>{t('sidebar_collapse')}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
