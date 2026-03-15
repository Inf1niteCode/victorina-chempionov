import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { themesApi, ThemeInfo } from '../api/themes';
import { paymentsApi } from '../api/payments';

const CATEGORY_ORDER = ['ИСТОРИЯ', 'НАУКА', 'КУЛЬТУРА', 'СПОРТ', 'ГЕОГРАФИЯ'];

const CATEGORY_META: Record<string, { icon: string; color: string; bg: string }> = {
  ИСТОРИЯ: { icon: '⚔️', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  НАУКА:   { icon: '🔬', color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
  КУЛЬТУРА:{ icon: '🎭', color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
  СПОРТ:   { icon: '⚽', color: '#34D399', bg: 'rgba(52,211,153,0.1)' },
  ГЕОГРАФИЯ:{ icon: '🌍', color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
};

export default function Store() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [themes, setThemes] = useState<ThemeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);

  // Флаги из Stripe redirect
  const success = searchParams.get('success') === '1';
  const cancelled = searchParams.get('cancelled') === '1';
  const successThemeId = searchParams.get('theme');

  useEffect(() => {
    themesApi.getAll()
      .then(setThemes)
      .catch(() => setError('Не удалось загрузить темы'))
      .finally(() => setIsLoading(false));
  }, []);

  // Если вернулись после успешной оплаты — перезагружаем темы
  useEffect(() => {
    if (success) {
      setTimeout(() => {
        themesApi.getAll().then(setThemes).catch(() => {});
      }, 1500);
    }
  }, [success]);

  const handleBuy = async (theme: ThemeInfo) => {
    if (theme.isPurchased || buyingId) return;
    setBuyingId(theme.id);
    setError('');
    try {
      const url = await paymentsApi.checkout(theme.id);
      window.location.href = url;
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Ошибка оплаты. Попробуйте снова.');
      setBuyingId(null);
    }
  };

  const filtered = activeCategory
    ? themes.filter((t) => t.category === activeCategory)
    : themes;

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    meta: CATEGORY_META[cat],
    themes: filtered.filter((t) => t.category === cat),
  })).filter((g) => g.themes.length > 0);

  const totalPurchased = themes.filter((t) => t.isPurchased && !t.isFree).length;
  const totalPaid = themes.filter((t) => !t.isFree).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>

      {/* ── Шапка ── */}
      <header className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}>
            ← Назад
          </button>
          <div>
            <h1 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              🛒 Магазин тем
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {totalPurchased} из {totalPaid} куплено
            </p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--accent-gold)', border: '1px solid rgba(245,158,11,0.25)' }}>
          100 ₽ / тема
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">

        {/* ── Уведомление об успехе ── */}
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl px-5 py-4 flex items-center gap-3"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)' }}>
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--accent-green)' }}>
                  Оплата прошла успешно!
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Тема разблокирована и доступна при создании игры
                </p>
              </div>
            </motion.div>
          )}
          {cancelled && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl px-5 py-4 flex items-center gap-3"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <span className="text-2xl">↩️</span>
              <p className="text-sm" style={{ color: 'var(--accent-red)' }}>
                Оплата отменена. Тема не куплена.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Общая ошибка ── */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-red)' }}>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Прогресс покупок ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Прогресс разблокировки
            </span>
            <span className="text-sm font-bold" style={{ color: 'var(--accent-gold)' }}>
              {totalPurchased} / {totalPaid}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, var(--accent-gold), #f97316)' }}
              animate={{ width: `${(totalPurchased / totalPaid) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              10 бесплатных тем уже доступны
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Осталось: {totalPaid - totalPurchased} тем · {(totalPaid - totalPurchased) * 100} ₽
            </span>
          </div>
        </motion.div>

        {/* ── Фильтр по категориям ── */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCategory(null)}
            className="px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-all"
            style={{
              background: !activeCategory ? 'var(--accent-blue)' : 'var(--bg-surface)',
              color: !activeCategory ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${!activeCategory ? 'var(--accent-blue)' : 'var(--border)'}`,
            }}>
            Все
          </button>
          {CATEGORY_ORDER.map((cat) => {
            const meta = CATEGORY_META[cat];
            return (
              <button key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className="px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-all flex items-center gap-1.5"
                style={{
                  background: activeCategory === cat ? meta.bg : 'var(--bg-surface)',
                  color: activeCategory === cat ? meta.color : 'var(--text-muted)',
                  border: `1px solid ${activeCategory === cat ? meta.color + '60' : 'var(--border)'}`,
                }}>
                <span>{meta.icon}</span>
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* ── Темы по категориям ── */}
        {grouped.map(({ cat, meta, themes: catThemes }) => (
          <motion.section key={cat} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {/* Заголовок категории */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{meta.icon}</span>
              <h2 className="font-bold text-sm uppercase tracking-wide" style={{ color: meta.color }}>
                {cat}
              </h2>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {catThemes.filter((t) => t.isPurchased).length}/{catThemes.length}
              </span>
            </div>

            <div className="space-y-2">
              {catThemes.map((theme, i) => {
                const isExpanded = expandedTheme === theme.id;
                const isBuying = buyingId === theme.id;

                return (
                  <motion.div key={theme.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: 'var(--bg-card)',
                      border: `1px solid ${theme.isPurchased ? meta.color + '30' : 'var(--border)'}`,
                    }}>

                    {/* Основная строка */}
                    <div className="flex items-center gap-3 px-4 py-3">

                      {/* Иконка статуса */}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                        style={{
                          background: theme.isPurchased
                            ? (theme.isFree ? 'rgba(16,185,129,0.15)' : meta.bg)
                            : 'var(--bg-surface)',
                          border: `1px solid ${theme.isPurchased
                            ? (theme.isFree ? 'rgba(16,185,129,0.3)' : meta.color + '40')
                            : 'var(--border)'}`,
                        }}>
                        {theme.isFree ? '🎁' : theme.isPurchased ? '✅' : '🔒'}
                      </div>

                      {/* Название + метки */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                            {theme.name}
                          </span>
                          {theme.isFree && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)', border: '1px solid rgba(16,185,129,0.3)' }}>
                              Бесплатно
                            </span>
                          )}
                          {!theme.isFree && theme.isPurchased && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}40` }}>
                              Куплено
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          5 вопросов · 100–500 очков
                        </p>
                      </div>

                      {/* Кнопка / Цена */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Кнопка просмотра вопросов */}
                        <button
                          onClick={() => setExpandedTheme(isExpanded ? null : theme.id)}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all"
                          style={{
                            background: 'var(--bg-surface)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border)',
                          }}>
                          {isExpanded ? '▲' : '▼'}
                        </button>

                        {/* Кнопка купить или статус */}
                        {!theme.isPurchased && !theme.isFree ? (
                          <button
                            onClick={() => handleBuy(theme)}
                            disabled={!!buyingId}
                            className="px-4 py-1.5 rounded-xl text-sm font-bold transition-all"
                            style={{
                              background: isBuying
                                ? 'var(--bg-surface)'
                                : 'linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)',
                              color: isBuying ? 'var(--text-muted)' : '#07090F',
                              cursor: buyingId ? 'not-allowed' : 'pointer',
                              minWidth: 80,
                            }}>
                            {isBuying ? (
                              <span className="flex items-center gap-1.5 justify-center">
                                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                ...
                              </span>
                            ) : '100 ₽'}
                          </button>
                        ) : theme.isPurchased && !theme.isFree ? (
                          <span className="text-xs px-3 py-1.5 rounded-xl"
                            style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                            ✓ Есть
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Раскрытые вопросы */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ borderTop: '1px solid var(--border)', overflow: 'hidden' }}>
                          <div className="px-4 py-3 space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide mb-2"
                              style={{ color: 'var(--text-muted)' }}>
                              Вопросы
                            </p>
                            {theme.questions.map((q) => (
                              <div key={q.id} className="flex items-start gap-3">
                                <span className="text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0"
                                  style={{
                                    background: 'var(--bg-surface)',
                                    color: 'var(--accent-gold)',
                                    border: '1px solid var(--border)',
                                    minWidth: 40,
                                    textAlign: 'center',
                                  }}>
                                  {q.points}
                                </span>
                                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                  {theme.isPurchased || theme.isFree
                                    ? q.text
                                    : '••••••••••••••••••'}
                                </span>
                              </div>
                            ))}
                            {!theme.isPurchased && !theme.isFree && (
                              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                                Купите тему, чтобы увидеть все вопросы
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        ))}

        {/* ── Пояснение про оплату ── */}
        <div className="rounded-2xl p-5 text-sm space-y-2"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>ℹ️ Как это работает</p>
          <p style={{ color: 'var(--text-muted)' }}>
            Каждая платная тема стоит <strong style={{ color: 'var(--accent-gold)' }}>100 ₽</strong> — разовая покупка. После оплаты тема навсегда в вашем аккаунте и доступна во всех играх.
          </p>
          <p style={{ color: 'var(--text-muted)' }}>
            Оплата через Stripe. Принимаются карты Visa, Mastercard, МИР.
          </p>
        </div>

        <div className="pb-8" />
      </div>
    </div>
  );
}
