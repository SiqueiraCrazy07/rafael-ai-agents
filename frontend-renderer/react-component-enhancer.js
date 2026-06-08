class ReactComponentEnhancer {
  files() {
    return {
      "PrototypeShell.jsx": `export function PrototypeShell({ productName, navigation, currentPath, onNavigate, children }) {
  return (
    <div className="app-shell">
      <nav className="app-nav" aria-label="Product navigation">
        <div className="brand">
          <strong>{productName}</strong>
          <span>Readonly prototype renderer</span>
        </div>
        {navigation.map((item) => (
          <button
            className={currentPath === item.path ? "nav-link active" : "nav-link"}
            key={item.path}
            type="button"
            onClick={() => onNavigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <main className="app-main">{children}</main>
    </div>
  );
}
`,
      "PageHeader.jsx": `export function PageHeader({ kicker, title, action }) {
  return (
    <header className="page-header">
      <div>
        <p className="page-kicker">{kicker}</p>
        <h1 className="page-title">{title}</h1>
      </div>
      {action ? <div>{action}</div> : null}
    </header>
  );
}
`,
      "MetricCard.jsx": `export function MetricCard({ title, value, detail, tone = "neutral" }) {
  return (
    <article className="card metric">
      <span className="muted">{title}</span>
      <strong className="metric-value">{value}</strong>
      <span className={tone === "success" ? "status-success" : tone === "warning" ? "status-warning" : "muted"}>{detail}</span>
    </article>
  );
}
`,
      "ProgressBar.jsx": `export function ProgressBar({ label, value }) {
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
`,
      "GamifiedHud.jsx": `import { ProgressBar } from "./ProgressBar.jsx";

export function GamifiedHud({ xp = 72, streak = 5, level = 3, mission = "Complete today's practice" }) {
  return (
    <section className="card">
      <div className="hud">
        <div className="hud-item"><strong>Level</strong><p>{level}</p></div>
        <div className="hud-item"><strong>XP</strong><p>{xp}/100</p></div>
        <div className="hud-item"><strong>Streak</strong><p>{streak} days</p></div>
        <div className="hud-item"><strong>Mission</strong><p>{mission}</p></div>
      </div>
      <ProgressBar label="Mission progress" value={xp} />
    </section>
  );
}
`,
      "MissionCard.jsx": `export function MissionCard({ title, criteria, reward, status = "active" }) {
  return (
    <article className="list-item">
      <strong>{title}</strong>
      <p className="muted">{criteria}</p>
      <span className={status === "complete" ? "status-success" : "pill"}>{reward}</span>
    </article>
  );
}
`,
      "QuizCard.jsx": `export function QuizCard({ prompt, options = [], answer }) {
  return (
    <article className="card">
      <h2>{prompt}</h2>
      <div className="list">
        {options.map((option) => (
          <button className="button secondary" key={option} type="button">{option}</button>
        ))}
      </div>
      <p className="muted">Answer key: {answer}</p>
    </article>
  );
}
`,
      "StatusList.jsx": `export function StatusList({ items = [] }) {
  return (
    <div className="list">
      {items.map((item) => (
        <article className="list-item" key={item.title}>
          <strong>{item.title}</strong>
          <p className="muted">{item.detail}</p>
        </article>
      ))}
    </div>
  );
}
`
    };
  }
}

module.exports = { ReactComponentEnhancer };
