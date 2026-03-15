import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi, AdminTheme, AdminQuestion, AdminSettings } from '../api/admin';

const POINTS = [100, 200, 300, 400, 500] as const;

// ── Типы модалок ─────────────────────────────
type ThemeModal =
  | { mode: 'create' }
  | { mode: 'edit'; theme: AdminTheme };

type QuestionModal =
  | { mode: 'create'; themeId: string }
  | { mode: 'edit'; themeId: string; question: AdminQuestion };

// ── Начальные значения форм ───────────────────
const emptyTheme = { name: '', category: '', isFree: true };
const emptyQuestion = { text: '', answer: '', points: 100 as number };

interface ImportEntry {
  name: string;
  category: string;
  isFree: boolean;
  questions: { points: number; text: string; answer: string }[];
}

export default function Admin() {
  const navigate = useNavigate();

  const [themes, setThemes] = useState<AdminTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<string>('');

  // Модалки
  const [themeModal, setThemeModal] = useState<ThemeModal | null>(null);
  const [questionModal, setQuestionModal] = useState<QuestionModal | null>(null);

  // Настройки цен
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [discountInput, setDiscountInput] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);

  // Импорт
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importLog, setImportLog] = useState<string[]>([]);

  // Формы
  const [themeForm, setThemeForm] = useState(emptyTheme);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // ── Загрузка ─────────────────────────────────
  useEffect(() => {
    Promise.all([adminApi.getThemes(), adminApi.getSettings()])
      .then(([t, s]) => {
        setThemes(t);
        setSettings(s);
        setPriceInput(String(s.themePrice / 100));
        setDiscountInput(String(s.bundleDiscount));
      })
      .catch(() => setError('Нет доступа или ошибка загрузки'))
      .finally(() => setLoading(false));
  }, []);

  // ── Производные данные ────────────────────────
  const categories = [...new Set(themes.map((t) => t.category))].sort();

  const filtered = catFilter
    ? themes.filter((t) => t.category === catFilter)
    : themes;

  const grouped = categories
    .filter((c) => !catFilter || c === catFilter)
    .map((cat) => ({ cat, themes: filtered.filter((t) => t.category === cat) }));

  // ── Открыть модалки ───────────────────────────
  const openCreateTheme = () => {
    setThemeForm({ ...emptyTheme, category: catFilter });
    setFormError('');
    setThemeModal({ mode: 'create' });
  };

  const openEditTheme = (theme: AdminTheme) => {
    setThemeForm({ name: theme.name, category: theme.category, isFree: theme.isFree });
    setFormError('');
    setThemeModal({ mode: 'edit', theme });
  };

  const openCreateQuestion = (themeId: string) => {
    setQuestionForm(emptyQuestion);
    setFormError('');
    setQuestionModal({ mode: 'create', themeId });
  };

  const openEditQuestion = (themeId: string, question: AdminQuestion) => {
    setQuestionForm({ text: question.text, answer: question.answer, points: question.points });
    setFormError('');
    setQuestionModal({ mode: 'edit', themeId, question });
  };

  // ── Сохранение темы ───────────────────────────
  const saveTheme = async () => {
    if (!themeForm.name.trim() || !themeForm.category.trim()) {
      setFormError('Заполните название и категорию');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (themeModal?.mode === 'create') {
        const t = await adminApi.createTheme(themeForm);
        setThemes((prev) => [...prev, t].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)));
      } else if (themeModal?.mode === 'edit') {
        const t = await adminApi.updateTheme(themeModal.theme.id, themeForm);
        setThemes((prev) => prev.map((x) => x.id === t.id ? t : x));
      }
      setThemeModal(null);
    } catch {
      setFormError('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  // ── Удаление темы ─────────────────────────────
  const deleteTheme = async (id: string) => {
    if (!confirm('Удалить тему и все её вопросы?')) return;
    try {
      await adminApi.deleteTheme(id);
      setThemes((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError('Ошибка удаления темы');
    }
  };

  // ── Сохранение вопроса ────────────────────────
  const saveQuestion = async () => {
    if (!questionForm.text.trim() || !questionForm.answer.trim()) {
      setFormError('Заполните вопрос и ответ');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (questionModal?.mode === 'create') {
        const q = await adminApi.createQuestion(questionModal.themeId, questionForm);
        setThemes((prev) => prev.map((t) =>
          t.id === questionModal.themeId
            ? { ...t, questions: [...t.questions, q].sort((a, b) => a.points - b.points) }
            : t
        ));
      } else if (questionModal?.mode === 'edit') {
        const q = await adminApi.updateQuestion(questionModal.question.id, questionForm);
        setThemes((prev) => prev.map((t) =>
          t.id === questionModal.themeId
            ? { ...t, questions: t.questions.map((x) => x.id === q.id ? q : x) }
            : t
        ));
      }
      setQuestionModal(null);
    } catch {
      setFormError('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  // ── Удаление вопроса ──────────────────────────
  const deleteQuestion = async (themeId: string, questionId: string) => {
    if (!confirm('Удалить вопрос?')) return;
    try {
      await adminApi.deleteQuestion(questionId);
      setThemes((prev) => prev.map((t) =>
        t.id === themeId
          ? { ...t, questions: t.questions.filter((q) => q.id !== questionId) }
          : t
      ));
    } catch {
      setError('Ошибка удаления вопроса');
    }
  };

  // ── Сохранение цены ───────────────────────────
  const savePrice = async () => {
    const price = parseFloat(priceInput);
    const discount = parseFloat(discountInput);
    if (isNaN(price) || price <= 0 || isNaN(discount) || discount < 0 || discount > 99) return;
    setSavingPrice(true);
    try {
      const s = await adminApi.updateSettings({ themePrice: price, bundleDiscount: discount });
      setSettings(s);
    } finally {
      setSavingPrice(false);
    }
  };

  // ── Импорт ────────────────────────────────────
  const handleImport = async () => {
    setImportError('');
    setImportLog([]);
    let entries: ImportEntry[];
    try {
      const trimmed = importText.trim();
      // Если уже массив — берём как есть, иначе оборачиваем в []
      const src = trimmed.startsWith('[') ? trimmed : `[${trimmed}]`;
      // eslint-disable-next-line no-new-func
      entries = new Function(`"use strict"; return (${src})`)() as ImportEntry[];
      if (!Array.isArray(entries)) throw new Error('Не удалось распознать данные');
    } catch (e) {
      setImportError(`Ошибка парсинга: ${(e as Error).message}`);
      return;
    }
    setImporting(true);
    const log: string[] = [];
    const created: AdminTheme[] = [];
    for (const entry of entries) {
      try {
        const theme = await adminApi.createTheme({
          name: entry.name,
          category: entry.category,
          isFree: entry.isFree,
        });
        log.push(`✓ Тема "${entry.name}"`);
        setImportLog([...log]);
        for (const q of entry.questions || []) {
          try {
            const question = await adminApi.createQuestion(theme.id, {
              text: q.text,
              answer: q.answer,
              points: q.points,
            });
            theme.questions = [...(theme.questions || []), question];
            log.push(`  ✓ ${q.points} — ${q.text.slice(0, 40)}...`);
          } catch {
            log.push(`  ✗ Ошибка вопроса ${q.points}`);
          }
          setImportLog([...log]);
        }
        created.push(theme);
      } catch {
        log.push(`✗ Ошибка темы "${entry.name}"`);
        setImportLog([...log]);
      }
    }
    setThemes((prev) =>
      [...prev, ...created].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
    );
    setImporting(false);
    log.push(`Готово: ${created.length} из ${entries.length} тем`);
    setImportLog([...log]);
  };

  // ── Рендер ────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const totalQuestions = themes.reduce((s, t) => s + t.questions.length, 0);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>

      {/* ── Шапка ── */}
      <header className="sticky top-0 z-20 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl transition-all hover:opacity-85"
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}>
            ← Назад
          </button>
          <div>
            <h1 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              Панель администратора
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {themes.length} тем · {totalQuestions} вопросов · {categories.length} категорий
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setImportText(''); setImportLog([]); setImportError(''); setImportOpen(true); }}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--accent-blue)',
              border: '1px solid rgba(59,130,246,0.4)',
            }}>
            Импорт
          </button>
          <button
            onClick={openCreateTheme}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)',
              color: '#07090F',
            }}>
            + Добавить тему
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 space-y-5">

        {/* Ошибка */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-red)' }}>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Настройка цен */}
        {settings && (
          <div className="rounded-2xl p-5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Цены
            </h3>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Цена за тему (₽)
                </label>
                <input
                  type="number"
                  min={1}
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-32 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Скидка на набор (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  className="w-28 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Тема: <span style={{ color: 'var(--accent-gold)' }}>{parseFloat(priceInput) || 0} ₽</span>
                  &nbsp;·&nbsp;Набор: <span style={{ color: 'var(--accent-green)' }}>
                    {Math.round((parseFloat(priceInput) || 0) * (1 - (parseFloat(discountInput) || 0) / 100))} ₽/тему
                  </span>
                </p>
                <button
                  onClick={savePrice}
                  disabled={savingPrice}
                  className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: savingPrice ? 'var(--bg-surface)' : 'linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)',
                    color: savingPrice ? 'var(--text-muted)' : '#07090F',
                  }}>
                  {savingPrice ? 'Сохраняем...' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Фильтр по категориям */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCatFilter('')}
            className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: !catFilter ? 'var(--accent-blue)' : 'var(--bg-surface)',
              color: !catFilter ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${!catFilter ? 'var(--accent-blue)' : 'var(--border)'}`,
            }}>
            Все ({themes.length})
          </button>
          {categories.map((cat) => {
            const count = themes.filter((t) => t.category === cat).length;
            const active = catFilter === cat;
            return (
              <button key={cat}
                onClick={() => setCatFilter(active ? '' : cat)}
                className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: active ? 'rgba(59,130,246,0.15)' : 'var(--bg-surface)',
                  color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
                  border: `1px solid ${active ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
                }}>
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Список тем по категориям */}
        {grouped.map(({ cat, themes: catThemes }) => (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}>
                {cat}
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {catThemes.length} тем
              </span>
            </div>

            <div className="space-y-2">
              {catThemes.map((theme) => {
                const isExpanded = expandedId === theme.id;
                return (
                  <motion.div key={theme.id}
                    layout
                    className="rounded-2xl overflow-hidden"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

                    {/* Строка темы */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : theme.id)}
                        className="text-xs w-5 h-5 flex-shrink-0 transition-transform"
                        style={{ color: 'var(--text-muted)', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>
                        ▶
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                            {theme.name}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{
                              background: theme.isFree ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                              color: theme.isFree ? 'var(--accent-green)' : 'var(--accent-gold)',
                              border: `1px solid ${theme.isFree ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                            }}>
                            {theme.isFree ? 'Бесплатно' : '100 ₽'}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {theme.questions.length} вопросов
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => openCreateQuestion(theme.id)}
                          className="text-xs px-2.5 py-1.5 rounded-lg transition-all"
                          style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.25)' }}>
                          + Вопрос
                        </button>
                        <button
                          onClick={() => openEditTheme(theme)}
                          className="text-xs px-2.5 py-1.5 rounded-lg transition-all"
                          style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                          ✏
                        </button>
                        <button
                          onClick={() => deleteTheme(theme.id)}
                          className="text-xs px-2.5 py-1.5 rounded-lg transition-all"
                          style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.2)' }}>
                          🗑
                        </button>
                      </div>
                    </div>

                    {/* Вопросы (раскрытые) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ borderTop: '1px solid var(--border)', overflow: 'hidden' }}>
                          <div className="px-4 py-3 space-y-2">
                            {theme.questions.length === 0 ? (
                              <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
                                Нет вопросов — добавьте первый
                              </p>
                            ) : (
                              theme.questions.map((q) => (
                                <div key={q.id}
                                  className="flex items-start gap-3 px-3 py-2.5 rounded-xl"
                                  style={{ background: 'var(--bg-surface)' }}>
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0"
                                    style={{ background: 'var(--bg-card)', color: 'var(--accent-gold)', border: '1px solid var(--border)', minWidth: 40, textAlign: 'center' }}>
                                    {q.points}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                      {q.text}
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--accent-green)' }}>
                                      → {q.answer}
                                    </p>
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => openEditQuestion(theme.id, q)}
                                      className="text-xs px-2 py-1 rounded-lg"
                                      style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                      ✏
                                    </button>
                                    <button
                                      onClick={() => deleteQuestion(theme.id, q.id)}
                                      className="text-xs px-2 py-1 rounded-lg"
                                      style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                      🗑
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {grouped.length === 0 && !loading && (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <div className="text-5xl mb-3">📭</div>
            <p>Тем пока нет. Добавьте первую!</p>
          </div>
        )}

        <div className="pb-8" />
      </div>

      {/* ══ Модалка импорта ═══════════════════════ */}
      <AnimatePresence>
        {importOpen && (
          <motion.div
            key="import-modal-bg"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => !importing && setImportOpen(false)}>
            <motion.div
              key="import-modal"
              initial={{ scale: 0.93, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="rounded-3xl p-6 w-full max-w-2xl space-y-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              onClick={(e) => e.stopPropagation()}>

              <div>
                <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  Массовый импорт тем
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Вставьте массив объектов в формате JS или JSON
                </p>
              </div>

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                disabled={importing}
                placeholder={`[\n  {\n    name: 'Деревья',\n    category: 'РАСТЕНИЯ',\n    isFree: false,\n    questions: [\n      { points: 100, text: '...', answer: '...' },\n    ],\n  },\n]`}
                rows={14}
                className="w-full px-3 py-2.5 rounded-xl text-xs outline-none resize-none font-mono"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              />

              {importError && (
                <p className="text-xs" style={{ color: 'var(--accent-red)' }}>{importError}</p>
              )}

              {importLog.length > 0 && (
                <div className="rounded-xl p-3 max-h-40 overflow-y-auto"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  {importLog.map((line, i) => (
                    <p key={i} className="text-xs font-mono whitespace-pre"
                      style={{ color: line.startsWith('  ✗') || line.startsWith('✗') ? 'var(--accent-red)' : line.startsWith('Готово') ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                      {line}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                {importLog.some(l => l.startsWith('Готово')) ? (
                  <button onClick={() => setImportOpen(false)}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)',
                      color: '#07090F',
                    }}>
                    Готово
                  </button>
                ) : (
                  <>
                    <button onClick={() => setImportOpen(false)} disabled={importing}
                      className="flex-1 py-2.5 rounded-2xl text-sm font-medium"
                      style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      Отмена
                    </button>
                    <button onClick={handleImport} disabled={importing || !importText.trim()}
                      className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all"
                      style={{
                        background: importing || !importText.trim() ? 'var(--bg-surface)' : 'linear-gradient(135deg, var(--accent-blue) 0%, #6366f1 100%)',
                        color: importing || !importText.trim() ? 'var(--text-muted)' : '#fff',
                      }}>
                      {importing ? 'Импортируем...' : 'Запустить импорт'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Модалка темы ══════════════════════════ */}
      <AnimatePresence>
        {themeModal && (
          <motion.div
            key="theme-modal-bg"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => !saving && setThemeModal(null)}>
            <motion.div
              key="theme-modal"
              initial={{ scale: 0.93, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="rounded-3xl p-6 w-full max-w-md space-y-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              onClick={(e) => e.stopPropagation()}>

              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                {themeModal.mode === 'create' ? 'Новая тема' : 'Редактировать тему'}
              </h2>

              {/* Название */}
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Название темы
                </label>
                <input
                  value={themeForm.name}
                  onChange={(e) => setThemeForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Например: Великие войны"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                />
              </div>

              {/* Категория */}
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Категория
                </label>
                <input
                  list="admin-categories"
                  value={themeForm.category}
                  onChange={(e) => setThemeForm((p) => ({ ...p, category: e.target.value.toUpperCase() }))}
                  placeholder="Например: ИСТОРИЯ"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                />
                <datalist id="admin-categories">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Выберите из существующих или введите новую
                </p>
              </div>

              {/* Бесплатно / Платно */}
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-muted)' }}>
                  Доступность
                </label>
                <div className="flex gap-2">
                  {[true, false].map((v) => (
                    <button key={String(v)}
                      onClick={() => setThemeForm((p) => ({ ...p, isFree: v }))}
                      className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: themeForm.isFree === v
                          ? (v ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)')
                          : 'var(--bg-surface)',
                        color: themeForm.isFree === v
                          ? (v ? 'var(--accent-green)' : 'var(--accent-gold)')
                          : 'var(--text-muted)',
                        border: `1px solid ${themeForm.isFree === v
                          ? (v ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.35)')
                          : 'var(--border)'}`,
                      }}>
                      {v ? '🎁 Бесплатно' : '💰 Платно (100 ₽)'}
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <p className="text-xs" style={{ color: 'var(--accent-red)' }}>{formError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setThemeModal(null)} disabled={saving}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  Отмена
                </button>
                <button onClick={saveTheme} disabled={saving}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all"
                  style={{
                    background: saving ? 'var(--bg-surface)' : 'linear-gradient(135deg, var(--accent-gold) 0%, #f97316 100%)',
                    color: saving ? 'var(--text-muted)' : '#07090F',
                  }}>
                  {saving ? 'Сохраняем...' : 'Сохранить'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Модалка вопроса ═══════════════════════ */}
      <AnimatePresence>
        {questionModal && (
          <motion.div
            key="question-modal-bg"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => !saving && setQuestionModal(null)}>
            <motion.div
              key="question-modal"
              initial={{ scale: 0.93, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="rounded-3xl p-6 w-full max-w-md space-y-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              onClick={(e) => e.stopPropagation()}>

              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                {questionModal.mode === 'create' ? 'Новый вопрос' : 'Редактировать вопрос'}
              </h2>

              {/* Очки */}
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-muted)' }}>
                  Очки
                </label>
                <div className="flex gap-2">
                  {POINTS.map((p) => (
                    <button key={p}
                      onClick={() => setQuestionForm((prev) => ({ ...prev, points: p }))}
                      className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                      style={{
                        background: questionForm.points === p ? 'rgba(245,158,11,0.15)' : 'var(--bg-surface)',
                        color: questionForm.points === p ? 'var(--accent-gold)' : 'var(--text-muted)',
                        border: `1px solid ${questionForm.points === p ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`,
                      }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Вопрос */}
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Текст вопроса
                </label>
                <textarea
                  value={questionForm.text}
                  onChange={(e) => setQuestionForm((p) => ({ ...p, text: e.target.value }))}
                  placeholder="Введите текст вопроса..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                />
              </div>

              {/* Ответ */}
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Правильный ответ
                </label>
                <input
                  value={questionForm.answer}
                  onChange={(e) => setQuestionForm((p) => ({ ...p, answer: e.target.value }))}
                  placeholder="Введите ответ..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                />
              </div>

              {formError && (
                <p className="text-xs" style={{ color: 'var(--accent-red)' }}>{formError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setQuestionModal(null)} disabled={saving}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  Отмена
                </button>
                <button onClick={saveQuestion} disabled={saving}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all"
                  style={{
                    background: saving ? 'var(--bg-surface)' : 'linear-gradient(135deg, var(--accent-blue) 0%, #6366f1 100%)',
                    color: saving ? 'var(--text-muted)' : '#fff',
                  }}>
                  {saving ? 'Сохраняем...' : 'Сохранить'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
