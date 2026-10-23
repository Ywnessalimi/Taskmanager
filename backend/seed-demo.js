import { randomBytes, randomUUID } from "node:crypto"
import { openDatabase } from "./database.js"
import { hashPassword } from "./apps/auth/auth-repository.js"

const initialEmail = "ywenssalimi@gmail.com"
const demoAccounts = [
  { id: "demo-user-sara", name: "سارا احمدی", email: "sara.ahmadi@example.test", avatarUrl: "/avatars/u2.jpg" },
  { id: "demo-user-ali", name: "علی رضایی", email: "ali.rezaei@example.test", avatarUrl: "/avatars/u3.jpg" },
  { id: "demo-user-maryam", name: "مریم کریمی", email: "maryam.karimi@example.test", avatarUrl: "/avatars/u4.jpg" },
  { id: "demo-user-reza", name: "رضا محمدی", email: "reza.mohammadi@example.test", avatarUrl: "/avatars/u5.jpg" },
]

const organizations = [
  {
    id: "demo-org-novinsaz",
    name: "شرکت نوین‌ساز",
    slug: "demo-novinsaz",
    description: "نمونهٔ سازمان برای برنامه‌ریزی محصول و توسعهٔ وب.",
    ownerId: "initial",
    divisions: [
      { id: "demo-div-novinsaz-dev", name: "معاونت توسعه", projects: [
        { id: "demo-proj-novinsaz-web", name: "بازطراحی وب‌سایت", slug: "demo-web-redesign" },
        { id: "demo-proj-novinsaz-analytics", name: "داشبورد تحلیل", slug: "demo-analytics" },
      ] },
      { id: "demo-div-novinsaz-product", name: "معاونت محصول", projects: [
        { id: "demo-proj-novinsaz-mobile", name: "اپلیکیشن موبایل", slug: "demo-mobile-app" },
        { id: "demo-proj-novinsaz-platform", name: "بهبود پلتفرم", slug: "demo-platform" },
      ] },
    ],
  },
  {
    id: "demo-org-blue", name: "تیم طراحی آبی", slug: "demo-blue-team",
    description: "نمونهٔ سازمان برای کارهای بازاریابی و محتوا.", ownerId: "demo-user-sara",
    divisions: [
      { id: "demo-div-blue-marketing", name: "معاونت بازاریابی", projects: [
        { id: "demo-proj-blue-campaign", name: "کمپین پاییز", slug: "demo-autumn-campaign" },
        { id: "demo-proj-blue-brand", name: "هویت بصری محصول", slug: "demo-product-brand" },
      ] },
      { id: "demo-div-blue-content", name: "معاونت محتوا", projects: [
        { id: "demo-proj-blue-content", name: "تقویم محتوایی", slug: "demo-content-calendar" },
        { id: "demo-proj-blue-site", name: "محتوای وب‌سایت", slug: "demo-site-content" },
      ] },
    ],
  },
  {
    id: "demo-org-pardazesh", name: "پردازش‌گستر", slug: "demo-pardazeshgostar",
    description: "نمونهٔ سازمان برای عملیات و توسعهٔ داخلی.", ownerId: "demo-user-ali",
    divisions: [
      { id: "demo-div-pardazesh-ops", name: "معاونت عملیات", projects: [
        { id: "demo-proj-pardazesh-internal", name: "سامانهٔ داخلی", slug: "demo-internal-system" },
        { id: "demo-proj-pardazesh-process", name: "بهبود فرایندها", slug: "demo-process-improvement" },
      ] },
      { id: "demo-div-pardazesh-people", name: "معاونت منابع انسانی", projects: [
        { id: "demo-proj-pardazesh-onboarding", name: "جذب و آموزش", slug: "demo-onboarding" },
        { id: "demo-proj-pardazesh-equipment", name: "تجهیزات تیم", slug: "demo-team-equipment" },
      ] },
    ],
  },
]

const taskTitles = ["بررسی نیازمندی‌ها", "طراحی راه‌حل اولیه", "پیاده‌سازی بخش اصلی"]
const ticketSubjects = ["general", "purchasing", "warehouse", "hr"]
const ticketPermissions = {
  general: ["other"],
  purchasing: ["purchase"],
  warehouse: ["warehouse-release"],
  hr: ["salary-payment"],
}
const statuses = ["todo", "in-progress", "completed"]
const priorities = ["medium", "high", "low", "urgent"]
const database = openDatabase({ path: "data/quire-live.sqlite", seed: false })

