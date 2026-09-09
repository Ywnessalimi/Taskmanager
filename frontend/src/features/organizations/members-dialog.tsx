"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RemixIcon } from "@/components/ui/remix-icon"
import { Switch } from "@/components/ui/switch"
import type { Member } from "@/lib/api/types"

const ROLE_LABEL: Record<Member["role"], string> = {
  admin: "ادمین",
  member: "عضو عادی",
}

const STACK_LIMIT = 5

/**
 * تریگر این دیالوگ همان اواتارهای دایره‌ای روی‌هم‌افتاده‌ی اعضاست.
 * افزودن/حذف/تغییر نقش عمداً فقط در state محلی همین کامپوننت اعمال می‌شود (بدون بک‌اند واقعی).
 */
export function MembersDialog({ members: initialMembers }: { members: Member[] }) {
  const [members, setMembers] = useState(initialMembers)
  const [adminOnlyInvite, setAdminOnlyInvite] = useState(false)
  const [draftName, setDraftName] = useState("")

  function addMember() {
    const name = draftName.trim()
    if (!name) return
    setMembers((prev) => [...prev, { id: `local-${Date.now()}`, name, role: "member", activity: [] }])
    setDraftName("")
  }

  function toggleRole(id: string) {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role: m.role === "admin" ? "member" : "admin" } : m))
    )
  }

  function removeMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  const overflowCount = members.length - STACK_LIMIT

  return (
    <Dialog>
      <DialogTrigger
        aria-label={`نمایش و مدیریت ${members.length} عضو`}
        className="flex w-fit items-center"
      >
        {members.slice(0, STACK_LIMIT).map((member) => (
          <Avatar key={member.id} size="sm" className="-ms-2 ring-2 ring-background first:ms-0">
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
          <DialogTitle>اعضا ({members.length})</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 rounded-md border border-border p-3">
          <span className="text-sm text-foreground">فقط ادمین‌ها می‌توانند عضو جدید اضافه کنند</span>
          <Switch checked={adminOnlyInvite} onCheckedChange={setAdminOnlyInvite} />
        </div>

        <div className="flex gap-2">
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMember()}
            placeholder="نام عضو جدید"
            className="min-w-0 flex-1 rounded-md border border-border bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-text3"
          />
          <Button variant="ghost" size="icon" aria-label="افزودن عضو" onClick={addMember}>
            <RemixIcon name="add-line" className="text-base" />
          </Button>
        </div>

        <div className="flex flex-col">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-2.5 border-b border-border py-2 last:border-b-0">
              <Avatar size="sm">
                <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{member.name}</p>
                <p className="text-xs text-text2">{ROLE_LABEL[member.role]}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={`گزینه‌های ${member.name}`}
                  className="flex size-7 shrink-0 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon"
                >
                  <RemixIcon name="more-line" className="text-base" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toggleRole(member.id)}>
                    <RemixIcon name="shield-user-line" className="text-base" />
                    {member.role === "admin" ? "تغییر به عضو عادی" : "تغییر به ادمین"}
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => removeMember(member.id)}>
                    <RemixIcon name="delete-bin-line" className="text-base" />
                    حذف از سازمان
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
