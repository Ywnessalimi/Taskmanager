import { randomUUID } from "node:crypto"

function toComment(row) {
  if (!row) return undefined
  return {
    id: row.id,
    ticketId: row.ticket_id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorAvatarUrl: row.author_avatar_url ?? undefined,
    text: row.body,
    createdAt: row.created_at,
  }
}

export function createTicketCommentRepository(database) {
  const listStatement = database.prepare("SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY created_at, rowid")
  const insertStatement = database.prepare(`
    INSERT INTO ticket_comments (id, ticket_id, author_id, author_name, author_avatar_url, body, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  function list(ticketId) {
    return listStatement.all(ticketId).map(toComment)
  }

  function create(ticketId, input) {
    const comment = {
      id: randomUUID(),
      ticketId,
      authorId: input.authorId.trim(),
      authorName: input.authorName.trim(),
      authorAvatarUrl: input.authorAvatarUrl?.trim() || undefined,
      text: input.text.trim(),
      createdAt: new Date().toISOString(),
    }
    insertStatement.run(comment.id, comment.ticketId, comment.authorId, comment.authorName, comment.authorAvatarUrl ?? null, comment.text, comment.createdAt)
    return comment
  }

  return { list, create }
}
