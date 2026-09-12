/**
 * DOM extraction and sanitization utilities for Compare Anything
 */

import { sanitizeText } from '../utils/sanitize';

const NOISE_SELECTORS = [
  'script',
  'style',
  'noscript',
  'template',
  'iframe',
  'svg',
  'canvas',
  'nav',
  'header',
  'footer',
  'aside',
  '[role="banner"]',
  '[role="navigation"]',
  '[role="complementary"]',
  '[role="dialog"]',
  '[aria-modal="true"]',
  '.cookie-banner',
  '#cookie-notice',
  '.consent-banner',
  '[class*="cookie" i]',
  '[id*="cookie" i]',
  '[class*="consent" i]',
  '[id*="consent" i]',
  '[class*="advertisement" i]',
  '[id*="ad-" i]',
  '[class*="ad-" i]',
  '[aria-hidden="true"]',
  '[hidden]'
];

/**
 * Strips noise elements from a cloned DOM element.
 */
export function removeNoiseElements(root: Element): void {
  for (const selector of NOISE_SELECTORS) {
    try {
      const elements = root.querySelectorAll(selector);
      elements.forEach((el) => el.remove());
    } catch {
      // Ignore invalid querySelector edge cases
    }
  }
}

/**
 * Safely parses and summarizes JSON-LD schema.org structured data.
 */
export function extractJsonLdData(doc: Document): string {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  const results: any[] = [];

  scripts.forEach((script) => {
    try {
      const rawText = script.textContent?.trim();
      if (!rawText) return;
      const parsed = JSON.parse(rawText);

      // Handle @graph array or direct object
      const items = Array.isArray(parsed)
        ? parsed
        : parsed['@graph'] && Array.isArray(parsed['@graph'])
        ? parsed['@graph']
        : [parsed];

      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const type = item['@type'] || item['type'];

        // We are interested in schemas representing items, products, articles, jobs, courses, hotels, etc.
        const summary: Record<string, any> = {};
        if (type) summary['@type'] = type;
        if (item.name) summary.name = item.name;
        if (item.title) summary.title = item.title;
        if (item.description) summary.description = item.description;
        if (item.brand) {
          summary.brand = typeof item.brand === 'object' ? item.brand.name : item.brand;
        }
        if (item.offers) {
          const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
          if (offers && typeof offers === 'object') {
            summary.price = offers.price;
            summary.priceCurrency = offers.priceCurrency;
            summary.availability = offers.availability;
          }
        }
        if (item.aggregateRating) {
          summary.rating = item.aggregateRating.ratingValue;
          summary.reviewCount = item.aggregateRating.reviewCount;
        }
        if (item.review) {
          summary.reviewCount = Array.isArray(item.review) ? item.review.length : 1;
        }
        if (item.amenityFeature) {
          summary.amenities = Array.isArray(item.amenityFeature)
            ? item.amenityFeature.map((a: any) => a.name || a.value || a).slice(0, 10)
            : item.amenityFeature;
        }

        // Only include if meaningful data was found
        if (Object.keys(summary).length > 1) {
          results.push(summary);
        }
      }
    } catch {
      // Ignore unparseable JSON-LD
    }
  });

  if (results.length === 0) return '';
  return JSON.stringify(results.slice(0, 3), null, 2);
}

/**
 * Extracts meta tags like title, description, and OpenGraph / product tags.
 */
export function extractMetaProperties(doc: Document): {
  title: string;
  description: string;
  metaSummary: string;
} {
  const title =
    doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    doc.querySelector('title')?.textContent ||
    '';

  const description =
    doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
    '';

  const metaKeys = [
    'og:site_name',
    'og:price:amount',
    'og:price:currency',
    'product:price:amount',
    'product:price:currency',
    'article:published_time',
    'article:author'
  ];

  const metaPairs: string[] = [];
  for (const key of metaKeys) {
    const el = doc.querySelector(`meta[property="${key}"], meta[name="${key}"]`);
    const val = el?.getAttribute('content')?.trim();
    if (val) {
      metaPairs.push(`${key}: ${val}`);
    }
  }

  return {
    title: sanitizeText(title),
    description: sanitizeText(description),
    metaSummary: metaPairs.join('\n')
  };
}

/**
 * Extracts tabular data from HTML tables into readable text.
 */
