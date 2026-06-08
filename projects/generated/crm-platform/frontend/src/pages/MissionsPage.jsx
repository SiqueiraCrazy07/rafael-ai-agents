import { PageHeader } from "../components/PageHeader.jsx";
import { MissionCard } from "../components/MissionCard.jsx";

export function MissionsPage() {
  return (
    <section>
      <PageHeader kicker="Missions" title="Crm Platform Missions" />
      <MissionCard title="Prototype mission" criteria="Complete the primary flow" reward="20 XP" />
    </section>
  );
}
