import api from './client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  purchases?: { themeId: string; createdAt: string }[];
  _count?: { games: number };
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authApi = {
  register: async (data: RegisterData): Promise<AuthUser> => {
    const res = await api.post<{ user: AuthUser }>('/auth/register', data);
    return res.data.user;
  },

  login: async (data: LoginData): Promise<AuthUser> => {
    const res = await api.post<{ user: AuthUser }>('/auth/login', data);
    return res.data.user;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  me: async (): Promise<AuthUser> => {
    const res = await api.get<{ user: AuthUser }>('/auth/me');
    return res.data.user;
  },

  check: async (): Promise<boolean> => {
    try {
      await api.get('/auth/check');
      return true;
    } catch {
      return false;
    }
  },
};
