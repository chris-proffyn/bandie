import { Link } from 'react-router-dom';
import type { CtaLink } from '../../content/homepageContent';
import { trackCtaClick, type HomepageEventSection } from '../../lib/analytics';

type MarketingButtonProps = {
  cta: CtaLink;
  section: HomepageEventSection;
  className?: string;
};

function isExternalOrRoute(href: string) {
  return href.startsWith('/') || href.startsWith('http');
}

export function MarketingButton({ cta, section, className = '' }: MarketingButtonProps) {
  const classNames = `button button-${cta.variant} ${className}`.trim();

  const handleClick = () => {
    trackCtaClick(section, cta.label, cta.href, cta.intent);
  };

  if (cta.href.startsWith('#')) {
    return (
      <a href={cta.href} className={classNames} onClick={handleClick}>
        {cta.label}
      </a>
    );
  }

  if (isExternalOrRoute(cta.href)) {
    return (
      <Link to={cta.href} className={classNames} onClick={handleClick}>
        {cta.label}
      </Link>
    );
  }

  return (
    <a href={cta.href} className={classNames} onClick={handleClick}>
      {cta.label}
    </a>
  );
}
