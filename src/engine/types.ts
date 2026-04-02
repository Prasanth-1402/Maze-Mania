export type Difficulty = "easy" | "medium" | "hard";

export type Walls = {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
};

export type Cell = {
  x: number;
  y: number;
  walls: Walls;
  visited: boolean;
};

export type Maze = {
  width: number;
  height: number;
  cells: Cell[];
  seed: string;
  difficulty: Difficulty;
  generationMs: number;
  shortestPathLength: number;
};

export type Position = {
  x: number;
  y: number;
};

export type MazeSettings = {
  width: number;
  height: number;
  seed: string;
  difficulty: Difficulty;
};
