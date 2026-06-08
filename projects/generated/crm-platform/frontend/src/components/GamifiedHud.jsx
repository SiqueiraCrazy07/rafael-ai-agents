import { ProgressBar } from "./ProgressBar.jsx";

export function GamifiedHud({ xp = 72, streak = 5, level = 3, mission = "Complete today's practice" }) {
  return (
    <section className="card">
      <div className="hud">
        <div className="hud-item"><strong>Level</strong><p>{level}</p></div>
        <div className="hud-item"><strong>XP</strong><p>{xp}/100</p></div>
        <div className="hud-item"><strong>Streak</strong><p>{streak} days</p></div>
        <div className="hud-item"><strong>Mission</strong><p>{mission}</p></div>
      </div>
      <ProgressBar label="Mission progress" value={xp} />
    </section>
  );
}
