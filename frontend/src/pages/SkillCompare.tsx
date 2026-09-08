import React, { useState } from 'react';
import { Skill } from '../types';
import { ScoreBadge } from '../components/ScoreBadge';
import { TechLogo } from '../components/TechLogo';
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
      <div className="p-5 sm:p-6 rounded-3xl neu-flat flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)]">{t('compare_title')}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {t('compare_sub')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {comparedSkills.length < 4 && availableToAdd.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setSelectorOpen(!selectorOpen)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold neu-primary text-white transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('add_skill_compare')}</span>
              </button>

              {selectorOpen && (
                <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto rounded-2xl neu-modal p-2.5 z-30 space-y-1.5 animate-scale-in">
                  <div className="text-[10px] font-mono text-[var(--text-muted)] px-2 py-1 uppercase tracking-wider font-bold">
                    {t('select_skill_to_compare')}
                  </div>
                  {availableToAdd.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        onAddSkillToCompare(s.id);
                        setSelectorOpen(false);
                      }}
                      className="p-2.5 rounded-xl neu-btn cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div className="truncate mr-2 flex items-center gap-2">
                        <TechLogo name={s.name || s.title || s.primary_language || ''} className="w-3.5 h-3.5 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-[var(--text-main)] truncate">
                            {s.title || s.name}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">
                            {s.category}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[var(--primary)] font-mono shrink-0">
                        +{t('btn_compare')}
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
        <div className="p-10 text-center rounded-3xl neu-inset space-y-3 animate-fade-in">
          <Scale className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
          <h3 className="text-sm font-bold text-[var(--text-main)]">{t('no_compared_skills')}</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            {t('no_compared_hint')}
          </p>
          {allSkills.length >= 2 && (
            <button
              onClick={() => {
                onAddSkillToCompare(allSkills[0].id);
                onAddSkillToCompare(allSkills[1].id);
              }}
              className="px-4 py-2 rounded-2xl text-xs font-semibold neu-btn text-[var(--primary)] transition-all"
            >
              {t('compare_try_sample')}
            </button>
          )}
        </div>
      ) : (
        /* Side-by-side comparison matrix */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 animate-fade-in">
          {comparedSkills.map((skill) => (
            <div
              key={skill.id}
              className="p-5 sm:p-6 rounded-3xl neu-flat flex flex-col justify-between space-y-4 transition-all"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--shadow-dark)]/20">
                  <div>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full neu-inset-sm text-[var(--text-muted)]">
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
                      className="text-sm sm:text-base font-bold text-[var(--text-main)] hover:text-[var(--primary)] cursor-pointer mt-1.5 truncate transition-colors"
                    >
                      {skill.title || skill.name}
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono truncate">{skill.name}</p>
                  </div>

                  <button
                    onClick={() => onRemoveSkillFromCompare(skill.id)}
                    className="p-2 rounded-xl neu-btn text-[var(--text-muted)] hover:text-rose-500 transition-all"
                    title={t('remove_from_compare')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Score Pills */}
                <div className="flex items-center gap-2 my-3">
                  <ScoreBadge score={skill.trending_score} type="trending" size="sm" />
                  <ScoreBadge score={skill.quality_score} type="quality" size="sm" />
                </div>

                {/* Target Audience */}
                {skill.target_audience && (
                  <div className="p-3 rounded-2xl neu-inset-sm text-xs text-[var(--text-muted)] mb-3 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                    <span><strong className="font-bold text-[var(--text-main)]">{t('target_fit')} </strong>{skill.target_audience}</span>
                  </div>
                )}

                {/* Key Differentiators / Strength Notes */}
                <div className="p-3.5 rounded-2xl neu-inset-sm text-xs space-y-1 mb-3">
                  <div className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    {t('key_differentiators')}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {skill.comparison_notes || skill.ai_summary || skill.description}
                  </p>
                </div>

                {/* Realistic Use Cases */}
                <div className="space-y-1.5 mb-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold">
                    {t('realistic_use_cases')}
                  </div>
                  {skill.use_cases && skill.use_cases.length > 0 ? (
                    <ul className="space-y-1.5 text-xs">
                      {skill.use_cases.map((uc, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-snug text-[var(--text-muted)]">{uc}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)]">{t('no_use_cases_avail')}</p>
                  )}
                </div>

                {/* Runtimes */}
                {skill.runtimes && skill.runtimes.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1 font-bold">
                      <Terminal className="w-3 h-3 text-[var(--primary)]" />
                      {t('supported_runtimes')}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {skill.runtimes.map((rt) => (
                        <span
                          key={rt}
                          className="text-[10px] font-mono px-2.5 py-0.5 rounded-full neu-inset-sm text-[var(--text-muted)]"
                        >
                          {rt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-[var(--shadow-dark)]/20 flex items-center justify-between text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-mono font-bold text-[var(--text-main)]">
                    <Star className="w-3 h-3 text-amber-500 fill-current" />
                    {skill.stars.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 font-mono font-bold text-[var(--text-main)]">
                    <GitFork className="w-3 h-3" />
                    {skill.forks.toLocaleString()}
                  </span>
                </div>

                <a
                  href={skill.repository_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-main)] hover:text-[var(--primary)] transition-all"
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
