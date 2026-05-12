---
phase: "02"
phase_name: "Platform Detection & Image Extraction"
project: "chrome-goods-download"
generated: "2026-05-12"
counts:
  decisions: 8
  lessons: 3
  patterns: 4
  surprises: 2
missing_artifacts:
  - "02-VERIFICATION.md"
  - "02-UAT.md"
---

# Phase 2 Learnings: Platform Detection & Image Extraction

## Decisions

### Detection triggered by message receipt, not DOMContentLoaded
Detection (detectPlatform, isDetailPage) is triggered when GET_PAGE_DATA message is received, not when the page DOM loads.

**Rationale:** DOMContentLoaded was removed. Detection should happen when the side panel requests data, not when the page loads. document_idle run_at in manifest.json is sufficient for page load execution.
**Source:** 02-SUMMARY.md

---

### 200ms delay before extraction for lazy content
A 200ms setTimeout delays extraction after detecting a valid detail page.

**Rationale:** Alibaba detail pages use lazy-loaded content that requires time to render before extraction can succeed.
**Source:** 02-01-PLAN.md

---

### Separate arrays maintained for mainImages vs detailImages
mainImages and detailImages are stored in separate arrays rather than merged.

**Rationale:** Allows users to selectively download only main product images or include all detail/description images.
**Source:** 02-SUMMARY.md

---

### Protocol-less URLs normalized by prepending https:
normalizeImageUrl() adds 'https:' prefix to URLs starting with '//'.

**Rationale:** Protocol-less URLs (//cdn.example.com/image.jpg) need an explicit protocol to work in all contexts.
**Source:** 02-SUMMARY.md

---

### 4-strategy fallback chain for main image extraction
Main images are extracted using a fallback chain: g_Config → TB.Config → g_fixedBigPic → __CONFIG__.

**Rationale:** Different Alibaba/Taobao page variants use different global variable names to store the same auction image data.
**Source:** 02-02-PLAN.md

---

### 6-selector fallback chain for detail image extraction
Detail images are extracted using: #description → .description → [class*="description"] → #J_DepictContainer → .tb-detail-brief → #module_promo_ensure_item_detail.

**Rationale:** Different page templates use different container elements for the product description section.
**Source:** 02-02-SUMMARY.md

---

### Lazy-load image detection via three attribute fallbacks
extractDetailImages checks img.dataset.src first, then data_lazy attribute, then img.src.

**Rationale:** Alibaba pages use different lazy-loading mechanisms depending on page template and render state.
**Source:** 02-SUMMARY.md

---

### Set-based deduplication preserving insertion order
Images are deduplicated using [...new Set(images)] rather than filtering.

**Rationale:** Same image URL may appear in multiple data sources; Set removes duplicates while preserving first-seen order.
**Source:** 02-SUMMARY.md

---

## Lessons

### Not all Alibaba CDN URLs are valid product images
Learned that URL validation must filter out tracking pixels (pixel, 1.gif, blank.gif) and data:image URIs.

**Context:** isValidImageUrl() was added specifically to exclude non-product images that appear in the DOM but are not actual product images.
**Source:** 02-SUMMARY.md

---

### Lazy-loaded images require multiple attribute checks
Each lazy-loaded image may use dataset.src, data_lazy, or direct src depending on render state.

**Context:** A single selector strategy is insufficient for detail image extraction across different Alibaba page templates.
**Source:** 02-SUMMARY.md

---

### Deduplication is essential due to overlapping sources
Same images appear in multiple global variables (auctionImages and itemPicMaps both present on some pages).

**Context:** Without deduplication, users would see duplicate images in the download list.
**Source:** 02-SUMMARY.md

---

## Patterns

### Fallback chain pattern for configuration access
Multiple strategies tried in sequence until one returns non-empty results.

**When to use:** When different page variants store the same data under different global variable names or structures.
**Source:** 02-02-SUMMARY.md

---

### Selector fallback chain pattern
Multiple CSS selectors tried sequentially until a DOM element is found.

**When to use:** When the same functional container exists across different page templates but uses different class names or IDs.
**Source:** 02-SUMMARY.md

---

### 200ms setTimeout for lazy content
Short delay after page detection to allow DOM content to fully render.

**When to use:** When extracting content from pages with lazy-loaded elements that aren't immediately available on page load.
**Source:** 02-01-PLAN.md

---

### Message-based detection flow
Content script remains passive until explicitly requested via message.

**When to use:** When content script should only run in response to side panel/user action, not on every page load.
**Source:** 02-SUMMARY.md

---

## Surprises

### Wide variance in global variable naming for image data
Pages use g_Config, TB.Config, g_fixedBigPic, and __CONFIG__ interchangeably for the same image data.

**Impact:** Required implementing a 4-strategy fallback chain to ensure extraction works across page variants.
**Source:** 02-02-SUMMARY.md

---

### Description container position varies significantly
No single selector reliably finds the detail image container across all page templates.

**Impact:** Required 6 different selectors with varying specificity to handle different page layouts.
**Source:** 02-02-SUMMARY.md
