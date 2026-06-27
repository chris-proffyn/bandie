import { BandDirectoryView } from '../components/directory/BandDirectoryView';
import { usePageMeta } from '../lib/usePageMeta';
import '../styles/directory.css';

export function BandDirectoryPage() {
  usePageMeta({
    title: 'Find a Band | Bandie',
    description:
      'Search local bands by genre, location, price and availability. Compare profiles and send booking enquiries from one place.',
    canonicalPath: '/bands',
  });

  return <BandDirectoryView variant="public" />;
}
