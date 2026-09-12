/**
 * Dedicated PageExtractor for Compare Anything (Day 1)
 * Extracts structured, non-destructive page snapshots (~3,500 chars max)
 * prioritizing structured data, tables, specs, headings, lists, and paragraphs.
 */

import { PageSnapshot, MAX_CONTENT_CHARS } from '../models';
import { getDomain } from '../utils/urlUtils';
import { sanitizeText, smartTruncate } from '../utils/sanitize';
import {
  removeNoiseElements,
  extractJsonLdData,
  extractMetaProperties,
  extractTables,
  extractSpecifications,
  extractHeadings,
  extractImportantLists,
  extractKeyParagraphs
} from './domUtils';

export class PageExtractor {
  /**
   * Extracts a structured PageSnapshot from a Document object.
   * Non-destructive: clones root before DOM manipulation.
   */
  public static extractFromDocument(
    doc: Document,
    pageId: string = `page-${Date.now()}`
  ): PageSnapshot {
    const rawUrl = doc.location?.href || '';
    const domain = getDomain(rawUrl);

    // 1. Structured Data & Meta (Highest Priority)
    const jsonLd = extractJsonLdData(doc);
    const meta = extractMetaProperties(doc);

    // Combine structured data
    const structuredParts: string[] = [];
    if (jsonLd) {
      structuredParts.push(`--- Schema / JSON-LD ---\n${jsonLd}`);
    }
    if (meta.metaSummary) {
      structuredParts.push(`--- Metadata ---\n${meta.metaSummary}`);
    }
    const structuredData = structuredParts.join('\n\n');

    // 2. Clone body or main container to safely remove noise without altering the page
    const sourceEl = doc.body || doc.documentElement;
    const clonedEl = sourceEl.cloneNode(true) as Element;
    removeNoiseElements(clonedEl);

    // 3. Extract prioritized content sections
    const tables = extractTables(clonedEl);
    const specs = extractSpecifications(clonedEl);
    const headings = extractHeadings(clonedEl);
    const lists = extractImportantLists(clonedEl);
    const paragraphs = extractKeyParagraphs(clonedEl);

    // 4. Intelligent Truncation Assembly
    // Budget: Total content target is ~3,500 chars.
    // Structured data gets first claim on the budget.
    const structuredLength = structuredData.length;
    const remainingBudget = Math.max(500, MAX_CONTENT_CHARS - structuredLength);

    const textSections: string[] = [];
    let currentLength = 0;

    const tryAppendSection = (title: string, items: string[]): void => {
      if (items.length === 0 || currentLength >= remainingBudget) return;

      const sectionHeader = `--- ${title} ---`;
      const available = remainingBudget - currentLength - sectionHeader.length - 2;
      if (available <= 50) return;

      const includedItems: string[] = [];
      let sectionChars = 0;

      for (const item of items) {
        if (sectionChars + item.length + 1 <= available) {
          includedItems.push(item);
          sectionChars += item.length + 1;
        } else {
          // Truncate last item if there is still substantial room
          const room = available - sectionChars - 5;
          if (room > 60) {
            includedItems.push(smartTruncate(item, room));
            sectionChars += room;
          }
          break;
        }
      }

      if (includedItems.length > 0) {
        const sectionContent = `${sectionHeader}\n${includedItems.join('\n')}`;
        textSections.push(sectionContent);
        currentLength += sectionContent.length + 2;
      }
    };

    // Priority Order: Tables -> Specs -> Headings -> Lists -> Body paragraphs
    tryAppendSection('Tables & Data', tables);
    tryAppendSection('Specifications', specs);
    tryAppendSection('Key Headings', headings);
    tryAppendSection('Highlights & Lists', lists);
    tryAppendSection('Main Content', paragraphs);

    const importantText = textSections.join('\n\n');

    // Title & Description resolution
    const title = meta.title || doc.title || domain;
    const description = meta.description || '';

    return {
      id: pageId,
      url: rawUrl,
      domain,
      title: sanitizeText(title),
      description: smartTruncate(sanitizeText(description), 300),
      structuredData: smartTruncate(structuredData, 1500),
      importantText,
      capturedAt: new Date().toISOString()
    };
  }

