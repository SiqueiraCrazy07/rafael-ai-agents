export function ProgressTracker({ items = [] }) {
  return (
    <ol className="progress-tracker">
      {items.map((item) => <li key={item.id || item.label}>{item.label}</li>)}
    </ol>
  );
}
