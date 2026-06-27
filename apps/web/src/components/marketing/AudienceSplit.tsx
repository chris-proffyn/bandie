import { homepageContent } from '../../content/homepageContent';
import { MarketingButton } from './MarketingButton';

export function AudienceSplit() {
  const { audience } = homepageContent;

  return (
    <section className="split" aria-label="Audience sections">
      <article className="audience-card bands" id={audience.bands.id}>
        <div className="section-kicker">{audience.bands.kicker}</div>
        <h3>{audience.bands.heading}</h3>
        <p>{audience.bands.text}</p>
        <ul className="check-list">
          {audience.bands.benefits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <MarketingButton cta={audience.bands.cta} section="bands" />
      </article>

      <article className="audience-card organisers" id={audience.organisers.id}>
        <div className="section-kicker">{audience.organisers.kicker}</div>
        <h3>{audience.organisers.heading}</h3>
        <p>{audience.organisers.text}</p>
        <ul className="check-list">
          {audience.organisers.benefits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <MarketingButton cta={audience.organisers.cta} section="organisers" />
      </article>

      <article className="audience-card players" id={audience.players.id}>
        <div className="section-kicker">{audience.players.kicker}</div>
        <h3>{audience.players.heading}</h3>
        <p>{audience.players.text}</p>
        <ul className="check-list">
          {audience.players.benefits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <MarketingButton cta={audience.players.cta} section="players" />
      </article>
    </section>
  );
}
