import { DashboardCard } from "../components/DashboardCard.jsx";
import { ContentList } from "../components/ContentList.jsx";
import { ProgressTracker } from "../components/ProgressTracker.jsx";
import { usePrototypeData } from "../hooks/usePrototypeData.js";

export function ProgressPage() {
  const data = usePrototypeData();
  return (
    <section>
      <h1>Chatbot Platform</h1>
      <DashboardCard title="Progress" value="Prototype" detail="Readonly generated screen" />
      <ProgressTracker items={data.features.map((label, index) => ({ id: index, label }))} />
      <ContentList content={data.features.map((title, index) => ({ id: index, title, summary: "Generated MVP feature" }))} />
    </section>
  );
}
