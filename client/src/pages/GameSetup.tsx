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
  { value: 90, label: "1:30" },
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

  useEffect(() => {
    themesApi
      .getAll()
      .then(setThemes)
      .catch(() => setError("Не удалось загрузить темы"))
      .finally(() => setIsLoading(false));
  }, []);

  // Все themeIds занятые в других турах
  const usedInOtherTours = (tourIdx: number) =>
    selectedByTour.filter((_, i) => i !== tourIdx).flat();

  const effectiveTimer = useCustomTimer
    ? Math.min(Math.max(parseInt(customTimer) || 30, 10), 120)
    : timerSecs;

  const allToursReady = Array.from({ length: totalTours }).every(
    (_, i) => selectedByTour[i].length === 5,
  );

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
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error;
      setError(String(msg || "Ошибка создания игры"));
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

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-deep)" }}>
      {/* ── Шапка ── */}
      <header
        className="px-6 py-4 flex items-center gap-4 sticky top-0 z-10"
        style={{
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border)",
        }}
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
          className="font-bold text-lg"
          style={{ color: "var(--text-primary)" }}
        >
          Новая игра
        </h1>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* ── Шаг 1: Число туров ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <h2
            className="font-semibold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Число туров
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            В каждом туре 5 тем × 5 вопросов = 25 вопросов
          </p>
          <div className="flex gap-3">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => {
                  setTotalTours(n);
                  setActiveTourTab(0);
                }}
                className="flex-1 py-4 rounded-xl font-bold text-2xl transition-all"
                style={{
                  background:
                    totalTours === n
                      ? "rgba(59,130,246,0.15)"
                      : "var(--bg-surface)",
                  border: `2px solid ${totalTours === n ? "var(--accent-blue)" : "var(--border)"}`,
                  color:
                    totalTours === n
                      ? "var(--accent-blue)"
                      : "var(--text-muted)",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </motion.section>

        {/* ── Шаг 2: Таймер ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl p-6"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <h2
            className="font-semibold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Таймер на вопрос
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Сколько секунд даётся на ответ
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {TIMER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setTimerSecs(opt.value);
                  setUseCustomTimer(false);
                }}
                className="px-5 py-2.5 rounded-xl font-medium transition-all"
                style={{
                  background:
                    timerSecs === opt.value && !useCustomTimer
                      ? "rgba(245,158,11,0.15)"
                      : "var(--bg-surface)",
                  border: `1px solid ${
                    timerSecs === opt.value && !useCustomTimer
                      ? "rgba(245,158,11,0.5)"
                      : "var(--border)"
                  }`,
                  color:
                    timerSecs === opt.value && !useCustomTimer
                      ? "var(--accent-gold)"
                      : "var(--text-muted)",
                }}
              >
                {opt.label}
              </button>
            ))}

            {/* Своё значение */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUseCustomTimer(!useCustomTimer)}
                className="px-4 py-2.5 rounded-xl font-medium transition-all text-sm"
                style={{
                  background: useCustomTimer
                    ? "rgba(245,158,11,0.15)"
                    : "var(--bg-surface)",
                  border: `1px solid ${useCustomTimer ? "rgba(245,158,11,0.5)" : "var(--border)"}`,
                  color: useCustomTimer
                    ? "var(--accent-gold)"
                    : "var(--text-muted)",
                }}
              >
                Своё
              </button>
              <AnimatePresence>
                {useCustomTimer && (
                  <motion.input
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 80, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    type="number"
                    min={10}
                    max={120}
                    value={customTimer}
                    onChange={(e) => setCustomTimer(e.target.value)}
                    placeholder="сек"
                    className="py-2.5 px-3 rounded-xl text-sm outline-none"
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                      width: 80,
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Итого:{" "}
            <strong style={{ color: "var(--accent-gold)" }}>
              {effectiveTimer} сек
            </strong>{" "}
            на каждый вопрос
          </p>
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
            className="px-6 py-4"
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
                    className="flex-1 py-3 text-sm font-medium transition-all relative"
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

          <div className="p-6">
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
              className="rounded-xl px-5 py-4 mb-4 text-sm"
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
            className="w-full py-5 rounded-2xl font-bold text-xl transition-all"
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
