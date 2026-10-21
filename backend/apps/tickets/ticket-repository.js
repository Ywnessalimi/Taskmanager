import { randomUUID } from "node:crypto"

export function createTicketRepository(database) {
  const getStatement = database.prepare("SELECT * FROM tickets WHERE id = ?")
  const activityStatement = database.prepare("SELECT * FROM ticket_activity WHERE ticket_id = ? ORDER BY created_at, rowid")
  const insertActivity = database.prepare("INSERT INTO ticket_activity (id,ticket_id,actor_id,actor_name,actor_avatar_url,kind,details,created_at) VALUES (?,?,?,?,?,?,?,?)")
  const toTicket = row => row ? ({ ...JSON.parse(row.data), id: row.id, createdAt: row.created_at, updatedAt: row.updated_at }) : null
  function log(id, actor, kind, details = {}) {
    insertActivity.run(randomUUID(), id, actor.id, actor.name, actor.avatarUrl ?? null, kind, JSON.stringify(details), new Date().toISOString())
  }
  return {
    get(id) { return toTicket(getStatement.get(id)) },
    list() { return database.prepare("SELECT * FROM tickets ORDER BY created_at, rowid").all().map(toTicket) },
    listForInbox(userId) {
      return database.prepare("SELECT * FROM tickets WHERE json_extract(data, '$.createdById') = ? OR json_extract(data, '$.assigneeId') = ? ORDER BY created_at DESC, rowid DESC")
        .all(userId, userId).map(toTicket)
    },
    activity(id) { return activityStatement.all(id).map(row => ({ id: row.id, ticketId: row.ticket_id, actorId: row.actor_id, actorName: row.actor_name, actorAvatarUrl: row.actor_avatar_url ?? undefined, kind: row.kind, details: JSON.parse(row.details), createdAt: row.created_at })) },
    save(id, input, actor) {
      const old = this.get(id), now = new Date().toISOString()
      database.prepare("INSERT INTO tickets (id,title,data,created_at,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,data=excluded.data,updated_at=excluded.updated_at")
        .run(id, input.title, JSON.stringify(input), old?.createdAt ?? now, now)
      if (!old) log(id, actor, "created", { title: input.title })
      else {
        if (old.assigneeId !== input.assigneeId || old.assigneeName !== input.assigneeName) log(id, actor, "assigned", { from: old.assigneeName ?? null, to: input.assigneeName ?? null, fromId: old.assigneeId ?? null, toId: input.assigneeId ?? null })
        if (old.status !== input.status) log(id, actor, "status_changed", { from: old.status, to: input.status })
        if (old.followers?.includes(actor.id) !== input.followers?.includes(actor.id)) log(id, actor, "following", { following: input.followers?.includes(actor.id) ?? false })
        if (old.favorites?.includes(actor.id) !== input.favorites?.includes(actor.id)) log(id, actor, "favorite", { favorite: input.favorites?.includes(actor.id) ?? false })
        const changedFields = ["title", "subject", "description", "permissionIds", "priority"].filter(key => JSON.stringify(old[key] ?? null) !== JSON.stringify(input[key] ?? null))
        if (changedFields.length) log(id, actor, "updated", { fields: changedFields })
      }
      return this.get(id)
    },
    logComment(id, comment) { log(id, { id: comment.authorId, name: comment.authorName, avatarUrl: comment.authorAvatarUrl }, "comment", { commentId: comment.id, text: comment.text }) },
    delete(id) { return database.prepare("DELETE FROM tickets WHERE id = ?").run(id).changes > 0 },
  }
}
