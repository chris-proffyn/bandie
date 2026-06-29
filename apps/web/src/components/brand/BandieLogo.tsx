import { BANDIE_LOGO_PNG, BANDIE_LOGO_SVG } from '../../lib/brand';

type BandieLogoProps = {
  className?: string;
};

export function BandieLogo({ className }: BandieLogoProps) {
  const classes = className ? `bandie-logo ${className}` : 'bandie-logo';

  return (
    <img
      src={BANDIE_LOGO_SVG}
      alt=""
      className={classes}
      decoding="async"
      draggable={false}
      onError={(event) => {
        const img = event.currentTarget;
        if (img.dataset.fallbackApplied === 'true') {
          return;
        }
        img.dataset.fallbackApplied = 'true';
        img.src = BANDIE_LOGO_PNG;
      }}
    />
  );
}
