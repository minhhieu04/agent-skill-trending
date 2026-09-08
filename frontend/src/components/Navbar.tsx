import React from 'react';
import { 
  Search, 
  RefreshCw, 
  Sun, 
  Moon, 
  Globe, 
  Scale, 
  Menu,
  X 
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
  const { theme, toggleTheme, isTransitioning } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="w-full rounded-2xl neu-flat h-14 sm:h-16 flex items-center px-4 sm:px-6 gap-3 select-none transition-all">
      {/* Mobile Toggle Button */}
      <button
        onClick={onToggleSidebar}
        className="md:hidden p-2 rounded-xl neu-btn text-slate-700 dark:text-slate-200 shrink-0 cursor-pointer"
        aria-label="Toggle navigation menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Search Input Bar - Inset Neumorphic */}
      <div className="flex-1 max-w-xl relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('search_placeholder')}
          className="w-full pl-10 pr-9 py-2 sm:py-2.5 rounded-2xl neu-inset bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Right Action Icons Group */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        {/* Compare Floating Counter Badge */}
        {comparedCount > 0 && onGoToCompare && (
          <button
            onClick={onGoToCompare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl neu-primary text-white text-xs font-semibold cursor-pointer active:scale-95 transition-all"
            title={t('tab_compare')}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{t('compare_count_btn')} ({comparedCount})</span>
          </button>
        )}

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl neu-btn text-slate-700 dark:text-slate-200 text-xs font-mono font-semibold active:scale-95 transition-all cursor-pointer"
          title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
        >
          <Globe className="w-3.5 h-3.5 text-blue-500" />
          <span>{language === 'vi' ? 'VI' : 'EN'}</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={(e) => toggleTheme(e)}
          disabled={isTransitioning}
          className={`p-2 rounded-xl neu-btn text-slate-700 dark:text-slate-200 transition-all active:scale-95 cursor-pointer ${
            isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-blue-600 transition-transform duration-300 hover:-rotate-12" />
          )}
        </button>

        {/* Scan Data Trigger Button - Neumorphic Primary Accent */}
        <button
          onClick={onOpenTriggerModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl neu-primary"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{t('scan_data')}</span>
        </button>
      </div>
    </header>
  );
};
