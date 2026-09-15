/**
 * جای‌گزین لوگوی سازمان (بدون عکس واقعی) — مربعی هم‌راستا با اواتارهای دایره‌ای اعضا.
 * مصرف‌کننده‌ها: `features/organizations/OrganizationOverview` (۶۰px) و
 * `features/home/WorkspaceList` (۳۶px، کنار هر ردیف سازمان).
 */
export function OrgLogo({ name, size = 60 }: { name: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-lg border border-border bg-bg2 font-medium text-text2"
    >
      <span style={{ fontSize: Math.max(12, size / 4) }}>{name.slice(0, 1)}</span>
    </div>
  )
}
