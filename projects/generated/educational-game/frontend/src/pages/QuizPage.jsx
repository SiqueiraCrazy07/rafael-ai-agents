import { PageHeader } from "../components/PageHeader.jsx";
import { QuizCard } from "../components/QuizCard.jsx";

export function QuizPage() {
  return (
    <section>
      <PageHeader kicker="Adaptive Quiz" title="Educational Game Quiz" />
      <QuizCard prompt="Choose the strongest next action for mastery." options={["Retry with hint", "Skip review", "Unlock all levels"]} answer="Retry with hint" />
    </section>
  );
}
