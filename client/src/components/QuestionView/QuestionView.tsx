import { motion, AnimatePresence } from 'framer-motion';
import Timer from '../Timer/Timer';
import BuzzWinner from '../BuzzWinner/BuzzWinner';

interface Props {
  text: string;
  answer?: string;       // только для ведущего
  points: number;
  themeName: string;
  timeLimit: number;
  timerSeconds: number;
  timerPaused: boolean;
  buzzWinner: { playerId: string; playerName: string } | null;
  showAnswer?: boolean;  // true для ведущего
  // Колбэки только для ведущего
  onCorrect?: (playerId: string) => void;
  onWrong?: (playerId: string) => void;
  onPause?: () => void;
  onReset?: () => void;
  onClose?: () => void;
}

const POINT_BG: Record<number, string> = {
  100: 'rgba(96,165,250,0.15)',
  200: 'rgba(52,211,153,0.15)',
  300: 'rgba(245,158,11,0.15)',
  400: 'rgba(249,115,22,0.15)',
  500: 'rgba(239,68,68,0.15)',
};
const POINT_COLOR: Record<number, string> = {
  100: '#60A5FA', 200: '#34D399', 300: '#F59E0B', 400: '#F97316', 500: '#EF4444',
};

export default function QuestionView({
  text, answer, points, themeName, timeLimit,
  timerSeconds, timerPaused, buzzWinner,
  showAnswer = false,
  onCorrect, onWrong, onPause, onReset, onClose,
}: Props) {
  const isHost = showAnswer;
  const pc = POINT_COLOR[points] || 'var(--accent-gold)';
  const pb = POINT_BG[points] || 'rgba(245,158,11,0.1)';

  return (
    <div className="flex flex-col h-full">

      {/* ── Мета-шапка ── */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span style={{ padding: '4px 14px', borderRadius: 9999, fontSize: '0.8rem', fontWeight: 600, background: 'rgba(107,114,128,0.2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            {themeName}
          </span>
          <span style={{ padding: '4px 14px', borderRadius: 9999, fontSize: '0.85rem', fontWeight: 700, background: pb, color: pc, border: `1px solid ${pc}40` }}>
            {points} очков
          </span>
        </div>
        {isHost && onClose && (
          <button onClick={onClose}
            className="text-sm px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            × Закрыть
          </button>
        )}
      </div>

      {/* ── Текст вопроса ── */}
      <div className="rounded-2xl p-6 mb-4 flex-shrink-0"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <p style={{
          fontSize: isHost ? '1.1rem' : 'clamp(1.4rem, 3vw, 2.5rem)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.4,
        }}>
          {text}
        </p>
      </div>

      {/* ── Правильный ответ (только для ведущего) ── */}
      {showAnswer && answer && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl px-6 py-4 mb-4 flex-shrink-0"
          style={{ background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.4)' }}>
          <p className="text-xs font-semibold mb-1 uppercase tracking-wide"
            style={{ color: 'rgba(16,185,129,0.7)' }}>
            Правильный ответ
          </p>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-green)' }}>
            {answer}
          </p>
        </motion.div>
      )}

      {/* ── Buzz Winner + Кнопки ✅/❌ ── */}
      <AnimatePresence>
        {buzzWinner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="mb-4 flex-shrink-0"
          >
            <BuzzWinner playerName={buzzWinner.playerName} size="md" />

            {isHost && onCorrect && onWrong && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => onCorrect(buzzWinner.playerId)}
                  className="flex-1 py-4 rounded-2xl font-bold text-lg transition-all"
                  style={{
                    background: 'rgba(16,185,129,0.15)',
                    border: '2px solid var(--accent-green)',
                    color: 'var(--accent-green)',
                    minHeight: 60,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16,185,129,0.25)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(16,185,129,0.15)')}
                >
                  ✅ Правильно
                </button>
                <button
                  onClick={() => onWrong(buzzWinner.playerId)}
                  className="flex-1 py-4 rounded-2xl font-bold text-lg transition-all"
                  style={{
                    background: 'rgba(239,68,68,0.12)',
                    border: '2px solid var(--accent-red)',
                    color: 'var(--accent-red)',
                    minHeight: 60,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.22)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.12)')}
                >
                  ❌ Неправильно
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Таймер + управление (для ведущего) ── */}
      <div className="mt-auto flex-shrink-0">
        <div className="flex items-center justify-between">
          <Timer seconds={timerSeconds} total={timeLimit} paused={timerPaused} size="lg" />

          {isHost && (
            <div className="flex gap-2">
              <button onClick={onPause}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                {timerPaused ? '▶ Продолжить' : '⏸ Пауза'}
              </button>
              <button onClick={onReset}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                ↺ Сбросить
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
