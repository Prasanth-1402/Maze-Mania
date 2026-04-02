import type { Difficulty } from "../engine/types";

const BEST_TIMES_KEY = "maze-mania:best-times";
const SETTINGS_KEY = "maze-mania:last-settings";
const THEME_KEY = "maze-mania:theme";
const PLAY_RECORDS_KEY = "maze-mania:play-records";

type BestTimes = Record<string, number>;
export type ThemeMode = "light" | "dark";
export type PlayRecord = {
  id: string;
  seed: string;
  width: number;
  height: number;
  difficulty: Difficulty;
  elapsedMs: number;
  points: number;
  createdAt: string;
};

export type PersistedSettings = {
  width: number;
  height: number;
  difficulty: Difficulty;
};

function bestTimeKey(seed: string, width: number, height: number, difficulty: Difficulty): string {
  return [seed, width, height, difficulty].join("|");
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    if (!value) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function saveBestTime(
  seed: string,
  width: number,
  height: number,
  difficulty: Difficulty,
  elapsedMs: number
): void {
  const key = bestTimeKey(seed, width, height, difficulty);
  const bestTimes = readJson<BestTimes>(BEST_TIMES_KEY, {});
  const existing = bestTimes[key];
  if (typeof existing !== "number" || elapsedMs < existing) {
    bestTimes[key] = elapsedMs;
    writeJson(BEST_TIMES_KEY, bestTimes);
  }
}

export function getBestTime(
  seed: string,
  width: number,
  height: number,
  difficulty: Difficulty
): number | null {
  const key = bestTimeKey(seed, width, height, difficulty);
  const bestTimes = readJson<BestTimes>(BEST_TIMES_KEY, {});
  const value = bestTimes[key];
  return typeof value === "number" ? value : null;
}

export function saveLastSettings(settings: PersistedSettings): void {
  writeJson(SETTINGS_KEY, settings);
}

export function getLastSettings(): PersistedSettings | null {
  const data = readJson<PersistedSettings | null>(SETTINGS_KEY, null);
  if (!data) return null;
  if (typeof data.width !== "number") return null;
  if (typeof data.height !== "number") return null;
  if (!["easy", "medium", "hard"].includes(data.difficulty)) return null;
  return data;
}

export function todaySeed(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function randomSeed(): string {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint32Array(2);
    crypto.getRandomValues(bytes);
    return `rnd-${bytes[0].toString(36)}-${bytes[1].toString(36)}`;
  }
  return `rnd-${Date.now().toString(36)}`;
}

export function getThemePreference(): ThemeMode {
  const value = localStorage.getItem(THEME_KEY);
  return value === "dark" ? "dark" : "light";
}

export function saveThemePreference(theme: ThemeMode): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function pointsForRun(width: number, height: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  return Math.max(1, Math.round((width * height * 10000) / elapsedMs));
}

export function savePlayRecord(record: Omit<PlayRecord, "id" | "createdAt">): PlayRecord {
  const records = readJson<PlayRecord[]>(PLAY_RECORDS_KEY, []);
  const next: PlayRecord = {
    ...record,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  records.push(next);
  writeJson(PLAY_RECORDS_KEY, records);
  return next;
}

export function getPlayRecords(): PlayRecord[] {
  const records = readJson<PlayRecord[]>(PLAY_RECORDS_KEY, []);
  return records
    .filter((item) => item && typeof item.width === "number" && typeof item.height === "number")
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getBestTimeForSelection(width: number, height: number, difficulty: Difficulty): number | null {
  const records = getPlayRecords().filter(
    (record) =>
      record.width === width &&
      record.height === height &&
      record.difficulty === difficulty
  );
  if (records.length === 0) return null;
  return records.reduce((best, record) => Math.min(best, record.elapsedMs), records[0].elapsedMs);
}
