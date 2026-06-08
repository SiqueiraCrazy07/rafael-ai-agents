import { PageHeader } from "../components/PageHeader.jsx";
import { StatusList } from "../components/StatusList.jsx";

export function ContentPage() {
  const content = ["FAQ bot","conversation history","admin prompts"].map((title, index) => ({ title, detail: "Content module " + (index + 1) + " generated from blueprint" }));
  return (
    <section>
      <PageHeader kicker="Content" title="Chatbot Platform Content" />
      <div className="card"><StatusList items={content} /></div>
    </section>
  );
}
