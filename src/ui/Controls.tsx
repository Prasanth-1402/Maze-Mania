import { useEffect, useState } from "react";
import type { Difficulty } from "../engine/types";

type ControlsProps = {
  width: number;
  height: number;
  difficulty: Difficulty;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onDifficultyChange: (value: Difficulty) => void;
  onCreateMaze: () => void;
  onGenerateRandom: () => void;
  onGenerateDaily: () => void;
};

export function Controls(props: ControlsProps): JSX.Element {
  const [widthInput, setWidthInput] = useState(String(props.width));
  const [heightInput, setHeightInput] = useState(String(props.height));

  useEffect(() => {
    setWidthInput(String(props.width));
  }, [props.width]);

  useEffect(() => {
    setHeightInput(String(props.height));
  }, [props.height]);

  function commitWidth(): void {
    const parsed = Number(widthInput);
    props.onWidthChange(Number.isFinite(parsed) ? parsed : props.width);
  }

  function commitHeight(): void {
    const parsed = Number(heightInput);
    props.onHeightChange(Number.isFinite(parsed) ? parsed : props.height);
  }

  return (
    <div className="controls">
      <label>
        <span>Width</span>
        <input
          type="number"
          min={5}
          max={25}
          value={widthInput}
          onChange={(event) => setWidthInput(event.target.value)}
          onBlur={commitWidth}
          onKeyDown={(event) => {
            if (event.key === "Enter") (event.currentTarget as HTMLInputElement).blur();
          }}
        />
      </label>
      <label>
        <span>Height</span>
        <input
          type="number"
          min={5}
          max={25}
          value={heightInput}
          onChange={(event) => setHeightInput(event.target.value)}
          onBlur={commitHeight}
          onKeyDown={(event) => {
            if (event.key === "Enter") (event.currentTarget as HTMLInputElement).blur();
          }}
        />
      </label>
      <label>
        <span>Difficulty</span>
        <select
          value={props.difficulty}
          onChange={(event) => props.onDifficultyChange(event.target.value as Difficulty)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </label>
      <button type="button" className="btn btn-muted btn-size-difficulty" onClick={props.onCreateMaze}>
        Create Maze
      </button>
      <button type="button" className="btn btn-outline" onClick={props.onGenerateDaily}>
        Daily Maze
      </button>
      <button type="button" className="btn btn-primary" onClick={props.onGenerateRandom}>
        Generate Random
      </button>
    </div>
  );
}
