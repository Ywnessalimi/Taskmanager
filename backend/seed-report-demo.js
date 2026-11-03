import { randomUUID } from "node:crypto"
import { openDatabase } from "./database.js"

const database = openDatabase({ seed: false })

const taskTitles = [
  "بازبینی مسیر ورود کاربران", "نهایی‌کردن متن‌های صفحهٔ محصول", "آماده‌سازی نسخهٔ آزمایشی",
  "بررسی درخواست‌های پشتیبانی", "به‌روزرسانی راهنمای خرید", "رفع خطای نمایش گزارش",
  "هماهنگی جلسهٔ بازبینی", "بررسی کیفیت داده‌های فروش", "آماده‌سازی فایل‌های طراحی",
  "تکمیل سناریوهای آزمون", "بازبینی دسترسی اعضای تیم", "ثبت نتیجهٔ بررسی مشتری",
  "هماهنگی انتشار نسخه", "بهبود سرعت صفحهٔ پروژه", "پاک‌سازی فهرست درخواست‌ها",
  "آماده‌سازی جمع‌بندی هفتگی", "بررسی تجربهٔ کار با موبایل", "تکمیل گزارش پیشرفت",
  "مرور کارهای باقی‌مانده", "هماهنگی تحویل به تیم پشتیبانی", "ثبت برنامهٔ هفتهٔ آینده",
  "آماده‌سازی بستهٔ انتشار", "مرور بازخوردهای نسخهٔ تازه", "بررسی درخواست‌های ثبت‌شده",
  "تنظیم گزارش عملکرد ماهانه", "به‌روزرسانی نقشهٔ مسیر محصول", "تکمیل مستندات تحویل",
]
const statusIds = ["todo", "in-progress", "completed"]
const priorities = ["high", "medium", "low", "urgent", "medium", "high", "low"]
const ticketTitles = [
  "درخواست دسترسی به گزارش فروش", "پیگیری خرید تجهیزات تیم", "مشکل ورود به فضای پروژه",
  "درخواست بازبینی قرارداد", "افزودن عضو جدید به پروژه", "گزارش خطای صفحهٔ پرداخت",
  "درخواست راهنمای استفاده از سامانه", "پیگیری تحویل سفارش", "اصلاح اطلاعات مشتری",
  "درخواست دسترسی به فایل طراحی", "بررسی مشکل اعلان‌ها", "هماهنگی برای جلسهٔ معرفی",
  "درخواست اصلاح دسترسی گزارش", "پیگیری زمان تحویل تجهیزات", "گزارش مشکل همگام‌سازی",
]
const subjects = ["general", "purchasing", "warehouse", "hr"]
const permissionsBySubject = {
  general: ["other"],
  purchasing: ["purchase"],
  warehouse: ["warehouse-release"],
  hr: ["salary-payment"],
}

