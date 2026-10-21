"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useLocale } from "@/components/providers/locale-provider"
import { getAuthSessions, revokeAuthSession } from "@/lib/api/auth"
import type { AuthSession } from "@/lib/api/types"
import type { TranslationKey } from "@/lib/i18n/dictionary"
import { ROW_BASE, SettingsGroup } from "./settings-row"

const DEVICE_LABELS: Record<AuthSession["deviceType"], TranslationKey> = {
  mobile: "account.sessionDeviceMobile",
  tablet: "account.sessionDeviceTablet",
  desktop: "account.sessionDeviceDesktop",
  unknown: "account.sessionDeviceUnknown",
}

const DEVICE_ICONS: Record<AuthSession["deviceType"], string> = {
  mobile: "smartphone-line",
  tablet: "tablet-line",
  desktop: "computer-line",
  unknown: "device-line",
}

function formatLastSeen(dateValue: string, locale: "fa" | "en") {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return dateValue

  const differenceSeconds = (date.getTime() - Date.now()) / 1000
  const relative = new Intl.RelativeTimeFormat(locale === "fa" ? "fa-IR" : "en-US", { numeric: "auto" })
  const absoluteSeconds = Math.abs(differenceSeconds)

  if (absoluteSeconds < 60) return relative.format(0, "second")
  if (absoluteSeconds < 60 * 60) return relative.format(Math.round(differenceSeconds / 60), "minute")
  if (absoluteSeconds < 24 * 60 * 60) return relative.format(Math.round(differenceSeconds / (60 * 60)), "hour")
  if (absoluteSeconds < 7 * 24 * 60 * 60) return relative.format(Math.round(differenceSeconds / (24 * 60 * 60)), "day")

  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function SessionsList() {
  const router = useRouter()
  const { locale, t } = useLocale()
  const [sessions, setSessions] = useState<AuthSession[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [actionFailed, setActionFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    getAuthSessions()
      .then((value) => { if (active) setSessions(value) })
      .catch(() => { if (active) setLoadFailed(true) })
    return () => { active = false }
  }, [reloadKey])

  async function revoke(session: AuthSession) {
    setRevokingId(session.id)
    setActionFailed(false)
    try {
      await revokeAuthSession(session.id)
      if (session.isCurrent) {
        router.replace("/login")
        router.refresh()
        return
      }
      setSessions((current) => current?.filter((item) => item.id !== session.id) ?? [])
    } catch {
      setActionFailed(true)
    } finally {
      setRevokingId(null)
    }
  }

  if (sessions === null && !loadFailed) {
    return <p role="status" className="px-3 py-3 text-sm text-text2">{t("account.sessionsLoading")}</p>
  }

  if (loadFailed) {
    return (
      <div className="flex items-center justify-between gap-3 px-3 py-3 text-sm" role="alert">
        <span className="text-destructive">{t("account.sessionsLoadError")}</span>
        <button type="button" className="rounded-sm px-2 py-1 text-foreground hover:bg-bg2" onClick={() => {
          setSessions(null)
          setLoadFailed(false)
          setReloadKey((key) => key + 1)
        }}>
          {t("account.sessionsRetry")}
        </button>
      </div>
    )
  }

  if (!sessions?.length) {
    return <p className="px-3 py-3 text-sm text-text2">{t("account.sessionsEmpty")}</p>
  }

  return (
    <div className="flex flex-col gap-2">
      <SettingsGroup>
        {sessions.map((session) => (
          <div key={session.id} className={`${ROW_BASE} min-h-16 gap-3`}>
            <RemixIcon name={DEVICE_ICONS[session.deviceType]} className="shrink-0 text-xl text-icon2" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-medium text-foreground">
                  {session.browser === "Other"
                    ? t("account.sessionBrowserOther")
                    : session.browser === "Unknown"
                      ? t("account.sessionBrowserUnknown")
                      : session.browser}
                </span>
                <span className="text-xs text-text2">{t(DEVICE_LABELS[session.deviceType])}</span>
                {session.isCurrent && (
                  <span className="rounded-sm bg-bg2 px-1.5 py-0.5 text-xs text-text2">
                    {t("account.sessionCurrent")}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-text2">
                {t("account.sessionLastSeen")}: {formatLastSeen(session.lastSeenAt, locale)}
              </p>
            </div>
            <button
              type="button"
              disabled={revokingId === session.id}
              onClick={() => void revoke(session)}
              className="shrink-0 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 disabled:cursor-wait disabled:opacity-60"
              aria-label={`${t("account.sessionRevoke")} ${session.browser}`}
            >
              {revokingId === session.id ? t("account.sessionRevoking") : t("account.sessionRevoke")}
            </button>
          </div>
        ))}
      </SettingsGroup>
      {actionFailed && <p role="alert" className="px-1 text-sm text-destructive">{t("account.sessionRevokeError")}</p>}
    </div>
  )
}
