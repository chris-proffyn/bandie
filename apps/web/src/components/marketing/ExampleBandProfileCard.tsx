import { homepageContent } from '../../content/homepageContent';

export function ExampleBandProfileCard() {
  const profile = homepageContent.exampleProfile;

  return (
    <aside className="hero-card" aria-label="Example public band profile preview">
      <div className="band-profile band-preview-card band-preview-card-photo">
        <div className="band-preview-hero">
          <img src={profile.heroImage} alt={profile.heroImageAlt} />
        </div>

        <div className="profile-content">
          <div className="profile-header profile-header-photo">
            <img className="band-preview-logo" src={profile.logoImage} alt="" />
            <div className="status-chip available">{profile.status}</div>
          </div>
          <h2 className="profile-title">{profile.name}</h2>
          <div className="profile-subtitle">{profile.subtitle}</div>

          <div className="profile-tags" aria-label="Band tags">
            {profile.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <div className="mini-grid band-stats">
            {profile.stats.map((stat) => (
              <div key={stat.label} className="mini-card">
                <div className="mini-label">{stat.label}</div>
                <div className="mini-value">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="setlist-preview band-profile-list" aria-label="Public band profile">
            <h3>Public band profile</h3>
            {profile.profileRows.map((row) => (
              <div key={row.title} className="setlist-row">
                <span>{row.title}</span>
                <span className="vote">{row.badge}</span>
              </div>
            ))}
          </div>

          <div className="profile-cta-row">
            <span className="profile-link">{profile.profileUrl}</span>
            <span className="profile-action">{profile.profileAction}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