try {
  if (database.prepare("SELECT 1 FROM tasks WHERE id LIKE 'report-demo-task-%' LIMIT 1").get()) {
    console.log("The report demo records are already present; no rows were changed.")
  } else {
    const user = database.prepare("SELECT id, name, avatar_url FROM users ORDER BY created_at, rowid LIMIT 1").get()
    const projects = database.prepare("SELECT id, name, division_name FROM projects ORDER BY rowid").all()
    if (!user || projects.length === 0) throw new Error("Seed the local demo organization before adding report data.")

    const taskCounts = new Map(database.prepare("SELECT status, count(*) AS count FROM tasks GROUP BY status").all().map(row => [row.status, row.count]))
    const ticketCounts = new Map(database.prepare("SELECT json_extract(data, '$.status') AS status, count(*) AS count FROM tickets GROUP BY status").all().map(row => [row.status, row.count]))
    const tasksToAdd = []
    const ticketsToAdd = []
    for (const status of statusIds) {
      const taskCount = taskCounts.get(status) ?? 0
      const ticketCount = ticketCounts.get(status) ?? 0
      if (taskCount > 12 || ticketCount > 6) throw new Error("The local dataset already exceeds the report totals; use a clean demo database.")
      for (let number = taskCount + 1; number <= 12; number += 1) tasksToAdd.push({ status, number })
      for (let number = ticketCount + 1; number <= 6; number += 1) ticketsToAdd.push({ status, number })
    }
    if (tasksToAdd.length > taskTitles.length || ticketsToAdd.length > ticketTitles.length) throw new Error("Add more Persian labels before seeding this report dataset.")

    const now = new Date().toISOString()
    const insertTask = database.prepare(`
      INSERT INTO tasks (
        id, display_id, project_id, title, assignee_names, priority, status, start_date, due_date,
        repeat, recurrence, tags, description, subtasks, followers, is_favorite,
        time_spent_minutes, activity_log, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, '[]', ?, 0, ?, '[]', ?, ?)
    `)
    const nextDisplayId = database.prepare("UPDATE task_display_sequence SET last_value = last_value + 1 WHERE id = 1 RETURNING last_value")
    const insertNotification = database.prepare(`
      INSERT INTO notifications (
        id, recipient_name, actor_id, actor_name, verb, target_type, target_id,
        target_label, project_id, status, created_at
      ) VALUES (?, ?, ?, ?, 'taskAssigned', 'task', ?, ?, ?, 'unread', ?)
    `)
    const insertTicket = database.prepare("INSERT INTO tickets (id, title, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
    const insertTicketActivity = database.prepare(`
      INSERT INTO ticket_activity (id, ticket_id, actor_id, actor_name, actor_avatar_url, kind, details, created_at)
      VALUES (?, ?, ?, ?, ?, 'created', ?, ?)
    `)

    database.exec("BEGIN IMMEDIATE")
    try {
      tasksToAdd.forEach(({ status, number }, index) => {
        const taskLabel = taskTitles[index]
        const project = projects[index % projects.length]
        const taskId = `report-demo-task-${status}-${String(number).padStart(2, "0")}`
        const taskTitle = `${project.name}: ${taskLabel}`
        const displayId = `#${nextDisplayId.get().last_value}`
        insertTask.run(
          taskId,
          displayId,
          project.id,
          taskTitle,
          JSON.stringify([user.name]),
          priorities[index % priorities.length],
          status,
          "1405/08/05",
          `1405/08/${String(12 + (index % 15)).padStart(2, "0")}`,
          JSON.stringify([project.division_name]),
          `مسئول پیگیری: ${user.name}. مورد ${index + 1} از مجموعهٔ گزارش نمونه.`,
          JSON.stringify([user.name]),
          index * 20,
          now,
          now,
        )
        insertNotification.run(randomUUID(), user.name, user.id, user.name, taskId, taskTitle, project.id, now)
      })

      ticketsToAdd.forEach(({ status, number }, index) => {
        const title = ticketTitles[index]
        const project = projects[index % projects.length]
        const subject = subjects[index % subjects.length]
        const assignee = index % 2 === 0 ? user : database.prepare("SELECT id, name, avatar_url FROM users WHERE id <> ? ORDER BY rowid LIMIT 1").get(user.id)
        const ticketId = `report-demo-ticket-${status}-${String(number).padStart(2, "0")}`
        const ticket = {
          projectId: project.id,
          createdById: user.id,
          createdByName: user.name,
          createdByAvatarUrl: user.avatar_url,
          assigneeId: assignee?.id ?? user.id,
          assigneeName: assignee?.name ?? user.name,
          assigneeAvatarUrl: assignee?.avatar_url ?? user.avatar_url,
          title,
          subject,
          status,
          permissionIds: permissionsBySubject[subject],
          priority: priorities[(index + 2) % priorities.length],
          description: `شرح درخواست برای پروژهٔ ${project.name}. نمونهٔ ${index + 1} از فهرست پیگیری.`,
          followers: [],
          favorites: [],
        }
        insertTicket.run(ticketId, title, JSON.stringify(ticket), now, now)
        insertTicketActivity.run(randomUUID(), ticketId, user.id, user.name, user.avatar_url, JSON.stringify({ title }), now)
      })

      database.exec("COMMIT")
      console.log(`Added ${tasksToAdd.length} tasks and ${ticketsToAdd.length} tickets. Report totals: 36 tasks (12 per status) and 18 tickets (6 per status).`)
    } catch (error) {
      database.exec("ROLLBACK")
      throw error
    }
  }
} finally {
  database.close()
}
