import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function formatMs(value) {
    return `${(value / 1000).toFixed(2)}s`;
}
function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return value;
    return date.toLocaleString();
}
function groupRecords(records) {
    const grouped = new Map();
    for (const record of records) {
        const key = `${record.width} x ${record.height}`;
        const existing = grouped.get(key);
        if (!existing) {
            grouped.set(key, {
                key,
                width: record.width,
                height: record.height,
                bestMs: record.elapsedMs,
                maxPoints: record.points,
                tries: [record],
            });
            continue;
        }
        existing.bestMs = Math.min(existing.bestMs, record.elapsedMs);
        existing.maxPoints = Math.max(existing.maxPoints, record.points);
        existing.tries.push(record);
    }
    return [...grouped.values()]
        .sort((a, b) => a.width * a.height - b.width * b.height)
        .map((entry) => ({
        ...entry,
        tries: entry.tries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    }));
}
export function RecordsDashboard({ records }) {
    const grouped = groupRecords(records);
    return (_jsxs("section", { className: "panel records-panel", children: [_jsx("h2", { className: "records-title", children: "Play Dashboard" }), grouped.length === 0 ? (_jsx("p", { className: "records-empty", children: "No completed runs yet." })) : (_jsx("div", { className: "records-list", children: grouped.map((group) => (_jsxs("details", { className: "record-item", children: [_jsxs("summary", { children: [_jsx("span", { children: group.key }), _jsxs("span", { children: ["Best: ", formatMs(group.bestMs)] }), _jsxs("span", { children: ["Max points: ", group.maxPoints] }), _jsxs("span", { children: ["Tries: ", group.tries.length] })] }), _jsx("div", { className: "record-tries", children: group.tries.map((record) => (_jsxs("div", { className: "record-try", children: [_jsx("span", { children: formatDate(record.createdAt) }), _jsxs("span", { children: ["Time: ", formatMs(record.elapsedMs)] }), _jsxs("span", { children: ["Points: ", record.points] }), _jsx("span", { children: record.difficulty })] }, record.id))) })] }, group.key))) }))] }));
}
