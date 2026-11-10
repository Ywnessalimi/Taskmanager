# Task service

Shared Task writes for the ordinary API, assistant previews and developer MCP. The service checks project access, resolves assignee IDs against current project membership, validates fields and commits the task, organization activity and assignment notifications together.

Depends on the Task repository, organization and notification repositories and the authenticated actor supplied by the route. Legacy assignee names are resolved only when unique within the organization. Consumers are `server.js`, `apps/ai` and `apps/integrations`. Nested synchronous writes use SQLite savepoints so a failed batch rolls back all effects.
