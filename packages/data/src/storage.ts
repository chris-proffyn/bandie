import { getBandieClient } from './context';
import { isCurrentUserAppAdmin } from './membership';

export const PROFILE_IMAGE_BUCKET = 'bandie-profile-images';
export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export type BandProfileImageKind = 'logo' | 'hero';

function extensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      throw new Error('Unsupported image type. Use JPEG, PNG, WebP, or GIF.');
  }
}

function profileImagePath(bandId: string, kind: BandProfileImageKind, extension: string): string {
  return `bands/${bandId}/${kind}.${extension}`;
}

export function validateProfileImageFile(file: File): void {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Unsupported image type. Use JPEG, PNG, WebP, or GIF.');
  }

  if (file.size > PROFILE_IMAGE_MAX_BYTES) {
    throw new Error('Image must be 5 MB or smaller.');
  }
}

export async function uploadUserProfileImage(file: File): Promise<string> {
  validateProfileImageFile(file);

  const client = getBandieClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error('Must be signed in to upload images.');
  }

  const extension = extensionForMimeType(file.type);
  const path = `users/${user.id}/avatar.${extension}`;

  const { error: uploadError } = await client.storage.from(PROFILE_IMAGE_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: '3600',
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = client.storage.from(PROFILE_IMAGE_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function removeUserProfileImage(): Promise<void> {
  const client = getBandieClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error('Must be signed in to remove images.');
  }

  const folderPath = `users/${user.id}`;
  const { data: files, error: listError } = await client.storage
    .from(PROFILE_IMAGE_BUCKET)
    .list(folderPath);

  if (listError) {
    throw new Error(listError.message);
  }

  const matches = (files ?? []).filter((file) => file.name.startsWith('avatar.'));
  if (!matches.length) {
    return;
  }

  const paths = matches.map((file) => `${folderPath}/${file.name}`);
  const { error: removeError } = await client.storage.from(PROFILE_IMAGE_BUCKET).remove(paths);

  if (removeError) {
    throw new Error(removeError.message);
  }
}

export async function uploadUserProfileImageForUser(userId: string, file: File): Promise<string> {
  if (!(await isCurrentUserAppAdmin())) {
    throw new Error('Only app admins can upload images for another user.');
  }

  validateProfileImageFile(file);

  const client = getBandieClient();
  const extension = extensionForMimeType(file.type);
  const path = `users/${userId}/avatar.${extension}`;

  const { error: uploadError } = await client.storage.from(PROFILE_IMAGE_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: '3600',
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = client.storage.from(PROFILE_IMAGE_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function removeUserProfileImageForUser(userId: string): Promise<void> {
  if (!(await isCurrentUserAppAdmin())) {
    throw new Error('Only app admins can remove images for another user.');
  }

  const client = getBandieClient();
  const folderPath = `users/${userId}`;
  const { data: files, error: listError } = await client.storage
    .from(PROFILE_IMAGE_BUCKET)
    .list(folderPath);

  if (listError) {
    throw new Error(listError.message);
  }

  const matches = (files ?? []).filter((file) => file.name.startsWith('avatar.'));
  if (!matches.length) {
    return;
  }

  const paths = matches.map((file) => `${folderPath}/${file.name}`);
  const { error: removeError } = await client.storage.from(PROFILE_IMAGE_BUCKET).remove(paths);

  if (removeError) {
    throw new Error(removeError.message);
  }
}

export async function uploadBandProfileImage(
  bandId: string,
  kind: BandProfileImageKind,
  file: File,
): Promise<string> {
  validateProfileImageFile(file);

  const client = getBandieClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error('Must be signed in to upload images.');
  }

  const extension = extensionForMimeType(file.type);
  const path = profileImagePath(bandId, kind, extension);

  const { error: uploadError } = await client.storage.from(PROFILE_IMAGE_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: '3600',
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = client.storage.from(PROFILE_IMAGE_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function removeBandProfileImage(
  bandId: string,
  kind: BandProfileImageKind,
): Promise<void> {
  const client = getBandieClient();
  const folderPath = `bands/${bandId}`;
  const { data: files, error: listError } = await client.storage
    .from(PROFILE_IMAGE_BUCKET)
    .list(folderPath);

  if (listError) {
    throw new Error(listError.message);
  }

  const matches = (files ?? []).filter((file) => file.name.startsWith(`${kind}.`));
  if (!matches.length) {
    return;
  }

  const paths = matches.map((file) => `${folderPath}/${file.name}`);
  const { error: removeError } = await client.storage.from(PROFILE_IMAGE_BUCKET).remove(paths);

  if (removeError) {
    throw new Error(removeError.message);
  }
}
