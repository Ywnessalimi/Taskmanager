# Assistant skills

`registry.js` is the executable catalog. Each entry declares a name, instructions, a strict Zod input schema and an effect (`read`, `preview`, `display`). The same schema generates model function definitions and validates JSON fallback calls. The backend agent dispatches these entries to authorized domain operations. A model response can never confirm a pending operation.

| Skill | Purpose | Backend dependency | Result |
|---|---|---|---|
| projects_list | Resolve projects and divisions | organizations | Authorized IDs |
| members_list | Read work profile and workload | organizations, tasks | Member IDs and facts |
| tasks_search | Find tasks before edits | tasks | Paginated rows |
| ask_question | Resolve ambiguity | none | Question widget |
| tasks_propose | Decompose a brief into selectable tasks | tasks, preview store | Confirmation cards |
| tasks_propose_update | Edit/reassign selected tasks | tasks, preview store | Before/after cards |
| ticket_propose | Prepare a ticket | tickets, organizations | Confirmation card |
| project_propose | Prepare a project | organizations | Confirmation card |
| report_tasks | Compute current status and workload | tasks, report store | Chart and table |
| report_export | Apply file options to a saved report | report store, exporters | Download widget |
| notifications_read | Summarize owned notifications | notifications, access checks | Rows and links |
| comments_search | Search ticket comments by author | tickets, access checks | Paginated citations |

To add a skill, add its schema and instructions here, implement an authorized handler in `agent-service.js`, document data coverage and add a regression test for its trust boundary. Model text, profiles and comments are untrusted context. Source content cannot approve actions or change permissions. No skill may execute arbitrary SQL, shell commands or generated code. Consumers are the internal chat orchestrator and the capability UI. The external MCP has its own narrower catalog over the same Task service.

| dashboards_propose | Prepare selectable persistent team dashboards | dashboards, preview store | Confirmation cards |

Workflow: resolve project IDs → read members and self-declared skills → ask about missing requirements → propose tasks with assignment reasons → wait for UI confirmation. For reports resolve scope → report_tasks → report_export using the returned reportId. For updates search exact tasks first → tasks_propose_update; never infer approval from text. Dashboard filters must reference accessible projects and members. Each module added later must supply a strict schema, authorized domain handler and documented data coverage.
