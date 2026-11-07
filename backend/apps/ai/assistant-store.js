import { randomUUID } from 'node:crypto'
import { DomainError, transaction } from '../tasks/task-service.js'

export function createAssistantStore(database) {
  function preview(userId, id) {
    const row = database.prepare('SELECT * FROM assistant_previews WHERE id = ? AND user_id = ?').get(id, userId)
    if (!row) throw new DomainError(404, 'preview_not_found', 'پیش‌نمایش پیدا نشد.')
    return { ...row, payload: JSON.parse(row.payload), result: row.result ? JSON.parse(row.result) : undefined }
  }
  function audit(userId, source, action, details) {
    database.prepare('INSERT INTO assistant_audit VALUES (?, ?, ?, ?, ?, ?)').run(randomUUID(), userId, source, action, JSON.stringify(details), new Date().toISOString())
  }
  return {
    audit,
    prepare(userId, kind, items, summary = '') {
      const id = randomUUID()
      const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString()
      const payload = { items: items.map(item => ({ ...item, key: randomUUID() })), summary }
      database.prepare('DELETE FROM assistant_previews WHERE state = ? AND expires_at < ?').run('pending', new Date(Date.now() - 86400_000).toISOString())
      database.prepare('INSERT INTO assistant_previews (id, user_id, kind, payload, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, userId, kind, JSON.stringify(payload), new Date().toISOString(), expiresAt)
      return { type: 'preview', id, kind, expiresAt, ...payload }
    },
    confirm(user, id, selectedKeys, execute) {
      return transaction(database, () => {
        const row = preview(user.id, id)
        if (!Array.isArray(selectedKeys) || !selectedKeys.length || selectedKeys.length > 30 || selectedKeys.some(key => typeof key !== 'string')) throw new DomainError(400, 'invalid_selection', 'حداقل یک کارت را انتخاب کنید.')
        const selection = [...new Set(selectedKeys)].sort()
        if (row.state === 'confirmed') {
          if (JSON.stringify(selection) !== row.selection) throw new DomainError(409, 'selection_changed', 'این پیش‌نمایش با مجموعهٔ دیگری ثبت شده است.')
          return row.result
        }
        if (row.state !== 'pending' || row.expires_at <= new Date().toISOString()) throw new DomainError(409, 'preview_expired', 'پیش‌نمایش منقضی یا لغو شده است. درخواست را دوباره مطرح کنید.')
        if (selection.some(key => !row.payload.items.some(item => item.key === key))) throw new DomainError(400, 'invalid_selection', 'کارت انتخاب‌شده متعلق به این پیش‌نمایش نیست.')
        const items = row.payload.items.filter(item => selection.includes(item.key))
        const result = execute(row.kind, items)
        database.prepare("UPDATE assistant_previews SET state = 'confirmed', selection = ?, result = ? WHERE id = ?").run(JSON.stringify(selection), JSON.stringify(result), id)
        audit(user.id, 'assistant', row.kind, { previewId: id, count: items.length, ids: result.items.map(item => item.id) })
        return result
      })
    },
    cancel(userId, id) {
      const row = preview(userId, id)
      if (row.state === 'confirmed') throw new DomainError(409, 'already_confirmed', 'این پیش‌نمایش قبلاً ثبت شده است.')
      database.prepare("UPDATE assistant_previews SET state = 'cancelled' WHERE id = ?").run(id)
    },
    saveReport(userId, payload) {
      const report = { ...payload, id: randomUUID(), generatedAt: new Date().toISOString() }
      database.prepare('DELETE FROM assistant_reports WHERE expires_at <= ?').run(new Date().toISOString())
      database.prepare('INSERT INTO assistant_reports VALUES (?, ?, ?, ?, ?)').run(report.id, userId, JSON.stringify(report), report.generatedAt, new Date(Date.now() + 86400_000).toISOString())
      return report
    },
    getReport(userId, id) {
      const row = database.prepare('SELECT payload FROM assistant_reports WHERE id = ? AND user_id = ? AND expires_at > ?').get(id, userId, new Date().toISOString())
      if (!row) throw new DomainError(404, 'report_not_found', 'گزارش پیدا نشد یا منقضی شده است.')
      return JSON.parse(row.payload)
    },
  }
}
