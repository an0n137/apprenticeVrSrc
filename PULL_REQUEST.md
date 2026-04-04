# Fixes & Improvements

## 1. Fix: YouTube Trailer Embed (Error 153 → 152 → Permanent Fix)

**Files:** `src/main/index.ts`, `src/renderer/src/components/GameDetailsDialog.tsx`, `src/renderer/src/env.d.ts`

**Problem:** Game trailer videos showed YouTube error codes 153/152. YouTube blocks iframe embeds from `file://` and `null` origins (Error 153). After spoofing HTTP headers (Referer, Origin, stripping X-Frame-Options/CSP), Error 152 persisted because YouTube's **client-side JavaScript** inside the iframe detects `window.parent !== window` and checks the parent origin via `postMessage` — no server-side header fix can bypass a client-side JS check.

**Fix:** Replaced `<iframe>` with Electron's `<webview>` tag:

1. **`<webview>` instead of `<iframe>`** — A webview runs in its own isolated renderer process where `window.top === window` and `window.parent === window`. YouTube's embed JS sees no parent frame, so embed restrictions never trigger.
2. **Dedicated session partition** (`persist:youtube`) — YouTube requests use their own Electron session with:
   - Spoofed `Referer: https://www.youtube.com/` and `Origin: https://www.youtube.com` on outgoing requests
   - Stripped `X-Frame-Options` and `Content-Security-Policy` response headers (belt-and-suspenders for server-side checks)
   - URL filters cover `*.youtube.com`, `*.youtube-nocookie.com`, `*.googlevideo.com`, `*.ytimg.com`
3. **CSS injection on `dom-ready`** — Injects CSS to hide the entire YouTube UI (masthead, sidebar, comments, related videos, subscribe button, end screen overlays) and forces the video player to `position: fixed; 100vw × 100vh` with black background. Auto-plays via `executeJavaScript`. The webview loads the full `/watch?v=` page (not `/embed/` — embed still triggers Error 152) but visually shows only the video player.
4. **"Watch on YouTube" link** — External link next to the trailer title opens the video in the default browser via `shell.openExternal` (handled by `setWindowOpenHandler`), providing a fast fallback since the in-app webview loads slowly.
5. **`webviewTag: true`** added to BrowserWindow `webPreferences`
6. **JSX type declarations** for `<webview>` added to `env.d.ts`

**Why this is permanent:** The webview is a separate Chromium process — not a frame inside the app. YouTube's code has no parent frame to detect, so origin-based embed blocking cannot apply regardless of future YouTube changes to their validation logic.

---

## 2. Improvement: Concurrent Downloads (5 parallel pipelines)

**File:** `src/main/services/downloadService.ts`

**Problem:** The download queue was fully serial — a single `isProcessing` boolean gated the entire pipeline. Only one game could be downloading at a time; all others waited in the queue regardless of available bandwidth or system resources.

**Fix:** Replaced the serial `isProcessing` flag with a concurrent pipeline system:

- Added `activeCount` and `maxConcurrent = 5` to track and limit parallel operations
- `processQueue()` now loops and launches up to 5 concurrent pipelines without blocking each other
- Extracted the download→extract→install sequence into a standalone `runPipeline()` method
- Each pipeline decrements `activeCount` in `.finally()` and calls `processQueue()` to fill freed slots
- Items are synchronously marked as `'Downloading'` before the async pipeline fires, preventing duplicate picks
- Originally set to 2, reduced to 5 to avoid bandwidth splitting that degraded per-download speed

**Before:** 1 download at a time, rest queued.
**After:** Up to 5 downloads run in parallel, with automatic slot filling as pipelines complete.

---

## 3. Improvement: rclone copy as Primary Download Method (No macFUSE Required)

**File:** `src/main/services/download/downloadProcessor.ts`

**Problem:** The original mount-based download (`rclone mount`) requires macFUSE on macOS and WinFsp on Windows. Users without these OS-level dependencies got a cryptic "No files found in mounted directory" error. macFUSE also requires a reboot after installation and has kernel extension security implications.

**Fix:** Replaced `rclone mount` entirely with `rclone copy` as the primary (and only) download method:

