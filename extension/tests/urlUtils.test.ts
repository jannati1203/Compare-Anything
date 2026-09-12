import { describe, it, expect } from 'vitest';
import { normalizeUrl, getDomain, isUnsupportedUrl } from '../src/utils/urlUtils';

describe('urlUtils', () => {
  it('extracts clean domain', () => {
    expect(getDomain('https://www.apple.com/iphone/')).toBe('apple.com');
    expect(getDomain('https://store.google.com/product/pixel')).toBe('store.google.com');
    expect(getDomain('http://localhost:3000')).toBe('localhost');
  });

  it('normalizes URLs by stripping tracking params, hashes, and trailing slashes', () => {
    const raw = 'https://example.com/product/?utm_source=twitter&utm_medium=social#specs';
    expect(normalizeUrl(raw)).toBe('https://example.com/product');

    const raw2 = 'https://example.com/item/?ref=123&fbclid=xyz';
    expect(normalizeUrl(raw2)).toBe('https://example.com/item');
  });

  it('detects unsupported browser internal URLs', () => {
    expect(isUnsupportedUrl('chrome://settings')).toBe(true);
    expect(isUnsupportedUrl('chrome://extensions')).toBe(true);
    expect(isUnsupportedUrl('edge://flags')).toBe(true);
    expect(isUnsupportedUrl('about:blank')).toBe(true);
    expect(isUnsupportedUrl('chrome-extension://abcdef/popup.html')).toBe(true);

    expect(isUnsupportedUrl('https://example.com')).toBe(false);
    expect(isUnsupportedUrl('http://github.com/trending')).toBe(false);
  });
});
