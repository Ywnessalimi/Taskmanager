import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LEVEL_CLASSES } from "./activity-heatmap"

export type MemberActivityRow = {
  id: string
  name: string
  avatarUrl?: string
  /** سطح فعالیت روزانه (۰ تا ۴)، هم‌ترتیب با `dateLabels` */
  activity: number[]
}

/**
 * برخلاف `ActivityHeatmap` (ستون‌به‌ستون هفتگی، تک‌کاربره)، اینجا هر عضو یک *ردیف* افقی از
 * سلول‌های روزانه است با یک محور تاریخ مشترک بالای جدول — طبق طرح Figma «Member Activity».
 * مثل `LineTrendChart` همیشه LTR است (قدیم→جدید، از چپ به راست) صرف‌نظر از جهت صفحه، چون
 * محور زمان است نه متن.
 */
export function MemberActivityGrid({
  members,
  dateLabels,
  labelEvery = 3,
}: {
  members: MemberActivityRow[]
  dateLabels: string[]
  labelEvery?: number
}) {
  return (
    <div className="flex flex-col gap-2 overflow-x-auto">
      <div className="flex items-center gap-2">
        <div className="w-32 shrink-0" />
        <div dir="ltr" className="flex flex-1 gap-1">
          {dateLabels.map((label, i) => (
            <span key={i} className="flex-1 text-center text-[11px] whitespace-nowrap text-text3">
              {i % labelEvery === 0 ? label : ""}
            </span>
          ))}
        </div>
      </div>

      {members.map((member) => (
        <div key={member.id} className="flex items-center gap-2">
          <div className="flex w-32 shrink-0 items-center gap-2">
            <Avatar size="sm">
              {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
              <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-xs text-foreground">{member.name}</span>
          </div>
          <div dir="ltr" className="flex flex-1 gap-1">
            {member.activity.map((level, i) => (
              <span
                key={i}
                title={dateLabels[i]}
                className={`h-4 flex-1 rounded-sm ${LEVEL_CLASSES[Math.min(Math.max(level, 0), 4)]}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
