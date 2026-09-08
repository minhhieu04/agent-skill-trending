import React, { useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { SocialMediaPost, SkillDigestSummary } from '../types';
import { SocialTechPostCard } from './SocialTechPostCard';

interface SocialTechPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: SocialMediaPost | null;
  skillSummary: SkillDigestSummary | null;
  onSelectSkillById?: (id: number) => void;
  onToggleBookmark?: (id: number) => void;
  isBookmarked?: boolean;
}

export const SocialTechPostModal: React.FC<SocialTechPostModalProps> = ({
  isOpen,
  onClose,
  post,
  skillSummary,
  onSelectSkillById,
  onToggleBookmark,
  isBookmarked = false,
}) => {
  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !post || !skillSummary) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-slate-950/50 dark:bg-black/70 backdrop-blur-md animate-modal-backdrop">
      <div
        className="fixed inset-0 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-3xl rounded-3xl bg-[var(--bg)] neu-modal overflow-hidden z-10 my-8 text-[var(--text-main)] animate-modal-pop">
        {/* Modal Top Header Bar */}
        <div className="px-5 py-4 shadow-[0_4px_10px_var(--shadow-dark)] flex items-center justify-between bg-[var(--bg)] relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)] uppercase tracking-wider font-mono">
            <Sparkles className="w-4 h-4 text-[var(--primary)]" />
            <span>Bài Viết Chuyên Sâu Mạng Xã Hội (Deep-Dive)</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
            title="Đóng cửa sổ (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Renders the full SocialTechPostCard */}
        <div className="max-h-[80vh] overflow-y-auto p-4 sm:p-6 scrollbar-thin">
          <SocialTechPostCard
            post={post}
            skillSummary={skillSummary}
            onSelectSkillById={(id) => {
              onClose();
              if (onSelectSkillById) onSelectSkillById(id);
            }}
            onToggleBookmark={onToggleBookmark}
            isBookmarked={isBookmarked}
          />
        </div>
      </div>
    </div>
  );
};
