import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { ThemeInfo } from '../../api/themes';

const CATEGORY_ORDER = ['ИСТОРИЯ', 'НАУКА', 'КУЛЬТУРА', 'СПОРТ', 'ГЕОГРАФИЯ'];

const CATEGORY_ICONS: Record<string, string> = {
  ИСТОРИЯ: '⚔️',
  НАУКА: '🔬',
  КУЛЬТУРА: '🎭',
  СПОРТ: '⚽',
  ГЕОГРАФИЯ: '🌍',
};

interface Props {
  tourNumber: number;
  themes: ThemeInfo[];
  selected: string[];            // themeIds выбранных в ЭТОМ туре
  usedInOtherTours: string[];    // themeIds занятых в других турах
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

  // Группируем по категории
  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    themes: themes.filter((t) => t.category === cat),
  }));

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
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--bg-surface)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: selected.length === MAX
              ? 'var(--accent-green)'
              : 'var(--accent-gold)',
          }}
          animate={{ width: `${(selected.length / MAX) * 100}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        />
      </div>

      {/* Категории */}
      {grouped.map(({ cat, themes: catThemes }) => (
        <div key={cat}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">{CATEGORY_ICONS[cat]}</span>
            <span className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}>
              {cat}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {catThemes.map((theme) => {
              const isSelected = selected.includes(theme.id);
              const isUsedElsewhere = usedInOtherTours.includes(theme.id);
              const accessible = theme.isPurchased;
              const disabled = isUsedElsewhere || (!accessible);
              const canSelect = !disabled && (isSelected || selected.length < MAX);

              return (
                <motion.button
                  key={theme.id}
                  onClick={() => toggle(theme.id, accessible && !isUsedElsewhere)}
                  disabled={disabled && !isSelected}
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
                      background: isSelected
                        ? 'var(--accent-blue)'
                        : 'var(--bg-card)',
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
        </div>
      ))}

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
