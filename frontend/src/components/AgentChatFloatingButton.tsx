import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AgentChatFloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const AgentChatFloatingButton: React.FC<AgentChatFloatingButtonProps> = ({ onClick, isOpen }) => {
  const { t } = useLanguage();

  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={onClick}
        className="group flex items-center gap-2.5 px-4 py-3 rounded-full neu-primary font-semibold text-xs tracking-wide active:scale-95 transition-all"
        title={t('agent_chat_title')}
        aria-label={t('agent_chat_title')}
      >
        <div className="relative flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white/50" />
        </div>
        <span className="hidden sm:inline font-bold text-white">
          {t('agent_chat_floating_btn')}
        </span>
        <Sparkles className="w-3.5 h-3.5 text-white/90 group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );
};
