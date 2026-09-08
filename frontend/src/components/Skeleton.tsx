import React from 'react';

export const SkillCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-3xl neu-flat p-5 space-y-3.5 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <div className="flex gap-1.5">
            <div className="h-4 w-16 bg-[var(--shadow-dark)]/20 rounded-lg" />
            <div className="h-4 w-20 bg-[var(--shadow-dark)]/20 rounded-lg" />
          </div>
          <div className="h-4 w-3/4 bg-[var(--shadow-dark)]/25 rounded-lg" />
          <div className="h-3 w-1/2 bg-[var(--shadow-dark)]/20 rounded-lg" />
        </div>
        <div className="h-8 w-8 neu-inset rounded-xl" />
      </div>

      <div className="space-y-1.5 py-1">
        <div className="h-3 w-full bg-[var(--shadow-dark)]/20 rounded-lg" />
        <div className="h-3 w-5/6 bg-[var(--shadow-dark)]/20 rounded-lg" />
      </div>

      <div className="h-5 w-1/3 bg-[var(--shadow-dark)]/20 rounded-lg" />

      <div className="pt-3 border-t border-[var(--shadow-dark)]/20 flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="h-5 w-12 neu-inset-sm rounded-lg" />
          <div className="h-5 w-12 neu-inset-sm rounded-lg" />
        </div>
        <div className="h-5 w-14 neu-inset-sm rounded-lg" />
      </div>
    </div>
  );
};

export const GridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <SkillCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="rounded-3xl neu-flat p-5 space-y-3 animate-pulse">
      <div className="h-8 w-full bg-[var(--shadow-dark)]/20 rounded-xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 w-full bg-[var(--shadow-dark)]/15 rounded-xl" />
      ))}
    </div>
  );
};
