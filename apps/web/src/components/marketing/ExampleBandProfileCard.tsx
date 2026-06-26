import { homepageContent } from '../../content/homepageContent';

export function ExampleBandProfileCard() {
  const profile = homepageContent.exampleProfile;

  return (
    <aside className="hero-card" aria-label="Example Bandie band profile">
      <div className="band-profile">
        <div className="profile-content">
          <div className="profile-header">
            <div className="fake-logo" aria-hidden="true">
              {profile.initials}
            </div>
            <div className="status-chip">{profile.status}</div>
          </div>
          <h2 className="profile-title">{profile.name}</h2>
          <div className="profile-subtitle">{profile.subtitle}</div>

          <div className="mini-grid">
            {profile.miniCards.map((card) => (
              <div key={card.label} className="mini-card">
                <div className="mini-label">{card.label}</div>
                <div className="mini-value">{card.value}</div>
              </div>
            ))}
          </div>

          <div className="setlist-preview" aria-label="Example setlist preview">
            {profile.setlist.map((row) => (
              <div key={row.title} className="setlist-row">
                <span>{row.title}</span>
                <span className="vote">{row.votes}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
