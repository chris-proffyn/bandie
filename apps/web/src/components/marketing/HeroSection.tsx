import { homepageContent } from '../../content/homepageContent';
import { trackNavClick } from '../../lib/analytics';
import { ExampleBandProfileCard } from './ExampleBandProfileCard';
import { MarketingButton } from './MarketingButton';

export function HeroSection() {
  const { hero } = homepageContent;

  return (
    <header className="hero" aria-label="Bandie introduction">
      <div>
        <div className="eyebrow">
          <span className="pulse" aria-hidden="true" />
          {hero.eyebrow}
        </div>
        <h1>
          {hero.heading} <span className="highlight">{hero.headingHighlight}</span>
        </h1>
        <p className="hero-copy">
          <strong>{hero.bodyLead}</strong> {hero.body}
        </p>
        <div className="cta-row">
          {hero.ctas.map((cta) => (
            <MarketingButton key={cta.label} cta={cta} section="hero" />
          ))}
        </div>
        <div className="audience-jump" id="choose-mode">
          {hero.jumpCards.map((card) => (
            <a
              key={card.title}
              href={card.href}
              className="jump-card"
              onClick={() => trackNavClick(card.title, card.href)}
            >
              <strong>{card.title}</strong>
              {card.text}
            </a>
          ))}
        </div>
      </div>
      <ExampleBandProfileCard />
    </header>
  );
}
