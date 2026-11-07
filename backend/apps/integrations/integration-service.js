import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { DomainError, transaction } from '../tasks/task-service.js'

const digest = value => createHash('sha256').update(value).digest('hex')
const tokenSchema = z.object({ name: z.string().trim().min(1).max(100), projectIds: z.array(z.string()).min(1).max(30), scopes: z.array(z.enum(['read', 'create', 'update_status'])).min(1).max(3) }).strict()

export function createIntegrationService({ database, authRepository, organizationRepository, repository, taskService, store }) {
  function authenticate(token) {
    if (!token || typeof token !== 'string') throw new DomainError(401, 'invalid_token', 'توکن اتصال معتبر نیست.')
    const row = database.prepare('SELECT * FROM integration_tokens WHERE token_hash = ? AND expires_at > ?').get(digest(token), new Date().toISOString())
    const user = row && authRepository.getUser(row.user_id)
    if (!user) throw new DomainError(401, 'invalid_token', 'توکن اتصال معتبر نیست.')
    return { id: row.id, user, projectIds: JSON.parse(row.project_ids), scopes: JSON.parse(row.scopes) }
  }
  function requireProject(context, projectId) {
    if (!context.projectIds.includes(projectId)) throw new DomainError(403, 'project_scope', 'این پروژه در محدودهٔ اتصال نیست.')
    return taskService.projectFor(context.user, projectId)
  }
  function write(context, action, args, execute) {
    return transaction(database, () => {
      const fingerprint = digest(JSON.stringify({ action, args }))
      const previous = database.prepare('SELECT * FROM integration_requests WHERE token_id = ? AND request_id = ?').get(context.id, args.requestId)
      if (previous) {
        if (previous.fingerprint !== fingerprint) throw new DomainError(409, 'request_conflict', 'شناسهٔ درخواست قبلاً برای عملیات دیگری استفاده شده است.')
        return JSON.parse(previous.result)
      }
      const result = execute()
      database.prepare('INSERT INTO integration_requests VALUES (?, ?, ?, ?)').run(context.id, args.requestId, fingerprint, JSON.stringify(result))
      store.audit(context.user.id, 'mcp', action, { tokenId: context.id, requestId: args.requestId, taskId: result.id })
      return result
    })
  }
  const id = z.string().min(1).max(200)
  const requestId = z.string().min(8).max(100)
  const definitions = [
    { name: 'projects_list', scope: 'read', description: 'List projects currently allowed by this token and your membership.', schema: {}, execute(context) {
      return organizationRepository.listProjects(context.user.id).filter(project => context.projectIds.includes(project.id)).map(project => ({ id: project.id, name: project.name }))
    } },
    { name: 'tasks_list_mine', scope: 'read', description: 'List up to 100 tasks assigned to you in an allowed project.', schema: { projectId: id, offset: z.number().int().min(0).max(10000).default(0) }, execute(context, args) {
      requireProject(context, args.projectId)
      const tasks = repository.listTasks({ projectId: args.projectId }).filter(task => task.assigneeIds.includes(context.user.id))
      return { total: tasks.length, tasks: tasks.slice(args.offset, args.offset + 100) }
    } },
    { name: 'tasks_get', scope: 'read', description: 'Read a task in an allowed project.', schema: { taskId: id }, execute(context, args) {
      const task = taskService.get(context.user, args.taskId)
      requireProject(context, task.projectId)
      return task
    } },
    { name: 'tasks_create', scope: 'create', description: 'Create one task assigned to you. Reuse requestId only for retrying the same operation.', schema: { requestId, projectId: id, title: z.string().trim().min(1).max(300), description: z.string().max(6000).default('') }, execute(context, args) {
      requireProject(context, args.projectId)
      return write(context, 'tasks_create', args, () => taskService.create(context.user, { projectId: args.projectId, title: args.title, description: args.description, assigneeIds: [context.user.id] }))
    } },
    { name: 'tasks_update_status', scope: 'update_status', description: 'Change status of a task assigned to you. Reuse requestId only for retrying the same operation.', schema: { requestId, taskId: id, status: z.enum(['todo', 'in-progress', 'completed']) }, execute(context, args) {
      const task = taskService.get(context.user, args.taskId)
      requireProject(context, task.projectId)
      if (!task.assigneeIds.includes(context.user.id)) throw new DomainError(403, 'not_assigned', 'تغییر وضعیت این اتصال فقط برای تسک‌های خودتان مجاز است.')
      return write(context, 'tasks_update_status', args, () => taskService.update(context.user, args.taskId, { status: args.status }))
    } },
  ]
  return {
    authenticate,
    list(user) {
      return database.prepare('SELECT id, name, project_ids, scopes, expires_at FROM integration_tokens WHERE user_id = ? ORDER BY created_at DESC').all(user.id).map(row => ({ id: row.id, name: row.name, projectIds: JSON.parse(row.project_ids), scopes: JSON.parse(row.scopes), expiresAt: row.expires_at }))
    },
    issue(user, input) {
      const parsed = tokenSchema.safeParse(input)
      if (!parsed.success) throw new DomainError(400, 'invalid_token_input', 'نام، پروژه و مجوز اتصال را مشخص کنید.')
      const value = parsed.data
      for (const projectId of value.projectIds) taskService.projectFor(user, projectId)
      const count = database.prepare('SELECT count(*) AS count FROM integration_tokens WHERE user_id = ? AND expires_at > ?').get(user.id, new Date().toISOString()).count
      if (count >= 10) throw new DomainError(400, 'token_limit', 'ابتدا یکی از اتصال‌های قبلی را لغو کنید.')
      const token = `quire_${randomBytes(32).toString('base64url')}`
      const expiresAt = new Date(Date.now() + 30 * 86400_000).toISOString()
      const tokenId = randomUUID()
      database.prepare('INSERT INTO integration_tokens VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(tokenId, user.id, digest(token), value.name, JSON.stringify([...new Set(value.projectIds)]), JSON.stringify([...new Set(value.scopes)]), expiresAt, new Date().toISOString())
      return { id: tokenId, token, expiresAt }
    },
    revoke(user, tokenId) { database.prepare('DELETE FROM integration_tokens WHERE id = ? AND user_id = ?').run(tokenId, user.id) },
    invoke(token, name, args) {
      const context = authenticate(token)
      const definition = definitions.find(item => item.name === name && context.scopes.includes(item.scope))
      if (!definition) throw new DomainError(403, 'tool_scope', 'این ابزار در محدودهٔ اتصال نیست.')
      const parsed = z.object(definition.schema).strict().safeParse(args)
      if (!parsed.success) throw new DomainError(400, 'invalid_input', 'ورودی ابزار معتبر نیست.')
      return definition.execute(context, parsed.data)
    },
    async handle(request, response, body) {
      const token = request.headers.authorization?.match(/^Bearer (.+)$/i)?.[1]
      const context = authenticate(token)
      const server = new McpServer({ name: 'quire', version: '1.0.0' })
      for (const definition of definitions.filter(item => context.scopes.includes(item.scope))) {
        server.registerTool(definition.name, { description: definition.description, inputSchema: definition.schema, annotations: { readOnlyHint: definition.scope === 'read', destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async args => {
          try {
            const result = this.invoke(token, definition.name, args)
            return { content: [{ type: 'text', text: JSON.stringify(result) }] }
          } catch (error) {
            if (!(error instanceof DomainError)) throw error
            return { isError: true, content: [{ type: 'text', text: JSON.stringify({ code: error.code, message: error.message }) }] }
          }
        })
      }
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
      response.on('close', () => { void server.close() })
      await server.connect(transport)
      await transport.handleRequest(request, response, body)
    },
  }
}
