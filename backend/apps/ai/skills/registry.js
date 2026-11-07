import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { dashboardProposalSchema } from '../../dashboards/dashboard-service.js'

const id = z.string().min(1).max(200)
const priority = z.enum(['none', 'low', 'medium', 'high', 'urgent'])
const status = z.enum(['todo', 'in-progress', 'completed'])
const dueDate = z.string().regex(/^1[34]\d{2}\/\d{2}\/\d{2}$/).nullable().optional()
const taskFields = {
  title: z.string().trim().min(1).max(300),
  description: z.string().max(6000).optional(),
  assigneeIds: z.array(id).max(20).default([]),
  priority: priority.default('none'),
  dueDate,
}
export const exportSchema = z.object({
  format: z.enum(['xlsx', 'csv', 'docx', 'pdf']),
  title: z.string().trim().min(1).max(160).optional(),
  columns: z.array(z.enum(['displayId', 'title', 'project', 'assignees', 'status', 'priority', 'dueDate', 'createdAt', 'timeSpentMinutes'])).min(1).max(9).optional(),
  sortBy: z.enum(['title', 'project', 'assignees', 'status', 'priority', 'dueDate', 'createdAt']).optional(),
  groupBy: z.enum(['none', 'project', 'status']).default('none'),
  locale: z.enum(['fa', 'en']).default('fa'),
}).strict()

const definitions = [
  {
    name: 'dashboards_propose', title: 'ساخت کارتابل تیم', effect: 'preview',
    description: 'Prepare 1–5 personal dashboards with task and status-chart widgets, filtered by accessible project IDs and optional member IDs. Each dashboard can be selected before confirmation. Explain which team is included.',
    schema: z.object({ dashboards: z.array(dashboardProposalSchema).min(1).max(5) }).strict(),
  },
  {
    name: 'projects_list', title: 'شناخت پروژه‌ها', effect: 'read',
    description: 'List accessible projects with IDs and divisions. Resolve the project before proposing work.',
    schema: z.object({}).strict(),
  },
  {
    name: 'members_list', title: 'شناخت اعضا و مهارت‌ها', effect: 'read',
    description: 'Read members, job titles, self-declared skills and current task counts in one accessible project. Suggest assignments using these facts and the manager context. Ask when people are ambiguous.',
    schema: z.object({ projectId: id }).strict(),
  },
  {
    name: 'tasks_search', title: 'جست‌وجوی تسک', effect: 'read',
    description: 'Search accessible root tasks by project, text, assignee or status. Returns IDs for editing. Pagination uses offset.',
    schema: z.object({ projectId: id.optional(), query: z.string().max(200).optional(), assigneeId: id.optional(), status: status.optional(), offset: z.number().int().min(0).max(10000).default(0) }).strict(),
  },
  {
    name: 'ask_question', title: 'پرسش از کاربر', effect: 'display',
    description: 'Display a short question with 2–5 selectable answers and a free-text answer. Use to resolve missing scope, members, deadlines or report format.',
    schema: z.object({ question: z.string().min(1).max(500), options: z.array(z.string().min(1).max(200)).min(2).max(5) }).strict(),
  },
  {
    name: 'tasks_propose', title: 'برنامه‌ریزی و ساخت تسک', effect: 'preview',
    description: 'Prepare 1–30 selectable task cards in a project for user confirmation. Include a concrete reason for each proposed assignee. Only confirmed selected cards are created. One level of subtasks is supported.',
    schema: z.object({ projectId: id, summary: z.string().max(2000), tasks: z.array(z.object({ ...taskFields, reason: z.string().max(1000).optional(), subtasks: z.array(z.object(taskFields).strict()).max(20).default([]) }).strict()).min(1).max(30) }).strict(),
  },
  {
    name: 'tasks_propose_update', title: 'ویرایش و واگذاری تسک', effect: 'preview',
    description: 'Preview edits to 1–30 existing tasks, including reassignment. Include only requested fields. User sees old and new values and selects edits. Use tasks_search first.',
    schema: z.object({ changes: z.array(z.object({ taskId: id, patch: z.object({ title: taskFields.title.optional(), description: taskFields.description, assigneeIds: z.array(id).max(20).optional(), priority: priority.optional(), status: status.optional(), dueDate }).strict().refine(value => Object.keys(value).length > 0) }).strict()).min(1).max(30) }).strict(),
  },
  {
    name: 'ticket_propose', title: 'ساخت تیکت', effect: 'preview',
    description: 'Prepare a ticket for confirmation. Assignment requires an accessible project and one of its member IDs.',
    schema: z.object({ title: taskFields.title, description: taskFields.description, projectId: id.nullable().default(null), assigneeId: id.nullable().default(null), priority: priority.default('none'), subject: z.enum(['general', 'hr', 'purchasing', 'warehouse']).default('general'), permissionIds: z.array(z.enum(['salary-payment', 'purchase', 'warehouse-release', 'other'])).max(4).default([]) }).strict(),
  },
  {
    name: 'project_propose', title: 'ساخت پروژه', effect: 'preview',
    description: 'Prepare a project in an existing division for confirmation. Requires createProject permission. This tool uses current organization-based project access.',
    schema: z.object({ divisionId: id, name: z.string().trim().min(1).max(120) }).strict(),
  },
  {
    name: 'report_tasks', title: 'گزارش وضعیت پروژه', effect: 'read',
    description: 'Compute actual current task status counts, per-member workload and task rows. Optional ISO from/to filters tasks CREATED in that period, with exclusive to. This is a current-state snapshot, not a historical completion or individual time report. Returns a report widget and reportId for export.',
    schema: z.object({ projectIds: z.array(id).min(1).max(30).optional(), assigneeId: id.optional(), from: z.string().datetime().optional(), to: z.string().datetime().optional(), title: z.string().min(1).max(160).default('گزارش وضعیت تسک‌ها') }).strict(),
  },
  {
    name: 'report_export', title: 'ساخت فایل گزارش', effect: 'display',
    description: 'Show a downloadable XLSX, CSV, Word DOCX or PDF from an existing reportId. Choose column order, title, sorting and grouping from the user request. Get a report with report_tasks first.',
    schema: exportSchema.extend({ reportId: id }).strict(),
  },
  {
    name: 'notifications_read', title: 'خلاصهٔ اعلان‌ها', effect: 'read',
    description: 'Read the current user accessible notifications with links, at most 50 per page. Summarize only returned results and state total count. This does not mark notifications read.',
    schema: z.object({ unreadOnly: z.boolean().default(true), offset: z.number().int().min(0).max(10000).default(0) }).strict(),
  },
  {
    name: 'comments_search', title: 'جست‌وجوی کامنت تیکت', effect: 'read',
    description: 'Search persisted ticket comments in accessible projects by author ID and optional text. Covers ticket comments only. Returns source links and page count.',
    schema: z.object({ authorId: id, projectId: id.optional(), query: z.string().max(200).default(''), offset: z.number().int().min(0).max(10000).default(0) }).strict(),
  },
]

export const skills = definitions.map(skill => ({ ...skill, inputSchema: zodToJsonSchema(skill.schema, { target: 'openApi3' }) }))
export const skillMap = new Map(skills.map(skill => [skill.name, skill]))
export const functionTools = skills.map(skill => ({ type: 'function', function: { name: skill.name, description: skill.description, parameters: skill.inputSchema } }))
