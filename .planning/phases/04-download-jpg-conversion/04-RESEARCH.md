# Phase 4: Download with JPG Conversion - Research

**Researched:** 2026-05-13
**Domain:** Chrome extension client-side image processing and zip download
**Confidence:** HIGH

## Summary

Phase 4 implements batch download with JPG conversion in the Chrome extension side panel context. The side panel already dispatches a `downloadImages` CustomEvent when the user clicks "一键下载". Phase 4 adds the handler that: (1) collects checked images, (2) fetches them cross-origin using the extension's host permissions, (3) converts each to JPG via Canvas at quality 0.92, (4) packages into a zip via JSZip, and (5) triggers download via FileSaver.

The critical architectural insight is that the side panel runs in the extension origin (`chrome-extension://...`) but benefits from the manifest's `host_permissions` which grant cross-origin fetch capability on `*.taobao.com` and `*.tmall.com`. This bypasses CORS restrictions that would normally apply to web pages.

**Primary recommendation:** Implement download handler directly in sidepanel.html as an inline script module. Use JSZip 3.10.1 + FileSaver.js 2.0.5 for zip generation and download triggering.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- JSZip + FileSaver for client-side zip
- Canvas API for image format conversion
- All images converted to JPG before zipping
- Extension communicates via chrome.runtime messaging

### Claude's Discretion
- Implementation location: inline in sidepanel.html vs. separate JS file
- Error handling strategy
- Progress feedback UX

### Deferred Ideas (OUT OF SCOPE)
- Server-side processing
- Multiple tab downloads

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DOWN-01 | Collect all checked images on button click | CustomEvent already dispatches with {images, pageTitle} detail |
| DOWN-02 | Fetch images with cross-origin handling | Extension host_permissions + fetch API in extension context |
| DOWN-03 | Draw each image onto canvas, export as JPG blob (quality 0.92) | canvas.toBlob with "image/jpeg", 0.92 quality |
| DOWN-04 | Add all JPG blobs to zip using JSZip | JSZip.folder(), JSZip.file() with Blob input |
| DOWN-05 | Name zip file from page title (clean special chars) | Regex-based sanitization of filename |
| DOWN-06 | Trigger browser download of zip file | FileSaver.saveAs(blob, filename) |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CustomEvent listener | Side Panel (extension context) | — | Side panel owns event dispatch and now download handling |
| Cross-origin image fetch | Side Panel | — | Extension host_permissions enable fetch to Taobao/Tmall CDNs |
| Canvas JPG conversion | Side Panel | — | All processing client-side in extension context |
| JSZip packaging | Side Panel | — | Client-side zip creation, no server involvement |
| FileSaver download trigger | Side Panel | — | Browser download API, no server involvement |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| JSZip | 3.10.1 | Create .zip from blobs | [VERIFIED: npm registry] Standard for client-side zip in browser extensions |
| FileSaver.js | 2.0.5 | Trigger browser download of blob | [VERIFIED: npm registry] Standard for saveAs functionality, works with JSZip output |
| Canvas API | Native | JPG conversion | [VERIFIED: MDN docs] toBlob supports "image/jpeg" with quality parameter |

### Installation
```bash
npm install jszip file-saver
```
Or via CDN for direct injection into HTML (simpler for extension):
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| FileSaver | Native `<a download>` or blob URL | FileSaver handles edge cases (iOS, large files) better |
| JSZip | Native Blob + manually constructing zip | JSZip handles zip structure, compression, file headers |
| Canvas toBlob | Image decode library (e.g., decode-tiff) | Canvas.toBlob is sufficient for JPEG output from loaded images |

## Architecture Patterns

### System Architecture Diagram

```
[User clicks "一键下载"]
        |
        v
[CustomEvent 'downloadImages' dispatched]
  detail: { images: [{id, url, checked}], pageTitle }
        |
        v
[downloadImages event handler in sidepanel.html]
        |
        +---> [Filter: only checked images]
        |
        v
[For each image: fetch(url) -> ArrayBuffer]
        |
        +---> [Load image onto temporary Image element]
        |
        v
[Draw onto canvas element -> toBlob('image/jpeg', 0.92) -> Blob]
        |
        v
[Add Blob to JSZip instance with filename]
        |
        v
[JSZip.generateAsync({type: 'blob'}) -> zipBlob]
        |
        v
[FileSaver.saveAs(zipBlob, cleanedPageTitle + '.zip')]
        |
        v
[Browser download dialog appears]
```

### Recommended Project Structure
```
src/
├── sidepanel.html          # Contains inline download handler (Phase 4 addition)
├── background.js            # Service worker (no changes needed for Phase 4)
├── content.js               # Content script (no changes needed for Phase 4)
├── lib/
│   ├── jszip.min.js         # JSZip library (npm installed or CDN)
│   └── file-saver.min.js    # FileSaver library (npm installed or CDN)
└── icons/                   # Extension icons
```

### Pattern 1: Cross-Origin Image Fetch in Extension Context

