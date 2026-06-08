export function PageHeader({ kicker, title, action }) {
  return (
    <header className="page-header">
      <div>
        <p className="page-kicker">{kicker}</p>
        <h1 className="page-title">{title}</h1>
      </div>
      {action ? <div>{action}</div> : null}
    </header>
  );
}
