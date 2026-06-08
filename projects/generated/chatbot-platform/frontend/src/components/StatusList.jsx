export function StatusList({ items = [] }) {
  return (
    <div className="list">
      {items.map((item) => (
        <article className="list-item" key={item.title}>
          <strong>{item.title}</strong>
          <p className="muted">{item.detail}</p>
        </article>
      ))}
    </div>
  );
}
