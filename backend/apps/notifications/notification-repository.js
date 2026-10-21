import { randomUUID } from "node:crypto"

function toNotification(row) {
  return {
    id: row.id,
    verb: row.verb,
    actorId: row.actor_id,
    actorName: row.actor_name,
    target: { type: row.target_type, id: row.target_id, label: row.target_label, projectId: row.project_id },
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
    const recipients = [...new Set(task.assigneeNames.map((name) => name.trim()).filter(Boolean))]
    const project = database.prepare("SELECT name FROM projects WHERE id = ?").get(task.projectId)
    const now = new Date().toISOString()
    const notifications = recipients.map((recipientName) => ({
      id: randomUUID(), recipientName, actorId: actor.id, actorName: actor.name,
      verb: "taskAssigned", target: { type: "task", id: task.id, label: task.title, projectId: task.projectId },
      status: "unread", requiresApproval: false, createdAt: now,
    }))
    for (const notification of notifications) {
      insert.run(notification.id, notification.recipientName, notification.actorId, notification.actorName,
        notification.target.id, notification.target.label, notification.target.projectId, now)
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
    return notification
  }

  function listForRecipient(recipientName) {
    return database.prepare("SELECT * FROM notifications WHERE recipient_name = ? ORDER BY created_at DESC, rowid DESC")
      .all(recipientName).map(toNotification)
  }

  function markRead(id, recipientName) {
    const result = database.prepare("UPDATE notifications SET status = 'read' WHERE id = ? AND recipient_name = ?").run(id, recipientName)
    return Number(result.changes) > 0
  }

  return { createTaskAssignmentNotifications, createTicketAssignmentNotification, listForRecipient, markRead }
}