- **`startDownload()`** now routes directly to `startRcloneCopyDownload()` for both mirror and public endpoint configs
- **`resumeDownload()`** calls `startRcloneCopyDownload()` directly — rclone copy auto-resumes via `--partial-suffix .partial`
- **Progress:** Uses `--use-json-log` + `--stats 1s` for real-time progress parsing (percentage, speed, ETA)
- **Performance:** `--transfers 4` (parallel file transfers) + `--multi-thread-streams 4` (multi-threaded single large files) + `--retries 5` for reliability
- **Bandwidth limit:** Respects the existing `settingsService.getDownloadSpeedLimit()` via `--bwlimit`
- **Mirror support:** Works with both public endpoint and custom mirror configurations

**Dead code removed (~500 lines):**
- `startMountBasedDownload()` method (mount setup, readiness polling, stream-based file copy)
- `cleanup()` method (unmount + directory removal)
- `copyFileWithProgress()` method (Node.js stream-based copy with bandwidth limiting)
- `mountProcess` field from `DownloadController` interface
- Mount process cleanup from `cancelDownload()` and `pauseDownload()`
- Unused imports: `tmpdir` from `'os'`, `createReadStream`/`createWriteStream` from `'fs'`

**Result:** Zero OS-level dependencies. Works out of the box on macOS, Linux, and Windows with just the bundled rclone binary.

---

## 4. Feature: Pause/Resume Download Buttons

**Files:** `src/renderer/src/components/DownloadsView.tsx`, `src/main/services/download/downloadProcessor.ts`

**Problem:** The entire IPC chain for pause/resume was already wired (types → preload → main handler → download service → download processor), but no UI buttons existed to trigger it. Users had no way to pause and resume downloads.

**Fix:** Added Pause and Resume buttons to the downloads sidebar:

- **Pause button** (⏸) appears on items with `Downloading` status — kills the rclone copy process via `cancel()`
- **Resume button** (▶) appears on items with `Paused` status — restarts `startRcloneCopyDownload()` which auto-resumes from partial files
- **Paused status display** shows progress bar + "Paused – X%" text
- **Remove button** now also appears for `Paused` items
- Imported `PauseRegular` and `PlayRegular` icons from `@fluentui/react-icons`
- Destructured `pauseDownload` and `resumeDownload` from the existing `useDownload()` hook

**Pause flow:** Button → `pauseDownload(releaseName)` → IPC `'download:pause'` → processor kills rclone process → status set to `'Paused'`
**Resume flow:** Button → `resumeDownload(releaseName)` → IPC `'download:resume'` → `downloadService.resumeDownload()` launches a full `runResumePipeline()` (download → extraction → installation) with `activeCount` tracking, using `downloadProcessor.resumeDownload()` which calls `startRcloneCopyDownload(item, mirrorConfig, isResume=true)` — rclone auto-resumes via `--partial-suffix .partial`

---

## 5. Improvement: Serialized Installation Queue

**Files:** `src/main/services/download/installationProcessor.ts`, `src/main/services/downloadService.ts`

