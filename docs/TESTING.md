# Compare Anything — Comprehensive Test Suite & Verification

This document details the test environment, automated test suites, manual verification flows, multi-category validation, security and privacy audits, and the final **Definition of Done** checklist for **Compare Anything**.

---

## 1. Test Environment

* **Operating System**: Windows 11 (PowerShell & Bash compatible)
* **Node.js**: v20+ (with npm 10+)
* **.NET SDK**: .NET 10.0 (`net10.0`)
* **Browser**: Google Chrome Version 120+ (Manifest V3)
* **AI Engine**: Groq API (`openai/gpt-oss-20b` reasoning model)
* **Local Test Endpoints**:
  - HTTP: `http://127.0.0.1:5123`
  - HTTPS: `https://127.0.0.1:7123`

---

## 2. Automated Test Suites

### Extension Automated Tests (Vitest)
Located in `extension/tests/`. Run with:
```bash
cd extension
npm test
```

**Results: 16 / 16 Passed (5 test files)**
* `tests/pageExtractor.test.ts`:
  - Clones DOM and strips noise (scripts, styles, nav, footer, banners, cookie notices).
  - Prioritizes JSON-LD schemas, specification tables, `<dl>` lists, headings, and bounded to ~3,500 characters.
* `tests/storageService.test.ts`:
  - Manages `chrome.storage.local` workspace lifecycle.
  - Enforces minimum 2 pages, maximum 4 pages.
  - Prevents duplicate URLs.
  - Handles reset and clear operations.
* `tests/apiService.test.ts`:
  - Validates request payload serialization.
  - Handles 200 OK responses, 429 rate limits, and 502 error conditions gracefully.
* `tests/exportUtils.test.ts`:
  - Validates RFC 4180 CSV generation and escaping.
  - Validates formatted plain text clipboard output.
* `tests/urlUtils.test.ts`:
  - Validates safe URL protocol filtering and domain extraction.

---

### Backend Automated Tests (xUnit)
Located in `backend.Tests/`. Run with:
```bash
dotnet test backend.Tests/
```

**Results: 21 / 21 Passed**
* `AIResponseValidatorTests.cs` (7 tests):
  - Validates JSON envelope parsing and structural sanitization.
  - Verifies missing specs map to `"Not stated"`.
  - Verifies inconclusive comparisons map to `bestOverall.itemId = null` ("No clear winner").
  - Strips invalid or hallucinatory item IDs.
* `CompareRequestValidatorTests.cs` (5 tests):
  - Validates minimum 2 pages and maximum 4 pages constraint.
  - Validates URL structure and length limits.
  - Validates per-page extracted text limits (~3,500 chars).
* `ComparisonServiceTests.cs` (5 tests):
  - Validates end-to-end service orchestration.
  - Validates rate-limiter integration and caching logic.
* `PromptBuilderTests.cs` (2 tests):
  - Validates untrusted data isolation inside `<PAGE_SNAPSHOT>` XML boundaries.
  - Validates neutralization of prompt injection attacks.
* `RateLimiterServiceTests.cs` (2 tests):
  - Validates 10 comparisons / installId / day limit.
  - Validates 30 comparisons / IP / hour limit.

---

## 3. Multi-Category Verification Suite

Verified using live test script `scripts/test_multicategory.ps1` against the running production backend:

### Category 1: Products
* **Input**: 3 items (Samsung TV, Xiaomi TV, Sony Bravia TV)
* **Goal**: *"Best option for a student under Tk 80,000"*
* **Discovered Criteria**: Resolution, Display Type, Price, Audio, Connectivity, Warranty, Operating System.
* **Winner Determination**: Evaluated budget, connectivity, and smart OS to identify the optimal student pick.
* **Missing Data Handled**: Samsung TV OS not stated $\rightarrow$ `"Not stated"`.

### Category 2: Job Postings
* **Input**: 2 items (Lead Frontend Engineer vs Fullstack Developer)
* **Goal**: *"Which job offers better compensation and remote flexibility?"*
* **Discovered Criteria**: Salary, Remote Flexibility, PTO, Working Hours, 401k Match, Equipment, Health Insurance, Home Office Stipend.
* **Winner Determination**: `"No clear winner"` (factual compensation inconclusive between equity vs base).
* **Missing Data Handled**: Unstated compensation fields properly flagged.

### Category 3: Courses & Education
* **Input**: 2 items (Software Engineering Bootcamp vs Online B.S. in CS)
* **Goal**: *"Which option is better for a fast career transition?"*
* **Discovered Criteria**: Duration, Tuition, Curriculum Relevance, Career Placement Guarantee.
* **Winner Determination**: Accelerated Bootcamp (16 weeks vs 4 years).
* **Missing Data Handled**: Placement guarantee omitted on university page $\rightarrow$ `"Not stated"`.

---

## 4. Security & Hardening Audit

- [x] **No Secrets in Client**: Extension source code and `extension/dist` scanned with zero matches for API keys or credentials.
- [x] **Zero Server Key Leakage**: Groq and OpenRouter keys reside solely in server environment variables.
- [x] **Safe Logging**: Server logs record only operation duration, token usage counts, and criteria counts — zero user goals or raw page contents logged.
- [x] **XSS & Injection Protection**:
  - Webpage text treated as untrusted passive data.
  - XML escaping for snapshot attributes.
  - No `eval()` or `new Function()` in extension.
  - HTML Canvas share generation runs strictly client-side.
- [x] **Production Headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
- [x] **CORS Enforcement**: Restricted to `chrome-extension://*`, `localhost`, and configured production domains.

---

## 5. Privacy Audit

- [x] **Explicit Action Only**: Webpage content is accessed only when the user clicks **"Add Current Page"**.
- [x] **No History Access**: Extension does not declare `history` permission or read browser history.
- [x] **No All-Tab Access**: Extension does not request `tabs` permission across all domains; utilizes `activeTab`.
- [x] **Stateless Backend**: Zero database storage of comparisons or webpage data.
- [x] **Session Erasure**: Clicking **"Start New Comparison"** or **"Clear"** purges all local storage.

---

## 6. Final Definition of Done Checklist

- [x] 1. Production extension builds cleanly (`npm run build` $\rightarrow$ 0 errors).
- [x] 2. All 16 extension unit tests pass (`npm test`).
- [x] 3. Backend compiles in Release mode (`dotnet build -c Release` $\rightarrow$ 0 errors).
- [x] 4. All 21 backend unit tests pass (`dotnet test`).
- [x] 5. Production extension ZIP created (`compare-anything-v1.0.0.zip`) containing only clean build files.
- [x] 6. Manifest V3 compliant with official name, description, and icons.
- [x] 7. Polished 128x128 icon with 48x48, 32x32, and 16x16 variants.
- [x] 8. 5 Chrome Web Store screenshots (1280x800) and promo banner (440x280) prepared.
- [x] 9. Privacy Policy published in `docs/PRIVACY.md`.
- [x] 10. Public Support page created in `docs/support.html`.
- [x] 11. Public Landing page created in `landing/index.html`.
- [x] 12. Multi-category comparisons verified (Products, Jobs, Courses).
- [x] 13. "Not stated" and "No clear winner" verified with zero hallucinations.
- [x] 14. Stretch feature implemented: Local "Share Image" comparison summary PNG generation.
- [x] 15. Repository sanitized: `.gitignore` protects secrets; zero keys tracked.
