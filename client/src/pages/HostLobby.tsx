import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { connectSocket, getSocket } from '../socket/socket';
import { useGameStore } from '../store/gameStore';
import { useSocketEvents } from '../socket/useSocketEvents';
import { useAuthStore } from '../store/authStore';

export default function HostLobby() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { players, setGameCode, setTour, setScreen, roomError, setRoomError } = useGameStore();
  useSocketEvents();

  const [gameId, setGameId] = useState<string | null>(null);
  const [timerSecs, setTimerSecs] = useState(30);
  const [totalTours, setTotalTours] = useState(1);
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const displayUrl = `${window.location.origin}/display?code=${code}`;
  const joinUrl = `${window.location.origin}/join/${code}`;

  // ── Загружаем данные игры и подключаем сокет ──
  useEffect(() => {
    if (!code) return;

    let cleanup: (() => void) | null = null;

    const loadAndConnect = async () => {
      try {
        const res = await fetch(`/api/game/${code}`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const game = data.game;
        setGameId(game.id);
        setTimerSecs(game.timerSecs);
        setTotalTours(game.totalTours);
        setGameCode(code);
        setTour(game.currentTour, game.totalTours);

        connectSocket();
        const socket = getSocket();

        // Re-emit room:create on every reconnect so room survives server restarts
        const createRoom = () => {
          socket.emit('room:create', {
            code,
            gameId: game.id,
            timerSecs: game.timerSecs,
            totalTours: game.totalTours,
          });
        };

        socket.on('connect', createRoom);
        if (socket.connected) createRoom();
        cleanup = () => socket.off('connect', createRoom);
      } catch (err) {
        console.error('Ошибка загрузки игры:', err);
        setRoomError('Не удалось загрузить игру');
      }
    };

    loadAndConnect();
    return () => { cleanup?.(); };
  }, [code]);

  // ── Старт игры ──────────────────────────────
  const handleStart = useCallback(() => {
    if (!code || players.length === 0) return;
    setIsStarting(true);

    const socket = getSocket();
    socket.emit('game:start', { code });

    // Переход на экран ведущего
    navigate(`/host/game/${code}`);
  }, [code, players.length, navigate]);

  // ── Отмена игры ─────────────────────────────
  const handleCancel = async () => {
    if (!code || isCancelling) return;
    setIsCancelling(true);
    setCancelError('');
    try {
      const res = await fetch(`/api/game/${code}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка отмены');
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      setCancelError(err instanceof Error ? err.message : 'Не удалось отменить игру');
      setIsCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  // ── Копировать код ──────────────────────────
  const copyCode = () => {
    navigator.clipboard.writeText(code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!code) return null;

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)' }}
    >
      {/* Шапка */}
      <div
        className="px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Викторина Чемпионов
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Панель ведущего · {user?.name}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--accent-gold)' }}
          >
            Лобби
          </div>
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80"
            style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            Отменить игру
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">

        {/* ── ЛЕВАЯ КОЛОНКА: Код + QR ── */}
        <div className="space-y-6">

          {/* Код игры */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
              Код игры — скажите игрокам
            </p>
            <div
              className="text-4xl sm:text-6xl font-bold tracking-widest my-3 cursor-pointer select-all"
              style={{ color: 'var(--accent-gold)', letterSpacing: '0.15em' }}
              onClick={copyCode}
              title="Нажмите, чтобы скопировать"
            >
              {code}
            </div>
            <button
              onClick={copyCode}
              className="text-xs px-4 py-1.5 rounded-full transition-all"
              style={{
                background: copied ? 'rgba(16,185,129,0.15)' : 'var(--bg-surface)',
                color: copied ? 'var(--accent-green)' : 'var(--text-muted)',
                border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
              }}
            >
              {copied ? '✓ Скопировано!' : 'Скопировать код'}
            </button>

            {/* Ссылка для игроков */}
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Или отправьте ссылку:
              </p>
              <a
                href={joinUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs break-all hover:underline"
                style={{ color: 'var(--accent-blue)' }}
              >
                {joinUrl}
              </a>
            </div>
          </motion.div>

          {/* QR-код для игроков */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-6"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  QR для игроков
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Отсканируйте, чтобы войти в игру
                </p>
              </div>
              <a
                href={joinUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: 'var(--bg-surface)',
                  color: 'var(--accent-blue)',
                  border: '1px solid var(--border)',
                }}
              >
                Открыть ↗
              </a>
            </div>

            {/* QR */}
            <div className="flex justify-center">
              <div className="p-3 rounded-xl bg-white inline-block">
                <QRCodeSVG
                  value={joinUrl}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#07090F"
                  level="M"
                />
              </div>
            </div>

            <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
              Наведите камеру телефона на QR
            </p>
          </motion.div>

          {/* Дисплей */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl p-6"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  🖥️ Дисплей
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Откройте на втором экране
                </p>
              </div>
              <a
                href={displayUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{
                  background: 'rgba(59,130,246,0.12)',
                  color: 'var(--accent-blue)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  fontWeight: 600,
                }}
              >
                Открыть ↗
              </a>
            </div>
            <div className="flex justify-center">
              <div className="p-3 rounded-xl bg-white inline-block">
                <QRCodeSVG
                  value={displayUrl}
                  size={130}
                  bgColor="#ffffff"
                  fgColor="#07090F"
                  level="M"
                />
              </div>
            </div>
            <p className="text-xs text-center mt-3 break-all" style={{ color: 'var(--text-muted)' }}>
              {displayUrl}
            </p>
          </motion.div>

          {/* Параметры игры */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
              Параметры игры
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-xl p-3 text-center"
                style={{ background: 'var(--bg-surface)' }}
              >
                <div className="text-2xl font-bold" style={{ color: 'var(--accent-gold)' }}>
                  {timerSecs}с
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Таймер
                </div>
              </div>
              <div
                className="rounded-xl p-3 text-center"
                style={{ background: 'var(--bg-surface)' }}
              >
                <div className="text-2xl font-bold" style={{ color: 'var(--accent-blue)' }}>
                  {totalTours}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {totalTours === 1 ? 'Тур' : 'Тура'}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── ПРАВАЯ КОЛОНКА: Игроки + Старт ── */}
        <div className="space-y-6">

          {/* Список игроков */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                Участники
              </span>
              <motion.span
                key={players.length}
                initial={{ scale: 1.4 }}
                animate={{ scale: 1 }}
                className="text-sm font-bold px-2.5 py-0.5 rounded-full"
                style={{
                  background: players.length > 0
                    ? 'rgba(245,158,11,0.15)'
                    : 'var(--bg-surface)',
                  color: players.length > 0
                    ? 'var(--accent-gold)'
                    : 'var(--text-muted)',
                }}
              >
                {players.length} / ∞
              </motion.span>
            </div>

            <div className="min-h-48 max-h-72 overflow-y-auto">
              {players.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2">
                  <div className="text-3xl">👥</div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Ждём участников...
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Скажите им код: <strong style={{ color: 'var(--accent-gold)' }}>{code}</strong>
                  </p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  <AnimatePresence>
                    {players.map((player, i) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{
                            background: 'rgba(245,158,11,0.15)',
                            color: 'var(--accent-gold)',
                            border: '1px solid rgba(245,158,11,0.3)',
                          }}
                        >
                          {i + 1}
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {player.name}
                        </span>
                        <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
                          готов
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>

          {/* Кнопка старта */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onClick={handleStart}
            disabled={isStarting || players.length === 0}
            className="w-full py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl transition-all"
            style={{
              background:
                players.length === 0 || isStarting
                  ? 'var(--bg-surface)'
                  : 'linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)',
              color:
                players.length === 0 || isStarting ? 'var(--text-muted)' : '#07090F',
              cursor: players.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow:
                players.length > 0 && !isStarting
                  ? '0 8px 32px rgba(245,158,11,0.3)'
                  : 'none',
            }}
            whileHover={players.length > 0 ? { scale: 1.02 } : {}}
            whileTap={players.length > 0 ? { scale: 0.98 } : {}}
          >
            {isStarting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Запускаем...
              </span>
            ) : players.length === 0 ? (
              'Жду участников...'
            ) : (
              `🚀 Начать игру (${players.length} игр${players.length === 1 ? 'ок' : 'оков'})`
            )}
          </motion.button>

          {players.length > 0 && (
            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              После старта новые игроки не смогут присоединиться
            </p>
          )}

          {/* Ошибка отмены */}
          <AnimatePresence>
            {cancelError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-red)' }}
              >
                {cancelError}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Модальный диалог подтверждения отмены ── */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => !isCancelling && setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="rounded-3xl p-6 w-full max-w-sm"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-5">
                <div className="text-4xl mb-3">🗑️</div>
                <h2 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                  Отменить игру?
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Игра <strong style={{ color: 'var(--accent-gold)' }}>{code}</strong> будет удалена.
                  {players.length > 0 && (
                    <> Подключённые игроки ({players.length}) будут отключены.</>
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={isCancelling}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                >
                  Назад
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all"
                  style={{
                    background: isCancelling ? 'var(--bg-surface)' : 'rgba(239,68,68,0.9)',
                    color: isCancelling ? 'var(--text-muted)' : '#fff',
                    cursor: isCancelling ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isCancelling ? (
                    <span className="flex items-center gap-2 justify-center">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Удаляем...
                    </span>
                  ) : 'Да, отменить'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
