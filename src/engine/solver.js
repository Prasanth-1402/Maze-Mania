function getIndex(x, y, width) {
    return y * width + x;
}
function getNeighbors(maze, position) {
    const { x, y } = position;
    const cell = maze.cells[getIndex(x, y, maze.width)];
    const neighbors = [];
    if (!cell.walls.top && y > 0)
        neighbors.push({ x, y: y - 1 });
    if (!cell.walls.right && x < maze.width - 1)
        neighbors.push({ x: x + 1, y });
    if (!cell.walls.bottom && y < maze.height - 1)
        neighbors.push({ x, y: y + 1 });
    if (!cell.walls.left && x > 0)
        neighbors.push({ x: x - 1, y });
    return neighbors;
}
export function shortestPathLength(maze, start, end) {
    const total = maze.width * maze.height;
    const distances = new Array(total).fill(-1);
    const queue = [start];
    distances[getIndex(start.x, start.y, maze.width)] = 0;
    for (let i = 0; i < queue.length; i += 1) {
        const current = queue[i];
        const currentDistance = distances[getIndex(current.x, current.y, maze.width)];
        if (current.x === end.x && current.y === end.y) {
            return currentDistance;
        }
        const neighbors = getNeighbors(maze, current);
        for (const neighbor of neighbors) {
            const index = getIndex(neighbor.x, neighbor.y, maze.width);
            if (distances[index] !== -1)
                continue;
            distances[index] = currentDistance + 1;
            queue.push(neighbor);
        }
    }
    return -1;
}
export function canMove(maze, position, dx, dy) {
    const nx = position.x + dx;
    const ny = position.y + dy;
    if (nx < 0 || ny < 0 || nx >= maze.width || ny >= maze.height)
        return false;
    const cell = maze.cells[getIndex(position.x, position.y, maze.width)];
    if (dx === 1 && cell.walls.right)
        return false;
    if (dx === -1 && cell.walls.left)
        return false;
    if (dy === 1 && cell.walls.bottom)
        return false;
    if (dy === -1 && cell.walls.top)
        return false;
    return true;
}
