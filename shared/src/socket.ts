import { Player, BoardTheme } from './game';

// ──────────────────────────────────────────
// EVENTS: CLIENT → SERVER
// ──────────────────────────────────────────
export interface ClientToServerEvents {
  'room:create': (data: RoomCreatePayload) => void;
  'room:join': (data: RoomJoinPayload) => void;
  'game:start': (data: { code: string }) => void;
  'question:open': (data: QuestionOpenPayload) => void;
  'question:close': (data: { questionId: string; code: string }) => void;
  'buzz:press': (data: { code: string; playerId: string; playerName: string }) => void;
  'score:correct': (data: ScoreUpdatePayload) => void;
  'score:wrong': (data: ScoreUpdatePayload) => void;
  'timer:pause': (data: { code: string }) => void;
  'timer:reset': (data: { code: string }) => void;
  'tour:next': (data: { code: string }) => void;
  'game:end': (data: { code: string }) => void;
}

// ──────────────────────────────────────────
// EVENTS: SERVER → CLIENT
// ──────────────────────────────────────────
export interface ServerToClientEvents {
  'room:playerList': (data: { players: Player[] }) => void;
  'room:playerJoined': (data: { playerName: string }) => void;
  'room:error': (data: { message: string }) => void;
  'game:start': (data: { code: string }) => void;
  'tour:start': (data: TourStartPayload) => void;
  'tour:end': (data: TourEndPayload) => void;
  'game:end': (data: GameEndPayload) => void;
  'question:open': (data: QuestionOpenBroadcast) => void;
  'question:close': (data: { questionId: string }) => void;
  'buzz:winner': (data: { playerId: string; playerName: string }) => void;
  'buzz:blocked': () => void;
  'timer:tick': (data: { secondsLeft: number }) => void;
  'timer:end': () => void;
  'timer:paused': () => void;
  'timer:reset': () => void;
  'score:update': (data: { players: Player[] }) => void;
}

// ──────────────────────────────────────────
// PAYLOAD TYPES
// ──────────────────────────────────────────
export interface RoomCreatePayload {
  code: string;
  timerSecs: number;
  tours: TourSetup[];
}

export interface TourSetup {
  tourNumber: number;
  themeIds: string[];
}

export interface RoomJoinPayload {
  code: string;
  playerName: string;
}

export interface QuestionOpenPayload {
  code: string;
  questionId: string;
}

export interface QuestionOpenBroadcast {
  questionId: string;
  text: string;
  answer: string;
  points: number;
  themeName: string;
  timeLimit: number;
}

export interface ScoreUpdatePayload {
  code: string;
  playerId: string;
  questionId: string;
}

export interface TourStartPayload {
  tourNumber: number;
  totalTours: number;
  themes: BoardTheme[];
}

export interface TourEndPayload {
  scores: Player[];
  tourNumber: number;
  isLastTour: boolean;
}

export interface GameEndPayload {
  winner: Player;
  finalScores: Player[];
}
