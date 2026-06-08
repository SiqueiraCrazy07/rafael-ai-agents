export function MetricCard({ title, value, detail, tone = "neutral" }) {
  return (
    <article className="card metric">
      <span className="muted">{title}</span>
      <strong className="metric-value">{value}</strong>
      <span className={tone === "success" ? "status-success" : tone === "warning" ? "status-warning" : "muted"}>{detail}</span>
    </article>
  );
}
