import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (event?: React.MouseEvent) => void;
  setTheme: (theme: Theme) => void;
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('agent_trending_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light'; // Neumorphism Soft UI default (#e0e5ec)
  });

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetTheme, setTargetTheme] = useState<Theme | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const timerRefs = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = () => {
    timerRefs.current.forEach((t) => clearTimeout(t));
    timerRefs.current = [];
  };

  // Helper to apply theme classes to DOM root
  const applyThemeToDOM = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('agent_trending_theme', t);
  };

  // Synchronize on mount
  useEffect(() => {
    applyThemeToDOM(theme);
    return () => clearAllTimers();
  }, []);

  const toggleTheme = (_event?: React.MouseEvent) => {
    if (isTransitioning) return;

    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    clearAllTimers();
    setTargetTheme(nextTheme);
    setIsTransitioning(true);
    setIsFadingOut(false);

    // Step 1: Allow overlay to mount and cover the page seamlessly (180ms)
    const t1 = setTimeout(() => {
      // Step 2: Switch DOM theme while completely covered by overlay
      setThemeState(nextTheme);
      applyThemeToDOM(nextTheme);

      // Step 3: Start fading out the overlay at 380ms
      const t2 = setTimeout(() => {
        setIsFadingOut(true);

        // Step 4: Fully unmount after fade transition completes (180ms later)
        const t3 = setTimeout(() => {
          setIsTransitioning(false);
          setTargetTheme(null);
          setIsFadingOut(false);
        }, 200);
        timerRefs.current.push(t3);
      }, 200);
      timerRefs.current.push(t2);
    }, 180);
    timerRefs.current.push(t1);
  };

  const setTheme = (t: Theme) => {
    if (t === theme) return;
    setThemeState(t);
    applyThemeToDOM(t);
  };

  // Check language for overlay label
  const isVietnamese = (() => {
    try {
      const savedLang = localStorage.getItem('agent_trending_lang');
      return savedLang !== 'en';
    } catch {
      return true;
    }
  })();

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isTransitioning }}>
      {children}

      {/* Full-Page Soft UI Theme Transition Overlay */}
      {isTransitioning && targetTheme && (
        <div
          className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none backdrop-blur-md transition-opacity duration-200 pointer-events-auto ${
            isFadingOut ? 'opacity-0' : 'opacity-100'
          } ${
            targetTheme === 'dark'
              ? 'bg-slate-950/80 text-white'
              : 'bg-[#e0e5ec]/85 text-slate-800'
          }`}
          aria-live="polite"
          aria-busy="true"
        >
          <div className="relative flex flex-col items-center p-6 sm:p-8 rounded-3xl neu-flat max-w-xs sm:max-w-sm mx-4 text-center shadow-2xl border border-white/20 dark:border-white/10 animate-modal-pop">
            {/* Ambient Pulse Ring & Morphing Soft UI Icon */}
            <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-blue-500/25 animate-theme-pulse" />
              <div className="w-14 h-14 rounded-2xl neu-inset flex items-center justify-center text-[var(--primary)] animate-theme-morph shadow-inner">
                {targetTheme === 'dark' ? (
                  <Moon className="w-7 h-7 text-blue-400 fill-blue-400/20" />
                ) : (
                  <Sun className="w-7 h-7 text-amber-500 fill-amber-500/20" />
                )}
              </div>
            </div>

            <div className="text-sm font-bold tracking-tight mb-1">
              {targetTheme === 'dark'
                ? (isVietnamese ? 'Chuyển sang Chế độ Ban Đêm' : 'Switching to Dark Mode')
                : (isVietnamese ? 'Chuyển sang Chế độ Ban Ngày' : 'Switching to Light Mode')}
            </div>

            <div className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1.5 mt-1">
              <Sparkles className="w-3 h-3 text-[var(--primary)] animate-spin" />
              <span>
                {isVietnamese
                  ? 'Đồng bộ giao diện Soft UI...'
                  : 'Synchronizing Soft UI surfaces...'}
              </span>
            </div>
          </div>
        </div>
      )}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
