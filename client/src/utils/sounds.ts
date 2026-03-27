// Простые звуки через Web Audio API — файлы не нужны

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try { ctx = new AudioContext(); } catch { return null; }
  }
  // Восстанавливаем контекст если он был приостановлен
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function beep(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.4,
  delay = 0,
): void {
  const c = getCtx();
  if (!c) return;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, c.currentTime + delay);

  gain.gain.setValueAtTime(0, c.currentTime + delay);
  gain.gain.linearRampToValueAtTime(volume, c.currentTime + delay + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);

  osc.start(c.currentTime + delay);
  osc.stop(c.currentTime + delay + duration);
}

type SoundKey = 'question' | 'buzz' | 'correct' | 'wrong' | 'timerWarning' | 'timerEnd' | 'tourEnd';

export function playSound(key: SoundKey): void {
  try {
    switch (key) {
      case 'question':
        // Восходящий двойной тон — открытие вопроса
        beep(440, 0.12, 'square', 0.25);
        beep(660, 0.18, 'square', 0.25, 0.13);
        break;

      case 'buzz':
        // Резкий сигнал — кто-то нажал
        beep(880, 0.08, 'square', 0.35);
        beep(1100, 0.12, 'square', 0.3, 0.07);
        beep(880, 0.15, 'square', 0.2, 0.18);
        break;

      case 'correct':
        // Победный аккорд — правильный ответ
        beep(523, 0.15, 'sine', 0.35);
        beep(659, 0.15, 'sine', 0.35, 0.1);
        beep(784, 0.25, 'sine', 0.4, 0.2);
        break;

      case 'wrong':
        // Низкий нисходящий — неправильный ответ
        beep(300, 0.12, 'sawtooth', 0.3);
        beep(220, 0.2, 'sawtooth', 0.25, 0.1);
        break;

      case 'timerWarning':
        // Короткий тик — осталось мало времени
        beep(800, 0.06, 'square', 0.2);
        break;

      case 'timerEnd':
        // Двойной сигнал окончания таймера
        beep(400, 0.12, 'sawtooth', 0.3);
        beep(300, 0.2, 'sawtooth', 0.25, 0.14);
        break;

      case 'tourEnd':
        // Фанфара конца тура
        beep(523, 0.1, 'sine', 0.3);
        beep(659, 0.1, 'sine', 0.3, 0.12);
        beep(784, 0.1, 'sine', 0.35, 0.24);
        beep(1047, 0.3, 'sine', 0.4, 0.36);
        break;
    }
  } catch {
    // Звук не критичен — молча игнорируем ошибки
  }
}
