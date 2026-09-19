"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"
import type { TaskFormMemberOption } from "@/lib/api/types"

/**
 * مودال تمام‌صفحه (موبایل) برای انتخاب دنبال‌کنندگان تسک از میان اعضای پروژه — چندتایی
 * (toggle با کلیک روی هر ردیف)؛ عضو انتخاب‌شده تیک `check-line` می‌گیرد. مثل `DatePickerDialog`
 * خودش `Dialog` را می‌سازد و فراخوان یک `trigger` از‌پیش با `DialogTrigger` پوشیده‌شده می‌دهد.
 */
export function FollowersDialog({
  members,
  followers,
  onChange,
  trigger,
}: {
  members: TaskFormMemberOption[]
  followers: string[]
  onChange: (value: string[]) => void
  trigger: React.ReactNode
}) {
  const t = useT()

  function toggle(name: string) {
    if (followers.includes(name)) {
      onChange(followers.filter((n) => n !== name))
    } else {
      onChange([...followers, name])
    }
  }

  return (
    <Dialog>
      {trigger}
      <DialogContent variant="fullscreen" onClick={(event) => event.stopPropagation()}>
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle>{t("taskDetail.followers")}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {members.length === 0 ? (
            <p className="py-8 text-center text-sm text-text2">{t("taskDetail.noFollowerCandidates")}</p>
          ) : (
            members.map((member) => {
              const checked = followers.includes(member.name)
              return (
                <button
                  key={member.name}
                  type="button"
                  onClick={() => toggle(member.name)}
                  className="flex w-full items-center gap-2 rounded-md p-2 text-start text-sm text-foreground hover:bg-bg2"
                >
                  <Avatar size="sm">
                    {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                    <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate">{member.name}</span>
                  {checked && <RemixIcon name="check-line" className="shrink-0 text-base text-brand" />}
                </button>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
