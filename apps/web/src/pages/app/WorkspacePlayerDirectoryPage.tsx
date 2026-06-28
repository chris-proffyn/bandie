import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PlayerDirectoryView } from '../../components/directory/PlayerDirectoryView';
import {
  findPlayersDirectoryFilters,
  parseFindPlayersContext,
} from '../../lib/findPlayersNavigation';
import { WORKSPACE_PLAYER_DIRECTORY_DEFAULTS } from '../../lib/playerDirectoryNavigation';
import '../../styles/directory.css';

export function WorkspacePlayerDirectoryPage() {
  const [searchParams] = useSearchParams();
  const findPlayersContext = useMemo(
    () => parseFindPlayersContext(`?${searchParams.toString()}`),
    [searchParams],
  );
  const initialFilters = useMemo(
    () =>
      findPlayersContext
        ? findPlayersDirectoryFilters(findPlayersContext)
        : WORKSPACE_PLAYER_DIRECTORY_DEFAULTS,
    [findPlayersContext],
  );

  return (
    <PlayerDirectoryView
      variant="workspace"
      initialFilters={initialFilters}
      findPlayersContext={findPlayersContext}
    />
  );
}
