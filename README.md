# NoPhoton

A Manifest V3 Chromium extension (Chrome, Brave, Edge) that forces a dark theme on any webpage by injecting a CSS stylesheet.

## Features

- Toolbar button with an **On/Off toggle** — applies instantly to every open tab
- When **on**: forces dark background (`#1b1b1b`), white text, and dimmed images across the entire page
- When **off**: restores the page to its original appearance
- **Ignore if dark** mode — skips pages already in dark mode so they aren't double-darkened
- State is persisted in `chrome.storage.local` and auto-restored on every page load

## Install (unpacked / developer mode)

1. Run `./build.sh` to generate icons and produce a clean `dist/` copy
2. Open `chrome://extensions` (or `brave://extensions` / `edge://extensions`)
3. Enable **Developer mode**
4. Click **Load unpacked** and select the `extension/` folder (or `dist/` after building)

## Install (CRX)

```
artifacts/nophoton.crx
```

Drag the `.crx` onto the extensions page, or use the zip at `artifacts/nophoton.zip`.

> The signed CRX requires `nophoton.pem` at repo root to rebuild.  
> Generate a fresh key with: `openssl genrsa 2048 > nophoton.pem`

## Prerequisites

### crx3 (for signing CRX packages)

Install the `crx3` CLI tool globally via npm:

```bash
npm install -g crx3
```

> Requires Node.js/npm to be installed. The build script will skip the CRX step and warn if `crx3` is not found.

### Private key (for signing CRX packages)

A `nophoton.pem` RSA private key must exist at the repo root before building a signed `.crx`. Generate one with:

```bash
openssl genrsa 2048 > nophoton.pem
```

> Keep this file secret — it is not committed to the repository. Losing it means you can no longer produce a CRX signed with the same extension identity.

---

## Build

```bash
./build.sh
```

The pipeline:

1. Regenerates PNG icons via `scripts/generate-icons.py` (requires Pillow)
2. Validates `extension/manifest.json`
3. Copies `extension/` → `dist/` (clean working copy)
4. Copies `dist/` → `artifacts/nophoton/` (unpacked, committed for distribution)
5. Creates `artifacts/nophoton.zip`
6. Creates `artifacts/nophoton.crx` via `crx3` (requires `npm install -g crx3`)

## Repository Layout

```
extension/          ← source of truth
  manifest.json
  content/
    content.js      ← injected into every page
  popup/
    popup.html      ← toolbar popup UI
    popup.js        ← popup logic / Chrome API calls
  icons/            ← generated PNGs (do not edit by hand)
artifacts/          ← build outputs (git-committed)
  nophoton.crx
  nophoton/         ← unpacked copy
scripts/
  generate-icons.py ← generates 16/48/128 px icons with Pillow
build.sh
AGENTS.md           ← AI context document (full code map)
```

## Development

| File                           | Responsibility                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `extension/content/content.js` | Injected into every page — applies/removes the dark `<style>` tag                  |
| `extension/popup/popup.html`   | Toolbar popup markup and CSS                                                       |
| `extension/popup/popup.js`     | Reads/writes storage, calls content script functions via `scripting.executeScript` |
| `scripts/generate-icons.py`    | Generates PNG icons at 16, 48, and 128 px                                          |

### Key entry points in `content.js`

| Function / global                           | Purpose                                                                                   |
| ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `applyDark()`                               | Injects `<style id="__nophoton_style__">` with forced dark colours                        |
| `removeDark()`                              | Removes the injected style element                                                        |
| `detectPageTheme()`                         | Returns `"dark"` / `"light"` / `"unknown"` by inspecting CSS classes and colour luminance |
| `window.__nophotonSetDark(enabled, ignore)` | Called by popup to toggle dark mode on the page                                           |
| `window.__nophotonGetTheme()`               | Called by popup to read the current page theme                                            |

### Storage keys (`chrome.storage.local`)

| Key            | Type   | Default | Meaning                                    |
| -------------- | ------ | ------- | ------------------------------------------ |
| `darkMode`     | `bool` | `true`  | Whether dark mode is globally on           |
| `ignoreIfDark` | `bool` | `true`  | Whether to skip pages already in dark mode |

## Permissions

`activeTab`, `tabs`, `scripting`, `storage`

## Colour Palette

| Role                     | Hex       |
| ------------------------ | --------- |
| Injected page background | `#1b1b1b` |
| Injected page text       | `#ffffff` |
| Injected border colour   | `#444444` |
| Injected link colour     | `#7eb8f7` |
| Popup / icon background  | `#1b1b1b` |
| Accent (toggle active)   | `#ff0000` |
| Toggle inactive          | `#ff5555` |
| Icon border              | `#8b0000` |
