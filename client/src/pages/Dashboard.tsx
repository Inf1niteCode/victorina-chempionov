import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';

interface GameHistory {
  id: string;
  code: string;
  status: string;
  totalTours: number;
  timerSecs: number;
  createdAt: string;
  _count?: { players: number; rounds: number };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [games, setGames] = useState<GameHistory[]>([]);
  const [purchasedCount, setPurchasedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [gamesRes, meRes] = await Promise.all([
          api.get('/game/my'),
          api.get('/auth/me'),
        ]);
        setGames(gamesRes.data.games || []);
        setPurchasedCount(meRes.data.user.purchases?.length || 0);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const statusLabel: Record<string, { label: string; color: string }> = {
    LOBBY:    { label: 'Лобби',    color: 'var(--accent-blue)' },
    ACTIVE:   { label: 'Активна',  color: 'var(--accent-green)' },
    FINISHED: { label: 'Завершена', color: 'var(--text-muted)' },
  };

  const stats = [
    { label: 'Игр проведено', value: games.length, icon: '🎮', color: 'var(--accent-blue)' },
    { label: 'Купленных тем', value: purchasedCount, icon: '📚', color: 'var(--accent-gold)' },
    { label: 'Бесплатных тем', value: 10, icon: '🎁', color: 'var(--accent-green)' },
    { label: 'Всего тем', value: 25, icon: '🗂️', color: 'var(--text-muted)' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>

      {/* ── Шапка ── */}
      <header
        className="px-6 py-4 flex items-center justify-between sticky top-0 z-10"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            Викторина Чемпионов
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <Link
            to="/store"
            className="text-sm transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            🛒 Магазин тем
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            Выйти
          </button>
        </nav>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ── Приветствие ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Привет, {user?.name}! 👋
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {user?.email}
          </p>
        </motion.div>

        {/* ── Статистика ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 + i * 0.05 }}
              className="rounded-2xl p-5 text-center"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-3xl font-bold" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Кнопка создать игру ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => navigate('/game/setup')}
            className="w-full py-5 rounded-2xl font-bold text-xl transition-all"
            style={{
              background: 'linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)',
              color: '#07090F',
              boxShadow: '0 8px 32px rgba(245,158,11,0.25)',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.filter = '')}
          >
            ➕ Создать новую игру
          </button>
        </motion.div>

        {/* ── История игр ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            История игр
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }}
              />
            </div>
          ) : games.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="text-5xl mb-3">🎲</div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Ещё нет игр
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Создайте первую игру прямо сейчас!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {games.map((game, i) => {
                const s = statusLabel[game.status] || { label: game.status, color: 'var(--text-muted)' };
                const date = new Date(game.createdAt).toLocaleDateString('ru-RU', {
                  day: 'numeric', month: 'long', year: 'numeric',
                });
                return (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-2xl p-5 flex items-center gap-4"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    {/* Код */}
                    <div
                      className="text-xl font-bold tracking-widest w-24 text-center flex-shrink-0"
                      style={{ color: 'var(--accent-gold)' }}
                    >
                      {game.code}
                    </div>

                    {/* Инфо */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: `${s.color}20`,
                            color: s.color,
                            border: `1px solid ${s.color}40`,
                          }}
                        >
                          {s.label}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {date}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {game.totalTours} {game.totalTours === 1 ? 'тур' : 'тура'} · {game.timerSecs}с
                        </span>
                        {game._count && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            👥 {game._count.players} игроков
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Действия */}
                    {game.status !== 'FINISHED' && (
                      <Link
                        to={game.status === 'LOBBY'
                          ? `/host/lobby/${game.code}`
                          : `/host/game/${game.code}`}
                        className="text-xs px-4 py-2 rounded-xl transition-all flex-shrink-0"
                        style={{
                          background: 'var(--accent-blue)',
                          color: '#fff',
                        }}
                      >
                        {game.status === 'LOBBY' ? 'Открыть лобби' : 'Продолжить'}
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
