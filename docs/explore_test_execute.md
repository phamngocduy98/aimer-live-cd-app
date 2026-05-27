# Explore Test — Execution Guide

> Uses `playwright-cli` for browser automation + `understand-image` skill for visual analysis.

---

## Prerequisites

| Item           | Check                                                      |
| -------------- | ---------------------------------------------------------- |
| `.env` file    | Must exist with valid MongoDB + AES credentials            |
| Node modules   | `pnpm install` completed                                   |
| playwright-cli | `playwright-cli --version` (v0.1.13+)                      |
| Vision API     | `http://localhost:20128` reachable for screenshot analysis |

---

## Step 1: Start the Servers

```powershell
# Terminal 1 — Backend
pnpm dev:server

# Terminal 2 — Frontend
pnpm dev:web
```

Or combined:

```powershell
pnpm dev:both
```

Verify both are running:

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`

---

## Step 2: Launch playwright-cli Browser

```powershell
playwright-cli open http://localhost:5173
```

This opens a Chromium browser connected to the live app. All subsequent commands operate within this session.

---

## Step 3: Explore Test Scenarios

### Workflow per scenario

```mermaid
flowchart LR
    A[Navigate to page] --> B[playwright-cli snapshot --boxes]
    B --> C[Interact: click / fill / press]
    C --> D[playwright-cli screenshot]
    D --> E[analyze with understand-image]
    E --> F[Record result: ✅ / ❌ / ⚠️]
```

Each scenario follows this loop:

1. **Navigate** — `playwright-cli click e<N>` or `playwright-cli goto http://localhost:5173/#/path`
2. **Snapshot** — `playwright-cli snapshot --boxes` — captures element tree with refs + bounding boxes
3. **Act** — Perform the user action (click, fill, press key, select)
4. **Screenshot** — `playwright-cli screenshot --filename=scenario-name.png`
5. **Analyze** — Use `understand-image` skill to check the screenshot for visual issues
6. **Record** — Document pass/fail/unexpected

---

## Step 4: Using understand-image for Visual Analysis

After capturing each screenshot, run the vision API to check for issues:

### Example: Checking a screenshot for visual bugs

```powershell
$prompt = @"
Analyze this web application screenshot for visual UI bugs.
Check for:
1. Element overflow or truncation
2. Misaligned elements (off-position)
3. Overlapping elements
4. Missing elements that should be present
5. Spacing inconsistencies
6. Color/contrast issues
7. Any elements extending beyond their container

Describe each issue found with its location and severity (minor/major/critical).
If no issues found, say "No visual bugs detected."
"@

$imagePath = "e2e/screens/scenario-name.png"
# ... run the skill's PowerShell script with this prompt and image
```

### Ready-made prompts for common checks

| Check              | Prompt                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout overflow    | `"Does any content overflow or get clipped in this screenshot? Check for horizontal scrollbars, text cut off, or elements breaking out of containers."` |
| Element position   | `"Are all elements properly aligned? Check if buttons, text, icons, and cards are correctly positioned without unexpected offsets."`                    |
| Dialog/form layout | `"Check this dialog/form screenshot. Are fields properly aligned? Are labels next to their inputs? Is there adequate spacing?"`                         |
| Table alignment    | `"Check this table screenshot. Are columns properly aligned? Is text truncated? Do cells have consistent sizing?"`                                      |
| Empty state        | `"Check this empty state UI. Is the placeholder message centered and readable? Does the layout look intentional?"`                                      |
| Full page audit    | `"Analyze this full-page screenshot for ALL visual UI bugs: overflow, misalignment, overlap, truncation, spacing, missing elements. List each issue."`  |

---

## Step 5: Test Scenario Execution Order

Run through scenarios in this order. Each completes independently before moving to the next.

### Group A — API Integration & Data Flow

```powershell
# A1: Albums load
playwright-cli snapshot --boxes --filename=albums-loaded
playwright-cli screenshot --filename=A1-albums-loaded.png
# Run understand-image on screenshot
```

```powershell
# A2: Album detail tracks
playwright-cli click e<N>  # click first album card
playwright-cli snapshot --boxes
playwright-cli screenshot --filename=A2-album-tracks.png
```

_(repeat for A3–A6)_

### Group B — State Management

