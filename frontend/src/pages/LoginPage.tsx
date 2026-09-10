import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bot, LogIn, UserPlus, ArrowRight, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="w-full max-w-md rounded-3xl neu-flat p-6 sm:p-8 relative overflow-hidden text-[var(--text-main)]">
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center mb-3.5">
            <Bot className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-main)]">
            {isRegister ? t('register_title') : t('login_title')}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Agent Skill Trending & Recommendation Engine
          </p>
        </div>

        {!isRegister && (
          <div className="mb-5 p-4 rounded-2xl neu-inset flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl neu-flat text-[var(--primary)] flex items-center justify-center font-bold text-xs">
                H
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[var(--text-main)]">{t('quick_login_hieu')}</div>
                <div className="text-[10px] text-[var(--text-muted)] font-mono">{t('admin_account')}</div>
              </div>
            </div>
            <button
              onClick={handleQuickLoginAsHieu}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-xl neu-primary font-semibold text-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {t('btn_enter')} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-2xl neu-inset text-rose-500 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                {t('field_display_name')}
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Hiếu Trần, Teammate A..."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 text-xs neu-inset rounded-xl text-[var(--text-main)] outline-none transition-all placeholder-[var(--text-muted)]/50"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
              {t('field_username')}
            </label>
            <input
              type="text"
              required
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 text-xs neu-inset rounded-xl text-[var(--text-main)] outline-none transition-all font-mono placeholder-[var(--text-muted)]/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
              {t('field_password')}
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 text-xs neu-inset rounded-xl text-[var(--text-main)] outline-none transition-all font-mono placeholder-[var(--text-muted)]/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                title={showPassword ? (t('hide_password') || 'Ẩn mật khẩu') : (t('show_password') || 'Xem mật khẩu')}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl neu-primary font-bold text-xs transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
          >
            {isRegister ? <UserPlus className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
            {loading ? t('saving') : isRegister ? t('btn_register') : t('btn_login')}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[var(--shadow-dark)]/20 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
          >
            {isRegister ? t('switch_to_login') : t('switch_to_register')}
          </button>
        </div>

        {allUsers.length > 0 && !isRegister && (
          <div className="mt-5 pt-4 border-t border-[var(--shadow-dark)]/20">
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider mb-2.5 text-center">
              {t('system_accounts')} ({allUsers.length})
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {allUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setUsername(u.username);
                    setPassword('123456');
                  }}
                  className="px-3 py-1.5 rounded-xl neu-btn-sm text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--primary)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
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
