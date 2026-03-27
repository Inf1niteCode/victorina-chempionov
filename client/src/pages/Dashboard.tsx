import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';
import UserMenu from '../components/UserMenu/UserMenu';

interface PlayerResult {
  id: string;
  name: string;
  score: number;
}

interface GameHistory {
  id: string;
  code: string;
  status: string;
  totalTours: number;
  timerSecs: number;
  createdAt: string;
  _count?: { players: number; rounds: number };
  players?: PlayerResult[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, fetchMe } = useAuthStore();

  const [games, setGames] = useState<GameHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [gamesRes] = await Promise.all([
          api.get('/game/my'),
          fetchMe(),
        ]);
        setGames(gamesRes.data.games || []);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [fetchMe]);

  const handleDelete = async (code: string) => {
    setDeletingId(code);
    try {
      await api.delete(`/game/${code}`);
      setGames((prev) => prev.filter((g) => g.code !== code));
    } catch {
      // ignore — кнопка просто вернётся в исходное состояние
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const statusLabel: Record<string, { label: string; color: string }> = {
    LOBBY:    { label: 'Лобби',    color: 'var(--accent-blue)' },
    ACTIVE:   { label: 'Активна',  color: 'var(--accent-green)' },
    FINISHED: { label: 'Завершена', color: 'var(--text-muted)' },
  };


  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>

      {/* ── Шапка ── */}
      <header
        className="px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between sticky top-0 z-10"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            Викторина Чемпионов
          </span>
        </div>
        <nav className="flex items-center gap-2 sm:gap-3">
          {user?.isAdmin && (
            <Link
              to="/admin"
              className="text-sm font-semibold px-3 py-1.5 rounded-xl transition-all hover:opacity-85"
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--accent-gold)',
                border: '1px solid rgba(245,158,11,0.4)',
              }}
            >
              Админ
            </Link>
          )}
          {user && <UserMenu user={user} onLogout={handleLogout} />}
        </nav>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6 sm:space-y-8">



        {/* ── Кнопка создать игру ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => navigate('/game/setup')}
            className="w-full py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl transition-all"
            style={{
              background: 'linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)',
              color: '#07090F',
              boxShadow: '0 8px 32px rgba(245,158,11,0.25)',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.filter = '')}
          >
            Создать новую игру
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
                    className="rounded-2xl overflow-hidden"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    {/* Верхняя строка */}
                    <div className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4 flex-wrap">
                      {/* Код */}
                      <div
                        className="text-base sm:text-xl font-bold tracking-widest w-16 sm:w-24 text-center flex-shrink-0"
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
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {game.status !== 'FINISHED' && game.status !== 'ACTIVE' && (
                          <Link
                            to={`/host/lobby/${game.code}`}
                            className="text-xs px-4 py-2 rounded-xl transition-all"
                            style={{ background: 'var(--accent-blue)', color: '#fff' }}
                          >
                            Открыть лобби
                          </Link>
                        )}
                        {game.status === 'ACTIVE' && (
                          <Link
                            to={`/host/game/${game.code}`}
                            className="text-xs px-4 py-2 rounded-xl transition-all"
                            style={{ background: 'var(--accent-blue)', color: '#fff' }}
                          >
                            Продолжить
                          </Link>
                        )}

                        {/* Удалить */}
                        {game.status !== 'ACTIVE' && (
                          confirmDeleteId === game.code ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleDelete(game.code)}
                                disabled={deletingId === game.code}
                                className="text-xs px-3 py-2 rounded-xl font-semibold transition-all"
                                style={{ background: 'rgba(239,68,68,0.9)', color: '#fff', minWidth: 64 }}
                              >
                                {deletingId === game.code ? (
                                  <svg className="animate-spin h-3.5 w-3.5 mx-auto" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                  </svg>
                                ) : 'Да'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs px-3 py-2 rounded-xl transition-all"
                                style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                              >
                                Нет
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(game.code)}
                              className="text-xs px-3 py-2 rounded-xl transition-all"
                              style={{ background: 'var(--bg-surface)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.25)' }}
                              title="Удалить игру"
                            >
                              🗑
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Игроки и очки */}
                    {game.players && game.players.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--border)' }}>
                        <div className="px-5 py-3 flex flex-wrap gap-2">
                          {game.players.map((p, rank) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                              style={{
                                background: rank === 0
                                  ? 'rgba(245,158,11,0.12)'
                                  : rank === 1
                                    ? 'rgba(156,163,175,0.1)'
                                    : rank === 2
                                      ? 'rgba(180,120,60,0.1)'
                                      : 'var(--bg-surface)',
                                border: `1px solid ${rank === 0
                                  ? 'rgba(245,158,11,0.3)'
                                  : rank === 1
                                    ? 'rgba(156,163,175,0.25)'
                                    : rank === 2
                                      ? 'rgba(180,120,60,0.25)'
                                      : 'var(--border)'}`,
                              }}
                            >
                              <span className="text-xs">
                                {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank + 1}.`}
                              </span>
                              <span
                                className="text-xs font-medium"
                                style={{
                                  color: rank === 0
                                    ? 'var(--accent-gold)'
                                    : 'var(--text-primary)',
                                }}
                              >
                                {p.name}
                              </span>
                              <span
                                className="text-xs font-bold"
                                style={{
                                  color: rank === 0
                                    ? 'var(--accent-gold)'
                                    : 'var(--text-muted)',
                                }}
                              >
                                {p.score} оч.
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
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
