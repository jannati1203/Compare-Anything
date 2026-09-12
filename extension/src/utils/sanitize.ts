/**
 * Sanitization and security utilities for untrusted webpage text
 */

/**
 * Normalizes text, collapses whitespace, removes non-printable control characters.
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    // Replace non-printable ASCII control characters except \n, \r, \t
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Replace multiple spaces/tabs with single space
    .replace(/[ \t]+/g, ' ')
    // Replace 3 or more consecutive newlines with 2 newlines
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

/**
 * Truncates text cleanly without cutting words in half when possible.
 */
export function smartTruncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  const slice = text.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.8) {
    return slice.slice(0, lastSpace).trim() + '...';
  }
  return slice.trim() + '...';
}
