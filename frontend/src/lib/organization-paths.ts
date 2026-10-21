type SlugProject = { id: string; slug?: string; organizationSlug?: string }
type SlugOrganization = { id: string; slug?: string }

export function organizationPath(organization: SlugOrganization) {
  return organization.slug ? `/o/${encodeURIComponent(organization.slug)}` : `/home/organizations/${encodeURIComponent(organization.id)}`
}

export function projectPath(project: SlugProject) {
  return project.slug && project.organizationSlug
    ? `/o/${encodeURIComponent(project.organizationSlug)}/${encodeURIComponent(project.slug)}`
    : `/home/projects/${encodeURIComponent(project.id)}`
}
