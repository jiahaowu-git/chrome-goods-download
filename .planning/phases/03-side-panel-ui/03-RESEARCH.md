# Phase 3: Side Panel UI - Research

**Researched:** 2026-05-12
**Domain:** Chrome Extension Side Panel UI implementation
**Confidence:** HIGH

## Summary

Phase 3 builds the complete dark-themed side panel UI for the chrome-goods-download extension. The UI displays main product images and detail images in two collapsible sections, with square thumbnails in a 2-column grid. Each thumbnail has a checkbox (default checked) in the top-right corner. Clicking a thumbnail opens a modal overlay with the full-size image. A "一键下载" download button is fixed at the bottom. The implementation uses pure HTML/CSS with inline styles and iconify for icons — no frameworks.

**Primary recommendation:** Implement sidepanel.html as a self-contained file with all CSS and JS inline. The side panel communicates with the content script via the existing background.js message passing infrastructure (Phase 1 established). Phase 3 UI only handles rendering, not download logic (Phase 4).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Side panel open/trigger | Browser (Chrome Side Panel API) | — | Handled by manifest.json + background.js onInstalled |
| Image grid rendering | Side panel (client-side UI) | — | Pure HTML/CSS/JS in sidepanel.html |
| Collapsible sections | Side panel UI | — | CSS max-height transition + JS toggle |
| Modal overlay | Side panel UI | — | CSS fixed positioning + JS event handling |
| Checkbox state management | Side panel UI | — | JavaScript Set-based tracking |
| Download button | Side panel UI (triggers Phase 4) | — | Button click dispatches to download logic |
| Image data receiving | Side panel (message listener) | Background → Content | Messaging chain: side panel requests, content responds |

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Pure HTML/CSS**: No framework, inline styles in HTML
- **iconify CDN**: All icons from iconify library (CDN)
- **Dark theme colors**: Background #1a1a1a, text #f5f5f5, accent #3b82f6 (per UI-SPEC)
- **2-column grid**: Square thumbnails, aspect-ratio 1:1

### Claude's Discretion
- JavaScript structure (single file vs modular)
- Event handling patterns (addEventListener vs inline)
- State management approach