```powershell
# B1: Play a song
playwright-cli click e<N>  # Play button
playwright-cli snapshot --boxes
# Navigate to different pages
playwright-cli click e<N>  # Sidebar: Songs
playwright-cli snapshot
playwright-cli click e<N>  # Sidebar: Albums
playwright-cli snapshot
# Check player persistence
playwright-cli screenshot --filename=B1-state-persist.png
```

_(repeat for B2–B6)_

### Group C — Error Handling

```powershell
# C1: Stop backend — test graceful error
# (Stop pnpm dev:server in other terminal)
playwright-cli reload
playwright-cli snapshot
playwright-cli screenshot --filename=C1-backend-error.png
# Restart backend when done
```

_(repeat for C2–C6)_

### Group D — End-to-End Workflows

_(sequential, no restart between steps — this is a flow)_

```powershell
# D1: Full playlist lifecycle
playwright-cli click e<N>  # Sidebar "Create Playlist"
# ... type name, click Create
# ... navigate to Songs
# ... More → Add to Playlist on 3 songs
# ... navigate to playlist
# ... verify 3 songs
# ... Play, then Shuffle
# ... Remove 1 song
# ... Delete playlist
playwright-cli screenshot --filename=D1-playlist-lifecycle.png
```

### Group E — Dialog & Form Behavior

```powershell
# E1: Create dialog validation
playwright-cli click e<N>  # Create Playlist
# name field empty
playwright-cli snapshot --boxes
playwright-cli screenshot --filename=E1-dialog-validation.png
```

_(repeat for E2–E6)_

### Group F — Playback Behavior

_(requires an active track playing)_

```powershell
# F1: Double-click song
playwright-cli dblclick e<N>  # row #5 in songs table
playwright-cli snapshot
playwright-cli screenshot --filename=F1-dblclick.png
```

_(repeat for F2–F5)_

### Group G — Search Deep-Dive

```powershell
# G1: Dropdown sections
playwright-cli fill e<N> "Aimer"  # search input
playwright-cli snapshot --boxes
playwright-cli screenshot --filename=G1-search-dropdown.png
```

_(repeat for G2–G6)_

### Group H — Button Consistency

```powershell
# H1: Home page buttons
playwright-cli goto http://localhost:5173/#/
playwright-cli screenshot --filename=H1-home-buttons.png
```

_(repeat for H2–H4)_

### Group I — Context Menu

```powershell
# I1: Songs context menu
playwright-cli click e<N>  # More icon on first song
playwright-cli snapshot
playwright-cli screenshot --filename=I1-context-menu.png
```

_(repeat for I2–I4)_

### Group J — Navigation & Routing

```powershell
# J1: Hash routing
playwright-cli goto http://localhost:5173/#/songs
playwright-cli snapshot
```

```powershell
# J5: Direct URL
playwright-cli goto http://localhost:5173/#/album/<album-id>
playwright-cli snapshot
playwright-cli screenshot --filename=J5-direct-url.png
```

### Group K — Time Formatting

```powershell
# K1: Duration format
playwright-cli goto http://localhost:5173/#/songs
playwright-cli screenshot --filename=K1-duration-format.png
```

### Group L — Quality Chip

```powershell
# L2: Chip tooltip
playwright-cli hover e<N>  # quality chip
playwright-cli screenshot --filename=L2-chip-tooltip.png
```

### Group M — Keyboard

```powershell
# M1: Enter submits search
playwright-cli fill e<N> "Aimer"
playwright-cli press Enter
playwright-cli screenshot --filename=M1-enter-search.png
```

---

## Step 6: Visual Analysis Workflow (understand-image)

For every screenshot captured, run the vision analysis using the skill's PowerShell script template.

### Full PowerShell script (template)

