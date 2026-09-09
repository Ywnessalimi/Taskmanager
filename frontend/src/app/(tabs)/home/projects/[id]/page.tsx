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
      <header className="flex flex-col">
        <h1 className="text-base font-medium text-foreground">{project.name}</h1>
        <p className="text-xs text-text2">{project.organizationName}</p>
      </header>

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
