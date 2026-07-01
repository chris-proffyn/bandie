import type { SongSuggestionWithSummary } from '@bandie/data';
import { bandInitials } from '../../lib/profileHelpers';

type SongSuggestionSuggesterProps = {
  row: SongSuggestionWithSummary;
  className?: string;
};

function suggesterLabel(row: SongSuggestionWithSummary): string {
  return row.suggester_display_name?.trim() || 'Member';
}

export function SongSuggestionSuggester({ row, className }: SongSuggestionSuggesterProps) {
  const label = suggesterLabel(row);

  return (
    <div className={['song-suggestion-suggester', className].filter(Boolean).join(' ')}>
      <span className="song-suggestion-suggester-avatar" aria-hidden="true">
        {row.suggester_profile_image_url ? (
          <img src={row.suggester_profile_image_url} alt="" />
        ) : (
          <span>{bandInitials(label)}</span>
        )}
      </span>
      <span className="song-suggestion-suggester-name">{label}</span>
    </div>
  );
}
