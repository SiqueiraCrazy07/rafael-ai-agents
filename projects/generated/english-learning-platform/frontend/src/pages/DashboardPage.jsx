import { PageHeader } from "../components/PageHeader.jsx";
import { MetricCard } from "../components/MetricCard.jsx";
import { GamifiedHud } from "../components/GamifiedHud.jsx";
import { StatusList } from "../components/StatusList.jsx";

export function DashboardPage() {
  const features = ["diagnostic quiz","daily micro-lessons","vocabulary review","learner dashboard"].map((title) => ({ title, detail: "Generated MVP surface" }));
  return (
    <section>
      <PageHeader kicker="Prototype dashboard" title="English Learning Platform" action={<button className="button" type="button">Readonly preview</button>} />
      <div className="grid">
        <div className="span-3"><MetricCard title="Readiness" value="V1" detail="rendered prototype" tone="success" /></div>
        <div className="span-3"><MetricCard title="Routes" value="9" detail="functional hash nav" /></div>
        <div className="span-3"><MetricCard title="Tokens" value="Applied" detail="visual-ui source" /></div>
        <div className="span-3"><MetricCard title="Fallback" value="JSON" detail="preserved" /></div>
        <div className="span-12"><GamifiedHud xp={72} streak={5} level={3} mission="Complete prototype walkthrough" /></div>
        <div className="span-12 card"><h2>MVP surfaces</h2><StatusList items={features} /></div>
      </div>
    </section>
  );
}
