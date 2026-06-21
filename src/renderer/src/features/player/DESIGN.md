# Player Decision Guide

The player has global lifetime and coordinates several UI surfaces. This guide
records its invariants; reducer and component code remain the source for exact
transitions.

## Core Concepts

- **Compact player / mini-player:** The persistent bottom player used while
  browsing routes. Its controls and visible metadata vary by width.
- **Expanded player:** The large player presentation opened from the compact
  player. Tests and accessible labels may call it the "full screen player"; it
  does not necessarily enter browser or operating-system fullscreen.
- **Compact video:** The video image positioned over the mini-player's
  `data-video-player-anchor`.
- **Expanded video:** The same video runtime repositioned into the expanded
  stage. It is not a second player.
- **Persistent video runtime:** The single mounted `ReactPlayer` instance that
  preserves source, position, and playback while presentation changes.
- **Playback context:** The ordered media collection plus its play source and
  selected starting item.
- **Queue entry:** One playable occurrence with a unique queue ID, media,
  source, and source item key.
- **Chapter:** A seek point within one video queue entry, not a separate track.

## Persistent Player

**Decision:** One `Player` remains mounted in `AppShell` across route changes.

**Why:** Playback, queue state, and the media runtime must not restart when the
user navigates through the library.

**Change guidance:** Add player presentations below the existing root. Do not
mount route-local audio/video players for normal library playback.

**References:** [`AppShell.tsx`](../../app/AppShell.tsx),
[`Player.tsx`](components/Player.tsx)

## State Separation

**Decision:** Redux separates playback context (`player`), presentation state
(`playerGui`), and video runtime controls (`playerVideoControl`).

**Why:** Queue transitions, panel visibility, and runtime events have different
lifecycles and change frequencies. Separating them prevents media callbacks
from becoming page or layout state.

**Change guidance:** Put durable queue/media facts in `player`, view toggles in
`playerGui`, and runtime commands/status in `playerVideoControl`. Local visual
effects that do not coordinate other components should remain local state.

**References:** [`store.ts`](../../app/store.ts), [`store/`](store/)

## Queue Identity and Source

**Decision:** Every queue entry has a unique queue ID, media value, play source,
and source item key. Active-row matching includes source context and occurrence
identity where available.

**Why:** Media can appear in multiple screens or more than once in a playlist.
Matching only by media ID would mark unrelated rows active and make duplicate
occurrences ambiguous.

**Change guidance:** All new playback entry points must dispatch `playContext`
with a meaningful route and source label. Ordered collections with stable item
IDs should pass them as source item keys. Preserve queue entry IDs during
reordering and deletion.

**References:** [`types.ts`](types.ts),
[`playerSlice.ts`](store/playerSlice.ts),
[`PlaylistItemsTable.tsx`](../playlist/components/PlaylistItemsTable.tsx)

## Queue Transitions

**Decision:** The current entry, history, and next-up queue are explicit. Shuffle
retains original ordering so remaining entries can be restored; repeat behavior
is applied at the queue/runtime boundary.

**Why:** Explicit sections support previous/next navigation, queue editing, and
the visible history/current/next-up model without reconstructing state from a
single index.

**Change guidance:** Evaluate changes against user next/previous actions,
natural media completion, repeat-one, repeat-all, shuffle restoration, and
queue deletion. Prefer focused reducer tests over documenting each transition.

**References:** [`playerSlice.ts`](store/playerSlice.ts),
[`playerSlice.test.ts`](store/playerSlice.test.ts),
[`FloatingQueueList.tsx`](components/FloatingQueueList.tsx)

## Audio and Video Runtime

**Decision:** `PlaybackEngine` is the only playback runtime. Audio uses the
global audio player; video uses one persistent `ReactPlayer` instance controlled
through Redux.

**Why:** Rendering separate compact and expanded video players would reload the
source, lose playback position, and allow competing runtimes.

**Change guidance:** Compact and expanded UIs must provide presentation anchors,
not additional players. Changes to runtime placement must preserve one
`persistent-video-runtime` through expansion, minimization, and resizing.

**References:** [`PlaybackEngine.tsx`](components/PlaybackEngine.tsx),
[`MPlayerUI.tsx`](components/MPlayerUI.tsx),
[`gui.spec.ts`](../../../../../e2e/gui.spec.ts)

## Video Placement and Aspect Ratio

**Decision:** The persistent video runtime measures the compact anchor and moves
to the expanded viewport without remounting. Expanded video uses natural media
dimensions when available and metadata/fallback dimensions otherwise.

**Why:** The compact player changes size across responsive layouts, and video
metadata may arrive after the runtime mounts. A stable aspect frame prevents
distortion while retaining playback continuity.

**Change guidance:** Consider anchor visibility, resize/transition measurement,
portrait and landscape media, and delayed natural dimensions together. Keep
aspect calculation pure and unit tested.

**References:** [`PlaybackEngine.tsx`](components/PlaybackEngine.tsx),
[`videoAspect.ts`](videoAspect.ts),
[`videoAspect.test.ts`](videoAspect.test.ts)

## Chapters

**Decision:** Video progress derives the active chapter. User next/previous
commands navigate adjacent chapters before changing tracks when applicable.
Starting a chapter from a video detail page creates one video queue entry and
stores a media-scoped pending seek. The seek is consumed only after the matching
video runtime is ready.

**Why:** Chapters are navigation points within one queue entry, not separate
media or queue items.

