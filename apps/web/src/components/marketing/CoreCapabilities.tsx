import { homepageContent } from '../../content/homepageContent';

export function CoreCapabilities() {
  const { capabilities } = homepageContent;

  return (
    <section aria-label="Core Bandie capabilities">
      <div className="section-head">
        <div>
          <div className="section-kicker">{capabilities.kicker}</div>
          <h2>{capabilities.heading}</h2>
          <p className="section-text">{capabilities.text}</p>
        </div>
      </div>
      <div className="feature-grid">
        {capabilities.tiles.map((tile) => (
          <div key={tile.title} className="feature-tile">
            <strong>{tile.title}</strong>
            <span>{tile.description}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
