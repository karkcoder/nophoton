# NoPhoton

A Chromium browser extension (Chrome, Brave, Edge) that toggles dark mode on any webpage.

## What it does

- Adds a toolbar button with an **On/Off toggle**
- When **on**: forces a black background and white text across the entire page
- When **off**: restores the page to its original appearance
- Remembers the dark mode state per site across page loads

## Install

1. Run `./build.sh` to generate icons and prepare the extension
2. Open `chrome://extensions` (or `brave://extensions`)
3. Enable **Developer mode**
4. Click **Load unpacked** and select the `extension/` folder

## Development

- `extension/content/content.js` — injected into every page; applies/removes the dark style
- `extension/popup/` — toolbar popup UI with the toggle button
- `scripts/generate-icons.py` — generates PNG icons at required sizes
