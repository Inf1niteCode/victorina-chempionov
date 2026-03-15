import api from './client';

export const paymentsApi = {
  checkout: async (themeId: string): Promise<string> => {
    const res = await api.post<{ url: string }>('/payments/checkout', { themeId });
    return res.data.url;
  },

  getPurchases: async (): Promise<{ themeId: string; createdAt: string }[]> => {
    const res = await api.get<{ purchases: { themeId: string; createdAt: string }[] }>('/payments/purchases');
    return res.data.purchases;
  },
};