**Problem:** With concurrent download pipelines (fix #2), multiple games can finish downloading and extracting at roughly the same time. Each pipeline then calls `startInstallation()` concurrently, causing multiple `adb install` + `adb push` commands to hit the same Quest headset simultaneously. This can cause ADB conflicts, failed installs, or data corruption.

**Fix:** Added a promise-based installation queue (mutex) inside `InstallationProcessor`:

- `startInstallation()` now enqueues the request and returns a Promise that resolves when installation actually completes
- A private `processInstallQueue()` method processes one installation at a time — only one `adb install` runs at any given moment
- When an installation finishes (success or failure), the next queued installation starts automatically
- Queue depth and timing are logged for diagnostics

**Flow with 3 concurrent downloads:**
1. Games A-C download and extract in parallel
2. Games A, B finish extraction around the same time → both call `startInstallation()`
3. Game A installs immediately; B is queued
4. Game A finishes → Game B starts installing
5. Meanwhile, Game C continues downloading/extracting unblocked

---

## 6. Improvement: Renderer Performance Optimizations

**Files:** `src/renderer/src/context/DownloadProvider.tsx`, `src/renderer/src/context/UploadProvider.tsx`, `src/renderer/src/context/SettingsProvider.tsx`, `src/renderer/src/context/AdbProvider.tsx`, `src/renderer/src/components/GamesView.tsx`, `src/main/services/downloadService.ts`

**Problem:** The app felt sluggish when scrolling or clicking, and the MacBook ran warm even when idle. Root causes identified via investigation:
- All 4 React context providers created new `value` objects on every render, causing the entire component tree to re-render on any state change
- AdbProvider's device tracking `useEffect` listed `selectedDevice` as a dependency, tearing down and re-registering all 4 device listeners on every device selection change
- Download queue IPC emissions fired at 100ms debounce (~10 messages/sec per active download)
- GamesView's `columns` useMemo depended on `downloadStatusMap`, recreating all 8+ column definitions on every download tick
- GamesView's installation-completed listener depended on `games`, re-registering on every download progress update
- Redundant `window.addEventListener('resize')` alongside ResizeObserver caused double state updates

**Fix:**

### Phase 1: Context Memoization
Wrapped the `value` prop in `useMemo` for all 4 providers (`DownloadProvider`, `UploadProvider`, `SettingsProvider`, `AdbProvider`). Values now only change when their actual state dependencies change, preventing cascading re-renders through the entire React tree.

### Phase 2: AdbProvider Effect Stabilization
Added `selectedDeviceRef` (`useRef`) synced to `selectedDevice` state. Device tracking listeners now read `selectedDeviceRef.current` instead of closing over `selectedDevice`. Removed `selectedDevice` from the effect dependency array — listeners are registered once when `isReady` changes, not on every device selection.

### Phase 3: IPC Debounce Tuning
Increased download queue emission debounce from 100ms to 300ms. Reduces renderer IPC messages from ~10/sec to ~3/sec per active download without perceptible UI lag.

### Phase 4: GamesView Optimization
- **Column definitions stabilized:** Added `downloadStatusMapRef` (`useRef`) that cell renderers read at render time. Removed `downloadStatusMap` from `columns` useMemo dependencies — column defs stay referentially stable so TanStack Table skips column recomputations.
- **Installation listener fixed:** Removed `games` from the `useEffect` dependency array — the listener only needs `selectedDevice` and `loadPackages`.
- **Resize deduplication:** Removed redundant `window.addEventListener('resize')` — ResizeObserver already handles container resize.

---

## 7. Fix: Download Progress & Speed Display

**Files:** `src/main/services/download/downloadProcessor.ts`, `src/renderer/src/components/GamesView.tsx`

**Problem:** Download progress stayed at 0% and download speed was not visible. Two issues:
1. **Backend:** rclone's HTTP remote often reports `totalBytes = 0` until the directory listing completes, so `Math.round(bytes / totalBytes * 100)` always yielded 0. Additionally, speed/ETA updates were gated behind progress changes — if progress was stuck at 0, speed never updated either.
2. **Frontend:** GamesView's `downloadStatusMap` only stored `{status, progress}` — no `speed` or `eta`. The download badge only showed the status text with no percentage or speed.

**Fix:**

### Backend (downloadProcessor.ts)
- **Fallback progress calculation:** When `totalBytes` is 0, progress is now computed from the `stats.transferring` array (per-file `bytes`/`size` aggregation) that rclone always populates for active transfers
- **Speed-triggered updates:** `lastProgress` starts at `-1` (not `0`) so the first stats update always fires. Added `lastSpeed` tracking — updates now emit when **either** progress or speed changes
- **Warning log** when the rclone process `all` stream is unavailable

### Frontend (GamesView.tsx)
- `downloadStatusMap` now includes `speed` and `eta` fields from queue items
- Download badge shows `Downloading 42%` instead of just `Downloading`
- Download speed (e.g. `1.5 MB/s`) renders next to the badge during active downloads

---

## 8. Improvement: Game List Loading & UI Responsiveness (2600+ Games)

**Files:** `src/main/services/gameService.ts`, `src/renderer/src/context/GamesProvider.tsx`, `src/renderer/src/components/GamesView.tsx`

**Problem:** With 2600+ games, the app was slow on startup and the UI felt sluggish when scrolling or interacting. Root causes:
1. **2600 blocking `existsSync()` calls** in `parseGameList()` — one per game to check thumbnail existence
2. **O(n²) enrichment** in GamesProvider — `installedPackages.find()` called twice per installed game inside a `.map()` over all 2600 games
3. **Unmemoized context value** — GamesProvider's `value` object was a plain literal, creating a new reference on every render and triggering cascade re-renders of all consumers
4. **O(n×m) upload candidate check** — `rawGames.filter()` called per installed package, plus ran synchronously blocking initial render
5. **No search debounce** — every keystroke filtered 2600+ rows immediately
6. **Sync `getNote()`** — used blocking `existsSync` + `readFileSync` wrapped in `Promise.resolve()`

**Fix:**

### Phase 1: Batch Filesystem I/O (gameService.ts)
- **Thumbnail check:** Replaced 2600 individual `existsSync(thumbnailPath)` calls with a single `readdirSync(thumbnailDir)` → `Set<string>`, then `thumbnailSet.has(filename)` per game. Reduces 2600 syscalls to 1.
- **`getNote()` made async:** Changed from sync `existsSync` + `readFileSync` to proper `async` with `await fs.readFile()` in try/catch. No longer blocks the main process thread.

### Phase 2: O(n²) → O(n+m) Enrichment (GamesProvider.tsx)
- Built `installedMap = new Map(installedPackages.map(pkg => [pkg.packageName, pkg.versionCode]))` once, then `installedMap.get(game.packageName)` per game instead of two `.find()` calls. Eliminates O(n×m) loop.
- Wrapped the context `value` object in `useMemo` with all 18 state/callback dependencies listed. Prevents all GamesContext consumers from re-rendering when unrelated parent state changes.

### Phase 3: Upload Candidates Optimization (GamesProvider.tsx)
- Built `rawGamesMap = new Map<string, GameInfo[]>()` for O(1) package-name lookups instead of O(n) `.filter()` per installed package.
- Deferred `checkForUploadCandidates` with `setTimeout(..., 500)` so it doesn't block initial game list render.

### Phase 4: Search Debounce (GamesView.tsx)
- Added separate `searchInput` state for the input field and a 200ms debounce timer before updating `globalFilter`. Prevents TanStack Table from re-filtering 2600+ rows on every keystroke.

---

## 9. Fix: Download Pause/Resume Pipeline (Extraction Never Started)

**Files:** `src/main/services/downloadService.ts`, `src/main/services/download/downloadProcessor.ts`

**Problem:** After pausing and resuming a download, the download completed at 100% but extraction and installation never started. The download sat at 100% forever.

**Root cause:** `downloadService.resumeDownload()` was a fire-and-forget `void` method that called `downloadProcessor.resumeDownload(item)` without awaiting or handling the result. The returned `{ success: true, startExtraction: true }` was completely discarded — nobody chained extraction or installation. In contrast, fresh downloads go through `runPipeline()` which properly chains download → extraction → installation.

**Fix:**
- `downloadService.resumeDownload()` now launches a full `runResumePipeline()` that:
  1. Calls `downloadProcessor.resumeDownload()` and **awaits** the result
  2. On success, chains to `extractionProcessor.startExtraction()`
  3. On extraction success, chains to `installationProcessor.startInstallation()`
  4. Properly tracks `activeCount` for concurrent pipeline limits
  5. Calls `processQueue()` on completion to fill freed slots
- `downloadProcessor.resumeDownload()` now checks for an active mirror (same logic as `startDownload`) instead of hardcoding `mirrorConfig: undefined`

---

## 10. Fix: Download Path Doubling on Pause/Resume

**File:** `src/main/services/download/downloadProcessor.ts`

**Problem:** Resuming a download created deeply nested duplicate paths like `/downloads/GameName/GameName/GameName/...`. Each pause+resume cycle added another level of nesting. Files downloaded to the wrong directory, baseline byte measurement found 0 bytes, and progress restarted from 0%.

**Root cause:** `startRcloneCopyDownload()` did `join(item.downloadPath, item.releaseName)` and then **persisted** the joined path back to `item.downloadPath` via `queueManager.updateItem()`. On the first call, this correctly turned `/downloads` into `/downloads/GameName`. But on resume, `item.downloadPath` was already `/downloads/GameName`, so joining again produced `/downloads/GameName/GameName`. Each subsequent resume added another layer.

**Fix:** Made path construction idempotent in both `startDownload()` and `startRcloneCopyDownload()`:
```typescript
const downloadPath = item.downloadPath.endsWith(item.releaseName)
  ? item.downloadPath
  : join(item.downloadPath, item.releaseName)
```
Now safe to call repeatedly — the path is only extended once.

---

## 11. Fix: Download Progress Tracking on Resume

**File:** `src/main/services/download/downloadProcessor.ts`

**Problem:** Even after fixing the path doubling, resumed downloads showed 0% initially and could show incorrect progress because rclone's stats for the new process only reflect remaining work, not the total job including already-downloaded files.

**Fix:**
- `startRcloneCopyDownload()` accepts an `isResume` flag (default `false`)
- On resume: measures already-downloaded bytes on disk (`baselineBytes`) via `getFilesRecursively()`, excluding `.partial` files
- Progress calculation adds baseline to both numerator and denominator: `(stats.bytes + baselineBytes) / (stats.totalBytes + baselineBytes)` — so if 45% was already downloaded, progress starts near 45%
- `resumeFloor` preserves the paused percentage — calculated progress can only go UP, never backward
- Per-transfer fallback (when `totalBytes` is 0) also accounts for baseline bytes

---

## 12. Improvement: Build Size Reduction (478MB → 110MB DMG, 77% smaller)

**Files:** `package.json`, `electron-builder.yml`

**Problem:** The macOS DMG was 478MB — over 3× the size of comparable Electron apps. The `app.asar` inside the bundle was 208MB containing 34,308 files. Root causes:
1. **Renderer-only dependencies in `dependencies`** — `@fluentui/react-components` (237MB / 22,328 files), `@fluentui/react-icons`, `@tanstack/react-table`, `@tanstack/react-virtual`, and `date-fns` (38MB / 4,294 files) were listed as runtime `dependencies`. electron-builder bundles all `dependencies` into the asar, but these packages are only used in the renderer — and Vite already bundles them into a single 2MB JS file via the renderer build (no `externalizeDepsPlugin` on the renderer config).
2. **12 completely unused dependencies** — `@modelcontextprotocol/sdk` (5.8MB + ~16MB transitive: hono, zod, jose), `react-youtube`, `bluebird`, `when`, `yauzl`, `electron-updater`, `match-sorter`, `data-uri-to-buffer`, `fetch-blob`, `formdata-polyfill`, `node-wget-fetch`, `use-disposable` — none imported anywhere in `src/`.
3. **Non-code files leaking into asar** — `screenshots/`, `AUR/`, `PULL_REQUEST.md`, `todo.txt`, `LICENSE` were not excluded.

**Fix:**

### Moved 5 renderer-only deps to `devDependencies`
`@fluentui/react-components`, `@fluentui/react-icons`, `@tanstack/react-table`, `@tanstack/react-virtual`, `date-fns` — Vite bundles these into the renderer output at build time. Moving them to `devDependencies` keeps them available for `electron-vite build` but excludes them from the asar. This is the single biggest win (~280MB).

### Removed 12 unused dependencies
Confirmed zero imports in `src/` via grep: `@modelcontextprotocol/sdk`, `@fluentui/react-popover`, `react-youtube`, `bluebird`, `when`, `yauzl`, `electron-updater`, `match-sorter`, `data-uri-to-buffer`, `fetch-blob`, `formdata-polyfill`, `node-wget-fetch`, `use-disposable`. Also removed corresponding `@types/bluebird` and `@types/when` from devDependencies.

### Added file exclusions to `electron-builder.yml`
```yaml
- '!screenshots/**/*'
- '!AUR/**/*'
- '!{PULL_REQUEST.md,todo.txt,LICENSE}'
```

**Results:**

| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| `app.asar` | 208MB (34,308 files) | 15MB | 93% |
| App bundle | 467MB | 274MB | 41% |
| DMG (arm64) | 478MB | 110MB | 77% |
| `node_modules` packages | 875 | ~774 | 101 removed |

**Frameworks** (247MB) is Chromium + Node.js — irreducible for any Electron app.
