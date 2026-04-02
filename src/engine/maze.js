import { createSeededRandom, pickRandomIndex } from "./prng";
import { pathLengthThreshold, pruneDeadEnds } from "./difficulty";
import { shortestPathLength } from "./solver";
function indexOf(x, y, width) {
    return y * width + x;
}
function createGrid(width, height) {
    const cells = [];
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            cells.push({
                x,
                y,
                visited: false,
                walls: { top: true, right: true, bottom: true, left: true },
            });
        }
    }
    return cells;
}
function unvisitedNeighbors(cells, width, height, cell) {
    const neighbors = [];
    if (cell.y > 0) {
        const top = cells[indexOf(cell.x, cell.y - 1, width)];
        if (!top.visited)
            neighbors.push(top);
    }
    if (cell.x < width - 1) {
        const right = cells[indexOf(cell.x + 1, cell.y, width)];
        if (!right.visited)
            neighbors.push(right);
    }
    if (cell.y < height - 1) {
        const bottom = cells[indexOf(cell.x, cell.y + 1, width)];
        if (!bottom.visited)
            neighbors.push(bottom);
    }
    if (cell.x > 0) {
        const left = cells[indexOf(cell.x - 1, cell.y, width)];
        if (!left.visited)
            neighbors.push(left);
    }
    return neighbors;
}
function carveBetween(current, next) {
    if (current.x === next.x) {
        if (current.y > next.y) {
            current.walls.top = false;
            next.walls.bottom = false;
        }
        else {
            current.walls.bottom = false;
            next.walls.top = false;
        }
        return;
    }
    if (current.x > next.x) {
        current.walls.left = false;
        next.walls.right = false;
    }
    else {
        current.walls.right = false;
        next.walls.left = false;
    }
}
function runDfsCarve(cells, width, height, seed) {
    const random = createSeededRandom(seed);
    const stack = [];
    const start = cells[0];
    start.visited = true;
    stack.push(start);
    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors = unvisitedNeighbors(cells, width, height, current);
        if (neighbors.length === 0) {
            stack.pop();
            continue;
        }
        const next = neighbors[pickRandomIndex(neighbors.length, random)];
        carveBetween(current, next);
        next.visited = true;
        stack.push(next);
    }
}
function resetVisited(cells) {
    for (const cell of cells) {
        cell.visited = false;
    }
}
function buildMazeOnce(settings) {
    const startedAt = performance.now();
    const cells = createGrid(settings.width, settings.height);
    runDfsCarve(cells, settings.width, settings.height, settings.seed);
    const random = createSeededRandom(`${settings.seed}:prune:${settings.difficulty}`);
    pruneDeadEnds(cells, settings.width, settings.height, settings.difficulty, random);
    resetVisited(cells);
    const mazeBase = {
        width: settings.width,
        height: settings.height,
        cells,
        seed: settings.seed,
        difficulty: settings.difficulty,
        generationMs: performance.now() - startedAt,
    };
    const pathLength = shortestPathLength({ ...mazeBase, shortestPathLength: -1 }, { x: 0, y: 0 }, { x: settings.width - 1, y: settings.height - 1 });
    return { ...mazeBase, shortestPathLength: pathLength };
}
export function generateMaze(settings) {
    const threshold = pathLengthThreshold(settings.difficulty, settings.width * settings.height);
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const seededSettings = {
            ...settings,
            seed: attempt === 0 ? settings.seed : `${settings.seed}-retry-${attempt}`,
        };
        const maze = buildMazeOnce(seededSettings);
        if (maze.shortestPathLength >= threshold || settings.difficulty === "easy") {
            return maze;
        }
    }
    return buildMazeOnce(settings);
}
