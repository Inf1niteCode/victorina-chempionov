import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { useSocketEvents } from '../../socket/useSocketEvents';

interface Props {
  code: string;
}

export default function PlayerLobby({ code }: Props) {
  useSocketEvents();

  const { players, myPlayerId, totalTours } = useGameStore();

  const myPlayer = players.find((p) => p.id === myPlayerId);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: 'var(--bg-deep)' }}
    >
      {/* Заголовок */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="text-5xl mb-3">⏳</div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Ждём начала игры
        </h1>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Код:</span>
          <span
            className="text-lg font-bold tracking-widest"
            style={{ color: 'var(--accent-gold)' }}
          >
            {code}
          </span>
        </div>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Туров: {totalTours}
        </p>
      </motion.div>

      {/* Моё имя */}
      {myPlayer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 px-6 py-3 rounded-2xl"
          style={{
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.3)',
          }}
        >
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Вы: </span>
          <span className="font-bold" style={{ color: 'var(--accent-blue)' }}>
            {myPlayer.name}
          </span>
        </motion.div>
      )}

      {/* Список игроков */}
      <div className="w-full max-w-sm">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Игроки в комнате
            </span>
            <span
              className="text-sm font-bold px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(245,158,11,0.15)',
                color: 'var(--accent-gold)',
              }}
            >
              {players.length}
            </span>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            <AnimatePresence>
              {players.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Пока никого нет...
                </div>
              ) : (
                players.map((player, i) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{
                        background:
                          player.id === myPlayerId
                            ? 'rgba(59,130,246,0.2)'
                            : 'var(--bg-surface)',
                        color:
                          player.id === myPlayerId
                            ? 'var(--accent-blue)'
                            : 'var(--text-muted)',
                        border:
                          player.id === myPlayerId
                            ? '1px solid rgba(59,130,246,0.4)'
                            : '1px solid var(--border)',
                      }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{
                        color:
                          player.id === myPlayerId
                            ? 'var(--accent-blue)'
                            : 'var(--text-primary)',
                      }}
                    >
                      {player.name}
                      {player.id === myPlayerId && (
                        <span
                          className="ml-2 text-xs"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          (вы)
                        </span>
                      )}
                    </span>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Пульсирующий индикатор ожидания */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: 'var(--text-muted)' }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
          <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>
            Ведущий начнёт игру
          </span>
        </div>
      </div>
    </div>
  );
}
