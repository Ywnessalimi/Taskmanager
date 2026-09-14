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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RemixIcon } from "@/components/ui/remix-icon"
import { Switch } from "@/components/ui/switch"
import { SectionTitle } from "@/components/layout/section"
import { useLocale } from "@/components/providers/locale-provider"
import { useTheme } from "@/components/providers/theme-provider"
import type { Locale, TranslationKey } from "@/lib/i18n/dictionary"
import type { Theme } from "@/lib/theme"
import { THEMES } from "@/lib/theme"
import type { CurrentUser, NotificationPreferences } from "@/lib/api/types"
import { ProfileDialog } from "./profile-dialog"
import { ROW_BASE, SettingsGroup, SettingsLinkRow, SettingsToggleRow } from "./settings-row"

const NOTIFICATION_ROWS: {
  key: keyof NotificationPreferences
  icon: string
  labelKey: TranslationKey
  descriptionKey: TranslationKey
}[] = [
  {
    key: "taskAssigned",
    icon: "user-line",
    labelKey: "account.notifTaskAssigned",
    descriptionKey: "account.notifTaskAssignedDesc",
  },
  {
    key: "taskComments",
    icon: "notification-line",
    labelKey: "account.notifComments",
    descriptionKey: "account.notifCommentsDesc",
  },
  {
    key: "weeklyDigest",
    icon: "file-list-line",
    labelKey: "account.notifWeeklyDigest",
    descriptionKey: "account.notifWeeklyDigestDesc",
  },
]

const THEME_LABEL_KEY: Record<Theme, TranslationKey> = {
  light: "account.appearanceLight",
  dark: "account.appearanceDark",
  system: "account.appearanceSystem",
}

/**
 * محتوای تب «حساب کاربری»: پروفایل، تنظیمات حساب (شامل انتخابگرهای زبان و ظاهر که واقعاً
 * کار می‌کنند)، تنظیمات اعلان و خروج. تغییرهای پروفایل/اعلان فقط در state همین کامپوننت‌اند
 * (بدون API واقعی)؛ زبان و ظاهر اما سراسری‌اند (`LocaleProvider`/`ThemeProvider`) — رجوع به
 * README.md همین پوشه.
 */
export function AccountSettings({ user: initialUser }: { user: CurrentUser }) {
  const [user, setUser] = useState(initialUser)
  const { locale, setLocale, t } = useLocale()

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
        <SectionTitle>{t("account.sectionAccount")}</SectionTitle>
        <SettingsGroup>
          <SettingsLinkRow icon="mail-line" label={t("account.changeEmail")} value={user.email} />
          <SettingsLinkRow icon="lock-password-line" label={t("account.changePassword")} />
          <LanguagePickerRow locale={locale} onChange={setLocale} />
          <AppearancePickerRow />
        </SettingsGroup>
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>{t("account.sectionNotifications")}</SectionTitle>
        <SettingsGroup>
          {NOTIFICATION_ROWS.map((row) => (
            <SettingsToggleRow
              key={row.key}
              icon={row.icon}
              label={t(row.labelKey)}
              description={t(row.descriptionKey)}
              control={
                <Switch
                  checked={user.notifications[row.key]}
                  onCheckedChange={() => toggleNotification(row.key)}
                  aria-label={t(row.labelKey)}
                />
              }
            />
          ))}
        </SettingsGroup>
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>{t("account.sectionAbout")}</SectionTitle>
        <SettingsGroup>
          <SettingsLinkRow icon="question-line" label={t("account.help")} />
          <SettingsLinkRow icon="shield-check-line" label={t("account.privacy")} />
          <SettingsLinkRow icon="information-line" label={t("account.version")} value="۰.۱.۰" />
        </SettingsGroup>
      </section>

      <LogoutDialog />
    </div>
  )
}

/** ردیف «زبان»: منوی کشویی با دو گزینه‌ی فارسی/English، مقدار جاری کنار برچسب نشان داده می‌شود. */
function LanguagePickerRow({ locale, onChange }: { locale: Locale; onChange: (locale: Locale) => void }) {
  const { t } = useLocale()
  const currentLabel = locale === "fa" ? t("account.languageFa") : t("account.languageEn")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`${ROW_BASE} enabled:hover:bg-bg2`}>
        <RemixIcon name="global-line" className="text-base text-icon2" />
        <span className="flex-1 text-sm text-foreground">{t("account.language")}</span>
        <span className="text-xs text-text2">{currentLabel}</span>
        <RemixIcon name="arrow-left-s-line" className="text-base text-icon2" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={locale} onValueChange={(value) => onChange(value as Locale)}>
          <DropdownMenuRadioItem value="fa" closeOnClick>
            {t("account.languageFa")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en" closeOnClick>
            {t("account.languageEn")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** ردیف «ظاهر»: منوی کشویی با سه گزینه‌ی روشن/تیره/هماهنگ با سیستم. */
function AppearancePickerRow() {
  const { t } = useLocale()
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`${ROW_BASE} enabled:hover:bg-bg2`}>
        <RemixIcon name="moon-line" className="text-base text-icon2" />
        <span className="flex-1 text-sm text-foreground">{t("account.appearance")}</span>
        <span className="text-xs text-text2">{t(THEME_LABEL_KEY[theme])}</span>
        <RemixIcon name="arrow-left-s-line" className="text-base text-icon2" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
          {THEMES.map((value) => (
            <DropdownMenuRadioItem key={value} value={value} closeOnClick>
              {t(THEME_LABEL_KEY[value])}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** خروج یک اکشن برگشت‌ناپذیر است، پس قبل از اجرا تایید گرفته می‌شود. */
function LogoutDialog() {
  const { t } = useLocale()

  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="ghost" className="w-fit text-destructive" />}
      >
        <RemixIcon name="logout-box-r-line" className="text-base" />
        {t("account.logout")}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("account.logout")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-text2">{t("account.logoutConfirmBody")}</p>
        <div className="flex justify-start gap-2">
          <DialogClose render={<Button variant="destructive" />}>{t("account.logoutConfirm")}</DialogClose>
          <DialogClose render={<Button variant="ghost" />}>{t("account.cancel")}</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
