import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { connectSocket, getSocket } from '../socket/socket';
import { useGameStore } from '../store/gameStore';
import { useSocketEvents } from '../socket/useSocketEvents';
import GameBoard from '../components/GameBoard/GameBoard';
import Timer from '../components/Timer/Timer';
import Scoreboard from '../components/Scoreboard/Scoreboard';
import TourIndicator from '../components/TourIndicator/TourIndicator';
import BuzzWinner from '../components/BuzzWinner/BuzzWinner';

export default function GameDisplay() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code')?.toUpperCase() || '';

  useSocketEvents();

  const {
    screen, players, boardThemes, answeredQuestions,
    activeQuestion, buzzWinner, timerSeconds, timerPaused,
    currentTour, totalTours, finalScores, winner, setGameCode,
  } = useGameStore();

  const [error, setError] = useState('');
  const joinUrl = `${window.location.origin}/join/${code}`;

  useEffect(() => {
    if (!code) { setError('Код не указан. Добавьте ?code=KVIZ42 в URL.'); return; }
    setGameCode(code);
    connectSocket();
    const socket = getSocket();
    socket.emit('room:joinDisplay', { code });
    socket.on('room:error', ({ message }) => setError(message));
    return () => { socket.off('room:error'); };
  }, [code]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p style={{ color: 'var(--accent-red)', fontSize: '1.5rem' }}>{error}</p>
        </div>
      </div>
    );
  }

  const ScoreBar = () => (
    <div className="px-8 py-3 flex items-center gap-6 overflow-x-auto flex-shrink-0"
      style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
        <div key={p.id} className="flex items-center gap-2 flex-shrink-0">
          <span>{['🥇', '🥈', '🥉'][i] || `${i + 1}.`}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.name}</span>
          <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>
            {p.score.toLocaleString('ru-RU')}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-deep)' }}>
      <AnimatePresence mode="wait">

        {/* ─── ЛОББИ ─── */}
        {screen === 'lobby' && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col">
            <div className="px-12 py-5 flex items-center justify-between flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-4">
                <span style={{ fontSize: '2rem' }}>🏆</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Викторина Чемпионов
                </span>
              </div>
              <motion.div className="flex items-center gap-2"
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <div className="w-3 h-3 rounded-full" style={{ background: 'var(--accent-green)' }} />
                <span style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: '0.9rem' }}>LIVE</span>
              </motion.div>
            </div>

            <div className="flex-1 flex items-center justify-center px-12 py-6">
              <div className="w-full max-w-6xl grid grid-cols-3 gap-10 items-center">
                {/* Инструкции */}
                <div className="space-y-5">
                  <div className="rounded-3xl p-7 text-center"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: 6 }}>Зайдите на</p>
                    <p style={{ color: 'var(--accent-blue)', fontSize: '1.3rem', fontWeight: 700, marginBottom: 16 }}>
                      {window.location.host}
                    </p>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: 6 }}>Код игры</p>
                      <div style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--accent-gold)', letterSpacing: '0.12em' }}>
                        {code}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl p-5 text-center"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>Или QR-код</p>
                    <div className="flex justify-center">
                      <div className="p-3 rounded-2xl bg-white">
                        <QRCodeSVG value={joinUrl} size={130} bgColor="#fff" fgColor="#07090F" level="M" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Счётчик */}
                <div className="text-center">
                  <motion.div key={players.length}
                    initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    style={{ fontSize: '7rem', fontWeight: 900, color: 'var(--accent-gold)', lineHeight: 1 }}>
                    {players.length}
                  </motion.div>
                  <p style={{ fontSize: '1.4rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    {players.length === 1 ? 'участник' : players.length < 5 ? 'участника' : 'участников'}
                  </p>
                  <div className="flex justify-center gap-2 mt-6">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.div key={i} className="w-2 h-2 rounded-full"
                        style={{ background: 'var(--text-muted)' }}
                        animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }} />
                    ))}
                  </div>
                </div>

                {/* Список */}
                <div className="rounded-3xl overflow-hidden"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', maxHeight: '60vh' }}>
                  <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Участники</p>
                  </div>
                  <div className="overflow-y-auto" style={{ maxHeight: 'calc(60vh - 56px)' }}>
                    {players.length === 0 ? (
                      <div className="px-6 py-12 text-center">
                        <p style={{ fontSize: '3rem', marginBottom: 8 }}>👀</p>
                        <p style={{ color: 'var(--text-muted)' }}>Ещё никого...</p>
                      </div>
                    ) : players.map((p, i) => (
                      <motion.div key={p.id}
                        initial={{ opacity: 0, x: 12, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }}
                        className="flex items-center gap-4 px-6 py-3"
                        style={{ borderBottom: '1px solid rgba(55,65,81,0.4)' }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                          style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--accent-gold)', border: '1px solid rgba(245,158,11,0.3)', fontSize: '0.8rem' }}>
                          {i + 1}
                        </div>
                        <span style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {p.name}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── ПОЛЕ ─── */}
        {screen === 'board' && (
          <motion.div key="board"
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col">
            <div className="px-8 py-4 flex items-center justify-between flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '1.4rem' }}>🏆</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Викторина Чемпионов
                </span>
              </div>
              <TourIndicator current={currentTour} total={totalTours} />
            </div>
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="w-full max-w-5xl">
                <GameBoard themes={boardThemes} answeredQuestions={answeredQuestions} isHost={false} />
              </div>
            </div>
            <ScoreBar />
          </motion.div>
        )}

        {/* ─── ВОПРОС ─── */}
        {screen === 'question' && activeQuestion && (
          <motion.div key="question"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col">
            {/* Мета */}
            <div className="px-8 py-4 flex items-center justify-between flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <div className="flex items-center gap-3">
                <span style={{ padding: '3px 14px', borderRadius: 9999, fontSize: '0.85rem', fontWeight: 600, background: 'rgba(245,158,11,0.15)', color: 'var(--accent-gold)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  {activeQuestion.themeName}
                </span>
                <span style={{ padding: '3px 14px', borderRadius: 9999, fontSize: '0.85rem', fontWeight: 700, background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.3)' }}>
                  {activeQuestion.points} очков
                </span>
              </div>
              <TourIndicator current={currentTour} total={totalTours} size="sm" />
            </div>

            {/* Центр: вопрос + таймер */}
            <div className="flex-1 flex flex-col items-center justify-center px-16 py-8 relative">
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(59,130,246,0.05) 0%, transparent 70%)' }} />

              <motion.p
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  fontSize: 'clamp(1.8rem, 4.5vw, 4rem)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  maxWidth: '900px',
                  position: 'relative', zIndex: 1,
                }}
              >
                {activeQuestion.text}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-10"
              >
                <Timer seconds={timerSeconds} total={activeQuestion.timeLimit} paused={timerPaused} size="xl" />
              </motion.div>

              <AnimatePresence>
                {buzzWinner && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-8"
                  >
                    <BuzzWinner playerName={buzzWinner.playerName} size="lg" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ScoreBar />
          </motion.div>
        )}

        {/* ─── ИТОГИ ТУРА ─── */}
        {screen === 'tour-results' && (
          <motion.div key="tour-results"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center px-12 py-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-full max-w-lg text-center">
              <div style={{ fontSize: '4rem', marginBottom: 12 }}>🏅</div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>
                Тур {currentTour} завершён!
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '1.1rem' }}>
                Промежуточные результаты
              </p>
              <div className="rounded-3xl p-8"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <Scoreboard players={players} />
              </div>
              {currentTour < totalTours && (
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
                  style={{ color: 'var(--text-muted)', marginTop: 24, fontSize: '1rem' }}>
                  Ведущий запустит тур {currentTour + 1}...
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* ─── ФИНАЛ ─── */}
        {screen === 'game-results' && (
          <motion.div key="game-results"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-12 py-8">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 150, damping: 12 }}
              className="w-full max-w-2xl text-center">
              <div style={{ fontSize: '5rem', marginBottom: 12 }}>🏆</div>
              <h2 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent-gold)', marginBottom: 8 }}>
                Победитель
              </h2>
              {winner && (
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 12 }}
                  style={{
                    fontSize: '3.5rem', fontWeight: 900, color: 'var(--text-primary)',
                    padding: '14px 48px', borderRadius: 20, marginBottom: 32, display: 'inline-block',
                    background: 'rgba(245,158,11,0.15)', border: '2px solid var(--accent-gold)',
                    boxShadow: '0 0 48px rgba(245,158,11,0.35)',
                  }}
                >
                  {winner.name}
                </motion.div>
              )}
              <div className="rounded-3xl p-8"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <Scoreboard players={finalScores} />
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
