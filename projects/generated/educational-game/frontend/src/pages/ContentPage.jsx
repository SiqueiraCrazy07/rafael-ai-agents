import { PageHeader } from "../components/PageHeader.jsx";
import { StatusList } from "../components/StatusList.jsx";

export function ContentPage() {
  const content = ["core mechanic","3 levels","score feedback","learning summary"].map((title, index) => ({ title, detail: "Content module " + (index + 1) + " generated from blueprint" }));
  return (
    <section>
      <PageHeader kicker="Content" title="Educational Game Content" />
      <div className="card"><StatusList items={content} /></div>
    </section>
  );
}
