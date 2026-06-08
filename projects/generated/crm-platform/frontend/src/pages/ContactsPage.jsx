import { PageHeader } from "../components/PageHeader.jsx";
import { MetricCard } from "../components/MetricCard.jsx";
import { StatusList } from "../components/StatusList.jsx";

export function ContactsPage() {
  const contacts = [
    { title: "Ana Souza", detail: "Qualified lead - proposal sent" },
    { title: "Rafael Lima", detail: "Discovery call scheduled" },
    { title: "Marina Costa", detail: "Needs follow-up" }
  ];
  return (
    <section>
      <PageHeader kicker="CRM" title="Crm Platform Contacts" />
      <div className="grid">
        <div className="span-4"><MetricCard title="Pipeline" value="R$ 42k" detail="readonly forecast" /></div>
        <div className="span-4"><MetricCard title="Contacts" value="128" detail="demo records" /></div>
        <div className="span-4"><MetricCard title="Next actions" value="9" detail="follow-ups" tone="warning" /></div>
        <div className="span-12 card"><StatusList items={contacts} /></div>
      </div>
    </section>
  );
}
