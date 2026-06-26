import { homepageContent } from '../../content/homepageContent';
import { MarketingButton } from './MarketingButton';

export function FinalCta() {
  const { finalCta } = homepageContent;

  return (
    <div className="final-cta">
      <h2>{finalCta.heading}</h2>
      <p>{finalCta.text}</p>
      <div className="cta-row cta-row-center">
        <MarketingButton cta={finalCta.primaryCta} section="final_cta" />
        <MarketingButton cta={finalCta.secondaryCta} section="final_cta" />
      </div>
    </div>
  );
}
