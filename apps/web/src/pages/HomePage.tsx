import '../components/marketing/marketing.css';
import { useEffect } from 'react';
import { CoreCapabilities } from '../components/marketing/CoreCapabilities';
import { HeroSection } from '../components/marketing/HeroSection';
import { MarketingFooter } from '../components/marketing/MarketingFooter';
import { MarketingNav } from '../components/marketing/MarketingNav';
import { ModeGridSection } from '../components/marketing/ModeGridSection';
import { PlatformStrip } from '../components/marketing/PlatformStrip';
import { UseCaseSection } from '../components/marketing/UseCaseSection';
import { homepageContent } from '../content/homepageContent';
import { trackHomepageView } from '../lib/analytics';
import { useHomepageMeta } from '../lib/useHomepageMeta';

export function HomePage() {
  useHomepageMeta();

  useEffect(() => {
    trackHomepageView();
  }, []);

  const { useCases } = homepageContent;

  return (
    <div className="page-shell">
      <div className="page-noise" aria-hidden="true" />
      <header className="marketing-header">
        <MarketingNav />
      </header>
      <main id="top">
        <HeroSection />
        <ModeGridSection />
        <UseCaseSection audience={useCases.players} tone="players" />
        <UseCaseSection audience={useCases.bands} tone="bands" />
        <UseCaseSection audience={useCases.organisers} tone="organisers" />
        <PlatformStrip />
        <CoreCapabilities />
      </main>
      <MarketingFooter />
    </div>
  );
}
