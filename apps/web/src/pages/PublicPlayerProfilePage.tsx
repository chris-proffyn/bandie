import { useParams } from 'react-router-dom';
import { PlayerProfileView } from '../components/profile/PlayerProfileView';
import { usePageMeta } from '../lib/usePageMeta';
import '../styles/directory.css';

export function PublicPlayerProfilePage() {
  const { profileId } = useParams();

  usePageMeta({
    title: 'Player profile | Bandie',
    description: 'Musician profile on Bandie.',
    canonicalPath: profileId ? `/players/${profileId}` : '/players',
  });

  return <PlayerProfileView profileId={profileId} variant="public" />;
}
