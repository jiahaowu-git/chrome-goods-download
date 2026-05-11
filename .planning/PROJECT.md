# chrome-goods-download

## What This Is

A Chrome extension that extracts and downloads product images from Taobao/Tmall detail pages. The extension runs in a side panel and lets users preview, select, and batch-download images as JPGs in a zip file.

## Core Value

Users can quickly download all product images from any Taobao or Tmall detail page with one click, with all images normalized to JPG format for maximum compatibility.

## Requirements

### Active

- [ ] Extension icon in Chrome toolbar that opens side panel on click
- [ ] Detect Taobao/Tmall detail pages; show error on other pages
- [ ] Extract main images (主图) and detail images (详情图) separately
- [ ] Display images in a 2-column grid with square thumbnails
- [ ] Click thumbnail to show full-size image in a modal/overlay
- [ ] Checkbox on each image (top-right corner), default checked
- [ ] "一键下载" (Download Selected) button at bottom
- [ ] Convert all selected images to JPG before zipping
- [ ] Download zip named after the product title
- [ ] Side panel UI only affects the current active tab
- [ ] Dark theme with light content, clean and modern layout
- [ ] All icons from iconify library

### Out of Scope

- [ ] Support for platforms other than Taobao/Tmall
- [ ] Video extraction
- [ ] Batch download across multiple tabs
- [ ] User account/login features

## Context

- Chrome extension using Manifest V3
- Side Panel API for UI
- Content script to inject into detail pages and extract image URLs
- Service worker for background processing
- JSZip + file-saver for client-side zip creation
- Canvas API for image format conversion (PNG/webp → JPG)

## Constraints

- **Chrome-only**: Uses Side Panel API, Chrome 114+
- **Single tab**: Side panel scoped to the tab that activated it
- **Client-side only**: No server, all processing in browser
- **Image conversion**: Must handle cross-origin images via fetch→canvas→blob

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Side Panel API | Chrome's modern side panel API, better UX than popup | ✓ Confirmed |
| Convert to JPG | PNG/webp with special suffixes may not open in standard viewers | ✓ Confirmed |
| iconify for icons | User requirement | ✓ Confirmed |
| 2-column grid | Clean display, square thumbnails | ✓ Confirmed |
| Product name from page title | Standard approach when no explicit product ID | ✓ Confirmed |

---
*Last updated: 2026-05-11 after initialization*
