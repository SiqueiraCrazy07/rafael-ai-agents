import { PageHeader } from "../components/PageHeader.jsx";
import { StatusList } from "../components/StatusList.jsx";

export function ReviewPage() {
  const items = [
    { title: "Spaced review", detail: "Review weak items scheduled for today." },
    { title: "Interleaving", detail: "Mix previous concepts before the next lesson." },
    { title: "Mastery gate", detail: "Advance after consistent recall." }
  ];
  return (
    <section>
      <PageHeader kicker="Retention" title="English Learning Platform Review" />
      <StatusList items={items} />
    </section>
  );
}
