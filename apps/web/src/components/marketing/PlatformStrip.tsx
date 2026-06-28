import { homepageContent } from '../../content/homepageContent';

export function PlatformStrip() {
  const { platform } = homepageContent;

  return (
    <section id={platform.id} aria-label="Connected Bandie platform">
      <div className="platform-strip">
        <div>
          <div className="section-kicker">{platform.kicker}</div>
          <h2>{platform.heading}</h2>
          <p className="section-text">{platform.text}</p>
        </div>
        <div className="connection-map" aria-label="Bandie connected object map">
          {platform.map.map((row) => (
            <div key={row.label} className="map-row">
              <div className="map-label">{row.label}</div>
              <div className="map-value">{row.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
