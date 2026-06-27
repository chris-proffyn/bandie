import { useRef, useState, type ChangeEvent } from 'react';
import {
  removeBandProfileImage,
  uploadBandProfileImage,
  type BandProfileImageKind,
} from '@bandie/data';

type ProfileImageUploadFieldProps = {
  bandId: string;
  kind: BandProfileImageKind;
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
  previewClassName?: string;
};

export function ProfileImageUploadField({
  bandId,
  kind,
  label,
  hint,
  value,
  onChange,
  previewClassName = 'profile-image-preview',
}: ProfileImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const publicUrl = await uploadBandProfileImage(bandId, kind, file);
      onChange(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload image.');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setUploading(true);

    try {
      await removeBandProfileImage(bandId, kind);
      onChange('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove image.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="profile-image-field">
      <div className="auth-field">
        <label htmlFor={`${kind}-upload`}>{label}</label>
        <p className="profile-image-hint">{hint}</p>
      </div>

      {value ? (
        <div className={previewClassName}>
          <img src={value} alt={`${label} preview`} />
        </div>
      ) : (
        <div className="profile-image-placeholder">No {kind} uploaded yet</div>
      )}

      <div className="profile-editor-inline-actions">
        <button
          type="button"
          className="auth-button auth-button-secondary"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
        </button>
        {value ? (
          <button type="button" disabled={uploading} onClick={handleRemove}>
            Remove
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        id={`${kind}-upload`}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={handleFileChange}
      />

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}
    </div>
  );
}
