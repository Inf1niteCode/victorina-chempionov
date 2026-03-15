import api from './client';

export interface AdminSettings {
  themePrice: number;    // копейки
  bundleDiscount: number; // процент
}

export interface AdminQuestion {
  id: string;
  text: string;
  answer: string;
  points: number;
  themeId: string;
}

export interface AdminTheme {
  id: string;
  name: string;
  category: string;
  isFree: boolean;
  questions: AdminQuestion[];
}

export const adminApi = {
  getThemes: async (): Promise<AdminTheme[]> => {
    const res = await api.get<{ themes: AdminTheme[] }>('/admin/themes');
    return res.data.themes;
  },

  createTheme: async (data: { name: string; category: string; isFree: boolean }): Promise<AdminTheme> => {
    const res = await api.post<{ theme: AdminTheme }>('/admin/themes', data);
    return res.data.theme;
  },

  updateTheme: async (id: string, data: { name?: string; category?: string; isFree?: boolean }): Promise<AdminTheme> => {
    const res = await api.patch<{ theme: AdminTheme }>(`/admin/themes/${id}`, data);
    return res.data.theme;
  },

  deleteTheme: async (id: string): Promise<void> => {
    await api.delete(`/admin/themes/${id}`);
  },

  createQuestion: async (themeId: string, data: { text: string; answer: string; points: number }): Promise<AdminQuestion> => {
    const res = await api.post<{ question: AdminQuestion }>(`/admin/themes/${themeId}/questions`, data);
    return res.data.question;
  },

  updateQuestion: async (id: string, data: { text?: string; answer?: string; points?: number }): Promise<AdminQuestion> => {
    const res = await api.patch<{ question: AdminQuestion }>(`/admin/questions/${id}`, data);
    return res.data.question;
  },

  deleteQuestion: async (id: string): Promise<void> => {
    await api.delete(`/admin/questions/${id}`);
  },

  getSettings: async (): Promise<AdminSettings> => {
    const res = await api.get<AdminSettings>('/admin/settings');
    return res.data;
  },

  updateSettings: async (data: { themePrice?: number; bundleDiscount?: number }): Promise<AdminSettings> => {
    const res = await api.patch<AdminSettings>('/admin/settings', data);
    return res.data;
  },
};
