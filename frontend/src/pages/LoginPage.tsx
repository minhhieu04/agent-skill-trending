import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bot, LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, register, allUsers } = useAuth();
  const { t } = useLanguage();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, password, displayName);
      } else {
        await login(username, password);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLoginAsHieu = async () => {
    setError(null);
    setLoading(true);
    try {
      await login('hieu', '123456');
      onSuccess();
    } catch {
      try {
        await register('hieu', '123456', 'Hiếu');
        onSuccess();
      } catch (err: any) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="text-center mb-8 relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-4">
            <Bot className="w-8 h-8 text-slate-950 font-bold" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            {isRegister ? t('register_title') : t('login_title')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Agent Skill Trending & Recommendation Engine
          </p>
        </div>

        {!isRegister && (
          <div className="mb-6 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                H
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-emerald-300">{t('quick_login_hieu')}</div>
                <div className="text-[10px] text-slate-400 font-mono">{t('admin_account')}</div>
              </div>
            </div>
            <button
              onClick={handleQuickLoginAsHieu}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1 shadow-md"
            >
              {t('btn_enter')} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('field_display_name')}
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Hiếu Trần, Teammate A..."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-slate-100 outline-none transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t('field_username')}
            </label>
            <input
              type="text"
              required
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 text-xs bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-slate-100 outline-none transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t('field_password')}
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 text-xs bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-slate-100 outline-none transition-all font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {loading ? t('saving') : isRegister ? t('btn_register') : t('btn_login')}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            {isRegister ? t('switch_to_login') : t('switch_to_register')}
          </button>
        </div>

        {allUsers.length > 0 && !isRegister && (
          <div className="mt-6 pt-4 border-t border-slate-800/60">
            <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mb-2">
              {t('system_accounts')} ({allUsers.length})
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {allUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setUsername(u.username);
                    setPassword('123456');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors flex items-center gap-1.5 border border-slate-700/60"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {u.display_name} ({u.username})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
