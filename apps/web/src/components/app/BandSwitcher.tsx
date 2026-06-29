import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

type BandSwitcherProps = {
  currentBandId?: string;
  getBandPath?: (bandId: string) => string;
  compact?: boolean;
  selectId?: string;
};

export function BandSwitcher({
  currentBandId,
  getBandPath,
  compact = false,
  selectId = 'band-switcher',
}: BandSwitcherProps) {
  const { bands } = useAuth();
  const navigate = useNavigate();

  function navigateToBand(nextBandId: string) {
    const path = getBandPath ? getBandPath(nextBandId) : `/app/${nextBandId}`;
    navigate(path);
  }

  if (!bands.length) {
    return (
      <div className="band-switcher">
        <p style={{ color: '#bbb6aa', fontSize: '0.9rem', margin: 0 }}>No bands yet</p>
      </div>
    );
  }

  return (
    <div className={`band-switcher ${compact ? 'band-switcher-compact' : ''}`}>
      <label htmlFor={selectId} style={{ fontSize: '0.82rem', fontWeight: 700, color: '#bbb6aa' }}>
        {compact ? 'Switch band' : 'Active band'}
      </label>
      <select
        id={selectId}
        value={currentBandId ?? bands[0]?.id ?? ''}
        onChange={(event) => navigateToBand(event.target.value)}
      >
        {bands.map((band) => (
          <option key={band.id} value={band.id}>
            {band.name}
          </option>
        ))}
      </select>
      {compact ? null : (
        <>
          <button
            type="button"
            className="auth-button auth-button-secondary"
            onClick={() => navigate('/app/bands/new')}
          >
            Create another band
          </button>
          <button type="button" className="auth-button auth-button-secondary" onClick={() => navigate('/app')}>
            All my bands
          </button>
        </>
      )}
    </div>
  );
}
