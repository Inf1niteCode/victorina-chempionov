import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { connectSocket, getSocket } from '../socket/socket';
import { useGameStore } from '../store/gameStore';

export default function JoinGame() {
  const navigate = useNavigate();
  const { code: urlCode } = useParams<{ code?: string }>();

  const { setGameCode, setMyPlayer, setRoomError, roomError, resetGame } = useGameStore();

  const [code, setCode] = useState(urlCode?.toUpperCase() || '');
  const [name, setName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    resetGame();
  }, []);

  const handleJoin = () => {
    const trimCode = code.trim().toUpperCase();
    const trimName = name.trim();

    if (!trimCode || trimCode.length < 4) {
      setRoomError('Введите код игры (4–6 символов)');
      return;
    }
    if (!trimName) {
      setRoomError('Введите ваше имя');
      return;
    }

    setRoomError(null);
    setIsJoining(true);

    connectSocket();
    const socket = getSocket();

    // Слушаем ответ один раз
    const onJoined = (data: {
      playerId: string;
      playerName: string;
      gameStatus: string;
      currentTour: number;
      totalTours: number;
    }) => {
      setGameCode(trimCode);
      setMyPlayer(data.playerId, data.playerName);
      setIsJoining(false);
      navigate(`/play/${trimCode}`);
    };

    const onError = ({ message }: { message: string }) => {
      setRoomError(message);
      setIsJoining(false);
      socket.off('room:joined', onJoined);
    };

    socket.once('room:joined', onJoined);
    socket.once('room:error', onError);

    socket.emit('room:join', { code: trimCode, playerName: trimName });

    // Таймаут на случай если сервер не ответил
    setTimeout(() => {
      socket.off('room:joined', onJoined);
      socket.off('room:error', onError);
      if (isJoining) {
        setRoomError('Сервер не отвечает. Попробуйте ещё раз.');
        setIsJoining(false);
      }
    }, 8000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--bg-deep)' }}
    >
      {/* Фоновое свечение */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59,130,246,0.07) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm"
      >
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🎮</div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Войти в игру
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Введите код и своё имя
          </p>
        </div>

        {/* Карточка */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Поле кода */}
          <div>
            <label
              className="block text-xs font-medium mb-1.5 uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}
            >
              Код игры
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
              }
              onKeyDown={handleKeyDown}
              placeholder="KVIZ42"
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl text-center text-2xl font-bold tracking-widest outline-none transition-all"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--accent-gold)',
                letterSpacing: '0.2em',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-blue)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Поле имени */}
          <div>
            <label
              className="block text-xs font-medium mb-1.5 uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}
            >
              Ваше имя
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 20))}
              onKeyDown={handleKeyDown}
              placeholder="Как вас зовут?"
              maxLength={20}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-blue)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Ошибка */}
          <AnimatePresence>
            {roomError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl px-4 py-3 text-sm"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: 'var(--accent-red)',
                }}
              >
                {roomError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Кнопка */}
          <button
            onClick={handleJoin}
            disabled={isJoining}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all"
            style={{
              background: isJoining ? 'var(--bg-surface)' : 'var(--accent-blue)',
              color: isJoining ? 'var(--text-muted)' : '#fff',
              cursor: isJoining ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isJoining)
                (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.filter = '';
            }}
          >
            {isJoining ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Подключаемся...
              </span>
            ) : (
              'Войти в игру →'
            )}
          </button>
        </div>

        <p className="text-center mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          Код игры даёт ведущий
        </p>
      </motion.div>
    </div>
  );
}
