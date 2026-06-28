import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { WORKSPACE_MODE_LABELS, type WorkspaceMode } from '@bandie/data';

export function WorkspaceModePanel() {
  const {
    workspaceMode,
    canSwitchWorkspaceMode,
    isPlayer,
    isOrganiser,
    setWorkspaceMode,
  } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canSwitchWorkspaceMode) {
    return null;
  }

  async function handleSelect(mode: WorkspaceMode) {
    if (mode === workspaceMode) {
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await setWorkspaceMode(mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update workspace mode.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="profile-editor-section workspace-mode-panel">
      <div className="admin-mode-panel-header">
        <div>
          <h3>Workspace mode</h3>
          <p className="profile-section-intro">
            You use Bandie as both a {isPlayer ? 'player' : ''}
            {isPlayer && isOrganiser ? ' and ' : ''}
            {isOrganiser ? 'organiser' : ''}. Choose which experience to show in the app
            menu and screens.
          </p>
        </div>
        <span className="app-workspace-mode-badge">{WORKSPACE_MODE_LABELS[workspaceMode]}</span>
      </div>

      <div className="workspace-mode-options" role="group" aria-label="Workspace mode">
        {(['player', 'organiser'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            className={`workspace-mode-option ${workspaceMode === mode ? 'workspace-mode-option-selected' : ''}`}
            disabled={saving || (mode === 'player' && !isPlayer) || (mode === 'organiser' && !isOrganiser)}
            onClick={() => {
              void handleSelect(mode);
            }}
          >
            <strong>{mode === 'player' ? 'Player mode' : 'Organiser mode'}</strong>
            <span>
              {mode === 'player'
                ? 'Bands, player profile, player directory and band workspaces.'
                : 'Band directory, My venues, and organiser-focused discovery tools.'}
            </span>
          </button>
        ))}
      </div>

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}
    </section>
  );
}
