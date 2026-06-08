export function MissionCard({ title, criteria, reward, status = "active" }) {
  return (
    <article className="list-item">
      <strong>{title}</strong>
      <p className="muted">{criteria}</p>
      <span className={status === "complete" ? "status-success" : "pill"}>{reward}</span>
    </article>
  );
}
