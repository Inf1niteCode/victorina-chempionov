import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, AuthUser, RegisterData, LoginData } from '../api/auth';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  register: (data: RegisterData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearError: () => void;
  setUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const user = await authApi.register(data);
          set({ user, isLoading: false });
        } catch (err: unknown) {
          const message = extractErrorMessage(err) || 'Ошибка регистрации';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      login: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const user = await authApi.login(data);
          set({ user, isLoading: false });
        } catch (err: unknown) {
          const message = extractErrorMessage(err) || 'Ошибка входа';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch {
          // Игнорируем ошибку logout — всё равно очищаем стор
        } finally {
          set({ user: null, isLoading: false, error: null });
        }
      },

      fetchMe: async () => {
        // Не показываем лоадер при фоновом обновлении
        try {
          const user = await authApi.me();
          set({ user });
        } catch {
          set({ user: null });
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user) => set({ user }),
    }),
    {
      name: 'victorina-auth',
      // Сохраняем только user, но не пароли / токены
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// ────────────────────────────────────────────
// Хелпер: извлечь сообщение ошибки из axios
// ────────────────────────────────────────────

function extractErrorMessage(err: unknown): string | null {
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    err.response &&
    typeof err.response === 'object' &&
    'data' in err.response &&
    err.response.data &&
    typeof err.response.data === 'object' &&
    'error' in err.response.data
  ) {
    return String((err.response.data as { error: string }).error);
  }
  return null;
}
