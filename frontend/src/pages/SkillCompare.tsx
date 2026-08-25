import React, { useState } from 'react';
import { Skill } from '../types';
import { ScoreBadge } from '../components/ScoreBadge';
import { 
  Scale, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Star, 
  GitFork, 
  Terminal, 
  CheckCircle2, 
  Zap,
  Users
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SkillCompareProps {
  allSkills: Skill[];
  comparedSkillIds: number[];
  onRemoveSkillFromCompare: (id: number) => void;
  onAddSkillToCompare: (id: number) => void;
  onSelectSkill: (skill: Skill) => void;
}

export const SkillCompare: React.FC<SkillCompareProps> = ({
  allSkills,
  comparedSkillIds,
  onRemoveSkillFromCompare,
  onAddSkillToCompare,
  onSelectSkill,
}) => {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const { t } = useLanguage();

  const comparedSkills = allSkills.filter((s) => comparedSkillIds.includes(s.id));
  const availableToAdd = allSkills.filter((s) => !comparedSkillIds.includes(s.id));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-500">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{t('compare_title')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('compare_sub')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {comparedSkills.length < 4 && availableToAdd.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setSelectorOpen(!selectorOpen)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-200 shadow-md shadow-emerald-600/20 hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                {t('add_skill_compare')}
              </button>

              {selectorOpen && (
                <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-scale-in">
                  <div className="text-[11px] font-semibold text-slate-400 px-3 py-1.5 uppercase">
                    {t('select_skill_to_compare')}
                  </div>
                  {availableToAdd.slice(0, 15).map((skill) => (
                    <div
                      key={skill.id}
                      onClick={() => {
                        onAddSkillToCompare(skill.id);
                        setSelectorOpen(false);
                      }}
                      className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs transition-colors hover:translate-x-1 duration-150"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                        {skill.title || skill.name}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
                        {skill.category}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {comparedSkills.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 animate-fade-in">
          <Scale className="w-12 h-12 text-slate-400 mx-auto animate-float" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{t('no_compared_skills')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {t('no_compared_hint')}
          </p>
          {allSkills.length >= 2 && (
            <button
              onClick={() => {
                onAddSkillToCompare(allSkills[0].id);
                onAddSkillToCompare(allSkills[1].id);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-300 hover:bg-sky-500/20 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {t('compare_try_sample')}
            </button>
          )}
        </div>
      ) : (
        /* Side-by-side comparison matrix */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {comparedSkills.map((skill) => (
            <div
              key={skill.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-5 transition-all duration-300 ease-spring hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/5"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {skill.category}
                    </span>
                    <h3 
                      onClick={() => onSelectSkill(skill)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectSkill(skill);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className="text-lg font-black text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer mt-1.5 transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded"
                    >
                      {skill.title || skill.name}
                    </h3>
                  </div>

                  <button
                    onClick={() => onRemoveSkillFromCompare(skill.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title={t('remove_from_compare')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Score Pills */}
                <div className="flex items-center gap-2 my-3">
                  <ScoreBadge score={skill.trending_score} type="trending" size="sm" />
                  <ScoreBadge score={skill.quality_score} type="quality" size="sm" />
                </div>

                {/* Target Audience */}
                {skill.target_audience && (
                  <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/30 text-xs text-indigo-800 dark:text-indigo-300 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span><strong>{t('target_fit')} </strong>{skill.target_audience}</span>
                  </div>
                )}

                {/* Key Differentiators / Strength Notes */}
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-xs text-slate-800 dark:text-slate-200 space-y-1 mb-3">
                  <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    {t('key_differentiators')}
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {skill.comparison_notes || skill.ai_summary || skill.description}
                  </p>
                </div>

                {/* Realistic Use Cases */}
                <div className="space-y-2 mb-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('realistic_use_cases')}
                  </div>
                  {skill.use_cases && skill.use_cases.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {skill.use_cases.map((uc, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-snug">{uc}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">{t('no_use_cases_avail')}</p>
                  )}
                </div>

                {/* Runtimes */}
                {skill.runtimes && skill.runtimes.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Terminal className="w-3 h-3 text-slate-400" />
                      {t('supported_runtimes')}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {skill.runtimes.map((rt) => (
                        <span
                          key={rt}
                          className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                        >
                          {rt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-mono">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    {skill.stars.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <GitFork className="w-3.5 h-3.5" />
                    {skill.forks.toLocaleString()}
                  </span>
                </div>

                <a
                  href={skill.repository_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium"
                >
                  GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
