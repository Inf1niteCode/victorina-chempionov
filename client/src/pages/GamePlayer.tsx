import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { connectSocket, getSocket } from '../socket/socket';
import { useGameStore } from '../store/gameStore';
import { useSocketEvents } from '../socket/useSocketEvents';
import BuzzButton from '../components/BuzzButton/BuzzButton';
import Timer from '../components/Timer/Timer';
import Scoreboard from '../components/Scoreboard/Scoreboard';
import TourIndicator from '../components/TourIndicator/TourIndicator';

export default function GamePlayer() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  useSocketEvents();

  const {
    screen, players, activeQuestion,
    buzzWinner, isBuzzBlocked, hasBuzzed,
    timerSeconds, timerPaused,
    currentTour, totalTours,
    myPlayerId, myPlayerName,
    finalScores, winner,
    setHasBuzzed, setRoomError, roomError,
  } = useGameStore();

  const myPlayer = players.find((p) => p.id === myPlayerId);
  const myRank = [...players]
    .sort((a, b) => b.score - a.score)
    .findIndex((p) => p.id === myPlayerId) + 1;

  // ── Подключение ──────────────────────────
  useEffect(() => {
    if (!code) { navigate('/join'); return; }
    if (!myPlayerId || !myPlayerName) { navigate(`/join/${code}`); return; }

    connectSocket();
    const socket = getSocket();

    // Переподключаемся к комнате с нашим playerId
    socket.emit('room:rejoinPlayer', { code, playerId: myPlayerId, playerName: myPlayerName });

    return () => {};
  }, [code, myPlayerId, myPlayerName]);

  // ── Buzz ─────────────────────────────────
  const handleBuzz = useCallback(() => {
    if (!code || !myPlayerId || !myPlayerName) return;
    if (hasBuzzed || isBuzzBlocked) return;

    setHasBuzzed(true);

    if (navigator.vibrate) navigator.vibrate(200);

    getSocket().emit('buzz:press', {
      code,
      playerId: myPlayerId,
      playerName: myPlayerName,
    });
  }, [code, myPlayerId, myPlayerName, hasBuzzed, isBuzzBlocked]);

  const iAmWinner = buzzWinner?.playerId === myPlayerId;
  const someoneElseWon = buzzWinner !== null && !iAmWinner;

  if (!code || !myPlayerId) return null;

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: 'var(--bg-deep)', maxWidth: 480, margin: '0 auto' }}
    >
      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════
            ЛОББИ
        ══════════════════════════════════ */}
        {screen === 'lobby' && (
          <motion.div key="lobby"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Шапка */}
            <div className="px-5 py-4 flex items-center justify-between flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Код игры</p>
                <p className="font-bold text-lg tracking-widest" style={{ color: 'var(--accent-gold)' }}>
                  {code}
                </p>
              </div>
              {myPlayer && (
                <div className="text-right">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Вы</p>
                  <p className="font-bold text-sm" style={{ color: 'var(--accent-blue)' }}>
                    {myPlayer.name}
                  </p>
                </div>
              )}
            </div>

            {/* Ожидание */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  ⏳
                </motion.div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Ждём начала игры
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  Ведущий запустит игру с панели управления
                </p>
              </div>

              <TourIndicator current={1} total={totalTours} size="md" />
            </div>

            {/* Список игроков */}
            <div className="px-5 pb-6 flex-shrink-0">
              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="px-4 py-3 flex items-center justify-between"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}>
                    Участники
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--accent-gold)' }}>
                    {players.length}
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {players.map((p, i) => (
                    <div key={p.id}
                      className="flex items-center gap-3 px-4 py-2.5"
                      style={{ borderBottom: '1px solid rgba(55,65,81,0.4)' }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          background: p.id === myPlayerId ? 'rgba(59,130,246,0.2)' : 'var(--bg-surface)',
                          color: p.id === myPlayerId ? 'var(--accent-blue)' : 'var(--text-muted)',
                          border: `1px solid ${p.id === myPlayerId ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
                        }}>
                        {i + 1}
                      </div>
                      <span className="text-sm font-medium"
                        style={{ color: p.id === myPlayerId ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                        {p.name}{p.id === myPlayerId ? ' (вы)' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════
            ПОЛЕ (между вопросами)
        ══════════════════════════════════ */}
        {screen === 'board' && (
          <motion.div key="board"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Мой счёт */}
            <div className="px-5 py-4 flex-shrink-0"
              style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {myPlayerName}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--accent-gold)' }}>
                    {myPlayer?.score.toLocaleString('ru-RU') ?? 0}
                    <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
                      очков
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <TourIndicator current={currentTour} total={totalTours} size="sm" />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {myRank > 0 ? `${myRank}-е место` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Ожидание вопроса */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-5xl"
              >
                👀
              </motion.div>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Ждём следующего вопроса...
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Ведущий выбирает тему
              </p>
            </div>

            {/* Мини-рейтинг */}
            <div className="px-5 pb-6 flex-shrink-0">
              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}>
                    Рейтинг
                  </p>
                </div>
                <div className="p-3">
                  <Scoreboard players={players} myPlayerId={myPlayerId} compact />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════
            ВОПРОС — главный экран
        ══════════════════════════════════ */}
        {screen === 'question' && activeQuestion && (
          <motion.div key="question"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Мета */}
            <div className="px-5 py-3 flex items-center justify-between flex-shrink-0"
              style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <span style={{
                  padding: '3px 10px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600,
                  background: 'rgba(245,158,11,0.15)', color: 'var(--accent-gold)',
                  border: '1px solid rgba(245,158,11,0.3)',
                }}>
                  {activeQuestion.themeName}
                </span>
                <span style={{
                  padding: '3px 10px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 700,
                  background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)',
                  border: '1px solid rgba(59,130,246,0.3)',
                }}>
                  {activeQuestion.points}
                </span>
              </div>
              <Timer seconds={timerSeconds} total={activeQuestion.timeLimit} paused={timerPaused} size="sm" />
            </div>

            {/* Текст вопроса */}
            <div className="px-5 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <motion.p
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  fontSize: 'clamp(1rem, 4vw, 1.4rem)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  lineHeight: 1.4,
                }}
              >
                {activeQuestion.text}
              </motion.p>
            </div>

            {/* КНОПКА — главное */}
            <div className="flex-1 flex flex-col px-5 py-4">
              <BuzzButton
                onBuzz={handleBuzz}
                disabled={timerSeconds === 0 || timerPaused}
                blocked={isBuzzBlocked}
                winner={iAmWinner}
                winnerName={someoneElseWon ? buzzWinner?.playerName : undefined}
              />
            </div>

            {/* Мой счёт внизу */}
            <div className="px-5 py-3 flex-shrink-0 flex items-center justify-between"
              style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {myPlayerName}
              </span>
              <span className="font-bold" style={{ color: 'var(--accent-gold)' }}>
                {myPlayer?.score.toLocaleString('ru-RU') ?? 0} очков
              </span>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════
            ИТОГИ ТУРА
        ══════════════════════════════════ */}
        {screen === 'tour-results' && (
          <motion.div key="tour-results"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="px-5 py-4 flex-shrink-0"
              style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏅</span>
                <div>
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    Тур {currentTour} завершён!
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {currentTour < totalTours
                      ? `Осталось туров: ${totalTours - currentTour}`
                      : 'Финальный тур'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Мой результат */}
              {myPlayer && (
                <motion.div
                  initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                  className="rounded-2xl p-4 mb-4 text-center"
                  style={{
                    background: 'rgba(59,130,246,0.12)',
                    border: '1px solid rgba(59,130,246,0.3)',
                  }}
                >
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Ваш результат</p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--accent-blue)' }}>
                    {myPlayer.score.toLocaleString('ru-RU')}
                    <span className="text-base font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
                      очков
                    </span>
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    {myRank}-е место из {players.length}
                  </p>
                </motion.div>
              )}

              <Scoreboard players={players} myPlayerId={myPlayerId} />

              {currentTour < totalTours && (
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
                  className="text-center text-sm mt-6"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Ведущий запустит тур {currentTour + 1}...
                </motion.p>
              )}
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════
            ФИНАЛ
        ══════════════════════════════════ */}
        {screen === 'game-results' && (
          <motion.div key="game-results"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-6"
          >
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="text-center"
            >
              <div className="text-6xl mb-3">🏆</div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--accent-gold)' }}>
                Игра завершена!
              </h2>
            </motion.div>

            {winner && (
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="rounded-2xl px-6 py-4 text-center"
                style={{
                  background: 'rgba(245,158,11,0.15)',
                  border: '2px solid var(--accent-gold)',
                  boxShadow: '0 0 32px rgba(245,158,11,0.3)',
                }}
              >
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Победитель</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--accent-gold)' }}>
                  {winner.name}
                  {winner.id === myPlayerId && ' 🎉'}
                </p>
                <p className="text-lg font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {winner.score.toLocaleString('ru-RU')} очков
                </p>
              </motion.div>
            )}

            {/* Мой итог */}
            {myPlayer && myPlayer.id !== winner?.id && (
              <div className="rounded-2xl px-5 py-3 text-center"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
                <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Ваш результат</p>
                <p className="text-xl font-bold" style={{ color: 'var(--accent-blue)' }}>
                  {myRank}-е место · {myPlayer.score.toLocaleString('ru-RU')} очков
                </p>
              </div>
            )}

            <div className="w-full rounded-2xl overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Итоговая таблица
                </p>
              </div>
              <div className="p-3">
                <Scoreboard players={finalScores} myPlayerId={myPlayerId} compact />
              </div>
            </div>

            <button
              onClick={() => navigate('/join')}
              className="w-full py-4 rounded-2xl font-bold text-lg"
              style={{ background: 'var(--accent-blue)', color: '#fff' }}
            >
              Сыграть ещё раз
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
