import { createServer } from "node:http"
import { openDatabase } from "./database.js"
import { createTaskRepository } from "./task-repository.js"
import { createTicketCommentRepository } from "./apps/tickets/ticket-comment-repository.js"
import { createTicketRepository } from "./apps/tickets/ticket-repository.js"
import { createProjectPageRepository } from "./apps/projects/project-page-repository.js"
import { createNotificationRepository } from "./apps/notifications/notification-repository.js"
import { createAuthRepository, authSessionTtlSeconds } from "./apps/auth/auth-repository.js"
import { createOrganizationRepository, organizationPermissionKeys } from "./apps/organizations/organization-repository.js"
import { assistantMessageLimits, createAIService } from "./apps/ai/ai-service.js"

const host = process.env.HOST ?? "127.0.0.1"
const port = Number(process.env.PORT ?? 4000)
const origins = new Set((process.env.FRONTEND_ORIGINS ?? "http://127.0.0.1:3000,http://localhost:3000").split(",").map((value) => value.trim()))
const database = openDatabase({ seed: false })
const repository = createTaskRepository(database)
const ticketCommentRepository = createTicketCommentRepository(database)
const ticketRepository = createTicketRepository(database)
const projectPageRepository = createProjectPageRepository(database)
const notificationRepository = createNotificationRepository(database)
const authRepository = createAuthRepository(database)
const organizationRepository = createOrganizationRepository(database)
const aiService = createAIService()
const initialAdminCreated = process.env.INITIAL_ADMIN_EMAIL || process.env.INITIAL_ADMIN_PASSWORD
  ? authRepository.ensureInitialUser({
      email: process.env.INITIAL_ADMIN_EMAIL,
      name: process.env.INITIAL_ADMIN_NAME ?? "Younes Salimi",
      password: process.env.INITIAL_ADMIN_PASSWORD,
    })
  : false
if (initialAdminCreated) console.log("Created the initial Quire account from environment settings.")

class HttpError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

function sendJson(response, status, value) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" })
  response.end(JSON.stringify(value))
}

const SESSION_COOKIE = "quire_session"
const isSecureCookie = process.env.SESSION_COOKIE_SECURE === "true" || (process.env.SESSION_COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production")
const sessionCookieOptions = `HttpOnly; SameSite=Lax; Path=/; Max-Age=${authSessionTtlSeconds}${isSecureCookie ? "; Secure" : ""}`

function getCookie(request, name) {
  const prefix = `${name}=`
  const cookie = request.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix))
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : undefined
}

function setSessionCookie(response, token, maxAge = authSessionTtlSeconds) {
  response.setHeader("set-cookie", `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${isSecureCookie ? "; Secure" : ""}`)
}

const loginAttempts = new Map()
const LOGIN_LIMIT = 8
const LOGIN_WINDOW_MS = 15 * 60 * 1000

async function readJson(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > 1_000_000) throw new HttpError(413, "payload_too_large", "درخواست بیش از حد بزرگ است.")
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"))
  } catch {
    throw new HttpError(400, "invalid_json", "بدنهٔ درخواست باید JSON معتبر باشد.")
  }
}

function validateTaskInput(value, { partial = false } = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "invalid_body", "بدنهٔ درخواست باید یک شیء باشد.")
  }
  const input = { ...value }
  if (!partial || "title" in input) {
    if (typeof input.title !== "string" || !input.title.trim()) throw new HttpError(400, "invalid_title", "عنوان تسک الزامی است.")
    input.title = input.title.trim()
  }
  if (!partial || "projectId" in input) {
    if (typeof input.projectId !== "string" || !input.projectId.trim()) throw new HttpError(400, "invalid_project", "پروژهٔ تسک الزامی است.")
  }
  const arrays = ["assigneeNames", "tags", "subtasks", "followers", "activityLog"]
  for (const field of arrays) {
    if (field in input && !Array.isArray(input[field])) throw new HttpError(400, "invalid_field", `${field} باید آرایه باشد.`)
  }
  if ("priority" in input && !["none", "low", "medium", "high", "urgent"].includes(input.priority)) throw new HttpError(400, "invalid_priority", "اولویت معتبر نیست.")
  if ("status" in input && !["todo", "in-progress", "completed"].includes(input.status)) throw new HttpError(400, "invalid_status", "وضعیت معتبر نیست.")
  if ("repeat" in input && input.repeat != null && !["none", "daily", "weekly", "monthly"].includes(input.repeat)) throw new HttpError(400, "invalid_repeat", "الگوی تکرار معتبر نیست.")
  if ("isFavorite" in input && typeof input.isFavorite !== "boolean") throw new HttpError(400, "invalid_field", "isFavorite باید boolean باشد.")
  if ("timeSpentMinutes" in input && (!Number.isInteger(input.timeSpentMinutes) || input.timeSpentMinutes < 0)) throw new HttpError(400, "invalid_field", "زمان صرف‌شده باید عدد صحیح نامنفی باشد.")
  for (const field of ["startDate", "dueDate", "description"]) {
    if (field in input && input[field] != null && typeof input[field] !== "string") throw new HttpError(400, "invalid_field", `${field} باید رشته باشد.`)
  }
  return input
}

