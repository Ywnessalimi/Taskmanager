"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import { Switch } from "@/components/ui/switch"
import { SectionTitle } from "@/components/layout/section"
import type { CurrentUser, NotificationPreferences } from "@/lib/api/types"
import { ProfileDialog } from "./profile-dialog"
import { SettingsGroup, SettingsLinkRow, SettingsToggleRow } from "./settings-row"

const NOTIFICATION_ROWS: {
  key: keyof NotificationPreferences
  icon: string
  label: string
  description: string
}[] = [
  {
    key: "taskAssigned",
    icon: "user-line",
    label: "تخصیص تسک",
    description: "وقتی تسکی به شما داده می‌شود",
  },
  {
    key: "taskComments",
    icon: "notification-line",
    label: "کامنت‌ها",
    description: "کامنت جدید روی تسک‌های شما",
  },
  {
    key: "weeklyDigest",
    icon: "file-list-line",
    label: "خلاصه‌ی هفتگی",
    description: "گزارش فعالیت هفته، هر شنبه",
  },
]

/**
 * محتوای تب «حساب کاربری»: پروفایل، تنظیمات حساب، تنظیمات اعلان و خروج.
 * همه‌ی تغییرها فقط در state همین کامپوننت‌اند (بدون API واقعی) — رجوع به README.md همین پوشه.
 */
export function AccountSettings({ user: initialUser }: { user: CurrentUser }) {
  const [user, setUser] = useState(initialUser)

  function toggleNotification(key: keyof NotificationPreferences) {
    setUser((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: !prev.notifications[key] },
    }))
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex items-start gap-3 rounded-md border border-border bg-background p-3">
        <Avatar size="lg">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
          <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium text-foreground">{user.name}</p>
          <p dir="ltr" className="truncate text-start text-xs text-text2">
            {user.email}
          </p>
          {user.bio && <p className="mt-1 text-xs text-text2">{user.bio}</p>}
        </div>
        <ProfileDialog user={user} onSave={(patch) => setUser((prev) => ({ ...prev, ...patch }))} />
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>حساب</SectionTitle>
        <SettingsGroup>
          <SettingsLinkRow icon="mail-line" label="تغییر ایمیل" value={user.email} />
          <SettingsLinkRow icon="lock-password-line" label="تغییر رمز عبور" />
          <SettingsLinkRow icon="global-line" label="زبان" value="فارسی" />
          <SettingsLinkRow icon="moon-line" label="ظاهر" value="هماهنگ با سیستم" />
        </SettingsGroup>
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>اعلان‌ها</SectionTitle>
        <SettingsGroup>
          {NOTIFICATION_ROWS.map((row) => (
            <SettingsToggleRow
              key={row.key}
              icon={row.icon}
              label={row.label}
              description={row.description}
              control={
                <Switch
                  checked={user.notifications[row.key]}
                  onCheckedChange={() => toggleNotification(row.key)}
                  aria-label={row.label}
                />
              }
            />
          ))}
        </SettingsGroup>
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>درباره</SectionTitle>
        <SettingsGroup>
          <SettingsLinkRow icon="question-line" label="راهنما و پشتیبانی" />
          <SettingsLinkRow icon="shield-check-line" label="حریم خصوصی" />
          <SettingsLinkRow icon="information-line" label="نسخه" value="۰.۱.۰" />
        </SettingsGroup>
      </section>

      <LogoutDialog />
    </div>
  )
}

/** خروج یک اکشن برگشت‌ناپذیر است، پس قبل از اجرا تایید گرفته می‌شود. */
function LogoutDialog() {
  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="ghost" className="w-fit text-destructive" />}
      >
        <RemixIcon name="logout-box-r-line" className="text-base" />
        خروج از حساب
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>خروج از حساب</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-text2">
          از حساب کاربری خود خارج می‌شوید. برای ورود دوباره به ایمیل و رمز عبور نیاز دارید.
        </p>
        <div className="flex justify-start gap-2">
          <DialogClose render={<Button variant="destructive" />}>خروج</DialogClose>
          <DialogClose render={<Button variant="ghost" />}>انصراف</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
