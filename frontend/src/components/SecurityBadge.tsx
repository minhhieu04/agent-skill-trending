import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SecurityBadgeProps {
  rating?: 'safe' | 'moderate' | 'caution';
  score?: number;
  permissionLevel?: string;
  size?: 'sm' | 'md';
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({
  rating = 'safe',
  score = 95,
  permissionLevel = 'read_only',
  size = 'md',
}) => {
  const { t } = useLanguage();

  if (rating === 'safe') {
    return (
      <div 
        className={`inline-flex items-center gap-1 font-mono font-bold rounded-xl neu-inset-sm text-emerald-700 dark:text-emerald-400 ${
          size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
        }`}
        title={`${t('security_verified_safe')} - Score: ${score}/100 - Permission: ${permissionLevel}`}
      >
        <ShieldCheck className={size === 'sm' ? 'w-3 h-3 text-emerald-600 dark:text-emerald-400' : 'w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400'} />
        <span>{t('security_safe')} ({score})</span>
      </div>
    );
  }

  if (rating === 'moderate') {
    return (
      <div 
        className={`inline-flex items-center gap-1 font-mono font-bold rounded-xl neu-inset-sm text-amber-700 dark:text-amber-400 ${
          size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
        }`}
        title={`${t('security_moderate')} - Score: ${score}/100 - Permission: ${permissionLevel}`}
      >
        <AlertTriangle className={size === 'sm' ? 'w-3 h-3 text-amber-600 dark:text-amber-400' : 'w-3.5 h-3.5 text-amber-600 dark:text-amber-400'} />
        <span>{t('security_moderate')} ({score})</span>
      </div>
    );
  }

  return (
    <div 
      className={`inline-flex items-center gap-1 font-mono font-bold rounded-xl neu-inset-sm text-rose-700 dark:text-rose-400 ${
        size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      }`}
      title={`${t('security_caution')} - Score: ${score}/100 - Permission: ${permissionLevel}`}
    >
      <ShieldAlert className={size === 'sm' ? 'w-3 h-3 text-rose-600 dark:text-rose-400' : 'w-3.5 h-3.5 text-rose-600 dark:text-rose-400'} />
      <span>{t('security_caution')} ({score})</span>
    </div>
  );
};
