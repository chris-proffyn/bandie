import { DEFAULT_PLAYER_DIRECTORY_FILTERS } from '@bandie/data';
import { PlayerDirectoryView } from '../../components/directory/PlayerDirectoryView';
import '../../styles/directory.css';

const workspacePlayerFilters = {
  ...DEFAULT_PLAYER_DIRECTORY_FILTERS,
  mode: 'permanent' as const,
};

export function WorkspacePlayerDirectoryPage() {
  return (
    <PlayerDirectoryView variant="workspace" initialFilters={workspacePlayerFilters} />
  );
}
