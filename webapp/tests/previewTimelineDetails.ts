export * from '../src/core/timelineDetails';
import { validateImageUrl as validateProductionUrl } from '../src/core/timelineDetails';

// The local Storage double returns inline JPEGs so uploads survive a page reload.
// Production continues to require HTTPS links.
export function validateImageUrl(value: string): string {
  return /^data:image\/jpeg;base64,/.test(value) ? value : validateProductionUrl(value);
}
