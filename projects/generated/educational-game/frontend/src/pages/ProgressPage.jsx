import { PageHeader } from "../components/PageHeader.jsx";
import { MetricCard } from "../components/MetricCard.jsx";
import { ProgressBar } from "../components/ProgressBar.jsx";

export function ProgressPage() {
  return (
    <section>
      <PageHeader kicker="Progress" title="Educational Game Progress" />
      <div className="grid">
        <div className="span-4"><MetricCard title="Completion" value="68%" detail="demo progress" /></div>
        <div className="span-4"><MetricCard title="Streak" value="5" detail="days active" tone="success" /></div>
        <div className="span-4"><MetricCard title="Reviews" value="3" detail="suggested today" tone="warning" /></div>
        <div className="span-12 card"><ProgressBar label="Prototype completion" value={68} /></div>
      </div>
    </section>
  );
}
