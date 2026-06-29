import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BandDirectoryView } from '../../components/directory/BandDirectoryView';
import { parseFindGigContext } from '../../lib/findGigNavigation';
import '../../styles/directory.css';

export function WorkspaceBandDirectoryPage() {
  const [searchParams] = useSearchParams();
  const findGigContext = useMemo(
    () => parseFindGigContext(`?${searchParams.toString()}`),
    [searchParams],
  );

  return (
    <BandDirectoryView
      variant="workspace"
      findGigContext={findGigContext}
      directoryBackLink={
        findGigContext ? (
          <Link to={`/app/gigs/${findGigContext.gigId}`} className="directory-btn directory-btn-secondary">
            Back to gig planning
          </Link>
        ) : null
      }
    />
  );
}