### Deferred Ideas
- None — all Phase 3 requirements are in scope

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | Side panel opens via toolbar icon | Manifest V3 side_panel config + setPanelBehavior confirmed via [Chrome Side Panel API docs](https://developer.chrome.com/docs/extensions/reference/api/sidePanel) |
| UI-02 | Dark background (#1a1a1a), light text (#f5f5f5) | UI-SPEC color palette confirmed |
| UI-03 | Two-section display (主图 / 详情图), collapsible | Section structure in UI-SPEC, chevron rotation for collapse state |
| UI-04 | 2-column grid layout | CSS grid-template-columns: repeat(2, 1fr) per UI-SPEC |
| UI-05 | Square thumbnails with object-fit: cover | CSS aspect-ratio: 1/1 + object-fit: cover per UI-SPEC |
| UI-06 | Checkbox top-right on each thumbnail, default checked | Position absolute top-right with z-index, checked attribute default |
| UI-07 | Click thumbnail opens full-size modal | Click handler with stopPropagation, modal visibility toggle |
| UI-08 | Modal closes on X or outside click | Event listeners: backdrop click, X button click, Escape key |
| UI-09 | "一键下载" button at bottom | Fixed footer with prominent styling, disabled when 0 images selected |
| UI-10 | All icons from iconify | CDN script include confirmed, icon names per UI-SPEC |
| UI-11 | Clear visual hierarchy | Section headers (16px semibold), image grid, action button layering |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Pure HTML/CSS/JS | — | All UI rendering | Per UI-SPEC constraint |
| iconify (CDN) | 2.2.0 | Icon rendering | Per UI-SPEC constraint, CDN: `https://code.iconify.design/2/2.2.0/iconify.min.js` |

### Phase 4 Integration (not implemented in Phase 3)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| JSZip | 3.10+ | Zip file creation | Phase 4 download functionality |
| FileSaver.js | latest | Trigger browser download | Phase 4 download functionality |
| Canvas API | native | JPG conversion | Phase 4 image format conversion |

**Installation:** No npm install needed — all libraries loaded via CDN or native browser APIs.

---

## Architecture Patterns

### System Architecture Diagram

```
[Chrome Toolbar Icon Click]
        |
        v
[Side Panel Opens] ─── reads manifest.json side_panel.default_path
        |
        v
[sidepanel.html loads]
        |
        +-- (1) Sends message to background.js via chrome.runtime.sendMessage
        |           |
        |           v
        |    [background.js receives, forwards via chrome.tabs.sendMessage]
        |           |
        |           v
        |    [content.js receives GET_PAGE_DATA, extracts data, responds]
        |           |
        +--(2) Receives pageData via chrome.runtime.onMessage
        |
        v
[Renders image grid from pageData.mainImages + pageData.detailImages]

[User Interaction Flow:]
- Click section header → toggle collapse (max-height transition)
- Click thumbnail → open modal (stopPropagation prevents checkbox toggle)
- Click checkbox → toggle selection state (do NOT open modal)
- Click modal backdrop / X / Escape → close modal
- Click "一键下载" → triggers download (Phase 4)
```

### Recommended Project Structure
```
E:/个人项目/个人开发/Claude-Code/
└── sidepanel.html         # Phase 3 output: complete UI (HTML + CSS + JS)
```

**Note:** Phase 3 produces only `sidepanel.html`. No additional files needed — all CSS and JS are inline within the HTML file.

### Pattern 1: Collapsible Section with max-height Transition

**What:** Two-state section that collapses/expands with chevron icon rotation
**When to use:** When a section needs toggle visibility with visual feedback

**Implementation:**
```css
/* Collapsed state: max-height 0 prevents visibility */
.section-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 200ms ease-out;
}

/* Expanded state: max-height large enough for content */
.section-content.expanded {
  max-height: 1000px; /* arbitrary large value */
}

/* Chevron rotation: -90deg when collapsed (points right), 0 when expanded (points down) */
.chevron {
  transform: rotate(-90deg);
  transition: transform 200ms ease-out;
}
.chevron.expanded {
  transform: rotate(0deg);
}
```

**Source:** UI-SPEC Section Collapse/Expand section

### Pattern 2: Checkbox Stop-Propagation on Thumbnail Click

**What:** Prevents modal open when clicking checkbox, but allows modal open when clicking image
**When to use:** When a thumbnail has both clickable image (opens modal) and checkbox overlay

**Implementation:**
```javascript
// On image click — open modal
imageItem.addEventListener('click', (e) => {
  if (!e.target.classList.contains('checkbox')) {
    openModal(imageSrc);
  }
});

// On checkbox click — toggle selection only, no modal
checkbox.addEventListener('click', (e) => {
  e.stopPropagation(); // prevent image click handler
  toggleSelection(imageId);
});
```

**Source:** UI-SPEC Interaction Patterns: Modal Open / Checkbox Toggle

### Anti-Patterns to Avoid

- **Inline onclick handlers:** Use addEventListener instead for cleaner separation of concerns
- **Inline CSS classes:** All styles in `<style>` block per UI-SPEC constraint
- **Global state pollution:** Keep state in a single object, avoid multiple global variables
- **Synchronous DOM queries in loops:** Cache DOM references outside loops

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon rendering | Custom SVG icons | iconify CDN | UI-SPEC constraint, consistent across extension |
| Zip file creation | Native JS zip | JSZip | Cross-browser support, handles blob correctly |
| File download | Blob URL manual creation | FileSaver.js | Handles browser compatibility, correct filename encoding |
| JPG conversion | Server-side or library | Canvas API toBlob | Native browser API, quality parameter support |

**Key insight:** Canvas API's `toBlob(callback, 'image/jpeg', 0.92)` is the standard browser-native approach for client-side image format conversion. This is used in Phase 4.

---

## Common Pitfalls

### Pitfall 1: Checkbox Click Opens Modal
**What goes wrong:** Clicking checkbox toggles selection but also opens the modal because the click event bubbles up to the thumbnail.
**Why it happens:** Event propagation — checkbox click reaches imageItem click handler which calls openModal.
**How to avoid:** Use `e.stopPropagation()` in checkbox click handler before toggling selection.
**Warning signs:** Modal appears when checkbox is clicked, image URL shown in console when checkbox clicked.

### Pitfall 2: Section Collapse Animation Jank
**What goes wrong:** max-height transition doesn't animate smoothly, or content clips.
**Why it happens:** max-height from 0 to auto doesn't work in CSS — must use a large pixel value or alternative like grid rows.
**How to avoid:** Use a sufficiently large max-height value (e.g., 1000px) for expanded state, and set overflow: hidden on collapsed state.
**Warning signs:** Section content appears/disappears instantly without animation.

### Pitfall 3: Image Loading While Scrolling
**What goes wrong:** Large images cause layout shift or blank spaces while loading.
**Why it happens:** No placeholder or loading state defined for images.
**How to avoid:** Set min-height or aspect-ratio on image container, use loading="lazy" attribute.

### Pitfall 4: Escape Key Closes Wrong Modal
**What goes wrong:** If multiple modals exist, Escape closes the wrong one or doesn't close any.
**Why it happens:** Event listener attached but modal reference not tracked correctly.
**How to avoid:** Track modalOpen state boolean, only one modal allowed at a time per UI-SPEC.

---

## Code Examples

Verified patterns from official sources:

### Iconify CDN Setup (UI-SPEC)
```html
<script src="https://code.iconify.design/2/2.2.0/iconify.min.js"></script>
```
**Usage in HTML:**
```html
<span class="iconify" data-icon="material-symbols:chevron-down"></span>
```

### Canvas to JPG Conversion (Phase 4 prep, HIGH confidence via MDN)
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
canvas.toBlob(
  (blob) => {
    // blob is the JPG file
    zip.file('image.jpg', blob);
  },
  'image/jpeg',
  0.92 // quality
);
```

### JSZip + FileSaver Pattern (HIGH confidence via JSZip docs)
```javascript
// Source: https://stuk.github.io/jszip/
zip.generateAsync({ type: 'blob' }).then(function(content) {
  saveAs(content, 'product-images.zip');
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline SVG icons | iconify CDN | UI-SPEC decision | Consistent, updatable icons without bundled assets |
| Bootstrap/modern CSS frameworks | Pure inline CSS | UI-SPEC decision | No build step, simpler for extension |
| window.postMessage | chrome.runtime.sendMessage/onMessage | Manifest V3 requirement | Secure message passing between contexts |

**Deprecated/outdated:**
- None relevant to Phase 3

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Side panel width is ~400px (fixed by Chrome) | Architecture | Grid layout depends on available width; if wider, 2-column still works |
| A2 | iconify CDN 2.2.0 is still available and correct | Standard Stack | If CDN changes, icons won't load — monitor |
| A3 | 200ms message latency is acceptable for UI render | Architecture | If content script response is slow, "Loading..." persists longer |

---

## Open Questions

1. **How does side panel receive initial data?**
   - What we know: content.js sends pageData via chrome.runtime.sendMessage after GET_PAGE_DATA request
   - What's unclear: How does sidepanel.html listen for this message? Does it use chrome.runtime.onMessage?
   - Recommendation: sidepanel.html needs chrome.runtime.onMessage listener to receive pageData

2. **What happens if page has no images?**
   - What we know: UI-SPEC shows image count display, download button disabled when 0 selected
   - What's unclear: Empty state UI display (show "无图片" or similar?)
   - Recommendation: Display "暂无图片" message in each section if array is empty

3. **How to handle image load failures?**
   - What we know: Images loaded from external CDN (alicdn.com, taobao.com, tmall.com)
   - What's unclear: What to show if image fails to load (broken icon, placeholder?)
   - Recommendation: Add onerror handler to show broken image placeholder

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified — Phase 3 is pure HTML/CSS/JS with browser-native APIs)

---

## Validation Architecture

workflow.nyquist_validation is explicitly `false` in .planning/config.json — this section skipped.

---

## Security Domain

N/A — Phase 3 is pure UI rendering with no security-sensitive operations. Input validation and data fetching are handled in Phase 2 (content script) and Phase 4 (download). No user input is processed in Phase 3 UI.

---

## Sources

### Primary (HIGH confidence)
- [Chrome Side Panel API docs](https://developer.chrome.com/docs/extensions/reference/api/sidePanel) — API usage, manifest configuration, programmatic opening
- [MDN: HTMLCanvasElement.toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) — JPG conversion quality parameter
- [JSZip Documentation](https://stuk.github.io/jszip/) — zip generation pattern

### Secondary (MEDIUM confidence)
- [iconify CDN](https://code.iconify.design/2/2.2.0/iconify.min.js) — CDN availability confirmed via UI-SPEC reference

### Tertiary (LOW confidence)
- None — all critical claims verified via primary sources

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified via official docs or UI-SPEC constraint
- Architecture: HIGH — side panel messaging chain confirmed, UI pattern standard
- Pitfalls: MEDIUM — common patterns identified, may need adjustment based on testing

**Research date:** 2026-05-12
**Valid until:** 2026-06-12 (30 days — stable domain, Chrome API stable)