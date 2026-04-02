import { pickRandomIndex } from "./prng";
export function defaultSizeForDifficulty(difficulty) {
    if (difficulty === "easy")
        return { width: 15, height: 10 };
    if (difficulty === "medium")
        return { width: 20, height: 14 };
    return { width: 25, height: 18 };
}
function countOpenPassages(cell) {
    let open = 0;
    if (!cell.walls.top)
        open += 1;
    if (!cell.walls.right)
        open += 1;
    if (!cell.walls.bottom)
        open += 1;
    if (!cell.walls.left)
        open += 1;
    return open;
}
function isDeadEnd(cell) {
    return countOpenPassages(cell) === 1;
}
function getIndex(x, y, width) {
    return y * width + x;
}
function removeWallBetween(a, b) {
    if (a.x === b.x) {
        if (a.y < b.y) {
            a.walls.bottom = false;
            b.walls.top = false;
        }
        else {
            a.walls.top = false;
            b.walls.bottom = false;
        }
        return;
    }
    if (a.x < b.x) {
        a.walls.right = false;
        b.walls.left = false;
    }
    else {
        a.walls.left = false;
        b.walls.right = false;
    }
}
function adjacentCells(cells, width, height, cell) {
    const neighbors = [];
    if (cell.y > 0)
        neighbors.push(cells[getIndex(cell.x, cell.y - 1, width)]);
    if (cell.x < width - 1)
        neighbors.push(cells[getIndex(cell.x + 1, cell.y, width)]);
    if (cell.y < height - 1)
        neighbors.push(cells[getIndex(cell.x, cell.y + 1, width)]);
    if (cell.x > 0)
        neighbors.push(cells[getIndex(cell.x - 1, cell.y, width)]);
    return neighbors;
}
function chooseClosedNeighbor(cells, width, height, cell, random) {
    const candidates = adjacentCells(cells, width, height, cell).filter((neighbor) => {
        if (neighbor.x === cell.x && neighbor.y === cell.y - 1)
            return cell.walls.top;
        if (neighbor.x === cell.x + 1 && neighbor.y === cell.y)
            return cell.walls.right;
        if (neighbor.x === cell.x && neighbor.y === cell.y + 1)
            return cell.walls.bottom;
        if (neighbor.x === cell.x - 1 && neighbor.y === cell.y)
            return cell.walls.left;
        return false;
    });
    if (candidates.length === 0)
        return undefined;
    return candidates[pickRandomIndex(candidates.length, random)];
}
export function pruneDeadEnds(cells, width, height, difficulty, random) {
    const pruneRatio = difficulty === "easy" ? 0.45 : difficulty === "medium" ? 0.2 : 0;
    if (pruneRatio <= 0)
        return;
    const deadEnds = cells.filter(isDeadEnd);
    const pruneCount = Math.floor(deadEnds.length * pruneRatio);
    for (let i = 0; i < pruneCount; i += 1) {
        const cell = deadEnds[pickRandomIndex(deadEnds.length, random)];
        if (!cell || !isDeadEnd(cell))
            continue;
        const neighbor = chooseClosedNeighbor(cells, width, height, cell, random);
        if (!neighbor)
            continue;
        removeWallBetween(cell, neighbor);
    }
}
export function pathLengthThreshold(difficulty, totalCells) {
    const ratio = difficulty === "easy" ? 0.18 : difficulty === "medium" ? 0.26 : 0.35;
    return Math.floor(totalCells * ratio);
}
