# Compare Anything Support

**Tagline:** *"Stop switching between tabs. Compare them."*

## About Compare Anything
Compare Anything allows you to select 2 to 4 webpages and receive a clean, structured, evidence-based AI comparison matrix with zero tabs juggling.

---

## How to Use
1. Open any webpage you want to compare (Product, Job, Course, Plan, Hotel).
2. Click the **Compare Anything** extension icon.
3. Click **"Add Current Page"** (up to 4 pages total).
4. *(Optional)* Enter your priority or goal (e.g., *"Which laptop is best for battery life under $1,000?"*).
5. Click **"Compare Pages"**. Your visual comparison dashboard will open automatically.

---

## Common Problems & Limitations

### 1. Page Extraction Limitations
Compare Anything reads structured specifications, tables, definition lists, headings, and JSON-LD schema up to ~3,500 characters per page.
* Pages behind authentication or paywalls cannot be read without active session access.
* Canvas-only renderings, images without alt text, or PDF viewers have limited text extraction.

### 2. Why does a field show "Not stated"?
Compare Anything enforces strict zero-hallucination rules. If a manufacturer or website omits a specification, we report `"Not stated"` rather than inventing details.

### 3. Why is there "No clear winner"?
When pages lack sufficient comparable evidence or the options are equally balanced, the engine reports `"No clear winner"` with an objective factual explanation.

### 4. Rate Limits & Availability
To guarantee reliability and prevent abuse without requiring accounts, the free service is rate-limited to:
* 10 comparisons per installation per day
* 30 comparisons per IP address per hour

---

## Privacy
Compare Anything accesses pages only after explicit user interaction. It never scans your browsing history or background tabs. Read our full [Privacy Policy](PRIVACY.md).

---

## Contact & Support
* **GitHub Repository & Issues**: [https://github.com/compare-anything/compare-anything/issues](https://github.com/compare-anything/compare-anything/issues)
* **Email**: `support@compareanything.app`