**Change guidance:** Seeking must update runtime position and chapter UI without
creating queue entries. Test boundary behavior at the first/last chapter and
when chapter metadata is absent. Never apply a pending seek to a runtime loaded
for a different video.

**References:** [`onVideoPosition.ts`](thunks/onVideoPosition.ts),
[`onNextTrack.ts`](thunks/onNextTrack.ts),
[`onPrevTrack.ts`](thunks/onPrevTrack.ts)

## Synchronized Lyrics

**Decision:** Lyrics are a separately fetched server resource for the current
media item. They are not copied into queue entries or library payloads.
Expanded audio may replace the artwork stage with a bilingual lyric
presentation, while expanded video renders the same timed content as an
overlay without remounting the persistent video runtime.

Each synchronized row has one shared start/end range and optional language
fields. The selected pair determines a primary line and a smaller secondary
line: Japanese/Romaji by default, Romaji/English, or Romaji/Vietnamese. Sync
mode follows the active row; manual scrolling disables following until the user
selects Sync Lyrics again. Sync Lyrics is a restore action, not a toggle:
activating it always enables follow mode and recenters the active row, and
activating it while already enabled must not disable following.
The restore button is hidden while follow mode is enabled and appears only
after manual audio-lyric scrolling disables follow mode. Video lyrics always
follow playback and never render a Sync Lyrics button.

At `lg` and above, audio lyrics share the stage with artwork. From `sm` through
below `lg`, artwork is hidden and lyrics use the full stage. Mobile reserves the
upper expanded-player area for lyrics and keeps metadata and controls below.
Opening lyrics slides the lyric surface from right to left while fading it in;
closing reverses the motion toward the right. Audio shifts the artwork subtly
left during the cross-fade; video applies the same horizontal lyric motion
without remounting the persistent video runtime. Closing surfaces remain
mounted until their exit transition completes, with visibility and pointer
events disabled afterward.
Play queue surfaces use the same right-to-left entry and reversed exit motion
in compact desktop, expanded desktop, and expanded mobile presentations. Queue
content remains mounted through its exit transition, then becomes hidden and
noninteractive.
The lyric column stays centered inside a readable maximum width, and artwork
must remain constrained to its own grid column. Lyric rows are seek controls:
pointer or keyboard activation seeks to the row start and resumes follow mode.

Scrollable lyric surfaces inherit the global `::-webkit-scrollbar` rules from
[`index.css`](../../index.css), remain inset from the window edge, and fade
content at the top and bottom with a mask. Do not set `scrollbarColor`,
`scrollbarWidth`, or feature-local `::-webkit-scrollbar` styles. Do not place
floating lyric controls beneath the persistent player chrome.

**Change guidance:** Derive lyric timing from the existing audio or video clock.
Do not add lyric data to Redux playback state or create another media runtime.
The icon-only language selector belongs to persistent player chrome immediately
beside the play-queue action, not inside the lyric surface. Preserve the
selected pair across queue transitions. Its menu uses minimal destination
labels (`Japanese`, `English`, `Vietnamese`) rather than pair descriptions.
Preserve accessible button names for lyric rows so click-to-seek remains
available to keyboard and assistive-technology users.

## Responsive Presentation

**Decision:** The same playback state drives compact desktop/tablet chrome,
compact mobile chrome with navigation, and expanded player controls. Opening the
expanded player hides conflicting mobile navigation and desktop queue surfaces.

**Why:** Responsive layouts change control priority, not playback ownership.

### Presentation Matrix

| Width and state                | Intended presentation                                                                                                                                                              |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Below `sm`, nothing playing    | Bottom mobile navigation remains available without an empty player.                                                                                                                |
| Below `sm`, compact            | Track summary and primary playback controls share the bottom surface with mobile navigation. Audio artwork and the video preview use the same compact-media visibility rule.       |
| Below `sm`, expanded           | Full mobile controls replace compact chrome; mobile navigation is hidden. Audio emphasizes artwork/details, while video reserves a centered aspect-ratio frame above the controls. |
| `sm` and above, compact        | Desktop player chrome shows track/media area, central controls and progress, queue/volume controls, and progressively reveals secondary metadata at wider widths.                  |
| `sm` and above, expanded audio | The expanded presentation adds artwork, artist context, and related content while retaining the desktop control surface.                                                           |
| `sm` and above, expanded video | The video runtime fills the expanded stage. Header and bottom chrome auto-hide after inactivity and return on mouse or keyboard activity.                                          |

**Decision:** Expansion state is shared across widths even though the visible
controls differ. Resizing must adapt the existing player and runtime rather than
resetting expansion or playback.

**Decision:** Compact audio artwork and compact video use the same responsive
visibility rule: visible on standard mobile widths, hidden in the constrained
tablet band, and visible on wider desktop layouts. Very narrow mobile widths may
hide both to preserve track and control space.

**Why:** Electron windows can be resized while media is playing. Width changes
must not create a new queue, player instance, or source load.

**Change guidance:** Verify changes at 390, 800, 1024, and 1280 px with both
audio and video, compact and expanded. Check mobile navigation visibility,
sidebar-independent player placement, queue visibility, compact video anchor
availability, and the return path from expanded mode. Preserve accessible
control names because E2E tests and keyboard users rely on them.

**References:** [`Player.tsx`](components/Player.tsx),
[`ExpandedPlayerUI.tsx`](components/ExpandedPlayerUI.tsx),
[`ExpandedMobileControls.tsx`](components/ExpandedMobileControls.tsx),
[`gui.spec.ts`](../../../../../e2e/gui.spec.ts)
