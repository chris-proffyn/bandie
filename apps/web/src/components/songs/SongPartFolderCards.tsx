import { Link } from 'react-router-dom';
import { getSongPartDisplay, type SongPartFolderWithStats } from '@bandie/data';

type SongPartFolderCardsProps = {
  bandId: string;
  songId: string;
  partFolders: SongPartFolderWithStats[];
};

export function SongPartFolderCards({ bandId, songId, partFolders }: SongPartFolderCardsProps) {
  if (partFolders.length === 0) {
    return (
      <p className="my-bands-lead" style={{ margin: 0 }}>
        No part folders yet. Add a folder to start organising charts and lyrics for this song.
      </p>
    );
  }

  return (
    <div className="songs-folder-grid">
      {partFolders.map((folder) => {
        const display = getSongPartDisplay(folder.part_key, folder.part_label);
        const pillClass = folder.hasCurrentFile
          ? 'songs-pill green'
          : folder.required_for_readiness
            ? 'songs-pill amber'
            : 'songs-pill blue';

        return (
          <Link
            key={folder.id}
            to={`/app/${bandId}/songs/${songId}/parts/${folder.id}`}
            className="songs-folder-card songs-folder-card-link surface-light"
          >
            <div className="songs-folder-icon">{display.icon}</div>
            <h3>{display.partLabel}</h3>
            <p>{display.description}</p>
            <span className={pillClass}>
              {folder.hasCurrentFile
                ? `${folder.currentFileCount} file${folder.currentFileCount === 1 ? '' : 's'}`
                : folder.required_for_readiness
                  ? 'Needs upload'
                  : 'Optional'}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
