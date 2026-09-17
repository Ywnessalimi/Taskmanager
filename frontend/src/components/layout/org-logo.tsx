/**
 * جای‌گزین لوگوی سازمان (بدون عکس واقعی) — مربعی هم‌راستا با اواتارهای دایره‌ای اعضا.
 * تنها مصرف‌کننده‌اش `features/organizations/OrganizationOverview` (۶۰px) است؛ از ردیف‌های
 * `WorkspaceList` طبق بازخورد کاربر حذف شد (آنجا فقط شورون + نام سازمان می‌ماند).
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
