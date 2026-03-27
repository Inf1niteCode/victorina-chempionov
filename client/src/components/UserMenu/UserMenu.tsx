import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi } from '../../api/auth';
import type { AuthUser } from '../../api/auth';

interface Props {
  user: AuthUser;
  onLogout: () => void;
}

export default function UserMenu({ user, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Форма смены пароля
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Закрываем дропдаун при клике вне
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const openChangePassword = () => {
    setOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPwError('');
    setPwSuccess(false);
    setShowChangePassword(true);
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('Заполните все поля');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('Новый пароль минимум 6 символов');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Пароли не совпадают');
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setPwSuccess(true);
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setPwError(String(msg || 'Ошибка смены пароля'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* ── Кнопка-аватар ── */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all hover:opacity-85"
          style={{
            background: open ? 'var(--bg-surface)' : 'transparent',
            border: `1px solid ${open ? 'var(--border)' : 'transparent'}`,
          }}
        >
          {/* Аватар с инициалами */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--accent-blue) 0%, #6366f1 100%)',
              color: '#fff',
            }}
          >
            {initials}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
              {user.name}
            </div>
            <div className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>
              {user.email}
            </div>
          </div>
          <span className="text-xs ml-0.5" style={{ color: 'var(--text-muted)' }}>
            {open ? '▲' : '▼'}
          </span>
        </button>

        {/* ── Дропдаун ── */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-64 rounded-2xl shadow-xl z-50 overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              {/* Пункты меню */}
              <div className="p-2">
                <button
                  onClick={openChangePassword}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all hover:opacity-80 text-left"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', marginBottom: 6 }}
                >
                  <span>🔑</span>
                  <span>Сменить пароль</span>
                </button>
                <button
                  onClick={() => { setOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all hover:opacity-80 text-left"
                  style={{ background: 'rgba(239,68,68,0.07)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <span>🚪</span>
                  <span>Выйти</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Модалка смены пароля ── */}
      <AnimatePresence>
        {showChangePassword && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => !saving && setShowChangePassword(false)}
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 12 }}
              className="w-full max-w-sm rounded-2xl p-6 space-y-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  🔑 Сменить пароль
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {user.email}
                </p>
              </div>

              {pwSuccess ? (
                <div className="rounded-xl px-4 py-6 text-center space-y-2"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <div className="text-3xl">✅</div>
                  <p className="font-semibold" style={{ color: 'var(--accent-green)' }}>
                    Пароль успешно изменён
                  </p>
                  <button
                    onClick={() => setShowChangePassword(false)}
                    className="mt-2 px-6 py-2 rounded-xl text-sm font-bold"
                    style={{ background: 'var(--accent-green)', color: '#fff' }}
                  >
                    Закрыть
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                        Текущий пароль
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                        Новый пароль
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Минимум 6 символов"
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                        Повторите новый пароль
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                        onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                      />
                    </div>
                  </div>

                  {pwError && (
                    <p className="text-xs px-3 py-2 rounded-lg"
                      style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {pwError}
                    </p>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setShowChangePassword(false)}
                      disabled={saving}
                      className="flex-1 py-2.5 rounded-2xl text-sm font-medium"
                      style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleChangePassword}
                      disabled={saving}
                      className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all"
                      style={{
                        background: saving ? 'var(--bg-surface)' : 'linear-gradient(135deg, var(--accent-blue) 0%, #6366f1 100%)',
                        color: saving ? 'var(--text-muted)' : '#fff',
                      }}
                    >
                      {saving ? 'Сохраняем...' : 'Сохранить'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
