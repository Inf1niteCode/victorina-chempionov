import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onBuzz: () => void;
  disabled?: boolean;
  blocked?: boolean;   // опоздал — другой нажал первым
  winner?: boolean;    // этот игрок нажал первым
  winnerName?: string;
}

export default function BuzzButton({ onBuzz, disabled, blocked, winner, winnerName }: Props) {
  const [pressed, setPressed] = useState(false);

  const handlePress = useCallback(() => {
    if (disabled || blocked || winner || pressed) return;

    // Вибрация на мобильном
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(200);
    }

    setPressed(true);
    onBuzz();
  }, [disabled, blocked, winner, pressed, onBuzz]);

  // ── Состояние: победитель ──
  if (winner) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full flex flex-col items-center justify-center gap-4"
        style={{ minHeight: '60dvh' }}
      >
        {/* Вспышка на весь экран */}
        <motion.div
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 pointer-events-none z-50"
          style={{ background: 'var(--accent-gold)' }}
        />

        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="text-6xl"
        >
          🔔
        </motion.div>

        <div className="text-center px-6">
          <p className="text-xl font-bold" style={{ color: 'var(--accent-gold)' }}>
            Вы нажали первым!
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Отвечайте!
          </p>
        </div>

        <div
          className="w-full max-w-xs rounded-3xl flex items-center justify-center"
          style={{
            height: 180,
            background: 'rgba(245,158,11,0.15)',
            border: '3px solid var(--accent-gold)',
            boxShadow: '0 0 48px rgba(245,158,11,0.5)',
          }}
        >
          <span style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
            ✋
          </span>
        </div>
      </motion.div>
    );
  }

  // ── Состояние: опоздал ──
  if (blocked) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full flex flex-col items-center justify-center gap-4"
        style={{ minHeight: '60dvh' }}
      >
        <div className="text-5xl">😔</div>
        <p className="text-xl font-bold" style={{ color: 'var(--text-muted)' }}>
          Опоздали!
        </p>
        {winnerName && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Первым нажал: <strong style={{ color: 'var(--accent-gold)' }}>{winnerName}</strong>
          </p>
        )}
        <div
          className="w-full max-w-xs rounded-3xl flex items-center justify-center"
          style={{
            height: 180,
            background: 'var(--bg-surface)',
            border: '2px solid var(--border)',
            opacity: 0.5,
          }}
        >
          <span style={{ fontSize: '3rem', color: 'var(--text-muted)' }}>🔇</span>
        </div>
      </motion.div>
    );
  }

  // ── Состояние: нажата (ожидаем ответа сервера) ──
  if (pressed) {
    return (
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        className="w-full flex flex-col items-center justify-center gap-4"
        style={{ minHeight: '60dvh' }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, ease: 'linear', repeat: Infinity }}
          className="w-10 h-10 border-4 border-t-transparent rounded-full"
          style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }}
        />
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Проверяем...</p>
      </motion.div>
    );
  }

  // ── Состояние: обычная кнопка ──
  return (
    <motion.button
      onTouchStart={handlePress}
      onClick={handlePress}
      disabled={disabled}
      className="w-full select-none"
      style={{
        minHeight: '60dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: disabled
          ? 'var(--bg-surface)'
          : 'linear-gradient(135deg, #F59E0B 0%, #f97316 50%, #EF4444 100%)',
        border: 'none',
        borderRadius: 32,
        cursor: disabled ? 'not-allowed' : 'pointer',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        touchAction: 'manipulation',
        boxShadow: disabled ? 'none' : '0 12px 48px rgba(245,158,11,0.45)',
      }}
      whileTap={!disabled ? { scale: 0.93 } : {}}
      animate={!disabled ? {
        boxShadow: [
          '0 12px 48px rgba(245,158,11,0.45)',
          '0 16px 64px rgba(245,158,11,0.65)',
          '0 12px 48px rgba(245,158,11,0.45)',
        ],
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <span style={{ fontSize: '3.5rem' }}>⚡</span>
      <span
        style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          color: disabled ? 'var(--text-muted)' : '#07090F',
          lineHeight: 1,
          textAlign: 'center',
          letterSpacing: '-0.02em',
        }}
      >
        {disabled ? 'Ждём...' : 'Я ЗНАЮ!'}
      </span>
      {!disabled && (
        <span style={{ fontSize: '0.9rem', color: 'rgba(0,0,0,0.5)', fontWeight: 500 }}>
          Нажмите первым
        </span>
      )}
    </motion.button>
  );
}
