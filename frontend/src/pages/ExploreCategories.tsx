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

interface ExploreCategoriesProps {
  categories: CategoryInfo[];
  onSelectCategory: (categoryKey: string) => void;
}

export const ExploreCategories: React.FC<ExploreCategoriesProps> = ({
  categories,
  onSelectCategory,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Code2': return <Code2 className="w-6 h-6 text-emerald-400" />;
      case 'Server': return <Server className="w-6 h-6 text-indigo-400" />;
      case 'Sparkles': return <Sparkles className="w-6 h-6 text-amber-400" />;
      case 'MessageSquareText': return <MessageSquareText className="w-6 h-6 text-pink-400" />;
      case 'Workflow': return <Workflow className="w-6 h-6 text-sky-400" />;
      case 'Cpu': return <Cpu className="w-6 h-6 text-teal-400" />;
      case 'Wrench': return <Wrench className="w-6 h-6 text-orange-400" />;
      case 'BarChart3': return <BarChart3 className="w-6 h-6 text-purple-400" />;
      case 'ShieldCheck': return <ShieldCheck className="w-6 h-6 text-rose-400" />;
      default: return <Folder className="w-6 h-6 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
        <h2 className="text-xl font-bold text-slate-100">Khám Phá Theo Chuyên Mục</h2>
        <p className="text-xs text-slate-400 mt-1">
          Hệ sinh thái AI Agent năm 2026 được phân loại theo 9 nhóm năng lực cốt lõi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <div
            key={cat.key}
            onClick={() => onSelectCategory(cat.key)}
            className="group p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 group-hover:scale-110 transition-transform">
                  {getIcon(cat.icon)}
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {cat.count} skills
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors mb-2">
                {cat.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {cat.description}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-emerald-400 font-medium group-hover:translate-x-1 transition-transform">
              <span>Xem danh sách</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
