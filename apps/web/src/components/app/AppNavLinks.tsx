import { NavLink } from 'react-router-dom';
import type { AppNavItem } from '../../lib/appNavigation';

type AppNavLinksProps = {
  items: AppNavItem[];
  linkClassName?: string;
  onNavigate?: () => void;
};

export function AppNavLinks({
  items,
  linkClassName = 'app-header-nav-link',
  onNavigate,
}: AppNavLinksProps) {
  return (
    <>
      {items.map((item) => (
        <NavLink
          key={`${item.to}-${item.label}`}
          to={item.to}
          end={item.end}
          className={linkClassName}
          onClick={onNavigate}
        >
          {item.label}
          {item.badge ? <span className="app-header-nav-badge">{item.badge}</span> : null}
        </NavLink>
      ))}
    </>
  );
}
