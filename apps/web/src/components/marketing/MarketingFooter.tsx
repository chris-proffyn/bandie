import { homepageContent } from '../../content/homepageContent';

export function MarketingFooter() {
  const { footer } = homepageContent;

  return (
    <footer className="footer">
      <div>{footer.copyright}</div>
      <div>{footer.tagline}</div>
    </footer>
  );
}
