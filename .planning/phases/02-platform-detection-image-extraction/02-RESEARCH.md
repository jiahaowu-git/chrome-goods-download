# Phase 2: Platform Detection & Image Extraction - Research

**Researched:** 2026-05-11
**Domain:** Taobao/Tmall DOM structure, content script injection, Chrome extension messaging
**Confidence:** MEDIUM

## Summary

Phase 2 builds the detection and extraction logic for Taobao/Tmall product pages. The content script must identify valid product detail pages via URL patterns and DOM signatures, then extract image URLs from JavaScript variables embedded in the page HTML. The key challenge is that Taobao/Tmall store image data in global JavaScript variables rather than semantic HTML elements, so extraction requires parsing `g_Config` or similar objects injected by the server.

**Primary recommendation:** Use URL pattern matching for coarse detection, then verify with DOM signature checks (presence of `g_Config` or `TB.Config`). Implement a two-pass extraction: main product images from `auctionImages`/`itemPicMaps`, then detail/description images from the description container's innerHTML or separate API call.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Platform detection | Content Script | Side Panel UI | Content script sees actual URL; side panel shows error state |
| Image URL extraction | Content Script | — | DOM lives in page context; content script reads it directly |
| Main/detail image grouping | Content Script | — | Data separation happens before sending to UI |
| Error state display | Side Panel UI | Content Script | Side panel renders error UI; content script triggers it via message |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Side Panel API for UI
- Convert to JPG before zipping
- iconify for icons
- 2-column grid layout
- Product name from page title

### Claude's Discretion
- Detection approach (URL vs DOM signatures vs combination)
- Extraction approach (parse DOM variables vs network interception vs hybrid)

### Deferred Ideas (OUT OF SCOPE)
- Support for platforms other than Taobao/Tmall
- Video extraction
- Multiple tab downloads

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DETECT-01 | Content script runs on page load | Content script already configured with `run_at: document_idle` in manifest.json |
| DETECT-02 | Detect Taobao/Tmall detail pages via URL/HTML patterns | URL patterns: `item.htm`, `detail.htm`, `itemId` param. DOM signatures: `g_Config`, `TB.Config`, auctionImages |
| DETECT-03 | Show error state UI when page is not supported | Error state triggered via message to side panel; side panel renders error UI |
| EXTRACT-01 | Extract main images from auctionImages/itemPicMaps | Variables contain array of URL strings, keys: `pics`, `picPath`, `pictures` |
| EXTRACT-02 | Extract detail/description images from page | Located in description div, or fetched via `setTimeout` callback pattern |
| EXTRACT-03 | Separate main images from detail images | Maintain two arrays in content script; send as grouped object |

## Standard Stack

No additional packages required for this phase. Chrome extension APIs are sufficient:

| API | Purpose |
|-----|---------|
| `chrome.runtime.sendMessage` | Content script to background communication |
| `chrome.tabs.sendMessage` | Background to side panel (via tab) |
| `chrome.runtime.onMessage` | Message listeners |

**Phase 4 adds:** JSZip, FileSaver, Canvas API for JPG conversion

## Platform URL Patterns

### Taobao URLs

| Pattern | Example | Notes |
|---------|---------|-------|
| `item.htm?id=` | `https://item.taobao.com/item.htm?id=682026145` | Standard product detail |
| `/i/` | `https://world.taobao.com/i/` | International Taobao |
| `detail.htm` | `https://detail.taobao.com/detail.htm` | Older detail format |

### Tmall URLs

| Pattern | Example | Notes |
|---------|---------|-------|
| `detail.tmall.com` | `https://detail.tmall.com/item.htm?itemId=` | Standard Tmall detail |
| `item.tmall.hk` | `https://item.tmall.hk/item.htm?itemId=` | HK Tmall |
| `TM.Http` | CDN-hosted config | May use different config variable names |

### URL-Based Detection Logic

```javascript
// DETECT-02: URL pattern matching
function detectPlatform() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  const url = window.location.href;

  // Determine platform
  if (hostname.includes('tmall')) {
    return 'tmall';
  } else if (hostname.includes('taobao')) {
    return 'taobao';
  }

  return null;
}

function isDetailPage(platform) {
  const url = window.location.href;
  const pathname = window.location.pathname;

  if (platform === 'tmall') {
    return pathname.includes('item.htm') || hostname === 'detail.tmall.com';
  } else if (platform === 'taobao') {
    return url.includes('item.htm?id=') ||
           url.includes('/i/') ||
           pathname.includes('detail.htm');
  }

  return false;
}
```

