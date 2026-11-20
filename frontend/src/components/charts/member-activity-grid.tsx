import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export const MEMBER_ACTIVITY_LEVEL_CLASSES = ["bg-[#ededed]", "bg-[#dda1fd]", "bg-[#b262df]", "bg-[#8e38c0]", "bg-[#7a24ad]"]

export type MemberActivityRow = {
  id: string
  name: string
  avatarUrl?: string
  /** تعداد رخدادهای ثبت‌شدهٔ هر روز، هم‌ترتیب با `dateLabels`. */
  activity: number[]
}

export function MemberActivityGrid({ members, dateLabels, direction }: { members: MemberActivityRow[]; dateLabels: string[]; direction: "rtl" | "ltr" }) {
  const labelIndices = [0, 4, 8, 12, 16, dateLabels.length - 1].filter((value, index, all) => value >= 0 && value < dateLabels.length && all.indexOf(value) === index)
  return <div className="overflow-x-auto" dir={direction}>
    <div className="flex min-w-[574px] flex-col gap-4">
      <div className="flex items-center gap-[18px]">
        <div className="w-40 shrink-0" />
        <div className="flex flex-1 items-center justify-between px-1 text-xs font-semibold text-text3">{labelIndices.map(index => <span key={index} className="whitespace-nowrap">{dateLabels[index]}</span>)}</div>
      </div>
      {members.map(member => <div key={member.id} className="flex items-center gap-[18px]">
        <div className="flex w-40 shrink-0 items-center gap-2">
          <Avatar size="sm" className="rounded-lg after:rounded-lg">{member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} className="rounded-lg" />}<AvatarFallback className="rounded-lg">{member.name.slice(0, 1)}</AvatarFallback></Avatar>
          <span className="truncate text-sm text-foreground">{member.name}</span>
        </div>
        <div className="flex min-w-0 flex-1 gap-1">{member.activity.map((count, index) => <span key={index} title={`${dateLabels[index]}: ${count}`} className={`h-4 min-w-0 flex-1 rounded ${MEMBER_ACTIVITY_LEVEL_CLASSES[Math.min(Math.max(count, 0), 4)]}`} />)}</div>
      </div>)}
    </div>
  </div>
}
