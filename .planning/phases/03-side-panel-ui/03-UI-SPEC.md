---
status: draft
phase: 03
phase_name: Side Panel UI
created: 2026-05-12
source: upstream artifacts + design contract
---

# UI-SPEC: Phase 3 — Side Panel UI

## Design System

| Property | Value |
|----------|-------|
| Type | Pure HTML/CSS (no framework) |
| Target | Chrome Extension Side Panel |
| Icons | iconify (CDN) |
| Styling | Inline `<style>` in HTML |

---

## Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| Background | `#1a1a1a` | Body background, modal backdrop |
| Surface | `#2a2a2a` | Section headers, cards (if any) |
| Surface Hover | `#333333` | Thumbnail hover state |
| Text Primary | `#f5f5f5` | All visible text |
| Text Secondary | `#a0a0a0` | Section labels, counts |
| Accent | `#3b82f6` | Primary button, checkboxes |
| Accent Hover | `#2563eb` | Button hover |
| Border | `#3a3a3a` | Section dividers, thumbnail borders |
| Modal Overlay | `rgba(0,0,0,0.85)` | Modal backdrop |

**60/30/10 split confirmed:** background (#1a1a1a) = 60%, surfaces (#2a2a2a) = 30%, accent (#3b82f6) = 10%

---

## Typography

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Body text | 14px | 400 (regular) | 1.5 |
| Section header | 16px | 600 (semibold) | 1.2 |
| Button text | 14px | 600 (semibold) | 1.0 |
| Count badge | 12px | 400 (regular) | 1.0 |

**Font Stack:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

---

## Spacing System (8-point scale)

| Token | Value | Usage |
|-------|-------|-------|
| `space-xs` | 4px | Icon-to-text gaps |
| `space-sm` | 8px | Checkbox padding from edges |
| `space-md` | 16px | Container padding, grid gap |
| `space-lg` | 24px | Section header padding |
| `space-xl` | 32px | Button margin-top from grid |

**All spacing values MUST be multiples of 4px.**

---

## Layout Structure

```
sidepanel.html (viewport: 100vw x 100vh)
├── #app
│   ├── .panel-header (height: 56px, sticky)
│   │   ├── h1: "下载图片" (16px semibold)
│   │   └── .image-count (12px, secondary text)
│   │
│   ├── #main-images-section (collapsible)
│   │   ├── .section-header (clickable, collapse toggle)
│   │   │   ├── icon: chevron-down / chevron-right
│   │   │   ├── span: "主图"
│   │   │   └── .count-badge: "(0)"
│   │   │
│   │   └── .image-grid (display: grid, 2 columns, gap: 16px)
│   │       └── .image-item (square aspect-ratio: 1/1)
│   │           ├── img (object-fit: cover, 100%)
│   │           └── .checkbox (top-right, 20x20, rounded)
│   │
│   ├── #detail-images-section (collapsible)
│   │   └── (same structure as main-images)
│   │
│   └── .panel-footer (fixed bottom)
│       └── .download-btn: "一键下载" (full-width, accent bg)
│
└── #modal (hidden by default, fixed overlay)
    ├── .modal-backdrop (click to close)
    ├── .modal-content (max 90vw x 90vh)
    │   ├── img (max-width: 100%, max-height: 100%)
    │   └── .modal-close (top-right, X icon, 40x40)
    └── (keyboard: Escape to close)
```

### Responsive Strategy
- Side panel has fixed width in Chrome (typically 400px)
- Grid: 2 columns with 16px gap = `calc(50% - 8px)` per column
- Thumbnail size: calculated from available width, always square

---

## Component Specifications

### Section Header

| Property | Value |
|----------|-------|
| Height | 48px |
| Padding | 16px horizontal |
| Background | `#2a2a2a` |
| Border Bottom | 1px solid `#3a3a3a` |
| Cursor | pointer |
| Flex Layout | icon + text + count (space-between) |

**States:**
- Default: as above
- Hover: background `#333333`
- Collapsed: chevron icon rotated -90deg

**Collapse animation:** `max-height` transition, 200ms ease-out

---

### Image Thumbnail

| Property | Value |
|----------|-------|
| Aspect Ratio | 1:1 (square) |
| Object Fit | cover |
| Border Radius | 8px |
| Border | 1px solid `#3a3a3a` |
| Background | `#2a2a2a` |
| Overflow | hidden |

**States:**
- Default: as above
- Hover: border-color `#3b82f6`, transform scale(1.02)
- Active (click): scale(0.98) for 100ms

---

### Checkbox

| Property | Value |
|----------|-------|
| Size | 20px x 20px |
| Position | top-right, offset 8px from edges |
| Border Radius | 4px (rounded corners) |
| Border | 2px solid `#3a3a3a` (unchecked) |
| Background | `#3b82f6` (checked) |
| Icon | checkmark (iconify) on checked state, hidden when unchecked |

**States:**
- Unchecked: border `#3a3a3a`, background transparent
- Checked: border `#3b82f6`, background `#3b82f6`, white checkmark visible
- Hover (unchecked): border `#5a5a5a`
- Hover (checked): background `#2563eb`

**Interaction:** Clicking checkbox toggles checked state without triggering modal open.

---

### Download Button

| Property | Value |
|----------|-------|
| Width | calc(100% - 32px) (centered with 16px margin) |
| Height | 48px |
| Margin | 16px horizontal, 24px top |
| Border Radius | 8px |
| Background | `#3b82f6` |
| Text | "一键下载" (14px, semibold, white) |
| Font | iconify icon: "material-symbols:download" + text |

**States:**
- Default: as above
- Hover: background `#2563eb`, cursor pointer
- Active: background `#1d4ed8`
- Disabled: opacity 0.5, cursor not-allowed (no images selected)

---

### Modal Overlay

| Property | Value |
|----------|-------|
| Position | fixed, full viewport |
| Z-index | 9999 |
| Background | `rgba(0,0,0,0.85)` |
| Display | none (hidden by default) |
| Flex Layout | center (justify-content + align-items center) |

**Open animation:** fade in 150ms

**Close triggers:**
1. Click on X button (top-right of image)
2. Click on backdrop
3. Press Escape key

**Close animation:** fade out 150ms

---

### Modal Close Button

| Property | Value |
|----------|-------|
| Size | 40px x 40px |
| Position | absolute, top 16px, right 16px |
| Border Radius | 50% (circle) |
| Background | `rgba(0,0,0,0.6)` |
| Icon | "material-symbols:close" (24px, white) |

**States:**
- Default: as above
- Hover: background `rgba(0,0,0,0.8)`

---

## Icon Usage (iconify CDN)

All icons loaded via iconify CDN in HTML head:
```html
<script src="https://code.iconify.design/2/2.2.0/iconify.min.js"></script>
```

| Icon Name | Usage | Size |
|-----------|-------|------|
| `material-symbols:chevron-down` | Section expand | 20px |
| `material-symbols:chevron-right` | Section collapse | 20px |
| `material-symbols:download` | Download button | 20px |
| `material-symbols:close` | Modal close | 24px |
| `material-symbols:check` | Checkbox checked | 14px |

**Icon color:** Inherit from parent (white for dark backgrounds)

---

## Interaction Patterns

### Section Collapse/Expand
1. User clicks section header
2. `aria-expanded` toggles (true/false)
3. Chevron icon rotates 90 degrees (down = expanded, right = collapsed)
4. `.image-grid` max-height transitions from 0 to auto
5. Grid visibility toggles

### Modal Open
1. User clicks thumbnail image (not checkbox)
2. `e.stopPropagation()` prevents checkbox toggle
3. Modal backdrop fades in
4. Image src set to full-size URL
5. `aria-modal="true"` on modal

### Modal Close
1. User clicks X button OR backdrop OR presses Escape
2. Modal fades out (150ms)
3. Image src cleared after fade completes

### Checkbox Toggle
1. User clicks checkbox
2. Toggle `checked` attribute
3. Update checkbox visual state (checkmark icon visible/hidden)
4. Do NOT open modal
5. Re-count selected images for download button state

### Download Button State
- **Enabled:** At least 1 image checked, all images loaded
- **Disabled:** 0 images checked OR still loading

---

## CSS Properties Reference

All CSS using standard properties, no Tailwind or preprocessors.

```css
/* Grid */
grid-template-columns: repeat(2, 1fr);
gap: 16px;

/* Square thumbnail */
aspect-ratio: 1 / 1;
object-fit: cover;

/* Flex centering for modal */
display: flex;
justify-content: center;
align-items: center;

/* Transition defaults */
transition: all 150ms ease-out;
```

---

## JavaScript State (Interface Only)

Phase 3 handles UI rendering and interactions. Download logic (Phase 4) not included.

| State Variable | Type | Purpose |
|----------------|------|---------|
| `mainImages[]` | Array | Main product images |
| `detailImages[]` | Array | Detail page images |
| `selectedImages Set` | Set | Currently checked image IDs |
| `isMainSectionOpen` | Boolean | Collapse state |
| `isDetailSectionOpen` | Boolean | Collapse state |
| `modalOpen` | Boolean | Modal visibility |

---

## File Structure

```
E:/个人项目/个人开发/Claude-Code/
└── sidepanel.html         # Main UI file (HTML + CSS + JS)
```

**Phase 3 output:** `sidepanel.html` with complete UI implementation.

---

## Verification Checklist

- [ ] Dark theme: background `#1a1a1a`, text `#f5f5f5`
- [ ] 2-column grid with 16px gap
- [ ] Square thumbnails (1:1 aspect ratio)
- [ ] Checkbox top-right on each thumbnail, default checked
- [ ] Two collapsible sections: 主图, 详情图
- [ ] Click thumbnail opens modal
- [ ] Modal closes via X, outside click, Escape
- [ ] "一键下载" button at bottom, full-width
- [ ] All icons from iconify CDN
- [ ] Hover/active states on all interactive elements
- [ ] Section collapse/expand works with chevron rotation
- [ ] No console errors