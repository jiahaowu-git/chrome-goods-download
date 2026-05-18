---
phase: "02"
phase_name: "Platform Detection & Image Extraction"
project: "chrome-goods-download"
generated: "2026-05-12"
counts:
  decisions: 6
  lessons: 5
  patterns: 4
  surprises: 2
missing_artifacts: []
---

# Phase 2 Learnings: Platform Detection & Image Extraction

## Decisions

### Detection triggered by message receipt, not DOMContentLoaded
Platform detection and image extraction are triggered when the side panel sends GET_PAGE_DATA message, not on page DOMContentLoaded event.

**Rationale:** More reliable architecture — extraction only happens when the side panel actually requests data, ensuring the service worker is ready to receive results. Avoids race conditions where content script loads before background is ready.
**Source:** 02-SUMMARY.md

---

### 200ms delay before extraction for lazy-loaded content
A 200ms setTimeout delays extraction after valid page detection.

**Rationale:** Taobao/Tmall pages load product images lazily — the DOM may not have all image URLs available immediately on page load. The delay allows lazy-load handlers to populate image data before extraction runs.
**Source:** 02-SUMMARY.md, 02-01-PLAN.md

---

### Separate arrays for mainImages vs detailImages
Two distinct arrays are maintained throughout extraction, rather than a single combined array.

**Rationale:** Required by Phase 3 UI specification (two-section display: 主图 / 详情图). Allows UI to render sections independently and users to select images from each group separately.
**Source:** 02-SUMMARY.md

---

### Protocol-less URLs normalized with https: prefix
normalizeImageUrl() prepends 'https:' to URLs starting with '//'.

**Rationale:** Protocol-relative URLs (//example.com/image.jpg) fail in certain browser contexts and when passed through canvas for conversion. Normalizing to https: ensures consistent handling across all operations.
**Source:** 02-SUMMARY.md, 02-02-PLAN.md

---

### 4-strategy fallback chain for main image extraction
Main images are extracted by trying four different global variable sources in sequence: g_Config → TB.Config → g_fixedBigPic → __CONFIG__.

**Rationale:** Different Taobao/Tmall page variations (A/B tests, different rendering pipelines, older page versions) use different JavaScript globals to hold product image data. No single source works across all pages, so a fallback chain maximizes extraction coverage.
**Source:** 02-02-SUMMARY.md, 02-02-PLAN.md

---

### 6-selector fallback chain for detail images
Detail images are extracted by trying six different CSS selectors to find the description container.

**Rationale:** The description/详情图 container has variable selectors across Taobao/Tmall page versions: #description, .description, [class*="description"], #J_DepictContainer, .tb-detail-brief, #module_promo_ensure_item_detail. A fallback chain ensures at least one selector matches.
**Source:** 02-02-SUMMARY.md, 02-02-PLAN.md

---

## Lessons

### Different lazy-load mechanisms require multi-attribute fallback
Detail images use multiple lazy-load mechanisms: img.dataset.src (primary), data_lazy attribute (secondary), and img.src (fallback).

**Context:** Not all lazy-loaded images use the same attribute. Some images load via dataset.src, others set data_lazy, and some are direct src. The extraction must check all three to avoid missing images.
**Source:** 02-02-SUMMARY.md

---

### CDN domain filtering is essential for image validation
isValidImageUrl() validates that image URLs come from Alibaba CDN domains (alicdn.com, alibaba.com, taobao.com, tmall.com) and rejects tracking pixels.

**Context:** Taobao/Tmall pages include many non-product images: tracking pixels (pixel, 1.gif), blank.gif icons, and images from third-party domains. CDN-based filtering combined with pixel exclusion produces reliable image extraction.
**Source:** 02-02-PLAN.md, 02-02-SUMMARY.md

---

### Set deduplication preserves insertion order with [...new Set()]
Using [...new Set(images)] for deduplication removes duplicates while preserving the order images were discovered.

**Context:** Multiple extraction strategies (4 for main images) can return the same URL. Set deduplication ensures unique images without scrambling the original sequence, which matters for UI display order and user expectation.
**Source:** 02-02-SUMMARY.md

---

### sendPageDataToBackground() became unused after refactor
The existing sendPageDataToBackground() function was not removed in 02-01 and remains in content.js unused.

**Context:** After updating the message listener to use chrome.runtime.sendMessage directly and removing DOMContentLoaded, sendPageDataToBackground() was no longer called. It was left in the codebase as dead code during Phase 2 execution. Should be removed as cleanup.
**Source:** 02-01-SUMMARY.md

---

### Platform detection validates detail page before extraction
The detection flow checks both platform (taobao/tmall) AND detail page pattern (item.htm?id=, /i/, detail.htm) before attempting extraction.

**Context:** Users can open the extension on any Taobao/Tmall page, not just product pages. Without detail page validation, extraction would run on search results,店铺 pages, etc. and return empty/invalid results.
**Source:** 02-01-PLAN.md

---

## Patterns

### Strategy fallback chain
When multiple potential sources exist for the same data, try them in order until one yields results.

**When to use:** Data may be available from different sources depending on page version, A/B test group, or platform variant. Stop at first non-empty result.
**Source:** 02-SUMMARY.md

---

### Selector fallback chain for DOM queries
When the target DOM element has variable selectors, try multiple selector patterns until one matches.

**When to use:** Websites use different class/ID names across versions or platforms. Query selectors in order until a match is found, then stop.
**Source:** 02-02-SUMMARY.md

---

### Async message response with return true
Chrome message listeners must return true when sendResponse is called asynchronously.

**When to use:** The message listener needs to send a response after the current function returns (async operation). Return true tells Chrome the response will come later via sendResponse.
**Source:** 02-01-PLAN.md

---

### Set-based deduplication preserving order
Use [...new Set(array)] instead of [...new Set(array).values()] to deduplicate while preserving insertion order.

**When to use:** Need unique items from an ordered collection where subsequent occurrences should be removed but first-seen order must be maintained.
**Source:** 02-SUMMARY.md

---

## Surprises

### sendPageDataToBackground() function left unused after detection refactor
The function sendPageDataToBackground() existed in content.js before Phase 2 but was not removed when the detection flow was updated to use chrome.runtime.sendMessage directly.

**Impact:** Dead code remains in content.js. Minor - the function is harmless but serves no purpose and should be cleaned up before Phase 3.
**Source:** 02-01-SUMMARY.md

---

### Research phase identified needed 200ms delay not explicit in initial plan
The 02-RESEARCH.md investigation revealed that Taobao/Tmall pages require a delay for lazy content loading. The plan was updated to include 200ms setTimeout, but the implementation complexity was underestimated.

**Impact:** The 200ms delay is a conservative estimate that works in practice, but may need adjustment for very slow connections or particularly heavy pages. Images may be missed if the delay is insufficient.
**Source:** 02-RESEARCH.md (referenced in 02-01-PLAN.md, 02-SUMMARY.md)