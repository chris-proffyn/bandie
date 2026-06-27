import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

type BandSwitcherProps = {
  currentBandId?: string;
};

export function BandSwitcher({ currentBandId }: BandSwitcherProps) {
  const { bands } = useAuth();
  const navigate = useNavigate();

  if (!bands.length) {
    return (
      <div className="band-switcher">
        <p style={{ color: '#bbb6aa', fontSize: '0.9rem', margin: 0 }}>No bands yet</p>
      </div>
    );
  }

  return (
    <div className="band-switcher">
      <label htmlFor="band-switcher" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#bbb6aa' }}>
        Active band
      </label>
      <select
        id="band-switcher"
        value={currentBandId ?? bands[0]?.id ?? ''}
        onChange={(event) => navigate(`/app/${event.target.value}`)}
      >
        {bands.map((band) => (
          <option key={band.id} value={band.id}>
            {band.name}
          </option>
        ))}
      </select>
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
    </div>
  );
}
