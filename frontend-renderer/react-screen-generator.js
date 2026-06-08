class ReactScreenGenerator {
  files(project, routes) {
    const productName = project.productName;
    const hasMissions = routes.some((route) => route.component === "MissionsPage");
    const hasConversation = routes.some((route) => route.component === "ConversationsPage");
    const hasContacts = routes.some((route) => route.component === "ContactsPage");
    const features = JSON.stringify(project.mvpFeatures.length ? project.mvpFeatures : ["Prototype dashboard", "Readonly API", "Analytics snapshot"]);

    return {
      "DashboardPage.jsx": `import { PageHeader } from "../components/PageHeader.jsx";
import { MetricCard } from "../components/MetricCard.jsx";
import { GamifiedHud } from "../components/GamifiedHud.jsx";
import { StatusList } from "../components/StatusList.jsx";

export function DashboardPage() {
  const features = ${features}.map((title) => ({ title, detail: "Generated MVP surface" }));
  return (
    <section>
      <PageHeader kicker="Prototype dashboard" title="${productName}" action={<button className="button" type="button">Readonly preview</button>} />
      <div className="grid">
        <div className="span-3"><MetricCard title="Readiness" value="V1" detail="rendered prototype" tone="success" /></div>
        <div className="span-3"><MetricCard title="Routes" value="${routes.length}" detail="functional hash nav" /></div>
        <div className="span-3"><MetricCard title="Tokens" value="Applied" detail="visual-ui source" /></div>
        <div className="span-3"><MetricCard title="Fallback" value="JSON" detail="preserved" /></div>
        <div className="span-12"><GamifiedHud xp={72} streak={5} level={3} mission="Complete prototype walkthrough" /></div>
        <div className="span-12 card"><h2>MVP surfaces</h2><StatusList items={features} /></div>
      </div>
    </section>
  );
}
`,
      "LoginPage.jsx": `import { PageHeader } from "../components/PageHeader.jsx";

export function LoginPage() {
  return (
    <section>
      <PageHeader kicker="Readonly auth" title="${productName} Login" />
      <form className="card login-panel">
        <div className="field"><label>Email</label><input value="demo@example.com" readOnly /></div>
        <div className="field"><label>Password</label><input value="readonly-demo" readOnly type="password" /></div>
        <button className="button" type="button">Enter prototype</button>
        <p className="muted">Authentication is a non-destructive placeholder in V1.</p>
      </form>
    </section>
  );
}
`,
      "ProgressPage.jsx": `import { PageHeader } from "../components/PageHeader.jsx";
import { MetricCard } from "../components/MetricCard.jsx";
import { ProgressBar } from "../components/ProgressBar.jsx";

export function ProgressPage() {
  return (
    <section>
      <PageHeader kicker="Progress" title="${productName} Progress" />
      <div className="grid">
        <div className="span-4"><MetricCard title="Completion" value="68%" detail="demo progress" /></div>
        <div className="span-4"><MetricCard title="Streak" value="5" detail="days active" tone="success" /></div>
        <div className="span-4"><MetricCard title="Reviews" value="3" detail="suggested today" tone="warning" /></div>
        <div className="span-12 card"><ProgressBar label="Prototype completion" value={68} /></div>
      </div>
    </section>
  );
}
`,
      "ContentPage.jsx": `import { PageHeader } from "../components/PageHeader.jsx";
import { StatusList } from "../components/StatusList.jsx";

export function ContentPage() {
  const content = ${features}.map((title, index) => ({ title, detail: "Content module " + (index + 1) + " generated from blueprint" }));
  return (
    <section>
      <PageHeader kicker="Content" title="${productName} Content" />
      <div className="card"><StatusList items={content} /></div>
    </section>
  );
}
`,
      ...(hasMissions ? {} : {
        "MissionsPage.jsx": `import { PageHeader } from "../components/PageHeader.jsx";
import { MissionCard } from "../components/MissionCard.jsx";

export function MissionsPage() {
  return (
    <section>
      <PageHeader kicker="Missions" title="${productName} Missions" />
      <MissionCard title="Prototype mission" criteria="Complete the primary flow" reward="20 XP" />
    </section>
  );
}
`
      }),
      ...(hasContacts ? {} : {
        "ContactsPage.jsx": `import { PageHeader } from "../components/PageHeader.jsx";

export function ContactsPage() {
  return <section><PageHeader kicker="Contacts" title="${productName} Contacts" /><div className="card">No CRM contacts required for this product.</div></section>;
}
`
      }),
      ...(hasConversation ? {} : {
        "ConversationsPage.jsx": `import { PageHeader } from "../components/PageHeader.jsx";

export function ConversationsPage() {
  return <section><PageHeader kicker="Conversations" title="${productName} Conversations" /><div className="card">Conversation surface available as readonly placeholder.</div></section>;
}
`
      })
    };
  }
}

module.exports = { ReactScreenGenerator };
