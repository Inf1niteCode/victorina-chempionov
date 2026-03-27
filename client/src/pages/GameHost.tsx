import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { connectSocket, getSocket } from '../socket/socket';
import { useGameStore } from '../store/gameStore';
import { useSocketEvents } from '../socket/useSocketEvents';
import { useAuthStore } from '../store/authStore';
import GameBoard from '../components/GameBoard/GameBoard';
import QuestionView from '../components/QuestionView/QuestionView';
import Scoreboard from '../components/Scoreboard/Scoreboard';
import TourIndicator from '../components/TourIndicator/TourIndicator';


export default function GameHost() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  useSocketEvents();

  const {
    screen, players, boardThemes, answeredQuestions,
    activeQuestion, buzzWinner, timerSeconds, timerPaused,
    currentTour, totalTours, setGameCode, setTour,
    setRoomError, resetGame, currentPicker, playerOrder,
  } = useGameStore();

  const [manualDelta, setManualDelta] = useState<Record<string, string>>({});

  // ── Подключение к комнате ────────────────
  useEffect(() => {
    if (!code) return;

    let cleanup: (() => void) | null = null;

    const setup = async () => {
      try {
        const res = await fetch(`/api/game/${code}/host`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) { navigate('/dashboard'); return; }

        const game = data.game;
        setGameCode(code);
        setTour(game.currentTour, game.totalTours);

        connectSocket();
        const socket = getSocket();

        // Re-emit room:create on every reconnect so room survives server restarts
        const createRoom = () => {
          socket.emit('room:create', {
            code, gameId: game.id,
            timerSecs: game.timerSecs,
            totalTours: game.totalTours,
          });
          if (game.status === 'ACTIVE') {
            socket.emit('tour:rejoin', { code });
          }
        };

        socket.on('connect', createRoom);
        if (socket.connected) createRoom();
        cleanup = () => socket.off('connect', createRoom);
      } catch (err) {
        navigate('/dashboard');
      }
    };

    setup();
    return () => { cleanup?.(); };
  }, [code]);

  // ── Действия ведущего ────────────────────
  const handleCellClick = useCallback((questionId: string) => {
    if (!code) return;
    getSocket().emit('question:open', { code, questionId });
  }, [code]);

  const handleCorrect = useCallback((playerId: string) => {
    if (!code || !activeQuestion) return;
    const qId = activeQuestion.questionId;
    getSocket().emit('score:correct', { code, playerId, questionId: qId });
    getSocket().emit('question:close', { code, questionId: qId });
  }, [code, activeQuestion]);

  const handleWrong = useCallback((playerId: string) => {
    if (!code || !activeQuestion) return;
    getSocket().emit('score:wrong', { code, playerId, questionId: activeQuestion.questionId });
    // Не закрываем вопрос — другой игрок может нажать buzz
  }, [code, activeQuestion]);

  const handleCloseQuestion = useCallback(() => {
    if (!code || !activeQuestion) return;
    getSocket().emit('question:close', { code, questionId: activeQuestion.questionId });
  }, [code, activeQuestion]);

  const handlePause = useCallback(() => {
    if (!code) return;
    getSocket().emit('timer:pause', { code });
  }, [code]);

  const handleReset = useCallback(() => {
    if (!code) return;
    getSocket().emit('timer:reset', { code });
  }, [code]);

  const handleNextTour = useCallback(() => {
    if (!code) return;
    getSocket().emit('tour:next', { code });
  }, [code]);

  const handleEndGame = useCallback(() => {
    if (!code || !confirm('Завершить игру досрочно?')) return;
    getSocket().emit('game:end', { code });
  }, [code]);

  const handleManualScore = useCallback((playerId: string, delta: number) => {
    if (!code) return;
    getSocket().emit('score:manual', { code, playerId, delta });
  }, [code]);

  if (!code) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-deep)' }}>

      {/* ── Шапка ── */}
      <header className="flex-shrink-0 px-3 sm:px-6 py-3 flex items-center justify-between gap-2"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-xl flex-shrink-0">🏆</span>
          <div className="min-w-0">
            <span className="font-bold text-sm hidden sm:inline" style={{ color: 'var(--text-primary)' }}>
              Ведущий
            </span>
            <span className="mx-2 text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>·</span>
            <span className="font-mono font-bold text-sm" style={{ color: 'var(--accent-gold)' }}>
              {code}
            </span>
          </div>
          <TourIndicator current={currentTour} total={totalTours} size="sm" />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a href={`/display?code=${code}`} target="_blank" rel="noreferrer"
            className="text-xs px-2 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
            style={{ background: 'var(--bg-surface)', color: 'var(--accent-blue)', border: '1px solid var(--border)' }}>
            <span>📺</span><span className="hidden sm:inline">Дисплей</span>
          </a>
          <button onClick={handleEndGame}
            className="text-xs px-2 sm:px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'var(--bg-surface)', color: 'var(--accent-red)', border: '1px solid var(--border)' }}>
            <span className="hidden sm:inline">Завершить</span>
            <span className="sm:hidden">✕</span>
          </button>
        </div>
      </header>

      {/* ── Основная область ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* ── Основная панель: поле или вопрос ── */}
        <div className="flex-1 flex flex-col p-3 sm:p-4 overflow-auto min-w-0">
          <AnimatePresence mode="wait">

            {/* ПОЛЕ */}
            {screen === 'board' && (
              <motion.div key="board"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} className="flex-1 flex flex-col">
                {currentPicker && (
                  <div className="mb-3 px-4 py-2 rounded-xl flex items-center gap-2 flex-shrink-0"
                    style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                    <span>👆</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Выбирает:</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>#{currentPicker.playerNumber} {currentPicker.playerName}</span>
                  </div>
                )}
                <GameBoard
                  themes={boardThemes}
                  answeredQuestions={answeredQuestions}
                  onCellClick={handleCellClick}
                  isHost={true}
                />
              </motion.div>
            )}

            {/* ВОПРОС */}
            {screen === 'question' && activeQuestion && (
              <motion.div key="question"
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }} className="flex-1 flex flex-col">
                <QuestionView
                  text={activeQuestion.text}
                  answer={activeQuestion.answer}
                  points={activeQuestion.points}
                  themeName={activeQuestion.themeName}
                  timeLimit={activeQuestion.timeLimit}
                  timerSeconds={timerSeconds}
                  timerPaused={timerPaused}
                  buzzWinner={buzzWinner}
                  showAnswer={true}
                  questionType={activeQuestion.questionType}
                  mediaUrl={activeQuestion.mediaUrl}
                  onCorrect={handleCorrect}
                  onWrong={handleWrong}
                  onPause={handlePause}
                  onReset={handleReset}
                  onClose={handleCloseQuestion}
                />
              </motion.div>
            )}

            {/* ИТОГИ ТУРА */}
            {screen === 'tour-results' && (
              <motion.div key="tour-results"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="text-center">
                  <div className="text-4xl mb-2">🏅</div>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Тур {currentTour} завершён!
                  </h2>
                  {currentTour < totalTours && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                      Следующий: Тур {currentTour + 1}
                    </p>
                  )}
                </div>

                <div className="w-full max-w-sm rounded-2xl p-5"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <Scoreboard players={players} />
                </div>

                {currentTour < totalTours ? (
                  <button onClick={handleNextTour}
                    className="px-8 py-4 rounded-2xl font-bold text-lg transition-all"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)',
                      color: '#07090F',
                      boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
                    }}>
                    ▶ Начать Тур {currentTour + 1}
                  </button>
                ) : (
                  <button onClick={handleEndGame}
                    className="px-8 py-4 rounded-2xl font-bold text-lg transition-all"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)',
                      color: '#07090F',
                      boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
                    }}>
                    🏆 Завершить игру
                  </button>
                )}
              </motion.div>
            )}

            {/* ФИНАЛ */}
            {screen === 'game-results' && (
              <motion.div key="game-results"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="text-4xl">🏆</div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--accent-gold)' }}>
                  Игра завершена!
                </h2>
                <div className="w-full max-w-sm rounded-2xl p-5"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <Scoreboard players={players} />
                </div>
                <Link to="/dashboard"
                  className="px-6 py-3 rounded-xl font-bold transition-all"
                  style={{ background: 'var(--accent-blue)', color: '#fff' }}>
                  ← В личный кабинет
                </Link>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Правая панель: счёт (десктоп) ── */}
        <div className="hidden lg:flex w-72 flex-shrink-0 border-l flex-col"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}>
              Счёт игроков
            </p>
            {currentPicker && (
              <p className="text-xs mt-1" style={{ color: 'var(--accent-gold)' }}>
                Выбирает: <strong>#{currentPicker.playerNumber} {currentPicker.playerName}</strong>
              </p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {[...players].sort((a, b) => b.score - a.score).map((p) => {
              const num = playerOrder.indexOf(p.id) + 1;
              return (
                <div key={p.id} className="flex items-center gap-1.5 py-1.5 px-2 rounded-xl mb-1"
                  style={{ background: 'var(--bg-surface)' }}>
                  <span className="text-xs font-bold w-5 text-center flex-shrink-0"
                    style={{ color: 'var(--text-muted)' }}>
                    #{num || '?'}
                  </span>
                  <span className="flex-1 text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {p.name}
                  </span>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: 'var(--accent-gold)' }}>
                    {p.score}
                  </span>
                  <div className="flex gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => handleManualScore(p.id, -100)}
                      className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center"
                      style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.3)' }}
                      title="-100"
                    >−</button>
                    <button
                      onClick={() => handleManualScore(p.id, +100)}
                      className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center"
                      style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)', border: '1px solid rgba(16,185,129,0.3)' }}
                      title="+100"
                    >+</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-surface)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Вопросов</p>
              <p className="font-bold text-lg" style={{ color: 'var(--accent-gold)' }}>
                {answeredQuestions.size}
                <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}> / 25</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── Нижняя полоса счёта (мобиль/планшет) ── */}
        <div className="lg:hidden flex-shrink-0 border-t overflow-x-auto"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <div className="flex items-center gap-2 px-3 py-2 min-w-max">
            <span className="text-xs font-semibold uppercase tracking-wide flex-shrink-0 mr-1"
              style={{ color: 'var(--text-muted)' }}>
              Счёт:
            </span>
            {players.length === 0 ? (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>нет игроков</span>
            ) : (
              [...players]
                .sort((a, b) => b.score - a.score)
                .map((p, i) => (
                  <div key={p.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl flex-shrink-0"
                    style={{
                      background: i === 0 ? 'rgba(245,158,11,0.15)' : 'var(--bg-surface)',
                      border: `1px solid ${i === 0 ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                    }}>
                    <span className="text-xs font-medium" style={{ color: i === 0 ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
                      {p.name}
                    </span>
                    <span className="text-xs font-bold" style={{ color: i === 0 ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                      {p.score}
                    </span>
                  </div>
                ))
            )}
            <div className="flex-shrink-0 ml-2 px-2.5 py-1 rounded-xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {answeredQuestions.size}<span style={{ color: 'var(--border)' }}>/</span>25
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
