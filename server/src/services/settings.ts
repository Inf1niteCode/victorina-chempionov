import fs from 'fs';
import path from 'path';

const FILE = path.join(process.cwd(), 'settings.json');

export interface AppSettings {
  themePrice: number;    // копейки, напр. 10000 = 100 ₽
  bundleDiscount: number; // процент скидки на набор, напр. 20
}

const DEFAULTS: AppSettings = { themePrice: 10000, bundleDiscount: 20 };

export function getSettings(): AppSettings {
  try {
    const raw = fs.readFileSync(FILE, 'utf-8');
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(data: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated = { ...current, ...data };
  fs.writeFileSync(FILE, JSON.stringify(updated, null, 2));
  return updated;
}
