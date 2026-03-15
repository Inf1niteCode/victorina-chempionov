import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import Auth from './pages/Auth';
import JoinGame from './pages/JoinGame';
import HostLobby from './pages/HostLobby';
import GameDisplay from './pages/GameDisplay';
import Dashboard from './pages/Dashboard';
import GameSetup from './pages/GameSetup';
import GameHost from './pages/GameHost';
import GamePlayer from './pages/GamePlayer';
import Store from './pages/Store';
import Landing from './pages/Landing';

export default function App() {
  const { setUser } = useAuthStore();

  // Слушаем событие истечения токена
  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, [setUser]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Публичные */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/join" element={<JoinGame />} />
        <Route path="/join/:code" element={<JoinGame />} />
        <Route path="/play/:code" element={<GamePlayer />} />
        <Route path="/display" element={<GameDisplay />} />

        {/* Защищённые */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/store" element={<ProtectedRoute><Store /></ProtectedRoute>} />
        <Route path="/game/setup" element={<ProtectedRoute><GameSetup /></ProtectedRoute>} />
        <Route path="/host/lobby/:code" element={<ProtectedRoute><HostLobby /></ProtectedRoute>} />
        <Route path="/host/game/:code" element={<ProtectedRoute><GameHost /></ProtectedRoute>} />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div
              style={{
                background: 'var(--bg-deep)',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
              }}
            >
              <div className="text-center">
                <div className="text-8xl mb-4">🤔</div>
                <h1 className="text-4xl font-bold mb-2">404</h1>
                <p style={{ color: 'var(--text-muted)' }}>Страница не найдена</p>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
