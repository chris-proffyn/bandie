import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function AdminModePanel() {
  const { adminModeActive, setAdminModeActive } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setError(null);
    setSaving(true);

    try {
      await setAdminModeActive(!adminModeActive);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update admin mode.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="profile-editor-section admin-mode-panel">
      <div className="admin-mode-panel-header">
        <div>
          <h3>Admin mode</h3>
          <p className="profile-section-intro">
            When off, you use Bandie like any other member — only your bands and your own profile.
            Turn on to view all bands, edit any player profile, and use platform admin tools.
          </p>
        </div>
        {adminModeActive ? <span className="app-admin-badge">Active</span> : null}
      </div>

      <div className="profile-editor-toggle">
        <input
          id="adminModeToggle"
          type="checkbox"
          checked={adminModeActive}
          disabled={saving}
          onChange={() => {
            void handleToggle();
          }}
        />
        <label htmlFor="adminModeToggle">
          {adminModeActive ? 'Admin mode is on' : 'Enable admin mode'}
        </label>
      </div>

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}
    </section>
  );
}
