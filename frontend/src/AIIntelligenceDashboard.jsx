import { useState } from 'react';

const insights = [
  {
    title: 'Attendance is the strongest near-term lever',
    body: 'Attendance is trending positively, but lower participation in two cohorts merits human review.',
    evidence: '94.2% attendance, +1.6% period over period.',
    tone: 'amber',
  },
  {
    title: 'Fee collection has room to improve',
    body: 'Prioritize targeted family outreach before broad escalation.',
    evidence: '82.7% collection, +6.2% period over period.',
    tone: 'blue',
  },
];

export default function AIIntelligenceDashboard() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  async function ask(event) {
    event.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/ai-intelligence/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      setAnswer(data.text || 'No advisory response is available.');
    } catch {
      setAnswer('The advisory service is unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Module 27 · advisory intelligence</p>
          <h1>AI intelligence for better school decisions.</h1>
          <p className="hero-copy">
            Evidence-backed signals, recommendations, and drafts that keep people in control.
          </p>
        </div>
        <span className="status-pill">Human review required</span>
      </section>
      <section className="metric-grid">
        <div>
          <span>Provider</span>
          <strong>OpenAI-compatible</strong>
          <small>Fallback protected</small>
        </div>
        <div>
          <span>Insights</span>
          <strong>02</strong>
          <small>Evidence attached</small>
        </div>
        <div>
          <span>Risk signals</span>
          <strong>02</strong>
          <small>Low to medium</small>
        </div>
        <div>
          <span>Actions</span>
          <strong>0</strong>
          <small>Nothing auto-applied</small>
        </div>
      </section>
      <section className="content-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Evidence-backed insights</p>
              <h2>What deserves attention</h2>
            </div>
            <button className="quiet-button">Export brief</button>
          </div>
          {insights.map((item) => (
            <article className="insight" key={item.title}>
              <div className={`signal ${item.tone}`} />
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <small>{item.evidence}</small>
              </div>
              <button className="review-button">Review</button>
            </article>
          ))}
        </div>
        <aside className="panel">
          <p className="eyebrow">Safe assistant</p>
          <h2>Ask about your school data</h2>
          <p className="muted">
            Answers are advisory, scoped to available evidence, and never write back to operational
            records.
          </p>
          <form onSubmit={ask}>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Which attendance signal should I review first?"
              aria-label="Ask the AI advisor"
            />
            <button className="primary-button" disabled={loading}>
              {loading ? 'Thinking…' : 'Ask advisor'}
            </button>
          </form>
          {answer && (
            <div className="answer">
              <strong>Advisor response</strong>
              <p>{answer}</p>
            </div>
          )}
        </aside>
      </section>
      <section className="panel recommendation-panel">
        <div>
          <p className="eyebrow">Recommendations</p>
          <h2>Next steps with a human in the loop</h2>
        </div>
        <ul>
          <li>Review attendance exceptions by class before timetable changes.</li>
          <li>Use evidence-backed family outreach for overdue balances.</li>
          <li>Require approval for every operational action.</li>
        </ul>
      </section>
    </main>
  );
}
