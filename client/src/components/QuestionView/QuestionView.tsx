import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Timer from '../Timer/Timer';
import BuzzWinner from '../BuzzWinner/BuzzWinner';
import type { QuestionType } from '../../store/gameStore';

interface Props {
  text: string;
  answer?: string;       // только для ведущего
  points: number;
  themeName: string;
  timeLimit: number;
  timerSeconds: number;
  timerPaused: boolean;
  buzzWinner: { playerId: string; playerName: string } | null;
  showAnswer?: boolean;  // true для ведущего
  questionType?: QuestionType;
  mediaUrl?: string;
  // Колбэки только для ведущего
  onCorrect?: (playerId: string) => void;
  onWrong?: (playerId: string) => void;
  onPause?: () => void;
  onReset?: () => void;
  onClose?: () => void;
}

const POINT_BG: Record<number, string> = {
  100: 'rgba(96,165,250,0.15)',
  200: 'rgba(52,211,153,0.15)',
  300: 'rgba(245,158,11,0.15)',
  400: 'rgba(249,115,22,0.15)',
  500: 'rgba(239,68,68,0.15)',
};
const POINT_COLOR: Record<number, string> = {
  100: '#60A5FA', 200: '#34D399', 300: '#F59E0B', 400: '#F97316', 500: '#EF4444',
};

const TYPE_LABEL: Record<QuestionType, string> = {
  TEXT: 'Текст',
  IMAGE: '🖼 Картинка',
  AUDIO: '🎵 Звук',
  VIDEO: '🎬 Видео',
};

function MediaBlock({ questionType, mediaUrl, isHost }: {
  questionType: QuestionType;
  mediaUrl?: string;
  isHost: boolean;
}) {
  const [audioPlaying, setAudioPlaying] = useState(false);

  if (questionType === 'TEXT' || !mediaUrl) return null;

  if (questionType === 'IMAGE') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl overflow-hidden mb-4 flex-shrink-0 flex justify-center"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <img
          src={mediaUrl}
          alt="Вопрос"
          className="max-w-full object-contain"
          style={{ maxHeight: isHost ? 220 : 360 }}
        />
      </motion.div>
    );
  }

  if (questionType === 'AUDIO') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-4 mb-4 flex-shrink-0 flex flex-col items-center gap-3"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <div className="text-4xl">{audioPlaying ? '🔊' : '🎵'}</div>
        <audio
          src={mediaUrl}
          controls
          onPlay={() => setAudioPlaying(true)}
          onPause={() => setAudioPlaying(false)}
          onEnded={() => setAudioPlaying(false)}
          style={{ width: '100%', accentColor: 'var(--accent-blue)' }}
        />
      </motion.div>
    );
  }

  if (questionType === 'VIDEO') {
    // Поддержка YouTube embed
    const isYoutube = /youtube\.com|youtu\.be/.test(mediaUrl);
    let embedUrl = mediaUrl;
    if (isYoutube) {
      const match = mediaUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}?autoplay=0`;
    }

    const maxH = isHost ? 260 : 360;
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden mb-4 flex-shrink-0"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', maxHeight: maxH }}
      >
        {isYoutube ? (
          <iframe
            src={embedUrl}
            style={{ width: '100%', height: maxH, border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={mediaUrl}
            controls
            style={{ width: '100%', height: maxH, objectFit: 'contain', background: '#000' }}
          />
        )}
      </motion.div>
    );
  }

  return null;
}

export default function QuestionView({
  text, answer, points, themeName, timeLimit,
  timerSeconds, timerPaused, buzzWinner,
  showAnswer = false,
  questionType = 'TEXT',
  mediaUrl,
  onCorrect, onWrong, onPause, onReset, onClose,
}: Props) {
  const isHost = showAnswer;
  const pc = POINT_COLOR[points] || 'var(--accent-gold)';
  const pb = POINT_BG[points] || 'rgba(245,158,11,0.1)';

  return (
    <div className="flex flex-col h-full">

      {/* ── Мета-шапка ── */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span style={{ padding: '4px 14px', borderRadius: 9999, fontSize: '0.8rem', fontWeight: 600, background: 'rgba(107,114,128,0.2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            {themeName}
          </span>
          <span style={{ padding: '4px 14px', borderRadius: 9999, fontSize: '0.85rem', fontWeight: 700, background: pb, color: pc, border: `1px solid ${pc}40` }}>
            {points} очков
          </span>
          {questionType !== 'TEXT' && (
            <span style={{ padding: '4px 12px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600, background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {TYPE_LABEL[questionType]}
            </span>
          )}
        </div>
        {isHost && onClose && (
          <button onClick={onClose}
            className="text-sm px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            × Закрыть
          </button>
        )}
      </div>

      {/* ── Медиа-контент ── */}
      <MediaBlock questionType={questionType} mediaUrl={mediaUrl} isHost={isHost} />

      {/* ── Текст вопроса ── */}
      <div className="rounded-2xl p-6 mb-4 flex-shrink-0"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <p style={{
          fontSize: isHost ? '1.1rem' : 'clamp(1.4rem, 3vw, 2.5rem)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.4,
        }}>
          {text}
        </p>
      </div>

      {/* ── Правильный ответ (только для ведущего) ── */}
      {showAnswer && answer && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl px-6 py-4 mb-4 flex-shrink-0"
          style={{ background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.4)' }}>
          <p className="text-xs font-semibold mb-1 uppercase tracking-wide"
            style={{ color: 'rgba(16,185,129,0.7)' }}>
            Правильный ответ
          </p>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-green)' }}>
            {answer}
          </p>
        </motion.div>
      )}

      {/* ── Buzz Winner + Кнопки ✅/❌ ── */}
      <AnimatePresence>
        {buzzWinner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="mb-4 flex-shrink-0"
          >
            <BuzzWinner playerName={buzzWinner.playerName} size="md" />

            {isHost && onCorrect && onWrong && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => onCorrect(buzzWinner.playerId)}
                  className="flex-1 py-4 rounded-2xl font-bold text-lg transition-all"
                  style={{
                    background: 'rgba(16,185,129,0.15)',
                    border: '2px solid var(--accent-green)',
                    color: 'var(--accent-green)',
                    minHeight: 60,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16,185,129,0.25)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(16,185,129,0.15)')}
                >
                  ✅ Правильно
                </button>
                <button
                  onClick={() => onWrong(buzzWinner.playerId)}
                  className="flex-1 py-4 rounded-2xl font-bold text-lg transition-all"
                  style={{
                    background: 'rgba(239,68,68,0.12)',
                    border: '2px solid var(--accent-red)',
                    color: 'var(--accent-red)',
                    minHeight: 60,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.22)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.12)')}
                >
                  ❌ Неправильно
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Таймер + управление (для ведущего) ── */}
      {questionType !== 'VIDEO' && questionType !== 'AUDIO' && (
      <div className="mt-auto flex-shrink-0">
        <div className="flex items-center justify-between">
          <Timer seconds={timerSeconds} total={timeLimit} paused={timerPaused} size="lg" />

          {isHost && (
            <div className="flex gap-2">
              <button onClick={onPause}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                {timerPaused ? '▶ Продолжить' : '⏸ Пауза'}
              </button>
              <button onClick={onReset}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                ↺ Сбросить
              </button>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
