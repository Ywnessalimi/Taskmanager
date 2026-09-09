import Link from "next/link"
import { ActivityBarRow } from "@/components/charts/activity-bar-row"
import { SectionBox, SectionTitle } from "@/components/layout/section"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MembersDialog } from "@/features/organizations/members-dialog"
import type { Organization } from "@/lib/api/types"

export function OrganizationOverview({ organization }: { organization: Organization }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <SectionTitle>اعضا</SectionTitle>
        <MembersDialog members={organization.members} />
      </div>

      <div className="flex flex-col gap-2">
        <SectionTitle>پروژه‌های فعال</SectionTitle>
        <SectionBox>
          <div className="flex flex-col">
            {organization.projects.map((project, index) => (
              <Link
                key={project.id}
                href={`/home/projects/${project.id}`}
                className={`py-2 text-sm text-foreground hover:text-brand ${
                  index > 0 ? "border-t border-border" : ""
                }`}
              >
                {project.name}
              </Link>
            ))}
            {organization.projects.length === 0 && (
              <p className="text-sm text-text2">پروژه‌ای وجود ندارد.</p>
            )}
          </div>
        </SectionBox>
      </div>

      <div className="flex flex-col gap-2">
        <SectionTitle>فعالیت اعضا</SectionTitle>
        <SectionBox>
          <div className="flex flex-col">
            {organization.members.map((member, index) => (
              <div
                key={member.id}
                className={`flex items-center gap-3 py-2.5 ${index > 0 ? "border-t border-border" : ""}`}
              >
                <Avatar size="sm" className="shrink-0">
                  <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <span className="w-20 shrink-0 truncate text-sm text-foreground">{member.name}</span>
                <div className="min-w-0 flex-1 overflow-x-auto">
                  <ActivityBarRow activity={member.activity} />
                </div>
              </div>
            ))}
          </div>
        </SectionBox>
      </div>
    </div>
  )
}
