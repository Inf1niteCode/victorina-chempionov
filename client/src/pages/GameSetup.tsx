import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { themesApi, ThemeInfo } from "../api/themes";
import { gameApi } from "../api/game";
import ThemePicker from "../components/ThemePicker/ThemePicker";

const TIMER_OPTIONS = [
  { value: 15, label: "15 сек" },
  { value: 30, label: "30 сек" },
  { value: 60, label: "1 мин" },
];

export default function GameSetup() {
  const navigate = useNavigate();

  const [themes, setThemes] = useState<ThemeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  // Настройки игры
  const [totalTours, setTotalTours] = useState(1);
  const [timerSecs, setTimerSecs] = useState(30);
  const [customTimer, setCustomTimer] = useState("");
  const [useCustomTimer, setUseCustomTimer] = useState(false);

  // selectedByTour[tourIndex] = string[] (themeIds)
  const [selectedByTour, setSelectedByTour] = useState<string[][]>([
    [],
    [],
    [],
  ]);

  const [activeTourTab, setActiveTourTab] = useState(0);

  // Все themeIds занятые в других турах
  const usedInOtherTours = (tourIdx: number) =>
    selectedByTour.filter((_, i) => i !== tourIdx).flat();

  const effectiveTimer = useCustomTimer
    ? Math.min(Math.max(parseInt(customTimer) || 30, 10), 120)
    : timerSecs;

  const allToursReady = Array.from({ length: totalTours }).every(
    (_, i) => selectedByTour[i].length === 5,
  );

  useEffect(() => {
    themesApi
      .getAll()
      .then(setThemes)
      .catch(() => setError("Не удалось загрузить темы"))
      .finally(() => setIsLoading(false));
  }, []);


  const handleCreate = async () => {
    if (!allToursReady) {
      setError("Выберите по 5 тем для каждого тура");
      return;
    }

    setError("");
    setIsCreating(true);

    try {
      const tours = Array.from({ length: totalTours }, (_, i) => ({
        tourNumber: i + 1,
        themeIds: selectedByTour[i],
      }));

      const game = await gameApi.create({
        timerSecs: effectiveTimer,
        totalTours,
        tours,
      });

      navigate(`/host/lobby/${game.code}`);
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(String(msg || 'Ошибка создания игры'));
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-deep)" }}
      >
        <div
          className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
          style={{
            borderColor: "var(--accent-gold)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  const currentSelected = selectedByTour[activeTourTab]?.length ?? 0;
  const MAX_THEMES = 5;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-deep)" }}>
      {/* ── Sticky-блок: шапка + полоска прогресса ── */}
      <div className="sticky top-0 z-20" style={{ background: "var(--bg-card)" }}>

        {/* Шапка */}
        <header
          className="px-4 py-3 sm:px-6 sm:py-4 flex items-center gap-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl transition-all hover:opacity-85"
            style={{
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
            }}
          >
            ← Назад
          </button>
          <h1
            className="font-bold text-lg flex-1"
            style={{ color: "var(--text-primary)" }}
          >
            Новая игра
          </h1>

          {/* Кнопка создать — в шапке когда всё готово */}
          <AnimatePresence>
            {allToursReady && (
              <motion.button
                key="create-header"
                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={handleCreate}
                disabled={isCreating}
                whileHover={!isCreating ? { scale: 1.04, opacity: 0.9 } : {}}
                className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl"
                style={{
                  background: isCreating
                    ? "var(--bg-surface)"
                    : "linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)",
                  color: isCreating ? "var(--text-muted)" : "#07090F",
                  boxShadow: isCreating ? "none" : "0 4px 16px rgba(245,158,11,0.35)",
                  flexShrink: 0,
                }}
              >
                {isCreating ? "..." : "🚀 Создать"}
              </motion.button>
            )}
          </AnimatePresence>
        </header>

        {/* Полоска прогресса выбора тем (видна только на шаге выбора тем) */}
        <div className="px-4 sm:px-6 py-2 flex items-center gap-3"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)", minWidth: 90 }}>
            Тур {activeTourTab + 1} — тем:
          </span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-surface)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{
                background: currentSelected === MAX_THEMES
                  ? "var(--accent-green)"
                  : "var(--accent-gold)",
              }}
              animate={{ width: `${(currentSelected / MAX_THEMES) * 100}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            />
          </div>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{
              background: currentSelected === MAX_THEMES
                ? "rgba(16,185,129,0.15)"
                : "rgba(245,158,11,0.15)",
              color: currentSelected === MAX_THEMES
                ? "var(--accent-green)"
                : "var(--accent-gold)",
              border: `1px solid ${currentSelected === MAX_THEMES
                ? "rgba(16,185,129,0.3)"
                : "rgba(245,158,11,0.3)"}`,
            }}
          >
            {currentSelected} / {MAX_THEMES}
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* ── Шаг 1: Настройки игры (туры + таймер) ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 sm:p-6"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Число туров */}
            <div>
              <h2 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                Число туров
              </h2>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                5 тем × 5 вопросов = 25 за тур
              </p>
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => { setTotalTours(n); setActiveTourTab(0); }}
                    className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-80"
                    style={{
                      background: totalTours === n ? "rgba(59,130,246,0.15)" : "var(--bg-surface)",
                      border: `2px solid ${totalTours === n ? "var(--accent-blue)" : "var(--border)"}`,
                      color: totalTours === n ? "var(--accent-blue)" : "var(--text-muted)",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Таймер */}
            <div>
              <h2 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                Таймер на вопрос
              </h2>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                Итого: <strong style={{ color: "var(--accent-gold)" }}>{effectiveTimer} сек</strong> на ответ
              </p>
              <div className="flex flex-wrap gap-2">
                {TIMER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setTimerSecs(opt.value); setUseCustomTimer(false); }}
                    className="px-3 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                    style={{
                      background: timerSecs === opt.value && !useCustomTimer ? "rgba(245,158,11,0.15)" : "var(--bg-surface)",
                      border: `1px solid ${timerSecs === opt.value && !useCustomTimer ? "rgba(245,158,11,0.5)" : "var(--border)"}`,
                      color: timerSecs === opt.value && !useCustomTimer ? "var(--accent-gold)" : "var(--text-muted)",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUseCustomTimer(!useCustomTimer)}
                    className="px-3 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                    style={{
                      background: useCustomTimer ? "rgba(245,158,11,0.15)" : "var(--bg-surface)",
                      border: `1px solid ${useCustomTimer ? "rgba(245,158,11,0.5)" : "var(--border)"}`,
                      color: useCustomTimer ? "var(--accent-gold)" : "var(--text-muted)",
                    }}
                  >
                    Своё
                  </button>
                  <AnimatePresence>
                    {useCustomTimer && (
                      <motion.input
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 72, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        type="number"
                        min={10}
                        max={120}
                        value={customTimer}
                        onChange={(e) => setCustomTimer(e.target.value)}
                        placeholder="сек"
                        className="py-2 px-3 rounded-xl text-sm outline-none"
                        style={{
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text-primary)",
                          width: 72,
                        }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

          </div>
        </motion.section>

        {/* ── Шаг 3: Выбор тем ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="px-4 py-4 sm:px-6"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <h2
              className="font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Темы для туров
            </h2>
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              Выберите ровно 5 тем для каждого тура. Одна тема — только в одном
              туре.
            </p>
          </div>

          {/* Табы туров */}
          {totalTours > 1 && (
            <div
              className="flex"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              {Array.from({ length: totalTours }, (_, i) => {
                const ready = selectedByTour[i].length === 5;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveTourTab(i)}
                    className="flex-1 py-3 text-sm font-medium transition-all hover:opacity-80 relative"
                    style={{
                      color:
                        activeTourTab === i
                          ? "var(--accent-blue)"
                          : "var(--text-muted)",
                      background:
                        activeTourTab === i
                          ? "rgba(59,130,246,0.07)"
                          : "transparent",
                      borderBottom:
                        activeTourTab === i
                          ? "2px solid var(--accent-blue)"
                          : "2px solid transparent",
                    }}
                  >
                    Тур {i + 1}
                    {ready && (
                      <span
                        className="ml-1.5 text-xs"
                        style={{ color: "var(--accent-green)" }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTourTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <ThemePicker
                  tourNumber={activeTourTab + 1}
                  themes={themes}
                  selected={selectedByTour[activeTourTab]}
                  usedInOtherTours={usedInOtherTours(activeTourTab)}
                  onChange={(ids) => {
                    const next = [...selectedByTour];
                    next[activeTourTab] = ids;
                    setSelectedByTour(next);
                  }}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.section>

        {/* ── Ошибка ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "var(--accent-red)",
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Кнопка создать ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="pb-8"
        >
          {/* Сводка */}
          {allToursReady && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-xl px-4 py-3 sm:px-5 sm:py-4 mb-4 text-sm"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.25)",
              }}
            >
              <p
                className="font-medium mb-2"
                style={{ color: "var(--accent-green)" }}
              >
                ✅ Всё готово!
              </p>
              <div className="space-y-1" style={{ color: "var(--text-muted)" }}>
                <p>
                  Туров: {totalTours} · Таймер: {effectiveTimer}с · Вопросов:{" "}
                  {totalTours * 25}
                </p>
                {Array.from({ length: totalTours }, (_, i) => (
                  <p key={i}>
                    Тур {i + 1}:{" "}
                    {selectedByTour[i]
                      .map((id) => themes.find((t) => t.id === id)?.name)
                      .join(", ")}
                  </p>
                ))}
              </div>
            </motion.div>
          )}

          <button
            onClick={handleCreate}
            disabled={!allToursReady || isCreating}
            className="w-full py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-xl transition-all hover:opacity-90 active:scale-[0.99]"
            style={{
              background:
                allToursReady && !isCreating
                  ? "linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)"
                  : "var(--bg-surface)",
              color:
                allToursReady && !isCreating ? "#07090F" : "var(--text-muted)",
              cursor: allToursReady && !isCreating ? "pointer" : "not-allowed",
              boxShadow:
                allToursReady && !isCreating
                  ? "0 8px 32px rgba(245,158,11,0.25)"
                  : "none",
            }}
          >
            {isCreating ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Создаём игру...
              </span>
            ) : !allToursReady ? (
              `Выберите темы (${Array.from({ length: totalTours }, (_, i) => selectedByTour[i].length).join("+")}/5)`
            ) : (
              "🚀 Создать игру и открыть лобби"
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
