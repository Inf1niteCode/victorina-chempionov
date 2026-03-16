import { create } from 'zustand';
import type { Player, BoardTheme } from '@victorina/shared';

// ────────────────────────────────────────────
// Типы
// ────────────────────────────────────────────

export type GameScreen =
  | 'lobby'        // ожидание игроков
  | 'board'        // поле 5×5 между вопросами
  | 'question'     // активный вопрос
  | 'tour-results' // промежуточный результат тура
  | 'game-results' // финал

export interface ActiveQuestion {
  questionId: string;
  text: string;
  answer: string;      // только для ведущего
  points: number;
  themeName: string;
  timeLimit: number;
}

export interface GameState {
  // Общее
  gameCode: string | null;
  screen: GameScreen;
  players: Player[];
  currentTour: number;
  totalTours: number;

  // Для ведущего
  boardThemes: BoardTheme[];
  answeredQuestions: Set<string>;

  // Для игрока
  myPlayerId: string | null;
  myPlayerName: string | null;

  // Активный вопрос
  activeQuestion: ActiveQuestion | null;
  buzzWinner: { playerId: string; playerName: string } | null;
  isBuzzBlocked: boolean;   // этот игрок уже нажал и проиграл buzz
  hasBuzzed: boolean;       // этот игрок нажал buzz в текущем вопросе

  // Таймер
  timerSeconds: number;
  timerPaused: boolean;

  // Финал
  finalScores: Player[];
  winner: Player | null;

  // Ошибки/уведомления
  roomError: string | null;

  // ────────────────────────────────
  // Actions
  // ────────────────────────────────
  setGameCode: (code: string) => void;
  setScreen: (screen: GameScreen) => void;
  setPlayers: (players: Player[]) => void;
  setMyPlayer: (id: string, name: string) => void;
  setBoardThemes: (themes: BoardTheme[]) => void;
  setTour: (current: number, total: number) => void;
  setActiveQuestion: (q: ActiveQuestion | null) => void;
  markAnswered: (questionId: string) => void;
  setBuzzWinner: (winner: { playerId: string; playerName: string } | null) => void;
  setBuzzBlocked: (blocked: boolean) => void;
  setHasBuzzed: (val: boolean) => void;
  setTimer: (seconds: number) => void;
  setTimerPaused: (paused: boolean) => void;
  setFinalResults: (winner: Player, scores: Player[]) => void;
  setRoomError: (msg: string | null) => void;
  resetBuzzState: () => void;
  resetBuzzForWrong: () => void;
  resetAnsweredQuestions: () => void;
  resetGame: () => void;
}

// ────────────────────────────────────────────
// Store
// ────────────────────────────────────────────

export const useGameStore = create<GameState>()((set) => ({
  gameCode: null,
  screen: 'lobby',
  players: [],
  currentTour: 1,
  totalTours: 1,
  boardThemes: [],
  answeredQuestions: new Set(),
  myPlayerId: localStorage.getItem('player_id'),
  myPlayerName: localStorage.getItem('player_name'),
  activeQuestion: null,
  buzzWinner: null,
  isBuzzBlocked: false,
  hasBuzzed: false,
  timerSeconds: 30,
  timerPaused: false,
  finalScores: [],
  winner: null,
  roomError: null,

  setGameCode: (code) => set({ gameCode: code }),
  setScreen: (screen) => set({ screen }),
  setPlayers: (players) => set({ players }),
  setMyPlayer: (id, name) => {
    localStorage.setItem('player_id', id);
    localStorage.setItem('player_name', name);
    set({ myPlayerId: id, myPlayerName: name });
  },
  setBoardThemes: (themes) => set({ boardThemes: themes }),
  setTour: (current, total) => set({ currentTour: current, totalTours: total }),

  setActiveQuestion: (q) =>
    set({
      activeQuestion: q,
      buzzWinner: null,
      isBuzzBlocked: false,
      hasBuzzed: false,
    }),

  markAnswered: (questionId) =>
    set((state) => {
      const next = new Set(state.answeredQuestions);
      next.add(questionId);
      return { answeredQuestions: next };
    }),

  setBuzzWinner: (winner) => set({ buzzWinner: winner }),
  setBuzzBlocked: (blocked) => set({ isBuzzBlocked: blocked }),
  setHasBuzzed: (val) => set({ hasBuzzed: val }),
  setTimer: (seconds) => set({ timerSeconds: seconds }),
  setTimerPaused: (paused) => set({ timerPaused: paused }),

  setFinalResults: (winner, scores) =>
    set({ winner, finalScores: scores, screen: 'game-results' }),

  setRoomError: (msg) => set({ roomError: msg }),

  resetBuzzState: () =>
    set({ buzzWinner: null, isBuzzBlocked: false, hasBuzzed: false }),

  resetBuzzForWrong: () =>
    set({ buzzWinner: null, isBuzzBlocked: false }),

  resetAnsweredQuestions: () =>
    set({ answeredQuestions: new Set() }),

  resetGame: () => {
    localStorage.removeItem('player_id');
    localStorage.removeItem('player_name');
    set({
      gameCode: null,
      screen: 'lobby',
      players: [],
      currentTour: 1,
      totalTours: 1,
      boardThemes: [],
      answeredQuestions: new Set(),
      myPlayerId: null,
      myPlayerName: null,
      activeQuestion: null,
      buzzWinner: null,
      isBuzzBlocked: false,
      hasBuzzed: false,
      timerSeconds: 30,
      timerPaused: false,
      finalScores: [],
      winner: null,
      roomError: null,
    });
  },
}));
