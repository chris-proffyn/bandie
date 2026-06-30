import { SongSuggestionGroupFormPanel } from './SongSuggestionGroupFormPanel';

type CreateSongSuggestionGroupPanelProps = {
  bandId: string;
  onClose: () => void;
  onCreated: () => void;
};

export function CreateSongSuggestionGroupPanel({
  bandId,
  onClose,
  onCreated,
}: CreateSongSuggestionGroupPanelProps) {
  return (
    <SongSuggestionGroupFormPanel bandId={bandId} onClose={onClose} onSaved={onCreated} />
  );
}
