class GamifiedUiRenderer {
  dashboardBlock() {
    return `<GamifiedHud xp={78} streak={6} level={4} mission="Recover one weak skill" />`;
  }

  missionsPage(productName) {
    return `import { PageHeader } from "../components/PageHeader.jsx";
import { GamifiedHud } from "../components/GamifiedHud.jsx";
import { MissionCard } from "../components/MissionCard.jsx";

export function MissionsPage() {
  const missions = [
    { title: "Daily mastery", criteria: "Complete one challenge and one review", reward: "20 XP", status: "active" },
    { title: "Weak skill recovery", criteria: "Retry a missed concept with a hint", reward: "Streak shield", status: "active" },
    { title: "Level checkpoint", criteria: "Finish the current level mission", reward: "Badge progress", status: "complete" }
  ];
  return (
    <section>
      <PageHeader kicker="Gamified UI" title="${productName} Missions" />
      <div className="grid">
        <div className="span-12"><GamifiedHud xp={82} streak={7} level={5} mission="Finish level checkpoint" /></div>
        <div className="span-12 card">
          <h2>Mission board</h2>
          <div className="list">{missions.map((mission) => <MissionCard key={mission.title} {...mission} />)}</div>
        </div>
      </div>
    </section>
  );
}
`;
  }
}

module.exports = { GamifiedUiRenderer };
