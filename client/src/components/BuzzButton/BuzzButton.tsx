import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onBuzz: () => void;
  disabled?: boolean;
  blocked?: boolean;
  winner?: boolean;
  winnerName?: string;
  wasWrong?: boolean;
}

export default function BuzzButton({ onBuzz, disabled, blocked, winner, winnerName, wasWrong }: Props) {
  const [pressed, setPressed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pressed && !winner && !blocked) {
      timeoutRef.current = setTimeout(() => setPressed(false), 4000);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [pressed, winner, blocked]);

  useEffect(() => {
    if (winner || blocked || wasWrong) {
      setPressed(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [winner, blocked, wasWrong]);

  const handlePress = useCallback(() => {
    if (disabled || blocked || winner || pressed || wasWrong) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(200);
    setPressed(true);
    onBuzz();
  }, [disabled, blocked, winner, pressed, wasWrong, onBuzz]);

  const stateClass = "w-full h-full flex flex-col items-center justify-center gap-2";

  // ── Неправильный ответ ──
  if (wasWrong) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className={stateClass}
        style={{ borderRadius: 24, background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.3)' }}>
        <div className="text-4xl">❌</div>
        <p className="text-lg font-bold" style={{ color: 'var(--accent-red)' }}>Неправильно!</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Другие игроки могут нажать</p>
      </motion.div>
    );
  }

  // ── Победитель ──
  if (winner) {
    return (
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className={stateClass}
        style={{ borderRadius: 24, background: 'rgba(245,158,11,0.15)', border: '3px solid var(--accent-gold)', boxShadow: '0 0 32px rgba(245,158,11,0.4)' }}>
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
          className="text-4xl">🔔</motion.div>
        <p className="text-xl font-bold" style={{ color: 'var(--accent-gold)' }}>Вы нажали первым!</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Отвечайте!</p>
        <motion.div
          initial={{ opacity: 0.8 }} animate={{ opacity: 0 }} transition={{ duration: 0.6 }}
          className="fixed inset-0 pointer-events-none z-50"
          style={{ background: 'var(--accent-gold)' }}
        />
      </motion.div>
    );
  }

  // ── Опоздал ──
  if (blocked) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className={stateClass}
        style={{ borderRadius: 24, background: 'var(--bg-surface)', border: '2px solid var(--border)', opacity: 0.7 }}>
        <div className="text-4xl">😔</div>
        <p className="text-lg font-bold" style={{ color: 'var(--text-muted)' }}>Опоздали!</p>
        {winnerName && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Первым: <strong style={{ color: 'var(--accent-gold)' }}>{winnerName}</strong>
          </p>
        )}
      </motion.div>
    );
  }

  // ── Ожидание ──
  if (pressed) {
    return (
      <motion.div initial={{ scale: 1.05 }} animate={{ scale: 1 }}
        className={stateClass}
        style={{ borderRadius: 24, background: 'var(--bg-surface)', border: '2px solid var(--border)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, ease: 'linear', repeat: Infinity }}
          className="w-8 h-8 border-4 border-t-transparent rounded-full"
          style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Проверяем...</p>
      </motion.div>
    );
  }

  // ── Обычная кнопка ──
  return (
    <motion.button
      onTouchStart={handlePress}
      onClick={handlePress}
      disabled={disabled}
      className="w-full h-full select-none flex flex-col items-center justify-center gap-2"
      style={{
        background: disabled
          ? 'var(--bg-surface)'
          : 'linear-gradient(135deg, #F59E0B 0%, #f97316 50%, #EF4444 100%)',
        border: 'none',
        borderRadius: 24,
        cursor: disabled ? 'not-allowed' : 'pointer',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        touchAction: 'manipulation',
        boxShadow: disabled ? 'none' : '0 8px 32px rgba(245,158,11,0.45)',
      }}
      whileTap={!disabled ? { scale: 0.94 } : {}}
      animate={!disabled ? {
        boxShadow: [
          '0 8px 32px rgba(245,158,11,0.45)',
          '0 12px 48px rgba(245,158,11,0.65)',
          '0 8px 32px rgba(245,158,11,0.45)',
        ],
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <span style={{ fontSize: '2.5rem' }}>⚡</span>
      <span style={{
        fontSize: '1.8rem',
        fontWeight: 900,
        color: disabled ? 'var(--text-muted)' : '#07090F',
        lineHeight: 1,
        letterSpacing: '-0.02em',
      }}>
        {disabled ? 'Ждём...' : 'Я ЗНАЮ!'}
      </span>
      {!disabled && (
        <span style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.5)', fontWeight: 500 }}>
          Нажмите первым
        </span>
      )}
    </motion.button>
  );
}
