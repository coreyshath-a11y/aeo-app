import { z } from 'zod';

export const urlSchema = z
  .string()
  .min(1, 'Please enter a URL')
  .transform((val) => {
    // Add https:// if no protocol
    if (!/^https?:\/\//i.test(val)) {
      return `https://${val}`;
    }
    return val;
  })
  .pipe(z.string().url('Please enter a valid URL'));

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Lowercase hostname
    let normalized = `${parsed.protocol}//${parsed.hostname.toLowerCase()}`;
    // Remove www.
    normalized = normalized.replace('://www.', '://');
    // Add path (remove trailing slash unless it's just "/")
    let path = parsed.pathname;
    if (path !== '/' && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    normalized += path;
    return normalized;
  } catch {
    return url.toLowerCase().replace(/\/+$/, '');
  }
}

export function getDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function isSameOrigin(url1: string, url2: string): boolean {
  try {
    const a = new URL(url1);
    const b = new URL(url2);
    return a.origin === b.origin;
  } catch {
    return false;
  }
}
