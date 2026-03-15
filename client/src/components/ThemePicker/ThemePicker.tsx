import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { ThemeInfo } from '../../api/themes';

const CATEGORY_ORDER = [
  'ИСТОРИЯ', 'НАУКА', 'КУЛЬТУРА', 'СПОРТ', 'ГЕОГРАФИЯ',
  'ТЕХНОЛОГИИ', 'ВИДЕОИГРЫ', 'МИФОЛОГИЯ', 'ЕДА', 'МУЗЫКА',
  'КИНО', 'ПУТЕШЕСТВИЯ', 'БИЗНЕС', 'ИНТЕРНЕТ', 'АВТОМОБИЛИ',
  'ЖИВОТНЫЕ', 'ЛЮДИ И СТРАНЫ', 'ПРАЗДНИКИ МИРА', 'РАСТЕНИЯ',
];

const CATEGORY_ICONS: Record<string, string> = {
  ИСТОРИЯ:          '⚔️',
  НАУКА:            '🔬',
  КУЛЬТУРА:         '🎭',
  СПОРТ:            '⚽',
  ГЕОГРАФИЯ:        '🌍',
  ТЕХНОЛОГИИ:       '💻',
  ВИДЕОИГРЫ:        '🎮',
  МИФОЛОГИЯ:        '⚡',
  ЕДА:              '🍕',
  МУЗЫКА:           '🎵',
  КИНО:             '🎬',
  ПУТЕШЕСТВИЯ:      '✈️',
  БИЗНЕС:           '💼',
  ИНТЕРНЕТ:         '🌐',
  АВТОМОБИЛИ:       '🚗',
  ЖИВОТНЫЕ:         '🦁',
  'ЛЮДИ И СТРАНЫ':  '🌏',
  'ПРАЗДНИКИ МИРА': '🎉',
  РАСТЕНИЯ:         '🌿',
};

const LS_KEY = 'theme_favorites';

type FilterMode = 'all' | 'purchased' | 'favorites';

interface Props {
  tourNumber: number;
  themes: ThemeInfo[];
  selected: string[];
  usedInOtherTours: string[];
  onChange: (ids: string[]) => void;
}

