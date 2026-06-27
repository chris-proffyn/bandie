import {
  BAND_COLOR_PALETTES,
  getBandColorPalette,
  type BandColorPaletteId,
} from '@bandie/data';

type BandColorPalettePickerProps = {
  value: BandColorPaletteId;
  onChange: (value: BandColorPaletteId) => void;
};

export function BandColorPalettePicker({ value, onChange }: BandColorPalettePickerProps) {
  const selected = getBandColorPalette(value);

  return (
    <div className="profile-palette-picker">
      <div className="profile-palette-picker-options" role="radiogroup" aria-label="Colour palette">
        {BAND_COLOR_PALETTES.map((palette) => {
          const isSelected = value === palette.id;
          return (
            <button
              key={palette.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`profile-palette-option${isSelected ? ' profile-palette-option-selected' : ''}`}
              onClick={() => onChange(palette.id)}
            >
              <span
                className="profile-palette-swatch"
                style={{
                  background: `linear-gradient(135deg, ${palette.logoGradientStart}, ${palette.logoGradientEnd})`,
                }}
                aria-hidden
              />
              <span className="profile-palette-option-copy">
                <strong>{palette.label}</strong>
                <span>{palette.description}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div
        className="profile-palette-preview"
        style={{
          background: `radial-gradient(circle at 12% 10%, ${selected.glowPrimary}, transparent 28%), radial-gradient(circle at 88% 8%, ${selected.glowSecondary}, transparent 30%), ${selected.background}`,
          color: selected.text,
          borderColor: selected.surfaceBorder,
        }}
        aria-live="polite"
      >
        <span
          className="profile-palette-preview-mark"
          style={{
            background: `linear-gradient(135deg, ${selected.logoGradientStart}, ${selected.logoGradientEnd})`,
            color: selected.accentText,
          }}
        >
          B
        </span>
        <div>
          <strong style={{ color: selected.text }}>{selected.label}</strong>
          <p style={{ color: selected.textMuted, margin: '0.35rem 0 0' }}>
            Used on your public profile and future gig posters.
          </p>
          <span
            className="profile-palette-preview-chip"
            style={{
              background: selected.accentSoftBg,
              borderColor: selected.accentSoftBorder,
              color: selected.text,
            }}
          >
            Preview accent
          </span>
        </div>
      </div>
    </div>
  );
}
