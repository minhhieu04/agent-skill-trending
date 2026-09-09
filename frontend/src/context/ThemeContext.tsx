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

  const toggleTheme = (event?: React.MouseEvent) => {
    if (isTransitioning) return;

    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setThemeState(nextTheme);
      applyThemeToDOM(nextTheme);
      return;
    }

    // Path 1: Native View Transitions API with circular clip-path reveal from click position
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      const x = event?.clientX ?? window.innerWidth / 2;
      const y = event?.clientY ?? window.innerHeight / 2;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      setIsTransitioning(true);

      try {
        const transition = (document as any).startViewTransition(() => {
          setThemeState(nextTheme);
          applyThemeToDOM(nextTheme);
        });

        transition.ready
          .then(() => {
            const animation = document.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${endRadius}px at ${x}px ${y}px)`,
                ],
              },
              {
                duration: 450,
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                pseudoElement: '::view-transition-new(root)',
              }
            );

            animation.onfinish = () => {
              setIsTransitioning(false);
            };
          })
          .catch(() => {
            setIsTransitioning(false);
          });

        transition.finished
          .catch(() => {})
          .finally(() => {
            setIsTransitioning(false);
          });

        return;
      } catch {
        setIsTransitioning(false);
      }
    }

    // Path 2: Fallback Full-Page Soft UI Theme Transition Overlay
    clearAllTimers();
    setTargetTheme(nextTheme);
    setIsTransitioning(true);
    setIsFadingOut(false);

    // Step 1: Allow overlay to mount and cover the page seamlessly (140ms)
    const t1 = setTimeout(() => {
      // Step 2: Switch DOM theme while completely covered by overlay
      setThemeState(nextTheme);
      applyThemeToDOM(nextTheme);

      // Step 3: Start fading out the overlay at 300ms
      const t2 = setTimeout(() => {
        setIsFadingOut(true);

        // Step 4: Fully unmount after fade transition completes (150ms later)
        const t3 = setTimeout(() => {
          setIsTransitioning(false);
          setTargetTheme(null);
          setIsFadingOut(false);
        }, 150);
        timerRefs.current.push(t3);
      }, 160);
      timerRefs.current.push(t2);
    }, 140);
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
