import type { PlayRecord } from "../storage/persistence";

type RecordsDashboardProps = {
  records: PlayRecord[];
};

type Grouped = {
  key: string;
  width: number;
  height: number;
  bestMs: number;
  maxPoints: number;
  tries: PlayRecord[];
};

function formatMs(value: number): string {
  return `${(value / 1000).toFixed(2)}s`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function groupRecords(records: PlayRecord[]): Grouped[] {
  const grouped = new Map<string, Grouped>();

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

export function RecordsDashboard({ records }: RecordsDashboardProps): JSX.Element {
  const grouped = groupRecords(records);

  return (
    <section className="panel records-panel">
      <h2 className="records-title">Play Dashboard</h2>
      {grouped.length === 0 ? (
        <p className="records-empty">No completed runs yet.</p>
      ) : (
        <div className="records-list">
          {grouped.map((group) => (
            <details key={group.key} className="record-item">
              <summary>
                <span>{group.key}</span>
                <span>Best: {formatMs(group.bestMs)}</span>
                <span>Max points: {group.maxPoints}</span>
                <span>Tries: {group.tries.length}</span>
              </summary>
              <div className="record-tries">
                {group.tries.map((record) => (
                  <div className="record-try" key={record.id}>
                    <span>{formatDate(record.createdAt)}</span>
                    <span>Time: {formatMs(record.elapsedMs)}</span>
                    <span>Points: {record.points}</span>
                    <span>{record.difficulty}</span>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
