import test from 'node:test'
import assert from 'node:assert/strict'
import { projectStatusHistory } from '../apps/organizations/project-status-history.js'

test('reconstructs daily status using actual changes and creation dates', () => {
  const tasks = [
    { id: 'a', status: 'completed', createdAt: '2026-11-08T10:00:00.000Z' },
    { id: 'b', status: 'todo', createdAt: '2026-11-10T10:00:00.000Z' },
  ]
  const changes = [
    { taskId: 'a', from: 'in-progress', createdAt: '2026-11-10T08:00:00.000Z', cursor: 2 },
    { taskId: 'a', from: 'todo', createdAt: '2026-11-09T09:00:00.000Z', cursor: 1 },
  ]
  const result = projectStatusHistory(tasks, changes, new Date('2026-11-10T20:00:00Z'), 3)
  assert.deepEqual(result.days, [
    { day: '2026-11-08', todo: 1, inProgress: 0, completed: 0 },
    { day: '2026-11-09', todo: 0, inProgress: 1, completed: 0 },
    { day: '2026-11-10', todo: 1, inProgress: 0, completed: 1 },
  ])
  assert.equal(result.timeZone, 'UTC')
})

test('uses event ordering within a timestamp and ignores invalid transitions', () => {
  const tasks = [{ id: 'a', status: 'completed', createdAt: '2026-11-08T00:00:00Z' }]
  const changes = [
    { taskId: 'a', from: 'todo', createdAt: '2026-11-10T08:00:00.000Z', cursor: 1 },
    { taskId: 'a', from: 'in-progress', createdAt: '2026-11-10T08:00:00.000Z', cursor: 2 },
    { taskId: 'a', from: 'invalid', createdAt: '2026-11-10T07:00:00.000Z', cursor: 3 },
  ]
  const result = projectStatusHistory(tasks, changes, new Date('2026-11-10T20:00:00Z'), 2)
  assert.equal(result.days[0].todo, 1)
  assert.equal(result.days[1].completed, 1)
})
