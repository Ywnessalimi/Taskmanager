import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { openDatabase } from '../database.js'
import { createOrganizationRepository } from '../apps/organizations/organization-repository.js'

test('migration preserves existing organization members project access', t => {
  const directory = mkdtempSync(join(tmpdir(), 'quire-project-members-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const path = join(directory, 'test.sqlite')
  const db = openDatabase({ path })
  const now = new Date().toISOString()
  db.prepare('INSERT INTO users (id,name,email,password_hash,created_at) VALUES (?,?,?,?,?)').run('migration-user', 'Migration user', 'migration@test.invalid', 'unused', now)
  db.prepare("INSERT INTO organization_members (id,organization_id,user_id,role,permissions,created_at) VALUES ('migration-member','org-1','migration-user','custom','{}',?)").run(now)
  db.exec("DROP TRIGGER projects_validate_project_members; DROP TABLE project_members; DELETE FROM schema_migrations WHERE version = '015_project_members'")
  db.close()
  const migrated = openDatabase({ path })
  try {
    const repo = createOrganizationRepository(migrated)
    assert.equal(repo.canAccessProject('migration-user', 'proj-1'), true)
    assert.equal(repo.canAccessProject('migration-user', 'proj-2'), true)
  } finally { migrated.close() }
})
