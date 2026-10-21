import { randomUUID } from "node:crypto"

function mapPage(row) {
  return row && { id: row.id, projectId: row.project_id, kind: row.kind, title: row.title, content: row.content, updatedAt: row.updated_at }
}

function mapMessage(row) {
  return { id: row.id, projectId: row.project_id, authorName: row.author_name, text: row.body, createdAt: row.created_at }
}

export function createProjectPageRepository(database) {
  const findProject = database.prepare("SELECT id FROM projects WHERE id = ?")
  const listPages = database.prepare("SELECT * FROM project_pages WHERE project_id = ? ORDER BY kind")
  const findPage = database.prepare("SELECT * FROM project_pages WHERE project_id = ? AND kind = ?")
  const savePage = database.prepare(`INSERT INTO project_pages (id, project_id, kind, title, content, updated_at)
    VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(project_id, kind) DO UPDATE SET title = excluded.title, content = excluded.content, updated_at = excluded.updated_at`)
  const listMessages = database.prepare("SELECT * FROM project_chat_messages WHERE project_id = ? ORDER BY created_at, id")
  const insertMessage = database.prepare("INSERT INTO project_chat_messages (id, project_id, author_name, body, created_at) VALUES (?, ?, ?, ?, ?)")

  return {
    hasProject: (projectId) => Boolean(findProject.get(projectId)),
    listPages: (projectId) => listPages.all(projectId).map(mapPage),
    getPage: (projectId, kind) => mapPage(findPage.get(projectId, kind)),
    savePage(projectId, kind, title, content) {
      const now = new Date().toISOString()
      const id = `${projectId}:${kind}`
      savePage.run(id, projectId, kind, title, content, now)
      return mapPage(findPage.get(projectId, kind))
    },
    listMessages: (projectId) => listMessages.all(projectId).map(mapMessage),
    createMessage(projectId, authorName, text) {
      const message = { id: randomUUID(), projectId, authorName, text, createdAt: new Date().toISOString() }
      insertMessage.run(message.id, projectId, authorName, text, message.createdAt)
      return message
    },
  }
}