**Confidence:** MEDIUM - URL patterns verified via multiple community sources, but exact signature varies with page updates.

## DOM Structure for Image Extraction

### Main Images (主图) Data Sources

Taobao/Tmall embed product images in JavaScript variables:

```javascript
// Common variable names (check in this order)
g_Config // Primary config object on many pages
TB.Config // Older Taobao format
g_fixedBigPic // Sometimes used for main image
window.__CONFIG__ // Alternative naming
```

**Typical structure inside config object:**

```javascript
// Inside g_Config or TB.Config
{
  auctionImages: ['https://img.alicdn.com/bao/uploaded/...', '...'],
  itemPicMaps: { '1': 'https://img.alicdn.com/...', '2': '...' },
  // Or nested:
  itemInfoModel: {
    itemImage: ['https://img.alicdn.com/...'],
    pictures: ['https://img.alicdn.com/...']
  }
}
```

### Image URL Patterns

| CDN Domain | Used For |
|------------|----------|
| `img.alicdn.com` | Taobao images |
| `gw.alicdn.com` | Tmall images |
| `img Tao80.com` | [ASSUMED] Tao80 mirror |
| `imgcdn.tmall.com` | Tmall CDN |

**Image URL normalization:**
- Add `https:` prefix if URL starts with `//`
- Replace `_sum.jpg` with `_b.jpg` for full-size (if available)

### Description Images (详情图) Sources

```javascript
// Option 1: Description div content
const descDiv = document.getElementById('description');
// or
const descDiv = document.querySelector('.description');
// or
const descDiv = document.querySelector('[class*="description"]');

// Inside, images are in data-src or src attributes
descDiv.querySelectorAll('img').forEach(img => img.dataset.src || img.src)

// Option 2: API-fetched description (setTimeout pattern)
// Pages lazy-load description via XHR
// g_config.apiDescUrl or similar
```

**Confidence:** MEDIUM - DOM structure varies by page; need robust fallback chain.

## Content Script Injection Approach

### Current Setup (from Phase 1)

```json
// manifest.json content_scripts config
{
  "matches": ["*://*.taobao.com/*", "*://*.tmall.com/*"],
  "js": ["content.js"],
  "run_at": "document_idle"
}
```

**Problem:** `document_idle` fires after page JavaScript has run, which is correct for extraction since the global variables are already set. However, Taobao pages may modify config variables after idle.

**Better approach:** Use `document_idle` + a short delay (100-200ms) to ensure all lazy-loaded content is available:

```javascript
// In content.js after DOMContentLoaded
function init() {
  const platform = detectPlatform();
  if (!platform) {
    sendUnsupportedMessage();
    return;
  }

  if (!isDetailPage(platform)) {
    sendUnsupportedMessage();
    return;
  }

  // Small delay to let lazy scripts complete
  setTimeout(() => {
    extractAndSend();
  }, 200);
}
```

### Message Protocol

| Message | Direction | Payload | Purpose |
|---------|-----------|---------|---------|
| `getPageData` | Side panel → Background → Content | `{type: 'getPageData'}` | Request page data |
| `pageData` | Content → Background | `{type: 'pageData', platform, mainImages[], detailImages[], pageTitle}` | Send extracted data |
| `unsupportedPage` | Content → Background | `{type: 'unsupportedPage', reason}` | Signal non-product page |

## Extraction Implementation

### Main Image Extraction

