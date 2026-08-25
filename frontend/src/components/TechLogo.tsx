import React from 'react';

export type TechBrand = 
  | 'antigravity'
  | 'google'
  | 'gemini'
  | 'openai'
  | 'codex'
  | 'chatgpt'
  | 'claude'
  | 'anthropic'
  | 'cursor'
  | 'windsurf'
  | 'golang'
  | 'go'
  | 'gopher'
  | 'nextjs'
  | 'react'
  | 'python'
  | 'typescript'
  | 'javascript'
  | 'docker'
  | 'postgres'
  | 'postgresql'
  | 'mcp'
  | 'copilot'
  | 'github'
  | 'aider'
  | 'tailwind'
  | 'fastapi';

interface TechLogoProps {
  name: string;
  className?: string;
  size?: number | string;
  showBackground?: boolean;
}

export const TechLogo: React.FC<TechLogoProps> = ({ 
  name, 
  className = "w-6 h-6", 
  size,
  showBackground = false 
}) => {
  const normalized = (name || '').toLowerCase().trim();

  // Helper to render SVG
  const renderLogo = () => {
    // 1. Google Antigravity (Official Inverted Wave / Arch "A" with Multi-color Spectrum Gradient)
    if (normalized.includes('antigravity')) {
      return (
        <svg viewBox="0 0 100 100" className={className} width={size} height={size} fill="none">
          <defs>
            <linearGradient id="antigravity_arch_grad" x1="0%" y1="100%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="22%" stopColor="#22C55E" />
              <stop offset="48%" stopColor="#F59E0B" />
              <stop offset="72%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
          {/* Authentic Antigravity Arch Curve */}
          <path 
            d="M20 82 C22 75 32 58 40 38 C44 28 47 18 50 18 C53 18 56 28 60 38 C68 58 78 75 80 82 C82 87 77 90 73 87 C66 80 58 60 52 44 C51 40 49 40 48 44 C42 60 34 80 27 87 C23 90 18 87 20 82 Z" 
            fill="url(#antigravity_arch_grad)" 
          />
          {/* Subtle outer glow ambient path */}
          <path 
            d="M22 80 C32 56 42 22 50 22 C58 22 68 56 78 80" 
            stroke="url(#antigravity_arch_grad)" 
            strokeWidth="14" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            opacity="0.95"
          />
        </svg>
      );
    }

    // 2. Google / Gemini / Deepmind
    if (normalized.includes('gemini') || normalized.includes('deepmind') || normalized.includes('google')) {
      return (
        <svg viewBox="0 0 24 24" className={className} width={size} height={size} fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
        </svg>
      );
    }

    // 3. Golang / Go Gopher Mascot (Official Chuột Go Gopher)
    if (
      normalized.includes('golang') || 
      normalized === 'go' || 
      normalized.includes('go ') || 
      normalized.includes('go-') ||
      normalized.includes('gopher')
    ) {
      return (
        <svg viewBox="0 0 100 100" className={className} width={size} height={size} fill="none">
          {/* Ears */}
          <circle cx="23" cy="27" r="10" fill="#00ACD7" />
          <circle cx="23" cy="27" r="6" fill="#FBD2B9" />
          <circle cx="77" cy="27" r="10" fill="#00ACD7" />
          <circle cx="77" cy="27" r="6" fill="#FBD2B9" />
          
          {/* Main Gopher Body */}
          <circle cx="50" cy="53" r="38" fill="#00ACD7" />
          
          {/* Eyes (Signature Big Gopher Eyes) */}
          <circle cx="35" cy="43" r="13" fill="#FFFFFF" stroke="#0080A0" strokeWidth="1.5" />
          <circle cx="65" cy="43" r="13" fill="#FFFFFF" stroke="#0080A0" strokeWidth="1.5" />
          {/* Pupils */}
          <circle cx="39" cy="43" r="6.5" fill="#222222" />
          <circle cx="41.5" cy="41" r="2.2" fill="#FFFFFF" />
          <circle cx="61" cy="43" r="6.5" fill="#222222" />
          <circle cx="63.5" cy="41" r="2.2" fill="#FFFFFF" />
          
          {/* Snout & Nose */}
          <ellipse cx="50" cy="63" rx="14" ry="10" fill="#FBD2B9" />
          <ellipse cx="50" cy="58" rx="5.5" ry="4" fill="#222222" />
          
          {/* Two Front Teeth */}
          <rect x="46" y="66" width="3.5" height="6.5" rx="1" fill="#FFFFFF" stroke="#C59B82" strokeWidth="0.8" />
          <rect x="50.5" y="66" width="3.5" height="6.5" rx="1" fill="#FFFFFF" stroke="#C59B82" strokeWidth="0.8" />
        </svg>
      );
    }

    // 4. OpenAI / Codex / ChatGPT
    if (
      normalized.includes('openai') || 
      normalized.includes('codex') || 
      normalized.includes('chatgpt') || 
      normalized.includes('gpt')
    ) {
      return (
        <svg viewBox="0 0 24 24" className={`${className} text-emerald-600 dark:text-emerald-400`} width={size} height={size} fill="currentColor">
          <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zM8.307 13.627l2.909-1.68 2.914 1.68v3.355l-2.914 1.68-2.909-1.68zm-1.41-5.117l2.91-1.68 2.914 1.68v3.355l-2.914 1.68-2.91-1.68z" />
        </svg>
      );
    }

    // 5. Next.js
    if (
      normalized.includes('next.js') || 
      normalized.includes('nextjs') || 
      normalized.includes('next-js') || 
      normalized.includes('next 15')
    ) {
      return (
        <svg viewBox="0 0 180 180" className={`${className} text-slate-950 dark:text-white`} width={size} height={size} fill="none">
          <circle cx="90" cy="90" r="90" fill="currentColor" />
          <path d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z" fill="#38BDF8" />
          <rect x="115" y="54" width="12" height="72" fill="#38BDF8" />
        </svg>
      );
    }

    // 6. Claude / Anthropic
    if (normalized.includes('claude') || normalized.includes('anthropic')) {
      return (
        <svg viewBox="0 0 24 24" className={`${className} text-[#D97757]`} width={size} height={size} fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
      );
    }

    // 7. Cursor
    if (normalized.includes('cursor')) {
      return (
        <svg viewBox="0 0 24 24" className={`${className} text-indigo-500 dark:text-indigo-400`} width={size} height={size} fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l-8-4v9l8 4 8-4v-9l-8 4zm-7.2-2.9L12 11.7l7.2-3.6L12 4.5 4.8 8.1z" />
        </svg>
      );
    }

    // 8. Windsurf / Codeium
    if (normalized.includes('windsurf') || normalized.includes('codeium')) {
      return (
        <svg viewBox="0 0 24 24" className={`${className} text-teal-500`} width={size} height={size} fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
      );
    }

    // 9. Model Context Protocol (MCP)
    if (
      normalized.includes('mcp') || 
      normalized.includes('model context protocol') || 
      normalized.includes('model-context-protocol')
    ) {
      return (
        <svg viewBox="0 0 24 24" className={`${className} text-sky-500 dark:text-sky-400`} width={size} height={size} fill="currentColor">
          <path d="M12 2a3 3 0 00-3 3c0 .35.06.68.17.98l-3.2 3.2A2.99 2.99 0 004 9a3 3 0 103 3c0-.35-.06-.68-.17-.98l3.2-3.2c.3.11.63.18.97.18s.67-.07.97-.18l3.2 3.2c-.11.3-.17.63-.17.98a3 3 0 103-3 2.99 2.99 0 00-1.97.18l-3.2-3.2c.11-.3.17-.63.17-.98a3 3 0 00-3-3zm0 13a3 3 0 00-2.83 2H5a1 1 0 100 2h4.17A3.001 3.001 0 0015 19a3 3 0 00-3-3z" />
        </svg>
      );
    }

    // 10. React
    if (normalized.includes('react')) {
      return (
        <svg viewBox="0 0 24 24" className={`${className} text-[#61DAFB]`} width={size} height={size} fill="currentColor">
          <circle cx="12" cy="12" r="2.2" />
          <ellipse cx="12" cy="12" rx="10" ry="4.2" fill="none" stroke="currentColor" strokeWidth="1.3" transform="rotate(30 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4.2" fill="none" stroke="currentColor" strokeWidth="1.3" transform="rotate(90 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4.2" fill="none" stroke="currentColor" strokeWidth="1.3" transform="rotate(150 12 12)" />
        </svg>
      );
    }

    // 11. Python
    if (normalized.includes('python')) {
      return (
        <svg viewBox="0 0 24 24" className={className} width={size} height={size} fill="none">
          <path d="M11.91 2c-5.28 0-4.96 2.29-4.96 2.29l.01 2.37h5.05v.71H4.96S2 7.04 2 12.33c0 5.28 2.58 5.1 2.58 5.1h1.54v-2.16s-.08-2.58 2.54-2.58h5.04s2.45.04 2.45-2.42V4.46S16.63 2 11.91 2zm-2.73 1.54a.8.8 0 110 1.6.8.8 0 010-1.6z" fill="#3776AB" />
          <path d="M12.09 22c5.28 0 4.96-2.29 4.96-2.29l-.01-2.37h-5.05v-.71h7.05s2.96.33 2.96-4.96c0-5.28-2.58-5.1-2.58-5.1h-1.54v2.16s.08 2.58-2.54 2.58H10.3s-2.45-.04-2.45 2.42v5.81s-.44 2.46 4.24 2.46zm2.73-1.54a.8.8 0 110-1.6.8.8 0 010-1.6z" fill="#FFD438" />
        </svg>
      );
    }

    // 12. TypeScript / JavaScript
    if (normalized.includes('typescript') || normalized === 'ts') {
      return (
        <svg viewBox="0 0 24 24" className={`${className} text-[#3178C6]`} width={size} height={size} fill="currentColor">
          <path d="M3 3h18v18H3V3zm10.7 8.7h-2.1v6.9H9.4v-6.9H7.3V9.8h6.4v1.9zm6.1 4.5c-.3.8-.8 1.4-1.5 1.8-.7.4-1.6.6-2.6.6-1.1 0-2-.3-2.7-.8-.7-.6-1.1-1.3-1.2-2.3h2.1c.1.5.3.9.6 1.2.3.3.8.4 1.3.4.5 0 .9-.1 1.2-.3.3-.2.4-.5.4-.8 0-.3-.1-.5-.4-.7-.2-.2-.6-.4-1.2-.6l-.9-.3c-.9-.3-1.6-.7-2-1.2-.4-.5-.6-1.1-.6-1.8 0-.8.3-1.5.9-2 .6-.5 1.4-.8 2.4-.8 1 0 1.8.3 2.4.8.6.5.9 1.2 1 2.1h-2.1c-.1-.4-.2-.7-.5-.9-.3-.2-.7-.3-1.1-.3-.4 0-.8.1-1.1.3-.3.2-.4.4-.4.7 0 .2.1.4.3.6.2.2.6.3 1.1.5l.9.3c1 .3 1.7.7 2.2 1.2.4.4.6 1 .6 1.8z" />
        </svg>
      );
    }

    // 13. PostgreSQL / Postgres / Database
    if (normalized.includes('postgres') || normalized.includes('postgresql') || normalized.includes('sql')) {
      return (
        <svg viewBox="0 0 24 24" className={`${className} text-[#336791]`} width={size} height={size} fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
      );
    }

    // 14. Docker
    if (normalized.includes('docker')) {
      return (
        <svg viewBox="0 0 24 24" className={`${className} text-[#2496ED]`} width={size} height={size} fill="currentColor">
          <path d="M13 8.5h2v2h-2zm-3 0h2v2h-2zm-3 0h2v2H7zm6-3h2v2h-2zm-3 0h2v2h-2zm-3 0h2v2H7zm9 3h2v2h-2zm-3-6h2v2h-2zm9.9 8.2c-.3-.2-1.1-.3-2.3.2-.2-.9-.8-1.8-1.8-2.3l-.6-.3-.4.6c-.5.8-.6 1.7-.5 2.5-.5.3-1.5.5-2.6.5H2.5c-.3 0-.5.2-.5.5 0 2.5 1.5 5 4.1 6.3 1.9 1 4.2 1.4 6.7 1.1 4.5-.5 8.1-3.6 9-7.7.7-.3 1.2-.7 1.4-1.1.1-.1 0-.2-.3-.3z" />
        </svg>
      );
    }

    // 15. GitHub / Copilot
    if (normalized.includes('github') || normalized.includes('copilot')) {
      return (
        <svg viewBox="0 0 24 24" className={`${className} text-slate-900 dark:text-white`} width={size} height={size} fill="currentColor">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      );
    }

    // 16. Tailwind CSS
    if (normalized.includes('tailwind') || normalized.includes('ui-ux') || normalized.includes('design')) {
      return (
        <svg viewBox="0 0 24 24" className={`${className} text-[#38BDF8]`} width={size} height={size} fill="currentColor">
          <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.336 6.182 14.975 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.336 13.382 8.975 12 6.001 12z" />
        </svg>
      );
    }

    // Default Fallback
    return (
      <svg viewBox="0 0 24 24" className={`${className} text-emerald-500`} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  };

  if (showBackground) {
    return (
      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm">
        {renderLogo()}
      </div>
    );
  }

  return renderLogo();
};
