import { homepageContent } from '../../content/homepageContent';

export function FeatureCards() {
  const { what } = homepageContent;

  return (
    <section id="what">
      <div className="section-header">
        <div className="section-kicker">{what.kicker}</div>
        <h2>{what.heading}</h2>
        <p className="section-text">{what.text}</p>
      </div>

      <div className="cards-3">
        {what.features.map((feature) => (
          <article key={feature.title} className="feature-card">
            <div className="icon" aria-hidden="true">
              {feature.icon}
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
