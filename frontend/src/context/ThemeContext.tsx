import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

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
  const isTransitioningRef = useRef(false);

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
  }, []);

  const toggleTheme = (event?: React.MouseEvent) => {
    if (isTransitioningRef.current) return;

    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      isTransitioningRef.current = true;
      setIsTransitioning(true);
      document.documentElement.classList.add('no-theme-transition');
      setThemeState(nextTheme);
      applyThemeToDOM(nextTheme);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.documentElement.classList.remove('no-theme-transition');
          isTransitioningRef.current = false;
          setIsTransitioning(false);
        });
      });
      return;
    }

    // Path 1: Native View Transitions API with circular clip-path reveal from click position
    const hasViewTransition = typeof document !== 'undefined' && Boolean((document as any).startViewTransition);
    if (hasViewTransition) {
      let x = event?.clientX;
      let y = event?.clientY;
      if (typeof x !== 'number' || typeof y !== 'number' || (x === 0 && y === 0)) {
        if (event?.currentTarget && 'getBoundingClientRect' in (event.currentTarget as Element)) {
          const rect = (event.currentTarget as Element).getBoundingClientRect();
          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        } else {
          x = window.innerWidth / 2;
          y = window.innerHeight / 2;
        }
      }

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      isTransitioningRef.current = true;
      setIsTransitioning(true);
      // Suppress child CSS transitions during view transition so GPU only renders the radial clip-path
      document.documentElement.classList.add('no-theme-transition');

      let cleanupDone = false;
      const cleanup = () => {
        if (cleanupDone) return;
        cleanupDone = true;
        document.documentElement.classList.remove('no-theme-transition');
        isTransitioningRef.current = false;
        setIsTransitioning(false);
      };

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
                duration: 320,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                pseudoElement: '::view-transition-new(root)',
              }
            );

            animation.onfinish = cleanup;
            animation.oncancel = cleanup;
          })
          .catch(() => {
            cleanup();
          });

        transition.finished
          .catch(() => {})
          .finally(() => {
            cleanup();
          });

        return;
      } catch {
        // If startViewTransition threw synchronously, apply theme directly in fallback
        setThemeState(nextTheme);
        applyThemeToDOM(nextTheme);
        cleanup();
        return;
      }
    }

    // Path 2: Fallback - instant gentle switch without blocking modal popup
    isTransitioningRef.current = true;
    setIsTransitioning(true);
    document.documentElement.classList.add('no-theme-transition');
    setThemeState(nextTheme);
    applyThemeToDOM(nextTheme);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('no-theme-transition');
        isTransitioningRef.current = false;
        setIsTransitioning(false);
      });
    });
  };

  const setTheme = (t: Theme) => {
    if (t === theme || isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setIsTransitioning(true);
    document.documentElement.classList.add('no-theme-transition');
    setThemeState(t);
    applyThemeToDOM(t);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('no-theme-transition');
        isTransitioningRef.current = false;
        setIsTransitioning(false);
      });
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isTransitioning }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