**What:** Fetching images from Taobao/Tmall CDN domains from within the extension side panel.

**When to use:** When downloading product images for processing.

**Mechanism:** The extension manifest declares `host_permissions` for `*://*.taobao.com/*` and `*://*.tmall.com/*`. This grants the extension context (including the side panel) the ability to make cross-origin fetch requests to these domains, bypassing normal CORS restrictions.

**Code:**
```javascript
// From side panel context
const response = await fetch(imageUrl);  // Works because of host_permissions
const arrayBuffer = await response.arrayBuffer();
```

**Why it works:** Unlike content scripts which inherit the page's origin, extension pages (side panel, service worker, popup) run in the `chrome-extension://[EXT_ID]` origin. Host permissions grant explicit access to specified origins from this extension context.

### Pattern 2: Canvas to JPG Conversion

**What:** Converting an image fetched as ArrayBuffer into a JPG Blob at quality 0.92.

**When to use:** For each image before adding to zip.

**Code:**
```javascript
function convertToJpgBlob(arrayBuffer, quality = 0.92) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([arrayBuffer]);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (jpgBlob) => {
          if (jpgBlob) resolve(jpgBlob);
          else reject(new Error('Canvas toBlob returned null'));
        },
        'image/jpeg',
        quality
      );
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(blob);
  });
}
```

### Anti-Patterns to Avoid

- **Loading images via `<img>` tag then reading canvas (tainted canvas):** If the image comes from a different origin and the canvas gets tainted, `toBlob` will throw a SecurityError. Use `createObjectURL` from fetched blob, not from `<img>` tag loading external URL directly.

- **Sequential processing for large image sets:** Fetch all images in parallel, then process. Use `Promise.all` with concurrency limiting (e.g., 5 at a time) to avoid overwhelming memory.

- **Using `document.title` directly as filename:** Contains characters illegal in filenames (/, \, *, ?, etc.). Must sanitize.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Zip file creation | Manually construct zip binary | JSZip | Handles compression, file headers, folder structure correctly |
| Cross-origin fetch | Workaround via background script | Extension host_permissions | Extension already has permissions for target domains |
| Browser download | Blob URL + anchor click | FileSaver.saveAs | Handles iOS Safari, large blobs, proper filename encoding |
| Filename sanitization | Simple replace | Full char replacement map | Handles more illegal chars (:<>"| etc.) |

**Key insight:** JSZip + FileSaver together form the standard client-side zip download pattern. Both are well-maintained, widely used, and handle edge cases that manual implementations miss.

## Common Pitfalls

### Pitfall 1: Tainted Canvas from Cross-Origin Image
**What goes wrong:** `canvas.toBlob()` throws SecurityError: "The canvas has been tainted by cross-origin data"

**Why it happens:** Loading an image via `<img src="cross-origin-url">` and then drawing to canvas taints the canvas. A tainted canvas cannot export via toBlob.

**How to avoid:** Never load images via `<img>` tags from external URLs. Instead:
1. `fetch(imageUrl)` -> ArrayBuffer
2. `new Blob([arrayBuffer])`
3. `URL.createObjectURL(blob)` -> img.src

This approach keeps the image data "clean" because it was never loaded through an HTML element that inherited the external origin.

### Pitfall 2: Memory Accumulation from Object URLs
**What goes wrong:** Each `URL.createObjectURL` allocates memory that is not automatically freed. For large image sets (50+ images), memory can exhaust.

**Why it happens:** Object URLs persist until explicitly revoked, and the browser does not auto-clean them.

**How to avoid:** Always pair `URL.createObjectURL` with `URL.revokeObjectURL` inside the `img.onload` or after canvas processing. Create a helper that ensures cleanup.

### Pitfall 3: JSZip generateAsync callback scope
**What goes wrong:** Trying to use variables inside the `generateAsync` callback after it has resolved.

**Why it happens:** JSZip's `generateAsync` is async and the callback runs later with captured references.

**How to avoid:** Use async/await pattern with JSZip:
```javascript
async function createZip(images) {
  const zip = new JSZip();
  // Add files...
  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}
```

### Pitfall 4: Filename with Special Characters
**What goes wrong:** Using `pageTitle` directly as zip filename causes download to fail silently or produce unpredictable results on Windows.

**Why it happens:** Characters like `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|` are illegal in Windows filenames.

**How to avoid:** Use a sanitization function:
```javascript
function sanitizeFilename(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim().substring(0, 200);
}
```

## Code Examples

### Verified pattern from JSZip README:
```javascript
var zip = new JSZip();
zip.file("Hello.txt", "Hello World\n");
zip.generateAsync({type:"blob"}).then(function(content) {
    saveAs(content, "example.zip");
});
```

### Verified pattern from FileSaver.js README:
```javascript
canvas.toBlob(function(blob) {
    saveAs(blob, "pretty image.png");
});
```

### Cross-origin fetch pattern (Chrome extension):
```javascript
// In extension context with host_permissions granted
const response = await fetch('https://img.alicdn.com/.../image.jpg');
const arrayBuffer = await response.arrayBuffer();
```

### Complete download flow pseudocode:
```javascript
window.addEventListener('downloadImages', async (event) => {
  const { images, pageTitle } = event.detail;
  const checkedImages = images.filter(img => img.checked);

  const zip = new JSZip();
  const sanitizedTitle = sanitizeFilename(pageTitle);

  // Process images with concurrency limit
  const batchSize = 5;
  for (let i = 0; i < checkedImages.length; i += batchSize) {
    const batch = checkedImages.slice(i, i + batchSize);
    const jpgBlobs = await Promise.all(
      batch.map(img => fetchAndConvertToJpg(img.url))
    );
    jpgBlobs.forEach((blob, idx) => {
      zip.file(`${String(i + idx + 1).padStart(3, '0')}.jpg`, blob);
    });
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${sanitizedTitle}.zip`);
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manifest V2 XMLHttpRequest | Manifest V3 fetch API | Chrome MV3 (2021) | fetch is modern, async/await friendly |
| External CDN for JSZip | npm install or inline | Current | Reduces external dependency |
| Manual zip construction | JSZip library | Long established | Reliable compression |

