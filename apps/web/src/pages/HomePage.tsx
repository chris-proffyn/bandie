import '../components/marketing/marketing.css';
import { useEffect } from 'react';
import { AudienceSplit } from '../components/marketing/AudienceSplit';
import { FeatureCards } from '../components/marketing/FeatureCards';
import { FinalCta } from '../components/marketing/FinalCta';
import { HeroSection } from '../components/marketing/HeroSection';
import { MarketingFooter } from '../components/marketing/MarketingFooter';
import { MarketingNav } from '../components/marketing/MarketingNav';
import { WorkflowSteps } from '../components/marketing/WorkflowSteps';
import { trackHomepageView } from '../lib/analytics';
import { useHomepageMeta } from '../lib/useHomepageMeta';

export function HomePage() {
  useHomepageMeta();

  useEffect(() => {
    trackHomepageView();
  }, []);

  return (
    <div className="page-shell">
      <MarketingNav />
      <main>
        <HeroSection />
        <FeatureCards />
        <AudienceSplit />
        <WorkflowSteps />
        <FinalCta />
      </main>
      <MarketingFooter />
    </div>
  );
}
