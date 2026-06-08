import { PageHeader } from "../components/PageHeader.jsx";
import { StatusList } from "../components/StatusList.jsx";

export function TutorPage() {
  const flows = [
    { title: "Contextual correction", detail: "Explain the misconception and offer a similar retry." },
    { title: "Guided prompt", detail: "Ask one follow-up question before revealing an answer." },
    { title: "Progress coaching", detail: "Summarize weak areas and suggest the next skill." }
  ];
  return (
    <section>
      <PageHeader kicker="AI Tutor placeholder" title="Educational Game Tutor" />
      <div className="card"><StatusList items={flows} /></div>
    </section>
  );
}
