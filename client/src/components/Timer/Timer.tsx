import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/sounds';

interface Props {
  seconds: number;
  total: number;
  paused?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Timer({ seconds, total, paused = false, size = 'md' }: Props) {
  const pct = total > 0 ? seconds / total : 0;
  const prevSeconds = useRef(seconds);

  // Звук предупреждения при малом количестве секунд (только для больших таймеров)
  useEffect(() => {
    if (size !== 'sm' && !paused && seconds > 0 && seconds <= 5 && seconds !== prevSeconds.current) {
      playSound('timerWarning');
    }
    prevSeconds.current = seconds;
  }, [seconds, paused, size]);

  const color = seconds <= 5
    ? 'var(--accent-red)'
    : seconds <= 10
    ? '#f97316'
    : 'var(--accent-green)';

  const fontSizes = { sm: '1.5rem', md: '2.5rem', lg: '4rem', xl: '6rem' };
  const ringSize = { sm: 56, md: 80, lg: 120, xl: 160 };

  const r = ringSize[size];
  const radius = r / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: r, height: r }}>
      {/* Фоновый круг */}
      <svg width={r} height={r} className="absolute inset-0 -rotate-90">
        <circle
          cx={r / 2} cy={r / 2} r={radius}
          fill="none"
          stroke="var(--bg-surface)"
          strokeWidth={4}
        />
        <motion.circle
          cx={r / 2} cy={r / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'linear' }}
          style={{ filter: seconds <= 5 ? `drop-shadow(0 0 6px ${color})` : 'none' }}
        />
      </svg>

      {/* Число */}
      <AnimatePresence mode="popLayout">
        <motion.span
          key={seconds}
          initial={{ scale: seconds <= 5 ? 1.3 : 1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            fontSize: fontSizes[size],
            fontWeight: 700,
            color: paused ? 'var(--text-muted)' : color,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {seconds}
        </motion.span>
      </AnimatePresence>

      {/* Пауза */}
      {paused && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-full"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          <span style={{ fontSize: fontSizes[size], color: 'var(--text-muted)' }}>⏸</span>
        </div>
      )}
    </div>
  );
}
