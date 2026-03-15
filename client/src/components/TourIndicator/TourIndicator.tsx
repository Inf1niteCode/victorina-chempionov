import { motion } from 'framer-motion';

interface Props {
  current: number;
  total: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function TourIndicator({ current, total, size = 'md' }: Props) {
  const sizes = {
    sm: { text: '0.75rem', dot: 8, gap: 6 },
    md: { text: '0.875rem', dot: 10, gap: 8 },
    lg: { text: '1.25rem', dot: 14, gap: 10 },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-3">
      <span style={{ fontSize: s.text, color: 'var(--text-muted)', fontWeight: 500 }}>
        Тур {current} из {total}
      </span>
      <div className="flex items-center" style={{ gap: s.gap }}>
        {Array.from({ length: total }, (_, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              scale: i + 1 === current ? 1.3 : 1,
              opacity: i + 1 < current ? 0.4 : 1,
            }}
            style={{
              width: s.dot,
              height: s.dot,
              borderRadius: '50%',
              background: i + 1 === current
                ? 'var(--accent-gold)'
                : i + 1 < current
                ? 'var(--accent-green)'
                : 'var(--bg-surface)',
              border: `2px solid ${i + 1 === current
                ? 'var(--accent-gold)'
                : i + 1 < current
                ? 'var(--accent-green)'
                : 'var(--border)'}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
