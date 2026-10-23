import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 }

export function hashPassword(password, salt = randomBytes(16)) {
  const hash = scryptSync(password, salt, 64, SCRYPT_OPTIONS)
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`
}

function verifyPassword(password, storedHash) {
  const [algorithm, saltValue, hashValue] = String(storedHash ?? "").split("$")
  if (algorithm !== "scrypt" || !saltValue || !hashValue) return false
  const salt = Buffer.from(saltValue, "base64url")
  const expected = Buffer.from(hashValue, "base64url")
  const actual = scryptSync(password, salt, expected.length, SCRYPT_OPTIONS)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

function sessionDigest(token) {
  return createHash("sha256").update(token).digest("hex")
}

function publicUser(row) {
  if (!row) return undefined
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
    notifications: { taskAssigned: true, taskComments: true, weeklyDigest: false },
    attachments: [],
  }
}

function describeUserAgent(userAgent) {
  const value = String(userAgent ?? "")
  const hasPlatform = /Windows|Macintosh|Mac OS|X11|Linux|CrOS|iPhone|iPad|Android/i.test(value)
  const deviceType = /iPad|Tablet|Android(?!.*Mobile)/i.test(value)
    ? "tablet"
    : /iPhone|iPod|Android|Mobile/i.test(value)
      ? "mobile"
      : hasPlatform
        ? "desktop"
        : "unknown"

  let browser = value ? "Other" : "Unknown"
  if (/^node$/i.test(value.trim())) browser = "Unknown"
  if (/SamsungBrowser\//i.test(value)) browser = "Samsung Internet"
  else if (/EdgA?\//i.test(value) || /EdgiOS\//i.test(value)) browser = "Edge"
  else if (/OPR\//i.test(value)) browser = "Opera"
  else if (/FxiOS\//i.test(value) || /Firefox\//i.test(value)) browser = "Firefox"
  else if (/CriOS\//i.test(value) || /Chrome\//i.test(value)) browser = "Chrome"
  else if (/Safari\//i.test(value)) browser = "Safari"

  return { deviceType, browser }
}

export function createAuthRepository(database) {
  const getUserByEmail = database.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
  const getUserById = database.prepare("SELECT * FROM users WHERE id = ?")
  const updateProfileStatement = database.prepare("UPDATE users SET name = ?, email = ?, bio = ?, avatar_url = ? WHERE id = ?")

  return {
    ensureInitialUser({ email, name, password }) {
      const existing = database.prepare("SELECT id FROM users LIMIT 1").get()
      if (existing) return false
      if (!email && !name && !password) return false
      if (!email || !name || !password) throw new Error("Set INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_NAME and INITIAL_ADMIN_PASSWORD together to create the first account.")
      if (password.length < 12) throw new Error("INITIAL_ADMIN_PASSWORD must contain at least 12 characters.")

      const normalizedEmail = email.trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error("INITIAL_ADMIN_EMAIL must be a valid email address.")
      database.prepare("INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)")
        .run(randomBytes(16).toString("hex"), name.trim(), normalizedEmail, hashPassword(password), new Date().toISOString())
      return true
    },

    login(email, password, userAgent = "") {
      const user = getUserByEmail.get(email.trim().toLowerCase())
      if (!user || !verifyPassword(password, user.password_hash)) return undefined

      const token = randomBytes(32).toString("base64url")
      const sessionId = randomBytes(16).toString("hex")
      const now = Date.now()
      const createdAt = new Date(now).toISOString()
      const expiresAt = new Date(now + SESSION_TTL_SECONDS * 1000).toISOString()
      database.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(createdAt)
      database.prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at, session_id, user_agent, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(sessionDigest(token), user.id, createdAt, expiresAt, sessionId, String(userAgent).slice(0, 1000), createdAt)
      return { token, expiresAt, sessionId, user: publicUser(user) }
    },

    getSession(token, userAgent = "") {
      if (!token) return undefined
      const row = database.prepare(`
        SELECT users.*, sessions.session_id, sessions.expires_at
        FROM sessions JOIN users ON users.id = sessions.user_id
        WHERE sessions.token_hash = ? AND sessions.expires_at > ?
      `).get(sessionDigest(token), new Date().toISOString())
      if (!row) return undefined
      database.prepare("UPDATE sessions SET last_seen_at = ?, user_agent = CASE WHEN (user_agent = '' OR user_agent = 'node') AND ? <> '' THEN ? ELSE user_agent END WHERE token_hash = ?")
        .run(new Date().toISOString(), String(userAgent).slice(0, 1000), String(userAgent).slice(0, 1000), sessionDigest(token))
      return { user: publicUser(row), expiresAt: row.expires_at, sessionId: row.session_id }
    },

    revokeSession(token) {
      if (!token) return false
      return database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sessionDigest(token)).changes > 0
    },

    listSessions(userId, currentSessionId) {
      return database.prepare(`
        SELECT session_id, user_agent, created_at, last_seen_at, expires_at
        FROM sessions
        WHERE user_id = ? AND expires_at > ?
        ORDER BY last_seen_at DESC, created_at DESC
      `).all(userId, new Date().toISOString()).map((row) => ({
        id: row.session_id,
        ...describeUserAgent(row.user_agent),
        createdAt: row.created_at,
        lastSeenAt: row.last_seen_at,
        expiresAt: row.expires_at,
        isCurrent: row.session_id === currentSessionId,
      }))
    },

    revokeSessionById(userId, sessionId) {
      return database.prepare("DELETE FROM sessions WHERE user_id = ? AND session_id = ?")
        .run(userId, sessionId).changes > 0
    },

    getUser(id) {
      return publicUser(getUserById.get(id))
    },

    updateProfile(id, { name, email, bio, avatarUrl }) {
      const result = updateProfileStatement.run(name, email, bio || null, avatarUrl || null, id)
      return Number(result.changes) ? publicUser(getUserById.get(id)) : undefined
    },
  }
}

export const authSessionTtlSeconds = SESSION_TTL_SECONDS
