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
    projectStatusChanges(projectId, organizationId, from) {
      return database.prepare(`
        SELECT a.rowid AS cursor, a.task_id AS taskId, a.created_at AS createdAt,
          json_extract(a.details, '$.from') AS "from"
        FROM organization_activity a JOIN tasks t ON t.id = a.task_id
        WHERE a.organization_id = ? AND t.project_id = ? AND a.kind = 'task_status_changed' AND a.created_at >= ?
        ORDER BY a.created_at DESC, a.rowid DESC
      `).all(organizationId, projectId, from)
    },
    projectDailyCounts(projectId, organizationId, from, to) {
      return database.prepare(`
        SELECT a.actor_id AS actorId, substr(a.created_at, 1, 10) AS day, count(*) AS count
        FROM organization_activity a
        JOIN tasks t ON t.id = a.task_id
        WHERE a.organization_id = ? AND t.project_id = ?
          AND a.kind IN ('task_created', 'task_status_changed')
          AND a.created_at >= ? AND a.created_at < ?
        GROUP BY a.actor_id, substr(a.created_at, 1, 10)
        ORDER BY day, actorId
      `).all(organizationId, projectId, from, to)
    },
    list(organizationId, { limit = 15, before, userId } = {}) {
      const statement = before !== undefined
        ? database.prepare(`
          SELECT a.rowid AS cursor, a.* FROM organization_activity a
          WHERE a.organization_id = ? AND a.rowid < ? AND (a.task_id IS NULL OR EXISTS (
            SELECT 1 FROM tasks t JOIN projects p ON p.id = t.project_id
            JOIN organization_members om ON om.organization_id = p.organization_id AND om.user_id = ?
            JOIN project_members pm ON pm.project_id = p.id AND pm.organization_member_id = om.id
            WHERE t.id = a.task_id AND p.organization_id = a.organization_id
          ))
          ORDER BY a.rowid DESC
          LIMIT ?
        `)
        : database.prepare(`
          SELECT a.rowid AS cursor, a.* FROM organization_activity a
          WHERE a.organization_id = ? AND (a.task_id IS NULL OR EXISTS (
            SELECT 1 FROM tasks t JOIN projects p ON p.id = t.project_id
            JOIN organization_members om ON om.organization_id = p.organization_id AND om.user_id = ?
            JOIN project_members pm ON pm.project_id = p.id AND pm.organization_member_id = om.id
            WHERE t.id = a.task_id AND p.organization_id = a.organization_id
          ))
          ORDER BY a.rowid DESC
          LIMIT ?
        `)
      const rows = before !== undefined ? statement.all(organizationId, before, userId, limit) : statement.all(organizationId, userId, limit)
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
