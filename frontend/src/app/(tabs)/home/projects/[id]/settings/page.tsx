import { ProjectSettingsPage } from "@/features/projects/project-settings-page"
import { t } from "@/lib/i18n/dictionary"
import { getLocale } from "@/lib/i18n/server"
import { getProject } from "@/lib/api/projects"

export default async function ProjectSettingsRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [project, locale] = await Promise.all([getProject(id), getLocale()])

  if (!project) {
    return (
      <div className="p-4">
        <p className="text-sm text-text2">{t(locale, "project.notFound")}</p>
      </div>
    )
  }

  return <ProjectSettingsPage project={project} />
}
