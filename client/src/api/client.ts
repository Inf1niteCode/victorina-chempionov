import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // отправляем httpOnly cookie автоматически
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor — глобальная обработка 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Сбрасываем стор авторизации при истечении токена
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(error);
  }
);

export default api;
