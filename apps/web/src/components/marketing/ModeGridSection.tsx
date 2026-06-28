import { homepageContent } from '../../content/homepageContent';
import { MarketingButton } from './MarketingButton';

export function ModeGridSection() {
  const { modes } = homepageContent;

  return (
    <section aria-label="Bandie modes summary">
      <div className="section-head">
        <div>
          <div className="section-kicker">{modes.kicker}</div>
          <h2>{modes.heading}</h2>
          <p className="section-text">{modes.text}</p>
        </div>
      </div>
      <div className="mode-grid">
        {modes.cards.map((card) => (
          <article key={card.id} className={`mode-card ${card.tone}`}>
            <div className="mode-icon" aria-hidden="true">
              {card.icon}
            </div>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
            <ul>
              {card.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <MarketingButton cta={card.cta} section={card.tone} />
          </article>
        ))}
      </div>
    </section>
  );
}
