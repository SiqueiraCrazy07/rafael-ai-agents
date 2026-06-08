class LearningUiRenderer {
  files(productName) {
    return {
      "LessonPage.jsx": `import { PageHeader } from "../components/PageHeader.jsx";
import { GamifiedHud } from "../components/GamifiedHud.jsx";
import { ProgressBar } from "../components/ProgressBar.jsx";

export function LessonPage() {
  return (
    <section>
      <PageHeader kicker="Learning UI" title="${productName} Lesson" />
      <div className="grid">
        <div className="span-8 card">
          <h2>Micro lesson</h2>
          <p>Practice a focused concept, answer one recall prompt and unlock the next checkpoint after mastery.</p>
          <ProgressBar label="Lesson mastery" value={64} />
        </div>
        <div className="span-4"><GamifiedHud xp={64} streak={5} level={3} mission="Complete lesson recall" /></div>
      </div>
    </section>
  );
}
`,
      "ReviewPage.jsx": `import { PageHeader } from "../components/PageHeader.jsx";
import { StatusList } from "../components/StatusList.jsx";

export function ReviewPage() {
  const items = [
    { title: "Spaced review", detail: "Review weak items scheduled for today." },
    { title: "Interleaving", detail: "Mix previous concepts before the next lesson." },
    { title: "Mastery gate", detail: "Advance after consistent recall." }
  ];
  return (
    <section>
      <PageHeader kicker="Retention" title="${productName} Review" />
      <StatusList items={items} />
    </section>
  );
}
`,
      "QuizPage.jsx": `import { PageHeader } from "../components/PageHeader.jsx";
import { QuizCard } from "../components/QuizCard.jsx";

export function QuizPage() {
  return (
    <section>
      <PageHeader kicker="Adaptive Quiz" title="${productName} Quiz" />
      <QuizCard prompt="Choose the strongest next action for mastery." options={["Retry with hint", "Skip review", "Unlock all levels"]} answer="Retry with hint" />
    </section>
  );
}
`,
      "TutorPage.jsx": `import { PageHeader } from "../components/PageHeader.jsx";
import { StatusList } from "../components/StatusList.jsx";

export function TutorPage() {
  const flows = [
    { title: "Contextual correction", detail: "Explain the misconception and offer a similar retry." },
    { title: "Guided prompt", detail: "Ask one follow-up question before revealing an answer." },
    { title: "Progress coaching", detail: "Summarize weak areas and suggest the next skill." }
  ];
  return (
    <section>
      <PageHeader kicker="AI Tutor placeholder" title="${productName} Tutor" />
      <div className="card"><StatusList items={flows} /></div>
    </section>
  );
}
`,
      "AdaptiveProgressPage.jsx": `import { PageHeader } from "../components/PageHeader.jsx";
import { MetricCard } from "../components/MetricCard.jsx";
import { ProgressBar } from "../components/ProgressBar.jsx";

export function AdaptiveProgressPage() {
  return (
    <section>
      <PageHeader kicker="Adaptive progress" title="${productName} Mastery Map" />
      <div className="grid">
        <div className="span-4"><MetricCard title="Retention" value="84%" detail="stable recall" tone="success" /></div>
        <div className="span-4"><MetricCard title="Difficulty" value="Level 3" detail="adaptive pace" /></div>
        <div className="span-4"><MetricCard title="Weak skills" value="2" detail="review suggested" tone="warning" /></div>
        <div className="span-12 card"><ProgressBar label="Mastery readiness" value={76} /></div>
      </div>
    </section>
  );
}
`
    };
  }
}

module.exports = { LearningUiRenderer };
