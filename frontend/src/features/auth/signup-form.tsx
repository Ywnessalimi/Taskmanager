"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useT } from "@/components/providers/locale-provider"
import { signup } from "@/lib/api/auth"
import { AuthField } from "./auth-field"

/**
 * هنوز Auth واقعی وجود ندارد (رجوع به `src/lib/api/auth.ts`): همه‌ی فیلدها فقط باید پر
 * باشند (بدون بررسی فرمت ایمیل/شماره یا تطابق تکرار رمز) و کاربر مستقیم به `/home` می‌رود.
 */
export function SignupForm() {
  const t = useT()
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const canSubmit =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    !submitting

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    await signup({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), password })
    router.push("/home")
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col items-start gap-4">
      <AuthField
        label={t("auth.fullNameLabel")}
        placeholder={t("auth.fieldPlaceholder")}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        autoComplete="name"
      />
      <AuthField
        label={t("auth.emailLabel")}
        placeholder={t("auth.fieldPlaceholder")}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />
      <AuthField
        label={t("auth.phoneLabel")}
        placeholder={t("auth.fieldPlaceholder")}
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
      />
      <AuthField
        label={t("auth.passwordLabel")}
        placeholder={t("auth.fieldPlaceholder")}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
      />
      <AuthField
        label={t("auth.confirmPasswordLabel")}
        placeholder={t("auth.fieldPlaceholder")}
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
      />
      <Button
        type="submit"
        disabled={!canSubmit}
        className="h-auto w-full justify-center rounded-[10px] bg-[var(--auth-brand)] py-2.5 text-[color:var(--auth-text-on-brand)] hover:bg-[var(--auth-brand)]/90 focus-visible:border-[var(--auth-brand)] focus-visible:ring-[var(--auth-brand)]/50"
      >
        {t("auth.signupSubmit")}
      </Button>
    </form>
  )
}
