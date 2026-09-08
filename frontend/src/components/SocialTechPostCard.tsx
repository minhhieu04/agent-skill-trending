import React, { useState } from 'react';
import {
  Heart,
  Bookmark,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Headphones,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Star,
  Cpu,
  Terminal,
  Zap,
  Sparkles,
  Lightbulb,
  Target
} from 'lucide-react';
import { SocialMediaPost, SkillDigestSummary } from '../types';
import { useToast } from '../context/ToastContext';
import { copyToClipboard } from '../utils/clipboard';

interface SocialTechPostCardProps {
  post: SocialMediaPost;
  skillSummary: SkillDigestSummary;
  onSelectSkillById?: (id: number) => void;
  onToggleBookmark?: (id: number) => void;
  isBookmarked?: boolean;
}

export const SocialTechPostCard: React.FC<SocialTechPostCardProps> = ({
  post,
  skillSummary,
  onSelectSkillById,
  onToggleBookmark,
  isBookmarked = false,
}) => {
  const { showToast } = useToast();

  // Local interactive like state
  const storageKey = `post_liked_${post.skill_id}`;
  const [isLiked, setIsLiked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  });
  const [likesCount, setLikesCount] = useState<number>(post.reactions.likes + (isLiked ? 1 : 0));
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedFullPost, setCopiedFullPost] = useState<boolean>(false);
  const [isReadingAudio, setIsReadingAudio] = useState<boolean>(false);

  const handleToggleLike = () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : prev - 1));
    try {
      localStorage.setItem(storageKey, String(nextState));
    } catch {
      // Ignore
    }
    if (nextState) {
      showToast('Đã thả tim bài viết!', 'success');
    }
  };

  const handleCopyCode = async () => {
    if (post.code_example?.code) {
      const ok = await copyToClipboard(post.code_example.code);
      if (ok) {
        setCopiedCode(true);
        showToast('Đã sao chép mã nguồn ví dụ!', 'success');
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        showToast('Không thể sao chép mã nguồn vào bộ nhớ tạm', 'error');
      }
    }
  };

  const handleCopyFullPost = async () => {
    const prosText = post.pros_and_cons?.pros?.map((p) => `  * ${p}`).join('\n') || '';
    const consText = post.pros_and_cons?.cons?.map((c) => `  * ${c}`).join('\n') || '';

    const formatted = `
# ${post.title} — Phân Tích Chuyên Sâu Mạng Xã Hội

${post.hook}

${post.summary}

## Trước vs Sau Khi Áp Dụng:
- Trước đây (Before): ${post.pain_point_story?.before || ''}
- Giờ đây (After): ${post.pain_point_story?.after || ''}

## Cơ Chế & Kiến Trúc Lõi:
${post.core_mechanism || ''}

## Code Mẫu Thực Tế:
\`\`\`${post.code_example?.language || 'bash'}
${post.code_example?.code || ''}
\`\`\`

## Ưu & Nhược Điểm:
- Ưu điểm:
${prosText}
- Lưu ý:
${consText}

## Đối Tượng Khuyên Dùng:
${post.who_should_use || ''}

${post.hashtags?.join(' ') || ''}
Repo: ${post.repository_url || ''}
`.trim();

    const ok = await copyToClipboard(formatted);
    if (ok) {
      setCopiedFullPost(true);
      showToast('Đã sao chép toàn bộ bài post để chia sẻ!', 'success');
      setTimeout(() => setCopiedFullPost(false), 2000);
    } else {
      showToast('Không thể sao chép bài viết vào bộ nhớ tạm', 'error');
    }
  };

  const handleListenSpeech = () => {
    if (!('speechSynthesis' in window)) {
      showToast('Trình duyệt không hỗ trợ đọc âm thanh Web Speech', 'error');
      return;
    }

    if (isReadingAudio) {
      window.speechSynthesis.cancel();
      setIsReadingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const readText = `${post.title}. ${post.hook}. ${post.summary}. Tác dụng: ${skillSummary.what_it_does}`;
    const utter = new SpeechSynthesisUtterance(readText);
    utter.lang = 'vi-VN';
    utter.rate = 1.05;
    utter.onend = () => setIsReadingAudio(false);
    utter.onerror = () => setIsReadingAudio(false);

    setIsReadingAudio(true);
    window.speechSynthesis.speak(utter);
    showToast('Đang phát giọng đọc tóm tắt bài viết...', 'info');
  };

  // Avatar initial letter & color
  const initial = (post.author_name || post.title || 'A').charAt(0).toUpperCase();

  return (
    <article className="rounded-3xl neu-flat transition-all overflow-hidden flex flex-col justify-between text-[var(--text-main)]">
      {/* 1. AUTHOR & POST HEADER */}
      <div className="p-4 sm:p-5 flex items-start justify-between gap-4 bg-[var(--bg)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center font-bold text-sm shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[var(--text-main)] text-sm sm:text-base truncate">
                {post.author_name}
              </span>
              <BadgeCheck className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <span className="text-xs text-[var(--text-muted)] font-mono truncate">
                {post.author_handle}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5 flex-wrap font-mono">
              <span>{post.posted_time_ago}</span>
              <span>•</span>
              <span>{post.read_time_minutes} phút đọc</span>
            </div>
          </div>
        </div>

        {/* Badges & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {post.badge && (
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-mono uppercase neu-inset-sm text-[var(--text-muted)]">
              {post.badge}
            </span>
          )}
          <div className="flex items-center gap-1 neu-inset-sm text-amber-500 px-2.5 py-1 rounded-full text-xs font-mono font-medium">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{skillSummary.stars.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="neu-divider" />

      {/* 2. POST CONTENT BODY */}
      <div className="p-4 sm:p-5 space-y-4 flex-1">
        {/* Title */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase neu-inset-sm text-[var(--text-muted)]">
              {skillSummary.category}
            </span>
            {skillSummary.primary_language && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono text-[var(--primary)] neu-inset-sm font-semibold">
                {skillSummary.primary_language}
              </span>
            )}
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              Score: <strong className="text-[var(--text-main)] font-bold">{skillSummary.trending_score}</strong>
            </span>
          </div>

          <h3
            onClick={() => onSelectSkillById && onSelectSkillById(post.skill_id)}
            className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-main)] hover:text-[var(--primary)] cursor-pointer transition-colors"
          >
            {post.title}
          </h3>
        </div>

        {/* VIRAL HOOK CALLOUT */}
        <div className="rounded-2xl neu-inset border-l-4 border-[var(--primary)] p-3.5 sm:p-4">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm font-medium text-[var(--text-main)] leading-relaxed italic">
              "{post.hook}"
            </p>
          </div>
        </div>

        {/* SUMMARY */}
        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
          {post.summary}
        </p>

        {/* BEFORE VS AFTER STORY (TRƯỚC VS SAU) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* BEFORE */}
          <div className="rounded-2xl p-3.5 neu-inset space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Nỗi đau trước đây</span>
            </div>
            <p className="text-xs text-[var(--text-main)] leading-relaxed font-normal">
              {post.pain_point_story.before}
            </p>
          </div>

          {/* AFTER */}
          <div className="rounded-2xl p-3.5 neu-inset space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Trải nghiệm sau khi dùng</span>
            </div>
            <p className="text-xs text-[var(--text-main)] leading-relaxed font-normal">
              {post.pain_point_story.after}
            </p>
          </div>
        </div>

        {/* CORE MECHANISM (CƠ CHẾ HOẠT ĐỘNG) */}
        {post.core_mechanism && (
          <div className="rounded-2xl neu-inset p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-main)]">
              <Cpu className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Cơ chế hoạt động & Kiến trúc lõi:</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {post.core_mechanism}
            </p>
          </div>
        )}

        {/* KEY FEATURES */}
        {post.key_features && post.key_features.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-main)]">
              <Zap className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Tính năng nổi bật:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {post.key_features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2.5 rounded-xl neu-inset-sm text-xs text-[var(--text-main)]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CODE EXAMPLE BLOCK */}
        {post.code_example?.code && (
          <div className="rounded-2xl neu-inset p-2 overflow-hidden space-y-1.5">
            <div className="flex items-center justify-between px-3 py-1.5 text-xs">
              <div className="flex items-center gap-2 text-[var(--text-muted)] font-mono">
                <Terminal className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span className="text-[var(--text-main)] font-semibold">{post.code_example.filename || 'code-snippet'}</span>
                <span className="px-2 py-0.5 rounded-full neu-inset-sm text-[10px] text-[var(--primary)] uppercase font-mono font-bold">
                  {post.code_example.language}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-[11px] font-mono neu-btn text-[var(--text-main)] px-2.5 py-1 rounded-xl transition-all"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-3.5 overflow-x-auto max-h-56 font-mono text-xs text-[var(--text-main)] leading-relaxed select-all bg-[var(--bg)] rounded-xl neu-inset-sm">
              <pre>
                <code>{post.code_example.code}</code>
              </pre>
            </div>
            {post.code_example.explanation && (
              <div className="px-3 py-1 text-[11px] text-[var(--text-muted)] italic flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 inline" />
                <span>{post.code_example.explanation}</span>
              </div>
            )}
          </div>
        )}

        {/* PROS & CONS */}
        {post.pros_and_cons && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Pros */}
            <div className="space-y-1.5 p-3.5 rounded-2xl neu-inset">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ưu điểm</span>
              </span>
              <ul className="space-y-1 text-xs text-[var(--text-main)] list-disc list-inside">
                {post.pros_and_cons.pros?.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>

            {/* Cons */}
            <div className="space-y-1.5 p-3.5 rounded-2xl neu-inset">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Lưu ý</span>
              </span>
              <ul className="space-y-1 text-xs text-[var(--text-main)] list-disc list-inside">
                {post.pros_and_cons.cons?.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* WHO SHOULD USE */}
        <div className="flex items-center gap-2 p-3 rounded-2xl neu-inset text-xs">
          <span className="font-semibold text-[var(--text-main)] whitespace-nowrap flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Khuyên dùng cho:</span>
          </span>
          <span className="text-[var(--text-muted)]">
            {post.who_should_use}
          </span>
        </div>

        {/* HASHTAGS */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            {post.hashtags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--primary)] cursor-pointer transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="neu-divider" />

      {/* 3. SOCIAL ACTIONS & REACTIONS FOOTER */}
      <div className="px-4 sm:px-5 py-3.5 bg-[var(--bg)] flex items-center justify-between gap-2.5 flex-wrap">
        {/* Left: Like & Bookmark */}
        <div className="flex items-center gap-2">
          {/* Like / Heart Button */}
          <button
            onClick={handleToggleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all ${
              isLiked
                ? 'neu-inset text-rose-500'
                : 'neu-btn text-[var(--text-muted)] hover:text-rose-500'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-rose-500' : ''}`} />
            <span>{likesCount}</span>
          </button>

          {/* Bookmark */}
          {onToggleBookmark && (
            <button
              onClick={() => onToggleBookmark(post.skill_id)}
              className={`p-2 rounded-2xl text-xs transition-all ${
                isBookmarked
                  ? 'neu-inset text-[var(--primary)]'
                  : 'neu-btn text-[var(--text-muted)] hover:text-[var(--primary)]'
              }`}
              title="Lưu bookmark bài viết"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          )}

          {/* Speech Read */}
          <button
            onClick={handleListenSpeech}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all ${
              isReadingAudio
                ? 'neu-primary text-white animate-pulse'
                : 'neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
            title="Đọc tóm tắt bài viết bằng giọng AI"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isReadingAudio ? 'Đang đọc...' : 'Nghe tóm tắt'}
            </span>
          </button>
        </div>

        {/* Right: Share, External Repo & Open Config */}
        <div className="flex items-center gap-2">
          {/* Copy Full Post */}
          <button
            onClick={handleCopyFullPost}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
            title="Sao chép toàn bộ bài viết để đăng mạng xã hội"
          >
            {copiedFullPost ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Đã sao chép</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share Post</span>
              </>
            )}
          </button>

          {/* External GitHub */}
          {post.repository_url && (
            <a
              href={post.repository_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-2xl neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
              title="Mở repository GitHub"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Full Skill Detail Modal */}
          {onSelectSkillById && (
            <button
              onClick={() => onSelectSkillById(post.skill_id)}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-2xl text-xs font-semibold neu-primary text-white transition-all active:scale-95"
            >
              <span>Xem cấu hình</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
