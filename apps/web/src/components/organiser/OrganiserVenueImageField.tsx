import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  removeOrganiserVenueImage,
  uploadOrganiserVenueImage,
} from '@bandie/data';

type OrganiserVenueImageFieldProps = {
  venueId?: string;
  value: string;
  onChange: (url: string) => void;
  onPendingFileChange?: (file: File | null) => void;
  disabled?: boolean;
};

export function OrganiserVenueImageField({
  venueId,
  value,
  onChange,
  onPendingFileChange,
  disabled = false,
}: OrganiserVenueImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (pendingPreview) {
        URL.revokeObjectURL(pendingPreview);
      }
    };
  }, [pendingPreview]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setError(null);

    if (!venueId) {
      if (pendingPreview) {
        URL.revokeObjectURL(pendingPreview);
      }
      setPendingPreview(URL.createObjectURL(file));
      onPendingFileChange?.(file);
      return;
    }

    setUploading(true);

    try {
      const publicUrl = await uploadOrganiserVenueImage(venueId, file);
      onChange(publicUrl);
      onPendingFileChange?.(null);
      if (pendingPreview) {
        URL.revokeObjectURL(pendingPreview);
        setPendingPreview(null);
      }
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
      if (venueId && value) {
        await removeOrganiserVenueImage(venueId);
      }
      onChange('');
      onPendingFileChange?.(null);
      if (pendingPreview) {
        URL.revokeObjectURL(pendingPreview);
        setPendingPreview(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove image.');
    } finally {
      setUploading(false);
    }
  }

  const previewUrl = value || pendingPreview;

  return (
    <div className="profile-image-field organiser-venue-image-field">
      <div className="auth-field">
        <label htmlFor="venue-image-upload">Venue photo</label>
        <p className="profile-image-hint">
          {venueId
            ? 'Landscape photo works well. JPEG, PNG, WebP or GIF up to 5 MB.'
            : 'Choose a photo now — it will upload when you save the venue.'}
        </p>
      </div>

      {previewUrl ? (
        <div className="organiser-venue-image-preview">
          <img src={previewUrl} alt="Venue preview" />
        </div>
      ) : (
        <div className="profile-image-placeholder">No venue photo yet</div>
      )}

      <div className="profile-editor-inline-actions">
        <button
          type="button"
          className="auth-button auth-button-secondary"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : previewUrl ? 'Replace photo' : 'Upload photo'}
        </button>
        {previewUrl ? (
          <button type="button" disabled={disabled || uploading} onClick={handleRemove}>
            Remove
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        id="venue-image-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        disabled={disabled || uploading}
        onChange={handleFileChange}
      />

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}
    </div>
  );
}
