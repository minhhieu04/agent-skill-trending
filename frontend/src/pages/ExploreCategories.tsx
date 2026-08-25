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
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{t('explore_cat_title')}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t('explore_cat_sub')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
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
            className="group p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 cursor-pointer transition-all duration-300 ease-spring shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1.5 active:scale-[0.99] flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                  {getIcon(cat.icon)}
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {cat.count} skills
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2">
                {cat.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                {cat.description}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform">
              <span>{t('view_skill_list')}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
