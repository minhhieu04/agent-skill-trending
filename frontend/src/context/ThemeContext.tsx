import React, { createContext, useContext, useState, useEffect } from 'react';

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
    if (isTransitioning) return;

    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      document.documentElement.classList.add('no-theme-transition');
      setThemeState(nextTheme);
      applyThemeToDOM(nextTheme);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.documentElement.classList.remove('no-theme-transition');
        });
      });
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
      // Suppress child CSS transitions during view transition so GPU only renders the radial clip-path
      document.documentElement.classList.add('no-theme-transition');

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

            const cleanup = () => {
              document.documentElement.classList.remove('no-theme-transition');
              setIsTransitioning(false);
            };

            animation.onfinish = cleanup;
            animation.oncancel = cleanup;
          })
          .catch(() => {
            document.documentElement.classList.remove('no-theme-transition');
            setIsTransitioning(false);
          });

        transition.finished
          .catch(() => {})
          .finally(() => {
            document.documentElement.classList.remove('no-theme-transition');
            setIsTransitioning(false);
          });

        return;
      } catch {
        document.documentElement.classList.remove('no-theme-transition');
        setIsTransitioning(false);
      }
    }

    // Path 2: Fallback - instant gentle switch without blocking modal popup
    document.documentElement.classList.add('no-theme-transition');
    setThemeState(nextTheme);
    applyThemeToDOM(nextTheme);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('no-theme-transition');
      });
    });
  };

  const setTheme = (t: Theme) => {
    if (t === theme) return;
    document.documentElement.classList.add('no-theme-transition');
    setThemeState(t);
    applyThemeToDOM(t);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('no-theme-transition');
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
