# Plan 04-01 Summary: Download Infrastructure

## Execution
- **Date:** 2026-05-13
- **Phase:** 04 - Download with JPG Conversion
- **Wave:** 1

## Changes Made

### Task 1: Add JSZip and FileSaver CDN includes
- Added `jszip@3.10.1` CDN script tag at line 8
- Added `FileSaver.js@2.0.5` CDN script tag at line 9
- Both load synchronously before download logic

### Task 2: Add fetchImageAsJpgBlob and sanitizeFilename helpers
- `fetchImageAsJpgBlob(url)` (line 583): Fetches image, converts to JPG via canvas at quality 0.92, returns Promise<Blob>
- `sanitizeFilename(name)` (line 617): Strips illegal filename characters, trims, limits to 200 chars

### Task 3: Add downloadImages event listener
- Listens for `window.addEventListener('downloadImages', ...)` (line 625)
- Filters to checked images only (DOWN-01)
- Processes images in batches of 5 with memory management (DOWN-02)
- Converts all images to JPG via canvas quality 0.92 (DOWN-03)
- Packages into JSZip zip file (DOWN-04)
- Names zip from sanitized pageTitle (DOWN-05)
- Triggers download via FileSaver.saveAs (DOWN-06)

## Verification
- [x] JSZip CDN script tag present
- [x] FileSaver CDN script tag present
- [x] fetchImageAsJpgBlob function defined
- [x] sanitizeFilename function defined
- [x] downloadImages event listener defined

## Dependencies
- None (Wave 1, no dependencies)
