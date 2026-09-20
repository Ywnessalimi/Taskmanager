"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { useT } from "@/components/providers/locale-provider"
import type { TaskFormMemberOption } from "@/lib/api/types"

/**
 * مودال انتخاب مسئول(های) تسک از میان اعضای پروژه — چندتایی (چک‌باکس روی هر ردیف).
 * مثل `FollowersDialog` خودش `Dialog` را می‌سازد و یک `trigger` از‌پیش پوشیده‌شده می‌گیرد؛
 * فقط عرضش ۴۰٪ از حالت پیش‌فرض `fullscreen` بیشتر است تا اسم‌های بلند فضای بیشتری برای
 * تک‌خطی‌ماندن داشته باشند (رجوع به `line-clamp-3` روی اسم — بزرگ‌تر از عرض مودال به
 * سه‌خط می‌رود، نه دوخط ناقص).
 */
export function AssigneePickerDialog({
  members,
  assigneeNames,
  onChange,
  trigger,
}: {
  members: TaskFormMemberOption[]
  assigneeNames: string[]
  onChange: (value: string[]) => void
  trigger: React.ReactNode
}) {
  const t = useT()

  function toggle(name: string) {
    if (assigneeNames.includes(name)) {
      onChange(assigneeNames.filter((n) => n !== name))
    } else {
      onChange([...assigneeNames, name])
    }
  }

  return (
    <Dialog>
      {trigger}
      <DialogContent
        variant="fullscreen"
        className="sm:max-w-[39.2rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle>{t("taskForm.assign")}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {members.length === 0 ? (
            <p className="py-8 text-center text-sm text-text2">{t("taskDetail.noFollowerCandidates")}</p>
          ) : (
            members.map((member) => {
              const checked = assigneeNames.includes(member.name)
              return (
                <button
                  key={member.name}
                  type="button"
                  onClick={() => toggle(member.name)}
                  className="flex w-full items-center gap-2 rounded-md p-2 text-start text-sm text-foreground hover:bg-bg2"
                >
                  <Checkbox checked={checked} onCheckedChange={() => toggle(member.name)} />
                  <Avatar size="sm">
                    {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                    <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 line-clamp-3 break-words">{member.name}</span>
                </button>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
