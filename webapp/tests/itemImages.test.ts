import { beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({ uploadBytes: vi.fn(), getDownloadURL: vi.fn(), deleteObject: vi.fn(), auth: { currentUser: { uid: 'owner' } as { uid: string } | null } }));
vi.mock('../src/core/firebase', () => ({ auth: sdk.auth }));
vi.mock('firebase/storage', () => ({ ...sdk, getStorage: () => ({}), ref: (_storage: unknown, path: string) => ({ path }) }));
import { uploadItemImage, validateImageFile } from '../src/data/itemImages';

beforeEach(() => {
  vi.clearAllMocks(); sdk.auth.currentUser = { uid: 'owner' };
  sdk.uploadBytes.mockResolvedValue(undefined); sdk.getDownloadURL.mockResolvedValue('https://example.com/image.jpg'); sdk.deleteObject.mockResolvedValue(undefined);
});

describe('photo upload', () => {
  it('rejects unsupported, empty, or oversized source files', () => {
    for (const file of [{ type: 'image/svg+xml', size: 100 }, { type: 'image/jpeg', size: 0 }, { type: 'image/png', size: 11 * 1024 * 1024 }]) expect(() => validateImageFile(file)).toThrow();
    expect(() => validateImageFile({ type: 'image/webp', size: 1000 })).not.toThrow();
  });
  it('uploads under the signed-in owner and can discard an uncommitted image', async () => {
    const result = await uploadItemImage(new Blob(['photo'], { type: 'image/jpeg' }));
    expect(sdk.uploadBytes.mock.calls[0][0].path).toMatch(/^users\/owner\/itinerary-images\/.+\.jpg$/);
    expect(result.url).toBe('https://example.com/image.jpg');
    await result.discard(); expect(sdk.deleteObject).toHaveBeenCalledOnce();
  });
  it('cleans up an upload if obtaining its download URL fails', async () => {
    sdk.getDownloadURL.mockRejectedValueOnce(new Error('Unavailable'));
    await expect(uploadItemImage(new Blob(['photo'], { type: 'image/jpeg' }))).rejects.toThrow('Unavailable');
    expect(sdk.deleteObject).toHaveBeenCalledOnce();
  });
  it('rejects anonymous uploads before contacting storage', async () => {
    sdk.auth.currentUser = null;
    await expect(uploadItemImage(new Blob(['photo'], { type: 'image/jpeg' }))).rejects.toThrow('Sign in');
    expect(sdk.uploadBytes).not.toHaveBeenCalled();
  });
});
