import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { defaultSizeForDifficulty } from "./engine/difficulty";
import { generateMaze } from "./engine/maze";
import { canMove } from "./engine/solver";
import { getLastSettings, getPlayRecords, getThemePreference, pointsForRun, randomSeed, saveBestTime, saveLastSettings, savePlayRecord, saveThemePreference, todaySeed, } from "./storage/persistence";
import { Controls } from "./ui/Controls";
import { MazeCanvas } from "./ui/MazeCanvas";
import { RecordsDashboard } from "./ui/RecordsDashboard";
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function formatMs(value) {
    if (value === null)
        return "-";
    return `${(value / 1000).toFixed(2)}s`;
}
const startPos = { x: 0, y: 0 };
function moveFromKey(key) {
    if (key === "ArrowUp")
        return { x: 0, y: -1 };
    if (key === "ArrowRight")
        return { x: 1, y: 0 };
    if (key === "ArrowDown")
        return { x: 0, y: 1 };
    if (key === "ArrowLeft")
        return { x: -1, y: 0 };
    return null;
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function App() {
    const persisted = getLastSettings();
    const defaultDifficulty = persisted?.difficulty ?? "medium";
    const fallbackSize = defaultSizeForDifficulty(defaultDifficulty);
    const initialSeed = todaySeed();
    const [difficulty, setDifficulty] = useState(defaultDifficulty);
    const [width, setWidth] = useState(clamp(persisted?.width ?? fallbackSize.width, 5, 25));
    const [height, setHeight] = useState(clamp(persisted?.height ?? fallbackSize.height, 5, 25));
    const [theme, setTheme] = useState(() => getThemePreference());
    const [maze, setMaze] = useState(() => generateMaze({
        width: persisted?.width ?? fallbackSize.width,
        height: persisted?.height ?? fallbackSize.height,
        seed: initialSeed,
        difficulty: defaultDifficulty,
    }));
    const [player, setPlayer] = useState(startPos);
    const [startedAt, setStartedAt] = useState(null);
    const [elapsedMs, setElapsedMs] = useState(0);
    const [won, setWon] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [showGameplay, setShowGameplay] = useState(false);
    const [records, setRecords] = useState(() => getPlayRecords());
    const celebrationTimerRef = useRef(null);
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
        if (!startedAt || won)
            return;
        const id = window.setInterval(() => {
            setElapsedMs(performance.now() - startedAt);
        }, 100);
        return () => window.clearInterval(id);
    }, [startedAt, won]);
    function resetRun() {
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
    function regenerateMaze(nextWidth, nextHeight, nextDifficulty = difficulty, revealGameplay = false) {
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
    function onGenerateRandom() {
        const difficulties = ["easy", "medium", "hard"];
        const nextDifficulty = difficulties[randomInt(0, difficulties.length - 1)];
        const nextWidth = randomInt(5, 25);
        const nextHeight = randomInt(5, 25);
        regenerateMaze(nextWidth, nextHeight, nextDifficulty, false);
    }
    function onCreateMaze() {
        regenerateMaze(width, height, difficulty, true);
    }
    function onWidthCommit(value) {
        const nextWidth = clamp(value || 5, 5, 25);
        if (nextWidth === width)
            return;
        regenerateMaze(nextWidth, height);
    }
    function onHeightCommit(value) {
        const nextHeight = clamp(value || 5, 5, 25);
        if (nextHeight === height)
            return;
        regenerateMaze(width, nextHeight);
    }
    function movePlayer(dx, dy) {
        setPlayer((current) => {
            if (won)
                return current;
            if (!canMove(maze, current, dx, dy))
                return current;
            if (!startedAt)
                setStartedAt(performance.now());
            const next = { x: current.x + dx, y: current.y + dy };
            if (next.x === end.x && next.y === end.y) {
                if (recordedWinRef.current)
                    return next;
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
        const onKeyDown = (event) => {
            const delta = moveFromKey(event.key);
            if (!delta)
                return;
            event.preventDefault();
            movePlayer(delta.x, delta.y);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [maze, startedAt, end.x, end.y]);
    useEffect(() => {
        return () => {
            if (celebrationTimerRef.current !== null)
                window.clearTimeout(celebrationTimerRef.current);
        };
    }, []);
    const gameVisible = showGameplay && !won && !showCelebration;
    const timerDisplay = startedAt === null ? "--" : formatMs(elapsedMs);
    return (_jsxs("main", { className: `app ${gameVisible ? "app-playing" : ""}`, children: [_jsx("button", { type: "button", className: "btn btn-theme btn-theme-corner", onClick: () => setTheme((current) => (current === "light" ? "dark" : "light")), children: theme === "light" ? "Dark" : "Light" }), !gameVisible ? (_jsx("header", { className: "app-header", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Deterministic Maze Engine" }), _jsx("h1", { children: "Maze Mania" })] }) })) : null, !gameVisible ? _jsx(RecordsDashboard, { records: records }) : null, !gameVisible ? (_jsx("section", { className: "panel controls-panel", children: _jsx(Controls, { width: width, height: height, difficulty: difficulty, onWidthChange: onWidthCommit, onHeightChange: onHeightCommit, onDifficultyChange: (value) => setDifficulty(value), onCreateMaze: onCreateMaze, onGenerateRandom: onGenerateRandom }) })) : null, gameVisible ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "panel play-timer", children: ["Timer: ", timerDisplay] }), _jsx("section", { className: "panel maze-panel", children: _jsx(MazeCanvas, { maze: maze, player: player, end: end, theme: theme }) }), _jsxs("section", { className: "dpad", "aria-label": "Movement controls", children: [_jsx("button", { type: "button", className: "btn dpad-btn dpad-up", onClick: () => movePlayer(0, -1), children: "\u25B2" }), _jsx("button", { type: "button", className: "btn dpad-btn dpad-left", onClick: () => movePlayer(-1, 0), children: "\u25C0" }), _jsx("button", { type: "button", className: "btn dpad-btn dpad-right", onClick: () => movePlayer(1, 0), children: "\u25B6" }), _jsx("button", { type: "button", className: "btn dpad-btn dpad-down", onClick: () => movePlayer(0, 1), children: "\u25BC" })] })] })) : null] }));
}
