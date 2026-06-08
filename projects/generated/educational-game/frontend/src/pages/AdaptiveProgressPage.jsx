import { PageHeader } from "../components/PageHeader.jsx";
import { MetricCard } from "../components/MetricCard.jsx";
import { ProgressBar } from "../components/ProgressBar.jsx";

export function AdaptiveProgressPage() {
  return (
    <section>
      <PageHeader kicker="Adaptive progress" title="Educational Game Mastery Map" />
      <div className="grid">
        <div className="span-4"><MetricCard title="Retention" value="84%" detail="stable recall" tone="success" /></div>
        <div className="span-4"><MetricCard title="Difficulty" value="Level 3" detail="adaptive pace" /></div>
        <div className="span-4"><MetricCard title="Weak skills" value="2" detail="review suggested" tone="warning" /></div>
        <div className="span-12 card"><ProgressBar label="Mastery readiness" value={76} /></div>
      </div>
    </section>
  );
}
