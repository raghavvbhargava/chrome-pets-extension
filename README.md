# 🐾 Tab Pets

A Chrome extension that places **pixel-art pets** in a glassmorphism bar pinned to the top of every webpage. They walk, bounce, sit, and react when you click them.

---

## Preview

```
╔══════════════════════════════════════════════════════════════╗
║  🟫🟫    🟫🟫  [cat walking →]   [bird slowly drifting ←]  ║  ← pet bar (44px, fixed)
╚══════════════════════════════════════════════════════════════╝
  (rest of the webpage below)
```

Three independent pixel-art pets roam across a frosted-glass bar at the top of every page.

---

## Features

| Feature | Detail |
|---|---|
| **Pixel-art sprites** | 8×8 canvas-drawn sprites scaled with `image-rendering: pixelated` |
| **Smooth animation** | `requestAnimationFrame` loop — walk tilt, vertical bounce, shadow depth |
| **Click reactions** | Sprite swaps + glow burst for 500 ms, then resumes |
| **Sitting animation** | Pets pause every 8–15 s for 2 s, floating gently with a purple glow |
| **Multi-tab memory** | Each tab keeps its own pet positions; switch tabs and resume exactly where you left off |
| **Fresh start on close** | Closing a tab wipes its state — pets start at random positions on next visit |
| **Light / dark mode** | Bar adapts automatically to system colour scheme |
| **Settings popup** | Toggle on/off, choose pet types, count (1–5), and movement speed |

---

## Installation

> No build step needed — Chrome loads the extension directly from the folder.

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `tab-pets-extension` folder (the one containing `manifest.json`)

The extension icon appears in the Chrome toolbar immediately.

---

## Reloading After Code Changes

Chrome does **not** hot-reload extensions automatically.

1. Go to `chrome://extensions`
2. Click the **↻** icon on the Tab Pets card
3. Reload the webpage you're testing on (`Ctrl + R`)

---

## File Structure

```
tab-pets-extension/
├── manifest.json              Extension config (Manifest V3)
└── src/
    ├── background/
    │   └── service-worker.js  Tracks pet positions per tab, broadcasts resets
    ├── content/
    │   └── content.js         Injects the pet bar and drives the animation loop
    └── popup/
        ├── popup.html         Settings window structure
        ├── popup.css          Settings window styles (dark pet-shop theme)
        └── popup.js           Reads/writes settings via chrome.storage.local
```

---

## How It Works

### Animation States

Each pet runs through a simple state machine inside the `requestAnimationFrame` loop:

```
WALKING  ──(8–15 s timer)──▶  SITTING  ──(2 s later)──▶  WALKING
   │                                                          ▲
   └──(click)──▶  REACTING  ──(500 ms later)────────────────┘
```

- **Walking** — moves horizontally at its set speed, bobbing vertically with a forward lean/tilt
- **Sitting** — pauses in place, floats up and down gently, purple drop-shadow glow
- **Reacting** — swaps to react sprite, scales to 1.5×, emits a radial glow burst

### Pixel Art Sprites

Sprites are generated at runtime using `<canvas>`:

```js
function makeSprite(rows, palette) {
  // rows = ['C......C', 'CCCCCCCC', ...]
  // palette = { C: '#E8B882', k: '#2D1B0E', ... }
  // draws 1 px per grid cell → toDataURL()
  // CSS scales 8×8 px canvas → 24×24 px display with image-rendering:pixelated
}
```

| Pet | Idle | React |
|-----|------|-------|
| Cat | Tan body, dark eyes, pink nose | Cream-coloured teeth showing |
| Dog | Brown, floppy ears, dark nose | Pink tongue out |
| Bird | Blue body, yellow beak, black eye | Wider open beak |

### Tab Memory

```
Content script loads
    │── TAB_PETS_INIT ──▶ Service Worker
    │◀── { positions } ──  (cached in Map + chrome.storage.local)
    │
    │── TAB_PETS_POSITIONS_UPDATE (every 1 s) ──▶ Service Worker stores it
    │
Tab closed / navigated ──▶ Service Worker clears that tab's state
```

---

## Debugging

| What to debug | Where |
|---|---|
| Pet bar / animations | Any page → `F12` → **Console** (filter `[Tab Pets]`) |
| Service worker | `chrome://extensions` → Tab Pets → **Service Worker** link |
| Popup | Right-click extension icon → **Inspect popup** |

---

## Permissions Used

| Permission | Why |
|---|---|
| `tabs` | Listen for tab create / switch / close events |
| `storage` | Persist pet positions and user settings |
| `activeTab` | Read the active tab's URL for message routing |

---

## License

MIT — do whatever you like with it.
