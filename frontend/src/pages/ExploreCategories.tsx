import React from 'react';
import { CategoryInfo } from '../types';
import { 
  Code2, 
  Server, 
  Sparkles, 
  MessageSquareText, 
  Workflow, 
  Cpu, 
  Wrench, 
  BarChart3, 
  ShieldCheck, 
  Folder, 
  ArrowRight 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ExploreCategoriesProps {
  categories: CategoryInfo[];
  onSelectCategory: (categoryKey: string) => void;
}

export const ExploreCategories: React.FC<ExploreCategoriesProps> = ({
  categories,
  onSelectCategory,
}) => {
  const { t } = useLanguage();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Code2': return <Code2 className="w-6 h-6 text-emerald-500" />;
      case 'Server': return <Server className="w-6 h-6 text-indigo-500" />;
      case 'Sparkles': return <Sparkles className="w-6 h-6 text-amber-500" />;
      case 'MessageSquareText': return <MessageSquareText className="w-6 h-6 text-pink-500" />;
      case 'Workflow': return <Workflow className="w-6 h-6 text-sky-500" />;
      case 'Cpu': return <Cpu className="w-6 h-6 text-teal-500" />;
      case 'Wrench': return <Wrench className="w-6 h-6 text-orange-500" />;
      case 'BarChart3': return <BarChart3 className="w-6 h-6 text-purple-500" />;
      case 'ShieldCheck': return <ShieldCheck className="w-6 h-6 text-rose-500" />;
      default: return <Folder className="w-6 h-6 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 sm:p-6 rounded-3xl neu-flat">
        <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)]">{t('explore_cat_title')}</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          {t('explore_cat_sub')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 animate-fade-in">
        {categories.map((cat) => (
          <div
            key={cat.key}
            onClick={() => onSelectCategory(cat.key)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectCategory(cat.key);
              }
            }}
            role="button"
            tabIndex={0}
            className="group p-6 rounded-3xl neu-btn cursor-pointer transition-all flex flex-col justify-between focus:outline-none space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl neu-inset flex items-center justify-center">
                  {getIcon(cat.icon)}
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full neu-inset-sm text-[var(--primary)] font-bold">
                  {cat.count} skills
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors mb-1.5">
                {cat.title}
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed font-normal">
                {cat.description}
              </p>
            </div>

            <div className="pt-3.5 border-t border-[var(--shadow-dark)]/20 flex items-center justify-between text-xs text-[var(--text-main)] font-bold group-hover:text-[var(--primary)] transition-colors">
              <span>{t('view_skill_list')}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
