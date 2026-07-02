import type { SongSuggestionWithSummary } from '@bandie/data';
import { bandInitials } from '../../lib/profileHelpers';

type SongSuggestionSuggesterProps = {
  row: SongSuggestionWithSummary;
  className?: string;
  avatarOnly?: boolean;
};

function suggesterLabel(row: SongSuggestionWithSummary): string {
  return row.suggester_display_name?.trim() || 'Member';
}

export function SongSuggestionSuggester({
  row,
  className,
  avatarOnly = false,
}: SongSuggestionSuggesterProps) {
  const label = suggesterLabel(row);

  return (
    <div
      className={[
        'song-suggestion-suggester',
        avatarOnly ? 'song-suggestion-suggester-avatar-only' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      title={avatarOnly ? label : undefined}
      aria-label={avatarOnly ? `Raised by ${label}` : undefined}
    >
      <span className="song-suggestion-suggester-avatar" aria-hidden="true">
        {row.suggester_profile_image_url ? (
          <img src={row.suggester_profile_image_url} alt="" />
        ) : (
          <span>{bandInitials(label)}</span>
        )}
      </span>
      {avatarOnly ? null : <span className="song-suggestion-suggester-name">{label}</span>}
    </div>
  );
}
