import { useParams } from 'react-router-dom';
import { PlayerProfileView } from '../../components/profile/PlayerProfileView';
import '../../styles/directory.css';

export function WorkspacePlayerProfilePage() {
  const { profileId } = useParams();

  return <PlayerProfileView profileId={profileId} variant="workspace" />;
}