function validateTaskActor(value) {
  if (!value || typeof value !== "object") return undefined
  if (typeof value.actorId !== "string" || !value.actorId.trim() || typeof value.actorName !== "string" || !value.actorName.trim()) {
    throw new HttpError(400, "invalid_actor", "شناسه و نام سازندهٔ تسک معتبر نیست.")
  }
  return { id: value.actorId.trim().slice(0, 200), name: value.actorName.trim().slice(0, 200) }
}

function validateTicketCommentInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "invalid_body", "بدنهٔ درخواست باید یک شیء باشد.")
  }
  if (typeof value.text !== "string" || !value.text.trim()) {
    throw new HttpError(400, "invalid_text", "متن کامنت الزامی است.")
  }
  if (value.text.trim().length > 10_000) {
    throw new HttpError(400, "field_too_long", "متن کامنت بیش از حد طولانی است.")
  }
  return {
    text: value.text,
  }
}

function validateProjectPageInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new HttpError(400, "invalid_body", "بدنهٔ درخواست باید یک شیء باشد.")
  if (typeof value.title !== "string" || !value.title.trim() || value.title.trim().length > 200) throw new HttpError(400, "invalid_title", "عنوان صفحه باید بین ۱ تا ۲۰۰ نویسه باشد.")
  if (typeof value.content !== "string" || value.content.length > 500_000) throw new HttpError(400, "invalid_content", "متن صفحه معتبر نیست.")
  return { title: value.title.trim(), content: value.content }
}

function validateProjectMessageInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || typeof value.text !== "string" || !value.text.trim()) throw new HttpError(400, "invalid_message", "متن پیام الزامی است.")
  if (value.text.trim().length > 10_000) throw new HttpError(400, "field_too_long", "متن پیام بیش از حد طولانی است.")
  return { text: value.text.trim() }
}

function validateTicketInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || typeof value.title !== "string" || !value.title.trim()) throw new HttpError(400, "invalid_ticket", "عنوان تیکت الزامی است.")
  if (!["general", "hr", "purchasing", "warehouse"].includes(value.subject)) throw new HttpError(400, "invalid_subject", "موضوع تیکت معتبر نیست.")
  if (!["todo", "in-progress", "completed"].includes(value.status)) throw new HttpError(400, "invalid_status", "وضعیت تیکت معتبر نیست.")
  if (value.priority !== undefined && !["none", "low", "medium", "high", "urgent"].includes(value.priority)) throw new HttpError(400, "invalid_priority", "اولویت تیکت معتبر نیست.")
  if (!Array.isArray(value.permissionIds) || !Array.isArray(value.followers ?? []) || !Array.isArray(value.favorites ?? [])) throw new HttpError(400, "invalid_field", "فیلدهای تیکت معتبر نیستند.")
  return { ...value, title: value.title.trim() }
}

function validateNameInput(value) {
  if (!value || typeof value.name !== "string" || !value.name.trim() || value.name.trim().length > 200) {
    throw new HttpError(400, "invalid_name", "نام باید بین ۱ تا ۲۰۰ نویسه باشد.")
  }
  return value.name.trim()
}

function validateOrganizationSettingsInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new HttpError(400, "invalid_body", "اطلاعات سازمان معتبر نیست.")
  const input = {}
  if ("name" in value) {
    if (typeof value.name !== "string" || !value.name.trim() || value.name.trim().length > 120) throw new HttpError(400, "invalid_name", "نام سازمان معتبر نیست.")
    input.name = value.name.trim()
  }
  if ("description" in value) {
    if (typeof value.description !== "string" || value.description.length > 2000) throw new HttpError(400, "invalid_description", "توضیحات سازمان بیش از حد طولانی است.")
    input.description = value.description.trim()
  }
  if ("slug" in value) {
    if (typeof value.slug !== "string" || !/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(value.slug) || value.slug.length > 80) throw new HttpError(400, "invalid_slug", "نشانی باید از حروف، عدد و خط تیره تشکیل شود.")
    input.slug = value.slug
  }
  if ("imageUrl" in value) {
    if (value.imageUrl !== null && (typeof value.imageUrl !== "string" || !/^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/]+=*$/.test(value.imageUrl) || value.imageUrl.length > 700_000)) throw new HttpError(400, "invalid_image", "تصویر باید PNG، JPEG یا WebP و کمتر از 500 کیلوبایت باشد.")
    input.imageUrl = value.imageUrl
  }
  if ("preferences" in value) {
    const allowed = new Set(["showSidebarIcon", "createFromEmail", "notifications", "features", "properties"])
    const preferences = value.preferences
    if (!preferences || typeof preferences !== "object" || Array.isArray(preferences) || Object.keys(preferences).some((key) => !allowed.has(key)) || JSON.stringify(preferences).length > 20_000) {
      throw new HttpError(400, "invalid_preferences", "تنظیمات گزینه‌های سازمان معتبر نیست.")
    }
    for (const key of ["showSidebarIcon", "createFromEmail"]) {
      if (key in preferences && typeof preferences[key] !== "boolean") throw new HttpError(400, "invalid_preferences", "تنظیمات گزینه‌های سازمان معتبر نیست.")
    }
    for (const key of ["notifications", "features"]) {
      if (key in preferences && (!preferences[key] || typeof preferences[key] !== "object" || Array.isArray(preferences[key]) || Object.values(preferences[key]).some((enabled) => typeof enabled !== "boolean"))) {
        throw new HttpError(400, "invalid_preferences", "تنظیمات گزینه‌های سازمان معتبر نیست.")
      }
    }
    if ("properties" in preferences && (!Array.isArray(preferences.properties) || preferences.properties.length > 50 || preferences.properties.some((item) => !item || typeof item !== "object" || typeof item.id !== "string" || typeof item.name !== "string" || !["text", "date", "number"].includes(item.type)))) {
      throw new HttpError(400, "invalid_preferences", "ویژگی‌های سازمان معتبر نیستند.")
    }
    input.preferences = preferences
  }
  if (!Object.keys(input).length) throw new HttpError(400, "empty_update", "تغییری برای ذخیره ارسال نشده است.")
  return input
}

function validateOrganizationMemberInput(value, { partial = false } = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new HttpError(400, "invalid_body", "اطلاعات عضو معتبر نیست.")
  const input = {}
  if (!partial || "email" in value) {
    if (typeof value.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())) throw new HttpError(400, "invalid_email", "ایمیل عضو معتبر نیست.")
    input.email = value.email.trim()
  }
  if ("role" in value) {
    if (!["owner", "admin", "custom"].includes(value.role)) throw new HttpError(400, "invalid_role", "نقش عضو معتبر نیست.")
    input.role = value.role
  }
  if ("permissions" in value) {
    if (!value.permissions || typeof value.permissions !== "object" || Array.isArray(value.permissions)) throw new HttpError(400, "invalid_permissions", "مجوزهای عضو معتبر نیستند.")
    for (const [key, enabled] of Object.entries(value.permissions)) {
      if (!organizationPermissionKeys.includes(key) || typeof enabled !== "boolean") throw new HttpError(400, "invalid_permissions", "مجوزهای عضو معتبر نیستند.")
    }
    input.permissions = value.permissions
  }
  return input
}

function validateProfileInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new HttpError(400, "invalid_body", "بدنهٔ درخواست معتبر نیست.")
  const name = typeof value.name === "string" ? value.name.trim() : ""
  const email = typeof value.email === "string" ? value.email.trim().toLowerCase() : ""
  const bio = value.bio == null ? "" : value.bio
  const avatarUrl = value.avatarUrl == null ? "" : value.avatarUrl
  if (!name || name.length > 200) throw new HttpError(400, "invalid_name", "نام باید بین ۱ تا ۲۰۰ نویسه باشد.")
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new HttpError(400, "invalid_email", "ایمیل معتبر نیست.")
  if (typeof bio !== "string" || bio.length > 2000) throw new HttpError(400, "invalid_bio", "توضیحات بیش از حد طولانی است.")
  if (typeof avatarUrl !== "string" || avatarUrl.length > 900_000 || (avatarUrl && !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(avatarUrl))) {
    throw new HttpError(400, "invalid_avatar", "تصویر پروفایل معتبر نیست یا حجم آن زیاد است.")
  }
  return { name, email, bio, avatarUrl }
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin
  if (origin && origins.has(origin)) {
    response.setHeader("access-control-allow-origin", origin)
    response.setHeader("vary", "Origin")
    response.setHeader("access-control-allow-methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
    response.setHeader("access-control-allow-headers", "content-type")
    response.setHeader("access-control-allow-credentials", "true")
  }
  if (request.method === "OPTIONS") {
    response.writeHead(204)
    response.end()
    return
  }

  try {
    const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`)
    const path = url.pathname.replace(/\/$/, "") || "/"
    const method = request.method
    if (path === "/health" && method === "GET") {
      database.prepare("SELECT 1").get()
      sendJson(response, 200, { status: "ok" })
      return
    }

    if (path === "/api/v1/auth/login" && method === "POST") {
      const remoteAddress = request.socket.remoteAddress ?? "unknown"
      const now = Date.now()
      const currentAttempts = loginAttempts.get(remoteAddress)
      const attempts = currentAttempts && currentAttempts.resetAt > now ? currentAttempts : { count: 0, resetAt: now + LOGIN_WINDOW_MS }
      if (attempts.count >= LOGIN_LIMIT) throw new HttpError(429, "login_rate_limited", "تعداد تلاش‌های ورود زیاد است؛ کمی بعد دوباره تلاش کنید.")

      const input = await readJson(request)
      const email = typeof input.identifier === "string" ? input.identifier : typeof input.email === "string" ? input.email : ""
      if (!email.trim() || typeof input.password !== "string" || !input.password) throw new HttpError(400, "invalid_credentials", "ایمیل و رمز عبور را وارد کنید.")
      const userAgent = request.headers["x-quire-user-agent"] ?? request.headers["user-agent"] ?? ""
      const session = authRepository.login(email, input.password, userAgent)
      if (!session) {
        attempts.count += 1
        loginAttempts.set(remoteAddress, attempts)
        throw new HttpError(401, "invalid_credentials", "ایمیل یا رمز عبور درست نیست.")
      }
      loginAttempts.delete(remoteAddress)
      setSessionCookie(response, session.token)
      sendJson(response, 200, session.user)
      return
    }

    const sessionToken = getCookie(request, SESSION_COOKIE)
    const session = authRepository.getSession(sessionToken, request.headers["x-quire-user-agent"] ?? "")
    if (path === "/api/v1/auth/me" && method === "GET") {
      if (!session) throw new HttpError(401, "unauthenticated", "برای ادامه وارد حساب کاربری شوید.")
      sendJson(response, 200, session.user)
      return
    }
    if (path === "/api/v1/auth/me" && method === "PATCH") {
      if (!session) throw new HttpError(401, "unauthenticated", "برای ادامه وارد حساب کاربری شوید.")
      const profile = validateProfileInput(await readJson(request))
      const updated = authRepository.updateProfile(session.user.id, profile)
      if (!updated) throw new HttpError(404, "not_found", "حساب کاربری پیدا نشد.")
      sendJson(response, 200, updated)
      return
    }
    if (path === "/api/v1/auth/sessions" && method === "GET") {
      if (!session) throw new HttpError(401, "unauthenticated", "برای ادامه وارد حساب کاربری شوید.")
      sendJson(response, 200, authRepository.listSessions(session.user.id, session.sessionId))
      return
    }
    const sessionRoute = path.match(/^\/api\/v1\/auth\/sessions\/([a-f0-9]{32})$/)
    if (sessionRoute && method === "DELETE") {
      if (!session) throw new HttpError(401, "unauthenticated", "برای ادامه وارد حساب کاربری شوید.")
      const [sessionId] = sessionRoute.slice(1)
      const revoked = authRepository.revokeSessionById(session.user.id, sessionId)
      if (!revoked) throw new HttpError(404, "session_not_found", "نشست پیدا نشد.")
      if (sessionId === session.sessionId) setSessionCookie(response, "", 0)
      response.writeHead(204)
      response.end()
      return
    }
    if (path === "/api/v1/auth/logout" && method === "POST") {
      authRepository.revokeSession(sessionToken)
      setSessionCookie(response, "", 0)
      response.writeHead(204)
      response.end()
      return
    }
    if (path.startsWith("/api/v1/") && !session) throw new HttpError(401, "unauthenticated", "برای ادامه وارد حساب کاربری شوید.")
    const currentUser = session?.user

    if (path === "/api/v1/assistant/chat" && method === "POST") {
      const input = await readJson(request)
      if (!Array.isArray(input?.messages) || input.messages.length === 0 || input.messages.length > assistantMessageLimits.maxMessages) {
        throw new HttpError(400, "invalid_messages", "تاریخچهٔ گفت‌وگو معتبر نیست.")
      }
      const messages = input.messages.map((message) => {
        if (!message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string") {
          throw new HttpError(400, "invalid_message", "پیام گفت‌وگو معتبر نیست.")
        }
        const content = message.content.trim()
        if (!content || content.length > assistantMessageLimits.maxMessageLength) {
          throw new HttpError(400, "invalid_message", "طول پیام گفت‌وگو معتبر نیست.")
        }
        return { role: message.role, content }
      })
      if (messages.at(-1)?.role !== "user") throw new HttpError(400, "invalid_messages", "آخرین پیام باید از طرف کاربر باشد.")
      try {
        const reply = await aiService.reply(messages)
        sendJson(response, 200, { reply })
      } catch (error) {
        const status = error?.code === "assistant_not_configured" ? 503 : 502
        const message = error?.code === "assistant_provider_auth"
          ? "کلید سرویس هوش مصنوعی معتبر نیست؛ تنظیمات بک‌اند را بررسی کنید."
          : error?.code === "assistant_not_configured"
            ? "دستیار هنوز پیکربندی نشده است."
            : "دستیار فعلاً پاسخ نمی‌دهد؛ کمی بعد دوباره تلاش کنید."
        sendJson(response, status, { error: { code: error?.code ?? "assistant_unavailable", message } })
      }
      return
    }

    const organizationSettingsMatch = path.match(/^\/api\/v1\/organizations\/([^/]+)\/settings$/)
    if (organizationSettingsMatch && method === "PATCH") {
      const organizationId = decodeURIComponent(organizationSettingsMatch[1])
      const input = validateOrganizationSettingsInput(await readJson(request))
      const result = organizationRepository.updateSettings(currentUser.id, organizationId, input)
      if (!result) {
        if (!organizationRepository.hasAccess(currentUser.id, organizationId)) throw new HttpError(404, "not_found", "سازمان پیدا نشد.")
        throw new HttpError(403, "forbidden", "اجازهٔ ویرایش این سازمان را ندارید.")
      }
      if (result.conflict) throw new HttpError(409, "slug_conflict", "این نشانی قبلاً استفاده شده است.")
      sendJson(response, 200, result)
      return
    }

    const organizationMembersMatch = path.match(/^\/api\/v1\/organizations\/([^/]+)\/members(?:\/([^/]+))?$/)
    if (organizationMembersMatch) {
      const organizationId = decodeURIComponent(organizationMembersMatch[1])
      const memberId = organizationMembersMatch[2] ? decodeURIComponent(organizationMembersMatch[2]) : undefined
      if (method === "GET" && !memberId) {
        const members = organizationRepository.listMembers(organizationId, currentUser.id)
        if (!members) throw new HttpError(404, "not_found", "سازمان پیدا نشد.")
        sendJson(response, 200, members)
        return
      }
      if (method === "POST" && !memberId) {
        const input = validateOrganizationMemberInput(await readJson(request))
        const result = organizationRepository.inviteMember(currentUser.id, organizationId, input.email)
        if (result.forbidden) throw new HttpError(403, "forbidden", "اجازهٔ افزودن عضو را ندارید.")
        if (result.userNotFound) throw new HttpError(404, "user_not_found", "حسابی با این ایمیل پیدا نشد.")
        if (result.conflict) throw new HttpError(409, "already_member", "این کاربر از قبل عضو سازمان است.")
        sendJson(response, 201, result)
        return
      }
      if (method === "PATCH" && memberId) {
        const input = validateOrganizationMemberInput(await readJson(request), { partial: true })
        const result = organizationRepository.updateMember(currentUser.id, organizationId, memberId, input.role, input.permissions)
        if (!result) throw new HttpError(404, "member_not_found", "عضو سازمان پیدا نشد.")
        if (result.forbidden) throw new HttpError(403, "forbidden", "اجازهٔ تغییر دسترسی این عضو را ندارید.")
        if (result.conflict) throw new HttpError(409, "owner_required", "سازمان باید دقیقاً یک مالک داشته باشد.")
        sendJson(response, 200, result)
        return
      }
      if (method === "DELETE" && memberId) {
        const result = organizationRepository.removeMember(currentUser.id, organizationId, memberId)
        if (!result) throw new HttpError(404, "member_not_found", "عضو سازمان پیدا نشد یا امکان حذف مالک وجود ندارد.")
        if (result.forbidden) throw new HttpError(403, "forbidden", "اجازهٔ حذف عضو را ندارید.")
        response.writeHead(204)
        response.end()
        return
      }
    }

    const organizationBySlugMatch = path.match(/^\/api\/v1\/organizations\/by-slug\/([^/]+)$/)
    if (organizationBySlugMatch && method === "GET") {
      const organization = organizationRepository.getOrganizationBySlug(decodeURIComponent(organizationBySlugMatch[1]), currentUser.id)
      if (!organization) throw new HttpError(404, "not_found", "سازمان پیدا نشد.")
      sendJson(response, 200, organization)
      return
    }

    const projectBySlugMatch = path.match(/^\/api\/v1\/organizations\/by-slug\/([^/]+)\/projects\/([^/]+)$/)
    if (projectBySlugMatch && method === "GET") {
      const project = organizationRepository.getProjectBySlugs(decodeURIComponent(projectBySlugMatch[1]), decodeURIComponent(projectBySlugMatch[2]), currentUser.id)
      if (!project) throw new HttpError(404, "not_found", "پروژه پیدا نشد.")
      sendJson(response, 200, project)
      return
    }

    if (path === "/api/v1/organizations" && method === "GET") {
      sendJson(response, 200, organizationRepository.listOrganizations(currentUser.id))
      return
    }
    if (path === "/api/v1/organizations" && method === "POST") {
      const name = validateNameInput(await readJson(request))
      const organization = organizationRepository.createOrganization(currentUser.id, name)
      if (organization.conflict) throw new HttpError(409, "slug_conflict", "این نام سازمان به یک نشانی تکراری تبدیل می‌شود؛ نام دیگری انتخاب کنید.")
      sendJson(response, 201, organization)
      return
    }

    const divisionCreateMatch = path.match(/^\/api\/v1\/organizations\/([^/]+)\/divisions$/)
    if (divisionCreateMatch && method === "POST") {
      const organizationId = decodeURIComponent(divisionCreateMatch[1])
      const name = validateNameInput(await readJson(request))
      const division = organizationRepository.createDivision(currentUser.id, organizationId, name)
      if (!division) {
        if (!organizationRepository.hasAccess(currentUser.id, organizationId)) throw new HttpError(404, "not_found", "سازمان پیدا نشد.")
        throw new HttpError(403, "forbidden", "اجازهٔ ساخت معاونت در این سازمان را ندارید.")
      }
      sendJson(response, 201, division)
      return
    }

    const divisionMoveMatch = path.match(/^\/api\/v1\/organizations\/([^/]+)\/divisions\/([^/]+)$/)
    if (divisionMoveMatch && method === "PATCH") {
      const sourceOrganizationId = decodeURIComponent(divisionMoveMatch[1])
      const divisionId = decodeURIComponent(divisionMoveMatch[2])
      const body = await readJson(request)
      if (!body || typeof body !== "object" || typeof body.organizationId !== "string" || !body.organizationId.trim()) throw new HttpError(400, "invalid_organization", "سازمان مقصد معتبر نیست.")
      const result = organizationRepository.moveDivision(currentUser.id, sourceOrganizationId, divisionId, body.organizationId.trim())
      if (!result) throw new HttpError(403, "forbidden", "اجازهٔ جابه‌جایی این معاونت را ندارید.")
      if (result.conflict) throw new HttpError(409, "duplicate_division", "در سازمان مقصد معاونتی با همین نام وجود دارد.")
      sendJson(response, 200, result)
      return
    }

    const projectCreateMatch = path.match(/^\/api\/v1\/divisions\/([^/]+)\/projects$/)
    if (projectCreateMatch && method === "POST") {
      const divisionId = decodeURIComponent(projectCreateMatch[1])
      const name = validateNameInput(await readJson(request))
      const project = organizationRepository.createProject(currentUser.id, divisionId, name)
      if (!project) throw new HttpError(403, "forbidden", "اجازهٔ ساخت پروژه در این معاونت را ندارید.")
      sendJson(response, 201, project)
      return
    }

    const projectLocationMatch = path.match(/^\/api\/v1\/projects\/([^/]+)\/location$/)
    if (projectLocationMatch && method === "PATCH") {
      const projectId = decodeURIComponent(projectLocationMatch[1])
      const body = await readJson(request)
      if (!body || typeof body !== "object" || typeof body.divisionId !== "string" || !body.divisionId.trim()) throw new HttpError(400, "invalid_division", "معاونت مقصد معتبر نیست.")
      const project = organizationRepository.moveProject(currentUser.id, projectId, body.divisionId.trim())
      if (!project) throw new HttpError(403, "forbidden", "اجازهٔ جابه‌جایی این پروژه را ندارید.")
      sendJson(response, 200, project)
      return
    }

    const projectMatch = path.match(/^\/api\/v1\/projects\/([^/]+)(?:\/(tasks))?$/)
    if (path === "/api/v1/projects" && method === "GET") {
      sendJson(response, 200, organizationRepository.listProjects(currentUser.id))
      return
    }
    if (projectMatch && method === "GET") {
      const projectId = decodeURIComponent(projectMatch[1])
      if (projectMatch[2]) {
        if (!repository.getProject(projectId, currentUser.id)) throw new HttpError(404, "not_found", "پروژه پیدا نشد.")
        sendJson(response, 200, repository.listTasks({ projectId }))
      } else {
        const project = organizationRepository.getProject(projectId, currentUser.id)
        if (!project) throw new HttpError(404, "not_found", "پروژه پیدا نشد.")
        sendJson(response, 200, project)
      }
      return
    }

    const projectPagesCollectionMatch = path.match(/^\/api\/v1\/projects\/([^/]+)\/pages$/)
    const projectPageMatch = path.match(/^\/api\/v1\/projects\/([^/]+)\/pages\/(document|chat)$/)
    const projectChatMatch = path.match(/^\/api\/v1\/projects\/([^/]+)\/chat$/)
    if (projectPagesCollectionMatch || projectPageMatch || projectChatMatch) {
      const projectId = decodeURIComponent((projectPagesCollectionMatch ?? projectPageMatch ?? projectChatMatch)[1])
      if (!organizationRepository.canAccessProject(currentUser.id, projectId) || !projectPageRepository.hasProject(projectId)) throw new HttpError(404, "not_found", "پروژه پیدا نشد.")
      if (projectPagesCollectionMatch && method === "GET") {
        sendJson(response, 200, projectPageRepository.listPages(projectId))
        return
      }
      if (projectPageMatch && method === "PUT") {
        const page = validateProjectPageInput(await readJson(request))
        sendJson(response, 200, projectPageRepository.savePage(projectId, projectPageMatch[2], page.title, page.content))
        return
      }
      if (projectChatMatch && method === "GET") {
        sendJson(response, 200, projectPageRepository.listMessages(projectId))
        return
      }
      if (projectChatMatch && method === "POST") {
        const message = validateProjectMessageInput(await readJson(request))
        sendJson(response, 201, projectPageRepository.createMessage(projectId, currentUser.name, message.text))
        return
      }
      throw new HttpError(405, "method_not_allowed", "این متد پشتیبانی نمی‌شود.")
    }

    if (path === "/api/v1/tasks" && method === "GET") {
      const projectId = url.searchParams.get("projectId") ?? undefined
      if (projectId && !organizationRepository.canAccessProject(currentUser.id, projectId)) throw new HttpError(404, "not_found", "پروژه پیدا نشد.")
      const projectIds = projectId ? undefined : organizationRepository.listProjects(currentUser.id).map((project) => project.id)
      sendJson(response, 200, repository.listTasks({ projectId, projectIds, assigneeName: url.searchParams.get("assigneeName") ?? undefined }))
      return
    }
    if (path === "/api/v1/tasks" && method === "POST") {
      const input = validateTaskInput(await readJson(request))
      if (!organizationRepository.canAccessProject(currentUser.id, input.projectId)) throw new HttpError(404, "not_found", "پروژه پیدا نشد.")
      const actor = { id: currentUser.id, name: currentUser.name }
      delete input.actorId
      delete input.actorName
      const task = repository.createTask(validateTaskInput(input))
      notificationRepository.createTaskAssignmentNotifications(task, actor)
      sendJson(response, 201, task)
      return
    }

    if (path === "/api/v1/notifications" && method === "GET") {
      const recipientName = currentUser.name
      sendJson(response, 200, notificationRepository.listForRecipient(recipientName))
      return
    }

    const notificationReadMatch = path.match(/^\/api\/v1\/notifications\/([^/]+)\/read$/)
    if (notificationReadMatch && method === "PATCH") {
      const id = decodeURIComponent(notificationReadMatch[1])
      await readJson(request)
      if (!notificationRepository.markRead(id, currentUser.name)) throw new HttpError(404, "not_found", "اعلان پیدا نشد.")
      response.writeHead(204)
      response.end()
      return
    }

    const taskMatch = path.match(/^\/api\/v1\/tasks\/([^/]+)$/)
    if (taskMatch) {
      const id = decodeURIComponent(taskMatch[1])
      if (method === "GET") {
        const task = repository.getTask(id)
        if (!task || !organizationRepository.canAccessProject(currentUser.id, task.projectId)) throw new HttpError(404, "not_found", "تسک پیدا نشد.")
        sendJson(response, 200, task)
        return
      }
      if (method === "PATCH") {
        const input = validateTaskInput(await readJson(request), { partial: true })
        const actor = { id: currentUser.id, name: currentUser.name }
        delete input.actorId
        delete input.actorName
        const previous = repository.getTask(id)
        if (!previous || !organizationRepository.canAccessProject(currentUser.id, previous.projectId)) throw new HttpError(404, "not_found", "تسک پیدا نشد.")
        const patch = validateTaskInput(input, { partial: true })
        const task = repository.updateTask(id, patch)
        if (!task) throw new HttpError(404, "not_found", "تسک پیدا نشد.")
        const previousAssignees = new Set(previous?.assigneeNames ?? [])
        const newlyAssigned = (task.assigneeNames ?? []).filter((name) => !previousAssignees.has(name))
        if (newlyAssigned.length) notificationRepository.createTaskAssignmentNotifications({ ...task, assigneeNames: newlyAssigned }, actor)
        sendJson(response, 200, task)
        return
      }
      if (method === "DELETE") {
        const task = repository.getTask(id)
        if (!task || !organizationRepository.canAccessProject(currentUser.id, task.projectId)) throw new HttpError(404, "not_found", "تسک پیدا نشد.")
        if (!repository.deleteTask(id)) throw new HttpError(404, "not_found", "تسک پیدا نشد.")
        response.writeHead(204)
        response.end()
        return
      }
      throw new HttpError(405, "method_not_allowed", "این متد پشتیبانی نمی‌شود.")
    }

    const ticketCommentsMatch = path.match(/^\/api\/v1\/tickets\/([^/]+)\/comments$/)
    const ticketActivityMatch = path.match(/^\/api\/v1\/tickets\/([^/]+)\/activity$/)
    const ticketMatch = path.match(/^\/api\/v1\/tickets\/([^/]+)$/)
    if (path === "/api/v1/tickets" && method === "GET") {
      sendJson(response, 200, ticketRepository.list())
      return
    }
    if (path === "/api/v1/tickets/inbox" && method === "GET") {
      sendJson(response, 200, ticketRepository.listForInbox(currentUser.id))
      return
    }
    if (ticketMatch) {
      const ticketId = decodeURIComponent(ticketMatch[1])
      if (method === "GET") {
        const ticket = ticketRepository.get(ticketId)
        if (!ticket) throw new HttpError(404, "not_found", "تیکت پیدا نشد.")
        sendJson(response, 200, ticket)
        return
      }
      if (method === "PUT") {
        const body = await readJson(request)
        const actor = { id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl }
        const ticket = validateTicketInput(body.ticket)
        if (ticket.projectId && !organizationRepository.getProject(ticket.projectId, currentUser.id)) throw new HttpError(404, "not_found", "پروژه پیدا نشد.")
        const previous = ticketRepository.get(ticketId)
        let assignee
        if (ticket.assigneeId) {
          assignee = authRepository.getUser(ticket.assigneeId)
          if (!assignee) throw new HttpError(404, "assignee_not_found", "عضو انتخاب‌شده پیدا نشد.")
          const project = ticket.projectId ? organizationRepository.getProject(ticket.projectId, currentUser.id) : undefined
          if (project && !project.memberIds.includes(assignee.id)) throw new HttpError(400, "assignee_not_in_project", "این عضو به پروژه دسترسی ندارد.")
          ticket.assigneeName = assignee.name
          ticket.assigneeAvatarUrl = assignee.avatarUrl
        } else {
          delete ticket.assigneeId
          delete ticket.assigneeName
          delete ticket.assigneeAvatarUrl
        }
        ticket.createdById = currentUser.id
        ticket.createdByName = currentUser.name
        ticket.createdByAvatarUrl = currentUser.avatarUrl
        const saved = ticketRepository.save(ticketId, ticket, actor)
        if (assignee && assignee.id !== previous?.assigneeId) notificationRepository.createTicketAssignmentNotification(saved, assignee, actor)
        sendJson(response, 200, saved)
        return
      }
      if (method === "DELETE") {
        if (!ticketRepository.delete(ticketId)) throw new HttpError(404, "not_found", "تیکت پیدا نشد.")
        response.writeHead(204); response.end(); return
      }
      throw new HttpError(405, "method_not_allowed", "این متد پشتیبانی نمی‌شود.")
    }
    if (ticketActivityMatch) {
      const ticketId = decodeURIComponent(ticketActivityMatch[1])
      if (!ticketRepository.get(ticketId)) throw new HttpError(404, "not_found", "تیکت پیدا نشد.")
      if (method !== "GET") throw new HttpError(405, "method_not_allowed", "این متد پشتیبانی نمی‌شود.")
      sendJson(response, 200, ticketRepository.activity(ticketId)); return
    }
    if (ticketCommentsMatch) {
      const ticketId = decodeURIComponent(ticketCommentsMatch[1])
      if (!ticketId.trim()) throw new HttpError(400, "invalid_ticket", "شناسهٔ تیکت الزامی است.")
      if (method === "GET") {
        sendJson(response, 200, ticketCommentRepository.list(ticketId))
        return
      }
      if (method === "POST") {
        const input = validateTicketCommentInput(await readJson(request))
        const comment = ticketCommentRepository.create(ticketId, { ...input, authorId: currentUser.id, authorName: currentUser.name, authorAvatarUrl: currentUser.avatarUrl })
        if (ticketRepository.get(ticketId)) ticketRepository.logComment(ticketId, comment)
        sendJson(response, 201, comment)
        return
      }
      throw new HttpError(405, "method_not_allowed", "این متد پشتیبانی نمی‌شود.")
    }

    if (path.startsWith("/api/") && ["GET", "POST", "PATCH", "DELETE"].includes(method)) {
      throw new HttpError(404, "not_found", "مسیر API پیدا نشد.")
    }
    throw new HttpError(405, "method_not_allowed", "این متد پشتیبانی نمی‌شود.")
  } catch (error) {
    if (response.headersSent) {
      response.destroy()
      return
    }
    if (error instanceof HttpError) {
      sendJson(response, error.status, { error: { code: error.code, message: error.message } })
      return
    }
    if (error?.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
      sendJson(response, 400, { error: { code: "invalid_project", message: "پروژهٔ انتخاب‌شده وجود ندارد." } })
      return
    }
    if (error?.code === "SQLITE_CONSTRAINT_UNIQUE") {
      sendJson(response, 409, { error: { code: "duplicate_name", message: "این نام قبلاً در همین سطح ثبت شده است." } })
      return
    }
    console.error(error)
    sendJson(response, 500, { error: { code: "internal_error", message: "خطای داخلی سرور رخ داد." } })
  }
})

server.listen(port, host, () => console.log(`Quire API listening at http://${host}:${port}`))
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => { repository.close(); process.exit(0) }))
}
