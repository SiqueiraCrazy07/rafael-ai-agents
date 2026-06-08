import { PageHeader } from "../components/PageHeader.jsx";
import { GamifiedHud } from "../components/GamifiedHud.jsx";
import { ProgressBar } from "../components/ProgressBar.jsx";

export function LessonPage() {
  return (
    <section>
      <PageHeader kicker="Learning UI" title="English Learning Platform Lesson" />
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
