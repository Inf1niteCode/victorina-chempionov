import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useAuthStore } from "../store/authStore";

const TYPEWRITER_PHRASES = [
  "которая запомнится",
  "для настоящих знатоков",
  "объединяет компанию",
  "где побеждает умнейший",
  "которую ждут снова",
  "без скуки и пауз",
  "с кнопкой-жмалкой",
  "для любого повода",
  "заводит с первого вопроса",
  "которую не забудут",
];

function TypewriterText() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const phrase = TYPEWRITER_PHRASES[phraseIndex];

    if (!deleting && displayed.length < phrase.length) {
      const t = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 60);
      return () => clearTimeout(t);
    }

    if (!deleting && displayed.length === phrase.length) {
      const t = setTimeout(() => setDeleting(true), 2200);
      return () => clearTimeout(t);
    }

    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35);
      return () => clearTimeout(t);
    }

    if (deleting && displayed.length === 0) {
      setDeleting(false);
      setPhraseIndex((i) => (i + 1) % TYPEWRITER_PHRASES.length);
    }
  }, [displayed, deleting, phraseIndex]);

  return (
    <span
      style={{
        fontSize: "clamp(1.6rem, 4.5vw, 3.2rem)",
        background: "linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      {displayed}
      <span
        style={{
          WebkitTextFillColor: "var(--accent-gold)",
          opacity: 1,
          animation: "blink 1s step-start infinite",
        }}
      >|</span>
      <style>{`@keyframes blink { 50% { opacity: 0 } }`}</style>
    </span>
  );
}

function FadeIn({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

const FEATURES = [
  {
    icon: "📺",
    title: "Три экрана одновременно",
    badge: "Уникально",
    badgeColor: "var(--accent-blue)",
    badgeBg: "rgba(59,130,246,0.15)",
    desc: "Телевизор/проектор для зрителей, ноутбук ведущего с ответами, телефон каждого игрока — всё синхронизировано в реальном времени.",
  },
  {
    icon: "⚡",
    title: "Кнопка-жмалка",
    badge: "Честно",
    badgeColor: "var(--accent-gold)",
    badgeBg: "rgba(245,158,11,0.15)",
    desc: "Кто нажал первым — тот отвечает. Серверная логика исключает споры: честный buzz-in с точностью до миллисекунды.",
  },
  {
    icon: "🏆",
    title: "Турнирная система",
    badge: "До 3 туров",
    badgeColor: "var(--accent-gold)",
    badgeBg: "rgba(245,158,11,0.15)",
    desc: "До 3 туров по 25 вопросов. Баллы копятся, промежуточные итоги после каждого тура, финальный подиум.",
  },
  {
    icon: "🎯",
    title: "650 вопросов в базе",
    badge: "130 тем",
    badgeColor: "var(--accent-green)",
    badgeBg: "rgba(16,185,129,0.15)",
    desc: "130 тем в 19 категориях: История, Наука, Культура, Видеоигры, Музыка, Кино и ещё 13. Лёгкие за 100 — сложные за 500 очков.",
  },
  {
    icon: "📱",
    title: "Без установки",
    badge: "Просто браузер",
    badgeColor: "var(--accent-green)",
    badgeBg: "rgba(16,185,129,0.15)",
    desc: "Игроки входят по QR-коду или 6-значному коду. Никакой регистрации, никаких приложений — просто браузер на телефоне.",
  },
  {
    icon: "⏱️",
    title: "Настраиваемый таймер",
    badge: "15–120 сек",
    badgeColor: "#A78BFA",
    badgeBg: "rgba(167,139,250,0.15)",
    desc: "От 15 до 120 секунд на вопрос. Ведущий может ставить паузу и сбрасывать таймер прямо во время игры.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    icon: "📝",
    title: "Зарегистрируйтесь",
    desc: "Создайте аккаунт ведущего за 30 секунд",
  },
  {
    step: "2",
    icon: "🎮",
    title: "Создайте игру",
    desc: "Выберите темы и число туров",
  },
  {
    step: "3",
    icon: "📺",
    title: "Откройте дисплей",
    desc: "Подключите проектор или большой экран",
  },
  {
    step: "4",
    icon: "📱",
    title: "Игроки подключаются",
    desc: "По QR-коду или 6-значному коду",
  },
  {
    step: "5",
    icon: "🏆",
    title: "Играйте!",
    desc: "Ведущий открывает вопросы, игроки жмут кнопку",
  },
];

const STATS = [
  { value: "650+", label: "Вопросов", color: "var(--accent-gold)" },
  { value: "130", label: "Тем", color: "var(--accent-blue)" },
  { value: "19", label: "Категорий", color: "var(--accent-green)" },
  { value: "∞", label: "Игроков", color: "#A78BFA" },
  { value: "0", label: "Установок", color: "var(--accent-green)" },
];

const PROS = [
  {
    title: "63 темы",
    desc: "Можно сразу играть — десятки интересных тем . Идеально, чтобы начать играть прямо сейчас.",
  },
  {
    title: "Без ограничений по числу игроков",
    desc: "Хочешь играть вдвоем или всей компанией — приглашай сколько угодно друзей. Места хватит всем!",
  },
  {
    title: "Присоединение по коду, без регистрации",
    desc: "Никаких логинов и паролей: просто наведите камеру телефона на код — и вы уже в игре.",
  },
  {
    title: "Ответ видит только ведущий",
    desc: "Игра честная — только ведущий знает правильные ответы и объявляет их в нужный момент.",
  },
  {
    title: "Кто нажал первым",
    desc: "Игра сама фиксирует, кто успел нажать первым, без споров и задержек. Всё по-честному и справедливо.",
  },
  {
    title: "До трёх туров и промежуточные результаты",
    desc: "Игра делится на раунды, между которыми видно, кто лидирует и сколько очков у каждого.",
  },
  {
    title: "История всех игр сохраняется",
    desc: "После игры можно открыть личный кабинет и посмотреть все прошлые викторины и результаты.",
  },
  {
    title: "Работает на любом телефоне",
    desc: "Не нужно ничего скачивать — игра запускается прямо в браузере и подходит для любого устройства.",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div
      style={{
        background: "var(--bg-deep)",
        color: "var(--text-primary)",
        overflowX: "hidden",
      }}
    >
      {/* ════════ НАВИГАЦИЯ ════════ */}
      <nav
        className="sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3"
        style={{
          background: "rgba(7,9,15,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl flex-shrink-0">🏆</span>
          <span
            className="font-bold text-sm sm:text-base truncate"
            style={{ color: "var(--text-primary)" }}
          >
            Викторина Чемпионов
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: "var(--accent-gold)", color: "#07090F" }}
            >
              <span className="hidden sm:inline">Личный кабинет</span>
              <span className="sm:hidden">Кабинет</span>
            </button>
          ) : (
            <>
              <Link
                to="/auth"
                className="text-sm px-3 sm:px-4 py-2 rounded-xl transition-all hidden sm:block"
                style={{
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor =
                    "var(--accent-blue)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor =
                    "var(--border)")
                }
              >
                Войти
              </Link>
              <Link
                to="/auth"
                className="text-sm px-3 sm:px-4 py-2 rounded-xl font-medium transition-all"
                style={{ background: "var(--accent-gold)", color: "#07090F" }}
              >
                <span className="hidden sm:inline">Начать бесплатно</span>
                <span className="sm:hidden">Начать</span>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ════════ HERO ════════ */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 sm:px-6 py-16 sm:py-24 min-h-screen">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            style={{
              position: "absolute",
              top: "-20%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "900px",
              height: "700px",
              background:
                "radial-gradient(ellipse at center, rgba(245,158,11,0.13) 0%, transparent 70%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "10%",
              left: "10%",
              width: "400px",
              height: "400px",
              background:
                "radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, transparent 70%)",
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          {/* Название платформы */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-5"
          >
            <span
              style={{
                fontSize: "clamp(1.1rem, 3vw, 1.5rem)",
                fontWeight: 800,
                letterSpacing: "0.01em",
                background:
                  "linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              🏆 Викторина Чемпионов
            </span>
          </motion.div>

          {/* Бейдж */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
            style={{
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.3)",
              color: "var(--accent-gold)",
            }}
          >
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
              ⚡
            </motion.span>
            Онлайн-викторина в стиле «Своя игра»
          </motion.div>

          {/* Заголовок */}
          <h1
            style={{
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: 24,
            }}
          >
            <span style={{ color: "var(--text-primary)", fontSize: "clamp(1.6rem, 4.5vw, 3.2rem)" }}>Викторина,</span>
            <br />
            <TypewriterText />
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              color: "var(--text-muted)",
              maxWidth: 600,
              margin: "0 auto 40px",
              lineHeight: 1.7,
            }}
          >
            Платформа для живых интеллектуальных игр. Три экрана в реальном
            времени — проектор для зала, ноутбук ведущего с ответами, телефон
            каждого игрока с кнопкой-жмалкой.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/auth"
              className="w-full sm:w-auto px-6 sm:px-8 py-4 rounded-2xl font-bold text-base sm:text-lg transition-all inline-flex items-center justify-center gap-2"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)",
                color: "#07090F",
                boxShadow: "0 8px 32px rgba(245,158,11,0.35)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.filter = "brightness(1.1)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
            >
              Создать игру бесплатно →
            </Link>
            <Link
              to="/join"
              className="w-full sm:w-auto px-6 sm:px-8 py-4 rounded-2xl font-bold text-base sm:text-lg transition-all text-center"
              style={{
                background: "transparent",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "var(--accent-blue)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            >
              Войти в игру по коду
            </Link>
          </div>

          <p className="mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
            63 темы бесплатно · Без лимита игроков · Без установки
          </p>
        </motion.div>

        {/* Скролл-индикатор */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div
            className="w-6 h-10 rounded-full border-2 flex items-start justify-center pt-1.5"
            style={{ borderColor: "var(--border)" }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--text-muted)" }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* ════════ СТАТИСТИКА ════════ */}
      <section
        style={{
          background: "var(--bg-card)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 sm:gap-6 text-center">
            {STATS.map((s, i) => (
              <FadeIn key={s.label} delay={i * 0.07}>
                <div
                  className="text-2xl sm:text-3xl font-black"
                  style={{ color: s.color }}
                >
                  {s.value}
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {s.label}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ О ПЛАТФОРМЕ ════════ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-14">
              <h2
                style={{
                  fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                  fontWeight: 800,
                  marginBottom: 12,
                }}
              >
                Что такое Викторина Чемпионов?
              </h2>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "1rem",
                  maxWidth: 560,
                  margin: "0 auto",
                }}
              >
                Полноценная платформа для проведения живых интеллектуальных игр
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <FadeIn delay={0}>
              <div
                className="rounded-2xl p-6 h-full"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="text-3xl mb-4">🎯</div>
                <h3
                  className="font-bold text-base mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Что это такое
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  Онлайн-платформа для игр в формате «Своей игры». Ведущий
                  создаёт игру, выбирает темы, устанавливает таймер — и уже
                  через минуту все участники подключены со своих телефонов.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.08}>
              <div
                className="rounded-2xl p-6 h-full"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="text-3xl mb-4">🎲</div>
                <h3
                  className="font-bold text-base mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Как проходит игра
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  Поле 5×5: 5 тем, в каждой 5 вопросов за 100–500 очков. Ведущий
                  открывает вопрос, кто первым нажимает кнопку на телефоне — тот
                  отвечает. После каждого тура — промежуточные итоги.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.16}>
              <div
                className="rounded-2xl p-6 h-full"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="text-3xl mb-4">👥</div>
                <h3
                  className="font-bold text-base mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Для кого
                </h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    "🏢 Корпоратив",
                    "🎉 Вечеринка",
                    "🏫 Урок",
                    "🤝 Тимбилдинг",
                    "👨‍👩‍👧 Семья",
                    "🎓 Мероприятие",
                  ].map((item) => (
                    <span
                      key={item}
                      className="text-xs px-2.5 py-1 rounded-lg"
                      style={{
                        background: "var(--bg-surface)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ════════ КАК ЭТО РАБОТАЕТ ════════ */}
      <section
        className="py-16 sm:py-24 px-4 sm:px-6"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-16">
              <h2
                style={{
                  fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                  fontWeight: 800,
                  marginBottom: 12,
                }}
              >
                Как это работает
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
                От регистрации до первого вопроса — 5 минут
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {HOW_IT_WORKS.map((step, i) => (
              <FadeIn key={step.step} delay={i * 0.08}>
                <div className="relative">
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div
                      className="hidden md:block absolute top-10 left-full w-full h-px z-0"
                      style={{
                        background:
                          "linear-gradient(90deg, var(--border), transparent)",
                      }}
                    />
                  )}
                  <div
                    className="rounded-2xl p-5 text-center relative z-10 h-full"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3"
                      style={{
                        background: "rgba(245,158,11,0.15)",
                        border: "1px solid rgba(245,158,11,0.3)",
                        color: "var(--accent-gold)",
                      }}
                    >
                      {step.step}
                    </div>
                    <div className="text-2xl mb-2">{step.icon}</div>
                    <p
                      className="font-semibold text-sm mb-1"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {step.title}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)", lineHeight: 1.4 }}
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ ФИЧИ ════════ */}
      <section
        className="py-16 sm:py-24 px-4 sm:px-6"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-16">
              <h2
                style={{
                  fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                  fontWeight: 800,
                  marginBottom: 12,
                }}
              >
                Всё для идеальной викторины
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
                Продуманные детали, которые делают игру незабываемой
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.07}>
                <div
                  className="rounded-2xl p-6 h-full flex flex-col"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">{f.icon}</div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{
                        background: f.badgeBg,
                        color: f.badgeColor,
                        border: `1px solid ${f.badgeColor}40`,
                      }}
                    >
                      {f.badge}
                    </span>
                  </div>
                  <h3
                    className="font-bold mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {f.title}
                  </h3>
                  <p
                    className="text-sm flex-1"
                    style={{ color: "var(--text-muted)", lineHeight: 1.6 }}
                  >
                    {f.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ ВСЕ ПЛЮСЫ ════════ */}
      <section
        className="py-16 sm:py-24 px-4 sm:px-6"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-14">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4"
                style={{
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  color: "var(--accent-green)",
                }}
              >
                ✓ Только плюсы
              </div>
              <h2
                style={{
                  fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                  fontWeight: 800,
                  marginBottom: 12,
                }}
              >
                Все преимущества одним взглядом
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
                Почему выбирают Викторину Чемпионов
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {PROS.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl p-5"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid rgba(16,185,129,0.15)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: "rgba(16,185,129,0.2)",
                        border: "1px solid rgba(16,185,129,0.4)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.6rem",
                          color: "var(--accent-green)",
                          fontWeight: 900,
                        }}
                      >
                        ✓
                      </span>
                    </div>
                    <div>
                      <p
                        className="text-sm font-semibold mb-1"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {item.title}
                      </p>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════════ ТРИ ЭКРАНА ════════ */}
      <section
        className="py-16 sm:py-24 px-4 sm:px-6"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-16">
              <h2
                style={{
                  fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                  fontWeight: 800,
                  marginBottom: 12,
                }}
              >
                Три экрана — одна игра
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
                Каждый видит именно то, что ему нужно
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: "📺",
                title: "Телевизор / Проектор",
                color: "var(--accent-blue)",
                bg: "rgba(59,130,246,0.08)",
                border: "rgba(59,130,246,0.25)",
                items: [
                  "Поле 5×5 с вопросами",
                  "Текст вопроса крупно",
                  "Таймер обратного отсчёта",
                  "Имя первого нажавшего",
                  "Счёт всех игроков",
                ],
              },
              {
                icon: "💻",
                title: "Ноутбук ведущего",
                color: "var(--accent-gold)",
                bg: "rgba(245,158,11,0.08)",
                border: "rgba(245,158,11,0.25)",
                items: [
                  "Кликабельное поле 5×5",
                  "✅ Правильный ответ только здесь",
                  "Кнопки «Верно» / «Неверно»",
                  "Управление таймером",
                  "Кнопка следующего тура",
                ],
              },
              {
                icon: "📱",
                title: "Телефон игрока",
                color: "var(--accent-green)",
                bg: "rgba(16,185,129,0.08)",
                border: "rgba(16,185,129,0.25)",
                items: [
                  "Текст вопроса",
                  "Огромная кнопка «Я ЗНАЮ!»",
                  "Вибрация при нажатии",
                  "Свои баллы и рейтинг",
                  "Промежуточные итоги",
                ],
              },
            ].map((screen, i) => (
              <FadeIn key={screen.title} delay={i * 0.1}>
                <div
                  className="rounded-2xl p-6 h-full flex flex-col"
                  style={{
                    background: screen.bg,
                    border: `1px solid ${screen.border}`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{screen.icon}</span>
                    <p
                      className="font-bold text-sm"
                      style={{ color: screen.color }}
                    >
                      {screen.title}
                    </p>
                  </div>
                  <ul className="space-y-2 flex-1">
                    {screen.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <span style={{ color: screen.color, flexShrink: 0 }}>
                          ·
                        </span>
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

      {/* ════════ FAQ ════════ */}
      <section
        className="py-16 sm:py-24 px-4 sm:px-6"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <h2
              className="text-center font-bold mb-8 sm:mb-12"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
            >
              Частые вопросы
            </h2>
          </FadeIn>

          {[
            {
              q: "Сколько игроков может участвовать?",
              a: "Нет ограничений. Платформа работает с любым числом игроков — хоть 3, хоть 30.",
            },
            {
              q: "Нужно ли скачивать приложение?",
              a: "Нет. Игроки входят через браузер на телефоне по QR-коду или 6-значному коду. Никаких установок.",
            },
            {
              q: "Как работает кнопка-жмалка?",
              a: "Сервер фиксирует время нажатия с точностью до миллисекунды. Кто нажал первым — тот отвечает, остальным приходит блокировка.",
            },
            {
              q: "Сколько всего тем и вопросов?",
              a: "Более 130 тем в 19 категориях: История, Наука, Культура, Спорт, География, Технологии, Видеоигры и другие",
            },
            {
              q: "Работает ли без интернета?",
              a: "Нет, для синхронизации трёх экранов в реальном времени нужно подключение к интернету.",
            },
          ].map((faq, i) => (
            <FadeIn key={faq.q} delay={i * 0.05}>
              <div
                className="mb-4 rounded-2xl overflow-hidden"
                style={{ border: "1px solid var(--border)" }}
              >
                <details>
                  <summary
                    className="flex items-center justify-between px-5 py-4 cursor-pointer list-none"
                    style={{ background: "var(--bg-card)" }}
                  >
                    <span
                      className="font-medium text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {faq.q}
                    </span>
                    <span
                      style={{
                        color: "var(--text-muted)",
                        flexShrink: 0,
                        marginLeft: 12,
                      }}
                    >
                      ▾
                    </span>
                  </summary>
                  <div
                    className="px-5 py-4"
                    style={{
                      background: "var(--bg-surface)",
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)", lineHeight: 1.6 }}
                    >
                      {faq.a}
                    </p>
                  </div>
                </details>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ════════ CTA ФИНАЛ ════════ */}
      <section
        className="py-16 sm:py-24 px-4 sm:px-6"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <div className="text-5xl sm:text-6xl mb-4">🏆</div>
            <div
              className="text-lg font-bold mb-3"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Викторина Чемпионов
            </div>
            <h2
              style={{
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 900,
                marginBottom: 12,
              }}
            >
              Готовы провести игру?
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "1rem",
                marginBottom: 36,
              }}
            >
              Регистрация за 30 секунд. 63 темы бесплатно сразу. Никаких
              установок для игроков.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-7 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl transition-all"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)",
                color: "#07090F",
                boxShadow: "0 12px 48px rgba(245,158,11,0.35)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.filter = "brightness(1.1)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
            >
              Начать бесплатно →
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-5 mt-6">
              {[
                "✓ Бесплатный старт",
                "✓ Без лимита игроков",
                "✓ Без установки",
              ].map((item) => (
                <span
                  key={item}
                  className="text-sm"
                  style={{ color: "var(--accent-green)" }}
                >
                  {item}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════════ ФУТЕР ════════ */}
      <footer
        className="px-4 sm:px-6 py-6 sm:py-8"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <span>🏆</span>
            <span
              className="font-bold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              Викторина Чемпионов
            </span>
          </div>
          <div
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            <Link to="/auth" style={{ color: "var(--text-muted)" }}>
              Войти
            </Link>
            <Link to="/store" style={{ color: "var(--text-muted)" }}>
              Магазин
            </Link>
            <Link to="/join" style={{ color: "var(--text-muted)" }}>
              Войти в игру
            </Link>
            <span>© {new Date().getFullYear()}</span>
            <span style={{ color: "var(--border)" }}>·</span>
            <span>Разработка и поддержка{" "}
              <a
                href="https://t.me/Inf1niteCode"
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--accent-blue)" }}
              >
                @Inf1niteCode
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
