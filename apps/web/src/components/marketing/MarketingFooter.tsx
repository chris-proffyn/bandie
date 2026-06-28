import { homepageContent } from '../../content/homepageContent';

export function MarketingFooter() {
  const { footer } = homepageContent;

  return (
    <footer className="footer">
      <div>
        <strong>Bandie</strong> — {footer.tagline}
      </div>
      <div>{footer.note}</div>
    </footer>
  );
}
