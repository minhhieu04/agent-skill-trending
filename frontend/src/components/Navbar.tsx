import React from 'react';
import { 
  Search, 
  RefreshCw, 
  Sun, 
  Moon, 
  Globe,
  Scale,
  Menu
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  onOpenTriggerModal: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  comparedCount?: number;
  onGoToCompare?: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenTriggerModal,
  searchTerm,
  setSearchTerm,
  comparedCount = 0,
  onGoToCompare,
  onToggleSidebar,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-20 w-full h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-colors flex items-center px-4 sm:px-6 gap-4">
      {/* Mobile Toggle Button */}
      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Global Search Input (Flexible Width) */}
      <div className="flex-1 max-w-2xl">
        <div className="relative w-full group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-200" />
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all duration-200 shadow-inner"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
        {/* Quick Compare Badge if any */}
        {comparedCount > 0 && onGoToCompare && (
          <button
            onClick={onGoToCompare}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/30 text-sky-600 dark:text-sky-300 text-xs font-bold hover:bg-sky-500/20 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{t('compare_count_btn')} ({comparedCount})</span>
          </button>
        )}

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-emerald-500 hover:scale-105 active:scale-95 text-xs font-bold transition-all duration-200 shadow-sm"
          title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-500" />
          <span>{language === 'vi' ? 'VI' : 'EN'}</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:scale-105 active:scale-90 transition-all duration-200 shadow-sm"
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-90" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 hover:-rotate-45" />
          )}
        </button>

        {/* Scan Data Trigger Button */}
        <button
          onClick={onOpenTriggerModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-200 shadow-md shadow-emerald-600/20 hover:scale-105 active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{t('scan_data')}</span>
        </button>
      </div>
    </header>
  );
};
