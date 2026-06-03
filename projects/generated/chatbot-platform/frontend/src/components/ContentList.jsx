export function ContentList({ content = [] }) {
  return (
    <div className="content-list">
      {content.map((item) => <article key={item.id}><h3>{item.title}</h3><p>{item.summary}</p></article>)}
    </div>
  );
}
