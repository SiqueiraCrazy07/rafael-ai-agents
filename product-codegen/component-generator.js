class ComponentGenerator {
  generate(project) {
    const components = [
      {
        name: "DashboardCard",
        file: "DashboardCard.jsx",
        code: `export function DashboardCard({ title, value, detail }) {
  return (
    <section className="dashboard-card">
      <h3>{title}</h3>
      <strong>{value}</strong>
      <p>{detail}</p>
    </section>
  );
}`
      },
      {
        name: "LoginPanel",
        file: "LoginPanel.jsx",
        code: `export function LoginPanel() {
  return (
    <form className="login-panel">
      <label>Email<input type="email" name="email" /></label>
      <label>Password<input type="password" name="password" /></label>
      <button type="button">Enter prototype</button>
    </form>
  );
}`
      },
      {
        name: "ProgressTracker",
        file: "ProgressTracker.jsx",
        code: `export function ProgressTracker({ items = [] }) {
  return (
    <ol className="progress-tracker">
      {items.map((item) => <li key={item.id || item.label}>{item.label}</li>)}
    </ol>
  );
}`
      },
      {
        name: "ContentList",
        file: "ContentList.jsx",
        code: `export function ContentList({ content = [] }) {
  return (
    <div className="content-list">
      {content.map((item) => <article key={item.id}><h3>{item.title}</h3><p>{item.summary}</p></article>)}
    </div>
  );
}`
      },
      {
        name: "NavigationShell",
        file: "NavigationShell.jsx",
        code: `export function NavigationShell({ navigation = [], children }) {
  return (
    <div className="navigation-shell">
      <nav>{navigation.map((item) => <a key={item.path} href={item.path}>{item.label}</a>)}</nav>
      <main>{children}</main>
    </div>
  );
}`
      }
    ];
    return {
      components,
      readonly: true,
      safetyMode: "readonly-safe-product-component-generator"
    };
  }
}

module.exports = {
  ComponentGenerator
};