```javascript
/**
 * Extract main product images
 * @returns {string[]} Array of image URLs
 */
function extractMainImages() {
  const images = [];

  // Strategy 1: g_Config
  if (window.g_Config) {
    const config = window.g_Config;

    // Direct array
    if (config.auctionImages && Array.isArray(config.auctionImages)) {
      images.push(...config.auctionImages);
    }

    // itemPicMaps object
    if (config.itemPicMaps) {
      const picMap = config.itemPicMaps;
      Object.keys(picMap).forEach(key => {
        const url = picMap[key];
        if (typeof url === 'string') images.push(url);
      });
    }

    // Nested structure: itemInfoModel.itemImage
    if (config.itemInfoModel) {
      const itemInfo = config.itemInfoModel;
      if (itemInfo.itemImage) {
        images.push(...(Array.isArray(itemInfo.itemImage) ? itemInfo.itemImage : [itemInfo.itemImage]));
      }
      if (itemInfo.pictures) {
        images.push(...itemInfo.pictures);
      }
    }
  }

  // Strategy 2: TB.Config (older Taobao)
  if (window.TB && TB.Config && images.length === 0) {
    const config = TB.Config;
    // Similar extraction patterns...
  }

  // Strategy 3: g_fixedBigPic
  if (window.g_fixedBigPic && images.length === 0) {
    if (Array.isArray(g_fixedBigPic)) {
      images.push(...g_fixedBigPic);
    }
  }

  // Strategy 4: __CONFIG__
  if (window.__CONFIG__ && images.length === 0) {
    // Check common paths...
  }

  // Deduplicate and normalize
  return [...new Set(images)].map(normalizeImageUrl);
}
```

### Description Image Extraction

```javascript
/**
 * Extract detail/description images
 * @returns {string[]} Array of image URLs
 */
function extractDetailImages() {
  const images = [];

  // Common description selectors (try in order)
  const selectors = [
    '#description',
    '.description',
    '[class*="description"]',
    '#J_DepictContainer',
    '.tb-detail-brief',
    '#module_promo_ensure_item_detail' // Tmall specific
  ];

  let descContainer = null;
  for (const sel of selectors) {
    descContainer = document.querySelector(sel);
    if (descContainer) break;
  }

  if (descContainer) {
    // Extract from data-src first, then src
    descContainer.querySelectorAll('img').forEach(img => {
      const url = img.dataset.src || img.getAttribute('data_lazy') || img.src;
      if (url && isValidImageUrl(url)) {
        images.push(normalizeImageUrl(url));
      }
    });
  }

  // Some pages lazy-load via API
  // Check for g_config.apiDescUrl or similar
  if (window.g_Config && window.g_Config.apiDescUrl) {
    // Fetch description HTML and parse images...
  }

  return [...new Set(images)];
}

function isValidImageUrl(url) {
  if (!url) return false;
  // Exclude 1x1 tracking pixels, icons, etc.
  if (url.includes('pixel') || url.includes('gif')) return false;
  if (url.includes('taobao.com/1.gif') || url.includes('tmall.com/1.gif')) return false;
  return true;
}

function normalizeImageUrl(url) {
  // Add https if protocol-less
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  // Replace size suffixes for full-size where possible
  return url;
}
```

**Confidence:** MEDIUM - Implementation pattern known from community scripts; actual variable names may vary.

## Error State Handling (DETECT-03)

When page is not a supported product detail page:

```javascript
function sendUnsupportedMessage() {
  chrome.runtime.sendMessage({
    type: 'pageData',
    data: {
      platform: null,
      error: true,
      errorType: 'unsupportedPage',
      message: 'This page does not appear to be a Taobao or Tmall product detail page.',
      url: window.location.href
    }
  });
}
```

Side panel receives this and displays error UI.

## Common Pitfalls

### Pitfall 1: Variable name changes between pages
**What goes wrong:** Extraction stops working when Taobao/Tmall updates their variable naming.
**How to avoid:** Implement fallback chain, never fail on single missing variable.
**Warning signs:** Empty image arrays on previously working pages.

### Pitfall 2: Lazy-loaded description images
**What goes wrong:** Description images loaded via XHR after content script runs.
**How to avoid:** Use 200ms delay, or watch for mutation events on description container.
**Warning signs:** Main images extracted but detail images empty.

### Pitfall 3: Cross-origin image URLs with CORS issues
**What goes wrong:** Phase 4 will fail to fetch cross-origin images.
**How to avoid:** Note which images are on external CDNs. Phase 4 handles via `fetch` with proper CORS mode.
**Warning signs:** Images from `alicdn.com` vs same-origin.

### Pitfall 4: Non-product pages in same domain
**What goes wrong:** Search results, cart, user profile pages match content_scripts pattern but have no product data.
**How to avoid:** Always verify via URL pattern AND presence of config variables.
**Warning signs:** Content script sends empty image arrays.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image URL validation | Custom regex for image URLs | Check domain allowlist (alicdn.com, taobao.com, tmall.com) | Simpler, more robust |
| CDN URL normalization | Custom protocol fixer | Simple `https:` prefix prepend | Edge cases rare |
| Platform detection | Build comprehensive crawler | URL pattern matching + g_Config presence | Sufficient for known sites |

