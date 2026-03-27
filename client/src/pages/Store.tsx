import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { themesApi, ThemeInfo } from '../api/themes';
import { paymentsApi } from '../api/payments';

const CATEGORY_ORDER = [
  'ИСТОРИЯ', 'НАУКА', 'КУЛЬТУРА', 'СПОРТ', 'ГЕОГРАФИЯ',
  'ТЕХНОЛОГИИ', 'ВИДЕОИГРЫ', 'МИФОЛОГИЯ', 'ЕДА', 'МУЗЫКА',
  'КИНО', 'ПУТЕШЕСТВИЯ', 'БИЗНЕС', 'ИНТЕРНЕТ', 'АВТОМОБИЛИ',
  'ЖИВОТНЫЕ', 'ЛЮДИ И СТРАНЫ', 'ПРАЗДНИКИ МИРА', 'РАСТЕНИЯ',
];

const CATEGORY_META: Record<string, { icon: string; color: string; bg: string }> = {
  ИСТОРИЯ:         { icon: '⚔️',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  НАУКА:           { icon: '🔬',  color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
  КУЛЬТУРА:        { icon: '🎭',  color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
  СПОРТ:           { icon: '⚽',  color: '#34D399', bg: 'rgba(52,211,153,0.1)' },
  ГЕОГРАФИЯ:       { icon: '🌍',  color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
  ТЕХНОЛОГИИ:      { icon: '💻',  color: '#38BDF8', bg: 'rgba(56,189,248,0.1)' },
  ВИДЕОИГРЫ:       { icon: '🎮',  color: '#C084FC', bg: 'rgba(192,132,252,0.1)' },
  МИФОЛОГИЯ:       { icon: '⚡',  color: '#2DD4BF', bg: 'rgba(45,212,191,0.1)' },
  ЕДА:             { icon: '🍕',  color: '#FB923C', bg: 'rgba(251,146,60,0.1)' },
  МУЗЫКА:          { icon: '🎵',  color: '#F472B6', bg: 'rgba(244,114,182,0.1)' },
  КИНО:            { icon: '🎬',  color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
  ПУТЕШЕСТВИЯ:     { icon: '✈️',  color: '#22D3EE', bg: 'rgba(34,211,238,0.1)' },
  БИЗНЕС:          { icon: '💼',  color: '#A3E635', bg: 'rgba(163,230,53,0.1)' },
  ИНТЕРНЕТ:        { icon: '🌐',  color: '#818CF8', bg: 'rgba(129,140,248,0.1)' },
  АВТОМОБИЛИ:      { icon: '🚗',  color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' },
  ЖИВОТНЫЕ:        { icon: '🦁',  color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  'ЛЮДИ И СТРАНЫ': { icon: '🌏',  color: '#4ADE80', bg: 'rgba(74,222,128,0.1)' },
  'ПРАЗДНИКИ МИРА':{ icon: '🎉',  color: '#E879F9', bg: 'rgba(232,121,249,0.1)' },
  РАСТЕНИЯ:        { icon: '🌿',  color: '#86EFAC', bg: 'rgba(134,239,172,0.1)' },
};

type StoreTab = 'themes' | 'bundles';
type CartTheme  = { type: 'theme';  themeId: string };
type CartBundle = { type: 'bundle'; category: string; themeIds: string[] };
type CartItem   = CartTheme | CartBundle;

export default function Store() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [themes, setThemes] = useState<ThemeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [buyingCart, setBuyingCart] = useState(false);
  const [bundleSelections, setBundleSelections] = useState<Record<string, string[]>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const [tab, setTab] = useState<StoreTab>('themes');

  const success = searchParams.get('success') === '1';
  const cancelled = searchParams.get('cancelled') === '1';
  const successBundle = searchParams.get('bundle');
  const successCart = searchParams.get('cart') === '1';

  useEffect(() => {
    themesApi.getAll()
      .then(setThemes)
      .catch(() => setError('Не удалось загрузить темы'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (success) {
      // Switch to bundles tab if bundle was purchased
      if (successBundle) setTab('bundles');
      setTimeout(() => {
        themesApi.getAll().then(setThemes).catch(() => {});
      }, 1500);
    }
  }, [success, successBundle]);


  const BUNDLE_MIN = 3;
  const BUNDLE_MAX = 5;

  const toggleThemeInBundle = (cat: string, themeId: string) => {
    setBundleSelections((prev) => {
      const current = prev[cat] ?? [];
      if (current.includes(themeId)) {
        return { ...prev, [cat]: current.filter((id) => id !== themeId) };
      }
      if (current.length >= BUNDLE_MAX) return prev;
      return { ...prev, [cat]: [...current, themeId] };
    });
  };

  // Все ID тем, уже лежащие в корзине (для дедупликации)
  const cartThemeIds = new Set(
    cart.flatMap((item) => item.type === 'theme' ? [item.themeId] : item.themeIds)
  );

  // Суммарная стоимость корзины
  const cartTotal = cart.reduce(
    (sum, item) => sum + (item.type === 'theme' ? 100 : item.themeIds.length * 80), 0
  );

  // Количество тем в корзине (для бейджа)
  const cartThemeCount = cartThemeIds.size;

  const toggleThemeCart = (themeId: string) => {
    setCart((prev) => {
      const exists = prev.some((i) => i.type === 'theme' && i.themeId === themeId);
      if (exists) return prev.filter((i) => !(i.type === 'theme' && i.themeId === themeId));
      return [...prev, { type: 'theme', themeId }];
    });
  };

  const addBundleToCart = (cat: string) => {
    const selected = bundleSelections[cat] ?? [];
    if (selected.length < BUNDLE_MIN) return;
    setCart((prev) => {
      // Заменяем существующий набор этой категории, если есть
      const filtered = prev.filter((i) => !(i.type === 'bundle' && i.category === cat));
      return [...filtered, { type: 'bundle', category: cat, themeIds: selected }];
    });
    setCartOpen(true);
  };

  const removeBundleFromCart = (cat: string) => {
    setCart((prev) => prev.filter((i) => !(i.type === 'bundle' && i.category === cat)));
  };

  const handleCheckoutCart = async () => {
    if (!cart.length || buyingCart) return;
    setBuyingCart(true);
    setError('');
    try {
      const items = cart.map((item) => ({
        type: item.type,
        themeIds: item.type === 'theme' ? [item.themeId] : item.themeIds,
      }));
      const url = await paymentsApi.checkoutCart(items);
      window.location.href = url;
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Ошибка оплаты корзины. Попробуйте снова.');
      setBuyingCart(false);
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

  // Bundle data per category
  const bundles = CATEGORY_ORDER.map((cat) => {
    const meta = CATEGORY_META[cat];
    const all = themes.filter((t) => t.category === cat);
    const paid = all.filter((t) => !t.isFree);
    const free = all.filter((t) => t.isFree);
    const purchased = paid.filter((t) => t.isPurchased);
    const unpurchased = paid.filter((t) => !t.isPurchased);
    const bundlePrice = unpurchased.length * 80; // 80 ₽/тема
    const fullPrice = unpurchased.length * 100;
    const allBought = unpurchased.length === 0;
    return { cat, meta, all, paid, free, purchased, unpurchased, bundlePrice, fullPrice, allBought };
  });

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
      <header className="sticky top-0 z-20 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}>
            ← Назад
          </button>
          <h1 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            🛒 Магазин тем
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: cartThemeCount > 0 ? 'rgba(59,130,246,0.15)' : 'var(--bg-surface)',
              color: cartThemeCount > 0 ? 'var(--accent-blue)' : 'var(--text-muted)',
              border: `1px solid ${cartThemeCount > 0 ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
            }}>
            🛒
            {cartThemeCount > 0 && (
              <span className="font-bold">{cartThemeCount}</span>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 space-y-6">

        {/* ── Уведомления ── */}
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
                  {successBundle
                    ? `Набор «${successBundle}» разблокирован`
                    : successCart
                    ? 'Все темы из корзины разблокированы'
                    : 'Тема разблокирована и доступна при создании игры'}
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
                Оплата отменена.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-red)' }}>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Табы: Темы / Наборы ── */}
        <div className="flex rounded-2xl p-1 gap-1"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {([['themes', '🗂️ Темы'], ['bundles', '📦 Наборы']] as [StoreTab, string][]).map(([t, label]) => (
            <button key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: tab === t ? 'var(--accent-blue)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--text-muted)',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            ТАБ: ТЕМЫ
        ══════════════════════════════════════════ */}
        {tab === 'themes' && (
          <>
            {/* Фильтр по категориям */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory(null)}
                className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
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
                    className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5"
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

            {/* Сетка карточек */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {grouped.flatMap(({ cat, meta, themes: catThemes }) =>
                catThemes.map((theme, i) => {
                  const inCart = cartThemeIds.has(theme.id);
                  const isExpanded = expandedTheme === theme.id;
                  return (
                    <motion.div
                      key={theme.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="rounded-2xl overflow-hidden flex flex-col"
                      style={{
                        background: 'var(--bg-card)',
                        border: `1px solid ${theme.isPurchased && !theme.isFree ? meta.color + '40' : inCart ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
                      }}
                    >
                      {/* Шапка карточки с цветом категории */}
                      <div className="px-3 pt-4 pb-3 flex flex-col items-center text-center"
                        style={{ background: meta.bg, borderBottom: `1px solid ${meta.color}20` }}>
                        <span className="text-3xl mb-1">{meta.icon}</span>
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: meta.color }}>
                          {cat}
                        </span>
                      </div>

                      {/* Тело карточки */}
                      <div className="flex flex-col flex-1 p-3 gap-2">
                        <p className="font-semibold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>
                          {theme.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          5 вопросов · 100–500 очков
                        </p>

                        {/* Бейдж статуса */}
                        {theme.isFree ? (
                          <span className="text-xs px-2 py-0.5 rounded-full self-start"
                            style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)', border: '1px solid rgba(16,185,129,0.3)' }}>
                            Бесплатно
                          </span>
                        ) : theme.isPurchased ? (
                          <span className="text-xs px-2 py-0.5 rounded-full self-start"
                            style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}40` }}>
                            ✓ Куплено
                          </span>
                        ) : (
                          <span className="text-sm font-bold" style={{ color: 'var(--accent-gold)' }}>
                            100 ₽
                          </span>
                        )}

                        {/* Кнопка показа вопросов */}
                        <button
                          onClick={() => setExpandedTheme(isExpanded ? null : theme.id)}
                          className="text-xs mt-auto transition-all"
                          style={{ color: 'var(--text-muted)' }}>
                          {isExpanded ? '▲ Скрыть вопросы' : '▼ Показать вопросы'}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ overflow: 'hidden' }}>
                              <div className="space-y-1.5 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                                {theme.questions.map((q) => (
                                  <div key={q.id} className="flex items-start gap-2">
                                    <span className="text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                                      style={{ background: 'var(--bg-surface)', color: 'var(--accent-gold)', border: '1px solid var(--border)', minWidth: 36, textAlign: 'center' }}>
                                      {q.points}
                                    </span>
                                    <span className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>
                                      {theme.isPurchased || theme.isFree ? q.text : '••••••••••••'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Кнопка в корзину */}
                        {!theme.isFree && !theme.isPurchased && (
                          <button
                            onClick={() => toggleThemeCart(theme.id)}
                            className="w-full py-2 rounded-xl text-sm font-bold transition-all mt-1"
                            style={{
                              background: inCart ? 'rgba(59,130,246,0.15)' : 'linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)',
                              color: inCart ? 'var(--accent-blue)' : '#07090F',
                              border: inCart ? '1px solid rgba(59,130,246,0.4)' : 'none',
                            }}>
                            {inCart ? '✓ В корзине' : '+ В корзину'}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════
            ТАБ: НАБОРЫ
        ══════════════════════════════════════════ */}
        {tab === 'bundles' && (
          <>
            {/* Пояснение про наборы */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl px-5 py-4 flex items-start gap-3"
              style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)' }}>
              <span className="text-xl mt-0.5">💡</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--accent-blue)' }}>
                  Собирайте свой набор
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Выберите от <strong style={{ color: 'var(--accent-gold)' }}>3 до 5 тем</strong> из любой категории и купите их за{' '}
                  <strong style={{ color: 'var(--accent-gold)' }}>80 ₽/тема</strong> вместо 100 ₽. Экономия 20%.
                </p>
              </div>
            </motion.div>

            {/* Карточки наборов */}
            <div className="space-y-4">
              {bundles.map(({ cat, meta, paid, free, purchased, unpurchased }, idx) => {
                const selected = bundleSelections[cat] ?? [];
                const bundleInCart = cart.some((i) => i.type === 'bundle' && i.category === cat);
                const progress = paid.length > 0 ? (purchased.length / paid.length) * 100 : 0;
                const allBought = unpurchased.length === 0 && paid.length > 0;
                const selectionPrice = selected.length * 80;
                const selectionFullPrice = selected.length * 100;

                return (
                  <motion.div key={cat}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.07 }}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: 'var(--bg-card)',
                      border: `1px solid ${allBought ? meta.color + '40' : selected.length >= BUNDLE_MIN ? meta.color + '50' : 'var(--border)'}`,
                    }}>

                    {/* Шапка карточки */}
                    <div className="px-5 pt-5 pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                            style={{ background: meta.bg, border: `1px solid ${meta.color}40` }}>
                            {meta.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                              {cat}
                            </h3>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {paid.length} платных · {free.length} бесплатных
                            </p>
                          </div>
                        </div>

                        {/* Счётчик выбора / статус */}
                        {allBought ? (
                          <div className="px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
                            style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}40` }}>
                            ✓ Всё куплено
                          </div>
                        ) : (
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>
                              Выбрано
                            </div>
                            <div className="flex items-center gap-1 justify-end">
                              {[...Array(BUNDLE_MAX)].map((_, i) => (
                                <div key={i} className="w-3 h-3 rounded-full"
                                  style={{
                                    background: i < selected.length ? meta.color : 'var(--bg-surface)',
                                    border: `1px solid ${i < selected.length ? meta.color : 'var(--border)'}`,
                                  }} />
                              ))}
                            </div>
                            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                              {selected.length} / {BUNDLE_MAX}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Прогресс-бар купленных */}
                      {paid.length > 0 && purchased.length > 0 && (
                        <div className="mt-3">
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
                            <motion.div className="h-full rounded-full"
                              style={{ background: `linear-gradient(90deg, ${meta.color}, ${meta.color}99)` }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.7, ease: 'easeOut' }} />
                          </div>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            Куплено {purchased.length} из {paid.length} платных
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Список тем с чекбоксами */}
                    <div className="px-5 pb-5">
                      <div className="grid grid-cols-1 gap-1.5 mb-4">
                        {paid.map((theme) => {
                          const isChecked = selected.includes(theme.id);
                          const isDisabled = theme.isPurchased || (selected.length >= BUNDLE_MAX && !isChecked) || allBought;

                          return (
                            <button
                              key={theme.id}
                              onClick={() => !theme.isPurchased && toggleThemeInBundle(cat, theme.id)}
                              disabled={isDisabled}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left w-full transition-all"
                              style={{
                                background: isChecked
                                  ? meta.bg
                                  : theme.isPurchased
                                  ? 'var(--bg-surface)'
                                  : 'var(--bg-surface)',
                                border: `1px solid ${isChecked ? meta.color + '50' : 'var(--border)'}`,
                                cursor: isDisabled ? (theme.isPurchased ? 'default' : 'not-allowed') : 'pointer',
                                opacity: !theme.isPurchased && selected.length >= BUNDLE_MAX && !isChecked ? 0.5 : 1,
                              }}>
                              {/* Checkbox */}
                              <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                                style={{
                                  background: theme.isPurchased
                                    ? 'rgba(16,185,129,0.2)'
                                    : isChecked
                                    ? meta.color
                                    : 'var(--bg-card)',
                                  border: `1.5px solid ${theme.isPurchased ? 'rgba(16,185,129,0.5)' : isChecked ? meta.color : 'var(--border)'}`,
                                }}>
                                {theme.isPurchased
                                  ? <span className="text-xs">✓</span>
                                  : isChecked
                                  ? <span className="text-xs text-white font-bold">✓</span>
                                  : null}
                              </div>

                              <span className="text-sm flex-1"
                                style={{ color: theme.isPurchased ? 'var(--text-muted)' : isChecked ? meta.color : 'var(--text-primary)' }}>
                                {theme.name}
                              </span>

                              {theme.isPurchased ? (
                                <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                                  style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)', border: '1px solid rgba(16,185,129,0.3)' }}>
                                  Есть
                                </span>
                              ) : (
                                <span className="text-xs flex-shrink-0" style={{ color: isChecked ? meta.color : 'var(--text-muted)' }}>
                                  80 ₽
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Итог и кнопка */}
                      {!allBought && (
                        <AnimatePresence mode="wait">
                          {selected.length >= BUNDLE_MIN ? (
                            <motion.div key="buy"
                              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                              {/* Итог */}
                              <div className="flex items-center justify-between mb-3 px-1">
                                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                  {selected.length} тем × 80 ₽
                                </span>
                                <div className="text-right">
                                  <span className="font-bold text-base" style={{ color: 'var(--accent-gold)' }}>
                                    {selectionPrice} ₽
                                  </span>
                                  <span className="text-xs ml-2 line-through" style={{ color: 'var(--text-muted)' }}>
                                    {selectionFullPrice} ₽
                                  </span>
                                  <span className="text-xs ml-1.5 font-medium" style={{ color: 'var(--accent-green)' }}>
                                    −20%
                                  </span>
                                </div>
                              </div>
                              {bundleInCart ? (
                                <button
                                  onClick={() => removeBundleFromCart(cat)}
                                  className="w-full py-3 rounded-2xl text-sm font-bold transition-all"
                                  style={{
                                    background: 'rgba(59,130,246,0.12)',
                                    color: 'var(--accent-blue)',
                                    border: '1px solid rgba(59,130,246,0.35)',
                                  }}>
                                  ✓ В корзине — убрать
                                </button>
                              ) : (
                                <button
                                  onClick={() => addBundleToCart(cat)}
                                  className="w-full py-3 rounded-2xl text-sm font-bold transition-all"
                                  style={{
                                    background: `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}bb 100%)`,
                                    color: '#07090F',
                                  }}>
                                  🛒 В корзину · {selectionPrice} ₽
                                </button>
                              )}
                            </motion.div>
                          ) : (
                            <motion.div key="hint"
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="text-center py-3 rounded-2xl text-sm"
                              style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                              Выберите от {BUNDLE_MIN} до {BUNDLE_MAX} тем
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}

                      {allBought && (
                        <div className="w-full py-3 rounded-2xl text-sm font-bold text-center"
                          style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                          Все темы уже в вашей коллекции
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        <div className="pb-8" />
      </div>

      {/* ══════════════════════════════════════════
          КОРЗИНА — drawer справа
      ══════════════════════════════════════════ */}
      <AnimatePresence>
        {cartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="cart-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 z-30"
              style={{ background: 'rgba(0,0,0,0.5)' }}
            />

            {/* Drawer */}
            <motion.div
              key="cart-drawer"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full z-40 flex flex-col w-full max-w-sm"
              style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border)' }}>

              {/* Шапка */}
              <div className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: 'var(--border)' }}>
                <div>
                  <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                    🛒 Корзина
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {cart.length === 0 ? 'Пусто' : `${cart.length} ${cart.length === 1 ? 'тема' : cart.length < 5 ? 'темы' : 'тем'}`}
                  </p>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-lg transition-all hover:opacity-70"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                  ✕
                </button>
              </div>

              {/* Список тем в корзине */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <div className="text-5xl opacity-30">🛒</div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Добавьте темы из каталога
                    </p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {cart.map((item) => {
                      if (item.type === 'theme') {
                        const theme = themes.find((t) => t.id === item.themeId);
                        if (!theme) return null;
                        const meta = CATEGORY_META[theme.category];
                        return (
                          <motion.div key={item.themeId}
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                            <span className="text-base flex-shrink-0">{meta?.icon ?? '📚'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                {theme.name}
                              </p>
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {theme.category}
                              </p>
                            </div>
                            <span className="text-sm font-bold flex-shrink-0" style={{ color: 'var(--accent-gold)' }}>
                              100 ₽
                            </span>
                            <button
                              onClick={() => toggleThemeCart(item.themeId)}
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0 transition-all hover:opacity-70"
                              style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                              ✕
                            </button>
                          </motion.div>
                        );
                      }

                      // bundle item
                      const meta = CATEGORY_META[item.category];
                      const bundlePrice = item.themeIds.length * 80;
                      return (
                        <motion.div key={`bundle-${item.category}`}
                          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="rounded-xl overflow-hidden"
                          style={{ border: `1px solid ${meta?.color ?? 'var(--border)'}40` }}>
                          {/* Шапка набора */}
                          <div className="flex items-center gap-2.5 px-3 py-2.5"
                            style={{ background: meta?.bg ?? 'var(--bg-surface)' }}>
                            <span className="text-base flex-shrink-0">{meta?.icon ?? '📦'}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  Набор «{item.category}»
                                </p>
                                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                  style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)', border: '1px solid rgba(16,185,129,0.3)' }}>
                                  −20%
                                </span>
                              </div>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {item.themeIds.length} тем × 80 ₽ = {bundlePrice} ₽
                              </p>
                            </div>
                            <button
                              onClick={() => removeBundleFromCart(item.category)}
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0 transition-all hover:opacity-70"
                              style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                              ✕
                            </button>
                          </div>
                          {/* Список тем набора */}
                          <div className="px-3 py-2 space-y-1" style={{ background: 'var(--bg-surface)' }}>
                            {item.themeIds.map((tid) => {
                              const t = themes.find((x) => x.id === tid);
                              return (
                                <p key={tid} className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  · {t?.name ?? tid}
                                </p>
                              );
                            })}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>

              {/* Итог и кнопка оплаты */}
              {cart.length > 0 && (
                <div className="p-4 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Итого {cartThemeCount} {cartThemeCount === 1 ? 'тема' : cartThemeCount < 5 ? 'темы' : 'тем'}
                    </span>
                    <span className="text-xl font-bold" style={{ color: 'var(--accent-gold)' }}>
                      {cartTotal} ₽
                    </span>
                  </div>
                  <button
                    onClick={handleCheckoutCart}
                    disabled={buyingCart}
                    className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all"
                    style={{
                      background: buyingCart
                        ? 'var(--bg-surface)'
                        : 'linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)',
                      color: buyingCart ? 'var(--text-muted)' : '#07090F',
                      cursor: buyingCart ? 'not-allowed' : 'pointer',
                    }}>
                    {buyingCart ? (
                      <span className="flex items-center gap-2 justify-center">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Перенаправление...
                      </span>
                    ) : `Оплатить · ${cartTotal} ₽`}
                  </button>
                  <button
                    onClick={() => setCart([])}
                    className="w-full py-2 rounded-xl text-xs transition-all hover:opacity-70"
                    style={{ color: 'var(--text-muted)' }}>
                    Очистить корзину
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
