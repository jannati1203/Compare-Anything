# Privacy Policy for Compare Anything

**Effective Date:** September 2026  
**Product:** Compare Anything – AI Web Comparison  
**Tagline:** *"Stop switching between tabs. Compare them."*  

---

## 1. Introduction & Purpose
Compare Anything is a browser extension and AI service designed to help you compare information across 2 to 4 webpages you explicitly select. It creates clean side-by-side comparison tables based strictly on the factual evidence found on those pages.

We believe your web browsing belongs to you. Compare Anything is built from the ground up with data minimization, transparency, and strict privacy safeguards.

---

## 2. When and How We Access Your Pages
* **Explicit User Selection Only**: Compare Anything only accesses a webpage when you explicitly click **"ADD TO COMPARISON"** while viewing that tab.
* **No Automatic Scanning**: The extension **never** scans your browser history, bookmarks, open tabs, background tabs, or search queries.
* **No Routine Tab Access**: We use Chrome's standard `activeTab` permission model. Unless you actively invoke the extension on the current tab, the extension cannot see, inspect, or monitor what you are viewing.

---

## 3. What Information Is Extracted
When you click **"ADD TO COMPARISON"**, the extension locally extracts only structured, visible content relevant to comparison:
* Page title, canonical URL, and domain.
* Visible structured attributes (e.g., product specifications, comparison tables, headings, feature lists, pricing, and definition lists).
* Standard structured metadata (e.g., JSON-LD schema or OpenGraph product meta).

**What We Do Not Extract:**
* We do **not** extract full HTML documents, scripts, stylesheets, tracking pixels, ads, user cookies, session tokens, passwords, or personal login information.
* Text extraction is bounded locally to approximately 3,500 characters per page to prevent transmission of unnecessary data.

---

## 4. When Information Is Sent to the Backend
Extracted page snapshots remain exclusively in your local browser storage (`chrome.storage.local`) until you explicitly click **"COMPARE X PAGES"**. Only at that exact moment is a structured comparison request transmitted over an encrypted HTTPS connection to our comparison backend API.

If you close the extension or click **"Clear"** without clicking Compare, no data is sent to the server.

---

## 5. AI Processing & Third-Party Providers
To generate the structured comparison matrix:
* The backend sends the extracted, sanitized text snippets to our secure AI inference provider (such as Groq or OpenRouter).
* The AI operates under strict system rules to evaluate **only** the factual evidence explicitly contained in your snapshots. The AI does not browse the web, access external databases, or use general assumptions to invent missing facts.
* API keys and credentials are kept strictly server-side; they are never bundled into the Chrome extension.

---

## 6. Data Retention & Storage
* **No Database Storage**: The Compare Anything v1 backend operates completely statelessly. We do **not** operate a database of user comparisons, browsing history, or raw webpage text.
* **Local Control**: Your selected pages and comparison results reside locally on your device in `chrome.storage.local`. Clicking **"Start New Comparison"** or clearing the extension immediately deletes your current session data from your browser.
* **Operational Logs**: Backend servers maintain temporary, minimal operational logs strictly for diagnostics, error tracking, and performance monitoring. Operational logs do **not** log raw webpage content, user goals, or personal identifiers.

---

## 7. No Accounts, No Tracking, No Advertising
* **No User Accounts**: You are never asked to register, log in, or provide your name, email address, phone number, or payment details.
* **Anonymous Installation ID**: The extension generates a random anonymous identifier (`installId`) stored locally in your browser. This identifier is used solely for in-memory rate limiting and abuse prevention (e.g., preventing automated spam requests).
* **No Advertising or Data Selling**: We do **not** sell, rent, monetize, or share your data with advertisers or data brokers. There are no third-party ad trackers in the extension.

---

## 8. Security Practices
* All network transmissions between the extension and backend use industry-standard HTTPS encryption.
* The extension does not use `eval()`, remote executable code, or dynamic script injection.
* Input validation and strict DOM sanitization are performed locally before rendering any content.

---

## 9. Contact and Support
If you have questions, feedback, or concerns regarding this Privacy Policy or Compare Anything's data practices, please contact us:

* **Support Page**: [docs/support.html](support.html)
* **GitHub Issues**: https://github.com/compare-anything/compare-anything/issues
* **Email**: support@compareanything.app
