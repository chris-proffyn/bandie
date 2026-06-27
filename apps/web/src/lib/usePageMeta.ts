import { useEffect } from 'react';

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

type PageMetaInput = {
  title: string;
  description: string;
  canonicalPath: string;
};

export function usePageMeta({ title, description, canonicalPath }: PageMetaInput) {
  useEffect(() => {
    const appUrl = import.meta.env.VITE_APP_URL ?? window.location.origin;
    const canonical = new URL(canonicalPath, appUrl).href;

    document.title = title;
    upsertMeta('description', description);
    upsertLink('canonical', canonical);
    upsertMeta('og:title', title, 'property');
    upsertMeta('og:description', description, 'property');
    upsertMeta('og:type', 'website', 'property');
    upsertMeta('og:url', canonical, 'property');
    upsertMeta('twitter:card', 'summary_large_image');
    upsertMeta('twitter:title', title);
    upsertMeta('twitter:description', description);
  }, [title, description, canonicalPath]);
}
