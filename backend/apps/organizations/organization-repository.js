import { randomUUID } from "node:crypto"

export const organizationPermissionKeys = [
  "editOrganization", "createDivision", "editDivision", "createProject", "editProject",
  "inviteMembers", "removeMembers", "manageAccess",
]

function slugify(value, fallbackId, fallbackPrefix = "organization") {
  const slug = value.normalize("NFKC").toLowerCase().replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 70).replace(/-$/g, "")
  return slug || `${fallbackPrefix}-${fallbackId.slice(0, 8)}`
}

function parsePermissions(value) {
  try { return JSON.parse(value || "{}") } catch { return {} }
}

function normalizePermissions(value = {}) {
  return Object.fromEntries(organizationPermissionKeys.map((key) => [key, value[key] === true]))
}

function parsePreferences(value) {
  try { return JSON.parse(value || "{}") } catch { return {} }
}

function toProject(row, members) {
  return {
    id: row.project_id,
    name: row.project_name,
    slug: row.project_slug,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    organizationSlug: row.organization_slug,
    divisionId: row.division_id,
    divisionName: row.division_name,
    memberIds: members.map((member) => member.id),
    members,
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    description: row.description ?? undefined,
    taskCount: row.task_count,
    completedCount: row.completed_count,
  }
}

