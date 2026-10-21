"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useT } from "@/components/providers/locale-provider"
import type { TranslationKey } from "@/lib/i18n/dictionary"
import type { Member } from "@/lib/api/types"

const ROLE_LABEL_KEY: Record<Member["role"], TranslationKey> = {
  owner: "members.roleAdmin",
  admin: "members.roleAdmin",
  member: "members.roleMember",
  custom: "members.roleMember",
}

const STACK_LIMIT = 5

/**
 * تریگر این دیالوگ همان اواتارهای دایره‌ای روی‌هم‌افتاده‌ی اعضاست.
 * این نصب تک‌کاربره است؛ فهرست هویت‌های واقعی فقط خواندنی است.
 */
export function MembersDialog({ members: initialMembers }: { members: Member[] }) {
  const t = useT()
  const members = initialMembers
  const overflowCount = Math.max(0, members.length - STACK_LIMIT)

  return (
    <Dialog>
      <DialogTrigger
        aria-label={`${t("members.manage")} ${members.length} ${t("members.membersUnit")}`}
        className="flex w-fit items-center"
      >
        {members.slice(0, STACK_LIMIT).map((member) => (
          <Avatar key={member.id} size="sm" className="-ms-2 ring-2 ring-background first:ms-0">
            {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
            <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
        ))}
        {overflowCount > 0 && (
          <span className="-ms-2 flex size-6 items-center justify-center rounded-full bg-bg2 text-[10px] text-text2 ring-2 ring-background">
            +{overflowCount}
          </span>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("members.title")} ({members.length})
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-2.5 border-b border-border py-2 last:border-b-0">
              <Avatar size="sm">
                {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{member.name}</p>
                <p className="text-xs text-text2">{t(ROLE_LABEL_KEY[member.role])}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
