import React from 'react';

export const SkillCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="flex gap-2">
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
          <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
        <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>

      <div className="space-y-2 py-2">
        <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-3.5 w-5/6 bg-slate-200 dark:bg-slate-800 rounded-md" />
      </div>

      <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-lg" />

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex gap-2">
          <div className="h-6 w-14 bg-slate-200 dark:bg-slate-800 rounded-full" />
          <div className="h-6 w-14 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
    </div>
  );
};

export const GridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkillCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/80 p-4 space-y-3 animate-pulse">
      <div className="h-8 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
      ))}
    </div>
  );
};
