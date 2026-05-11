# Roadmap: chrome-goods-download

**Phases:** 5 | **Requirements:** 26 | **Mode:** standard

## Phase 1: Extension Shell
**Goal:** Set up the Chrome extension foundation with Manifest V3, Side Panel API, and basic project structure

| Requirement | ID |
|-------------|-----|
| manifest.json with Side Panel API permissions | SHELL-01 |
| Toolbar icon (3 sizes) | SHELL-02 |
| Service worker for background communication | SHELL-03 |
| Content script injection setup | SHELL-04 |

**Success Criteria:**
1. Extension loads in `chrome://extensions/` without errors
2. Side panel opens when toolbar icon clicked
3. Content script can communicate with side panel

---

## Phase 2: Platform Detection & Image Extraction
**Goal:** Detect Taobao/Tmall pages and extract image URLs from the DOM

| Requirement | ID |
|-------------|-----|
| Content script runs on page load | DETECT-01 |
| Detect Taobao/Tmall detail pages | DETECT-02 |
| Show error UI on unsupported pages | DETECT-03 |
| Extract all main images from page DOM | EXTRACT-01 |
| Extract all detail/description images | EXTRACT-02 |
| Separate main images from detail images | EXTRACT-03 |

**Success Criteria:**
1. Valid Taobao/Tmall detail page detected correctly
2. Non-detail pages show clear error message
3. All main images and detail images extracted and grouped

---

## Phase 3: Side Panel UI
**Goal:** Build the full dark-themed side panel interface with image grid, modal, and checkboxes

| Requirement | ID |
|-------------|-----|
| Side panel opens via toolbar icon | UI-01 |
| Dark background (#1a1a1a), light text (#f5f5f5) | UI-02 |
| Two-section display (主图 / 详情图) | UI-03 |
| 2-column grid layout | UI-04 |
| Square thumbnails with object-fit: cover | UI-05 |
| Checkbox top-right, default checked | UI-06 |
| Click thumbnail opens full-size modal | UI-07 |
| Modal close on X or outside click | UI-08 |
| "一键下载" button at bottom | UI-09 |
| All icons from iconify | UI-10 |
| Clear visual hierarchy | UI-11 |

**Success Criteria:**
1. Side panel displays with dark theme applied
2. Main images and detail images shown in separate collapsible sections
3. All images display as square thumbnails in 2-column grid
4. Clicking image opens modal with full-size view
5. Each image has visible checkbox (top-right), checked by default
6. "一键下载" button visible and styled at bottom

---

## Phase 4: Download with JPG Conversion
**Goal:** Implement the batch download with canvas-based JPG conversion

| Requirement | ID |
|-------------|-----|
| Collect all checked images on button click | DOWN-01 |
| Fetch images with cross-origin handling | DOWN-02 |
| Convert images to JPG via canvas (quality 0.92) | DOWN-03 |
| Package all JPGs into zip using JSZip | DOWN-04 |
| Name zip from page title | DOWN-05 |
| Trigger browser download of zip | DOWN-06 |

**Success Criteria:**
1. Clicking "一键下载" processes all checked images
2. All images converted to JPG format before zipping
3. Zip file downloads with product name as filename
4. Zip contains only selected (checked) images

---

## Phase 5: Integration & Testing
**Goal:** End-to-end testing on real Taobao/Tmall pages, final polish

**Success Criteria:**
1. Real Taobao product page: images extracted, download works
2. Real Tmall product page: images extracted, download works
3. Non-ecommerce page: clear error shown
4. Extension icons display correctly at all sizes
5. No console errors in service worker or content script

---

## Project Summary

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 1 | Extension Shell | 4 | ○ |
| 2 | Platform Detection & Image Extraction | 6 | ○ |
| 3 | Side Panel UI | 11 | ○ |
| 4 | Download with JPG Conversion | 6 | ○ |
| 5 | Integration & Testing | 5 | ○ |

---
*Roadmap created: 2026-05-11*
*Last updated: 2026-05-11 after initial creation*
