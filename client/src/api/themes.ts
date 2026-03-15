import api from './client';

export interface ThemeInfo {
  id: string;
  name: string;
  category: string;
  isFree: boolean;
  isPurchased: boolean;
  questions: { id: string; points: number; text: string }[];
}

export const themesApi = {
  getAll: async (): Promise<ThemeInfo[]> => {
    const res = await api.get<{ themes: ThemeInfo[] }>('/themes');
    return res.data.themes;
  },

  getMy: async (): Promise<ThemeInfo[]> => {
    const res = await api.get<{ themes: ThemeInfo[] }>('/themes/my');
    return res.data.themes;
  },
};
