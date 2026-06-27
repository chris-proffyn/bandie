import { bandNameFontGoogleStylesheetUrl } from '@bandie/data';
import { useEffect } from 'react';

export function useBandNameFont(fontId: string | null | undefined) {
  useEffect(() => {
    const href = bandNameFontGoogleStylesheetUrl(fontId);
    if (!href) {
      return;
    }

    const linkId = 'band-profile-name-font';
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    link.href = href;

    return () => {
      link?.remove();
    };
  }, [fontId]);
}
