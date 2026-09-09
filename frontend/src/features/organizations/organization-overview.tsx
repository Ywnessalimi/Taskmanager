import Link from "next/link"
import { ActivityHeatmap } from "@/components/charts/activity-heatmap"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Organization } from "@/lib/api/types"

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-medium text-foreground">{children}</h2>
}

export function OrganizationOverview({ organization }: { organization: Organization }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <SectionTitle>اعضا ({organization.members.length})</SectionTitle>
        <div className="flex flex-col">
          {organization.members.map((member) => (
            <div key={member.id} className="flex items-center gap-2.5 border-b border-border py-2 last:border-b-0">
              <Avatar size="sm">
                <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground">{member.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SectionTitle>پروژه‌های فعال</SectionTitle>
        <div className="flex flex-col">
          {organization.projects.map((project) => (
            <Link
              key={project.id}
              href={`/home/projects/${project.id}`}
              className="border-b border-border py-2 text-sm text-foreground last:border-b-0 hover:text-brand"
            >
              {project.name}
            </Link>
          ))}
          {organization.projects.length === 0 && (
            <p className="py-2 text-sm text-text2">پروژه‌ای وجود ندارد.</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SectionTitle>فعالیت اعضا</SectionTitle>
        <ActivityHeatmap data={organization.activity} />
      </div>
    </div>
  )
}
