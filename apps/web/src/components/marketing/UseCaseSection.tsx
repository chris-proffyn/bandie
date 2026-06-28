import type { UseCaseAudience } from '../../content/homepageContent';
import { MarketingButton } from './MarketingButton';

type UseCaseSectionProps = {
  audience: UseCaseAudience;
  tone: 'players' | 'bands' | 'organisers';
};

export function UseCaseSection({ audience, tone }: UseCaseSectionProps) {
  return (
    <section className="usecase-section" id={audience.id} aria-label={audience.kicker}>
      <div className="usecase-layout">
        <div className="usecase-intro">
          <div className="section-kicker">{audience.kicker}</div>
          <h2>{audience.heading}</h2>
          <p className="section-text">{audience.text}</p>
          <div className="persona-tags">
            {audience.tags.map((tag) => (
              <span key={tag} className="persona-tag">
                {tag}
              </span>
            ))}
          </div>
          <div className="usecase-intro-cta">
            <MarketingButton cta={audience.cta} section={tone} />
          </div>
        </div>

        <article className="how-card">
          <div className={`how-header ${tone}`}>
            <div>
              <h3>{audience.howTitle}</h3>
              <p>{audience.howText}</p>
            </div>
            <span className="role-pill">{audience.rolePill}</span>
          </div>
          <div className="how-steps">
            {audience.steps.map((step, index) => (
              <div key={step.title} className="how-step">
                <div className="how-step-num">{index + 1}</div>
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
          <div className="workflow-preview">
            {audience.previews.map((preview) => (
              <div key={preview.title} className="preview-box">
                <span>{preview.label}</span>
                <strong>{preview.title}</strong>
                <p>{preview.description}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
