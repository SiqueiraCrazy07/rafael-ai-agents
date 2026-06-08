import { PageHeader } from "../components/PageHeader.jsx";

export function LoginPage() {
  return (
    <section>
      <PageHeader kicker="Readonly auth" title="Crm Platform Login" />
      <form className="card login-panel">
        <div className="field"><label>Email</label><input value="demo@example.com" readOnly /></div>
        <div className="field"><label>Password</label><input value="readonly-demo" readOnly type="password" /></div>
        <button className="button" type="button">Enter prototype</button>
        <p className="muted">Authentication is a non-destructive placeholder in V1.</p>
      </form>
    </section>
  );
}
