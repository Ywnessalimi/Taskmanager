import type { Metadata } from "next"
import { AuthScreen } from "@/features/auth/auth-screen"
import { LoginForm } from "@/features/auth/login-form"
import { getLocale } from "@/lib/i18n/server"

export const metadata: Metadata = {
  title: "ورود | Quire",
}

export default async function LoginPage() {
  const locale = await getLocale()

  return (
    <AuthScreen locale={locale} active="login" heroImage="/images/auth/login-bg.png">
      <LoginForm />
    </AuthScreen>
  )
}