export function createOrganizationRepository(database) {
  const memberRow = database.prepare(`
    SELECT m.id AS membership_id, m.organization_id, m.user_id, m.role, m.permissions, m.created_at,
      u.name, u.email, u.avatar_url
    FROM organization_members m JOIN users u ON u.id = m.user_id
    WHERE m.organization_id = ? ORDER BY CASE m.role WHEN 'owner' THEN 0 ELSE 1 END, m.created_at, m.rowid
  `)

  function getOrganizationRow(organizationId) {
    return database.prepare("SELECT * FROM organizations WHERE id = ?").get(organizationId)
  }

  function getMembership(organizationId, userId) {
    return database.prepare("SELECT * FROM organization_members WHERE organization_id = ? AND user_id = ?").get(organizationId, userId)
  }

  function can(userId, organizationId, permission) {
    const membership = getMembership(organizationId, userId)
    if (!membership) return false
    if (membership.role === "owner") return true
    if (membership.role === "admin") return permission === "manageAccess"
    return parsePermissions(membership.permissions)[permission] === true
  }

  function membersForOrganization(organizationId) {
    return memberRow.all(organizationId).map((row) => ({
      id: row.user_id,
      name: row.name,
      email: row.email,
      role: row.role,
      permissions: parsePermissions(row.permissions),
      activity: [],
      avatarUrl: row.avatar_url ?? undefined,
    }))
  }

  function projectRows(userId, { organizationId, divisionId, projectId, organizationSlug, projectSlug } = {}) {
    const clauses = ["EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = o.id AND om.user_id = ?)"]
    const params = [userId]
    if (organizationId) { clauses.push("o.id = ?"); params.push(organizationId) }
    if (divisionId) { clauses.push("d.id = ?"); params.push(divisionId) }
    if (projectId) { clauses.push("p.id = ?"); params.push(projectId) }
    if (organizationSlug) { clauses.push("o.slug = ?"); params.push(organizationSlug) }
    if (projectSlug) { clauses.push("p.slug = ?"); params.push(projectSlug) }
    return database.prepare(`
      SELECT p.id AS project_id, p.name AS project_name, p.slug AS project_slug, p.organization_id,
        p.organization_name, o.slug AS organization_slug, p.division_id, p.division_name,
        p.start_date, p.end_date, p.description,
        (SELECT count(*) FROM tasks t WHERE t.project_id = p.id) AS task_count,
        (SELECT count(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') AS completed_count
      FROM projects p JOIN organizations o ON o.id = p.organization_id JOIN divisions d ON d.id = p.division_id
      WHERE ${clauses.join(" AND ")} ORDER BY p.rowid
    `).all(...params).map((row) => toProject(row, membersForOrganization(row.organization_id)))
  }

  function toOrganization(row, userId, projects) {
    const divisions = database.prepare("SELECT * FROM divisions WHERE organization_id = ? ORDER BY created_at, rowid").all(row.id).map((division) => ({
      id: division.id,
      organizationId: row.id,
      name: division.name,
      projects: projects.filter((project) => project.divisionId === division.id).map(toProjectRef),
    }))
    const organizationProjects = projects.filter((project) => project.organizationId === row.id)
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      imageUrl: row.image_data_url ?? undefined,
      preferences: parsePreferences(row.preferences_json),
      createdAt: row.created_at,
      currentUserRole: getMembership(row.id, userId)?.role ?? "custom",
      currentUserPermissions: normalizePermissions(parsePermissions(getMembership(row.id, userId)?.permissions)),
      members: membersForOrganization(row.id),
      divisions,
      projects: organizationProjects.map(toProjectRef),
      taskCount: organizationProjects.reduce((sum, project) => sum + project.taskCount, 0),
    }
  }

  function updateOwnerColumn(organizationId, userId) {
    database.prepare("UPDATE organizations SET owner_user_id = ? WHERE id = ?").run(userId, organizationId)
  }

  return {
    permissionKeys: organizationPermissionKeys,
    hasPermission: can,
    hasAccess(userId, organizationId) { return Boolean(getMembership(organizationId, userId)) },
    canAccessProject(userId, projectId) {
      return Boolean(database.prepare(`SELECT 1 FROM projects p JOIN organization_members m ON m.organization_id = p.organization_id WHERE p.id = ? AND m.user_id = ?`).get(projectId, userId))
    },
    listOrganizations(userId) {
      const organizations = database.prepare(`SELECT o.* FROM organizations o JOIN organization_members m ON m.organization_id = o.id WHERE m.user_id = ? ORDER BY o.created_at, o.rowid`).all(userId)
      const projects = projectRows(userId)
      return organizations.map((organization) => toOrganization(organization, userId, projects))
    },
    getOrganization(organizationId, userId) {
      const row = database.prepare(`SELECT o.* FROM organizations o JOIN organization_members m ON m.organization_id = o.id WHERE o.id = ? AND m.user_id = ?`).get(organizationId, userId)
      if (!row) return undefined
      return toOrganization(row, userId, projectRows(userId, { organizationId }))
    },
    getOrganizationBySlug(slug, userId) {
      const row = database.prepare(`SELECT o.* FROM organizations o JOIN organization_members m ON m.organization_id = o.id WHERE o.slug = ? AND m.user_id = ?`).get(slug, userId)
      if (!row) return undefined
      return toOrganization(row, userId, projectRows(userId, { organizationId: row.id }))
    },
    listMembers(organizationId, userId) {
      if (!this.hasAccess(userId, organizationId)) return undefined
      return membersForOrganization(organizationId)
    },
    createOrganization(userId, name) {
      const id = randomUUID(), createdAt = new Date().toISOString()
      let slug = slugify(name, id)
      if (database.prepare("SELECT 1 FROM organizations WHERE slug = ?").get(slug)) slug = `${slug}-${id.slice(0, 8)}`
      database.exec("BEGIN IMMEDIATE")
      try {
        database.prepare("INSERT INTO organizations (id, name, slug, owner_user_id, created_at) VALUES (?, ?, ?, ?, ?)").run(id, name, slug, userId, createdAt)
        database.prepare("INSERT INTO organization_members (id, organization_id, user_id, role, permissions, created_at) VALUES (?, ?, ?, 'owner', '{}', ?)").run(randomUUID(), id, userId, createdAt)
        database.exec("COMMIT")
      } catch (error) { database.exec("ROLLBACK"); throw error }
      return { id, name, slug, description: "", createdAt, imageUrl: undefined }
    },
    updateSettings(userId, organizationId, input) {
      if (!can(userId, organizationId, "editOrganization")) return undefined
      const current = getOrganizationRow(organizationId)
      if (!current) return undefined
      const nextSlug = input.slug === undefined ? current.slug : input.slug
      const nextName = input.name === undefined ? current.name : input.name
      const nextDescription = input.description === undefined ? current.description : input.description
      const nextImage = input.imageUrl === undefined ? current.image_data_url : input.imageUrl
      const nextPreferences = input.preferences === undefined ? current.preferences_json : JSON.stringify(input.preferences)
      const conflict = database.prepare("SELECT id FROM organizations WHERE slug = ? AND id <> ?").get(nextSlug, organizationId)
      if (conflict) return { conflict: true }
      database.prepare("UPDATE organizations SET name = ?, slug = ?, description = ?, image_data_url = ?, preferences_json = ? WHERE id = ?")
        .run(nextName, nextSlug, nextDescription, nextImage, nextPreferences, organizationId)
      database.prepare("UPDATE projects SET organization_name = ? WHERE organization_id = ?").run(nextName, organizationId)
      return { id: organizationId, name: nextName, slug: nextSlug, description: nextDescription, imageUrl: nextImage ?? undefined, preferences: parsePreferences(nextPreferences) }
    },
    inviteMember(actorId, organizationId, email) {
      if (!can(actorId, organizationId, "inviteMembers")) return { forbidden: true }
      const user = database.prepare("SELECT id, name, email, avatar_url FROM users WHERE email = ? COLLATE NOCASE").get(email)
      if (!user) return { userNotFound: true }
      if (getMembership(organizationId, user.id)) return { conflict: true }
      const id = randomUUID(), createdAt = new Date().toISOString()
      database.prepare("INSERT INTO organization_members (id, organization_id, user_id, role, permissions, created_at) VALUES (?, ?, ?, 'custom', '{}', ?)").run(id, organizationId, user.id, createdAt)
      return { id: user.id, name: user.name, email: user.email, role: "custom", permissions: normalizePermissions(), activity: [], avatarUrl: user.avatar_url ?? undefined }
    },
    updateMember(actorId, organizationId, userId, role, permissions) {
      if (!can(actorId, organizationId, "manageAccess")) return { forbidden: true }
      const target = getMembership(organizationId, userId)
      if (!target) return undefined
      role ??= target.role
      if (target.role === "owner" && role !== "owner") {
        if (getMembership(organizationId, actorId)?.role !== "owner") return { forbidden: true }
        const successor = actorId === userId
          ? membersForOrganization(organizationId).find((member) => member.id !== userId && member.role === "admin")
            ?? membersForOrganization(organizationId).find((member) => member.id !== userId)
          : membersForOrganization(organizationId).find((member) => member.id === actorId)
        if (!successor) return { conflict: true }
        database.exec("BEGIN IMMEDIATE")
        try {
          database.prepare("UPDATE organization_members SET role = ?, permissions = ? WHERE organization_id = ? AND user_id = ?")
            .run(role, role === "custom" ? JSON.stringify(normalizePermissions(permissions)) : "{}", organizationId, userId)
          database.prepare("UPDATE organization_members SET role = 'owner', permissions = '{}' WHERE organization_id = ? AND user_id = ?").run(organizationId, successor.id)
          updateOwnerColumn(organizationId, successor.id)
          database.exec("COMMIT")
        } catch (error) { database.exec("ROLLBACK"); throw error }
        return { transferred: true }
      }
      if (role === "owner") {
        if (getMembership(organizationId, actorId)?.role !== "owner") return { forbidden: true }
        database.exec("BEGIN IMMEDIATE")
        try {
          database.prepare("UPDATE organization_members SET role = 'admin', permissions = '{}' WHERE organization_id = ? AND role = 'owner'").run(organizationId)
          database.prepare("UPDATE organization_members SET role = 'owner', permissions = '{}' WHERE organization_id = ? AND user_id = ?").run(organizationId, userId)
          updateOwnerColumn(organizationId, userId)
          database.exec("COMMIT")
        } catch (error) { database.exec("ROLLBACK"); throw error }
        return { transferred: true }
      }
      const cleanPermissions = role === "custom" ? normalizePermissions(permissions) : {}
      database.prepare("UPDATE organization_members SET role = ?, permissions = ? WHERE organization_id = ? AND user_id = ?")
        .run(role, JSON.stringify(cleanPermissions), organizationId, userId)
      return { updated: true }
    },
    removeMember(actorId, organizationId, userId) {
      if (!can(actorId, organizationId, "removeMembers")) return { forbidden: true }
      const target = getMembership(organizationId, userId)
      if (!target || target.role === "owner") return undefined
      database.prepare("DELETE FROM organization_members WHERE organization_id = ? AND user_id = ?").run(organizationId, userId)
      return { removed: true }
    },
    listProjects(userId) { return projectRows(userId) },
    getProject(id, userId) { return projectRows(userId, { projectId: id })[0] },
    getProjectBySlugs(organizationSlug, projectSlug, userId) { return projectRows(userId, { organizationSlug, projectSlug })[0] },
    createDivision(userId, organizationId, name) {
      if (!can(userId, organizationId, "createDivision")) return undefined
      const id = randomUUID(), createdAt = new Date().toISOString()
      database.prepare("INSERT INTO divisions (id, organization_id, name, created_at) VALUES (?, ?, ?, ?)").run(id, organizationId, name, createdAt)
      return { id, organizationId, name, createdAt }
    },
    createProject(userId, divisionId, name) {
      const division = database.prepare(`SELECT d.*, o.name AS organization_name, o.slug AS organization_slug FROM divisions d JOIN organizations o ON o.id = d.organization_id WHERE d.id = ?`).get(divisionId)
      if (!division || !can(userId, division.organization_id, "createProject")) return undefined
      const id = randomUUID()
      let slug = slugify(name, id, "project")
      if (database.prepare("SELECT 1 FROM projects WHERE organization_id = ? AND slug = ?").get(division.organization_id, slug)) slug = `${slug}-${id.slice(0, 8)}`
      database.prepare(`INSERT INTO projects (id, name, slug, organization_id, organization_name, division_id, division_name, start_date, end_date, description) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)`)
        .run(id, name, slug, division.organization_id, division.organization_name, divisionId, division.name)
      return this.getProject(id, userId)
    },
    moveProject(userId, projectId, divisionId) {
      const project = database.prepare("SELECT p.id, p.organization_id, p.division_id FROM projects p WHERE p.id = ?").get(projectId)
      const division = database.prepare("SELECT * FROM divisions WHERE id = ?").get(divisionId)
      if (!project || !division || !can(userId, project.organization_id, "editProject") || !can(userId, division.organization_id, "editProject")) return undefined
      database.prepare("UPDATE projects SET organization_id = ?, organization_name = (SELECT name FROM organizations WHERE id = ?), division_id = ?, division_name = ? WHERE id = ?")
        .run(division.organization_id, division.organization_id, divisionId, division.name, projectId)
      return this.getProject(projectId, userId)
    },
    moveDivision(userId, sourceOrganizationId, divisionId, targetOrganizationId) {
      if (!can(userId, sourceOrganizationId, "editDivision") || !can(userId, targetOrganizationId, "editDivision")) return undefined
      const division = database.prepare("SELECT * FROM divisions WHERE id = ? AND organization_id = ?").get(divisionId, sourceOrganizationId)
      const target = getOrganizationRow(targetOrganizationId)
      if (!division || !target) return undefined
      if (database.prepare("SELECT id FROM divisions WHERE organization_id = ? AND name = ? AND id <> ?").get(targetOrganizationId, division.name, divisionId)) return { conflict: true }
      database.exec("BEGIN IMMEDIATE")
      try {
        database.prepare("UPDATE divisions SET organization_id = ? WHERE id = ?").run(targetOrganizationId, divisionId)
        database.prepare("UPDATE projects SET organization_id = ?, organization_name = ? WHERE division_id = ?").run(targetOrganizationId, target.name, divisionId)
        database.exec("COMMIT")
      } catch (error) { database.exec("ROLLBACK"); throw error }
      return { id: divisionId, organizationId: targetOrganizationId, name: division.name }
    },
  }
}

function toProjectRef(project) {
  return { id: project.id, name: project.name, slug: project.slug, organizationSlug: project.organizationSlug, memberIds: project.memberIds, progress: project.taskCount ? Math.round((project.completedCount / project.taskCount) * 100) : 0 }
}