export default function ThemePicker({
  tourNumber,
  themes,
  selected,
  usedInOtherTours,
  onChange,
}: Props) {
  const MAX = 5;

  const [filter, setFilter] = useState<FilterMode>('all');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  // Синхронизируем favorites → localStorage
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify([...favorites]));
  }, [favorites]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggle = (themeId: string, accessible: boolean) => {
    if (!accessible) return;
    if (usedInOtherTours.includes(themeId)) return;
    if (selected.includes(themeId)) {
      onChange(selected.filter((id) => id !== themeId));
    } else {
      if (selected.length >= MAX) return;
      onChange([...selected, themeId]);
    }
  };

  // Фильтрация
  const visibleThemes = themes.filter((t) => {
    if (filter === 'purchased') return t.isPurchased;
    if (filter === 'favorites') return favorites.has(t.id);
    return true;
  });

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    themes: visibleThemes.filter((t) => t.category === cat),
  })).filter((g) => g.themes.length > 0);

  const FILTERS: { mode: FilterMode; label: string; icon: string }[] = [
    { mode: 'all',       label: 'Все темы',   icon: '🗂️' },
    { mode: 'purchased', label: 'Купленные',  icon: '✅' },
    { mode: 'favorites', label: 'Избранные',  icon: '⭐' },
  ];

  return (
    <div className="space-y-5">

      {/* Прогресс */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          Тур {tourNumber} — выберите ровно 5 тем
        </span>
        <span
          className="text-sm font-bold px-3 py-1 rounded-full"
          style={{
            background: selected.length === MAX
              ? 'rgba(16,185,129,0.15)'
              : 'rgba(245,158,11,0.15)',
            color: selected.length === MAX
              ? 'var(--accent-green)'
              : 'var(--accent-gold)',
            border: `1px solid ${selected.length === MAX
              ? 'rgba(16,185,129,0.3)'
              : 'rgba(245,158,11,0.3)'}`,
          }}
        >
          {selected.length} / {MAX}
        </span>
      </div>

      {/* Полоса прогресса */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{
            background: selected.length === MAX ? 'var(--accent-green)' : 'var(--accent-gold)',
          }}
          animate={{ width: `${(selected.length / MAX) * 100}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        />
      </div>

      {/* ── Фильтры ── */}
      <div className="flex gap-2">
        {FILTERS.map(({ mode, label, icon }) => {
          const active = filter === mode;
          const count =
            mode === 'purchased'
              ? themes.filter((t) => t.isPurchased).length
              : mode === 'favorites'
              ? favorites.size
              : themes.length;
          return (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex-shrink-0"
              style={{
                background: active ? 'rgba(59,130,246,0.15)' : 'var(--bg-surface)',
                color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
                border: `1px solid ${active ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
              }}
            >
              <span>{icon}</span>
              <span>{label}</span>
              <span
                className="px-1.5 py-0.5 rounded-full text-xs"
                style={{
                  background: active ? 'rgba(59,130,246,0.2)' : 'var(--bg-card)',
                  color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Пустое состояние */}
      {grouped.length === 0 && (
        <div
          className="rounded-xl px-4 py-8 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div className="text-3xl mb-2">
            {filter === 'favorites' ? '⭐' : '🔒'}
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {filter === 'favorites'
              ? 'Нет избранных тем'
              : 'Нет купленных тем'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {filter === 'favorites'
              ? 'Нажмите ☆ на теме, чтобы добавить в избранное'
              : 'Перейдите в магазин, чтобы купить темы'}
          </p>
          {filter === 'purchased' && (
            <Link
              to="/store"
              className="inline-block mt-3 text-xs px-4 py-1.5 rounded-xl transition-all"
              style={{
                background: 'rgba(245,158,11,0.15)',
                color: 'var(--accent-gold)',
                border: '1px solid rgba(245,158,11,0.3)',
              }}
            >
              🛒 В магазин
            </Link>
          )}
        </div>
      )}

      {/* Категории */}
      {grouped.map(({ cat, themes: catThemes }) => {
        const isCollapsed = collapsed.has(cat);
        const selectedInCat = catThemes.filter((t) => selected.includes(t.id)).length;
        return (
        <div key={cat}>
          <button
            onClick={() => setCollapsed((prev) => {
              const next = new Set(prev);
              next.has(cat) ? next.delete(cat) : next.add(cat);
              return next;
            })}
            className="w-full flex items-center gap-2 mb-2 py-1.5 px-2 rounded-xl transition-all hover:opacity-80"
            style={{ background: isCollapsed ? 'var(--bg-surface)' : 'transparent' }}
          >
            <span className="text-sm">{CATEGORY_ICONS[cat]}</span>
            <span className="text-xs font-semibold uppercase tracking-wide flex-1 text-left" style={{ color: 'var(--text-muted)' }}>
              {cat}
            </span>
            {selectedInCat > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.3)' }}>
                {selectedInCat}
              </span>
            )}
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {isCollapsed ? '▶' : '▼'}
            </span>
          </button>

          <AnimatePresence initial={false}>
          {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-1">
            {catThemes.map((theme) => {
              const isSelected = selected.includes(theme.id);
              const isUsedElsewhere = usedInOtherTours.includes(theme.id);
              const accessible = theme.isPurchased;
              const disabled = isUsedElsewhere || !accessible;
              const canSelect = !disabled && (isSelected || selected.length < MAX);
              const isFav = favorites.has(theme.id);

              return (
                <motion.button
                  key={theme.id}
                  onClick={() => toggle(theme.id, accessible && !isUsedElsewhere)}
                  whileTap={canSelect ? { scale: 0.97 } : {}}
                  className="relative flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    background: isSelected
                      ? 'rgba(59,130,246,0.15)'
                      : isUsedElsewhere
                      ? 'rgba(55,65,81,0.3)'
                      : !accessible
                      ? 'rgba(55,65,81,0.2)'
                      : selected.length >= MAX && !isSelected
                      ? 'rgba(55,65,81,0.2)'
                      : 'var(--bg-surface)',
                    border: `1px solid ${
                      isSelected
                        ? 'rgba(59,130,246,0.5)'
                        : isUsedElsewhere
                        ? 'transparent'
                        : 'var(--border)'
                    }`,
                    cursor: disabled || (selected.length >= MAX && !isSelected)
                      ? 'not-allowed'
                      : 'pointer',
                    opacity: isUsedElsewhere ? 0.4 : 1,
                  }}
                >
                  {/* Иконка состояния */}
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{
                      background: isSelected ? 'var(--accent-blue)' : 'var(--bg-card)',
                      border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border)'}`,
                      color: isSelected ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {isSelected ? '✓' : !accessible ? '🔒' : ''}
                  </div>

                  {/* Название */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-medium truncate"
                      style={{
                        color: isSelected
                          ? 'var(--accent-blue)'
                          : !accessible || isUsedElsewhere
                          ? 'var(--text-muted)'
                          : 'var(--text-primary)',
                      }}
                    >
                      {theme.name}
                    </div>
                    {!accessible && (
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        100 ₽
                      </div>
                    )}
                    {isUsedElsewhere && (
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Уже в другом туре
                      </div>
                    )}
                  </div>

                  {/* Звезда избранного */}
                  <button
                    onClick={(e) => toggleFavorite(theme.id, e)}
                    className="text-base flex-shrink-0 transition-all hover:scale-110"
                    style={{ color: isFav ? '#FBBF24' : 'var(--text-muted)', lineHeight: 1 }}
                    title={isFav ? 'Убрать из избранного' : 'Добавить в избранное'}
                  >
                    {isFav ? '★' : '☆'}
                  </button>

                  {/* Кнопка купить */}
                  {!accessible && (
                    <Link
                      to="/store"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs px-2 py-1 rounded-lg flex-shrink-0 transition-all"
                      style={{
                        background: 'rgba(245,158,11,0.15)',
                        color: 'var(--accent-gold)',
                        border: '1px solid rgba(245,158,11,0.3)',
                      }}
                    >
                      Купить
                    </Link>
                  )}
                </motion.button>
              );
            })}
          </div>
          </motion.div>
          )}
          </AnimatePresence>
        </div>
        );
      })}

      {/* Подсказка если макс */}
      <AnimatePresence>
        {selected.length === MAX && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl px-4 py-3 text-sm text-center"
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              color: 'var(--accent-green)',
            }}
          >
            ✅ Тур {tourNumber} укомплектован!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
