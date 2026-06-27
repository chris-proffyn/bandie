import {
  BAND_NAME_FONTS,
  allBandNameFontsGoogleStylesheetUrl,
  bandNameFontFamily,
  type BandNameFont,
} from '@bandie/data';
import { useEffect } from 'react';

type BandNameFontPickerProps = {
  value: BandNameFont;
  onChange: (value: BandNameFont) => void;
  previewName?: string;
};

export function BandNameFontPicker({ value, onChange, previewName }: BandNameFontPickerProps) {
  useEffect(() => {
    const linkId = 'band-name-font-picker-styles';
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    link.href = allBandNameFontsGoogleStylesheetUrl();

    return () => {
      link?.remove();
    };
  }, []);

  return (
    <div className="profile-font-picker">
      <div className="profile-font-picker-options" id="nameFont" role="radiogroup" aria-label="Band name font">
        {BAND_NAME_FONTS.map((font) => {
          const selected = value === font.id;
          return (
            <button
              key={font.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`profile-font-picker-option${selected ? ' profile-font-picker-option-selected' : ''}`}
              style={{ fontFamily: bandNameFontFamily(font.id) }}
              onClick={() => onChange(font.id)}
            >
              {font.label}
            </button>
          );
        })}
      </div>
      {previewName ? (
        <p
          className="profile-font-picker-preview"
          style={{ fontFamily: bandNameFontFamily(value) }}
          aria-live="polite"
        >
          {previewName}
        </p>
      ) : null}
    </div>
  );
}
