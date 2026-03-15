// ────────────────────────────────────────────
// Оперативное состояние комнат в памяти сервера
// (то, что не нужно персистить в БД между тиками)
// ────────────────────────────────────────────

export interface RoomPlayer {
  id: string;          // Player.id из БД
  name: string;
  score: number;
  socketId: string;    // текущий socket.id
}

export interface ActiveQuestion {
  questionId: string;
  text: string;
  answer: string;
  points: number;
  themeName: string;
  timeLimit: number;
  startedAt: number;   // Date.now()
  timerId: ReturnType<typeof setTimeout> | null;
  pausedAt: number | null;
  remainingMs: number;
}

export interface RoomState {
  code: string;
  hostSocketId: string;
  gameId: string;
  timerSecs: number;
  totalTours: number;
  currentTour: number;
  players: Map<string, RoomPlayer>;
  answeredQuestions: Set<string>;     // questionId
  activeQuestion: ActiveQuestion | null;
  buzzed: Set<string>;
  penalizedPlayers: Set<string>; // playerId:questionId — защита от двойного списания
  status: 'LOBBY' | 'ACTIVE' | 'FINISHED';
}

// Глобальный реестр комнат: code → RoomState
const rooms = new Map<string, RoomState>();

// socketId → code (для быстрого поиска комнаты по сокету)
const socketToRoom = new Map<string, string>();

// ────────────────────────────────────────────
// CRUD для rooms
// ────────────────────────────────────────────

export function createRoom(state: RoomState): void {
  rooms.set(state.code, state);
}

export function getRoom(code: string): RoomState | undefined {
  return rooms.get(code);
}

export function deleteRoom(code: string): void {
  const room = rooms.get(code);
  if (room) {
    // Очищаем все socketToRoom записи этой комнаты
    room.players.forEach((p) => socketToRoom.delete(p.socketId));
    socketToRoom.delete(room.hostSocketId);
  }
  rooms.delete(code);
}

export function getRoomBySocket(socketId: string): RoomState | undefined {
  const code = socketToRoom.get(socketId);
  return code ? rooms.get(code) : undefined;
}

export function registerSocket(socketId: string, code: string): void {
  socketToRoom.set(socketId, code);
}

export function unregisterSocket(socketId: string): void {
  socketToRoom.delete(socketId);
}

export function getAllRooms(): Map<string, RoomState> {
  return rooms;
}