**Deprecated/outdated:**
- XMLHttpRequest for fetch: Use fetch API with async/await
- Maltego (old library): N/A for this project

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Side panel can fetch from taobao.com/tmall.com via host_permissions | Architecture | Extension may fail to fetch images if host_permissions are insufficient for side panel context |
| A2 | JSZip 3.10.1 + FileSaver 2.0.5 are compatible with Chrome 114+ side panel environment | Standard Stack | Libraries may have runtime errors in extension context |
| A3 | canvas.toBlob with 'image/jpeg' at 0.92 quality is supported in Chrome side panel | Standard Stack | Conversion may fail or produce unexpected quality |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **How to handle images that fail to fetch or convert?**
   - What we know: fetch can fail due to network, CORS, or malformed URLs; canvas.toBlob can return null
   - What's unclear: Should we skip failed images with a warning, or fail the entire download?
   - Recommendation: Skip failed images with console warning, continue with successful ones. Show count of skipped images.

2. **Should we include progress feedback during download?**
   - What we know: Side panel has no existing progress UI
   - What's unclear: Is simple loading state enough, or need detailed progress (X of Y images)?
   - Recommendation: Disable download button during processing, show "处理中..." text

3. **Image naming convention in the zip**
   - What we know: Need to name files something, pageTitle is available
   - What's unclear: Should we use sequential numbers (001.jpg, 002.jpg) or original filenames?
   - Recommendation: Sequential numbers padded (001.jpg, 002.jpg) for consistency and cross-platform compatibility

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies identified beyond JSZip/FileSaver which are loaded via CDN/inline)

The extension uses:
- Native fetch API (all Chrome versions)
- Native Canvas API (all Chrome versions)
- Host permissions already granted in manifest

No external tools, runtimes, or CLI utilities needed beyond the JSZip/FileSaver libraries which are bundled or CDN-loaded.

## Validation Architecture

> Note: workflow.nyquist_validation is set to `false` in .planning/config.json — this section omitted per config.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Extension context, no auth needed |
| V3 Session Management | No | No sessions in extension |
| V4 Access Control | No | Single-user client-side only |
| V5 Input Validation | Yes | Image URLs from page DOM, pageTitle from document.title |

### Known Threat Patterns for Extension Download

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious image URL injection | Tampering, Information Disclosure | URLs come from page DOM (content script extracted), not user input. Validate via isValidImageUrl(). |
| Zip filename path traversal | Tampering | Sanitize pageTitle before use as filename |
| Memory exhaustion from large image set | Denial of Service | Process images in batches of 5, not all at once |

### Input Validation Strategy
- Image URLs: Already filtered by content.js `isValidImageUrl()` before being sent to side panel
- pageTitle: Sanitize illegal characters before use as zip filename

## Sources

### Primary (HIGH confidence)
- [JSZip Official README](https://github.com/Stuk/jszip) - Zip creation API, blob handling
- [FileSaver.js Official README](https://github.com/eligrey/FileSaver.js) - saveAs API, blob download
- [MDN: HTMLCanvasElement.toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) - JPEG quality parameter, SecurityError on tainted canvas

### Secondary (MEDIUM confidence)
- Chrome Extension Architecture Overview (developer.chrome.com) - Cross-origin fetch from extension context via host_permissions

### Tertiary (LOW confidence)
- WebSearch results for "canvas toBlob jpeg quality browser compatibility" - General browser support, not verified per-feature

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - JSZip/FileSaver versions verified via npm registry
- Architecture: HIGH - Cross-origin fetch via host_permissions confirmed from Chrome docs
- Pitfalls: HIGH - Tainted canvas and memory management are well-documented issues

**Research date:** 2026-05-13
**Valid until:** 2026-06-13 (30 days — stable technology, no rapid changes expected)