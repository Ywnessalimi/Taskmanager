import { PageHeader } from "@/components/navigation/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectOverview } from "@/features/projects/project-overview"
import { ProjectTaskList } from "@/features/projects/project-task-list"
import { getProject } from "@/lib/api/projects"

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await getProject(id)

  if (!project) {
    return (
      <div className="p-4">
        <p className="text-sm text-text2">پروژه‌ای با این شناسه پیدا نشد.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title={project.name}
        subtitle={project.organizationName}
        menu={[
          [
            { label: "افزودن تسک", icon: "task-line" },
            { label: "افزودن مایل‌استون", icon: "flag-line" },
            { label: "افزودن بخش", icon: "layout-column-line" },
          ],
          [{ label: "تنظیمات پروژه", icon: "settings-3-line" }],
          [{ label: "حذف پروژه", icon: "delete-bin-line", destructive: true }],
        ]}
      />

      <Tabs defaultValue="list">
        <TabsList variant="line" className="w-fit">
          <TabsTrigger value="list">لیست</TabsTrigger>
          <TabsTrigger value="overview">نمای‌کلی</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <ProjectTaskList tasks={project.tasks} />
        </TabsContent>
        <TabsContent value="overview">
          <ProjectOverview project={project} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
