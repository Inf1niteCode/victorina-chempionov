import api from './client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: string;
  isAdmin?: boolean;
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
  register: async (data: RegisterData): Promise<{ message: string; emailSent: boolean }> => {
    const res = await api.post<{ message: string; emailSent: boolean }>('/auth/register', data);
    return res.data;
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

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await api.patch('/auth/password', data);
  },

  check: async (): Promise<boolean> => {
    try {
      await api.get('/auth/check');
      return true;
    } catch {
      return false;
    }
  },

  verifyEmail: async (token: string): Promise<void> => {
    await api.get(`/auth/verify-email?token=${token}`);
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await api.post('/auth/reset-password', { token, password });
  },
};
