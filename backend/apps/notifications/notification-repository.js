import { randomUUID } from "node:crypto"

function toNotification(row) {
  return {
    id: row.id,
    verb: row.verb,
    actorId: row.actor_id,
    actorName: row.actor_name,
    target: {
      type: row.target_type, id: row.target_id, label: row.target_label, projectId: row.project_id,
      ...(row.target_priority ? { priority: row.target_priority } : {}),
    },
    status: row.status,
    requiresApproval: false,
    createdAt: row.created_at,
  }
}

export function createNotificationRepository(database) {
  const insert = database.prepare(`
    INSERT INTO notifications (
      id, recipient_name, actor_id, actor_name, verb, target_type, target_id,
      target_label, project_id, status, created_at
    ) VALUES (?, ?, ?, ?, 'taskAssigned', 'task', ?, ?, ?, 'unread', ?)
  `)
  const insertTicketAssignment = database.prepare(`
    INSERT INTO notifications (
      id, recipient_name, actor_id, actor_name, verb, target_type, target_id,
      target_label, project_id, status, created_at
    ) VALUES (?, ?, ?, ?, 'ticketAssigned', 'ticket', ?, ?, ?, 'unread', ?)
  `)

  function createTaskAssignmentNotifications(task, actor) {
    if (!actor?.id || !actor?.name || !Array.isArray(task.assigneeNames)) return []
    const project = database.prepare("SELECT name FROM projects WHERE id = ?").get(task.projectId)
    const members = database.prepare('SELECT u.id, u.name FROM users u JOIN organization_members m ON m.user_id = u.id JOIN projects p ON p.organization_id = m.organization_id JOIN project_members pm ON pm.project_id = p.id AND pm.organization_member_id = m.id WHERE p.id = ?').all(task.projectId)
    const recipients = task.assigneeIds?.length
      ? [...new Set(task.assigneeIds)].map(id => members.find(member => member.id === id)).filter(Boolean)
      : [...new Set(task.assigneeNames.map(name => name.trim()).filter(Boolean))].map(name => {
        const matches = members.filter(member => member.name === name)
        return { id: matches.length === 1 ? matches[0].id : null, name }
      })
    const now = new Date().toISOString()
    const notifications = recipients.map(recipient => ({
      id: randomUUID(), recipientId: recipient.id, recipientName: recipient.name, actorId: actor.id, actorName: actor.name,
      verb: "taskAssigned", target: { type: "task", id: task.id, label: task.title, projectId: task.projectId },
      status: "unread", requiresApproval: false, createdAt: now,
    }))
    for (const notification of notifications) {
      insert.run(notification.id, notification.recipientName, notification.actorId, notification.actorName,
        notification.target.id, notification.target.label, notification.target.projectId, now)
      database.prepare('UPDATE notifications SET recipient_id = ? WHERE id = ?').run(notification.recipientId, notification.id)
    }
    return notifications.map((notification) => ({ ...notification, projectName: project?.name ?? "" }))
  }

  function createTicketAssignmentNotification(ticket, recipient, actor) {
    if (!ticket?.assigneeId || !recipient?.id || !recipient?.name || !actor?.id || !actor?.name) return undefined
    const now = new Date().toISOString()
    const notification = {
      id: randomUUID(), recipientName: recipient.name, actorId: actor.id, actorName: actor.name,
      verb: "ticketAssigned", target: { type: "ticket", id: ticket.id, label: ticket.title, projectId: ticket.projectId },
      status: "unread", requiresApproval: false, createdAt: now,
    }
    insertTicketAssignment.run(notification.id, notification.recipientName, notification.actorId, notification.actorName,
      notification.target.id, notification.target.label, notification.target.projectId ?? null, now)
    database.prepare('UPDATE notifications SET recipient_id = ? WHERE id = ?').run(recipient.id, notification.id)
    return notification
  }

  function listForRecipient(recipientName, recipientId) {
    return database.prepare(`
      SELECT notifications.*, tasks.priority AS target_priority
      FROM notifications
      LEFT JOIN tasks ON notifications.target_type = 'task' AND notifications.target_id = tasks.id
      WHERE notifications.recipient_id = ? OR (notifications.recipient_id IS NULL AND notifications.recipient_name = ?
        AND (SELECT count(*) FROM users WHERE name = ?) = 1)
      ORDER BY notifications.created_at DESC, notifications.rowid DESC
    `)
      .all(recipientId ?? null, recipientName, recipientName).map(toNotification)
  }

  function markRead(id, recipientName, recipientId) {
    const result = database.prepare("UPDATE notifications SET status = 'read' WHERE id = ? AND (recipient_id = ? OR (recipient_id IS NULL AND recipient_name = ? AND (SELECT count(*) FROM users WHERE name = ?) = 1))").run(id, recipientId ?? null, recipientName, recipientName)
    return Number(result.changes) > 0
  }

  return { createTaskAssignmentNotifications, createTicketAssignmentNotification, listForRecipient, markRead }
}
