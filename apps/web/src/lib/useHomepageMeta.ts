import { useEffect } from 'react';
import { homepageContent } from '../content/homepageContent';

function upsertMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

export function useHomepageMeta() {
  useEffect(() => {
    const { seo } = homepageContent;
    const appUrl = import.meta.env.VITE_APP_URL ?? window.location.origin;
    const canonical = new URL(seo.canonicalPath, appUrl).href;
    const ogImage = new URL(seo.ogImage, appUrl).href;

    document.title = seo.title;
    upsertMeta('description', seo.description);
    upsertLink('canonical', canonical);
    upsertMeta('og:title', seo.title, 'property');
    upsertMeta('og:description', seo.description, 'property');
    upsertMeta('og:type', 'website', 'property');
    upsertMeta('og:url', canonical, 'property');
    upsertMeta('og:image', ogImage, 'property');
    upsertMeta('twitter:card', 'summary_large_image');
    upsertMeta('twitter:title', seo.title);
    upsertMeta('twitter:description', seo.description);
    upsertMeta('twitter:image', ogImage);
  }, []);
}
