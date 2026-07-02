import type { UserBand } from '@bandie/data';
import type { FindPlayersContext } from '../../lib/findPlayersNavigation';
import { InfoHelpButton } from '../ui/InfoHelp';

type AdminRecruitingBandSelectorProps = {
  bands: UserBand[];
  bandId: string;
  onChange: (bandId: string) => void;
  intro?: string;
};

export function AdminRecruitingBandSelector({
  bands,
  bandId,
  onChange,
  intro = 'Choose which band you are recruiting for. Invites and player profile actions will apply to this band.',
}: AdminRecruitingBandSelectorProps) {
  if (!bands.length) {
    return (
      <p className="workspace-empty-note">
        No bands available. Open a band from My bands to recruit players for it.
      </p>
    );
  }

  return (
    <div className="admin-recruit-band-selector panel">
      <div className="heading-with-help">
        <label htmlFor="adminRecruitBandSelect" className="directory-filter-label">
          Recruiting for band
        </label>
        <InfoHelpButton label="About recruiting for band" title="Recruiting for band">
          <p>{intro}</p>
        </InfoHelpButton>
      </div>
      <select
        id="adminRecruitBandSelect"
        className="admin-recruit-band-select"
        value={bandId}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select a band…</option>
        {bands.map((band) => (
          <option key={band.id} value={band.id}>
            {band.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function adminRecruitingBandContext(
  bands: UserBand[],
  bandId: string,
): FindPlayersContext | null {
  if (!bandId) {
    return null;
  }

  const band = bands.find((item) => item.id === bandId);
  if (!band) {
    return null;
  }

  return {
    bandId: band.id,
    bandName: band.name,
  };
}
