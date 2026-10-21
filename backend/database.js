import { readFileSync, readdirSync, mkdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { DatabaseSync } from "node:sqlite"
import { seedProjects, seedTasks } from "./seed-data.js"

const backendDirectory = dirname(fileURLToPath(import.meta.url))
const migrationsDirectory = join(backendDirectory, "migrations")

function applyMigrations(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `)

  const applied = new Set(database.prepare("SELECT version FROM schema_migrations").all().map((row) => row.version))
  const files = readdirSync(migrationsDirectory).filter((file) => file.endsWith(".sql")).sort()

  for (const file of files) {
    const version = file.slice(0, -".sql".length)
    if (applied.has(version)) continue

    database.exec("BEGIN IMMEDIATE")
    try {
      database.exec(readFileSync(join(migrationsDirectory, file), "utf8"))
      database.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(version, new Date().toISOString())
      database.exec("COMMIT")
    } catch (error) {
      database.exec("ROLLBACK")
      throw error
    }
  }
}

function seedDatabase(database) {
  const projectCount = database.prepare("SELECT count(*) AS count FROM projects").get().count
  if (projectCount > 0) return

  const insertProject = database.prepare(`
    INSERT INTO projects (id, name, organization_id, organization_name, division_id, division_name, start_date, end_date, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertOrganization = database.prepare("INSERT OR IGNORE INTO organizations (id, name, owner_user_id, created_at) VALUES (?, ?, NULL, ?)")
  const insertDivision = database.prepare("INSERT OR IGNORE INTO divisions (id, organization_id, name, created_at) VALUES (?, ?, ?, ?)")
  const insertTask = database.prepare(`
    INSERT INTO tasks (
      id, display_id, project_id, title, assignee_names, priority, status, start_date, due_date,
      repeat, recurrence, tags, description, subtasks, followers, is_favorite,
      time_spent_minutes, activity_log, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  database.exec("BEGIN IMMEDIATE")
  try {
    const now = new Date().toISOString()
    for (const project of seedProjects) {
      insertOrganization.run(project.organizationId, project.organizationName, now)
      insertDivision.run(project.divisionId, project.organizationId, project.divisionName, now)
    }
    for (const project of seedProjects) {
      insertProject.run(
        project.id,
        project.name,
        project.organizationId,
        project.organizationName,
        project.divisionId,
        project.divisionName,
        project.startDate ?? null,
        project.endDate ?? null,
        project.description ?? null,
      )
    }

    for (const task of seedTasks) {
      insertTask.run(
        task.id,
        task.displayId,
        task.projectId,
        task.title,
        JSON.stringify(task.assigneeNames ?? []),
        task.priority ?? "none",
        task.status ?? "todo",
        task.startDate ?? null,
        task.dueDate ?? null,
        task.repeat ?? null,
        task.recurrence ? JSON.stringify(task.recurrence) : null,
        JSON.stringify(task.tags ?? []),
        task.description ?? null,
        JSON.stringify(task.subtasks ?? []),
        JSON.stringify(task.followers ?? []),
        task.isFavorite ? 1 : 0,
        task.timeSpentMinutes ?? 0,
        JSON.stringify(task.activityLog ?? []),
        now,
        now,
      )
    }
    database.prepare(`
      UPDATE task_display_sequence
      SET last_value = max(last_value, (SELECT COALESCE(max(CAST(substr(display_id, 2) AS INTEGER)), last_value) FROM tasks))
      WHERE id = 1
    `).run()
    database.exec("COMMIT")
  } catch (error) {
    database.exec("ROLLBACK")
    throw error
  }
}

export function openDatabase({ path = process.env.DATABASE_PATH ?? "data/quire-live.sqlite", seed = true } = {}) {
  const databasePath = path === ":memory:" ? path : resolve(backendDirectory, path)
  if (databasePath !== ":memory:") mkdirSync(dirname(databasePath), { recursive: true })

  const database = new DatabaseSync(databasePath, { timeout: 5000 })
  database.exec("PRAGMA foreign_keys = ON")
  if (databasePath !== ":memory:") database.exec("PRAGMA journal_mode = WAL")
  applyMigrations(database)
  if (seed) seedDatabase(database)
  return database
}
