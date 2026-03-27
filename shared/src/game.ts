export type GameStatus = 'LOBBY' | 'ACTIVE' | 'FINISHED';
export type TourStatus = 'PENDING' | 'ACTIVE' | 'FINISHED';
export type QuestionType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO';

export interface Player {
  id: string;
  name: string;
  score: number;
  gameId: string;
}

export interface Question {
  id: string;
  text: string;
  answer: string;
  points: number;
  themeId: string;
  questionType: QuestionType;
  mediaUrl?: string;
}

export interface Theme {
  id: string;
  name: string;
  category: string;
  isFree: boolean;
  questions: Question[];
}

export interface GameTourTheme {
  id: string;
  tourId: string;
  themeId: string;
  position: number;
  theme: Theme;
}

export interface GameTour {
  id: string;
  gameId: string;
  tourNumber: number;
  status: TourStatus;
  themes: GameTourTheme[];
}

export interface Game {
  id: string;
  code: string;
  hostId: string;
  status: GameStatus;
  timerSecs: number;
  totalTours: number;
  currentTour: number;
  createdAt: string;
  players: Player[];
  tours: GameTour[];
}

export interface Round {
  id: string;
  gameId: string;
  questionId: string;
  tourNumber: number;
  winnerId: string | null;
  correct: boolean | null;
}

export interface BoardCell {
  questionId: string;
  points: number;
  answered: boolean;
  themeId: string;
  themeName: string;
}

export interface BoardTheme {
  themeId: string;
  themeName: string;
  position: number;
  cells: {
    questionId: string;
    points: number;
    answered: boolean;
  }[];
}
