import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
export function Controls(props) {
    const [widthInput, setWidthInput] = useState(String(props.width));
    const [heightInput, setHeightInput] = useState(String(props.height));
    useEffect(() => {
        setWidthInput(String(props.width));
    }, [props.width]);
    useEffect(() => {
        setHeightInput(String(props.height));
    }, [props.height]);
    function commitWidth() {
        const parsed = Number(widthInput);
        props.onWidthChange(Number.isFinite(parsed) ? parsed : props.width);
    }
    function commitHeight() {
        const parsed = Number(heightInput);
        props.onHeightChange(Number.isFinite(parsed) ? parsed : props.height);
    }
    return (_jsxs("div", { className: "controls", children: [_jsxs("label", { children: [_jsx("span", { children: "Width" }), _jsx("input", { type: "number", min: 5, max: 25, value: widthInput, onChange: (event) => setWidthInput(event.target.value), onBlur: commitWidth, onKeyDown: (event) => {
                            if (event.key === "Enter")
                                event.currentTarget.blur();
                        } })] }), _jsxs("label", { children: [_jsx("span", { children: "Height" }), _jsx("input", { type: "number", min: 5, max: 25, value: heightInput, onChange: (event) => setHeightInput(event.target.value), onBlur: commitHeight, onKeyDown: (event) => {
                            if (event.key === "Enter")
                                event.currentTarget.blur();
                        } })] }), _jsxs("label", { children: [_jsx("span", { children: "Difficulty" }), _jsxs("select", { value: props.difficulty, onChange: (event) => props.onDifficultyChange(event.target.value), children: [_jsx("option", { value: "easy", children: "Easy" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "hard", children: "Hard" })] })] }), _jsx("button", { type: "button", className: "btn btn-muted btn-size-difficulty", onClick: props.onCreateMaze, children: "Create Maze" }), _jsx("button", { type: "button", className: "btn btn-outline", onClick: props.onGenerateDaily, children: "Daily Maze" }), _jsx("button", { type: "button", className: "btn btn-primary", onClick: props.onGenerateRandom, children: "Generate Random" })] }));
}
