import type { SongMetadataFormValues } from '../../lib/songMetadataForm';

type SongMetadataFormFieldsProps = {
  values: SongMetadataFormValues;
  onChange: (patch: Partial<SongMetadataFormValues>) => void;
  titleRequired?: boolean;
};

export function SongMetadataFormFields({
  values,
  onChange,
  titleRequired = true,
}: SongMetadataFormFieldsProps) {
  return (
    <>
      <label>
        Title
        <input
          value={values.title}
          onChange={(event) => onChange({ title: event.target.value })}
          required={titleRequired}
        />
      </label>

      <div className="songs-form-grid">
        <label>
          Artist
          <input value={values.artist} onChange={(event) => onChange({ artist: event.target.value })} />
        </label>
        <label>
          Genre
          <input value={values.genre} onChange={(event) => onChange({ genre: event.target.value })} />
        </label>
      </div>

      <div className="songs-form-grid">
        <label>
          Key
          <input
            value={values.songKey}
            onChange={(event) => onChange({ songKey: event.target.value })}
            placeholder="E, Am, etc."
          />
        </label>
        <div className="songs-form-grid">
          <label>
            Length (min)
            <input
              type="number"
              min="0"
              value={values.durationMinutes}
              onChange={(event) => onChange({ durationMinutes: event.target.value })}
            />
          </label>
          <label>
            Length (sec)
            <input
              type="number"
              min="0"
              max="59"
              value={values.durationSeconds}
              onChange={(event) => onChange({ durationSeconds: event.target.value })}
            />
          </label>
        </div>
      </div>

      <label>
        Notes
        <textarea
          value={values.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
          rows={3}
        />
      </label>
    </>
  );
}
