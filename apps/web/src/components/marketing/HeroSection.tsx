import { homepageContent } from '../../content/homepageContent';
import { ExampleBandProfileCard } from './ExampleBandProfileCard';
import { MarketingButton } from './MarketingButton';
import { TrustPills } from './TrustPills';

export function HeroSection() {
  const { hero } = homepageContent;

  return (
    <header className="hero">
      <div>
        <div className="eyebrow">
          <span className="pulse" aria-hidden="true" />
          {hero.eyebrow}
        </div>
        <h1>
          {hero.heading} <span className="highlight">{hero.headingHighlight}</span>
        </h1>
        <p className="hero-copy">{hero.body}</p>
        <div className="cta-row">
          <MarketingButton cta={hero.primaryCta} section="hero" />
          <MarketingButton cta={hero.secondaryCta} section="hero" />
        </div>
        <TrustPills pills={hero.trustPills} />
      </div>
      <ExampleBandProfileCard />
    </header>
  );
}
