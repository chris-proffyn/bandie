import { Link, useLocation } from 'react-router-dom';
import { backNavigationState, resolveBackPath } from '../../lib/backNavigation';
import '../../styles/navigation.css';

type BackLinkProps = {
  fallbackTo: string;
  workspaceFallbackTo?: string;
  label: string;
  className?: string;
};

export function BackLink({
  fallbackTo,
  workspaceFallbackTo,
  label,
  className = '',
}: BackLinkProps) {
  const location = useLocation();
  const to = resolveBackPath(
    location.pathname,
    location.state,
    fallbackTo,
    workspaceFallbackTo,
  );
  const state = backNavigationState(location.state);

  return (
    <Link to={to} state={state} className={`back-link ${className}`.trim()}>
      ← {label}
    </Link>
  );
}
