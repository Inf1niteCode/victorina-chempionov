import { motion } from 'framer-motion';

interface Props {
  playerName: string;
  size?: 'md' | 'lg';
}

export default function BuzzWinner({ playerName, size = 'md' }: Props) {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className="flex flex-col items-center gap-2"
    >
      {/* Вспышка */}
      <motion.div
        animate={{ opacity: [1, 0.5, 1, 0.5, 1] }}
        transition={{ duration: 0.6, times: [0, 0.25, 0.5, 0.75, 1] }}
        className="text-2xl"
      >
        🔔
      </motion.div>

      <div
        className="px-6 py-3 rounded-2xl text-center"
        style={{
          background: 'rgba(245,158,11,0.15)',
          border: '2px solid var(--accent-gold)',
          boxShadow: '0 0 32px rgba(245,158,11,0.4)',
        }}
      >
        <p
          style={{
            fontSize: size === 'lg' ? '0.875rem' : '0.75rem',
            color: 'var(--text-muted)',
            marginBottom: 2,
          }}
        >
          Первым нажал
        </p>
        <p
          style={{
            fontSize: size === 'lg' ? '2rem' : '1.25rem',
            fontWeight: 700,
            color: 'var(--accent-gold)',
            lineHeight: 1.1,
          }}
        >
          {playerName}
        </p>
      </div>
    </motion.div>
  );
}
