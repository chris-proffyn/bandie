import { useRef, useState, type ChangeEvent } from 'react';
import { removeUserProfileImage, removeUserProfileImageForUser, uploadUserProfileImage, uploadUserProfileImageForUser } from '@bandie/data';

type UserAvatarUploadFieldProps = {
  label?: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  targetUserId?: string;
};

export function UserAvatarUploadField({
  label = 'Profile photo',
  hint = 'Square photo works best. JPEG, PNG, WebP or GIF up to 5 MB.',
  value,
  onChange,
  targetUserId,
}: UserAvatarUploadFieldProps) {
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
      const publicUrl = targetUserId
        ? await uploadUserProfileImageForUser(targetUserId, file)
        : await uploadUserProfileImage(file);
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
      if (targetUserId) {
        await removeUserProfileImageForUser(targetUserId);
      } else {
        await removeUserProfileImage();
      }
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
        <label htmlFor="avatar-upload">{label}</label>
        <p className="profile-image-hint">{hint}</p>
      </div>

      {value ? (
        <div className="profile-image-preview profile-image-preview-logo user-avatar-preview">
          <img src={value} alt="Profile preview" />
        </div>
      ) : (
        <div className="profile-image-placeholder">No profile photo yet</div>
      )}

      <div className="profile-editor-inline-actions">
        <button
          type="button"
          className="auth-button auth-button-secondary"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : value ? 'Replace photo' : 'Upload photo'}
        </button>
        {value ? (
          <button type="button" disabled={uploading} onClick={handleRemove}>
            Remove
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        id="avatar-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={handleFileChange}
      />

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}
    </div>
  );
}