  /**
   * Execution script to run inside the active tab via chrome.scripting.executeScript.
   * Self-contained function serialized and run in webpage context.
   */
  public static getInjectedExtractionFunction(): () => PageSnapshot {
    return function extractPageInContext(): PageSnapshot {
      const doc = document;
      const rawUrl = window.location.href;
      
      // Domain
      let domain = window.location.hostname;
      if (domain.startsWith('www.')) domain = domain.slice(4);

      // 1. JSON-LD
      const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
      const ldResults: any[] = [];
      scripts.forEach((s) => {
        try {
          const raw = s.textContent?.trim();
          if (!raw) return;
          const parsed = JSON.parse(raw);
          const items = Array.isArray(parsed)
            ? parsed
            : parsed['@graph'] && Array.isArray(parsed['@graph'])
            ? parsed['@graph']
            : [parsed];
          for (const item of items) {
            if (!item || typeof item !== 'object') continue;
            const summary: Record<string, any> = {};
            if (item['@type']) summary['@type'] = item['@type'];
            if (item.name) summary.name = item.name;
            if (item.title) summary.title = item.title;
            if (item.description) summary.description = item.description;
            if (item.brand) summary.brand = typeof item.brand === 'object' ? item.brand.name : item.brand;
            if (item.offers) {
              const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              if (offer) {
                summary.price = offer.price;
                summary.priceCurrency = offer.priceCurrency;
              }
            }
            if (item.aggregateRating) summary.rating = item.aggregateRating.ratingValue;
            if (Object.keys(summary).length > 1) ldResults.push(summary);
          }
        } catch {
          // ignore
        }
      });

      // 2. Meta
      const title =
        doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        doc.title ||
        domain;
      const description =
        doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
        doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
        '';

      const metaKeys = [
        'og:site_name',
        'og:price:amount',
        'og:price:currency',
        'product:price:amount',
        'product:price:currency'
      ];
      const metaPairs: string[] = [];
      for (const k of metaKeys) {
        const val = doc.querySelector(`meta[property="${k}"], meta[name="${k}"]`)?.getAttribute('content');
        if (val) metaPairs.push(`${k}: ${val.trim()}`);
      }

      const structuredParts: string[] = [];
      if (ldResults.length > 0) {
        structuredParts.push(`--- Schema / JSON-LD ---\n` + JSON.stringify(ldResults.slice(0, 3), null, 2));
      }
      if (metaPairs.length > 0) {
        structuredParts.push(`--- Metadata ---\n` + metaPairs.join('\n'));
      }
      const structuredData = structuredParts.join('\n\n');

      // 3. Clone and prune noise
      const clone = (doc.body || doc.documentElement).cloneNode(true) as HTMLElement;
      const noise = [
        'script', 'style', 'noscript', 'template', 'iframe', 'svg', 'canvas',
        'nav', 'header', 'footer', 'aside', '[role="banner"]', '[role="navigation"]',
        '[role="dialog"]', '[aria-modal="true"]', '[class*="cookie" i]', '[id*="cookie" i]',
        '[class*="consent" i]', '[class*="ad-" i]', '[hidden]', '[aria-hidden="true"]'
      ];
      noise.forEach((sel) => {
        clone.querySelectorAll(sel).forEach((el) => el.remove());
      });

      // 4. Tables
      const tables: string[] = [];
      clone.querySelectorAll('table').forEach((t) => {
        const rows = t.querySelectorAll('tr');
        if (rows.length < 2) return;
        const rowStrings: string[] = [];
        rows.forEach((r, idx) => {
          if (idx > 10) return;
          const cells = Array.from(r.querySelectorAll('th, td')).map((c) =>
            (c.textContent || '').replace(/\s+/g, ' ').trim()
          ).filter(Boolean);
          if (cells.length > 0) rowStrings.push(cells.join(' | '));
        });
        if (rowStrings.length > 0) tables.push(rowStrings.join('\n'));
      });

      // 5. Specs (DLs)
      const specs: string[] = [];
      clone.querySelectorAll('dl').forEach((dl) => {
        const children = Array.from(dl.children);
        const pairs: string[] = [];
        for (let i = 0; i < children.length; i++) {
          if (children[i].tagName.toLowerCase() === 'dt') {
            const dt = (children[i].textContent || '').replace(/\s+/g, ' ').trim();
            const ddEl = children[i + 1];
            if (ddEl && ddEl.tagName.toLowerCase() === 'dd') {
              const dd = (ddEl.textContent || '').replace(/\s+/g, ' ').trim();
              if (dt && dd) pairs.push(`${dt}: ${dd}`);
            }
          }
        }
        if (pairs.length > 0) specs.push(pairs.slice(0, 10).join('\n'));
      });

      // 6. Headings
      const headings: string[] = [];
      clone.querySelectorAll('h1, h2, h3').forEach((h) => {
        const txt = (h.textContent || '').replace(/\s+/g, ' ').trim();
        if (txt.length > 2 && txt.length < 150) headings.push(`${h.tagName}: ${txt}`);
      });

      // 7. Important Lists
      const lists: string[] = [];
      clone.querySelectorAll('ul, ol').forEach((l) => {
        const items = Array.from(l.querySelectorAll('li'))
          .map((li) => (li.textContent || '').replace(/\s+/g, ' ').trim())
          .filter((txt) => txt.length > 5 && txt.length < 150);
        if (items.length >= 2 && items.length <= 15) {
          lists.push(items.map((i) => `• ${i}`).join('\n'));
        }
      });

      // 8. Main Paragraphs
      const paragraphs: string[] = [];
      const mainEl = clone.querySelector('main, article, [role="main"]') || clone;
      mainEl.querySelectorAll('p').forEach((p) => {
        const txt = (p.textContent || '').replace(/\s+/g, ' ').trim();
        if (txt.length > 30 && txt.length < 500) paragraphs.push(txt);
      });

      // Assemble content under 3,500 chars
      const MAX_TOTAL = 3500;
      const budget = Math.max(500, MAX_TOTAL - structuredData.length);
      const sections: string[] = [];
      let totalLength = 0;

      const append = (label: string, items: string[]) => {
        if (items.length === 0 || totalLength >= budget) return;
        const header = `--- ${label} ---`;
        const room = budget - totalLength - header.length - 2;
        if (room <= 40) return;
        const cur: string[] = [];
        let curChars = 0;
        for (const it of items) {
          if (curChars + it.length + 1 <= room) {
            cur.push(it);
            curChars += it.length + 1;
          } else {
            const rem = room - curChars - 5;
            if (rem > 40) {
              cur.push(it.slice(0, rem) + '...');
              curChars += rem;
            }
            break;
          }
        }
        if (cur.length > 0) {
          const s = `${header}\n${cur.join('\n')}`;
          sections.push(s);
          totalLength += s.length + 2;
        }
      };

      append('Tables & Data', tables);
      append('Specifications', specs);
      append('Key Headings', headings);
      append('Highlights & Lists', lists);
      append('Main Content', paragraphs);

      return {
        id: `page-${Date.now()}`,
        url: rawUrl,
        domain,
        title: title.replace(/\s+/g, ' ').trim(),
        description: description.replace(/\s+/g, ' ').trim().slice(0, 300),
        structuredData: structuredData.slice(0, 1500),
        importantText: sections.join('\n\n'),
        capturedAt: new Date().toISOString()
      };
    };
  }
}
