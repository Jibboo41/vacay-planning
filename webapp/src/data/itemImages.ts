import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth } from '../core/firebase';

const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function validateImageFile(file: Pick<File, 'type' | 'size'>) {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new Error('Choose a JPG, PNG, WebP, or GIF photo.');
  if (file.size > MAX_SOURCE_BYTES) throw new Error('Choose a photo smaller than 10 MB.');
  if (!file.size) throw new Error('This photo is empty. Choose another file.');
}

/** Resize locally before upload; the trip document stores only the download URL. */
export async function prepareItemImage(file: File): Promise<Blob> {
  validateImageFile(file);
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  try {
    image.src = objectUrl;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('The photo could not be opened.');
    const scale = Math.min(1, 960 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Photo processing is unavailable in this browser.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    if (!blob || blob.size > MAX_UPLOAD_BYTES) throw new Error('This photo is too large to save. Try a smaller image.');
    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function uploadItemImage(blob: Blob): Promise<{ url: string; discard: () => Promise<void> }> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in again to upload a photo.');
  if (!blob.size || blob.size > MAX_UPLOAD_BYTES || blob.type !== 'image/jpeg') throw new Error('Choose another photo and try again.');
  const imageRef = ref(getStorage(), `users/${user.uid}/itinerary-images/${crypto.randomUUID()}.jpg`);
  await uploadBytes(imageRef, blob, { contentType: 'image/jpeg', cacheControl: 'private,max-age=31536000' });
  try {
    const url = await getDownloadURL(imageRef);
    return { url, discard: () => deleteObject(imageRef) };
  } catch (error) {
    await deleteObject(imageRef).catch(() => {});
    throw error;
  }
}
