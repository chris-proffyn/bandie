import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  buildSongPartStorageHealthFromRecords,
  checkBandSongPartStorageHealth,
  disconnectDropbox,
  formatSongPartStorageStatus,
  getBandSongPartStorage,
  getUserDropboxIntegration,
  setupBandSongPartStorage,
  startDropboxConnect,
  type SongPartStorageHealth,
  type UserIntegration,
} from '@bandie/data';

type BandSongPartStoragePanelProps = {
  bandId: string;
  canManage: boolean;
};

export function BandSongPartStoragePanel({ bandId, canManage }: BandSongPartStoragePanelProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [integration, setIntegration] = useState<UserIntegration | null>(null);
  const [health, setHealth] = useState<SongPartStorageHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadState = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    setApiUnavailable(false);

    try {
      const [integrationResult, storageResult] = await Promise.all([
        getUserDropboxIntegration(),
        getBandSongPartStorage(bandId),
      ]);
      setIntegration(integrationResult);

      let healthResult = buildSongPartStorageHealthFromRecords(storageResult, integrationResult);
      try {
        healthResult = await checkBandSongPartStorageHealth(bandId);
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        if (message.includes('Song-part API is unavailable')) {
          setApiUnavailable(true);
        } else {
          throw err;
        }
      }

      setHealth(healthResult);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to load song-part storage.');
      setIntegration(null);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, [bandId]);

  useEffect(() => {
    loadState().catch(() => undefined);
  }, [loadState]);

  useEffect(() => {
    const dropboxStatus = searchParams.get('dropbox');
    if (dropboxStatus !== 'connected' || !canManage) {
      return;
    }

    async function completeSetup() {
      setSubmitting(true);
      setActionError(null);
      setActionMessage(null);

      try {
        const latestIntegration = await getUserDropboxIntegration();
        if (!latestIntegration || latestIntegration.status !== 'connected') {
          throw new Error('Dropbox connected, but integration details are unavailable.');
        }

        await setupBandSongPartStorage(bandId, latestIntegration.id);
        setActionMessage('Dropbox connected and song-part storage folder created.');
        await loadState();
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : 'Unable to finish Dropbox storage setup.',
        );
      } finally {
        setSubmitting(false);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('dropbox');
        setSearchParams(nextParams, { replace: true });
      }
    }

    completeSetup().catch(() => undefined);
  }, [bandId, canManage, loadState, searchParams, setSearchParams]);

  async function handleConnect() {
    setSubmitting(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const redirectUrl = await startDropboxConnect(bandId);
      window.location.assign(redirectUrl);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to connect Dropbox.');
      setSubmitting(false);
    }
  }

  async function handleSetup() {
    if (!integration) {
      return;
    }

    setSubmitting(true);
    setActionError(null);
    setActionMessage(null);

    try {
      await setupBandSongPartStorage(bandId, integration.id);
      setActionMessage('Song-part storage folder is ready.');
      await loadState();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to set up song-part storage.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDisconnect() {
    if (!window.confirm('Disconnect Dropbox from your Bandie account? Band song-part files will become unavailable until reconnected.')) {
      return;
    }

    setSubmitting(true);
    setActionError(null);
    setActionMessage(null);

    try {
      await disconnectDropbox();
      setActionMessage('Dropbox disconnected.');
      await loadState();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to disconnect Dropbox.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRefreshHealth() {
    setSubmitting(true);
    setActionError(null);

    try {
      const healthResult = await checkBandSongPartStorageHealth(bandId);
      setHealth(healthResult);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to refresh storage health.');
    } finally {
      setSubmitting(false);
    }
  }

  const storageStatus = health?.status ?? 'not_configured';
  const needsSetup =
    integration?.status === 'connected' &&
    (storageStatus === 'not_configured' || storageStatus === 'disconnected');

  return (
    <section className="workspace-section panel workspace-song-part-storage-section">
      <div className="workspace-section-header">
        <div>
          <h2>Song part storage</h2>
          <p className="workspace-section-intro">
            Song-part files (tabs, charts, lyrics) are stored in the band leader&apos;s Dropbox.
            Setlists, gigs, and public profile media stay in Bandie.
          </p>
        </div>
      </div>

      {loading ? <p>Loading storage settings…</p> : null}
      {apiUnavailable ? (
        <div className="auth-message">
          Dropbox connect and health checks need the API server. Use <code>npm run dev:full</code>{' '}
          locally, or test on a Netlify deploy. Saved storage settings still load from the database.
        </div>
      ) : null}
      {actionError ? <div className="auth-message auth-message-error">{actionError}</div> : null}
      {actionMessage ? <div className="auth-message auth-message-success">{actionMessage}</div> : null}

      {!loading ? (
        <dl className="workspace-meta-list song-part-storage-meta">
          <div>
            <dt>Provider</dt>
            <dd>Dropbox</dd>
          </div>
          <div>
            <dt>Health</dt>
            <dd>{formatSongPartStorageStatus(storageStatus)}</dd>
          </div>
          <div>
            <dt>Connected account</dt>
            <dd>{health?.providerAccountEmail ?? integration?.provider_account_email ?? 'Not connected'}</dd>
          </div>
          <div>
            <dt>Storage owner</dt>
            <dd>{health?.storageOwner ?? '—'}</dd>
          </div>
          <div>
            <dt>Root folder</dt>
            <dd>{health?.rootFolderPath ?? '—'}</dd>
          </div>
          {health?.lastHealthCheckAt ? (
            <div>
              <dt>Last health check</dt>
              <dd>{new Date(health.lastHealthCheckAt).toLocaleString()}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <div className="workspace-inline-actions song-part-storage-actions">
        {canManage ? (
          <>
            {!integration || integration.status !== 'connected' ? (
              <button
                type="button"
                className="button primary"
                disabled={submitting}
                onClick={() => handleConnect()}
              >
                Connect Dropbox
              </button>
            ) : null}

            {needsSetup ? (
              <button
                type="button"
                className="button primary"
                disabled={submitting}
                onClick={() => handleSetup()}
              >
                Create band song-parts folder
              </button>
            ) : null}

            {integration?.status === 'connected' ? (
              <button
                type="button"
                className="button ghost"
                disabled={submitting}
                onClick={() => handleDisconnect()}
              >
                Disconnect Dropbox
              </button>
            ) : null}

            {integration?.status === 'needs_reconnect' ? (
              <button
                type="button"
                className="button primary"
                disabled={submitting}
                onClick={() => handleConnect()}
              >
                Reconnect Dropbox
              </button>
            ) : null}
          </>
        ) : null}

        <button
          type="button"
          className="button ghost"
          disabled={submitting || loading}
          onClick={() => handleRefreshHealth()}
        >
          Refresh health
        </button>
      </div>
    </section>
  );
}