export function extractTables(root: Element): string[] {
  const tables = root.querySelectorAll('table');
  const tableOutputs: string[] = [];

  tables.forEach((table) => {
    // Skip empty or tiny decorative tables
    const rows = table.querySelectorAll('tr');
    if (rows.length < 2) return;

    const rowStrings: string[] = [];
    rows.forEach((row, rowIndex) => {
      if (rowIndex > 15) return; // Limit rows per table to prevent bloat
      const cells = row.querySelectorAll('th, td');
      const cellTexts: string[] = [];
      cells.forEach((cell) => {
        const text = sanitizeText(cell.textContent || '');
        if (text) cellTexts.push(text);
      });
      if (cellTexts.length > 0) {
        rowStrings.push(cellTexts.join(' | '));
      }
    });

    if (rowStrings.length > 0) {
      tableOutputs.push(rowStrings.join('\n'));
    }
  });

  return tableOutputs;
}

/**
 * Extracts specification sections such as <dl> definition lists and spec containers.
 */
export function extractSpecifications(root: Element): string[] {
  const specOutputs: string[] = [];

  // Definition lists (<dl><dt>Key</dt><dd>Value</dd></dl>)
  const dls = root.querySelectorAll('dl');
  dls.forEach((dl) => {
    const pairs: string[] = [];
    const children = Array.from(dl.children);
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.tagName.toLowerCase() === 'dt') {
        const key = sanitizeText(child.textContent || '');
        const next = children[i + 1];
        if (next && next.tagName.toLowerCase() === 'dd') {
          const val = sanitizeText(next.textContent || '');
          if (key && val) {
            pairs.push(`${key}: ${val}`);
          }
        }
      }
    }
    if (pairs.length > 0) {
      specOutputs.push(pairs.slice(0, 15).join('\n'));
    }
  });

  // Common spec selectors
  const specSelectors = [
    '[class*="spec" i]',
    '[id*="spec" i]',
    '[class*="tech-detail" i]',
    '[class*="feature" i]',
    '[class*="attribute" i]'
  ];

  for (const selector of specSelectors) {
    try {
      const containers = root.querySelectorAll(selector);
      containers.forEach((container) => {
        // Only consider if not already processed inside table or dl
        if (container.closest('table') || container.closest('dl')) return;
        const text = sanitizeText(container.textContent || '');
        if (text && text.length > 20 && text.length < 500) {
          specOutputs.push(text);
        }
      });
    } catch {
      // Ignore query errors
    }
  }

  return specOutputs;
}

/**
 * Extracts header hierarchy (h1, h2, h3).
 */
export function extractHeadings(root: Element): string[] {
  const headingEls = root.querySelectorAll('h1, h2, h3');
  const headings: string[] = [];

  headingEls.forEach((h) => {
    const text = sanitizeText(h.textContent || '');
    if (text && text.length > 2 && text.length < 150) {
      headings.push(`${h.tagName}: ${text}`);
    }
  });

  return headings;
}

/**
 * Extracts visible list items from ul/ol inside main/article content.
 */
export function extractImportantLists(root: Element): string[] {
  const lists = root.querySelectorAll('ul, ol');
  const listOutputs: string[] = [];

  lists.forEach((list) => {
    // Avoid lists with too many items (likely navigation or directory)
    const items = list.querySelectorAll('li');
    if (items.length < 2 || items.length > 20) return;

    const itemTexts: string[] = [];
    items.forEach((item) => {
      const text = sanitizeText(item.textContent || '');
      if (text && text.length > 5 && text.length < 200) {
        itemTexts.push(`• ${text}`);
      }
    });

    if (itemTexts.length > 0) {
      listOutputs.push(itemTexts.join('\n'));
    }
  });

  return listOutputs;
}

/**
 * Extracts meaningful body paragraphs from article/main content.
 */
export function extractKeyParagraphs(root: Element): string[] {
  // Prefer <main> or <article> if available
  const mainEl = root.querySelector('main, article, [role="main"]') || root;
  const pEls = mainEl.querySelectorAll('p');
  const paragraphs: string[] = [];

  pEls.forEach((p) => {
    const text = sanitizeText(p.textContent || '');
    // Filter out very short snippets or disclaimers
    if (text.length > 30 && text.length < 1000) {
      paragraphs.push(text);
    }
  });

  return paragraphs;
}
