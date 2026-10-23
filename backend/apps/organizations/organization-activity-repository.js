import { randomUUID } from "node:crypto"

function toActivity(row) {
  return {
    id: row.id,
    cursor: row.cursor,
    organizationId: row.organization_id,
    actorId: row.actor_id,
    actorName: row.actor_name,
    actorAvatarUrl: row.actor_avatar_url ?? undefined,
    taskId: row.task_id ?? undefined,
    kind: row.kind,
    details: JSON.parse(row.details),
    createdAt: row.created_at,
  }
}

export function createOrganizationActivityRepository(database) {
  const insertStatement = database.prepare(`
    INSERT INTO organization_activity
      (id, organization_id, actor_id, actor_name, actor_avatar_url, task_id, kind, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  return {
    list(organizationId, { limit = 15, before } = {}) {
      const statement = before !== undefined
        ? database.prepare(`
          SELECT rowid AS cursor, * FROM organization_activity
          WHERE organization_id = ? AND rowid < ?
          ORDER BY rowid DESC
          LIMIT ?
        `)
        : database.prepare(`
          SELECT rowid AS cursor, * FROM organization_activity
          WHERE organization_id = ?
          ORDER BY rowid DESC
          LIMIT ?
        `)
      const rows = before !== undefined ? statement.all(organizationId, before, limit) : statement.all(organizationId, limit)
      return rows.map(toActivity)
    },
    create(organizationId, actor, kind, details = {}, taskId) {
      const activity = {
        id: randomUUID(),
        organizationId,
        actorId: actor.id,
        actorName: actor.name,
        actorAvatarUrl: actor.avatarUrl,
        taskId,
        kind,
        details,
        createdAt: new Date().toISOString(),
      }
      const result = insertStatement.run(
        activity.id,
        activity.organizationId,
        activity.actorId,
        activity.actorName,
        activity.actorAvatarUrl ?? null,
        activity.taskId ?? null,
        activity.kind,
        JSON.stringify(activity.details),
        activity.createdAt,
      )
      activity.cursor = Number(result.lastInsertRowid)
      return activity
    },
  }
}
