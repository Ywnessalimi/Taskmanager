# features/ai

AI assistant — opened from the mobile and desktop mini bar.

## What it does

- `ai-assistant-dialog.tsx` → `AIAssistantDialog`: the modal content (`DialogContent variant="floatingPanel"`; its active triggers live in `components/navigation/{bottom-tab-bar,sidebar-nav}.tsx`). The design comes from the Figma "KalaMarket AI assistant" file: a header with the "Assistant" title + icon at the start side (right in RTL) and a close button at the end side, an empty state with an icon image (`public/images/ai/assistant-icon.png`) and a welcome message, and a bottom bar with a button at the start side that switches between microphone (empty) and send (once text is typed, using the same `AI_GRADIENT`), next to a `textarea`.
  - **Chat actually works**, but it isn't wired to any real AI service: after each user message, following a short delay, a fixed reply (`aiAssistant.mockReply`) is appended — only in this component's local state, with no persistence, like the rest of this phase.
  - `AI_GRADIENT` (an exported constant) reuses the same gradient as the floating button for the header icon and the send button (while the user is typing) to keep them visually consistent.
- `dialog.tsx` (`components/ui/`) → the `floatingPanel` variant: fullscreen on mobile (like `fullscreen`), but from `sm:` onward, instead of a centered modal, it becomes a floating panel with an 8px gap from the top/bottom that **always sticks to the physical right side of the screen** (not the logical `end`) — because this panel must stay there regardless of the language direction.
- `components/navigation/ai-assistant-fab.tsx` → a legacy standalone trigger retained in the code but no longer mounted by `(tabs)/layout.tsx` after the mini bar replaced it.

## Dependencies

- `components/ui/dialog.tsx` (the `fullscreen` variant, the same pattern as `FollowersDialog`/`TagPickerDialog` in `features/tasks/`).
- Translations: the `aiAssistant.*` keys in `src/lib/i18n/dictionary.ts`.
