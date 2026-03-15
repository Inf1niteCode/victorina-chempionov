import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

// ── Анимация появления при скролле ──
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}>
      {children}
    </motion.div>
  );
}

const FEATURES = [
  {
    icon: '📺',
    title: 'Три экрана одновременно',
    desc: 'Телевизор/проектор для зрителей, ноутбук ведущего с ответами, телефон каждого игрока — всё синхронизировано в реальном времени.',
  },
  {
    icon: '⚡',
    title: 'Кнопка-жмалка',
    desc: 'Кто нажал первым — тот отвечает. Серверная логика исключает споры: честный buzz-in на миллисекунды.',
  },
  {
    icon: '🏆',
    title: 'Турнирная система',
    desc: 'До 3 туров по 25 вопросов. Баллы копятся, промежуточные итоги после каждого тура, финальный подиум с конфетти.',
  },
  {
    icon: '🎯',
    title: '125 вопросов в базе',
    desc: '25 тем в 5 категориях: История, Наука, Культура, Спорт, География. Лёгкие за 100 — сложные за 500 очков.',
  },
  {
    icon: '📱',
    title: 'Без установки',
    desc: 'Игроки входят по QR-коду или 6-значному коду. Никакой регистрации, никаких приложений — просто браузер на телефоне.',
  },
  {
    icon: '⏱️',
    title: 'Настраиваемый таймер',
    desc: 'От 15 до 90 секунд на вопрос. Ведущий может ставить паузу и сбрасывать таймер прямо во время игры.',
  },
];

const FREE_THEMES = [
  { cat: '⚔️ История', name: 'Древний мир' },
  { cat: '⚔️ История', name: 'Великие войны' },
  { cat: '🔬 Наука', name: 'Физика' },
  { cat: '🔬 Наука', name: 'Космос' },
  { cat: '🎭 Культура', name: 'Кино' },
  { cat: '🎭 Культура', name: 'Литература' },
  { cat: '⚽ Спорт', name: 'Футбол' },
  { cat: '⚽ Спорт', name: 'Олимпийские игры' },
  { cat: '🌍 География', name: 'Столицы мира' },
  { cat: '🌍 География', name: 'Животный мир' },
];

