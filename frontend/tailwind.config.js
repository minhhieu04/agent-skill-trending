/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        midnight: {
          DEFAULT: '#0A0819',
          950: '#05040d',
          900: '#0A0819',
          850: '#0f0c22',
          800: '#14112c',
          700: '#1e1a3d',
          600: '#2b2654',
        },
        space: {
          950: '#05040d',
          900: '#0A0819',
          850: '#0f0c22',
          800: '#14112c',
          700: '#1e1a3d',
          600: '#2b2654',
        },
        lilac: {
          DEFAULT: '#A5A1C8',
          muted: '#A5A1C8',
          light: '#C4C1DF',
          dark: '#7D79A3',
        },
        lavender: {
          DEFAULT: '#A5A1C8',
          muted: '#A5A1C8',
          light: '#C4C1DF',
          dark: '#7D79A3',
        },
        radiant: {
          pink: '#FF2A85',
          orange: '#FF6B00',
          amber: '#FFAE00',
          cyan: '#00F2FE',
        },
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        dark: {
          900: '#0A0819',
          800: '#14112c',
          700: '#1e1a3d',
        },
        slate: {
          850: '#172033',
        },
        neu: {
          bg: '#e0e5ec',
          'bg-dark': '#1e232a',
          primary: '#0084ff',
          cyan: '#00c6ff',
          dark: '#a3b1c6',
          light: '#ffffff',
        }
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'dialog': '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
        'neu-flat': '7px 7px 15px var(--shadow-dark), -7px -7px 15px var(--shadow-light)',
        'neu-flat-sm': '4px 4px 9px var(--shadow-dark), -4px -4px 9px var(--shadow-light)',
        'neu-flat-xs': '2px 2px 5px var(--shadow-dark), -2px -2px 5px var(--shadow-light)',
        'neu-inset': 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
        'neu-inset-sm': 'inset 2.5px 2.5px 5px var(--shadow-dark), inset -2.5px -2.5px 5px var(--shadow-light)',
        'neu-btn': '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)',
        'neu-btn-hover': '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)',
        'neu-btn-active': 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)',
        'neu-primary': '5px 5px 14px rgba(0, 132, 255, 0.35), -5px -5px 12px var(--shadow-light)',
        'neu-primary-active': 'inset 3px 3px 6px rgba(0, 80, 160, 0.6)',
        'neu-modal': '14px 14px 32px var(--shadow-dark), -14px -14px 32px var(--shadow-light)',
        'neu-dock': '6px 6px 16px var(--shadow-dark), -2px -2px 10px var(--shadow-light)',
        'glass': '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        'glass-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
        'glass-modal': '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        scaleUp: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.88', transform: 'scale(0.985)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(16, 185, 129, 0.45)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pageTransition: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        modalSpring: {
          '0%': { opacity: '0', transform: 'scale(0.93) translateY(12px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        backdropFade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-out': 'fadeOut 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-up': 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-right': 'slideRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-left': 'slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 1.8s infinite',
        'pulse-subtle': 'pulseSubtle 3s infinite ease-in-out',
        'glow': 'glow 3s infinite ease-in-out',
        'float': 'float 4s infinite ease-in-out',
        'spin-slow': 'spin 3s linear infinite',
        'page-transition': 'pageTransition 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'modal-spring': 'modalSpring 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'backdrop-fade': 'backdropFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-subtle': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      }
    },
  },
  plugins: [],
}
