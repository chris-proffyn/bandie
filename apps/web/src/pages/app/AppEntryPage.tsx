import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listMyPendingPlayerOutreach, listPendingInvitationsForCurrentUser } from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { WorkspaceBandCard } from '../../components/bands/WorkspaceBandCard';
import { DirectoryTestDataToggle } from '../../components/directory/DirectoryTestDataToggle';
import {
  applyDirectoryTestDataFilter,
  countDirectoryTestRows,
  readDirectoryHideTestData,
  saveDirectoryHideTestData,
  showDirectoryTestDataToggle,
} from '../../lib/directoryTestDataPreference';
import '../../styles/directory.css';

export function AppEntryPage() {
  const navigate = useNavigate();
  const { bands, loading } = useAuth();
  const [checkingInvites, setCheckingInvites] = useState(true);
  const [hideTestData, setHideTestData] = useState(readDirectoryHideTestData);

  const visibleBands = useMemo(
    () => applyDirectoryTestDataFilter(bands, hideTestData),
    [bands, hideTestData],
  );
  const testBandCount = useMemo(() => countDirectoryTestRows(bands), [bands]);
  const showTestDataToggle = useMemo(() => showDirectoryTestDataToggle(bands), [bands]);

  function handleHideTestDataChange(nextHidden: boolean) {
    setHideTestData(nextHidden);
    saveDirectoryHideTestData(nextHidden);
  }

  useEffect(() => {
    if (loading) {
      return;
    }

    Promise.all([listPendingInvitationsForCurrentUser(), listMyPendingPlayerOutreach()])
      .then(([pending, outreach]) => {
        if (pending.length > 0 || outreach.length > 0) {
          navigate('/app/communications', { replace: true });
        }
      })
      .finally(() => setCheckingInvites(false));
  }, [loading, navigate]);

  if (loading || checkingInvites) {
    return (
      <div className="my-bands-page">
        <div className="panel">
          <p>Loading your bands…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-bands-page">
      <header className="my-bands-header">
        <div>
          <h1>Your bands</h1>
          <p className="my-bands-lead">
            {bands.length
              ? 'Open a band workspace to manage your profile, members, and upcoming tools.'
              : 'Create a band or accept an invitation to get started.'}
          </p>
        </div>
        {bands.length > 0 ? (
          <div className="my-bands-header-actions">
            {showTestDataToggle ? (
              <DirectoryTestDataToggle
                hideTestData={hideTestData}
                testItemCount={testBandCount}
                itemLabel="bands"
                onChange={handleHideTestDataChange}
              />
            ) : null}
            <Link to="/app/bands/new" className="directory-btn directory-btn-primary">
              Create a band
            </Link>
          </div>
        ) : null}
      </header>

      {bands.length === 0 ? (
        <div className="directory-empty-state">
          <strong>No bands yet</strong>
          <p>
            You are not a member of any bands. Create your own band workspace or ask a band leader to
            send you an invitation.
          </p>
          <Link to="/app/bands/new" className="directory-btn directory-btn-primary">
            Create your first band
          </Link>
          <Link to="/app/players" className="directory-btn directory-btn-secondary" style={{ marginTop: '0.75rem' }}>
            Find players
          </Link>
          <Link to="/app/bands" className="directory-btn directory-btn-secondary" style={{ marginTop: '0.75rem' }}>
            Browse band directory
          </Link>
        </div>
      ) : visibleBands.length === 0 && hideTestData && testBandCount > 0 ? (
        <div className="directory-empty-state">
          <strong>Test data is hidden</strong>
          <p>Choose Show test data to view your seeded test bands.</p>
        </div>
      ) : (
        <>
          <p className="my-bands-count">
            {visibleBands.length} {visibleBands.length === 1 ? 'band' : 'bands'}
            {hideTestData && testBandCount > 0 ? (
              <span className="directory-filter-pill my-bands-test-data-pill">Test data hidden</span>
            ) : null}
          </p>
          <div className="directory-band-grid my-bands-grid">
            {visibleBands.map((band) => (
              <WorkspaceBandCard key={band.id} band={band} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
