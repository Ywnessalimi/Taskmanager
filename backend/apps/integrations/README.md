# Developer MCP

`/api/v1/mcp` exposes Streamable HTTP through the official MCP SDK in stateless JSON-response mode. Each request gets its own server and transport. A personal Bearer token is required. Browser sessions alone cannot invoke this route.

Users create, list and revoke their tokens with the authenticated `/api/v1/integrations/tokens` API or the assistant's connections panel. Tokens expire after 30 days, are hashed at rest, and restrict both project IDs and scopes (`read`, `create`, `update_status`). Current user membership is checked on every request and every tool call. Clients use the same endpoint with an Authorization header.

Tools are `projects_list`, `tasks_list_mine`, `tasks_get`, `tasks_create`, `tasks_update_status`. Writes require a stable `requestId` for safe retries. New tasks are assigned to the token owner. Status changes require current ownership. The underlying Task service is shared with the ordinary API and assistant.

Dependencies are the integration tables in migration 013, auth/organization repositories, Task service, assistant audit store and the MCP SDK. OAuth and client-managed approval are independent of this personal-token pilot. Production transport should be HTTPS through the existing reverse proxy.
