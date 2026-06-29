import { useEffect, useId, useState } from 'react';
import { getBandById } from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { BandSwitcher } from '../app/BandSwitcher';

type SongsBandContextBarProps = {
  bandId: string;
  bandName?: string | null;
};

export function SongsBandContextBar({ bandId, bandName: bandNameProp }: SongsBandContextBarProps) {
  const fieldId = useId();
  const { bands } = useAuth();
  const [bandName, setBandName] = useState(bandNameProp ?? null);

  useEffect(() => {
    if (bandNameProp) {
      setBandName(bandNameProp);
      return;
    }

    let cancelled = false;

    getBandById(bandId)
      .then((band) => {
        if (!cancelled) {
          setBandName(band?.name ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBandName(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bandId, bandNameProp]);

  const showSwitcher = bands.length > 1;

  return (
    <div className="songs-band-context" aria-label="Band context">
      <div className="songs-band-context-main">
        <span className="songs-band-context-label">Band</span>
        <strong className="songs-band-context-name">{bandName ?? 'Loading band…'}</strong>
        <span className="songs-band-context-note">Member-only songbook for this band</span>
      </div>

      {showSwitcher ? (
        <div className="songs-band-context-switcher">
          <BandSwitcher
            currentBandId={bandId}
            getBandPath={(nextBandId) => `/app/${nextBandId}/songs`}
            compact
            selectId={fieldId}
          />
        </div>
      ) : null}
    </div>
  );
}
