import Link from "next/link"
import { RemixIcon } from "@/components/ui/remix-icon"
import { t } from "@/lib/i18n/dictionary"
import type { Locale } from "@/lib/i18n/dictionary"

/**
 * هدر خوش‌آمدگویی صفحه‌ی خانه — از طرح Figma «AlignUI — Home» گرفته شده، جایگزین
 * `AppHeader` عمومی فقط برای این صفحه (رجوع به `features/home/README.md`).
 */
export function HomeGreeting({
  locale,
  userName,
  inProgressCount,
}: {
  locale: Locale
  userName: string
  inProgressCount: number
}) {
  return (
    <div className="flex flex-col gap-5 px-4 pt-5">
      <div className="flex flex-col items-end gap-1">
        <p className="text-sm text-text2">{t(locale, "home.title")}</p>
        <p className="text-xl font-medium text-foreground">
          {t(locale, "home.welcome")} {userName}
        </p>
      </div>

      <Link
        href="/my-tasks"
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-bg2"
      >
        <span className="min-w-0 flex-1 text-foreground">
          <span className="font-medium text-success">
            {inProgressCount} {t(locale, "home.tasksWord")}
          </span>{" "}
          {t(locale, "home.tasksTodoRest")}
        </span>
        <RemixIcon name="arrow-left-line" className="shrink-0 text-base text-icon2" />
      </Link>
    </div>
  )
}
