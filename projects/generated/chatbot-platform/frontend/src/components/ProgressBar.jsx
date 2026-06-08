export function ProgressBar({ label, value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div>
      <div className="page-header" style={{ marginBottom: 8 }}>
        <strong>{label}</strong>
        <span className="muted">{safeValue}%</span>
      </div>
      <div className="progress-track" aria-label={label}>
        <div className="progress-fill" style={{ width: safeValue + "%" }} />
      </div>
    </div>
  );
}
