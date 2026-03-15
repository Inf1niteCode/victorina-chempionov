import { motion } from 'framer-motion';
import type { BoardTheme } from '@victorina/shared';

interface Props {
  themes: BoardTheme[];
  answeredQuestions: Set<string>;
  onCellClick?: (questionId: string, points: number, themeName: string) => void;
  activeQuestionId?: string | null;
  isHost?: boolean;
}

const POINTS = [100, 200, 300, 400, 500];

const POINT_COLORS: Record<number, string> = {
  100: '#60A5FA',
  200: '#34D399',
  300: '#F59E0B',
  400: '#F97316',
  500: '#EF4444',
};

export default function GameBoard({
  themes,
  answeredQuestions,
  onCellClick,
  activeQuestionId,
  isHost = false,
}: Props) {
  if (themes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
        Загрузка поля...
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${themes.length}, minmax(0, 1fr))`,
          minWidth: themes.length * 120,
        }}
      >
        {/* Заголовки тем */}
        {themes.map((theme) => (
          <motion.div
            key={theme.themeId}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-3 text-center font-bold"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              minHeight: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(0.65rem, 1.2vw, 0.875rem)',
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}
          >
            {theme.themeName}
          </motion.div>
        ))}

        {/* Ячейки вопросов — 5 строк × 5 тем */}
        {POINTS.map((pts) =>
          themes.map((theme) => {
            const cell = theme.cells.find((c) => c.points === pts);
            if (!cell) return <div key={`${theme.themeId}-${pts}`} />;

            const isAnswered = answeredQuestions.has(cell.questionId);
            const isActive = cell.questionId === activeQuestionId;
            const pointColor = POINT_COLORS[pts];

            return (
              <motion.button
                key={cell.questionId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (themes.indexOf(theme) + POINTS.indexOf(pts)) * 0.03 }}
                onClick={() =>
                  !isAnswered && isHost && onCellClick?.(cell.questionId, pts, theme.themeName)
                }
                disabled={isAnswered || !isHost}
                whileHover={isHost && !isAnswered ? { scale: 1.04, y: -2 } : {}}
                whileTap={isHost && !isAnswered ? { scale: 0.96 } : {}}
                className="rounded-xl flex items-center justify-center font-bold transition-all"
                style={{
                  minHeight: 'clamp(52px, 8vw, 80px)',
                  fontSize: 'clamp(1rem, 2.5vw, 1.75rem)',
                  background: isAnswered
                    ? 'var(--bg-surface)'
                    : isActive
                    ? `${pointColor}30`
                    : 'var(--bg-card)',
                  border: `2px solid ${
                    isAnswered
                      ? 'transparent'
                      : isActive
                      ? pointColor
                      : 'var(--border)'
                  }`,
                  color: isAnswered ? 'transparent' : pointColor,
                  cursor: isHost && !isAnswered ? 'pointer' : 'default',
                  boxShadow: isActive
                    ? `0 0 20px ${pointColor}60`
                    : isHost && !isAnswered
                    ? `0 4px 12px rgba(0,0,0,0.3)`
                    : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isAnswered ? (
                  // Серая пустышка
                  <div
                    style={{
                      width: '40%',
                      height: 2,
                      borderRadius: 1,
                      background: 'var(--border)',
                    }}
                  />
                ) : (
                  <>
                    {pts}
                    {/* Блик */}
                    {!isAnswered && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0, left: 0, right: 0,
                          height: '40%',
                          background: 'linear-gradient(to bottom, rgba(255,255,255,0.06), transparent)',
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                  </>
                )}
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
