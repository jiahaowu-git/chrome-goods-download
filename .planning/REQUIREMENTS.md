# Requirements: chrome-goods-download

**Defined:** 2026-05-11
**Core Value:** Users can quickly download all product images from Taobao/Tmall detail pages with one click

## v1 Requirements

### Platform Detection

- [ ] **DETECT-01**: Content script runs on page load
- [ ] **DETECT-02**: Detect if current page is Taobao or Tmall detail page via URL/HTML patterns
- [ ] **DETECT-03**: Show error state UI when page is not a supported e-commerce detail page

### Image Extraction

- [ ] **EXTRACT-01**: Extract all main images (主图) from page DOM (from `auctionImages`, `itemPicMaps`, or similar data)
- [ ] **EXTRACT-02**: Extract all detail/description images (详情图) from page
- [ ] **EXTRACT-03**: Separate main images from detail images into two groups

### Side Panel UI

- [ ] **UI-01**: Side panel opens when toolbar icon clicked (Manifest V3 Side Panel API)
- [ ] **UI-02**: Dark background (#1a1a1a), light text (#f5f5f5)
- [ ] **UI-03**: Two-section display: "主图" section and "详情图" section, collapsible
- [ ] **UI-04**: 2-column grid layout for images (2 per row)
- [ ] **UI-05**: Square thumbnails with object-fit: cover (CSS)
- [ ] **UI-06**: Checkbox top-right on each thumbnail, default checked (checked=true)
- [ ] **UI-07**: Click thumbnail to open full-size image in modal/overlay
- [ ] **UI-08**: Modal shows image centered, click outside or X button to close
- [ ] **UI-09**: "一键下载" button at bottom, prominent styling
- [ ] **UI-10**: All icons from iconify CDN (@iconify/react or @iconify/vue)
- [ ] **UI-11**: Visual hierarchy: section headers, image grid, action button clearly layered

### Download Processing

- [ ] **DOWN-01**: On "一键下载" click, collect all checked images
- [ ] **DOWN-02**: Fetch each image (handle cross-origin via fetch → ArrayBuffer)
- [ ] **DOWN-03**: Draw each image onto canvas, export as JPG blob (quality 0.92)
- [ ] **DOWN-04**: Add all JPG blobs to zip using JSZip
- [ ] **DOWN-05**: Name zip file from page title (cleaned of special chars)
- [ ] **DOWN-06**: Trigger browser download of zip file

### Extension Shell

- [ ] **SHELL-01**: manifest.json with Side Panel API permissions
- [ ] **SHELL-02**: Toolbar icon (3 sizes for different contexts)
- [ ] **SHELL-03**: Service worker for background communication
- [ ] **SHELL-04**: Content script injected into pages for extraction

## Out of Scope

| Feature | Reason |
|---------|--------|
| Platforms other than Taobao/Tmall | Out of scope per user request |
| Video extraction | Not in requirements |
| Multiple tab downloads | Single tab mode only |
| User login/account | Not needed for image extraction |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DETECT-01 | Phase 1 | Pending |
| DETECT-02 | Phase 1 | Pending |
| DETECT-03 | Phase 1 | Pending |
| EXTRACT-01 | Phase 2 | Pending |
| EXTRACT-02 | Phase 2 | Pending |
| EXTRACT-03 | Phase 2 | Pending |
| UI-01 | Phase 3 | Pending |
| UI-02 | Phase 3 | Pending |
| UI-03 | Phase 3 | Pending |
| UI-04 | Phase 3 | Pending |
| UI-05 | Phase 3 | Pending |
| UI-06 | Phase 3 | Pending |
| UI-07 | Phase 3 | Pending |
| UI-08 | Phase 3 | Pending |
| UI-09 | Phase 3 | Pending |
| UI-10 | Phase 3 | Pending |
| UI-11 | Phase 3 | Pending |
| DOWN-01 | Phase 4 | Pending |
| DOWN-02 | Phase 4 | Pending |
| DOWN-03 | Phase 4 | Pending |
| DOWN-04 | Phase 4 | Pending |
| DOWN-05 | Phase 4 | Pending |
| DOWN-06 | Phase 4 | Pending |
| SHELL-01 | Phase 5 | Pending |
| SHELL-02 | Phase 5 | Pending |
| SHELL-03 | Phase 5 | Pending |
| SHELL-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-11*
*Last updated: 2026-05-11 after initial definition*
