import { useEffect, useMemo, useRef, useState } from "react";
import { defaultSizeForDifficulty } from "./engine/difficulty";
import { generateMaze } from "./engine/maze";
import { canMove } from "./engine/solver";
import type { Difficulty, Maze, Position } from "./engine/types";
import {
  getLastSettings,
  getPlayRecords,
  getThemePreference,
  pointsForRun,
  randomSeed,
  saveBestTime,
  saveLastSettings,
  savePlayRecord,
  saveThemePreference,
  todaySeed,
  type ThemeMode,
} from "./storage/persistence";
import { Controls } from "./ui/Controls";
import { MazeCanvas } from "./ui/MazeCanvas";
import { RecordsDashboard } from "./ui/RecordsDashboard";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatMs(value: number | null): string {
  if (value === null) return "-";
  return `${(value / 1000).toFixed(2)}s`;
}

const startPos: Position = { x: 0, y: 0 };

function moveFromKey(key: string): Position | null {
  if (key === "ArrowUp") return { x: 0, y: -1 };
  if (key === "ArrowRight") return { x: 1, y: 0 };
  if (key === "ArrowDown") return { x: 0, y: 1 };
  if (key === "ArrowLeft") return { x: -1, y: 0 };
  return null;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function App(): JSX.Element {
  const persisted = getLastSettings();
  const defaultDifficulty: Difficulty = persisted?.difficulty ?? "medium";
  const fallbackSize = defaultSizeForDifficulty(defaultDifficulty);
  const initialSeed = todaySeed();

  const [difficulty, setDifficulty] = useState<Difficulty>(defaultDifficulty);
  const [width, setWidth] = useState(clamp(persisted?.width ?? fallbackSize.width, 5, 25));
  const [height, setHeight] = useState(clamp(persisted?.height ?? fallbackSize.height, 5, 25));
  const [theme, setTheme] = useState<ThemeMode>(() => getThemePreference());
  const [maze, setMaze] = useState<Maze>(() =>
    generateMaze({
      width: persisted?.width ?? fallbackSize.width,
      height: persisted?.height ?? fallbackSize.height,
      seed: initialSeed,
      difficulty: defaultDifficulty,
    })
  );
  const [player, setPlayer] = useState<Position>(startPos);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [won, setWon] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showGameplay, setShowGameplay] = useState(false);
  const [records, setRecords] = useState(() => getPlayRecords());
  const celebrationTimerRef = useRef<number | null>(null);
  const recordedWinRef = useRef(false);

  const end = useMemo(() => ({ x: maze.width - 1, y: maze.height - 1 }), [maze.width, maze.height]);

  useEffect(() => {
    saveLastSettings({ width, height, difficulty });
  }, [width, height, difficulty]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    saveThemePreference(theme);
  }, [theme]);

  useEffect(() => {
    if (!startedAt || won) return;
    const id = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAt);
    }, 100);
    return () => window.clearInterval(id);
  }, [startedAt, won]);

  function resetRun(): void {
    if (celebrationTimerRef.current !== null) {
      window.clearTimeout(celebrationTimerRef.current);
      celebrationTimerRef.current = null;
    }
    setPlayer(startPos);
    setWon(false);
    setShowCelebration(false);
    setElapsedMs(0);
    setStartedAt(null);
    recordedWinRef.current = false;
  }

  function regenerateMaze(
    nextWidth: number,
    nextHeight: number,
    nextDifficulty: Difficulty = difficulty,
    revealGameplay = false
  ): void {
    const boundedWidth = clamp(nextWidth, 5, 25);
    const boundedHeight = clamp(nextHeight, 5, 25);
    const next = generateMaze({
      width: boundedWidth,
      height: boundedHeight,
      seed: randomSeed(),
      difficulty: nextDifficulty,
    });
    setDifficulty(nextDifficulty);
    setWidth(boundedWidth);
    setHeight(boundedHeight);
    setMaze(next);
    resetRun();
    setShowGameplay(revealGameplay);
  }

  function onGenerateRandom(): void {
    const difficulties: Difficulty[] = ["easy", "medium", "hard"];
    const nextDifficulty = difficulties[randomInt(0, difficulties.length - 1)];
    const nextWidth = randomInt(5, 25);
    const nextHeight = randomInt(5, 25);
    regenerateMaze(nextWidth, nextHeight, nextDifficulty, false);
  }

  function onGenerateDaily(): void {
    const next = generateMaze({ width, height, seed: todaySeed(), difficulty });
    setMaze(next);
    resetRun();
    setShowGameplay(false);
  }

  function onCreateMaze(): void {
    regenerateMaze(width, height, difficulty, true);
  }

  function onWidthCommit(value: number): void {
    const nextWidth = clamp(value || 5, 5, 25);
    if (nextWidth === width) return;
    regenerateMaze(nextWidth, height);
  }

  function onHeightCommit(value: number): void {
    const nextHeight = clamp(value || 5, 5, 25);
    if (nextHeight === height) return;
    regenerateMaze(width, nextHeight);
  }

  function movePlayer(dx: number, dy: number): void {
    setPlayer((current) => {
      if (won) return current;
      if (!canMove(maze, current, dx, dy)) return current;
      if (!startedAt) setStartedAt(performance.now());
      const next = { x: current.x + dx, y: current.y + dy };
      if (next.x === end.x && next.y === end.y) {
        if (recordedWinRef.current) return next;
        recordedWinRef.current = true;
        const finalMs = startedAt ? performance.now() - startedAt : 0;
        setElapsedMs(finalMs);
        setWon(true);
        setShowGameplay(false);
        if (celebrationTimerRef.current !== null) {
          window.clearTimeout(celebrationTimerRef.current);
        }
        setShowCelebration(false);
        saveBestTime(maze.seed, maze.width, maze.height, maze.difficulty, finalMs);
        savePlayRecord({
          seed: maze.seed,
          width: maze.width,
          height: maze.height,
          difficulty: maze.difficulty,
          elapsedMs: finalMs,
          points: pointsForRun(maze.width, maze.height, finalMs),
        });
        setRecords(getPlayRecords());
      }
      return next;
    });
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const delta = moveFromKey(event.key);
      if (!delta) return;
      event.preventDefault();
      movePlayer(delta.x, delta.y);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [maze, startedAt, end.x, end.y]);

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current !== null) window.clearTimeout(celebrationTimerRef.current);
    };
  }, []);

  const gameVisible = showGameplay && !won && !showCelebration;
  const timerDisplay = startedAt === null ? "--" : formatMs(elapsedMs);

  return (
    <main className={`app ${gameVisible ? "app-playing" : ""}`}>
      <button
        type="button"
        className="btn btn-theme btn-theme-corner"
        onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
      >
        {theme === "light" ? "Dark" : "Light"}
      </button>

      {!gameVisible ? (
        <header className="app-header">
          <div>
            <p className="eyebrow">Deterministic Maze Engine</p>
            <h1>Maze Mania</h1>
          </div>
        </header>
      ) : null}

      {!gameVisible ? <RecordsDashboard records={records} /> : null}

      {!gameVisible ? (
        <section className="panel controls-panel">
          <Controls
            width={width}
            height={height}
            difficulty={difficulty}
            onWidthChange={onWidthCommit}
            onHeightChange={onHeightCommit}
            onDifficultyChange={(value) => setDifficulty(value)}
            onCreateMaze={onCreateMaze}
            onGenerateDaily={onGenerateDaily}
            onGenerateRandom={onGenerateRandom}
          />
        </section>
      ) : null}

      {gameVisible ? (
        <>
          <section className="panel play-timer">Timer: {timerDisplay}</section>
          <section className="panel maze-panel">
            <MazeCanvas maze={maze} player={player} end={end} theme={theme} />
          </section>
          <section className="dpad" aria-label="Movement controls">
            <button type="button" className="btn dpad-btn dpad-up" onClick={() => movePlayer(0, -1)}>▲</button>
            <button type="button" className="btn dpad-btn dpad-left" onClick={() => movePlayer(-1, 0)}>◀</button>
            <button type="button" className="btn dpad-btn dpad-right" onClick={() => movePlayer(1, 0)}>▶</button>
            <button type="button" className="btn dpad-btn dpad-down" onClick={() => movePlayer(0, 1)}>▼</button>
          </section>
        </>
      ) : null}
    </main>
  );
}
