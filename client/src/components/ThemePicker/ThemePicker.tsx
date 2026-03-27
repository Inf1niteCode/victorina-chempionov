import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('');
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

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

  const toggle = (themeId: string) => {
    if (usedInOtherTours.includes(themeId)) return;
    if (selected.includes(themeId)) {
      onChange(selected.filter((id) => id !== themeId));
    } else {
      if (selected.length >= MAX) return;
      onChange([...selected, themeId]);
    }
  };

  // Фильтрация
  const searchLower = search.trim().toLowerCase();
  const visibleThemes = themes.filter((t) => {
    if (showFavOnly && !favorites.has(t.id)) return false;
    if (catFilter && t.category !== catFilter) return false;
    if (searchLower && !t.name.toLowerCase().includes(searchLower)) return false;
    return true;
  });

  // Доступные категории с учётом фильтра избранных
  const availableCategories = CATEGORY_ORDER.filter((cat) =>
    themes.some((t) => {
      if (showFavOnly && !favorites.has(t.id)) return false;
      return t.category === cat;
    })
  );

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    themes: visibleThemes.filter((t) => t.category === cat),
  })).filter((g) => g.themes.length > 0);

  return (
    <div className="space-y-5">

      {/* ── Поиск ── */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--text-muted)' }}>🔍</span>
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* ── Фильтр избранных ── */}
      <div className="flex gap-2">
        <button
          onClick={() => { setShowFavOnly(false); setCatFilter(''); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:opacity-80 flex-shrink-0"
          style={{
            background: !showFavOnly ? 'rgba(59,130,246,0.15)' : 'var(--bg-surface)',
            color: !showFavOnly ? 'var(--accent-blue)' : 'var(--text-muted)',
            border: `1px solid ${!showFavOnly ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
          }}
        >
          <span>🗂️</span>
          <span>Все темы</span>
          <span className="px-1.5 py-0.5 rounded-full text-xs"
            style={{
              background: !showFavOnly ? 'rgba(59,130,246,0.2)' : 'var(--bg-card)',
              color: !showFavOnly ? 'var(--accent-blue)' : 'var(--text-muted)',
            }}>
            {themes.length}
          </span>
        </button>
        <button
          onClick={() => { setShowFavOnly(true); setCatFilter(''); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:opacity-80 flex-shrink-0"
          style={{
            background: showFavOnly ? 'rgba(59,130,246,0.15)' : 'var(--bg-surface)',
            color: showFavOnly ? 'var(--accent-blue)' : 'var(--text-muted)',
            border: `1px solid ${showFavOnly ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
          }}
        >
          <span>⭐</span>
          <span>Избранные</span>
          <span className="px-1.5 py-0.5 rounded-full text-xs"
            style={{
              background: showFavOnly ? 'rgba(59,130,246,0.2)' : 'var(--bg-card)',
              color: showFavOnly ? 'var(--accent-blue)' : 'var(--text-muted)',
            }}>
            {favorites.size}
          </span>
        </button>
      </div>

      {/* ── Категории (фильтр) ── */}
      {availableCategories.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setCatFilter('')}
            className="px-2.5 py-1 rounded-xl text-xs font-medium transition-all hover:opacity-80"
            style={{
              background: !catFilter ? 'rgba(59,130,246,0.15)' : 'var(--bg-surface)',
              color: !catFilter ? 'var(--accent-blue)' : 'var(--text-muted)',
              border: `1px solid ${!catFilter ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
            }}
          >
            Все
          </button>
          {availableCategories.map((cat) => {
            const active = catFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCatFilter(active ? '' : cat)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                style={{
                  background: active ? 'rgba(59,130,246,0.15)' : 'var(--bg-surface)',
                  color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
                  border: `1px solid ${active ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
                }}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Пустое состояние */}
      {grouped.length === 0 && (
        <div
          className="rounded-xl px-4 py-8 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div className="text-3xl mb-2">⭐</div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Нет избранных тем
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Нажмите ☆ на теме, чтобы добавить в избранное
          </p>
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
              const canSelect = !isUsedElsewhere && (isSelected || selected.length < MAX);
              const isFav = favorites.has(theme.id);

              return (
                <motion.button
                  key={theme.id}
                  onClick={() => toggle(theme.id)}
                  whileHover={canSelect ? {
                    backgroundColor: isSelected ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.07)',
                    boxShadow: '0 0 0 1px rgba(59,130,246,0.4)',
                    transition: { duration: 0.15 },
                  } : {}}
                  whileTap={canSelect ? { scale: 0.97 } : {}}
                  className="relative flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    background: isSelected
                      ? 'rgba(59,130,246,0.15)'
                      : isUsedElsewhere
                      ? 'rgba(55,65,81,0.3)'
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
                    cursor: isUsedElsewhere || (selected.length >= MAX && !isSelected)
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
                    {isSelected ? '✓' : ''}
                  </div>

                  {/* Название */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-medium truncate"
                      style={{
                        color: isSelected
                          ? 'var(--accent-blue)'
                          : isUsedElsewhere
                          ? 'var(--text-muted)'
                          : 'var(--text-primary)',
                      }}
                    >
                      {theme.name}
                    </div>
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
