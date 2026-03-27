import { motion } from 'framer-motion';
import { useThemeStore } from '../../store/themeStore';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.25rem',
        boxShadow: isDark
          ? '0 2px 16px rgba(0,0,0,0.5)'
          : '0 2px 16px rgba(0,0,0,0.12)',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
      }}
    >
      <motion.span
        key={theme}
        initial={{ rotate: -30, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {isDark ? '☀️' : '🌙'}
      </motion.span>
    </motion.button>
  );
}
