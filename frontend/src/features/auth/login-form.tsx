"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useT } from "@/components/providers/locale-provider"
import { login } from "@/lib/api/auth"
import { AuthField } from "./auth-field"

/**
 * هنوز Auth واقعی وجود ندارد (رجوع به `src/lib/api/auth.ts`): هر ایمیل/شماره و رمزی که
 * پر شود پذیرفته می‌شود و کاربر مستقیم به `/home` می‌رود.
 */
export function LoginForm() {
  const t = useT()
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = identifier.trim().length > 0 && password.length > 0 && !submitting

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await login({ identifier: identifier.trim(), password })
      router.replace("/inbox")
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("auth.loginError"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col items-start gap-4">
      <AuthField
        label={t("auth.emailLabel")}
        placeholder={t("auth.fieldPlaceholder")}
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        autoComplete="username"
      />
      <AuthField
        label={t("auth.passwordLabel")}
        placeholder={t("auth.fieldPlaceholder")}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />
      {error && <p role="alert" className="w-full text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        disabled={!canSubmit}
        className="h-auto w-full justify-center rounded-[10px] bg-[var(--auth-brand)] py-2.5 text-[color:var(--auth-text-on-brand)] hover:bg-[var(--auth-brand)]/90 focus-visible:border-[var(--auth-brand)] focus-visible:ring-[var(--auth-brand)]/50"
      >
        {t("auth.loginSubmit")}
      </Button>
    </form>
  )
}
