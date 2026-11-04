import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { openDatabase } from './database.js'
import { hashPassword } from './apps/auth/auth-repository.js'

const accounts = JSON.parse(readFileSync(process.argv[2] === '-' ? 0 : process.argv[2], 'utf8'))
if (!Array.isArray(accounts) || accounts.length !== 10) throw new Error('Expected ten demo accounts')
const db = openDatabase({ seed: false })
const now = new Date().toISOString()
const orgId = 'team-demo-org'
const orgName = 'Novin Team'
const divisions = [{ id: 'team-demo-product', name: 'Product' }, { id: 'team-demo-operations', name: 'Operations' }]
const projects = [
  { id: 'team-demo-web', name: 'Website Redesign', slug: 'website-redesign', division: 0 },
  { id: 'team-demo-app', name: 'Customer App', slug: 'customer-app', division: 0 },
  { id: 'team-demo-support', name: 'Customer Support', slug: 'customer-support', division: 1 },
  { id: 'team-demo-launch', name: 'Product Launch', slug: 'product-launch', division: 1 },
]
const tasks = ['Define project scope', 'Review requirements', 'Prepare initial design', 'Implement core workflow', 'Review customer feedback', 'Improve accessibility', 'Test key scenarios', 'Resolve open issues', 'Prepare launch checklist', 'Document next steps']
const ticketTitles = ['Review customer request', 'Investigate reported issue', 'Confirm delivery timeline', 'Update project documentation', 'Review design feedback', 'Check access permissions', 'Follow up on pending work', 'Validate acceptance criteria', 'Coordinate with the team', 'Prepare progress report']
const statuses = ['todo', 'in-progress', 'completed']
const priorities = ['medium', 'high', 'low', 'urgent']
try {
  const admin = db.prepare('SELECT id,name,avatar_url FROM users WHERE email = ?').get('admin@quire.local')
  if (!admin) throw new Error('Existing initial admin account not found')
  if (db.prepare('SELECT 1 FROM organizations WHERE id = ? OR slug = ?').get(orgId, 'novin-team')) throw new Error('Demo organization already exists; no changes made')
  for (const account of accounts) if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(account.email)) throw new Error(`Email already exists: ${account.email}`)
  db.exec('BEGIN IMMEDIATE')
  try {
    const userStmt = db.prepare('INSERT INTO users (id,name,email,password_hash,avatar_url,created_at) VALUES (?,?,?,?,?,?)')
    for (const account of accounts) {
      account.id = `team-demo-${account.name.toLowerCase()}`
      account.avatar = `/avatars/team/${account.name.toLowerCase()}.webp`
      userStmt.run(account.id, account.name, account.email, hashPassword(account.password), account.avatar, now)
    }
    db.prepare('INSERT INTO organizations (id,name,owner_user_id,created_at,slug,description,preferences_json) VALUES (?,?,?,?,?,?,?)').run(orgId, orgName, admin.id, now, 'novin-team', 'A shared workspace for product delivery and customer operations.', '{}')
    const member = db.prepare('INSERT INTO organization_members (id,organization_id,user_id,role,permissions,created_at) VALUES (?,?,?,?,?,?)')
    member.run(randomUUID(), orgId, admin.id, 'owner', '{}', now)
    for (const account of accounts) member.run(randomUUID(), orgId, account.id, 'custom', '{}', now)
    const divisionStmt = db.prepare('INSERT INTO divisions (id,organization_id,name,created_at) VALUES (?,?,?,?)')
    for (const division of divisions) divisionStmt.run(division.id, orgId, division.name, now)
    const projectStmt = db.prepare('INSERT INTO projects (id,name,organization_id,organization_name,division_id,division_name,start_date,end_date,description,slug) VALUES (?,?,?,?,?,?,?,?,?,?)')
    for (const project of projects) projectStmt.run(project.id, project.name, orgId, orgName, divisions[project.division].id, divisions[project.division].name, '1405/07/01', '1405/10/30', 'Ongoing work with completed milestones and active follow-ups.', project.slug)
    const taskStmt = db.prepare("INSERT INTO tasks (id,display_id,project_id,title,assignee_names,priority,status,start_date,due_date,tags,description,subtasks,followers,is_favorite,time_spent_minutes,activity_log,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,'[]','[]',0,?,'[]',?,?)")
    const sequence = db.prepare('UPDATE task_display_sequence SET last_value = last_value + 1 WHERE id = 1 RETURNING last_value')
    const taskRecords = []
    for (const [pi, project] of projects.entries()) for (const [i, title] of tasks.entries()) {
      const user = accounts[(pi * 3 + i) % accounts.length]
      const task = { id: randomUUID(), title, projectId: project.id, user, priority: priorities[(pi + i) % priorities.length] }
      taskStmt.run(task.id, `#${sequence.get().last_value}`, project.id, title, JSON.stringify([user.name]), task.priority, statuses[(pi + i) % statuses.length], '1405/07/10', `1405/08/${String(5 + i * 2).padStart(2, '0')}`, JSON.stringify([divisions[project.division].name]), `Work is underway. ${user.name} is coordinating the next step.`, 15 * (i % 5), now, now)
      taskRecords.push(task)
    }
    const notificationStmt = db.prepare('INSERT INTO notifications (id,recipient_name,actor_id,actor_name,verb,target_type,target_id,target_label,project_id,status,created_at) VALUES (?,?,?,?,\'taskAssigned\',\'task\',?,?,?, ?,?)')
    for (const [userIndex, user] of accounts.entries()) {
      const assignedTasks = taskRecords.filter((task) => task.user.id === user.id).slice(0, 3)
      for (const [index, task] of assignedTasks.entries()) {
        const actor = accounts[(userIndex + index + 1) % accounts.length]
        const createdAt = new Date(Date.now() - (index + 1) * 3_600_000).toISOString()
        notificationStmt.run(randomUUID(), user.name, actor.id, actor.name, task.id, task.title, task.projectId, index < 2 ? 'unread' : 'read', createdAt)
      }
    }
    const ticketStmt = db.prepare('INSERT INTO tickets (id,title,data,created_at,updated_at) VALUES (?,?,?,?,?)')
    const activityStmt = db.prepare("INSERT INTO ticket_activity (id,ticket_id,actor_id,actor_name,actor_avatar_url,kind,details,created_at) VALUES (?,?,?,?,?,'created',?,?)")
    for (const [ui, user] of accounts.entries()) for (const [i, title] of ticketTitles.entries()) {
      const project = projects[(ui + i) % projects.length]
      const creator = accounts[(ui + i + 1) % accounts.length]
      const id = randomUUID()
      const ticket = { projectId: project.id, createdById: creator.id, createdByName: creator.name, createdByAvatarUrl: creator.avatar, assigneeId: user.id, assigneeName: user.name, assigneeAvatarUrl: user.avatar, title, subject: ['general','hr','purchasing','warehouse'][i % 4], status: statuses[(ui+i) % 3], permissionIds: [], priority: priorities[(ui+i) % 4], description: `Follow up on ${title.toLowerCase()} for ${project.name}.`, followers: [], favorites: [] }
      ticketStmt.run(id, title, JSON.stringify(ticket), now, now)
      activityStmt.run(randomUUID(), id, creator.id, creator.name, creator.avatar, JSON.stringify({ title }), now)
    }
    db.exec('COMMIT')
    console.log('Created 10 users, 1 organization, 2 divisions, 4 projects, 40 tasks, 100 tickets and sample task notifications.')
  } catch (error) { db.exec('ROLLBACK'); throw error }
} finally { db.close() }
