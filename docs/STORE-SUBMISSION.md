# Chrome Web Store Submission Guide

This document contains the exact metadata, asset specifications, and submission checklist required to publish **Compare Anything** to the Google Chrome Web Store.

---

## 1. Store Listing Metadata

### Product Name
```text
Compare Anything – AI Web Comparison
```
*(Alternative: `Compare Anything`)*

### Short Summary (Within character limit)
```text
Add 2–4 web pages and get one clear AI comparison table based only on the information on those pages.
```

### Single-Purpose Description (Compliance)
```text
Compare Anything allows users to select webpages and generate an AI-assisted side-by-side comparison of the information contained on those selected pages.
```

### Detailed Store Description
```text
Compare Anything helps you make decisions without constantly switching between browser tabs.

Add webpages you want to compare, optionally tell us what matters to you, and get one clean AI-generated comparison based on the information contained on those pages.

Use Compare Anything for products, software plans, jobs, courses, services, hotels and other online research.

Key features:

• Compare 2–4 webpages
• Automatically discovers useful comparison criteria
• Creates a side-by-side comparison table
• Highlights important differences
• Takes your personal priorities into account
• Identifies missing information instead of guessing
• Links every item back to its original source
• No account required

Compare Anything only accesses pages that you explicitly add to a comparison.
```

### Category
```text
Productivity / Workflow
```

### Language
```text
English
```

---

## 2. Store URLs
* **Privacy Policy URL**: `https://compareanything.app/docs/PRIVACY.md` *(or GitHub Pages URL)*
* **Support URL**: `https://compareanything.app/docs/support.html`

---

## 3. Store Visual Assets

| Asset | Dimensions | Format | Status | Location |
|-------|------------|--------|--------|----------|
| Extension Icon | 128 × 128 px | PNG | Ready | `extension/public/icons/icon128.png` |
| Small Promo Tile | 440 × 280 px | PNG | Ready | `store-assets/promo-440x280.png` |
| Screenshot 1 | 1280 × 800 px | PNG | Ready | `store-assets/screenshot-1-add-pages.png` |
| Screenshot 2 | 1280 × 800 px | PNG | Ready | `store-assets/screenshot-2-comparison-table.png` |
| Screenshot 3 | 1280 × 800 px | PNG | Ready | `store-assets/screenshot-3-personal-priority.png` |
| Screenshot 4 | 1280 × 800 px | PNG | Ready | `store-assets/screenshot-4-best-overall.png` |
| Screenshot 5 | 1280 × 800 px | PNG | Ready | `store-assets/screenshot-5-multi-category.png` |

---

## 4. Screenshot Descriptions

### Screenshot 1: "Add pages you want to compare"
* **Scene**: Shows the extension popup with 3 pages captured from different online stores, highlighting the active selection counter (`3 / 4 pages added`) and page cards.
* **Caption**: *"Add pages you want to compare"*

### Screenshot 2: "One clear comparison"
* **Scene**: Shows the complete side-by-side comparison table with dynamic criteria, values, and visual winner stars.
* **Caption**: *"One clear comparison"*

### Screenshot 3: "Compare based on what matters to you"
* **Scene**: Highlights the priority goal field evaluated against student laptop criteria under Tk 80,000.
* **Caption**: *"Compare based on what matters to you"*

### Screenshot 4: "Make decisions faster"
* **Scene**: Displays the "Best Overall" winner card and "Best For" attribute badges.
* **Caption**: *"Make decisions faster"*

### Screenshot 5: "Compare more than products"
* **Scene**: Showcases multi-category versatility comparing Jobs, Courses, Software Plans, and Services.
* **Caption**: *"Compare more than products"*

---

## 5. Developer Account Submission Checklist

The developer must manually complete the following steps in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/):

- [ ] **Developer Registration**: Register a Google Developer Account and pay the one-time $5 registration fee.
- [ ] **2-Step Verification**: Ensure 2-Step Verification is active on the publishing Google Account.
- [ ] **Package Upload**: Upload `compare-anything-v1.0.0.zip` (located in the repository root).
- [ ] **Manifest & Permissions Review**: Verify requested permissions (`activeTab`, `scripting`, `storage`).
- [ ] **Single Purpose Justification**: Paste the single-purpose description into the developer declaration.
- [ ] **Privacy Policy & Support Links**: Input public URLs for Privacy Policy and Support.
- [ ] **Graphic Assets**: Upload 5 screenshots (1280 × 800) and small promo tile (440 × 280).
- [ ] **Submit for Review**: Click **Submit for Review**.