```powershell
# analyze-screenshot.ps1
param(
    [string]$ImagePath,
    [string]$Prompt = "Analyze this web application screenshot for ALL visual UI bugs: overflow, misalignment, overlap, truncation, spacing, missing elements. List each issue with location and severity (minor/major/critical)."
)

$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path $ImagePath)))
$ext = [IO.Path]::GetExtension($ImagePath)
$mimeMap = @{ ".png" = "image/png"; ".jpg" = "image/jpeg"; ".jpeg" = "image/jpeg"; ".gif" = "image/gif"; ".webp" = "image/webp"; ".bmp" = "image/bmp" }
$mime = $mimeMap[$ext]
if (-not $mime) { $mime = "image/png" }
$dataUri = "data:$mime;base64,$b64"

$body = @{
    model = "vision-router"
    messages = @(
        @{
            role = "user"
            content = @(
                @{ type = "text"; text = $Prompt }
                @{ type = "image_url"; image_url = @{ url = $dataUri; detail = "high" } }
            )
        }
    )
    max_tokens = 1000
    stream = $false
} | ConvertTo-Json -Compress -Depth 10

$jsonFile = [IO.Path]::GetTempFileName() + ".json"
Set-Content -Path $jsonFile -Value $body -Encoding ASCII

$resultFile = [IO.Path]::GetTempFileName() + ".json"
curl.exe -s http://localhost:20128/v1/chat/completions `
    -H "Content-Type: application/json" `
    -H "Authorization: Bearer sk-9fdde44c144a2503-4ubbsp-8fe695bb" `
    -d "@$jsonFile" -o $resultFile

$result = Get-Content $resultFile -Raw | ConvertFrom-Json
$result.choices[0].message.content

Remove-Item $jsonFile, $resultFile
```

### Usage

```powershell
# Analyze a single screenshot for visual bugs
.\analyze-screenshot.ps1 -ImagePath "e2e/screens/A1-albums-loaded.png"

# Analyze with a custom prompt
.\analyze-screenshot.ps1 -ImagePath "e2e/screens/E1-dialog-validation.png" -Prompt "Check this dialog for proper form field alignment and spacing. Are labels aligned with inputs? Is there adequate padding?"
```

---

## Step 7: Record Results

For each scenario, record in this format:

```
## A1 — Albums load correctly
- [✅] API returns album data
- [✅] Cards render with title, artist, cover
- [⚠️] Cover image aspect ratio slightly stretched (see screenshot A1)
- [✅] No overflow detected
```

| Symbol | Meaning             |
| ------ | ------------------- |
| ✅     | Passed              |
| ❌     | Failed / Bug        |
| ⚠️     | Minor visual issue  |
| 🔶     | Needs investigation |

---

## Appendix: Cheat Sheet

### playwright-cli Quick Reference

| Action                     | Command                                                                       |
| -------------------------- | ----------------------------------------------------------------------------- |
| Open browser               | `playwright-cli open http://localhost:5173`                                   |
| Navigate to page           | `playwright-cli goto http://localhost:5173/#/songs`                           |
| Click element              | `playwright-cli click e<N>`                                                   |
| Double-click               | `playwright-cli dblclick e<N>`                                                |
| Fill input                 | `playwright-cli fill e<N> "text"`                                             |
| Press key                  | `playwright-cli press Enter`                                                  |
| Press key combination      | `playwright-cli press Escape`                                                 |
| Hover element              | `playwright-cli hover e<N>`                                                   |
| Select option              | `playwright-cli select e<N> "option-value"`                                   |
| Take snapshot (with boxes) | `playwright-cli snapshot --boxes`                                             |
| Take screenshot            | `playwright-cli screenshot --filename=name.png`                               |
| Evaluate JS                | `playwright-cli eval "document.title"`                                        |
| Evaluate on element        | `playwright-cli eval "el => el.textContent" e<N>`                             |
| Get bounding box           | `playwright-cli eval "el => JSON.stringify(el.getBoundingClientRect())" e<N>` |
| Check network requests     | `playwright-cli requests`                                                     |
| Check console logs         | `playwright-cli console`                                                      |
| Reload page                | `playwright-cli reload`                                                       |
| Close browser              | `playwright-cli close`                                                        |

### understand-image Quick Reference

| Task                | Prompt                                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| General visual bugs | `"Analyze this web app screenshot for ALL visual UI bugs: overflow, misalignment, overlap, truncation, spacing, missing elements."` |
| Element position    | `"Check element positions in this screenshot. Are buttons, text, icons correctly aligned?"`                                         |
| Table layout        | `"Check table column alignment. Is text truncated? Are headers aligned with data?"`                                                 |
| Form layout         | `"Check form field alignment. Are labels next to inputs? Adequate spacing?"`                                                        |
| Empty state         | `"Check this empty state UI. Is the message centered and styled intentionally?"`                                                    |
| Overlap/z-index     | `"Check for overlapping elements or incorrect z-index layering."`                                                                   |
| Responsive layout   | `"Check if this layout works correctly at this viewport size. Any breakage?"`                                                       |
