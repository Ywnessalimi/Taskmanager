import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { openDatabase } from "../database.js"
import { createTaskRepository } from "../task-repository.js"

test("task CRUD persists through SQLite and preserves the API shape", () => {
  const repository = createTaskRepository(openDatabase({ path: ":memory:" }))
  try {
    assert.equal(repository.listProjects().length, 3)
    const created = repository.createTask({
      projectId: "proj-1",
      title: "تسک آزمایشی",
      assigneeNames: ["سارا احمدی"],
      priority: "medium",
      status: "todo",
      tags: ["backend"],
      subtasks: [{ id: "child-1", title: "زیرتسک" }],
    })
    assert.match(created.id, /^[0-9a-f-]{36}$/i)
    assert.equal(created.displayId, "#503")
    assert.equal(repository.getTask(created.id).title, "تسک آزمایشی")
    assert.equal(created.subtasks[0].displayId, "#503-1")
    assert.ok(created.subtasks[0].id)
    assert.equal(repository.listTasks({ projectId: "proj-1" }).some((task) => task.id === created.id), true)
    assert.equal(repository.listTasks({ assigneeName: "سارا احمدی" }).some((task) => task.id === created.id), true)

    const updated = repository.updateTask(created.id, { title: "عنوان ویرایش‌شده", status: "in-progress", isFavorite: true })
    assert.equal(updated.title, "عنوان ویرایش‌شده")
    assert.equal(updated.status, "in-progress")
    assert.equal(updated.isFavorite, true)
    assert.equal(updated.tags[0], "backend")

    assert.equal(repository.deleteTask(created.id), true)
    assert.equal(repository.getTask(created.id), undefined)
    assert.equal(repository.deleteTask(created.id), false)
    assert.equal(repository.createTask({ projectId: "proj-1", title: "تسک بعدی" }).displayId, "#504")
  } finally {
    repository.close()
  }
})

test("migration and seed run once for a persistent database", () => {
  const directory = mkdtempSync(join(tmpdir(), "quire-backend-"))
  const path = join(directory, "quire.sqlite")
  try {
    openDatabase({ path, seed: true }).close()
    const database = openDatabase({ path, seed: true })
    assert.equal(database.prepare("SELECT count(*) AS count FROM tasks").get().count, 6)
    assert.equal(database.prepare("SELECT count(*) AS count FROM schema_migrations").get().count, 2)
    database.close()
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
