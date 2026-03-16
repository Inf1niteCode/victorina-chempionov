import { useEffect } from 'react';
import { getSocket } from '../socket/socket';
import { useGameStore } from '../store/gameStore';
import type { Player } from '@victorina/shared';

/**
 * Центральный хук подписки на Socket.io события.
 * Монтируется один раз на уровне страницы (Host / Player / Display).
 */
export function useSocketEvents() {
  const {
    setPlayers,
    setScreen,
    setActiveQuestion,
    markAnswered,
    setBuzzWinner,
    setBuzzBlocked,
    resetBuzzForWrong,
    setTimer,
    setTimerPaused,
    setTour,
    setBoardThemes,
    setFinalResults,
    setRoomError,
    resetBuzzState,
    setHasBuzzed,
    resetAnsweredQuestions,
  } = useGameStore();

  useEffect(() => {
    const socket = getSocket();

    // ── Лобби ──────────────────────────────────
    socket.on('room:playerList', ({ players }) => {
      setPlayers(players as Player[]);
    });

    socket.on('room:error', ({ message }) => {
      setRoomError(message);
    });

    // При переподключении — синхронизируем экран
    socket.on('room:joined', (data: { gameStatus: string; currentTour: number; totalTours: number }) => {
      if (data.gameStatus === 'ACTIVE') setScreen('board');
      setTour(data.currentTour, data.totalTours);
    });

    // ── Игра ────────────────────────────────────
    socket.on('game:start', () => {
      setScreen('board');
    });

    // ── Тур ─────────────────────────────────────
    socket.on('tour:start', ({ tourNumber, totalTours, themes }) => {
      setTour(tourNumber, totalTours);
      setBoardThemes(themes);
      setScreen('board');
      // Sync answered questions from server state (important for display page and reconnects)
      resetAnsweredQuestions();
      themes.forEach((theme: { cells: { questionId: string; answered: boolean }[] }) => {
        theme.cells.forEach((cell) => {
          if (cell.answered) markAnswered(cell.questionId);
        });
      });
    });

    socket.on('tour:end', () => {
      setScreen('tour-results');
    });

    // ── Вопрос ──────────────────────────────────
    socket.on('question:open', (data) => {
      setActiveQuestion({
        questionId: data.questionId,
        text: data.text,
        answer: data.answer,   // пустая строка для игроков
        points: data.points,
        themeName: data.themeName,
        timeLimit: data.timeLimit,
      });
      setScreen('question');
    });

    socket.on('question:close', ({ questionId }) => {
      markAnswered(questionId);
      resetBuzzState();
      setHasBuzzed(false);
      setScreen('board');
    });

    // ── Buzz ─────────────────────────────────────
    socket.on('buzz:winner', (data) => {
      setBuzzWinner(data);
    });

    socket.on('buzz:blocked', () => {
      setBuzzBlocked(true);
    });

    socket.on('buzz:reset', () => {
      resetBuzzForWrong();
    });

    // ── Таймер ───────────────────────────────────
    socket.on('timer:tick', ({ secondsLeft }) => {
      setTimer(secondsLeft);
    });

    socket.on('timer:end', () => {
      setTimer(0);
    });

    socket.on('timer:paused', () => {
      setTimerPaused(true);
    });

    socket.on('timer:reset', () => {
      setTimerPaused(false);
    });

    // ── Счёт ─────────────────────────────────────
    socket.on('score:update', ({ players }) => {
      setPlayers(players as Player[]);
    });

    // ── Финал ────────────────────────────────────
    socket.on('game:end', ({ winner, finalScores }) => {
      setFinalResults(winner as Player, finalScores as Player[]);
    });

    return () => {
      socket.off('room:playerList');
      socket.off('room:error');
      socket.off('room:joined');
      socket.off('game:start');
      socket.off('tour:start');
      socket.off('tour:end');
      socket.off('question:open');
      socket.off('question:close');
      socket.off('buzz:winner');
      socket.off('buzz:blocked');
      socket.off('buzz:reset');
      socket.off('timer:tick');
      socket.off('timer:end');
      socket.off('timer:paused');
      socket.off('timer:reset');
      socket.off('score:update');
      socket.off('game:end');
    };
  }, []);
}