const HOW_IT_WORKS = [
  { step: '1', icon: '📝', title: 'Зарегистрируйтесь', desc: 'Создайте аккаунт ведущего за 30 секунд' },
  { step: '2', icon: '🎮', title: 'Создайте игру', desc: 'Выберите темы, число туров и таймер' },
  { step: '3', icon: '📺', title: 'Откройте дисплей', desc: 'Подключите проектор или большой экран' },
  { step: '4', icon: '📱', title: 'Игроки подключаются', desc: 'По QR-коду или 6-значному коду' },
  { step: '5', icon: '🏆', title: 'Играйте!', desc: 'Ведущий открывает вопросы, игроки жмут кнопку' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)', overflowX: 'hidden' }}>

      {/* ════════════════════════════════════════
          НАВИГАЦИЯ
      ════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(7,9,15,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            Викторина Чемпионов
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a href="#pricing" className="text-sm hidden sm:block"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--text-muted)')}>
            Цены
          </a>
          {user ? (
            <button onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'var(--accent-gold)', color: '#07090F' }}>
              Личный кабинет
            </button>
          ) : (
            <>
              <Link to="/auth"
                className="text-sm px-4 py-2 rounded-xl transition-all"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-blue)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}>
                Войти
              </Link>
              <Link to="/auth"
                className="text-sm px-4 py-2 rounded-xl font-medium transition-all"
                style={{ background: 'var(--accent-gold)', color: '#07090F' }}>
                Начать бесплатно
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-24 min-h-screen">
        {/* Фоны */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{
            position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
            width: '800px', height: '600px',
            background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.12) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '10%', left: '10%',
            width: '400px', height: '400px',
            background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, transparent 70%)',
          }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          {/* Бейдж */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
            style={{
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.3)',
              color: 'var(--accent-gold)',
            }}
          >
            <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }}>
              🏆
            </motion.span>
            Онлайн-викторина в стиле «Своя игра»
          </motion.div>

          {/* Заголовок */}
          <h1 style={{
            fontSize: 'clamp(2.5rem, 7vw, 5rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: 24,
          }}>
            <span style={{ color: 'var(--text-primary)' }}>Викторина,</span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              которая запомнится
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: 'var(--text-muted)',
            maxWidth: 600,
            margin: '0 auto 40px',
            lineHeight: 1.6,
          }}>
            Проводите командные викторины на корпоративах, вечеринках и уроках. Три экрана в реальном времени — проектор, ноутбук ведущего, телефон каждого игрока.
          </p>

          {/* CTA */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/auth"
              className="px-8 py-4 rounded-2xl font-bold text-lg transition-all inline-flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)',
                color: '#07090F',
                boxShadow: '0 8px 32px rgba(245,158,11,0.35)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = '')}>
              Создать игру бесплатно →
            </Link>
            <Link to="/join"
              className="px-8 py-4 rounded-2xl font-bold text-lg transition-all"
              style={{
                background: 'transparent',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-blue)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}>
              Войти в игру по коду
            </Link>
          </div>

          <p className="mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            10 тем бесплатно · Без лимита игроков · Работает в браузере
          </p>
        </motion.div>

        {/* Скроллить вниз */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="w-6 h-10 rounded-full border-2 flex items-start justify-center pt-1.5"
            style={{ borderColor: 'var(--border)' }}>
            <motion.div className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--text-muted)' }}
              animate={{ opacity: [1, 0, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          </div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════
          КАК ЭТО РАБОТАЕТ
      ════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: 12 }}>
                Как это работает
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                От регистрации до первого вопроса — 5 минут
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {HOW_IT_WORKS.map((step, i) => (
              <FadeIn key={step.step} delay={i * 0.08}>
                <div className="relative">
                  {/* Соединительная линия */}
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-full w-full h-px z-0"
                      style={{ background: 'linear-gradient(90deg, var(--border), transparent)' }} />
                  )}
                  <div className="rounded-2xl p-5 text-center relative z-10 h-full"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3"
                      style={{
                        background: 'rgba(245,158,11,0.15)',
                        border: '1px solid rgba(245,158,11,0.3)',
                        color: 'var(--accent-gold)',
                      }}>
                      {step.step}
                    </div>
                    <div className="text-2xl mb-2">{step.icon}</div>
                    <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                      {step.title}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          ФИЧИ
      ════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: 12 }}>
                Всё для идеальной викторины
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                Продуманные детали, которые делают игру незабываемой
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.07}>
                <div className="rounded-2xl p-6 h-full"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {f.title}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {f.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          ТРИ ЭКРАНА — схема
      ════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: 12 }}>
                Три экрана — одна игра
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                Каждый видит именно то, что ему нужно
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '📺', url: '/display?code=KVIZ42',
                title: 'Телевизор / Проектор',
                color: 'var(--accent-blue)',
                bg: 'rgba(59,130,246,0.08)',
                border: 'rgba(59,130,246,0.25)',
                items: ['Поле 5×5 с вопросами', 'Текст вопроса крупно', 'Таймер обратного отсчёта', 'Имя первого нажавшего', 'Счёт всех игроков'],
              },
              {
                icon: '💻', url: '/host/game/KVIZ42',
                title: 'Ноутбук ведущего',
                color: 'var(--accent-gold)',
                bg: 'rgba(245,158,11,0.08)',
                border: 'rgba(245,158,11,0.25)',
                items: ['Кликабельное поле 5×5', '✅ Правильный ответ только здесь', 'Кнопки «Верно» / «Неверно»', 'Управление таймером', 'Кнопка следующего тура'],
              },
              {
                icon: '📱', url: '/play/KVIZ42',
                title: 'Телефон игрока',
                color: 'var(--accent-green)',
                bg: 'rgba(16,185,129,0.08)',
                border: 'rgba(16,185,129,0.25)',
                items: ['Текст вопроса', 'Огромная кнопка «Я ЗНАЮ!»', 'Вибрация при нажатии', 'Свои баллы и рейтинг', 'Промежуточные итоги'],
              },
            ].map((screen, i) => (
              <FadeIn key={screen.title} delay={i * 0.1}>
                <div className="rounded-2xl p-6 h-full flex flex-col"
                  style={{ background: screen.bg, border: `1px solid ${screen.border}` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{screen.icon}</span>
                    <div>
                      <p className="font-bold text-sm" style={{ color: screen.color }}>
                        {screen.title}
                      </p>
                      <code className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {screen.url}
                      </code>
                    </div>
                  </div>
                  <ul className="space-y-2 flex-1">
                    {screen.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm"
                        style={{ color: 'var(--text-muted)' }}>
                        <span style={{ color: screen.color, flexShrink: 0 }}>·</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          ЦЕНЫ
      ════════════════════════════════════════ */}
      <section id="pricing" className="py-24 px-6" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: 12 }}>
                Честные цены
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                Платите только за темы, которые нужны
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Бесплатно */}
            <FadeIn delay={0.05}>
              <div className="rounded-3xl p-8 flex flex-col h-full"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="mb-6">
                  <div className="text-sm font-semibold uppercase tracking-wide mb-2"
                    style={{ color: 'var(--text-muted)' }}>
                    Всегда бесплатно
                  </div>
                  <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                    0 ₽
                  </div>
                  <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                    Навсегда, без ограничений по времени
                  </p>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {[
                    '10 тем из 5 категорий',
                    'Неограниченное число игр',
                    'Неограниченное число игроков',
                    'До 3 туров в одной игре',
                    'QR-код и код для входа',
                    'Проекторный режим',
                    'Серверный таймер',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm"
                      style={{ color: 'var(--text-primary)' }}>
                      <span style={{ color: 'var(--accent-green)', fontSize: '1rem' }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="rounded-2xl p-4 mb-6"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
                    10 бесплатных тем:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {FREE_THEMES.map((t) => (
                      <span key={t.name} className="text-xs px-2 py-1 rounded-lg"
                        style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>

                <Link to="/auth"
                  className="block w-full py-3.5 rounded-xl text-center font-bold transition-all"
                  style={{
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                  }}>
                  Начать бесплатно
                </Link>
              </div>
            </FadeIn>

            {/* Платные темы */}
            <FadeIn delay={0.1}>
              <div className="rounded-3xl p-8 flex flex-col h-full relative overflow-hidden"
                style={{
                  background: 'var(--bg-card)',
                  border: '2px solid rgba(245,158,11,0.4)',
                  boxShadow: '0 0 48px rgba(245,158,11,0.1)',
                }}>
                {/* Популярное */}
                <div className="absolute top-0 right-6 px-3 py-1 rounded-b-xl text-xs font-bold"
                  style={{ background: 'var(--accent-gold)', color: '#07090F' }}>
                  Расширение
                </div>

                <div className="mb-6">
                  <div className="text-sm font-semibold uppercase tracking-wide mb-2"
                    style={{ color: 'var(--accent-gold)' }}>
                    Платные темы
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                      100 ₽
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/ тема</span>
                  </div>
                  <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                    Разовая покупка · Навсегда в аккаунте
                  </p>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {[
                    '15 дополнительных тем',
                    'Покупайте только нужные',
                    'Средневековье, Биология, Музыка...',
                    'Теннис, Хоккей, Живопись...',
                    'Страны и флаги, Климат...',
                    'Тема навсегда в вашем аккаунте',
                    'Оплата через Stripe (карты РФ)',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm"
                      style={{ color: 'var(--text-primary)' }}>
                      <span style={{ color: 'var(--accent-gold)', fontSize: '1rem' }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="rounded-2xl p-4 mb-6"
                  style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--accent-gold)' }}>
                    Все 15 тем = 1 500 ₽
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    125 вопросов для 75 раундов или 3 полных игры
                  </p>
                </div>

                <Link to="/store"
                  className="block w-full py-3.5 rounded-xl text-center font-bold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)',
                    color: '#07090F',
                    boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = '')}>
                  Открыть магазин тем
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FAQ
      ════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <h2 className="text-center font-bold mb-12"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
              Частые вопросы
            </h2>
          </FadeIn>

          {[
            { q: 'Сколько игроков может участвовать?', a: 'Нет ограничений. Платформа работает с любым числом игроков — хоть 3, хоть 30.' },
            { q: 'Нужно ли скачивать приложение?', a: 'Нет. Игроки входят через браузер на телефоне по QR-коду или 6-значному коду. Никаких установок.' },
            { q: 'Как работает кнопка-жмалка?', a: 'Сервер фиксирует время нажатия с точностью до миллисекунды. Кто нажал первым — тот отвечает, остальным приходит блокировка.' },
            { q: 'Можно ли вернуть деньги за тему?', a: 'Темы — цифровой контент, который открывается сразу после оплаты. Возврат не предусмотрен согласно условиям использования.' },
            { q: 'Работает ли без интернета?', a: 'Нет, для синхронизации трёх экранов в реальном времени нужно подключение к интернету.' },
          ].map((faq, i) => (
            <FadeIn key={faq.q} delay={i * 0.05}>
              <div className="mb-4 rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--border)' }}>
                <details className="group">
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none"
                    style={{ background: 'var(--bg-card)' }}>
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {faq.q}
                    </span>
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: 12 }}>▾</span>
                  </summary>
                  <div className="px-5 py-4" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {faq.a}
                    </p>
                  </div>
                </details>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          CTA ФИНАЛ
      ════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <div className="text-6xl mb-6">🏆</div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, marginBottom: 16 }}>
              Готовы провести игру?
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: 40 }}>
              Регистрация занимает 30 секунд. Первые 10 тем — навсегда бесплатно.
            </p>
            <Link to="/auth"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl font-bold text-xl transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)',
                color: '#07090F',
                boxShadow: '0 12px 48px rgba(245,158,11,0.35)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = '')}>
              Начать бесплатно →
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Футер ── */}
      <footer className="px-6 py-8" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>🏆</span>
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Викторина Чемпионов
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Link to="/auth" style={{ color: 'var(--text-muted)' }}>Войти</Link>
            <Link to="/store" style={{ color: 'var(--text-muted)' }}>Магазин</Link>
            <Link to="/join" style={{ color: 'var(--text-muted)' }}>Войти в игру</Link>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