try {
  const initialUser = database.prepare("SELECT id, name, email, avatar_url FROM users WHERE email = ? COLLATE NOCASE").get(initialEmail)
  if (!initialUser) throw new Error(`Initial account ${initialEmail} must exist before demo data is added.`)
  if (database.prepare("SELECT 1 FROM users WHERE id = ?").get(demoAccounts[0].id)
    || database.prepare("SELECT 1 FROM organizations WHERE id = ?").get(organizations[0].id)) {
    console.log("The demo dataset is already present; no rows were changed.")
    process.exitCode = 0
  } else {
    const credentials = demoAccounts.map((account) => ({ ...account, password: randomBytes(18).toString("base64url") }))
    const users = [
      { id: initialUser.id, name: initialUser.name, email: initialUser.email, avatarUrl: initialUser.avatar_url ?? "/avatars/u1.jpg" },
      ...credentials,
    ]
    const allProjects = organizations.flatMap((organization) => organization.divisions.flatMap((division) =>
      division.projects.map((project) => ({ ...project, organization, division })),
    ))
    const now = new Date().toISOString()

    database.exec("BEGIN IMMEDIATE")
    try {
      const insertUser = database.prepare("INSERT INTO users (id, name, email, password_hash, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      for (const account of credentials) {
        insertUser.run(account.id, account.name, account.email, hashPassword(account.password), account.avatarUrl, now)
      }

      const insertOrganization = database.prepare(`
        INSERT INTO organizations (id, name, owner_user_id, created_at, slug, description, preferences_json)
        VALUES (?, ?, ?, ?, ?, ?, '{}')
      `)
      const insertMember = database.prepare(`
        INSERT INTO organization_members (id, organization_id, user_id, role, permissions, created_at)
        VALUES (?, ?, ?, ?, '{}', ?)
      `)
      const insertDivision = database.prepare("INSERT INTO divisions (id, organization_id, name, created_at) VALUES (?, ?, ?, ?)")
      const insertProject = database.prepare(`
        INSERT INTO projects (id, name, organization_id, organization_name, division_id, division_name, start_date, end_date, description, slug)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      for (const organization of organizations) {
        const ownerId = organization.ownerId === "initial" ? initialUser.id : organization.ownerId
        insertOrganization.run(organization.id, organization.name, ownerId, now, organization.slug, organization.description)
        for (const user of users) {
          const role = user.id === ownerId ? "owner" : user.id === initialUser.id ? "admin" : "custom"
          insertMember.run(randomUUID(), organization.id, user.id, role, now)
        }
        for (const division of organization.divisions) {
          insertDivision.run(division.id, organization.id, division.name, now)
          for (const project of division.projects) {
            insertProject.run(
              project.id,
              project.name,
              organization.id,
              organization.name,
              division.id,
              division.name,
              "1405/08/01",
              "1405/10/30",
              `برنامه‌ریزی و پیگیری کارهای پروژهٔ ${project.name}.`,
              project.slug,
            )
          }
        }
      }

      const insertTask = database.prepare(`
        INSERT INTO tasks (
          id, display_id, project_id, title, assignee_names, priority, status, start_date, due_date,
          repeat, recurrence, tags, description, subtasks, followers, is_favorite,
          time_spent_minutes, activity_log, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, '[]', ?, 0, ?, '[]', ?, ?)
      `)
      const nextDisplayId = database.prepare("UPDATE task_display_sequence SET last_value = last_value + 1 WHERE id = 1 RETURNING last_value")
      for (let projectIndex = 0; projectIndex < allProjects.length; projectIndex += 1) {
        const project = allProjects[projectIndex]
        for (let taskIndex = 0; taskIndex < taskTitles.length; taskIndex += 1) {
          const assignee = users[(projectIndex + taskIndex + 1) % users.length]
          const follower = users[(projectIndex + taskIndex + 2) % users.length]
          const sequence = nextDisplayId.get().last_value
          insertTask.run(
            randomUUID(), `#${sequence}`, project.id, `${project.name}: ${taskTitles[taskIndex]}`,
            JSON.stringify([assignee.name]), priorities[(projectIndex + taskIndex) % priorities.length],
            statuses[taskIndex], "1405/08/02", `1405/08/${String(8 + taskIndex).padStart(2, "0")}`,
            JSON.stringify([project.division.name]), `مسئول پیگیری: ${assignee.name}`,
            JSON.stringify([follower.name]), 15 * (taskIndex + 1), now, now,
          )
        }
      }

      const insertTicket = database.prepare("INSERT INTO tickets (id, title, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
      const insertTicketActivity = database.prepare(`
        INSERT INTO ticket_activity (id, ticket_id, actor_id, actor_name, actor_avatar_url, kind, details, created_at)
        VALUES (?, ?, ?, ?, ?, 'created', ?, ?)
      `)
      for (let projectIndex = 0; projectIndex < allProjects.length; projectIndex += 1) {
        const project = allProjects[projectIndex]
        for (let ticketIndex = 0; ticketIndex < 2; ticketIndex += 1) {
          const creator = users[(projectIndex + ticketIndex + 1) % users.length]
          const assignee = users[(projectIndex + ticketIndex + 2) % users.length]
          const subject = ticketSubjects[(projectIndex + ticketIndex) % ticketSubjects.length]
          const title = ticketIndex === 0 ? `درخواست خرید برای ${project.name}` : `پیگیری دسترسی پروژهٔ ${project.name}`
          const ticketId = `${project.id}-ticket-${ticketIndex + 1}`
          const ticket = {
            projectId: project.id,
            createdById: creator.id,
            createdByName: creator.name,
            createdByAvatarUrl: creator.avatarUrl,
            assigneeId: assignee.id,
            assigneeName: assignee.name,
            assigneeAvatarUrl: assignee.avatarUrl,
            title,
            subject,
            status: statuses[(projectIndex + ticketIndex) % statuses.length],
            permissionIds: ticketPermissions[subject],
            priority: priorities[(projectIndex + ticketIndex) % priorities.length],
            description: `درخواست نمونه برای پروژهٔ ${project.name}.`,
            followers: [],
            favorites: [],
          }
          insertTicket.run(ticketId, title, JSON.stringify(ticket), now, now)
          insertTicketActivity.run(randomUUID(), ticketId, creator.id, creator.name, creator.avatarUrl, JSON.stringify({ title }), now)
        }
      }

      database.exec("COMMIT")
    } catch (error) {
      database.exec("ROLLBACK")
      throw error
    }

    console.log("Demo accounts (generated one-time passwords):")
    for (const { name, email, password } of credentials) console.log(`${name} | ${email} | ${password}`)
    console.log(`Created ${organizations.length} organizations, ${organizations.reduce((sum, item) => sum + item.divisions.length, 0)} divisions, ${allProjects.length} projects, ${allProjects.length * taskTitles.length} tasks, and ${allProjects.length * 2} tickets.`)
  }
} finally {
  database.close()
}
