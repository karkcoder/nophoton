# NoPhoton — AI Context Document

This file gives an AI assistant everything needed to work on this project without reading all source files.

---

## Project Summary

**NoPhoton** is a Manifest V3 Chromium extension (Chrome, Brave, Edge) that forces a dark theme on any webpage by injecting a CSS stylesheet. It has an on/off toggle and a smart "Ignore if dark" mode that skips pages already in dark mode.

---

## Repository Layout

```
/
├── extension/              ← Source of truth for the extension
│   ├── manifest.json
│   ├── content/
│   │   └── content.js      ← Injected into every page
│   ├── popup/
│   │   ├── popup.html      ← Toolbar popup UI
│   │   └── popup.js        ← Popup logic / Chrome API calls
│   └── icons/              ← Generated PNGs (16, 48, 128 px) — do not edit by hand
├── artifacts/              ← Build outputs (git-committed for distribution)
│   ├── nophoton.crx        ← Signed CRX package
│   └── nophoton/           ← Unpacked copy of the extension
├── scripts/
│   └── generate-icons.py   ← Generates icon PNGs with Pillow; run via build.sh
├── build.sh                ← Full build pipeline (icons → validate → dist → zip → crx)
├── README.md
└── AGENTS.md               ← This file
```

> **`dist/`** is created at build time (not committed). It's a clean copy of `extension/` used as the packaging source.

---

## manifest.json (key fields)

| Field                  | Value                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| `manifest_version`     | 3                                                                  |
| `name`                 | "NoPhoton - Dark Mode Toggle"                                      |
| `version`              | "1.0.0"                                                            |
| `permissions`          | `activeTab`, `tabs`, `scripting`, `storage`                        |
| `action.default_popup` | `popup/popup.html`                                                 |
| Content script         | `content/content.js` injected at `document_idle` into `<all_urls>` |
| Icons                  | `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`        |

---

## content/content.js

Entire file is wrapped in an IIFE to avoid polluting global scope.

**Constants / globals**

- `STYLE_ID = "__nophoton_style__"` — id of the injected `<style>` element.

**Key functions**

| Function                       | Purpose                                                                                                                                                                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `detectPageTheme()`            | Returns `"dark"`, `"light"`, or `"unknown"`. Checks CSS class names on `<html>`/`<body>` first, then luminance of computed background/text colours, then OS `prefers-color-scheme` as fallback.                                                     |
| `getColorLuminance(rgbString)` | Luma formula: `0.299r + 0.587g + 0.114b`. Returns 0–255.                                                                                                                                                                                            |
| `applyDark()`                  | Creates and appends a `<style id="__nophoton_style__">` that sets `background-color: #1b1b1b !important`, `color: #ffffff !important`, `border-color: #444444 !important`, link colour `#7eb8f7`, and `filter: brightness(0.85)` on media elements. |
| `removeDark()`                 | Removes the injected `<style>` element.                                                                                                                                                                                                             |
| `applyAutoDetectedDarkMode()`  | Only calls `applyDark()` when page theme is `"unknown"`.                                                                                                                                                                                            |

**Global window functions (called via `scripting.executeScript`)**

| Name                                        | Args                            | Behaviour                                                                                                   |
| ------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `window.__nophotonSetDark(enabled, ignore)` | `enabled: bool`, `ignore: bool` | Applies or removes dark mode. If `ignore=true` and page is already dark, calls `removeDark()` instead.      |
| `window.__nophotonGetTheme()`               | —                               | Returns result of `detectPageTheme()`.                                                                      |
| `window.__nophotonSetIgnoreIfDark(ignore)`  | `ignore: bool`                  | If `true`: removes dark overlay when page is already dark. If `false`: calls `applyAutoDetectedDarkMode()`. |

**Startup behaviour (storage listener at bottom of file)**

- Reads `chrome.storage.local` keys `darkMode` (default `true`) and `ignoreIfDark` (default `true`).
- If dark mode is on and ignore is on and page is already dark → does nothing.
- Otherwise calls `applyDark()`.

---

## popup/popup.html

