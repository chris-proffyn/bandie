import { PlayerDirectoryView } from '../components/directory/PlayerDirectoryView';
import { usePageMeta } from '../lib/usePageMeta';
import '../styles/directory.css';

export function PlayerDirectoryPage() {
  usePageMeta({
    title: 'Find a Player | Bandie',
    description:
      'Search musicians open to deputy gigs or permanent band membership. Filter by instrument, genre, location, budget and experience.',
    canonicalPath: '/players',
  });

  return <PlayerDirectoryView variant="public" />;
}
