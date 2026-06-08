import { PageHeader } from "../components/PageHeader.jsx";
import { StatusList } from "../components/StatusList.jsx";

export function ContentPage() {
  const content = ["contact list","deal stages","activity log","basic dashboard"].map((title, index) => ({ title, detail: "Content module " + (index + 1) + " generated from blueprint" }));
  return (
    <section>
      <PageHeader kicker="Content" title="Crm Platform Content" />
      <div className="card"><StatusList items={content} /></div>
    </section>
  );
}
