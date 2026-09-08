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
    <header className="sticky top-0 z-20 mx-4 sm:mx-6 lg:mx-8 mt-3 mb-1 rounded-2xl neu-flat h-14 sm:h-16 flex items-center px-4 sm:px-6 gap-3 select-none shrink-0 transition-all">
      {/* Mobile Toggle Button */}
      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl neu-btn text-slate-600 dark:text-slate-300"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>
      )}

      {/* Global Neumorphic Sunken Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative w-full flex items-center px-3.5 py-2 rounded-2xl neu-inset">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2.5 shrink-0 pointer-events-none" />
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5 shrink-0 ml-auto">
        {/* Quick Compare Badge if any */}
        {comparedCount > 0 && onGoToCompare && (
          <button
            onClick={onGoToCompare}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl neu-btn text-slate-700 dark:text-slate-200 text-xs font-semibold"
          >
            <Scale className="w-3.5 h-3.5 text-blue-500" />
            <span>{t('compare_count_btn')} ({comparedCount})</span>
          </button>
        )}

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl neu-btn text-slate-700 dark:text-slate-200 text-xs font-mono font-semibold"
          title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
        >
          <Globe className="w-3.5 h-3.5 text-blue-500" />
          <span>{language === 'vi' ? 'VI' : 'EN'}</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl neu-btn text-slate-700 dark:text-slate-200"
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-blue-600" />
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
