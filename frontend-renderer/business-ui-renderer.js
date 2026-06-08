class BusinessUiRenderer {
  files(productName, projectSlug) {
    const files = {};

    if (projectSlug.includes("crm")) {
      files["ContactsPage.jsx"] = `import { PageHeader } from "../components/PageHeader.jsx";
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
      <PageHeader kicker="CRM" title="${productName} Contacts" />
      <div className="grid">
        <div className="span-4"><MetricCard title="Pipeline" value="R$ 42k" detail="readonly forecast" /></div>
        <div className="span-4"><MetricCard title="Contacts" value="128" detail="demo records" /></div>
        <div className="span-4"><MetricCard title="Next actions" value="9" detail="follow-ups" tone="warning" /></div>
        <div className="span-12 card"><StatusList items={contacts} /></div>
      </div>
    </section>
  );
}
`;
    }

    if (projectSlug.includes("chatbot")) {
      files["ConversationsPage.jsx"] = `import { PageHeader } from "../components/PageHeader.jsx";
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
      <PageHeader kicker="Chatbot" title="${productName} Conversations" />
      <div className="grid">
        <div className="span-4"><MetricCard title="Open chats" value="18" detail="readonly demo" /></div>
        <div className="span-4"><MetricCard title="Resolved" value="73%" detail="simulated rate" tone="success" /></div>
        <div className="span-4"><MetricCard title="Escalations" value="4" detail="human review" tone="warning" /></div>
        <div className="span-12 card"><StatusList items={conversations} /></div>
      </div>
    </section>
  );
}
`;
    }

    return files;
  }
}

module.exports = { BusinessUiRenderer };
