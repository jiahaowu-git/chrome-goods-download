---
phase: "01"
phase_name: "Extension Shell"
project: "chrome-goods-download"
generated: "2026-05-11T16:35:00Z"
counts:
  decisions: 4
  lessons: 3
  patterns: 3
  surprises: 2
missing_artifacts:
  - "UAT.md"
---

# Phase 01 Learnings: Extension Shell

## Decisions

### chrome.tabs.sendMessage instead of chrome.runtime.sendMessage for tab-specific messaging
Changed `chrome.runtime.sendMessage(tabId, ...)` to `chrome.tabs.sendMessage(tabId, ...)` in background.js after code review CR-01.

**Rationale:** chrome.runtime.sendMessage with a tabId does not work in Manifest V3 for sending messages to a specific tab. The correct API is chrome.tabs.sendMessage which is designed for tab-specific message passing.

**Source:** 01-02-SUMMARY.md

---

### async/await for chrome.sidePanel.setPanelBehavior Promise
Added async/await to properly handle the Promise returned by chrome.sidePanel.setPanelBehavior.

**Rationale:** chrome.sidePanel.setPanelBehavior returns a Promise. Without async/await, the code was not properly waiting for the Promise to resolve before continuing execution.

**Source:** 01-02-SUMMARY.md

---

### Keep messaging infrastructure as stub with placeholder for Phase 2
Retained messaging infrastructure (MESSAGE_TYPES, sendPageDataToBackground, extractPageData placeholder) in content.js rather than implementing full extraction in Phase 1.

**Rationale:** Clear separation of concerns — Phase 1 builds the communication infrastructure, Phase 2 adds the actual extraction logic. This keeps Phase 1 focused and allows parallel work streams.

**Source:** 01-02-PLAN.md, 01-02-SUMMARY.md

---

### sidepanel.html as shell with id="app" mount point for Phase 3 UI
Added id="app" div and script tag for sidepanel.js in sidepanel.html as Phase 3 mount point, rather than building full UI in Phase 1.

**Rationale:** Decoupled approach allows Phase 1 to focus on infrastructure while Phase 3 focuses on UI. The mount point pattern (id="app") enables clean separation between shell and actual component rendering.

**Source:** 01-02-SUMMARY.md

---

## Lessons

### Manifest V3 tab-specific messaging requires chrome.tabs API, not chrome.runtime
Content script→background→sidepanel routing required using chrome.tabs.sendMessage for tab-specific message delivery. chrome.runtime.sendMessage only works for broadcast-style messaging to the service worker itself.

**Context:** When implementing the message routing from content.js → background.js → sidepanel.html, initially attempted to use chrome.runtime.sendMessage with a tabId parameter. This API does not support tab-specific delivery in Manifest V3. The correct approach is chrome.tabs.sendMessage.

**Source:** 01-02-SUMMARY.md (CR-01 fix)

---

### chrome.sidePanel.setPanelBehavior is async and must be awaited
The chrome.sidePanel.setPanelBehavior API returns a Promise that must be handled with async/await.

**Context:** Initial implementation called chrome.sidePanel.setPanelBehavior without awaiting, causing potential race conditions where subsequent code executed before the panel behavior was set.

**Source:** 01-02-SUMMARY.md (WR-01 fix)

---

### sendResponse callback lifetime in chrome.runtime.onMessage
The sendResponse callback in chrome.runtime.onMessage fires asynchronously. If it is called outside the callback where the response data is available, the response fires prematurely.

**Context:** When using chrome.tabs.query inside an onMessage handler, the sendResponse was initially placed outside the query callback, causing it to fire before the tab data was retrieved.

**Source:** 01-02-SUMMARY.md (WR-02 fix)

---

## Patterns

### Message routing chain (content → background → sidepanel)
A three-hop message routing pattern where content.js sends to background.js via chrome.runtime.sendMessage, background.js receives via chrome.runtime.onMessage, then forwards to sidepanel.html via chrome.tabs.sendMessage to the active tab.

**When to use:** When a content script needs to communicate with a side panel in a Chrome extension with Manifest V3. The background service worker acts as a relay between the content script's isolated world and the side panel's page context.

**Source:** 01-02-PLAN.md, 01-02-SUMMARY.md

---

### Placeholder stub pattern for phased implementation
Functions like extractPageData() are implemented as documented stubs that return mock data, with explicit JSDoc comments explaining the placeholder status and referencing the phase where actual implementation will occur.

**When to use:** When a function's interface is needed in the current phase but the full implementation belongs in a later phase. The stub provides the contract while actual logic is deferred.

**Source:** 01-01-SUMMARY.md (placeholder documented in content.js), 01-02-SUMMARY.md (extractPageData stub)

---

### Service worker registration pattern for side panel
Service worker sets up side panel behavior on installation: chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }) so the side panel opens when the toolbar icon is clicked.

**When to use:** When configuring a Chrome extension side panel that should open via toolbar icon click. The onInstalled listener ensures the behavior is set on first installation and extension upgrades.

**Source:** 01-02-PLAN.md, background.js

---

## Surprises

### 2 of 7 observable truths require human browser verification
Of the 7 observable truths verified for Phase 1, only 5 could be verified programmatically. Two required human verification in a Chrome browser: (1) extension loads without errors, (2) toolbar icon displays correctly.

**Impact:** Full automated verification was not possible. The build artifact validation passed, but runtime behavior in Chrome could not be verified without manual testing.

**Source:** 01-VERIFICATION.md

---

### The placeholder "anti-pattern" in content.js was flagged in verification
The placeholder extractPageData() function in content.js was flagged as an INFO-level anti-pattern in 01-VERIFICATION.md under "Anti-Patterns Found." However, this was intentional and documented — the plan explicitly states actual extraction comes in Phase 2.

**Impact:** Verification tools may flag intentional placeholders as issues if the pattern isn't understood. The SUMMARY correctly notes this is "documented and intentional per plan" but the verification report still surfaces it as a finding.

**Source:** 01-VERIFICATION.md, 01-01-SUMMARY.md