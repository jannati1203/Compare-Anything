import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { PageExtractor } from '../src/extractors/pageExtractor';
import { MAX_CONTENT_CHARS } from '../src/models';

describe('PageExtractor', () => {
  it('extracts JSON-LD schema, tables, and specifications correctly', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SuperPhone Pro Max</title>
          <meta name="description" content="The ultimate smartphone with titanium build" />
          <meta property="og:site_name" content="TechShop" />
          <script type="application/ld+json">
            {
              "@type": "Product",
              "name": "SuperPhone Pro Max",
              "brand": "TechCorp",
              "offers": {
                "price": "999",
                "priceCurrency": "USD"
              },
              "aggregateRating": {
                "ratingValue": "4.8",
                "reviewCount": "120"
              }
            }
          </script>
        </head>
        <body>
          <nav>
            <a href="/">Home</a>
            <a href="/cart">Cart</a>
          </nav>
          <div class="cookie-banner">Accept all cookies</div>
          <main>
            <h1>SuperPhone Pro Max</h1>
            <p>Experience the next generation of mobile computing.</p>

            <table id="tech-specs">
              <tr><th>Specification</th><th>Details</th></tr>
              <tr><td>Screen</td><td>6.7 inch Super Retina XDR</td></tr>
              <tr><td>Weight</td><td>221 grams</td></tr>
            </table>

            <dl>
              <dt>Battery Life</dt>
              <dd>Up to 29 hours video playback</dd>
              <dt>Processor</dt>
              <dd>A17 Pro Bionic</dd>
            </dl>

            <ul>
              <li>Titanium design with textured matte glass back</li>
              <li>Action button to access your favorite feature</li>
            </ul>
          </main>
          <footer>
            <p>Copyright 2026 TechCorp Inc.</p>
          </footer>
        </body>
      </html>
    `;

    const dom = new JSDOM(html, { url: 'https://techshop.com/products/superphone' });
    const snapshot = PageExtractor.extractFromDocument(dom.window.document, 'test-p1');

    expect(snapshot.id).toBe('test-p1');
    expect(snapshot.domain).toBe('techshop.com');
    expect(snapshot.title).toBe('SuperPhone Pro Max');
    expect(snapshot.description).toContain('ultimate smartphone');

    // Verify structured data contains parsed JSON-LD and metadata
    expect(snapshot.structuredData).toContain('SuperPhone Pro Max');
    expect(snapshot.structuredData).toContain('TechCorp');
    expect(snapshot.structuredData).toContain('999');
    expect(snapshot.structuredData).toContain('og:site_name: TechShop');

    // Verify tables extracted
    expect(snapshot.importantText).toContain('Screen | 6.7 inch Super Retina XDR');
    expect(snapshot.importantText).toContain('Weight | 221 grams');

    // Verify DL specs extracted
    expect(snapshot.importantText).toContain('Battery Life: Up to 29 hours video playback');
    expect(snapshot.importantText).toContain('Processor: A17 Pro Bionic');

    // Verify list highlights
    expect(snapshot.importantText).toContain('Titanium design');

    // Verify noise elements were ignored / stripped
    expect(snapshot.importantText).not.toContain('Accept all cookies');
    expect(snapshot.importantText).not.toContain('Copyright 2026 TechCorp Inc.');
    expect(snapshot.importantText).not.toContain('Cart');
  });

  it('respects character limit budget and prioritizes structured content', () => {
    // Generate an enormous page with tons of repeated paragraphs
    const longParagraph = 'This is a very long text paragraph that describes features in excruciating detail. '.repeat(100);
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Heavy Content Page</title>
          <script type="application/ld+json">
            {
              "@type": "Product",
              "name": "High Priority Product",
              "offers": { "price": "149" }
            }
          </script>
        </head>
        <body>
          <main>
            <table>
              <tr><th>Core Feature</th><th>Value</th></tr>
              <tr><td>High Priority Spec</td><td>Important Value</td></tr>
            </table>
            <p>${longParagraph}</p>
            <p>${longParagraph}</p>
          </main>
        </body>
      </html>
    `;

    const dom = new JSDOM(html, { url: 'https://example.com/heavy' });
    const snapshot = PageExtractor.extractFromDocument(dom.window.document, 'test-heavy');

    // Total length of extracted text should stay within reasonable bounds around ~3500
    const totalChars = snapshot.structuredData.length + snapshot.importantText.length;
    expect(totalChars).toBeLessThanOrEqual(MAX_CONTENT_CHARS + 500);

    // High priority structured info and tables must be preserved
    expect(snapshot.structuredData).toContain('High Priority Product');
    expect(snapshot.importantText).toContain('High Priority Spec | Important Value');
  });
});
