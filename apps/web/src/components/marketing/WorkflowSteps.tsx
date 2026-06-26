import { homepageContent } from '../../content/homepageContent';

export function WorkflowSteps() {
  const { workflow } = homepageContent;

  return (
    <section id="how">
      <div className="section-header">
        <div className="section-kicker">{workflow.kicker}</div>
        <h2>{workflow.heading}</h2>
        <p className="section-text">{workflow.text}</p>
      </div>

      <div className="workflow">
        {workflow.steps.map((step) => (
          <article key={step.title} className="step-card">
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
