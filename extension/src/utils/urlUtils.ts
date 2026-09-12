/**
 * URL utility functions for Compare Anything
 */

/**
 * Normalizes URL for duplicate comparison by removing tracking query params and hashes.
 */
export function normalizeUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  try {
    const parsed = new URL(rawUrl.trim());
    // Strip common tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', '_ga', 'mc_cid', 'mc_eid', 'ref', 'source'
    ];
    for (const param of trackingParams) {
      parsed.searchParams.delete(param);
    }
    // Remove hash
    parsed.hash = '';
    
    // Clean trailing slash on path
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    parsed.pathname = pathname;

    return parsed.toString();
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

/**
 * Extracts a readable domain from a URL string.
 */
export function getDomain(rawUrl: string): string {
  if (!rawUrl) return '';
  try {
    const parsed = new URL(rawUrl);
    let hostname = parsed.hostname;
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }
    return hostname;
  } catch {
    return rawUrl;
  }
}

/**
 * Determines whether a URL is unsupported (e.g. internal browser pages).
 */
export function isUnsupportedUrl(rawUrl: string): boolean {
  if (!rawUrl) return true;
  const lower = rawUrl.trim().toLowerCase();
  return (
    lower.startsWith('chrome://') ||
    lower.startsWith('chrome-extension://') ||
    lower.startsWith('edge://') ||
    lower.startsWith('about:') ||
    lower.startsWith('devtools://') ||
    lower.startsWith('view-source:') ||
    lower.startsWith('data:') ||
    lower.startsWith('javascript:')
  );
}
