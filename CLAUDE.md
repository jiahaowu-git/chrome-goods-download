# chrome-goods-download

## Project Overview

A Chrome extension that extracts and downloads product images from Taobao/Tmall detail pages. The extension runs in a Chrome side panel and lets users preview, select, and batch-download images as JPGs in a zip file.

## Core Value

Users can quickly download all product images from any Taobao or Tmall detail page with one click, with all images normalized to JPG format for maximum compatibility.

## Workflow

Use `/gsd-progress` to check current state and route to next action.

Use `/gsd-plan-phase N` to plan and execute a specific phase.

Use `/gsd-next` to auto-advance to the next logical step.

## Key Constraints

- Chrome-only (Side Panel API, Chrome 114+)
- Single tab (side panel scoped to activating tab)
- Client-side only (no server)
- All images converted to JPG before zipping
- All icons from iconify library

## Important Files

- `.planning/PROJECT.md` — Project context and requirements
- `.planning/REQUIREMENTS.md` — Full requirements list with IDs
- `.planning/ROADMAP.md` — 5-phase execution plan
- `.planning/STATE.md` — Current tracking state

## Phase Sequence

1. Extension Shell (manifest, icons, service worker, content script)
2. Platform Detection & Image Extraction
3. Side Panel UI (dark theme, 2-column grid, modal, checkboxes)
4. Download with JPG Conversion (JSZip, canvas conversion)
5. Integration & Testing

## Tech Stack

- Manifest V3 + Side Panel API
- Content script injection
- JSZip + FileSaver for client-side zip
- Canvas API for image format conversion
- iconify for all icons
