# features/ai

AI assistant — opened from the mobile and desktop mini bar.

## What it does

- `ai-assistant-dialog.tsx` → `AIAssistantDialog`: the modal content (`DialogContent variant="floatingPanel"`; its active triggers live in `components/navigation/{bottom-tab-bar,sidebar-nav}.tsx`). The design comes from the Figma "KalaMarket AI assistant" file: a header with the "Assistant" title + icon at the start side (right in RTL) and a close button at the end side, an empty state with an icon image (`public/images/ai/assistant-icon.png`) and a welcome message, and a bottom bar with a button at the start side that switches between microphone (empty) and send (once text is typed, using the same `AI_GRADIENT`), next to a `textarea`.
  - Chat sends the current conversation to the authenticated `POST /api/v1/assistant/chat` endpoint through `lib/api/assistant.ts`. The backend calls the OpenAI-compatible Nokod API with `Qwen38`; chat history remains in this component's local state and is not persisted.
  - `AI_GRADIENT` (an exported constant) reuses the same gradient as the floating button for the header icon and the send button (while the user is typing) to keep them visually consistent.
- `dialog.tsx` (`components/ui/`) → the `floatingPanel` variant: fullscreen on mobile (like `fullscreen`), but from `sm:` onward, instead of a centered modal, it becomes a floating panel with an 8px gap from the top/bottom that **always sticks to the physical right side of the screen** (not the logical `end`) — because this panel must stay there regardless of the language direction.
- `components/navigation/ai-assistant-fab.tsx` → a legacy standalone trigger retained in the code but no longer mounted by `(tabs)/layout.tsx` after the mini bar replaced it.

## Dependencies

- `components/ui/dialog.tsx` (the `fullscreen` variant, the same pattern as `FollowersDialog`/`TagPickerDialog` in `features/tasks/`).
- Translations: the `aiAssistant.*` keys in `src/lib/i18n/dictionary.ts`.
- `lib/api/assistant.ts` and the authenticated backend chat route. The provider key is configured on the backend only.

## Conversation and actions

- User and assistant message bubbles use physical right/left alignment in both locales; `dir="auto"` keeps each message's text direction natural.
- `ai-workflow.ts` loads projects, members and tasks available to the signed-in user, validates the model's structured proposals, and creates Task or Ticket or edits selected Task fields through the user's existing authenticated APIs only after the dialog's confirmation button. Before editing, it re-reads the task and refuses stale proposals if a changed field or its project no longer matches. The API rechecks project access; the existing permission model has no separate task create/edit permissions. Member reports count authorized `/tasks` data. Tasks identify assignees by name; duplicate names prevent a reliable report. Task time is shared and is not attributed to an individual.
- Assistant Markdown uses `react-markdown` and `remark-gfm`; raw HTML is not enabled. The model receives conversation text and accessible project/member names and IDs and a bounded list of task titles and IDs. The proposal preview includes the fields that will be saved and the previous values for edits.
- `ai-tools.ts` remains a separate legacy tool foundation; the dialog uses `ai-workflow.ts`. Consumers: `AIAssistantDialog`; dependencies include `lib/api/{tasks,users}.ts` and `features/tickets/local-created-tickets.ts`.
