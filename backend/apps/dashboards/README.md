# Server dashboards

Owns private dashboard definitions created through assistant previews. The existing inbox dashboard provider merges these definitions with legacy browser-local dashboards. Server dashboards support version-checked slot updates and owner-only deletion. Task data is queried against current project access every time and filtered by stable assignee IDs.

Dependencies are migration 014, the organization and Task repositories and Task service. Consumers are `apps/ai`, `server.js` and `frontend/src/features/inbox-dashboards`. This module does not import or overwrite browser-local dashboards.
