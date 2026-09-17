import type { Metadata } from "next"
import { AuthScreen } from "@/features/auth/auth-screen"
import { SignupForm } from "@/features/auth/signup-form"
import { getLocale } from "@/lib/i18n/server"

export const metadata: Metadata = {
  title: "ثبت‌نام | Quire",
}

export default async function SignupPage() {
  const locale = await getLocale()

  return (
    <AuthScreen locale={locale} active="signup" heroImage="/images/auth/signup-bg.png">
      <SignupForm />
    </AuthScreen>
  )
}
