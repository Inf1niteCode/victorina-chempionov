import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '@victorina/shared';

interface Props {
  players: Player[];
  myPlayerId?: string;
  compact?: boolean;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Scoreboard({ players, myPlayerId, compact = false }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  if (sorted.length === 0) {
    return (
      <div className="text-center py-4" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Нет игроков
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <AnimatePresence>
        {sorted.map((player, i) => {
          const isMe = player.id === myPlayerId;
          const medal = MEDALS[i];

          return (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, layout: { type: 'spring', stiffness: 300, damping: 30 } }}
              className="flex items-center gap-2 rounded-xl"
              style={{
                padding: compact ? '6px 12px' : '10px 14px',
                background: isMe
                  ? 'rgba(59,130,246,0.12)'
                  : i === 0
                  ? 'rgba(245,158,11,0.08)'
                  : 'var(--bg-surface)',
                border: `1px solid ${isMe
                  ? 'rgba(59,130,246,0.3)'
                  : i === 0
                  ? 'rgba(245,158,11,0.2)'
                  : 'transparent'}`,
              }}
            >
              {/* Место */}
              <span style={{ fontSize: compact ? '1rem' : '1.25rem', width: 28, textAlign: 'center' }}>
                {medal || <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>{i + 1}</span>}
              </span>

              {/* Имя */}
              <span
                className="flex-1 truncate font-medium"
                style={{
                  fontSize: compact ? '0.8rem' : '0.875rem',
                  color: isMe ? 'var(--accent-blue)' : 'var(--text-primary)',
                }}
              >
                {player.name}
                {isMe && <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontSize: '0.7rem' }}>(вы)</span>}
              </span>

              {/* Счёт */}
              <motion.span
                key={`${player.id}-${player.score}`}
                initial={{ scale: 1.4, color: 'var(--accent-green)' }}
                animate={{ scale: 1, color: i === 0 ? 'var(--accent-gold)' : 'var(--text-primary)' }}
                transition={{ duration: 0.4 }}
                style={{
                  fontWeight: 700,
                  fontSize: compact ? '0.85rem' : '1rem',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {player.score.toLocaleString('ru-RU')}
              </motion.span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
