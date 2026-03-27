import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

type Mode = 'login' | 'register';

export default function Auth() {
  const navigate = useNavigate();
  const { user, isLoading, error, login, register, clearError } = useAuthStore();

  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [localError, setLocalError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  useEffect(() => {
    clearError();
    setLocalError('');
    setRegisterSuccess(false);
    setForm({ email: '', password: '', name: '' });
  }, [mode, clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setLocalError('');
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    try {
      if (mode === 'register') {
        if (!form.name.trim()) { setLocalError('Введите ваше имя'); return; }
        await register({ email: form.email, password: form.password, name: form.name });
        setRegisterSuccess(true);
      } else {
        await login({ email: form.email, password: form.password });
        navigate('/dashboard');
      }
    } catch {
      // Ошибка уже в сторе
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-deep)' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-3xl font-bold tracking-tight" style={{ color: 'var(--accent-gold)' }}>🏆 Викторина</span>
            <span className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}> Чемпионов</span>
          </Link>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Платформа для умных викторин</p>
        </div>

        <div className="rounded-2xl p-6 sm:p-8 shadow-2xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

          {/* Переключатель */}
          <div className="flex rounded-xl p-1 mb-8" style={{ background: 'var(--bg-surface)' }}>
            {(['login', 'register'] as Mode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: mode === m ? 'var(--accent-blue)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--text-muted)',
                }}>
                {m === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* Успех регистрации */}
            {registerSuccess ? (
              <motion.div key="success"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 space-y-4"
              >
                <div className="text-5xl">📬</div>
                <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  Проверьте почту!
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Мы отправили письмо на <strong style={{ color: 'var(--text-primary)' }}>{form.email || 'ваш email'}</strong>.
                  Перейдите по ссылке в письме, чтобы подтвердить аккаунт.
                </p>
                <div className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--accent-gold)' }}>
                  После подтверждения вы сможете войти
                </div>
                <button onClick={() => { setRegisterSuccess(false); setMode('login'); }}
                  className="text-sm hover:underline" style={{ color: 'var(--accent-blue)' }}>
                  Уже подтвердили? Войти
                </button>
              </motion.div>
            ) : (

              <motion.form key={mode}
                initial={{ opacity: 0, x: mode === 'login' ? -12 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === 'login' ? 12 : -12 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Имя */}
                {mode === 'register' && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Ваше имя
                    </label>
                    <input id="name" name="name" type="text" autoComplete="name"
                      placeholder="Как вас зовут?" value={form.name} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--accent-blue)')}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                    />
                  </div>
                )}

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Email
                  </label>
                  <input id="email" name="email" type="email" autoComplete="email"
                    placeholder="you@example.com" value={form.email} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent-blue)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>

                {/* Пароль */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      Пароль
                    </label>
                    {mode === 'login' && (
                      <Link to="/forgot-password" className="text-xs hover:underline" style={{ color: 'var(--accent-blue)' }}>
                        Забыл пароль?
                      </Link>
                    )}
                  </div>
                  <input id="password" name="password" type="password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder={mode === 'register' ? 'Минимум 6 символов' : '••••••••'}
                    value={form.password} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent-blue)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>

                {/* Ошибка */}
                <AnimatePresence>
                  {displayError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl px-4 py-3 text-sm"
                      style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-red)' }}
                    >
                      {displayError}
                      {displayError.includes('не подтверждён') && (
                        <div className="mt-2">
                          <Link to="/forgot-password" className="underline text-xs" style={{ color: 'var(--accent-blue)' }}>
                            Запросить новое письмо
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Кнопка */}
                <button type="submit" disabled={isLoading}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 mt-2 hover:opacity-90"
                  style={{
                    background: isLoading ? 'var(--bg-surface)' : 'var(--accent-gold)',
                    color: isLoading ? 'var(--text-muted)' : '#07090F',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      {mode === 'login' ? 'Входим...' : 'Регистрируем...'}
                    </span>
                  ) : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Link to="/" className="hover:underline transition-colors" style={{ color: 'var(--accent-blue)' }}>
            ← На главную
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
