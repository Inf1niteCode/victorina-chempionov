import { Player, BoardTheme, QuestionType } from './game';

export interface ClientToServerEvents {
  'room:create': (data: RoomCreatePayload) => void;
  'room:join': (data: RoomJoinPayload) => void;
  'game:start': (data: { code: string }) => void;
  'question:open': (data: QuestionOpenPayload) => void;
  'question:close': (data: { questionId: string; code: string }) => void;
  'buzz:press': (data: { code: string; playerId: string; playerName: string }) => void;
  'score:correct': (data: ScoreUpdatePayload) => void;
  'score:wrong': (data: ScoreUpdatePayload) => void;
  'score:manual': (data: { code: string; playerId: string; delta: number }) => void;
  'timer:pause': (data: { code: string }) => void;
  'timer:reset': (data: { code: string }) => void;
  'tour:next': (data: { code: string }) => void;
  'game:end': (data: { code: string }) => void;
  'room:getPlayers': (data: { code: string }) => void;
  'tour:rejoin': (data: { code: string }) => void;
  'room:rejoinPlayer': (data: { code: string; playerId: string; playerName: string }) => void;
  'room:joinDisplay': (data: { code: string }) => void;
}

export interface ServerToClientEvents {
  'room:playerList': (data: { players: Player[]; playerOrder?: string[] }) => void;
  'room:playerJoined': (data: { playerName: string }) => void;
  'room:error': (data: { message: string }) => void;
  'room:joined': (data: { playerId: string; playerName: string; gameStatus: string; currentTour: number; totalTours: number }) => void;
  'room:hostDisconnected': (data: { message: string }) => void;
  'game:start': (data: { code: string }) => void;
  'tour:start': (data: TourStartPayload) => void;
  'tour:end': (data: TourEndPayload) => void;
  'game:end': (data: GameEndPayload) => void;
  'question:open': (data: QuestionOpenBroadcast) => void;
  'question:close': (data: { questionId: string }) => void;
  'question:picker': (data: { playerId: string; playerName: string; playerNumber: number }) => void;
  'question:answer': (data: { answer: string; playerName: string }) => void;
  'buzz:winner': (data: { playerId: string; playerName: string }) => void;
  'buzz:blocked': () => void;
  'buzz:reset': () => void;
  'timer:tick': (data: { secondsLeft: number }) => void;
  'timer:end': () => void;
  'timer:paused': () => void;
  'timer:reset': () => void;
  'score:update': (data: { players: Player[] }) => void;
}

export interface RoomCreatePayload {
  code: string;
  gameId: string;
  timerSecs: number;
  totalTours: number;
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
  questionType: QuestionType;
  mediaUrl?: string;
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
