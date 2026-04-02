const BEST_TIMES_KEY = "maze-mania:best-times";
const SETTINGS_KEY = "maze-mania:last-settings";
const THEME_KEY = "maze-mania:theme";
const PLAY_RECORDS_KEY = "maze-mania:play-records";
function bestTimeKey(seed, width, height, difficulty) {
    return [seed, width, height, difficulty].join("|");
}
function readJson(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        if (!value)
            return fallback;
        return JSON.parse(value);
    }
    catch {
        return fallback;
    }
}
function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
export function saveBestTime(seed, width, height, difficulty, elapsedMs) {
    const key = bestTimeKey(seed, width, height, difficulty);
    const bestTimes = readJson(BEST_TIMES_KEY, {});
    const existing = bestTimes[key];
    if (typeof existing !== "number" || elapsedMs < existing) {
        bestTimes[key] = elapsedMs;
        writeJson(BEST_TIMES_KEY, bestTimes);
    }
}
export function getBestTime(seed, width, height, difficulty) {
    const key = bestTimeKey(seed, width, height, difficulty);
    const bestTimes = readJson(BEST_TIMES_KEY, {});
    const value = bestTimes[key];
    return typeof value === "number" ? value : null;
}
export function saveLastSettings(settings) {
    writeJson(SETTINGS_KEY, settings);
}
export function getLastSettings() {
    const data = readJson(SETTINGS_KEY, null);
    if (!data)
        return null;
    if (typeof data.width !== "number")
        return null;
    if (typeof data.height !== "number")
        return null;
    if (!["easy", "medium", "hard"].includes(data.difficulty))
        return null;
    return data;
}
export function todaySeed() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}
export function randomSeed() {
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
        const bytes = new Uint32Array(2);
        crypto.getRandomValues(bytes);
        return `rnd-${bytes[0].toString(36)}-${bytes[1].toString(36)}`;
    }
    return `rnd-${Date.now().toString(36)}`;
}
export function getThemePreference() {
    const value = localStorage.getItem(THEME_KEY);
    return value === "dark" ? "dark" : "light";
}
export function saveThemePreference(theme) {
    localStorage.setItem(THEME_KEY, theme);
}
export function pointsForRun(width, height, elapsedMs) {
    if (elapsedMs <= 0)
        return 0;
    return Math.max(1, Math.round((width * height * 10000) / elapsedMs));
}
export function savePlayRecord(record) {
    const records = readJson(PLAY_RECORDS_KEY, []);
    const next = {
        ...record,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
    };
    records.push(next);
    writeJson(PLAY_RECORDS_KEY, records);
    return next;
}
export function getPlayRecords() {
    const records = readJson(PLAY_RECORDS_KEY, []);
    return records
        .filter((item) => item && typeof item.width === "number" && typeof item.height === "number")
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
export function getBestTimeForSelection(width, height, difficulty) {
    const records = getPlayRecords().filter((record) => record.width === width &&
        record.height === height &&
        record.difficulty === difficulty);
    if (records.length === 0)
        return null;
    return records.reduce((best, record) => Math.min(best, record.elapsedMs), records[0].elapsedMs);
}
