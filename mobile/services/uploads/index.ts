import { apiRequest } from '../api/client';
import { secureAuthStorage } from '../auth/secureStorage';

export type UploadAsset = { uri: string; name: string; type: string };

export async function uploadProfileImage(userId: string, asset: UploadAsset) {
  if (!userId.trim() || !asset.uri.trim() || !asset.name.trim() || !asset.type.startsWith('image/')) {
    throw new Error('A valid profile image is required.');
  }
  const form = new FormData();
  form.append('image', { uri: asset.uri, name: asset.name, type: asset.type } as unknown as Blob);
  return apiRequest<{ imageUrl: string }>(`/api/v1/users/${encodeURIComponent(userId)}/profile-image`, {
    method: 'POST',
    body: form,
    accessToken: (await secureAuthStorage.getAccessToken()) ?? undefined,
  });
}