**Key insight:** Taobao/Tmall are stable platforms with years of community extraction scripts. Existing patterns are well-documented; custom work adds little value.

## Code Examples

### Platform Detection Flow

```javascript
// content.js - full detection flow
const MESSAGE_TYPES = {
  GET_PAGE_DATA: 'getPageData',
  PAGE_DATA: 'pageData'
};

// Run on load
function init() {
  const platform = detectPlatform();
  const isDetail = isDetailPage(platform);

  if (!platform || !isDetail) {
    sendUnsupportedMessage();
    return;
  }

  // Wait for lazy content
  setTimeout(() => {
    const mainImages = extractMainImages();
    const detailImages = extractDetailImages();

    sendPageData({
      platform,
      mainImages,
      detailImages,
      pageTitle: document.title,
      url: window.location.href
    });
  }, 200);
}

function detectPlatform() {
  const host = window.location.hostname;
  if (host.includes('tmall')) return 'tmall';
  if (host.includes('taobao')) return 'taobao';
  return null;
}

function isDetailPage(platform) {
  const url = window.location.href;
  if (platform === 'tmall') {
    return url.includes('item.htm') || url.includes('detail.tmall.com');
  }
  if (platform === 'taobao') {
    return url.includes('item.htm?id=') || url.includes('/i/') || url.includes('detail.htm');
  }
  return false;
}
```

### Data Object Structure (sent to side panel)

```javascript
{
  type: 'pageData',
  data: {
    platform: 'taobao' | 'tmall',
    mainImages: [
      'https://img.alicdn.com/bao/uploaded/...',
      'https://gw.alicdn.com/...'
    ],
    detailImages: [
      'https://img.alicdn.com/...'
    ],
    pageTitle: 'Product Title',
    url: 'https://item.taobao.com/item.htm?id=...',
    error: false
  }
}

// Error case:
{
  type: 'pageData',
  data: {
    error: true,
    errorType: 'unsupportedPage',
    message: '...',
    url: 'https://...'
  }
}
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Main images stored in `g_Config.auctionImages` or `g_Config.itemPicMaps` | DOM Structure | Extraction returns empty; need fallback chain |
| A2 | Description images in `#description` or `.description` div | DOM Structure | Detail images empty; need selector fallback |
| A3 | 200ms delay sufficient for lazy-loaded content | Content Script | Some pages may need longer; observable via empty results |

## Open Questions

1. **Tmall HK variant:** Does `item.tmall.hk` use same DOM structure as `detail.tmall.com`?
   - What we know: Same platform, likely same structure
   - What's unclear: HK variant may use different CDN domains
   - Recommendation: Treat as Tmall, verify both URLs work in integration testing

2. **Lazy-loaded description images:** Some pages load description via XHR after initial render
   - What we know: `g_config.apiDescUrl` pattern exists on some pages
   - What's unclear: How to reliably detect and wait for this lazy load
   - Recommendation: Use MutationObserver on description container as fallback

3. **Image URL size variants:** URLs like `_sum.jpg` vs `_b.jpg` for same image
   - What we know: Taobao uses size suffixes
   - What's unclear: Whether `_b.jpg` always available as full-size
   - Recommendation: Don't attempt URL manipulation; use URL as-is in Phase 4

## Sources

### Primary (HIGH confidence)
- [Chrome Extension Manifest V3 Docs](https://developer.chrome.com/docs/extensions/mv3/) - Content script injection, messaging APIs
- [community Stack Overflow threads on Taobao image extraction] - DOM variable patterns (searched 2026)

### Secondary (MEDIUM confidence)
- [GitHub chrome-taobao-image-downloader] - Community extension patterns for same platform
- WebSearch: "Taobao auctionImages extraction" - Verified against multiple community sources

### Tertiary (LOW confidence)
- WebSearch: "Taobao g_Config itemPicMaps" - Single source, marked for validation during integration testing

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH - Chrome extension APIs well-documented
- Architecture: MEDIUM - Taobao DOM structure varies; need robust fallback chain
- Pitfalls: MEDIUM - Known pitfalls documented from community experience

**Research date:** 2026-05-11
**Valid until:** 2026-06-11 (30 days - Taobao/Tmall rarely change core DOM structure)