import api from './client';

export interface CreateGamePayload {
  timerSecs: number;
  totalTours: number;
  tours: { tourNumber: number; themeIds: string[] }[];
}

export interface GameInfo {
  id: string;
  code: string;
  timerSecs: number;
  totalTours: number;
  status: string;
}

export const gameApi = {
  create: async (data: CreateGamePayload): Promise<GameInfo> => {
    const res = await api.post<{ game: GameInfo }>('/game/create', data);
    return res.data.game;
  },

  getByCode: async (code: string) => {
    const res = await api.get(`/game/${code}`);
    return res.data.game;
  },

  getHostData: async (code: string) => {
    const res = await api.get(`/game/${code}/host`);
    return res.data.game;
  },
};
