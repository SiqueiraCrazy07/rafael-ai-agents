export function QuizCard({ prompt, options = [], answer }) {
  return (
    <article className="card">
      <h2>{prompt}</h2>
      <div className="list">
        {options.map((option) => (
          <button className="button secondary" key={option} type="button">{option}</button>
        ))}
      </div>
      <p className="muted">Answer key: {answer}</p>
    </article>
  );
}
