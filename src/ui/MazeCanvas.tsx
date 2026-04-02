import { useEffect, useMemo, useRef, useState } from "react";
import type { Maze, Position } from "../engine/types";
import type { ThemeMode } from "../storage/persistence";

type MazeCanvasProps = {
  maze: Maze;
  player: Position;
  end: Position;
  theme: ThemeMode;
};

export function MazeCanvas({ maze, player, end, theme }: MazeCanvasProps): JSX.Element {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const displayPosRef = useRef<Position>(player);
  const targetPosRef = useRef<Position>(player);
  const alienRef = useRef<CanvasImageSource | null>(null);
  const homeRef = useRef<CanvasImageSource | null>(null);
  const [alienLoaded, setAlienLoaded] = useState(false);
  const [homeLoaded, setHomeLoaded] = useState(false);
  const [viewport, setViewport] = useState({ width: 900, height: 620 });

  const cellSize = useMemo(() => {
    const horizontalPadding = 8;
    const verticalPadding = 8;
    const maxWidth = Math.max(120, viewport.width - horizontalPadding * 2);
    const maxHeight = Math.max(120, viewport.height - verticalPadding * 2);
    return Math.max(8, Math.floor(Math.min(maxWidth / maze.width, maxHeight / maze.height)));
  }, [maze.width, maze.height, viewport.height, viewport.width]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const update = (): void => {
      setViewport({
        width: wrapper.clientWidth,
        height: wrapper.clientHeight,
      });
    };

    update();
    const observer = new ResizeObserver(() => update());
    observer.observe(wrapper);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const trimWhiteBounds = (image: HTMLImageElement): HTMLCanvasElement => {
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = image.naturalWidth;
      sourceCanvas.height = image.naturalHeight;
      const sourceCtx = sourceCanvas.getContext("2d");
      if (!sourceCtx) return sourceCanvas;

      sourceCtx.drawImage(image, 0, 0);
      const { data, width, height } = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);

      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          const isWhitePixel = r > 245 && g > 245 && b > 245;
          if (a > 10 && !isWhitePixel) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (maxX < minX || maxY < minY) return sourceCanvas;

      const cropW = maxX - minX + 1;
      const cropH = maxY - minY + 1;
      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = cropW;
      croppedCanvas.height = cropH;
      const croppedCtx = croppedCanvas.getContext("2d");
      if (!croppedCtx) return sourceCanvas;

      croppedCtx.drawImage(sourceCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
      return croppedCanvas;
    };

    const loadSprite = (
      rawUrl: string,
      assign: (sprite: CanvasImageSource) => void,
      setLoaded: (loaded: boolean) => void,
      attempt = 0
    ): void => {
      const image = new Image();
      image.onload = () => {
        if (cancelled) return;
        assign(trimWhiteBounds(image));
        setLoaded(true);
      };
      image.onerror = () => {
        if (cancelled) return;
        if (attempt < 2) {
          window.setTimeout(() => loadSprite(rawUrl, assign, setLoaded, attempt + 1), 180);
          return;
        }
        setLoaded(false);
      };
      const bust = attempt > 0 ? `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}retry=${attempt}` : rawUrl;
      image.src = bust;
    };

    loadSprite(
      new URL("../../images/alien.png", import.meta.url).href,
      (sprite) => {
        alienRef.current = sprite;
      },
      setAlienLoaded
    );

    loadSprite(
      new URL("../../images/home.png", import.meta.url).href,
      (sprite) => {
        homeRef.current = sprite;
      },
      setHomeLoaded
    );

    return () => {
      cancelled = true;
    };
  }, []);

  function drawScene(position: Position): void {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = maze.width * cellSize + 1;
    const height = maze.height * cellSize + 1;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const palette =
      theme === "dark"
        ? {
          bg: "#101723",
          wall: "#d2dde9",
          end: "#f97316",
        }
        : {
          bg: "#f7fafc",
          wall: "#213046",
          end: "#ef4444",
        };

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = palette.wall;
    ctx.lineWidth = 2;

    for (const cell of maze.cells) {
      const x = cell.x * cellSize;
      const y = cell.y * cellSize;
      if (cell.walls.top) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + cellSize, y);
        ctx.stroke();
      }
      if (cell.walls.right) {
        ctx.beginPath();
        ctx.moveTo(x + cellSize, y);
        ctx.lineTo(x + cellSize, y + cellSize);
        ctx.stroke();
      }
      if (cell.walls.bottom) {
        ctx.beginPath();
        ctx.moveTo(x, y + cellSize);
        ctx.lineTo(x + cellSize, y + cellSize);
        ctx.stroke();
      }
      if (cell.walls.left) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + cellSize);
        ctx.stroke();
      }
    }

    const inset = Math.max(3, Math.floor(cellSize * 0.2));
    const endCenterX = end.x * cellSize + cellSize / 2;
    const endCenterY = end.y * cellSize + cellSize / 2;
    const homeSize = Math.max(12, Math.floor(cellSize * 0.84));
    if (homeLoaded && homeRef.current) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(homeRef.current, endCenterX - homeSize / 2, endCenterY - homeSize / 2, homeSize, homeSize);
    } else {
      ctx.fillStyle = palette.end;
      ctx.fillRect(end.x * cellSize + inset, end.y * cellSize + inset, cellSize - inset * 2, cellSize - inset * 2);
    }

    const centerX = position.x * cellSize + cellSize / 2;
    const centerY = position.y * cellSize + cellSize / 2;
    const spriteSize = Math.max(12, Math.floor(cellSize * 0.82));

    if (alienLoaded && alienRef.current) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(alienRef.current, centerX - spriteSize / 2, centerY - spriteSize / 2, spriteSize, spriteSize);
    }
  }

  useEffect(() => {
    displayPosRef.current = player;
    targetPosRef.current = player;
    drawScene(player);
  }, [maze, theme, cellSize, alienLoaded, homeLoaded]);

  useEffect(() => {
    targetPosRef.current = player;

    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    const animate = (): void => {
      const current = displayPosRef.current;
      const target = targetPosRef.current;
      const dx = target.x - current.x;
      const dy = target.y - current.y;

      if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
        displayPosRef.current = target;
        drawScene(target);
        animationRef.current = null;
        return;
      }

      const next = {
        x: current.x + dx * 0.24,
        y: current.y + dy * 0.24,
      };
      displayPosRef.current = next;
      drawScene(next);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [player]);

  return (
    <div className="maze-wrap" ref={wrapperRef}>
      <canvas ref={canvasRef} aria-label="Maze canvas" />
    </div>
  );
}
