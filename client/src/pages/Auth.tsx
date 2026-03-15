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

  // Если уже авторизован — в ЛК
  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  // Сбрасываем ошибки при смене режима
  useEffect(() => {
    clearError();
    setLocalError('');
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
        if (!form.name.trim()) {
          setLocalError('Введите ваше имя');
          return;
        }
        await register({ email: form.email, password: form.password, name: form.name });
      } else {
        await login({ email: form.email, password: form.password });
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      // Ошибка уже в стор
    }
  };

  const displayError = localError || error;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg-deep)' }}
    >
      {/* Фоновое свечение */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        {/* Логотип */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span
              className="text-3xl font-bold tracking-tight"
              style={{ color: 'var(--accent-gold)' }}
            >
              🏆 Викторина
            </span>
            <span className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {' '}Чемпионов
            </span>
          </Link>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Платформа для умных викторин
          </p>
        </div>

        {/* Карточка */}
        <div
          className="rounded-2xl p-8 shadow-2xl"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Переключатель режима */}
          <div
            className="flex rounded-xl p-1 mb-8"
            style={{ background: 'var(--bg-surface)' }}
          >
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: mode === m ? 'var(--accent-blue)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--text-muted)',
                }}
              >
                {m === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          {/* Форма */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'login' ? 12 : -12 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Имя — только для регистрации */}
              {mode === 'register' && (
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Ваше имя
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Как вас зовут?"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent-blue)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent-blue)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>

              {/* Пароль */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Пароль
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder={mode === 'register' ? 'Минимум 6 символов' : '••••••••'}
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent-blue)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>

              {/* Ошибка */}
              <AnimatePresence>
                {displayError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl px-4 py-3 text-sm"
                    style={{
                      background: 'rgba(239,68,68,0.12)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      color: 'var(--accent-red)',
                    }}
                  >
                    {displayError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Кнопка отправки */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 mt-2"
                style={{
                  background: isLoading ? 'var(--bg-surface)' : 'var(--accent-gold)',
                  color: isLoading ? 'var(--text-muted)' : '#07090F',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transform: isLoading ? 'none' : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!isLoading)
                    (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.filter = '';
                }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    {mode === 'login' ? 'Входим...' : 'Регистрируем...'}
                  </span>
                ) : mode === 'login' ? (
                  'Войти'
                ) : (
                  'Создать аккаунт'
                )}
              </button>
            </motion.form>
          </AnimatePresence>
        </div>

        {/* Ссылка на главную */}
        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Link
            to="/"
            className="hover:underline transition-colors"
            style={{ color: 'var(--accent-blue)' }}
          >
            ← На главную
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
