export function DashboardCard({ title, value, detail }) {
  return (
    <section className="dashboard-card">
      <h3>{title}</h3>
      <strong>{value}</strong>
      <p>{detail}</p>
    </section>
  );
}
