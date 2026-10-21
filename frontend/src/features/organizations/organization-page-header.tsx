"use client"

import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/navigation/page-header"
import { useT } from "@/components/providers/locale-provider"

export function OrganizationPageHeader({ id, name, taskCount }: { id: string; name: string; taskCount: number }) {
  const router = useRouter()
  const t = useT()
  return <PageHeader
    title={name}
    subtitle={`${taskCount} ${t("org.taskCountSuffix")}`}
    menu={[
      [{ label: t("org.settings"), icon: "settings-3-line", onClick: () => router.push(`/home/organizations/${id}/settings`) }],
      [{ label: t("org.delete"), icon: "delete-bin-line", destructive: true }],
    ]}
  />
}