- Width: 220 px, dark background `#1b1b1b`, text `#f0f0f0`.
- Font stack: Ubuntu → Cantarell → Liberation Sans → DejaVu Sans.
- Accent / active colour: `#ff0000` (red).
- Elements:
  - `#darkToggle` — checkbox powering the CSS toggle switch.
  - `#statusText` — "ON" / "OFF" label; classes `on` (red) / `off` (lighter red `#ff5555`).
  - `#ignoreIfDark` — checkbox; greyed out (`.disabled`) when dark mode is off.
  - `#pageTheme` — shows detected theme of the active tab.

---

## popup/popup.js

**State source**: `chrome.storage.local` keys `darkMode` (bool) and `ignoreIfDark` (bool).

**Functions**

| Function                          | Purpose                                                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `setLabel(isOn)`                  | Updates `#statusText` text and CSS class.                                                                               |
| `detectPageTheme(tab)`            | Calls `window.__nophotonGetTheme()` on the active tab via `scripting.executeScript`; updates `#pageTheme`.              |
| `applyToAllTabs(enabled, ignore)` | Queries all open tabs (skips `chrome://` and `about:` URLs), calls `window.__nophotonSetDark(enabled, ignore)` on each. |
| `syncIgnoreIfDark(isOn)`          | Enables/disables the "Ignore if dark" checkbox wrapper based on toggle state.                                           |

**Event flow**

1. On load: read storage → set toggle + checkbox + label + sync disabled state; also detect page theme for active tab.
2. `#darkToggle` change → save `darkMode` to storage → `applyToAllTabs`.
3. `#ignoreIfDark` change → save `ignoreIfDark` to storage → `applyToAllTabs`.

---

## scripts/generate-icons.py

- Requires **Pillow** (auto-installs if missing).
- Sizes: 16, 48, 128 px.
- Design: black background, dark-red rounded-rect border (`#8B0000`), red "NP" text (`#FF0000`).
- Font: `/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`; falls back to PIL default.
- Writes `icon{size}.png` to the path passed as `sys.argv[1]` (normally `extension/icons/`).

---

## build.sh Pipeline

1. `scripts/generate-icons.py extension/icons/` — regenerate PNGs.
2. Validate `extension/manifest.json` with Python `json.load`.
3. `rsync` `extension/` → `dist/` (clean copy).
4. Copy `dist/` → `artifacts/nophoton/` (unpacked, for git/distribution).
5. `zip -r artifacts/nophoton.zip dist/` (paths inside zip are relative).
6. `crx3 dist/ -o artifacts/nophoton.crx -p nophoton.pem` (requires `npm install -g crx3` and a `nophoton.pem` RSA key; skip step if `crx3` not found).

> **Key not committed**: `nophoton.pem` must exist at repo root. Generate with `openssl genrsa 2048 > nophoton.pem`.

---

## Chrome APIs Used

| API                                               | Where                 | Why                                                  |
| ------------------------------------------------- | --------------------- | ---------------------------------------------------- |
| `chrome.storage.local`                            | content.js + popup.js | Persist `darkMode` and `ignoreIfDark` state globally |
| `chrome.scripting.executeScript`                  | popup.js              | Inject/call functions in page context                |
| `chrome.tabs.query`                               | popup.js              | Iterate all open tabs for global apply               |
| `window.matchMedia("prefers-color-scheme: dark")` | content.js            | OS-level dark mode fallback                          |

---

## Colour Palette

| Purpose                | Hex       |
| ---------------------- | --------- |
| Page background (dark) | `#1b1b1b` |
| Page text (dark)       | `#ffffff` |
| Page border (dark)     | `#444444` |
| Link colour (dark)     | `#7eb8f7` |
| Accent / toggle active | `#ff0000` |
| Toggle inactive        | `#ff5555` |
| Popup background       | `#1b1b1b` |
| Icon border            | `#8b0000` |
| Icon text              | `#ff0000` |

---

## Common Tasks

| Task                                   | Where to edit                                        |
| -------------------------------------- | ---------------------------------------------------- |
| Change injected CSS (colours, filters) | `extension/content/content.js` → `applyDark()`       |
| Add new popup controls                 | `extension/popup/popup.html` + `popup.js`            |
| Change dark-mode detection heuristics  | `extension/content/content.js` → `detectPageTheme()` |
| Change icon appearance                 | `scripts/generate-icons.py`, then run `./build.sh`   |
| Bump version                           | `extension/manifest.json` → `"version"`              |
| Add new permission                     | `extension/manifest.json` → `"permissions"` array    |
| Rebuild distribution files             | Run `./build.sh` from repo root                      |
