import { PageHeader } from "../components/PageHeader.jsx";
import { MetricCard } from "../components/MetricCard.jsx";
import { StatusList } from "../components/StatusList.jsx";

export function ConversationsPage() {
  const conversations = [
    { title: "Support triage", detail: "Waiting for user confirmation" },
    { title: "Lead qualification", detail: "Captured budget and timeline" },
    { title: "FAQ automation", detail: "Resolved with knowledge base answer" }
  ];
  return (
    <section>
      <PageHeader kicker="Chatbot" title="Chatbot Platform Conversations" />
      <div className="grid">
        <div className="span-4"><MetricCard title="Open chats" value="18" detail="readonly demo" /></div>
        <div className="span-4"><MetricCard title="Resolved" value="73%" detail="simulated rate" tone="success" /></div>
        <div className="span-4"><MetricCard title="Escalations" value="4" detail="human review" tone="warning" /></div>
        <div className="span-12 card"><StatusList items={conversations} /></div>
      </div>
    </section>
  );
}
